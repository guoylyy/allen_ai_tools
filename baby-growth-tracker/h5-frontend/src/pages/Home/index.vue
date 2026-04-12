<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { api } from '@/api'
import { formatDate, toLocalDate } from '@/utils'

// 当前底部 tab
const activeTab = ref('home')

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
const selectedSupplement = ref('')
const customSupplement = ref('')
const selectedPoopAmount = ref('') // 排便量：1=少量, 2=中等, 3=大量

// 修改弹窗相关（完整手动录入形式）
const showEditModal = ref(false)
const editingRecord = ref(null)
const editType = ref('sleep')
const editDate = ref('')
const editStartTime = ref('')
const editEndTime = ref('')
const editAmount = ref('')
const editSupplement = ref('')
const editCustomSupplement = ref('')
const editRemark = ref('')
const isEditing = ref(false)

// 删除确认弹窗
const showDeleteConfirm = ref(false)
const deletingRecord = ref(null)
const isDeleting = ref(false)

// 记录操作菜单
const showRecordMenu = ref(false)
const menuRecord = ref(null)

// 类型筛选 Tab
const filterTabs = ref([
  { id: 'all', name: '全部' },
  { id: 'eat', name: '吃饭' },
  { id: 'supplement', name: '补剂' },
  { id: 'poop', name: '排便' },
  { id: 'pee', name: '排尿' }
])
const selectedFilter = ref('all')

// 常用补剂选项
const supplementOptions = [
  { id: 'D3', name: 'D3' },
  { id: 'AD', name: 'AD' },
  { id: '益生菌', name: '益生菌' },
  { id: 'DHA', name: 'DHA' },
  { id: '钙', name: '钙' }
]

// 记录类型
const recordTypes = [
  { id: 'sleep', name: '睡觉', icon: '💤', color: 'bg-gray-100 text-gray-600' },
  { id: 'eat', name: '吃饭', icon: '🍼', color: 'bg-gray-100 text-gray-600' },
  { id: 'play', name: '玩耍', icon: '🧸', color: 'bg-gray-100 text-gray-600' },
  { id: 'study', name: '学习', icon: '📖', color: 'bg-gray-100 text-gray-600' },
  { id: 'supplement', name: '补剂', icon: '💊', color: 'bg-gray-100 text-gray-600' },
  { id: 'poop', name: '排便', icon: '💩', color: 'bg-gray-100 text-gray-600' },
  { id: 'pee', name: '排尿', icon: '💧', color: 'bg-gray-100 text-gray-600' }
]

const currentRecordType = computed(() => 
  recordTypes.find(t => t.id === selectedRecordType.value) || recordTypes[0]
)

// 打开记录菜单
function openRecordMenu(record, event) {
  event.stopPropagation()
  menuRecord.value = record
  showRecordMenu.value = true
}

// 关闭记录菜单
function closeRecordMenu() {
  showRecordMenu.value = false
  menuRecord.value = null
}

// 点击编辑按钮
function onEditClick(record) {
  closeRecordMenu()
  
  // 解析记录内容
  editingRecord.value = record
  editType.value = record.type || 'sleep'
  editRemark.value = record.content || ''
  editAmount.value = ''
  editSupplement.value = ''
  editCustomSupplement.value = ''
  
  // 解析时间
  if (record.time) {
    const date = new Date(record.time)
    editDate.value = date.toISOString().split('T')[0]
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    editStartTime.value = `${hours}:${minutes}`
    
    // 如果有duration，计算结束时间
    if (record.duration) {
      const durationMins = parseDurationToMinutes(record.duration)
      const endDate = new Date(date.getTime() + durationMins * 60000)
      const endHours = String(endDate.getHours()).padStart(2, '0')
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0')
      editEndTime.value = `${endHours}:${endMinutes}`
    } else {
      editEndTime.value = ''
    }
  } else {
    editDate.value = getLocalDateString()
    editStartTime.value = ''
    editEndTime.value = ''
  }
  
  // 解析吃饭的量
  if (record.type === 'eat' && record.content) {
    const match = record.content.match(/(\d+)/)
    if (match) {
      editAmount.value = match[1]
    }
  }
  
  // 解析补剂
  if (record.type === 'supplement' && record.content) {
    const supplements = ['D3', 'AD', '益生菌', 'DHA', '钙']
    for (const s of supplements) {
      if (record.content.includes(s)) {
        editSupplement.value = s
        break
      }
    }
    if (!editSupplement.value) {
      editCustomSupplement.value = record.content
    }
  }
  
  showEditModal.value = true
}

