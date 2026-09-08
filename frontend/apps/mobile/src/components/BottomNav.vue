<template>
  <!-- 移动端底部导航 -->
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-50 pointer-events-none">
    <div class="mx-auto max-w-3xl px-0 pb-0">
      <div class="pointer-events-auto flex items-center justify-around gap-1 pt-1 pb-[max(env(safe-area-inset-bottom,0px),7px)] bg-surface-elevated/94 backdrop-blur-2xl border-t border-line/70">
        <router-link
          v-for="item in tabs"
          :key="item.path"
          :to="item.path"
          :class="[
            'bottom-nav-item relative flex items-center justify-center w-12 h-10 rounded-[16px] transition-all tap-scale',
            isActive(item.path)
              ? 'is-active'
              : 'text-ink-muted hover:text-ink hover:bg-surface-soft/70'
          ]"
          :aria-label="item.label"
          :title="item.label"
        >
          <Icon :icon="isActive(item.path) ? item.activeIcon : item.icon" class="w-[23px] h-[23px]" />
          <span
            v-if="item.badge && item.badge > 0"
            class="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 text-[9px] font-bold text-white rounded-full bg-[#EF4444] flex items-center justify-center shadow-[0_1px_3px_rgba(62,39,35,0.2)]"
          >
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
        </router-link>
      </div>
    </div>
  </nav>

  <!-- 桌面端 / 平板侧边栏 (md breakpoint) -->
  <aside
    v-if="showDesktopAside"
    class="wc-desktop-sidebar hidden lg:flex fixed inset-y-0 left-0 flex-col w-[224px] py-6 px-4 z-40"
  >
    <!-- Logo -->
    <router-link
      to="/"
      class="wc-sidebar-brand flex items-center gap-3 px-3 mb-6 transition-opacity"
    >
      <div class="wc-sidebar-logo w-10 h-10 rounded-xl flex items-center justify-center">
        <svg viewBox="0 0 40 40" class="w-6 h-6 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 14 Q8 12 10 12 L24 12 Q26 12 26 14 L25 28 Q25 32 21 32 L13 32 Q9 32 9 28 Z" fill="currentColor" opacity="0.95"/>
          <ellipse cx="17" cy="14" rx="8" ry="2" fill="#3E2723"/>
          <path d="M26 15 Q32 15 32 22 Q32 29 26 29" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <div class="text-[15px] font-black text-ink leading-tight tracking-tight">WorldCoffee</div>
        <div class="text-[10.5px] text-ink-muted mt-0.5 font-bold uppercase tracking-[0.08em]">coffee notes</div>
      </div>
    </router-link>

    <!-- 导航项 -->
    <nav class="flex flex-col gap-0.5">
      <router-link
        v-for="item in sideNavItems"
        :key="item.path"
        :to="item.path"
        :aria-label="item.label"
        :class="[
          'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all tap-scale',
          isActive(item.path)
            ? 'wc-sidebar-link-active text-ink'
            : 'text-ink-muted hover:text-ink'
        ]"
      >
        <Icon :icon="isActive(item.path) ? item.activeIcon : item.icon" class="w-5 h-5 shrink-0" />
        <span class="truncate">{{ item.label }}</span>
        <span
          v-if="item.badge && item.badge > 0"
          class="ml-auto min-w-[20px] h-5 px-1.5 text-[10.5px] font-bold text-white rounded-full bg-[#EF4444] flex items-center justify-center shadow-sm"
        >
          {{ item.badge > 99 ? '99+' : item.badge }}
        </span>
      </router-link>
    </nav>

    <!-- 底部用户信息 -->
    <div v-if="isLoggedIn" class="mt-auto pt-4">
      <div class="wc-sidebar-user flex items-center gap-3 p-3 rounded-2xl cursor-pointer tap-scale">
        <div class="w-9 h-9 rounded-2xl overflow-hidden avatar-gradient-light flex items-center justify-center text-white text-sm font-semibold shrink-0">
          <img v-if="userAvatar" :src="userAvatar" class="w-full h-full object-cover" @error="onAvatarError" />
          <span v-else>{{ userNameInitial }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[12.5px] font-semibold text-ink truncate">{{ userName }}</div>
          <div class="text-[10.5px] text-ink-muted truncate">欢迎回来</div>
        </div>
        <Icon icon="material-symbols:chevron-right" class="ml-auto w-4 h-4 text-ink-muted" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuth } from '@wc/shared'

const props = defineProps({
  notifCount: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 }
})

const route = useRoute()
const { isLoggedIn, user, avatar: authAvatar } = useAuth()

