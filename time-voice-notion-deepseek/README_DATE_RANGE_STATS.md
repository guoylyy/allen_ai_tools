# 日期范围统计功能使用说明

## 功能概述

手动运行的统计任务 `run-manual` 现在支持日期范围参数，可以统计指定日期范围内的所有时间消耗情况。

## API 使用方法

### 1. 不带日期参数（原有功能）

统计昨天的数据：

```bash
curl -X POST "http://localhost:8000/stats/run-manual" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. 带日期参数（新增功能）

统计指定日期范围内的数据：

```bash
curl -X POST "http://localhost:8000/stats/run-manual" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-10-01",
    "end_date": "2024-10-07"
  }'
```

### 3. Python 客户端示例

```python
import requests

# 统计昨天数据
response = requests.post("http://localhost:8000/stats/run-manual", json={})

# 统计指定日期范围
payload = {
    "start_date": "2024-10-01",
    "end_date": "2024-10-07"
}
response = requests.post("http://localhost:8000/stats/run-manual", json=payload)
```

## 参数说明

- `start_date`: 开始日期，格式为 `YYYY-MM-DD`（必填，当使用日期范围时）
- `end_date`: 结束日期，格式为 `YYYY-MM-DD`（必填，当使用日期范围时）

## 响应格式

### 成功响应

```json
{
  "ok": true,
  "message": "手动统计任务已执行（2024-10-01 到 2024-10-07）"
}
```

### 错误响应

```json
{
  "detail": "执行手动统计失败: 日期格式错误"
}
```

## 统计报告内容

当使用日期范围统计时，报告将包含：

1. **基本信息**
   - 统计日期范围
   - 总条目数
   - 总时长（小时）
   - 统计天数

2. **分类统计**
   - 按分类统计的时间分布
   - 每个分类的百分比

3. **标签统计**
   - 按标签统计的时间分布
   - 每个标签的百分比

4. **每日统计**
   - 每天的总时长

5. **详细活动列表**
   - 前20条详细活动记录
   - 包含日期、时间范围、时长和活动名称

## 注意事项

1. **日期格式**: 必须使用 `YYYY-MM-DD` 格式，例如 `2024-10-01`
2. **日期顺序**: 开始日期必须早于或等于结束日期
3. **数据范围**: 统计包含开始日期和结束日期当天的所有记录
4. **报告长度**: 详细活动列表最多显示20条记录，避免消息过长
5. **错误处理**: 如果日期格式错误或没有数据，会发送相应的错误消息到飞书

## 示例场景

### 场景1：统计一周数据
```bash
curl -X POST "http://localhost:8000/stats/run-manual" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-10-01",
    "end_date": "2024-10-07"
  }'
```

### 场景2：统计月度数据
```bash
curl -X POST "http://localhost:8000/stats/run-manual" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-10-01",
    "end_date": "2024-10-31"
  }'
```

### 场景3：统计季度数据
```bash
curl -X POST "http://localhost:8000/stats/run-manual" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-07-01",
    "end_date": "2024-09-30"
  }'
```

## 测试方法

可以使用提供的测试脚本进行功能验证：

```bash
cd time-voice-notion-deepseek
python test_date_range_stats.py
```

确保服务器正在运行（`uvicorn app.main:app --reload`）后再运行测试。
