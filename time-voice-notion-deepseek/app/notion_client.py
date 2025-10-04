# -*- coding: utf-8 -*-
from __future__ import annotations
import os
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta

NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
NOTION_DATABASE_ID = os.environ.get("NOTION_DATABASE_ID", "")
NOTION_DATABASE_ID2 = os.environ.get("NOTION_DATABASE_ID2", "")
NOTION_VERSION = "2022-06-28"

class NotionError(Exception):
    pass

def _headers():
    if not NOTION_TOKEN:
        raise NotionError("NOTION_TOKEN env var is missing.")
    return {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json; charset=utf-8",
    }

def iso(dt: datetime) -> str:
    return dt.isoformat()

def create_time_entry(
    activity: str,
    start: datetime,
    end: datetime,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    notes: Optional[str] = None,
):
    if not NOTION_DATABASE_ID:
        raise NotionError("NOTION_DATABASE_ID env var is missing.")
    props = {
        "Activity": {"title": [{"text": {"content": activity[:2000]}}]},
        "When": {"date": {"start": iso(start), "end": iso(end)}},
    }
    if category:
        props["Category"] = {"select": {"name": category}}
    if tags:
        props["Tags"] = {"multi_select": [{"name": t} for t in tags[:50]]}
    if notes:
        props["Notes"] = {"rich_text": [{"text": {"content": notes[:2000]}}]}
    payload = {
        "parent": {"database_id": NOTION_DATABASE_ID},
        "properties": props,
    }
    r = requests.post("https://api.notion.com/v1/pages", headers=_headers(), json=payload, timeout=20)
    if r.status_code >= 300:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise NotionError(f"Notion API error {r.status_code}: {detail}")
    return r.json()

def query_time_entries(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    """查询指定日期范围内的所有时间条目"""
    if not NOTION_DATABASE_ID:
        raise NotionError("NOTION_DATABASE_ID env var is missing.")
    
    # 构建查询过滤器
    filter_data = {
        "and": [
            {
                "property": "When",
                "date": {
                    "on_or_after": start_date.isoformat()
                }
            },
            {
                "property": "When",
                "date": {
                    "on_or_before": end_date.isoformat()
                }
            }
        ]
    }
    
    payload = {
        "filter": filter_data,
        "sorts": [
            {
                "property": "When",
                "direction": "ascending"
            }
        ]
    }
    
    r = requests.post(
        f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query",
        headers=_headers(),
        json=payload,
        timeout=20
    )
    
    if r.status_code >= 300:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise NotionError(f"Notion API error {r.status_code}: {detail}")
    
    result = r.json()
    return result.get("results", [])

def get_today_entries() -> List[Dict[str, Any]]:
    """获取今天的所有时间条目"""
    today = date.today()
    return query_time_entries(today, today)

def get_yesterday_entries() -> List[Dict[str, Any]]:
    """获取昨天的所有时间条目"""
    yesterday = date.today() - timedelta(days=1)
    return query_time_entries(yesterday, yesterday)

def create_expense_entry(
    content: str,
    amount: float,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    expense_date: Optional[datetime] = None,
    notes: Optional[str] = None,
):
    """创建花销记录条目"""
    if not NOTION_DATABASE_ID2:
        raise NotionError("NOTION_DATABASE_ID2 env var is missing.")
    
    # 如果没有提供日期，使用当前日期
    if expense_date is None:
        expense_date = datetime.now()
    
    props = {
        "Content": {"title": [{"text": {"content": content[:2000]}}]},
        "Amount": {"number": amount},
        "Date": {"date": {"start": expense_date.date().isoformat()}},
    }
    
    if category:
        props["Category"] = {"select": {"name": category}}
    if tags:
        props["Tags"] = {"multi_select": [{"name": t} for t in tags[:50]]}
    if notes:
        props["Notes"] = {"rich_text": [{"text": {"content": notes[:2000]}}]}
    
    payload = {
        "parent": {"database_id": NOTION_DATABASE_ID2},
        "properties": props,
    }
    
    r = requests.post("https://api.notion.com/v1/pages", headers=_headers(), json=payload, timeout=20)
    if r.status_code >= 300:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise NotionError(f"Notion API error {r.status_code}: {detail}")
    return r.json()
