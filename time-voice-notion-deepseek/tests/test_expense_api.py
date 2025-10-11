#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试花销记录API的简单脚本
"""

import sys
import os

# 添加app目录到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from datetime import datetime
from llm_parser import parse_expense_with_deepseek

def test_expense_parsing():
    """测试花销解析功能"""
    print("测试花销解析功能...")
    
    # 测试用例
    test_cases = [
        "午餐花了50元 #餐饮",
        "打车花了25.5元 #交通",
        "买书花了80元 #教育",
        "看电影花了120元 #娱乐"
    ]
    
    for utterance in test_cases:
        print(f"\n测试用例: {utterance}")
        try:
            now = datetime.now()
            result = parse_expense_with_deepseek(
                utterance, 
                now=now, 
                tz="Asia/Shanghai",
                categories=["餐饮", "交通", "购物", "娱乐", "医疗", "教育", "住房", "其他"],
                tags=["日常", "必要", "非必要", "大额", "小额"]
            )
            print(f"解析结果: {result}")
        except Exception as e:
            print(f"解析失败: {e}")

if __name__ == "__main__":
    test_expense_parsing()
