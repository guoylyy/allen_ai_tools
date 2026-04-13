const express = require('express');
const router = express.Router();
const { getDb, uuidv4 } = require('../models/database');

// 获取所有学校（支持搜索）
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search } = req.query;

    let sql = 'SELECT * FROM schools';
    let params = [];

    if (search) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY name';

    const schools = db.prepare(sql).all(...params);
    res.json({ success: true, data: schools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 创建学校
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, type, location } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '学校名称不能为空' });
    }

    // 检查是否已存在
    const existing = db.prepare('SELECT * FROM schools WHERE name = ?').get(name);
    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO schools (id, name, type, location) VALUES (?, ?, ?, ?)'
    ).run(id, name, type || 'university', location || null);

    const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(id);
    res.json({ success: true, data: school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取关系人的教育经历
router.get('/relation/:relationId', (req, res) => {
  try {
    const db = getDb();
    const { relationId } = req.params;

    const sql = `
      SELECT rs.*, s.name as schoolName, s.type as schoolType, s.location as schoolLocation
      FROM relation_schools rs
      LEFT JOIN schools s ON rs.schoolId = s.id
      WHERE rs.relationId = ?
      ORDER BY rs.isPrimary DESC, rs.startYear DESC
    `;

    const relationSchools = db.prepare(sql).all(relationId);
    res.json({ success: true, data: relationSchools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 添加教育经历
router.post('/relation', (req, res) => {
  try {
    const db = getDb();
    const { relationId, schoolId, schoolName, degree, major, startYear, endYear, isPrimary } = req.body;

    if (!relationId || (!schoolId && !schoolName)) {
      return res.status(400).json({ success: false, message: '关系人ID和学校信息不能为空' });
    }

    // 如果提供了学校名称但没有ID，先创建学校
    let finalSchoolId = schoolId;
    if (!finalSchoolId && schoolName) {
      const existingSchool = db.prepare('SELECT * FROM schools WHERE name = ?').get(schoolName);
      if (existingSchool) {
        finalSchoolId = existingSchool.id;
      } else {
        finalSchoolId = uuidv4();
        db.prepare(
          'INSERT INTO schools (id, name) VALUES (?, ?)'
        ).run(finalSchoolId, schoolName);
      }
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO relation_schools (id, relationId, schoolId, degree, major, startYear, endYear, isPrimary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, relationId, finalSchoolId, degree || null, major || null, startYear || null, endYear || null, isPrimary ? 1 : 0);

    const relationSchool = db.prepare(`
      SELECT rs.*, s.name as schoolName, s.type as schoolType, s.location as schoolLocation
      FROM relation_schools rs
      LEFT JOIN schools s ON rs.schoolId = s.id
      WHERE rs.id = ?
    `).get(id);

    res.json({ success: true, data: relationSchool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 删除教育经历
router.delete('/relation/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    db.prepare('DELETE FROM relation_schools WHERE id = ?').run(id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 按学校名搜索校友
router.get('/search/:schoolName', (req, res) => {
  try {
    const db = getDb();
    const { schoolName } = req.params;

    const sql = `
      SELECT r.*, rs.degree, rs.major, rs.startYear, rs.endYear, rs.isPrimary,
             s.name as schoolName, s.type as schoolType
      FROM relations r
      INNER JOIN relation_schools rs ON r.id = rs.relationId
      INNER JOIN schools s ON rs.schoolId = s.id
      WHERE s.name LIKE ?
      ORDER BY rs.isPrimary DESC, rs.startYear DESC
    `;

    const alumni = db.prepare(sql).all(`%${schoolName}%`);
    res.json({ success: true, data: alumni });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取学校详情及校友
router.get('/:schoolId', (req, res) => {
  try {
    const db = getDb();
    const { schoolId } = req.params;

    const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: '学校不存在' });
    }

    const sql = `
      SELECT r.*, rs.degree, rs.major, rs.startYear, rs.endYear, rs.isPrimary,
             rs.id as relationSchoolId
      FROM relations r
      INNER JOIN relation_schools rs ON r.id = rs.relationId
      WHERE rs.schoolId = ?
      ORDER BY rs.isPrimary DESC, rs.startYear DESC
    `;

    const alumni = db.prepare(sql).all(schoolId);
    res.json({ success: true, data: { school, alumni } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
