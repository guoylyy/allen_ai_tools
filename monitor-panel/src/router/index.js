import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Servers from '../views/Servers.vue'
import APM from '../views/APM.vue'
import Services from '../views/Services.vue'
import Costs from '../views/Costs.vue'
import Alerts from '../views/Alerts.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/servers', name: 'Servers', component: Servers },
  { path: '/apm', name: 'APM', component: APM },
  { path: '/services', name: 'Services', component: Services },
  { path: '/costs', name: 'Costs', component: Costs },
  { path: '/alerts', name: 'Alerts', component: Alerts },
  { path: '/settings', name: 'Settings', component: Settings }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
