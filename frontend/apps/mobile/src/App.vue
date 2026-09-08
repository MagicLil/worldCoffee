<template>
  <div
    id="app-shell"
    class="min-h-screen bg-surface relative overflow-hidden transition-[padding] duration-300"
    :class="[
      { 'lg:pl-[224px]': showDesktopSidebar },
      isDesktop ? 'wc-mode-web' : 'wc-mode-mobile'
    ]"
  >
    <!-- 背景装饰：在桌面端显示，为页面增加品牌调性 -->
    <div class="hidden absolute inset-0 pointer-events-none -z-10">
      <div class="absolute -top-24 left-[10%] w-96 h-96 bg-amber/20 rounded-full blur-3xl animate-float" style="animation-delay: 0s" />
      <div class="absolute top-[40%] right-[5%] w-[28rem] h-[28rem] bg-ink/10 rounded-full blur-3xl animate-float" style="animation-delay: -2s" />
      <div class="absolute bottom-[-10%] left-[30%] w-80 h-80 bg-green/20 rounded-full blur-3xl animate-float" style="animation-delay: -4s" />
    </div>

    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.fullPath" />
    </router-view>

    <BottomNav v-if="showBottomNav" :notifCount="notifCount" :messageCount="messageCount" />

    <!-- Toast 容器 -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toastMessage"
          class="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-2xl shadow-[0_8px_32px_rgba(62,39,35,0.18)] backdrop-blur-xl flex items-center gap-2 max-w-[92vw] animate-toast-in"
          :class="toastType === 'success'
            ? 'bg-ink/92 text-white'
            : 'bg-[#EF4444]/95 text-white'"
          role="status"
          aria-live="polite"
        >
          <Icon
            :icon="toastType === 'success' ? 'material-symbols:check-circle-rounded' : 'material-symbols:error-outline'"
            class="w-5 h-5 shrink-0"
          />
          <span class="text-[13.5px] font-medium leading-snug">{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import { Icon } from '@iconify/vue'
import { notificationApi, messageApi, createSSESubscriber, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { useViewportMode } from '@wc/shared'

const router = useRouter()
const route = useRoute()
const { isDesktop, mode } = useViewportMode()
const notifCount = ref(0)
const messageCount = ref(0)

const hideNavRoutes = ['Login', 'Register', 'ChatRoom', 'AIChat', 'Cart', 'Orders', 'CouponCenter', 'ProductDetail']
const showBottomNav = computed(() => !hideNavRoutes.includes(route.name as string))
const noDesktopSidebarRoutes = ['Home', 'CreatePost', 'Messages', 'Notifications', 'Me', 'Shop']
const showDesktopSidebar = computed(() => showBottomNav.value && !noDesktopSidebarRoutes.includes(route.name as string))

// ─── SSE 全局连接 ───────────────────────────────
let sseClient = null
let sseReconnectTimer = null
let ssePollTimer = null
const SSE_MAX_RECONNECT = 5
const SSE_POLL_INTERVAL = 30000

const { isLoggedIn } = useAuth()

async function fetchNotifCount() {
  try {
    const res = await notificationApi.getUnreadCount()
    if (res && res.code === 200) notifCount.value = res.data || 0
  } catch (e) { /* ignore */ }
}

async function fetchMessageCount() {
  try {
    const res = await messageApi.getUnreadCount()
    if (res && res.code === 200) messageCount.value = res.data || 0
  } catch (e) { /* ignore */ }
}

function fetchAllCounts() {
  fetchNotifCount()
  fetchMessageCount()
}

function clearSseTimers() {
  if (sseReconnectTimer) { clearTimeout(sseReconnectTimer); sseReconnectTimer = null }
  if (ssePollTimer) { clearInterval(ssePollTimer); ssePollTimer = null }
}

function disconnectSSE() {
  if (sseClient) { try { sseClient.close() } catch (e) { /* ignore */ } sseClient = null }
  clearSseTimers()
}

function scheduleSseReconnect(attempts) {
  if (attempts >= SSE_MAX_RECONNECT) {
    if (!ssePollTimer) {
      fetchAllCounts()
      ssePollTimer = setInterval(fetchAllCounts, SSE_POLL_INTERVAL)
    }
    return
  }
  const delay = Math.min(3000 * Math.pow(1.5, attempts), 30000)
  sseReconnectTimer = setTimeout(() => {
    if (isLoggedIn.value) connectSSE(attempts + 1)
  }, delay)
}

function connectSSE(attempt = 0) {
  if (sseClient) { try { sseClient.close() } catch (e) { /* ignore */ } sseClient = null }
  clearSseTimers()

  const client = createSSESubscriber()
  if (!client) return
  sseClient = client

  client.onopen(() => { /* 连接成功 */ })

  client.onmessage((data) => {
    if (data && typeof data === 'string') {
      // 格式 1：字符串前缀 chat:{senderId} 或 message:{senderId}
      const trimmed = data.trim()
      if (trimmed.startsWith('chat:') || trimmed.startsWith('message:')) {
        messageCount.value = (Number(messageCount.value) || 0) + 1
        fetchMessageCount()
        return
      }
      // 格式 2：JSON 对象
      try {
        const payload = JSON.parse(data)
        if (payload) {
          // 私信：type = 'chat' 或 'message'
          const isChatMsg = payload.type === 'chat' || payload.type === 'message' || payload.messageType || payload.chat
          if (isChatMsg) {
            messageCount.value = (Number(messageCount.value) || 0) + 1
            fetchMessageCount()
            return
          }
          // 通知：type = 'new' 或带 unreadCount 字段
          if (payload.type === 'new') notifCount.value = (notifCount.value || 0) + 1
          else if (typeof payload.unreadCount === 'number') notifCount.value = payload.unreadCount
          else fetchNotifCount()
          try { window.dispatchEvent(new CustomEvent('sse-notification', { detail: { data, payload } })) } catch (e) { /* ignore */ }
          return
        }
      } catch (e) { /* 不是 JSON，继续下面的兜底 */ }
      // 格式 3：兜底 — 无法解析，刷新计数
      fetchNotifCount()
      fetchMessageCount()
    }
  })

  client.onerror(() => {
    if (sseClient === client) sseClient = null
    if (isLoggedIn.value) scheduleSseReconnect(attempt)
  })
}

// ─── 全局 Toast ───────────────────────────────
let toastTimer = null
const toastMessage = ref('')
const toastType = ref('success')

function showToast(msg, type = 'success', duration = 2500) {
  clearTimeout(toastTimer)
  toastMessage.value = msg
  toastType.value = type
  toastTimer = setTimeout(() => { toastMessage.value = '' }, duration)
}

function logoutAndToast(msg = '已退出登录') {
  const { logout } = useAuth()
  logout()
  notifCount.value = 0
  messageCount.value = 0
  disconnectSSE()
  showToast(msg)
  router.push('/login')
}

provide('toast', {
  show: showToast,
  refreshNotifCount: fetchNotifCount,
  notifCount,
  messageCount,
  refreshMessageCount: fetchMessageCount,
  logout: logoutAndToast,
  errorFromApi: getApiError
})

provide('viewportMode', {
  isDesktop,
  mode
})

// ─── 生命周期 ───────────────────────────────
onMounted(() => {
  if (isLoggedIn.value) { fetchAllCounts(); connectSSE() }
})

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) { fetchAllCounts(); if (!sseClient) connectSSE() }
  else { disconnectSSE(); notifCount.value = 0; messageCount.value = 0 }
})

