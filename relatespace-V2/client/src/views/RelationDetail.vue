<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/" class="btn-secondary w-9 h-9 flex items-center justify-center">
            <i class="fas fa-arrow-left text-sm"></i>
          </router-link>
          <span class="text-sm text-gray-500 hidden sm:inline">返回列表</span>
        </div>
        <div class="flex items-center gap-2">
          <router-link :to="`/relation/edit/${id}`" class="btn-secondary px-3 py-2 flex items-center gap-1 text-sm">
            <i class="fas fa-edit text-xs"></i>
            <span class="hidden sm:inline">编辑</span>
          </router-link>
          <button @click="showChat = true" class="btn-primary px-3 py-2 flex items-center gap-1 text-sm">
            <i class="fas fa-plus text-xs"></i>
            <span>记录互动</span>
          </button>
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

      <!-- 教育经历 -->
      <div class="card-shadow rounded-xl p-5 mb-4">
        <div class="text-sm font-semibold mb-3 flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fas fa-graduation-cap text-gray-400"></i> 教育经历</span>
          <button @click="showEducationModal = true" class="text-xs text-blue-600">+ 添加</button>
        </div>
        <div class="space-y-3">
          <div v-for="edu in relationSchools" :key="edu.id" class="education-item">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-university text-blue-600"></i>
                </div>
                <div>
                  <div class="font-medium text-sm">{{ edu.schoolName }}</div>
                  <div class="text-xs text-gray-500">
                    {{ getDegreeName(edu.degree) }}
                    <span v-if="edu.major"> · {{ edu.major }}</span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">
                    {{ edu.startYear || '?' }} - {{ edu.endYear || '?' }}
                    <span v-if="edu.isPrimary" class="ml-2 text-blue-500">主学历</span>
                  </div>
                </div>
              </div>
              <button @click="deleteEducation(edu.id)" class="text-gray-400 hover:text-red-500 p-1">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div v-if="!relationSchools.length" class="text-center text-xs text-gray-400 py-4">
            暂无教育经历
          </div>
        </div>
      </div>

      <!-- 约定提醒 -->
      <div class="promise-card mb-4">
        <div class="promise-title">
          <i class="fas fa-handshake"></i>
          <span>待履行约定</span>
          <button @click="showPromiseModal = true" class="ml-auto text-xs bg-white/60 px-2 py-0.5 rounded">+ 添加</button>
        </div>
        <div v-for="promise in relation.promises" :key="promise.id" class="promise-item" :class="{ done: promise.completed }">
          <input type="checkbox" v-model="promise.completed" @change="togglePromise(promise)">
          <div class="flex-1">
            <label :class="{ 'line-through text-gray-400': promise.completed }">{{ promise.text }}</label>
            <div class="text-xs text-gray-400">约定于 {{ promise.dueDate || '待定' }}</div>
          </div>
          <button @click="deletePromise(promise.id)" class="text-gray-400 hover:text-red-500 text-xs ml-2">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="!relation.promises?.length" class="text-center text-xs text-amber-600 py-2">
          暂无约定
        </div>
      </div>

      <!-- 重要时刻 -->
      <div class="card-shadow rounded-lg p-4 mb-4" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
        <div class="text-sm font-semibold mb-3 flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fas fa-birthday-cake text-amber-600"></i> 重要时刻</span>
          <button @click="showEventModal = true" class="text-xs text-amber-700 bg-white/60 px-2 py-1 rounded">+ 添加</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="event in relation.events" :key="event.id" class="bg-white/80 rounded-lg p-3 relative">
            <button @click="deleteEvent(event.id)" class="absolute top-1 right-1 text-gray-400 hover:text-red-500 text-xs">
              <i class="fas fa-times"></i>
            </button>
            <div class="text-2xl font-bold text-amber-700">{{ formatMonthDay(event.date) }}</div>
            <div class="text-xs text-amber-600">{{ getEventTypeName(event.type) }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ event.note }}</div>
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
          <div v-for="moment in relation.moments" :key="moment.id" class="moment-card relative">
            <button @click="deleteMoment(moment.id)" class="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-1">
              <i class="fas fa-times"></i>
            </button>
            <div class="content">{{ moment.content }}</div>
            <div class="flex items-center gap-3 meta">
              <span v-if="moment.photos?.length"><i class="fas fa-image mr-1"></i> {{ moment.photos.length }}张照片</span>
              <span>{{ formatDate(moment.date) }}</span>
            </div>
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
            <div class="text-xs text-gray-400">礼尚往来</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500 mb-1">对方投入</div>
            <div class="text-lg font-bold text-green-500">¥{{ financeStats.totalIncome.toLocaleString() }}</div>
            <div class="text-xs text-gray-400">礼尚往来</div>
          </div>
        </div>
        <div class="space-y-2">
          <div v-for="item in relation.finance?.slice(0, 4)" :key="item.id"
               class="finance-item" :class="item.type">
            <div class="flex justify-between items-center">
              <div>
                <div class="text-sm font-medium">{{ item.item }}</div>
                <div class="text-xs text-gray-500">{{ item.note || formatDate(item.date) }}</div>
              </div>
              <div class="flex items-center gap-2">
                <div class="amount" :class="item.type === 'income' ? 'income' : 'expense'">
                  {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount.toLocaleString() }}
                </div>
                <button @click="deleteFinance(item.id)" class="text-gray-400 hover:text-red-500 text-xs">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="text-xs text-gray-400 mt-1">{{ formatDate(item.date) }}</div>
          </div>
          <div v-if="!relation.finance?.length" class="text-center text-xs text-gray-400 py-4">
            暂无财务记录
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 主内容 -->
        <div class="md:col-span-2 space-y-4">
          <!-- 基本信息 -->
          <div class="card-shadow rounded-lg p-5">
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
              <span class="text-xs text-gray-400">共{{ relation.interactions?.length || 0 }}次</span>
            </div>
            <div class="space-y-4">
              <div v-for="(interaction, index) in relation.interactions" :key="interaction.id" class="timeline-item relative">
                <button @click="deleteInteraction(interaction.id)" class="absolute top-0 right-0 text-gray-400 hover:text-red-500 p-1">
                  <i class="fas fa-times text-xs"></i>
                </button>
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span class="font-medium text-sm">{{ formatDate(interaction.createdAt) }} · {{ getInteractionTypeName(interaction.type) }}</span>
                  <span v-if="index === 0" class="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded">待跟进</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">{{ interaction.content }}</p>
                <!-- AI摘要 -->
                <div v-if="interaction.summary" class="ai-summary">
                  <div class="ai-summary-title">
                    <i class="fas fa-robot"></i> AI摘要
                  </div>
                  <p class="text-xs">{{ interaction.summary }}</p>
                </div>
                <!-- 约定提取 -->
                <div v-if="interaction.promises?.length" v-for="promise in interaction.promises" :key="promise.id" class="promise-extract">
                  <i class="fas fa-handshake mr-1"></i>
                  <strong>约定：</strong>{{ promise.text }}
                </div>
              </div>
              <div v-if="!relation.interactions?.length" class="text-center text-xs text-gray-400 py-4">
                暂无互动记录
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="space-y-4">
          <!-- 操作 -->
          <div class="card-shadow rounded-lg p-5">
            <div class="text-sm font-semibold mb-3 flex items-center gap-2">
              <i class="fas fa-cog text-gray-400"></i> 操作
            </div>
            <div class="space-y-1">
              <button @click="toggleImportant" class="w-full py-2 text-sm text-left text-gray-500 hover:text-gray-800">
                <i class="fas fa-star w-5 mr-2"></i>{{ relation.importance === 'high' ? '取消重要' : '标记重要' }}
              </button>
              <button @click="handleArchive" class="w-full py-2 text-sm text-left text-gray-500 hover:text-gray-800">
                <i class="fas fa-archive w-5 mr-2"></i>归档
              </button>
              <button @click="handleDelete" class="w-full py-2 text-sm text-left text-red-500 hover:text-red-600">
                <i class="fas fa-trash w-5 mr-2"></i>删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 加载状态 -->
    <div v-else class="flex items-center justify-center h-64">
      <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
    </div>

    <!-- AI聊天窗口 -->
    <div v-if="showChat" class="chat-window show">
      <div class="chat-header">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-white"></i>
          </div>
          <div>
            <h3 class="text-white font-medium">记录互动</h3>
            <p class="text-white/70 text-xs">{{ relation?.name }}</p>
          </div>
        </div>
        <button @click="showChat = false" class="text-white/80 p-2 -mr-2">
          <i class="fas fa-times text-lg"></i>
        </button>
      </div>
      <div class="chat-messages">
        <div v-for="(msg, index) in chatMessages" :key="index" class="chat-message" :class="msg.type">
          <div class="message-bubble">
            <p v-html="msg.text"></p>
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <input v-model="chatInput" @keypress.enter="sendChatMessage" type="text" class="chat-input" placeholder="描述互动内容...">
        <button @click="sendChatMessage" class="chat-send">
          <i class="fas fa-paper-plane text-sm"></i>
        </button>
      </div>
    </div>

    <!-- 悬浮按钮 -->
    <div v-if="!showChat" class="chat-fab" @click="showChat = true">
      <i class="fas fa-comment-dots text-xl"></i>
    </div>

    <!-- 添加朋友圈动态弹窗 -->
    <div v-if="showMomentModal" class="modal-overlay show" @click.self="showMomentModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="font-semibold">添加朋友圈动态</h3>
          <button @click="showMomentModal = false" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">动态内容</label>
            <textarea v-model="momentForm.content" rows="3" class="form-input" placeholder="描述这次互动或看到的动态..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">发生时间</label>
            <input type="date" v-model="momentForm.date" class="form-input">
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showMomentModal = false" class="flex-1 py-2 border rounded-lg text-gray-600">取消</button>
          <button @click="saveMoment" class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加财务记录弹窗 -->
    <div v-if="showFinanceModal" class="modal-overlay show" @click.self="showFinanceModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="font-semibold">记录财务往来</h3>
          <button @click="showFinanceModal = false" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">类型</label>
            <div class="flex gap-3">
              <button @click="financeForm.type = 'expense'" class="type-btn" :class="{ active: financeForm.type === 'expense' }">
                <i class="fas fa-arrow-up text-red-500 mb-1"></i>
                <div class="text-xs">我方支出</div>
              </button>
              <button @click="financeForm.type = 'income'" class="type-btn" :class="{ active: financeForm.type === 'income' }">
                <i class="fas fa-arrow-down text-green-500 mb-1"></i>
                <div class="text-xs">对方投入</div>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">金额 (元)</label>
            <input type="number" v-model="financeForm.amount" class="form-input" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">事项</label>
            <input type="text" v-model="financeForm.item" class="form-input" placeholder="商务宴请 / 礼品 / 回礼...">
          </div>
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="financeForm.category" class="form-input">
              <option value="gift">礼尚往来</option>
              <option value="business">商业资金</option>
              <option value="meal">商务餐</option>
              <option value="event">活动费用</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showFinanceModal = false" class="flex-1 py-2 border rounded-lg text-gray-600">取消</button>
          <button @click="saveFinance" class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加重要时刻弹窗 -->
    <div v-if="showEventModal" class="modal-overlay show" @click.self="showEventModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="font-semibold">添加重要时刻</h3>
          <button @click="showEventModal = false" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">类型</label>
            <select v-model="eventForm.type" class="form-input">
              <option value="birthday">生日</option>
              <option value="anniversary">纪念日</option>
              <option value="milestone">重要里程碑</option>
              <option value="cooperation">合作签约</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">日期</label>
            <input type="date" v-model="eventForm.date" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <input type="text" v-model="eventForm.note" class="form-input" placeholder="简要说明...">
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showEventModal = false" class="flex-1 py-2 border rounded-lg text-gray-600">取消</button>
          <button @click="saveEvent" class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加教育经历弹窗 -->
    <div v-if="showEducationModal" class="modal-overlay show" @click.self="showEducationModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="font-semibold">添加教育经历</h3>
          <button @click="showEducationModal = false" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">学校名称</label>
            <input type="text" v-model="educationForm.schoolName" class="form-input" placeholder="输入学校名称">
          </div>
          <div class="form-group">
            <label class="form-label">学历</label>
            <select v-model="educationForm.degree" class="form-input">
              <option value="">请选择</option>
              <option value="highSchool">高中</option>
              <option value="bachelor">本科</option>
              <option value="master">硕士</option>
              <option value="doctoral">博士</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">专业</label>
            <input type="text" v-model="educationForm.major" class="form-input" placeholder="输入专业（选填）">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">入学年份</label>
              <input type="number" v-model="educationForm.startYear" class="form-input" placeholder="2010">
            </div>
            <div class="form-group">
              <label class="form-label">毕业年份</label>
              <input type="number" v-model="educationForm.endYear" class="form-input" placeholder="2014">
            </div>
          </div>
          <div class="form-group">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="educationForm.isPrimary" class="w-4 h-4">
              <span class="text-sm">设为主学历</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showEducationModal = false" class="flex-1 py-2 border rounded-lg text-gray-600">取消</button>
          <button @click="saveEducation" class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">保存</button>
        </div>
      </div>
    </div>

    <!-- 添加约定弹窗 -->
    <div v-if="showPromiseModal" class="modal-overlay show" @click.self="showPromiseModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="font-semibold">添加约定</h3>
          <button @click="showPromiseModal = false" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">约定内容</label>
            <textarea v-model="promiseForm.text" rows="3" class="form-input" placeholder="描述约定内容..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">约定日期</label>
            <input type="date" v-model="promiseForm.dueDate" class="form-input">
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPromiseModal = false" class="flex-1 py-2 border rounded-lg text-gray-600">取消</button>
          <button @click="savePromise" class="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRelationStore } from '../stores/relations'
