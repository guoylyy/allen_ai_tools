# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import yaml

from .llm_parser import parse_with_deepseek, LLMParseError
from .notion_client import create_time_entry, NotionError
from .scheduler import start_scheduler, stop_scheduler, run_manual_stats

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

@app.post("/stats/run-manual")
def run_manual_stats_endpoint():
    """手动运行一次统计（用于测试）"""
    try:
        run_manual_stats()
        return {"ok": True, "message": "手动统计任务已执行"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"执行手动统计失败: {str(e)}")

@app.post("/ingest")
def ingest(body: IngestBody):
    try:
        now = datetime.fromisoformat(body.now) if body.now else datetime.now()
        cats = []
        tags = []
        if CATEGORY_MAPPING:
            cats = [v.get('category_name', k) for k, v in CATEGORY_MAPPING.items()]
            tags = [v.get('tag_name', k) for k, v in CATEGORY_MAPPING.items()]  
        parsed = parse_with_deepseek(body.utterance, now=now, tz=body.tz or DEFAULT_TZ, categories=cats or None)
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
