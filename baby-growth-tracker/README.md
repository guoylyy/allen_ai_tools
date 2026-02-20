# 路谦成长记 - 微信服务号

小孩成长记录微信服务号，帮助家庭轻松记录和追踪宝宝成长数据。

## 功能特性

- ✅ 快速记录（睡觉、吃饭、玩耍、学习、情绪、里程碑）
- ✅ 自然语言输入，智能识别
- ✅ 微信菜单快捷操作
- ✅ 自动日报推送
- ✅ 多人协作记录
- ✅ 数据可视化分析

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入微信服务号配置和数据库配置。

### 3. 启动服务

```bash
npm start
```

开发模式：

```bash
npm run dev
```

## 使用方式

### 记录示例

直接在微信中发送：

```
睡觉 14:00-16:00
吃饭 奶粉 150ml
玩耍 开心 在公园玩了 1 小时
学习 阅读 30 分钟
情绪 开心
里程碑 第一次叫妈妈
```

### 查询命令

```
查询 - 查看今日记录
昨天 - 查看昨日记录
帮助 - 查看使用帮助
```

## 项目结构

```
baby-growth-tracker/
├── src/
│   ├── index.js              # 主入口
│   ├── wechat/
│   │   ├── api.js            # 微信 API 封装
│   │   └── messageHandler.js # 消息处理
│   ├── database/
│   │   └── connection.js     # 数据库连接
│   └── services/
│       └── reportService.js  # 报告服务
├── .env.example              # 环境变量模板
├── package.json
└── README.md
```

## 微信配置

### 1. 服务器配置

在微信服务号后台 → 设置与开发 → 基本配置：

- URL: `https://your-domain.com/wechat`
- Token: 自定义 token（需与.env 中一致）
- EncodingAESKey: 随机生成

### 2. 自定义菜单

菜单配置示例：

```json
{
  "button": [
    {
      "type": "click",
      "name": "📝 快速记录",
      "key": "RECORD_MAIN",
      "sub_button": [
        { "type": "click", "name": "😴 睡觉", "key": "RECORD_SLEEP" },
        { "type": "click", "name": "🍼 吃饭", "key": "RECORD_EAT" },
        { "type": "click", "name": "🎮 玩耍", "key": "RECORD_PLAY" }
      ]
    },
    {
      "type": "click",
      "name": "📊 成长报告",
      "key": "TODAY_REPORT"
    },
    {
      "type": "view",
      "name": "👨‍👩‍👧 家庭成员",
      "url": "https://your-domain.com/family"
    }
  ]
}
```

### 3. 模板消息

需要在微信后台申请模板消息权限，并配置模板 ID。

## 数据库

项目使用 MySQL 数据库，会自动创建以下表：

- `users` - 用户表
- `children` - 孩子表
- `records` - 记录表
- `family_members` - 家庭成员关联表

## 部署

### 服务器要求

- Node.js 16+
- MySQL 5.7+
- Redis（可选）

### 生产环境建议

1. 使用 PM2 管理进程
2. 配置 Nginx 反向代理
3. 启用 HTTPS
4. 配置防火墙

## 开发计划

- [ ] 拍照记录功能
- [ ] 语音输入
- [ ] 成长曲线可视化
- [ ] 周报/月报生成
- [ ] 异常数据提醒
- [ ] 育儿建议推荐

## License

MIT
