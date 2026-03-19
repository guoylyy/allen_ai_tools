<template>
  <div class="client-portal">
    <!-- 顶部 -->
    <div class="header">
      <h1>华丰电梯生产进度</h1>
      <p class="subtitle">输入合同号查询订单进度</p>
    </div>

    <!-- 合同号输入 -->
    <div v-if="!selectedOrder" class="login-section">
      <div class="input-group">
        <input 
          type="text" 
          v-model="contractNo" 
          placeholder="请输入合同号"
          class="contract-input"
        />
        <button class="btn-search" @click="searchOrder">查询</button>
      </div>
      
      <p v-if="searchError" class="error-tip">{{ searchError }}</p>
      
      <div v-if="matchedOrders.length > 0" class="orders-list">
        <h3>找到以下合同：</h3>
        <div 
          v-for="order in matchedOrders" 
          :key="order.id" 
          class="order-card"
          @click="selectOrder(order)"
        >
          <div class="order-header">
            <span class="order-no">{{ order.id }}</span>
            <span :class="['status-tag', getStatusClass(order)]">{{ getOrderStatus(order) }}</span>
          </div>
          <div class="order-project">{{ order.project }}</div>
          <div class="order-meta">
            <span>交货: {{ order.deliveryDate }}</span>
            <span>台数: {{ order.quantity }}</span>
          </div>
          <div class="progress-bar-mini">
            <div class="progress-fill-mini" :style="{ width: getProgress(order) + '%' }"></div>
          </div>
          <div class="progress-text-mini">进度: {{ getProgress(order) }}%</div>
        </div>
      </div>
    </div>

    <!-- 进度详情 -->
    <div v-if="selectedOrder" class="detail-section">
      <button class="btn-back" @click="goBack">← 返回</button>
      
      <!-- 整体进度 -->
      <div class="progress-card">
        <h2>{{ selectedOrder.id }}</h2>
        <p class="project-name">{{ selectedOrder.project }}</p>
        
        <div class="progress-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8"/>
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#4CAF50" 
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="283"
              :stroke-dashoffset="283 - (283 * getProgress(selectedOrder) / 100)"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="progress-text">{{ getProgress(selectedOrder) }}%</div>
        </div>
        
        <div class="delivery-info">
          <span>📅 计划交货: <strong>{{ selectedOrder.deliveryDate }}</strong></span>
        </div>
      </div>

      <!-- 工艺进度 -->
      <div class="process-section">
        <h3>工艺进度</h3>
        <div class="process-list">
          <div 
            v-for="proc in activeProcesses" 
            :key="proc.name"
            :class="['process-item', getProcStatus(selectedOrder, proc.name)]"
          >
            <div class="process-icon">
              <span v-if="getProcStatus(selectedOrder, proc.name) === '已完成'">✓</span>
              <span v-else-if="getProcStatus(selectedOrder, proc.name) === '进行中'">◐</span>
              <span v-else-if="getProcStatus(selectedOrder, proc.name) === '已阻塞'">⛔</span>
              <span v-else>○</span>
            </div>
            <div class="process-name">{{ proc.name }}</div>
            <div class="process-status">
              <span v-if="getProcStatus(selectedOrder, proc.name) === '已完成'">已完成</span>
              <span v-else-if="getProcStatus(selectedOrder, proc.name) === '进行中'">
                {{ getProcCompletedCount(selectedOrder, proc.name) }}/{{ getProcTotalCount(selectedOrder, proc.name) }}
              </span>
              <span v-else-if="getProcStatus(selectedOrder, proc.name) === '已阻塞'">已阻塞</span>
              <span v-else>待开始</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 零件进度 -->
      <div class="parts-section">
        <h3>零件进度</h3>
        <div class="parts-list">
          <div 
            v-for="part in selectedOrder.products" 
            :key="part.sid"
            :class="['part-item', getPartStatusClass(part)]"
          >
            <div class="part-icon">
              <span v-if="isPartCompleted(part)">✓</span>
              <span v-else-if="isPartInProgress(part)">◐</span>
              <span v-else>○</span>
            </div>
            <div class="part-info">
              <div class="part-name">{{ part.name }}</div>
              <div class="part-no">{{ part.partNo }}</div>
            </div>
            <div class="part-route">{{ part.processRoute }}</div>
            <div class="part-status">
              <span v-if="isPartCompleted(part)">已完成</span>
              <span v-else-if="isPartInProgress(part)">进行中</span>
              <span v-else>待生产</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ordersData } from '@/data/sharedData'

const contractNo = ref('')
const selectedOrder = ref(null)
const searchError = ref('')
const matchedOrders = ref([])

const activeProcesses = [
  { name: '剪板', color: '#ff6b6b' },
  { name: '数冲', color: '#feca57' },
  { name: '激光下料', color: '#48dbfb' },
  { name: '折弯', color: '#1dd1a1' },
  { name: '角钢线', color: '#5f27cd' },
  { name: '切管机', color: '#ff9ff3' },
  { name: '焊接', color: '#00d2d3' },
  { name: '喷涂', color: '#ff9f43' },
  { name: '组装', color: '#00cec9' }
]

