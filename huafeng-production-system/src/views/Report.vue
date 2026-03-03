<template>
  <div class="report-page">
    <!-- 扫码模拟 -->
    <div class="scan-section">
      <div class="scan-box">
        <div class="scan-icon">📷</div>
        <h3>扫码报工</h3>
        <p>点击"模拟扫码"开始报工</p>
        <button class="btn primary large" @click="simulateScan">📷 模拟扫码</button>
      </div>
    </div>

    <!-- 待报工任务 -->
    <div class="section">
      <h2>待报工任务 ({{ pendingTasks.length }})</h2>
      <div class="task-list">
        <div class="task-card" v-for="task in pendingTasks" :key="task.id">
          <div class="task-header">
            <span class="order-no">{{ task.orderNo }}</span>
            <span class="process">{{ task.process }}</span>
          </div>
          <div class="task-body">
            <div class="info">产品：{{ task.product }}</div>
            <div class="info">标准工时：{{ task.standardHours }}小时</div>
          </div>
          <div class="task-actions">
            <button class="btn primary" @click="startTask(task)">开始</button>
            <button class="btn success" @click="reportTask(task)" :disabled="!task.started">报工</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 报工记录 -->
    <div class="section">
      <h2>今日报工记录 ({{ todayReports.length }})</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>工序</th>
            <th>工人</th>
            <th>开始时间</th>
            <th>完成时间</th>
            <th>实际工时</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in todayReports" :key="report.id">
            <td>{{ report.orderNo }}</td>
            <td>{{ report.process }}</td>
            <td>{{ report.worker }}</td>
            <td>{{ report.startTime }}</td>
            <td>{{ report.endTime }}</td>
            <td>{{ report.actualHours }}小时</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const pendingTasks = ref([
  { id: 1, orderNo: 'EL-2026-001', process: '轿底焊接', product: '电梯A-2000', standardHours: 3, started: false },
  { id: 2, orderNo: 'EL-2026-002', process: '门板组装', product: '电梯B-1500', standardHours: 2.5, started: false },
  { id: 3, orderNo: 'EL-2026-004', process: '底坑防腐', product: '电梯D-2000', standardHours: 2, started: false }
])

const todayReports = ref([
  { id: 1, orderNo: 'EL-2026-003', process: '喷漆', worker: '钱七', startTime: '08:30', endTime: '11:00', actualHours: 2.5 },
  { id: 2, orderNo: 'EL-2026-001', process: '轿顶焊接', worker: '张三', startTime: '09:00', endTime: '12:00', actualHours: 3 }
])

const simulateScan = () => {
  alert('扫码成功！请选择任务进行报工')
}

const startTask = (task) => {
  task.started = true
  alert(`开始工序: ${task.process}`)
}

const reportTask = (task) => {
  const actualHours = (Math.random() * 2 + 1).toFixed(1)
  todayReports.value.unshift({
    id: Date.now(),
    orderNo: task.orderNo,
    process: task.process,
    worker: '当前工人',
    startTime: '09:00',
    endTime: `${Math.floor(9 + parseFloat(actualHours))}:${Math.random() > 0.5 ? '30' : '00'}`,
    actualHours: parseFloat(actualHours)
  })
  pendingTasks.value = pendingTasks.value.filter(t => t.id !== task.id)
  alert('报工成功！')
}
</script>

<style scoped>
.scan-section { text-align: center; padding: 40px; background: #fff; border-radius: 8px; margin-bottom: 20px; }
.scan-box { display: inline-block; }
.scan-icon { font-size: 60px; margin-bottom: 15px; }
.scan-box h3 { margin-bottom: 10px; }
.scan-box p { color: #999; margin-bottom: 20px; }
.btn { padding: 8px 20px; border: 1px solid #d9d9d9; background: #fff; border-radius: 6px; cursor: pointer; margin: 0 5px; }
.btn.primary { background: #1890ff; color: #fff; border-color: #1890ff; }
.btn.success { background: #52c41a; color: #fff; border-color: #52c41a; }
.btn.large { padding: 12px 30px; font-size: 16px; }
.btn:disabled { background: #d9d9d9; border-color: #d9d9d9; cursor: not-allowed; }
.section { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 20px; }
.section h2 { font-size: 16px; margin-bottom: 15px; }
.task-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.task-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 15px; }
.task-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.order-no { font-weight: bold; }
.process { background: #e6f7ff; color: #1890ff; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.task-body .info { font-size: 13px; color: #666; margin-bottom: 5px; }
.task-actions { margin-top: 15px; display: flex; gap: 10px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.data-table th { background: #fafafa; color: #666; font-weight: 500; font-size: 13px; }
</style>
