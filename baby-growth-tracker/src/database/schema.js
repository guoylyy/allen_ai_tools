const mysql = require('mysql2/promise');

const migrateDatabase = async (connection) => {
  // 迁移函数：安全地添加字段（如果不存在）
  async function addColumn(table, column, definition) {
    try {
      // 检查字段是否存在
      const [columns] = await connection.query(
        `SHOW COLUMNS FROM ${table} LIKE ?`,
        [column]
      );
      if (columns.length === 0) {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`${table}.${column} 添加成功`);
      } else {
        console.log(`${table}.${column} 已存在，跳过`);
      }
    } catch (error) {
      console.error(`添加字段 ${table}.${column} 失败:`, error.message);
    }
  }

      // 修改 records 表的 type 字段，添加 supplement、poop 和 pee 类型
  try {
    // 先检查当前 type 字段的定义
    const [columns] = await connection.query(`SHOW COLUMNS FROM records LIKE 'type'`);
    if (columns.length > 0) {
      const currentType = columns[0].Type;
      console.log('当前 type 字段类型:', currentType);
      
      // 如果不包含 pee，添加 pee 类型
      if (!currentType.includes('pee')) {
        // 修改 ENUM 类型，添加 pee
        await connection.query(`ALTER TABLE records MODIFY COLUMN type ENUM('sleep', 'eat', 'play', 'study', 'supplement', 'milestone', 'poop', 'pee') NOT NULL`);
        console.log('records.type 字段更新成功，添加了 pee 类型');
      } else {
        console.log('records.type 字段已包含 pee，跳过');
      }
    }
  } catch (error) {
    console.error('修改 records.type 字段失败:', error.message);
  }

  // 添加 users 表的新字段
  await addColumn('users', 'phone', 'VARCHAR(20) UNIQUE COMMENT "手机号"');
  await addColumn('users', 'password', 'VARCHAR(255) COMMENT "密码"');
  await addColumn('users', 'is_admin', 'TINYINT(1) DEFAULT 0 COMMENT "是否管理员"');
  await addColumn('users', 'is_active', 'TINYINT(1) DEFAULT 0 COMMENT "是否激活"');
  await addColumn('users', 'family_id', 'INT COMMENT "家庭ID"');
  await addColumn('users', 'invited_by', 'INT COMMENT "邀请人ID"');
  await addColumn('users', 'current_child_id', 'INT COMMENT "当前抚养的孩子ID"');

  // 创建 families 表
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS families (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) DEFAULT '我的家庭',
        invite_code VARCHAR(20) UNIQUE COMMENT '邀请码',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('families 表创建成功');
  } catch (error) {
    console.error('创建 families 表失败:', error.message);
  }

  // 更新 family_members 表
  await addColumn('family_members', 'is_admin', 'TINYINT(1) DEFAULT 0 COMMENT "是否管理员"');
  await addColumn('family_members', 'status', "ENUM('pending', 'active') DEFAULT 'pending' COMMENT '状态'");

  // 相册照片表添加拍摄时间字段
  await addColumn('album_photos', 'taken_at', 'DATETIME COMMENT "照片拍摄时间"');

  // 创建唯一索引
  try {
    // await connection.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
    console.log('索引创建成功');
  } catch (error) {
    console.error('创建索引失败:', error.message);
  }
};

module.exports = { migrateDatabase };
