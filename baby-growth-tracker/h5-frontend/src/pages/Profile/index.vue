<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { id: 'children', name: '孩子管理', icon: '👶', right: '>' },
  { id: 'about', name: '关于我们', icon: 'ℹ️', right: '>' }
]

// 用户信息
const userInfo = computed(() => {
  const phone = localStorage.getItem('phone')
  const isAdmin = localStorage.getItem('isAdmin') === '1'
  return {
    phone: phone || '未登录',
    isAdmin
  }
})

// 登出
function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/login')
  }
}

</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- 头部 -->
    <header class="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4">
      <h1 class="text-xl font-bold">我的</h1>
    </header>

    <!-- 用户信息 -->
    <section class="p-4 bg-white border-b">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-primary-100 text-3xl flex items-center justify-center">
          👤
        </div>
        <div class="flex-1">
          <p class="font-semibold text-lg">{{ userInfo.isAdmin ? '管理员' : '用户' }}</p>
          <p class="text-sm text-muted">{{ userInfo.phone }}</p>
        </div>
        <button @click="handleLogout" class="text-primary-500 text-sm">
          登出
        </button>
      </div>
    </section>

    <!-- 家庭管理和孩子管理快捷入口 -->
    <section class="p-4">
      <router-link to="/family" class="card flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-blue-100 text-xl flex items-center justify-center">
          👨‍👩‍👧
        </div>
        <div class="flex-1">
          <p class="font-medium">家庭管理</p>
          <p class="text-sm text-muted">邀请家人加入</p>
        </div>
        <span class="text-gray-400">></span>
      </router-link>
      
      <router-link to="/children" class="card flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-yellow-100 text-xl flex items-center justify-center">
          👶
        </div>
        <div class="flex-1">
          <p class="font-medium">孩子管理</p>
          <p class="text-sm text-muted">添加/切换孩子</p>
        </div>
        <span class="text-gray-400">></span>
      </router-link>
    </section>

    <!-- 设置项 (已隐藏) -->
    <!-- 
    <section class="p-4">
      <h2 class="text-sm font-medium text-gray-500 mb-3">设置</h2>
      <div class="card space-y-4">
        消息通知
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">🔔</span>
            <span>消息通知</span>
          </div>
          <button
            @click="settings.notifications = !settings.notifications"
            class="w-12 h-6 rounded-full transition-colors"
            :class="settings.notifications ? 'bg-primary-500' : 'bg-gray-300'"
          >
            <div
              class="w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="settings.notifications ? 'translate-x-6' : 'translate-x-0'"
            ></div>
          </button>
        </div>

        自动备份
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">💾</span>
            <span>自动备份</span>
          </div>
          <button
            @click="settings.autoBackup = !settings.autoBackup"
            class="w-12 h-6 rounded-full transition-colors"
            :class="settings.autoBackup ? 'bg-primary-500' : 'bg-gray-300'"
          >
            <div
              class="w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="settings.autoBackup ? 'translate-x-6' : 'translate-x-0'"
            ></div>
          </button>
        </div>
      </div>
    </section>
    -->

    <!-- 菜单项 -->
    <section class="p-4">
      <div class="card space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.id"
          :to="`/${item.id}`"
          class="flex items-center justify-between py-3 border-b last:border-0"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </div>
          <span class="text-gray-400">{{ item.right }}</span>
        </router-link>
      </div>
    </section>

    <!-- 版本信息 -->
    <div class="text-center py-8 text-sm text-muted">
      <p>宝宝成长记录 v1.0.0</p>
      <p class="mt-1">© 2024 All Rights Reserved</p>
    </div>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center p-2 text-gray-500">
          <span class="text-xl">🏠</span>
          <span class="text-xs mt-1">首页</span>
        </router-link>
        <router-link to="/report" class="flex flex-col items-center p-2 text-gray-500">
          <span class="text-xl">📊</span>
          <span class="text-xs mt-1">报表</span>
        </router-link>
        <router-link to="/profile" class="flex flex-col items-center p-2 text-primary-500">
          <span class="text-xl">👤</span>
          <span class="text-xs mt-1">我的</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>
