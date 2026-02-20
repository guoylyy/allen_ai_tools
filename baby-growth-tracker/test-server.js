const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3000;
const WECHAT_TOKEN = process.env.WECHAT_TOKEN || 'test_token';

// 内存数据库（测试用）
const records = [];

// 中间件
app.use(express.json());
app.use(express.text({ type: 'application/xml' }));

// 微信验证路由
app.get('/wechat', (req, res) => {
    const { echostr, signature, timestamp, nonce } = req.query;
    
    console.log('微信验证请求:', req.query);
    
    // 验证签名
    const sha1 = crypto.createHash('sha1');
    const arr = [WECHAT_TOKEN, timestamp, nonce].sort();
    const hash = sha1.update(arr.join('')).digest('hex');
    
    if (hash === signature) {
        console.log('微信验证成功');
        res.send(echostr);
    } else {
        console.log('微信验证失败');
        res.send('验证失败');
    }
});

// 微信消息接收路由
app.post('/wechat', async (req, res) => {
    try {
        const xmlData = req.body;
        console.log('\n========== 收到微信消息 ==========');
        console.log(xmlData);
        
        // 简单解析 XML
        const message = parseSimpleXML(xmlData);
        console.log('\n解析后的消息:', message);
        
        // 处理消息
        const reply = await handleMessage(message);
        console.log('\n回复消息:', reply);
        console.log('=====================================\n');
        
        // 返回 XML 回复
        res.send(formatXML(reply));
    } catch (error) {
        console.error('处理消息失败:', error);
        res.send('');
    }
});

// 简单 XML 解析
function parseSimpleXML(xml) {
    const result = {};
    const matches = xml.match(/<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>/g);
    
    if (matches) {
        matches.forEach(match => {
            const keyMatch = match.match(/<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>/);
            if (keyMatch) {
                result[keyMatch[1]] = keyMatch[2];
            }
        });
    }
    
    // 处理非 CDATA 的字段
    const simpleMatches = xml.match(/<(\w+)>([^<]+)<\/\1>/g);
    if (simpleMatches) {
        simpleMatches.forEach(match => {
            const keyMatch = match.match(/<(\w+)>([^<]+)<\/\1>/);
            if (keyMatch) {
                result[keyMatch[1]] = keyMatch[2];
            }
        });
    }
    
    return result;
}

// 格式化 XML 回复
function formatXML(reply) {
    const { ToUserName, FromUserName, MsgType, Content } = reply;
    
    return `
<xml>
    <ToUserName><![CDATA[${ToUserName}]]></ToUserName>
    <FromUserName><![CDATA[${FromUserName}]]></FromUserName>
    <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
    <MsgType><![CDATA[${MsgType}]]></MsgType>
    <Content><![CDATA[${Content}]]></Content>
</xml>
    `.trim();
}

// 处理消息
async function handleMessage(message) {
    const { FromUserName, ToUserName, MsgType, Content, Event, EventKey } = message;

    // 文本消息
    if (MsgType === 'text') {
        return await handleTextMessage(FromUserName, ToUserName, Content);
    }

    // 事件消息
    if (MsgType === 'event') {
        if (Event === 'subscribe') {
            return {
                ToUserName: FromUserName,
                FromUserName: ToUserName,
                MsgType: 'text',
                Content: `欢迎关注路谦成长记！🎉\n\n这是一个记录宝宝成长的小工具，您可以：\n1. 直接输入记录内容（如：睡觉 14:00-16:00）\n2. 点击底部菜单快速记录\n3. 输入「帮助」查看更多功能\n\n让我们一起记录宝宝的成长点滴！`
            };
        }
        
        if (Event === 'CLICK') {
            return handleMenuClick(FromUserName, ToUserName, EventKey);
        }
    }

    // 默认回复
    return {
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        MsgType: 'text',
        Content: '欢迎关注路谦成长记！\n\n请直接输入记录内容，例如：\n- 睡觉 14:00-16:00\n- 吃饭 奶粉 150ml\n- 玩耍 开心 1 小时\n\n输入「帮助」查看更多功能'
    };
}

