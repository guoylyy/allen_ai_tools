<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { api } from '@/api'
import { formatDate, toLocalDate } from '@/utils'

const router = useRouter()
const userStore = useUserStore()

const records = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const LIMIT = 20
const loadingMore = ref(false)
const errorMsg = ref('')

// 用于检测滚动到底部的元素
const loadMoreTrigger = ref(null)

// 记录弹窗相关（聊天录入）
const showRecordModal = ref(false)
const selectedRecordType = ref('sleep')
const recordTime = ref(new Date())
const recordRemark = ref([])
const recordImages = ref([])
const isSubmitting = ref(false)

// 手动录入弹窗相关
const showManualModal = ref(false)
const manualType = ref('sleep')
const manualDate = ref('')
const manualStartTime = ref('')
const manualEndTime = ref('')
const manualAmount = ref('')
const manualRemark = ref('')
const isManualSubmitting = ref(false)

// 修改弹窗相关
const showEditModal = ref(false)
const editingRecord = ref(null)
const editContent = ref('')
const isEditing = ref(false)

// 长按相关
const pressTimer = ref(null)
const LONG_PRESS_DURATION = 500

// 类型筛选 Tab
const filterTabs = ref([
  { id: 'all', name: '全部' },
  { id: 'sleep', name: '睡觉' },
  { id: 'eat', name: '吃饭' },
  { id: 'play', name: '玩耍' },
  { id: 'study', name: '学习' }
])
const selectedFilter = ref('all')

// 记录类型
const recordTypes = [
  { id: 'sleep', name: '睡觉', icon: '🌙', color: 'bg-purple-100 text-purple-600' },
  { id: 'eat', name: '吃饭', icon: '🍼', color: 'bg-orange-100 text-orange-600' },
  { id: 'play', name: '玩耍', icon: '🧸', color: 'bg-blue-100 text-blue-600' },
  { id: 'study', name: '学习', icon: '📚', color: 'bg-green-100 text-green-600' },
  { id: 'emotion', name: '情绪', icon: '😊', color: 'bg-yellow-100 text-yellow-600' }
]

const currentRecordType = computed(() => 
  recordTypes.find(t => t.id === selectedRecordType.value) || recordTypes[0]
)

// 长按开始
function startPress(record) {
  clearTimeout(pressTimer.value)
  pressTimer.value = setTimeout(() => {
    openEditModal(record)
  }, LONG_PRESS_DURATION)
}

// 长按结束
function endPress() {
  clearTimeout(pressTimer.value)
}

// 选择筛选类型
function selectFilter(filterId) {
  selectedFilter.value = filterId
  loadRecords(true)
}

// 打开记录弹窗
function openRecordModal(type) {
  selectedRecordType.value = type
  recordTime.value = new Date()
  recordRemark.value = []
  recordImages.value = []
  showRecordModal.value = true
}

function closeRecordModal() {
  showRecordModal.value = false
}

function selectRecordType(type) {
  selectedRecordType.value = type
}

function addRemark(e) {
  const text = e.target.value.trim()
  if (text) {
    recordRemark.value.push(text)
    e.target.value = ''
  }
}

function removeRemark(index) {
  recordRemark.value.splice(index, 1)
}

function addImage() {
  recordImages.value.push({
    id: Date.now(),
    url: `https://picsum.photos/seed/${Date.now()}/200/200`
  })
}

function removeImage(id) {
  recordImages.value = recordImages.value.filter(img => img.id !== id)
}

// 打开修改弹窗
function openEditModal(record) {
  editingRecord.value = record
  editContent.value = record.content || ''
  showEditModal.value = true
}

// 关闭修改弹窗
function closeEditModal() {
  showEditModal.value = false
  editingRecord.value = null
  editContent.value = ''
}

// 提交修改
async function submitEdit() {
  if (!editContent.value.trim() || isEditing.value) return
  
  isEditing.value = true
  
  try {
    await api.updateRecord(editingRecord.value.id, {
      content: editContent.value.trim()
    })
    
    closeEditModal()
    alert('修改成功')
    await loadRecords(true)
  } catch (error) {
    console.error('修改失败:', error)
    alert('修改失败: ' + (error.message || '请重试'))
  } finally {
    isEditing.value = false
  }
}

