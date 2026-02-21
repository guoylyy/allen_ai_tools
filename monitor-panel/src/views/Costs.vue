<template>
  <div class="costs">
    <h1>💰 成本监控</h1>
    
    <!-- 本月概览 -->
    <div class="cost-overview">
      <div class="cost-card total">
        <div class="cost-label">本月总成本</div>
        <div class="cost-value">¥{{ currentCost.总计 || 0 }}</div>
        <div class="cost-trend" v-if="lastMonthCost">
          <span v-if="currentCost.总计 > lastMonthCost" class="trend up">
            ↑ ¥{{ (currentCost.总计 - lastMonthCost).toFixed(0) }} 较上月
          </span>
          <span v-else class="trend down">
            ↓ ¥{{ (lastMonthCost - currentCost.总计).toFixed(0) }} 较上月
          </span>
        </div>
      </div>
      <div class="cost-card">
        <div class="cost-icon">🖥️</div>
        <div class="cost-content">
          <div class="cost-label">服务器</div>
          <div class="cost-value">¥{{ currentCost.服务器 || 0 }}</div>
        </div>
      </div>
      <div class="cost-card">
        <div class="cost-icon">💾</div>
        <div class="cost-content">
          <div class="cost-label">存储</div>
          <div class="cost-value">¥{{ currentCost.存储 || 0 }}</div>
        </div>
      </div>
      <div class="cost-card">
        <div class="cost-icon">🌐</div>
        <div class="cost-content">
          <div class="cost-label">带宽</div>
          <div class="cost-value">¥{{ currentCost.带宽 || 0 }}</div>
        </div>
      </div>
      <div class="cost-card">
        <div class="cost-icon">🔗</div>
        <div class="cost-content">
          <div class="cost-label">CDN/其他</div>
          <div class="cost-value">¥{{ (currentCost.CDN || 0) + (currentCost.短信 || 0) }}</div>
        </div>
      </div>
    </div>

    <!-- 月度趋势 -->
    <div class="section">
      <div class="section-header">
        <h2>📈 月度成本趋势</h2>
        <button class="btn-add" @click="openCostModal()">+ 添加月份</button>
      </div>
      <div class="trend-chart">
        <div class="trend-bars">
          <div v-for="(cost, month) in sortedCosts" :key="month" class="trend-bar-item">
            <div class="bar-container">
              <div class="bar" :style="{ height: getBarHeight(cost.总计) + '%' }"></div>
            </div>
            <div class="bar-label">{{ month.slice(5) }}</div>
            <div class="bar-value">¥{{ cost.总计 || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成本明细 -->
    <div class="section">
      <div class="section-header">
        <h2>📋 成本明细</h2>
      </div>
      <div class="cost-table-wrapper">
        <table class="cost-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>服务器</th>
              <th>存储</th>
              <th>带宽</th>
              <th>CDN</th>
              <th>短信</th>
              <th>总计</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cost, month) in sortedCosts" :key="month">
              <td>{{ month }}</td>
              <td>
                <span class="cost-item" @click="editCostItem(month, '服务器', cost.服务器)">
                  ¥{{ cost.服务器 || 0 }}
                </span>
              </td>
              <td>
                <span class="cost-item" @click="editCostItem(month, '存储', cost.存储)">
                  ¥{{ cost.存储 || 0 }}
                </span>
              </td>
              <td>
                <span class="cost-item" @click="editCostItem(month, '带宽', cost.带宽)">
                  ¥{{ cost.带宽 || 0 }}
                </span>
              </td>
              <td>
                <span class="cost-item" @click="editCostItem(month, 'CDN', cost.CDN)">
                  ¥{{ cost.CDN || 0 }}
                </span>
              </td>
              <td>
                <span class="cost-item" @click="editCostItem(month, '短信', cost.短信)">
                  ¥{{ cost.短信 || 0 }}
                </span>
              </td>
              <td class="total">¥{{ cost.总计 || 0 }}</td>
              <td>
                <button class="btn-icon" @click="editCostModal(month, cost)">✏️</button>
                <button class="btn-icon" @click="confirmDeleteCost(month)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 服务器成本 -->
    <div class="section">
      <div class="section-header">
        <h2>🖥️ 服务器成本分布</h2>
      </div>
      <div class="server-costs">
        <div v-for="server in store.servers" :key="server.id" class="server-cost-card">
          <div class="server-info">
            <div class="server-name">{{ server.name }}</div>
            <div class="server-spec">{{ server.spec || '本地' }}</div>
          </div>
          <div class="server-cost">
            <div class="cost-amount">¥{{ server.monthlyCost || 0 }}/月</div>
            <div class="cost-year">¥{{ (server.monthlyCost || 0) * 12 }}/年</div>
          </div>
        </div>
      </div>
      <div class="total-server-cost">
        <span>服务器总成本:</span>
        <span class="amount">¥{{ totalServerCost }}/月</span>
      </div>
    </div>

    <!-- 项目成本分摊 -->
    <div class="section">
      <div class="section-header">
        <h2>📁 项目成本分摊</h2>
      </div>
      <div class="project-costs">
        <div v-for="project in store.projects" :key="project.id" class="project-cost-card">
          <div class="project-name">{{ project.name }}</div>
          <div class="project-share">
            <div class="share-bar">
              <div class="share-fill" :style="{ width: getProjectShare(project) + '%' }"></div>
            </div>
            <div class="share-value">¥{{ getProjectCost(project) }}/月</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑成本弹窗 -->
    <div v-if="showCostModal" class="modal" @click.self="closeCostModal">
      <div class="modal-content">
        <h3>{{ editingCost ? '编辑成本' : '添加成本' }}</h3>
        <form @submit.prevent="saveCost">
          <div class="form-group">
            <label>月份</label>
            <input v-model="costForm.month" type="month" class="input" :disabled="editingCost" required>
          </div>
          <div class="form-group">
            <label>服务器费用 (¥)</label>
            <input v-model.number="costForm.服务器" type="number" min="0" class="input">
          </div>
          <div class="form-group">
            <label>存储费用 (¥)</label>
            <input v-model.number="costForm.存储" type="number" min="0" class="input">
          </div>
          <div class="form-group">
            <label>带宽费用 (¥)</label>
            <input v-model.number="costForm.带宽" type="number" min="0" class="input">
          </div>
          <div class="form-group">
            <label>CDN费用 (¥)</label>
            <input v-model.number="costForm.CDN" type="number" min="0" class="input">
          </div>
          <div class="form-group">
            <label>短信费用 (¥)</label>
            <input v-model.number="costForm.短信" type="number" min="0" class="input">
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeCostModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-confirm">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal" @click.self="showDeleteModal = false">
      <div class="modal-content delete-modal">
        <h3>确认删除</h3>
        <p>确定要删除 {{ deleteTarget }} 月的成本数据吗？</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">取消</button>
          <button @click="executeDeleteCost" class="btn-delete-confirm">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMonitorStore } from '../stores/monitor'

