<template>
  <div class="servers">
    <h1>🖥️ 基础设施监控</h1>
    
    <!-- 时间范围选择 -->
    <div class="time-selector">
      <button v-for="t in ['实时', '1小时', '24小时', '7天']" :key="t" 
        class="time-btn" :class="{ active: selectedTime === t }" 
        @click="selectedTime = t">
        {{ t }}
      </button>
    </div>

    <div class="servers-grid">
      <div v-for="server in store.servers" :key="server.id" class="server-card">
        <div class="server-header">
          <div class="server-title">
            <div class="server-name">{{ server.name }}</div>
            <div class="server-meta">{{ server.ip }} | {{ server.os || 'Ubuntu' }}</div>
          </div>
          <div class="server-status" :class="server.status">
            {{ server.status === 'online' ? '🟢 在线' : '🔴 离线' }}
          </div>
        </div>

        <div class="server-specs">
          <div class="spec-item">
            <span class="spec-label">规格</span>
            <span class="spec-value">{{ server.spec || '本地' }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">服务商</span>
            <span class="spec-value">{{ server.provider }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">地域</span>
            <span class="spec-value">{{ server.region }}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">运行时长</span>
            <span class="spec-value">{{ formatUptime(server.uptime) }}</span>
          </div>
        </div>

        <!-- 实时指标 -->
        <div class="metrics" v-if="getMetrics(server.id)">
          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-title">CPU</span>
              <span class="metric-value" :class="getUsageClass(getMetrics(server.id).cpu.usage)">
                {{ getMetrics(server.id).cpu.usage }}%
              </span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill" :class="getUsageClass(getMetrics(server.id).cpu.usage)"
                :style="{ width: getMetrics(server.id).cpu.usage + '%' }"></div>
            </div>
            <div class="metric-extra">
              Load: {{ getMetrics(server.id).cpu.load1?.toFixed(2) }}/{{ getMetrics(server.id).cpu.load5?.toFixed(2) }}/{{ getMetrics(server.id).cpu.load15?.toFixed(2) }}
            </div>
          </div>

          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-title">内存</span>
              <span class="metric-value" :class="getUsageClass(getMetrics(server.id).memory.usage)">
                {{ getMetrics(server.id).memory.usage }}%
              </span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill" :class="getUsageClass(getMetrics(server.id).memory.usage)"
                :style="{ width: getMetrics(server.id).memory.usage + '%' }"></div>
            </div>
            <div class="metric-extra">
              {{ getMetrics(server.id).memory.used }}MB / {{ getMetrics(server.id).memory.total }}MB
            </div>
          </div>

          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-title">磁盘</span>
              <span class="metric-value" :class="getUsageClass(getMetrics(server.id).disk.usage)">
                {{ getMetrics(server.id).disk.usage }}%
              </span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill" :class="getUsageClass(getMetrics(server.id).disk.usage)"
                :style="{ width: getMetrics(server.id).disk.usage + '%' }"></div>
            </div>
            <div class="metric-extra">
              {{ getMetrics(server.id).disk.used }}GB / {{ getMetrics(server.id).disk.total }}GB
            </div>
          </div>

          <div class="metric-section">
            <div class="metric-header">
              <span class="metric-title">网络 I/O</span>
              <span class="metric-value">{{ getMetrics(server.id).network.in }} / {{ getMetrics(server.id).network.out }} MB/s</span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill network" :style="{ width: Math.min(getMetrics(server.id).network.in / 2, 100) + '%' }"></div>
            </div>
            <div class="metric-extra">
              TCP: {{ getMetrics(server.id).network.tcpConn }} 连接
            </div>
          </div>
        </div>

        <!-- 进程信息 -->
        <div class="process-info" v-if="getMetrics(server.id)">
          <span>进程: {{ getMetrics(server.id).process.total }}</span>
          <span>运行: {{ getMetrics(server.id).process.running }}</span>
          <span>休眠: {{ getMetrics(server.id).process.sleeping }}</span>
        </div>

        <!-- 成本信息 -->
        <div class="server-cost" v-if="server.monthlyCost > 0">
          <span class="cost-label">月成本:</span>
          <span class="cost-value">¥{{ server.monthlyCost }}/月</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMonitorStore } from '../stores/monitor'

const store = useMonitorStore()
const selectedTime = ref('实时')

onMounted(() => {
  store.fetchServerMetrics()
})

function getMetrics(serverId) {
  return store.metrics.servers?.[serverId]
}

function getUsageClass(usage) {
  if (usage >= 90) return 'critical'
  if (usage >= 80) return 'warning'
  return 'normal'
}

function formatUptime(seconds) {
  if (!seconds) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  if (days > 0) return `${days}天 ${hours}小时`
  return `${hours}小时`
}
</script>

<style scoped>
.servers {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

.time-selector {
  margin-bottom: 20px;
  display: flex;
  gap: 8px;
}

.time-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.server-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.server-name {
  font-size: 18px;
  font-weight: bold;
}

.server-meta {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.server-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.server-status.online {
  background: #e8f5e9;
  color: #4caf50;
}

.server-status.offline {
  background: #ffebee;
  color: #f44336;
}

.server-specs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.spec-item {
  text-align: center;
}

.spec-label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.spec-value {
  font-size: 13px;
  font-weight: 500;
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-section {
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.metric-section:last-child {
  border-bottom: none;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-title {
  font-size: 14px;
  font-weight: 500;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
}

.metric-value.normal { color: #4caf50; }
.metric-value.warning { color: #ff9800; }
.metric-value.critical { color: #f44336; }

.metric-bar {
  height: 10px;
  background: #eee;
  border-radius: 5px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s;
}

.metric-fill.warning {
  background: linear-gradient(90deg, #ff9800, #ff5722);
}

.metric-fill.critical {
  background: linear-gradient(90deg, #f44336, #d32f2f);
}

.metric-fill.network {
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.metric-extra {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

.process-info {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}

.server-cost {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.cost-label {
  color: #666;
}

.cost-value {
  font-size: 16px;
  font-weight: bold;
  color: #4caf50;
}
</style>
