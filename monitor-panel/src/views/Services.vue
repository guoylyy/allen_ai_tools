<template>
  <div class="services">
    <h1>⚙️ 服务监控</h1>
    
    <div class="services-grid">
      <div v-for="(status, name) in store.serviceStatus" :key="name" class="service-card">
        <div class="service-header">
          <div class="service-name">{{ name }}</div>
          <div class="service-status" :class="status.status">{{ status.status }}</div>
        </div>
        
        <div class="service-metrics">
          <div class="metric">
            <span class="metric-label">响应时间</span>
            <span class="metric-value">{{ status.responseTime }}ms</span>
          </div>
          <div class="metric">
            <span class="metric-label">运行时间</span>
            <span class="metric-value">{{ formatUptime(status.uptime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目服务列表 -->
    <div class="section">
      <h2>📁 项目服务</h2>
      <div class="project-services">
        <div v-for="project in store.projects" :key="project.id" class="project-section">
          <div class="project-title">{{ project.name }}</div>
          <div v-if="project.services?.length" class="service-list">
            <div v-for="service in project.services" :key="service.name" class="service-row">
              <div class="service-info">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-port">端口: {{ service.port }}</span>
              </div>
              <div class="service-type">{{ service.type }}</div>
            </div>
          </div>
          <div v-else class="no-services">暂无服务</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMonitorStore } from '../stores/monitor'

const store = useMonitorStore()

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}
</script>

<style scoped>
.services {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

h2 {
  margin: 30px 0 16px;
  color: #333;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.service-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.service-name {
  font-size: 16px;
  font-weight: bold;
}

.service-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.service-status.online {
  background: #e8f5e9;
  color: #4caf50;
}

.service-status.offline {
  background: #ffebee;
  color: #f44336;
}

.service-metrics {
  display: flex;
  gap: 24px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.project-services {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.project-section {
  border-bottom: 1px solid #eee;
}

.project-section:last-child {
  border-bottom: none;
}

.project-title {
  padding: 16px 20px;
  font-weight: bold;
  background: #f5f5f5;
}

.service-list {
  padding: 0 20px;
}

.service-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.service-row:last-child {
  border-bottom: none;
}

.service-info {
  display: flex;
  flex-direction: column;
}

.service-info .service-name {
  font-size: 14px;
  font-weight: normal;
}

.service-port {
  font-size: 12px;
  color: #666;
}

.service-type {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.no-services {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style>
