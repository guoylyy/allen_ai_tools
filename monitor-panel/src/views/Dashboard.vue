<template>
  <div class="dashboard">
    <div class="header">
      <h1>📊 运维监控中心</h1>
      <div class="header-actions">
        <button class="btn-refresh" @click="handleRefresh" :disabled="store.loading">
          {{ store.loading ? '刷新中...' : '🔄 刷新数据' }}
        </button>
        <span class="update-time" v-if="store.lastUpdate">最后更新: {{ formatTime(store.lastUpdate) }}</span>
      </div>
    </div>
    
    <!-- SLA 指标卡 -->
    <div class="sla-section">
      <div class="sla-title">SLA 核心指标</div>
      <div class="sla-grid">
        <div class="sla-card">
          <div class="sla-icon">✅</div>
          <div class="sla-content">
            <div class="sla-value">{{ store.slaStats.availability }}%</div>
            <div class="sla-label">可用性</div>
            <div class="sla-trend up">↑ 0.02%</div>
          </div>
        </div>
        <div class="sla-card">
          <div class="sla-icon">⚡</div>
          <div class="sla-content">
            <div class="sla-value">{{ store.slaStats.avgResponseTime }}ms</div>
            <div class="sla-label">平均响应</div>
            <div class="sla-trend down">↓ 5ms</div>
          </div>
        </div>
        <div class="sla-card">
          <div class="sla-icon">📈</div>
          <div class="sla-content">
            <div class="sla-value">{{ store.slaStats.p99ResponseTime }}ms</div>
            <div class="sla-label">P99响应</div>
            <div class="sla-trend up">↑ 12ms</div>
          </div>
        </div>
        <div class="sla-card">
          <div class="sla-icon">❌</div>
          <div class="sla-content">
            <div class="sla-value">{{ store.slaStats.errorRate }}%</div>
            <div class="sla-label">错误率</div>
            <div class="sla-trend down">↓ 0.03%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.totalProjects }}</div>
          <div class="stat-label">项目数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🖥️</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.onlineServers }}<span class="stat-total">/{{ store.totalServers }}</span></div>
          <div class="stat-label">服务器在线</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚙️</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.totalServices }}</div>
          <div class="stat-label">服务数</div>
        </div>
      </div>
      <div class="stat-card warning" v-if="store.alertStats.critical > 0">
        <div class="stat-icon">🔔</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.alertStats.critical }}</div>
          <div class="stat-label">待处理告警</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">¥{{ store.currentMonthCost }}</div>
          <div class="stat-label">本月成本</div>
        </div>
      </div>
    </div>

    <!-- 业务指标 -->
    <div class="section">
      <h2>📈 业务实时指标</h2>
      <div class="business-grid">
        <div class="business-card">
          <div class="business-label">日活用户 (DAU)</div>
          <div class="business-value">{{ store.business.dau?.toLocaleString() || '0' }}</div>
          <div class="business-trend up">↑ {{ store.business.newUsers || 0 }} 新增</div>
        </div>
        <div class="business-card">
          <div class="business-label">活跃会话</div>
          <div class="business-value">{{ store.business.activeSessions || 0 }}</div>
        </div>
        <div class="business-card">
          <div class="business-label">订单量</div>
          <div class="business-value">{{ store.business.orders || 0 }}</div>
          <div class="business-trend up">¥{{ (store.business.gmv || 0).toLocaleString() }} GMV</div>
        </div>
        <div class="business-card">
          <div class="business-label">转化率</div>
          <div class="business-value">{{ store.business.conversionRate || 0 }}%</div>
        </div>
      </div>
    </div>

    <div class="two-cols">
      <!-- 服务器状态 -->
      <div class="section">
        <h2>🖥️ 服务器状态</h2>
        <div class="server-list">
          <div v-for="server in store.servers" :key="server.id" class="server-item">
            <div class="server-info">
              <div class="server-name">{{ server.name }}</div>
              <div class="server-ip">{{ server.ip }}</div>
            </div>
            <div class="server-metrics">
              <div class="metric-mini">
                <span class="metric-label">CPU</span>
                <span class="metric-value" :class="{ warning: getServerMetric(server.id)?.cpu?.usage > 80 }">
                  {{ getServerMetric(server.id)?.cpu?.usage || 0 }}%
                </span>
              </div>
              <div class="metric-mini">
                <span class="metric-label">内存</span>
                <span class="metric-value" :class="{ warning: getServerMetric(server.id)?.memory?.usage > 85 }">
                  {{ getServerMetric(server.id)?.memory?.usage || 0 }}%
                </span>
              </div>
              <div class="metric-mini">
                <span class="metric-label">磁盘</span>
                <span class="metric-value" :class="{ warning: getServerMetric(server.id)?.disk?.usage > 80 }">
                  {{ getServerMetric(server.id)?.disk?.usage || 0 }}%
                </span>
              </div>
            </div>
            <div class="server-status" :class="server.status">{{ server.status }}</div>
          </div>
        </div>
      </div>

      <!-- 告警中心 -->
      <div class="section">
        <h2>🔔 告警中心</h2>
        <div class="alerts-list">
          <div v-for="alert in store.alerts.slice(0, 5)" :key="alert.id" class="alert-item" :class="alert.level.toLowerCase()">
            <div class="alert-header">
              <span class="alert-level">{{ alert.level }}</span>
              <span class="alert-title">{{ alert.title }}</span>
            </div>
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-footer">
              <span class="alert-time">{{ alert.time }}</span>
              <span class="alert-duration" v-if="alert.duration">持续: {{ alert.duration }}</span>
              <span class="alert-status" :class="alert.status">{{ alert.status }}</span>
            </div>
          </div>
          <div v-if="store.alerts.length === 0" class="no-alerts">暂无告警 ✅</div>
        </div>
      </div>
    </div>

    <!-- 数据库和中间件 -->
    <div class="two-cols">
      <div class="section">
        <h2>🗄️ 数据库状态 (MySQL)</h2>
        <div class="db-status" v-if="store.database.mysql">
          <div class="db-metric">
            <span class="db-label">状态</span>
            <span class="db-value online">🟢 {{ store.database.mysql.status }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">版本</span>
            <span class="db-value">{{ store.database.mysql.version }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">连接数</span>
            <span class="db-value">{{ store.database.mysql.connections?.current || 0 }} / {{ store.database.mysql.connections?.max || 0 }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">QPS</span>
            <span class="db-value">{{ store.database.mysql.queries?.qps || 0 }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">慢查询</span>
            <span class="db-value" :class="{ warning: (store.database.mysql.queries?.slowQueries || 0) > 10 }">
              {{ store.database.mysql.queries?.slowQueries || 0 }}
            </span>
          </div>
          <div class="db-metric">
            <span class="db-label">缓存命中率</span>
            <span class="db-value">{{ store.database.mysql.cache?.hitRate || 0 }}%</span>
          </div>
          <div class="db-metric">
            <span class="db-label">存储使用</span>
            <span class="db-value">{{ store.database.mysql.storage?.used || 0 }}GB / {{ store.database.mysql.storage?.total || 0 }}GB</span>
          </div>
        </div>
        <div class="no-data" v-else>暂无数据</div>
      </div>

      <div class="section">
        <h2>🔄 中间件状态 (Redis)</h2>
        <div class="db-status" v-if="store.middleware.redis">
          <div class="db-metric">
            <span class="db-label">状态</span>
            <span class="db-value online">🟢 {{ store.middleware.redis.status }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">版本</span>
            <span class="db-value">{{ store.middleware.redis.version }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">连接数</span>
            <span class="db-value">{{ store.middleware.redis.connections?.current || 0 }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">内存使用</span>
            <span class="db-value">{{ store.middleware.redis.memory?.usage || 0 }}%</span>
          </div>
          <div class="db-metric">
            <span class="db-label">Key数量</span>
            <span class="db-value">{{ (store.middleware.redis.keys || 0).toLocaleString() }}</span>
          </div>
          <div class="db-metric">
            <span class="db-label">命中率</span>
            <span class="db-value good">{{ store.middleware.redis.hitRate || 0 }}%</span>
          </div>
        </div>
        <div class="no-data" v-else>暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useMonitorStore } from '../stores/monitor'

const store = useMonitorStore()
let timer = null

onMounted(async () => {
  // 初始化加载数据
  await store.refreshAll()
  
  // 每30秒自动刷新
  timer = setInterval(() => {
    store.refreshAll()
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function getServerMetric(serverId) {
  return store.metrics.servers?.[serverId]
}

function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString()
}

async function handleRefresh() {
  await store.refreshAll()
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-refresh {
  background: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-refresh:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.update-time {
  color: #999;
  font-size: 12px;
}

/* SLA Section */
.sla-section {
  background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
}

.sla-title {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 16px;
}

.sla-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.sla-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
}

.sla-icon {
  font-size: 32px;
}

.sla-value {
  font-size: 24px;
  font-weight: bold;
}

.sla-label {
  font-size: 12px;
  opacity: 0.8;
}

.sla-trend {
  font-size: 12px;
  margin-top: 4px;
}

.sla-trend.up { color: #4caf50; }
.sla-trend.down { color: #f44336; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card.warning {
  background: linear-gradient(135deg, #ff5722 0%, #ff9800 100%);
  color: white;
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-total {
  font-size: 16px;
  opacity: 0.6;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.stat-card.warning .stat-label {
  color: rgba(255,255,255,0.8);
}

/* Section */
.section {
  margin-bottom: 24px;
}

h2 {
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
}

/* Business Grid */
.business-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.business-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.business-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.business-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.business-trend {
  font-size: 12px;
  margin-top: 8px;
}

.business-trend.up { color: #4caf50; }
.business-trend.down { color: #f44336; }

/* Two Columns */
.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Server List */
.server-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.server-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.server-item:last-child {
  border-bottom: none;
}

.server-info {
  flex: 1;
}

.server-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.server-ip {
  font-size: 12px;
  color: #666;
}

.server-metrics {
  display: flex;
  gap: 16px;
}

.metric-mini {
  text-align: center;
}

.metric-mini .metric-label {
  display: block;
  font-size: 10px;
  color: #999;
}

.metric-mini .metric-value {
  font-size: 14px;
  font-weight: 500;
}

.metric-value.warning {
  color: #ff9800;
}

.server-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.server-status.online {
  background: #e8f5e9;
  color: #4caf50;
}

/* Alerts */
.alerts-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.alert-item {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-item.p2 { border-left: 4px solid #ff9800; }
.alert-item.p3 { border-left: 4px solid #2196f3; }

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.alert-level {
  background: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.alert-title {
  font-weight: 500;
}

.alert-message {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.alert-footer {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #999;
}

.alert-status {
  margin-left: auto;
}

.alert-status.processing {
  color: #ff9800;
}

.alert-status.resolved {
  color: #4caf50;
}

.no-alerts {
  padding: 40px;
  text-align: center;
  color: #4caf50;
}

/* DB Status */
.db-status {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.db-metric {
  display: flex;
  flex-direction: column;
}

.db-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.db-value {
  font-weight: 500;
}

.db-value.online { color: #4caf50; }
.db-value.warning { color: #ff9800; }
.db-value.good { color: #4caf50; }

.no-data {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: #999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
</style>
