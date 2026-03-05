<template>
  <div class="dashboard">
    <h1 class="page-title">📊 进度看板</h1>

    <!-- 统计卡片 -->
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalOrders }}</div>
        <div class="stat-label">总订单数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.inProgress }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.workers }}</div>
        <div class="stat-label">员工人数</div>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="card">
      <div class="toolbar">
        <h3 style="margin: 0; font-size: 16px;">📋 订单列表</h3>
        <div style="display: flex; gap: 10px;">
          <select v-model="statusFilter" style="width: 150px;">
            <option value="">全部状态</option>
            <option value="pending">待开始</option>
            <option value="processing">生产中</option>
            <option value="completed">已完成</option>
          </select>
          <button class="btn btn-primary" @click="showUpload = true">📥 导入派工单</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户名称</th>
            <th>设备号</th>
            <th>产品总数</th>
            <th>已完成</th>
            <th>待生产</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.customer }}</td>
            <td>{{ order.deviceNo }}</td>
            <td><strong>{{ order.totalProducts }}</strong></td>
            <td><span style="color: #22c55e;">{{ order.completedProducts }}</span></td>
            <td><span style="color: #f59e0b;">{{ order.pendingProducts }}</span></td>
            <td>
              <span :class="['tag', 'tag-' + order.statusColor]">
                {{ order.status }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="action-btn" @click="viewOrder(order)">查看</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!orders.length" class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>暂无订单，请导入派工单</p>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div v-if="showUpload" class="modal-overlay" @click.self="showUpload = false">
      <div class="modal">
        <h3>📥 导入派工单</h3>
        <div class="form-group">
          <label>选择Excel文件</label>
          <input type="file" accept=".xls,.xlsx" />
        </div>
        <div class="form-group">
          <label>订单描述（可选）</label>
          <input type="text" placeholder="请输入订单描述" />
        </div>
        <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button class="btn" @click="showUpload = false">取消</button>
          <button class="btn btn-primary">确认导入</button>
        </div>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal" style="max-width: 700px;">
        <h3>📋 订单详情 - {{ currentOrder.id }}</h3>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><strong>客户:</strong> {{ currentOrder.customer }}</div>
            <div><strong>设备号:</strong> {{ currentOrder.deviceNo }}</div>
            <div><strong>合同号:</strong> {{ currentOrder.contractNo }}</div>
            <div><strong>签订日期:</strong> {{ currentOrder.signDate }}</div>
            <div><strong>交货期:</strong> {{ currentOrder.deliveryDate }}</div>
            <div><strong>订单金额:</strong> {{ currentOrder.amount }}</div>
          </div>
        </div>

        <h4 style="margin: 0 0 15px 0; font-size: 15px;">📦 产品进度</h4>
        <table>
          <thead>
            <tr>
              <th>件号</th>
              <th>产品名称</th>
              <th>工序</th>
              <th>数量</th>
              <th>已生产</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in currentOrder.products" :key="product.partNo">
              <td style="font-family: monospace;">{{ product.partNo }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.process }}</td>
              <td>{{ product.quantity }}</td>
              <td>{{ product.completed }}</td>
              <td>
                <span :class="['tag', product.status === '已完成' ? 'tag-success' : 'tag-warning']">
                  {{ product.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>总体进度: </strong>
            <div class="progress-bar" style="width: 200px; display: inline-block; vertical-align: middle; margin-left: 10px;">
              <div class="progress-fill" :style="{ width: currentOrder.progress + '%' }"></div>
            </div>
            <span style="margin-left: 10px; color: #C29B40;">{{ currentOrder.progress }}%</span>
          </div>
          <button class="btn" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const showUpload = ref(false)
const showDetail = ref(false)
const statusFilter = ref('')
const currentOrder = ref({})

const stats = ref({
  totalOrders: 12,
  inProgress: 8,
  completed: 4,
  workers: 28
})

const orders = ref([
  { 
    id: 'EL-2026-001', 
    customer: '浙江万国汽车', 
    deviceNo: '46158563-65', 
    contractNo: 'HT-2026-0088',
    signDate: '2026-01-15',
    deliveryDate: '2026-03-20',
    amount: '¥268,000',
    totalProducts: 156, 
    completedProducts: 98,
    pendingProducts: 58,
    status: '生产中', 
    statusColor: 'info',
    progress: 63,
    products: [
      { partNo: 'HED0E022C01P', name: '对重悬臂角铁(左件)', process: '焊接', quantity: 13, completed: 13, status: '已完成' },
      { partNo: 'HED0E022C02P', name: '对重悬臂角铁(右件)', process: '焊接', quantity: 13, completed: 10, status: '进行中' },
      { partNo: 'HED2A079C03', name: '慢层门板', process: '喷涂', quantity: 8, completed: 0, status: '待生产' },
      { partNo: 'HED2A082C01', name: '右快层门板', process: '折弯', quantity: 4, completed: 0, status: '待生产' },
      { partNo: 'HED0E022103', name: '连接板', process: '激光', quantity: 13, completed: 0, status: '待生产' },
      { partNo: 'HED0E008C01P', name: '角铁斜撑(对重)', process: '组装', quantity: 26, completed: 0, status: '待生产' }
    ]
  },
  { 
    id: 'EL-2026-002', 
    customer: '巨通电梯', 
    deviceNo: '46158566', 
    contractNo: 'HT-2026-0077',
    signDate: '2026-01-10',
    deliveryDate: '2026-03-15',
    amount: '¥198,000',
    totalProducts: 89, 
    completedProducts: 89,
    pendingProducts: 0,
    status: '已完成', 
    statusColor: 'success',
    progress: 100,
    products: [
      { partNo: 'HED3T058101', name: '上横档', process: '焊接', quantity: 2, completed: 2, status: '已完成' },
      { partNo: 'HED0L024C03P', name: '轿厢缓冲器底座', process: '切管机', quantity: 2, completed: 2, status: '已完成' }
    ]
  },
  { 
    id: 'EL-2026-003', 
    customer: '北京某公司', 
    deviceNo: '46158567', 
    contractNo: 'HT-2026-0099',
    signDate: '2026-02-01',
    deliveryDate: '2026-04-01',
    amount: '¥328,000',
    totalProducts: 234, 
    completedProducts: 0,
    pendingProducts: 234,
    status: '待开始', 
    statusColor: 'warning',
    progress: 0,
    products: [
      { partNo: 'HED1A001C01', name: '轿厢底板', process: '剪板', quantity: 20, completed: 0, status: '待生产' },
      { partNo: 'HED1A002C01', name: '轿厢顶板', process: '剪板', quantity: 20, completed: 0, status: '待生产' },
      { partNo: 'HED2A003C01', name: '门板总成', process: '数冲', quantity: 50, completed: 0, status: '待生产' }
    ]
  },
  { 
    id: 'EL-2026-004', 
    customer: '上海电梯', 
    deviceNo: '46158568', 
    contractNo: 'HT-2026-0101',
    signDate: '2026-02-10',
    deliveryDate: '2026-03-25',
    amount: '¥258,000',
    totalProducts: 178, 
    completedProducts: 45,
    pendingProducts: 133,
    status: '生产中', 
    statusColor: 'info',
    progress: 25,
    products: [
      { partNo: 'HED4T001C01', name: '主梁', process: '激光', quantity: 30, completed: 30, status: '已完成' },
      { partNo: 'HED4T002C01', name: '副梁', process: '激光', quantity: 30, completed: 15, status: '进行中' },
      { partNo: 'HED4T003C01', name: '底座', process: '折弯', quantity: 25, completed: 0, status: '待生产' }
    ]
  }
])

const filteredOrders = computed(() => {
  if (!statusFilter.value) return orders.value
  const statusMap = {
    'pending': '待开始',
    'processing': '生产中',
    'completed': '已完成'
  }
  return orders.value.filter(o => o.status === statusMap[statusFilter.value])
})

const viewOrder = (order) => {
  currentOrder.value = order
  showDetail.value = true
}
</script>
