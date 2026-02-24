<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'

const router = useRouter()
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const imageInput = ref(null)
const isRecording = ref(false)

// 消息类型
const messageTypes = {
  USER: 'user',
  BOT: 'bot',
  IMAGE: 'image',
  SYSTEM: 'system'
}

// 添加消息到列表
function addMessage(type, content, data = null) {
  messages.value.push({
    id: Date.now(),
    type,
    content,
    data,
    timestamp: new Date()
  })
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  const text = inputMessage.value.trim()
  inputMessage.value = ''
  
  // 添加用户消息
  addMessage(messageTypes.USER, text)
  
  // 设置加载状态
  isLoading.value = true
  addMessage(messageTypes.BOT, '正在分析...')
  
  try {
    // 调用后端接口处理自然语言
    const data = await api.processChatMessage({ message: text })
    
    // 移除"正在分析"消息
    messages.value.pop()
    
    // 添加处理结果
    addMessage(messageTypes.BOT, data.message || '数据已记录', data)
  } catch (error) {
    console.error('处理消息失败:', error)
    messages.value.pop()
    addMessage(messageTypes.BOT, '处理失败，请重试。')
  } finally {
    isLoading.value = false
  }
}

// 处理图片选择
function handleImageSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // 创建图片预览
  const reader = new FileReader()
  reader.onload = (e) => {
    // 添加用户图片消息
    addMessage(messageTypes.IMAGE, e.target.result, { file })
    
    // 提示图片已收到
    addMessage(messageTypes.BOT, '照片已收到，正在处理...', { uploading: true })
  }
  reader.readAsDataURL(file)
  
  // 清空 input
  event.target.value = ''
}

// 触发图片选择
function selectImage() {
  imageInput.value?.click()
}

// 快捷输入模板
const quickTemplates = [
  { text: '睡觉', icon: '🌙', example: '今日睡觉，下午3点到4点' },
  { text: '吃奶', icon: '🍼', example: '上午9点，吃奶90ml' },
  { text: '吃饭', icon: '🍚', example: '中午12点，吃米饭和蔬菜' },
  { text: '玩耍', icon: '🧸', example: '下午3点到4点，玩积木' },
  { text: '学习', icon: '📚', example: '今天学了5个汉字' }
]

// 使用模板
function useTemplate(template) {
  inputMessage.value = template.example
  document.querySelector('.chat-input')?.focus()
}

// 格式化时间显示
function formatTime(date) {
  return new Date(date).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 获取消息样式类
function getMessageClass(message) {
  if (message.type === messageTypes.USER) {
    return 'bg-primary-500 text-white ml-auto'
  }
  return 'bg-white text-gray-800 mr-auto'
}

onMounted(() => {
  // 初始化欢迎消息
  addMessage(messageTypes.BOT, '你好！我是你的记录助手。可以告诉我：\n\n🌙 「今日睡觉，下午3点到4点」\n🍼 「上午9点，吃奶90ml」\n🍚 「中午12点，吃米饭和蔬菜」\n\n也可以拍照记录宝宝的成长瞬间！📸')
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- 头部 -->
    <header class="bg-white border-b sticky top-0 z-10">
      <div class="flex items-center p-4">
        <button @click="router.back()" class="text-gray-600">
          <span class="text-xl">←</span>
        </button>
        <h1 class="flex-1 text-center font-semibold">聊天记录</h1>
        <div class="w-8"></div>
      </div>
    </header>

    <!-- 消息区域 -->
    <div 
      ref="messagesContainer" 
      class="flex-1 overflow-y-auto p-4 space-y-4"
      style="padding-bottom: 140px;"
    >
      <!-- 消息列表 -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex flex-col max-w-[80%]"
        :class="message.type === messageTypes.USER ? 'items-end ml-auto' : 'items-start'"
      >
        <!-- 时间戳 -->
        <span class="text-xs text-gray-400 mb-1">{{ formatTime(message.timestamp) }}</span>
        
        <!-- 消息内容 -->
        <div
          class="rounded-2xl px-4 py-2 shadow-sm"
          :class="getMessageClass(message)"
        >
          <!-- 图片消息 -->
          <template v-if="message.type === messageTypes.IMAGE">
            <img 
              :src="message.content" 
              class="max-w-[200px] rounded-lg" 
              alt="用户上传"
            />
          </template>
          
          <!-- 文本消息 -->
          <template v-else>
            <p class="whitespace-pre-wrap">{{ message.content }}</p>
            
            <!-- 结构化数据展示 -->
            <div 
              v-if="message.data && (message.data.type || message.data.recorded_at)"
              class="mt-2 p-2 bg-black/10 rounded-lg text-sm"
            >
              <div v-if="message.data.type" class="flex items-center gap-2">
                <span class="font-medium">类型：</span>
                <span>{{ message.data.typeName || message.data.type }}</span>
              </div>
              <div v-if="message.data.recorded_at" class="flex items-center gap-2">
                <span class="font-medium">时间：</span>
                <span>{{ new Date(message.data.recorded_at).toLocaleString() }}</span>
              </div>
              <div v-if="message.data.duration" class="flex items-center gap-2">
                <span class="font-medium">时长：</span>
                <span>{{ message.data.duration }}分钟</span>
              </div>
              <div v-if="message.data.amount" class="flex items-center gap-2">
                <span class="font-medium">量：</span>
                <span>{{ message.data.amount }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 加载指示器 -->
      <div v-if="isLoading" class="flex items-center gap-2 text-gray-400">
        <span class="text-sm">正在处理...</span>
      </div>
    </div>

    <!-- 快捷输入模板 -->
    <div 
      v-if="messages.length <= 2"
      class="bg-white border-t p-3"
    >
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="template in quickTemplates"
          :key="template.text"
          @click="useTemplate(template)"
          class="flex-shrink-0 px-3 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <span class="mr-1">{{ template.icon }}</span>
          {{ template.text }}
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t p-3 pb-6">
      <div class="flex items-end gap-2 max-w-4xl mx-auto">
        <!-- 输入框 -->
        <div class="flex-1 relative">
          <textarea
            v-model="inputMessage"
            @keydown.enter.exact.prevent="sendMessage"
            placeholder="输入记录内容..."
            class="chat-input w-full px-4 py-2.5 pr-12 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows="1"
            style="min-height: 44px; max-height: 100px;"
          ></textarea>
        </div>
        
        <!-- 发送按钮 -->
        <button
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isLoading"
          class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
        >
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  font-size: 16px;
}
</style>
