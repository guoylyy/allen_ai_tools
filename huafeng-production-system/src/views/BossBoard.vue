<template>
  <div class="boss-board">
    <h1 class="page-title" style="color: #fff;">📺 老板看板</h1>

    <!-- 顶部统计 -->
    <div class="top-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
      <div class="stat-card" v-for="stat in topStats" :key="stat.label">
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 工序进度 -->
    <div class="process-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
      <div class="process-card" v-for="proc in processStats" :key="proc.id" :style="{ borderColor: proc.color }">
        <div class="process-header">
          <span class="process-name">{{ proc.name }}</span>
          <span class="process-count">{{ proc.todayCount }}</span>
        </div>
        <div class="process-body">
          <div class="process-info">
            <span class="label">今日任务</span>
            <span class="value">{{ proc.todayCount }} 件</span>
          </div>
          <div class="process-info">
            <span class="label">已完成</span>
            <span class="value completed">{{ proc.completed }}</span>
          </div>
          <div class="process-info">
            <span class="label">进行中</span>
            <span class="value working">{{ proc.working }}</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: proc.percent + '%', background: proc.color }"></div>
        </div>
        <div class="process-footer">
          <span>负责: {{ proc.worker }}</span>
          <span>设备: {{ proc.device }}</span>
        </div>
      </div>
    </div>

    <!-- 底部数据 -->
    <div class="bottom-panel" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
      <!-- 正在进行 -->
      <div class="panel card">
        <h3 style="margin: 0 0 15px 0; font-size: 16px;">🚧 正在进行</h3>
        <div class="production-list">
          <div class="production-item" v-for="item in productionList" :key="item.id">
            <div class="item-info">
              <span class="part-no">{{ item.partNo }}</span>
              <span class="process-tag" :style="{ background: item.color }">{{ item.process }}</span>
            </div>
            <div class="item-detail">
              <span>{{ item.name }}</span>
              <span class="quantity">× {{ item.quantity }}</span>
            </div>
            <div class="progress-bar" style="height: 4px;">
              <div class="progress-fill" :style="{ width: item.progress + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 员工状态 -->
      <div class="panel card">
        <h3 style="margin: 0 0 15px 0; font-size: 16px;">👥 员工状态</h3>
        <div class="workers-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div class="worker-card" v-for="worker in workers" :key="worker.id">
            <div class="worker-avatar">{{ worker.name[0] }}</div>
            <div class="worker-info">
              <div class="worker-name">{{ worker.name }}</div>
              <div class="worker-task">{{ worker.currentTask }}</div>
            </div>
            <div class="worker-status" :class="worker.status">{{ worker.status === 'working' ? '工作中' : '休息' }}</div>
          </div>
        </div>
      </div>

      <!-- 今日汇总 -->
      <div class="panel card">
        <h3 style="margin: 0 0 15px 0; font-size: 16px;">📊 今日汇总</h3>
        <div class="summary-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div class="summary-item">
            <div class="summary-value">{{ todayStats.totalOutput }}</div>
            <div class="summary-label">总产出</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ todayStats.qualified }}</div>
            <div class="summary-label">合格数</div>
          </div>
          <div class="summary-item">
            <div class="summary-value warning">{{ todayStats.rework }}</div>
            <div class="summary-label">返工数</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ todayStats.efficiency }}%</div>
            <div class="summary-label">效率</div>
          </div>
        </div>
        <div class="timeline" style="margin-top: 20px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: var(--foreground-light);">时间线</h4>
          <div class="timeline-item" v-for="event in timeline" :key="event.time">
            <span class="time">{{ event.time }}</span>
            <span class="event">{{ event.content }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const topStats = ref([
  { label: '总订单', value: 12, color: '#C29B40' },
  { label: '进行中', value: 8, color: '#3b82f6' },
  { label: '今日产出', value: 245, color: '#22c55e' },
  { label: '员工在线', value: 28, color: '#f59e0b' }
])

const processStats = ref([
  { id: 'jianban', name: '剪板', todayCount: 45, completed: 32, working: 8, percent: 71, color: '#ff6b6b', worker: '张师傅', device: '剪板机-01' },
  { id: 'shuchong', name: '数冲', todayCount: 28, completed: 15, working: 10, percent: 54, color: '#feca57', worker: '李师傅', device: '数冲机-02' },
  { id: 'jiguang', name: '激光', todayCount: 120, completed: 85, working: 20, percent: 71, color: '#48dbfb', worker: '王师傅', device: '激光机-01' },
  { id: 'zhewan', name: '折弯', todayCount: 95, completed: 60, working: 25, percent: 63, color: '#1dd1a1', worker: '赵师傅', device: '折弯机-03' },
  { id: 'hanjie', name: '焊接', todayCount: 180, completed: 100, working: 50, percent: 56, color: '#00d2d3', worker: '周师傅', device: '焊接站-04' },
  { id: 'pentu', name: '喷涂', todayCount: 88, completed: 55, working: 20, percent: 63, color: '#54a0ff', worker: '吴师傅', device: '喷涂房-01' }
])

const productionList = ref([
  { id: 1, partNo: 'HED0E022C01P', name: '对重悬臂角铁(左件)', process: '焊接', quantity: 13, progress: 80, color: '#00d2d3' },
  { id: 2, partNo: 'HED2A079C03', name: '慢层门板', process: '喷涂', quantity: 8, progress: 60, color: '#54a0ff' },
  { id: 3, partNo: 'HED3T058101', name: '上横档', process: '切管机', quantity: 2, progress: 45, color: '#ff9ff3' },
  { id: 4, partNo: 'HED0L024C03P', name: '轿厢缓冲器底座', process: '焊接', quantity: 2, progress: 90, color: '#00d2d3' }
])

const workers = ref([
  { id: 1, name: '张伟', currentTask: '剪板作业', status: 'working' },
  { id: 2, name: '李强', currentTask: '数冲作业', status: 'working' },
  { id: 3, name: '王芳', currentTask: '焊接作业', status: 'working' },
  { id: 4, name: '赵敏', currentTask: '休息', status: 'idle' },
  { id: 5, name: '钱刚', currentTask: '角钢线作业', status: 'working' },
  { id: 6, name: '孙杰', currentTask: '切管机作业', status: 'working' }
])

const todayStats = ref({
  totalOutput: 417,
  qualified: 402,
  rework: 15,
  efficiency: 96
})

const timeline = ref([
  { time: '08:30', content: '晨会结束，各工序开始作业' },
  { time: '09:15', content: '剪板完成第一批15件' },
  { time: '10:00', content: '焊接工序启动' },
  { time: '11:30', content: '激光下料完成80件' },
  { time: '12:00', content: '午休时间' },
  { time: '13:00', content: '下午作业开始' }
])
</script>

<style>
.boss-board {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: calc(100vh - 100px);
  padding: 30px;
  border-radius: 12px;
}

.boss-board .page-title {
  color: #fff;
  border-bottom: 2px solid #C29B40;
  padding-bottom: 12px;
}

/* 顶部统计 */
.top-stats .stat-card {
  background: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%);
  border: 1px solid #C29B40;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.top-stats .stat-value {
  font-size: 42px;
  font-weight: 700;
  color: #C29B40;
  text-shadow: 0 0 20px rgba(194, 155, 64, 0.5);
}

