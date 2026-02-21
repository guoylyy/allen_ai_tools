const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { migrateDatabase } = require('./schema');

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
                dateStrings: true // 返回字符串格式的日期，不转换为 Date 对象
            });

            console.log('数据库连接成功');
            
            // 创建表
            await this.createTables();
            
            // 执行数据库迁移（添加新字段）
            await migrateDatabase(this.connection);
        } catch (error) {
            console.error('数据库连接失败:', error.message);
        }
    }

    // 创建数据表
    async createTables() {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                openid VARCHAR(64) UNIQUE NOT NULL,
                nickname VARCHAR(64),
                avatar VARCHAR(255),
                phone VARCHAR(20),
                password VARCHAR(64),
                is_admin TINYINT(1) DEFAULT 0,
                is_active TINYINT(1) DEFAULT 0,
                family_id INT,
                invited_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createFamiliesTable = `
            CREATE TABLE IF NOT EXISTS families (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(64) DEFAULT '我的家庭',
                invite_code VARCHAR(16),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createChildrenTable = `
            CREATE TABLE IF NOT EXISTS children (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(64) NOT NULL,
                birthday DATE,
                gender ENUM('male', 'female'),
                avatar VARCHAR(255),
                family_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_family (family_id)
            )
        `;

        const createRecordsTable = `
            CREATE TABLE IF NOT EXISTS records (
                id INT PRIMARY KEY AUTO_INCREMENT,
                child_id INT NOT NULL,
                user_id INT NOT NULL,
                openid VARCHAR(64) NOT NULL,
                type ENUM('sleep', 'eat', 'play', 'study', 'supplement', 'milestone') NOT NULL,
                content TEXT,
                duration INT,
                value DECIMAL(10,2),
                emotion VARCHAR(32),
                images JSON,
                recorded_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_openid_date (openid, recorded_at),
                INDEX idx_child_date (child_id, recorded_at),
                FOREIGN KEY (child_id) REFERENCES children(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `;

        const createFamilyMembersTable = `
            CREATE TABLE IF NOT EXISTS family_members (
                id INT PRIMARY KEY AUTO_INCREMENT,
                family_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('father', 'mother', 'grandpa', 'grandma', 'grandpa_m', 'grandma_m', 'uncle', 'aunt', 'other'),
                is_admin TINYINT(1) DEFAULT 0,
                status ENUM('pending', 'active') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_family_user (family_id, user_id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (family_id) REFERENCES families(id)
            )
        `;

        const createAlbumPhotosTable = `
            CREATE TABLE IF NOT EXISTS album_photos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                child_id INT NOT NULL,
                user_id INT NOT NULL,
                openid VARCHAR(64) NOT NULL,
                url VARCHAR(512) NOT NULL,
                description TEXT,
                qiniu_key VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_child_date (child_id, created_at),
                INDEX idx_openid (openid)
            )
        `;

        await this.connection.query(createUsersTable);
        await this.connection.query(createChildrenTable);
        await this.connection.query(createRecordsTable);
        await this.connection.query(createFamilyMembersTable);
        await this.connection.query(createAlbumPhotosTable);

        console.log('数据表创建成功');

        // 插入默认孩子数据（如果不存在）
        const [children] = await this.connection.query('SELECT * FROM children WHERE name = ?', ['郭路谦']);
        if (children.length === 0) {
            await this.connection.query(
                'INSERT INTO children (name, birthday, gender) VALUES (?, ?, ?)',
                ['郭路谦', '2026-01-01', 'male']
            );
            console.log('默认孩子数据创建成功');
        }
    }

    // 格式化日期为 MySQL datetime 格式
    formatDateForMySQL(date) {
        if (!date) return new Date();
        const d = new Date(date);
        return d.toISOString().slice(0, 19).replace('T', ' ');
    }

    // 保存记录
    async saveRecord(record) {
        const { openid, child_id, type, content, duration, value, emotion, recorded_at } = record;
        
        // 获取或创建用户
        const [users] = await this.connection.query('SELECT id FROM users WHERE openid = ?', [openid]);
        let userId;
        
        if (users.length === 0) {
            const [result] = await this.connection.query('INSERT INTO users (openid) VALUES (?)', [openid]);
            userId = result.insertId;
        } else {
            userId = users[0].id;
        }

        // 插入记录
        const sql = `
            INSERT INTO records (child_id, user_id, openid, type, content, duration, value, emotion, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await this.connection.query(sql, [
            child_id || 1,
            userId,
            openid,
            type,
            content,
            duration,
            value,
            emotion,
            this.formatDateForMySQL(recorded_at)
        ]);

        return result.insertId;
    }

    // 获取记录
    async getRecords(childId, date, openid = null) {
        // 只按 child_id + date 查询（忽略 openid）
        const sql = `
            SELECT * FROM records 
            WHERE child_id = ? AND DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) = ?
            ORDER BY recorded_at DESC
        `;
        
        const [records] = await this.connection.query(sql, [childId, date]);
        return records;
    }

    // 获取所有记录（分页）
    async getAllRecords(openid, options = {}) {
        const { page = 1, limit = 15, child_id = null } = options;
        const offset = (page - 1) * limit;
        
        let sql, countSql, params;
        
        if (child_id) {
            // 只按 child_id 查询（忽略 openid）
            sql = `
                SELECT * FROM records 
                WHERE child_id = ?
                ORDER BY recorded_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
            countSql = `
                SELECT COUNT(*) as total FROM records 
                WHERE child_id = ?
            `;
            params = [child_id];
        } else {
            sql = `
                SELECT * FROM records 
                WHERE openid = ?
                ORDER BY recorded_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
            countSql = `
                SELECT COUNT(*) as total FROM records 
                WHERE openid = ?
            `;
            params = [openid];
        }
        
        const [records] = await this.connection.query(sql, params);
        
        const [countResult] = await this.connection.query(countSql, params);
        
        return {
            records,
            total: countResult[0].total,
            page,
            limit,
            hasMore: offset + records.length < countResult[0].total
        };
    }

    // 获取某个孩子的所有记录
    async getChildRecords(childId, startDate, endDate) {
        const sql = `
            SELECT * FROM records 
            WHERE child_id = ? AND recorded_at BETWEEN ? AND ?
            ORDER BY recorded_at DESC
        `;
        
        const [records] = await this.connection.query(sql, [childId, startDate, endDate]);
        return records;
    }

    // 根据 ID 获取单条记录
    async getRecordById(id) {
        const sql = 'SELECT * FROM records WHERE id = ?';
        const [records] = await this.connection.query(sql, [id]);
        return records[0] || null;
    }

    // 更新记录
    async updateRecord(id, data) {
        const { content, duration, value, emotion, recorded_at } = data;
        const sql = `
            UPDATE records 
            SET content = ?, duration = ?, value = ?, emotion = ?, recorded_at = ?
            WHERE id = ?
        `;
        
        const [result] = await this.connection.query(sql, [content, duration, value, emotion, recorded_at, id]);
        return result.affectedRows;
    }

    // 删除记录
    async deleteRecord(id) {
        const sql = 'DELETE FROM records WHERE id = ?';
        const [result] = await this.connection.query(sql, [id]);
        return result.affectedRows;
    }

    // 获取所有孩子
    async getChildren(openid) {
        // 先获取用户所在的家庭ID
        const [users] = await this.connection.query(
            'SELECT family_id FROM users WHERE openid = ?',
            [openid]
        );
        
        let children;
        if (users.length > 0 && users[0].family_id) {
            // 根据家庭ID获取孩子
            [children] = await this.connection.query(
                'SELECT * FROM children WHERE family_id = ?',
                [users[0].family_id]
            );
        }
        
        // 如果没有关联数据，返回所有孩子
        if (!children || children.length === 0) {
            const [allChildren] = await this.connection.query('SELECT * FROM children');
            return allChildren;
        }
        return children;
    }

    // 添加孩子
    async addChild(data) {
        const { name, birthday, gender, avatar } = data;
        const sql = 'INSERT INTO children (name, birthday, gender, avatar) VALUES (?, ?, ?, ?)';
        const [result] = await this.connection.query(sql, [name, birthday, gender, avatar]);
        return result.insertId;
    }

    // 更新孩子
    async updateChild(id, data) {
        const { name, birthday, gender, avatar } = data;
        const sql = 'UPDATE children SET name = ?, birthday = ?, gender = ?, avatar = ? WHERE id = ?';
        const [result] = await this.connection.query(sql, [name, birthday, gender, avatar, id]);
        return result.affectedRows;
    }

    // 删除孩子
    async deleteChild(id) {
        // 先删除孩子的相关记录
        await this.connection.query('DELETE FROM records WHERE child_id = ?', [id]);
        await this.connection.query('DELETE FROM album_photos WHERE child_id = ?', [id]);
        // 删除孩子
        const [result] = await this.connection.query('DELETE FROM children WHERE id = ?', [id]);
        return result.affectedRows;
    }

    // 获取家庭成员
    async getFamilyMembers(childId) {
        const sql = `
            SELECT fm.*, u.nickname, u.avatar, u.openid 
            FROM family_members fm
            LEFT JOIN users u ON fm.user_id = u.id
            WHERE fm.child_id = ?
        `;
        const [members] = await this.connection.query(sql, [childId]);
        return members;
    }

    // 添加家庭成员
    async addFamilyMember(data) {
        const { child_id, user_id, role, openid } = data;
        
        // 如果只提供了 openid，先获取或创建用户
        let userId = user_id;
        if (openid && !userId) {
            const [users] = await this.connection.query('SELECT id FROM users WHERE openid = ?', [openid]);
            if (users.length === 0) {
                const [result] = await this.connection.query('INSERT INTO users (openid) VALUES (?)', [openid]);
                userId = result.insertId;
            } else {
                userId = users[0].id;
            }
        }
        
        const sql = 'INSERT INTO family_members (child_id, user_id, role) VALUES (?, ?, ?)';
        const [result] = await this.connection.query(sql, [child_id, userId, role]);
        return result.insertId;
    }

    // 更新家庭成员
    async updateFamilyMember(id, data) {
        const { role } = data;
        const sql = 'UPDATE family_members SET role = ? WHERE id = ?';
        const [result] = await this.connection.query(sql, [role, id]);
        return result.affectedRows;
    }

    // 删除家庭成员
    async deleteFamilyMember(id) {
        const sql = 'DELETE FROM family_members WHERE id = ?';
        const [result] = await this.connection.query(sql, [id]);
        return result.affectedRows;
    }

    // 获取今日概览
    async getTodayOverview(childId, date, openid = null) {
        // 使用传入的日期（已经是本地日期）
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        console.log('[DB] getTodayOverview date:', targetDate, 'childId:', childId);
        
        // 只按 child_id 查询（忽略 openid）
        const sql = `
            SELECT type, COUNT(*) as count, SUM(duration) as total_duration, SUM(value) as total_value
            FROM records 
            WHERE child_id = ? AND DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) = ?
            GROUP BY type
        `;
        const [stats] = await this.connection.query(sql, [childId, targetDate]);
        
        console.log('[DB] getTodayOverview stats:', stats);
        
        // 转换为对象格式
        const overview = {
            sleep: { count: 0, duration: 0 },
            eat: { count: 0, duration: 0, total_value: 0 },
            play: { count: 0, duration: 0 },
            study: { count: 0, duration: 0 },
            supplement: { count: 0 },
            milestone: { count: 0 }
        };
        
        stats.forEach(item => {
            if (overview[item.type]) {
                overview[item.type].count = item.count;
                overview[item.type].duration = item.total_duration || 0;
                overview[item.type].total_value = item.total_value || 0;
            }
        });
        
        return overview;
    }

    // 获取成长曲线数据
    async getGrowthCurve(childId, type, startDate, endDate) {
        const sql = `
            SELECT DATE(recorded_at) as date, 
                   AVG(value) as avg_value,
                   COUNT(*) as count
            FROM records 
            WHERE child_id = ? AND type = ? AND recorded_at BETWEEN ? AND ?
            GROUP BY DATE(recorded_at)
            ORDER BY date
        `;
        const [data] = await this.connection.query(sql, [childId, type, startDate, endDate]);
        return data;
    }

    // 获取周报数据
    async getWeeklyReport(childId, weekStartDate, openid = null) {
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        
        // 只按 child_id 查询（忽略 openid）
        const sql = `
            SELECT type, COUNT(*) as count, SUM(duration) as total_duration
            FROM records 
            WHERE child_id = ? 
            AND DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) BETWEEN ? AND ?
            GROUP BY type
        `;
        const [stats] = await this.connection.query(sql, [childId, weekStartDate, weekEndDate.toISOString().split('T')[0]]);
        
        // 获取每日详情（包含睡眠时长）
        const dailySql = `
            SELECT DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) as date, type, COUNT(*) as count, SUM(duration) as total_duration
            FROM records 
            WHERE child_id = ? 
            AND DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) BETWEEN ? AND ?
            GROUP BY DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')), type
            ORDER BY date, type
        `;
        const [daily] = await this.connection.query(dailySql, [childId, weekStartDate, weekEndDate.toISOString().split('T')[0]]);
        
        return { summary: stats, daily };
    }

    // 获取月报数据
    async getMonthlyReport(childId, startDate, endDate, openid = null) {
        // 只按 child_id 查询（忽略 openid）
        const sql = `
            SELECT type, COUNT(*) as count, SUM(duration) as total_duration
            FROM records 
            WHERE child_id = ? 
            AND DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) BETWEEN ? AND ?
            GROUP BY type
        `;
        const [stats] = await this.connection.query(sql, [childId, startDate, endDate]);
        
        // 获取每日详情（包含睡眠时长）
        const dailySql = `
            SELECT DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) as date, type, COUNT(*) as count, SUM(duration) as total_duration
            FROM records 
            WHERE child_id = ? 
            AND DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')) BETWEEN ? AND ?
            GROUP BY DATE(CONVERT_TZ(recorded_at, '+00:00', '+08:00')), type
            ORDER BY date, type
        `;
        const [daily] = await this.connection.query(dailySql, [childId, startDate, endDate]);
        
        return { summary: stats, daily };
    }

    // 获取用户信息
    async getUserInfo(openid) {
        const [users] = await this.connection.query('SELECT * FROM users WHERE openid = ?', [openid]);
        if (users.length === 0) {
            // 创建新用户
            const [result] = await this.connection.query('INSERT INTO users (openid) VALUES (?)', [openid]);
            return { id: result.insertId, openid };
        }
        return users[0];
    }

    // 更新用户信息
    async updateUserInfo(openid, data) {
        const { nickname, avatar } = data;
        const sql = 'UPDATE users SET nickname = ?, avatar = ? WHERE openid = ?';
        const [result] = await this.connection.query(sql, [nickname, avatar, openid]);
        return result.affectedRows;
    }

    // 获取用户当前抚养的孩子
    async getCurrentChild(openid) {
        const [users] = await this.connection.query(
            'SELECT current_child_id FROM users WHERE openid = ?',
            [openid]
        );
        if (users.length === 0 || !users[0].current_child_id) {
            return null;
        }
        const [children] = await this.connection.query(
            'SELECT * FROM children WHERE id = ?',
            [users[0].current_child_id]
        );
        return children.length > 0 ? children[0] : null;
    }

    // 设置用户当前抚养的孩子
    async setCurrentChild(openid, childId) {
        const sql = 'UPDATE users SET current_child_id = ? WHERE openid = ?';
        const [result] = await this.connection.query(sql, [childId, openid]);
        return result.affectedRows;
    }

    // 获取相册照片
    async getAlbumPhotos(childId) {
        const sql = `
            SELECT * FROM album_photos 
            WHERE child_id = ?
            ORDER BY created_at DESC
            LIMIT 100
        `;
        const [photos] = await this.connection.query(sql, [childId]);
        return photos;
    }

    // 添加相册照片
    async addAlbumPhoto(data) {
        const { child_id, user_id, openid, url, description, qiniu_key } = data;
        
        // 获取或创建用户
        let userId = user_id;
        if (openid && !userId) {
            const [users] = await this.connection.query('SELECT id FROM users WHERE openid = ?', [openid]);
            if (users.length === 0) {
                const [result] = await this.connection.query('INSERT INTO users (openid) VALUES (?)', [openid]);
                userId = result.insertId;
            } else {
                userId = users[0].id;
            }
        }

        const sql = `
            INSERT INTO album_photos (child_id, user_id, openid, url, description, qiniu_key)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await this.connection.query(sql, [child_id, userId, openid, url, description, qiniu_key]);
        return result.insertId;
    }

    // 删除相册照片
    async deleteAlbumPhoto(id) {
        const sql = 'DELETE FROM album_photos WHERE id = ?';
        const [result] = await this.connection.query(sql, [id]);
        return result.affectedRows;
    }

    // 关闭连接
    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = new Database();
