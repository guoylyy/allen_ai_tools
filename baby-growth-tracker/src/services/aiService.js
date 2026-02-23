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
4. 数量/量（可选，如奶量，纯数字）
5. 原始内容描述

请以 JSON 格式返回结果：
{
    "type": "类型代码(sleep/eat/play/study/supplement/milestone)",
    "typeName": "类型名称",
    "recorded_at": "记录时间(ISO格式，如果没明确时间则为当前时间)",
    "duration": 时长(分钟，数字),
    "value": 数量(纯数字，如90，没有则为空),
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

// 中文数字到阿拉伯数字的映射
const chineseNumberMap = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '半': 30, '刻': 15, 'quarter': 15
};

// 辅助函数：将中文数字转换为阿拉伯数字
function parseChineseNumber(text) {
    // 去除 "分"、"分钟"、"秒" 等单位后缀
    text = text.replace(/分|分钟|秒$/, '');
    
    // 处理 "十几" 的情况 (十几分钟)
    if (text === '十') {
        return 10;
    }
    
    // 处理 "半" (半小时 = 30分钟)
    if (text === '半') {
        return 30;
    }
    
    // 处理 "刻" (一刻 = 15分钟)
    if (text === '刻') {
        return 15;
    }
    
    // 处理纯数字
    if (/^\d+$/.test(text)) {
        return parseInt(text);
    }
    
    // 处理中文数字
    let result = 0;
    for (const char of text) {
        if (chineseNumberMap[char] !== undefined) {
            result = result * 10 + chineseNumberMap[char];
        }
    }
    return result > 0 ? result : null;
}

