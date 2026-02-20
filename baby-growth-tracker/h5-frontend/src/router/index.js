import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home/index.vue'),
    meta: { title: '宝宝成长', requiresAuth: true }
  },
  {
    path: '/chat-record',
    name: 'ChatRecord',
    component: () => import('@/pages/ChatRecord/index.vue'),
    meta: { title: '聊天记录', requiresAuth: true }
  },
  {
    path: '/album',
    name: 'Album',
    component: () => import('@/pages/Album/index.vue'),
    meta: { title: '相册', requiresAuth: true }
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/pages/Report/index.vue'),
    meta: { title: '报表', requiresAuth: true }
  },
  {
    path: '/family',
    name: 'Family',
    component: () => import('@/pages/Family/index.vue'),
    meta: { title: '家族成员', requiresAuth: true }
  },
  {
    path: '/children',
    name: 'Children',
    component: () => import('@/pages/Children/index.vue'),
    meta: { title: '孩子管理', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile/index.vue'),
    meta: { title: '我的', requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound/index.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '宝宝成长'
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token') || localStorage.getItem('openid')
    if (!token) {
      // 未登录，跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  next()
})

export default router
