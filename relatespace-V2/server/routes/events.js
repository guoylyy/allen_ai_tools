const express = require('express');
const router = express.Router();
const { getDb, uuidv4 } = require('../models/database');

function db() {
  return getDb();
}

// 获取某关系人的重要时刻
router.get('/relation/:relationId', (req, res) => {
  try {
    const events = db().prepare(`
      SELECT * FROM events 
      WHERE relationId = ? 
      ORDER BY date ASC
    `).all(req.params.relationId);
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取即将到来的提醒（未来30天内）
router.get('/upcoming', (req, res) => {
  try {
    const events = db().prepare(`
      SELECT e.*, r.name as relationName, r.position, r.company
      FROM events e
      JOIN relations r ON e.relationId = r.id
      WHERE date(e.date) BETWEEN date('now') AND date('now', '+30 days')
      AND e.reminder > 0
      ORDER BY e.date ASC
    `).all();
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建重要时刻
router.post('/', (req, res) => {
  try {
    const { relationId, type, date, note, reminder } = req.body;
    const id = uuidv4();
    
    db().prepare(`
      INSERT INTO events (id, relationId, type, date, note, reminder)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, relationId, type, date, note, reminder || 0);
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新重要时刻
router.put('/:id', (req, res) => {
  try {
    const { type, date, note, reminder } = req.body;
    
    db().prepare(`
      UPDATE events SET type = ?, date = ?, note = ?, reminder = ?
      WHERE id = ?
    `).run(type, date, note, reminder, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除重要时刻
router.delete('/:id', (req, res) => {
  try {
    db().prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;