# -*- coding: utf-8 -*-
from __future__ import annotations

import os
import json
from typing import Dict, Any, Optional
from datetime import datetime
import requests
from fastapi import HTTPException

from .llm_parser import LLMParseError, _headers, _chat_completions

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/beta")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

class UnifiedIngestError(Exception):
    pass

def classify_intent_with_deepseek(utterance: str) -> Dict[str, Any]:
    """
    使用DeepSeek AI对用户指令进行分类
    
    返回分类结果，包括：
    - intent_type: "time" | "expense" | "food" | "exercise"
    - confidence: 置信度 (0-1)
    - reasoning: 分类理由
    """
    
    tools = [{
        "type": "function",
        "function": {
            "name": "classify_user_intent",
            "strict": True,
            "description": "对用户的中文指令进行分类，判断用户想要记录什么类型的数据。",
            "parameters": {
                "type": "object",
                "properties": {
                    "intent_type": {
                        "type": "string", 
                        "description": "意图类型，必须是以下之一：time（时间记录）、expense（花销记录）、food（饮食记录）、exercise（运动记录）",
                        "enum": ["time", "expense", "food", "exercise"]
                    },
                    "confidence": {
                        "type": "number", 
                        "description": "分类置信度，0-1之间",
                        "minimum": 0,
                        "maximum": 1
                    },
                    "reasoning": {
                        "type": "string", 
                        "description": "分类的理由和依据"
                    },
                    "extracted_info": {
                        "type": "object",
                        "description": "从指令中提取的关键信息，用于后续处理",
                        "properties": {
                            "has_time_range": {"type": "boolean", "description": "是否包含时间范围"},
                            "has_amount": {"type": "boolean", "description": "是否包含金额"},
                            "has_food": {"type": "boolean", "description": "是否包含食物"},
                            "has_exercise": {"type": "boolean", "description": "是否包含运动"},
                            "keywords": {"type": "array", "items": {"type": "string"}, "description": "关键词列表"}
                        }
                    }
                },
                "required": ["intent_type", "confidence", "reasoning", "extracted_info"],
                "additionalProperties": False
            }
        }
    }]

    system_prompt = """
你是一个"用户意图分类器"。任务：分析用户的中文指令，判断用户想要记录什么类型的数据。

分类规则：
1. time（时间记录）：包含时间范围、时间段、活动描述，如"9点到10点写代码"、"刚才开会30分钟"、"昨晚23:10-0:40看电影"
2. expense（花销记录）：包含金额、花费、购买，如"午餐花了50元"、"打车花了15.5元"、"买书30块钱"
3. food（饮食记录）：包含食物、餐饮、热量，如"午餐吃了鸡胸肉和蔬菜约400卡"、"吃了一个苹果约95卡"、"喝了杯咖啡"
4. exercise（运动记录）：包含运动、锻炼、健身，如"跑步30分钟消耗了300卡"、"做了45分钟的力量训练"、"游泳1小时"

注意：
1. 一条指令可能包含多个元素，选择最明显的主要意图
2. 如果指令模糊，根据上下文和常见模式判断
3. 必须从给定的四个类型中选择一个
4. 提供分类理由和置信度
5. 提取关键信息用于后续处理

仅通过工具 classify_user_intent 返回，不要自然语言回答。
"""

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"用户指令：{utterance}\n请分类并返回函数参数。"}
        ],
        "tools": tools,
        "tool_choice": {"type": "function", "function": {"name": "classify_user_intent"}},
        "temperature": 0.1,
        "max_tokens": 400
    }

    try:
        data = _chat_completions(payload)
        choice = data.get("choices", [{}])[0]
        msg = choice.get("message", {})
        tool_calls = msg.get("tool_calls") or []
        
        if not tool_calls:
            raise UnifiedIngestError("AI分类器没有返回工具调用")
        
        func = tool_calls[0]["function"]
        args = func.get("arguments", "{}")
        
        # 尝试解析JSON
        try:
            parsed = json.loads(args)
        except json.JSONDecodeError as e:
            # 尝试修复常见的JSON格式错误
            try:
                # 修复缺失的引号和冒号
                import re
                patterns = [
                    (r'\"(intent_type):\s*\"([^\"]*)\"', r'"\1": "\2"'),
                    (r'\"(confidence):\s*([0-9.]+)', r'"\1": \2'),
                    (r'\"(reasoning):\s*\"([^\"]*)\"', r'"\1": "\2"'),
                    (r'\"(extracted_info):\s*\{', r'"\1": {'),
                ]
                fixed_args = args
                for pattern, replacement in patterns:
                    fixed_args = re.sub(pattern, replacement, fixed_args)
                parsed = json.loads(fixed_args)
            except json.JSONDecodeError as e2:
                raise UnifiedIngestError(f"分类结果JSON解析失败: {e}; 原始内容: {args[:500]}")
        
        # 验证必需字段
        required_fields = ["intent_type", "confidence", "reasoning", "extracted_info"]
        for field in required_fields:
            if field not in parsed:
                raise UnifiedIngestError(f"分类结果缺少必需字段: {field}")
        
        # 验证intent_type
        valid_intents = ["time", "expense", "food", "exercise"]
        if parsed["intent_type"] not in valid_intents:
            raise UnifiedIngestError(f"无效的意图类型: {parsed['intent_type']}")
        
        return parsed
        
    except Exception as e:
        if isinstance(e, UnifiedIngestError):
            raise e
        raise UnifiedIngestError(f"AI分类失败: {str(e)}")


def route_to_correct_endpoint(intent_type: str, utterance: str, tz: str, source: Optional[str] = None, now: Optional[str] = None) -> Dict[str, Any]:
    """
    根据分类结果路由到正确的API端点
    
    参数:
    - intent_type: 意图类型 ("time", "expense", "food", "exercise")
    - utterance: 用户原始指令
    - tz: 时区
    - source: 来源（可选）
    - now: 覆盖当前时间（可选）
    
    返回:
    - 对应API端点的响应
    """
    
    try:
        # 直接导入对应的处理函数
        from .main import ingest, expense, food, exercise
        from pydantic import BaseModel
        
        # 创建对应的请求体模型
        class IngestBody(BaseModel):
            utterance: str
            tz: str
            source: Optional[str] = None
            now: Optional[str] = None
        
        class FoodBody(BaseModel):
            utterance: str
            tz: str
            source: Optional[str] = None
            now: Optional[str] = None
        
        class ExerciseBody(BaseModel):
            utterance: str
            tz: str
            source: Optional[str] = None
            now: Optional[str] = None
        
        class ExpenseBody(BaseModel):
            utterance: str
            tz: str
            source: Optional[str] = None
            now: Optional[str] = None
        
        # 构建请求体
        base_body = {
            "utterance": utterance,
            "tz": tz,
            "source": source,
            "now": now
        }
        
        # 根据意图类型调用对应的函数
        if intent_type == "time":
            body = IngestBody(**base_body)
            return ingest(body)
        elif intent_type == "expense":
            body = ExpenseBody(**base_body)
            return expense(body)
        elif intent_type == "food":
            body = FoodBody(**base_body)
            return food(body)
        elif intent_type == "exercise":
            body = ExerciseBody(**base_body)
            return exercise(body)
        else:
            raise HTTPException(status_code=400, detail=f"不支持的意图类型: {intent_type}")
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"路由失败: {str(e)}")
