#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试新的饮食和运动记录端点
"""

import json
import requests
from datetime import datetime
import pytz

# 配置
BASE_URL = "http://localhost:8000"
DEFAULT_TZ = "Asia/Shanghai"

def test_food_endpoint():
    """测试饮食记录端点"""
    print("测试饮食记录端点...")
    
    # 获取当前时间（东八区）
    tz = pytz.timezone(DEFAULT_TZ)
    now = datetime.now(tz)
    
    # 测试数据
    test_cases = [
        {
            "utterance": "早餐吃了两个鸡蛋和一杯牛奶约300卡 #高蛋白",
            "description": "早餐记录"
        },
        {
            "utterance": "午餐吃了鸡胸肉和蔬菜约400卡 #健康",
            "description": "午餐记录"
        },
        {
            "utterance": "晚餐吃了200克米饭和鱼约500卡",
            "description": "晚餐记录"
        },
        {
            "utterance": "下午茶吃了一个苹果约95卡 #零食",
            "description": "零食记录"
        }
    ]
    
    for test_case in test_cases:
        print(f"\n测试: {test_case['description']}")
        print(f"输入: {test_case['utterance']}")
        
        payload = {
            "utterance": test_case["utterance"],
            "tz": DEFAULT_TZ,
            "source": "test",
            "now": now.isoformat()
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/food",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ 成功: {result.get('parsed', {})}")
            else:
                print(f"✗ 失败: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"✗ 请求失败: {e}")

def test_exercise_endpoint():
    """测试运动记录端点"""
    print("\n\n测试运动记录端点...")
    
    # 获取当前时间（东八区）
    tz = pytz.timezone(DEFAULT_TZ)
    now = datetime.now(tz)
    
    # 测试数据
    test_cases = [
        {
            "utterance": "跑步30分钟消耗了300卡 #有氧运动",
            "description": "跑步记录"
        },
        {
            "utterance": "做了45分钟的力量训练消耗了200卡 #力量训练",
            "description": "力量训练记录"
        },
        {
            "utterance": "游泳1小时消耗了500卡 #高强度",
            "description": "游泳记录"
        },
        {
            "utterance": "瑜伽30分钟消耗了150卡 #柔韧性训练",
            "description": "瑜伽记录"
        }
    ]
    
    for test_case in test_cases:
        print(f"\n测试: {test_case['description']}")
        print(f"输入: {test_case['utterance']}")
        
        payload = {
            "utterance": test_case["utterance"],
            "tz": DEFAULT_TZ,
            "source": "test",
            "now": now.isoformat()
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/exercise",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ 成功: {result.get('parsed', {})}")
            else:
                print(f"✗ 失败: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"✗ 请求失败: {e}")

def test_health_endpoint():
    """测试健康检查端点"""
    print("\n\n测试健康检查端点...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ 健康检查成功: {result}")
        else:
            print(f"✗ 健康检查失败: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"✗ 健康检查请求失败: {e}")

def test_calorie_stats_logic():
    """测试热量统计逻辑（不依赖API）"""
    print("\n\n测试热量统计逻辑...")
    
    # 模拟数据
    from app.stats import calculate_daily_calorie_stats, generate_daily_calorie_report
    
    # 模拟饮食条目
    mock_food_entries = [
        {
            "properties": {
                "Food": {"title": [{"text": {"content": "早餐：鸡蛋牛奶"}}]},
                "Calories": {"number": 300},
                "Protein": {"number": 20},
                "Carbs": {"number": 10},
                "Fat": {"number": 15},
                "Date": {"date": {"start": "2025-12-17"}},
                "Category": {"select": {"name": "早餐"}},
                "Tags": {"multi_select": [{"name": "高蛋白"}]}
            },
            "id": "mock1",
            "created_time": "2025-12-17T08:00:00Z",
            "last_edited_time": "2025-12-17T08:00:00Z"
        },
        {
            "properties": {
                "Food": {"title": [{"text": {"content": "午餐：鸡胸肉蔬菜"}}]},
                "Calories": {"number": 400},
                "Protein": {"number": 35},
                "Carbs": {"number": 20},
                "Fat": {"number": 10},
                "Date": {"date": {"start": "2025-12-17"}},
                "Category": {"select": {"name": "午餐"}},
                "Tags": {"multi_select": [{"name": "健康"}]}
            },
            "id": "mock2",
            "created_time": "2025-12-17T12:30:00Z",
            "last_edited_time": "2025-12-17T12:30:00Z"
        }
    ]
    
    # 模拟运动条目
    mock_exercise_entries = [
        {
            "properties": {
                "Exercise": {"title": [{"text": {"content": "跑步"}}]},
                "Duration": {"number": 30},
                "Calories Burned": {"number": 300},
                "Intensity": {"select": {"name": "中"}},
                "Date": {"date": {"start": "2025-12-17"}},
                "Category": {"select": {"name": "有氧运动"}},
                "Tags": {"multi_select": [{"name": "户外"}]}
            },
            "id": "mock3",
            "created_time": "2025-12-17T18:00:00Z",
            "last_edited_time": "2025-12-17T18:00:00Z"
        }
    ]
    
    try:
        # 计算热量统计
        stats = calculate_daily_calorie_stats(mock_food_entries, mock_exercise_entries, bmr=1800.0)
        
        print("热量统计结果:")
        print(f"  总摄入热量: {stats['total_calories_in']} 卡")
        print(f"  总消耗热量: {stats['total_calories_out']} 卡")
        print(f"  热量缺口: {stats['calorie_deficit']} 卡")
        print(f"  运动消耗: {stats['total_exercise_calories']} 卡")
        print(f"  饮食记录数: {stats['total_food_entries']}")
        print(f"  运动记录数: {stats['total_exercise_entries']}")
        
        # 生成报告
        report = generate_daily_calorie_report(stats)
        print(f"\n报告预览（前5行）:")
        for i, line in enumerate(report.split('\n')[:5]):
            print(f"  {line}")
            
        print("✓ 热量统计逻辑测试通过")
        
    except Exception as e:
        print(f"✗ 热量统计逻辑测试失败: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("测试新的饮食和运动记录功能")
    print("=" * 60)
    
    # 测试健康检查
    test_health_endpoint()
    
    # 测试热量统计逻辑
    test_calorie_stats_logic()
    
    print("\n注意：以下API测试需要服务器正在运行")
    print("启动服务器: uvicorn app.main:app --host 0.0.0.0 --port 8000")
    print("=" * 60)
    
    # 询问是否运行API测试
    run_api_tests = input("\n是否运行API测试？(y/n): ").strip().lower()
    
    if run_api_tests == 'y':
        # 测试API端点
        test_food_endpoint()
        test_exercise_endpoint()
    else:
        print("跳过API测试")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
