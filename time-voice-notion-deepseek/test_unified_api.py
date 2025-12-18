#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试统一API的功能

这个脚本测试新的/unified-ingest端点，它能够：
1. 接收用户指令
2. 使用AI进行分类
3. 自动路由到正确的API
"""

import sys
import os
import json
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    """测试健康检查端点"""
    response = client.get("/health")
    print("测试健康检查端点...")
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.json()}")
    print()
    assert response.status_code == 200
    assert response.json()["ok"] == True

def test_unified_ingest_time():
    """测试时间记录的统一入口"""
    print("测试时间记录的统一入口...")
    payload = {
        "utterance": "9点到10点写代码 #工作",
        "source": "test_unified_api"
    }
    
    response = client.post("/unified-ingest", json=payload)
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"分类结果: {result.get('classification', {}).get('intent_type')}")
        print(f"置信度: {result.get('classification', {}).get('confidence')}")
        print(f"处理结果: {result.get('ok')}")
        print(f"Notion页面ID: {result.get('notion_page_id', 'N/A')}")
    else:
        print(f"错误: {response.json()}")
    
    print()
    return response.status_code == 200

def test_unified_ingest_expense():
    """测试花销记录的统一入口"""
    print("测试花销记录的统一入口...")
    payload = {
        "utterance": "午餐花了50元 #餐饮",
        "source": "test_unified_api"
    }
    
    response = client.post("/unified-ingest", json=payload)
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"分类结果: {result.get('classification', {}).get('intent_type')}")
        print(f"置信度: {result.get('classification', {}).get('confidence')}")
        print(f"处理结果: {result.get('ok')}")
        print(f"金额: {result.get('parsed', {}).get('amount', 'N/A')}")
    else:
        print(f"错误: {response.json()}")
    
    print()
    return response.status_code == 200

def test_unified_ingest_food():
    """测试饮食记录的统一入口"""
    print("测试饮食记录的统一入口...")
    payload = {
        "utterance": "午餐吃了鸡胸肉和蔬菜约400卡 #健康",
        "source": "test_unified_api"
    }
    
    response = client.post("/unified-ingest", json=payload)
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"分类结果: {result.get('classification', {}).get('intent_type')}")
        print(f"置信度: {result.get('classification', {}).get('confidence')}")
        print(f"处理结果: {result.get('ok')}")
        print(f"食物: {result.get('parsed', {}).get('food', 'N/A')}")
        print(f"热量: {result.get('parsed', {}).get('calories', 'N/A')}")
    else:
        print(f"错误: {response.json()}")
    
    print()
    return response.status_code == 200

def test_unified_ingest_exercise():
    """测试运动记录的统一入口"""
    print("测试运动记录的统一入口...")
    payload = {
        "utterance": "跑步30分钟消耗了300卡 #有氧运动",
        "source": "test_unified_api"
    }
    
    response = client.post("/unified-ingest", json=payload)
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"分类结果: {result.get('classification', {}).get('intent_type')}")
        print(f"置信度: {result.get('classification', {}).get('confidence')}")
        print(f"处理结果: {result.get('ok')}")
        print(f"运动类型: {result.get('parsed', {}).get('exercise_type', 'N/A')}")
        print(f"持续时间: {result.get('parsed', {}).get('duration_minutes', 'N/A')}分钟")
    else:
        print(f"错误: {response.json()}")
    
    print()
    return response.status_code == 200

def test_force_type():
    """测试强制指定类型"""
    print("测试强制指定类型...")
    payload = {
        "utterance": "这是一个测试",
        "force_type": "time",
        "source": "test_unified_api"
    }
    
    response = client.post("/unified-ingest", json=payload)
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"强制类型: {result.get('classification', {}).get('intent_type')}")
        print(f"置信度: {result.get('classification', {}).get('confidence')}")
        print(f"处理结果: {result.get('ok')}")
    else:
        print(f"错误: {response.json()}")
    
    print()
    return response.status_code == 200

def main():
    """运行所有测试"""
    print("=" * 60)
    print("开始测试统一API")
    print("=" * 60)
    print()
    
    # 检查环境变量
    if not os.environ.get("DEEPSEEK_API_KEY"):
        print("警告: DEEPSEEK_API_KEY 环境变量未设置")
        print("AI分类功能可能无法正常工作")
        print()
    
    # 运行测试
    tests = [
        ("健康检查", test_health),
        ("时间记录", test_unified_ingest_time),
        ("花销记录", test_unified_ingest_expense),
        ("饮食记录", test_unified_ingest_food),
        ("运动记录", test_unified_ingest_exercise),
        ("强制类型", test_force_type),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"运行测试: {test_name}")
        print("-" * 40)
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"测试失败，异常: {e}")
            results.append((test_name, False))
        print()
    
    # 打印测试结果摘要
    print("=" * 60)
    print("测试结果摘要")
    print("=" * 60)
    
    all_passed = True
    for test_name, success in results:
        status = "✓ 通过" if success else "✗ 失败"
        print(f"{test_name}: {status}")
        if not success:
            all_passed = False
    
    print()
    if all_passed:
        print("所有测试通过！")
    else:
        print("部分测试失败，请检查日志")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
