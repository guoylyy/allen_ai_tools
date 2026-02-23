const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');
const WechatAPI = require('./wechat/api');
const MessageHandler = require('./wechat/messageHandler');
const ReportService = require('./services/reportService');
const AIService = require('./services/aiService');
const FamilyService = require('./services/familyService');
const db = require('./database/connection');

const familyService = new FamilyService(db);

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// 微信配置
const WECHAT_TOKEN = process.env.WECHAT_TOKEN;

// 中间件
app.use(express.json());
app.use(express.text({ type: 'application/xml' }));

// 微信验证路由
app.get('/wechat', (req, res) => {
    const { echostr, signature, timestamp, nonce } = req.query;
    
    // 验证签名
    const sha1 = crypto.createHash('sha1');
    const arr = [WECHAT_TOKEN, timestamp, nonce].sort();
    const hash = sha1.update(arr.join('')).digest('hex');
    
    if (hash === signature) {
        res.send(echostr);
    } else {
        res.send('验证失败');
    }
});

// 微信消息接收路由
app.post('/wechat', async (req, res) => {
    try {
        const xmlData = req.body;
        console.log('收到微信消息:', xmlData);
        
        // 解析 XML 消息
        const message = await MessageHandler.parseXML(xmlData);
        console.log('解析后的消息:', message);
        
        // 处理消息
        const reply = await MessageHandler.handle(message);
        console.log('回复消息:', reply);
        
        // 返回 XML 回复
        res.send(MessageHandler.formatXML(reply));
    } catch (error) {
        console.error('处理消息失败:', error);
        res.send('');
    }
});

// ==================== API 路由 ====================

// 统一的 API 响应格式
const apiResponse = (res, success, data = null, message = '') => {
    if (success) {
        res.json({ code: 0, data, message });
    } else {
        res.json({ code: -1, data: null, message });
    }
};

// 获取 openid 的辅助函数（模拟微信登录，实际从微信获取）
const getOpenid = (req) => {
    // 在测试环境使用 header 传递的 openid
    return req.headers['x-openid'] || req.body.openid || 'test_openid';
};

// 中间件：处理 openid
app.use((req, res, next) => {
    req.openid = getOpenid(req);
    next();
});

// ----- 认证相关 -----

