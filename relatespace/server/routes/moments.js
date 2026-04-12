const express = require('express');
const router = express.Router();
const { getDb, uuidv4, saveDatabase } = require('../models/database');

// 获取某关系人的朋友圈动态
router.get('/relation/:relationId', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT * FROM moments 
      WHERE relationId = ? 
      ORDER BY date DESC
    `);
    stmt.bind([req.params.relationId]);
    
    const moments = [];
    while (stmt.step()) {
      moments.push(stmt.getAsObject());
    }
    stmt.free();
    
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
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { relationId, content, photos, date } = req.body;
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO moments (id, relationId, content, photos, date)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([id, relationId, content, JSON.stringify(photos || []), date]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新朋友圈动态
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { content, photos, date } = req.body;
    
    const stmt = db.prepare(`
      UPDATE moments SET content = ?, photos = ?, date = ?
      WHERE id = ?
    `);
    stmt.run([content, JSON.stringify(photos || []), date, req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除朋友圈动态
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM moments WHERE id = ?');
    stmt.run([req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;