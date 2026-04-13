<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <i class="fas fa-users text-white text-sm"></i>
          </div>
          <h1 class="text-lg font-semibold">关系舱</h1>
        </div>
        <div class="flex items-center gap-2">
          <button @click="router.push('/import')" class="btn-secondary px-3 py-2 flex items-center gap-1 text-sm">
            <i class="fas fa-file-import"></i>
            <span class="hidden sm:inline">导入</span>
          </button>
          <button @click="handleExport" class="btn-secondary px-3 py-2 flex items-center gap-1 text-sm">
            <i class="fas fa-file-export"></i>
            <span class="hidden sm:inline">导出</span>
          </button>
          <button @click="router.push('/relation/new')" class="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
            <i class="fas fa-plus"></i>
            <span>新增</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-6">
      <!-- 概览卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="card-shadow rounded-xl p-4 text-center">
          <div class="text-2xl md:text-3xl font-bold text-gray-900">{{ relations.length }}</div>
          <div class="text-xs md:text-sm text-gray-500 mt-1">关系人总数</div>
        </div>
        <div class="card-shadow rounded-xl p-4 text-center cursor-pointer" @click="filterType = 'warning'">
          <div class="text-2xl md:text-3xl font-bold text-red-500">{{ overdueCount }}</div>
          <div class="text-xs md:text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
            <i class="fas fa-exclamation-circle text-red-400"></i> 需要跟进
          </div>
        </div>
        <div class="card-shadow rounded-xl p-4 text-center cursor-pointer" @click="filterType = 'promise'">
          <div class="text-2xl md:text-3xl font-bold text-orange-500">{{ promiseCount }}</div>
          <div class="text-xs md:text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
            <i class="fas fa-handshake text-orange-400"></i> 待履行约定
          </div>
        </div>
        <div class="card-shadow rounded-xl p-4 text-center">
          <div class="text-2xl md:text-3xl font-bold text-green-500">{{ recentCount }}</div>
          <div class="text-xs md:text-sm text-gray-500 mt-1">本周已维护</div>
        </div>
      </div>

      <!-- 筛选标签 -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button @click="filterType = 'all'" class="tag" :class="{ 'bg-gray-900 text-white': filterType === 'all' }">
          全部
        </button>
        <button @click="filterType = 'warning'" class="tag" :class="{ 'bg-gray-900 text-white': filterType === 'warning' }">
          <i class="fas fa-exclamation-circle text-red-500 mr-1"></i> 需要跟进
        </button>
        <button @click="filterType = 'promise'" class="tag" :class="{ 'bg-gray-900 text-white': filterType === 'promise' }">
          <i class="fas fa-handshake text-orange-500 mr-1"></i> 有约定
        </button>
        <button @click="filterType = 'important'" class="tag" :class="{ 'bg-gray-900 text-white': filterType === 'important' }">
          重要
        </button>
        <button @click="filterType = 'highvalue'" class="tag" :class="{ 'bg-gray-900 text-white': filterType === 'highvalue' }">
          高价值
        </button>
        <button @click="toggleSchoolFilter" class="tag" :class="{ 'bg-gray-900 text-white': filterType === 'school' }">
          <i class="fas fa-graduation-cap mr-1"></i> 学校筛选
        </button>
      </div>

      <!-- 学校筛选下拉 -->
      <div v-if="filterType === 'school'" class="mb-4 p-4 bg-gray-50 rounded-lg">
        <div class="flex gap-2 flex-wrap mb-3">
          <select v-model="selectedSchoolId" @change="applySchoolFilter" class="form-input flex-1 min-w-[200px]">
            <option value="">选择学校...</option>
            <option v-for="school in allSchools" :key="school.id" :value="school.id">
              {{ school.name }}
            </option>
          </select>
          <button @click="clearSchoolFilter" class="btn-secondary px-3 py-2">
            清除筛选
          </button>
        </div>
        <div v-if="selectedSchoolId" class="text-sm text-gray-600">
          <span>当前筛选: <strong>{{ selectedSchoolName }}</strong></span>
          <router-link :to="`/school/${selectedSchoolId}`" class="ml-3 text-blue-600 hover:underline">
            查看校友页面 <i class="fas fa-external-link-alt text-xs"></i>
          </router-link>
        </div>
        <div v-if="schoolFilterResults.length > 0" class="mt-3 text-sm">
          <span class="text-blue-600">找到 {{ schoolFilterResults.length }} 位校友</span>
        </div>
      </div>

      <!-- 关系人网格 -->
      <div class="relation-grid" v-if="!loading">
        <router-link 
          v-for="relation in filteredRelations" 
          :key="relation.id"
          :to="`/relation/${relation.id}`"
          class="relation-card"
          :class="{ 'warning': isOverdue(relation) }"
        >
          <div class="flex items-center gap-3">
            <div class="avatar w-11 h-11 text-lg" :style="getAvatarStyle(relation.name)">
              {{ relation.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-semibold">{{ relation.name }}</h3>
                <span v-if="isOverdue(relation)" class="text-xs text-red-500">⚠️ {{ getOverdueDays(relation) }}天未联系</span>
                <span v-else-if="isRecent(relation)" class="text-xs text-green-600 font-medium">今天互动</span>
                <span v-else class="text-xs text-gray-400">{{ getLastInteractionText(relation) }}</span>
              </div>
              <p class="text-xs text-gray-500">{{ relation.position }} · {{ relation.company }}</p>
              <div class="flex gap-1.5 mt-2 flex-wrap">
                <span v-for="tag in relation.tags" :key="tag" class="tag">{{ tag }}</span>
                <span v-if="relation.importance === 'high'" class="tag-highvalue">高价值</span>
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- 加载状态 -->
      <div v-else class="text-center py-12 text-gray-500">
        <i class="fas fa-spinner fa-spin text-2xl"></i>
        <p class="mt-2">加载中...</p>
      </div>
    </main>

    <!-- AI聊天窗口 -->
    <div v-if="showChat" class="chat-window show">
      <div class="chat-header">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-white"></i>
          </div>
          <div>
            <h3 class="text-white font-medium">AI 助手</h3>
            <p class="text-white/70 text-xs">智能记录 · 自动摘要</p>
          </div>
        </div>
        <button @click="showChat = false" class="text-white/80 p-2 -mr-2">
          <i class="fas fa-times text-lg"></i>
        </button>
      </div>
      <div class="chat-messages">
        <div v-for="(msg, index) in chatMessages" :key="index" class="chat-message" :class="msg.type">
          <div class="message-bubble">
            <div v-html="msg.text"></div>
          </div>
        </div>
      </div>
      <div class="px-4 py-3 border-t border-gray-100">
        <div class="flex gap-2 flex-wrap">
          <button @click="quickAction('记录互动')" class="quick-action">
            <i class="fas fa-plus mr-1"></i>记录互动
          </button>
          <button @click="quickAction('需要跟进')" class="quick-action">
            <i class="fas fa-exclamation-circle mr-1 text-red-500"></i>需要跟进
          </button>
        </div>
      </div>
      <div class="chat-input-container">
        <input v-model="chatInput" @keypress.enter="sendMessage" type="text" class="chat-input" placeholder="说一句话，我来帮您记录...">
        <button @click="sendMessage" class="chat-send">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>

    <!-- 悬浮按钮 -->
    <div v-if="!showChat" class="chat-fab" @click="showChat = true">
      <i class="fas fa-comment-dots text-xl" id="chatIcon"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRelationStore } from '../stores/relations'
import { importAPI } from '../api'

const router = useRouter()
const store = useRelationStore()
const relations = computed(() => store.relations)
const loading = computed(() => store.loading)
const allSchools = computed(() => store.allSchools)

const filterType = ref('all')
const showChat = ref(false)
const chatInput = ref('')
const selectedSchoolId = ref('')
const schoolFilterResults = ref([])
const chatMessages = ref([{
  type: 'bot',
  text: `<p>👋 您好！我是您的关系管理助手。</p>
    <p style="margin-top:8px;font-size:13px;">我可以帮您：</p>
    <ul style="margin-top:6px;padding-left:16px;font-size:13px;">
      <li>记录互动 + <strong>AI自动摘要</strong></li>
      <li>提取约定 + <strong>自动提醒</strong></li>
      <li>一键标记重要关系</li>
    </ul>`
}])

const overdueCount = computed(() => store.overdueRelations.length)
const promiseCount = computed(() => 1)
const recentCount = computed(() => relations.value.filter(r => isRecent(r)).length)

const filteredRelations = computed(() => {
  if (filterType.value === 'all') return relations.value
  if (filterType.value === 'warning') return relations.value.filter(r => isOverdue(r))
  if (filterType.value === 'promise') return relations.value.filter(r => r.interactionCount > 0)
  if (filterType.value === 'important') return relations.value.filter(r => r.importance === 'high')
  if (filterType.value === 'highvalue') return relations.value.filter(r => r.importance === 'high')
  if (filterType.value === 'school') return schoolFilterResults.value
  return relations.value
})

const selectedSchoolName = computed(() => {
  const school = allSchools.value.find(s => s.id === selectedSchoolId.value)
  return school ? school.name : ''
})

const avatarColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
]