// 登录（模拟微信登录，实际需要微信授权）
app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone } = req.body;
        
        let user;
        // 如果提供了手机号，根据手机号查询用户
        if (phone) {
            const [users] = await db.connection.query(
                'SELECT * FROM users WHERE phone = ?',
                [phone]
            );
            if (users.length > 0) {
                user = users[0];
            } else {
                // 创建新用户
                const [result] = await db.connection.query(
                    'INSERT INTO users (openid, phone) VALUES (?, ?)',
                    ['phone_' + phone, phone]
                );
                user = { id: result.insertId, openid: 'phone_' + phone, phone };
            }
        } else {
            // 兼容：如果没有手机号，使用 openid
            user = await db.getUserInfo(req.openid);
        }
        
        const token = 'mock_token_' + user.openid;
        apiResponse(res, true, { user, token }, '登录成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// ----- 用户相关 -----

// 获取用户信息
app.get('/api/user/info', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        apiResponse(res, true, user);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 更新用户信息
app.put('/api/user/info', async (req, res) => {
    try {
        await db.updateUserInfo(req.openid, req.body);
        const user = await db.getUserInfo(req.openid);
        apiResponse(res, true, user, '更新成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// ----- 记录相关 -----

// 查询记录列表
app.get('/api/records', async (req, res) => {
    try {
        const { date, child_id, start_date, end_date, page, limit } = req.query;
        
        console.log('[API] /api/records params:', { date, child_id, start_date, end_date, page, limit });
        console.log('[API] openid:', req.openid);
        
        // 分页查询所有记录
        if (page && limit) {
            const result = await db.getAllRecords(req.openid, {
                page: parseInt(page),
                limit: parseInt(limit),
                child_id: child_id ? parseInt(child_id) : null
            });
            console.log('[API] getAllRecords result:', result.records.length, '条');
            apiResponse(res, true, result);
            return;
        }
        
        let records;
        
        if (date && child_id) {
            // 按孩子和日期查询
            records = await db.getRecords(child_id, date);
        } else if (child_id && start_date && end_date) {
            // 按孩子和时间范围查询
            records = await db.getChildRecords(child_id, start_date, end_date);
        } else {
            // 默认查今天的记录（使用服务器本地日期）
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;
            
            // 获取当前孩子的ID
            let currentChildId = child_id ? parseInt(child_id) : 1;
            const currentChild = await db.getCurrentChild(req.openid);
            if (currentChild && !child_id) {
                currentChildId = currentChild.id;
            }
            
            console.log('[API] 使用本地日期查询:', today, 'childId:', currentChildId);
            records = await db.getRecords(currentChildId, today);
        }
        
        apiResponse(res, true, records);
    } catch (error) {
        console.error('[API] 查询记录失败:', error);
        apiResponse(res, false, null, error.message);
    }
});

// 添加记录
app.post('/api/records', async (req, res) => {
    try {
        const record = {
            ...req.body,
            openid: req.openid
        };
        const id = await db.saveRecord(record);
        apiResponse(res, true, { id }, '记录成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 更新记录
app.put('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, type, duration, amount } = req.body;
        
        // 获取原记录信息
        const originalRecord = await db.getRecordById(id);
        if (!originalRecord) {
            apiResponse(res, false, null, '记录不存在');
            return;
        }
        
        let updateData = {
            recorded_at: originalRecord.recorded_at  // 保留原始记录时间
        };
        
        // 如果提供了新 content，调用 AI 重新解析
        if (content && content !== originalRecord.content) {
            console.log(`[记录修改] 重新解析内容: "${content}"`);
            
            let result = await AIService.parseNaturalLanguage(content.trim());
            
            // 如果 AI 解析失败，降级到本地解析
            if (!result) {
                console.log('[记录修改] AI 解析失败，使用本地解析');
                result = parseNaturalLanguageLocal(content.trim());
            }
            
            // 使用解析结果更新记录（保留原始 recorded_at）
            updateData = {
                type: result.type,
                content: result.content,
                duration: result.duration || 0,
                value: result.value || null,
                recorded_at: originalRecord.recorded_at  // 保留原始记录时间
            };
            
            console.log('[记录修改] 解析结果:', result);
        } else {
            // 直接更新指定字段
            if (type) updateData.type = type;
            if (duration !== undefined) updateData.duration = duration;
            if (amount !== undefined) {
                // 将 amount 转换为 value（兼容 API 参数）
                const amountValue = parseInt(amount);
                updateData.value = isNaN(amountValue) ? null : amountValue;
            }
        }
        
        await db.updateRecord(id, updateData);
        apiResponse(res, true, null, '更新成功');
    } catch (error) {
        console.error('[记录修改] 更新失败:', error);
        apiResponse(res, false, null, error.message);
    }
});

// 删除记录
app.delete('/api/records/:id', async (req, res) => {
    try {
        await db.deleteRecord(req.params.id);
        apiResponse(res, true, null, '删除成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// ----- 报表相关 -----

// 今日概览
app.get('/api/report/today', async (req, res) => {
    try {
        const { child_id, date } = req.query;
        const childId = child_id || 1;
        
        // 如果前端传了日期就用，否则使用服务器本地日期
        const targetDate = date || (() => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })();
        
        console.log('[API] 今日概览日期:', targetDate, 'childId:', childId);
        // 参数顺序：childId, date, openid
        const overview = await db.getTodayOverview(childId, targetDate, req.openid);
        apiResponse(res, true, overview);
    } catch (error) {
        console.error('[API] 今日概览失败:', error);
        apiResponse(res, false, null, error.message);
    }
});

// 成长曲线
app.get('/api/report/growth-curve', async (req, res) => {
    try {
        const { child_id, type, start_date, end_date } = req.query;
        const childId = child_id || 1;
        const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end_date || new Date().toISOString().split('T')[0];
        
        const data = await db.getGrowthCurve(childId, type || 'height', startDate, endDate);
        apiResponse(res, true, data);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 周报
app.get('/api/report/weekly', async (req, res) => {
    try {
        const { child_id, week_start } = req.query;
        const childId = child_id || 1;
        const weekStart = week_start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 参数顺序：childId, weekStart, openid
        const report = await db.getWeeklyReport(childId, weekStart, req.openid);
        apiResponse(res, true, report);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 月报
app.get('/api/report/monthly', async (req, res) => {
    try {
        const { child_id, month } = req.query;
        const childId = child_id || 1;
        
        // 解析月份
        let startDate, endDate;
        if (month) {
            const [year, mon] = month.split('-');
            startDate = new Date(year, parseInt(mon) - 1, 1);
            endDate = new Date(year, parseInt(mon), 0);
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        
        // 参数顺序：childId, startDate, endDate, openid
        const report = await db.getMonthlyReport(childId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], req.openid);
        apiResponse(res, true, report);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// ----- 聊天记录相关（自然语言解析）-----

// 处理聊天消息，解析自然语言为结构化数据
app.post('/api/chat/process', async (req, res) => {
    try {
        const { message } = req.body;
        const openid = req.openid;
        
        console.log(`[聊天处理] 收到消息: "${message}", openid: ${openid}`);
        
        if (!message || !message.trim()) {
            apiResponse(res, false, null, '消息内容不能为空');
            return;
        }
        
        // 使用 AI 解析自然语言
        let result = await AIService.parseNaturalLanguage(message.trim());
        
        // 如果 AI 解析失败，降级到本地解析
        if (!result) {
            console.log('[聊天处理] AI 解析失败，使用本地解析');
            result = parseNaturalLanguageLocal(message.trim());
        } else {
            console.log('[聊天处理] AI 解析成功:', result);
        }
        
        console.log('[聊天处理] 解析结果:', result);
        
        // 保存到数据库
        const record = {
            type: result.type,
            content: result.content,
            recorded_at: result.recorded_at,
            duration: result.duration || 0,
            value: result.value || null,
            child_id: 1, // 默认使用第一个孩子
            openid: openid
        };
        
        console.log('[聊天处理] 准备保存记录:', record);
        
        const id = await db.saveRecord(record);
        result.id = id;
        
        console.log('[聊天处理] 记录保存成功, id:', id);
        
        apiResponse(res, true, result, result.message || '数据已记录');
    } catch (error) {
        console.error('[聊天处理] 处理消息失败:', error);
        apiResponse(res, false, null, '处理失败，请重试');
    }
});

// 辅助函数：解析相对日期（支持昨天、前天、具体日期）
function parseRelativeDate(text) {
    const now = new Date();
    let targetDate = new Date();
    let remainingText = text;
    
    // 解析 "昨天"
    if (text.includes('昨天') || text.includes('昨日')) {
        targetDate.setDate(now.getDate() - 1);
        remainingText = text.replace(/昨天|昨日/g, '').trim();
        console.log(`[日期解析] 识别到昨天`);
    }
    // 解析 "前天"
    else if (text.includes('前天')) {
        targetDate.setDate(now.getDate() - 2);
        remainingText = text.replace(/前天/g, '').trim();
        console.log(`[日期解析] 识别到前天`);
    }
    // 解析 "今天"
    else if (text.includes('今天')) {
        remainingText = text.replace(/今天/g, '').trim();
        console.log(`[日期解析] 识别到今天`);
    }
    
    // 解析具体日期 "3月12日" 或 "3月12"
    const monthDayMatch = remainingText.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    if (monthDayMatch) {
        const month = parseInt(monthDayMatch[1]) - 1;
        const day = parseInt(monthDayMatch[2]);
        targetDate = new Date(now.getFullYear(), month, day);
        remainingText = remainingText.replace(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/, '').trim();
        console.log(`[日期解析] 识别到具体日期: ${month + 1}月${day}日`);
    }
    
    return { date: targetDate, text: remainingText };
}

// 中文数字到阿拉伯数字的映射
const chineseNumberMap = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '半': 30, '刻': 15
};

// 辅助函数：将中文数字转换为阿拉伯数字
function parseChineseNumber(text) {
    // 去除 "分"、"分钟"、"秒" 等单位后缀
    text = text.replace(/分|分钟|秒$/, '');
    
    if (text === '十') return 10;
    if (text === '半') return 30;
    if (text === '刻') return 15;
    
    if (/^\d+$/.test(text)) {
        return parseInt(text);
    }
    
    let result = 0;
    for (const char of text) {
        if (chineseNumberMap[char] !== undefined) {
            result = result * 10 + chineseNumberMap[char];
        }
    }
    return result > 0 ? result : null;
}

// 辅助函数：解析时间（支持各种格式，包括中文数字）
function parseTime(text) {
    let hour = null;
    let minute = 0;
    
    // 处理 "下午X点" 或 "晚上X点" (支持中文数字分钟)
    const afternoonMatch = text.match(/(?:下午|晚上)(\d{1,2})点(?:([一二三四五六七八九十半刻]+)分?)?/);
    if (afternoonMatch) {
        hour = parseInt(afternoonMatch[1]);
        if (hour < 12) hour += 12;
        if (afternoonMatch[2]) {
            minute = parseChineseNumber(afternoonMatch[2]) || 0;
        }
        console.log(`[时间解析] 下午/晚上时间: ${afternoonMatch[0]} -> ${hour}点${minute}分`);
        return { hour, minute };
    }
    
    // 处理 "上午X点" (支持中文数字分钟)
    const morningMatch = text.match(/(?:上午)(\d{1,2})点(?:([一二三四五六七八九十半刻]+)分?)?/);
    if (morningMatch) {
        hour = parseInt(morningMatch[1]);
        if (morningMatch[2]) {
            minute = parseChineseNumber(morningMatch[2]) || 0;
        }
        console.log(`[时间解析] 上午时间: ${morningMatch[0]} -> ${hour}点${minute}分`);
        return { hour, minute };
    }
    
    // 处理纯数字时间 "X点Y分" 或 "X点Y"
    const timeMatch = text.match(/(\d{1,2})点(\d+)/);
    if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = parseInt(timeMatch[2] || '0');
        console.log(`[时间解析] 纯数字时间: ${timeMatch[0]} -> ${hour}点${minute}分`);
        return { hour, minute };
    }
    
    // 处理中文数字时间 "X点Y分" (如 "3点十分", "3点二十分", "3点半")
    const chineseTimeMatch = text.match(/(\d{1,2})点([一二三四五六七八九十半刻]+)/);
    if (chineseTimeMatch) {
        hour = parseInt(chineseTimeMatch[1]);
        minute = parseChineseNumber(chineseTimeMatch[2]) || 0;
        console.log(`[时间解析] 中文数字时间: ${chineseTimeMatch[0]} -> ${hour}点${minute}分`);
        return { hour, minute };
    }
    
    // 处理只有小时没有分钟的情况 "X点"
    const hourOnlyMatch = text.match(/(\d{1,2})点/);
    if (hourOnlyMatch) {
        hour = parseInt(hourOnlyMatch[1]);
        console.log(`[时间解析] 只有小时: ${hourOnlyMatch[0]} -> ${hour}点`);
        return { hour, minute: 0 };
    }
    
    return null;
}

// 辅助函数：创建指定时间的日期对象
function createDateWithTime(hour, minute) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
}

// 辅助函数：解析时长
function parseDuration(text) {
    // 匹配 "X小时Y分钟" 或 "X小时" 或 "Y分钟"
    const hourMinuteMatch = text.match(/(\d+)\s*小时\s*(\d+)\s*分钟/);
    if (hourMinuteMatch) {
        return parseInt(hourMinuteMatch[1]) * 60 + parseInt(hourMinuteMatch[2]);
    }
    
    const hourMatch = text.match(/(\d+)\s*小时/);
    if (hourMatch) {
        return parseInt(hourMatch[1]) * 60;
    }
    
    const minuteMatch = text.match(/(\d+)\s*分钟/);
    if (minuteMatch) {
        return parseInt(minuteMatch[1]);
    }
    
    return null;
}

// 辅助函数：获取本地时间的ISO格式（解决时区问题）
function getLocalISOString(date) {
    const offset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - offset);
    return localTime.toISOString().slice(0, 19).replace('T', ' ');
}

// 本地解析函数（AI 解析失败时的降级方案）- 强制使用当前年份
function parseNaturalLanguageLocal(text) {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 先解析相对日期
    const dateInfo = parseRelativeDate(text);
    
    const result = {
        type: 'general',
        content: text,
        recorded_at: now.toISOString(),
        duration: null,
        value: null,
        message: '数据已记录'
    };
    
    // 创建目标日期：默认使用今天
    let targetDate = new Date();
    
    // 只有当用户明确提到相对日期或具体日期时才改变日期
    // 否则默认使用今天
    const hasRelativeDate = text.includes('昨天') || text.includes('昨日') || 
                           text.includes('前天') || text.includes('今天');
    const hasSpecificDate = dateInfo && dateInfo.date && (
        text.match(/\d{1,2}\s*月\s*\d{1,2}/) ||  // "3月12日"
        text.match(/^\d{1,2}\s*日$/)              // "12日"
    );
    
    if (hasRelativeDate) {
        // 如果用户提到了相对日期
        if (text.includes('昨天') || text.includes('昨日')) {
            targetDate.setDate(now.getDate() - 1);
        } else if (text.includes('前天')) {
            targetDate.setDate(now.getDate() - 2);
        } else if (text.includes('今天')) {
            targetDate.setDate(now.getDate());
        }
    } else if (hasSpecificDate) {
        // 只有当用户明确提到具体日期（如"3月12日"或"12日"）时才使用
        const parsedMonth = dateInfo.date.getMonth();
        const parsedDay = dateInfo.date.getDate();
        targetDate = new Date(currentYear, parsedMonth, parsedDay);
    }
    // else: 默认使用今天，不需要额外处理
    
    const lowerText = text.toLowerCase();
    
    // 解析睡觉 - 优先匹配，因为可能有复杂的时间段
    if (lowerText.includes('睡觉') || lowerText.includes('睡眠') || lowerText.includes('午睡') || lowerText.includes('入睡')) {
        result.type = 'sleep';
        result.typeName = '睡觉';
        result.message = '睡觉数据已记录';
        
        // 优先处理时间段格式 "18点到21点"
        if (text.includes('到') || text.includes('至')) {
            const parts = text.split(/到|至/);
            if (parts.length >= 2) {
                const startTime = parseTime(parts[0]);
                const endTime = parseTime(parts[1]);
                
                if (startTime && endTime) {
                    let duration = endTime.hour - startTime.hour;
                    if (duration < 0) duration += 24;
                    result.duration = duration * 60;
                    targetDate.setHours(startTime.hour, startTime.minute, 0, 0);
                    // 强制使用当前年份并使用本地时间
                    targetDate.setFullYear(currentYear);
                    result.recorded_at = getLocalISOString(targetDate);
                    
                    console.log(`[睡觉记录] 开始时间: ${startTime.hour}点, 结束时间: ${endTime.hour}点, 时长: ${result.duration}分钟`);
                }
            }
        }
        
        // 如果没有匹配到时间段，尝试解析单个时间点
        if (!result.duration) {
            const timeInfo = parseTime(dateInfo.text);
            if (timeInfo) {
                targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
                targetDate.setFullYear(currentYear);
                result.recorded_at = getLocalISOString(targetDate);
                console.log(`[睡觉记录] 时间: ${timeInfo.hour}点${timeInfo.minute ? timeInfo.minute + '分' : ''}`);
            } else {
                // 如果没有识别到具体时间，使用当前时间
                targetDate = new Date();
                targetDate.setFullYear(currentYear);
                result.recorded_at = getLocalISOString(targetDate);
            }
            
            // 解析时长 - 始终调用
            const duration = parseDuration(text);
            if (duration) {
                result.duration = duration;
                console.log(`[睡觉记录] 时长: ${duration}分钟`);
            }
        }
    }
    // 解析吃奶/喝奶 - 需要在"奶"之前匹配"吃奶"
    else if (text.includes('吃奶') || text.includes('喝奶') || text.includes('喂奶') || text.includes('母乳')) {
        result.type = 'eat';
        result.typeName = '吃奶';
        result.message = '吃奶数据已记录';

        // 解析量
        const amountMatch = text.match(/(\d+)\s*ml|(\d+)\s*毫升/);
        if (amountMatch) {
            result.value = parseInt(amountMatch[1]);
            result.message = `吃奶数据已记录 ${result.value}ml`;
        }
        
        // 解析时间
        const timeInfo = parseTime(dateInfo.text);
        if (timeInfo) {
            targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
        } else {
            // 如果没有识别到具体时间，使用当前时间
            targetDate = new Date();
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
        }
    }
    // 解析吃饭/辅食
    else if (text.includes('吃饭') || text.includes('辅食') || text.includes('喝粥') || text.includes('米糊') || text.includes('吃米')) {
        result.type = 'eat';
        result.typeName = '吃饭';
        result.message = '吃饭数据已记录';
        
        // 解析时间
        const timeInfo = parseTime(dateInfo.text);
        if (timeInfo) {
            targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
        } else {
            // 如果没有识别到具体时间，使用当前时间
            targetDate = new Date();
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
        }
    }
    // 解析玩耍
    else if (text.includes('玩耍') || text.includes('玩') || text.includes('游戏') || text.includes('玩具')) {
        result.type = 'play';
        result.typeName = '玩耍';
        result.message = '玩耍数据已记录';
        
        // 解析时间
        const timeInfo = parseTime(dateInfo.text);
        if (timeInfo) {
            targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
            targetDate.setFullYear(currentYear);
        } else {
            // 如果没有识别到具体时间，使用当前时间
            targetDate = new Date();
            targetDate.setFullYear(currentYear);
        }
        
        // 解析时长
        const duration = parseDuration(text);
        if (duration) {
            result.duration = duration;
        }
        
        result.recorded_at = getLocalISOString(targetDate);
    }
    // 解析学习
    else if (text.includes('学习') || text.includes('学') || text.includes('识字') || text.includes('认字') || text.includes('阅读') || text.includes('绘本')) {
        result.type = 'study';
        result.typeName = '学习';
        result.message = '学习数据已记录';
        
        // 解析时间
        const timeInfo = parseTime(dateInfo.text);
        if (timeInfo) {
            targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
        } else {
            // 如果没有识别到具体时间，使用当前时间
            targetDate = new Date();
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
        }
    }
    // 解析辅食/补充营养
    else if (text.includes('辅食') || text.includes('补钙') || text.includes('补锌') || text.includes('补充') || text.includes('营养') || text.includes('维生素') || text.includes('DHA')) {
        result.type = 'supplement';
        result.typeName = '营养补充';
        result.message = '营养补充数据已记录';
        
        // 解析时间
        const timeInfo = parseTime(dateInfo.text);
        if (timeInfo) {
            targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
            console.log(`[营养补充记录] 时间: ${timeInfo.hour}点${timeInfo.minute ? timeInfo.minute + '分' : ''}`);
        } else {
            // 如果没有识别到具体时间，使用当前时间
            targetDate = new Date();
            targetDate.setFullYear(currentYear);
            result.recorded_at = getLocalISOString(targetDate);
        }
    }
    // 解析里程碑
    else if (text.includes('里程碑') || text.includes('第一次') || text.includes('学会') || text.includes('达成')) {
        result.type = 'milestone';
        result.typeName = '里程碑';
        result.message = '里程碑已记录';
        
        // 里程碑也使用当前时间
        targetDate = new Date();
        targetDate.setFullYear(currentYear);
        result.recorded_at = getLocalISOString(targetDate);
    }
    // 如果没有匹配到任何类型，也使用当前时间
    else {
        targetDate = new Date();
        targetDate.setFullYear(currentYear);
        result.recorded_at = getLocalISOString(targetDate);
    }
    
    return result;
}

// ----- 图片上传（七牛云）-----
app.post('/api/upload/image', async (req, res) => {
    try {
        // 注意：Express 的 json 中间件不能处理 multipart/form-data
        // 实际实现需要使用 multer 中间件
        // 这里返回模拟数据，实际应该调用七牛云 SDK
        
        // TODO: 实现七牛云图片上传
        // 1. 使用 multer 接收文件
        // 2. 调用七牛云上传凭证
        // 3. 返回图片URL
        
        // 模拟返回
        const mockUrl = `https://placeholder.com/${Date.now()}.jpg`;
        apiResponse(res, true, { 
            url: mockUrl,
            key: `album/${Date.now()}.jpg`
        }, '上传成功');
    } catch (error) {
        console.error('上传图片失败:', error);
        apiResponse(res, false, null, '上传失败');
    }
});

// ----- 相册相关 -----
app.get('/api/album/photos', async (req, res) => {
    try {
        const { child_id } = req.query;
        const childId = child_id || 1;
        const photos = await db.getAlbumPhotos(childId);
        apiResponse(res, true, photos);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

app.post('/api/album/photos', async (req, res) => {
    try {
        const { url, description, child_id } = req.body;
        const id = await db.addAlbumPhoto({
            url,
            description,
            child_id: child_id || 1,
            openid: req.openid
        });
        apiResponse(res, true, { id }, '添加成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

app.delete('/api/album/photos/:id', async (req, res) => {
    try {
        await db.deleteAlbumPhoto(req.params.id);
        apiResponse(res, true, null, '删除成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// ----- 家庭相关 -----

// 获取或创建家庭
app.post('/api/family/create', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        const family = await familyService.getOrCreateFamily(user.id);
        apiResponse(res, true, family, '家庭创建成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 获取家庭信息
app.get('/api/family/info', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        const family = await familyService.getFamilyInfo(user.id);
        apiResponse(res, true, family);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 获取家庭成员列表
app.get('/api/family/members', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        const members = await familyService.getFamilyMembers(user.id);
        apiResponse(res, true, members);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 添加家庭成员（管理员操作）
app.post('/api/family/members', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        const result = await familyService.addFamilyMember(user.id, req.body);
        apiResponse(res, true, result, `添加成功！默认密码: ${result.defaultPassword}`);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 生成邀请链接
app.post('/api/family/invite-link', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        const { phone } = req.body;
        const result = await familyService.generateInviteLink(user.id, phone);
        apiResponse(res, true, result);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 通过邀请链接激活
app.post('/api/family/activate', async (req, res) => {
    try {
        const { phone, password, inviteCode } = req.body;
        const result = await familyService.activateUserByInvite(phone, password, inviteCode);
        apiResponse(res, true, result, '激活成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 手机号密码登录
app.post('/api/auth/login-phone', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await familyService.loginByPhone(phone, password);
        
        // 检查是否已激活
        if (!user.is_active) {
            apiResponse(res, true, { 
                user, 
                needsActivation: true,
                message: '账号未激活，请使用邀请链接激活' 
            });
            return;
        }
        
        apiResponse(res, true, { 
            user, 
            token: 'phone_token_' + user.id,
            isAdmin: user.is_admin
        }, '登录成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 检查用户是否是管理员
app.get('/api/family/is-admin', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        const isAdmin = await familyService.isFamilyAdmin(user.id);
        apiResponse(res, true, { isAdmin });
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 更新家庭成员角色（管理员操作）
app.put('/api/family/members/:id', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        await familyService.updateMemberRole(user.id, req.params.id, req.body);
        apiResponse(res, true, null, '更新成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 移除家庭成员（管理员操作）
app.delete('/api/family/members/:id', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        await familyService.removeMember(user.id, req.params.id);
        apiResponse(res, true, null, '移除成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 获取孩子列表
app.get('/api/children', async (req, res) => {
    try {
        const children = await db.getChildren(req.openid);
        apiResponse(res, true, children);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 添加孩子
app.post('/api/children', async (req, res) => {
    try {
        const user = await db.getUserInfo(req.openid);
        // 获取用户的家庭ID
        let familyId = null;
        if (user.family_id) {
            familyId = user.family_id;
        } else {
            // 如果用户没有家庭，先创建或获取家庭
            const family = await familyService.getOrCreateFamily(user.id);
            familyId = family.id;
        }
        
        const childData = {
            ...req.body,
            family_id: familyId
        };
        
        const id = await db.addChild(childData);
        apiResponse(res, true, { id }, '添加成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 更新孩子
app.put('/api/children/:id', async (req, res) => {
    try {
        await db.updateChild(req.params.id, req.body);
        apiResponse(res, true, null, '更新成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 删除孩子
app.delete('/api/children/:id', async (req, res) => {
    try {
        await db.deleteChild(req.params.id);
        apiResponse(res, true, null, '删除成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 获取当前孩子
app.get('/api/children/current', async (req, res) => {
    try {
        const child = await db.getCurrentChild(req.openid);
        if (child) {
            apiResponse(res, true, child);
        } else {
            // 如果没有设置当前孩子，返回第一个孩子作为默认
            const children = await db.getChildren(req.openid);
            if (children.length > 0) {
                const firstChild = children[0];
                await db.setCurrentChild(req.openid, firstChild.id);
                apiResponse(res, true, firstChild);
            } else {
                apiResponse(res, false, null, '还没有添加孩子');
            }
        }
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 切换当前孩子
app.post('/api/children/:childId/switch', async (req, res) => {
    try {
        const childId = parseInt(req.params.childId);
        await db.setCurrentChild(req.openid, childId);
        const child = await db.getCurrentChild(req.openid);
        apiResponse(res, true, child, '切换成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 获取家庭成员（旧接口，兼容）
app.get('/api/family/members/legacy', async (req, res) => {
    try {
        const { child_id } = req.query;
        const childId = child_id || 1;
        const members = await db.getFamilyMembers(childId);
        apiResponse(res, true, members);
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 邀请家庭成员（旧接口，兼容）
app.post('/api/family/invite/legacy', async (req, res) => {
    try {
        const id = await db.addFamilyMember(req.body);
        apiResponse(res, true, { id }, '邀请成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 更新家庭成员（旧接口，兼容）
app.put('/api/family/members/:id/legacy', async (req, res) => {
    try {
        await db.updateFamilyMember(req.params.id, req.body);
        apiResponse(res, true, null, '更新成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// 删除家庭成员（旧接口，兼容）
app.delete('/api/family/members/:id/legacy', async (req, res) => {
    try {
        await db.deleteFamilyMember(req.params.id);
        apiResponse(res, true, null, '删除成功');
    } catch (error) {
        apiResponse(res, false, null, error.message);
    }
});

// ==================== 启动服务器 ====================
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`微信回调 URL: ${process.env.SERVER_URL}/wechat`);
    
    // 初始化数据库
    db.initialize();
    
    // 启动定时任务（每日报告）
    ReportService.startDailyReport();
});
