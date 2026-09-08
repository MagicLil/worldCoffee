<template>
  <div class="min-h-screen pb-24 md:pb-8">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-surface-elevated/90 backdrop-blur-xl border-b border-line/40">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <h1 class="text-base font-semibold text-ink">消息通知</h1>
        <button v-if="notifications.length > 0" class="text-sm text-brand font-medium" @click="markAllRead">
          全部已读
        </button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 pt-3">
      <!-- Category Tabs -->
      <div class="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all tap-scale',
            activeTab === tab.key
              ? 'brand-gradient-btn shadow-md'
              : 'bg-surface-elevated text-ink-muted hover:bg-surface shadow-sm'
          ]"
          @click="activeTab = tab.key"
        >
          <span class="flex items-center gap-1.5">
            <Icon :icon="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="n in 5" :key="n" class="glass-card-solid p-4 flex gap-3 animate-pulse">
          <div class="skeleton w-10 h-10 rounded-full flex-shrink-0" />
          <div class="space-y-2 flex-1">
            <div class="skeleton h-4 w-3/4 rounded" />
            <div class="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      </div>

      <!-- Empty -->
      <EmptyState v-else-if="filteredNotifications.length === 0" :icon="emptyIcon" :title="emptyTitle" :description="emptyDesc" />

      <!-- Notification List -->
      <div v-else class="space-y-2">
        <div
          v-for="(n, i) in filteredNotifications"
          :key="n.id"
          :class="[
            'glass-card-solid p-4 flex gap-3 cursor-pointer transition-all tap-scale animate-fade-up',
            !n.isRead ? 'border-l-4 border-l-coffee-honey' : ''
          ]"
          :style="{ animationDelay: `${i * 0.04}s` }"
          @click="handleNotifClick(n)"
        >
          <!-- Sender avatar -->
          <div class="relative flex-shrink-0">
            <div class="w-11 h-11 rounded-2xl brand-placeholder flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
              <img
                v-if="senderAvatar(n)"
                :src="senderAvatar(n)"
                :alt="n.senderName"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-sm font-bold text-brand">
                {{ senderInitial(n) }}
              </span>
            </div>
            <!-- Type badge -->
            <div
              :class="[
                'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm',
                badgeBg(n.type)
              ]"
            >
              <Icon :icon="iconFor(n.type)" class="w-3 h-3 text-white" />
            </div>
          </div>

          <div class="flex-1 min-w-0 pt-0.5">
            <p class="text-sm text-ink leading-snug">
              <span class="font-semibold">{{ n.senderName }}</span>
              {{ n.content || notifText(n.type) }}
            </p>
            <p class="text-[11px] text-ink-muted mt-1">{{ formatTime(n.createTime) }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0 mt-1.5">
            <div v-if="!n.isRead" class="w-2.5 h-2.5 rounded-full bg-[#D48A5D]" />
            <button
              class="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted/60 hover:text-red-400 hover:bg-red-50 transition-colors"
              :disabled="!!deleteLoading[n.id]"
              @click.stop="handleDeleteNotification(n)"
            >
              <Icon v-if="!deleteLoading[n.id]" icon="material-symbols:delete-outline" class="w-3.5 h-3.5" />
              <Icon v-else icon="material-symbols:progress-activity" class="w-3.5 h-3.5 animate-spin" />
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { notificationApi, getApiError } from '@wc/shared'
import { formatTime } from '@wc/shared'
import { EmptyState } from '@wc/shared'

const router = useRouter()
const toast = inject<any>('toast')

const loading = ref(true)
const notifications = ref([])
const activeTab = ref('ALL')
const deleteLoading = reactive({}) // id -> bool

const tabs = [
  { key: 'ALL', label: '全部', icon: 'material-symbols:notifications-outline' },
  { key: 'LIKE', label: '赞', icon: 'material-symbols:favorite' },
  { key: 'COMMENT', label: '评论', icon: 'material-symbols:chat-bubble' },
  { key: 'FAVORITE', label: '收藏', icon: 'material-symbols:star' },
  { key: 'FOLLOW', label: '关注', icon: 'material-symbols:person-add' }
]

const filteredNotifications = computed(() => {
  if (activeTab.value === 'ALL') return notifications.value
  return notifications.value.filter(n => n.type === activeTab.value)
})

const emptyIcon = computed(() => {
  const map = {
    ALL: '🔔',
    LIKE: '❤️',
    COMMENT: '💬',
    FAVORITE: '⭐',
    FOLLOW: '👥'
  }
  return map[activeTab.value] || '🔔'
})

const emptyTitle = computed(() => {
  const map = {
    ALL: '暂无消息',
    LIKE: '还没有收到赞',
    COMMENT: '还没有收到评论',
    FAVORITE: '还没有被收藏',
    FOLLOW: '还没有新粉丝'
  }
  return map[activeTab.value] || '暂无消息'
})

const emptyDesc = computed(() => {
  const map = {
    ALL: '新的互动通知会出现在这里',
    LIKE: '有人点赞你的帖子时会显示在这里',
    COMMENT: '有人评论你的帖子时会显示在这里',
    FAVORITE: '有人收藏你的帖子时会显示在这里',
    FOLLOW: '有人关注你时会显示在这里'
  }
  return map[activeTab.value] || ''
})

function senderAvatar(n) {
  if (!n) return null
  // 按优先级尝试各种字段名，兼容不同后端 VO
  return (
    n.senderAvatar ||
    n.fromUserAvatar ||
    n.avatar ||
    n.senderImage ||
    n.fromUserImage ||
    n.sender?.avatar ||
    n.fromUser?.avatar ||
    n.user?.avatar ||
    n.fromUser?.image ||
    null
  )
}

function senderInitial(n) {
  return (n.senderName || '?').charAt(0).toUpperCase()
}

function extractList(res) {
  if (!res || !res.data) return []
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data.data)) return res.data.data
  if (Array.isArray(res.data.records)) return res.data.records
  if (Array.isArray(res.data.list)) return res.data.list
  return []
}

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await notificationApi.getList({ filter: 'all', page: 1, size: 50 })
    if (res && res.code === 200) {
      notifications.value = extractList(res)
    } else {
      toast.show(res?.msg || '加载失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    loading.value = false
  }
}

