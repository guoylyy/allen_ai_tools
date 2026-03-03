import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Orders from '../views/Orders.vue'
import Workers from '../views/Workers.vue'
import Report from '../views/Report.vue'
import Stats from '../views/Stats.vue'
import BossBoard from '../views/BossBoard.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { title: '进度看板' } },
  { path: '/orders', name: 'Orders', component: Orders, meta: { title: '生产排单' } },
  { path: '/workers', name: 'Workers', component: Workers, meta: { title: '员工管理' } },
  { path: '/report', name: 'Report', component: Report, meta: { title: '扫码报工' } },
  { path: '/stats', name: 'Stats', component: Stats, meta: { title: '效率统计' } },
  { path: '/boss', name: 'BossBoard', component: BossBoard, meta: { title: '老板看板' } }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
