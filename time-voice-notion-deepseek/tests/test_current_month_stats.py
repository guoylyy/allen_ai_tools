#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试本月时间统计功能的简单脚本
"""

import sys
import os

# 添加app目录到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from datetime import datetime, date
from stats import parse_notion_entry, calculate_date_range_stats, generate_date_range_report

def test_current_month_stats():
    """测试本月时间统计功能"""
    print("测试本月时间统计功能...")
    
    # 创建模拟的时间条目数据
    mock_entries = [
        {
            "id": "1",
            "properties": {
                "Activity": {
                    "title": [{"text": {"content": "写代码"}}]
                },
                "When": {
                    "date": {
                        "start": "2024-10-01T09:00:00+08:00",
                        "end": "2024-10-01T12:00:00+08:00"
                    }
                },
                "Category": {
                    "select": {"name": "工作"}
                },
                "Tags": {
                    "multi_select": [{"name": "开发"}, {"name": "项目A"}]
                }
            }
        },
        {
            "id": "2",
            "properties": {
                "Activity": {
                    "title": [{"text": {"content": "开会"}}]
                },
                "When": {
                    "date": {
                        "start": "2024-10-02T14:00:00+08:00",
                        "end": "2024-10-02T15:30:00+08:00"
                    }
                },
                "Category": {
                    "select": {"name": "工作"}
                },
                "Tags": {
                    "multi_select": [{"name": "会议"}]
                }
            }
        },
        {
            "id": "3",
            "properties": {
                "Activity": {
                    "title": [{"text": {"content": "学习新技术"}}]
                },
                "When": {
                    "date": {
                        "start": "2024-10-03T19:00:00+08:00",
                        "end": "2024-10-03T21:00:00+08:00"
                    }
                },
                "Category": {
                    "select": {"name": "学习"}
                },
                "Tags": {
                    "multi_select": [{"name": "自我提升"}]
                }
            }
        },
        {
            "id": "4",
            "properties": {
                "Activity": {
                    "title": [{"text": {"content": "阅读"}}]
                },
                "When": {
                    "date": {
                        "start": "2024-10-04T20:00:00+08:00",
                        "end": "2024-10-04T21:30:00+08:00"
                    }
                },
                "Category": {
                    "select": {"name": "学习"}
                },
                "Tags": {
                    "multi_select": [{"name": "阅读"}]
                }
            }
        }
    ]
    
    # 测试解析功能
    print("\n1. 测试条目解析:")
    for entry in mock_entries:
        parsed = parse_notion_entry(entry)
        print(f"  活动: {parsed['activity']}, 时长: {parsed['duration']:.1f}h, 分类: {parsed['category']}, 标签: {parsed['tags']}")
    
    # 测试统计计算
    print("\n2. 测试统计计算:")
    from datetime import date
    start_date = date(2024, 10, 1)
    end_date = date(2024, 10, 31)
    stats = calculate_date_range_stats(mock_entries, start_date, end_date)
    print(f"  总条目数: {stats['total_entries']}")
    print(f"  总时长: {stats['total_duration']} 小时")
    print(f"  分类统计: {stats['categories']}")
    print(f"  标签统计: {stats['tags']}")
    
    # 测试报告生成
    print("\n3. 测试报告生成:")
    report = generate_date_range_report(stats)
    print(report)
    
    print("\n✅ 本月时间统计功能测试完成")

if __name__ == "__main__":
    test_current_month_stats()
