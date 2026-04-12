const express = require('express');
const router = express.Router();
const { getDb, uuidv4 } = require('../models/database');

function db() {
  return getDb();
}

// 获取所有关系人
router.get('/', (req, res) => {
  try {
    const relations = db().prepare(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM interactions WHERE relationId = r.id) as interactionCount,
        (SELECT COUNT(*) FROM events WHERE relationId = r.id) as eventCount
      FROM relations r 
      ORDER BY 
        CASE r.importance WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
        r.updatedAt DESC
    `).all();
    
    // 解析JSON字段
    const result = relations.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]')
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个关系人详情
router.get('/:id', (req, res) => {
  try {
    const relation = db().prepare('SELECT * FROM relations WHERE id = ?').get(req.params.id);
    if (!relation) {
      return res.status(404).json({ success: false, message: '关系人不存在' });
    }
    
    // 获取关联数据
    const interactions = db().prepare('SELECT * FROM interactions WHERE relationId = ? ORDER BY createdAt DESC').all(req.params.id);
    const finance = db().prepare('SELECT * FROM finance WHERE relationId = ? ORDER BY date DESC').all(req.params.id);
    const moments = db().prepare('SELECT * FROM moments WHERE relationId = ? ORDER BY date DESC').all(req.params.id);
    const events = db().prepare('SELECT * FROM events WHERE relationId = ? ORDER BY date ASC').all(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...relation,
        tags: JSON.parse(relation.tags || '[]'),
        interactions: interactions.map(i => ({
          ...i,
          promises: JSON.parse(i.promises || '[]'),
          photos: JSON.parse(i.photos || '[]')
        })),
        finance,
        moments: moments.map(m => ({
          ...m,
          photos: JSON.parse(m.photos || '[]')
        })),
        events
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建关系人
router.post('/', (req, res) => {
  try {
    const { name, position, company, phone, email, tags, importance, background, features, goals } = req.body;
    const id = uuidv4();
    
    db().prepare(`
      INSERT INTO relations (id, name, position, company, phone, email, tags, importance, background, features, goals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, position, company, phone, email, JSON.stringify(tags || []), importance || 'normal', background, features, goals);
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新关系人
router.put('/:id', (req, res) => {
  try {
    const { name, position, company, phone, email, tags, importance, background, features, goals } = req.body;
    
    db().prepare(`
      UPDATE relations 
      SET name = ?, position = ?, company = ?, phone = ?, email = ?, 
          tags = ?, importance = ?, background = ?, features = ?, goals = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, position, company, phone, email, JSON.stringify(tags || []), importance, background, features, goals, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除关系人
router.delete('/:id', (req, res) => {
  try {
    db().prepare('DELETE FROM relations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取需要跟进的关系人
router.get('/stats/followup', (req, res) => {
  try {
    // 获取久未联系的关系人（超过14天）
    const overdue = db().prepare(`
      SELECT * FROM relations 
      WHERE date('now') - date(lastInteraction) > 14
      ORDER BY lastInteraction ASC
    `).all();
    
    // 获取有约定未完成的
    const withPromises = db().prepare(`
      SELECT DISTINCT r.* FROM relations r
      JOIN interactions i ON r.id = i.relationId
      WHERE i.promises LIKE '%"done":false%'
    `).all();
    
    res.json({
      success: true,
      data: {
        overdue: overdue.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })),
        withPromises: withPromises.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;