// 解析duration字符串为分钟数
function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0
  const hourMatch = durationStr.match(/(\d+)小时/)
  const minMatch = durationStr.match(/(\d+)分钟/)
  let total = 0
  if (hourMatch) total += parseInt(hourMatch[1]) * 60
  if (minMatch) total += parseInt(minMatch[1])
  return total
}

// 点击删除按钮
function onDeleteClick(record) {
  closeRecordMenu()
  deletingRecord.value = record
  showDeleteConfirm.value = true
}

// 确认删除
async function confirmDelete() {
  if (!deletingRecord.value || isDeleting.value) return
  
  isDeleting.value = true
  
  try {
    await api.deleteRecord(deletingRecord.value.id)
    showDeleteConfirm.value = false
    deletingRecord.value = null
    alert('删除成功')
    await loadRecords(true)
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败: ' + (error.message || '请重试'))
  } finally {
    isDeleting.value = false
  }
}

// 取消删除
function cancelDelete() {
  showDeleteConfirm.value = false
  deletingRecord.value = null
}

// 关闭修改弹窗
function closeEditModal() {
  showEditModal.value = false
  editingRecord.value = null
  editType.value = 'sleep'
  editDate.value = ''
  editStartTime.value = ''
  editEndTime.value = ''
  editAmount.value = ''
  editSupplement.value = ''
  editCustomSupplement.value = ''
  editRemark.value = ''
}

// 计算编辑时的duration（分钟）
function calculateEditDuration() {
  if (!typesWithTimeRange.includes(editType.value)) {
    return 0
  }
  
  if (!editStartTime.value || !editEndTime.value) return 0
  
  const [startHour, startMin] = editStartTime.value.split(':').map(Number)
  const [endHour, endMin] = editEndTime.value.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  let endMinutes = endHour * 60 + endMin
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }
  
  return endMinutes - startMinutes
}

