# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import pytz
import yaml
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

from .llm_parser import parse_with_deepseek, parse_expense_with_deepseek, parse_food_with_deepseek, parse_exercise_with_deepseek, LLMParseError
from .notion_client import create_time_entry, create_expense_entry, create_food_entry, create_exercise_entry, NotionError
from .scheduler import start_scheduler, stop_scheduler, run_manual_stats
from .unified_ingest import classify_intent_with_deepseek, route_to_correct_endpoint, UnifiedIngestError

app = FastAPI(title="Voice → Notion Time Logger (DeepSeek)", version="2.0.0")

DEFAULT_TZ = os.environ.get("DEFAULT_TZ", "Asia/Shanghai")

# Load keyword→category mapping if available
MAPPING_PATH = os.environ.get("CATEGORY_MAPPING", "mapping.yml")
CATEGORY_MAPPING = None
if os.path.exists(MAPPING_PATH):
    try:
        with open(MAPPING_PATH, "r", encoding="utf-8") as f:
            CATEGORY_MAPPING = yaml.safe_load(f) or {}
    except Exception:
        CATEGORY_MAPPING = None

class IngestBody(BaseModel):
    utterance: str = Field(..., description="e.g., '9点到10点 写合同 #工作 @项目A'")
    tz: Optional[str] = Field(default=DEFAULT_TZ, description="IANA timezone, e.g., Asia/Shanghai")
    source: Optional[str] = None
    now: Optional[str] = Field(default=None, description="Override current time (ISO 8601)")

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/stats/start")
def start_stats_scheduler():
    """启动定时统计任务"""
    try:
        start_scheduler()
        return {"ok": True, "message": "定时统计任务已启动"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"启动定时任务失败: {str(e)}")

@app.post("/stats/stop")
def stop_stats_scheduler():
    """停止定时统计任务"""
    try:
        stop_scheduler()
        return {"ok": True, "message": "定时统计任务已停止"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"停止定时任务失败: {str(e)}")

class RunManualStatsBody(BaseModel):
    start_date: Optional[str] = Field(default=None, description="开始日期 (YYYY-MM-DD格式)")
    end_date: Optional[str] = Field(default=None, description="结束日期 (YYYY-MM-DD格式)")

