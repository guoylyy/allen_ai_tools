const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const PORT = process.env.PORT || 3002;

async function startServer() {
  // 初始化数据库
  const { initDatabase, getDb } = require('./models/database');
  await initDatabase();

  const app = express();

  // 中间件
  app.use(cors());
  app.use(express.json());

  // 配置 multer 用于文件上传
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 限制10MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
      } else {
        cb(new Error('只支持 Excel 文件 (.xlsx, .xls)'));
      }
    }
  });

  // 路由
  const relationsRouter = require('./routes/relations');
  const interactionsRouter = require('./routes/interactions');
  const financeRouter = require('./routes/finance');
  const momentsRouter = require('./routes/moments');
  const eventsRouter = require('./routes/events');
  const schoolsRouter = require('./routes/schools');
  const importRouter = require('./routes/import');

  // API路由
  app.use('/api/relations', relationsRouter);
  app.use('/api/interactions', interactionsRouter);
  app.use('/api/finance', financeRouter);
  app.use('/api/moments', momentsRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/schools', schoolsRouter);
  app.use('/api/import', importRouter);

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
}

startServer().catch(console.error);