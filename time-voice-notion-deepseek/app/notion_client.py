# -*- coding: utf-8 -*-
from __future__ import annotations
import os
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
import pytz

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
    
    # 将东八区日期转换为UTC时间进行查询
    # 东八区比UTC快8小时，所以东八区的00:00对应UTC的前一天16:00
    # 东八区的23:59对应UTC的当天15:59
    shanghai_tz = pytz.timezone('Asia/Shanghai')
    utc_tz = pytz.UTC
    
    # 将开始日期的00:00转换为UTC时间
    start_datetime_sh = shanghai_tz.localize(
        datetime.combine(start_date, datetime.min.time())
    )
    start_datetime_utc = start_datetime_sh.astimezone(utc_tz)
    
    # 将结束日期的23:59:59转换为UTC时间
    end_datetime_sh = shanghai_tz.localize(
        datetime.combine(end_date, datetime.max.time().replace(hour=23, minute=59, second=59))
    )
    end_datetime_utc = end_datetime_sh.astimezone(utc_tz)
    
    # 构建查询过滤器，使用UTC时间
    filter_data = {
        "and": [
            {
                "property": "When",
                "date": {
                    "on_or_after": start_datetime_utc.isoformat()
                }
            },
            {
                "property": "When",
                "date": {
                    "on_or_before": end_datetime_utc.isoformat()
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
    """获取今天的所有时间条目（基于东八区时间）"""
    today = date.today()
    return query_time_entries(today, today)

def get_yesterday_entries() -> List[Dict[str, Any]]:
    """获取昨天的所有时间条目（基于东八区时间）"""
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

def query_expense_entries(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    """查询指定日期范围内的所有花销条目"""
    if not NOTION_DATABASE_ID2:
        raise NotionError("NOTION_DATABASE_ID2 env var is missing.")
    
    # 构建查询过滤器
    filter_data = {
        "and": [
            {
                "property": "Date",
                "date": {
                    "on_or_after": start_date.isoformat()
                }
            },
            {
                "property": "Date",
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
                "property": "Date",
                "direction": "ascending"
            }
        ]
    }
    
    r = requests.post(
        f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID2}/query",
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

def get_yesterday_expense_entries() -> List[Dict[str, Any]]:
    """获取昨天的所有花销条目（基于东八区时间）"""
    yesterday = date.today() - timedelta(days=1)
    return query_expense_entries(yesterday, yesterday)

def get_current_month_expense_entries() -> List[Dict[str, Any]]:
    """获取当前月的所有花销条目"""
    today = date.today()
    # 当月第一天
    first_day = today.replace(day=1)
    # 当月最后一天
    if today.month == 12:
        last_day = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        last_day = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    
    return query_expense_entries(first_day, last_day)
