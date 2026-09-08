import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { title: '管理员登录' }
  },
  {
    path: '/',
    component: () => import('../layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        component: () => import('../views/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'products',
        component: () => import('../views/ProductManagement.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'orders',
        component: () => import('../views/OrderManagement.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'marketing',
        component: () => import('../views/MarketingManagement.vue'),
        meta: { title: '营销管理' }
      },
      {
        path: 'moderation',
        component: () => import('../views/ModerationManagement.vue'),
        meta: { title: '举报审核' }
      },
      {
        path: 'governance',
        component: () => import('../views/GovernanceManagement.vue'),
        meta: { title: '内容治理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }
  document.title = to.meta.title ? `${to.meta.title} - World Coffee 管理后台` : 'World Coffee 管理后台'
  next()
})

export default router
