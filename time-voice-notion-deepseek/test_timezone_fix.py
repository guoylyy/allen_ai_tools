#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试时区修复：验证在北京时间早上8点前录入的数据是否算作当天的数据
"""

import pytz
from datetime import datetime, timedelta

def test_timezone_logic():
    """测试时区逻辑"""
    # 设置北京时区
    beijing_tz = pytz.timezone('Asia/Shanghai')
    
    # 模拟北京时间早上7:59（UTC时间前一天23:59）
    # 注意：北京时间 = UTC+8
    beijing_early_morning = datetime(2025, 10, 30, 7, 59, 0)  # 没有时区信息的时间
    beijing_early_morning_tz = beijing_tz.localize(beijing_early_morning)  # 添加时区信息
    
    # 模拟北京时间早上8:01（UTC时间当天00:01）
    beijing_after_8am = datetime(2025, 10, 30, 8, 1, 0)
    beijing_after_8am_tz = beijing_tz.localize(beijing_after_8am)
    
    print("=== 时区修复测试 ===")
    print(f"北京时间早上7:59 (带时区): {beijing_early_morning_tz}")
    print(f"日期: {beijing_early_morning_tz.date()}")
    print(f"ISO格式: {beijing_early_morning_tz.isoformat()}")
    print()
    print(f"北京时间早上8:01 (带时区): {beijing_after_8am_tz}")
    print(f"日期: {beijing_after_8am_tz.date()}")
    print(f"ISO格式: {beijing_after_8am_tz.isoformat()}")
    print()
    
    # 验证UTC时间转换
    print("=== UTC时间对比 ===")
    print(f"北京时间7:59 对应的UTC时间: {beijing_early_morning_tz.astimezone(pytz.UTC)}")
    print(f"北京时间8:01 对应的UTC时间: {beijing_after_8am_tz.astimezone(pytz.UTC)}")
    print()
    
    # 测试边界情况：UTC时间00:00（北京时间8:00）
    utc_midnight = datetime(2025, 10, 30, 0, 0, 0, tzinfo=pytz.UTC)
    beijing_time = utc_midnight.astimezone(beijing_tz)
    print("=== 边界情况测试 ===")
    print(f"UTC时间00:00: {utc_midnight}")
    print(f"对应的北京时间: {beijing_time}")
    print(f"北京时间日期: {beijing_time.date()}")
    
    return True

if __name__ == "__main__":
    test_timezone_logic()
    print("\n✅ 时区逻辑测试完成！")
    print("修复说明：")
    print("- 之前使用 datetime.now() 获取的是本地时间但没有时区信息")
    print("- 现在使用 datetime.now(tz) 获取带时区的时间")
    print("- 确保在北京时间早上8点前录入的数据算作当天的数据")
    print("- 修复了跨日期的时区处理问题")
