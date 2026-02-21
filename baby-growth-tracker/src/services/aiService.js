const dotenv = require('dotenv');

dotenv.config();

// AI 服务配置
const AI_CONFIG = {
    // DeepSeek API（与 OpenAI 兼容）
    provider: process.env.AI_PROVIDER || 'deepseek',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'deepseek-chat',
    endpoint: process.env.AI_ENDPOINT || 'https://api.deepseek.com/chat/completions'
};

// 记录类型定义
const RECORD_TYPES = {
    sleep: { name: '睡觉', keywords: ['睡觉', '睡眠', '午睡', '入睡', '醒来'] },
    eat: { name: '吃饭', keywords: ['吃奶', '喝奶', '喂奶', '母乳', '吃饭', '辅食', '喝粥', '米糊', '吃米'] },
    play: { name: '玩耍', keywords: ['玩耍', '玩', '游戏', '玩具'] },
    study: { name: '学习', keywords: ['学习', '学', '识字', '认字', '阅读', '绘本'] },
    supplement: { name: '营养补充', keywords: ['辅食', '补钙', '补锌', '补充', '营养', '维生素', 'DHA'] },
    milestone: { name: '里程碑', keywords: ['里程碑', '第一次', '学会', '达成'] }
};

// AI 提示词模板
const SYSTEM_PROMPT = `你是一个专业的宝宝成长记录助手。你的任务是将用户输入的自然语言转换为结构化的记录数据。

可用记录类型：
${Object.values(RECORD_TYPES).map(t => `- ${t.name}: ${t.keywords.join(', ')}`).join('\n')}

请分析用户输入，提取以下信息：
1. 记录类型（必须）
2. 记录时间（可选，格式 ISO）
3. 时长/持续时间（可选，单位分钟）
4. 数量/量（可选，如奶量）
5. 原始内容描述

请以 JSON 格式返回结果：
{
    "type": "类型代码(sleep/eat/play/study/supplement/milestone)",
    "typeName": "类型名称",
    "recorded_at": "记录时间(ISO格式，如果没明确时间则为当前时间)",
    "duration": 时长(分钟，数字),
    "amount": "数量描述(如 90ml)",
    "content": "原始内容描述",
    "confidence": 0.0-1.0的置信度,
    "message": "对用户的回复消息(如: '睡觉数据已记录')"
}

重要规则：
- 如果无法识别类型，返回 type: "general"
- 始终返回 message 字段
- 优先识别具体类型而不是 general
- 时长如果用"X小时Y分钟"格式，计算总分钟数
- 如果时间只说"上午9点"、"下午3点"等，补充今天的日期

请只返回 JSON，不要有其他内容。`;

// 调用 AI API
async function callAI(messages) {
    if (!AI_CONFIG.apiKey) {
        throw new Error('AI API key not configured');
    }

    const response = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: AI_CONFIG.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.3,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// 解析用户输入
async function parseNaturalLanguage(text) {
    try {
        // 构建用户消息
        const userMessage = {
            role: 'user',
            content: `用户输入: "${text}"`
        };

        // 调用 AI
        const result = await callAI([userMessage]);

        // 解析 JSON
        let parsed;
        try {
            // 尝试直接解析
            parsed = JSON.parse(result);
        } catch {
            // 尝试提取 JSON
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('无法解析 AI 返回结果');
            }
        }

        // 验证和补全数据
        return validateAndCompleteResult(parsed, text);
    } catch (error) {
        console.error('AI 处理失败:', error);
        // 降级到本地解析
        return null;
    }
}

