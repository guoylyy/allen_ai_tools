const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'baby_growth',
        port: process.env.DB_PORT || 3306
    });

    console.log('数据库连接成功');

    // 检查字段是否存在
    const [columns] = await connection.query('DESCRIBE users');
    const columnNames = columns.map(c => c.Field);

    // 添加字段
    if (!columnNames.includes('phone')) {
        await connection.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE COMMENT '手机号'");
        console.log('✓ 添加 phone 字段');
    }
    if (!columnNames.includes('password')) {
        await connection.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT '密码'");
        console.log('✓ 添加 password 字段');
    }
    if (!columnNames.includes('is_admin')) {
        await connection.query("ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0 COMMENT '是否管理员'");
        console.log('✓ 添加 is_admin 字段');
    }
    if (!columnNames.includes('is_active')) {
        await connection.query("ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 0 COMMENT '是否激活'");
        console.log('✓ 添加 is_active 字段');
    }
    if (!columnNames.includes('family_id')) {
        await connection.query("ALTER TABLE users ADD COLUMN family_id INT COMMENT '家庭ID'");
        console.log('✓ 添加 family_id 字段');
    }
    if (!columnNames.includes('invited_by')) {
        await connection.query("ALTER TABLE users ADD COLUMN invited_by INT COMMENT '邀请人ID'");
        console.log('✓ 添加 invited_by 字段');
    }

    // 创建 families 表
    await connection.query(`
        CREATE TABLE IF NOT EXISTS families (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) DEFAULT '我的家庭',
            invite_code VARCHAR(20) UNIQUE COMMENT '邀请码',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✓ families 表创建/已存在');

    // 检查 family_members 字段
    const [fmColumns] = await connection.query('DESCRIBE family_members');
    const fmColumnNames = fmColumns.map(c => c.Field);

    if (!fmColumnNames.includes('is_admin')) {
        await connection.query("ALTER TABLE family_members ADD COLUMN is_admin TINYINT(1) DEFAULT 0 COMMENT '是否管理员'");
        console.log('✓ family_members 添加 is_admin 字段');
    }
    if (!fmColumnNames.includes('status')) {
        await connection.query("ALTER TABLE family_members ADD COLUMN status ENUM('pending', 'active') DEFAULT 'pending' COMMENT '状态'");
        console.log('✓ family_members 添加 status 字段');
    }

    console.log('\n✅ 数据库迁移完成！');
    await connection.end();
}

migrate().catch(console.error);
