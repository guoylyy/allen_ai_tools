# 语音一句话 → Notion 时间记录（DeepSeek 解析版 / FastAPI）

## 项目概述

基于 DeepSeek LLM 的语音转时间记录系统，支持时间记录和花销记录，通过语音输入自动解析并同步到 Notion 数据库。

## 核心功能

### 🎤 语音输入解析
- **时间记录**: 解析口语时间表达（"9点到10点 写合同 #工作"）
- **花销记录**: 解析消费记录（"午餐花了50元 #餐饮"）
- **智能分类**: 基于 DeepSeek Function Calling 的灵活解析

### 📊 自动统计报告
- **时间统计**: 每日自动统计前一天的时间使用情况
- **花销统计**: 每月自动统计上个月的花销情况
- **日期范围统计**: 支持手动指定日期范围统计
- **飞书通知**: 通过飞书机器人发送统计报告

## 快速开始

### 环境配置
复制 `.env.example` 为 `.env` 并配置：
```bash
# Notion配置
NOTION_TOKEN=your_notion_integration_token_here
NOTION_DATABASE_ID=your_time_database_id_here
NOTION_DATABASE_ID2=your_expense_database_id_here

# DeepSeek配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/beta
DEEPSEEK_MODEL=deepseek-chat

# 飞书配置（可选）
FEISHU_WEBHOOK_URL=your_feishu_webhook_url_here

# 时区配置
DEFAULT_TZ=Asia/Shanghai
```

### 部署运行

#### Docker 部署
```bash
docker build -t voice-notion .
docker run -d --env-file .env -p 8000:8000 voice-notion
```

#### 本地运行
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API 接口

### 主要接口
- `POST /ingest` - 时间记录入口
- `POST /expense` - 花销记录入口
- `POST /stats/run-manual` - 手动运行统计（支持日期范围）
- `POST /expense-stats/run-manual` - 手动运行花销统计
- `POST /stats/start` - 启动定时任务
- `POST /stats/stop` - 停止定时任务

### 使用示例
```bash
# 时间记录
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"utterance":"9点到10点 写合同 #工作","source":"cli"}'

# 花销记录
curl -X POST http://localhost:8000/expense \
  -H "Content-Type: application/json" \
  -d '{"utterance":"午餐花了50元 #餐饮","source":"cli"}'

# 日期范围统计
curl -X POST http://localhost:8000/stats/run-manual \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2024-10-01","end_date":"2024-10-31"}'
```

## 定时任务

- **时间统计**: 每天 00:01 执行（统计前一天数据）
- **花销统计**: 每月 1 号 00:05 执行（统计上个月数据）

## 移动端集成（Tasker）

### Android 语音输入配置
1. **Input → Get Voice**（语音输入）
2. **Net → HTTP Request** 发送到服务器
3. 配置自启动、后台权限

### 请求示例
```json
{"utterance":"%VOICE","source":"tasker"}
```

## 自定义配置

- `app/mapping.yml` - 分类映射配置
- 环境变量切换模型（`deepseek-chat` / `deepseek-reasoner`）
- 提示词可加入行业词表提升分类准确率

## 测试

测试脚本位于 `tests/` 目录：
```bash
# 运行所有测试
cd tests && python -m pytest

# 运行特定测试
python tests/test_expense_stats.py
python tests/test_date_range_stats.py
```

## 故障排除

1. **检查环境变量配置**
2. **验证 Notion 数据库权限**
3. **查看应用日志输出**
4. **使用手动测试接口验证功能**

## 参考文档

- DeepSeek API 文档
- Notion API 文档
- FastAPI 文档