const searchOrder = () => {
  searchError.value = ''
  matchedOrders.value = []
  
  if (!contractNo.value) {
    searchError.value = '请输入合同号'
    return
  }
  
  const search = contractNo.value.toLowerCase()
  const found = ordersData.value.filter(o => 
    o.id.toLowerCase().includes(search) || 
    o.customer.toLowerCase().includes(search) ||
    o.project.toLowerCase().includes(search)
  )
  
  if (found.length === 0) {
    searchError.value = '未找到匹配的合同，请检查合同号'
  } else {
    matchedOrders.value = found
  }
}

const selectOrder = (order) => {
  selectedOrder.value = order
}

const goBack = () => {
  selectedOrder.value = null
  matchedOrders.value = []
  contractNo.value = ''
}

const getOrderStatus = (order) => {
  const statuses = Object.values(order.processes || {})
  const hasCompleted = statuses.some(s => s.status === '已完成')
  const hasInProgress = statuses.some(s => s.status === '进行中')
  const hasBlocked = statuses.some(s => s.status === '已阻塞')
  
  if (hasCompleted && !hasInProgress) return '已完成'
  if (hasInProgress) return '生产中'
  if (hasBlocked) return '已阻塞'
  return '待生产'
}

const getStatusClass = (order) => {
  const status = getOrderStatus(order)
  if (status === '已完成') return 'tag-success'
  if (status === '生产中') return 'tag-info'
  if (status === '已阻塞') return 'tag-danger'
  return 'tag-warning'
}

const getProgress = (order) => {
  const procs = ['剪板', '数冲', '激光下料', '折弯', '角钢线', '切管机', '焊接', '喷涂', '组装']
  let completed = 0
  procs.forEach(p => {
    const data = order.processes?.[p]
    if (data?.status === '已完成') completed++
  })
  return Math.round((completed / procs.length) * 100)
}

const getProcStatus = (order, procName) => {
  return order.processes?.[procName]?.status || '待开始'
}

const getProcCompletedCount = (order, procName) => {
  return order.processes?.[procName]?.completedCount || 0
}

const getProcTotalCount = (order, procName) => {
  return order.processes?.[procName]?.totalCount || 0
}

const isPartCompleted = (part) => {
  if (!part.completedProcs) return false
  const routes = part.processRoute.split('-')
  return routes.every(r => part.completedProcs[r] === '已完成')
}

const isPartInProgress = (part) => {
  if (!part.completedProcs) return false
  const routes = part.processRoute.split('-')
  return routes.some(r => part.completedProcs[r] === '进行中') && !isPartCompleted(part)
}

const getPartStatusClass = (part) => {
  if (isPartCompleted(part)) return 'completed'
  if (isPartInProgress(part)) return 'in-progress'
  return 'pending'
}
</script>

<style scoped>
.client-portal {
  min-height: 100vh;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 40px 20px 30px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
}

.header .subtitle {
  margin: 8px 0 0;
  opacity: 0.8;
  font-size: 14px;
}

.login-section {
  padding: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.contract-input {
  flex: 1;
  border: none;
  font-size: 16px;
  outline: none;
}

.btn-search {
  background: #667eea;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.error-tip {
  color: #f44336;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
}

.orders-list {
  margin-top: 20px;
}

.orders-list h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
}

.order-card:active {
  background: #f5f5f5;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-no {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.tag-success { background: #e8f5e9; color: #4caf50; }
.tag-info { background: #e3f2fd; color: #2196f3; }
.tag-warning { background: #fff3e0; color: #ff9800; }
.tag-danger { background: #ffebee; color: #f44336; }

.order-project {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.order-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.progress-bar-mini {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 2px;
}

.progress-text-mini {
  font-size: 12px;
  color: #4caf50;
  text-align: right;
  margin-top: 4px;
}

.detail-section {
  padding: 20px;
}

.btn-back {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 15px;
}

.progress-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.progress-card h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.project-name {
  color: #666;
  font-size: 14px;
  margin: 8px 0 20px;
}

.progress-circle {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 20px;
}

.progress-circle svg {
  width: 100%;
  height: 100%;
}

.progress-circle .progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: 600;
  color: #4caf50;
}

.delivery-info {
  font-size: 14px;
  color: #666;
}

.delivery-info strong {
  color: #333;
}

.process-section, .parts-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.process-section h3, .parts-section h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px;
}

.process-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.process-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f5f5f5;
}

.process-item.已完成 {
  background: #e8f5e9;
}

.process-item.进行中 {
  background: #e3f2fd;
}

.process-item.已阻塞 {
  background: #ffebee;
}

.process-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 12px;
}

.已完成 .process-icon {
  background: #4caf50;
  color: #fff;
}

.进行中 .process-icon {
  background: #2196f3;
  color: #fff;
}

.已阻塞 .process-icon {
  background: #f44336;
  color: #fff;
}

.process-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.process-status {
  font-size: 12px;
  color: #666;
}

.parts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.part-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fafafa;
}

.part-item.completed {
  background: #f1f8e9;
}

.part-item.in-progress {
  background: #e3f2fd;
}

.part-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 10px;
}

.part-item.completed .part-icon {
  background: #4caf50;
  color: #fff;
}

.part-item.in-progress .part-icon {
  background: #2196f3;
  color: #fff;
}

.part-info {
  flex: 1;
}

.part-name {
  font-size: 13px;
  color: #333;
}

.part-no {
  font-size: 11px;
  color: #999;
  font-family: monospace;
}

.part-route {
  font-size: 11px;
  color: #999;
  margin-right: 10px;
}

.part-status {
  font-size: 11px;
  color: #666;
}
</style>