const store = useMonitorStore()

const showCostModal = ref(false)
const editingCost = ref(null)
const costForm = ref({ month: '', 服务器: 0, 存储: 0, 带宽: 0, CDN: 0, 短信: 0 })

const showDeleteModal = ref(false)
const deleteTarget = ref('')

const currentMonth = new Date().toISOString().slice(0, 7)
const currentCost = computed(() => store.costs[currentMonth] || {})

const sortedCosts = computed(() => {
  const sorted = {}
  Object.keys(store.costs).sort().reverse().forEach(key => {
    sorted[key] = store.costs[key]
  })
  return sorted
})

const lastMonthCost = computed(() => {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const key = lastMonth.toISOString().slice(0, 7)
  return store.costs[key]?.总计 || null
})

const maxCost = computed(() => {
  const values = Object.values(store.costs).map(c => c.总计 || 0)
  return Math.max(...values, 1)
})

const totalServerCost = computed(() => {
  return store.servers.reduce((sum, s) => sum + (s.monthlyCost || 0), 0)
})

function getBarHeight(value) {
  return (value / maxCost.value) * 100
}

function getProjectShare(project) {
  if (store.projects.length === 0) return 0
  return 100 / store.projects.length
}

function getProjectCost(project) {
  return (totalServerCost.value / store.projects.length).toFixed(0)
}

