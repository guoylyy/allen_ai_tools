# -*- coding: utf-8 -*-
from __future__ import annotations
import os
import requests
from typing import Optional, List
from datetime import datetime

NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
NOTION_DATABASE_ID = os.environ.get("NOTION_DATABASE_ID", "")
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
