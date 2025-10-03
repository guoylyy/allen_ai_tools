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

def parse_with_deepseek(utterance: str, now: datetime, tz: str, categories: Optional[List[str]] = None) -> Dict[str, Any]:
    cats = categories or ["深度工作","会议","沟通","家庭","运动","学习","杂项"]
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
                    "tags": {"type":"array","items":{"type":"string"},"description":"从 #标签 中提取，无则空数组"},
                    "mentions": {"type":"array","items":{"type":"string"},"description":"从 @提及 中提取，无则空数组"},
                    "category": {"type":"string","description":"归类名，如不确定可为空字符串或从候选集中选择","enum": cats + [""]},
                    "confidence": {"type":"number","description":"0-1 置信度","minimum":0,"maximum":1},
                    "assumptions": {"type":"array","items":{"type":"string"},"description":"解析过程中的假设/补全，如“仅给出开始时间，结束按当前时间补齐”等"}
                },
                "required": ["start_iso","end_iso","activity","tags","mentions","category","confidence","assumptions"],
                "additionalProperties": False
            }
        }
    }]

    sys = f"""
你是一个“时间记录解析器”。任务：把用户的一句中文口语解析为结构化字段，并**仅**通过 function calling 输出，不要自然语言回答。

规则：
1) 解析中文时间短语，支持“9点到10点、10点半到现在、昨天晚上、上午/下午/晚上、刚才、昨晚23:10-0:40”等；
2) 只给一个时间点时，另一端按“当前时间”补齐；
3) 若出现跨日或顺序颠倒，确保 start_iso <= end_iso；
4) 必须输出 **ISO-8601 含时区**，时区以“当前时区”为准；
5) 若无明确活动文案，activity 用“未命名活动”；
6) 从文本中抽取 #标签 到 tags，@提及 到 mentions；
7) 尽量归到给定的类别集合；
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
    try:
        parsed = json.loads(args)
    except Exception as e:
        raise LLMParseError(f"Invalid JSON from function call: {e}; raw={args[:500]}")
    for k in ["start_iso","end_iso","activity","tags","mentions","category","confidence","assumptions"]:
        if k not in parsed:
            raise LLMParseError(f"Missing key in function args: {k}")
    return parsed
