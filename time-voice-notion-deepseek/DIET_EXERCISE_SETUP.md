# 饮食和运动记录功能设置指南

## 概述

已成功为项目添加了饮食和运动记录功能，包括：
1. 饮食记录 API (`/food`)
2. 运动记录 API (`/exercise`)
3. 每日热量缺口计算
4. 自动通知功能

## 设置步骤

### 1. 创建 Notion 数据库

需要创建两个新的 Notion 数据库：

#### 饮食记录数据库 (NOTION_DATABASE_ID3)
**字段要求：**
- `Food` (Title) - 食物名称
- `Calories` (Number) - 热量（卡路里）
- `Protein` (Number) - 蛋白质（克）
- `Carbs` (Number) - 碳水化合物（克）
- `Fat` (Number) - 脂肪（克）
- `Date` (Date) - 日期
- `Category` (Select) - 餐次分类（早餐、午餐、晚餐、零食、加餐、饮料）
- `Tags` (Multi-select) - 标签
- `Notes` (Rich text) - 备注

#### 运动记录数据库 (NOTION_DATABASE_ID4)
**字段要求：**
- `Exercise` (Title) - 运动类型
- `Duration` (Number) - 持续时间（分钟）
- `Calories Burned` (Number) - 消耗热量（卡路里）
- `Intensity` (Select) - 强度（低、中、高）
- `Date` (Date) - 日期
- `Category` (Select) - 运动分类（有氧运动、力量训练、柔韧性训练、高强度间歇训练、户外运动、其他）
- `Tags` (Multi-select) - 标签
- `Notes` (Rich text) - 备注

### 2. 更新环境变量

在 `.env` 文件中添加：
```
NOTION_DATABASE_ID3=your_food_database_id_here
NOTION_DATABASE_ID4=your_exercise_database_id_here
```

### 3. 启动服务

```bash
# 本地运行
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 或使用 Docker
docker build -t voice-notion .
docker run -d --env-file .env -p 8000:8000 voice-notion
```

## 使用示例

### 记录饮食
```bash
curl -X POST http://localhost:8000/food \
  -H "Content-Type: application/json" \
  -d '{"utterance":"午餐吃了鸡胸肉和蔬菜约400卡 #健康","source":"cli"}'
```

### 记录运动
```bash
curl -X POST http://localhost:8000/exercise \
  -H "Content-Type: application/json" \
  -d '{"utterance":"跑步30分钟消耗了300卡 #有氧运动","source":"cli"}'
```

### 移动端集成 (Tasker)
使用 Tasker 配置语音输入，发送到新的端点：
- 饮食记录：`/food`
- 运动记录：`/exercise`

## 热量统计功能

### 自动统计
- **时间**: 每天 00:10（东八区时间）
- **内容**: 统计前一天的饮食和运动数据
- **计算**: 热量缺口 = (基础代谢 + 运动消耗) - 饮食摄入
- **通知**: 通过飞书机器人发送报告

### 报告示例
```
🔥 2025-12-17 热量统计报告
==================================================
📊 热量总结:
  基础代谢: 1800.0 卡
  运动消耗: 300 卡
  总消耗: 2100.0 卡
  总摄入: 700 卡
  ✅ 热量缺口: 1400.0 卡 (减脂)

🥗 营养成分:
  蛋白质: 55.0g (31.4%)
  碳水化合物: 30.0g (17.1%)
  脂肪: 25.0g (32.1%)

🍽️ 餐次统计:
  早餐: 300 卡
  午餐: 400 卡

🏃 运动统计:
  有氧运动: 300 卡
```

## 自定义配置

### 基础代谢率调整
在 `app/scheduler.py` 的 `generate_daily_calorie_stats` 方法中，可以调整 BMR 值：
```python
bmr = 1800.0  # 根据用户信息调整
```

### 分类和标签
在 `app/main.py` 中可以修改：
- 饮食分类：`food_categories`
- 饮食标签：`food_tags`
- 运动分类：`exercise_categories`
- 运动标签：`exercise_tags`

## 故障排除

### 常见问题

1. **API 返回 502 错误**
   - 检查 DeepSeek API 密钥配置
   - 验证 Notion 数据库权限

2. **数据未保存到 Notion**
   - 确认数据库 ID 正确
   - 检查字段名称是否匹配

3. **热量计算不准确**
   - 确认饮食记录包含热量数据
   - 检查运动记录包含消耗热量

4. **定时任务未执行**
   - 检查飞书 webhook URL 配置
   - 查看应用日志输出

### 日志查看
```bash
# 查看应用日志
tail -f app.log

# 或查看 Docker 日志
docker logs <container_id>
```

## 扩展功能建议

1. **个性化配置**
   - 添加用户配置文件存储 BMR、目标热量等
   - 支持多种通知方式（微信、钉钉等）

2. **数据分析**
   - 添加周/月热量趋势分析
   - 营养成分长期统计

3. **移动应用**
   - 开发专用移动应用
   - 添加拍照识别食物功能

4. **智能建议**
   - 基于热量缺口提供饮食建议
   - 推荐适合的运动计划

## 技术支持

如有问题，请参考：
- 项目 README.md
- Notion API 文档
- DeepSeek API 文档
- FastAPI 文档
