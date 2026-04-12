<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/" class="btn-secondary w-9 h-9 flex items-center justify-center">
            <i class="fas fa-arrow-left text-sm"></i>
          </router-link>
          <span class="text-sm text-gray-500">返回列表</span>
        </div>
        <div class="flex items-center gap-2">
          <router-link :to="`/relation/edit/${id}`" class="btn-secondary px-3 py-2 flex items-center gap-1 text-sm">
            <i class="fas fa-edit text-xs"></i>
            <span class="hidden sm:inline">编辑</span>
          </router-link>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6" v-if="relation">
      <!-- 基本信息卡片 -->
      <div class="card-shadow rounded-xl p-5 mb-4">
        <div class="flex items-start gap-4">
          <div class="avatar w-16 h-16 text-2xl" :style="getAvatarStyle(relation.name)">
            {{ relation.name.charAt(0) }}
          </div>
          <div class="flex-1">
            <h1 class="text-xl font-bold mb-1">{{ relation.name }}</h1>
            <p class="text-sm text-gray-500 mb-3">{{ relation.position }} · {{ relation.company }}</p>
            <div class="flex gap-2 flex-wrap mb-3">
              <span v-for="tag in relation.tags" :key="tag" class="tag">{{ tag }}</span>
              <span v-if="relation.importance === 'high'" class="tag-highvalue">高价值</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div><i class="fas fa-phone w-4 mr-1"></i>{{ relation.phone || '未填写' }}</div>
              <div><i class="fas fa-calendar w-4 mr-1"></i>首次: {{ formatDate(relation.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 重要时刻 -->
      <div class="card-shadow rounded-lg p-4 mb-4" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
        <div class="text-sm font-semibold mb-3 flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fas fa-birthday-cake text-amber-600"></i> 重要时刻</span>
          <button @click="showEventModal = true" class="text-xs text-amber-700 bg-white/60 px-2 py-1 rounded">+ 添加</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="event in relation.events" :key="event.id" class="bg-white/80 rounded-lg p-3">
            <div class="text-xl font-bold text-amber-700">{{ formatMonthDay(event.date) }}</div>
            <div class="text-xs text-amber-600">{{ getEventTypeName(event.type) }}</div>
          </div>
          <div v-if="!relation.events?.length" class="col-span-2 text-center text-xs text-amber-600 py-2">
            暂无重要时刻
          </div>
        </div>
      </div>

      <!-- 朋友圈动态 -->
      <div class="card-shadow rounded-lg p-4 mb-4">
        <div class="text-sm font-semibold mb-3 flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fas fa-newspaper text-gray-400"></i> 朋友圈动态</span>
          <button @click="showMomentModal = true" class="text-xs text-blue-600">+ 添加动态</button>
        </div>
        <div class="space-y-3">
          <div v-for="moment in relation.moments" :key="moment.id" class="bg-gray-50 rounded-lg p-3">
            <p class="text-sm text-gray-700">{{ moment.content }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ formatDate(moment.date) }}</p>
          </div>
          <div v-if="!relation.moments?.length" class="text-center text-xs text-gray-400 py-4">
            暂无动态记录
          </div>
        </div>
      </div>

      <!-- 财务往来 -->
      <div class="card-shadow rounded-lg p-4 mb-4">
        <div class="text-sm font-semibold mb-3 flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fas fa-wallet text-gray-400"></i> 财务往来</span>
          <button @click="showFinanceModal = true" class="text-xs text-blue-600">+ 记录</button>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="text-center">
            <div class="text-xs text-gray-500 mb-1">我方投入</div>
            <div class="text-lg font-bold text-red-500">¥{{ financeStats.totalExpense.toLocaleString() }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500 mb-1">对方投入</div>
            <div class="text-lg font-bold text-green-500">¥{{ financeStats.totalIncome.toLocaleString() }}</div>
          </div>
        </div>
        <div class="space-y-2">
          <div v-for="item in relation.finance?.slice(0, 3)" :key="item.id" 
               class="finance-item" :class="item.type">
            <div class="flex justify-between items-center">
              <div>
                <div class="text-sm font-medium">{{ item.item }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(item.date) }}</div>
              </div>
              <div class="text-sm font-semibold" :class="item.type === 'income' ? 'text-green-600' : 'text-red-500'">
                {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount.toLocaleString() }}
              </div>
            </div>
          </div>
          <div v-if="!relation.finance?.length" class="text-center text-xs text-gray-400 py-4">
            暂无财务记录
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="card-shadow rounded-lg p-5 mb-4">
        <div class="text-sm font-semibold mb-3 flex items-center gap-2">
          <i class="fas fa-user text-gray-400"></i> 基本信息
        </div>
        <div class="space-y-3 text-sm">
          <div>
            <span class="text-gray-500">背景</span>
            <p class="mt-1 text-gray-700">{{ relation.background || '暂无' }}</p>
          </div>
          <div>
            <span class="text-gray-500">特点</span>
            <p class="mt-1 text-gray-700">{{ relation.features || '暂无' }}</p>
          </div>
          <div>
            <span class="text-gray-500">目标</span>
            <p class="mt-1 text-gray-700">{{ relation.goals || '暂无' }}</p>
          </div>
        </div>
      </div>

      <!-- 互动历史 -->
      <div class="card-shadow rounded-lg p-5">
        <div class="text-sm font-semibold mb-4 flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fas fa-history text-gray-400"></i> 互动历史</span>
          <span class="flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ relation.interactions?.length || 0 }}次</span>
            <button @click="showInteractionModal = true" class="text-xs text-blue-600">+ 添加</button>
          </span>
        </div>
        <div class="space-y-4">
          <div v-for="interaction in relation.interactions" :key="interaction.id" class="timeline-item">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="font-medium text-sm">{{ formatDate(interaction.createdAt) }}</span>
              <span class="text-xs px-2 py-0.5 bg-gray-100 rounded">{{ getInteractionTypeName(interaction.type) }}</span>
            </div>
            <p class="text-sm text-gray-600">{{ interaction.content }}</p>
            <div v-if="interaction.summary" class="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <i class="fas fa-robot mr-1"></i>{{ interaction.summary }}
            </div>
          </div>
          <div v-if="!relation.interactions?.length" class="text-center text-xs text-gray-400 py-4">
            暂无互动记录
          </div>
        </div>
      </div>
    </main>

    <!-- 加载状态 -->
    <div v-else class="flex items-center justify-center h-64">
      <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
    </div>

    <!-- 重要时刻弹窗 -->
    <Modal :show="showEventModal" title="添加重要时刻" @close="showEventModal = false">
      <form @submit.prevent="handleAddEvent" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select v-model="eventForm.type" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="birthday">生日</option>
            <option value="anniversary">纪念日</option>
            <option value="meeting">约会</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input v-model="eventForm.date" type="date" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <input v-model="eventForm.note" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
        <div class="flex items-center gap-2">
          <input v-model="eventForm.reminder" type="checkbox" id="reminder" class="w-4 h-4">
          <label for="reminder" class="text-sm text-gray-600">提前提醒</label>
        </div>
        <button type="submit" class="w-full btn-primary">保存</button>
      </form>
    </Modal>

    <!-- 朋友圈动态弹窗 -->
    <Modal :show="showMomentModal" title="添加朋友圈动态" @close="showMomentModal = false">
      <form @submit.prevent="handleAddMoment" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <textarea v-model="momentForm.content" required rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input v-model="momentForm.date" type="date" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
        <button type="submit" class="w-full btn-primary">保存</button>
      </form>
    </Modal>

    <!-- 财务往来弹窗 -->
    <Modal :show="showFinanceModal" title="记录财务往来" @close="showFinanceModal = false">
      <form @submit.prevent="handleAddFinance" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select v-model="financeForm.type" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="expense">我方投入</option>
            <option value="income">对方投入</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">金额</label>
          <input v-model.number="financeForm.amount" type="number" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">事项</label>
          <input v-model="financeForm.item" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input v-model="financeForm.date" type="date" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
        <button type="submit" class="w-full btn-primary">保存</button>
      </form>
    </Modal>

    <!-- 互动记录弹窗 -->
    <Modal :show="showInteractionModal" title="添加互动记录" @close="showInteractionModal = false">
      <form @submit.prevent="handleAddInteraction" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">互动类型</label>
          <select v-model="interactionForm.type" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="meeting">面谈</option>
            <option value="phone">电话</option>
            <option value="meal">商务餐</option>
            <option value="event">活动</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
          <textarea v-model="interactionForm.content" required rows="4" placeholder="记录互动内容，AI会自动生成摘要" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input v-model="interactionForm.date" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
        <button type="submit" class="w-full btn-primary">保存</button>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRelationStore } from '../stores/relations'
