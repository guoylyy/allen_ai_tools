<template>
  <div class="settings">
    <h1>⚙️ 配置中心</h1>
    
    <!-- 项目管理 -->
    <div class="section">
      <div class="section-header">
        <h2>📁 项目管理</h2>
        <button class="btn-add" @click="openProjectModal()">+ 添加项目</button>
      </div>
      
      <div class="items-list">
        <div v-for="project in store.projects" :key="project.id" class="item-card">
          <div class="item-info">
            <div class="item-name">{{ project.name }}</div>
            <div class="item-meta">状态: {{ project.status }} | 服务: {{ project.services?.length || 0 }} | SLA: {{ project.sla }}%</div>
          </div>
          <div class="item-actions">
            <button class="btn-edit" @click="openProjectModal(project)">编辑</button>
            <button class="btn-delete" @click="confirmDeleteProject(project)">删除</button>
          </div>
        </div>
        <div v-if="store.projects.length === 0" class="no-items">暂无项目，点击添加</div>
      </div>
    </div>

    <!-- 服务器管理 -->
    <div class="section">
      <div class="section-header">
        <h2>🖥️ 服务器管理</h2>
        <button class="btn-add" @click="openServerModal()">+ 添加服务器</button>
      </div>
      
      <div class="items-list">
        <div v-for="server in store.servers" :key="server.id" class="item-card">
          <div class="item-info">
            <div class="item-name">{{ server.name }}</div>
            <div class="item-meta">IP: {{ server.ip }} | {{ server.provider }} | {{ server.region }}</div>
          </div>
          <div class="item-actions">
            <button class="btn-edit" @click="openServerModal(server)">编辑</button>
            <button class="btn-delete" @click="confirmDeleteServer(server)">删除</button>
          </div>
        </div>
        <div v-if="store.servers.length === 0" class="no-items">暂无服务器，点击添加</div>
      </div>
    </div>

    <!-- 服务配置 -->
    <div class="section">
      <div class="section-header">
        <h2>⚙️ 服务配置</h2>
        <button class="btn-add" @click="openServiceModal()">+ 添加服务</button>
      </div>
      
      <div class="items-list">
        <div v-for="(config, name) in serviceConfigs" :key="name" class="item-card">
          <div class="item-info">
            <div class="item-name">{{ name }}</div>
            <div class="item-meta">类型: {{ config.type }} | 端口: {{ config.port }} | 健康检查: {{ config.healthCheck?.type || '无' }}</div>
          </div>
          <div class="item-actions">
            <button class="btn-edit" @click="openServiceModal(name, config)">编辑</button>
            <button class="btn-delete" @click="confirmDeleteService(name)">删除</button>
          </div>
        </div>
        <div v-if="Object.keys(serviceConfigs).length === 0" class="no-items">暂无服务配置，点击添加</div>
      </div>
    </div>

    <!-- 告警配置 -->
    <div class="section">
      <h2>🔔 告警规则配置</h2>
      <div class="alert-rules">
        <div v-for="rule in alertRules" :key="rule.id" class="rule-item">
          <div class="rule-info">
            <div class="rule-name">{{ rule.level }} - {{ rule.name }}</div>
            <div class="rule-desc">{{ rule.condition }}</div>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="rule.enabled">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 添加/编辑项目弹窗 -->
    <div v-if="showProjectModal" class="modal" @click.self="closeProjectModal">
      <div class="modal-content">
        <h3>{{ editingProject ? '编辑项目' : '添加项目' }}</h3>
        <form @submit.prevent="saveProject">
          <div class="form-group">
            <label>项目名称</label>
            <input v-model="projectForm.name" placeholder="请输入项目名称" class="input" required>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="projectForm.status" class="input">
              <option value="developing">开发中</option>
              <option value="running">运行中</option>
              <option value="stopped">已停止</option>
            </select>
          </div>
          <div class="form-group">
            <label>SLA 目标 (%)</label>
            <input v-model.number="projectForm.sla" type="number" step="0.01" min="0" max="100" class="input">
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeProjectModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-confirm">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加/编辑服务器弹窗 -->
    <div v-if="showServerModal" class="modal" @click.self="closeServerModal">
      <div class="modal-content">
        <h3>{{ editingServer ? '编辑服务器' : '添加服务器' }}</h3>
        <form @submit.prevent="saveServer">
          <div class="form-group">
            <label>服务器名称</label>
            <input v-model="serverForm.name" placeholder="请输入服务器名称" class="input" required>
          </div>
          <div class="form-group">
            <label>IP地址</label>
            <input v-model="serverForm.ip" placeholder="请输入IP地址" class="input" required>
          </div>
          <div class="form-group">
            <label>服务商</label>
            <select v-model="serverForm.provider" class="input">
              <option value="aliyun">阿里云</option>
              <option value="tencent">腾讯云</option>
              <option value="huawei">华为云</option>
              <option value="local">本地</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>地域</label>
            <input v-model="serverForm.region" placeholder="如：华东1(杭州)" class="input">
          </div>
          <div class="form-group">
            <label>规格</label>
            <input v-model="serverForm.spec" placeholder="如：2核4G" class="input">
          </div>
          <div class="form-group">
            <label>月成本 (元)</label>
            <input v-model.number="serverForm.monthlyCost" type="number" min="0" class="input">
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeServerModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-confirm">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加/编辑服务弹窗 -->
    <div v-if="showServiceModal" class="modal" @click.self="closeServiceModal">
      <div class="modal-content">
        <h3>{{ editingService ? '编辑服务' : '添加服务' }}</h3>
        <form @submit.prevent="saveService">
          <div class="form-group">
            <label>服务名称</label>
            <input v-model="serviceForm.name" placeholder="请输入服务名称" class="input" :disabled="editingService" required>
          </div>
          <div class="form-group">
            <label>服务类型</label>
            <select v-model="serviceForm.type" class="input">
              <option value="nodejs">Node.js</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="vue">Vue/React</option>
              <option value="docker">Docker</option>
              <option value="pm2">PM2</option>
            </select>
          </div>
          <div class="form-group">
            <label>端口</label>
            <input v-model.number="serviceForm.port" type="number" min="1" max="65535" placeholder="端口号" class="input">
          </div>
          <div class="form-group">
            <label>版本</label>
            <input v-model="serviceForm.version" placeholder="如：1.0.0" class="input">
          </div>
          <div class="form-group">
            <label>健康检查类型</label>
            <select v-model="serviceForm.healthCheckType" class="input">
              <option value="">无</option>
              <option value="http">HTTP</option>
              <option value="tcp">TCP</option>
              <option value="process">进程</option>
            </select>
          </div>
          <div class="form-group" v-if="serviceForm.healthCheckType === 'http'">
            <label>健康检查URL</label>
            <input v-model="serviceForm.healthCheckUrl" placeholder="如：http://localhost:3000/health" class="input">
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeServiceModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-confirm">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal" @click.self="showDeleteModal = false">
      <div class="modal-content delete-modal">
        <h3>确认删除</h3>
        <p>确定要删除 "{{ deleteTarget.name }}" 吗？此操作不可撤销。</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">取消</button>
          <button @click="executeDelete" class="btn-delete-confirm">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMonitorStore } from '../stores/monitor'

