/**
 * Excel导入导出工具模块
 * 支持 xlsx 格式的读取和写入
 */

const xl = require('exceljs');

/**
 * 创建导入模板
 * @returns {Buffer} Excel文件buffer
 */
function createImportTemplate() {
  const workbook = new xl.Workbook();
  workbook.creator = 'RelateSpace';
  workbook.created = new Date();

  // Sheet 1: 关系人导入模板
  const relationsSheet = workbook.addWorksheet('关系人导入', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  // 定义列
  relationsSheet.columns = [
    { header: '姓名*', key: 'name', width: 15 },
    { header: '职位', key: 'position', width: 20 },
    { header: '公司', key: 'company', width: 25 },
    { header: '电话', key: 'phone', width: 15 },
    { header: '邮箱', key: 'email', width: 25 },
    { header: '标签', key: 'tags', width: 20 },
    { header: '重要性', key: 'importance', width: 10 },
    { header: '背景', key: 'background', width: 40 },
    { header: '特点', key: 'features', width: 30 },
    { header: '目标', key: 'goals', width: 30 },
    { header: '最后联系日期', key: 'lastInteraction', width: 15 }
  ];

  // 表头样式
  const headerRow = relationsSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // 添加示例数据（说明行）
  const exampleData = [
    '张三',
    '产品总监',
    '字节跳动',
    '13800138000',
    'zhangsan@example.com',
    '客户,互联网',
    'high',
    '资深产品专家，擅长用户增长',
    '注重数据，喜欢用数据说话',
    '寻找战略合作伙伴',
    '2024-06-01'
  ];

  // 在第2行添加示例说明
  relationsSheet.addRow(exampleData);

  // 示例行样式
  const exampleRow = relationsSheet.getRow(2);
  exampleRow.font = { italic: true, color: { argb: 'FF6B7280' } };
  exampleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  };

  // 添加说明区域
  relationsSheet.addRow([]); // 空行

  // 字段说明
  const instructions = [
    { col1: '【字段说明】', col2: '' },
    { col1: '姓名*', col2: '必填，关系人的姓名' },
    { col1: '职位', col2: '关系人的职位/头衔' },
    { col1: '公司', col2: '所属公司/组织' },
    { col1: '电话', col2: '联系电话' },
    { col1: '邮箱', col2: '电子邮箱' },
    { col1: '标签', col2: '标签，多个用逗号分隔，如：客户,合作伙伴,投资人' },
    { col1: '重要性', col2: 'high(重要)/normal(普通)/low(一般)，不填默认为normal' },
    { col1: '背景', col2: '关系人的背景介绍' },
    { col1: '特点', col2: '性格特点或沟通风格' },
    { col1: '目标', col2: '对方的目标或需求' },
    { col1: '最后联系日期', col2: '格式：2024-06-01，不填则从当前日期计算' }
  ];

  instructions.forEach(item => {
    relationsSheet.addRow([item.col1, item.col2]);
  });

  // 说明区域样式
  const infoStartRow = 5;
  const infoEndRow = infoStartRow + instructions.length - 1;
  for (let i = infoStartRow; i <= infoEndRow; i++) {
    const row = relationsSheet.getRow(i);
    if (row.getCell(1).text.startsWith('【')) {
      row.font = { bold: true };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEF2FF' }
      };
    }
  }

  // Sheet 2: 标签参考
  const tagsSheet = workbook.addWorksheet('标签参考', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  tagsSheet.columns = [
    { header: '标签分类', key: 'category', width: 15 },
    { header: '推荐标签', key: 'tags', width: 40 }
  ];

  const tagHeaderRow = tagsSheet.getRow(1);
  tagHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  tagHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' }
  };
  tagHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

  const recommendedTags = [
    { category: '关系类型', tags: '客户,供应商,合作伙伴,投资人,朋友,家人,同事,领导,下属' },
    { category: '行业', tags: '互联网,金融,医疗,教育,制造,房地产,咨询,媒体' },
    { category: '重要性', tags: '重要客户,战略伙伴,高潜力,核心人脉' },
    { category: '渠道来源', tags: '展会,朋友推荐,LinkedIn,微信,线下活动,公司内部' },
    { category: '跟进状态', tags: '待联系,重点跟进,已签约,长期维护' }
  ];

  recommendedTags.forEach(item => {
    tagsSheet.addRow([item.category, item.tags]);
  });

  // 设置标签Sheet列宽
  tagsSheet.getColumn(2).width = 50;

  return workbook;
}

