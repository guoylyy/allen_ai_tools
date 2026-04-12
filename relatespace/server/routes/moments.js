const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../models/database');

// 获取某关系人的朋友圈动态
router.get('/relation/:relationId', (req, res) => {
  try {
    const moments = db.prepare(`
      SELECT * FROM moments 
      WHERE relationId = ? 
      ORDER BY date DESC
    `).all(req.params.relationId);
    
    const result = moments.map(m => ({
      ...m,
      photos: JSON.parse(m.photos || '[]')
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建朋友圈动态
router.post('/', (req, res) => {
  try {
    const { relationId, content, photos, date } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO moments (id, relationId, content, photos, date)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, relationId, content, JSON.stringify(photos || []), date);
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新朋友圈动态
router.put('/:id', (req, res) => {
  try {
    const { content, photos, date } = req.body;
    
    db.prepare(`
      UPDATE moments SET content = ?, photos = ?, date = ?
      WHERE id = ?
    `).run(content, JSON.stringify(photos || []), date, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除朋友圈动态
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM moments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
