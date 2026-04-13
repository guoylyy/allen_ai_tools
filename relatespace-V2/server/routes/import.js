const express = require('express');
const router = express.Router();
const { getDb, uuidv4 } = require('../models/database');
const { createImportTemplate, parseImportFile, exportRelations } = require('../utils/excel');

// 获取导入模板
router.get('/template', (req, res) => {
  try {
    const workbook = createImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=relatespace_import_template.xlsx');

    workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 导出所有关系人
router.get('/export', (req, res) => {
  try {
    const db = getDb();
    const relations = db.prepare('SELECT * FROM relations ORDER BY createdAt DESC').all();

    // 解析tags字段
    const parsedRelations = relations.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]')
    }));

    const workbook = exportRelations(parsedRelations);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=relatespace_relations_export.xlsx');

    workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 预览导入数据（不保存）
router.post('/preview', (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: '请上传Excel文件' });
    }

    const buffer = req.files.file.data;
    parseImportFile(buffer).then(result => {
      res.json({
        success: true,
        data: {
          records: result.data,
          totalCount: result.totalCount,
          errorCount: result.errorCount,
          errors: result.errors
        }
      });
    }).catch(err => {
      res.status(500).json({ success: false, message: '解析Excel文件失败: ' + err.message });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 执行导入（保存数据）
router.post('/import', (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: '请上传Excel文件' });
    }

    const db = getDb();
    const buffer = req.files.file.data;

    parseImportFile(buffer).then(async result => {
      if (result.errors.length > 0 && result.data.length === 0) {
        return res.status(400).json({
          success: false,
          message: '导入失败，所有数据都有错误',
          errors: result.errors
        });
      }

      const imported = [];
      const skipped = [];
      const failed = [];

      for (const item of result.data) {
        try {
          // 检查是否已存在同名关系人
          const existing = db.prepare('SELECT * FROM relations WHERE name = ? AND company = ?')
            .get(item.name, item.company);

          if (existing) {
            skipped.push({
              name: item.name,
              company: item.company,
              reason: '同名关系人已存在'
            });
            continue;
          }

          // 创建新关系人
          const id = uuidv4();
          db.prepare(`
            INSERT INTO relations (id, name, position, company, phone, email, tags, importance, background, features, goals, lastInteraction)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            item.name,
            item.position,
            item.company,
            item.phone,
            item.email,
            JSON.stringify(item.tags || []),
            item.importance || 'normal',
            item.background,
            item.features,
            item.goals,
            item.lastInteraction || null
          );

          imported.push({
            id: id,
            name: item.name,
            company: item.company
          });
        } catch (err) {
          failed.push({
            name: item.name,
            company: item.company,
            reason: err.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          importedCount: imported.length,
          skippedCount: skipped.length,
          failedCount: failed.length,
          imported: imported,
          skipped: skipped,
          failed: failed,
          totalInFile: result.totalCount,
          errors: result.errors
        }
      });
    }).catch(err => {
      res.status(500).json({ success: false, message: '导入失败: ' + err.message });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
