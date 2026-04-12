const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../models/database');

// 获取某关系人的所有互动
router.get('/relation/:relationId', (req, res) => {
  try {
    const interactions = db.prepare(`
      SELECT * FROM interactions 
      WHERE relationId = ? 
      ORDER BY createdAt DESC
    `).all(req.params.relationId);
    
    const result = interactions.map(i => ({
      ...i,
      promises: JSON.parse(i.promises || '[]'),
      photos: JSON.parse(i.photos || '[]')
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建互动记录
router.post('/', (req, res) => {
  try {
    const { relationId, type, content, summary, location, duration, promises, photos } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO interactions (id, relationId, type, content, summary, location, duration, promises, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, relationId, type || 'meeting', content, summary, location, duration, JSON.stringify(promises || []), JSON.stringify(photos || []));
    
    // 更新关系人的最后互动时间
    db.prepare('UPDATE relations SET lastInteraction = date("now"), updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(relationId);
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新互动记录
router.put('/:id', (req, res) => {
  try {
    const { type, content, summary, location, duration, promises, photos } = req.body;
    
    db.prepare(`
      UPDATE interactions 
      SET type = ?, content = ?, summary = ?, location = ?, duration = ?, promises = ?, photos = ?
      WHERE id = ?
    `).run(type, content, summary, location, duration, JSON.stringify(promises || []), JSON.stringify(photos || []), req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除互动记录
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM interactions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