function openCostModal() {
  editingCost.value = null
  const now = new Date()
  costForm.value = {
    month: currentMonth,
    服务器: 0,
    存储: 0,
    带宽: 0,
    CDN: 0,
    短信: 0
  }
  showCostModal.value = true
}

function editCostModal(month, cost) {
  editingCost.value = month
  costForm.value = {
    month,
    服务器: cost.服务器 || 0,
    存储: cost.存储 || 0,
    带宽: cost.带宽 || 0,
    CDN: cost.CDN || 0,
    短信: cost.短信 || 0
  }
  showCostModal.value = true
}

function editCostItem(month, item, value) {
  const cost = store.costs[month] || {}
  editCostModal(month, { [item]: value })
}

function closeCostModal() {
  showCostModal.value = false
  editingCost.value = null
}

function saveCost() {
  const 总计 = (costForm.value.服务器 || 0) + (costForm.value.存储 || 0) + 
               (costForm.value.带宽 || 0) + (costForm.value.CDN || 0) + (costForm.value.短信 || 0)
  
  store.costs[costForm.value.month] = {
    ...costForm.value,
    总计
  }
  closeCostModal()
}

function confirmDeleteCost(month) {
  deleteTarget.value = month
  showDeleteModal.value = true
}

function executeDeleteCost() {
  delete store.costs[deleteTarget.value]
  showDeleteModal.value = false
}
</script>

<style scoped>
.costs {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

h2 {
  margin: 0;
  color: #333;
}

.section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.btn-add {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #45a049;
}

/* Cost Overview */
.cost-overview {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 30px;
}

.cost-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.cost-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-direction: column;
  text-align: center;
}

.cost-icon {
  font-size: 32px;
}

.cost-content {
  flex: 1;
}

.cost-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.cost-card.total .cost-label {
  color: rgba(255,255,255,0.8);
}

.cost-value {
  font-size: 24px;
  font-weight: bold;
}

.cost-trend {
  margin-top: 8px;
  font-size: 12px;
}

.trend.up { color: #ff9800; }
.trend.down { color: #4caf50; }
.cost-card.total .trend { color: rgba(255,255,255,0.8); }

/* Trend Chart */
.trend-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.trend-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
}

.trend-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-container {
  height: 150px;
  width: 40px;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  min-height: 4px;
  transition: height 0.3s;
}

.bar-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.bar-value {
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
}

/* Cost Table */
.cost-table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.cost-table {
  width: 100%;
  border-collapse: collapse;
}

.cost-table th,
.cost-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.cost-table th {
  background: #f5f5f5;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.cost-table td {
  font-size: 14px;
}

.cost-table td.total {
  font-weight: bold;
  color: #667eea;
}

.cost-item {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.cost-item:hover {
  background: #e3f2fd;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

/* Server Costs */
.server-costs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.server-cost-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.server-name {
  font-weight: 500;
}

.server-spec {
  font-size: 12px;
  color: #666;
}

.cost-amount {
  font-size: 20px;
  font-weight: bold;
  color: #4caf50;
}

.cost-year {
  font-size: 12px;
  color: #999;
}

.total-server-cost {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-weight: 500;
}

.total-server-cost .amount {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

/* Project Costs */
.project-costs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-cost-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.project-name {
  font-weight: 500;
  margin-bottom: 12px;
}

.share-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.share-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.share-value {
  font-size: 14px;
  color: #666;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 420px;
}

.modal-content h3 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: #1976d2;
}

.input:disabled {
  background: #f5f5f5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel, .btn-confirm, .btn-delete-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
}

.btn-confirm {
  background: #4caf50;
  color: white;
}

.btn-delete-confirm {
  background: #f44336;
  color: white;
}

.delete-modal p {
  color: #666;
}
</style>
