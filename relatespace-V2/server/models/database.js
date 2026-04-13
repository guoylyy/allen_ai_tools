const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'relatespace.db');

let db = null;

// 生成 UUID 的简单函数
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 尝试加载已有数据库
  let data = null;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(data);
  
  // 初始化表
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

  db.run(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'university',
      location TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS relation_schools (
      id TEXT PRIMARY KEY,
      relationId TEXT NOT NULL,
      schoolId TEXT NOT NULL,
      degree TEXT,
      major TEXT,
      startYear INTEGER,
      endYear INTEGER,
      isPrimary INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (relationId) REFERENCES relations(id) ON DELETE CASCADE,
      FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE CASCADE
    )
  `);

  // 插入示例数据
  const result = db.exec('SELECT COUNT(*) as count FROM relations');
  const count = result.length > 0 ? result[0].values[0][0] : 0;
  
  if (count === 0) {
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
    
    relations.forEach(r => {
      db.run(
        `INSERT INTO relations (id, name, position, company, tags, importance, background, features, goals, lastInteraction)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.name, r.position, r.company, r.tags, r.importance, r.background, r.features, r.goals, r.lastInteraction]
      );
    });

    // 添加示例学校数据
    const schools = [
      { id: uuidv4(), name: '清华大学', type: 'university', location: '北京' },
      { id: uuidv4(), name: '同济大学', type: 'university', location: '上海' },
      { id: uuidv4(), name: '复旦大学', type: 'university', location: '上海' }
    ];

    schools.forEach(s => {
      db.run(
        `INSERT INTO schools (id, name, type, location) VALUES (?, ?, ?, ?)`,
        [s.id, s.name, s.type, s.location]
      );
    });

    // 获取已插入的关系人ID（从已插入的数据中查找）
    const insertedRelations = db.prepare('SELECT id, name FROM relations').all();
    const insertedSchools = db.prepare('SELECT id, name FROM schools').all();

    // 为关系人添加教育经历
    const tsinghua = insertedSchools.find(s => s.name === '清华大学');
    const tongji = insertedSchools.find(s => s.name === '同济大学');
    const fudan = insertedSchools.find(s => s.name === '复旦大学');

    if (tsinghua && fudan) {
      // 王建国：清华本科、复旦硕士
      const wang = insertedRelations.find(r => r.name === '王建国');
      if (wang) {
        db.run(
          `INSERT INTO relation_schools (id, relationId, schoolId, degree, major, startYear, endYear, isPrimary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), wang.id, tsinghua.id, 'bachelor', '计算机科学与技术', 2000, 2004, 1]
        );
        db.run(
          `INSERT INTO relation_schools (id, relationId, schoolId, degree, major, startYear, endYear, isPrimary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), wang.id, fudan.id, 'master', '软件工程', 2004, 2007, 0]
        );
      }
    }

    if (tongji) {
      // 张明辉：同济本科
      const zhang = insertedRelations.find(r => r.name === '张明辉');
      if (zhang) {
        db.run(
          `INSERT INTO relation_schools (id, relationId, schoolId, degree, major, startYear, endYear, isPrimary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), zhang.id, tongji.id, 'bachelor', '工商管理', 1998, 2002, 1]
        );
      }
    }
  }
  
  saveDatabase();
  console.log('✅ 数据库初始化完成');
  
  return db;
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// 封装查询方法，模拟 better-sqlite3 API
class DbWrapper {
  constructor(database) {
    this.database = database;
  }
  
  prepare(sql) {
    const self = this;
    return {
      run: function(...params) {
        self.database.run(sql, params);
        saveDatabase();
      },
      get: function(...params) {
        const stmt = self.database.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return null;
      },
      all: function(...params) {
        const results = [];
        const stmt = self.database.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }
  
  exec(sql) {
    this.database.run(sql);
    saveDatabase();
  }
}

// 导出接口
let dbWrapper = null;

function getDb() {
  if (!dbWrapper && db) {
    dbWrapper = new DbWrapper(db);
  }
  return dbWrapper;
}

module.exports = { initDatabase, getDb, uuidv4, saveDatabase };