const xml2js = require('xml2js');
const WechatAPI = require('./api');
const db = require('../database/connection');

class MessageHandler {
    // 解析 XML 消息
    static async parseXML(xml) {
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xml);
        return result.xml;
    }

    // 格式化 XML 回复
    static formatXML(reply) {
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
    static async handle(message) {
        const { FromUserName, ToUserName, MsgType, Content, Event, EventKey } = message;

        // 文本消息
        if (MsgType === 'text') {
            return await this.handleTextMessage(FromUserName, ToUserName, Content);
        }

        // 事件消息（菜单点击、关注等）
        if (MsgType === 'event') {
            return await this.handleEventMessage(FromUserName, ToUserName, Event, EventKey);
        }

        // 默认回复
        return {
            ToUserName: FromUserName,
            FromUserName: ToUserName,
            MsgType: 'text',
            Content: '欢迎关注路谦成长记！\n\n请直接输入记录内容，例如：\n- 睡觉 14:00-16:00\n- 吃饭 奶粉 150ml\n- 玩耍 开心 1 小时'
        };
    }

    // 处理文本消息
    static async handleTextMessage(fromUser, toUser, content) {
        // 解析记录内容
        const record = this.parseRecordContent(content);
        
        if (record) {
            // 保存记录
            await db.saveRecord({
                openid: fromUser,
                child_id: 1, // 默认第一个孩子
                type: record.type,
                content: record.content,
                duration: record.duration,
                value: record.value,
                emotion: record.emotion,
                recorded_at: new Date()
            });

            return {
                ToUserName: fromUser,
                FromUserName: toUser,
                MsgType: 'text',
                Content: `✓ 记录成功！\n\n类型：${record.type}\n详情：${record.content}\n\n输入「查询」查看今日记录`
            };
        }

        // 查询命令
        if (content === '查询' || content === '今天') {
            const records = await db.getRecords(fromUser, new Date().toISOString().split('T')[0]);
            const summary = this.formatRecordsSummary(records);
            
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

    // 处理事件消息
    static async handleEventMessage(fromUser, toUser, event, eventKey) {
        if (event === 'subscribe') {
            return {
                ToUserName: fromUser,
                FromUserName: toUser,
                MsgType: 'text',
                Content: `欢迎关注路谦成长记！🎉

这是一个记录宝宝成长的小工具，您可以：
1. 直接输入记录内容（如：睡觉 14:00-16:00）
2. 点击底部菜单快速记录
3. 输入「帮助」查看更多功能

让我们一起记录宝宝的成长点滴！`
            };
        }

        if (event === 'CLICK') {
            return await this.handleMenuClick(fromUser, toUser, eventKey);
        }

        return {
            ToUserName: fromUser,
            FromUserName: toUser,
            MsgType: 'text',
            Content: ''
        };
    }

    // 处理菜单点击
    static async handleMenuClick(fromUser, toUser, eventKey) {
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
                const records = await db.getRecords(fromUser, new Date().toISOString().split('T')[0]);
                const summary = this.formatRecordsSummary(records);
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
    static parseRecordContent(content) {
        // 睡觉记录
        const sleepMatch = content.match(/睡觉\s*(\d{1,2}:\d{2})\s*[-~至]\s*(\d{1,2}:\d{2})/);
        if (sleepMatch) {
            const startTime = sleepMatch[1];
            const endTime = sleepMatch[2];
            const duration = this.calculateDuration(startTime, endTime);
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
    static calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        return endMinutes - startMinutes;
    }

    // 格式化记录摘要
    static formatRecordsSummary(records) {
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
}

module.exports = MessageHandler;