import Modal from '../components/Modal.vue'

const route = useRoute()
const store = useRelationStore()
const id = computed(() => route.params.id)
const relation = computed(() => store.currentRelation)

const showEventModal = ref(false)
const showMomentModal = ref(false)
const showFinanceModal = ref(false)

// 表单数据
const eventForm = ref({ type: 'birthday', date: '', note: '', reminder: false })
const momentForm = ref({ content: '', date: '' })
const financeForm = ref({ type: 'expense', amount: 0, item: '', date: '' })
const interactionForm = ref({ type: 'meeting', content: '', date: '' })
const showInteractionModal = ref(false)

// 处理函数
async function handleAddEvent() {
  await store.addEvent(id.value, eventForm.value)
  showEventModal.value = false
  eventForm.value = { type: 'birthday', date: '', note: '', reminder: false }
}

async function handleAddMoment() {
  await store.addMoment(id.value, momentForm.value)
  showMomentModal.value = false
  momentForm.value = { content: '', date: '' }
}

async function handleAddFinance() {
  await store.addFinance(id.value, financeForm.value)
  showFinanceModal.value = false
  financeForm.value = { type: 'expense', amount: 0, item: '', date: '' }
}

async function handleAddInteraction() {
  await store.addInteraction(id.value, interactionForm.value)
  showInteractionModal.value = false
  interactionForm.value = { type: 'meeting', content: '', date: '' }
}

const financeStats = computed(() => {
  if (!relation.value?.finance) return { totalIncome: 0, totalExpense: 0 }
  return {
    totalIncome: relation.value.finance.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0),
    totalExpense: relation.value.finance.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0)
  }
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

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatMonthDay(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}.${date.getDate()}`
}

function getEventTypeName(type) {
  const names = { birthday: '生日', anniversary: '纪念日', milestone: '里程碑', cooperation: '合作签约' }
  return names[type] || type
}

function getInteractionTypeName(type) {
  const names = { meeting: '面谈', phone: '电话', meal: '商务餐', event: '活动' }
  return names[type] || type
}

onMounted(() => {
  store.fetchRelation(id.value)
})
</script>

<style scoped>
.finance-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}
.finance-item.income { border-left: 3px solid #22c55e; }
.finance-item.expense { border-left: 3px solid #ef4444; }

.timeline-item {
  position: relative;
  padding-left: 20px;
  padding-bottom: 16px;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 4px;
  width: 8px;
  height: 8px;
  background: white;
  border: 2px solid #171717;
  border-radius: 50%;
}
.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: #e5e5e5;
}
</style>