async function submitRecord() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  
  try {
    await api.createRecord({
      type: selectedRecordType.value,
      recorded_at: new Date(recordTime.value).toISOString(),
      content: recordRemark.value.join('; '),
      duration: 0,
      child_id: userStore.currentChild?.id || 1,
      images: recordImages.value.map(img => img.url)
    })
    closeRecordModal()
    loadRecords(true)
  } catch (error) {
    console.error('提交失败:', error)
    alert('保存失败: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

// 记录类型映射
const typeMap = {
  sleep: { name: '睡觉', icon: '🌙', color: 'bg-purple-100 text-purple-600' },
  eat: { name: '吃饭', icon: '🍼', color: 'bg-orange-100 text-orange-600' },
  play: { name: '玩耍', icon: '🧸', color: 'bg-blue-100 text-blue-600' },
  study: { name: '学习', icon: '📚', color: 'bg-green-100 text-green-600' },
  emotion: { name: '情绪', icon: '😊', color: 'bg-yellow-100 text-yellow-600' },
  milestone: { name: '里程碑', icon: '🎉', color: 'bg-pink-100 text-pink-600' }
}

// 需要开始结束时间的类型
const typesWithTimeRange = ['sleep', 'play', 'study']
// 需要单个时间的类型
const typesWithSingleTime = ['eat']

// 获取最接近的整点
function getNearestHour() {
  const now = new Date()
  const minutes = now.getMinutes()
  // 如果分钟超过30，向下取整；否则向上取整
  const hour = minutes > 30 ? now.getHours() + 1 : now.getHours()
  return String(hour).padStart(2, '0') + ':00'
}

// 获取当地日期字符串 (YYYY-MM-DD)
function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 手动录入相关函数
function openManualModal() {
  manualType.value = 'sleep'
  manualDate.value = getLocalDateString()
  
  // 使用当前时间最接近的整点
  const nearestHour = getNearestHour()
  manualStartTime.value = nearestHour
  manualEndTime.value = String(parseInt(nearestHour) + 1).padStart(2, '0') + ':00'
  
  manualAmount.value = ''
  // 自动填写默认分类的备注
  const defaultType = recordTypes.find(t => t.id === 'sleep')
  manualRemark.value = defaultType?.name || ''
  showManualModal.value = true
}

function closeManualModal() {
  showManualModal.value = false
}

function selectManualType(type) {
  manualType.value = type
  // 重置时间为当前最接近的整点
  if (typesWithTimeRange.includes(type)) {
    const nearestHour = getNearestHour()
    manualStartTime.value = nearestHour
    manualEndTime.value = String(parseInt(nearestHour) + 1).padStart(2, '0') + ':00'
  }
  manualAmount.value = ''
  // 自动填写备注为分类名称
  const typeInfo = recordTypes.find(t => t.id === type)
  if (typeInfo) {
    manualRemark.value = typeInfo.name
  }
}

// 计算duration（分钟）
function calculateDuration() {
  if (!typesWithTimeRange.includes(manualType.value)) {
    return 0
  }
  
  const [startHour, startMin] = manualStartTime.value.split(':').map(Number)
  const [endHour, endMin] = manualEndTime.value.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  let endMinutes = endHour * 60 + endMin
  
  // 如果结束时间小于开始时间，说明跨天了
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }
  
  return endMinutes - startMinutes
}

// 获取记录的recorded_at时间
function getRecordedAt() {
  if (typesWithTimeRange.includes(manualType.value) || manualType.value === 'eat') {
    // 有时间段或吃饭的，使用选择的时间
    return `${manualDate.value}T${manualStartTime.value}:00`
  } else {
    // 其他类型，使用日期+当前时间
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${manualDate.value}T${hours}:${minutes}:00`
  }
}

// 提交手动记录
async function submitManualRecord() {
  if (isManualSubmitting.value) return
  isManualSubmitting.value = true
  
  try {
    const duration = calculateDuration()
    const recordedAt = getRecordedAt()
    
    // 构建content
    let content = ''
    if (typesWithTimeRange.includes(manualType.value)) {
      content = `${manualStartTime.value}到${manualEndTime.value}`
      if (manualRemark.value) {
        content += `，${manualRemark.value}`
      }
    } else if (manualType.value === 'eat') {
      if (manualAmount.value) {
        content = `${manualAmount.value}ml`
      }
      if (manualRemark.value) {
        content += (content ? '，' : '') + manualRemark.value
      }
      if (!content) {
        content = '吃饭'
      }
    } else {
      if (manualRemark.value) {
        content = manualRemark.value
      }
    }
    
    await api.createRecord({
      type: manualType.value,
      recorded_at: recordedAt,
      content: content,
      duration: duration,
      value: manualAmount.value ? parseFloat(manualAmount.value) : null,
      child_id: userStore.currentChild?.id || 1
    })
    
    closeManualModal()
    loadRecords(true)
  } catch (error) {
    console.error('提交手动记录失败:', error)
    alert('保存失败: ' + error.message)
  } finally {
    isManualSubmitting.value = false
  }
}

// 格式化时长
function formatDuration(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 计算孩子年龄
function calculateChildAge(birthday) {
  if (!birthday) return ''
  
  const birth = new Date(birthday)
  const now = new Date()
  
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const days = now.getDate() - birth.getDate()
  
  if (years > 0) {
    return `${years}岁${months}个月`
  }
  if (months > 0) {
    return `${months}个月${days}天`
  }
  return `${days}天`
}

// 格式化时间（与报表页面保持一致）
const formatTimeDisplay = (dateStr) => {
  if (!dateStr) return ''
  
  let date
  if (dateStr.includes('T')) {
    // ISO 格式
    date = new Date(dateStr)
  } else {
    // MySQL datetime 格式，数据库存储的是UTC时间
    // 需要转换为本地时间（+8小时）
    const [datePart, timePart] = dateStr.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second] = timePart.split(':').map(Number)
    // 先创建为 UTC 时间，然后加8小时转为本地时间
    date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    date.setUTCHours(date.getUTCHours() + 8)
  }
  
  if (isNaN(date.getTime())) {
    return ''
  }
  
  // 使用 getUTCHours 获取UTC时间加8小时后的值
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 转换记录格式
function transformRecord(record) {
  if (!record) return null
  return {
    id: record.id,
    type: record.type || 'general',
    title: record.content || typeMap[record.type]?.name || '记录',
    content: record.content || '',
    time: record.recorded_at,
    timeStr: formatTimeDisplay(record.recorded_at),
    duration: formatDuration(record.duration),
    date: formatDateDisplay(record.recorded_at)
  }
}

// 格式化日期显示（本地时区）
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  let date
  if (dateStr.includes('T')) {
    date = new Date(dateStr)
  } else {
    const [datePart, timePart] = dateStr.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second] = timePart.split(':').map(Number)
    date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    date.setUTCHours(date.getUTCHours() + 8)
  }
  if (isNaN(date.getTime())) {
    return dateStr
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 筛选后的记录
const filteredRecords = computed(() => {
  if (selectedFilter.value === 'all') {
    return records.value
  }
  return records.value.filter(record => record.type === selectedFilter.value)
})

// 按日期分组的记录
const groupedRecords = computed(() => {
  const groups = {}
  filteredRecords.value.forEach(record => {
    const dateKey = record.date
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(record)
  })
  return groups
})

// 获取所有日期（排序）
const sortedDates = computed(() => {
  return Object.keys(groupedRecords.value).sort((a, b) => new Date(b) - new Date(a))
})

// 加载记录
async function loadRecords(isRefresh = false) {
  if (isRefresh) {
    page.value = 1
    records.value = []
    hasMore.value = true
    errorMsg.value = ''
  }
  
  if (loading.value || loadingMore.value || !hasMore.value) return
  
  if (records.value.length === 0) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  
  // 获取当前选中的孩子ID
  const childId = userStore.currentChild?.id || 1
  
  try {
    console.log('开始加载记录, page:', page.value, ', child_id:', childId)
    const result = await api.getAllRecords({
      page: page.value,
      limit: LIMIT,
      child_id: childId
    })
    
    console.log('API返回结果:', result)
    
    let newRecords = []
    let hasMoreData = false
    
    if (Array.isArray(result)) {
      newRecords = result.map(transformRecord)
      hasMoreData = false
    } else if (result && result.records) {
      newRecords = result.records.map(transformRecord)
      hasMoreData = result.hasMore || false
    } else {
      console.warn('未知的返回格式:', result)
    }
    
    if (page.value === 1) {
      records.value = newRecords
    } else {
      records.value = [...records.value, ...newRecords]
    }
    
    hasMore.value = hasMoreData
    page.value++
    
    console.log('加载记录成功:', newRecords.length, '条, hasMore:', hasMoreData)
  } catch (error) {
    console.error('加载记录失败:', error)
    errorMsg.value = error.message || '加载失败'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 滚动监听
function handleScroll() {
  const scrollTop = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadRecords()
  }
}

// 下拉刷新
async function onRefresh() {
  await loadRecords(true)
}

// 确保获取孩子信息后再加载记录
async function ensureChildLoaded() {
  // 如果还没有当前孩子，先获取
  if (!userStore.currentChild) {
    await userStore.fetchChildren()
  }
  // 如果还是没有，尝试从本地存储恢复
  if (!userStore.currentChild && userStore.children.length > 0) {
    const savedChildId = localStorage.getItem('currentChildId')
    if (savedChildId) {
      const savedChild = userStore.children.find(c => c.id === parseInt(savedChildId))
      if (savedChild) {
        userStore.currentChild = savedChild
      }
    }
  }
}

onMounted(async () => {
  await ensureChildLoaded()
  await loadRecords()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  clearTimeout(pressTimer.value)
})
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- 头部 -->
    <header class="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 sticky top-0 z-50">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">宝宝成长记录</h1>
          <p class="text-sm opacity-90">{{ formatDate(new Date(), 'YYYY年MM月DD日') }}</p>
        </div>
        <div v-if="userStore.currentChild" class="text-right">
          <p class="text-sm font-medium">{{ userStore.currentChild.name }}</p>
          <p class="text-xs opacity-75" v-if="userStore.currentChild.birthday">
            {{ calculateChildAge(userStore.currentChild.birthday) }}
          </p>
        </div>
      </div>
    </header>

    <!-- 记录入口按钮 -->
    <section class="p-4">
      <div class="grid grid-cols-2 gap-3">
        <!-- 聊天记录 -->
        <button
          @click="router.push('/chat-record')"
          class="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white flex items-center justify-between shadow-lg active:scale-98 transition-transform"
        >
          <div class="flex items-center gap-2">
            <span class="text-2xl">💬</span>
            <div class="text-left">
              <p class="font-semibold text-sm">聊天记录</p>
              <p class="text-xs opacity-90">自然语言录入</p>
            </div>
          </div>
          <span class="text-xl">→</span>
        </button>
        
        <!-- 手动录入 -->
        <button
          @click="openManualModal"
          class="p-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl text-white flex items-center justify-between shadow-lg active:scale-98 transition-transform"
        >
          <div class="flex items-center gap-2">
            <span class="text-2xl">✏️</span>
            <div class="text-left">
              <p class="font-semibold text-sm">手动录入</p>
              <p class="text-xs opacity-90">选择时间录入</p>
            </div>
          </div>
          <span class="text-xl">→</span>
        </button>
      </div>
    </section>

    <!-- 类型筛选 Tab -->
    <section class="px-4 pt-2 pb-1 bg-white border-b sticky top-[88px] z-40">
      <div class="flex gap-6 overflow-x-auto">
        <button
          v-for="tab in filterTabs"
          :key="tab.id"
          @click="selectFilter(tab.id)"
          class="flex-shrink-0 pb-2 text-lg font-medium relative transition-colors"
          :class="selectedFilter === tab.id ? 'text-primary-500' : 'text-gray-500'"
        >
          {{ tab.name }}
          <!-- 高亮下划线 -->
          <span 
            v-if="selectedFilter === tab.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
          ></span>
        </button>
      </div>
    </section>

    <!-- 记录列表 -->
    <section class="p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">
          {{ selectedFilter === 'all' ? '全部记录' : typeMap[selectedFilter]?.name + '记录' }}
        </h2>
        <button 
          @click="onRefresh"
          class="text-primary-500 text-sm flex items-center gap-1"
          :class="{ 'animate-spin': loadingMore }"
        >
          <span>刷新</span>
        </button>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading && records.length === 0" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p class="text-muted mt-2">加载中...</p>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="errorMsg" class="text-center py-4 text-red-500">
        {{ errorMsg }}
      </div>

      <!-- 记录列表 -->
      <div v-else class="space-y-3">
        <!-- 按日期分组显示 -->
        <template v-for="date in sortedDates" :key="date">
          <!-- 当天记录 -->
          <div
            v-for="record in groupedRecords[date]"
            :key="record.id"
            class="card p-3 animate-slide-up"
            @touchstart="startPress(record)"
            @touchend="endPress"
            @touchcancel="endPress"
          >
            <div class="flex items-start gap-3">
              <!-- 类型图标 -->
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" :class="typeMap[record.type]?.color || 'bg-gray-100'">
                {{ typeMap[record.type]?.icon || '📝' }}
              </div>
              
              <!-- 内容区域 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <p class="font-medium truncate">{{ record.title }}</p>
                  <span class="text-sm text-muted flex-shrink-0 ml-2">{{ record.timeStr }}</span>
                </div>
                
                <!-- 内容描述 -->
                <p v-if="record.content" class="text-sm text-gray-500 truncate mb-1">
                  {{ record.content }}
                </p>
                
                <!-- 持续时间 -->
                <div v-if="record.duration" class="flex items-center gap-1 text-xs text-muted">
                  <span>⏱</span>
                  <span>{{ record.duration }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 加载更多 -->
        <div v-if="records.length > 0" ref="loadMoreTrigger" class="text-center py-4">
          <div v-if="loadingMore" class="inline-flex items-center gap-2 text-muted">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
            <span>加载更多...</span>
          </div>
          <div v-else-if="!hasMore" class="text-muted text-sm">
            没有更多记录了
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredRecords.length === 0 && !loading" class="text-center py-8 text-muted">
          <p v-if="selectedFilter === 'all'">暂无记录，开始记录宝宝的成长吧！</p>
          <p v-else>暂无{{ typeMap[selectedFilter]?.name }}记录</p>
        </div>
      </div>
    </section>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center p-2 text-primary-500">
          <span class="text-xl">🏠</span>
          <span class="text-xs mt-1">首页</span>
        </router-link>
        <router-link to="/report" class="flex flex-col items-center p-2 text-gray-500">
          <span class="text-xl">📊</span>
          <span class="text-xs mt-1">报表</span>
        </router-link>
        <router-link to="/profile" class="flex flex-col items-center p-2 text-gray-500">
          <span class="text-xl">👤</span>
          <span class="text-xs mt-1">我的</span>
        </router-link>
      </div>
    </nav>

    <!-- 记录弹窗 -->
    <Teleport to="body">
      <div v-if="showRecordModal" class="fixed inset-0 z-50 flex items-end justify-center">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/50" @click="closeRecordModal"></div>
        <!-- 弹窗内容 -->
        <div class="relative bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
          <!-- 头部 -->
          <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
            <button @click="closeRecordModal" class="text-gray-500">取消</button>
            <h3 class="font-semibold">记录{{ currentRecordType.name }}</h3>
            <button 
              @click="submitRecord" 
              :disabled="isSubmitting"
              class="text-primary-500 font-medium disabled:opacity-50"
            >
              {{ isSubmitting ? '保存中...' : '保存' }}
            </button>
          </div>
          
          <!-- 类型选择 -->
          <div class="p-4 border-b">
            <div class="flex gap-3 overflow-x-auto">
              <button
                v-for="type in recordTypes"
                :key="type.id"
                @click="selectRecordType(type.id)"
                class="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl"
                :class="selectedRecordType === type.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-50 text-gray-600'"
              >
                <span class="text-2xl">{{ type.icon }}</span>
                <span class="text-xs">{{ type.name }}</span>
              </button>
            </div>
          </div>
          
          <!-- 时间选择 -->
          <div class="p-4 border-b">
            <label class="block text-sm font-medium text-gray-700 mb-2">记录时间</label>
            <input
              type="datetime-local"
              v-model="recordTime"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <!-- 备注 -->
          <div class="p-4 border-b">
            <label class="block text-sm font-medium text-gray-700 mb-2">添加备注</label>
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                @keydown.enter="addRemark"
                placeholder="输入备注后回车"
                class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button class="p-2 bg-primary-500 text-white rounded-lg">+</button>
            </div>
            <div v-if="recordRemark.length > 0" class="flex flex-wrap gap-2">
              <span 
                v-for="(remark, index) in recordRemark" 
                :key="index"
                class="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1"
              >
                {{ remark }}
                <button @click="removeRemark(index)" class="text-gray-400 hover:text-red-500">×</button>
              </span>
            </div>
          </div>
          
          <!-- 图片 -->
          <div class="p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">照片</label>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="img in recordImages"
                :key="img.id"
                class="relative w-20 h-20 rounded-lg overflow-hidden"
              >
                <img :src="img.url" class="w-full h-full object-cover" />
                <button
                  @click="removeImage(img.id)"
                  class="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              <button
                @click="addImage"
                class="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400"
              >
                <span class="text-2xl">📷</span>
                <span class="text-xs mt-1">拍照</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 修改弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-end justify-center">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/50" @click="closeEditModal"></div>
        <!-- 弹窗内容 -->
        <div class="relative bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
          <!-- 头部 -->
          <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
            <button @click="closeEditModal" class="text-gray-500">取消</button>
            <h3 class="font-semibold">修改记录</h3>
            <button 
              @click="submitEdit" 
              :disabled="!editContent.trim() || isEditing"
              class="text-primary-500 font-medium disabled:opacity-50"
            >
              {{ isEditing ? '保存中...' : '保存' }}
            </button>
          </div>
          
          <!-- 修改内容 -->
          <div class="p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">记录内容</label>
            <textarea
              v-model="editContent"
              placeholder="输入修改后的内容..."
              class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows="4"
            ></textarea>
            <p class="text-xs text-gray-500 mt-2">
              提示：可以修改内容，如将「3点50开始睡觉」改为「3点50到4点50睡觉」
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 手动录入弹窗 -->
    <Teleport to="body">
      <div v-if="showManualModal" class="fixed inset-0 z-50 flex items-end justify-center">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/50" @click="closeManualModal"></div>
        <!-- 弹窗内容 -->
        <div class="relative bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
          <!-- 头部 -->
          <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
            <button @click="closeManualModal" class="text-gray-500">取消</button>
            <h3 class="font-semibold">手动录入</h3>
            <button 
              @click="submitManualRecord" 
              :disabled="isManualSubmitting"
              class="text-primary-500 font-medium disabled:opacity-50"
            >
              {{ isManualSubmitting ? '保存中...' : '保存' }}
            </button>
          </div>
          
          <!-- 类型选择 -->
          <div class="p-4 border-b">
            <label class="block text-sm font-medium text-gray-700 mb-2">活动类型</label>
            <div class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="type in recordTypes"
                :key="type.id"
                @click="selectManualType(type.id)"
                class="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl"
                :class="manualType === type.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-600'"
              >
                <span class="text-xl">{{ type.icon }}</span>
                <span class="text-xs">{{ type.name }}</span>
              </button>
            </div>
          </div>
          
          <!-- 日期选择 -->
          <div class="p-4 border-b">
            <label class="block text-sm font-medium text-gray-700 mb-2">日期</label>
            <input
              type="date"
              v-model="manualDate"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <!-- 开始结束时间（睡觉、玩耍、学习） -->
          <template v-if="typesWithTimeRange.includes(manualType)">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间段</label>
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <label class="block text-xs text-gray-500 mb-1">开始</label>
                  <input
                    type="time"
                    v-model="manualStartTime"
                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <span class="text-gray-400 pt-5">至</span>
                <div class="flex-1">
                  <label class="block text-xs text-gray-500 mb-1">结束</label>
                  <input
                    type="time"
                    v-model="manualEndTime"
                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                时长: {{ formatDuration(calculateDuration()) }}
              </p>
            </div>
          </template>
          
          <!-- 吃饭时间（单个时间） -->
          <template v-if="manualType === 'eat'">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
              <input
                type="time"
                v-model="manualStartTime"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <!-- 食量 -->
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">食量</label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  v-model="manualAmount"
                  placeholder="请输入食量"
                  class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span class="text-gray-500">ml</span>
              </div>
            </div>
          </template>
          
          <!-- 备注 -->
          <div class="p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ manualType === 'eat' ? '备注' : '备注信息' }}
            </label>
            <textarea
              v-model="manualRemark"
              :placeholder="manualType === 'eat' ? '例如：母乳、奶粉、辅食等' : '输入备注信息...'"
              class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
