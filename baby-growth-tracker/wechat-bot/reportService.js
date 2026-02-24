/**
 * 每日报告生成服务
 */

class ReportService {
    // 生成日报内容
    static generateDailyReport(records, childName) {
        if (!records || records.length === 0) {
            return {
                title: `${childName} - 今日成长报告`,
                content: '今日暂无记录',
                summary: {},
                total: 0
            };
        }

        // 统计各类记录
        const summary = {
            sleep: { count: 0, totalMinutes: 0, items: [] },
            eat: { count: 0, items: [] },
            play: { count: 0, items: [] },
            study: { count: 0, totalMinutes: 0, items: [] },
            supplement: { count: 0, items: [] },
            milestone: { count: 0, items: [] },
            poop: { count: 0, items: [] }
        };

        // 按类型分组记录
        records.forEach(record => {
            const type = record.type;
            if (summary[type]) {
                summary[type].count++;
                
                if (record.duration) {
                    summary[type].totalMinutes += record.duration;
                }
                
                summary[type].items.push(record);
            }
        });

        // 生成文字内容
        let content = '';
        
        // 睡眠
        if (summary.sleep.count > 0) {
            const hours = Math.floor(summary.sleep.totalMinutes / 60);
            const minutes = summary.sleep.totalMinutes % 60;
            content += `🌙 睡眠：${summary.sleep.count}次，共${hours}小时${minutes}分钟\n`;
        }

        // 饮食
        if (summary.eat.count > 0) {
            content += `🍼 饮食：${summary.eat.count}次\n`;
        }

        // 玩耍
        if (summary.play.count > 0) {
            content += `🎈 玩耍：${summary.play.count}次\n`;
        }

        // 学习
        if (summary.study.count > 0) {
            const hours = Math.floor(summary.study.totalMinutes / 60);
            const minutes = summary.study.totalMinutes % 60;
            content += `📚 学习：${summary.study.count}次，共${hours}小时${minutes}分钟\n`;
        }

        // 营养补充
        if (summary.supplement.count > 0) {
            content += `💊 营养补充：${summary.supplement.count}次\n`;
        }

        // 里程碑
        if (summary.milestone.count > 0) {
            content += `🌟 里程碑：${summary.milestone.count}个\n`;
        }

        // 大便
        if (summary.poop.count > 0) {
            content += `💩 大小便：${summary.poop.count}次\n`;
        }

        // 添加详细记录
        content += '\n📝 详细记录：\n';
        
        const typeEmojis = {
            sleep: '🌙',
            eat: '🍼',
            play: '🎈',
            study: '📚',
            supplement: '💊',
            milestone: '🌟',
            poop: '💩'
        };

        const typeNames = {
            sleep: '睡眠',
            eat: '饮食',
            play: '玩耍',
            study: '学习',
            supplement: '营养',
            milestone: '里程碑',
            poop: '大小便'
        };

        // 按时间排序，最新的在前
        const sortedRecords = [...records].sort((a, b) => 
            new Date(b.recorded_at) - new Date(a.recorded_at)
        );

        sortedRecords.slice(0, 10).forEach((record, index) => {
            const time = new Date(record.recorded_at).toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            let detail = `${index + 1}. ${typeEmojis[record.type] || '📌'}${time} ${typeNames[record.type] || record.type}`;
            
            if (record.content) {
                detail += ` - ${record.content}`;
            }
            if (record.duration) {
                const h = Math.floor(record.duration / 60);
                const m = record.duration % 60;
                detail += h > 0 ? ` (${h}小时${m}分钟)` : ` (${m}分钟)`;
            }
            
            content += detail + '\n';
        });

        if (records.length > 10) {
            content += `... 还有${records.length - 10}条记录\n`;
        }

        // 添加备注
        content += `\n⭐ 今日记录共${records.length}条，宝宝表现很棒！`;

        return {
            title: `${childName} - 昨日成长日报`,
            content: content,
            summary: summary,
            total: records.length
        };
    }

    // 格式化报告为纯文本（适合微信发送）
    static formatReportAsText(report, dateStr) {
        const formattedDate = new Date(dateStr).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        let text = `📅 ${formattedDate}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `【${report.title}】\n\n`;
        text += report.content;
        text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💕 关注宝宝成长，记录美好瞬间`;

        return text;
    }
}

module.exports = ReportService;