function getAvatarStyle(name) {
  const index = name.charCodeAt(0) % avatarColors.length
  return { background: avatarColors[index] }
}

function isOverdue(relation) {
  if (!relation.lastInteraction) return false
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  const diff = (now - last) / (1000 * 60 * 60 * 24)
  return diff > 14
}

function getOverdueDays(relation) {
  if (!relation.lastInteraction) return 0
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  return Math.floor((now - last) / (1000 * 60 * 60 * 24))
}

function isRecent(relation) {
  if (!relation.lastInteraction) return false
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  const diff = (now - last) / (1000 * 60 * 60 * 24)
  return diff < 1
}

function getLastInteractionText(relation) {
  if (!relation.lastInteraction) return '暂无记录'
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return `${diff}天前`
  if (diff < 30) return `${Math.floor(diff / 7)}周前`
  return `${Math.floor(diff / 30)}月前`
}

function sendMessage() {
  if (!chatInput.value.trim()) return
  chatMessages.value.push({ type: 'user', text: chatInput.value })
  const msg = chatInput.value
  chatInput.value = ''
  
  setTimeout(() => {
    processMessage(msg)
  }, 1200)
}

function quickAction(action) {
  if (action === '记录互动') {
    chatInput.value = '记录我和王建国的互动，今天下午在创新工场聊了2小时，他答应下周给我发投资意向书'
    sendMessage()
  } else if (action === '需要跟进') {
    chatMessages.value.push({ type: 'user', text: '谁需要我最近跟进？' })
    setTimeout(() => {
      const html = `<p><strong>⚠️ 需要跟进的关系人：</strong></p>
        <div style="margin-top:8px;font-size:13px">
          <div style="padding:8px;margin-bottom:6px;background:#fef2f2;border-radius:6px;border-left:3px solid #ef4444">
            <strong>李雅婷</strong> - 14天未联系 <span style="color:#dc2626;font-size:11px">(冷淡)</span><br>
            <span style="color:#666">供应商 · 华润供应链</span>
          </div>
          <div style="padding:8px;background:#fffbeb;border-radius:6px;border-left:3px solid #f97316">
            <strong>陈思远</strong> - 有约定待履行<br>
            <span style="color:#666">客户 · 红杉资本 · 等他回消息</span>
          </div>
        </div>`
      chatMessages.value.push({ type: 'bot', text: html })
    }, 800)
  }
}

