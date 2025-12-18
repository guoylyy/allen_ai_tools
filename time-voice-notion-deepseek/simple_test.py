#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单测试统一API
"""

import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def main():
    print("测试统一API...")
    
    # 测试健康检查
    print("1. 测试健康检查...")
    response = client.get("/health")
    print(f"   状态码: {response.status_code}")
    print(f"   响应: {response.json()}")
    
    # 测试统一入口 - 时间记录
    print("\n2. 测试统一入口 - 时间记录...")
    payload = {
        "utterance": "9点到10点写代码 #工作",
        "source": "simple_test"
    }
    response = client.post("/unified-ingest", json=payload)
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   分类: {result.get('classification', {}).get('intent_type')}")
        print(f"   置信度: {result.get('classification', {}).get('confidence')}")
        print(f"   成功: {result.get('ok')}")
    else:
        print(f"   错误: {response.json()}")
    
    # 测试统一入口 - 花销记录
    print("\n3. 测试统一入口 - 花销记录...")
    payload = {
        "utterance": "午餐花了50元 #餐饮",
        "source": "simple_test"
    }
    response = client.post("/unified-ingest", json=payload)
    print(f"   状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   分类: {result.get('classification', {}).get('intent_type')}")
        print(f"   置信度: {result.get('classification', {}).get('confidence')}")
        print(f"   成功: {result.get('ok')}")
    else:
        print(f"   错误: {response.json()}")
    
    print("\n测试完成!")

if __name__ == "__main__":
    main()
