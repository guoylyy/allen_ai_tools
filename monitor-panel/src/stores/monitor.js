import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import configData from '../data/config.json'

const API_BASE = 'http://localhost:3002/api'

export const useMonitorStore = defineStore('monitor', () => {
  // 状态
  const projects = ref(configData.projects)
  const servers = ref(configData.servers)
  const metrics = ref({})
  const database = ref({})
  const middleware = ref({})
  const business = ref({})
  const sla = ref({})
  const costs = ref(configData.costs)
  const alerts = ref(configData.alerts)
  const loading = ref(false)
  const lastUpdate = ref(null)

  // 计算属性
  const totalProjects = computed(() => projects.value.length)
  const totalServers = computed(() => servers.value.length)
  const totalServices = computed(() => {
    return projects.value.reduce((sum, p) => sum + (p.services?.length || 0), 0)
  })
  
  const onlineServers = computed(() => servers.value.filter(s => s.status === 'online').length)
  
  const currentMonthCost = computed(() => {
    const month = new Date().toISOString().slice(0, 7)
    return costs.value[month]?.总计 || 0
  })

  // 告警统计
  const alertStats = computed(() => {
    const processing = alerts.value.filter(a => a.status === 'processing').length
    const resolved = alerts.value.filter(a => a.status === 'resolved').length
    const critical = alerts.value.filter(a => a.level === 'P1' || a.level === 'P2').length
    return { processing, resolved, critical }
  })

  // SLA 统计
  const slaStats = computed(() => ({
    availability: sla.value.availability || 99.9,
    avgResponseTime: sla.value.avgResponseTime || 0,
    p99ResponseTime: sla.value.p99ResponseTime || 0,
    errorRate: sla.value.errorRate || 0,
    uptime: sla.value.uptime || 0
  }))

  // 从后端获取配置
  async function fetchConfig() {
    try {
      const res = await fetch(`${API_BASE}/config`)
      const data = await res.json()
      projects.value = data.projects || []
      servers.value = data.servers || []
      costs.value = data.costs || {}
      alerts.value = data.alerts || []
    } catch (e) {
      console.error('获取配置失败:', e)
    }
  }

  // 获取服务器指标
  async function fetchServerMetrics() {
    try {
      const res = await fetch(`${API_BASE}/metrics/servers`)
      const data = await res.json()
      metrics.value.servers = data
      lastUpdate.value = new Date().toISOString()
    } catch (e) {
      console.error('获取服务器指标失败:', e)
      // 使用模拟数据
      metrics.value.servers = getMockServerMetrics()
    }
  }

  // 获取服务健康状态
  async function fetchServiceHealth() {
    try {
      const res = await fetch(`${API_BASE}/health/services`)
      const data = await res.json()
      metrics.value.services = data
    } catch (e) {
      console.error('获取服务健康状态失败:', e)
    }
  }

  // 获取PM2状态
  async function fetchPM2Status() {
    try {
      const res = await fetch(`${API_BASE}/pm2/status`)
      const data = await res.json()
      return data
    } catch (e) {
      console.error('获取PM2状态失败:', e)
      return []
    }
  }

  // 获取阿里云成本
  async function fetchAliyunCost() {
    try {
      const res = await fetch(`${API_BASE}/costs/aliyun`)
      const data = await res.json()
      if (data && !data._mock) {
        costs.value[data.month] = data
      }
    } catch (e) {
      console.error('获取阿里云成本失败:', e)
    }
  }

  // 刷新所有数据
  async function refreshAll() {
    loading.value = true
    try {
      await Promise.all([
        fetchServerMetrics(),
        fetchServiceHealth(),
        fetchPM2Status()
      ])
    } finally {
      loading.value = false
    }
  }

  // 方法
  function addProject(project) {
    projects.value.push({ ...project, id: Date.now().toString() })
    saveConfig()
  }
  
  function addServer(server) {
    servers.value.push({ ...server, id: Date.now().toString() })
    saveConfig()
  }
  
  function addAlert(alert) {
    alerts.value.unshift({ ...alert, id: Date.now(), time: new Date().toISOString() })
    saveConfig()
  }

  function resolveAlert(alertId) {
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) {
      alert.status = 'resolved'
    }
    saveConfig()
  }

  async function saveConfig() {
    try {
      await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: projects.value,
          servers: servers.value,
          costs: costs.value,
          alerts: alerts.value
        })
      })
    } catch (e) {
      console.error('保存配置失败:', e)
    }
  }

  // 模拟数据（备用）
  function getMockServerMetrics() {
    const mock = {}
    servers.value.forEach(s => {
      mock[s.id] = {
        cpu: { usage: Math.floor(Math.random() * 60) + 20, load1: 1, load5: 1, load15: 1 },
        memory: { total: 4096, used: 2000, free: 2096, usage: 50 },
        disk: { total: 100, used: 40, free: 60, usage: 40 },
        network: { in: 50, out: 30, tcpConn: 80 },
        process: { total: 100, running: 80, sleeping: 20 }
      }
    })
    return mock
  }

  return {
    projects,
    servers,
    metrics,
    database,
    middleware,
    business,
    sla,
    costs,
    alerts,
    loading,
    lastUpdate,
    totalProjects,
    totalServers,
    totalServices,
    onlineServers,
    currentMonthCost,
    alertStats,
    slaStats,
    addProject,
    addServer,
    addAlert,
    resolveAlert,
    fetchConfig,
    fetchServerMetrics,
    fetchServiceHealth,
    fetchPM2Status,
    fetchAliyunCost,
    refreshAll
  }
})
