#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试日期范围统计功能
"""

import sys
import os
import requests
import json

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# 服务器地址
BASE_URL = "http://localhost:8000"

def test_run_manual_without_dates():
    """测试不带日期参数的手动统计"""
    print("测试不带日期参数的手动统计...")
    try:
        response = requests.post(f"{BASE_URL}/stats/run-manual", json={})
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        print()
    except Exception as e:
        print(f"请求失败: {e}")
        print()

def test_run_manual_with_dates():
    """测试带日期参数的手动统计"""
    print("测试带日期参数的手动统计...")
    try:
        payload = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-07"
        }
        response = requests.post(f"{BASE_URL}/stats/run-manual", json=payload)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        print()
    except Exception as e:
        print(f"请求失败: {e}")
        print()

def test_invalid_date_format():
    """测试无效日期格式"""
    print("测试无效日期格式...")
    try:
        payload = {
            "start_date": "2024/10/01",  # 错误的格式
            "end_date": "2024-10-07"
        }
        response = requests.post(f"{BASE_URL}/stats/run-manual", json=payload)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        print()
    except Exception as e:
        print(f"请求失败: {e}")
        print()

def test_health_check():
    """测试健康检查"""
    print("测试健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        print()
    except Exception as e:
        print(f"请求失败: {e}")
        print()

if __name__ == "__main__":
    print("开始测试日期范围统计功能")
    print("=" * 50)
    
    test_health_check()
    test_run_manual_without_dates()
    test_run_manual_with_dates()
    test_invalid_date_format()
    
    print("测试完成")