onUnmounted(() => { disconnectSSE() })
</script>

<style>
/* 全局过渡与焦点可见性（无障碍） */

/* 页面切换 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.page-enter-from { opacity: 0; transform: translateY(12px); }
.page-leave-to   { opacity: 0; transform: translateY(-6px); }

/* Toast 过渡 */
.toast-enter-active { animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.toast-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.toast-leave-to { opacity: 0; transform: translate(-50%, -14px) scale(0.96); }
@keyframes toastIn {
  0%   { opacity: 0; transform: translate(-50%, -28px) scale(0.92); }
  60%  { transform: translate(-50%, 2px) scale(1.02); }
  100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
}

/* 点击态缩放（tap-scale） */
.tap-scale { transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1); }
.tap-scale:active { transform: scale(0.97); }

/* 无障碍：让键盘焦点环足够显眼，同时保留美感 */
:focus {
  outline: none;
}
:focus-visible {
  outline: 2px solid #D48A5D;
  outline-offset: 2px;
  border-radius: 6px;
}

/* 为按钮、链接设置统一的键盘焦点样式 */
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid #D48A5D;
  outline-offset: 2px;
  border-radius: 8px;
}

/* 让有输入框的 focus 态不会被浏览器默认样式覆盖 */
input, textarea {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 全局滚动条轻量化 */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(141, 110, 99, 0.25);
  border-radius: 99px;
  transition: background 0.2s ease;
}
::-webkit-scrollbar-thumb:hover { background: rgba(141, 110, 99, 0.45); }
</style>
