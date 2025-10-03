# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Dict, List, Any
from datetime import datetime, date, timedelta
from collections import defaultdict

def parse_notion_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """解析Notion条目数据"""
    properties = entry.get("properties", {})
    
    # 解析活动名称
    activity = ""
    activity_prop = properties.get("Activity", {})
    if activity_prop.get("title"):
        activity = activity_prop["title"][0].get("text", {}).get("content", "")
    
    # 解析时间范围
    start_time = None
    end_time = None
    duration = 0
    when_prop = properties.get("When", {})
    if when_prop.get("date"):
        date_info = when_prop["date"]
        if date_info.get("start"):
            start_time = datetime.fromisoformat(date_info["start"].replace("Z", "+00:00"))
        if date_info.get("end"):
            end_time = datetime.fromisoformat(date_info["end"].replace("Z", "+00:00"))
        
        # 计算持续时间（小时）
        if start_time and end_time:
            duration = (end_time - start_time).total_seconds() / 3600
    
    # 解析分类
    category = ""
    category_prop = properties.get("Category", {})
    if category_prop.get("select"):
        category = category_prop["select"].get("name", "")
    
    # 解析标签
    tags = []
    tags_prop = properties.get("Tags", {})
    if tags_prop.get("multi_select"):
        tags = [tag["name"] for tag in tags_prop["multi_select"]]
    
    return {
        "id": entry.get("id"),
        "activity": activity,
        "start_time": start_time,
        "end_time": end_time,
        "duration": duration,
        "category": category,
        "tags": tags,
        "created_time": entry.get("created_time"),
        "last_edited_time": entry.get("last_edited_time")
    }

def calculate_daily_stats(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """计算每日统计数据"""
    parsed_entries = [parse_notion_entry(entry) for entry in entries]
    
    # 按分类统计
    category_stats = defaultdict(float)
    category_activities = defaultdict(list)
    
    # 按标签统计
    tag_stats = defaultdict(float)
    
    total_duration = 0
    entry_count = len(parsed_entries)
    
    for entry in parsed_entries:
        duration = entry["duration"]
        category = entry["category"] or "未分类"
        tags = entry["tags"]
        
        # 分类统计
        category_stats[category] += duration
        category_activities[category].append({
            "activity": entry["activity"],
            "duration": duration,
            "start_time": entry["start_time"]
        })
        
        # 标签统计
        for tag in tags:
            tag_stats[tag] += duration
        
        total_duration += duration
    
    # 计算分类占比
    category_percentages = {}
    for category, duration in category_stats.items():
        if total_duration > 0:
            percentage = (duration / total_duration) * 100
            category_percentages[category] = round(percentage, 1)
    
    # 计算标签占比
    tag_percentages = {}
    for tag, duration in tag_stats.items():
        if total_duration > 0:
            percentage = (duration / total_duration) * 100
            tag_percentages[tag] = round(percentage, 1)
    
    # 按持续时间排序
    sorted_categories = sorted(category_stats.items(), key=lambda x: x[1], reverse=True)
    sorted_tags = sorted(tag_stats.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "date": date.today() - timedelta(days=1),  # 默认统计昨天
        "total_entries": entry_count,
        "total_duration": round(total_duration, 2),
        "categories": dict(sorted_categories),
        "category_percentages": category_percentages,
        "category_activities": dict(category_activities),
        "tags": dict(sorted_tags),
        "tag_percentages": tag_percentages,
        "parsed_entries": parsed_entries
    }

def generate_daily_report(stats: Dict[str, Any]) -> str:
    """生成每日报告文本"""
    report_lines = []
    
    report_lines.append(f"📊 {stats['date']} 时间统计报告")
    report_lines.append("=" * 40)
    report_lines.append(f"总条目数: {stats['total_entries']}")
    report_lines.append(f"总时长: {stats['total_duration']} 小时")
    report_lines.append("")
    
    # 分类统计
    report_lines.append("📈 分类统计:")
    for category, duration in stats['categories'].items():
        percentage = stats['category_percentages'].get(category, 0)
        report_lines.append(f"  {category}: {duration:.1f}h ({percentage}%)")
    
    report_lines.append("")
    
    # 标签统计
    if stats['tags']:
        report_lines.append("🏷️ 标签统计:")
        for tag, duration in list(stats['tags'].items())[:10]:  # 只显示前10个标签
            percentage = stats['tag_percentages'].get(tag, 0)
            report_lines.append(f"  #{tag}: {duration:.1f}h ({percentage}%)")
    
    report_lines.append("")
    
    # 详细活动列表
    report_lines.append("📝 详细活动:")
    for entry in stats['parsed_entries']:
        activity = entry['activity'][:30] + "..." if len(entry['activity']) > 30 else entry['activity']
        start_time = entry['start_time'].strftime("%H:%M") if entry['start_time'] else "未知"
        end_time = entry['end_time'].strftime("%H:%M") if entry['end_time'] else "未知"
        report_lines.append(f"  {start_time}-{end_time} | {entry['duration']:.1f}h | {activity}")
    
    return "\n".join(report_lines)

def generate_summary_for_notion(stats: Dict[str, Any]) -> Dict[str, Any]:
    """生成用于保存到Notion的摘要数据"""
    return {
        "date": stats["date"].isoformat(),
        "total_entries": stats["total_entries"],
        "total_duration": stats["total_duration"],
        "category_breakdown": stats["categories"],
        "primary_category": max(stats["categories"].items(), key=lambda x: x[1])[0] if stats["categories"] else "无数据",
        "top_tags": dict(list(stats["tags"].items())[:5]) if stats["tags"] else {}
    }