const store = useMonitorStore()

// 项目弹窗
const showProjectModal = ref(false)
const editingProject = ref(null)
const projectForm = ref({ name: '', status: 'developing', sla: 99.9 })

// 服务器弹窗
const showServerModal = ref(false)
const editingServer = ref(null)
const serverForm = ref({ name: '', ip: '', provider: 'aliyun', region: '', spec: '', monthlyCost: 0 })

// 服务弹窗
const showServiceModal = ref(false)
const editingService = ref(null)
const serviceForm = ref({ name: '', type: 'nodejs', port: 3000, version: '1.0.0', healthCheckType: '', healthCheckUrl: '' })

// 删除弹窗
const showDeleteModal = ref(false)
const deleteTarget = ref({ type: '', data: null, name: '' })

// 告警规则
const alertRules = ref([
  { id: 1, level: 'P1', name: '服务离线', condition: '服务不可用时立即告警', enabled: true },
  { id: 2, level: 'P2', name: 'CPU使用率', condition: '超过80%持续5分钟', enabled: true },
  { id: 3, level: 'P2', name: '内存使用率', condition: '超过85%持续5分钟', enabled: true },
  { id: 4, level: 'P2', name: '错误率', condition: 'HTTP 5xx超过1%', enabled: true },
  { id: 5, level: 'P3', name: '磁盘使用率', condition: '超过80%告警', enabled: true },
  { id: 6, level: 'P3', name: '响应时间', condition: 'P99超过3000ms', enabled: true },
])

// 从配置中提取服务配置
const serviceConfigs = computed(() => {
  const configs = {}
  store.projects.forEach(p => {
    if (p.services) {
      p.services.forEach(s => {
        configs[s.name] = s
      })
    }
  })
  return configs
})

// 项目操作
function openProjectModal(project = null) {
  editingProject.value = project
  if (project) {
    projectForm.value = { name: project.name, status: project.status, sla: project.sla }
  } else {
    projectForm.value = { name: '', status: 'developing', sla: 99.9 }
  }
  showProjectModal.value = true
}

function closeProjectModal() {
  showProjectModal.value = false
  editingProject.value = null
}

function saveProject() {
  if (editingProject.value) {
    // 编辑
    const idx = store.projects.findIndex(p => p.id === editingProject.value.id)
    if (idx !== -1) {
      store.projects[idx] = { ...store.projects[idx], ...projectForm.value }
    }
  } else {
    // 新增
    store.addProject({
      ...projectForm.value,
      services: [],
      servers: []
    })
  }
  closeProjectModal()
}

