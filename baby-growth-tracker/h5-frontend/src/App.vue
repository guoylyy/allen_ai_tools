<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 底部 tab 配置
const tabs = [
  { id: 'home', name: '首页', path: '/', icon: '🏠' },
  { id: 'album', name: '相册', path: '/album', icon: '📷' },
  { id: 'report', name: '报表', path: '/report', icon: '📊' },
  { id: 'profile', name: '我的', path: '/profile', icon: '👤' }
]

// 当前激活的 tab
const activeTab = ref('/')

// 监听路由变化，更新 activeTab
watch(() => route.path, (newPath) => {
  const tab = tabs.find(t => t.path === newPath)
  if (tab) {
    activeTab.value = tab.id
  }
}, { immediate: true })

// 切换 tab
function switchTab(path) {
  router.push(path)
}

// 要隐藏底部导航的页面
const hideBottomNavPaths = ['/chat-record']
const showBottomNav = computed(() => !hideBottomNavPaths.includes(route.path))
</script>

<template>
  <div class="min-h-screen" :class="showBottomNav ? 'pb-16' : ''">
    <router-view />
    
    <!-- 底部导航 -->
    <nav v-if="showBottomNav" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div class="flex justify-around py-2">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="switchTab(tab.path)"
          class="flex flex-col items-center p-2"
          :class="activeTab === tab.id ? 'text-primary-500' : 'text-gray-500'"
        >
          <span class="text-lg">{{ tab.icon }}</span>
          <span class="text-xs mt-1">{{ tab.name }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
</style>