// 处理文本消息
async function handleTextMessage(fromUser, toUser, content) {
    // 解析记录内容
    const record = parseRecordContent(content);
    
    if (record) {
        // 保存记录到内存
        records.push({
            openid: fromUser,
            ...record,
            recorded_at: new Date()
        });

        return {
            ToUserName: fromUser,
            FromUserName: toUser,
            MsgType: 'text',
            Content: `✓ 记录成功！\n\n类型：${record.type}\n详情：${record.content}\n\n当前共有 ${records.length} 条记录\n输入「查询」查看今日记录`
        };
    }

    // 查询命令
    if (content === '查询' || content === '今天') {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter(r => 
            r.recorded_at.toISOString().startsWith(today) && r.openid === fromUser
        );
        const summary = formatRecordsSummary(todayRecords);
        
        return {
            ToUserName: fromUser,
            FromUserName: toUser,
            MsgType: 'text',
            Content: summary
        };
    }

    // 帮助信息
    if (content === '帮助' || content === 'help') {
        return {
            ToUserName: fromUser,
            FromUserName: toUser,
            MsgType: 'text',
            Content: `📝 路谦成长记 - 使用帮助

快速记录格式：
• 睡觉 14:00-16:00
• 吃饭 奶粉 150ml
• 玩耍 开心 1 小时
• 学习 阅读 30 分钟
• 情绪 开心
• 里程碑 第一次叫妈妈

查询命令：
• 查询 / 今天 - 查看今日记录
• 昨天 - 查看昨日记录

输入任意内容，我会智能识别并记录！`
        };
    }

    // 默认回复
    return {
        ToUserName: fromUser,
        FromUserName: toUser,
        MsgType: 'text',
        Content: '我没太理解，您可以：\n1. 直接输入记录内容（如：睡觉 14:00-16:00）\n2. 输入「查询」查看记录\n3. 输入「帮助」查看更多功能'
    };
}

// 处理菜单点击
function handleMenuClick(fromUser, toUser, eventKey) {
    switch (eventKey) {
        case 'RECORD_SLEEP':
            return {
                ToUserName: fromUser,
                FromUserName: toUser,
                MsgType: 'text',
                Content: '😴 睡觉记录\n\n请直接输入睡觉时间，例如：\n睡觉 14:00-16:00'
            };
        
        case 'RECORD_EAT':
            return {
                ToUserName: fromUser,
                FromUserName: toUser,
                MsgType: 'text',
                Content: '🍼 吃饭记录\n\n请直接输入吃饭内容，例如：\n吃饭 奶粉 150ml\n吃饭 辅食 米粉一碗'
            };
        
        case 'RECORD_PLAY':
            return {
                ToUserName: fromUser,
                FromUserName: toUser,
                MsgType: 'text',
                Content: '🎮 玩耍记录\n\n请直接输入玩耍内容，例如：\n玩耍 开心 在公园玩了 1 小时\n玩耍 室内 搭积木 30 分钟'
            };
        
        case 'TODAY_REPORT':
            const today = new Date().toISOString().split('T')[0];
            const todayRecords = records.filter(r => 
                r.recorded_at.toISOString().startsWith(today) && r.openid === fromUser
            );
            const summary = formatRecordsSummary(todayRecords);
            return {
                ToUserName: fromUser,
                FromUserName: toUser,
                MsgType: 'text',
                Content: summary
            };
        
        default:
            return {
                ToUserName: fromUser,
                FromUserName: toUser,
                MsgType: 'text',
                Content: ''
            };
    }
}