import { momentsAPI, financeAPI, eventsAPI, interactionsAPI, promisesAPI } from '../api'

const route = useRoute()
const router = useRouter()
const store = useRelationStore()

const id = computed(() => route.params.id)
const relation = computed(() => store.currentRelation)
const relationSchools = computed(() => store.currentRelationSchools)

// 弹窗状态
const showChat = ref(false)
const showMomentModal = ref(false)
const showFinanceModal = ref(false)
const showEventModal = ref(false)
const showEducationModal = ref(false)
const showPromiseModal = ref(false)

// 聊天
const chatInput = ref('')
const chatMessages = ref([
  { type: 'bot', text: '📝 请描述这次互动：<br><br>例如：今天下午和张总聊了2小时，讨论新能源合作，他答应下周给我反馈' }
])

// 表单
const momentForm = reactive({ content: '', date: new Date().toISOString().split('T')[0] })
const financeForm = reactive({ type: 'expense', amount: '', item: '', category: 'gift' })
const eventForm = reactive({ type: 'birthday', date: '', note: '' })
const educationForm = reactive({ schoolName: '', degree: '', major: '', startYear: '', endYear: '', isPrimary: false })
const promiseForm = reactive({ text: '', dueDate: '' })

// 财务统计
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

// 聊天发送
function sendChatMessage() {
  if (!chatInput.value.trim()) return
  
  chatMessages.value.push({ type: 'user', text: chatInput.value })
  const msg = chatInput.value
  chatInput.value = ''
  
  setTimeout(() => {
    const info = extractInfo(msg)
    const html = `<p>✅ 已记录到 <strong>${relation.value.name}</strong> 的互动历史</p>
      <div style="margin-top:10px;padding:12px;background:#f0f9ff;border-radius:10px">
        <div style="font-size:12px;font-weight:600;color:#0068d6;margin-bottom:8px"><i class="fas fa-robot"></i> AI自动摘要</div>
        <div style="font-size:12px;display:flex;justify-content:space;padding:4px 0"><span style="color:#666">日期</span><span>${info.date}</span></div>
        <div style="font-size:12px;display:flex;justify-content:space;padding:4px 0"><span style="color:#666">类型</span><span>${info.type}</span></div>
        <div style="font-size:12px;display:flex;justify-content:space;padding:4px 0"><span style="color:#666">摘要</span><span>${info.summary}</span></div>
      </div>
      <button onclick="window.confirmInteraction && window.confirmInteraction('${info.date}', '${info.type}', '${info.summary}', '${msg.replace(/'/g, "\\'")}')" class="confirm-btn">确认保存</button>`
    chatMessages.value.push({ type: 'bot', text: html })
  }, 800)
}

