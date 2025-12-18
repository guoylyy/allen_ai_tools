# -*- coding: utf-8 -*-
from __future__ import annotations
import os, json
from typing import Optional, Dict, Any, List
from datetime import datetime
import requests

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/beta")  # strict mode
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")  # or "deepseek-reasoner"

class LLMParseError(Exception):
    pass

def _headers():
    if not DEEPSEEK_API_KEY:
        raise LLMParseError("DEEPSEEK_API_KEY env var is missing.")
    return {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

def _chat_completions(payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{DEEPSEEK_BASE_URL.rstrip('/')}/chat/completions"
    r = requests.post(url, headers=_headers(), json=payload, timeout=40)
    if r.status_code >= 300:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise LLMParseError(f"DeepSeek API error {r.status_code}: {detail}")
    return r.json()

def parse_with_deepseek(utterance: str, now: datetime, tz: str, categories: Optional[List[str]] = None, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    cats = categories or ["工作","放松","睡觉","运动","学习","杂项"]
    tools = [{
        "type": "function",
        "function": {
            "name": "extract_time_log",
            "strict": True,
            "description": "从中文口语的一句话里抽取时间记录字段，并把相对时间解析成绝对时间（ISO 8601，含时区）。",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_iso": {"type":"string","description":"起始时间，ISO-8601（含时区），例：2025-10-03T09:00:00+08:00"},
                    "end_iso": {"type":"string","description":"结束时间，ISO-8601（含时区），例：2025-10-03T10:00:00+08:00"},
                    "activity": {"type":"string","description":"活动内容，保留动词短语即可"},
                    "tags": {"type":"array","items":{"type":"string"},"description":"、必须从候选集合中选取一个最合适的标签，不允许为空","enum": tags or []},
                    "mentions": {"type":"array","items":{"type":"string"},"description":"从 @提及 中提取，无则空数组"},
                    "category": {"type":"string","description":"归类名，必须从候选集中选择一个最合适的分类，不允许为空","enum": cats},
                    "confidence": {"type":"number","description":"0-1 置信度","minimum":0,"maximum":1},
                    "assumptions": {"type":"array","items":{"type":"string"},"description":"解析过程中的假设/补全，如\"仅给出开始时间，结束按当前时间补齐\"等"}
                },
                "required": ["start_iso","end_iso","activity","tags","mentions","category","confidence","assumptions"],
                "additionalProperties": False
            }
        }
    }]

    sys = f"""
你是一个"时间记录解析器"。任务：把用户的一句中文口语解析为结构化字段，并**仅**通过 function calling 输出，不要自然语言回答。

规则：
1) 解析中文时间短语，支持"9点到10点、10点半到现在、昨天晚上、上午/下午/晚上、刚才、昨晚23:10-0:40"等；
2) 只给一个时间点时，另一端按"当前时间"补齐；
3) 若出现跨日或顺序颠倒，确保 start_iso <= end_iso；
4) 必须输出 **ISO-8601 含时区**，时区以"当前时区"为准；
5) 若无明确活动文案，activity 用"未命名活动"；
6) 从文本中抽取 #标签 到 tags，@提及 到 mentions；
7) **必须从给定的类别集合中选择一个最合适的分类，不允许为空**；
8) 任何推断或默认值写入 assumptions；
9) 仅通过工具 extract_time_log 返回，不要普通文本。

当前时间: {now.isoformat()}
当前时区: {tz}
"""
    user = f"原始口述：{utterance}\n请抽取并返回函数参数。"

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role":"system","content":sys},
            {"role":"user","content":user}
        ],
        "tools": tools,
        "tool_choice": {"type":"function","function":{"name":"extract_time_log"}},
        "temperature": 0.2,
        "max_tokens": 400
    }
    data = _chat_completions(payload)
    choice = data.get("choices",[{}])[0]
    msg = choice.get("message",{})
    tool_calls = msg.get("tool_calls") or []
    if not tool_calls:
        raise LLMParseError("Model did not return a tool call.")
    func = tool_calls[0]["function"]
    args = func.get("arguments","{}")
    
    # 尝试修复常见的 JSON 格式错误
    def fix_json_string(json_str: str) -> str:
        """修复常见的 JSON 格式错误"""
        # 修复缺失的引号和冒号
        import re
        
        # 模式1: 修复 "field: value" 为 "field": value
        # 匹配类似 "tags: [], "mentions: [], "confidence: 0.95, "assumptions: [
        patterns = [
            (r'\"(tags):\s*(\[.*?\])', r'"\1": \2'),
            (r'\"(mentions):\s*(\[.*?\])', r'"\1": \2'),
            (r'\"(confidence):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(assumptions):\s*(\[)', r'"\1": \2'),
        ]
        
        fixed = json_str
        for pattern, replacement in patterns:
            fixed = re.sub(pattern, replacement, fixed)
        
        return fixed
    
    try:
        parsed = json.loads(args)
    except json.JSONDecodeError as e:
        # 尝试修复 JSON
        try:
            fixed_args = fix_json_string(args)
            parsed = json.loads(fixed_args)
        except json.JSONDecodeError as e2:
            # 如果修复后仍然失败，抛出原始错误
            raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    except Exception as e:
        raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    for k in ["start_iso","end_iso","activity","tags","mentions","category","confidence","assumptions"]:
        if k not in parsed:
            raise LLMParseError(f"Missing key in function args: {k}")
    
    # 确保 tags 不为空
    if not parsed.get("tags"):
        # 根据 activity 或 category 添加一个默认标签
        activity_lower = parsed.get("activity", "").lower()
        category = parsed.get("category", "")
        
        # 尝试从 activity 中提取关键词作为标签
        default_tags = []
        if "开车" in activity_lower or "驾驶" in activity_lower or "通勤" in activity_lower:
            default_tags = ["交通"]
        elif "吃饭" in activity_lower or "用餐" in activity_lower or "午餐" in activity_lower or "晚餐" in activity_lower:
            default_tags = ["吃饭"]
        elif "工作" in activity_lower or "办公" in activity_lower:
            default_tags = ["工作"]
        elif "学习" in activity_lower or "读书" in activity_lower:
            default_tags = ["学习"]
        elif "运动" in activity_lower or "健身" in activity_lower:
            default_tags = ["运动"]
        elif "休息" in activity_lower or "睡觉" in activity_lower:
            default_tags = ["休息"]
        else:
            # 使用 category 作为标签
            default_tags = [category] if category else ["杂项"]
        
        parsed["tags"] = default_tags
    
    return parsed

