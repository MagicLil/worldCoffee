<template>
  <div class="min-h-screen pb-24 md:pb-8">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-surface-elevated/90 backdrop-blur-xl border-b border-line/40">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button class="p-1.5 rounded-lg hover:bg-surface transition-colors" @click="router.back()">
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-brand" />
        </button>
        <h1 class="text-base font-semibold text-ink flex-1">用户主页</h1>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="max-w-2xl mx-auto px-4 pt-6">
      <div class="glass-card-solid p-6 space-y-4 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="skeleton w-16 h-16 rounded-2xl" />
          <div class="space-y-2 flex-1">
            <div class="skeleton h-5 w-32 rounded" />
            <div class="skeleton h-3 w-20 rounded" />
          </div>
        </div>
        <div class="skeleton h-4 w-24 rounded" />
      </div>
    </div>

    <main v-else-if="profile" class="max-w-2xl mx-auto px-4 pt-6 space-y-5">
      <!-- Profile Card -->
      <div class="glass-card-solid p-6 animate-fade-up">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl brand-gradient-btn flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden">
            <img v-if="profileAvatar" :src="profileAvatar" class="w-full h-full object-cover" />
            <span v-else>{{ profileInitial }}</span>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-ink">{{ profile.username }}</h2>
            <p class="text-sm text-ink-muted mt-0.5">
              {{ profile.postCount || 0 }} 篇帖子 · 加入于 {{ formatDate(profile.createTime) }}
            </p>
          </div>
          <div v-if="isLoggedIn && profile.id !== currentUserId" class="flex items-center gap-2 shrink-0">
            <button
              class="flex items-center gap-1 h-9 px-3 rounded-xl bg-surface-soft hover:bg-line/30 text-brand text-[12.5px] font-semibold shadow-sm tap-scale transition-all"
              aria-label="发私信"
              @click="startChat"
            >
              <Icon icon="material-symbols:chat-outline" class="w-4 h-4" />
              <span class="hidden sm:inline">私信</span>
            </button>
            <AppButton
              :variant="isFollowing ? 'secondary' : 'primary'"
              size="sm"
              :loading="followLoading"
              @click="toggleFollow"
            >
              {{ isFollowing ? '已关注' : '关注' }}
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Recent Posts -->
      <div class="glass-card-solid overflow-hidden animate-fade-up" style="animation-delay: 0.1s">
        <div class="px-5 py-4 border-b border-line/40">
          <h3 class="text-base font-semibold text-ink">最近动态</h3>
        </div>

        <EmptyState v-if="!profile.recentPosts || profile.recentPosts.length === 0" title="暂无动态" description="这位用户还没有发布帖子">
          <template #icon>
            <WorldCoffeeLogo size="md" />
          </template>
        </EmptyState>

        <div class="divide-y divide-coffee-latte/20">
          <div
            v-for="post in profile.recentPosts"
            :key="post.id"
            class="flex gap-3 p-4 hover:bg-surface/30 transition-colors cursor-pointer tap-scale"
            @click="router.push(`/posts/${post.id}`)"
          >
            <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img v-if="postImage(post)" :src="postImage(post)" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full img-placeholder"><WorldCoffeeLogo size="sm" variant="bare" /></div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-ink line-clamp-2">{{ post.title || post.content }}</h4>
              <p v-if="post.content" class="text-xs text-ink-muted line-clamp-2 mt-1">{{ post.content }}</p>
              <div class="flex items-center gap-3 mt-1.5 text-[11px] text-ink-muted">
                <span class="flex items-center gap-0.5"><Icon icon="material-symbols:favorite-outline" class="w-3 h-3" /> {{ post.likeCount || 0 }}</span>
                <span class="flex items-center gap-0.5"><Icon icon="material-symbols:chat-bubble-outline" class="w-3 h-3" /> {{ post.commentCount || 0 }}</span>
                <span>{{ formatDate(post.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <EmptyState v-else icon="😕" title="用户不存在" description="找不到该用户">
      <router-link to="/" class="mt-4"><AppButton variant="secondary" size="sm">返回首页</AppButton></router-link>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { userApi, normalizeUrl, extractApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { AppButton } from '@wc/shared'
import { EmptyState } from '@wc/shared'
import { WorldCoffeeLogo } from '@wc/shared'

function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatPostImages(images) {
  if (!images) return ''
  if (Array.isArray(images)) {
    return images.length > 0 ? normalizeUrl(typeof images[0] === 'string' ? images[0] : (images[0]?.url || '')) : ''
  }
  if (typeof images === 'string') {
    if (images.startsWith('[') || images.startsWith('{')) {
      try {
        const parsed = JSON.parse(images)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeUrl(typeof parsed[0] === 'string' ? parsed[0] : (parsed[0]?.url || ''))
        }
      } catch {}
    }
    const comma = images.split(',')[0]?.trim()
    return normalizeUrl(comma || '')
  }
  return ''
}

const router = useRouter()
const route = useRoute()
const toast = inject<any>('toast', { show: () => {} })
const { isLoggedIn, currentUserId } = useAuth()

const loading = ref(true)
const profile = ref(null)
const isFollowing = ref(false)
const followLoading = ref(false)

// 头像归一化
const profileAvatar = computed(() => normalizeUrl(profile.value?.avatar || ''))
const profileInitial = computed(() => {
  const name = profile.value?.username || ''
  return name.charAt(0).toUpperCase()
})

function postImage(post) {
  if (!post) return ''
  if (post.images && post.images.length > 0) {
    const first = post.images[0]
    const raw = typeof first === 'string' ? first : (first?.url || first?.imageUrl || '')
    return normalizeUrl(raw)
  }
  if (post.imageUrl) return normalizeUrl(post.imageUrl)
  if (post.coverImage) return normalizeUrl(post.coverImage)
  if (typeof post.images === 'string') return formatPostImages(post.images)
  return ''
}

async function fetchProfile() {
  const id = route.params.id
  if (!id) {
    toast.show('无效的用户 ID', 'error')
    return
  }
  loading.value = true
  isFollowing.value = false
  try {
    const res = await userApi.getUserProfile(id)
    if (res && res.code === 200) {
      const data = res.data || {}
      // 归一化头像
      if (data.avatar) data.avatar = normalizeUrl(data.avatar)
      // 归一化最近帖子图片
      if (Array.isArray(data.recentPosts)) {
        data.recentPosts = data.recentPosts.map(p => ({
          ...p,
          title: p.title || '',
          content: p.content || ''
        }))
      }
      profile.value = data
      isFollowing.value = !!data?.isFollowing
    } else if (res && res.code === 401) {
      toast.show('请先登录', 'error')
    } else {
      toast.show(res?.msg || '加载失败', 'error')
      profile.value = null
    }
  } catch (e) {
    toast.show(extractApiError(e) || '加载失败', 'error')
  } finally {
    loading.value = false
  }
}

async function toggleFollow() {
  if (!profile.value?.id) return
  followLoading.value = true
  try {
    const res = await userApi.toggleFollow(profile.value.id)
    if (res && res.code === 200) {
      isFollowing.value = res.data
      toast.show(isFollowing.value ? '已关注' : '已取消关注', 'success')
    } else {
      toast.show(res?.msg || '操作失败', 'error')
    }
  } catch (e) {
    toast.show(extractApiError(e) || '操作失败', 'error')
  } finally {
    followLoading.value = false
  }
}

function startChat() {
  const id = profile.value?.id
  if (!id) {
    toast.show('无法开始聊天', 'error')
    return
  }
  router.push(`/messages/chat/${id}`)
}

onMounted(fetchProfile)

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) fetchProfile()
})
</script>