.top-stats .stat-label {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  margin-top: 8px;
}

/* 工序卡片 */
.process-card {
  background: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-left: 4px solid #C29B40;
  border-radius: 12px;
  padding: 20px;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.process-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.process-count {
  font-size: 24px;
  font-weight: 700;
  color: #C29B40;
}

.process-body {
  margin-bottom: 15px;
}

.process-info {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.process-info .label {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
}

.process-info .value {
  color: #fff;
  font-weight: 500;
}

.process-info .value.completed {
  color: #22c55e;
}

.process-info .value.working {
  color: #f59e0b;
}

.process-footer {
  display: flex;
  justify-content: space-between;
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  margin-top: 10px;
}

/* 底部面板 */
.bottom-panel .panel {
  background: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 20px;
}

.bottom-panel h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

/* 生产列表 */
.production-item {
  background: rgba(255,255,255,0.03);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.production-item .item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.production-item .part-no {
  font-family: monospace;
  font-size: 13px;
  color: #C29B40;
  font-weight: 600;
}

.process-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  color: #000;
  font-weight: 500;
}

.production-item .item-detail {
  display: flex;
  justify-content: space-between;
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  margin-bottom: 8px;
}

/* 员工卡片 */
.worker-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.03);
  padding: 10px;
  border-radius: 8px;
}

.worker-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C29B40, #D4B56A);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000;
  font-size: 14px;
}

.worker-info {
  flex: 1;
}

.worker-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.worker-task {
  color: rgba(255,255,255,0.5);
  font-size: 11px;
}

.worker-status {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
}

.worker-status.working {
  background: rgba(34,197,94,0.2);
  color: #22c55e;
}

.worker-status.idle {
  background: rgba(245,158,11,0.2);
  color: #f59e0b;
}

/* 汇总统计 */
.summary-item {
  text-align: center;
  padding: 15px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #C29B40;
}

.summary-value.warning {
  color: #f59e0b;
}

.summary-label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-top: 5px;
}

/* 时间线 */
.timeline {
  margin-top: 20px;
}

.timeline h4 {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
}

.timeline-item {
  display: flex;
  font-size: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.timeline-item .time {
  color: #C29B40;
  width: 50px;
  flex-shrink: 0;
}

.timeline-item .event {
  color: rgba(255,255,255,0.7);
}

/* 进度条 */
.boss-board .progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.boss-board .progress-fill {
  height: 100%;
  border-radius: 3px;
}
</style>
