<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { api } from '@/api'
import { validatePhone } from '@/utils'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 登录方式: 'code' 验证码登录, 'password' 密码登录
const loginMethod = ref('password')
const phone = ref('')
const password = ref('')
const code = ref('')
const codeCountdown = ref(0)
const isSendingCode = ref(false)
const isLoggingIn = ref(false)
const error = ref('')

// 激活状态
const needsActivation = ref(false)
const showActivateConfirm = ref(false)
const activateInfo = ref(null)

// 检查是否有邀请链接参数
onMounted(() => {
  const { phone: invitePhone, password: invitePassword, invite } = route.query
  
  if (invitePhone && invitePassword && invite) {
    // 解码邀请参数
    try {
      phone.value = atob(invitePhone)
      password.value = atob(invitePassword)
      loginMethod.value = 'password'
      
      // 预填激活信息
      activateInfo.value = {
        phone: phone.value,
        inviteCode: invite
      }
      showActivateConfirm.value = true
    } catch (e) {
      console.error('邀请链接解析失败:', e)
    }
  }
})

// 发送验证码
async function sendCode() {
  if (!validatePhone(phone.value)) {
    error.value = '请输入正确的手机号'
    return
  }
  
  isSendingCode.value = true
  // 模拟发送验证码
  await new Promise(resolve => setTimeout(resolve, 1000))
  codeCountdown.value = 60
  const timer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  isSendingCode.value = false
}

// 验证码登录
async function loginByCode() {
  error.value = ''
  
  if (!validatePhone(phone.value)) {
    error.value = '请输入正确的手机号'
    return
  }
  
  if (!code.value || code.value.length < 4) {
    error.value = '请输入验证码'
    return
  }
  
  isLoggingIn.value = true
  const result = await userStore.login(phone.value, code.value)
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.message || '登录失败'
  }
  
  isLoggingIn.value = false
}

// 密码登录
async function loginByPassword() {
  error.value = ''
  
  if (!validatePhone(phone.value)) {
    error.value = '请输入正确的手机号'
    return
  }
  
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  
  isLoggingIn.value = true
  
  try {
    const result = await api.loginByPhone({
      phone: phone.value,
      password: password.value
    })
    
    // 保存登录信息
    localStorage.setItem('token', result.token)
    localStorage.setItem('phone', phone.value)
    // 保存用户ID用于API请求识别
    localStorage.setItem('openid', result.user?.openid || result.user?.phone || phone.value)
    // 保存管理员状态（优先使用result.isAdmin，其次使用result.user.is_admin）
    const isAdmin = result.isAdmin || (result.user?.is_admin === 1)
    localStorage.setItem('isAdmin', isAdmin ? '1' : '0')
    
    router.push('/')
  } catch (err) {
    error.value = err.message || '登录失败'
  } finally {
    isLoggingIn.value = false
  }
}

// 确认激活
async function confirmActivate() {
  isLoggingIn.value = true
  
  try {
    await api.activateByInvite({
      phone: activateInfo.value.phone,
      password: password.value,
      inviteCode: activateInfo.value.inviteCode
    })
    
    showActivateConfirm.value = false
    
    // 自动登录
    await loginByPassword()
  } catch (err) {
    error.value = err.message || '激活失败'
  } finally {
    isLoggingIn.value = false
  }
}

// 切换登录方式
function toggleLoginMethod() {
  loginMethod.value = loginMethod.value === 'code' ? 'password' : 'code'
  error.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-green-500 to-green-600 flex flex-col">
    <!-- Logo 和标题 -->
    <div class="flex-1 flex flex-col items-center justify-center p-8">
      <div class="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-lg">
        <span class="text-5xl">👶</span>
      </div>
      <h1 class="text-2xl font-bold text-white mb-2">宝宝成长记录</h1>
      <p class="text-white/80 text-center">记录宝宝成长的每一个瞬间</p>
    </div>

    <!-- 激活确认弹窗 -->
    <div
      v-if="showActivateConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl w-full max-w-sm p-4">
        <h3 class="font-semibold text-lg mb-2">账号激活</h3>
        <p class="text-gray-600 mb-4">
          您正在激活账号 <strong>{{ activateInfo?.phone }}</strong>
        </p>
        <p class="text-sm text-gray-500 mb-4">
          点击确认后即可激活并登录账号
        </p>
        <div class="flex gap-3">
          <button
            @click="showActivateConfirm = false"
            class="flex-1 px-4 py-2 border rounded-lg text-gray-600"
          >
            取消
          </button>
          <button
            @click="confirmActivate"
            :disabled="isLoggingIn"
            class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            {{ isLoggingIn ? '激活中...' : '确认激活' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="bg-white rounded-t-3xl p-6">
      <!-- 切换登录方式 -->
      <div class="flex mb-6">
        <button
          @click="loginMethod = 'code'"
          class="flex-1 pb-2 border-b-2 transition-colors"
          :class="loginMethod === 'code' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'"
        >
          验证码登录
        </button>
        <button
          @click="loginMethod = 'password'"
          class="flex-1 pb-2 border-b-2 transition-colors"
          :class="loginMethod === 'password' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400'"
        >
          密码登录
        </button>
      </div>

      <!-- 手机号输入 -->
      <div class="mb-4">
        <div class="flex items-center border rounded-lg px-4 py-3">
          <span class="text-gray-500 mr-2">+86</span>
          <input
            v-model="phone"
            type="tel"
            placeholder="请输入手机号"
            maxlength="11"
            class="flex-1 focus:outline-none"
          />
        </div>
      </div>

      <!-- 验证码登录 -->
      <template v-if="loginMethod === 'code'">
        <div class="mb-4">
          <div class="flex items-center border rounded-lg px-4 py-3">
            <input
              v-model="code"
              type="text"
              placeholder="请输入验证码"
              maxlength="6"
              class="flex-1 focus:outline-none"
            />
            <button
              @click="sendCode"
              :disabled="codeCountdown > 0 || isSendingCode"
              class="text-green-500 text-sm whitespace-nowrap"
              :class="{ 'text-gray-400': codeCountdown > 0 }"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>
      </template>

      <!-- 密码登录 -->
      <template v-else>
        <div class="mb-4">
          <div class="flex items-center border rounded-lg px-4 py-3">
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="flex-1 focus:outline-none"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">初始密码为 123456</p>
        </div>
      </template>

      <!-- 错误提示 -->
      <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>

      <!-- 登录按钮 -->
      <button
        @click="loginMethod === 'code' ? loginByCode() : loginByPassword()"
        :disabled="isLoggingIn"
        class="btn btn-primary btn-block py-3 bg-green-500"
        :class="{ 'opacity-50': isLoggingIn }"
      >
        {{ isLoggingIn ? '登录中...' : '登录' }}
      </button>

      <!-- 服务协议 -->
      <p class="text-center text-sm text-gray-400 mt-4">
        登录即表示同意
        <a href="#" class="text-green-500">服务协议</a>
        和
        <a href="#" class="text-green-500">隐私政策</a>
      </p>
    </div>
  </div>
</template>