function processMessage(msg) {
  const lower = msg.toLowerCase()
  
  if (lower.indexOf('记录') !== -1 && lower.indexOf('互动') !== -1) {
    const names = ['王建国', '张明辉', '李雅婷', '陈思远']
    let personName = null
    for (const name of names) {
      if (lower.indexOf(name.toLowerCase()) !== -1) {
personName = name
        break
      }
    }
    
    if (personName) {
      const info = extractInfo(msg)
      const html = `<p>✅ 已识别并记录到 <strong>${personName}</strong></p>
        <div class="extracted-info">
          <div style="font-size:12px;font-weight:600;color:#0068d6;margin-bottom:8px">🤖 AI摘要</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span style="color:#666">关系人</span><span>${personName}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span style="color:#666">日期</span><span>${info.date}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span style="color:#666">类型</span><span>${info.type}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0"><span style="color:#666">时长</span><span>${info.duration}</span></div>
          ${info.promise ? `<div style="margin-top:8px;padding:8px;background:#fef3c7;border-radius:6px;font-size:12px">
            <strong style="color:#92400e">📌 约定已提取</strong><br>
            <span style="color:#92400e">${info.promise}</span><br>
            <span style="color:#92400e;font-size:11px">→ 已添加到待办提醒</span>
          </div>` : ''}
        </div>
        <button onclick="alert('已保存')" class="confirm-btn">确认保存</button>`
      chatMessages.value.push({ type: 'bot', text: html })
    } else {
      chatMessages.value.push({ type: 'bot', text: '❓ 未找到该关系人，请告诉我完整姓名。' })
    }
  } else if (lower.indexOf('需要跟进') !== -1 || lower.indexOf('久未联系') !== -1) {
    const html = `<p><strong>⚠️ 需要跟进的关系人：</strong></p>
      <div style="margin-top:8px;font-size:13px">
        <div style="padding:8px;margin-bottom:6px;background:#fef2f2;border-radius:6px;border-left:3px solid #ef4444">
          <strong>李雅婷</strong> - 14天未联系 <span style="color:#dc2626;font-size:11px">(冷淡)</span><br>
          <span style="color:#666">供应商 · 华润供应链</span>
        </div>
        <div style="padding:8px;background:#fffbeb;border-radius:6px;border-left:3px solid #f97316">
          <strong>陈思远</strong> - 有约定待履行<br>
          <span style="color:#666">客户 · 红杉资本 · 等他回消息</span>
        </div>
      </div>
      <button onclick="document.querySelector('[data-filter=warning]').click()" class="confirm-btn" style="margin-top:8px">查看全部</button>`
    chatMessages.value.push({ type: 'bot', text: html })
  } else {
    chatMessages.value.push({
      type: 'bot',
      text: `💡 我可以帮您记录互动，例如：<br><br><strong>记录我和王建国的互动：今天下午聊了2小时</strong><br><br>我会自动提取时间、地点、约定等信息。`
    })
  }
}

