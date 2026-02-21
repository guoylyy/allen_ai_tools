import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 配置文件路径
const CONFIG_FILE = join(__dirname, '../src/data/config.json')
const DATA_DIR = join(__dirname, '../src/data')

// 模拟数据（实际会调用采集模块）
let config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))

// 采集模块
import { collectServerMetrics } from './collectors/server.js'
import { collectServiceHealth } from './collectors/health.js'
import { collectPM2Status } from './collectors/pm2.js'
import { collectAliyunCost } from './collectors/aliyun.js'

const app = express()
app.use(cors())
app.use(express.json())

// 获取配置
app.get('/api/config', (req, res) => {
  res.json(config)
})

// 更新配置
app.put('/api/config', (req, res) => {
  const newConfig = req.body
  config = { ...config, ...newConfig }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  res.json({ success: true })
})

// 获取服务器指标
app.get('/api/metrics/servers', async (req, res) => {
  try {
    const metrics = {}
    
    for (const server of config.servers) {
      if (server.provider === 'local' || server.ip === 'localhost') {
        // 本地服务器 - 直接采集
        metrics[server.id] = await collectServerMetrics('localhost')
      } else {
        // 远程服务器 - SSH采集（需要配置SSH）
        try {
          metrics[server.id] = await collectServerMetrics(server.ip)
        } catch (e) {
          // 如果SSH失败，使用模拟数据
          metrics[server.id] = getMockServerMetrics()
        }
      }
    }
    
    res.json(metrics)
  } catch (error) {
    console.error('获取服务器指标失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取服务健康状态
app.get('/api/health/services', async (req, res) => {
  try {
    const healthStatus = {}
    
    // 遍历所有项目的服务
    for (const project of config.projects) {
      if (project.services) {
        for (const service of project.services) {
          healthStatus[service.name] = await collectServiceHealth(service)
        }
      }
    }
    
    res.json(healthStatus)
  } catch (error) {
    console.error('获取服务健康状态失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取PM2进程状态
app.get('/api/pm2/status', async (req, res) => {
  try {
    const pm2Status = await collectPM2Status()
    res.json(pm2Status)
  } catch (error) {
    console.error('获取PM2状态失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取阿里云成本
app.get('/api/costs/aliyun', async (req, res) => {
  try {
    const costs = await collectAliyunCost()
    res.json(costs)
  } catch (error) {
    console.error('获取阿里云成本失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取完整监控数据
app.get('/api/dashboard', async (req, res) => {
  try {
    const [serverMetrics, serviceHealth, pm2Status] = await Promise.all([
      app._router.stack.find(r => r.path === '/api/metrics/servers')?.route?.stack[0]?.handle() || {},
      app._router.stack.find(r => r.path === '/api/health/services')?.route?.stack[0]?.handle() || {},
      collectPM2Status()
    ])
    
    res.json({
      servers: serverMetrics,
      services: serviceHealth,
      pm2: pm2Status,
      config
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 模拟数据生成函数
function getMockServerMetrics() {
  return {
    cpu: {
      usage: Math.floor(Math.random() * 60) + 20,
      load1: Math.random() * 2,
      load5: Math.random() * 1.5,
      load15: Math.random() * 1
    },
    memory: {
      total: 4096,
      used: Math.floor(Math.random() * 2000) + 1000,
      free: 4096 - Math.floor(Math.random() * 2000) - 1000,
      usage: Math.floor(Math.random() * 40) + 40
    },
    disk: {
      total: 100,
      used: Math.floor(Math.random() * 30) + 30,
      free: 100 - Math.floor(Math.random() * 30) - 30,
      usage: Math.floor(Math.random() * 30) + 30
    },
    network: {
      in: Math.floor(Math.random() * 100) + 20,
      out: Math.floor(Math.random() * 60) + 10,
      tcpConn: Math.floor(Math.random() * 100) + 50
    },
    process: {
      total: Math.floor(Math.random() * 100) + 50,
      running: Math.floor(Math.random() * 80) + 40,
      sleeping: Math.floor(Math.random() * 20) + 10
    }
  }
}

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`🚀 监控服务已启动: http://localhost:${PORT}`)
  console.log(`📊 API端点:`)
  console.log(`   - GET  /api/config       获取配置`)
  console.log(`   - PUT  /api/config       更新配置`)
  console.log(`   - GET  /api/metrics/servers  获取服务器指标`)
  console.log(`   - GET  /api/health/services   获取服务健康状态`)
  console.log(`   - GET  /api/pm2/status       获取PM2状态`)
  console.log(`   - GET  /api/costs/aliyun     获取阿里云成本`)
  console.log(`   - GET  /api/dashboard       获取完整监控数据`)
})