def parse_expense_with_deepseek(utterance: str, now: datetime, tz: str, categories: Optional[List[str]] = None, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """解析花销内容，自动识别金额、分类等"""
    cats = categories or ["餐饮", "交通", "购物", "娱乐", "医疗", "学习", "住房", "其他",  "工作"]
    tools = [{
        "type": "function",
        "function": {
            "name": "extract_expense_log",
            "strict": True,
            "description": "从中文口语的一句话里抽取花销记录字段，自动识别金额和分类。",
            "parameters": {
                "type": "object",
                "properties": {
                    "content": {"type":"string","description":"花销内容描述，如'午餐'、'打车'、'买书'等"},
                    "amount": {"type":"number","description":"金额，必须是数字"},
                    "category": {"type":"string","description":"分类名，必须从候选集中选择一个最合适的分类，不允许为空","enum": cats},
                    "tags": {"type":"array","items":{"type":"string"},"description":"从 #标签 中提取，无则从候选集合中选取一个最合适的标签，不允许为空","enum": tags or []},
                    "confidence": {"type":"number","description":"0-1 置信度","minimum":0,"maximum":1},
                    "assumptions": {"type":"array","items":{"type":"string"},"description":"解析过程中的假设/补全，如\"从上下文推断金额\"等"}
                },
                "required": ["content","amount","category","tags","confidence","assumptions"],
                "additionalProperties": False
            }
        }
    }]

    sys = f"""
你是一个"花销记录解析器"。任务：把用户的一句中文口语解析为结构化花销字段，并**仅**通过 function calling 输出，不要自然语言回答。

规则：
1) 从文本中识别金额数字，支持"花了50元、买了30块钱的书、打车花了15.5元"等表达；
2) 必须从给定的类别集合中选择一个最合适的分类，不允许为空；
3) 从文本中抽取 #标签 到 tags；
4) 任何推断或默认值写入 assumptions；
5) 仅通过工具 extract_expense_log 返回，不要普通文本。

当前时间: {now.isoformat()}
当前时区: {tz}
"""
    user = f"原始口述：{utterance}\n请抽取并返回函数参数。"

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role":"system","content":sys},
            {"role":"user","content":user}
        ],
        "tools": tools,
        "tool_choice": {"type":"function","function":{"name":"extract_expense_log"}},
        "temperature": 0.2,
        "max_tokens": 400
    }
    data = _chat_completions(payload)
    choice = data.get("choices",[{}])[0]
    msg = choice.get("message",{})
    tool_calls = msg.get("tool_calls") or []
    if not tool_calls:
        raise LLMParseError("Model did not return a tool call.")
    func = tool_calls[0]["function"]
    args = func.get("arguments","{}")
    
    # 使用相同的 JSON 修复逻辑
    def fix_json_string(json_str: str) -> str:
        """修复常见的 JSON 格式错误"""
        # 修复缺失的引号和冒号
        import re
        
        # 模式1: 修复 "field: value" 为 "field": value
        # 匹配类似 "calories: 400, "tags: ["健康"], "confidence: 0.95, "assumptions: [
        patterns = [
            (r'\"(calories):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(tags):\s*(\[.*?\])', r'"\1": \2'),
            (r'\"(confidence):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(assumptions):\s*(\[)', r'"\1": \2'),
        ]
        
        fixed = json_str
        for pattern, replacement in patterns:
            fixed = re.sub(pattern, replacement, fixed)
        
        return fixed
    
    try:
        parsed = json.loads(args)
    except json.JSONDecodeError as e:
        # 尝试修复 JSON
        try:
            fixed_args = fix_json_string(args)
            parsed = json.loads(fixed_args)
        except json.JSONDecodeError as e2:
            # 如果修复后仍然失败，抛出原始错误
            raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    except Exception as e:
        raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    for k in ["content","amount","category","tags","confidence","assumptions"]:
        if k not in parsed:
            raise LLMParseError(f"Missing key in function args: {k}")
    return parsed

