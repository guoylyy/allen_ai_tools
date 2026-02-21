<template>
  <div class="apm">
    <h1>⚡ 应用性能监控 (APM)</h1>
    
    <!-- 性能概览 -->
    <div class="apm-overview">
      <div class="apm-card">
        <div class="apm-icon">🚀</div>
        <div class="apm-content">
          <div class="apm-value">{{ serviceMetrics.qps }}</div>
          <div class="apm-label">QPS (请求/秒)</div>
        </div>
      </div>
      <div class="apm-card">
        <div class="apm-icon">⚡</div>
        <div class="apm-content">
          <div class="apm-value">{{ serviceMetrics.avgResponseTime }}ms</div>
          <div class="apm-label">平均响应时间</div>
        </div>
      </div>
      <div class="apm-card">
        <div class="apm-icon">📊</div>
        <div class="apm-content">
          <div class="apm-value">{{ serviceMetrics.p99ResponseTime }}ms</div>
          <div class="apm-label">P99 响应时间</div>
        </div>
      </div>
      <div class="apm-card" :class="{ error: serviceMetrics.errorRate > 1 }">
        <div class="apm-icon">❌</div>
        <div class="apm-content">
          <div class="apm-value">{{ serviceMetrics.errorRate }}%</div>
          <div class="apm-label">错误率</div>
        </div>
      </div>
    </div>

    <!-- HTTP 状态码分布 -->
    <div class="section">
      <h2>📈 HTTP 状态码分布</h2>
      <div class="http-codes">
        <div class="http-code success">
          <div class="code-num">2xx</div>
          <div class="code-count">{{ serviceMetrics.http2xx }}</div>
          <div class="code-label">成功</div>
        </div>
        <div class="http-code warning">
          <div class="code-num">4xx</div>
          <div class="code-count">{{ serviceMetrics.http4xx }}</div>
          <div class="code-label">客户端错误</div>
        </div>
        <div class="http-code error">
          <div class="code-num">5xx</div>
          <div class="code-count">{{ serviceMetrics.http5xx }}</div>
          <div class="code-label">服务端错误</div>
        </div>
      </div>
    </div>

    <!-- 响应时间分布 -->
    <div class="section">
      <h2>📊 响应时间分布</h2>
      <div class="response-dist">
        <div class="dist-item">
          <div class="dist-label">P50</div>
          <div class="dist-bar">
            <div class="dist-fill p50" :style="{ width: (serviceMetrics.p50ResponseTime / serviceMetrics.p99ResponseTime * 100) + '%' }"></div>
          </div>
          <div class="dist-value">{{ serviceMetrics.p50ResponseTime }}ms</div>
        </div>
        <div class="dist-item">
          <div class="dist-label">P90</div>
          <div class="dist-bar">
            <div class="dist-fill p90" :style="{ width: (serviceMetrics.p90ResponseTime / serviceMetrics.p99ResponseTime * 100) + '%' }"></div>
          </div>
          <div class="dist-value">{{ serviceMetrics.p90ResponseTime }}ms</div>
        </div>
        <div class="dist-item">
          <div class="dist-label">P99</div>
          <div class="dist-bar">
            <div class="dist-fill p99" style="width: 100%"></div>
          </div>
          <div class="dist-value">{{ serviceMetrics.p99ResponseTime }}ms</div>
        </div>
      </div>
    </div>

    <!-- 服务列表 -->
    <div class="section">
      <h2>⚙️ 服务列表</h2>
      <div class="services-table">
        <table>
          <thead>
            <tr>
              <th>服务名称</th>
              <th>状态</th>
              <th>运行时长</th>
              <th>QPS</th>
              <th>响应时间</th>
              <th>错误率</th>
              <th>CPU</th>
              <th>内存</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(status, name) in store.metrics.services" :key="name">
              <td class="service-name">{{ name }}</td>
              <td><span class="status-badge" :class="status.status">{{ status.status }}</span></td>
              <td>{{ formatUptime(status.uptime) }}</td>
              <td>{{ status.qps }}</td>
              <td>{{ status.avgResponseTime }}ms</td>
              <td :class="{ error: status.errorRate > 1 }">{{ status.errorRate }}%</td>
              <td>{{ status.cpu }}%</td>
              <td>{{ status.memory }}MB</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 项目服务 -->
    <div class="section">
      <h2>📁 项目服务配置</h2>
      <div class="project-services">
        <div v-for="project in store.projects" :key="project.id" class="project-card">
          <div class="project-header">
            <div class="project-name">{{ project.name }}</div>
            <div class="project-sla">SLA: {{ project.sla }}%</div>
          </div>
          <div class="services-list" v-if="project.services?.length">
            <div v-for="service in project.services" :key="service.name" class="service-item">
              <div class="service-info">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-type">{{ service.type }}</span>
              </div>
              <div class="service-endpoint">
                <span class="port">:{{ service.port }}</span>
                <span class="version">v{{ service.version }}</span>
              </div>
            </div>
          </div>
          <div class="no-services" v-else>暂无服务配置</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMonitorStore } from '../stores/monitor'

