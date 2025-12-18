# 语音一句话 → Notion 时间记录（DeepSeek 解析版 / FastAPI）

## 项目概述

基于 DeepSeek LLM 的语音转时间记录系统，支持时间记录和花销记录，通过语音输入自动解析并同步到 Notion 数据库。

## 核心功能

### 🎤 语音输入解析
- **时间记录**: 解析口语时间表达（"9点到10点 写合同 #工作"）
- **花销记录**: 解析消费记录（"午餐花了50元 #餐饮"）
- **饮食记录**: 解析饮食内容（"午餐吃了鸡胸肉和蔬菜约400卡 #健康"）
- **运动记录**: 解析运动内容（"跑步30分钟消耗了300卡 #有氧运动"）
- **智能分类**: 基于 DeepSeek Function Calling 的灵活解析

### 📊 自动统计报告
- **时间统计**: 每日自动统计前一天的时间使用情况
- **花销统计**: 每月自动统计上个月的花销情况
- **热量统计**: 每日自动统计前一天的热量缺口/盈余
- **日期范围统计**: 支持手动指定日期范围统计
- **飞书通知**: 通过飞书机器人发送统计报告

## 快速开始

### 环境配置
复制 `.env.example` 为 `.env` 并配置：
```bash
# Notion配置
NOTION_TOKEN=your_notion_integration_token_here
NOTION_DATABASE_ID=your_time_database_id_here  # 时间记录数据库
NOTION_DATABASE_ID2=your_expense_database_id_here  # 花销记录数据库
NOTION_DATABASE_ID3=your_food_database_id_here  # 饮食记录数据库
NOTION_DATABASE_ID4=your_exercise_database_id_here  # 运动记录数据库

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
- `POST /unified-ingest` - **统一入口**：接收用户指令，自动分类并路由到正确的API（推荐使用）
- `POST /ingest` - 时间记录入口
- `POST /expense` - 花销记录入口
- `POST /food` - 饮食记录入口
- `POST /exercise` - 运动记录入口
- `POST /stats/run-manual` - 手动运行统计（支持日期范围）
- `POST /expense-stats/run-manual` - 手动运行花销统计
- `POST /stats/start` - 启动定时任务
- `POST /stats/stop` - 停止定时任务

### 统一入口 API (`/unified-ingest`)
这个API会自动：
1. 使用AI分析用户指令的意图
2. 根据意图分类（时间、花销、饮食、运动）
3. 调用对应的API进行处理
4. 返回处理结果

用户只需要向这一个API提交指令即可，无需关心具体是哪种类型的记录。

### 使用示例
```bash
# 统一入口（推荐）- 自动分类
curl -X POST http://localhost:8000/unified-ingest \
  -H "Content-Type: application/json" \
  -d '{"utterance":"9点到10点 写合同 #工作","source":"cli"}'

curl -X POST http://localhost:8000/unified-ingest \
  -H "Content-Type: application/json" \
  -d '{"utterance":"午餐花了50元 #餐饮","source":"cli"}'

curl -X POST http://localhost:8000/unified-ingest \
  -H "Content-Type: application/json" \
  -d '{"utterance":"午餐吃了鸡胸肉和蔬菜约400卡 #健康","source":"cli"}'

curl -X POST http://localhost:8000/unified-ingest \
  -H "Content-Type: application/json" \
  -d '{"utterance":"跑步30分钟消耗了300卡 #有氧运动","source":"cli"}'

# 强制指定类型（可选）
curl -X POST http://localhost:8000/unified-ingest \
  -H "Content-Type: application/json" \
  -d '{"utterance":"测试","force_type":"time","source":"cli"}'

# 原始API（仍然可用）
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"utterance":"9点到10点 写合同 #工作","source":"cli"}'

curl -X POST http://localhost:8000/expense \
  -H "Content-Type: application/json" \
  -d '{"utterance":"午餐花了50元 #餐饮","source":"cli"}'

curl -X POST http://localhost:8000/food \
  -H "Content-Type: application/json" \
  -d '{"utterance":"午餐吃了鸡胸肉和蔬菜约400卡 #健康","source":"cli"}'

curl -X POST http://localhost:8000/exercise \
  -H "Content-Type: application/json" \
  -d '{"utterance":"跑步30分钟消耗了300卡 #有氧运动","source":"cli"}'

# 日期范围统计
curl -X POST http://localhost:8000/stats/run-manual \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2024-10-01","end_date":"2024-10-31"}'
```

## 定时任务

- **时间统计**: 每天 00:01 执行（统计前一天数据）
- **热量统计**: 每天 00:10 执行（统计前一天数据）
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

update readme in 2025-10-14