function extractInfo(msg) {
  const info = {
    date: '今天',
    type: '面谈',
    duration: '未提及',
    promise: null
  }

  if (msg.indexOf('今天') !== -1) info.date = '今天'
  if (msg.indexOf('昨天') !== -1) info.date = '昨天'

  const d = msg.match(/(\d+)\s*小时/)
  if (d) info.duration = d[1] + '小时'

  if (msg.indexOf('吃饭') !== -1) info.type = '商务餐'
  if (msg.indexOf('电话') !== -1) info.type = '电话'

  if (msg.indexOf('答应') !== -1 || msg.indexOf('承诺') !== -1) {
    const m = msg.match(/答应(.+)/)
    if (m) info.promise = m[0]
  }

  return info
}

function toggleSchoolFilter() {
  if (filterType.value === 'school') {
    filterType.value = 'all'
  } else {
    filterType.value = 'school'
    if (allSchools.value.length === 0) {
      store.fetchAllSchools()
    }
  }
}

async function applySchoolFilter() {
  if (!selectedSchoolId.value) {
    schoolFilterResults.value = []
    return
  }
  const school = allSchools.value.find(s => s.id === selectedSchoolId.value)
  if (school) {
    schoolFilterResults.value = await store.searchBySchool(school.name)
  }
}

function clearSchoolFilter() {
  selectedSchoolId.value = ''
  schoolFilterResults.value = []
}

async function handleExport() {
  try {
    const response = await importAPI.export()
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatespace_relations_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert('导出失败: ' + err.message)
  }
}

onMounted(() => {
  store.fetchRelations()
  store.fetchAllSchools()
})
</script>

<style scoped>
/* 网格布局 */
.relation-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
}
@media (min-width: 640px) {
  .relation-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .relation-grid { grid-template-columns: repeat(3, 1fr); }
}

/* 卡片 */
.relation-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
}
.relation-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}
.relation-card.warning {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}

/* 聊天 */
.chat-window {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: none;
  flex-direction: column;
  z-index: 999;
}
.chat-window.show { display: flex; }
@media (min-width: 641px) {
  .chat-window {
    position: fixed;
    top: auto;
    left: auto;
    right: 24px;
    bottom: 100px;
    width: 400px;
    height: auto;
    max-height: 580px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
}
.chat-header {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.chat-message { margin-bottom: 12px; }
.chat-message.user { text-align: right; }
.chat-message.user .message-bubble {
  background: #171717;
  color: white;
  border-radius: 16px 16px 4px 16px;
  display: inline-block;
  padding: 10px 14px;
  max-width: 85%;
  text-align: left;
}
.chat-message.bot .message-bubble {
  background: #f5f5f5;
  color: #171717;
  border-radius: 16px 16px 16px 4px;
  display: inline-block;
  padding: 10px 14px;
  max-width: 85%;
}
.extracted-info {
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 10px;
  padding: 12px;
  margin-top: 8px;
}
.quick-action {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  font-size: 12px;
  cursor: pointer;
}
.chat-input-container {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  align-items: center;
}
.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: none;
  background: #f5f5f5;
  border-radius: 20px;
  outline: none;
  font-size: 15px;
}
.chat-send {
  width: 40px;
  height: 40px;
  background: #171717;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-btn {
  margin-top: 10px;
  width: 100%;
  padding: 10px;
  background: #171717;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 悬浮按钮 */
.chat-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  z-index: 100;
}
@media (max-width: 640px) {
  .chat-fab { bottom: 16px; right: 16px; }
}

/* 表单输入 */
.form-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
}
.form-input:focus {
  border-color: #667eea;
}
</style>
