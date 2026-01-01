# -*- coding: utf-8 -*-
from __future__ import annotations
import logging
import os
import requests
from datetime import datetime, time, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from .notion_client import get_today_entries, get_yesterday_entries, get_current_month_expense_entries, get_current_month_time_entries, get_today_food_entries, get_yesterday_food_entries, get_today_exercise_entries, get_yesterday_exercise_entries, get_today_expense_entries, get_yesterday_expense_entries, NotionError
from .stats import calculate_daily_stats, generate_daily_report, calculate_monthly_expense_stats, generate_monthly_expense_report, calculate_date_range_stats, generate_date_range_report, calculate_daily_calorie_stats, generate_daily_calorie_report, calculate_daily_expense_stats, generate_unified_daily_report

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
        # 每天23:30执行，发送当天的统一每日报告
        unified_trigger = CronTrigger(
            hour=23,
            minute=30,
            timezone="Asia/Shanghai"
        )
        
        self.scheduler.add_job(
            self.generate_unified_daily_report,
            trigger=unified_trigger,
            id='unified_daily_report',
            name='Generate unified daily report',
            replace_existing=True
        )
        
        logger.info("定时任务已设置：每天23:30执行当天统一报告")
    
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
    
    def generate_daily_calorie_stats(self):
        """生成每日热量统计数据"""
        try:
            logger.info("开始生成每日热量统计数据...")
            
            # 获取昨天的饮食和运动数据
            food_entries = get_yesterday_food_entries()
            exercise_entries = get_yesterday_exercise_entries()
            
            logger.info(f"获取到 {len(food_entries)} 条饮食记录和 {len(exercise_entries)} 条运动记录")
            
            if not food_entries and not exercise_entries:
                logger.warning("昨天没有饮食和运动记录数据")
                # 即使没有数据也发送通知
                no_data_message = f"🔥 {datetime.now().strftime('%Y-%m-%d')} 热量统计报告\n\n昨天没有记录任何饮食和运动数据。"
                self.send_to_feishu(no_data_message)
                return
            
            # 计算热量统计数据（基础代谢率默认为1800卡路里）
            bmr = 1800.0  # 可以根据用户信息调整
            stats = calculate_daily_calorie_stats(food_entries, exercise_entries, bmr)
            
            # 生成报告
            report = generate_daily_calorie_report(stats)
            
            # 输出报告到日志
            logger.info(f"每日热量统计报告:\n{report}")
            
            # 发送到飞书机器人
            self.send_to_feishu(report)
            
            logger.info("每日热量统计数据生成完成")
            
        except NotionError as e:
            error_message = f"❌ 生成每日热量统计报告失败\n\n错误: {str(e)}\n\n请检查Notion配置。"
            self.send_to_feishu(error_message)
            logger.error(f"获取Notion数据失败: {e}")
        except Exception as e:
            error_message = f"❌ 生成每日热量统计报告失败\n\n错误: {str(e)}"
            self.send_to_feishu(error_message)
            logger.error(f"生成热量统计数据时发生错误: {e}")
    
    def generate_unified_daily_report(self):
        """生成统一的每日报告，包含时间、热量和花销统计（统计当天的数据）"""
        try:
            logger.info("开始生成统一的每日报告（当天数据）...")
            
            # 获取今天的数据
            time_entries = get_today_entries()
            food_entries = get_today_food_entries()
            exercise_entries = get_today_exercise_entries()
            expense_entries = get_today_expense_entries()
            
            logger.info(f"获取到数据：时间记录 {len(time_entries)} 条，饮食记录 {len(food_entries)} 条，运动记录 {len(exercise_entries)} 条，花销记录 {len(expense_entries)} 条")
            
            # 如果没有数据，发送通知
            if not time_entries and not food_entries and not exercise_entries and not expense_entries:
                logger.warning("今天没有任何记录数据")
                no_data_message = f"📊 {datetime.now().strftime('%Y-%m-%d')} 每日综合报告\n\n今天没有记录任何数据（时间、饮食、运动、花销）。"
                self.send_to_feishu(no_data_message)
                return
            
            # 计算各类统计数据
            time_stats = None
            calorie_stats = None
            expense_stats = None
            
            # 时间统计
            if time_entries:
                time_stats = calculate_daily_stats(time_entries)
                # 修改日期为今天
                time_stats["date"] = datetime.now().date()
            else:
                time_stats = {
                    "date": datetime.now().date(),
                    "total_entries": 0,
                    "total_duration": 0,
                    "categories": {},
                    "category_percentages": {}
                }
            
            # 热量统计
            if food_entries or exercise_entries:
                bmr = 1800.0
                calorie_stats = calculate_daily_calorie_stats(food_entries, exercise_entries, bmr)
                # 修改日期为今天
                calorie_stats["date"] = datetime.now().date()
            else:
                calorie_stats = {
                    "date": datetime.now().date(),
                    "total_calories_in": 0,
                    "total_calories_out": 1800,  # 基础代谢
                    "calorie_deficit": 1800,  # 没有摄入，所以是1800缺口
                    "nutrition": {
                        "total_protein": 0,
                        "total_carbs": 0,
                        "total_fat": 0,
                        "protein_percentage": 0,
                        "carbs_percentage": 0,
                        "fat_percentage": 0
                    }
                }
            
            # 花销统计
            if expense_entries:
                expense_stats = calculate_daily_expense_stats(expense_entries)
                # 修改日期为今天
                expense_stats["date"] = datetime.now().date()
            else:
                expense_stats = {
                    "date": datetime.now().date(),
                    "total_entries": 0,
                    "total_amount": 0,
                    "categories": {},
                    "category_percentages": {}
                }
            
            # 生成统一报告
            report = generate_unified_daily_report(time_stats, calorie_stats, expense_stats)
            
            # 输出报告到日志
            logger.info(f"统一每日报告（当天数据）:\n{report}")
            
            # 发送到飞书机器人
            self.send_to_feishu(report)
            
            logger.info("统一每日报告（当天数据）生成完成")
            
        except NotionError as e:
            error_message = f"❌ 生成统一每日报告失败\n\n错误: {str(e)}\n\n请检查Notion配置。"
            self.send_to_feishu(error_message)
            logger.error(f"获取Notion数据失败: {e}")
        except Exception as e:
            error_message = f"❌ 生成统一每日报告失败\n\n错误: {str(e)}"
            self.send_to_feishu(error_message)
            logger.error(f"生成统一每日报告时发生错误: {e}")

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
