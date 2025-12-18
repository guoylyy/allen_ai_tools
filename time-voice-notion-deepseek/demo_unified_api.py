#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
演示如何使用统一API

这个脚本演示了新的/unified-ingest端点的使用方法，
用户只需要向一个API提交指令，系统会自动分类并处理。
"""

import requests
import json
import sys

def demo_unified_api(base_url="http://localhost:8000"):
    """演示统一API的使用"""
    
    print("=" * 60)
    print("统一API演示")
    print("=" * 60)
    print()
    print("这个演示展示了新的/unified-ingest端点，它可以：")
    print("1. 接收用户指令")
    print("2. 使用AI自动分类（时间、花销、饮食、运动）")
    print("3. 调用对应的API进行处理")
    print("4. 返回处理结果")
    print()
    
    # 测试用例
    test_cases = [
        {
            "name": "时间记录",
            "utterance": "9点到10点写代码 #工作",
            "expected_type": "time"
        },
        {
            "name": "花销记录", 
            "utterance": "午餐花了50元 #餐饮",
            "expected_type": "expense"
        },
        {
            "name": "饮食记录",
            "utterance": "午餐吃了鸡胸肉和蔬菜约400卡 #健康",
            "expected_type": "food"
        },
        {
            "name": "运动记录",
            "utterance": "跑步30分钟消耗了300卡 #有氧运动",
            "expected_type": "exercise"
        },
        {
            "name": "模糊指令（让AI判断）",
            "utterance": "刚才开会30分钟",
            "expected_type": "time"  # 预期AI会识别为时间记录
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print("-" * 40)
        print(f"指令: {test_case['utterance']}")
        print(f"预期类型: {test_case['expected_type']}")
        
        # 准备请求
        payload = {
            "utterance": test_case['utterance'],
            "source": "demo_script"
        }
        
        try:
            # 发送请求
            response = requests.post(
                f"{base_url}/unified-ingest",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                actual_type = result.get('classification', {}).get('intent_type')
                confidence = result.get('classification', {}).get('confidence')
                success = result.get('ok')
                
                print(f"✓ 请求成功")
                print(f"  实际分类: {actual_type}")
                print(f"  置信度: {confidence:.2f}")
                print(f"  处理成功: {success}")
                
                # 显示具体结果
                if actual_type == "time":
                    parsed = result.get('parsed', {})
                    print(f"  活动: {parsed.get('activity', 'N/A')}")
                    print(f"  开始时间: {parsed.get('start', 'N/A')}")
                    print(f"  结束时间: {parsed.get('end', 'N/A')}")
                elif actual_type == "expense":
                    parsed = result.get('parsed', {})
                    print(f"  内容: {parsed.get('content', 'N/A')}")
                    print(f"  金额: {parsed.get('amount', 'N/A')}元")
                elif actual_type == "food":
                    parsed = result.get('parsed', {})
                    print(f"  食物: {parsed.get('food', 'N/A')}")
                    print(f"  热量: {parsed.get('calories', 'N/A')}卡")
                elif actual_type == "exercise":
                    parsed = result.get('parsed', {})
                    print(f"  运动类型: {parsed.get('exercise_type', 'N/A')}")
                    print(f"  持续时间: {parsed.get('duration_minutes', 'N/A')}分钟")
                
                # 检查分类是否正确
                if actual_type == test_case['expected_type']:
                    print(f"  ✓ 分类正确")
                else:
                    print(f"  ⚠ 分类与预期不符")
                    
            else:
                print(f"✗ 请求失败: {response.status_code}")
                print(f"  错误信息: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"✗ 无法连接到服务器: {base_url}")
            print("  请确保服务器正在运行")
            break
        except Exception as e:
            print(f"✗ 请求异常: {e}")
    
    print("\n" + "=" * 60)
    print("演示总结")
    print("=" * 60)
    print()
    print("使用统一API的好处：")
    print("1. 简化客户端逻辑 - 只需要调用一个API")
    print("2. 智能分类 - AI自动判断指令类型")
    print("3. 向后兼容 - 原始API仍然可用")
    print("4. 可扩展性 - 未来可以轻松添加新的分类")
    print()
    print("使用示例命令：")
    print(f'curl -X POST {base_url}/unified-ingest \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"utterance":"9点到10点写代码 #工作","source":"cli"}\'')
    print()

def check_server_health(base_url="http://localhost:8000"):
    """检查服务器健康状态"""
    print("检查服务器状态...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print(f"✓ 服务器运行正常: {base_url}")
            return True
        else:
            print(f"✗ 服务器响应异常: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"✗ 无法连接到服务器: {base_url}")
        print("  请运行: uvicorn app.main:app --host 0.0.0.0 --port 8000")
        return False
    except Exception as e:
        print(f"✗ 检查服务器时出错: {e}")
        return False

if __name__ == "__main__":
    # 检查服务器状态
    if not check_server_health():
        print("\n请先启动服务器：")
        print("cd time-voice-notion-deepseek")
        print("uvicorn app.main:app --host 0.0.0.0 --port 8000")
        sys.exit(1)
    
    # 运行演示
    demo_unified_api()
