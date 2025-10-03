# -*- coding: utf-8 -*-
from __future__ import annotations
import logging
import os
import requests
from datetime import datetime, time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from .notion_client import get_yesterday_entries, NotionError
from .stats import calculate_daily_stats, generate_daily_report

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 飞书机器人webhook URL（从环境变量获取）
FEISHU_WEBHOOK_URL = os.environ.get("FEISHU_WEBHOOK_URL", "")

class DailyStatsScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.setup_scheduler()
    
    def setup_scheduler(self):
        """设置定时任务"""
        # 每天00:05执行，统计昨天的数据
        trigger = CronTrigger(
            hour=6,
            minute=0,
            timezone="Asia/Shanghai"
        )
        
        self.scheduler.add_job(
            self.generate_daily_stats,
            trigger=trigger,
            id='daily_stats',
            name='Generate daily time statistics',
            replace_existing=True
        )
        
        logger.info("定时任务已设置：每天6:00执行")
    
    def send_to_feishu(self, report: str):
        """通过飞书机器人发送报告"""
        if not FEISHU_WEBHOOK_URL:
            logger.warning("未配置飞书机器人webhook URL，跳过发送")
            return
        
        try:
            # 飞书消息格式
            message = {
                "msg_type": "text",
                "content": {
                    "text": report
                }
            }
            
            response = requests.post(
                FEISHU_WEBHOOK_URL,
                json=message,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("报告已成功发送到飞书")
            else:
                logger.error(f"发送到飞书失败: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"发送到飞书时发生错误: {e}")
    
    def generate_daily_stats(self):
        """生成每日统计数据"""
        try:
            logger.info("开始生成每日统计数据...")
            
            # 获取昨天的数据
            entries = get_yesterday_entries()
            logger.info(f"获取到 {len(entries)} 条时间记录")
            
            if not entries:
                logger.warning("昨天没有时间记录数据")
                # 即使没有数据也发送通知
                no_data_message = f"📊 {datetime.now().strftime('%Y-%m-%d')} 时间统计报告\n\n昨天没有记录任何时间数据。"
                self.send_to_feishu(no_data_message)
                return
            
            # 计算统计数据
            stats = calculate_daily_stats(entries)
            
            # 生成报告
            report = generate_daily_report(stats)
            
            # 输出报告到日志
            logger.info(f"每日统计报告:\n{report}")
            
            # 发送到飞书机器人
            self.send_to_feishu(report)
            
            logger.info("每日统计数据生成完成")
            
        except NotionError as e:
            error_message = f"❌ 生成每日统计报告失败\n\n错误: {str(e)}\n\n请检查Notion配置。"
            self.send_to_feishu(error_message)
            logger.error(f"获取Notion数据失败: {e}")
        except Exception as e:
            error_message = f"❌ 生成每日统计报告失败\n\n错误: {str(e)}"
            self.send_to_feishu(error_message)
            logger.error(f"生成统计数据时发生错误: {e}")
    
    def start(self):
        """启动定时任务"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("定时任务已启动")
    
    def stop(self):
        """停止定时任务"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("定时任务已停止")
    
    def run_manual(self):
        """手动运行一次统计（用于测试）"""
        logger.info("手动执行统计任务...")
        self.generate_daily_stats()

# 全局调度器实例
scheduler_instance = DailyStatsScheduler()

def start_scheduler():
    """启动定时任务（供外部调用）"""
    scheduler_instance.start()

def stop_scheduler():
    """停止定时任务（供外部调用）"""
    scheduler_instance.stop()

def run_manual_stats():
    """手动运行统计（供外部调用）"""
    scheduler_instance.run_manual()