@app.post("/stats/run-manual")
def run_manual_stats_endpoint(body: RunManualStatsBody):
    """手动运行一次统计（用于测试）"""
    try:
        run_manual_stats(body.start_date, body.end_date)
        message = "手动统计任务已执行（本月时间统计）"
        if body.start_date and body.end_date:
            message = f"手动统计任务已执行（{body.start_date} 到 {body.end_date}）"
        return {"ok": True, "message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"执行手动统计失败: {str(e)}")

@app.post("/expense-stats/run-manual")
def run_manual_expense_stats_endpoint():
    """手动运行一次花销统计（用于测试）"""
    try:
        from .scheduler import scheduler_instance
        scheduler_instance.generate_monthly_expense_stats()
        return {"ok": True, "message": "手动花销统计任务已执行"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"执行手动花销统计失败: {str(e)}")

@app.post("/unified-report/run-manual")
def run_manual_unified_report_endpoint():
    """手动运行一次统一报告（用于测试）"""
    try:
        from .scheduler import scheduler_instance
        scheduler_instance.generate_unified_daily_report()
        return {"ok": True, "message": "手动统一报告任务已执行"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"执行手动统一报告失败: {str(e)}")

@app.post("/ingest")
def ingest(body: IngestBody):
    try:
        # 正确处理时区：确保在北京时间早上8点前录入的数据算作当天的数据
        if body.now:
            now = datetime.fromisoformat(body.now)
        else:
            # 获取当前时间并添加北京时间时区
            tz = pytz.timezone(body.tz or DEFAULT_TZ)
            now = datetime.now(tz)
        
        cats = []
        tags = []
        if CATEGORY_MAPPING:
            cats = [v.get('category_name', k) for k, v in CATEGORY_MAPPING.items()]
            # 提取所有关键词作为标签候选集
            for v in CATEGORY_MAPPING.values():
                keywords = v.get('keywords', [])
                if isinstance(keywords, list):
                    tags.extend(keywords)
                else:
                    tags.append(str(keywords))
        # 去重并添加默认标签
        tags = list(set(tags))
        # 如果没有标签，使用默认标签
        if not tags:
            tags = ["工作", "学习", "放松", "运动", "杂项", "家庭", "社交", "健康"]
        parsed = parse_with_deepseek(body.utterance, now=now, tz=body.tz or DEFAULT_TZ, categories=cats or None, tags=tags or None)
        activity = parsed.get('activity') or '未命名活动'
        start = datetime.fromisoformat(parsed['start_iso'])
        end = datetime.fromisoformat(parsed['end_iso'])
        category = parsed.get('category') or None
        tags = parsed.get('tags') or []
        mentions = parsed.get('mentions') or []
        notes = f"source={body.source or ''}; mentions={','.join(mentions)}; raw={body.utterance}; assumptions={'; '.join(parsed.get('assumptions') or [])}; confidence={parsed.get('confidence')}"
        created = create_time_entry(
            activity=activity,
            start=start,
            end=end,
            category=category,
            tags=tags,
            notes=notes,
        )
        return {
            "ok": True,
            "parsed": {
                "activity": activity,
                "start": start.isoformat(),
                "end": end.isoformat(),
                "category": category,
                "tags": tags,
                "mentions": mentions,
            },
            "notion_page_id": created.get("id"),
            "notion_url": created.get("url"),
        }
    except LLMParseError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except NotionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FoodBody(BaseModel):
    utterance: str = Field(..., description="e.g., '午餐吃了鸡胸肉和蔬菜约400卡 #健康'")
    tz: Optional[str] = Field(default=DEFAULT_TZ, description="IANA timezone, e.g., Asia/Shanghai")
    source: Optional[str] = None
    now: Optional[str] = Field(default=None, description="Override current time (ISO 8601)")

@app.post("/food")
def food(body: FoodBody):
    """记录饮食"""
    try:
        # 处理时区
        if body.now:
            now = datetime.fromisoformat(body.now)
        else:
            # 获取当前时间并添加北京时间时区
            tz = pytz.timezone(body.tz or DEFAULT_TZ)
            now = datetime.now(tz)
        
        # 饮食分类和标签
        food_categories = ["早餐", "午餐", "晚餐", "零食", "加餐", "饮料"]
        food_tags = ["健康", "高蛋白", "低碳水", "低脂肪", "快餐", "自制"]
        
        parsed = parse_food_with_deepseek(
            body.utterance, 
            now=now, 
            tz=body.tz or DEFAULT_TZ, 
            categories=food_categories,
            tags=food_tags
        )
        
        food_name = parsed.get('food') or '未命名食物'
        calories = parsed.get('calories') or 0.0
        protein = parsed.get('protein') or 0.0
        carbs = parsed.get('carbs') or 0.0
        fat = parsed.get('fat') or 0.0
        category = parsed.get('category') or '其他'
        tags = parsed.get('tags') or []
        
        notes = f"source={body.source or ''}; raw={body.utterance}; assumptions={'; '.join(parsed.get('assumptions') or [])}; confidence={parsed.get('confidence')}"
        
        created = create_food_entry(
            food=food_name,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            category=category,
            tags=tags,
            food_date=now,
            notes=notes,
        )
        
        return {
            "ok": True,
            "parsed": {
                "food": food_name,
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fat": fat,
                "category": category,
                "tags": tags,
            },
            "notion_page_id": created.get("id"),
            "notion_url": created.get("url"),
        }
    except LLMParseError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except NotionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExerciseBody(BaseModel):
    utterance: str = Field(..., description="e.g., '跑步30分钟消耗了300卡 #有氧运动'")
    tz: Optional[str] = Field(default=DEFAULT_TZ, description="IANA timezone, e.g., Asia/Shanghai")
    source: Optional[str] = None
    now: Optional[str] = Field(default=None, description="Override current time (ISO 8601)")

@app.post("/exercise")
def exercise(body: ExerciseBody):
    """记录运动"""
    try:
        # 处理时区
        if body.now:
            now = datetime.fromisoformat(body.now)
        else:
            # 获取当前时间并添加北京时间时区
            tz = pytz.timezone(body.tz or DEFAULT_TZ)
            now = datetime.now(tz)
        
        # 运动分类和标签
        exercise_categories = ["有氧运动", "力量训练", "柔韧性训练", "高强度间歇训练", "户外运动", "其他"]
        exercise_tags = ["室内", "户外", "健身房", "家庭", "高强度", "低强度"]
        
        parsed = parse_exercise_with_deepseek(
            body.utterance, 
            now=now, 
            tz=body.tz or DEFAULT_TZ, 
            categories=exercise_categories,
            tags=exercise_tags
        )
        
        exercise_type = parsed.get('exercise_type') or '未命名运动'
        duration_minutes = parsed.get('duration_minutes') or 0.0
        calories_burned = parsed.get('calories_burned') or 0.0
        intensity = parsed.get('intensity') or '中'
        category = parsed.get('category') or '其他'
        tags = parsed.get('tags') or []
        
        notes = f"source={body.source or ''}; raw={body.utterance}; assumptions={'; '.join(parsed.get('assumptions') or [])}; confidence={parsed.get('confidence')}"
        
        created = create_exercise_entry(
            exercise_type=exercise_type,
            duration_minutes=duration_minutes,
            calories_burned=calories_burned,
            intensity=intensity,
            category=category,
            tags=tags,
            exercise_date=now,
            notes=notes,
        )
        
        return {
            "ok": True,
            "parsed": {
                "exercise_type": exercise_type,
                "duration_minutes": duration_minutes,
                "calories_burned": calories_burned,
                "intensity": intensity,
                "category": category,
                "tags": tags,
            },
            "notion_page_id": created.get("id"),
            "notion_url": created.get("url"),
        }
    except LLMParseError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except NotionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExpenseBody(BaseModel):
    utterance: str = Field(..., description="e.g., '午餐花了50元 #餐饮'")
    tz: Optional[str] = Field(default=DEFAULT_TZ, description="IANA timezone, e.g., Asia/Shanghai")
    source: Optional[str] = None
    now: Optional[str] = Field(default=None, description="Override current time (ISO 8601)")

@app.post("/expense")
def expense(body: ExpenseBody):
    """记录花销"""
    try:
        # 同样修复花销记录中的时区问题
        if body.now:
            now = datetime.fromisoformat(body.now)
        else:
            # 获取当前时间并添加北京时间时区
            tz = pytz.timezone(body.tz or DEFAULT_TZ)
            now = datetime.now(tz)
        
        # 花销分类映射，可以扩展
        expense_categories = ["餐饮", "交通", "购物", "娱乐", "医疗", "学习", "住房", "其他", "工作"]
        expense_tags = ["日常", "必要", "非必要"]
        
        parsed = parse_expense_with_deepseek(
            body.utterance, 
            now=now, 
            tz=body.tz or DEFAULT_TZ, 
            categories=expense_categories,
            tags=expense_tags
        )
        
        content = parsed.get('content') or '未命名花销'
        amount = parsed.get('amount') or 0.0
        category = parsed.get('category') or '其他'
        tags = parsed.get('tags') or []
        
        notes = f"source={body.source or ''}; raw={body.utterance}; assumptions={'; '.join(parsed.get('assumptions') or [])}; confidence={parsed.get('confidence')}"
        
        created = create_expense_entry(
            content=content,
            amount=amount,
            category=category,
            tags=tags,
            expense_date=now,
            notes=notes,
        )
        
        return {
            "ok": True,
            "parsed": {
                "content": content,
                "amount": amount,
                "category": category,
                "tags": tags,
            },
            "notion_page_id": created.get("id"),
            "notion_url": created.get("url"),
        }
    except LLMParseError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except NotionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UnifiedIngestBody(BaseModel):
    utterance: str = Field(..., description="用户指令，如'9点到10点写代码'、'午餐花了50元'、'跑步30分钟'等")
    tz: Optional[str] = Field(default=DEFAULT_TZ, description="IANA timezone, e.g., Asia/Shanghai")
    source: Optional[str] = None
    now: Optional[str] = Field(default=None, description="Override current time (ISO 8601)")
    force_type: Optional[str] = Field(default=None, description="强制指定类型: time, expense, food, exercise")

@app.post("/unified-ingest")
def unified_ingest(body: UnifiedIngestBody):
    """
    统一入口：接收用户指令，自动分类并路由到正确的API
    
    这个API会自动：
    1. 使用AI分析用户指令的意图
    2. 根据意图分类（时间、花销、饮食、运动）
    3. 调用对应的API进行处理
    4. 返回处理结果
    
    用户只需要向这一个API提交指令即可。
    """
    try:
        # 如果指定了强制类型，直接使用
        if body.force_type and body.force_type in ["time", "expense", "food", "exercise"]:
            intent_type = body.force_type
            classification_result = {
                "intent_type": intent_type,
                "confidence": 1.0,
                "reasoning": "用户强制指定类型",
                "extracted_info": {}
            }
        else:
            # 使用AI进行分类
            classification_result = classify_intent_with_deepseek(body.utterance)
            intent_type = classification_result["intent_type"]
        
        # 记录分类结果
        classification_info = {
            "intent_type": intent_type,
            "confidence": classification_result.get("confidence", 0),
            "reasoning": classification_result.get("reasoning", ""),
            "extracted_info": classification_result.get("extracted_info", {})
        }
        
        # 路由到正确的端点
        result = route_to_correct_endpoint(
            intent_type=intent_type,
            utterance=body.utterance,
            tz=body.tz or DEFAULT_TZ,
            source=body.source,
            now=body.now
        )
        
        # 在结果中添加分类信息
        result["classification"] = classification_info
        
        return result
        
    except UnifiedIngestError as e:
        raise HTTPException(status_code=400, detail=f"指令分类失败: {str(e)}")
    except HTTPException as e:
        # 重新抛出HTTP异常
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"统一入口处理失败: {str(e)}")
