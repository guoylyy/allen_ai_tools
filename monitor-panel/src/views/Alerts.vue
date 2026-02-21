<template>
  <div class="alerts">
    <h1>🔔 告警中心</h1>
    
    <!-- 告警统计 -->
    <div class="alert-stats">
      <div class="stat-card processing">
        <div class="stat-value">{{ processingAlerts.length }}</div>
        <div class="stat-label">处理中</div>
      </div>
      <div class="stat-card resolved">
        <div class="stat-value">{{ resolvedAlerts.length }}</div>
        <div class="stat-label">已解决</div>
      </div>
      <div class="stat-card critical">
        <div class="stat-value">{{ criticalAlerts.length }}</div>
        <div class="stat-label">严重告警</div>
      </div>
      <div class="stat-card today">
        <div class="stat-value">{{ todayAlerts.length }}</div>
        <div class="stat-label">今日告警</div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filters">
      <div class="search-box">
        <input v-model="searchText" placeholder="搜索告警..." class="search-input">
      </div>
      <div class="filter-buttons">
        <button v-for="f in filterOptions" :key="f.value"
          class="filter-btn" :class="{ active: filter === f.value }"
          @click="filter = f.value">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- 告警列表 -->
    <div class="alerts-list">
      <div v-for="alert in filteredAlerts" :key="alert.id" class="alert-card" :class="[alert.level.toLowerCase(), alert.status]">
        <div class="alert-header">
          <span class="alert-level">{{ alert.level }}</span>
          <span class="alert-title">{{ alert.title }}</span>
          <span class="alert-status" :class="alert.status">{{ statusText(alert.status) }}</span>
        </div>
        
        <div class="alert-body">
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-details">
            <div class="detail-item" v-if="alert.value">
              <span class="detail-label">当前值:</span>
              <span class="detail-value">{{ alert.value }}{{ alert.threshold ? '%' : '' }}</span>
            </div>
            <div class="detail-item" v-if="alert.threshold">
              <span class="detail-label">阈值:</span>
              <span class="detail-value">{{ alert.threshold }}{{ alert.threshold ? '%' : '' }}</span>
            </div>
            <div class="detail-item" v-if="alert.duration">
              <span class="detail-label">持续时间:</span>
              <span class="detail-value">{{ alert.duration }}</span>
            </div>
            <div class="detail-item" v-if="alert.server">
              <span class="detail-label">服务器:</span>
              <span class="detail-value">{{ alert.server }}</span>
            </div>
          </div>
        </div>

        <div class="alert-footer">
          <span class="alert-time">🕐 {{ alert.time }}</span>
          <div class="alert-actions">
            <button v-if="alert.status === 'processing'" 
              class="btn-resolve" @click="resolveAlert(alert.id)">
              ✅ 标记已解决
            </button>
            <button class="btn-detail" @click="showAlertDetail(alert)">
              📋 详情
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredAlerts.length === 0" class="no-alerts">
        <div class="no-alerts-icon">✅</div>
        <div>暂无告警</div>
      </div>
    </div>

    <!-- 告警规则配置 -->
    <div class="section">
      <div class="section-header">
        <h2>⚙️ 告警规则配置</h2>
        <button class="btn-add" @click="openRuleModal()">+ 添加规则</button>
      </div>
      <div class="rules-list">
        <div v-for="rule in alertRules" :key="rule.id" class="rule-item">
          <div class="rule-info">
            <div class="rule-header">
              <span class="rule-level">{{ rule.level }}</span>
              <span class="rule-name">{{ rule.name }}</span>
            </div>
            <div class="rule-desc">{{ rule.condition }}</div>
          </div>
          <div class="rule-actions">
            <label class="switch">
              <input type="checkbox" v-model="rule.enabled">
              <span class="slider"></span>
            </label>
            <button class="btn-icon" @click="openRuleModal(rule)">✏️</button>
            <button class="btn-icon" @click="deleteRule(rule.id)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 告警详情弹窗 -->
    <div v-if="showDetailModal" class="modal" @click.self="showDetailModal = false">
      <div class="modal-content detail-modal">
        <h3>告警详情</h3>
        <div class="detail-content" v-if="selectedAlert">
          <div class="detail-row">
            <span class="detail-label">告警等级:</span>
            <span class="detail-value level">{{ selectedAlert.level }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">告警标题:</span>
            <span class="detail-value">{{ selectedAlert.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">告警类型:</span>
            <span class="detail-value">{{ selectedAlert.type }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态:</span>
            <span class="detail-value status" :class="selectedAlert.status">{{ statusText(selectedAlert.status) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">触发时间:</span>
            <span class="detail-value">{{ selectedAlert.time }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">持续时间:</span>
            <span class="detail-value">{{ selectedAlert.duration }}</span>
          </div>
          <div class="detail-row" v-if="selectedAlert.server">
            <span class="detail-label">服务器:</span>
            <span class="detail-value">{{ selectedAlert.server }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">告警信息:</span>
            <span class="detail-value">{{ selectedAlert.message }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showDetailModal = false" class="btn-confirm">关闭</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑规则弹窗 -->
    <div v-if="showRuleModal" class="modal" @click.self="closeRuleModal">
      <div class="modal-content">
        <h3>{{ editingRule ? '编辑规则' : '添加规则' }}</h3>
        <form @submit.prevent="saveRule">
          <div class="form-group">
            <label>规则名称</label>
            <input v-model="ruleForm.name" placeholder="如：CPU使用率告警" class="input" required>
          </div>
          <div class="form-group">
            <label>告警等级</label>
            <select v-model="ruleForm.level" class="input">
              <option value="P1">P1 - 紧急</option>
              <option value="P2">P2 - 严重</option>
              <option value="P3">P3 - 警告</option>
              <option value="P4">P4 - 提醒</option>
            </select>
          </div>
          <div class="form-group">
            <label>触发条件</label>
            <input v-model="ruleForm.condition" placeholder="如：CPU使用率超过80%" class="input">
          </div>
          <div class="form-group">
            <label>监控指标</label>
            <select v-model="ruleForm.metric" class="input">
              <option value="cpu">CPU使用率</option>
              <option value="memory">内存使用率</option>
              <option value="disk">磁盘使用率</option>
              <option value="response_time">响应时间</option>
              <option value="error_rate">错误率</option>
              <option value="service_status">服务状态</option>
            </select>
          </div>
          <div class="form-group">
            <label>阈值</label>
            <input v-model.number="ruleForm.threshold" type="number" placeholder="如：80" class="input">
          </div>
          <div class="form-group">
            <label>持续时间 (分钟)</label>
            <input v-model.number="ruleForm.duration" type="number" placeholder="如：5" class="input">
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="ruleForm.enabled"> 启用此规则
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeRuleModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-confirm">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMonitorStore } from '../stores/monitor'

const store = useMonitorStore()

const searchText = ref('')
const filter = ref('all')
const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' }
]

const showDetailModal = ref(false)
const selectedAlert = ref(null)

const showRuleModal = ref(false)
const editingRule = ref(null)
const ruleForm = ref({ name: '', level: 'P2', condition: '', metric: 'cpu', threshold: 80, duration: 5, enabled: true })

// 告警规则
const alertRules = ref([
  { id: 1, level: 'P1', name: '服务离线', condition: '服务不可用时立即告警', metric: 'service_status', threshold: 0, duration: 0, enabled: true },
  { id: 2, level: 'P2', name: 'CPU使用率', condition: '超过80%持续5分钟', metric: 'cpu', threshold: 80, duration: 5, enabled: true },
  { id: 3, level: 'P2', name: '内存使用率', condition: '超过85%持续5分钟', metric: 'memory', threshold: 85, duration: 5, enabled: true },
  { id: 4, level: 'P2', name: '错误率', condition: 'HTTP 5xx超过1%', metric: 'error_rate', threshold: 1, duration: 0, enabled: true },
  { id: 5, level: 'P3', name: '磁盘使用率', condition: '超过80%告警', metric: 'disk', threshold: 80, duration: 0, enabled: true },
  { id: 6, level: 'P3', name: '响应时间', condition: 'P99超过3000ms', metric: 'response_time', threshold: 3000, duration: 0, enabled: true },
])

// 计算属性
const processingAlerts = computed(() => store.alerts.filter(a => a.status === 'processing'))
const resolvedAlerts = computed(() => store.alerts.filter(a => a.status === 'resolved'))
const criticalAlerts = computed(() => store.alerts.filter(a => (a.level === 'P1' || a.level === 'P2') && a.status === 'processing'))
const todayAlerts = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return store.alerts.filter(a => a.time && a.time.startsWith(today))
})

const filteredAlerts = computed(() => {
  let result = store.alerts
  
  // 状态筛选
  if (filter.value !== 'all') {
    result = result.filter(a => a.status === filter.value)
  }
  
  // 搜索筛选
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    result = result.filter(a => 
      a.title?.toLowerCase().includes(text) ||
      a.message?.toLowerCase().includes(text) ||
      a.server?.toLowerCase().includes(text)
    )
  }
  
  return result
})

function statusText(status) {
  const map = { processing: '处理中', resolved: '已解决' }
  return map[status] || status
}

function resolveAlert(id) {
  store.resolveAlert(id)
}

function showAlertDetail(alert) {
  selectedAlert.value = alert
  showDetailModal.value = true
}

// 规则操作
function openRuleModal(rule = null) {
  editingRule.value = rule
  if (rule) {
    ruleForm.value = { ...rule }
  } else {
    ruleForm.value = { name: '', level: 'P2', condition: '', metric: 'cpu', threshold: 80, duration: 5, enabled: true }
  }
  showRuleModal.value = true
}

function closeRuleModal() {
  showRuleModal.value = false
  editingRule.value = null
}

function saveRule() {
  if (editingRule.value) {
    const idx = alertRules.value.findIndex(r => r.id === editingRule.value.id)
    if (idx !== -1) {
      alertRules.value[idx] = { ...ruleForm.value }
    }
  } else {
    alertRules.value.push({ ...ruleForm.value, id: Date.now() })
  }
  closeRuleModal()
}

function deleteRule(id) {
  const idx = alertRules.value.findIndex(r => r.id === id)
  if (idx !== -1) {
    alertRules.value.splice(idx, 1)
  }
}
</script>

<style scoped>
.alerts {
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

/* Stats */
.alert-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card.processing { border-left: 4px solid #ff9800; }
.stat-card.resolved { border-left: 4px solid #4caf50; }
.stat-card.critical { border-left: 4px solid #f44336; }
.stat-card.today { border-left: 4px solid #2196f3; }

.stat-value {
  font-size: 36px;
  font-weight: bold;
}

.stat-card.processing .stat-value { color: #ff9800; }
.stat-card.resolved .stat-value { color: #4caf50; }
.stat-card.critical .stat-value { color: #f44336; }
.stat-card.today .stat-value { color: #2196f3; }

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

/* Filters */
.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #1976d2;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

/* Alerts List */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.alert-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid #ddd;
  transition: transform 0.2s, box-shadow 0.2s;
}

.alert-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.alert-card.p1 { border-left-color: #f44336; }
.alert-card.p2 { border-left-color: #ff9800; }
.alert-card.p3 { border-left-color: #2196f3; }
.alert-card.p4 { border-left-color: #9e9e9e; }

.alert-card.resolved {
  opacity: 0.7;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.alert-level {
  background: #f44336;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.p2 .alert-level { background: #ff9800; }
.p3 .alert-level { background: #2196f3; }
.p4 .alert-level { background: #9e9e9e; }

.alert-title {
  font-weight: bold;
  font-size: 16px;
  flex: 1;
}

.alert-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.alert-status.processing {
  background: #fff3e0;
  color: #ff9800;
}

.alert-status.resolved {
  background: #e8f5e9;
  color: #4caf50;
}

.alert-body {
  margin-bottom: 12px;
}

.alert-message {
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.alert-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.detail-item {
  display: flex;
  gap: 8px;
}

.detail-label {
  color: #999;
  font-size: 13px;
}

.detail-value {
  font-weight: 500;
  font-size: 13px;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.alert-time {
  color: #999;
  font-size: 12px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.btn-resolve {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn-resolve:hover {
  background: #45a049;
}

.btn-detail {
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-detail:hover {
  background: #eee;
}

.no-alerts {
  text-align: center;
  padding: 60px;
  color: #4caf50;
  background: white;
  border-radius: 12px;
}

.no-alerts-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* Rules */
.btn-add {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.rules-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.rule-item:last-child {
  border-bottom: none;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rule-level {
  background: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.rule-name {
  font-weight: 500;
}

.rule-desc {
  font-size: 12px;
  color: #999;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
}

.btn-icon:hover {
  opacity: 1;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4caf50;
}

input:checked + .slider:before {
  transform: translateX(22px);
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
  width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 20px;
}

.detail-modal .detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 12px;
}

.detail-row .detail-label {
  width: 80px;
  flex-shrink: 0;
}

.detail-row .detail-value {
  flex: 1;
}

.detail-value.level {
  background: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-value.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-value.status.processing {
  background: #fff3e0;
  color: #ff9800;
}

.detail-value.status.resolved {
  background: #e8f5e9;
  color: #4caf50;
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

.form-group label input {
  margin-right: 8px;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
}

.btn-confirm {
  background: #1976d2;
  color: white;
}
</style>
