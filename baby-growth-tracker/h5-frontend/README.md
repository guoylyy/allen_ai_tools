# 宝宝成长记录 H5 前端

## 项目介绍

这是一个基于 Vue 3 + Vite 的 H5 前端项目，用于宝宝成长记录服务的服务号应用。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 7
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **样式**: TailwindCSS + PostCSS
- **工具库**: VueUse

## 项目结构

```
h5-frontend/
├── src/
│   ├── api/           # API 接口层
│   │   └── index.js   # axios 配置和 API 方法
│   ├── components/    # 公共组件
│   ├── pages/         # 页面组件
│   │   ├── Home/      # 首页
│   │   ├── Record/    # 记录页
│   │   ├── Report/    # 报表页
│   │   ├── Family/    # 家庭管理页
│   │   ├── Profile/   # 我的页面
│   │   ├── Login/     # 登录页
│   │   └── NotFound/  # 404页面
│   ├── router/        # 路由配置
│   │   └── index.js
│   ├── stores/        # Pinia 状态管理
│   │   ├── index.js   # Pinia 实例
│   │   └── user.js    # 用户状态
│   ├── utils/        # 工具函数
│   │   └── index.js
│   ├── App.vue       # 根组件
│   ├── main.js       # 入口文件
│   └── style.css     # 全局样式
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 功能模块

### 1. 记录页面 (核心)
- [x] 快速记录按钮（睡觉、吃饭、玩耍、学习、情绪）
- [x] 图片上传（拍照记录成长瞬间）
- [x] 语音输入（快速记录）
- [x] 时间选择器
- [x] 历史记录列表

### 2. 报表页面
- [x] 今日概览
- [x] 成长曲线（睡眠、饮食趋势）
- [x] 周报/月报
- [x] 里程碑时间轴

### 3. 家庭管理页面
- [x] 家庭成员列表
- [x] 邀请家庭成员
- [x] 权限管理
- [x] 多个孩子切换

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 环境变量

在 `.env` 文件中配置：

```
VITE_API_BASE_URL=/api
VITE_WECHAT_APPID=your_appid
```

## 浏览器支持

- Chrome (最新)
- Safari (最新)
- Firefox (最新)
- Edge (最新)

## 许可证

MIT
