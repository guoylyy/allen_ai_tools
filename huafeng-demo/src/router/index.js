import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Orders from '../views/Orders.vue'
import WorkOrders from '../views/WorkOrders.vue'
import Products from '../views/Products.vue'
import Workers from '../views/Workers.vue'
import Processes from '../views/Processes.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/orders', name: 'Orders', component: Orders },
  { path: '/work-orders', name: 'WorkOrders', component: WorkOrders },
  { path: '/products', name: 'Products', component: Products },
  { path: '/workers', name: 'Workers', component: Workers },
  { path: '/processes', name: 'Processes', component: Processes },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
