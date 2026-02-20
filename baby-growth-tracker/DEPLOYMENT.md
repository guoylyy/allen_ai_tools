
### 前端

```bash
# 在 h5-frontend 目录
npm run preview -- --port 3000

# 或用 PM2 管理
pm2 start npm --name "baby-growth-frontend" -- run preview -- --port 3000
```

### 后端

```bash
# 在项目根目录
pm2 start npm --name "baby-growth-backend" -- run start
```

### PM2 常用命令

```bash
# 查看运行状态
pm2 status

# 查看日志
pm2 logs baby-growth-backend

# 重启服务
pm2 restart baby-growth-backend

# 停止服务
pm2 stop baby-growth-backend

# 删除进程
pm2 delete baby-growth-backend
```

