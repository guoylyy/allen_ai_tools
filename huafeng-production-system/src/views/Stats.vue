<template>
  <div class="stats-page">
    <h1 class="page-title">📈 效率统计</h1>

    <!-- 时间筛选 -->
    <div class="toolbar">
      <div style="display: flex; gap: 10px;">
        <button 
          v-for="t in timeRanges" 
          :key="t.value"
          :class="['btn', currentRange === t.value ? 'btn-primary' : 'btn-outline']"
          @click="currentRange = t.value"
        >
          {{ t.label }}
        </button>
      </div>
      <div style="color: var(--foreground-light);">
        数据更新: {{ updateTime }}
      </div>
    </div>

    <!-- 统计卡片 -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalOutput }}</div>
        <div class="stat-label">总产量</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.qualifiedRate }}%</div>
        <div class="stat-label">合格率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.efficiency }}%</div>
        <div class="stat-label">生产效率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.onTimeRate }}%</div>
        <div class="stat-label">准时交付率</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
      <!-- 产量趋势 -->
      <div class="card">
        <h3 style="margin: 0 0 20px 0; font-size: 16px;">📊 产量趋势</h3>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div class="bar-item" v-for="(day, index) in chartData.days" :key="index">
              <div class="bar" :style="{ height: day.value + '%' }"></div>
              <span class="bar-label">{{ day.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 工序分布 -->
      <div class="card">
        <h3 style="margin: 0 0 20px 0; font-size: 16px;">🔧 工序产量</h3>
        <div class="process-list">
          <div class="process-item" v-for="p in processData" :key="p.name">
            <div class="process-info">
              <span class="process-name">{{ p.name }}</span>
              <span class="process-count">{{ p.count }}件</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: p.percent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细表格 -->
    <div class="card" style="margin-top: 30px;">
      <h3 style="margin: 0 0 20px 0; font-size: 16px;">📋 详细数据</h3>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>订单数</th>
            <th>产量</th>
            <th>合格数</th>
            <th>合格率</th>
            <th>效率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in detailData" :key="d.date">
            <td>{{ d.date }}</td>
            <td>{{ d.orders }}</td>
            <td>{{ d.output }}</td>
            <td>{{ d.qualified }}</td>
            <td>
              <span :class="['tag', d.qualifiedRate >= 95 ? 'tag-success' : 'tag-warning']">
                {{ d.qualifiedRate }}%
              </span>
            </td>
            <td>
              <span :class="['tag', d.efficiency >= 90 ? 'tag-success' : 'tag-warning']">
                {{ d.efficiency }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentRange = ref('week')
const updateTime = ref('12:00:00')

const timeRanges = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' }
]

const stats = ref({
  totalOutput: 12456,
  qualifiedRate: 98.5,
  efficiency: 92.3,
  onTimeRate: 96.8
})

const chartData = ref({
  days: [
    { label: '周一', value: 75 },
    { label: '周二', value: 85 },
    { label: '周三', value: 90 },
    { label: '周四', value: 78 },
    { label: '周五', value: 95 },
    { label: '周六', value: 60 },
    { label: '周日', value: 0 }
  ]
})

const processData = ref([
  { name: '焊接', count: 3200, percent: 100 },
  { name: '喷涂', count: 2800, percent: 87 },
  { name: '折弯', count: 2400, percent: 75 },
  { name: '切割', count: 1800, percent: 56 },
  { name: '组装', count: 1200, percent: 37 }
])

const detailData = ref([
  { date: '2026-03-03', orders: 8, output: 1560, qualified: 1542, qualifiedRate: 98.8, efficiency: 95.2 },
  { date: '2026-03-02', orders: 10, output: 1890, qualified: 1860, qualifiedRate: 98.4, efficiency: 93.1 },
  { date: '2026-03-01', orders: 7, output: 1420, qualified: 1390, qualifiedRate: 97.9, efficiency: 91.5 },
  { date: '2026-02-28', orders: 9, output: 1680, qualified: 1660, qualifiedRate: 98.8, efficiency: 94.2 },
  { date: '2026-02-27', orders: 6, output: 1250, qualified: 1230, qualifiedRate: 98.4, efficiency: 92.8 }
])
</script>

<style>
.chart-placeholder {
  height: 250px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 20px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  height: 100%;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 40px;
  background: linear-gradient(180deg, var(--gold) 0%, var(--gold-light) 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}

.bar-label {
  margin-top: 10px;
  font-size: 12px;
  color: var(--foreground-light);
}

.process-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.process-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.process-info {
  display: flex;
  justify-content: space-between;
}

.process-name {
  font-weight: 500;
  color: var(--foreground);
}

.process-count {
  color: var(--foreground-light);
  font-size: 13px;
}
</style>
