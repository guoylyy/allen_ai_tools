/**
 * 微信机器人 - 每日Baby成长日报推送
 * 使用 Wechaty + wechat4u 实现个人微信登录
 */

const { WechatyBuilder, ScanStatus, log } = require('wechaty');
const qrcodeTerminal = require('qrcode-terminal');
const cron = require('node-cron');
const dotenv = require('dotenv');

const Database = require('./database');
const ReportService = require('./reportService');

dotenv.config();

// 配置
const CONFIG = {
    // 发送时间：每天早上8点
    reportHour: parseInt(process.env.REPORT_HOUR || '8'),
    reportMinute: parseInt(process.env.REPORT_MINUTE || '0'),
    // 微信群名称（支持多个，用逗号分隔）
    groupNames: (process.env.WECHAT_GROUP_NAMES || '宝宝成长记录,家庭群').split(',').map(s => s.trim()),
    // 数据库
    db: Database
};

// 全局变量
let bot = null;
let targetGroups = [];
let isReady = false;

/**
 * 初始化微信机器人
 */
async function initBot() {
    console.log('🤖 初始化微信机器人...');
    
    // 创建 puppet
    const { PuppetWechat4u } = require('wechaty-puppet-wechat4u');
    const puppet = new PuppetWechat4u();
    
    // 创建 bot
    bot = WechatyBuilder.build({
        name: 'baby-growth-bot',
        puppet: puppet
    });

    // 扫描二维码登录
    bot.on('scan', (qrcode, status) => {
        if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
            qrcodeTerminal.generate(qrcode, {
                small: true
            });
            console.log('⚠️ 请使用微信扫描上方二维码登录');
            console.log('🔗 扫码地址: https://wechaty.js.org/qrcode/' + encodeURIComponent(qrcode));
        }
    });

    // 登录成功
    bot.on('login', user => {
        console.log(`✅ 微信登录成功: ${user.name()}`);
        console.log(`📋 将向以下群发送日报: ${CONFIG.groupNames.join(', ')}`);
        console.log(`⏰ 定时发送时间: 每天 ${CONFIG.reportHour}:${CONFIG.reportMinute.toString().padStart(2, '0')}`);
        isReady = true;
        
        // 登录后延迟查找群
        setTimeout(async () => {
            await findTargetGroups();
        }, 5000);
    });

    // 登出
    bot.on('logout', user => {
        console.log(`❌ 微信登出: ${user.name()}`);
        isReady = false;
    });

    // 错误处理
    bot.on('error', error => {
        const msg = error.message || '';
        if (msg.includes('1101') || msg.includes('1102') || msg.includes('1205')) {
            return; // 忽略协议限制错误
        }
        console.error('❌ 机器人错误:', error.message);
    });
    
    // puppet 错误处理
    bot.on('puppet-error', error => {
        const msg = error.message || '';
        if (msg.includes('1101') || msg.includes('1102') || msg.includes('1205')) {
            return;
        }
        console.error('❌ Puppet错误:', msg);
    });

    // 消息处理
    bot.on('message', async msg => {
        try {
            await handleMessage(msg);
        } catch (error) {
            console.error('❌ 消息处理错误:', error.message);
        }
    });

    // 启动机器人
    await bot.start();
}

/**
 * 查找目标群
 */
async function findTargetGroups() {
    console.log('🔍 正在查找目标微信群...');
    targetGroups = [];
    
    try {
        const contactList = await bot.Contact.findAll();
        
        for (const groupName of CONFIG.groupNames) {
            let foundGroup = null;
            
            for (const contact of contactList) {
                if (contact.type() === bot.Contact.Type.Room) {
                    try {
                        const topic = await contact.topic();
                        if (topic === groupName) {
                            foundGroup = contact;
                            break;
                        }
                    } catch (e) {}
                }
            }
            
            if (foundGroup) {
                targetGroups.push(foundGroup);
                try {
                    const topic = await foundGroup.topic();
                    console.log(`✅ 找到群: ${topic || groupName}`);
                } catch (e) {
                    console.log(`✅ 找到群: ${groupName}`);
                }
            } else {
                console.log(`⚠️ 未找到群: ${groupName}`);
            }
        }
        
        if (targetGroups.length === 0) {
            console.log('⚠️ 未找到任何目标群，将使用文件传输助手');
        }
    } catch (error) {
        console.error('❌ 查找群失败:', error.message);
    }
}

/**
 * 处理消息
 */
async function handleMessage(msg) {
    const contact = msg.talker();
    const room = msg.room();
    const text = msg.text();
    
    if (room) return;
    if (msg.self()) return;
    
    if (text === '日报' || text === '报告' || text === '测试') {
        console.log(`📝 收到手动发送日报请求`);
        await sendDailyReport();
        await msg.say('✅ 日报已发送！');
    } else if (text === '状态' || text === 'status') {
        const status = getBotStatus();
        await msg.say(status);
    }
}

/**
 * 获取机器人状态
 */
function getBotStatus() {
    let status = '🤖 宝宝成长日报机器人状态\n\n';
    status += `📋 目标群: ${CONFIG.groupNames.join(', ')}\n`;
    status += `⏰ 发送时间: 每天 ${CONFIG.reportHour}:${CONFIG.reportMinute.toString().padStart(2, '0')}\n`;
    status += `✅ 群数量: ${targetGroups.length}\n`;
    status += `\n💡 发送"日报"可手动触发发送`;
    return status;
}

/**
 * 发送日报
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
        
        // 优先尝试发送到文件传输助手
        try {
            const fileHelper = await bot.Contact.find('filehelper');
            if (fileHelper) {
                await fileHelper.say(allReportsText);
                console.log('✅ 日报已发送到文件传输助手');
            }
        } catch (e) {
            console.log('⚠️ 文件传输助手发送失败:', e.message);
        }
        
        // 发送到微信群
        if (targetGroups.length > 0) {
            for (const group of targetGroups) {
                try {
                    const topic = await group.topic();
                    await group.say(allReportsText);
                    console.log(`✅ 日报已发送到群: ${topic}`);
                } catch (error) {
                    console.error(`❌ 发送到群失败:`, error.message);
                }
            }
        }
        
        console.log('📊 日报发送完成');
        
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
    console.log('🤖 宝宝成长日报微信机器人启动中...');
    console.log('========================================');
    
    const dbConnected = await CONFIG.db.initialize();
    if (!dbConnected) {
        console.error('❌ 数据库连接失败，程序退出');
        process.exit(1);
    }
    
    await initBot();
    startScheduledTask();
    
    console.log('========================================');
    console.log('✅ 机器人已启动，等待微信登录...');
    console.log('📝 发送"日报"可手动测试');
    console.log('========================================');
}

process.on('SIGINT', async () => {
    console.log('\n👋 正在关闭机器人...');
    if (bot) {
        await bot.stop();
    }
    await CONFIG.db.close();
    process.exit(0);
});

main().catch(error => {
    console.error('❌ 程序启动失败:', error);
    process.exit(1);
});
