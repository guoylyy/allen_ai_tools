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

def calculate_date_range_stats(entries: List[Dict[str, Any]], start_date: date, end_date: date) -> Dict[str, Any]:
    """计算日期范围统计数据"""
    parsed_entries = [parse_notion_entry(entry) for entry in entries]
    
    # 按分类统计
    category_stats = defaultdict(float)
    category_activities = defaultdict(list)
    
    # 按标签统计
    tag_stats = defaultdict(float)
    
    # 按日期统计
    daily_stats = defaultdict(float)
    
    total_duration = 0
    entry_count = len(parsed_entries)
    
    for entry in parsed_entries:
        duration = entry["duration"]
        category = entry["category"] or "未分类"
        tags = entry["tags"]
        entry_date = entry["start_time"].date() if entry["start_time"] else None
        
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
        
        # 按日期统计
        if entry_date:
            daily_stats[entry_date] += duration
        
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
    sorted_daily = sorted(daily_stats.items(), key=lambda x: x[0])
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_entries": entry_count,
        "total_duration": round(total_duration, 2),
        "categories": dict(sorted_categories),
        "category_percentages": category_percentages,
        "category_activities": dict(category_activities),
        "tags": dict(sorted_tags),
        "tag_percentages": tag_percentages,
        "daily_stats": dict(sorted_daily),
        "parsed_entries": parsed_entries
    }

def generate_date_range_report(stats: Dict[str, Any]) -> str:
    """生成日期范围报告文本"""
    report_lines = []
    
    report_lines.append(f"📊 {stats['start_date']} 到 {stats['end_date']} 时间统计报告")
    report_lines.append("=" * 50)
    report_lines.append(f"总条目数: {stats['total_entries']}")
    report_lines.append(f"总时长: {stats['total_duration']} 小时")
    report_lines.append(f"统计天数: {(stats['end_date'] - stats['start_date']).days + 1} 天")
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
    
    # 每日统计
    if stats['daily_stats']:
        report_lines.append("📅 每日统计:")
        for day, duration in stats['daily_stats'].items():
            report_lines.append(f"  {day}: {duration:.1f}h")
    
    report_lines.append("")
    
    # 详细活动列表（只显示前20条）
    report_lines.append("📝 详细活动 (前20条):")
    for entry in stats['parsed_entries'][:20]:
        activity = entry['activity'][:30] + "..." if len(entry['activity']) > 30 else entry['activity']
        start_time = entry['start_time'].strftime("%H:%M") if entry['start_time'] else "未知"
        end_time = entry['end_time'].strftime("%H:%M") if entry['end_time'] else "未知"
        date_str = entry['start_time'].strftime("%m-%d") if entry['start_time'] else "未知"
        report_lines.append(f"  {date_str} {start_time}-{end_time} | {entry['duration']:.1f}h | {activity}")
    
    if len(stats['parsed_entries']) > 20:
        report_lines.append(f"  ... 还有 {len(stats['parsed_entries']) - 20} 条记录")
    
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

def parse_expense_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """解析Notion花销条目数据"""
    properties = entry.get("properties", {})
    
    # 解析内容
    content = ""
    content_prop = properties.get("Content", {})
    if content_prop.get("title"):
        content = content_prop["title"][0].get("text", {}).get("content", "")
    
    # 解析金额
    amount = 0.0
    amount_prop = properties.get("Amount", {})
    if amount_prop.get("number"):
        amount = amount_prop["number"]
    
    # 解析日期
    expense_date = None
    date_prop = properties.get("Date", {})
    if date_prop.get("date") and date_prop["date"].get("start"):
        expense_date = datetime.fromisoformat(date_prop["date"]["start"]).date()
    
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
        "content": content,
        "amount": amount,
        "expense_date": expense_date,
        "category": category,
        "tags": tags,
        "created_time": entry.get("created_time"),
        "last_edited_time": entry.get("last_edited_time")
    }

