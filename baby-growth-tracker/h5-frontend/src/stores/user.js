import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const currentChild = ref(null)
  const children = ref([])

  const isLoggedIn = computed(() => !!token.value)

  async function login(phone, code) {
    try {
      const res = await api.login({ phone, code })
      token.value = res.token
      localStorage.setItem('token', res.token)
      // 保存用户ID用于API请求识别
      localStorage.setItem('openid', res.user?.openid || phone)
      // 保存管理员状态
      localStorage.setItem('isAdmin', res.user?.is_admin === 1 ? '1' : '0')
      await fetchUserInfo()
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await api.getUserInfo()
      user.value = res
      children.value = res.children || []
      currentChild.value = res.currentChild || null
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  async function fetchChildren() {
    try {
      const res = await api.getChildren()
      children.value = res
      
      // 优先从后端获取当前孩子
      try {
        const currentChildData = await api.getCurrentChild()
        if (currentChildData) {
          currentChild.value = currentChildData
          localStorage.setItem('currentChildId', currentChildData.id)
        } else if (res.length > 0) {
          // 如果后端没有设置当前孩子，使用第一个并设置到后端
          currentChild.value = res[0]
          localStorage.setItem('currentChildId', res[0].id)
          await api.switchChild(res[0].id)
        }
      } catch (e) {
        // 如果获取当前孩子失败，使用本地存储或第一个孩子
        const savedChildId = localStorage.getItem('currentChildId')
        if (savedChildId) {
          const savedChild = res.find(c => c.id === parseInt(savedChildId))
          if (savedChild) {
            currentChild.value = savedChild
          } else if (res.length > 0) {
            currentChild.value = res[0]
            localStorage.setItem('currentChildId', res[0].id)
          }
        } else if (res.length > 0) {
          currentChild.value = res[0]
          localStorage.setItem('currentChildId', res[0].id)
        }
      }
    } catch (error) {
      console.error('获取孩子列表失败:', error)
    }
  }

  async function switchChild(childId) {
    try {
      await api.switchChild(childId)
      currentChild.value = children.value.find(c => c.id === childId)
      if (currentChild.value) {
        localStorage.setItem('currentChildId', currentChild.value.id)
      }
    } catch (error) {
      console.error('切换孩子失败:', error)
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    currentChild.value = null
    children.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('phone')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('openid')
  }

  return {
    user,
    token,
    currentChild,
    children,
    isLoggedIn,
    login,
    fetchUserInfo,
    fetchChildren,
    switchChild,
    logout
  }
})