const store = useMonitorStore()

const serviceMetrics = computed(() => {
  const services = store.metrics.services
  const keys = Object.keys(services)
  if (keys.length === 0) {
    return { qps: 0, avgResponseTime: 0, p50ResponseTime: 0, p90ResponseTime: 0, p99ResponseTime: 0, errorRate: 0, http2xx: 0, http4xx: 0, http5xx: 0 }
  }
  
  // 汇总所有服务的指标
  const first = services[keys[0]]
  return {
    qps: first.qps,
    avgResponseTime: first.avgResponseTime,
    p50ResponseTime: first.p50ResponseTime,
    p90ResponseTime: first.p90ResponseTime,
    p99ResponseTime: first.p99ResponseTime,
    errorRate: first.errorRate,
    http2xx: first.http2xx,
    http4xx: first.http4xx,
    http5xx: first.http5xx
  }
})

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}
</script>

<style scoped>
.apm {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

h2 {
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
}

/* APM Overview */
.apm-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.apm-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.apm-card.error {
  background: linear-gradient(135deg, #ff5722 0%, #ff9800 100%);
  color: white;
}

.apm-icon {
  font-size: 36px;
}

.apm-value {
  font-size: 28px;
  font-weight: bold;
}

.apm-label {
  font-size: 12px;
  opacity: 0.8;
}

/* HTTP Codes */
.http-codes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.http-code {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.http-code.success .code-num { color: #4caf50; }
.http-code.warning .code-num { color: #ff9800; }
.http-code.error .code-num { color: #f44336; }

.code-num {
  font-size: 24px;
  font-weight: bold;
}

.code-count {
  font-size: 32px;
  font-weight: bold;
  margin: 8px 0;
}

.code-label {
  font-size: 12px;
  color: #666;
}

/* Response Distribution */
.response-dist {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.dist-item:last-child {
  margin-bottom: 0;
}

.dist-label {
  width: 50px;
  font-weight: 500;
}

.dist-bar {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.dist-fill.p50 { background: #4caf50; }
.dist-fill.p90 { background: #ff9800; }
.dist-fill.p99 { background: #f44336; }

.dist-value {
  width: 80px;
  text-align: right;
  font-weight: 500;
}

/* Services Table */
.services-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f7fa;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

td {
  font-size: 14px;
}

.service-name {
  font-weight: 500;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
}

.status-badge.online {
  background: #e8f5e9;
  color: #4caf50;
}

.status-badge.offline {
  background: #ffebee;
  color: #f44336;
}

td.error {
  color: #f44336;
  font-weight: 500;
}

/* Project Services */
.project-services {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.project-name {
  font-weight: bold;
  font-size: 16px;
}

.project-sla {
  font-size: 12px;
  color: #4caf50;
  background: #e8f5e9;
  padding: 4px 8px;
  border-radius: 4px;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.service-info {
  display: flex;
  flex-direction: column;
}

.service-info .service-name {
  font-size: 14px;
  font-weight: normal;
}

.service-type {
  font-size: 11px;
  color: #999;
}

.service-endpoint {
  text-align: right;
}

.port {
  display: block;
  font-weight: 500;
}

.version {
  font-size: 11px;
  color: #999;
}

.no-services {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
