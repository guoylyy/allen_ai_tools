# 统一每日报告修改说明

## 修改背景
根据用户需求："计算每日unified-report的时候就每天计算当天的数据即可，再每天晚上23点30生成当天的数据，不必再0点15分生成前一天的数据发给飞书。"

## 修改内容

### 1. 在 `app/notion_client.py` 中添加了新函数
- `get_today_food_entries()` - 获取今天的饮食记录
- `get_today_exercise_entries()` - 获取今天的运动记录  
- `get_today_expense_entries()` - 获取今天的花销记录

注：`get_today_entries()` 函数原本已存在，用于获取今天的时间记录。

### 2. 在 `app/scheduler.py` 中修改了调度时间
- **原设置**：统一报告在每天 0:15 执行，统计昨天的数据
- **新设置**：统一报告在每天 23:30 执行，统计当天的数据

具体修改：
```python
# 修改前
unified_trigger = CronTrigger(
    hour=0,
    minute=15,
    timezone="Asia/Shanghai"
)

# 修改后  
unified_trigger = CronTrigger(
    hour=23,
    minute=30,
    timezone="Asia/Shanghai"
)
```

### 3. 在 `app/scheduler.py` 中修改了 `generate_unified_daily_report()` 函数
- **数据来源**：从获取昨天数据改为获取今天数据
  - `get_yesterday_entries()` → `get_today_entries()`
  - `get_yesterday_food_entries()` → `get_today_food_entries()`
  - `get_yesterday_exercise_entries()` → `get_today_exercise_entries()`
  - `get_yesterday_expense_entries()` → `get_today_expense_entries()`

- **日期显示**：将报告日期从昨天改为今天
  - 在时间统计、热量统计、花销统计中都将日期设置为今天

- **日志信息**：更新了日志信息，明确显示是"当天数据"

### 4. 更新了导入语句
在 `app/scheduler.py` 中添加了对新函数的导入：
```python
from .notion_client import get_today_entries, get_today_food_entries, 
                          get_today_exercise_entries, get_today_expense_entries, ...
```

## 影响范围

### 不受影响的调度任务
1. **每日时间统计**：仍在每天 0:01 执行，统计昨天的数据
2. **每日热量统计**：仍在每天 0:10 执行，统计昨天的数据  
3. **月度花销统计**：仍在每月1号 0:05 执行，统计上个月的数据

### 受影响的调度任务
1. **统一每日报告**：从每天 0:15 改为 23:30 执行，从统计昨天数据改为统计今天数据

## 测试验证
已创建测试脚本 `test_today_functions.py` 验证：
- 所有新添加的函数均可正常调用
- 函数能正确获取数据（测试时获取到实际数据）
- 语法检查通过，无编译错误

## 注意事项
1. 所有时间基于东八区（Asia/Shanghai）时区
2. 数据获取函数使用 `date.today()` 获取当前日期，基于系统时区
3. 如果需要在其他时区使用，可能需要调整时区设置
4. 修改后，统一报告将在每天晚上23:30发送当天的综合报告，而不是第二天0:15发送前一天的报告

## 部署说明
1. 确保环境变量正确设置（NOTION_TOKEN、NOTION_DATABASE_ID等）
2. 重启调度器服务以应用新的调度时间
3. 监控日志确认修改生效

## 回滚方案
如果需要回滚到原来的设置：
1. 将 `app/scheduler.py` 中的调度时间改回 0:15
2. 将 `generate_unified_daily_report()` 函数改回使用昨天的数据函数
3. 不需要删除 `app/notion_client.py` 中的新函数，它们可以保留供其他用途使用
