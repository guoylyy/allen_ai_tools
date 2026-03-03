<template>
  <div class="orders-page">
    <div class="toolbar">
      <h2 class="page-title">📋 生产排单</h2>
      <div class="toolbar-actions">
        <button class="btn" @click="showOrderSelect = true">+ 选择订单排产</button>
      </div>
    </div>

    <!-- Tab切换 -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'pending' }]" 
        @click="activeTab = 'pending'"
      >
        待排单 ({{ pendingTasks.length }})
      </button>
      <button 
        :class="['tab', { active: activeTab === 'today' }]" 
        @click="activeTab = 'today'"
      >
        今日生产 ({{ todayTasks.length }})
      </button>
      <button 
        :class="['tab', { active: activeTab === 'all' }]" 
        @click="activeTab = 'all'"
      >
        全部排单 ({{ allTasks.length }})
      </button>
    </div>

    <!-- 待排单列表 -->
    <div v-if="activeTab === 'pending'" class="card">
      <div v-if="pendingTasks.length" class="task-grid">
        <div v-for="task in pendingTasks" :key="task.id" class="task-card">
          <div class="task-header">
            <span class="process-badge" :style="{ background: getProcessColor(task.process) }">
              {{ task.process }}
            </span>
            <span class="task-status">待排单</span>
          </div>
          <div class="task-body">
            <div class="task-part">{{ task.partNo }}</div>
            <div class="task-name">{{ task.name }}</div>
            <div class="task-meta">
              <span>数量: {{ task.quantity }}</span>
              <span>订单: {{ task.orderNo }}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn btn-primary btn-sm" @click="assignToToday(task)">安排今日</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-state-icon">✓</div>
        <p>暂无待排单任务</p>
      </div>
    </div>

    <!-- 今日生产 -->
    <div v-if="activeTab === 'today'" class="card">
      <div v-if="todayTasks.length" class="task-grid">
        <div v-for="task in todayTasks" :key="task.id" class="task-card today">
          <div class="task-header">
            <span class="process-badge" :style="{ background: getProcessColor(task.process) }">
              {{ task.process }}
            </span>
            <span class="task-status working">生产中</span>
          </div>
          <div class="task-body">
            <div class="task-part">{{ task.partNo }}</div>
            <div class="task-name">{{ task.name }}</div>
            <div class="task-meta">
              <span>数量: {{ task.quantity }}</span>
              <span>订单: {{ task.orderNo }}</span>
            </div>
            <div class="task-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: task.progress + '%', background: getProcessColor(task.process) }"></div>
              </div>
              <span class="progress-text">{{ task.progress }}%</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn btn-sm" @click="viewDetail(task)">详情</button>
            <button class="btn btn-sm" @click="moveToPending(task)">移出</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>今日暂无生产任务</p>
      </div>
    </div>

    <!-- 全部排单 -->
    <div v-if="activeTab === 'all'" class="card">
      <table>
        <thead>
          <tr>
            <th>工序</th>
            <th>件号</th>
            <th>名称</th>
            <th>数量</th>
            <th>订单</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in allTasks" :key="task.id">
            <td>
              <span class="process-badge" :style="{ background: getProcessColor(task.process) }">
                {{ task.process }}
              </span>
            </td>
            <td class="part-no">{{ task.partNo }}</td>
            <td>{{ task.name }}</td>
            <td>{{ task.quantity }}</td>
            <td>{{ task.orderNo }}</td>
            <td>
              <span :class="['tag', task.status === 'today' ? 'tag-success' : 'tag-warning']">
                {{ task.status === 'today' ? '今日生产' : '待排单' }}
              </span>
            </td>
            <td>
              <button class="action-btn" @click="viewDetail(task)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!allTasks.length" class="empty-state">
        <p>暂无排单数据</p>
      </div>
    </div>

    <!-- 选择订单弹窗 -->
    <div v-if="showOrderSelect" class="modal-overlay" @click.self="showOrderSelect = false">
      <div class="modal modal-large">
        <h3>选择订单进行排产</h3>
        
        <div class="order-select-list">
          <div 
            v-for="order in orders" 
            :key="order.id" 
            :class="['order-select-item', { selected: selectedOrders.includes(order.id) }]"
            @click="toggleOrder(order.id)"
          >
            <div class="order-checkbox">
              {{ selectedOrders.includes(order.id) ? '✓' : '' }}
            </div>
            <div class="order-select-info">
              <div class="order-select-name">{{ order.customer_name || '未知客户' }}</div>
              <div class="order-select-meta">
                设备号: {{ order.device_no || '-' }} | 产品数: {{ order.product_count }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedOrders.length" class="selected-products">
          <h4>已选订单的产品（按工序分组）</h4>
          <div class="process-groups">
            <div v-for="(products, process) in selectedProductsByProcess" :key="process" class="process-group">
              <div class="process-group-header">
                <span class="process-badge" :style="{ background: getProcessColor(process) }">{{ process }}</span>
                <span class="count">{{ products.length }} 项</span>
              </div>
              <div class="process-group-items">
                <div 
                  v-for="p in products" 
                  :key="p.id" 
                  class="product-item"
                  :class="{ selected: selectedProducts.includes(p.id) }"
                  @click="toggleProduct(p.id)"
                >
                  <span class="part-no">{{ p.part_no }}</span>
                  <span class="name">{{ p.name }}</span>
                  <span class="qty">× {{ p.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn" @click="showOrderSelect = false">取消</button>
          <button class="btn btn-primary" @click="confirmSchedule" :disabled="!selectedProducts.length">
            确认排产 ({{ selectedProducts.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchOrders, fetchOrderDetail } from '../api'

const activeTab = ref('pending')
const orders = ref([])
const showOrderSelect = ref(false)
const selectedOrders = ref([])
const selectedProducts = ref([])

// 模拟排单数据（实际应从后端获取）
const pendingTasks = ref([
  { id: 1, process: '焊接', partNo: 'HED0E022C01P', name: '对重悬臂角铁(左件)', quantity: 13, orderNo: 'EL-001', status: 'pending' },
  { id: 2, process: '焊接', partNo: 'HED2A079C03', name: '慢层门板', quantity: 8, orderNo: 'EL-001', status: 'pending' },
  { id: 3, process: '喷涂', partNo: 'HED2A079C03', name: '慢层门板', quantity: 8, orderNo: 'EL-001', status: 'pending' },
  { id: 4, process: '折弯', partNo: 'HED2A082C01', name: '右快层门板', quantity: 4, orderNo: 'EL-001', status: 'pending' },
  { id: 5, process: '激光', partNo: 'HED0E022103', name: '连接板', quantity: 13, orderNo: 'EL-001', status: 'pending' },
  { id: 6, process: '组装', partNo: 'HED0E008C01P', name: '角铁斜撑(对重)', quantity: 26, orderNo: 'EL-001', status: 'pending' }
])

const todayTasks = ref([
  { id: 101, process: '焊接', partNo: 'HED3T058101', name: '上横档', quantity: 2, orderNo: 'EL-002', progress: 65, status: 'today' },
  { id: 102, process: '切管机', partNo: 'HED0L024C03P', name: '轿厢缓冲器底座', quantity: 2, orderNo: 'EL-002', progress: 80, status: 'today' },
  { id: 103, process: '喷涂', partNo: 'HED2A081C03', name: '中双右快层门板', quantity: 4, orderNo: 'EL-002', progress: 40, status: 'today' }
])

const allTasks = computed(() => [...pendingTasks.value, ...todayTasks.value])

const processColors = {
  '剪板': '#ff6b6b',
  '数冲': '#feca57',
  '激光': '#48dbfb',
  '激光下料': '#48dbfb',
  '折弯': '#1dd1a1',
  '角钢线': '#5f27cd',
  '切管机': '#ff9ff3',
  '锯床': '#a29bfe',
  '钻床': '#fd79a8',
  '普冲': '#81ecec',
  '焊接': '#00d2d3',
  '喷涂': '#54a0ff',
  '组装': '#00cec9'
}

const getProcessColor = (process) => processColors[process] || '#666'

// 获取所有订单的产品
const orderProducts = ref({})

const loadOrders = async () => {
  orders.value = await fetchOrders()
  // 加载每个订单的产品
  for (const order of orders.value) {
    const detail = await fetchOrderDetail(order.id)
    orderProducts.value[order.id] = detail.products
  }
}

const toggleOrder = (orderId) => {
  const idx = selectedOrders.value.indexOf(orderId)
  if (idx > -1) {
    selectedOrders.value.splice(idx, 1)
  } else {
    selectedOrders.value.push(orderId)
  }
  // 更新可选产品
  updateSelectedProducts()
}

const selectedProductsByProcess = computed(() => {
  const result = {}
  for (const orderId of selectedOrders.value) {
    const products = orderProducts.value[orderId] || []
    for (const p of products) {
      const process = getProcessFromRoute(p.process_route)
      if (process) {
        if (!result[process]) result[process] = []
        result[process].push({ ...p, orderId })
      }
    }
  }
  return result
})

const getProcessFromRoute = (route) => {
  if (!route) return null
  const processes = ['剪板', '数冲', '激光下料', '折弯', '角钢线', '切管机', '锯床', '钻床', '普冲', '焊接', '喷涂', '组装']
  for (const p of processes) {
    if (route.includes(p)) return p
  }
  return null
}

const updateSelectedProducts = () => {
  // 暂时清空，重新选择
  selectedProducts.value = []
}

const toggleProduct = (productId) => {
  const idx = selectedProducts.value.indexOf(productId)
  if (idx > -1) {
    selectedProducts.value.splice(idx, 1)
  } else {
    selectedProducts.value.push(productId)
  }
}

const confirmSchedule = () => {
  // TODO: 调用API保存排单
  alert(`已选择 ${selectedProducts.value.length} 个产品进行排产`)
  showOrderSelect.value = false
  selectedOrders.value = []
  selectedProducts.value = []
}

const assignToToday = (task) => {
  task.status = 'today'
  task.progress = 0
}

const moveToPending = (task) => {
  task.status = 'pending'
}

const viewDetail = (task) => {
  alert(`产品: ${task.name}\n件号: ${task.partNo}\n数量: ${task.quantity}`)
}

onMounted(loadOrders)
</script>

<style scoped>
.orders-page {
  max-width: 1400px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--dark-border);
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab:hover, .tab.active {
  background: rgba(0,240,255,0.1);
  border-color: var(--primary);
  color: var(--primary);
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.task-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--dark-border);
  border-radius: 12px;
  padding: 15px;
}

.task-card.today {
  border-color: var(--accent);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.process-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #000;
}

.task-status {
  font-size: 12px;
  color: var(--text-muted);
}

.task-status.working {
  color: var(--accent);
}

.task-part {
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 5px;
}

.task-name {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.task-progress .progress-bar {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: var(--accent);
}

.task-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.part-no {
  font-family: monospace;
  color: var(--primary);
}

/* 选择订单弹窗 */
.order-select-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.order-select-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border: 1px solid var(--dark-border);
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.order-select-item:hover {
  border-color: var(--primary);
}

.order-select-item.selected {
  border-color: var(--primary);
  background: rgba(0,240,255,0.1);
}

.order-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--dark-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.order-select-item.selected .order-checkbox {
  border-color: var(--primary);
  background: var(--primary);
  color: #000;
}

.order-select-name {
  font-weight: 500;
}

.order-select-meta {
  font-size: 12px;
  color: var(--text-muted);
}

/* 选中产品 */
.selected-products {
  margin-bottom: 20px;
}

.selected-products h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
}

.process-groups {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.process-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.process-group-header .count {
  font-size: 12px;
  color: var(--text-muted);
}

.process-group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--dark-border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.product-item:hover {
  border-color: var(--primary);
}

.product-item.selected {
  border-color: var(--primary);
  background: rgba(0,240,255,0.1);
}

.product-item .part-no {
  font-family: monospace;
  color: var(--primary);
}

.product-item .qty {
  color: var(--text-muted);
}
</style>