/**
 * 导出关系人数据到Excel
 * @param {Array} relations 关系人数据
 * @returns {Buffer} Excel文件buffer
 */
function exportRelations(relations) {
  const workbook = createImportTemplate();
  const relationsSheet = workbook.getWorksheet('关系人导入');

  // 清除示例行和说明区域
  while (relationsSheet.rowCount > 1) {
    relationsSheet.spliceRows(2, 1);
  }

  // 添加关系人数据
  relations.forEach(relation => {
    relationsSheet.addRow({
      name: relation.name || '',
      position: relation.position || '',
      company: relation.company || '',
      phone: relation.phone || '',
      email: relation.email || '',
      tags: Array.isArray(relation.tags) ? relation.tags.join(',') : (relation.tags || ''),
      importance: relation.importance || 'normal',
      background: relation.background || '',
      features: relation.features || '',
      goals: relation.goals || '',
      lastInteraction: relation.lastInteraction || ''
    });
  });

  return workbook;
}

/**
 * 解析Excel文件
 * @param {Buffer} buffer Excel文件buffer
 * @returns {Object} { success: boolean, data: array, errors: array }
 */
function parseImportFile(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = new xl.Workbook();
      workbook.xlsx.load(buffer).then(workbook => {
        const sheet = workbook.getWorksheet('关系人导入');
        if (!sheet) {
          return resolve({
            success: false,
            message: '未找到"关系人导入"工作表'
          });
        }

        const results = [];
        const errors = [];

        // 从第2行开始读取（跳过表头和示例行）
        let dataStartRow = 2;

        // 找到实际数据起始行
        for (let i = 2; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i);
          const name = row.getCell('name').text;
          // 如果找到第一行有姓名的数据，或者遇到空行后的第一行有数据
          if (name && name.trim() && !name.includes('示例') && !name.includes('【')) {
            dataStartRow = i;
            break;
          }
          // 如果遇到说明区域，停止
          if (name.includes('【字段说明】')) {
            dataStartRow = i + 1;
            break;
          }
        }

        // 读取数据行
        for (let i = dataStartRow; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i);
          const name = row.getCell('name').text;

          // 跳过空行和说明行
          if (!name || !name.trim() || name.includes('【')) {
            continue;
          }

          try {
            // 解析标签（逗号分隔）
            const tagsText = row.getCell('tags').text || '';
            const tags = tagsText.split(/[,，]/).map(t => t.trim()).filter(t => t);

            // 验证重要性字段
            let importance = (row.getCell('importance').text || 'normal').trim().toLowerCase();
            if (!['high', 'normal', 'low'].includes(importance)) {
              importance = 'normal';
            }

            results.push({
              name: name.trim(),
              position: row.getCell('position').text?.trim() || '',
              company: row.getCell('company').text?.trim() || '',
              phone: row.getCell('phone').text?.trim() || '',
              email: row.getCell('email').text?.trim() || '',
              tags: tags,
              importance: importance,
              background: row.getCell('background').text?.trim() || '',
              features: row.getCell('features').text?.trim() || '',
              goals: row.getCell('goals').text?.trim() || '',
              lastInteraction: row.getCell('lastInteraction').text?.trim() || ''
            });
          } catch (err) {
            errors.push({
              row: i + 1,
              name: name,
              error: err.message
            });
          }
        }

        // 检查必填字段
        const validationErrors = [];
        results.forEach((item, index) => {
          if (!item.name) {
            validationErrors.push({
              row: dataStartRow + index + 1,
              name: item.name || '(空)',
              error: '姓名为必填字段'
            });
          }
        });

        resolve({
          success: true,
          data: results,
          errors: [...errors, ...validationErrors],
          totalCount: results.length,
          errorCount: errors.length + validationErrors.length
        });
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  createImportTemplate,
  exportRelations,
  parseImportFile
};
