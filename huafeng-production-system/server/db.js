const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'huafeng.db');

let db;

// 初始化数据库
async function initDB() {
  const SQL = await initSqlJs();
  
  // 尝试加载现有数据库
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表
  db.run(`
    -- 订单表
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      project_name TEXT,
      device_no TEXT,
      quantity INTEGER DEFAULT 1,
      delivery_date TEXT,
      process_date TEXT,
      cw TEXT,
      cd TEXT,
      ch TEXT,
      op TEXT,
      oph TEXT,
      df TEXT,
      dwg TEXT,
      dbg TEXT,
      doorhnd TEXT,
      qt TEXT,
      paint_color TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    -- 产品明细表
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      serial_no TEXT,
      part_no TEXT NOT NULL,
      name TEXT,
      material TEXT,
      length REAL,
      width REAL,
      thickness REAL,
      quantity INTEGER,
      total_quantity INTEGER,
      params TEXT,
      paint_color TEXT,
      process_route TEXT,
      process_file_no TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    -- 工序表
    CREATE TABLE IF NOT EXISTS processes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    -- 派工单表
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      assigned_date TEXT,
      completed_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (process_id) REFERENCES processes(id)
    )
  `);

  db.run(`
    -- 员工表
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT,
      position TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    -- 生产记录表
    CREATE TABLE IF NOT EXISTS production_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      worker_id TEXT,
      status TEXT DEFAULT 'pending',
      start_time TEXT,
      end_time TEXT,
      quantity INTEGER,
      qualified_quantity INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (process_id) REFERENCES processes(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    )
  `);

  db.run(`
    -- 日志表
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      target_name TEXT,
      user_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 初始化工序数据
  const processes = [
    { id: 'jianban', name: 'jianban', display_name: '剪板', sort_order: 1 },
    { id: 'shuchong', name: 'shuchong', display_name: '数冲', sort_order: 2 },
    { id: 'jiguang', name: 'jiguang', display_name: '激光下料', sort_order: 3 },
    { id: 'zhewan', name: 'zhewan', display_name: '折弯', sort_order: 4 },
    { id: 'jiaogangxian', name: 'jiaogangxian', display_name: '角钢线', sort_order: 5 },
    { id: 'qieguanji', name: 'qieguanji', display_name: '切管机', sort_order: 6 },
    { id: 'juchuang', name: 'juchuang', display_name: '锯床', sort_order: 7 },
    { id: 'zuanchuang', name: 'zuanchuang', display_name: '钻床', sort_order: 8 },
    { id: 'puchong', name: 'puchong', display_name: '普冲', sort_order: 9 },
    { id: 'hanjie', name: 'hanjie', display_name: '焊接', sort_order: 10 },
    { id: 'pentu', name: 'pentu', display_name: '喷涂', sort_order: 11 },
    { id: 'zuzhuang', name: 'zuzhuang', display_name: '组装', sort_order: 12 }
  ];

  for (const p of processes) {
    db.run(`INSERT OR IGNORE INTO processes (id, name, display_name, sort_order) VALUES (?, ?, ?, ?)`, 
      [p.id, p.name, p.display_name, p.sort_order]);
  }

  saveDB();
  
  console.log('数据库初始化完成');
  console.log('表:', db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0].values.flat());
  
  return db;
}

// 保存数据库到文件
function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// 封装查询方法
const dbAPI = {
  prepare: (sql) => ({
    run: (...params) => {
      db.run(sql, params);
      saveDB();
      return { changes: db.getRowsModified() };
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  })
};

// 同步初始化
let dbReady = false;
const dbInitPromise = initDB().then(() => {
  dbReady = true;
});

module.exports = {
  getDB: () => dbReady ? dbAPI : null,
  dbReady: dbInitPromise
};
