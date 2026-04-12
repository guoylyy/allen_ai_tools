const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../data/relatespace.db');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

async function initDatabase() {
  const SQL = await initSqlJs();

  let data = null;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }

  if (data) {
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS relations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT,
      company TEXT,
      phone TEXT,
      email TEXT,
      tags TEXT DEFAULT '[]',
      importance TEXT DEFAULT 'normal',
      background TEXT,
      features TEXT,
      goals TEXT,
      lastInteraction TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      relationId TEXT NOT NULL,
      type TEXT DEFAULT 'meeting',
      content TEXT,
      summary TEXT,
      location TEXT,
      duration TEXT,
      promises TEXT DEFAULT '[]',
      photos TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (relationId) REFERENCES relations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS finance (
      id TEXT PRIMARY KEY,
      relationId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      item TEXT NOT NULL,
      category TEXT DEFAULT 'gift',
      date TEXT NOT NULL,
      note TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (relationId) REFERENCES relations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS moments (
      id TEXT PRIMARY KEY,
      relationId TEXT NOT NULL,
      content TEXT NOT NULL,
      photos TEXT DEFAULT '[]',
      date TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (relationId) REFERENCES relations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      relationId TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      reminder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (relationId) REFERENCES relations(id) ON DELETE CASCADE
    )
  `);

  const result = db.exec('SELECT COUNT(*) as count FROM relations');
  if (result.length === 0 || result[0].values[0][0] === 0) {
    const relations = [
      {
        id: uuidv4(),
        name: '张明辉',
        position: 'CEO',
        company: '星辰科技集团',
        tags: JSON.stringify(['客户', '合作伙伴']),
        importance: 'high',
        background: '连续创业者，曾创办两家上市公司。科技圈人脉深厚。',
        features: '决策果断，重视效率。喜欢直接沟通。',
        goals: '寻找新能源战略合作伙伴，扩展海外市场。',
        lastInteraction: '2024-06-01'
      },
      {
        id: uuidv4(),
        name: '王建国',
        position: '技术VP',
        company: '创新工场',
        tags: JSON.stringify(['朋友', '合作伙伴']),
        importance: 'high',
        background: '清华大学计算机系毕业，曾在BAT担任技术总监多年。',
        features: '思维缜密，逻辑清晰。喜欢深度技术讨论。',
        goals: '正在寻找优质的AI项目进行投资。',
        lastInteraction: '2026-04-12'
      },
      {
        id: uuidv4(),
        name: '李雅婷',
        position: '采购总监',
        company: '华润供应链',
        tags: JSON.stringify(['供应商']),
        importance: 'low',
        background: '供应链行业资深人士。',
        features: '务实，关注成本控制。',
        goals: '寻找优质供应商合作。',
        lastInteraction: '2024-05-20'
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO relations (id, name, position, company, tags, importance, background, features, goals, lastInteraction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    relations.forEach(r => {
      stmt.run([r.id, r.name, r.position, r.company, r.tags, r.importance, r.background, r.features, r.goals, r.lastInteraction]);
    });
    stmt.free();
  }

  saveDatabase();
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

async function getDb() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

// 启动时自动初始化
initDatabase().then(() => {
  console.log('✅ 数据库初始化完成');
}).catch(err => {
  console.error('❌ 数据库初始化失败:', err);
});

module.exports = { getDb, uuidv4, saveDatabase };