const express = require('express');
const router = express.Router();
const { getDb, uuidv4, saveDatabase } = require('../models/database');

// 获取某关系人的所有互动
router.get('/relation/:relationId', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT * FROM interactions 
      WHERE relationId = ? 
      ORDER BY createdAt DESC
    `);
    stmt.bind([req.params.relationId]);
    
    const interactions = [];
    while (stmt.step()) {
      interactions.push(stmt.getAsObject());
    }
    stmt.free();
    
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
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { relationId, type, content, summary, location, duration, promises, photos } = req.body;
    const id = uuidv4();
    console.log('Creating interaction:', { relationId, type, content, summary });
    
    const stmt = db.prepare(`
      INSERT INTO interactions (id, relationId, type, content, summary, location, duration, promises, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([id, relationId, type || 'meeting', content, summary || null, location || null, duration || null, JSON.stringify(promises || []), JSON.stringify(photos || [])]);
    stmt.free();
    
    // 更新关系人的最后互动时间
    const updateStmt = db.prepare('UPDATE relations SET lastInteraction = date("now"), updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run([relationId]);
    updateStmt.free();
    
    saveDatabase();
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新互动记录
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { type, content, summary, location, duration, promises, photos } = req.body;
    
    const stmt = db.prepare(`
      UPDATE interactions 
      SET type = ?, content = ?, summary = ?, location = ?, duration = ?, promises = ?, photos = ?
      WHERE id = ?
    `);
    stmt.run([type, content, summary, location, duration, JSON.stringify(promises || []), JSON.stringify(photos || []), req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AI 摘要生成
router.post('/ai-summary', async (req, res) => {
  try {
    const { content, relationName, relationContext } = req.body;
    
    // 简单的规则-based 摘要生成
    let summary = generateSummary(content, relationName, relationContext);
    
    res.json({ success: true, data: { summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 简单的 AI 摘要生成函数
function generateSummary(content, relationName, relationContext) {
  if (!content) return '无内容';
  
  const keyWords = {
    positive: ['感谢', '合作', '成功', '好', '棒', '期待', '有兴趣', '满意', '认可'],
    negative: ['问题', '困难', '挑战', '延迟', '取消', '不满意', '风险'],
    action: ['会面', '会议', '安排', '讨论', '推进', '落实', '确认', '联系']
  };
  
  const lines = content.split(/[，。！!?.]/).filter(l => l.trim());
  const summary = [];
  
  // 情绪分析
  let sentiment = 'neutral';
  for (const word of keyWords.positive) {
    if (content.includes(word)) { sentiment = 'positive'; break; }
  }
  if (sentiment === 'neutral') {
    for (const word of keyWords.negative) {
      if (content.includes(word)) { sentiment = 'negative'; break; }
    }
  }
  
  // 生成摘要
  const name = relationName || '对方';
  const sentimentEmoji = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '🤔' : '💬';
  
  if (content.length < 30) {
    return `${sentimentEmoji} 与${name}简短沟通，内容已记录。`;
  }
  
  // 提取关键信息
  let keyInfo = '';
  for (const word of keyWords.action) {
    if (content.includes(word)) {
      const idx = content.indexOf(word);
      const start = Math.max(0, idx - 10);
      const end = Math.min(content.length, idx + 20);
      keyInfo = content.slice(start, end);
      break;
    }
  }
  
  if (keyInfo) {
    return `${sentimentEmoji} 与${name}沟通要点：${keyInfo.trim()}...`;
  }
  
  return `${sentimentEmoji} 与${name}进行了沟通，详细内容已记录。`;
}

// 删除互动记录
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const stmt = db.prepare('DELETE FROM interactions WHERE id = ?');
    stmt.run([req.params.id]);
    stmt.free();
    
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;