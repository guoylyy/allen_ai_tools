/**
 * 宝宝成长日报机器人 - 企业微信版
 * 使用企业微信API发送消息
 */

const cron = require('node-cron');
const dotenv = require('dotenv');
const https = require('https');
const http = require('http');
const Database = require('./database');
const ReportService = require('./reportService');

dotenv.config();

// 配置
const CONFIG = {
    reportHour: parseInt(process.env.REPORT_HOUR || '8'),
    reportMinute: parseInt(process.env.REPORT_MINUTE || '0'),
    corpId: process.env.WECOM_CORP_ID,
    corpSecret: process.env.WECOM_CORP_SECRET,
    agentId: process.env.WECOM_AGENT_ID,
    db: Database
};

let accessToken = null;
let tokenExpireTime = 0;

/**
 * 获取企业微信AccessToken
 */
async function getAccessToken() {
    // 检查缓存的token是否有效
    if (accessToken && Date.now() < tokenExpireTime) {
        return accessToken;
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CONFIG.corpId}&corpsecret=${CONFIG.corpSecret}`;
    
    try {
        const response = await httpGet(url);
        const data = JSON.parse(response);
        
        if (data.errcode === 0) {
            accessToken = data.access_token;
            tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000; // 提前5分钟过期
            console.log('✅ 获取企业微信AccessToken成功');
            return accessToken;
        } else {
            console.error('❌ 获取AccessToken失败:', data.errmsg);
            return null;
        }
    } catch (error) {
        console.error('❌ 获取AccessToken异常:', error.message);
        return null;
    }
}

/**
 * 发送应用消息到用户
 */
async function sendToUser(userId, content) {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('无法获取AccessToken');
    }

    const postData = JSON.stringify({
        "touser": userId,
        "msgtype": "text",
        "agentid": CONFIG.agentId,
        "text": {
            "content": content
        }
    });

    const options = {
        hostname: 'qyapi.weixin.qq.com',
        path: `/cgi-bin/message/send?access_token=${token}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.errcode === 0) {
                    resolve(true);
                } else {
                    reject(new Error(result.errmsg || '发送失败'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * 发送应用消息到群聊
 */
async function sendToGroupChat(groupChatId, content) {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('无法获取AccessToken');
    }

    const postData = JSON.stringify({
        "chatid": groupChatId,
        "msgtype": "text",
        "text": {
            "content": content
        }
    });

    const options = {
        hostname: 'qyapi.weixin.qq.com',
        path: `/cgi-bin/appchat/send?access_token=${token}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.errcode === 0) {
                    resolve(true);
                } else {
                    reject(new Error(result.errmsg || '发送失败'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * HTTP GET 请求
 */
function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * 生成并发送日报
 */
async function sendDailyReport() {
    console.log('📊 开始生成并发送日报...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    try {
        const children = await CONFIG.db.getChildren();
        
        if (!children || children.length === 0) {
            console.log('⚠️ 没有找到孩子数据');
            return;
        }
        
        let allReportsText = '';
        
        for (const child of children) {
            const records = await CONFIG.db.getRecordsByDate(child.id, dateStr);
            const report = ReportService.generateDailyReport(records, child.name);
            const reportText = ReportService.formatReportAsText(report, dateStr);
            allReportsText += '\n\n' + reportText;
        }
        
        console.log('📝 日报内容长度:', allReportsText.length);
        
        // 发送到企业微信（这里需要配置接收人）
        // 可以发送到指定用户或群聊
        // 用户ID需要在企业微信后台获取
        
        // 示例：发送到应用消息
        // await sendToUser('user_id', allReportsText);
        
        console.log('📊 日报生成完成');
        console.log('⚠️ 请配置企业微信用户ID才能发送');
        console.log('日报内容预览:\n', allReportsText.substring(0, 200) + '...');
        
    } catch (error) {
        console.error('❌ 生成或发送日报失败:', error.message);
    }
}

/**
 * 启动定时任务
 */
function startScheduledTask() {
    const cronExpression = `${CONFIG.reportMinute} ${CONFIG.reportHour} * * *`;
    
    console.log(`⏰ 定时任务已启动: ${cronExpression}`);
    
    cron.schedule(cronExpression, async () => {
        console.log('⏰ 定时任务触发: 发送日报');
        await sendDailyReport();
    });
}

/**
 * 主函数
 */
async function main() {
    console.log('========================================');
    console.log('🤖 宝宝成长日报机器人 - 企业微信版');
    console.log('========================================');
    
    // 检查配置
    if (!CONFIG.corpId || CONFIG.corpId === 'your_corp_id') {
        console.error('❌ 请先配置企业微信参数！');
        console.log('请编辑 .env 文件，配置以下参数：');
        console.log('  WECOM_CORP_ID: 企业ID');
        console.log('  WECOM_CORP_SECRET: 应用Secret');
        console.log('  WECOM_AGENT_ID: 应用AgentID');
        process.exit(1);
    }
    
    // 初始化数据库
    const dbConnected = await CONFIG.db.initialize();
    if (!dbConnected) {
        console.error('❌ 数据库连接失败，程序退出');
        process.exit(1);
    }
    
    // 测试获取token
    const token = await getAccessToken();
    if (!token) {
        console.error('❌ 无法获取企业微信AccessToken，请检查配置');
        process.exit(1);
    }
    
    // 启动定时任务
    startScheduledTask();
    
    console.log('========================================');
    console.log('✅ 机器人已启动');
    console.log('⏰ 定时发送时间: 每天', CONFIG.reportHour + ':' + CONFIG.reportMinute.toString().padStart(2, '0'));
    console.log('========================================');
    
    // 立即发送一次测试
    console.log('\n📤 发送测试日报...');
    await sendDailyReport();
}

main().catch(error => {
    console.error('❌ 程序启动失败:', error);
    process.exit(1);
});
