const express = require('express');
const router = express.Router();
const { getDb, uuidv4, saveDatabase } = require('../models/database');

// 获取所有关系人
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, message: '数据库未初始化' });
    
    const stmt = db.prepare(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM interactions WHERE relationId = r.id) as interactionCount,
        (SELECT COUNT(*) FROM events WHERE relationId = r.id) as eventCount
      FROM relations r 
      ORDER BY 
        CASE r.importance WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
        r.updatedAt DESC
    `);
    
    const relations = [];
    while (stmt.step()) {
      relations.push(stmt.getAsObject());
    }
    stmt.free();
    
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
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, message: '数据库未初始化' });
    
    const stmt = db.prepare('SELECT * FROM relations WHERE id = ?');
    stmt.bind([req.params.id]);
    
    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ success: false, message: '关系人不存在' });
    }
    
    const relation = stmt.getAsObject();
    stmt.free();
    
    // 获取关联数据
    const interactionsStmt = db.prepare('SELECT * FROM interactions WHERE relationId = ? ORDER BY createdAt DESC');
    interactionsStmt.bind([req.params.id]);
    const interactions = [];
    while (interactionsStmt.step()) {
      interactions.push(interactionsStmt.getAsObject());
    }
    interactionsStmt.free();
    
    const financeStmt = db.prepare('SELECT * FROM finance WHERE relationId = ? ORDER BY date DESC');
    financeStmt.bind([req.params.id]);
    const finance = [];
    while (financeStmt.step()) {
      finance.push(financeStmt.getAsObject());
    }
    financeStmt.free();
    
    const momentsStmt = db.prepare('SELECT * FROM moments WHERE relationId = ? ORDER BY date DESC');
    momentsStmt.bind([req.params.id]);
    const moments = [];
    while (momentsStmt.step()) {
      moments.push(momentsStmt.getAsObject());
    }
    momentsStmt.free();
    
    const eventsStmt = db.prepare('SELECT * FROM events WHERE relationId = ? ORDER BY date ASC');
    eventsStmt.bind([req.params.id]);
    const events = [];
    while (eventsStmt.step()) {
      events.push(eventsStmt.getAsObject());
    }
    eventsStmt.free();
    
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
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, message: '数据库未初始化' });
    
    const { name, position, company, phone, email, tags, importance, background, features, goals, lastInteraction } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO relations (id, name, position, company, phone, email, tags, importance, background, features, goals, lastInteraction, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([id, name, position, company, phone, email, JSON.stringify(tags || []), importance || 'normal', background, features, goals, lastInteraction || now.slice(0, 10), now, now]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新关系人
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, message: '数据库未初始化' });
    
    const { name, position, company, phone, email, tags, importance, background, features, goals } = req.body;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      UPDATE relations 
      SET name = ?, position = ?, company = ?, phone = ?, email = ?, 
          tags = ?, importance = ?, background = ?, features = ?, goals = ?,
          updatedAt = ?
      WHERE id = ?
    `);
    stmt.run([name, position, company, phone, email, JSON.stringify(tags || []), importance, background, features, goals, now, req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除关系人
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, message: '数据库未初始化' });
    
    const stmt = db.prepare('DELETE FROM relations WHERE id = ?');
    stmt.run([req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取需要跟进的关系人
router.get('/stats/followup', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, message: '数据库未初始化' });
    
    const overdueStmt = db.prepare(`
      SELECT * FROM relations 
      WHERE date('now') - date(lastInteraction) > 14
      ORDER BY lastInteraction ASC
    `);
    
    const overdue = [];
    while (overdueStmt.step()) {
      overdue.push(overdueStmt.getAsObject());
    }
    overdueStmt.free();
    
    const promisesStmt = db.prepare(`
      SELECT DISTINCT r.* FROM relations r
      JOIN interactions i ON r.id = i.relationId
      WHERE i.promises LIKE '%"done":false%'
    `);
    
    const withPromises = [];
    while (promisesStmt.step()) {
      withPromises.push(promisesStmt.getAsObject());
    }
    promisesStmt.free();
    
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