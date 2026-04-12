const express = require('express');
const router = express.Router();
const { getDb, uuidv4, saveDatabase } = require('../models/database');

// 获取某关系人的重要时刻
router.get('/relation/:relationId', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE relationId = ? 
      ORDER BY date ASC
    `);
    stmt.bind([req.params.relationId]);
    
    const events = [];
    while (stmt.step()) {
      events.push(stmt.getAsObject());
    }
    stmt.free();
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取即将到来的提醒（未来30天内）
router.get('/upcoming', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT e.*, r.name as relationName, r.position, r.company
      FROM events e
      JOIN relations r ON e.relationId = r.id
      WHERE date(e.date) BETWEEN date('now') AND date('now', '+30 days')
      AND e.reminder > 0
      ORDER BY e.date ASC
    `);
    
    const events = [];
    while (stmt.step()) {
      events.push(stmt.getAsObject());
    }
    stmt.free();
    
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建重要时刻
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { relationId, type, date, note, reminder } = req.body;
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO events (id, relationId, type, date, note, reminder)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([id, relationId, type, date, note || null, reminder || 0]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新重要时刻
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { type, date, note, reminder } = req.body;
    
    const stmt = db.prepare(`
      UPDATE events SET type = ?, date = ?, note = ?, reminder = ?
      WHERE id = ?
    `);
    stmt.run([type, date, note, reminder, req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除重要时刻
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    stmt.run([req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;