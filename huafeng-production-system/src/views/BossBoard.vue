<template>
  <div class="dashboard">
    <!-- 顶部统计 -->
    <div class="top-stats">
      <div class="stat-card" v-for="stat in topStats" :key="stat.label">
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 工序进度 -->
    <div class="process-grid">
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
        <div class="progress-line">
          <div class="progress-fill" :style="{ width: proc.percent + '%', background: proc.color }"></div>
        </div>
        <div class="process-footer">
          <span>负责: {{ proc.worker || '待分配' }}</span>
          <span>设备: {{ proc.device }}</span>
        </div>
      </div>
    </div>

    <!-- 底部数据 -->
    <div class="bottom-panel">
      <!-- 今日生产列表 -->
      <div class="panel production-list">
        <h3>🚧 正在进行</h3>
        <div class="list-content">
          <div class="production-item" v-for="item in productionList" :key="item.id">
            <div class="item-info">
              <span class="part-no">{{ item.partNo }}</span>
              <span class="process-tag" :style="{ background: item.color }">{{ item.process }}</span>
            </div>
            <div class="item-detail">
              <span>{{ item.name }}</span>
              <span class="quantity">× {{ item.quantity }}</span>
            </div>
            <div class="item-progress">
              <div class="mini-progress" :style="{ width: item.progress + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 员工工作状态 -->
      <div class="panel workers-status">
        <h3>👥 员工状态</h3>
        <div class="workers-grid">
          <div class="worker-card" v-for="worker in workers" :key="worker.id">
            <div class="worker-avatar">{{ worker.name[0] }}</div>
            <div class="worker-info">
              <div class="worker-name">{{ worker.name }}</div>
              <div class="worker-task">{{ worker.currentTask || '空闲' }}</div>
            </div>
            <div class="worker-status" :class="worker.status">{{ worker.status === 'working' ? '工作中' : '休息' }}</div>
          </div>
        </div>
      </div>

      <!-- 今日汇总 -->
      <div class="panel today-summary">
        <h3>📊 今日汇总</h3>
        <div class="summary-stats">
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
        <div class="timeline">
          <h4>时间线</h4>
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
import { ref, onMounted } from 'vue'

const topStats = ref([
  { label: '总订单', value: 12, color: '#00f0ff' },
  { label: '进行中', value: 8, color: '#ff00ff' },
  { label: '今日产出', value: 245, color: '#00ff9f' },
  { label: '员工在线', value: 28, color: '#ffd700' }
])

const processStats = ref([
  { id: 'jianban', name: '剪板', todayCount: 45, completed: 32, working: 8, percent: 71, color: '#ff6b6b', worker: '张师傅', device: '剪板机-01' },
  { id: 'shuchong', name: '数冲', todayCount: 28, completed: 15, working: 10, percent: 54, color: '#feca57', worker: '李师傅', device: '数冲机-02' },
  { id: 'jiguang', name: '激光', todayCount: 120, completed: 85, working: 20, percent: 71, color: '#48dbfb', worker: '王师傅', device: '激光机-01' },
  { id: 'zhewan', name: '折弯', todayCount: 95, completed: 60, working: 25, percent: 63, color: '#1dd1a1', worker: '赵师傅', device: '折弯机-03' },
  { id: 'jiaogangxian', name: '角钢线', todayCount: 18, completed: 18, working: 0, percent: 100, color: '#5f27cd', worker: '钱师傅', device: '角钢线-01' },
  { id: 'qieguanji', name: '切管机', todayCount: 56, completed: 40, working: 10, percent: 71, color: '#ff9ff3', worker: '孙师傅', device: '切管机-02' },
  { id: 'hanjie', name: '焊接', todayCount: 180, completed: 100, working: 50, percent: 56, color: '#00d2d3', worker: '周师傅', device: '焊接站-04' },
  { id: 'pentu', name: '喷涂', todayCount: 88, completed: 55, working: 20, percent: 63, color: '#54a0ff', worker: '吴师傅', device: '喷涂房-01' },
  { id: 'zuzhuang', name: '组装', todayCount: 35, completed: 12, working: 15, percent: 34, color: '#00cec9', worker: '郑师傅', device: '组装线-01' }
])

const productionList = ref([
  { id: 1, partNo: 'HED0E022C01P', name: '对重悬臂角铁(左件)', process: '焊接', quantity: 13, progress: 80, color: '#00d2d3' },
  { id: 2, partNo: 'HED2A079C03', name: '慢层门板', process: '喷涂', quantity: 8, progress: 60, color: '#54a0ff' },
  { id: 3, partNo: 'HED3T058101', name: '上横档', process: '切管机', quantity: 2, progress: 45, color: '#ff9ff3' },
  { id: 4, partNo: 'HED0L024C03P', name: '轿厢缓冲器底座', process: '焊接', quantity: 2, progress: 90, color: '#00d2d3' },
  { id: 5, partNo: 'HED2A082C01', name: '右快层门板', process: '折弯', quantity: 4, progress: 35, color: '#1dd1a1' }
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

<style scoped>
.dashboard {
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  min-height: 100vh;
  padding: 20px;
  color: #fff;
  font-family: 'Orbitron', 'Rajdhani', sans-serif;
}

/* 顶部统计 */
.top-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.stat-value {
  font-size: 48px;
  font-weight: bold;
  text-shadow: 0 0 20px currentColor;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { text-shadow: 0 0 10px currentColor; }
  to { text-shadow: 0 0 30px currentColor, 0 0 50px currentColor; }
}

.stat-label {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  margin-top: 8px;
  letter-spacing: 2px;
}

/* 工序网格 */
.process-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.process-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.process-name {
  font-size: 20px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.process-count {
  font-size: 28px;
  font-weight: bold;
  color: #00f0ff;
}

.process-body {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.process-info {
  text-align: center;
}

.process-info .label {
  display: block;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 4px;
}

.process-info .value {
  font-size: 16px;
  font-weight: bold;
}

.process-info .value.completed { color: #00ff9f; }
.process-info .value.working { color: #ffd700; }

.progress-line {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px currentColor;
}

.process-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

/* 底部面板 */
.bottom-panel {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

.panel {
  background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 20px;
}

.panel h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  letter-spacing: 2px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 10px;
}

/* 生产列表 */
.production-item {
  padding: 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  margin-bottom: 10px;
}

.item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.part-no {
  font-weight: bold;
  color: #00f0ff;
}

.process-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.item-detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 8px;
}

.item-progress {
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}

.mini-progress {
  height: 100%;
  border-radius: 2px;
}

/* 员工状态 */
.workers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.worker-card {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}

.worker-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f0ff, #ff00ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
}

.worker-info {
  flex: 1;
}

.worker-name {
  font-size: 13px;
  font-weight: bold;
}

.worker-task {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
}

.worker-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
}

.worker-status.working {
  background: rgba(0,255,159,0.2);
  color: #00ff9f;
}

.worker-status.idle {
  background: rgba(255,215,0,0.2);
  color: #ffd700;
}

/* 今日汇总 */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
  padding: 15px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #00f0ff;
}

.summary-value.warning {
  color: #ffd700;
}

.summary-label {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-top: 5px;
}

.timeline h4 {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.timeline-item {
  display: flex;
  font-size: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.timeline-item .time {
  color: #00f0ff;
  width: 50px;
  flex-shrink: 0;
}

.timeline-item .event {
  color: rgba(255,255,255,0.7);
}
</style>
