# -*- coding: utf-8 -*-
from __future__ import annotations
import logging
import os
import requests
from datetime import datetime, time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from .notion_client import get_yesterday_entries, get_current_month_expense_entries, get_current_month_time_entries, NotionError
from .stats import calculate_daily_stats, generate_daily_report, calculate_monthly_expense_stats, generate_monthly_expense_report, calculate_date_range_stats, generate_date_range_report

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
        # 每天00:01执行，统计昨天的数据
        trigger = CronTrigger(
            hour=0,
            minute=1,
            timezone="Asia/Shanghai"
        )
        
        self.scheduler.add_job(
            self.generate_daily_stats,
            trigger=trigger,
            id='daily_stats',
            name='Generate daily time statistics',
            replace_existing=True
        )
        
        # 每月1号00:05执行，统计上个月的花销数据
        monthly_trigger = CronTrigger(
            day=1,
            hour=0,
            minute=5,
            timezone="Asia/Shanghai"
        )
        
        self.scheduler.add_job(
            self.generate_monthly_expense_stats,
            trigger=monthly_trigger,
            id='monthly_expense_stats',
            name='Generate monthly expense statistics',
            replace_existing=True
        )
        
        logger.info("定时任务已设置：每天0:01执行时间统计，每月1号0:05执行花销统计")
    
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
    
    def run_manual(self, start_date: str = None, end_date: str = None):
        """手动运行一次统计（用于测试）
        
        Args:
            start_date: 开始日期 (YYYY-MM-DD格式)
            end_date: 结束日期 (YYYY-MM-DD格式)
        """
        logger.info("手动执行统计任务...")
        if start_date and end_date:
            self.generate_date_range_stats(start_date, end_date)
        else:
            # 如果开始和结束时间为空，自动统计本月的时间
            self.generate_current_month_stats()
    
    def generate_date_range_stats(self, start_date: str, end_date: str):
        """生成指定日期范围的统计数据"""
        try:
            from datetime import datetime, date
            
            # 解析日期
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            
            logger.info(f"开始生成 {start_date} 到 {end_date} 的统计数据...")
            
            # 获取指定日期范围的数据
            from .notion_client import query_time_entries
            entries = query_time_entries(start, end)
            logger.info(f"获取到 {len(entries)} 条时间记录")
            
            if not entries:
                logger.warning(f"{start_date} 到 {end_date} 期间没有时间记录数据")
                no_data_message = f"📊 {start_date} 到 {end_date} 时间统计报告\n\n该期间没有记录任何时间数据。"
                self.send_to_feishu(no_data_message)
                return
            
            # 计算统计数据
            from .stats import calculate_date_range_stats
            stats = calculate_date_range_stats(entries, start, end)
            
            # 生成报告
            from .stats import generate_date_range_report
            report = generate_date_range_report(stats)
            
            # 输出报告到日志
            logger.info(f"日期范围统计报告:\n{report}")
            
            # 发送到飞书机器人
            self.send_to_feishu(report)
            
            logger.info("日期范围统计数据生成完成")
            
        except ValueError as e:
            error_message = f"❌ 日期格式错误\n\n请使用 YYYY-MM-DD 格式，例如：2024-01-01\n\n错误: {str(e)}"
            self.send_to_feishu(error_message)
            logger.error(f"日期格式错误: {e}")
        except Exception as e:
            error_message = f"❌ 生成日期范围统计报告失败\n\n错误: {str(e)}"
            self.send_to_feishu(error_message)
            logger.error(f"生成日期范围统计数据时发生错误: {e}")
    
    def generate_monthly_expense_stats(self):
        """生成当月花销统计数据"""
        try:
            logger.info("开始生成当月花销统计数据...")
            
            # 获取当月的数据
            entries = get_current_month_expense_entries()
            logger.info(f"获取到 {len(entries)} 条花销记录")
            
            if not entries:
                logger.warning("当月没有花销记录数据")
                # 即使没有数据也发送通知
                current_month = datetime.now().strftime('%Y年%m月')
                no_data_message = f"💰 {current_month} 花销统计报告\n\n当月没有记录任何花销数据。"
                self.send_to_feishu(no_data_message)
                return
            
            # 计算统计数据
            stats = calculate_monthly_expense_stats(entries)
            
            # 生成报告
            report = generate_monthly_expense_report(stats)
            
            # 输出报告到日志
            logger.info(f"当月花销统计报告:\n{report}")
            
            # 发送到飞书机器人
            self.send_to_feishu(report)
            
            logger.info("当月花销统计数据生成完成")
            
        except NotionError as e:
            error_message = f"❌ 生成当月花销统计报告失败\n\n错误: {str(e)}\n\n请检查Notion配置。"
            self.send_to_feishu(error_message)
            logger.error(f"获取Notion数据失败: {e}")
        except Exception as e:
            error_message = f"❌ 生成当月花销统计报告失败\n\n错误: {str(e)}"
            self.send_to_feishu(error_message)
            logger.error(f"生成花销统计数据时发生错误: {e}")
    
    def generate_current_month_stats(self):
        """生成当月时间统计数据"""
        try:
            logger.info("开始生成当月时间统计数据...")
            
            # 获取当月的数据
            entries = get_current_month_time_entries()
            logger.info(f"获取到 {len(entries)} 条时间记录")
            
            if not entries:
                logger.warning("当月没有时间记录数据")
                # 即使没有数据也发送通知
                current_month = datetime.now().strftime('%Y年%m月')
                no_data_message = f"📊 {current_month} 时间统计报告\n\n当月没有记录任何时间数据。"
                self.send_to_feishu(no_data_message)
                return
            
            # 计算当月第一天和最后一天
            from datetime import date
            today = date.today()
            first_day = today.replace(day=1)
            if today.month == 12:
                last_day = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            
            # 计算统计数据
            stats = calculate_date_range_stats(entries, first_day, last_day)
            
            # 生成报告
            report = generate_date_range_report(stats)
            
            # 输出报告到日志
            logger.info(f"当月时间统计报告:\n{report}")
            
            # 发送到飞书机器人
            self.send_to_feishu(report)
            
            logger.info("当月时间统计数据生成完成")
            
        except NotionError as e:
            error_message = f"❌ 生成当月时间统计报告失败\n\n错误: {str(e)}\n\n请检查Notion配置。"
            self.send_to_feishu(error_message)
            logger.error(f"获取Notion数据失败: {e}")
        except Exception as e:
            error_message = f"❌ 生成当月时间统计报告失败\n\n错误: {str(e)}"
            self.send_to_feishu(error_message)
            logger.error(f"生成当月时间统计数据时发生错误: {e}")

# 全局调度器实例
scheduler_instance = DailyStatsScheduler()

def start_scheduler():
    """启动定时任务（供外部调用）"""
    scheduler_instance.start()

def stop_scheduler():
    """停止定时任务（供外部调用）"""
    scheduler_instance.stop()

def run_manual_stats(start_date: str = None, end_date: str = None):
    """手动运行统计（供外部调用）
    
    Args:
        start_date: 开始日期 (YYYY-MM-DD格式)
        end_date: 结束日期 (YYYY-MM-DD格式)
    """
    scheduler_instance.run_manual(start_date, end_date)