const activePath = computed(() => route.path)
const noDesktopAsideRoutes = ['Home', 'CreatePost', 'Messages', 'Notifications', 'Me', 'Shop']
const showDesktopAside = computed(() => !noDesktopAsideRoutes.includes(route.name as string))

function isActive(path) {
  if (activePath.value === path) return true
  if (path !== '/' && activePath.value.startsWith(path)) return true
  return false
}

function onAvatarError(e) { if (e.target) e.target.style.display = 'none' }

/** 导航项（badge 为角标数，可选） */
  interface NavItem { path: string; label: string; icon: string; activeIcon: string; badge?: number }

// 移动端
const tabs = computed(() => {
  const base: NavItem[] = [
    { path: '/', label: '首页', icon: 'material-symbols:home-outline', activeIcon: 'material-symbols:home' },
    { path: '/shop', label: '商城', icon: 'material-symbols:shopping-bag-outline', activeIcon: 'material-symbols:shopping-bag' }
  ]
  if (isLoggedIn.value) base.push({ path: '/create', label: '发布', icon: 'material-symbols:add-circle-outline', activeIcon: 'material-symbols:add-circle' })
  if (isLoggedIn.value) base.push({
    path: '/messages',
    label: '消息',
    icon: 'material-symbols:chat-outline',
    activeIcon: 'material-symbols:chat',
    badge: (Number(props.notifCount) || 0) + (Number(props.messageCount) || 0)
  })
  base.push({ path: '/me', label: '我的', icon: 'material-symbols:person-outline', activeIcon: 'material-symbols:person' })
  return base
})

// 桌面端 / 平板侧边栏
const sideNavItems = computed(() => {
  const items: NavItem[] = [
    { path: '/', label: '首页', icon: 'material-symbols:home-outline', activeIcon: 'material-symbols:home' },
    { path: '/shop', label: '商城', icon: 'material-symbols:shopping-bag-outline', activeIcon: 'material-symbols:shopping-bag' }
  ]
  if (isLoggedIn.value) {
    items.push({ path: '/create', label: '发布新帖', icon: 'material-symbols:edit-note-outline', activeIcon: 'material-symbols:edit-note' })
    items.push({ path: '/messages', label: '私信', icon: 'material-symbols:chat-outline', activeIcon: 'material-symbols:chat', badge: props.messageCount })
    items.push({ path: '/notifications', label: '消息中心', icon: 'material-symbols:notifications-outline', activeIcon: 'material-symbols:notifications', badge: props.notifCount })
    items.push({ path: '/shop/cart', label: '购物车', icon: 'material-symbols:shopping-cart-outline', activeIcon: 'material-symbols:shopping-cart' })
    items.push({ path: '/shop/orders', label: '我的订单', icon: 'material-symbols:receipt-long-outline', activeIcon: 'material-symbols:receipt-long' })
    items.push({ path: '/me', label: '个人中心', icon: 'material-symbols:person-outline', activeIcon: 'material-symbols:person' })
  }
  return items
})
</script>

<style scoped>
.wc-desktop-sidebar {
  background:
    radial-gradient(circle at 12% 0%, rgba(238, 194, 123, .16), transparent 34%),
    color-mix(in srgb, var(--bg-elevated) 86%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
  box-shadow: 10px 0 30px rgba(62, 39, 35, .045);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.wc-sidebar-brand {
  border-radius: 20px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.wc-sidebar-brand:hover {
  background: color-mix(in srgb, var(--accent-cream) 42%, transparent);
}
.wc-sidebar-logo {
  color: #FFF8E1;
  background: linear-gradient(135deg, #A66A43, #3E2723);
  box-shadow: 0 10px 22px rgba(109, 76, 65, .22);
}
nav a {
  border: 1px solid transparent;
}
nav a:hover {
  background: color-mix(in srgb, var(--accent-cream) 42%, transparent);
  border-color: color-mix(in srgb, var(--border) 42%, transparent);
}
.wc-sidebar-link-active {
  background: linear-gradient(135deg, rgba(238, 194, 123, .30), rgba(245, 230, 211, .72));
  border-color: rgba(109, 76, 65, .10);
  font-weight: 800;
}
.wc-sidebar-user {
  background: color-mix(in srgb, var(--bg-secondary) 68%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 64%, transparent);
  box-shadow: 0 10px 24px rgba(62, 39, 35, .055);
}
.wc-sidebar-user:hover {
  background: color-mix(in srgb, var(--accent-cream) 48%, transparent);
}
:root.dark .wc-sidebar-link-active {
  background: rgba(245, 230, 211, .10);
}
</style>
