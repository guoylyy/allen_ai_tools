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
        // 格式1: 吃饭90ml, 吃饭150ml (数字紧跟吃饭或只有空格分隔) -> content=null
        // 格式2: 吃饭 辅食 150ml (空格+内容+空格+数字) -> content=辅食
        // 格式3: 吃饭 一碗 (空格+内容，没有数字) -> content=一碗, value=1

        // 先尝试匹配"吃饭 + 数字"格式（数字紧跟吃饭或只有空格分隔）
        const eatMatch = content.match(/吃饭\s*(\d+)(ml|克|碗)?/);
        if (eatMatch) {
            return {
                type: 'eat',
                content: null,
                duration: null,
                value: parseInt(eatMatch[1]),
                emotion: null
            };
        }

        // 尝试匹配"吃饭 + 内容 + 数字"格式（内容后面有空格+数字）
        const eatWithContentMatch = content.match(/吃饭\s+(\S+)\s+(\d+)(ml|克|碗)?/);
        if (eatWithContentMatch) {
            return {
                type: 'eat',
                content: eatWithContentMatch[1],
                duration: null,
                value: parseInt(eatWithContentMatch[2]),
                emotion: null
            };
        }

        // 尝试匹配"吃饭 + 内容 + 数字"格式（内容与数字之间无空格，如：吃饭奶粉90ml）
        const eatNoSpaceMatch = content.match(/吃饭(\D+)(\d+)(ml|克|碗)?/);
        if (eatNoSpaceMatch) {
            return {
                type: 'eat',
                content: eatNoSpaceMatch[1].trim(),
                duration: null,
                value: parseInt(eatNoSpaceMatch[2]),
                emotion: null
            };
        }

        // 尝试匹配"吃饭 + 内容"格式（只有内容，没有数字，如：一碗、奶粉）
        const eatOnlyContentMatch = content.match(/吃饭\s+(.+)/);
        if (eatOnlyContentMatch) {
            // 默认value为1
            return {
                type: 'eat',
                content: eatOnlyContentMatch[1],
                duration: null,
                value: 1,
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

        // 营养补充记录
        const supplementMatch = content.match(/(?:补钙|补锌|补充|营养|维生素|DHA|辅食)\s*(.+?)(?:\s+(\d+)(ml|克|袋|粒))?/i);
        if (supplementMatch) {
            return {
                type: 'supplement',
                content: supplementMatch[1] || content,
                duration: null,
                value: supplementMatch[2] ? parseInt(supplementMatch[2]) : null,
                emotion: null
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
            supplement: 0
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
            } else if (record.type === 'supplement') {
                summary.supplement++;
            }
        });

        let text = `📊 今日成长报告\n\n`;
        text += `😴 睡眠：${Math.floor(summary.sleep / 60)}小时${summary.sleep % 60}分钟\n`;
        text += `🍼 饮食：${summary.eat}次\n`;
        text += `🎮 玩耍：${summary.play}次\n`;
        text += `📚 学习：${Math.floor(summary.study / 60)}小时${summary.study % 60}分钟\n`;
        text += `💊 营养补充：${summary.supplement}次\n`;

        text += `\n记录总数：${records.length}条`;
        
        return text;
    }
}

module.exports = MessageHandler;