// 解析记录内容
function parseRecordContent(content) {
    // 睡觉记录
    const sleepMatch = content.match(/睡觉\s*(\d{1,2}:\d{2})\s*[-~至]\s*(\d{1,2}:\d{2})/);
    if (sleepMatch) {
        const startTime = sleepMatch[1];
        const endTime = sleepMatch[2];
        const duration = calculateDuration(startTime, endTime);
        return {
            type: 'sleep',
            content: `${startTime}-${endTime}`,
            duration: duration,
            value: null,
            emotion: null
        };
    }

    // 吃饭记录
    const eatMatch = content.match(/吃饭\s*(.+?)(?:\s+(\d+)(ml|克|碗))?/);
    if (eatMatch) {
        return {
            type: 'eat',
            content: eatMatch[1],
            duration: null,
            value: eatMatch[2] ? parseInt(eatMatch[2]) : null,
            emotion: null
        };
    }

    // 玩耍记录
    const playMatch = content.match(/玩耍\s*(开心 | 平静 | 烦躁 | 室内 | 户外)?\s*(.+?)(?:\s+(\d+)\s*(小时 | 分钟))?/);
    if (playMatch) {
        return {
            type: 'play',
            content: playMatch[2],
            duration: playMatch[3] ? parseInt(playMatch[3]) * (playMatch[4] === '小时' ? 60 : 1) : null,
            value: null,
            emotion: playMatch[1]
        };
    }

    // 学习记录
    const studyMatch = content.match(/学习\s*(.+?)(?:\s+(\d+)\s*(小时 | 分钟))?/);
    if (studyMatch) {
        return {
            type: 'study',
            content: studyMatch[1],
            duration: studyMatch[2] ? parseInt(studyMatch[2]) * (studyMatch[3] === '小时' ? 60 : 1) : null,
            value: null,
            emotion: null
        };
    }

    // 情绪记录
    const emotionMatch = content.match(/情绪\s*(开心 | 平静 | 烦躁 | 哭闹)/);
    if (emotionMatch) {
        return {
            type: 'emotion',
            content: emotionMatch[1],
            duration: null,
            value: null,
            emotion: emotionMatch[1]
        };
    }

    return null;
}

// 计算时长（分钟）
function calculateDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
}

// 格式化记录摘要
function formatRecordsSummary(records) {
    if (!records || records.length === 0) {
        return '今天还没有记录哦～\n\n快开始记录宝宝的第一条成长数据吧！';
    }

    const summary = {
        sleep: 0,
        eat: 0,
        play: 0,
        study: 0,
        emotion: []
    };

    records.forEach(record => {
        if (record.type === 'sleep' && record.duration) {
            summary.sleep += record.duration;
        } else if (record.type === 'eat') {
            summary.eat++;
        } else if (record.type === 'play') {
            summary.play++;
        } else if (record.type === 'study' && record.duration) {
            summary.study += record.duration;
        } else if (record.type === 'emotion') {
            summary.emotion.push(record.emotion);
        }
    });

    let text = `📊 今日成长报告\n\n`;
    text += `😴 睡眠：${Math.floor(summary.sleep / 60)}小时${summary.sleep % 60}分钟\n`;
    text += `🍼 饮食：${summary.eat}次\n`;
    text += `🎮 玩耍：${summary.play}次\n`;
    text += `📚 学习：${Math.floor(summary.study / 60)}小时${summary.study % 60}分钟\n`;
    
    if (summary.emotion.length > 0) {
        const emotionCount = {};
        summary.emotion.forEach(e => {
            emotionCount[e] = (emotionCount[e] || 0) + 1;
        });
        text += `\n😊 情绪：${Object.entries(emotionCount).map(([k, v]) => `${k}(${v}次)`).join(', ')}\n`;
    }

    text += `\n记录总数：${records.length}条`;
    
    return text;
}

// API 路由 - 测试用
app.get('/api/records', (req, res) => {
    res.json({ success: true, count: records.length, data: records });
});

app.get('/api/clear', (req, res) => {
    records.length = 0;
    res.json({ success: true, message: '记录已清空' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('\n===========================================');
    console.log('🎉 路谦成长记 - 测试服务器已启动');
    console.log('===========================================');
    console.log(`📍 服务地址：http://localhost:${PORT}`);
    console.log(`🔗 微信回调 URL: http://localhost:${PORT}/wechat`);
    console.log('\n💡 测试命令:');
    console.log('1. 访问 http://localhost:3000/api/records 查看所有记录');
    console.log('2. 访问 http://localhost:3000/api/clear 清空记录');
    console.log('3. 使用 Postman 或其他工具 POST XML 到 /wechat 测试消息处理');
    console.log('===========================================\n');
});