// 服务器操作
function openServerModal(server = null) {
  editingServer.value = server
  if (server) {
    serverForm.value = { 
      name: server.name, 
      ip: server.ip, 
      provider: server.provider, 
      region: server.region || '',
      spec: server.spec || '',
      monthlyCost: server.monthlyCost || 0
    }
  } else {
    serverForm.value = { name: '', ip: '', provider: 'aliyun', region: '', spec: '', monthlyCost: 0 }
  }
  showServerModal.value = true
}

function closeServerModal() {
  showServerModal.value = false
  editingServer.value = null
}

function saveServer() {
  if (editingServer.value) {
    const idx = store.servers.findIndex(s => s.id === editingServer.value.id)
    if (idx !== -1) {
      store.servers[idx] = { ...store.servers[idx], ...serverForm.value, status: 'online' }
    }
  } else {
    store.addServer({
      ...serverForm.value,
      status: 'online'
    })
  }
  closeServerModal()
}

// 服务操作
function openServiceModal(name = null, config = null) {
  editingService.value = name
  if (name && config) {
    serviceForm.value = {
      name: name,
      type: config.type || 'nodejs',
      port: config.port || 3000,
      version: config.version || '1.0.0',
      healthCheckType: config.healthCheck?.type || '',
      healthCheckUrl: config.healthCheck?.url || ''
    }
  } else {
    serviceForm.value = { name: '', type: 'nodejs', port: 3000, version: '1.0.0', healthCheckType: '', healthCheckUrl: '' }
  }
  showServiceModal.value = true
}

function closeServiceModal() {
  showServiceModal.value = false
  editingService.value = null
}

function saveService() {
  const healthCheck = serviceForm.value.healthCheckType ? {
    type: serviceForm.value.healthCheckType,
    url: serviceForm.value.healthCheckUrl
  } : null
  
  // 简化处理：添加到第一个项目
  if (store.projects.length > 0) {
    const project = store.projects[0]
    if (!project.services) project.services = []
    
    const idx = project.services.findIndex(s => s.name === serviceForm.value.name)
    const newService = {
      name: serviceForm.value.name,
      type: serviceForm.value.type,
      port: serviceForm.value.port,
      version: serviceForm.value.version,
      healthCheck
    }
    
    if (idx !== -1) {
      project.services[idx] = newService
    } else {
      project.services.push(newService)
    }
  }
  closeServiceModal()
}

// 删除操作
function confirmDeleteProject(project) {
  deleteTarget.value = { type: 'project', data: project, name: project.name }
  showDeleteModal.value = true
}

function confirmDeleteServer(server) {
  deleteTarget.value = { type: 'server', data: server, name: server.name }
  showDeleteModal.value = true
}

function confirmDeleteService(name) {
  deleteTarget.value = { type: 'service', data: name, name: name }
  showDeleteModal.value = true
}

function executeDelete() {
  if (deleteTarget.value.type === 'project') {
    const idx = store.projects.findIndex(p => p.id === deleteTarget.value.data.id)
    if (idx !== -1) store.projects.splice(idx, 1)
  } else if (deleteTarget.value.type === 'server') {
    const idx = store.servers.findIndex(s => s.id === deleteTarget.value.data.id)
    if (idx !== -1) store.servers.splice(idx, 1)
  } else if (deleteTarget.value.type === 'service') {
    store.projects.forEach(p => {
      if (p.services) {
        const idx = p.services.findIndex(s => s.name === deleteTarget.value.data)
        if (idx !== -1) p.services.splice(idx, 1)
      }
    })
  }
  showDeleteModal.value = false
}
</script>

<style scoped>
.settings {
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
  transition: background 0.2s;
}

.btn-add:hover {
  background: #45a049;
}

.items-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.item-card:hover {
  background: #fafafa;
}

.item-card:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 12px;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-edit {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-edit:hover {
  background: #bbdefb;
}

.btn-delete {
  background: #ffebee;
  color: #f44336;
}

.btn-delete:hover {
  background: #ffcdd2;
}

.no-items {
  padding: 40px;
  text-align: center;
  color: #999;
}

/* 告警规则 */
.alert-rules {
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

.rule-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.rule-desc {
  font-size: 12px;
  color: #666;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
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
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
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
  transform: translateX(24px);
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
  color: #333;
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
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #1976d2;
}

.input:disabled {
  background: #f5f5f5;
  color: #999;
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
  font-size: 14px;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #eee;
}

.btn-confirm {
  background: #4caf50;
  color: white;
}

.btn-confirm:hover {
  background: #45a049;
}

.btn-delete-confirm {
  background: #f44336;
  color: white;
}

.btn-delete-confirm:hover {
  background: #d32f2f;
}

.delete-modal p {
  color: #666;
  margin-bottom: 20px;
}
</style>
