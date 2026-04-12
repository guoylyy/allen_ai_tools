# 关系舱 RelateSpace

企业管理者人际关系管理系统

## 项目结构

```
relatespace/
├── server/              # Express 后端
│   ├── routes/          # API 路由
│   ├── models/          # 数据库模型
│   └── data/           # SQLite 数据库文件
├── client/              # Vue 前端
│   ├── src/
│   │   ├── views/      # 页面组件
│   │   ├── stores/     # Pinia 状态管理
│   │   ├── api/        # API 封装
│   │   └── router/     # 路由配置
│   └── dist/           # 构建输出目录
└── README.md
```

## 快速启动

### 方式一：一键启动（推荐）

```bash
cd relatespace
./start.sh
```

### 方式二：手动启动

**1. 安装依赖**

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

**2. 启动后端**

```bash
cd server
npm start
# 服务运行在 http://localhost:3001
```

**3. 启动前端（开发模式）**

```bash
cd client
npm run dev
# 访问 http://localhost:5173
```

### 方式三：生产部署

```bash
# 构建前端
cd client
npm run build

# 后端会同时服务前端静态文件
cd ../server
npm start
# 访问 http://localhost:3001
```

## 功能特性

- ✅ 关系人管理（增删改查）
- ✅ 互动记录（AI自动摘要）
- ✅ 朋友圈动态
- ✅ 财务往来（礼尚往来/商业资金）
- ✅ 重要时刻（生日/纪念日/里程碑）
- ✅ 约定提醒
- ✅ 久未联系预警

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/relations` | GET | 获取所有关系人 |
| `/api/relations/:id` | GET | 获取关系人详情 |
| `/api/relations` | POST | 创建关系人 |
| `/api/relations/:id` | PUT | 更新关系人 |
| `/api/relations/:id` | DELETE | 删除关系人 |
| `/api/interactions/relation/:id` | GET | 获取互动记录 |
| `/api/finance/relation/:id` | GET | 获取财务记录 |
| `/api/moments/relation/:id` | GET | 获取朋友圈动态 |
| `/api/events/relation/:id` | GET | 获取重要时刻 |

## 技术栈

- **前端**: Vue 3 + Pinia + Vue Router + TailwindCSS
- **后端**: Express.js
- **数据库**: SQLite (better-sqlite3)

## 许可证

MIT