async function handleNotifClick(n) {
  if (!n.isRead) {
    try {
      const res = await notificationApi.markRead(n.id)
      if (res && res.code === 200) {
        n.isRead = true
        if (toast.refreshNotifCount) toast.refreshNotifCount()
      }
    } catch (e) {
      // 忽略
    }
  }
  if (n.type === 'FOLLOW') {
    if (n.senderId) router.push(`/user/${n.senderId}`)
  } else if (n.postId) {
    router.push(`/posts/${n.postId}`)
  }
}

async function markAllRead() {
  try {
    const res = await notificationApi.markAllAsRead()
    if (res && res.code === 200) {
      notifications.value.forEach(n => { n.isRead = true })
      toast.show('已全部标为已读')
      if (toast.refreshNotifCount) toast.refreshNotifCount()
    } else {
      toast.show(res?.msg || '操作失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  }
}

async function handleDeleteNotification(n) {
  if (!n?.id) return
  deleteLoading[n.id] = true
  try {
    const res = await notificationApi.deleteNotification(n.id)
    if (res && res.code === 200) {
      notifications.value = notifications.value.filter(item => item.id !== n.id)
      toast.show('已删除')
      if (toast.refreshNotifCount) toast.refreshNotifCount()
    } else {
      toast.show(res?.msg || '删除失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    delete deleteLoading[n.id]
  }
}

function iconFor(type) {
  const map = {
    LIKE: 'material-symbols:favorite',
    COMMENT: 'material-symbols:chat-bubble',
    FOLLOW: 'material-symbols:person-add',
    FAVORITE: 'material-symbols:star'
  }
  return map[type] || 'material-symbols:notifications'
}

function badgeBg(type) {
  const map = {
    LIKE: 'bg-red-500',
    COMMENT: 'bg-blue-500',
    FOLLOW: 'bg-emerald-500',
    FAVORITE: 'bg-amber-500'
  }
  return map[type] || 'bg-brand'
}

function notifText(type) {
  const map = {
    LIKE: '赞了你的帖子',
    COMMENT: '评论了你的帖子',
    FOLLOW: '关注了你',
    FAVORITE: '收藏了你的帖子'
  }
  return map[type] || '有新消息'
}

function onSSEPush() {
  fetchNotifications()
}

onMounted(() => {
  fetchNotifications()
  window.addEventListener('sse-notification', onSSEPush)
})

onUnmounted(() => {
  window.removeEventListener('sse-notification', onSSEPush)
})
</script>
