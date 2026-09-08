import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getToken } from '@wc/shared'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/create',
    name: 'CreatePost',
    component: () => import('../views/CreatePost.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: () => import('../views/PostDetail.vue'),
    props: true
  },
  {
    path: '/me',
    name: 'Me',
    component: () => import('../views/me/Me.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings/account',
    name: 'AccountManage',
    component: () => import('../views/AccountManage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue'),
    props: true
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/notifications/Notifications.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/messages/Messages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/chat/:userId',
    name: 'ChatRoom',
    component: () => import('../views/ChatRoom.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('../views/shop/Shop.vue')
  },
  {
    path: '/shop/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue'),
    props: true
  },
  {
    path: '/shop/cart',
    name: 'Cart',
    component: () => import('../views/cart/Cart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/shop/orders',
    name: 'Orders',
    component: () => import('../views/orders/Orders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/shop/payment/:orderId',
    name: 'Payment',
    component: () => import('../views/Payment.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/shop/coupons',
    name: 'CouponCenter',
    component: () => import('../views/CouponCenter.vue')
  },
  {
    path: '/ai-chat',
    name: 'AIChat',
    component: () => import('../views/ai-chat/AIChat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  }
})

router.beforeEach((to, from, next) => {
  const token = getToken()

  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  if ((to.name === 'Login' || to.name === 'Register') && token) {
    return next('/')
  }

  next()
})

export default router
