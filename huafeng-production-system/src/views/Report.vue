<template>
  <div class="report-page">
    <h1 class="page-title">📝 扫码报工</h1>

    <div class="card">
      <!-- 步骤1: 选择工艺 -->
      <div class="step-section">
        <div class="step-header"><span class="step-num">1</span><h3>选择工艺</h3></div>
        <div class="process-selector">
          <button v-for="proc in processList" :key="proc.name" :class="['process-btn', selectedProcess === proc.name ? 'active' : '']" :style="{ '--proc-color': proc.color }" @click="selectProcess(proc.name)">
            {{ proc.name }}
            <span class="proc-count" v-if="getProcessOrderCount(proc.name) > 0">{{ getProcessOrderCount(proc.name) }}单</span>
          </button>
        </div>
      </div>

      <!-- 步骤2: 选择订单 -->
      <div v-if="selectedProcess" class="step-section">
        <div class="step-header"><span class="step-num">2</span><h3>选择订单</h3></div>
        <div class="order-list">
          <div v-for="order in getProcessOrders(selectedProcess)" :key="order.id" :class="['order-card', selectedOrder?.id === order.id ? 'selected' : '']" @click="selectOrder(order)">
            <div class="order-info">
              <span class="order-id">{{ order.id }}</span>
              <span class="order-customer">{{ order.customer }}</span>
            </div>
            <div class="order-meta">
              <span>台数: {{ order.quantity }}</span>
              <span>交货: {{ order.deliveryDate }}</span>
            </div>
            <div class="order-status">
              <span :class="['tag', getStatusTag(getOrderProcessStatus(order, selectedProcess))]">
                {{ getOrderProcessStatus(order, selectedProcess) || '无' }}
              </span>
            </div>
          </div>
          <div v-if="!getProcessOrders(selectedProcess).length" class="empty-tip">该工艺暂无产品</div>
        </div>
      </div>

      <!-- 步骤3: 报工详情 -->
      <div v-if="selectedOrder && currentItems.length" class="step-section">
        <div class="step-header">
          <span class="step-num">3</span>
          <h3>报工 - {{ selectedProcess }}</h3>
          <span :class="['tag', getStatusTag(processStatus)]">{{ processStatus || '无' }}</span>
        </div>

        <div class="order-detail-card">
          <div><strong>订单:</strong> {{ selectedOrder.id }} - {{ selectedOrder.customer }}</div>
          <div><strong>产品数:</strong> {{ currentItems.length }}</div>
        </div>

        <!-- 开始报工 -->
        <div v-if="processStatus === '待开始'" class="start-work-section">
          <button class="btn btn-primary btn-lg" @click="startWork">▶ 开始 {{ selectedProcess }} 报工</button>
        </div>

        <!-- 报工进度 -->
        <div v-if="processStatus !== '待开始' && processStatus !== '无'" class="progress-section">
          <div class="progress-info">
            <span>完成进度</span>
            <span class="progress-percent">{{ completedCount }}/{{ currentItems.length }}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" :style="{ width: progressPercent + '%' }"></div></div>
        </div>

        <!-- 时间信息 -->
        <div v-if="processStatus !== '待开始' && processStatus !== '无'" class="time-info-section">
          <div class="time-item">
            <span class="time-label">🕐 开始时间:</span>
            <span class="time-value">{{ formatTime(getProcessTime('start')) }}</span>
          </div>
          <div class="time-item" v-if="processStatus === '已完成'">
            <span class="time-label">✅ 完成时间:</span>
            <span class="time-value">{{ formatTime(getProcessTime('end')) }}</span>
          </div>
          <div class="time-item" v-if="processStatus === '已完成' && getProcessDuration()">
            <span class="time-label">⏱️ 用时:</span>
            <span class="time-value duration">{{ getProcessDuration() }}</span>
          </div>
        </div>

        <!-- 产品清单 -->
        <div v-if="processStatus !== '待开始' && processStatus !== '无'" class="items-section">
          <table class="items-table">
            <thead><tr><th>件号</th><th>名称</th><th>材质</th><th>规格</th><th>需报数量</th><th>已报数量</th><th>状态</th></tr></thead>
            <tbody>
              <tr v-for="item in currentItems" :key="item.sid" :class="{ completed: isItemCompleted(item) }">
                <td class="part-no">{{ item.partNo }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.material }}</td>
                <td>{{ item.length }}×{{ item.width }}×{{ item.thickness }}</td>
                <td>{{ item.quantity }}</td>
                <td>
                  <div class="qty-input-wrapper">
                    <input 
                      type="number" 
                      :value="getReportedQty(item)" 
                      @input="updateReportedQty(item, $event.target.value)"
                      :min="0"
                      :max="item.quantity"
                      class="qty-input"
                      :disabled="processStatus === '已完成'"
                    />
                    <span class="qty-sep">/</span>
                    <span class="qty-total">{{ item.quantity }}</span>
                  </div>
                </td>
                <td><span :class="['tag', isItemCompleted(item) ? 'tag-success' : 'tag-warning']">{{ isItemCompleted(item) ? '已完成' : '进行中' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 完成工单 -->
        <div v-if="processStatus === '进行中'" class="finish-section">
          <button class="btn btn-success btn-lg" :disabled="completedCount < currentItems.length" @click="showFinishConfirm = true">✅ 完成工单</button>
          <span v-if="completedCount < currentItems.length" class="finish-tip">请完成所有产品后再提交</span>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="card" style="margin-top: 20px;">
      <h3 style="margin: 0 0 20px 0;">📜 报工记录</h3>
      <table>
        <thead><tr><th>日期</th><th>订单号</th><th>工艺</th><th>产品数</th><th>状态</th></tr></thead>
        <tbody>
          <tr v-for="record in historyRecords" :key="record.id">
            <td>{{ record.date }}</td>
            <td>{{ record.orderId }}</td>
            <td><span class="process-badge" :style="{ background: getProcessColor(record.process) }">{{ record.process }}</span></td>
            <td>{{ record.itemCount }}</td>
            <td><span class="tag tag-success">已完成</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 确认完成弹窗 -->
    <div v-if="showFinishConfirm" class="modal-overlay" @click.self="showFinishConfirm = false">
      <div class="modal" style="text-align: center;">
        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
        <h3 style="margin-bottom: 15px;">确认完成工单？</h3>
        <p style="color: var(--foreground-light); margin-bottom: 25px;">
          订单: <strong>{{ selectedOrder?.id }}</strong><br>
          工艺: <strong>{{ selectedProcess }}</strong><br>
          完成产品: <strong>{{ completedCount }}/{{ currentItems.length }}</strong>
        </p>
        <div style="display: flex; justify-content: center; gap: 15px;">
          <button class="btn" @click="showFinishConfirm = false">取消</button>
          <button class="btn btn-primary" @click="finishWork">确认完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ordersData, historyRecords, processList, computeProcessStatus } from '@/data/sharedData'

const selectedProcess = ref('')
const selectedOrder = ref(null)
const processStatus = ref('')
const showFinishConfirm = ref(false)

const getProcessOrders = (procName) => {
  return ordersData.value.filter(order => {
    const products = order.products.filter(p => p.processRoute.includes(procName))
    return products.length > 0
  })
}

const getProcessOrderCount = (procName) => getProcessOrders(procName).length

// 动态计算订单中某工艺的状态（根据报工数量）
const getOrderProcessStatus = (order, procName) => {
  const items = order.products.filter(p => p.processRoute.includes(procName))
  if (items.length === 0) return '无'
  
  // 检查是否有任何报工记录
  const hasAnyReport = items.some(item => {
    const reported = item.reportedQty ? item.reportedQty[procName] : 0
    return reported > 0
  })
  
  if (!hasAnyReport) {
    // 没有报工记录，检查工艺是否已完成（从completedProcs判断）
    return order.processes[procName]?.status || '待开始'
  }
  
  // 有报工记录，判断是否全部完成
  const allCompleted = items.every(item => {
    const reported = item.reportedQty ? item.reportedQty[procName] : 0
    return reported >= item.quantity
  })
  
  return allCompleted ? '已完成' : '进行中'
}

const currentItems = computed(() => {
  if (!selectedOrder.value || !selectedProcess.value) return []
  return selectedOrder.value.products.filter(p => p.processRoute.includes(selectedProcess.value))
})

const completedCount = computed(() => currentItems.value.filter(item => isItemCompleted(item)).length)
const progressPercent = computed(() => currentItems.value.length ? Math.round((completedCount.value / currentItems.value.length) * 100) : 0)

const getStatusTag = (status) => {
  if (status === '已完成') return 'tag-success'
  if (status === '进行中') return 'tag-info'
  if (status === '待开始') return 'tag-warning'
  if (status === '已阻塞') return 'tag-danger'
  return ''
}

const getProcessColor = (process) => {
  const colors = { '剪板': '#ff6b6b', '数冲': '#feca57', '激光下料': '#48dbfb', '折弯': '#1dd1a1', '角钢线': '#5f27cd', '切管机': '#ff9ff3', '焊接': '#00d2d3', '喷涂': '#ff9f43', '组装': '#00cec9' }
  return colors[process] || '#666'
}

// 获取产品已报工数量
const getReportedQty = (item) => {
  if (!item.reportedQty) item.reportedQty = {}
  return item.reportedQty[selectedProcess.value] || 0
}

// 更新产品报工数量
const updateReportedQty = (item, qty) => {
  const num = parseInt(qty) || 0
  if (!item.reportedQty) item.reportedQty = {}
  item.reportedQty[selectedProcess.value] = Math.min(num, item.quantity)
  
  // 同步到全局数据，但不要自动设置完成状态
  // 只有点击"完成工单"后才算真正完成
  syncProcessStatusDuringReport()
}

// 报工过程中的同步（不自动设置完成状态）
const syncProcessStatusDuringReport = () => {
  if (!selectedOrder.value || !selectedProcess.value) return
  
  const items = currentItems.value
  const hasAnyReport = items.some(item => {
    const reported = item.reportedQty ? item.reportedQty[selectedProcess.value] : 0
    return reported > 0
  })
  
  if (!selectedOrder.value.processes) selectedOrder.value.processes = {}
  
  // 获取之前的时间记录
  const existingProcess = selectedOrder.value.processes[selectedProcess.value]
  const existingStartTime = existingProcess?.startTime
  const existingEndTime = existingProcess?.endTime
  
  // 报工过程中始终保持"进行中"，不自动变"已完成"
  const completedItems = items.filter(item => {
    const reported = item.reportedQty ? item.reportedQty[selectedProcess.value] : 0
    return reported >= item.quantity
  })
  
  selectedOrder.value.processes[selectedProcess.value] = {
    status: '进行中',
    completedCount: completedItems.length,
    totalCount: items.length,
    canSchedule: false,
    items: items,
    startTime: existingStartTime || null,  // 保留开始时间
    endTime: existingEndTime || null       // 保留结束时间
  }
  
  // 更新 completedProcs
  items.forEach(item => {
    if (!item.completedProcs) item.completedProcs = {}
    const reported = item.reportedQty ? item.reportedQty[selectedProcess.value] : 0
    if (reported >= item.quantity) {
      item.completedProcs[selectedProcess.value] = '已完成'
    } else if (reported > 0) {
      item.completedProcs[selectedProcess.value] = '进行中'
    }
  })
  
  processStatus.value = '进行中'
}

// 同步工艺状态到订单（供排单页面读取）
// 参数 forceCompleted 用于强制设置为已完成（点击完成工单时）
const syncProcessStatusToOrder = (forceCompleted = false) => {
  if (!selectedOrder.value || !selectedProcess.value) return
  
  const items = currentItems.value
  const completedItems = items.filter(item => {
    const reported = item.reportedQty ? item.reportedQty[selectedProcess.value] : 0
    return reported >= item.quantity
  })
  const allCompleted = completedItems.length === items.length && items.length > 0
  const hasAnyReport = items.some(item => {
    const reported = item.reportedQty ? item.reportedQty[selectedProcess.value] : 0
    return reported > 0
  })
  
  // 确保 processes 对象存在
  if (!selectedOrder.value.processes) selectedOrder.value.processes = {}
  
  // 获取之前的时间记录
  const existingProcess = selectedOrder.value.processes[selectedProcess.value]
  const existingStartTime = existingProcess?.startTime
  const existingEndTime = existingProcess?.endTime
  
  let status = '待开始'
  if (forceCompleted || allCompleted) {
    // 只有点击完成工单后 或者 强制设置时才为已完成
    status = '已完成'
  } else if (hasAnyReport) {
    status = '进行中'
  }
  
  // 更新到 order.processes - 这是排单页面读取的数据源
  selectedOrder.value.processes[selectedProcess.value] = {
    status: status,
    completedCount: completedItems.length,
    totalCount: items.length,
    canSchedule: status !== '已完成',
    items: items,
    startTime: existingStartTime || null,  // 保留开始时间
    endTime: existingEndTime || null       // 保留结束时间
  }
  
  // 同时更新 completedProcs
  items.forEach(item => {
    if (!item.completedProcs) item.completedProcs = {}
    const reported = item.reportedQty ? item.reportedQty[selectedProcess.value] : 0
    // 只有全部完成才设置为已完成，否则保持进行中
    if (forceCompleted || (reported >= item.quantity && allCompleted)) {
      item.completedProcs[selectedProcess.value] = '已完成'
    } else if (reported > 0) {
      item.completedProcs[selectedProcess.value] = '进行中'
    }
  })
  
  // 更新本地状态
  processStatus.value = status
}

const isItemCompleted = (item) => {
  const reported = getReportedQty(item)
  return reported >= item.quantity
}

// 获取工艺的开始/结束时间
const getProcessTime = (type) => {
  if (!selectedOrder.value || !selectedProcess.value) return null
  const processData = selectedOrder.value.processes?.[selectedProcess.value]
  if (!processData) return null
  return processData[type + 'Time'] || null
}

// 格式化时间显示
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 计算用时
const getProcessDuration = () => {
  const startTime = getProcessTime('start')
  const endTime = getProcessTime('end')
  if (!startTime || !endTime) return null
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end - start
  
  if (diffMs < 0) return null
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

const selectProcess = (procName) => {
  selectedProcess.value = procName
  selectedOrder.value = null
  processStatus.value = ''
}

const selectOrder = (order) => {
  selectedOrder.value = order
  
  // 根据已报工数量动态判断并同步状态
  const items = order.products.filter(p => p.processRoute.includes(selectedProcess.value))
  if (items.length === 0) {
    processStatus.value = ''
    return
  }
  
  const hasStarted = items.some(item => {
    const reported = item.reportedQty ? item.reportedQty[selectedProcess.value] : 0
    return reported > 0
  })
  
  // 检查是否已完成（从 order.processes 读取）
  const existingStatus = order.processes?.[selectedProcess.value]?.status
  
  if (existingStatus === '已完成') {
    // 如果之前已经点击完成工单，保持已完成状态
    processStatus.value = '已完成'
  } else if (hasStarted) {
    // 有报工记录但未完成工单，保持进行中状态
    processStatus.value = '进行中'
    // 同步进行中状态
    syncProcessStatusDuringReport()
  } else {
    // 没有报工记录，保持初始状态
    processStatus.value = '待开始'
  }
}

const startWork = () => {
  // 初始化报工数量为0
  currentItems.value.forEach(item => {
    if (!item.reportedQty) item.reportedQty = {}
    if (item.reportedQty[selectedProcess.value] === undefined) {
      item.reportedQty[selectedProcess.value] = 0
    }
    if (!item.completedProcs) item.completedProcs = {}
    item.completedProcs[selectedProcess.value] = '进行中'
  })
  
  // 设置状态为进行中
  processStatus.value = '进行中'
  
  // 记录开始时间
  if (!selectedOrder.value.processes) selectedOrder.value.processes = {}
  const now = new Date().toISOString()
  selectedOrder.value.processes[selectedProcess.value] = {
    status: '进行中',
    completedCount: 0,
    totalCount: currentItems.value.length,
    canSchedule: false,
    items: currentItems.value,
    startTime: now,  // 记录开始时间
    endTime: null   // 尚未完成
  }
}

// 不再使用勾选，改为数量输入
const toggleItem = (item) => {
  // 保留兼容性，但不再使用
}

const finishWork = () => {
  // 检查是否全部报完
  const allCompleted = currentItems.value.every(item => getReportedQty(item) >= item.quantity)
  
  if (!allCompleted) {
    alert('请先完成所有产品的报工！')
    return
  }
  
  processStatus.value = '已完成'
  currentItems.value.forEach(item => {
    if (!item.completedProcs) item.completedProcs = {}
    item.completedProcs[selectedProcess.value] = '已完成'
  })
  
  // 记录完成时间
  const now = new Date().toISOString()
  if (selectedOrder.value.processes && selectedOrder.value.processes[selectedProcess.value]) {
    selectedOrder.value.processes[selectedProcess.value].endTime = now
  }
  
  // 同步状态，forceCompleted = true 表示强制设置为已完成
  syncProcessStatusToOrder(true)
  
  historyRecords.value.unshift({
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    orderId: selectedOrder.value.id,
    process: selectedProcess.value,
    itemCount: currentItems.value.length,
    status: '已完成'
  })
  
  showFinishConfirm.value = false
  alert('工单已完成！')
}
</script>

<style>
.step-section { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.step-section:last-of-type { border-bottom: none; }
.step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
.step-header h3 { margin: 0; flex: 1; }
.process-selector { display: flex; flex-wrap: wrap; gap: 10px; }
.process-btn { padding: 10px 20px; border: 2px solid var(--border); background: #fff; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 8px; }
.process-btn:hover { border-color: var(--proc-color, var(--primary)); }
.process-btn.active { background: var(--proc-color, var(--primary)); border-color: var(--proc-color, var(--primary)); color: #fff; }
.proc-count { font-size: 11px; background: rgba(255,255,255,0.3); padding: 2px 6px; border-radius: 10px; }
.order-list { display: flex; flex-direction: column; gap: 10px; }
.order-card { padding: 15px; border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 15px; }
.order-card:hover { border-color: var(--primary); }
.order-card.selected { border-color: var(--primary); background: rgba(64, 158, 255, 0.1); }
.order-card .order-id { font-weight: 700; color: var(--primary); }
.order-card .order-customer { color: var(--foreground-light); }
.order-card .order-meta { flex: 1; font-size: 12px; color: #999; }
.empty-tip { text-align: center; padding: 30px; color: var(--foreground-light); }
.order-detail-card { padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.start-work-section { text-align: center; padding: 30px; }
.progress-section { padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px; }
.progress-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
.progress-percent { font-weight: bold; color: var(--gold); }

/* 时间信息样式 */
.time-info-section { display: flex; flex-wrap: wrap; gap: 20px; padding: 12px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin-bottom: 20px; color: #fff; }
.time-item { display: flex; align-items: center; gap: 8px; }
.time-label { font-size: 12px; opacity: 0.9; }
.time-value { font-size: 13px; font-weight: 600; }
.time-value.duration { background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 12px; }
.items-section { margin: 20px 0; overflow-x: auto; }
.items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border); }
.items-table th { background: #f8f9fa; font-weight: 600; }
.items-table tr.completed { background: rgba(40, 167, 69, 0.1); }
.items-table .part-no { font-family: monospace; color: var(--primary); }

/* 报工数量输入框 */
.qty-input-wrapper { display: flex; align-items: center; gap: 4px; }
.qty-input { 
  width: 60px; 
  padding: 4px 8px; 
  border: 1px solid #ddd; 
  border-radius: 4px; 
  font-size: 13px;
  text-align: center;
}
.qty-input:focus { outline: none; border-color: var(--primary); }
.qty-input:disabled { background: #f5f5f5; color: #999; }
.qty-sep { color: #999; }
.qty-total { color: #666; font-size: 12px; }
.finish-section { text-align: center; padding: 20px; }
.finish-tip { display: block; margin-top: 10px; font-size: 12px; color: var(--foreground-light); }
.btn-lg { padding: 15px 40px; font-size: 16px; }
.btn-success { background: var(--success); color: #fff; }
.btn-success:hover { background: #16a34a; }
.btn-success:disabled { background: #ccc; cursor: not-allowed; }
.process-badge { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; color: #000; }
.tag-danger { background: #dc3545; color: #fff; }
</style>
