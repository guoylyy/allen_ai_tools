<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activeTab = ref('today')
const loading = ref(false)

const tabs = [
  { id: 'today', name: '日报' },
  { id: 'week', name: '周报' },
  { id: 'month', name: '月报' }
]

// 今日日期选择
const selectedDate = ref('')
const showDatePicker = ref(false)

// 获取当地日期字符串 (YYYY-MM-DD)
function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期显示（中文）
function formatDateCN(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

// 获取昨天的日期
function getYesterday(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取明天的日期
function getTomorrow(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 点击前一天
function goToPrevDay() {
  selectedDate.value = getYesterday(selectedDate.value)
  loadTodayData()
}

// 点击后一天
function goToNextDay() {
  selectedDate.value = getTomorrow(selectedDate.value)
  loadTodayData()
}

// 今日数据
const todayStats = ref({
  sleep: { count: 0, duration: 0 },
  eat: { count: 0, duration: 0, total_value: 0 },
  play: { count: 0, duration: 0 },
  study: { count: 0, duration: 0 },
  emotion: { count: 0 }
})

// 今日记录列表
const todayRecords = ref([])

// 格式化时长
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0分钟'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
}

// 睡眠时间
const sleepTime = computed(() => formatDuration(todayStats.value.sleep.duration))

// 喂养次数和奶量
const eatStats = computed(() => {
  const count = todayStats.value.eat.count
  const totalValue = todayStats.value.eat.total_value
  if (totalValue > 0) {
    return `${count}次/${Math.round(totalValue)}ml`
  }
  return `${count}次`
})

// 玩耍次数
const playCount = computed(() => `${todayStats.value.play.count}次`)

// 学习次数
const studyCount = computed(() => `${todayStats.value.study.count}次`)

// 周报数据
const weeklyReport = ref({
  summary: [],
  daily: []
})

// 月报数据
const monthlyReport = ref({
  summary: [],
  daily: []
})

// 格式化日期显示（本地时区）
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return dateStr
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间显示（UTC时间+8小时 = 当地时间）
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

// 获取本周开始日期
function getWeekStart() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(now.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

// 类型映射
const typeMap = {
  sleep: { name: '睡觉', icon: '🌙', color: 'bg-purple-100 text-purple-600' },
  eat: { name: '吃饭', icon: '🍼', color: 'bg-orange-100 text-orange-600' },
  play: { name: '玩耍', icon: '🧸', color: 'bg-blue-100 text-blue-600' },
  study: { name: '学习', icon: '📚', color: 'bg-green-100 text-green-600' },
  emotion: { name: '情绪', icon: '😊', color: 'bg-yellow-100 text-yellow-600' },
  milestone: { name: '里程碑', icon: '🎉', color: 'bg-pink-100 text-pink-600' }
}

// 加载今日数据（带日期参数）
async function loadTodayData() {
  try {
    loading.value = true
    const childId = userStore.currentChild?.id || 1
    const date = selectedDate.value || getLocalDateString()
    
    console.log('[报表] 加载数据，日期:', date, 'childId:', childId)
    
    // 获取概览（传日期参数）
    const overview = await api.getTodayOverview({ 
      child_id: childId,
      date: date
    })
    todayStats.value = overview
    
    // 获取记录（传日期参数）
    const records = await api.getRecords({ 
      child_id: childId,
      date: date
    })
    
    // 转换为本地时间并排序（倒序，最新的在最上面）
    todayRecords.value = records
      .map(record => ({
        ...record,
        localTime: new Date(record.recorded_at),
        typeInfo: typeMap[record.type] || { name: '记录', icon: '📝', color: 'bg-gray-100 text-gray-600' }
      }))
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
  } catch (error) {
    console.error('获取今日数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取今日数据
async function fetchTodayData() {
  try {
    loading.value = true
    const childId = userStore.currentChild?.id || 1
    
    // 初始化当前日期
    if (!selectedDate.value) {
      selectedDate.value = getLocalDateString()
    }
    
    // 使用带日期的加载函数
    await loadTodayData()
    
    // 获取本周数据
    const weekStart = getWeekStart()
    const weekReport = await api.getWeeklyReport({ 
      child_id: childId, 
      week_start: weekStart 
    })
    weeklyReport.value = weekReport
  } catch (error) {
    console.error('获取今日数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取周报数据
async function fetchWeeklyData() {
  try {
    loading.value = true
    const childId = userStore.currentChild?.id || 1
    const weekStart = getWeekStart()
    weeklyReport.value = await api.getWeeklyReport({ 
      child_id: childId, 
      week_start: weekStart 
    })
  } catch (error) {
    console.error('获取周报数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取月报数据
async function fetchMonthlyData() {
  try {
    loading.value = true
    const childId = userStore.currentChild?.id || 1
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    monthlyReport.value = await api.getMonthlyReport({ 
      child_id: childId, 
      month 
    })
  } catch (error) {
    console.error('获取月报数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载当前tab数据
async function loadTabData(tab) {
  if (tab === 'today') {
    await fetchTodayData()
  } else if (tab === 'week') {
    await fetchWeeklyData()
  } else if (tab === 'month') {
    await fetchMonthlyData()
  }
}

// 监听tab切换
watch(activeTab, async (newTab) => {
  await loadTabData(newTab)
})

// 监听孩子切换
watch(() => userStore.currentChild, async () => {
  await loadTabData(activeTab.value)
})

onMounted(async () => {
  await userStore.fetchChildren()
  await loadTabData(activeTab.value)
})
</script>

<template>
  <div class="min-h-screen pb-20 overflow-y-auto">
    <!-- 头部 -->
    <header class="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4">
      <h1 class="text-xl font-bold">成长报表</h1>
    </header>

    <!-- Tab 切换 -->
    <div class="bg-white border-b">
      <div class="flex">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex-1 py-3 text-center transition-colors"
          :class="activeTab === tab.id ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-500'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="p-4 text-center text-gray-500">
      <p>加载中...</p>
    </div>

    <!-- 今日概览 -->
    <div v-else-if="activeTab === 'today'" class="p-4 space-y-4">
      <!-- 日期选择器 -->
      <div class="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
        <button 
          @click="goToPrevDay"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <span class="text-lg">‹</span>
        </button>
        
        <div class="flex flex-col items-center">
          <span class="text-sm text-gray-500">查看日期</span>
          <span class="text-lg font-semibold text-gray-800">{{ formatDateCN(selectedDate || getLocalDateString()) }}</span>
        </div>
        
        <button 
          @click="goToNextDay"
          :disabled="selectedDate >= getLocalDateString()"
          :class="[
            'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
            selectedDate >= getLocalDateString() 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-gray-100 hover:bg-gray-200'
          ]"
        >
          <span class="text-lg">›</span>
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card text-center">
          <div class="text-2xl mb-1">🌙</div>
          <p class="text-sm text-muted">睡眠</p>
          <p class="font-semibold text-lg">{{ sleepTime }}</p>
        </div>
        <div class="card text-center">
          <div class="text-2xl mb-1">🍼</div>
          <p class="text-sm text-muted">喂养</p>
          <p class="font-semibold text-lg">{{ eatStats }}</p>
        </div>
        <div class="card text-center">
          <div class="text-2xl mb-1">🧸</div>
          <p class="text-sm text-muted">玩耍</p>
          <p class="font-semibold text-lg">{{ playCount }}</p>
        </div>
        <div class="card text-center">
          <div class="text-2xl mb-1">📚</div>
          <p class="text-sm text-muted">学习</p>
          <p class="font-semibold text-lg">{{ studyCount }}</p>
        </div>
      </div>

      <!-- 时间线 -->
      <div class="card">
        <h3 class="font-semibold mb-3">时间线</h3>
        <div v-if="todayRecords.length > 0" class="relative">
          <!-- 时间线 -->
          <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <!-- 记录列表 -->
          <div class="space-y-4 pl-12">
            <div 
              v-for="record in todayRecords" 
              :key="record.id" 
              class="relative"
            >
              <!-- 时间点 -->
              <div class="absolute -left-12 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm" :class="record.typeInfo.color.split(' ')[0]">
                <span class="absolute -left-1.5 -top-1.5 text-sm">{{ record.typeInfo.icon }}</span>
              </div>
              
              <!-- 内容 -->
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-lg font-medium">{{ formatTimeDisplay(record.recorded_at) }}</span>
                  <span class="text-base text-gray-400">{{ record.typeInfo.name }}</span>
                </div>
                <p class="text-base text-gray-600">{{ record.content || record.typeInfo.name }}</p>
                <div v-if="record.duration" class="text-base text-gray-500 mt-1">
                  ⏱ {{ formatDuration(record.duration) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-400">
          <p>暂无记录</p>
          <p class="text-sm mt-1">开始记录宝宝的成长吧！</p>
        </div>
      </div>
    </div>

    <!-- 周报 -->
    <div v-else-if="activeTab === 'week'" class="p-4">
      <div class="card mb-4">
        <h3 class="font-semibold mb-2">本周总结</h3>
        <div v-if="weeklyReport.summary && weeklyReport.summary.length > 0">
          <p class="text-gray-600 text-sm">
            <template v-for="(item, index) in weeklyReport.summary" :key="item.type">
              <span v-if="index > 0">，</span>
              <span v-if="item.type === 'sleep'">睡眠{{ formatDuration(item.total_duration) }}</span>
              <span v-else-if="item.type === 'eat'">饮食{{ item.count }}次</span>
              <span v-else-if="item.type === 'play'">玩耍{{ item.count }}次</span>
              <span v-else-if="item.type === 'study'">学习{{ item.count }}次</span>
            </template>
          </p>
          <p class="text-gray-600 text-sm mt-1">共记录 {{ weeklyReport.summary.reduce((sum, item) => sum + item.count, 0) }} 条</p>
        </div>
        <p v-else class="text-gray-600 text-sm">暂无本周数据</p>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-3">每日详情</h3>
        <div v-if="weeklyReport.daily && weeklyReport.daily.length > 0" class="space-y-2">
          <div v-for="date in [...new Set(weeklyReport.daily.map(d => d.date))]" :key="date" class="flex justify-between items-center py-2 border-b">
            <span class="text-sm font-medium">{{ formatDateDisplay(date) }}</span>
            <span class="text-sm text-gray-500">
              <template v-for="(item, idx) in weeklyReport.daily.filter(d => d.date === date)" :key="item.type">
                <span v-if="idx > 0">，</span>
                <span v-if="item.type === 'sleep'">睡眠{{ formatDuration(item.total_duration) }}</span>
                <span v-else-if="item.type === 'eat'">饮食{{ item.count }}次</span>
                <span v-else-if="item.type === 'play'">玩耍{{ item.count }}次</span>
                <span v-else-if="item.type === 'study'">学习{{ item.count }}次</span>
              </template>
              <span v-if="weeklyReport.daily.filter(d => d.date === date).length === 0">无记录</span>
            </span>
          </div>
        </div>
        <p v-else class="text-gray-500 text-sm">暂无数据</p>
      </div>
    </div>

    <!-- 月报 -->
    <div v-else class="p-4">
      <div class="card mb-4">
        <h3 class="font-semibold mb-2">本月总结</h3>
        <div v-if="monthlyReport.summary && monthlyReport.summary.length > 0">
          <p class="text-gray-600 text-sm">
            <template v-for="(item, index) in monthlyReport.summary" :key="item.type">
              <span v-if="index > 0">，</span>
              <span v-if="item.type === 'sleep'">睡眠{{ formatDuration(item.total_duration) }}</span>
              <span v-else-if="item.type === 'eat'">饮食{{ item.count }}次</span>
              <span v-else-if="item.type === 'play'">玩耍{{ item.count }}次</span>
              <span v-else-if="item.type === 'study'">学习{{ item.count }}次</span>
            </template>
          </p>
          <p class="text-gray-600 text-sm mt-1">共记录 {{ monthlyReport.summary.reduce((sum, item) => sum + item.count, 0) }} 条</p>
        </div>
        <p v-else class="text-gray-600 text-sm">暂无本月数据</p>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-3">每日详情</h3>
        <div v-if="monthlyReport.daily && monthlyReport.daily.length > 0" class="space-y-2">
          <div v-for="date in [...new Set(monthlyReport.daily.map(d => d.date))].slice(-7)" :key="date" class="flex justify-between items-center py-2 border-b">
            <span class="text-sm font-medium">{{ formatDateDisplay(date) }}</span>
            <span class="text-sm text-gray-500">
              <template v-for="(item, idx) in monthlyReport.daily.filter(d => d.date === date)" :key="item.type">
                <span v-if="idx > 0">，</span>
                <span v-if="item.type === 'sleep'">睡眠{{ formatDuration(item.total_duration) }}</span>
                <span v-else-if="item.type === 'eat'">饮食{{ item.count }}次</span>
                <span v-else-if="item.type === 'play'">玩耍{{ item.count }}次</span>
                <span v-else-if="item.type === 'study'">学习{{ item.count }}次</span>
              </template>
              <span v-if="monthlyReport.daily.filter(d => d.date === date).length === 0">无记录</span>
            </span>
          </div>
        </div>
        <p v-else class="text-gray-500 text-sm">暂无数据</p>
      </div>
    </div>

    <!-- 底部导航 - 与首页一致 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center p-2 text-gray-500">
          <span class="text-xl">🏠</span>
          <span class="text-xs mt-1">首页</span>
        </router-link>
        <router-link to="/report" class="flex flex-col items-center p-2 text-primary-500">
          <span class="text-xl">📊</span>
          <span class="text-xs mt-1">报表</span>
        </router-link>
        <router-link to="/profile" class="flex flex-col items-center p-2 text-gray-500">
          <span class="text-xl">👤</span>
          <span class="text-xs mt-1">我的</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>
