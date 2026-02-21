const cron = require('node-cron');
const db = require('../database/connection');
const WechatAPI = require('../wechat/api');

class ReportService {
    // 启动定时任务（每天晚上 8 点推送日报）
    static startDailyReport() {
        // 每天 20:00 执行
        cron.schedule('0 20 * * *', async () => {
            console.log('开始生成并推送日报...');
            await this.sendDailyReports();
        });

        console.log('日报定时任务已启动（每天 20:00）');
    }

    // 发送日报给所有用户
    static async sendDailyReports() {
        try {
            // 获取所有用户
            const [users] = await db.connection.query('SELECT DISTINCT openid FROM records');
            
            const today = new Date().toISOString().split('T')[0];
            
            for (const userRow of users) {
                const openid = userRow.openid;
                
                try {
                    // 获取今日记录
                    const records = await db.getRecords(openid, today);
                    
                    if (records.length === 0) {
                        continue; // 没有记录则不推送
                    }

                    // 生成报告
                    const report = this.generateDailyReport(records);
                    
                    // 发送模板消息
                    await WechatAPI.sendTemplateMessage(openid, 'DAILY_REPORT_TEMPLATE_ID', {
                        first: { value: '今日成长报告', color: '#173177' },
                        keyword1: { value: '郭路谦', color: '#173177' },
                        keyword2: { value: today, color: '#173177' },
                        keyword3: { value: report.summary, color: '#173177' },
                        remark: { value: report.remark, color: '#173177' }
                    });

                    console.log(`已推送日报给 ${openid}`);
                } catch (error) {
                    console.error(`推送日报给 ${openid} 失败:`, error.message);
                }
            }
        } catch (error) {
            console.error('生成日报失败:', error.message);
        }
    }

    // 生成日报内容
    static generateDailyReport(records) {
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

        const sleepHours = Math.floor(summary.sleep / 60);
        const sleepMinutes = summary.sleep % 60;
        const studyHours = Math.floor(summary.study / 60);
        const studyMinutes = summary.study % 60;

        const summaryText = [
            `睡眠：${sleepHours}小时${sleepMinutes}分钟`,
            `饮食：${summary.eat}次`,
            `玩耍：${summary.play}次`,
            `学习：${studyHours}小时${studyMinutes}分钟`,
            `营养补充：${summary.supplement}次`
        ].join(', ');

        const remark = '记录总数：' + records.length + '条\n宝宝今天表现很棒！';

        return {
            summary: summaryText,
            remark: remark,
            rawData: summary
        };
    }

    // 生成周报
    static async generateWeeklyReport(childId) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const records = await db.getChildRecords(
            childId,
            startDate.toISOString(),
            endDate.toISOString()
        );

        // 按天分组统计
        const dailyStats = {};
        records.forEach(record => {
            const date = record.recorded_at.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { sleep: 0, eat: 0, play: 0, study: 0 };
            }
            
            if (record.type === 'sleep' && record.duration) {
                dailyStats[date].sleep += record.duration;
            } else if (record.type === 'eat') {
                dailyStats[date].eat++;
            } else if (record.type === 'play') {
                dailyStats[date].play++;
            } else if (record.type === 'study' && record.duration) {
                dailyStats[date].study += record.duration;
            }
        });

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dailyStats: dailyStats,
            totalRecords: records.length
        };
    }
}

module.exports = ReportService;
