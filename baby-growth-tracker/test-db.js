const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function testConnection() {
    try {
        console.log('尝试连接 MySQL...');
        console.log('配置:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ MySQL 连接成功！');
        
        // 测试创建数据库
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`✅ 数据库 ${process.env.DB_NAME} 创建/存在`);
        
        // 使用该数据库
        await connection.changeUser({ database: process.env.DB_NAME });
        console.log('✅ 已切换到目标数据库');
        
        // 测试创建表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS test_table (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ 测试表创建成功');
        
        // 插入测试数据
        await connection.query('INSERT INTO test_table (name) VALUES (?)', ['test']);
        console.log('✅ 测试数据插入成功');
        
        // 查询测试数据
        const [rows] = await connection.query('SELECT * FROM test_table');
        console.log('✅ 查询成功:', rows);
        
        // 清理测试表
        await connection.query('DROP TABLE IF EXISTS test_table');
        console.log('✅ 测试表已清理');
        
        await connection.end();
        console.log('\n🎉 数据库连接测试全部通过！可以运行正式版本了');
        
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.error('错误详情:', error);
    }
}

testConnection();
