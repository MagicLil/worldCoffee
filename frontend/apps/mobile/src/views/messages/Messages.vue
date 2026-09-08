<template>
  <div class="wc-message-page min-h-screen pb-24">
    <header class="wc-message-header sticky top-0 z-40">
      <div class="max-w-[1120px] mx-auto px-4 h-16 flex items-center gap-3">
        <button class="wc-message-icon-btn tap-scale" type="button" aria-label="返回首页" @click="goHome">
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-ink-soft" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-[15px] font-black text-ink tracking-tight">消息</h1>
          <p class="hidden sm:block text-[10.5px] text-ink-muted mt-0.5">私信会话和互动通知都在这里</p>
        </div>
        <button class="wc-message-icon-btn relative tap-scale" type="button" aria-label="通知中心" @click="goNotifications">
          <Icon icon="material-symbols:notifications-outline" class="w-5 h-5 text-ink-soft" />
          <span
            v-if="notifBadge > 0"
            class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[9.5px] font-bold rounded-full flex items-center justify-center shadow-sm"
            style="background: #EF4444; color: var(--text-inverse, #fff);"
          >
            {{ notifBadge > 99 ? '99+' : notifBadge }}
          </span>
        </button>
      </div>
    </header>

    <main class="wc-message-main max-w-[1120px] mx-auto px-4 pt-6">
      <section class="wc-message-hero">
        <div>
          <p class="wc-message-eyebrow">WORLDCOFFEE INBOX</p>
          <h2>消息工作台</h2>
          <p>私信是你和其他用户的一对一聊天；消息中心负责点赞、评论、收藏、关注这些互动提醒。</p>
        </div>
        <div class="wc-message-tabs">
          <button class="wc-message-tab is-active" type="button">
            <Icon icon="material-symbols:chat-outline" class="w-4 h-4" />
            私信
          </button>
          <button class="wc-message-tab" type="button" @click="goNotifications">
            <Icon icon="material-symbols:notifications-outline" class="w-4 h-4" />
            消息中心
            <span v-if="notifBadge > 0" class="wc-message-tab-badge">{{ notifBadge > 99 ? '99+' : notifBadge }}</span>
          </button>
        </div>
      </section>

      <section class="wc-message-layout">
        <div class="wc-message-list">
          <button class="wc-conversation-card wc-ai-card animate-fade-up tap-scale text-left" type="button" @click="openAIChat">
            <div class="flex items-center gap-3">
              <div class="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-surface-soft">
                <WorldCoffeeAiLogo :size="48" />
                <span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 drop-shadow-sm">
                    <path d="M8 1 L9.2 5.5 L13.5 7 L9.2 8.5 L8 13 L6.8 8.5 L2.5 7 L6.8 5.5 Z" fill="#FFD54F" stroke="#F9A825" stroke-width="0.5" />
                  </svg>
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-[14.5px] font-semibold text-ink truncate flex items-center gap-1.5">
                  magic 助手
                  <span class="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-coffee-brown/15 text-coffee-brown">magic</span>
                </span>
                <p class="text-[12.5px] mt-1 text-ink-muted truncate">搜商品 · 找帖子 · 解答咖啡问题 ☕</p>
              </div>
            </div>
          </button>

          <div v-if="loading" class="space-y-3">
            <div v-for="i in 5" :key="i" class="wc-conversation-card flex items-center gap-3 animate-pulse">
              <div class="skeleton w-12 h-12 rounded-2xl shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="skeleton h-4 w-24 rounded" />
                <div class="skeleton h-3 w-40 rounded" />
              </div>
            </div>
          </div>

          <div v-else-if="!sessions.length" class="wc-empty-card text-center animate-fade-up">
            <div class="flex justify-center mb-4">
              <WorldCoffeeLogo size="md" />
            </div>
            <h3 class="text-base font-bold text-ink mb-1.5">暂无其他消息</h3>
            <p class="text-[13px] text-ink-muted mb-5">去首页看看其他用户，开启一段咖啡对话吧 ☕</p>
            <button
              type="button"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-semibold shadow-sm tap-scale"
              style="background: linear-gradient(135deg, var(--coffee-brown, #6D4C41), var(--coffee-bean, #2C1810)); color: var(--text-inverse, #fff); box-shadow: 0 4px 14px rgba(109,76,65,0.25);"
              @click="goHome"
            >
              <Icon icon="material-symbols:explore" class="w-4 h-4" />
              去首页发现
            </button>
          </div>

          <div v-else class="wc-session-stack animate-fade-up">
            <button
              v-for="(session, idx) in sessions"
              :key="session.userId || session.id || idx"
              type="button"
              class="wc-conversation-card flex items-center gap-3 cursor-pointer tap-scale text-left"
              :style="{ animationDelay: `${idx * 30}ms` }"
              @click="openChat(session.userId || session.id)"
            >
              <div class="wc-message-avatar w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold shrink-0 overflow-hidden shadow-sm">
                <img
                  v-if="sessionAvatar(session)"
                  :src="sessionAvatar(session)"
                  class="w-full h-full object-cover"
                  @error="onAvatarError"
                />
                <span v-else>{{ initial(session.username) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start gap-2 justify-between">
                  <div class="min-w-0">
                    <span class="text-[14.5px] font-semibold text-ink truncate">{{ session.username || '咖啡好友' }}</span>
                    <p class="text-[12.5px] mt-1 truncate" :class="session.unreadCount > 0 ? 'text-ink font-medium' : 'text-ink-muted'">
                      {{ session.lastMessage || '暂无消息' }}
                    </p>
                  </div>
                  <div class="flex flex-col items-end gap-1.5 shrink-0">
                    <span class="text-[10.5px] text-ink-muted">{{ formatTime(session.lastTime) }}</span>
                    <span
                      v-if="session.unreadCount > 0"
                      class="min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm"
                      style="background: #EF4444; color: var(--text-inverse, #fff);"
                    >
                      {{ session.unreadCount > 99 ? '99+' : session.unreadCount }}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <aside class="wc-message-rail">
          <div class="wc-message-rail-card">
            <h3>页面区别</h3>
            <div class="wc-message-explain is-active">
              <Icon icon="material-symbols:chat-outline" class="w-4 h-4" />
              <div>
                <strong>私信</strong>
                <span>一对一聊天、AI 助手、会话列表。</span>
              </div>
            </div>
            <div class="wc-message-explain">
              <Icon icon="material-symbols:notifications-outline" class="w-4 h-4" />
              <div>
                <strong>消息中心</strong>
                <span>点赞、评论、收藏、关注等互动提醒。</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { messageApi, createSSESubscriber, normalizeUrl, extractApiError } from '@wc/shared'
import { WorldCoffeeLogo } from '@wc/shared'
import { WorldCoffeeAiLogo } from '@wc/shared'

const router = useRouter()
const toast = inject<any>('toast', { show: () => {} })
const loading = ref(true)
const sessions = ref([])
let disposed = false

const notifBadge = computed(() => {
  if (!toast.notifCount) return 0
  const val = typeof toast.notifCount === 'object' && toast.notifCount !== null && 'value' in toast.notifCount
    ? toast.notifCount.value
    : toast.notifCount
  return Number(val) || 0
})

function sessionAvatar(session) {
  if (!session) return ''
  const raw = session.avatar || session.userAvatar || (session.user && session.user.avatar) || ''
  return normalizeUrl(raw)
}

async function loadSessions() {
  loading.value = true
  try {
    const res = await messageApi.getSessions()
    if (disposed) return
    if (res && res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : []
      sessions.value = list.map(s => ({
        ...s,
        avatar: sessionAvatar(s)
      }))
    } else if (res && res.code === 401) {
      toast.show('请先登录', 'error')
    } else {
      toast.show(res?.msg || '加载会话失败', 'error')
    }
  } catch (e) {
    if (disposed) return
    toast.show(extractApiError(e) || '加载会话失败', 'error')
    sessions.value = []
  } finally {
    if (!disposed) loading.value = false
  }
}

function openChat(userId) {
  if (!userId) return
  router.push(`/messages/chat/${userId}`)
}

function openAIChat() {
  router.push('/ai-chat')
}

function goHome() {
  router.push('/')
}

function goNotifications() {
  router.push('/notifications')
}

function initial(name) {
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
}

function formatTime(t) {
  if (!t) return ''
  const date = new Date(t)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}天前`
  return date.toLocaleDateString()
}

function onAvatarError(e) {
  if (e.target) e.target.style.display = 'none'
}

let sseSub = null
onMounted(async () => {
  await loadSessions()
  if (toast.refreshMessageCount) toast.refreshMessageCount()
  if (toast.refreshNotifCount) toast.refreshNotifCount()

  sseSub = createSSESubscriber()
  if (sseSub) {
    sseSub.onmessage((data) => {
      if (disposed) return
      if (typeof data !== 'string') return
      const trimmed = data.trim()
      if (trimmed.startsWith('chat:') || trimmed.startsWith('message:')) {
        loadSessions()
        if (toast.refreshMessageCount) toast.refreshMessageCount()
        return
      }
      try {
        const payload = JSON.parse(trimmed)
        if (payload && (payload.type === 'chat' || payload.type === 'message')) {
          loadSessions()
          if (toast.refreshMessageCount) toast.refreshMessageCount()
        } else {
          if (toast.refreshNotifCount) toast.refreshNotifCount()
        }
      } catch {}
    })
  }
})

onBeforeUnmount(() => {
  disposed = true
  if (sseSub) { try { sseSub.close() } catch {} sseSub = null }
})
</script>

<style scoped>
.wc-message-page {
  position: relative;
  background:
    radial-gradient(circle at 16% 0%, rgba(238, 194, 123, 0.18), transparent 28%),
    radial-gradient(circle at 88% 10%, rgba(141, 110, 99, 0.11), transparent 24%),
    var(--bg-primary);
}
.wc-message-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .32;
  background-image:
    linear-gradient(rgba(109, 76, 65, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(109, 76, 65, .035) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,.55), transparent 64%);
}
.wc-message-header {
  background: color-mix(in srgb, var(--bg-elevated) 82%, transparent);
  border-bottom: 1px solid var(--divider);
  box-shadow: 0 10px 28px rgba(62, 39, 35, .055);
  backdrop-filter: blur(18px);
}
.wc-message-main {
  position: relative;
  z-index: 1;
}
.wc-message-icon-btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-secondary) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 62%, transparent);
}
.wc-message-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  padding: 22px;
  margin-bottom: 18px;
  border-radius: 30px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg-elevated) 84%, transparent);
  box-shadow: 0 16px 44px rgba(62, 39, 35, .07);
  backdrop-filter: blur(14px);
}
@media (min-width: 768px) {
  .wc-message-hero {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    padding: 26px 28px;
  }
}
.wc-message-eyebrow {
  margin-bottom: 6px;
  color: #9A6346;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .16em;
}
.wc-message-hero h2 {
  color: var(--text-primary);
  font-size: clamp(22px, 3vw, 30px);
  font-weight: 900;
  letter-spacing: -0.04em;
}
.wc-message-hero p {
  max-width: 560px;
  margin-top: 7px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}
.wc-message-tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-secondary) 64%, transparent);
}
.wc-message-tab {
  position: relative;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 800;
}
.wc-message-tab.is-active {
  color: #FFF8E1;
  background: linear-gradient(135deg, #8D5A3B, #3E2723);
}
.wc-message-tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #D46A3D;
  font-size: 10px;
}
.wc-message-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 22px;
}
@media (min-width: 1024px) {
  .wc-message-layout {
    grid-template-columns: minmax(0, 720px) 280px;
    justify-content: center;
  }
}
.wc-message-list {
  display: grid;
  gap: 12px;
}
.wc-session-stack {
  display: grid;
  gap: 12px;
}
.wc-conversation-card,
.wc-empty-card,
.wc-message-rail-card {
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg-elevated) 86%, transparent);
  box-shadow: 0 12px 34px rgba(62, 39, 35, .06);
  backdrop-filter: blur(14px);
}
.wc-conversation-card {
  padding: 16px;
  border-radius: 24px;
}
.wc-conversation-card:hover {
  background: color-mix(in srgb, var(--accent-cream) 36%, var(--bg-elevated));
}
.wc-empty-card {
  padding: 34px 22px;
  border-radius: 28px;
}
.wc-message-avatar {
  color: #FFF8E1;
  background: linear-gradient(135deg, #8D5A3B, #3E2723);
}
.wc-message-rail {
  display: none;
}
@media (min-width: 1024px) {
  .wc-message-rail {
    display: block;
    position: sticky;
    top: 88px;
  }
}
.wc-message-rail-card {
  padding: 18px;
  border-radius: 26px;
}
.wc-message-rail-card h3 {
  margin-bottom: 14px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 900;
}
.wc-message-explain {
  display: flex;
  gap: 10px;
  padding: 11px;
  border-radius: 17px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 58%, transparent);
}
.wc-message-explain + .wc-message-explain {
  margin-top: 10px;
}
.wc-message-explain.is-active {
  background: rgba(238, 194, 123, .22);
}
.wc-message-explain strong,
.wc-message-explain span {
  display: block;
}
.wc-message-explain strong {
  color: var(--text-primary);
  font-size: 12.5px;
}
.wc-message-explain span {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 11.5px;
  line-height: 1.5;
}
:root.dark .wc-message-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(238, 194, 123, 0.09), transparent 30%),
    radial-gradient(circle at 92% 6%, rgba(215, 204, 200, 0.08), transparent 24%),
    var(--bg-primary);
}
</style>

