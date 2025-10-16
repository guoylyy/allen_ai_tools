#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试分页查询功能
"""

import os
import sys
from datetime import date, datetime, timedelta

# 添加项目路径到 Python 路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from notion_client import get_current_month_expense_entries, get_current_month_time_entries

def test_expense_pagination():
    """测试花销条目的分页查询"""
    print("🔍 测试花销条目分页查询...")
    try:
        entries = get_current_month_expense_entries()
        print(f"✅ 成功获取 {len(entries)} 条花销记录")
        
        if len(entries) > 100:
            print("🎉 分页功能正常工作！成功获取超过100条记录")
        else:
            print(f"📊 当前月有 {len(entries)} 条花销记录")
            
        # 显示前5条记录作为示例
        if entries:
            print("\n📝 前5条花销记录示例:")
            for i, entry in enumerate(entries[:5]):
                props = entry.get("properties", {})
                content = props.get("Content", {}).get("title", [{}])[0].get("text", {}).get("content", "未知")
                amount = props.get("Amount", {}).get("number", 0)
                date_info = props.get("Date", {}).get("date", {}).get("start", "未知")
                print(f"  {i+1}. {content} - {amount}元 - {date_info}")
                
    except Exception as e:
        print(f"❌ 测试失败: {e}")

def test_time_pagination():
    """测试时间条目的分页查询"""
    print("\n🔍 测试时间条目分页查询...")
    try:
        entries = get_current_month_time_entries()
        print(f"✅ 成功获取 {len(entries)} 条时间记录")
        
        if len(entries) > 100:
            print("🎉 分页功能正常工作！成功获取超过100条记录")
        else:
            print(f"📊 当前月有 {len(entries)} 条时间记录")
            
        # 显示前5条记录作为示例
        if entries:
            print("\n📝 前5条时间记录示例:")
            for i, entry in enumerate(entries[:5]):
                props = entry.get("properties", {})
                activity = props.get("Activity", {}).get("title", [{}])[0].get("text", {}).get("content", "未知")
                when = props.get("When", {}).get("date", {})
                start = when.get("start", "未知")
                end = when.get("end", "未知")
                print(f"  {i+1}. {activity} - {start} 到 {end}")
                
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    print("🚀 开始测试分页查询功能...")
    print("=" * 50)
    
    # 检查环境变量
    required_env_vars = ["NOTION_TOKEN", "NOTION_DATABASE_ID", "NOTION_DATABASE_ID2"]
    missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"⚠️  缺少环境变量: {', '.join(missing_vars)}")
        print("请在运行前设置这些环境变量")
        sys.exit(1)
    
    test_expense_pagination()
    test_time_pagination()
    
    print("\n" + "=" * 50)
    print("✅ 测试完成！")
