<template>
  <div class="min-h-screen pb-24 md:pb-8 bg-surface">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-surface-elevated/90 backdrop-blur-xl border-b border-line/60">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button class="p-1.5 rounded-lg hover:bg-surface-soft transition-colors" @click="router.back()">
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-ink-soft" />
        </button>
        <h1 class="text-base font-semibold text-ink flex-1 truncate">{{ post?.title || '帖子详情' }}</h1>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="max-w-2xl mx-auto px-4 pt-6">
      <div class="glass-card-solid p-6 space-y-4 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="skeleton w-10 h-10 rounded-full" />
          <div class="space-y-2 flex-1">
            <div class="skeleton h-4 w-24 rounded" />
            <div class="skeleton h-3 w-16 rounded" />
          </div>
        </div>
        <div class="skeleton h-5 w-3/4 rounded" />
        <div class="skeleton h-48 w-full rounded-xl" />
        <div class="skeleton h-4 w-full rounded" />
        <div class="skeleton h-4 w-2/3 rounded" />
      </div>
    </div>

    <main v-else-if="post" class="max-w-2xl mx-auto px-4 pt-6 space-y-5">
      <!-- Post Card -->
      <article class="glass-card-solid overflow-hidden animate-fade-up">
        <!-- Author -->
        <div class="flex items-center gap-3 p-5 pb-0">
          <router-link :to="`/user/${post.userId}`" class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-full brand-gradient-btn flex items-center justify-center font-bold overflow-hidden">
              <img v-if="post._avatar || post.avatar" :src="post._avatar || post.avatar" :alt="post.username" class="w-full h-full object-cover" />
              <span v-else>{{ post.username?.charAt(0)?.toUpperCase() }}</span>
            </div>
            <div>
              <span class="text-sm font-medium text-ink">{{ post.username }}</span>
              <p class="text-[11px] text-ink-muted">{{ formatTime(post.createTime) }}</p>
            </div>
          </router-link>

          <!-- 举报入口 -->
          <button
            class="p-2 rounded-lg hover:bg-surface-soft transition-colors text-ink-muted hover:text-rose-500 flex-shrink-0 tap-scale"
            :disabled="reporting"
            @click="openReportModal"
            title="举报该帖子"
          >
            <Icon icon="material-symbols:flag-outline" class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-4">
          <h2 class="text-xl font-semibold text-ink leading-snug">{{ post.title }}</h2>
          <p v-if="post.content" class="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{{ post.content }}</p>

          <!-- Images (swipe gallery) -->
          <div v-if="post.images && post.images.length" class="w-full select-none">
            <!-- 容器：4:3 比例 -->
            <div
              class="relative w-full overflow-hidden rounded-2xl bg-surface-soft"
              style="aspect-ratio: 4/3; touch-action: pan-y"
            >
              <!-- 滑动轨道 -->
              <div
                ref="galleryTrack"
                class="flex h-full w-full"
                :style="{
                  transform: 'translateX(calc(' + (-currentImage * 100) + '% + ' + galleryDragX + 'px))',
                  transition: galleryDragging ? 'none' : 'transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)'
                }"
                @touchstart="galleryTouchStart"
                @touchmove="galleryTouchMove"
                @touchend="galleryTouchEnd"
                @touchcancel="galleryTouchEnd"
                @mousedown="galleryMouseDown"
              >
                <div
                  v-for="(img, i) in post.images"
                  :key="i"
                  class="shrink-0 h-full w-full flex items-center justify-center"
                >
                  <img
                    :src="img"
                    :alt="`${post.title} ${i + 1}`"
                    class="w-full h-full object-cover pointer-events-none"
                    draggable="false"
                    @error="onGalleryImgError"
                  />
                </div>
              </div>

              <!-- 左右箭头 + 计数器 -->
              <template v-if="post.images.length > 1">
                <button
                  v-if="currentImage > 0"
                  class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center backdrop-blur active:bg-black/55"
                  @click.stop="galleryPrev"
                  aria-label="上一张"
                >
                  <Icon icon="material-symbols:chevron-left" class="w-5 h-5" />
                </button>
                <button
                  v-if="currentImage < post.images.length - 1"
                  class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center backdrop-blur active:bg-black/55"
                  @click.stop="galleryNext"
                  aria-label="下一张"
                >
                  <Icon icon="material-symbols:chevron-right" class="w-5 h-5" />
                </button>
                <span
                  class="absolute top-2 right-2 text-[11px] text-white/90 bg-black/40 backdrop-blur px-2 py-1 rounded-full"
                >
                  {{ currentImage + 1 }} / {{ post.images.length }}
                </span>
              </template>
            </div>

            <!-- 底部圆点指示器 -->
            <div
              v-if="post.images.length > 1"
              class="flex justify-center items-center gap-1.5 mt-3"
            >
              <button
                v-for="(_, i) in post.images"
                :key="i"
                class="rounded-full transition-all duration-200"
                :class="i === currentImage ? 'w-5 h-1.5 bg-brand' : 'w-1.5 h-1.5 bg-line/60'"
                :aria-label="`跳转到第 ${i + 1} 张图片`"
                @click.stop="currentImage = i"
              />
            </div>
          </div>

          <!-- Tags -->
          <div class="flex flex-wrap gap-2">
            <span v-if="post.coffeeName" class="inline-flex items-center gap-1.5 bg-surface-soft text-ink text-xs px-3 py-1.5 rounded-full">
              <Icon icon="material-symbols:local-cafe" class="w-3.5 h-3.5" /> {{ post.coffeeName }}
              <span v-if="post.coffeeBrand" class="text-ink-muted">· {{ post.coffeeBrand }}</span>
            </span>
            <span v-if="post.location" class="inline-flex items-center gap-1.5 bg-surface-soft text-ink text-xs px-3 py-1.5 rounded-full">
              <Icon icon="material-symbols:location-on" class="w-3.5 h-3.5" /> {{ post.location }}
            </span>
            <span
              v-for="topic in getTopics(post)"
              :key="topic"
              class="inline-flex items-center gap-1 bg-[#FF2442]/5 text-[#FF2442] text-xs px-3 py-1.5 rounded-full"
            >
              #{{ topic }}
            </span>
            <span v-if="post.postType === 2" class="inline-flex items-center gap-1.5 bg-surface-soft text-ink text-xs px-3 py-1.5 rounded-full">
              <Icon icon="material-symbols:check-circle" class="w-3.5 h-3.5" /> 打卡
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 px-4 py-3 border-t border-line/60">
          <button
            :class="['flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all', liked ? 'text-red-500 bg-red-50' : 'text-ink-muted hover:bg-surface-soft']"
            @click="toggleLike"
          >
            <Icon :icon="liked ? 'material-symbols:favorite' : 'material-symbols:favorite-outline'" class="w-5 h-5" :class="liked ? 'animate-heart' : ''" />
            <span>{{ likeCount }}</span>
          </button>
          <button
            :class="['flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all', favorited ? 'text-amber-500 bg-amber-50' : 'text-ink-muted hover:bg-surface-soft']"
            @click="toggleFavorite"
          >
            <Icon :icon="favorited ? 'material-symbols:star' : 'material-symbols:star-outline'" class="w-5 h-5" />
            <span>{{ favCount }}</span>
          </button>
          <span class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-ink-muted">
            <Icon icon="material-symbols:chat-bubble-outline" class="w-5 h-5" />
            <span>{{ comments.length }}</span>
          </span>
          <button
            v-if="isLoggedIn && post.userId === currentUser?.id"
            class="ml-auto text-sm text-red-400 hover:bg-red-50 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
            @click="deletePost"
          >
            <Icon icon="material-symbols:delete-outline" class="w-5 h-5" /> 删除
          </button>
        </div>
      </article>

      <!-- Comments -->
      <section class="glass-card-solid overflow-hidden animate-fade-up" style="animation-delay: 0.1s">
        <div class="px-5 py-4 border-b border-line/60">
          <h3 class="text-base font-semibold text-ink">评论 ({{ comments.length }})</h3>
        </div>

        <div v-if="comments.length === 0" class="py-10 text-center">
          <p class="text-sm text-ink-muted">还没有评论，来抢沙发吧</p>
        </div>

        <div class="divide-y divide-line/40">
          <div v-for="c in comments" :key="c.id" class="flex gap-3 p-4 group">
            <router-link :to="`/user/${c.userId}`" class="w-8 h-8 rounded-full brand-placeholder flex items-center justify-center text-ink text-xs font-bold flex-shrink-0 overflow-hidden">
              <img v-if="c._avatar || c.avatar" :src="c._avatar || c.avatar" :alt="c.username" class="w-full h-full object-cover" />
              <span v-else>{{ c.username?.charAt(0)?.toUpperCase() }}</span>
            </router-link>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-ink">{{ c.username }}</span>
                <span class="text-[11px] text-ink-muted">{{ formatTime(c.createTime) }}</span>
              </div>
              <p class="text-sm text-ink-soft mt-1 leading-relaxed">{{ c.content }}</p>
            </div>
            <button
              v-if="isLoggedIn && (c.userId === currentUser?.id || post.userId === currentUser?.id)"
              class="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-400 transition-all self-start"
              @click="deleteComment(c.id)"
            >
              <Icon icon="material-symbols:close" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Comment Input -->
        <div v-if="isLoggedIn" class="border-t border-line/60 p-4">
          <div class="flex gap-2">
            <input
              v-model="commentText"
              type="text"
              placeholder="写下你的评论..."
              maxlength="500"
              class="flex-1 px-4 py-2.5 rounded-xl bg-surface-soft border border-transparent text-sm text-ink outline-none focus:border-line/60 focus:bg-surface-elevated transition-all"
              @keyup.enter="submitComment"
            />
            <AppButton variant="primary" size="sm" :loading="commentLoading" :disabled="!commentText.trim()" @click="submitComment">
              发送
            </AppButton>
          </div>
        </div>
        <div v-else class="border-t border-line/60 p-4 text-center">
          <router-link to="/login" class="text-sm text-brand font-medium">登录后参与评论</router-link>
        </div>
      </section>
    </main>

    <!-- Not Found -->
    <EmptyState v-else icon="😕" title="帖子不存在" description="可能已被删除">
      <router-link to="/" class="mt-4"><AppButton variant="secondary" size="sm">返回首页</AppButton></router-link>
    </EmptyState>

    <!-- 举报弹窗 -->
    <teleport to="body">
      <div
        v-if="showReportModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeReportModal"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative w-full max-w-md bg-surface-elevated rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
          <div class="flex items-center justify-between p-4 border-b border-line/40">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
                <Icon icon="material-symbols:flag" class="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-ink">举报该帖子</h3>
                <p class="text-[11px] text-ink-muted">您的举报将被严格审核处理</p>
              </div>
            </div>
            <button
              class="p-1.5 rounded-lg hover:bg-surface transition-colors text-ink-muted"
              @click="closeReportModal"
            >
              <Icon icon="material-symbols:close" class="w-5 h-5" />
            </button>
          </div>

          <div class="p-4 space-y-3">
            <label class="block text-sm font-medium text-ink">
              举报原因 <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="reportReason"
              rows="5"
              maxlength="500"
              placeholder="请描述该帖子违反社区规范的具体内容（最多 500 字）..."
              class="w-full px-3.5 py-3 rounded-xl bg-surface/70 border border-line/60 text-ink text-[13.5px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none placeholder:text-ink-muted/70"
            />
            <div class="flex items-end justify-between">
              <div class="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Icon icon="material-symbols:info-outline" class="w-3.5 h-3.5" />
                <span>同一用户对同一帖子只能举报一次</span>
              </div>
              <span class="text-[11px] text-ink-muted">{{ (reportReason || '').length }}/500</span>
            </div>
          </div>

          <div class="p-4 border-t border-line/40 flex items-center gap-2.5">
            <button
              class="flex-1 h-11 rounded-xl bg-surface border border-line/60 text-ink text-sm font-medium hover:bg-surface/70 transition-colors disabled:opacity-40"
              :disabled="reporting"
              @click="closeReportModal"
            >
              取消
            </button>
            <button
              class="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold brand-gradient-btn transition-all shadow-[0_2px_8px_rgba(109,76,65,0.25)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="reporting || !reportReason?.trim()"
              @click="submitReport"
            >
              <Icon v-if="reporting" icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
              <span>{{ reporting ? '提交中...' : '提交举报' }}</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { coffeeApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { formatTime } from '@wc/shared'
import { AppButton } from '@wc/shared'
import { EmptyState } from '@wc/shared'

const router = useRouter()
const route = useRoute()
const toast = inject<any>('toast')
const { isLoggedIn, user: currentUser } = useAuth()

const loading = ref(true)
const post = ref(null)
const liked = ref(false)
const likeCount = ref(0)
const favorited = ref(false)
const favCount = ref(0)
const comments = ref([])
const commentText = ref('')
const commentLoading = ref(false)

// ===== 举报 =====
const showReportModal = ref(false)
const reportReason = ref('')
const reporting = ref(false)
const hasReported = ref(false)

function openReportModal() {
  if (!isLoggedIn.value) {
    toast.show('请先登录后再举报', 'warn')
    router.push('/login')
    return
  }
  if (hasReported.value) {
    toast.show('您已经举报过该帖子了', 'warn')
    return
  }
  if (post.value && post.value.userId === currentUser.value?.id) {
    toast.show('不能举报自己的帖子', 'warn')
    return
  }
  reportReason.value = ''
  showReportModal.value = true
}

function closeReportModal() {
  if (reporting.value) return
  showReportModal.value = false
  reportReason.value = ''
}

async function submitReport() {
  const reason = reportReason.value.trim()
  if (!reason) {
    toast.show('请填写举报原因', 'warn')
    return
  }
  if (!post.value || !post.value.id) return

  reporting.value = true
  try {
    const res = await coffeeApi.reportPost(post.value.id, { reason })
    if (res && res.code === 200) {
      hasReported.value = true
      toast.show('举报已提交，感谢您的反馈', 'success')
      closeReportModal()
    } else {
      toast.show(res?.msg || '举报失败，请稍后重试', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    reporting.value = false
  }
}

// ===== Gallery =====
const galleryTrack = ref(null)
const currentImage = ref(0)
const galleryDragX = ref(0)
const galleryDragging = ref(false)

let _galStartX = 0
let _galStartY = 0
let _galLockedSwipe = false    // 已判定为页面滚动，不再处理滑动
let _galLockedScroll = false   // 已判定为图片切换，阻止页面滚动

function galleryTouchStart(e) {
  const t = e.touches && e.touches[0]
  if (!t) return
  _galStartX = t.clientX
  _galStartY = t.clientY
  galleryDragX.value = 0
  galleryDragging.value = true
  _galLockedSwipe = false
  _galLockedScroll = false
}

function galleryTouchMove(e) {
  if (!galleryDragging.value) return
  const t = e.touches && e.touches[0]
  if (!t) return
  const dx = t.clientX - _galStartX
  const dy = t.clientY - _galStartY

  // 首次移动 > 8px 才判断方向：水平明显大于纵向才处理滑动
  if (!_galLockedSwipe && !_galLockedScroll) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    if (Math.abs(dx) > Math.abs(dy) * 1.5) {
      _galLockedScroll = true
      if (e.cancelable) { try { e.preventDefault() } catch {} }
    } else {
      _galLockedSwipe = true
      galleryDragging.value = false
      galleryDragX.value = 0
      return
    }
  }

  if (_galLockedScroll) {
    if (e.cancelable) { try { e.preventDefault() } catch {} }
    // 边界阻尼
    let drag = dx
    const total = post.value?.images?.length || 0
    if (total > 1) {
      if (currentImage.value === 0 && drag > 0) drag = drag * 0.35
      else if (currentImage.value === total - 1 && drag < 0) drag = drag * 0.35
    }
    galleryDragX.value = drag
  }
}

function galleryTouchEnd() {
  if (!galleryDragging.value) return
  const dx = galleryDragX.value
  const total = post.value?.images?.length || 0
  galleryDragging.value = false
  galleryDragX.value = 0

  // 阈值：超过容器宽度 1/4 才算切换（粗略估算 60px）
  if (Math.abs(dx) < 60) return

  if (dx < 0 && currentImage.value < total - 1) {
    currentImage.value++
  } else if (dx > 0 && currentImage.value > 0) {
    currentImage.value--
  }
}

// 桌面端鼠标拖拽测试
let _mouseMoveHandler = null
let _mouseUpHandler = null
let _galMouseStartX = 0
let _galMouseStartY = 0
let _galMouseLockedSwipe = false
let _galMouseLockedScroll = false

function galleryMouseDown(e) {
  if (e.button !== 0) return
  _galMouseStartX = e.clientX
  _galMouseStartY = e.clientY
  galleryDragX.value = 0
  galleryDragging.value = true
  _galMouseLockedSwipe = false
  _galMouseLockedScroll = false

  _mouseMoveHandler = (ev) => {
    if (!galleryDragging.value) return
    const dx = ev.clientX - _galMouseStartX
    const dy = ev.clientY - _galMouseStartY
    if (!_galMouseLockedSwipe && !_galMouseLockedScroll) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
        _galMouseLockedScroll = true
      } else {
        _galMouseLockedSwipe = true
        galleryDragging.value = false
        galleryDragX.value = 0
        return
      }
    }
    if (_galMouseLockedScroll) {
      if (ev.cancelable) { try { ev.preventDefault() } catch {} }
      let drag = dx
      const total = post.value?.images?.length || 0
      if (total > 1) {
        if (currentImage.value === 0 && drag > 0) drag = drag * 0.35
        else if (currentImage.value === total - 1 && drag < 0) drag = drag * 0.35
      }
      galleryDragX.value = drag
    }
  }
  _mouseUpHandler = () => {
    galleryTouchEnd()
    if (_mouseMoveHandler) window.removeEventListener('mousemove', _mouseMoveHandler)
    if (_mouseUpHandler) window.removeEventListener('mouseup', _mouseUpHandler)
    _mouseMoveHandler = null
    _mouseUpHandler = null
  }
  window.addEventListener('mousemove', _mouseMoveHandler)
  window.addEventListener('mouseup', _mouseUpHandler)
}

