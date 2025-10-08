#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试时区修复功能
"""

import sys
import os
from datetime import datetime, date, timedelta
import pytz

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from notion_client import query_time_entries

def test_timezone_conversion():
    """测试时区转换逻辑"""
    print("测试时区转换逻辑...")
    
    # 测试日期
    test_date = date(2024, 10, 1)
    
    shanghai_tz = pytz.timezone('Asia/Shanghai')
    utc_tz = pytz.UTC
    
    # 将东八区日期的00:00转换为UTC时间
    start_datetime_sh = shanghai_tz.localize(
        datetime.combine(test_date, datetime.min.time())
    )
    start_datetime_utc = start_datetime_sh.astimezone(utc_tz)
    
    # 将东八区日期的23:59:59转换为UTC时间
    end_datetime_sh = shanghai_tz.localize(
        datetime.combine(test_date, datetime.max.time().replace(hour=23, minute=59, second=59))
    )
    end_datetime_utc = end_datetime_sh.astimezone(utc_tz)
    
    print(f"东八区 {test_date} 00:00:00 = UTC {start_datetime_utc}")
    print(f"东八区 {test_date} 23:59:59 = UTC {end_datetime_utc}")
    print()
    
    # 验证时间差
    expected_start_hour = 16  # 东八区00:00对应UTC前一天16:00
    expected_end_hour = 15   # 东八区23:59对应UTC当天15:59
    
    actual_start_hour = start_datetime_utc.hour
    actual_end_hour = end_datetime_utc.hour
    
    print(f"预期开始时间小时: {expected_start_hour}, 实际: {actual_start_hour}")
    print(f"预期结束时间小时: {expected_end_hour}, 实际: {actual_end_hour}")
    
    if actual_start_hour == expected_start_hour and actual_end_hour == expected_end_hour:
        print("✅ 时区转换正确")
    else:
        print("❌ 时区转换错误")
    
    print()

def test_query_function():
    """测试查询函数"""
    print("测试查询函数...")
    
    try:
        # 测试查询今天的记录
        today = date.today()
        entries = query_time_entries(today, today)
        print(f"今天({today})的记录数量: {len(entries)}")
        
        # 测试查询昨天的记录
        yesterday = date.today() - timedelta(days=1)
        entries = query_time_entries(yesterday, yesterday)
        print(f"昨天({yesterday})的记录数量: {len(entries)}")
        
        # 测试查询日期范围
        start_date = date(2024, 10, 1)
        end_date = date(2024, 10, 7)
        entries = query_time_entries(start_date, end_date)
        print(f"{start_date} 到 {end_date} 的记录数量: {len(entries)}")
        
        print("✅ 查询函数正常工作")
        
    except Exception as e:
        print(f"❌ 查询函数出错: {e}")
    
    print()

if __name__ == "__main__":
    print("开始测试时区修复功能")
    print("=" * 50)
    
    test_timezone_conversion()
    test_query_function()
    
    print("测试完成")
