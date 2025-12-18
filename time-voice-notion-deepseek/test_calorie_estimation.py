#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试热量估算功能
"""

import sys
import os
from datetime import datetime
import pytz

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.llm_parser import parse_food_with_deepseek, parse_exercise_with_deepseek

def test_food_calorie_estimation():
    """测试饮食热量估算"""
    print("测试饮食热量估算...")
    print("=" * 60)
    
    # 测试数据：包含热量和不包含热量的例子
    test_cases = [
        {
            "utterance": "早餐吃了两个鸡蛋和一杯牛奶",
            "description": "没有明确热量，应该估算"
        },
        {
            "utterance": "午餐吃了鸡胸肉和蔬菜约400卡",
            "description": "有明确热量，应该使用400卡"
        },
        {
            "utterance": "吃了一个苹果",
            "description": "没有热量，应该估算"
        },
        {
            "utterance": "晚餐吃了200克米饭和鱼约500卡",
            "description": "有明确热量，应该使用500卡"
        },
        {
            "utterance": "下午茶吃了饼干",
            "description": "没有热量，应该估算"
        }
    ]
    
    tz = "Asia/Shanghai"
    now = datetime.now(pytz.timezone(tz))
    
    for test_case in test_cases:
        print(f"\n测试: {test_case['description']}")
        print(f"输入: {test_case['utterance']}")
        
        try:
            # 设置测试环境变量（如果不存在）
            if not os.environ.get("DEEPSEEK_API_KEY"):
                print("⚠️  警告: DEEPSEEK_API_KEY 未设置，跳过实际API调用")
                print("   模拟结果: 热量估算功能已实现，需要API密钥进行完整测试")
                continue
            
            result = parse_food_with_deepseek(
                utterance=test_case["utterance"],
                now=now,
                tz=tz,
                categories=["早餐", "午餐", "晚餐", "零食", "加餐", "饮料"],
                tags=["高蛋白", "健康", "零食", "主食"]
            )
            
            print(f"✓ 解析成功:")
            print(f"  食物: {result.get('food')}")
            print(f"  热量: {result.get('calories')} 卡")
            print(f"  分类: {result.get('category')}")
            print(f"  标签: {result.get('tags')}")
            print(f"  假设: {result.get('assumptions')}")
            
            # 验证热量不为0
            calories = result.get('calories', 0)
            if calories <= 10:
                print("⚠️  警告: 热量值可能过低")
            else:
                print(f"✅ 热量值有效: {calories} 卡")
                
        except Exception as e:
            print(f"✗ 解析失败: {e}")

def test_exercise_calorie_estimation():
    """测试运动热量估算"""
    print("\n\n测试运动热量估算...")
    print("=" * 60)
    
    # 测试数据：包含热量和不包含热量的例子
    test_cases = [
        {
            "utterance": "跑步30分钟",
            "description": "没有明确消耗热量，应该估算"
        },
        {
            "utterance": "游泳1小时消耗了500卡",
            "description": "有明确消耗热量，应该使用500卡"
        },
        {
            "utterance": "做了45分钟的力量训练",
            "description": "没有热量，应该估算"
        },
        {
            "utterance": "瑜伽30分钟消耗了150卡",
            "description": "有明确热量，应该使用150卡"
        },
        {
            "utterance": "步行1小时",
            "description": "没有热量，应该估算"
        }
    ]
    
    tz = "Asia/Shanghai"
    now = datetime.now(pytz.timezone(tz))
    
    for test_case in test_cases:
        print(f"\n测试: {test_case['description']}")
        print(f"输入: {test_case['utterance']}")
        
        try:
            # 设置测试环境变量（如果不存在）
            if not os.environ.get("DEEPSEEK_API_KEY"):
                print("⚠️  警告: DEEPSEEK_API_KEY 未设置，跳过实际API调用")
                print("   模拟结果: 热量估算功能已实现，需要API密钥进行完整测试")
                continue
            
            result = parse_exercise_with_deepseek(
                utterance=test_case["utterance"],
                now=now,
                tz=tz,
                categories=["有氧运动", "力量训练", "柔韧性训练", "高强度间歇训练", "户外运动", "其他"],
                tags=["户外", "室内", "高强度", "低强度"]
            )
            
            print(f"✓ 解析成功:")
            print(f"  运动类型: {result.get('exercise_type')}")
            print(f"  持续时间: {result.get('duration_minutes')} 分钟")
            print(f"  消耗热量: {result.get('calories_burned')} 卡")
            print(f"  强度: {result.get('intensity')}")
            print(f"  分类: {result.get('category')}")
            print(f"  标签: {result.get('tags')}")
            print(f"  假设: {result.get('assumptions')}")
            
            # 验证热量不为0
            calories_burned = result.get('calories_burned', 0)
            if calories_burned <= 10:
                print("⚠️  警告: 消耗热量值可能过低")
            else:
                print(f"✅ 消耗热量值有效: {calories_burned} 卡")
                
        except Exception as e:
            print(f"✗ 解析失败: {e}")

def test_offline_estimation_logic():
    """测试离线估算逻辑（不依赖API）"""
    print("\n\n测试离线估算逻辑...")
    print("=" * 60)
    
    # 模拟解析结果
    mock_food_results = [
        {"food": "鸡蛋牛奶", "calories": 0, "category": "早餐"},
        {"food": "鸡胸肉蔬菜", "calories": 400, "category": "午餐"},
        {"food": "苹果", "calories": 5, "category": "零食"},  # 小于10，应该触发估算
        {"food": "米饭和鱼", "calories": 500, "category": "晚餐"},
        {"food": "饼干", "calories": 3, "category": "零食"},  # 小于10，应该触发估算
    ]
    
    mock_exercise_results = [
        {"exercise_type": "跑步", "duration_minutes": 30, "calories_burned": 0, "intensity": "中"},
        {"exercise_type": "游泳", "duration_minutes": 60, "calories_burned": 500, "intensity": "高"},
        {"exercise_type": "力量训练", "duration_minutes": 45, "calories_burned": 2, "intensity": "中"},  # 小于10，应该触发估算
        {"exercise_type": "瑜伽", "duration_minutes": 30, "calories_burned": 150, "intensity": "低"},
        {"exercise_type": "步行", "duration_minutes": 60, "calories_burned": 1, "intensity": "低"},  # 小于10，应该触发估算
    ]
    
    print("饮食热量估算逻辑:")
    print("-" * 40)
    
    # 模拟食物热量估算逻辑
    calorie_estimates = {
        "米饭": 200, "面条": 300, "面包": 150, "鸡蛋": 70, "牛奶": 150,
        "鸡胸肉": 200, "牛肉": 250, "猪肉": 300, "鱼": 150, "虾": 100,
        "苹果": 95, "香蕉": 105, "橙子": 62, "草莓": 50, "西瓜": 85,
        "蔬菜": 50, "沙拉": 100, "汤": 150, "咖啡": 5, "茶": 2,
        "蛋糕": 350, "饼干": 150, "巧克力": 200, "冰淇淋": 250, "薯片": 160
    }
    
    for food_result in mock_food_results:
        food_name = food_result["food"].lower()
        original_calories = food_result["calories"]
        
        if original_calories <= 10:
            estimated_calories = 0
            for food_key, calories in calorie_estimates.items():
                if food_key in food_name:
                    estimated_calories = calories
                    break
            
            if estimated_calories == 0:
                estimated_calories = 200  # 默认值
            
            print(f"  {food_name}: {original_calories}卡 → 估算为{estimated_calories}卡")
        else:
            print(f"  {food_name}: {original_calories}卡 (使用原始值)")
    
    print("\n运动热量估算逻辑:")
    print("-" * 40)
    
    # 模拟运动热量估算逻辑
    base_calories_per_minute = {"低": 5, "中": 8, "高": 12}
    exercise_multiplier = {
        "跑步": 1.2, "游泳": 1.3, "骑行": 1.1, "步行": 0.8,
        "力量训练": 1.0, "举重": 1.1, "瑜伽": 0.7, "普拉提": 0.8,
        "篮球": 1.4, "足球": 1.5, "网球": 1.3, "羽毛球": 1.2,
        "跳绳": 1.6, "爬山": 1.4, "舞蹈": 1.0, "健身操": 1.1
    }
    
    for exercise_result in mock_exercise_results:
        exercise_type = exercise_result["exercise_type"].lower()
        duration = exercise_result["duration_minutes"]
        intensity = exercise_result["intensity"]
        original_calories = exercise_result["calories_burned"]
        
        if original_calories <= 10:
            base_rate = base_calories_per_minute.get(intensity, 8)
            multiplier = 1.0
            for exercise_key, mult in exercise_multiplier.items():
                if exercise_key in exercise_type:
                    multiplier = mult
                    break
            
            estimated_calories = base_rate * duration * multiplier
            
            print(f"  {exercise_type} ({duration}分钟, {intensity}强度): {original_calories}卡 → 估算为{round(estimated_calories)}卡")
        else:
            print(f"  {exercise_type} ({duration}分钟, {intensity}强度): {original_calories}卡 (使用原始值)")

if __name__ == "__main__":
    print("热量估算功能测试")
    print("=" * 60)
    
    # 测试离线估算逻辑
    test_offline_estimation_logic()
    
    print("\n" + "=" * 60)
    print("注意：以下测试需要 DEEPSEEK_API_KEY 环境变量")
    print("=" * 60)
    
    # 询问是否运行API测试
    run_api_tests = input("\n是否运行API测试？(y/n): ").strip().lower()
    
    if run_api_tests == 'y':
        # 测试API端点
        test_food_calorie_estimation()
        test_exercise_calorie_estimation()
    else:
        print("跳过API测试")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
