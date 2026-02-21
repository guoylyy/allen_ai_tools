// 服务健康检查采集器
import http from 'http'
import https from 'https'
import net from 'net'

// 健康检查主函数
export async function collectServiceHealth(service) {
  const healthCheck = service.healthCheck
  
  if (!healthCheck) {
    // 没有配置健康检查，返回默认状态
    return getDefaultHealth(service)
  }
  
  const startTime = Date.now()
  
  try {
    let isHealthy = false
    
    switch (healthCheck.type) {
      case 'http':
      case 'https':
        isHealthy = await checkHTTP(healthCheck.url)
        break
      case 'tcp':
        isHealthy = await checkTCP(healthCheck.host || 'localhost', healthCheck.port || service.port)
        break
      case 'process':
        isHealthy = await checkProcess(healthCheck.processName || service.name)
        break
      default:
        isHealthy = false
    }
    
    const responseTime = Date.now() - startTime
    
    return {
      status: isHealthy ? 'online' : 'offline',
      responseTime,
      uptime: isHealthy ? await getProcessUptime(service.name) : 0,
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'offline',
      responseTime: Date.now() - startTime,
      error: error.message,
      lastCheck: new Date().toISOString()
    }
  }
}

// HTTP健康检查
function checkHTTP(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http
    
    const req = client.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400)
    })
    
    req.on('error', () => resolve(false))
    req.setTimeout(5000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

// TCP端口检查
function checkTCP(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    
    socket.setTimeout(3000)
    
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    
    socket.on('error', () => resolve(false))
    
    socket.connect(port, host)
  })
}

// 进程检查
async function checkProcess(processName) {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    const { stdout } = await execAsync(`pgrep -f "${processName}" | wc -l`)
    const count = parseInt(stdout.trim())
    return count > 0
  } catch {
    return false
  }
}

// 获取进程运行时间
async function getProcessUptime(processName) {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    // macOS获取进程运行时间
    const { stdout } = await execAsync(`ps -o etime= -p $(pgrep -f "${processName}" | head -1) 2>/dev/null`)
    const timeStr = stdout.trim()
    
    if (!timeStr) return 0
    
    // 解析时间格式 HH:MM:SS 或 DD-HH:MM:SS
    const parts = timeStr.split(':')
    let seconds = 0
    
    if (parts.length === 3) {
      const [h, m, s] = parts.map(Number)
      seconds = h * 3600 + m * 60 + s
    } else if (parts.length === 2) {
      const [m, s] = parts.map(Number)
      seconds = m * 60 + s
    }
    
    return seconds
  } catch {
    return 0
  }
}

// 默认健康状态
function getDefaultHealth(service) {
  return {
    status: 'unknown',
    responseTime: 0,
    uptime: 0,
    lastCheck: new Date().toISOString()
  }
}
