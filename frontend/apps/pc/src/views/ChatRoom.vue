<template>
  <div class="h-screen flex flex-col bg-surface">
    <!-- Header -->
    <header class="bg-surface-elevated/90 backdrop-blur-xl border-b border-line/60">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          class="p-1.5 rounded-lg hover:bg-surface-soft transition-colors"
          @click="router.back()"
          aria-label="返回"
        >
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-ink-soft" />
        </button>

        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-coffee-brown to-coffee-dark flex items-center justify-center text-white text-sm font-semibold overflow-hidden shrink-0 shadow-sm">
          <img
            v-if="otherAvatar"
            :src="otherAvatar"
            class="w-full h-full object-cover"
            @error="onAvatarError"
          />
          <span v-else>{{ otherInitial }}</span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="text-[14px] font-semibold text-ink truncate">{{ otherUser.username || '聊天' }}</div>
                  </div>
      </div>
    </header>

    <!-- Messages -->
    <main ref="scrollRef" class="flex-1 max-w-2xl w-full mx-auto px-4 py-4 overflow-y-auto" @scroll="onScroll">
      <div v-if="loading && messages.length === 0" class="space-y-3 pt-4">
        <div v-for="i in 4" :key="i" class="flex items-end gap-2 animate-pulse">
          <div class="skeleton w-7 h-7 rounded-full shrink-0" />
          <div class="skeleton h-9 w-40 rounded-2xl" />
        </div>
      </div>

      <div v-if="loadingMore" class="text-center py-3">
        <span class="text-[11px] text-ink-muted">加载中...</span>
      </div>

      <div v-else-if="!loading && messages.length === 0" class="flex flex-col items-center justify-center py-16">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-coffee-cream to-coffee-latte/50 flex items-center justify-center mb-4 shadow-sm">
          <Icon icon="material-symbols:chat-bubble-outline" class="w-10 h-10 text-coffee-brown" />
        </div>
        <p class="text-sm font-semibold text-ink mb-1">开始一段对话</p>
        <p class="text-xs text-ink-muted">发送第一条消息，打破沉默 ☕</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="msg in orderedMessages"
          :key="msg.id"
          :class="[
            'flex items-end gap-2 animate-fade-up',
            isMine(msg) ? 'justify-end' : 'justify-start'
          ]"
        >
          <template v-if="!isMine(msg)">
            <div
              class="w-9 h-9 rounded-full bg-gradient-to-br from-coffee-brown to-coffee-dark flex items-center justify-center text-white text-[12px] font-bold overflow-hidden shrink-0 shadow-sm cursor-pointer tap-scale"
              @click="router.push('/user/' + otherUserId)"
            >
              <img
                v-if="otherAvatar"
                :src="otherAvatar"
                class="w-full h-full object-cover"
                @error="onAvatarError"
              />
              <span v-else>{{ initial(msg.fromName) }}</span>
            </div>
          </template>

          <div
            :class="[
              'max-w-[72%] px-4 py-2.5 text-[13.5px] leading-relaxed break-words shadow-sm',
              isMine(msg)
                ? 'bg-gradient-to-br from-coffee-brown to-coffee-bean text-white rounded-2xl rounded-br-sm'
                : 'bg-surface-elevated text-ink rounded-2xl rounded-bl-sm border border-line/60'
            ]"
          >
            <span v-if="msg.messageType === 1 || !msg.messageType">{{ msg.content }}</span>
            <span v-else>{{ msg.content }}</span>
          </div>

          <template v-if="isMine(msg)">
            <router-link
              :to="'/user/' + currentUserId"
              class="w-9 h-9 rounded-full bg-gradient-to-br from-coffee-brown to-coffee-dark flex items-center justify-center text-white text-[12px] font-bold overflow-hidden shrink-0 shadow-sm tap-scale"
            >
              <img
                v-if="myAvatar"
                :src="myAvatar"
                class="w-full h-full object-cover"
                @error="onAvatarError"
              />
              <span v-else>{{ myInitial }}</span>
            </router-link>
          </template>
        </div>
      </div>
    </main>

    <!-- Composer -->
    <div class="bg-surface-elevated/95 backdrop-blur-xl border-t border-line/60 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
      <div class="max-w-2xl mx-auto px-3 pt-3">
        <div class="flex items-end gap-2">
          <div class="flex-1 relative">
            <textarea
              v-model="draft"
              rows="1"
              placeholder="发送消息..."
              aria-label="消息输入"
              class="w-full resize-none rounded-2xl bg-surface-soft border border-transparent focus:border-line/60 focus:bg-surface-elevated focus:shadow-[0_2px_8px_rgba(62,39,35,0.06)] px-4 py-2.5 text-[13.5px] text-ink placeholder:text-ink-muted outline-none transition-all"
              @keydown.enter.exact.prevent="handleSend"
              @input="autoResize"
              ref="textareaRef"
            />
          </div>
          <button
            class="shrink-0 h-10 px-4 rounded-2xl bg-gradient-to-br from-coffee-brown to-coffee-bean text-white text-[13px] font-semibold shadow-[0_2px_10px_rgba(109,76,65,0.25)] tap-scale transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            :disabled="!canSend || sending"
            @click="handleSend"
            aria-label="发送消息"
          >
            <Icon v-if="sending" icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
            <Icon v-else icon="material-symbols:send" class="w-4 h-4" />
            <span class="hidden sm:inline">发送</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, inject, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { messageApi, userApi, createSSESubscriber, normalizeUrl, extractApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'

const props = defineProps({
  userId: { type: [String, Number], required: true }
})

const router = useRouter()
const route = useRoute()
const toast = inject<any>('toast', { show: () => {} })
const { user } = useAuth()

const scrollRef = ref(null)
const textareaRef = ref(null)
const loading = ref(true)
const loadingMore = ref(false)
const sending = ref(false)
const draft = ref('')
const messages = ref([])
const otherUser = ref({ username: '', avatar: '' })

const page = ref(1)
const pageSize = 20
const hasMore = ref(true)
const hasMarkedRead = ref(false)

const otherUserId = computed(() => {
  const raw = props.userId || route.params.userId
  if (typeof raw === 'string') {
    const n = Number(raw)
    return isNaN(n) ? raw : n
  }
  return raw
})

const currentUserId = computed(() => {
  const id = user.value?.id ?? user.value?.userId
  if (typeof id === 'string') {
    const n = Number(id)
    return isNaN(n) ? id : n
  }
  return id
})

const otherAvatar = computed(() => normalizeUrl(otherUser.value.avatar || ''))

const myAvatar = computed(() => normalizeUrl(user.value?.avatar || ''))
const myInitial = computed(() => initial(user.value?.username || user.value?.nickname || '我'))

const canSend = computed(() => {
  const v = (draft.value || '').trim()
  return v.length > 0 && v.length <= 500
})

const orderedMessages = computed(() => {
  return [...messages.value].sort((a, b) => {
    const ta = new Date(a.createTime).getTime()
    const tb = new Date(b.createTime).getTime()
    return ta - tb
  })
})

function isMine(msg) {
  if (!msg) return false
  return String(msg.fromId) === String(currentUserId.value)
}

function initial(name) {
  if (!name) return 'U'
  return String(name).charAt(0).toUpperCase()
}

const otherInitial = computed(() => initial(otherUser.value.username))

function onAvatarError(e) { if (e.target) e.target.style.display = 'none' }

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function scrollToBottom(immediate = false) {
  const el = scrollRef.value
  if (!el) return
  if (immediate) {
    el.scrollTop = el.scrollHeight
  } else {
    nextTick(() => {
      if (scrollRef.value) if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight
    })
  }
}

function preserveScrollOnLoadMore(callback) {
  const el = scrollRef.value
  if (!el) return callback()
  const oldScrollHeight = el.scrollHeight
  const oldScrollTop = el.scrollTop
  callback()
  nextTick(() => {
    if (scrollRef.value) {
      const newHeight = scrollRef.value.scrollHeight
      scrollRef.value.scrollTop = oldScrollTop + (newHeight - oldScrollHeight)
    }
  })
}

async function loadHistory({ reset = false } = {}) {
  if (reset) {
    page.value = 1
    messages.value = []
    hasMore.value = true
  }
  if (!hasMore.value && !reset) return

  try {
    if (reset) loading.value = true
    else loadingMore.value = true

    const res = await messageApi.getChatHistory(otherUserId.value, {
      page: page.value,
      size: pageSize
    })

    if (res && res.code === 200) {
      const list = (Array.isArray(res.data) ? res.data : [])
        .map(m => ({ ...m, fromAvatar: normalizeUrl(m.fromAvatar) }))

      if (list.length > 0) {
        const existingIds = new Set(messages.value.map(m => m.id).filter(Boolean))
        const fresh = list.filter(m => !existingIds.has(m.id))

        if (reset && !otherUser.value.username) {
          const otherMsg = list.find(m => String(m.fromId) === String(otherUserId.value))
          if (otherMsg) {
            otherUser.value = {
              username: otherMsg.fromName || otherUser.value.username,
              avatar: otherMsg.fromAvatar || otherUser.value.avatar
            }
          }
        }

        if (reset) {
          messages.value = list
        } else {
          messages.value = [...fresh, ...messages.value]
        }

        page.value += 1
      }
      if (list.length < pageSize) hasMore.value = false
    } else if (res && res.code === 401) {
      toast.show('请先登录', 'error')
      hasMore.value = false
    } else {
      toast.show(res?.msg || '加载失败', 'error')
      hasMore.value = false
    }
  } catch (e) {
    hasMore.value = false
    toast.show(extractApiError(e) || '加载失败', 'error')
  } finally {
    loading.value = false
    loadingMore.value = false
    if (reset) {
      await nextTick()
      scrollToBottom()
    }
  }
}

function onScroll() {
  const el = scrollRef.value
  if (!el || loadingMore.value || !hasMore.value) return
  if (el.scrollTop <= 80) {
    loadHistory({ reset: false })
  }
}

async function handleSend() {
  if (!canSend.value || sending.value) return
  const content = draft.value.trim()
  sending.value = true

  const localId = 'local-' + Date.now()
  const optimistic = {
    id: localId,
    fromId: currentUserId.value,
    fromName: user.value?.username || '我',
    fromAvatar: normalizeUrl(user.value?.avatar || ''),
    toId: otherUserId.value,
    content,
    messageType: 1,
    isRead: false,
    createTime: new Date().toISOString(),
    _pending: true
  }
  messages.value.push(optimistic)
  draft.value = ''
  autoResize()
  scrollToBottom()

  try {
    const res = await messageApi.sendMessage({
      toId: otherUserId.value,
      content,
      messageType: 1
    })
    if (res && res.code === 200 && res.data) {
      messages.value = messages.value.map(m =>
        m.id === localId ? { ...res.data, fromAvatar: normalizeUrl(res.data.fromAvatar) } : m
      )
      scrollToBottom()
    } else {
      messages.value = messages.value.filter(m => m.id !== localId)
      toast.show(res?.msg || '发送失败', 'error')
    }
  } catch (e) {
    messages.value = messages.value.filter(m => m.id !== localId)
    toast.show(extractApiError(e) || '发送失败', 'error')
  } finally {
    sending.value = false
  }
}

async function loadOtherUserInfo() {
  try {
    const res = await userApi.getUserProfile(otherUserId.value)
    if (res && res.code === 200 && res.data) {
      otherUser.value = {
        username: res.data.username || res.data.nickname || '用户',
        avatar: normalizeUrl(res.data.avatar || '')
      }
    }
  } catch (e) {}
}

async function markAsRead() {
  if (hasMarkedRead.value) return
  hasMarkedRead.value = true
  try {
    const res = await messageApi.markAsRead(otherUserId.value)
    // 无论后端返回什么格式，读完后都刷新全局未读数
  } catch {}
  // 标完已读后，强制刷新全局未读消息数（确保底部导航红点更新）
  if (toast.refreshMessageCount) {
    try { await toast.refreshMessageCount() } catch {}
  }
}

async function refreshNewMessages() {
  try {
    const res = await messageApi.getChatHistory(otherUserId.value, { page: 1, size: 5 })
    if (res && res.code === 200) {
      const newList = (Array.isArray(res.data) ? res.data : [])
        .map(m => ({ ...m, fromAvatar: normalizeUrl(m.fromAvatar) }))
      if (newList.length === 0) return

      const existingIds = new Set(messages.value.map(m => m.id).filter(Boolean))
      const fresh = newList.filter(m => !existingIds.has(m.id))
      if (fresh.length === 0) return

      messages.value = [...messages.value, ...fresh]
      const hasIncoming = fresh.some(m => String(m.fromId) === String(otherUserId.value))
      if (hasIncoming) {
        await nextTick()
        scrollToBottom()
        messageApi.markAsRead(otherUserId.value).finally(() => {
          if (toast.refreshMessageCount) { try { toast.refreshMessageCount() } catch {} }
        })
      }
    }
  } catch (e) {}
}

let sseSub = null

function subscribeSSE() {
  // 关闭旧的 SSE 连接
  if (sseSub) { try { sseSub.close() } catch {} sseSub = null }

  sseSub = createSSESubscriber()
  if (sseSub) {
    sseSub.onmessage((data) => {
      if (typeof data !== 'string') return
      const trimmed = data.trim()

      if (trimmed.startsWith('chat:')) {
        const raw = trimmed.slice(5)
        const sep = '|||'
        const sepIdx = raw.indexOf(sep)
        if (sepIdx === -1) return

        const fromId = raw.slice(0, sepIdx)
        const content = raw.slice(sepIdx + sep.length)

        if (String(fromId) === String(otherUserId.value)) {
          messages.value.push({
            id: 'sse-' + Date.now(),
            fromId: parseInt(fromId),
            fromName: otherUser.value.username || '用户',
            fromAvatar: otherUser.value.avatar || '',
            toId: currentUserId.value,
            content,
            messageType: 1,
            isRead: true,
            createTime: new Date().toISOString()
          })
          nextTick(() => scrollToBottom())
          messageApi.markAsRead(otherUserId.value).catch(() => {})
        }
        return
      }

      try {
        const payload = JSON.parse(trimmed)
        if (payload && (payload.type === 'chat' || payload.type === 'message')) {
          refreshNewMessages()
        }
      } catch {}
    })
  }
}

onMounted(async () => {
  loadOtherUserInfo()
  await loadHistory({ reset: true })
  markAsRead()
  subscribeSSE()
})
onBeforeUnmount(() => {
  if (sseSub) { try { sseSub.close() } catch {} sseSub = null }
})

watch(() => route.params.userId, async (newVal) => {
  if (newVal) {
    // 关闭旧的 SSE 连接
    if (sseSub) { try { sseSub.close() } catch {} sseSub = null }

    // 重置状态
    hasMarkedRead.value = false
    otherUser.value = { username: '', avatar: '' }
    messages.value = []
    page.value = 1
    hasMore.value = true

    // 重新加载数据
    loadOtherUserInfo()
    await loadHistory({ reset: true })
    markAsRead()

    // 重建 SSE 订阅
    subscribeSSE()
  }
})
</script>
