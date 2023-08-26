// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import(/* webpackChunkName: "home" */ '@/views/main.vue'),
    children: [
      {
        path: 'generation',
        component: () => import('@/components/generation.vue')
      },
      {
        path: 'account',
        component: () => import('@/components/account.vue')
      },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
