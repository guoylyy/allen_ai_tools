import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/relation/:id',
    name: 'RelationDetail',
    component: () => import('../views/RelationDetail.vue')
  },
  {
    path: '/relation/new',
    name: 'NewRelation',
    component: () => import('../views/NewRelation.vue')
  },
  {
    path: '/relation/edit/:id',
    name: 'EditRelation',
    component: () => import('../views/EditRelation.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
