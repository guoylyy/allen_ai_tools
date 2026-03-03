<template>
  <div class="stats-page">
    <!-- 统计概览 -->
    <div class="stats-cards">
      <div class="card">
        <div class="label">本月完成产量</div>
        <div class="value">1,280</div>
        <div class="trend up">↑ 12%</div>
      </div>
      <div class="card">
        <div class="label">平均效率</div>
        <div class="value">95%</div>
        <div class="trend up">↑ 5%</div>
      </div>
      <div class="card">
        <div class="label">最高产员工</div>
        <div class="value">张三</div>
        <div class="sub">156件</div>
      </div>
      <div class="card">
        <div class="label">最優班组</div>
        <div class="value">焊接组</div>
        <div class="sub">完成率98%</div>
      </div>
    </div>

    <!-- 工人效率排名 -->
    <div class="section">
      <h2>工人效率排名</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>姓名</th>
            <th>班组</th>
            <th>完成数量</th>
            <th>平均工时</th>
            <th>效率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(worker, index) in workerStats" :key="worker.id">
            <td>
              <span :class="['rank', index < 3 ? 'top' : '']">{{ index + 1 }}</span>
            </td>
            <td>{{ worker.name }}</td>
            <td>{{ worker.team }}</td>
            <td>{{ worker.quantity }}</td>
            <td>{{ worker.avgHours }}小时</td>
            <td>
              <div class="efficiency">
                <div class="bar" :style="{ width: worker.efficiency + '%', background: getEfficiencyColor(worker.efficiency) }"></div>
                <span>{{ worker.efficiency }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 班组对比 -->
    <div class="section">
      <h2>班组效率对比</h2>
      <div class="team-chart">
        <div class="team-row" v-for="team in teamStats" :key="team.name">
          <div class="team-name">{{ team.name }}</div>
          <div class="team-bar">
            <div class="bar" :style="{ width: team.completionRate + '%' }"></div>
          </div>
          <div class="team-rate">{{ team.completionRate }}%</div>
        </div>
      </div>
    </div>

    <!-- 趋势图 -->
    <div class="section">
      <h2>产能趋势（近7天）</h2>
      <div class="trend-chart">
        <div class="chart-bar" v-for="(day, index) in trendData" :key="index">
          <div class="bar" :style="{ height: (day.quantity / 150 * 100) + '%' }"></div>
          <div class="label">{{ day.day }}</div>
          <div class="value">{{ day.quantity }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const workerStats = ref([
  { id: 1, name: '张三', team: '焊接组', quantity: 156, avgHours: 2.8, efficiency: 105 },
  { id: 2, name: '李四', team: '焊接组', quantity: 148, avgHours: 3.0, efficiency: 100 },
  { id: 3, name: '王五', team: '装配组', quantity: 142, avgHours: 2.6, efficiency: 98 },
  { id: 4, name: '赵六', team: '装配组', quantity: 135, avgHours: 2.9, efficiency: 95 },
  { id: 5, name: '钱七', team: '油漆组', quantity: 128, avgHours: 3.1, efficiency: 92 },
  { id: 6, name: '孙八', team: '电工组', quantity: 120, avgHours: 2.5, efficiency: 90 }
])

const teamStats = ref([
  { name: '焊接组', completionRate: 98 },
  { name: '装配组', completionRate: 95 },
  { name: '油漆组', completionRate: 92 },
  { name: '电工组', completionRate: 90 }
])

const trendData = ref([
  { day: '周一', quantity: 120 },
  { day: '周二', quantity: 135 },
  { day: '周三', quantity: 142 },
  { day: '周四', quantity: 138 },
  { day: '周五', quantity: 150 },
  { day: '周六', quantity: 145 },
  { day: '周日', quantity: 130 }
])

const getEfficiencyColor = (efficiency) => {
  if (efficiency >= 100) return '#52c41a'
  if (efficiency >= 90) return '#1890ff'
  if (efficiency >= 80) return '#faad14'
  return '#ff4d4f'
}
</script>

<style scoped>
.stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
.card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.card .label { color: #888; font-size: 14px; margin-bottom: 8px; }
.card .value { font-size: 28px; font-weight: bold; color: #333; }
.card .trend { font-size: 14px; margin-top: 5px; }
.card .trend.up { color: #52c41a; }
.card .sub { font-size: 13px; color: #999; margin-top: 5px; }
.section { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 20px; }
.section h2 { font-size: 16px; margin-bottom: 15px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table th { background: #fafafa; color: #666; font-weight: 500; font-size: 13px; }
.rank { display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background: #f0f0f0; font-size: 12px; }
.rank.top { background: #ff4d4f; color: #fff; }
.efficiency { display: flex; align-items: center; gap: 10px; }
.efficiency .bar { height: 8px; border-radius: 4px; min-width: 50px; }
.efficiency span { font-size: 13px; color: #666; }
.team-chart { }
.team-row { display: flex; align-items: center; margin-bottom: 15px; }
.team-name { width: 80px; font-size: 14px; }
.team-bar { flex: 1; height: 24px; background: #f0f0f0; border-radius: 12px; overflow: hidden; }
.team-bar .bar { height: 100%; background: #1890ff; border-radius: 12px; }
.team-rate { width: 50px; text-align: right; font-size: 14px; color: #666; }
.trend-chart { display: flex; justify-content: space-between; align-items: flex-end; height: 200px; padding-top: 20px; }
.chart-bar { display: flex; flex-direction: column; align-items: center; flex: 1; }
.chart-bar .bar { width: 40px; background: #1890ff; border-radius: 4px 4px 0 0; min-height: 10px; }
.chart-bar .label { margin-top: 10px; font-size: 12px; color: #999; }
.chart-bar .value { font-size: 13px; color: #666; margin-top: 5px; }
</style>