async function confirmInteraction(date, type, summary, content) {
  try {
    await interactionsAPI.create({
      relationId: id.value,
      content: content,
      summary: summary,
      type: type,
      date: date === '今天' ? new Date().toISOString().split('T')[0] : date === '昨天' ? new Date(Date.now() - 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    })
    window.location.reload()
  } catch (err) {
    alert('保存失败: ' + err.message)
  }
}

function extractInfo(msg) {
  return {
    date: msg.indexOf('今天') !== -1 ? '今天' : msg.indexOf('昨天') !== -1 ? '昨天' : '刚刚',
    type: msg.indexOf('吃饭') !== -1 ? '商务餐' : msg.indexOf('电话') !== -1 ? '电话' : '面谈',
    summary: msg.indexOf('合作') !== -1 ? '讨论合作机会' : '一般性沟通'
  }
}

// 保存朋友圈
async function saveMoment() {
  if (!momentForm.content) { alert('请输入动态内容'); return }
  try {
    await momentsAPI.create({ relationId: id.value, ...momentForm })
    showMomentModal.value = false
    store.fetchRelation(id.value)
  } catch (err) { alert('保存失败') }
}

// 保存财务
async function saveFinance() {
  if (!financeForm.amount || !financeForm.item) { alert('请填写金额和事项'); return }
  try {
    await financeAPI.create({ relationId: id.value, date: new Date().toISOString().split('T')[0], ...financeForm })
    showFinanceModal.value = false
    financeForm.amount = ''
    financeForm.item = ''
    store.fetchRelation(id.value)
  } catch (err) { alert('保存失败') }
}

// 全局函数供 onclick 调用
window.confirmInteraction = confirmInteraction

// 保存重要时刻
async function saveEvent() {
  if (!eventForm.date) { alert('请选择日期'); return }
  try {
    await eventsAPI.create({ relationId: id.value, ...eventForm })
    showEventModal.value = false
    eventForm.note = ''
    store.fetchRelation(id.value)
  } catch (err) { alert('保存失败') }
}

// 删除朋友圈
async function deleteMoment(momentId) {
  if (!confirm('确定要删除这条动态吗？')) return
  try {
    await momentsAPI.delete(momentId)
    store.fetchRelation(id.value)
  } catch (err) { alert('删除失败') }
}

// 删除财务记录
async function deleteFinance(financeId) {
  if (!confirm('确定要删除这条财务记录吗？')) return
  try {
    await financeAPI.delete(financeId)
    store.fetchRelation(id.value)
  } catch (err) { alert('删除失败') }
}

// 删除重要时刻
async function deleteEvent(eventId) {
  if (!confirm('确定要删除这条重要时刻吗？')) return
  try {
    await eventsAPI.delete(eventId)
    store.fetchRelation(id.value)
  } catch (err) { alert('删除失败') }
}

// 保存教育经历
async function saveEducation() {
  if (!educationForm.schoolName) { alert('请输入学校名称'); return }
  try {
    await store.addRelationSchool({
      relationId: id.value,
      schoolName: educationForm.schoolName,
      degree: educationForm.degree || null,
      major: educationForm.major || null,
      startYear: educationForm.startYear ? parseInt(educationForm.startYear) : null,
      endYear: educationForm.endYear ? parseInt(educationForm.endYear) : null,
      isPrimary: educationForm.isPrimary
    })
    showEducationModal.value = false
    resetEducationForm()
  } catch (err) { alert('保存失败') }
}

// 删除教育经历
async function deleteEducation(educationId) {
  if (!confirm('确定要删除这条教育经历吗？')) return
  try {
    await store.deleteRelationSchool(educationId, id.value)
  } catch (err) { alert('删除失败') }
}

// 删除互动历史
async function deleteInteraction(interactionId) {
  if (!confirm('确定要删除这条互动记录吗？')) return
  try {
    await interactionsAPI.delete(interactionId)
    store.fetchRelation(id.value)
  } catch (err) { alert('删除失败') }
}

function resetEducationForm() {
  educationForm.schoolName = ''
  educationForm.degree = ''
  educationForm.major = ''
  educationForm.startYear = ''
  educationForm.endYear = ''
  educationForm.isPrimary = false
}

function getDegreeName(degree) {
  const names = {
    highSchool: '高中',
    bachelor: '本科',
    master: '硕士',
    doctoral: '博士',
    other: '其他'
  }
  return names[degree] || degree || '学历'
}

// 保存约定
async function savePromise() {
  if (!promiseForm.text) { alert('请输入约定内容'); return }
  try {
    await promisesAPI.create({
      relationId: id.value,
      text: promiseForm.text,
      dueDate: promiseForm.dueDate || null,
      completed: false
    })
    showPromiseModal.value = false
    promiseForm.text = ''
    promiseForm.dueDate = ''
    store.fetchRelation(id.value)
  } catch (err) { alert('保存失败') }
}

// 删除约定
async function deletePromise(promiseId) {
  if (!confirm('确定要删除这条约定吗？')) return
  try {
    await promisesAPI.delete(promiseId)
    store.fetchRelation(id.value)
  } catch (err) { alert('删除失败') }
}

// 切换约定状态
async function togglePromise(promise) {
  try {
    await promisesAPI.update(promise.id, { ...promise, completed: promise.completed })
    store.fetchRelation(id.value)
  } catch (err) { alert('更新失败') }
}

// 操作
function toggleImportant() {
  store.updateRelation(id.value, { ...relation.value, importance: relation.value.importance === 'high' ? 'normal' : 'high' })
}

function handleArchive() {
  alert('归档功能开发中')
}

function handleDelete() {
  if (!confirm('确定要删除这个关系人吗？所有相关数据将被删除。')) return
  store.deleteRelation(id.value)
  router.push('/')
}

onMounted(() => {
  store.fetchRelation(id.value)
  store.fetchRelationSchools(id.value)
})
</script>

<style scoped>
/* 约定卡片 */
.promise-card {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 12px;
}
.promise-card .promise-title {
  font-size: 12px;
  color: #92400e;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.promise-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  margin-bottom: 6px;
}
.promise-item input { width: 18px; height: 18px; }

/* 财务 */
.finance-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}
.finance-item.income { border-left: 3px solid #22c55e; }
.finance-item.expense { border-left: 3px solid #ef4444; }
.finance-item .amount { font-size: 16px; font-weight: 600; }
.finance-item .amount.income { color: #16a34a; }
.finance-item .amount.expense { color: #dc2626; }

/* 朋友圈 */
.moment-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
}
.moment-card .content { font-size: 13px; line-height: 1.6; color: #374151; }
.moment-card .meta { font-size: 11px; color: #9ca3af; margin-top: 8px; }

/* AI摘要 */
.ai-summary {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 10px;
  margin-top: 8px;
}
.ai-summary-title {
  font-size: 11px;
  color: #0068d6;
  margin-bottom: 4px;
}
.ai-summary p { font-size: 12px; color: #666; }

/* 约定提取 */
.promise-extract {
  background: #fffbeb;
  border-radius: 6px;
  padding: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: #92400e;
}

/* 时间线 */
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
.chat-input-container {
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
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
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  z-index: 100;
}
@media (min-width: 641px) {
  .chat-fab { display: none; }
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-overlay.show { display: flex; }
.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-body { padding: 16px; }
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 10px;
}
.form-group { margin-bottom: 16px; }
.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  display: block;
}
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.form-input:focus { border-color: #667eea; }
.type-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.type-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 教育经历 */
.education-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}
</style>