function galleryPrev() {
  if (currentImage.value > 0) currentImage.value--
}
function galleryNext() {
  const total = post.value?.images?.length || 0
  if (currentImage.value < total - 1) currentImage.value++
}
function onGalleryImgError(e) {
  if (e && e.target) e.target.style.display = 'none'
}

function getTopics(item) {
  return Array.isArray(item?.topics) ? item.topics.filter(Boolean) : []
}

// 切帖子时重置
function resetGallery() {
  currentImage.value = 0
  galleryDragX.value = 0
  galleryDragging.value = false
}

onUnmounted(() => {
  if (_mouseMoveHandler) window.removeEventListener('mousemove', _mouseMoveHandler)
  if (_mouseUpHandler) window.removeEventListener('mouseup', _mouseUpHandler)
})

async function fetchPost() {
  const id = route.params.id
  if (!id) {
    toast.show('无效的帖子 ID', 'error')
    return
  }
  loading.value = true
  try {
    const res = await coffeeApi.getPostDetail(id)
    if (res && res.code === 200 && res.data) {
      const p = res.data
      post.value = p
      liked.value = !!(p.likedByMe)
      likeCount.value = p.likeCount || 0
      favorited.value = !!(p.favoritedByMe)
      favCount.value = p.favoriteCount || 0
      comments.value = p.comments || []
      resetGallery()
    } else {
      toast.show(res?.msg || '加载失败', 'error')
      post.value = null
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    loading.value = false
  }
}

async function toggleLike() {
  if (!isLoggedIn.value) { router.push('/login'); return }
  if (!post.value) return
  try {
    const res = await coffeeApi.toggleLike(post.value.id)
    if (res && res.code === 200) {
      liked.value = !!res.data
      likeCount.value = Math.max(0, likeCount.value + (res.data ? 1 : -1))
    } else {
      toast.show(res?.msg || '操作失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  }
}

async function toggleFavorite() {
  if (!isLoggedIn.value) { router.push('/login'); return }
  if (!post.value) return
  try {
    const res = await coffeeApi.toggleFavorite(post.value.id)
    if (res && res.code === 200) {
      favorited.value = !!res.data
      favCount.value = Math.max(0, favCount.value + (res.data ? 1 : -1))
    } else {
      toast.show(res?.msg || '操作失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  }
}

async function submitComment() {
  if (!commentText.value.trim() || commentLoading.value) return
  if (!post.value) return
  commentLoading.value = true
  try {
    const res = await coffeeApi.addComment(post.value.id, { content: commentText.value.trim() })
    if (res && res.code === 200) {
      comments.value.push(res.data)
      commentText.value = ''
      toast.show('评论成功')
    } else {
      toast.show(res?.msg || '评论失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    commentLoading.value = false
  }
}

async function deleteComment(commentId) {
  if (!post.value) return
  try {
    const res = await coffeeApi.deleteComment(commentId)
    if (res && res.code === 200) {
      comments.value = comments.value.filter(c => c.id !== commentId)
      toast.show('评论已删除')
    } else {
      toast.show(res?.msg || '删除失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  }
}

async function deletePost() {
  if (!post.value) return
  if (!confirm('确定删除这篇帖子吗？')) return
  try {
    const res = await coffeeApi.deletePost(post.value.id)
    if (res && res.code === 200) {
      toast.show('帖子已删除')
      router.push('/')
    } else {
      toast.show(res?.msg || '删除失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  }
}

onMounted(fetchPost)
</script>

<style scoped>
.gallery-track { touch-action: none; -ms-touch-action: none; }
.gallery-track img { touch-action: none; }
</style>
