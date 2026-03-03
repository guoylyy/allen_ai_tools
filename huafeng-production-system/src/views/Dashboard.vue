<template>
  <div class="dashboard">
    <!-- 顶部统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalOrders || 0 }}</div>
          <div class="stat-label">总订单</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalProducts || 0 }}</div>
          <div class="stat-label">产品总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalWorkers || 0 }}</div>
          <div class="stat-label">员工数</div>
        </div>
      </div>
      <div class="stat-card accent">
        <div class="stat-icon">📥</div>
        <div class="stat-content">
          <div class="stat-value">{{ todayImports }}</div>
          <div class="stat-label">今日导入</div>
        </div>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="card">
      <div class="card-header">
        <h3>📋 订单列表</h3>
        <button class="btn btn-primary" @click="showUpload = true">📥 导入派工单</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>订单ID</th>
            <th>客户名称</th>
            <th>设备号</th>
            <th>产品数</th>
            <th>导入时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>
              <span class="order-id">{{ order.id.slice(0, 8) }}...</span>
            </td>
            <td>{{ order.customer_name || '-' }}</td>
            <td>{{ order.device_no || '-' }}</td>
            <td>
              <span class="tag tag-primary">{{ order.product_count }}</span>
            </td>
            <td>{{ order.created_at }}</td>
            <td>
              <div class="actions">
                <button class="action-btn" @click="viewOrder(order)">查看</button>
                <button class="action-btn danger" @click="handleDelete(order)">删除</button>
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

    <!-- 导入弹窗 - 带预览 -->
    <div v-if="showUpload" class="modal-overlay" @click.self="showUpload = false">
      <div class="modal modal-large">
        <h3>📥 导入派工单</h3>
        
        <div v-if="!previewData" class="upload-area">
          <input type="file" accept=".xls,.xlsx" @change="handleFileSelect" />
          <p class="upload-tip">支持 .xls 和 .xlsx 格式</p>
        </div>

        <!-- 预览数据 -->
        <div v-else class="preview-area">
          <div class="preview-header">
            <div class="preview-info">
              <h4>{{ previewData.fileName }}</h4>
              <p>共 {{ previewData.totalProducts }} 个产品，{{ previewData.processCount }} 道工序</p>
            </div>
            <button class="btn" @click="clearPreview">重新选择</button>
          </div>

          <div class="preview-stats">
            <div class="preview-stat" v-for="(count, process) in previewData.processBreakdown" :key="process">
              <span class="process-name">{{ process }}</span>
              <span class="process-count">{{ count }}</span>
            </div>
          </div>

          <div class="preview-products">
            <h4>产品预览 (前20条)</h4>
            <div class="products-table">
              <table>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>件号</th>
                    <th>名称</th>
                    <th>数量</th>
                    <th>工艺流程</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in previewData.products.slice(0, 20)" :key="p.part_no">
                    <td>{{ p.serial_no }}</td>
                    <td class="part-no">{{ p.part_no }}</td>
                    <td>{{ p.name }}</td>
                    <td>{{ p.quantity }}</td>
                    <td>
                      <span class="process-tag" v-if="p.process_route">{{ p.process_route }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="previewData.products.length > 20" class="more-tip">
              还有 {{ previewData.products.length - 20 }} 个产品...
            </p>
          </div>

          <div class="modal-actions">
            <button class="btn" @click="showUpload = false">取消</button>
            <button class="btn btn-primary" @click="confirmUpload" :disabled="uploading">
              {{ uploading ? '导入中...' : '确认导入' }}
            </button>
          </div>
          
          <div v-if="uploadResult" :class="['upload-result', uploadResult.success ? 'success' : 'error']">
            {{ uploadResult.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="selectedOrder = null">
      <div class="modal modal-large">
        <h3>订单产品明细</h3>
        <div class="order-meta">
          <span>客户: {{ selectedOrder.order.customer_name || '-' }}</span>
          <span>设备号: {{ selectedOrder.order.device_no || '-' }}</span>
          <span>台数: {{ selectedOrder.order.quantity }}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>件号</th>
              <th>名称</th>
              <th>材质</th>
              <th>数量</th>
              <th>总数量</th>
              <th>工艺流程</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in selectedOrder.products" :key="product.id">
              <td>{{ product.serial_no }}</td>
              <td class="part-no">{{ product.part_no }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.material }}</td>
              <td>{{ product.quantity }}</td>
              <td>{{ product.total_quantity }}</td>
              <td>
                <span class="process-tag" v-if="product.process_route">{{ product.process_route }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="modal-actions">
          <button class="btn" @click="selectedOrder = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as XLSX from 'xlsx'
import { fetchDashboardStats, fetchOrders, uploadWorkOrder, deleteOrder, fetchOrderDetail } from '../api'

const stats = ref({})
const orders = ref([])
const showUpload = ref(false)
const previewData = ref(null)
const selectedFile = ref(null)
const selectedOrder = ref(null)
const uploading = ref(false)
const uploadResult = ref(null)

const todayImports = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return orders.value.filter(o => o.created_at && o.created_at.startsWith(today)).length
})

const loadData = async () => {
  try {
    const [statsData, ordersData] = await Promise.all([
      fetchDashboardStats(),
      fetchOrders()
    ])
    stats.value = statsData
    orders.value = ordersData
  } catch (e) {
    console.error('加载数据失败:', e)
  }
}

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  selectedFile.value = file
  uploadResult.value = null
  
  // 预览Excel
  try {
    const data = await parseExcelPreview(file)
    previewData.value = data
  } catch (err) {
    alert('解析失败: ' + err.message)
  }
}

const parseExcelPreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        const processCount = workbook.SheetNames.length - 1 // 减去工艺流程卡
        const products = []
        const processBreakdown = {}
        
        // 遍历所有工序sheet
        for (const sheetName of workbook.SheetNames) {
          if (sheetName === '工艺流程卡') continue
          
          const sheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
          
          // 找到产品起始行
          let startIdx = -1
          for (let i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i][0] === '序号' && rows[i][1] === '件号') {
              startIdx = i + 1
              break
            }
          }
          
          if (startIdx > 0) {
            for (let i = startIdx; i < rows.length; i++) {
              const row = rows[i]
              if (row && row[1]) {
                const product = {
                  serial_no: row[0],
                  part_no: row[1],
                  name: row[2],
                  material: row[3] || '',
                  quantity: parseInt(row[7]) || 0,
                  total_quantity: parseInt(row[8]) || 0,
                  process_route: row[11] || '',
                  process: sheetName
                }
                products.push(product)
                
                // 统计每道工序
                processBreakdown[sheetName] = (processBreakdown[sheetName] || 0) + 1
              }
            }
          }
        }
        
        resolve({
          fileName: file.name,
          totalProducts: products.length,
          processCount,
          products,
          processBreakdown
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const clearPreview = () => {
  previewData.value = null
  selectedFile.value = null
}

const confirmUpload = async () => {
  if (!selectedFile.value) return
  uploading.value = true
  uploadResult.value = null
  
  try {
    const result = await uploadWorkOrder(selectedFile.value)
    uploadResult.value = result
    
    if (result.success) {
      setTimeout(() => {
        showUpload.value = false
        previewData.value = null
        selectedFile.value = null
        loadData()
      }, 1500)
    }
  } catch (e) {
    uploadResult.value = { success: false, message: '上传失败: ' + e.message }
  }
  
  uploading.value = false
}

const handleDelete = async (order) => {
  if (confirm('确认删除该订单?')) {
    await deleteOrder(order.id)
    loadData()
  }
}

const viewOrder = async (order) => {
  selectedOrder.value = await fetchOrderDetail(order.id)
}

onMounted(loadData)
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-card.accent {
  border-color: var(--secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.order-id {
  font-family: monospace;
  color: var(--primary);
}

.part-no {
  font-family: monospace;
  color: var(--primary);
}

.process-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(0,240,255,0.1);
  border: 1px solid rgba(0,240,255,0.3);
  border-radius: 4px;
  color: var(--primary);
}

/* 导入弹窗 */
.modal-large {
  max-width: 800px;
}

.upload-area {
  text-align: center;
  padding: 40px 20px;
}

.upload-tip {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 10px;
}

.preview-area {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--dark-border);
}

.preview-info h4 {
  margin: 0 0 5px 0;
}

.preview-info p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.preview-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.preview-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: rgba(0,240,255,0.1);
  border-radius: 20px;
}

.preview-stat .process-count {
  font-weight: bold;
  color: var(--primary);
}

.preview-products h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.products-table {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--dark-border);
  border-radius: 8px;
}

.more-tip {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 10px;
}

.order-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  color: var(--text-secondary);
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.upload-result {
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.upload-result.success {
  background: rgba(0,255,159,0.1);
  border: 1px solid var(--accent);
  color: var(--accent);
}

.upload-result.error {
  background: rgba(255,71,87,0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
}
</style>