// 辅助函数：解析相对日期
function parseRelativeDate(text) {
    const now = new Date();
    let targetDate = new Date();
    
    // 解析 "昨天"
    if (text.includes('昨天') || text.includes('昨日')) {
        targetDate.setDate(now.getDate() - 1);
        text = text.replace(/昨天|昨日/g, '').trim();
    }
    // 解析 "前天"
    else if (text.includes('前天')) {
        targetDate.setDate(now.getDate() - 2);
        text = text.replace(/前天/g, '').trim();
    }
    // 解析 "今天"
    else if (text.includes('今天')) {
        text = text.replace(/今天/g, '').trim();
    }
    
    // 解析具体日期 "3月12日" 或 "3月12"
    const monthDayMatch = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    if (monthDayMatch) {
        const month = parseInt(monthDayMatch[1]) - 1; // 月份从0开始
        const day = parseInt(monthDayMatch[2]);
        targetDate = new Date(now.getFullYear(), month, day);
    }
    
    // 解析纯日期 "12日"
    const dayOnlyMatch = text.match(/^(\d{1,2})\s*日$/);
    if (dayOnlyMatch && !monthDayMatch) {
        const day = parseInt(dayOnlyMatch[1]);
        targetDate = new Date(now.getFullYear(), now.getMonth(), day);
    }
    
    return { date: targetDate, remainingText: text };
}

// 辅助函数：解析时间
function parseTime(text) {
    let hour = null;
    let minute = 0;
    
    // 处理 "下午X点" 或 "晚上X点"
    const afternoonMatch = text.match(/(?:下午|晚上)(\d{1,2})点?(\d{0,2})/);
    if (afternoonMatch) {
        hour = parseInt(afternoonMatch[1]);
        minute = parseInt(afternoonMatch[2] || '0');
        if (hour < 12) hour += 12;
        return { hour, minute };
    }
    
    // 处理 "上午X点"
    const morningMatch = text.match(/(?:上午)(\d{1,2})点?(\d{0,2})/);
    if (morningMatch) {
        hour = parseInt(morningMatch[1]);
        minute = parseInt(morningMatch[2] || '0');
        return { hour, minute };
    }
    
    // 处理纯数字时间 "X点" 或 "X点Y分"
    const timeMatch = text.match(/(\d{1,2})点(\d{0,2})/);
    if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = parseInt(timeMatch[2] || '0');
        return { hour, minute };
    }
    
    return null;
}

// 辅助函数：解析时长
function parseDuration(text) {
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

// 验证和补全结果 - 强制使用当前年份
function validateAndCompleteResult(parsed, originalText) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    
    // 验证类型
    const validTypes = Object.keys(RECORD_TYPES);
    if (!parsed.type || !validTypes.includes(parsed.type)) {
        parsed.type = 'general';
        parsed.typeName = '记录';
    }

    // 确保有消息
    if (!parsed.message) {
        const typeName = RECORD_TYPES[parsed.type]?.name || '数据';
        parsed.message = `${typeName}已记录`;
    }

    // 解析相对日期和具体日期
    const dateInfo = parseRelativeDate(originalText);
    const timeInfo = parseTime(dateInfo.remainingText);
    
    // 创建目标日期：优先使用解析出的日期，否则使用今天
    let targetDate = new Date();
    
    // 如果用户提到了相对日期，使用解析出的日期
    if (originalText.includes('昨天') || originalText.includes('昨日')) {
        targetDate.setDate(now.getDate() - 1);
    } else if (originalText.includes('前天')) {
        targetDate.setDate(now.getDate() - 2);
    } else if (originalText.includes('今天')) {
        targetDate.setDate(now.getDate());
    } else if (dateInfo && dateInfo.date) {
        // 使用解析出的月/日，但要确保是当前年份
        const parsedMonth = dateInfo.date.getMonth();
        const parsedDay = dateInfo.date.getDate();
        targetDate = new Date(currentYear, parsedMonth, parsedDay);
    }
    
    // 设置时间
    if (timeInfo) {
        targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
    } else {
        // 如果没有具体时间，使用中午12点
        targetDate.setHours(12, 0, 0, 0);
    }
    
    // 强制使用当前年份
    targetDate.setFullYear(currentYear);
    
    // 使用本地时间格式（解决时区问题）
    parsed.recorded_at = getLocalISOString(targetDate);
    
    // 解析时长
    const duration = parseDuration(originalText);
    if (duration && !parsed.duration) {
        parsed.duration = duration;
    }

    // 确保有原始内容
    if (!parsed.content) {
        parsed.content = originalText;
    }

    return parsed;
}

// 批量解析多个输入
async function parseBatch(texts) {
    const results = await Promise.all(
        texts.map(text => parseNaturalLanguage(text))
    );
    return results;
}

module.exports = {
    parseNaturalLanguage,
    parseBatch,
    RECORD_TYPES
};