// 辅助函数：解析时间
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
        return { hour, minute };
    }
    
    // 处理 "上午X点" (支持中文数字分钟)
    const morningMatch = text.match(/(?:上午)(\d{1,2})点(?:([一二三四五六七八九十半刻]+)分?)?/);
    if (morningMatch) {
        hour = parseInt(morningMatch[1]);
        if (morningMatch[2]) {
            minute = parseChineseNumber(morningMatch[2]) || 0;
        }
        return { hour, minute };
    }
    
    // 处理纯数字时间 "X点Y分" 或 "X点Y"
    const timeMatch = text.match(/(\d{1,2})点(\d+)/);
    if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = parseInt(timeMatch[2] || '0');
        return { hour, minute };
    }
    
    // 处理中文数字时间 "X点Y分" (如 "3点十分", "3点二十分", "3点半")
    const chineseTimeMatch = text.match(/(\d{1,2})点([一二三四五六七八九十半刻]+)/);
    if (chineseTimeMatch) {
        hour = parseInt(chineseTimeMatch[1]);
        minute = parseChineseNumber(chineseTimeMatch[2]) || 0;
        return { hour, minute };
    }
    
    // 处理只有小时没有分钟的情况 "X点"
    const hourOnlyMatch = text.match(/(\d{1,2})点/);
    if (hourOnlyMatch) {
        hour = parseInt(hourOnlyMatch[1]);
        return { hour, minute: 0 };
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
    const currentDate = now.getDate();

    // 验证类型
    const validTypes = Object.keys(RECORD_TYPES);
    if (!parsed.type || !validTypes.includes(parsed.type)) {
        parsed.type = 'general';
        parsed.typeName = '记录';
    }

    // 处理 value 和 amount
    // 如果 AI 没有返回 value，尝试从 amount 中解析（如 "90ml" -> 90）
    if (!parsed.value && parsed.amount) {
        const amountMatch = parsed.amount.match(/(\d+)/);
        if (amountMatch) {
            parsed.value = parseInt(amountMatch[1]);
        }
    }

    // 如果 value 存在，在 message 中体现
    const valueInfo = parsed.value ? ` ${parsed.value}ml` : '';

    // 确保有消息
    if (!parsed.message) {
        const typeName = RECORD_TYPES[parsed.type]?.name || '记录';
        parsed.message = `${typeName}已记录${valueInfo}`;
    } else if (parsed.value && !parsed.message.includes(valueInfo)) {
        // 如果消息中还没有包含量信息，添加到消息末尾
        parsed.message = parsed.message + valueInfo;
    }

    // 优先使用 AI 返回的 recorded_at（如果存在且有效且合理）
    if (parsed.recorded_at && typeof parsed.recorded_at === 'string') {
        try {
            // 尝试解析 AI 返回的时间
            const aiDate = new Date(parsed.recorded_at);
            if (!isNaN(aiDate.getTime())) {
                // 验证 AI 返回的时间是否合理：
                // 1. 必须是当前年份
                // 2. 月份和日期必须在合理范围内
                const aiYear = aiDate.getFullYear();
                const aiMonth = aiDate.getMonth();
                const aiDay = aiDate.getDate();
                
                // 检查是否是当前年份
                if (aiYear === currentYear) {
                    // 检查月份是否有效（0-11）
                    if (aiMonth >= 0 && aiMonth <= 11) {
                        // 检查日期是否有效（1-31）
                        if (aiDay >= 1 && aiDay <= 31) {
                            // 额外检查：确保日期不超过当月最大天数
                            const maxDay = new Date(currentYear, aiMonth + 1, 0).getDate();
                            if (aiDay <= maxDay) {
                                // AI 返回的时间合理，使用它
                                // 不需要再设置年份，因为已经是当前年份
                                parsed.recorded_at = getLocalISOString(aiDate);
                                console.log(`[验证结果] 使用 AI 返回的时间: ${parsed.recorded_at}`);
                                
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
                        }
                    }
                }
                
                // 如果 AI 返回的时间不合理，记录警告并使用本地解析
                console.log(`[验证结果] AI 返回的时间不合理 (${aiYear}-${aiMonth + 1}-${aiDay})，将使用本地解析`);
            }
        } catch (e) {
            console.log(`[验证结果] AI 返回的时间解析失败: ${parsed.recorded_at}`);
        }
    }

    // AI 没有返回有效的时间，执行本地解析作为后备
    console.log(`[验证结果] 执行本地时间解析`);
    
    // 解析相对日期和具体日期
    const dateInfo = parseRelativeDate(originalText);
    const timeInfo = parseTime(dateInfo.remainingText);
    
    // 创建目标日期：默认使用今天
    let targetDate = new Date();
    
    // 只有当用户明确提到相对日期或具体日期时才改变日期
    // 否则默认使用今天
    const hasRelativeDate = originalText.includes('昨天') || originalText.includes('昨日') || 
                           originalText.includes('前天') || originalText.includes('今天');
    const hasSpecificDate = dateInfo && dateInfo.date && (
        originalText.match(/\d{1,2}\s*月\s*\d{1,2}/) ||  // "3月12日"
        originalText.match(/^\d{1,2}\s*日$/)              // "12日"
    );
    
    if (hasRelativeDate) {
        // 如果用户提到了相对日期，使用解析出的日期
        if (originalText.includes('昨天') || originalText.includes('昨日')) {
            targetDate.setDate(now.getDate() - 1);
        } else if (originalText.includes('前天')) {
            targetDate.setDate(now.getDate() - 2);
        } else if (originalText.includes('今天')) {
            targetDate.setDate(now.getDate());
        }
    } else if (hasSpecificDate) {
        // 只有当用户明确提到具体日期（如"3月12日"）时才使用
        const parsedMonth = dateInfo.date.getMonth();
        const parsedDay = dateInfo.date.getDate();
        targetDate = new Date(currentYear, parsedMonth, parsedDay);
    }
    // else: 默认使用今天，不需要额外处理
    
    // 设置时间 - 如果没有识别到具体时间，使用当前时间
    if (timeInfo) {
        targetDate.setHours(timeInfo.hour, timeInfo.minute, 0, 0);
    } else {
        // 如果没有具体时间，使用当前时间
        targetDate = new Date();
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