def calculate_monthly_expense_stats(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """计算当月花销统计数据"""
    parsed_entries = [parse_expense_entry(entry) for entry in entries]
    
    # 按分类统计
    category_stats = defaultdict(float)
    category_items = defaultdict(list)
    
    # 按标签统计
    tag_stats = defaultdict(float)
    
    # 按日期统计
    daily_stats = defaultdict(float)
    
    total_amount = 0
    entry_count = len(parsed_entries)
    
    for entry in parsed_entries:
        amount = entry["amount"]
        category = entry["category"] or "未分类"
        tags = entry["tags"]
        entry_date = entry["expense_date"]
        
        # 分类统计
        category_stats[category] += amount
        category_items[category].append({
            "content": entry["content"],
            "amount": amount,
            "expense_date": entry["expense_date"]
        })
        
        # 标签统计
        for tag in tags:
            tag_stats[tag] += amount
        
        # 按日期统计
        if entry_date:
            daily_stats[entry_date] += amount
        
        total_amount += amount
    
    # 计算分类占比
    category_percentages = {}
    for category, amount in category_stats.items():
        if total_amount > 0:
            percentage = (amount / total_amount) * 100
            category_percentages[category] = round(percentage, 1)
    
    # 计算标签占比
    tag_percentages = {}
    for tag, amount in tag_stats.items():
        if total_amount > 0:
            percentage = (amount / total_amount) * 100
            tag_percentages[tag] = round(percentage, 1)
    
    # 按金额排序
    sorted_categories = sorted(category_stats.items(), key=lambda x: x[1], reverse=True)
    sorted_tags = sorted(tag_stats.items(), key=lambda x: x[1], reverse=True)
    sorted_daily = sorted(daily_stats.items(), key=lambda x: x[0])
    
    # 获取当月信息
    today = date.today()
    current_month = today.replace(day=1)
    
    return {
        "month": current_month,
        "total_entries": entry_count,
        "total_amount": round(total_amount, 2),
        "categories": dict(sorted_categories),
        "category_percentages": category_percentages,
        "category_items": dict(category_items),
        "tags": dict(sorted_tags),
        "tag_percentages": tag_percentages,
        "daily_stats": dict(sorted_daily),
        "parsed_entries": parsed_entries
    }

def generate_monthly_expense_report(stats: Dict[str, Any]) -> str:
    """生成当月花销报告文本"""
    report_lines = []
    
    month_name = stats['month'].strftime('%Y年%m月')
    report_lines.append(f"💰 {month_name} 花销统计报告")
    report_lines.append("=" * 50)
    report_lines.append(f"总条目数: {stats['total_entries']}")
    report_lines.append(f"总金额: {stats['total_amount']} 元")
    report_lines.append("")
    
    # 分类统计
    report_lines.append("📈 分类统计:")
    for category, amount in stats['categories'].items():
        percentage = stats['category_percentages'].get(category, 0)
        report_lines.append(f"  {category}: {amount:.2f}元 ({percentage}%)")
    
    report_lines.append("")
    
    # 标签统计
    if stats['tags']:
        report_lines.append("🏷️ 标签统计:")
        for tag, amount in list(stats['tags'].items())[:10]:  # 只显示前10个标签
            percentage = stats['tag_percentages'].get(tag, 0)
            report_lines.append(f"  #{tag}: {amount:.2f}元 ({percentage}%)")
    
    report_lines.append("")
    
    # 每日统计（只显示有花销的日期）
    if stats['daily_stats']:
        report_lines.append("📅 每日统计:")
        for day, amount in list(stats['daily_stats'].items())[:15]:  # 只显示前15天
            report_lines.append(f"  {day}: {amount:.2f}元")
        
        if len(stats['daily_stats']) > 15:
            report_lines.append(f"  ... 还有 {len(stats['daily_stats']) - 15} 天的记录")
    
    report_lines.append("")
    
    # 详细花销列表（只显示前20条）
    report_lines.append("📝 详细花销 (前20条):")
    for entry in stats['parsed_entries'][:20]:
        content = entry['content'][:30] + "..." if len(entry['content']) > 30 else entry['content']
        date_str = entry['expense_date'].strftime("%m-%d") if entry['expense_date'] else "未知"
        report_lines.append(f"  {date_str} | {entry['amount']:.2f}元 | {content}")
    
    if len(stats['parsed_entries']) > 20:
        report_lines.append(f"  ... 还有 {len(stats['parsed_entries']) - 20} 条记录")
    
    return "\n".join(report_lines)

def calculate_date_range_expense_stats(entries: List[Dict[str, Any]], start_date: date, end_date: date) -> Dict[str, Any]:
    """计算日期范围花销统计数据"""
    parsed_entries = [parse_expense_entry(entry) for entry in entries]
    
    # 按分类统计
    category_stats = defaultdict(float)
    category_items = defaultdict(list)
    
    # 按标签统计
    tag_stats = defaultdict(float)
    
    # 按日期统计
    daily_stats = defaultdict(float)
    
    total_amount = 0
    entry_count = len(parsed_entries)
    
    for entry in parsed_entries:
        amount = entry["amount"]
        category = entry["category"] or "未分类"
        tags = entry["tags"]
        entry_date = entry["expense_date"]
        
        # 分类统计
        category_stats[category] += amount
        category_items[category].append({
            "content": entry["content"],
            "amount": amount,
            "expense_date": entry["expense_date"]
        })
        
        # 标签统计
        for tag in tags:
            tag_stats[tag] += amount
        
        # 按日期统计
        if entry_date:
            daily_stats[entry_date] += amount
        
        total_amount += amount
    
    # 计算分类占比
    category_percentages = {}
    for category, amount in category_stats.items():
        if total_amount > 0:
            percentage = (amount / total_amount) * 100
            category_percentages[category] = round(percentage, 1)
    
    # 计算标签占比
    tag_percentages = {}
    for tag, amount in tag_stats.items():
        if total_amount > 0:
            percentage = (amount / total_amount) * 100
            tag_percentages[tag] = round(percentage, 1)
    
    # 按金额排序
    sorted_categories = sorted(category_stats.items(), key=lambda x: x[1], reverse=True)
    sorted_tags = sorted(tag_stats.items(), key=lambda x: x[1], reverse=True)
    sorted_daily = sorted(daily_stats.items(), key=lambda x: x[0])
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_entries": entry_count,
        "total_amount": round(total_amount, 2),
        "categories": dict(sorted_categories),
        "category_percentages": category_percentages,
        "category_items": dict(category_items),
        "tags": dict(sorted_tags),
        "tag_percentages": tag_percentages,
        "daily_stats": dict(sorted_daily),
        "parsed_entries": parsed_entries
    }

