const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../models/database');

// 获取某关系人的财务记录
router.get('/relation/:relationId', (req, res) => {
  try {
    const finance = db.prepare(`
      SELECT * FROM finance 
      WHERE relationId = ? 
      ORDER BY date DESC
    `).all(req.params.relationId);
    
    res.json({ success: true, data: finance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取统计信息
router.get('/stats/:relationId', (req, res) => {
  try {
    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM finance 
      WHERE relationId = ? AND type = 'income'
    `).get(req.params.relationId);
    
    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM finance 
      WHERE relationId = ? AND type = 'expense'
    `).get(req.params.relationId);
    
    res.json({
      success: true,
      data: {
        totalIncome: income.total,
        totalExpense: expense.total,
        balance: income.total - expense.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建财务记录
router.post('/', (req, res) => {
  try {
    const { relationId, type, amount, item, category, date, note } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO finance (id, relationId, type, amount, item, category, date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, relationId, type, amount, item, category || 'gift', date, note);
    
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新财务记录
router.put('/:id', (req, res) => {
  try {
    const { type, amount, item, category, date, note } = req.body;
    
    db.prepare(`
      UPDATE finance SET type = ?, amount = ?, item = ?, category = ?, date = ?, note = ?
      WHERE id = ?
    `).run(type, amount, item, category, date, note, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除财务记录
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM finance WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
