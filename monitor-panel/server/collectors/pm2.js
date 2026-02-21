// PM2状态采集器
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 获取PM2状态
export async function collectPM2Status() {
  try {
    const { stdout } = await execAsync('pm2 jlist')
    const processes = JSON.parse(stdout)
    
    return processes.map(proc => ({
      name: proc.name,
      status: proc.pm2_env?.status || 'unknown',
      pid: proc.pid,
      memory: proc.monit?.memory || 0,
      cpu: proc.monit?.cpu || 0,
      uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
      restarts: proc.pm2_env?.restart_time || 0,
      version: proc.pm2_env?.version || 'N/A'
    }))
  } catch (error) {
    console.error('获取PM2状态失败:', error)
    return []
  }
}

// 获取特定进程状态
export async function getPM2Process(name) {
  try {
    const { stdout } = await execAsync(`pm2 jlist`)
    const processes = JSON.parse(stdout)
    return processes.find(p => p.name === name)
  } catch {
    return null
  }
}

// PM2进程管理
export async function restartPM2Process(name) {
  try {
    await execAsync(`pm2 restart ${name}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function stopPM2Process(name) {
  try {
    await execAsync(`pm2 stop ${name}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function deletePM2Process(name) {
  try {
    await execAsync(`pm2 delete ${name}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
