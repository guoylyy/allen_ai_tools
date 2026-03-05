<template>
  <div class="orders-page">
    <h1 class="page-title">📋 生产排单</h1>

    <div class="tabs" style="display: flex; gap: 10px; margin-bottom: 24px;">
      <button :class="['btn', activeTab === 'order' ? 'btn-primary' : 'btn-outline']" @click="activeTab = 'order'">📦 订单维度</button>
      <button :class="['btn', activeTab === 'process' ? 'btn-primary' : 'btn-outline']" @click="activeTab = 'process'">🔧 工艺维度</button>
    </div>

    <!-- 订单维度 - 工序流程关系图 -->
    <div v-if="activeTab === 'order'" class="order-dimension">
      <div v-for="order in ordersData" :key="order.id" class="order-card card">
        <!-- 紧凑的订单头部 -->
        <div class="order-header-compact" @click="toggleOrderCard(order.id)">
          <div class="order-basic-info">
            <span class="order-id">{{ order.id }}</span>
            <span class="customer">{{ order.customer }}</span>
            <span class="project-name">{{ order.project }}</span>
          </div>
          <div class="order-meta">
            <span class="meta-item">📅 {{ order.deliveryDate }}</span>
            <span class="meta-item">🏭 {{ order.quantity }}台</span>
            <span :class="['tag', order.statusColor]">{{ order.status }}</span>
            <span class="expand-icon">{{ expandedOrderCards[order.id] ? '▼' : '▶' }}</span>
          </div>
        </div>

        <!-- 紧凑的进度条 -->
        <div class="order-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getOrderProgress(order) + '%' }"></div>
          </div>
          <span class="progress-text">整体进度: {{ getOrderProgress(order) }}%</span>
        </div>

        <!-- 展开内容区域 -->
        <div v-if="expandedOrderCards[order.id]" class="order-expanded-content">
        
        <!-- 工序流程关系图 - 可折叠 -->
        <div class="section-collapsible">
          <div class="section-header" @click="toggleSection(order.id, 'flow')">
            <span class="section-icon">{{ expandedSections[order.id]?.flow ? '▼' : '▶' }}</span>
            <span class="section-title">📊 工序流程关系图</span>
            <span class="section-hint">(点击{{ expandedSections[order.id]?.flow ? '收起' : '展开' }})</span>
          </div>
          
          <div v-if="expandedSections[order.id]?.flow" class="section-content">
            <!-- 层级展示 -->
            <div class="flow-layers">
              <div v-for="(layer, layerIndex) in processLayers" :key="layerIndex" class="flow-layer">
                <div class="layer-label">第{{ layerIndex + 1 }}步</div>
                <div class="layer-nodes">
                  <div v-for="proc in layer" :key="proc.name" class="process-node" :class="getProcessStatus(order, proc.name)" :style="{ '--proc-color': proc.color }">
                    <div class="node-header">
                      <span class="node-icon">
                        <span v-if="getProcessStatus(order, proc.name) === '已完成'">✓</span>
                        <span v-else-if="getProcessStatus(order, proc.name) === '进行中'">▶</span>
                        <span v-else-if="getProcessStatus(order, proc.name) === '已阻塞'">⛔</span>
                        <span v-else>○</span>
                      </span>
                      <span class="node-name">{{ proc.name }}</span>
                    </div>
                    <div class="node-status">
                      <span :class="['tag', getStatusTag(getProcessStatus(order, proc.name))]">{{ getStatusText(getProcessStatus(order, proc.name)) }}</span>
                    </div>
                    <div class="node-count" v-if="getProcessData(order, proc.name).totalCount > 0">
                      {{ getProcessData(order, proc.name).completedCount }}/{{ getProcessData(order, proc.name).totalCount }}
                    </div>
                    <div class="node-actions">
                      <button v-if="getProcessData(order, proc.name).canSchedule && getProcessStatus(order, proc.name) === '待开始'" class="action-btn" @click.stop="scheduleProcess(order, proc.name)">排单</button>
                      <button v-if="getProcessData(order, proc.name).totalCount > 0" class="action-btn" @click.stop="viewProcessDetail(order, proc.name)">查看</button>
                    </div>
                    <div v-if="getNextProcesses(proc.name).length" class="next-links">
                      <span class="link-label">→</span>
                      <span v-for="next in getNextProcesses(proc.name)" :key="next" class="next-proc">{{ next }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 流程关系说明 -->
            <div class="flow-legend">
              <div class="legend-title">工艺流程关系：</div>
              <div class="legend-items">
                <div v-for="(procs, from) in processFlowMap" :key="from" class="legend-item">
                  <span class="from-proc">{{ from }}</span>
                  <span class="arrow">→</span>
                  <span class="to-procs">{{ procs.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 产品工艺汇总 - 可折叠 -->
        <div class="section-collapsible">
          <div class="section-header" @click="toggleSection(order.id, 'products')">
            <span class="section-icon">{{ expandedSections[order.id]?.products ? '▼' : '▶' }}</span>
            <span class="section-title">📋 产品工艺流程汇总</span>
            <span class="section-badge">{{ order.products.length }}个产品</span>
            <span class="section-hint">(点击{{ expandedSections[order.id]?.products ? '收起' : '展开' }})</span>
          </div>
          
          <div v-if="expandedSections[order.id]?.products" class="section-content">
            <!-- 摘要统计 -->
            <div class="summary-stats">
              <div class="stat-item" v-for="proc in ['剪板', '数冲', '激光下料', '折弯', '角钢线', '切管机', '焊接', '喷涂', '组装']" :key="proc">
                <span class="stat-label">{{ proc }}</span>
                <span class="stat-value" :class="{ 'stat-active': getProductCountByProcess(order, proc) > 0 }">{{ getProductCountByProcess(order, proc) }}</span>
              </div>
            </div>
            
            <!-- 搜索过滤 -->
            <div class="table-toolbar">
              <input 
                type="text" 
                v-model="productSearchText[order.id]" 
                placeholder="🔍 搜索件号或名称..." 
                class="search-input"
                @input="filterProducts(order.id)"
              />
              <div class="filter-tags">
                <span 
                  v-for="proc in ['剪板', '数冲', '激光下料', '折弯', '焊接', '喷涂', '组装']" 
                  :key="proc"
                  :class="['filter-tag', { active: activeFilters[order.id]?.includes(proc) }]"
                  @click="toggleFilter(order.id, proc)"
                >{{ proc }}</span>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>件号</th>
                  <th>名称</th>
                  <th>工艺流程</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in filteredProducts[order.id] || order.products" :key="product.sid">
                  <td class="part-no">{{ product.partNo }}</td>
                  <td>{{ product.name }}</td>
                  <td class="process-route">
                    <span v-for="(proc, idx) in product.processRoute.split('-')" :key="proc">
                      <span :class="['proc-tag', getProductProcStatus(product, proc)]">{{ proc }}</span>
                      <span v-if="idx < product.processRoute.split('-').length - 1" class="proc-arrow">→</span>
                    </span>
                  </td>
                  <td>{{ getProductCurrentStatus(product) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="(filteredProducts[order.id] || []).length === 0" class="empty-filter">
              没有找到匹配的产品
            </div>
          </div>
        </div>
        
        </div><!-- end expanded-content -->
      </div>
    </div>

    <!-- 工艺维度 -->
    <div v-if="activeTab === 'process'" class="process-dimension">
      <div class="process-grid">
        <div v-for="proc in processList" :key="proc.name" class="process-card card">
          <div class="process-header-row">
            <span class="process-badge" :style="{ background: proc.color }">{{ proc.name }}</span>
            <span class="process-count">{{ getProcessOrderCount(proc.name) }} 订单</span>
          </div>
          <div v-if="getPrevProcesses(proc.name).length" class="prev-procs">
            <span class="label">上游:</span> {{ getPrevProcesses(proc.name).join(', ') }}
          </div>
          <div v-if="getNextProcesses(proc.name).length" class="next-procs">
            <span class="label">下游:</span> {{ getNextProcesses(proc.name).join(', ') }}
          </div>
          <div v-for="order in getProcessOrders(proc.name)" :key="order.id" class="order-mini-card" @click="viewProcessDetail(order, proc.name)">
            <div class="order-mini-header">
              <span class="order-id-mini">{{ order.id }}</span>
              <span :class="['tag', getStatusTag(getProcessStatus(order, proc.name))]">{{ getStatusText(getProcessStatus(order, proc.name)) }}</span>
            </div>
          </div>
          <div v-if="!getProcessOrders(proc.name).length" class="empty-state">暂无订单</div>
        </div>
      </div>
    </div>

    <!-- 弹窗 -->
    <div v-if="showScheduleModal" class="modal-overlay" @click.self="showScheduleModal = false">
      <div class="modal">
        <h3>📅 安排排单 - {{ schedulingProcess }}</h3>
        <div class="form-group"><label>订单</label><div>{{ schedulingOrder?.id }} - {{ schedulingOrder?.customer }}</div></div>
        <div class="form-group"><label>产品数</label><div>{{ getProcessData(schedulingOrder, schedulingProcess)?.totalCount || 0 }} 个产品</div></div>
        <div class="form-group"><label>上游工序</label><div>{{ getPrevProcesses(schedulingProcess).join(', ') || '无' }}</div></div>
        <div class="form-group"><label>选择日期</label><input type="date" v-model="scheduleDate" /></div>
        <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button class="btn" @click="showScheduleModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmSchedule">确认排单</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal" style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
        <h3>📋 {{ detailOrder?.id }} - {{ detailProcess }} 详情</h3>
        <div class="detail-info">
          <div><strong>上游:</strong> {{ getPrevProcesses(detailProcess).join(', ') || '无' }}</div>
          <div><strong>下游:</strong> {{ getNextProcesses(detailProcess).join(', ') || '无' }}</div>
          <div><strong>状态:</strong> {{ getStatusText(getProcessStatus(detailOrder, detailProcess)) }}</div>
          <div><strong>产品数:</strong> {{ getProcessData(detailOrder, detailProcess).totalCount }}</div>
        </div>
        <table style="width: 100%; font-size: 12px; margin-top: 15px;">
          <thead><tr><th>件号</th><th>名称</th><th>材质</th><th>规格</th><th>数量</th><th>工艺流程</th><th>状态</th></tr></thead>
          <tbody>
            <tr v-for="item in getProcessData(detailOrder, detailProcess).items" :key="item.sid" :class="{ 'row-completed': isItemCompleted(item, detailProcess) }">
              <td class="part-no">{{ item.partNo }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.material }}</td>
              <td>{{ item.length }}×{{ item.width }}×{{ item.thickness }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.processRoute }}</td>
              <td><span :class="['tag', isItemCompleted(item, detailProcess) ? 'tag-success' : 'tag-warning']">{{ isItemCompleted(item, detailProcess) ? '已完成' : '待生产' }}</span></td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right;"><button class="btn" @click="showDetailModal = false">关闭</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ordersData, processList, computeProcessStatus } from '@/data/sharedData'

const activeTab = ref('order')
const showScheduleModal = ref(false)
const showDetailModal = ref(false)
const scheduleDate = ref('2026-03-04')
const schedulingOrder = ref(null)
const schedulingProcess = ref('')
const detailOrder = ref(null)
const detailProcess = ref('')

// 根据产品构建工序流程关系
const processFlowMap = computed(() => {
  const flowMap = {}
  ordersData.value.forEach(order => {
    order.products.forEach(product => {
      const routes = product.processRoute.split('-')
      for (let i = 0; i < routes.length - 1; i++) {
        const from = routes[i]
        const to = routes[i + 1]
        if (!flowMap[from]) flowMap[from] = new Set()
        flowMap[from].add(to)
      }
    })
  })
  // 转换为普通对象
  const result = {}
  Object.keys(flowMap).sort().forEach(k => { result[k] = Array.from(flowMap[k]) })
  return result
})

// 计算工序层级
const processLayers = computed(() => {
  const layers = []
  const assigned = new Set()
  const flowMap = processFlowMap.value
  
  // 找出所有工序
  const allProcs = new Set()
  Object.keys(flowMap).forEach(k => { allProcs.add(k); flowMap[k].forEach(v => allProcs.add(v)) })
  
  // 找出第一步工序（没有入边的）
  const hasIncoming = new Set()
  Object.values(flowMap).forEach(targets => targets.forEach(t => hasIncoming.add(t)))
  
  let currentLayer = Array.from(allProcs).filter(p => !hasIncoming.has(p))
  
  while (currentLayer.length > 0) {
    layers.push(currentLayer.map(name => {
      const proc = processList.value.find(p => p.name === name)
      return proc || { name, color: '#666' }
    }))
    
    currentLayer.forEach(p => assigned.add(p))
    
    // 找下一层
    const nextLayer = []
    currentLayer.forEach(from => {
      if (flowMap[from]) {
        flowMap[from].forEach(to => {
          if (!assigned.has(to)) {
            // 检查是否所有前驱都已分配
            const hasAllPrev = Object.keys(flowMap).every(f => !flowMap[f].includes(to) || assigned.has(f))
            if (hasAllPrev && !nextLayer.includes(to)) nextLayer.push(to)
          }
        })
      }
    })
    currentLayer = nextLayer
  }
  
  return layers
})

const getPrevProcesses = (procName) => {
  const prev = []
  Object.entries(processFlowMap.value).forEach(([from, targets]) => {
    if (targets.includes(procName)) prev.push(from)
  })
  return prev
}

const getNextProcesses = (procName) => {
  return processFlowMap.value[procName] || []
}

// 折叠状态
const expandedOrderCards = ref({}) // 订单卡片展开状态
const expandedSections = ref({}) // 各区域展开状态 { orderId: { flow: bool, products: bool } }
const productSearchText = ref({})
const activeFilters = ref({})
const filteredProducts = ref({})

// 切换整个订单卡片
const toggleOrderCard = (orderId) => {
  expandedOrderCards.value[orderId] = !expandedOrderCards.value[orderId]
}

// 切换特定区域
const toggleSection = (orderId, section) => {
  if (!expandedSections.value[orderId]) expandedSections.value[orderId] = {}
  expandedSections.value[orderId][section] = !expandedSections.value[orderId][section]
}

// 获取订单整体进度
const getOrderProgress = (order) => {
  const processes = ['剪板', '数冲', '激光下料', '折弯', '角钢线', '切管机', '焊接', '喷涂', '组装']
  let completed = 0
  let total = 0
  processes.forEach(proc => {
    const data = getProcessData(order, proc)
    if (data.totalCount > 0) {
      total++
      if (data.status === '已完成') completed++
    }
  })
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

const getProductCountByProcess = (order, processName) => {
  return order.products.filter(p => p.processRoute && p.processRoute.includes(processName)).length
}

const toggleFilter = (orderId, proc) => {
  if (!activeFilters.value[orderId]) activeFilters.value[orderId] = []
  const idx = activeFilters.value[orderId].indexOf(proc)
  if (idx > -1) {
    activeFilters.value[orderId].splice(idx, 1)
  } else {
    activeFilters.value[orderId].push(proc)
  }
  filterProducts(orderId)
}

const filterProducts = (orderId) => {
  const order = ordersData.value.find(o => o.id === orderId)
  if (!order) return
  
  const search = (productSearchText.value[orderId] || '').toLowerCase()
  const filters = activeFilters.value[orderId] || []
  
  filteredProducts.value[orderId] = order.products.filter(p => {
    const matchSearch = !search || p.partNo.toLowerCase().includes(search) || p.name.toLowerCase().includes(search)
    const matchFilter = filters.length === 0 || filters.some(f => p.processRoute.includes(f))
    return matchSearch && matchFilter
  })
}

const getProcessStatus = (order, procName) => {
  if (!order.processes || !order.processes[procName]) return '无'
  return order.processes[procName].status
}

const getProcessData = (order, procName) => {
  if (!order.processes || !order.processes[procName]) return { status: '无', items: [], completedCount: 0, totalCount: 0, canSchedule: false }
  return order.processes[procName]
}

const getStatusTag = (status) => {
  if (status === '已完成') return 'tag-success'
  if (status === '进行中') return 'tag-info'
  if (status === '待开始') return 'tag-warning'
  if (status === '已阻塞') return 'tag-danger'
  return ''
}

const getStatusText = (status) => status === '无' ? '无产品' : status

const getProductCurrentStatus = (product) => {
  if (!product.completedProcs) return '待开始'
  const routes = product.processRoute.split('-')
  for (let i = routes.length - 1; i >= 0; i--) {
    if (product.completedProcs[routes[i]]) return product.completedProcs[routes[i]] === '已完成' ? '已完成' : '进行中'
  }
  return '待开始'
}

const getProductProcStatus = (product, proc) => {
  if (!product.completedProcs || !product.completedProcs[proc]) return 'pending'
  return product.completedProcs[proc] === '已完成' ? 'completed' : 'in-progress'
}

const isItemCompleted = (item, procName) => item.completedProcs && item.completedProcs[procName] === '已完成'

const scheduleProcess = (order, procName) => {
  schedulingOrder.value = order
  schedulingProcess.value = procName
  showScheduleModal.value = true
}

const confirmSchedule = () => {
  if (schedulingOrder.value && schedulingProcess.value) {
    const items = getProcessData(schedulingOrder.value, schedulingProcess.value).items
    items.forEach(item => {
      if (!item.completedProcs) item.completedProcs = {}
      item.completedProcs[schedulingProcess.value] = '进行中'
    })
    computeProcessStatus(schedulingOrder.value)
    alert('排单成功！')
    showScheduleModal.value = false
  }
}

const viewProcessDetail = (order, procName) => {
  detailOrder.value = order
  detailProcess.value = procName
  showDetailModal.value = true
}

const getProcessOrders = (procName) => ordersData.value.filter(o => getProcessData(o, procName).totalCount > 0)
const getProcessOrderCount = (procName) => getProcessOrders(procName).length

onMounted(() => {
  ordersData.value.forEach(order => { 
    computeProcessStatus(order)
    // 初始化折叠状态 - 默认收起
    expandedOrderCards.value[order.id] = true // 默认展开头部
    expandedSections.value[order.id] = { flow: false, products: false } // 默认收起详情
    productSearchText.value[order.id] = ''
    activeFilters.value[order.id] = []
  })
})
</script>

<style>
/* 紧凑订单头部 */
.order-header-compact { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 12px 15px; 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}
.order-header-compact:hover { transform: scale(1.01); box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
.order-basic-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.order-header-compact .order-id { font-weight: 700; font-size: 16px; }
.order-header-compact .customer { font-size: 14px; opacity: 0.95; }
.project-name { font-size: 12px; opacity: 0.8; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-meta { display: flex; align-items: center; gap: 15px; }
.meta-item { font-size: 12px; opacity: 0.9; }
.order-header-compact .tag { background: rgba(255,255,255,0.25); color: #fff; font-size: 11px; padding: 3px 10px; }
.expand-icon { font-size: 10px; opacity: 0.7; margin-left: 8px; }

/* 进度条 */
.order-progress { display: flex; align-items: center; gap: 12px; padding: 12px 15px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
.progress-bar { flex: 1; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #11998e, #38ef7d); border-radius: 4px; transition: width 0.5s ease; }
.progress-text { font-size: 12px; color: #666; white-space: nowrap; }

/* 展开内容区域 */
.order-expanded-content { padding: 15px; background: #fff; border-radius: 0 0 10px 10px; border-top: 1px solid #eee; }

/* 可折叠区域 */
.section-collapsible { margin-bottom: 15px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
.section-header { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 12px 15px; 
  background: #f8f9fa; 
  cursor: pointer; 
  user-select: none;
  transition: background 0.2s;
}
.section-header:hover { background: #e9ecef; }
.section-icon { font-size: 10px; color: var(--primary); }
.section-title { font-weight: 600; font-size: 14px; }
.section-badge { background: var(--primary); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: auto; }
.section-hint { font-size: 11px; color: #999; }
.section-content { padding: 15px; border-top: 1px solid #e9ecef; }

/* 摘要统计优化 */
.summary-stats { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px; }
.stat-item { display: flex; align-items: center; gap: 5px; font-size: 11px; }
.stat-label { color: #666; }
.stat-value { background: #dee2e6; color: #666; padding: 2px 6px; border-radius: 8px; font-weight: 600; font-size: 10px; }
.stat-value.stat-active { background: var(--primary); color: #fff; }

/* 搜索过滤 */
.table-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.search-input { flex: 1; min-width: 150px; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; }
.search-input:focus { outline: none; border-color: var(--primary); }
.filter-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.filter-tag { padding: 3px 8px; font-size: 10px; background: #e9ecef; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.filter-tag:hover { background: #dee2e6; }
.filter-tag.active { background: var(--primary); color: #fff; }

/* 表格 */
.summary-table table { width: 100%; font-size: 11px; border-collapse: collapse; }
.summary-table th, .summary-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; }
.summary-table th { background: #f8f9fa; font-weight: 600; font-size: 11px; }
.part-no { font-family: monospace; color: var(--primary); font-size: 10px; }
.process-route { white-space: nowrap; }
.proc-tag { padding: 1px 4px; border-radius: 3px; font-size: 9px; background: #e9ecef; }
.proc-tag.completed { background: #28a745; color: #fff; }
.proc-tag.in-progress { background: #007bff; color: #fff; }
.proc-arrow { margin: 0 3px; color: #bbb; font-size: 8px; }
.empty-filter { text-align: center; padding: 20px; color: #999; font-size: 12px; }

/* 流程图样式优化 */
.flow-layers { display: flex; flex-direction: column; gap: 12px; }
.flow-layer { display: flex; align-items: flex-start; }
.layer-label { width: 50px; font-size: 10px; color: #999; padding-top: 25px; }
.layer-nodes { display: flex; flex-wrap: wrap; gap: 10px; flex: 1; }
.process-node { min-width: 100px; padding: 8px; border-radius: 8px; background: #f8f9fa; border: 2px solid #dee2e6; text-align: center; }
.process-node.已完成 { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-color: #28a745; }
.process-node.进行中 { background: linear-gradient(135deg, #cce5ff 0%, #b8daff 100%); border-color: #007bff; }
.process-node.待开始 { background: #fff3cd; border-color: #ffc107; }
.process-node.已阻塞 { background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); border-color: #dc3545; }
.process-node.无 { opacity: 0.4; }
.node-header { display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 4px; }
.node-icon { width: 18px; height: 18px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; }
.已完成 .node-icon { background: #28a745; color: #fff; }
.进行中 .node-icon { background: #007bff; color: #fff; }
.已阻塞 .node-icon { background: #dc3545; color: #fff; }
.node-name { font-weight: 600; font-size: 11px; }
.node-status { margin: 4px 0; }
.node-count { font-size: 10px; color: #666; }
.node-actions { margin-top: 4px; display: flex; gap: 3px; justify-content: center; }
.next-links { margin-top: 6px; padding-top: 6px; border-top: 1px dashed #ccc; font-size: 9px; color: #666; }
.link-label { color: var(--primary); }
.next-proc { color: var(--primary); }

.action-btn { padding: 2px 6px; font-size: 9px; background: var(--primary); color: #fff; border: none; border-radius: 3px; cursor: pointer; }

.flow-legend { margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; }
.flow-legend .legend-title { font-size: 11px; color: #666; margin-bottom: 8px; }
.legend-items { display: flex; flex-wrap: wrap; gap: 8px; }
.legend-item { font-size: 10px; }
.from-proc { color: var(--primary); font-weight: 500; }
.arrow { color: #999; margin: 0 3px; }
.to-procs { color: #666; }

.process-relation-diagram { margin-bottom: 30px; }
.process-relation-diagram h4 { margin: 0 0 20px 0; font-size: 14px; }

.flow-layers { display: flex; flex-direction: column; gap: 20px; }
.flow-layer { display: flex; align-items: flex-start; }
.layer-label { width: 60px; font-size: 12px; color: #999; padding-top: 30px; }
.layer-nodes { display: flex; flex-wrap: wrap; gap: 15px; flex: 1; }

.process-node { min-width: 140px; padding: 12px; border-radius: 10px; background: #f8f9fa; border: 2px solid #dee2e6; text-align: center; }
.process-node.已完成 { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-color: #28a745; }
.process-node.进行中 { background: linear-gradient(135deg, #cce5ff 0%, #b8daff 100%); border-color: #007bff; }
.process-node.待开始 { background: #fff3cd; border-color: #ffc107; }
.process-node.已阻塞 { background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); border-color: #dc3545; }
.process-node.无 { opacity: 0.4; }

.node-header { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 6px; }
.node-icon { width: 22px; height: 22px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
.已完成 .node-icon { background: #28a745; color: #fff; }
.进行中 .node-icon { background: #007bff; color: #fff; }
.已阻塞 .node-icon { background: #dc3545; color: #fff; }
.node-name { font-weight: 600; font-size: 12px; }
.node-status { margin: 6px 0; }
.node-count { font-size: 11px; color: #666; }
.node-actions { margin-top: 6px; display: flex; gap: 4px; justify-content: center; }
.next-links { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc; font-size: 10px; color: #666; }
.link-label { color: var(--primary); }
.next-procs { color: var(--primary); }

.action-btn { padding: 3px 8px; font-size: 10px; background: var(--primary); color: #fff; border: none; border-radius: 3px; cursor: pointer; }

.flow-legend { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
.legend-title { font-size: 12px; color: #666; margin-bottom: 10px; }
.legend-items { display: flex; flex-wrap: wrap; gap: 10px; }
.legend-item { font-size: 11px; }
.from-proc { color: var(--primary); font-weight: 500; }
.arrow { color: #999; margin: 0 4px; }
.to-procs { color: #666; }

.product-summary { margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border); }
.product-summary h4 { margin: 0 0 15px 0; font-size: 14px; }
.collapse-icon { font-size: 10px; color: var(--primary); }
.summary-badge { font-size: 12px; font-weight: normal; background: #e9ecef; padding: 2px 8px; border-radius: 10px; margin-left: 10px; }

/* 摘要统计 */
.summary-stats { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px; background: #f8f9fa; border-radius: 8px; }
.stat-item { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.stat-label { color: #666; }
.stat-value { background: var(--primary); color: #fff; padding: 2px 8px; border-radius: 10px; font-weight: 600; }

/* 表格工具栏 */
.table-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
.search-input { flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }
.search-input:focus { outline: none; border-color: var(--primary); }
.filter-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.filter-tag { padding: 4px 10px; font-size: 11px; background: #e9ecef; border-radius: 15px; cursor: pointer; transition: all 0.2s; }
.filter-tag:hover { background: #dee2e6; }
.filter-tag.active { background: var(--primary); color: #fff; }

.empty-filter { text-align: center; padding: 30px; color: #999; font-size: 13px; }
.summary-table { overflow-x: auto; }
.summary-table table { width: 100%; font-size: 12px; border-collapse: collapse; }
.summary-table th, .summary-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border); }
.summary-table th { background: #f8f9fa; font-weight: 600; }
.part-no { font-family: monospace; color: var(--primary); }
.process-route { white-space: nowrap; }
.proc-tag { padding: 2px 6px; border-radius: 3px; font-size: 10px; background: #e9ecef; }
.proc-tag.completed { background: #28a745; color: #fff; }
.proc-tag.in-progress { background: #007bff; color: #fff; }
.proc-arrow { margin: 0 4px; color: #999; }

.process-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.process-card { padding: 15px; }
.process-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.process-badge { padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; color: #000; }
.process-count { font-size: 12px; color: var(--foreground-light); }
.prev-procs, .next-procs { font-size: 11px; color: #666; margin-bottom: 8px; }
.prev-procs .label, .next-procs .label { color: #999; }
.order-mini-card { padding: 10px; background: #f8f9fa; border-radius: 6px; cursor: pointer; margin-bottom: 8px; }
.order-mini-card:hover { background: #e9ecef; }
.order-mini-header { display: flex; justify-content: space-between; align-items: center; }
.order-id-mini { font-weight: 600; color: var(--primary); font-size: 13px; }

.detail-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
.row-completed { background: rgba(40, 167, 69, 0.1); }
.tag-danger { background: #dc3545; color: #fff; }
</style>