def generate_date_range_expense_report(stats: Dict[str, Any]) -> str:
    """生成日期范围花销报告文本"""
    report_lines = []
    
    report_lines.append(f"💰 {stats['start_date']} 到 {stats['end_date']} 花销统计报告")
    report_lines.append("=" * 50)
    report_lines.append(f"总条目数: {stats['total_entries']}")
    report_lines.append(f"总金额: {stats['total_amount']} 元")
    report_lines.append(f"统计天数: {(stats['end_date'] - stats['start_date']).days + 1} 天")
    report_lines.append("")
    
    # 分类统计
    report_lines.append("📈 分类统计:")
    for category, amount in stats['categories'].items():
        percentage = stats['category_percentages'].get(category, 0)
        report_lines.append(f"  {category}: {amount:.2f}元 ({percentage}%)")
    
    report_lines.append("")
    
    # 标签统计
    if stats['tags']:
        report_lines.append("🏷️ 标签统计:")
        for tag, amount in list(stats['tags'].items())[:10]:  # 只显示前10个标签
            percentage = stats['tag_percentages'].get(tag, 0)
            report_lines.append(f"  #{tag}: {amount:.2f}元 ({percentage}%)")
    
    report_lines.append("")
    
    # 每日统计
    if stats['daily_stats']:
        report_lines.append("📅 每日统计:")
        for day, amount in stats['daily_stats'].items():
            report_lines.append(f"  {day}: {amount:.2f}元")
    
    report_lines.append("")
    
    # 详细花销列表（只显示前20条）
    report_lines.append("📝 详细花销 (前20条):")
    for entry in stats['parsed_entries'][:20]:
        content = entry['content'][:30] + "..." if len(entry['content']) > 30 else entry['content']
        date_str = entry['expense_date'].strftime("%m-%d") if entry['expense_date'] else "未知"
        report_lines.append(f"  {date_str} | {entry['amount']:.2f}元 | {content}")
    
    if len(stats['parsed_entries']) > 20:
        report_lines.append(f"  ... 还有 {len(stats['parsed_entries']) - 20} 条记录")
    
    return "\n".join(report_lines)
