const express = require('express');
const router = express.Router();
const { getDb, uuidv4, saveDatabase } = require('../models/database');

// 获取某关系人的财务记录
router.get('/relation/:relationId', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT * FROM finance 
      WHERE relationId = ? 
      ORDER BY date DESC
    `);
    stmt.bind([req.params.relationId]);
    
    const finance = [];
    while (stmt.step()) {
      finance.push(stmt.getAsObject());
    }
    stmt.free();
    
    res.json({ success: true, data: finance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取统计信息
router.get('/stats/:relationId', async (req, res) => {
  try {
    const db = await getDb();
    
    const incomeStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM finance 
      WHERE relationId = ? AND type = 'income'
    `);
    incomeStmt.bind([req.params.relationId]);
    incomeStmt.step();
    const income = incomeStmt.getAsObject();
    incomeStmt.free();
    
    const expenseStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM finance 
      WHERE relationId = ? AND type = 'expense'
    `);
    expenseStmt.bind([req.params.relationId]);
    expenseStmt.step();
    const expense = expenseStmt.getAsObject();
    expenseStmt.free();
    
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
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { relationId, type, amount, item, category, date, note } = req.body;
    const id = uuidv4();
    console.log('Creating finance:', { relationId, type, amount, item, category, date, note });
    
    const stmt = db.prepare(`
      INSERT INTO finance (id, relationId, type, amount, item, category, date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([id, relationId, type, Number(amount), item, category || 'gift', date, note || null]);
    stmt.free();

    saveDatabase();
    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Finance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新财务记录
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { type, amount, item, category, date, note } = req.body;
    
    const stmt = db.prepare(`
      UPDATE finance SET type = ?, amount = ?, item = ?, category = ?, date = ?, note = ?
      WHERE id = ?
    `);
    stmt.run([type, amount, item, category, date, note, req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除财务记录
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM finance WHERE id = ?');
    stmt.run([req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;