// 提交修改
async function submitEdit() {
  if (isEditing.value || !editingRecord.value) return
  
  isEditing.value = true
  
  try {
    const duration = calculateEditDuration()
    let content = ''
    
    // 构建content
    if (typesWithTimeRange.includes(editType.value)) {
      content = `${editStartTime.value}到${editEndTime.value}`
      if (editRemark.value) {
        content += `，${editRemark.value}`
      }
    } else if (editType.value === 'eat') {
      if (editAmount.value) {
        content = `${editAmount.value}ml`
      }
      if (editRemark.value) {
        content += (content ? '，' : '') + editRemark.value
      }
      if (!content) {
        content = '吃饭'
      }
    } else if (editType.value === 'supplement') {
      const supplementName = editSupplement.value || editCustomSupplement.value
      if (supplementName) {
        content = supplementName
      }
      if (editRemark.value) {
        content += (content ? '，' : '') + editRemark.value
      }
      if (!content) {
        content = '补剂'
      }
    } else {
      content = editRemark.value || ''
    }
    
    const recordedAt = editDate.value && editStartTime.value 
      ? `${editDate.value}T${editStartTime.value}:00`
      : editingRecord.value.time
    
    await api.updateRecord(editingRecord.value.id, {
      type: editType.value,
      recorded_at: recordedAt,
      content: content,
      duration: duration,
      value: editAmount.value ? parseFloat(editAmount.value) : null
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
  sleep: { name: '睡觉', icon: '💤', color: 'bg-gray-100 text-gray-600' },
  eat: { name: '吃饭', icon: '🍼', color: 'bg-gray-100 text-gray-600' },
  play: { name: '玩耍', icon: '🧸', color: 'bg-gray-100 text-gray-600' },
  study: { name: '学习', icon: '📖', color: 'bg-gray-100 text-gray-600' },
  supplement: { name: '补剂', icon: '💊', color: 'bg-gray-100 text-gray-600' },
  milestone: { name: '里程碑', icon: '⭐', color: 'bg-gray-100 text-gray-600' },
  poop: { name: '排便', icon: '💩', color: 'bg-gray-100 text-gray-600' },
  pee: { name: '排尿', icon: '💧', color: 'bg-gray-100 text-gray-600' }
}

// 需要开始结束时间的类型
const typesWithTimeRange = ['sleep', 'play', 'study']

// 获取最接近的整点
function getNearestHour() {
  const now = new Date()
  const minutes = now.getMinutes()
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
  
  const nearestHour = getNearestHour()
  manualStartTime.value = nearestHour
  manualEndTime.value = String(parseInt(nearestHour) + 1).padStart(2, '0') + ':00'
  
  manualAmount.value = ''
  selectedSupplement.value = ''
  customSupplement.value = ''
  const defaultType = recordTypes.find(t => t.id === 'sleep')
  manualRemark.value = defaultType?.name || ''
  showManualModal.value = true
}

function closeManualModal() {
  showManualModal.value = false
}

function selectManualType(type) {
  manualType.value = type
  if (typesWithTimeRange.includes(type)) {
    const nearestHour = getNearestHour()
    manualStartTime.value = nearestHour
    manualEndTime.value = String(parseInt(nearestHour) + 1).padStart(2, '0') + ':00'
  }
  manualAmount.value = ''
  selectedSupplement.value = ''
  customSupplement.value = ''
  selectedPoopAmount.value = ''
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
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }
  
  return endMinutes - startMinutes
}

// 获取记录的recorded_at时间
function getRecordedAt() {
  if (typesWithTimeRange.includes(manualType.value) || manualType.value === 'eat' || manualType.value === 'supplement' || manualType.value === 'poop' || manualType.value === 'pee') {
    return `${manualDate.value}T${manualStartTime.value}:00`
  } else {
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
    
    let content = ''
    let value = null
    
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
      value = manualAmount.value ? parseFloat(manualAmount.value) : null
    } else if (manualType.value === 'supplement') {
      const supplementName = selectedSupplement.value || customSupplement.value
      if (supplementName) {
        content = supplementName
      }
      if (manualRemark.value) {
        content += (content ? '，' : '') + manualRemark.value
      }
      if (!content) {
        content = '补剂'
      }
    } else if (manualType.value === 'poop') {
      // 排便记录
      const poopAmountMap = { 1: '少量', 2: '中等', 3: '大量' }
      const amountName = poopAmountMap[selectedPoopAmount.value] || ''
      content = amountName || '排便'
      if (manualRemark.value) {
        content += `，${manualRemark.value}`
      }
      value = selectedPoopAmount.value ? parseInt(selectedPoopAmount.value) : null
    } else if (manualType.value === 'pee') {
      // 排尿记录
      content = '排尿'
      if (manualRemark.value) {
        content += `，${manualRemark.value}`
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
      value: value,
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
    date = new Date(dateStr)
  } else {
    const [datePart, timePart] = dateStr.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second] = timePart.split(':').map(Number)
    date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    date.setUTCHours(date.getUTCHours() + 8)
  }
  
  if (isNaN(date.getTime())) {
    return ''
  }
  
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
    date.setUTCHours(date.getUTCHours())
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

// 格式化日期标题（今天、昨天、或具体日期）
const formatDateHeader = (dateStr) => {
  if (!dateStr) return ''

  const today = new Date()
  const targetDate = new Date(dateStr)
  console.log('========' , dateStr)

  console.log('========' , dateStr)

  // 清除时间部分，只比较日期
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round((today - targetDate)) / (1000 * 60 * 60 * 24)

  if (diffDays === 0 || diffDays < 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  }  else {
    // 显示具体日期
    const month = targetDate.getMonth() + 1
    const day = targetDate.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[targetDate.getDay()]
    return `${month}月${day}日 ${weekDay}`
  }
}

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
  if (!userStore.currentChild) {
    await userStore.fetchChildren()
  }
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
})
</script>

<template>
  <div class="min-h-screen pb-20" @click="closeRecordMenu">
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
          class="p-4 bg-white rounded-card shadow-card flex flex-col items-center gap-2 active:scale-98 transition-transform"
        >
          <span class="text-2xl">💬</span>
          <p class="font-medium text-sm">聊天记录</p>
        </button>
        
        <!-- 手动录入 -->
        <button
          @click="openManualModal"
          class="p-4 bg-white rounded-card shadow-card flex flex-col items-center gap-2 active:scale-98 transition-transform"
        >
          <span class="text-2xl">✏️</span>
          <p class="font-medium text-sm">手动录入</p>
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
          <!-- 日期标题 -->
          <div class="sticky top-[140px] z-30 -mx-4 px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span class="text-sm font-medium text-gray-600">{{ formatDateHeader(date) }}</span>
          </div>

          <!-- 当天记录 -->
          <div
            v-for="record in groupedRecords[date]"
            :key="record.id"
            class="card p-3 bg-white rounded-xl shadow-sm"
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
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-muted flex-shrink-0">{{ record.timeStr }}</span>
                    <!-- 更多操作按钮 -->
                    <button 
                      @click="openRecordMenu(record, $event)"
                      class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="3" r="1.5"/>
                        <circle cx="10" cy="10" r="1.5"/>
                        <circle cx="10" cy="17" r="1.5"/>
                      </svg>
                    </button>
                  </div>
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

    <!-- 记录操作菜单 -->
    <Teleport to="body">
      <div 
        v-if="showRecordMenu" 
        class="fixed inset-0 z-50"
        @click="closeRecordMenu"
      >
        <div class="absolute inset-0 bg-black/30"></div>
        <!-- 菜单弹窗 -->
        <div 
          class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-slide-up"
          @click.stop
        >
          <div class="p-4 border-b">
            <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold text-center">操作选项</h3>
          </div>
          <div class="p-2">
            <button
              @click="onEditClick(menuRecord)"
              class="w-full p-4 flex items-center gap-3 hover:bg-gray-50 rounded-xl"
            >
              <span class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                ✏️
              </span>
              <span class="font-medium">编辑记录</span>
            </button>
            <button
              @click="onDeleteClick(menuRecord)"
              class="w-full p-4 flex items-center gap-3 hover:bg-red-50 rounded-xl"
            >
              <span class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                🗑️
              </span>
              <span class="font-medium text-red-600">删除记录</span>
            </button>
          </div>
          <div class="p-4 border-t">
            <button
              @click="closeRecordMenu"
              class="w-full p-3 bg-gray-100 rounded-xl font-medium text-center"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 记录弹窗 -->
    <Teleport to="body">
      <div v-if="showRecordModal" class="fixed inset-0 z-50 flex items-end justify-center" @click="closeRecordModal">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up" @click.stop>
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
          
          <div class="p-4 border-b">
            <label class="block text-sm font-medium text-gray-700 mb-2">记录时间</label>
            <input
              type="datetime-local"
              v-model="recordTime"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
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

    <!-- 修改弹窗（完整手动录入形式） -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-end justify-center" @click="closeEditModal">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up" @click.stop>
          <!-- 头部 -->
          <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
            <button @click="closeEditModal" class="text-gray-500">取消</button>
            <h3 class="font-semibold">编辑记录</h3>
            <button 
              @click="submitEdit" 
              :disabled="isEditing"
              class="text-primary-500 font-medium disabled:opacity-50"
            >
              {{ isEditing ? '保存中...' : '保存' }}
            </button>
          </div>
          
          <!-- 类型选择 -->
          <div class="p-4 border-b">
            <label class="block text-sm font-medium text-gray-700 mb-2">活动类型</label>
            <div class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="type in recordTypes"
                :key="type.id"
                @click="editType = type.id"
                class="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl"
                :class="editType === type.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-600'"
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
              v-model="editDate"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <!-- 开始结束时间（睡觉、玩耍、学习） -->
          <template v-if="typesWithTimeRange.includes(editType)">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间段</label>
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <label class="block text-xs text-gray-500 mb-1">开始</label>
                  <input
                    type="time"
                    v-model="editStartTime"
                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <span class="text-gray-400 pt-5">至</span>
                <div class="flex-1">
                  <label class="block text-xs text-gray-500 mb-1">结束</label>
                  <input
                    type="time"
                    v-model="editEndTime"
                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                时长: {{ formatDuration(calculateEditDuration()) }}
              </p>
            </div>
          </template>
          
          <!-- 吃饭时间（单个时间） -->
          <template v-if="editType === 'eat'">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
              <input
                type="time"
                v-model="editStartTime"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <!-- 食量 -->
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">食量</label>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  v-model="editAmount"
                  placeholder="请输入食量"
                  class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span class="text-gray-500">ml</span>
              </div>
            </div>
          </template>
          
          <!-- 补剂时间 -->
          <template v-if="editType === 'supplement'">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
              <input
                type="time"
                v-model="editStartTime"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <!-- 补剂选择 -->
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">选择补剂</label>
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="supplement in supplementOptions"
                  :key="supplement.id"
                  @click="editSupplement = supplement.id"
                  class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  :class="editSupplement === supplement.id 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                >
                  {{ supplement.name }}
                </button>
              </div>
              <input
                type="text"
                v-model="editCustomSupplement"
                placeholder="或输入其他补剂名称"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </template>
          
          <!-- 备注 -->
          <div class="p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ editType === 'eat' ? '备注' : '备注信息' }}
            </label>
            <textarea
              v-model="editRemark"
              :placeholder="editType === 'eat' ? '例如：母乳、奶粉、辅食等' : '输入备注信息...'"
              class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center" @click="cancelDelete">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-2xl w-[80%] max-w-[300px] p-6 animate-slide-up" @click.stop>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span class="text-3xl">⚠️</span>
            </div>
            <h3 class="text-lg font-semibold mb-2">确认删除</h3>
            <p class="text-gray-500 text-sm mb-6">
              确定要删除这条记录吗？删除后无法恢复。
            </p>
            <div class="flex gap-3">
              <button
                @click="cancelDelete"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-full text-gray-600 font-medium"
              >
                取消
              </button>
              <button
                @click="confirmDelete"
                :disabled="isDeleting"
                class="flex-1 px-4 py-2 bg-red-500 text-white rounded-full font-medium disabled:opacity-50"
              >
                {{ isDeleting ? '删除中...' : '确认删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 手动录入弹窗 -->
    <Teleport to="body">
      <div v-if="showManualModal" class="fixed inset-0 z-50 flex items-end justify-center" @click="closeManualModal">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up" @click.stop>
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
          
          <div class="p-4 border-b">
            <label class="block text-sm font-medium text-gray-700 mb-2">日期</label>
            <input
              type="date"
              v-model="manualDate"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
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
          
          <template v-if="manualType === 'eat'">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
              <input
                type="time"
                v-model="manualStartTime"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
          
          <template v-if="manualType === 'supplement'">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
              <input
                type="time"
                v-model="manualStartTime"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">选择补剂</label>
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="supplement in supplementOptions"
                  :key="supplement.id"
                  @click="selectedSupplement = supplement.id"
                  class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  :class="selectedSupplement === supplement.id 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                >
                  {{ supplement.name }}
                </button>
              </div>
              <input
                type="text"
                v-model="customSupplement"
                placeholder="或输入其他补剂名称"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </template>
          
          <!-- 排便量选择 -->
          <template v-if="manualType === 'poop'">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
              <input
                type="time"
                v-model="manualStartTime"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">排便量</label>
              <div class="flex gap-3">
                <button
                  @click="selectedPoopAmount = '1'"
                  class="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                  :class="selectedPoopAmount === '1' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'"
                >
                  少量
                </button>
                <button
                  @click="selectedPoopAmount = '2'"
                  class="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                  :class="selectedPoopAmount === '2' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'"
                >
                  中等
                </button>
                <button
                  @click="selectedPoopAmount = '3'"
                  class="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                  :class="selectedPoopAmount === '3' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'"
                >
                  大量
                </button>
              </div>
            </div>
          </template>
          
          <!-- 排尿时间选择 -->
          <template v-if="manualType === 'pee'">
            <div class="p-4 border-b">
              <label class="block text-sm font-medium text-gray-700 mb-2">时间</label>
              <input
                type="time"
                v-model="manualStartTime"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </template>
          
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

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
