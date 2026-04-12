const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// 数据库已在 models/database.js 中自动初始化
// 这里直接加载路由（数据库已就绪）
const relationsRouter = require('./routes/relations');
const interactionsRouter = require('./routes/interactions');
const financeRouter = require('./routes/finance');
const momentsRouter = require('./routes/moments');
const eventsRouter = require('./routes/events');

// API路由
app.use('/api/relations', relationsRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/moments', momentsRouter);
app.use('/api/events', eventsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '关系舱 API 服务运行中' });
});

// 静态文件服务（前端构建后的文件）
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║     关系舱 RelateSpace API 服务                    ║
║     服务端口: ${PORT}                                ║
║     前端页面: http://localhost:${PORT}              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});