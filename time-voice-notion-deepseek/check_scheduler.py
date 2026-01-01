#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查定时任务配置的脚本
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.scheduler import DailyStatsScheduler

def check_scheduler_config():
    """检查调度器配置"""
    print("检查定时任务配置...")
    
    # 创建调度器实例
    scheduler = DailyStatsScheduler()
    
    # 获取调度器中的所有任务
    jobs = scheduler.scheduler.get_jobs()
    
    print(f"找到 {len(jobs)} 个定时任务:")
    
    for i, job in enumerate(jobs, 1):
        print(f"\n任务 {i}:")
        print(f"  ID: {job.id}")
        print(f"  名称: {job.name}")
        print(f"  触发器: {job.trigger}")
    
    # 验证是否只有 unified_daily_report 任务
    if len(jobs) == 1:
        job = jobs[0]
        if job.id == 'unified_daily_report' and job.name == 'Generate unified daily report':
            print("\n✅ 配置正确：只保留了每天23:30的统一总结任务")
            print(f"   触发器配置: {job.trigger}")
            
            # 检查触发器时间
            trigger_str = str(job.trigger)
            if "hour='23'" in trigger_str and "minute='30'" in trigger_str:
                print("✅ 时间配置正确：每天23:30执行")
            else:
                print(f"⚠️  时间配置可能不正确：{trigger_str}")
        else:
            print(f"\n❌ 配置错误：找到的任务不是 unified_daily_report")
    else:
        print(f"\n❌ 配置错误：期望1个任务，但找到 {len(jobs)} 个任务")
        return False
    
    return True

if __name__ == "__main__":
    try:
        success = check_scheduler_config()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"检查过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