def parse_food_with_deepseek(utterance: str, now: datetime, tz: str, categories: Optional[List[str]] = None, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """解析饮食内容，自动识别食物、热量、营养成分等"""
    cats = categories or ["早餐", "午餐", "晚餐", "零食", "加餐", "饮料"]
    tools = [{
        "type": "function",
        "function": {
            "name": "extract_food_log",
            "strict": True,
            "description": "从中文口语的一句话里抽取饮食记录字段，自动识别食物、热量和营养成分。",
            "parameters": {
                "type": "object",
                "properties": {
                    "food": {"type":"string","description":"食物名称，如'米饭'、'鸡胸肉'、'苹果'等"},
                    "calories": {"type":"number","description":"热量（卡路里），必须是数字"},
                    "category": {"type":"string","description":"餐次分类，必须从候选集中选择一个最合适的分类，不允许为空","enum": cats},
                    "tags": {"type":"array","items":{"type":"string"},"description":"从 #标签 中提取，无则从候选集合中选取一个最合适的标签，不允许为空","enum": tags or []},
                    "confidence": {"type":"number","description":"0-1 置信度","minimum":0,"maximum":1},
                    "assumptions": {"type":"array","items":{"type":"string"},"description":"解析过程中的假设/补全，如\"从食物名称推断热量\"等"}
                },
                "required": ["food","calories","category","tags","confidence","assumptions"],
                "additionalProperties": False
            }
        }
    }]

    sys = f"""
你是一个"饮食记录解析器"。任务：把用户的一句中文口语解析为结构化饮食字段，并**仅**通过 function calling 输出，不要自然语言回答。

规则：
1) 从文本中识别食物名称和热量，支持"吃了200克米饭约230大卡、一个苹果大约95卡、午餐吃了鸡胸肉和蔬菜约400卡"等表达；
2) 如果文本中没有明确热量，根据食物名称和常见分量进行合理估算；
3) 可以估算蛋白质、碳水化合物、脂肪含量（可选，默认0）；
4) 必须从给定的类别集合中选择一个最合适的餐次分类，不允许为空；
5) 从文本中抽取 #标签 到 tags；
6) 任何推断或默认值写入 assumptions；
7) 仅通过工具 extract_food_log 返回，不要普通文本。

当前时间: {now.isoformat()}
当前时区: {tz}
"""
    user = f"原始口述：{utterance}\n请抽取并返回函数参数。"

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role":"system","content":sys},
            {"role":"user","content":user}
        ],
        "tools": tools,
        "tool_choice": {"type":"function","function":{"name":"extract_food_log"}},
        "temperature": 0.2,
        "max_tokens": 400
    }
    data = _chat_completions(payload)
    choice = data.get("choices",[{}])[0]
    msg = choice.get("message",{})
    tool_calls = msg.get("tool_calls") or []
    if not tool_calls:
        raise LLMParseError("Model did not return a tool call.")
    func = tool_calls[0]["function"]
    args = func.get("arguments","{}")
    
    # 使用相同的 JSON 修复逻辑
    def fix_json_string(json_str: str) -> str:
        """修复常见的 JSON 格式错误"""
        # 修复缺失的引号和冒号
        import re
        
        # 模式1: 修复 "field: value" 为 "field": value
        # 匹配类似 "calories: 400, "tags: ["健康"], "confidence: 0.95, "assumptions: [
        patterns = [
            (r'\"(calories):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(tags):\s*(\[.*?\])', r'"\1": \2'),
            (r'\"(confidence):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(assumptions):\s*(\[)', r'"\1": \2'),
        ]
        
        fixed = json_str
        for pattern, replacement in patterns:
            fixed = re.sub(pattern, replacement, fixed)
        
        return fixed
    
    try:
        parsed = json.loads(args)
    except json.JSONDecodeError as e:
        # 尝试修复 JSON
        try:
            fixed_args = fix_json_string(args)
            parsed = json.loads(fixed_args)
        except json.JSONDecodeError as e2:
            # 如果修复后仍然失败，抛出原始错误
            raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    except Exception as e:
        raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    for k in ["food","calories","category","tags","confidence","assumptions"]:
        if k not in parsed:
            raise LLMParseError(f"Missing key in function args: {k}")
    
    # 确保有默认的营养成分值
    if "protein" not in parsed:
        parsed["protein"] = 0
    if "carbs" not in parsed:
        parsed["carbs"] = 0
    if "fat" not in parsed:
        parsed["fat"] = 0
    
    # 如果热量为0或非常小，根据食物名称进行估算
    if parsed.get("calories", 0) <= 10:  # 小于等于10卡路里视为无效
        food_name = parsed.get("food", "").lower()
        estimated_calories = 0
        
        # 常见食物热量估算（每份）
        calorie_estimates = {
            "米饭": 200, "面条": 300, "面包": 150, "鸡蛋": 70, "牛奶": 150,
            "鸡胸肉": 200, "牛肉": 250, "猪肉": 300, "鱼": 150, "虾": 100,
            "苹果": 95, "香蕉": 105, "橙子": 62, "草莓": 50, "西瓜": 85,
            "蔬菜": 50, "沙拉": 100, "汤": 150, "咖啡": 5, "茶": 2,
            "蛋糕": 350, "饼干": 150, "巧克力": 200, "冰淇淋": 250, "薯片": 160
        }
        
        # 尝试匹配食物名称
        for food_key, calories in calorie_estimates.items():
            if food_key in food_name:
                estimated_calories = calories
                break
        
        # 如果没有匹配，使用默认值
        if estimated_calories == 0:
            estimated_calories = 200  # 默认200卡路里
        
        parsed["calories"] = estimated_calories
        # 在assumptions中添加估算说明
        assumptions = parsed.get("assumptions", [])
        assumptions.append(f"根据食物名称'{food_name}'估算热量为{estimated_calories}卡路里")
        parsed["assumptions"] = assumptions
    
    return parsed

