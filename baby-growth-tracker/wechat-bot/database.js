const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

class Database {
    constructor() {
        this.connection = null;
    }

    // 初始化数据库连接
    async initialize() {
        try {
            this.connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'baby_growth',
                port: process.env.DB_PORT || 3306,
                dateStrings: true
            });

            console.log('✅ 数据库连接成功');
            return true;
        } catch (error) {
            console.error('❌ 数据库连接失败:', error.message);
            return false;
        }
    }

    // 获取指定日期的记录
    async getRecordsByDate(childId, date) {
        const sql = `
            SELECT * FROM records 
            WHERE child_id = ? AND DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) = ?
            ORDER BY recorded_at DESC
        `;
        
        const [records] = await this.connection.query(sql, [childId, date]);
        return records;
    }

    // 获取所有孩子
    async getChildren() {
        const [children] = await this.connection.query('SELECT * FROM children ORDER BY created_at DESC');
        return children;
    }

    // 关闭连接
    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = new Database();
