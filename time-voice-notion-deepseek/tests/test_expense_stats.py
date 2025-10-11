#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试花销统计功能的简单脚本
"""

import sys
import os

# 添加app目录到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from datetime import datetime, date
from stats import parse_expense_entry, calculate_monthly_expense_stats, generate_monthly_expense_report

def test_expense_stats():
    """测试花销统计功能"""
    print("测试花销统计功能...")
    
    # 创建模拟的花销条目数据
    mock_entries = [
        {
            "id": "1",
            "properties": {
                "Content": {
                    "title": [{"text": {"content": "午餐"}}]
                },
                "Amount": {
                    "number": 50.0
                },
                "Date": {
                    "date": {"start": "2024-10-01"}
                },
                "Category": {
                    "select": {"name": "餐饮"}
                },
                "Tags": {
                    "multi_select": [{"name": "日常"}, {"name": "必要"}]
                }
            }
        },
        {
            "id": "2",
            "properties": {
                "Content": {
                    "title": [{"text": {"content": "打车"}}]
                },
                "Amount": {
                    "number": 25.5
                },
                "Date": {
                    "date": {"start": "2024-10-02"}
                },
                "Category": {
                    "select": {"name": "交通"}
                },
                "Tags": {
                    "multi_select": [{"name": "日常"}]
                }
            }
        },
        {
            "id": "3",
            "properties": {
                "Content": {
                    "title": [{"text": {"content": "买书"}}]
                },
                "Amount": {
                    "number": 80.0
                },
                "Date": {
                    "date": {"start": "2024-10-03"}
                },
                "Category": {
                    "select": {"name": "学习"}
                },
                "Tags": {
                    "multi_select": [{"name": "必要"}]
                }
            }
        },
        {
            "id": "4",
            "properties": {
                "Content": {
                    "title": [{"text": {"content": "看电影"}}]
                },
                "Amount": {
                    "number": 120.0
                },
                "Date": {
                    "date": {"start": "2024-10-04"}
                },
                "Category": {
                    "select": {"name": "娱乐"}
                },
                "Tags": {
                    "multi_select": [{"name": "非必要"}]
                }
            }
        }
    ]
    
    # 测试解析功能
    print("\n1. 测试条目解析:")
    for entry in mock_entries:
        parsed = parse_expense_entry(entry)
        print(f"  内容: {parsed['content']}, 金额: {parsed['amount']}, 分类: {parsed['category']}, 标签: {parsed['tags']}")
    
    # 测试统计计算
    print("\n2. 测试统计计算:")
    stats = calculate_monthly_expense_stats(mock_entries)
    print(f"  总条目数: {stats['total_entries']}")
    print(f"  总金额: {stats['total_amount']} 元")
    print(f"  分类统计: {stats['categories']}")
    print(f"  标签统计: {stats['tags']}")
    
    # 测试报告生成
    print("\n3. 测试报告生成:")
    report = generate_monthly_expense_report(stats)
    print(report)
    
    print("\n✅ 花销统计功能测试完成")

if __name__ == "__main__":
    test_expense_stats()
