# 每日时间统计定时任务

这个功能会在每天23:59自动从Notion获取当天的所有时间记录，进行统计分类汇总，并通过飞书机器人发送报告。

## 功能特性

- 📊 **自动统计**: 每天23:59自动执行
- 🏷️ **分类汇总**: 按分类和标签统计时间分布
- 📈 **详细报告**: 包含总时长、分类占比、详细活动列表
- 🤖 **飞书通知**: 通过飞书机器人发送统计报告
- 🔧 **手动控制**: 支持手动启动/停止/测试

## 环境变量配置

复制 `.env.example` 为 `.env` 并配置以下参数：

```bash
# Notion配置
NOTION_TOKEN=your_notion_integration_token_here
NOTION_DATABASE_ID=your_notion_database_id_here

# 飞书机器人配置
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/your_webhook_token_here

# 时区配置
DEFAULT_TZ=Asia/Shanghai

# 分类映射文件路径
CATEGORY_MAPPING=mapping.yml
```

## API端点

### 启动定时任务
```bash
POST /stats/start
```

### 停止定时任务
```bash
POST /stats/stop
```

### 手动运行统计（测试用）
```bash
POST /stats/run-manual
```

## 报告示例

```
📊 2025-10-02 时间统计报告
========================================
总条目数: 8
总时长: 12.5 小时

📈 分类统计:
  工作: 6.5h (52.0%)
  学习: 3.0h (24.0%)
  运动: 1.5h (12.0%)
  放松: 1.5h (12.0%)

🏷️ 标签统计:
  #项目A: 4.0h (32.0%)
  #阅读: 2.0h (16.0%)
  #健身: 1.5h (12.0%)

📝 详细活动:
  09:00-12:00 | 3.0h | 写代码 #项目A
  13:00-14:00 | 1.0h | 开会讨论需求
  14:00-16:00 | 2.0h | 继续写代码 #项目A
  16:00-17:00 | 1.0h | 阅读技术文档 #阅读
  18:00-19:30 | 1.5h | 健身房锻炼 #健身
  20:00-21:30 | 1.5h | 学习新框架 #学习
  21:30-23:00 | 1.5h | 看电影放松
```

## 部署说明

### Docker部署
```bash
docker build -t time-voice-notion-deepseek .
docker run -d --env-file .env -p 8000:8000 time-voice-notion-deepseek
```

### 直接运行
```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 注意事项

1. **时区设置**: 确保服务器时区与 `DEFAULT_TZ` 一致
2. **Notion权限**: Notion集成需要有读取数据库的权限
3. **飞书机器人**: 需要配置飞书群聊机器人的webhook URL
4. **定时任务**: 应用启动时会自动启动定时任务

## 故障排除

如果定时任务没有执行，可以：

1. 检查日志输出
2. 使用 `/stats/run-manual` 手动测试
3. 确认环境变量配置正确
4. 检查Notion数据库结构和权限
