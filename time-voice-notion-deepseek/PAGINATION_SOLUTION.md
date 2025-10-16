# 分页查询解决方案

## 问题描述

原来的 `get_current_month_expense_entries` 和 `get_current_month_time_entries` 函数只能查询返回最多100条数据，当本月数据超过100条时无法完整统计。

## 解决方案

### Notion API 分页机制

Notion API 使用分页机制来处理大量数据：
- 每次查询最多返回100条记录
- 响应中包含 `has_more` 字段表示是否还有更多数据
- 响应中包含 `next_cursor` 字段用于获取下一页数据
- 使用 `start_cursor` 参数来指定从哪个位置开始查询

### 实现细节

我们修改了两个核心查询函数：

1. **`query_expense_entries`** - 花销条目查询
2. **`query_time_entries`** - 时间条目查询

#### 分页查询逻辑

```python
all_results = []
has_more = True
start_cursor = None

while has_more:
    # 如果有下一页，添加 start_cursor 参数
    if start_cursor:
        payload["start_cursor"] = start_cursor
    
    # 执行 API 查询
    result = api_query(payload)
    all_results.extend(result.get("results", []))
    
    # 检查是否有更多数据
    has_more = result.get("has_more", False)
    start_cursor = result.get("next_cursor")
    
    # 如果没有更多数据，退出循环
    if not has_more or not start_cursor:
        break
```

### 影响范围

这个修改会影响以下函数：
- `get_current_month_expense_entries()` - 当前月花销统计
- `get_current_month_time_entries()` - 当前月时间统计
- `query_expense_entries()` - 任意日期范围花销查询
- `query_time_entries()` - 任意日期范围时间查询
- `get_yesterday_expense_entries()` - 昨天花销统计
- `get_yesterday_entries()` - 昨天时间统计
- `get_today_entries()` - 今天时间统计

### 向后兼容性

✅ **完全向后兼容** - 所有现有代码无需修改即可正常工作

### 性能考虑

- 对于数据量较少的月份，性能几乎没有影响
- 对于数据量大的月份，会进行多次 API 调用，但这是必要的
- 建议添加适当的延迟以避免 API 限制

### 测试方法

使用提供的测试脚本验证分页功能：

```bash
cd time-voice-notion-deepseek
python test_pagination.py
```

### 使用示例

```python
from notion_client import get_current_month_expense_entries

# 现在可以获取所有数据，不受100条限制
all_expenses = get_current_month_expense_entries()
print(f"本月共有 {len(all_expenses)} 条花销记录")

# 统计功能现在可以处理所有数据
from stats import calculate_monthly_expense_stats
stats = calculate_monthly_expense_stats(all_expenses)
print(f"本月总花销: {stats['total_amount']} 元")
```

## 总结

通过实现分页查询机制，我们解决了 `get_current_month_expense_entries` 只能返回100条数据的限制。现在无论本月有多少条记录，都能完整获取并进行准确的统计分析。