def parse_exercise_with_deepseek(utterance: str, now: datetime, tz: str, categories: Optional[List[str]] = None, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """解析运动内容，自动识别运动类型、持续时间、消耗热量等"""
    cats = categories or ["有氧运动", "力量训练", "柔韧性训练", "高强度间歇训练", "户外运动", "其他"]
    tools = [{
        "type": "function",
        "function": {
            "name": "extract_exercise_log",
            "strict": True,
            "description": "从中文口语的一句话里抽取运动记录字段，自动识别运动类型、持续时间和消耗热量。",
            "parameters": {
                "type": "object",
                "properties": {
                    "exercise_type": {"type":"string","description":"运动类型，如'跑步'、'游泳'、'举重'、'瑜伽'等"},
                    "duration_minutes": {"type":"number","description":"持续时间（分钟），必须是数字"},
                    "calories_burned": {"type":"number","description":"消耗热量（卡路里）"},
                    "intensity": {"type":"string","description":"运动强度，必须从候选集中选择一个","enum": ["低", "中", "高"]},
                    "category": {"type":"string","description":"运动分类，必须从候选集中选择一个最合适的分类，不允许为空","enum": cats},
                    "tags": {"type":"array","items":{"type":"string"},"description":"从 #标签 中提取，无则从候选集合中选取一个最合适的标签，不允许为空","enum": tags or []},
                    "confidence": {"type":"number","description":"0-1 置信度","minimum":0,"maximum":1},
                    "assumptions": {"type":"array","items":{"type":"string"},"description":"解析过程中的假设/补全，如\"从运动类型推断消耗热量\"等"}
                },
                "required": ["exercise_type","duration_minutes","calories_burned","intensity","category","tags","confidence","assumptions"],
                "additionalProperties": False
            }
        }
    }]

    sys = f"""
你是一个"运动记录解析器"。任务：把用户的一句中文口语解析为结构化运动字段，并**仅**通过 function calling 输出，不要自然语言回答。

规则：
1) 从文本中识别运动类型和持续时间，支持"跑步30分钟、游泳1小时、做了45分钟的力量训练"等表达；
2) 如果文本中没有明确持续时间，根据运动类型和常见情况进行合理估算；
3) 可以估算消耗热量（可选，默认0）；
4) 必须从给定的强度集合中选择一个最合适的强度（低、中、高）；
5) 必须从给定的类别集合中选择一个最合适的运动分类，不允许为空；
6) 从文本中抽取 #标签 到 tags；
7) 任何推断或默认值写入 assumptions；
8) 仅通过工具 extract_exercise_log 返回，不要普通文本。

当前时间: {now.isoformat()}
当前时区: {tz}
"""
    user = f"原始口述：{utterance}\n请抽取并返回函数参数。"

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role":"system","content":sys},
            {"role":"user","content":user}
        ],
        "tools": tools,
        "tool_choice": {"type":"function","function":{"name":"extract_exercise_log"}},
        "temperature": 0.2,
        "max_tokens": 400
    }
    data = _chat_completions(payload)
    choice = data.get("choices",[{}])[0]
    msg = choice.get("message",{})
    tool_calls = msg.get("tool_calls") or []
    if not tool_calls:
        raise LLMParseError("Model did not return a tool call.")
    func = tool_calls[0]["function"]
    args = func.get("arguments","{}")
    
    # 使用相同的 JSON 修复逻辑
    def fix_json_string(json_str: str) -> str:
        """修复常见的 JSON 格式错误"""
        # 修复缺失的引号和冒号
        import re
        
        # 模式1: 修复 "field: value" 为 "field": value
        # 匹配类似 "tags: [], "mentions: [], "confidence: 0.95, "assumptions: [
        patterns = [
            (r'\"(tags):\s*(\[.*?\])', r'"\1": \2'),
            (r'\"(mentions):\s*(\[.*?\])', r'"\1": \2'),
            (r'\"(confidence):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(assumptions):\s*(\[)', r'"\1": \2'),
            # 新增：修复exercise模块特有的字段
            (r'\"(duration_minutes):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(calories_burned):\s*([0-9.]+)', r'"\1": \2'),
            (r'\"(exercise_type):\s*("[^"]*")', r'"\1": \2'),
        ]
        
        fixed = json_str
        for pattern, replacement in patterns:
            fixed = re.sub(pattern, replacement, fixed)
        
        return fixed
    
    try:
        parsed = json.loads(args)
    except json.JSONDecodeError as e:
        # 尝试修复 JSON
        try:
            fixed_args = fix_json_string(args)
            parsed = json.loads(fixed_args)
        except json.JSONDecodeError as e2:
            # 如果修复后仍然失败，尝试更全面的修复
            try:
                # 更全面的修复：处理所有可能的字段
                import re
                patterns = [
                    (r'\"([a-zA-Z_]+):\s*([0-9.]+)', r'"\1": \2'),
                    (r'\"([a-zA-Z_]+):\s*\"([^\"]*)\"', r'"\1": "\2"'),
                    (r'\"([a-zA-Z_]+):\s*\[', r'"\1": ['),
                ]
                fixed2 = args
                for pattern, replacement in patterns:
                    fixed2 = re.sub(pattern, replacement, fixed2)
                parsed = json.loads(fixed2)
            except json.JSONDecodeError as e3:
                # 如果修复后仍然失败，抛出原始错误
                raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    except Exception as e:
        raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    for k in ["exercise_type","duration_minutes","calories_burned","intensity","category","tags","confidence","assumptions"]:
        if k not in parsed:
            raise LLMParseError(f"Missing key in function args: {k}")
    
    # 确保有默认的消耗热量值
    if "calories_burned" not in parsed:
        parsed["calories_burned"] = 0
    
    # 如果消耗热量为0或非常小，根据运动类型和持续时间进行估算
    if parsed.get("calories_burned", 0) <= 10:  # 小于等于10卡路里视为无效
        exercise_type = parsed.get("exercise_type", "").lower()
        duration_minutes = parsed.get("duration_minutes", 30)
        intensity = parsed.get("intensity", "中")
        
        # 基础代谢率估算（卡路里/分钟）
        # 根据运动类型和强度调整
        base_calories_per_minute = {
            "低": 5,   # 低强度运动
            "中": 8,   # 中等强度运动
            "高": 12   # 高强度运动
        }
        
        # 运动类型调整系数
        exercise_multiplier = {
            "跑步": 1.2, "游泳": 1.3, "骑行": 1.1, "步行": 0.8,
            "力量训练": 1.0, "举重": 1.1, "瑜伽": 0.7, "普拉提": 0.8,
            "篮球": 1.4, "足球": 1.5, "网球": 1.3, "羽毛球": 1.2,
            "跳绳": 1.6, "爬山": 1.4, "舞蹈": 1.0, "健身操": 1.1
        }
        
        # 获取基础消耗率
        base_rate = base_calories_per_minute.get(intensity, 8)
        
        # 获取运动类型调整系数
        multiplier = 1.0
        for exercise_key, mult in exercise_multiplier.items():
            if exercise_key in exercise_type:
                multiplier = mult
                break
        
        # 计算估算消耗热量
        estimated_calories = base_rate * duration_minutes * multiplier
        
        parsed["calories_burned"] = round(estimated_calories)
        # 在assumptions中添加估算说明
        assumptions = parsed.get("assumptions", [])
        assumptions.append(f"根据运动类型'{exercise_type}'、持续时间{duration_minutes}分钟、强度{intensity}估算消耗热量为{round(estimated_calories)}卡路里")
        parsed["assumptions"] = assumptions
    
    return parsed
