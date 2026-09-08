<template>
  <article
    class="feed-post-card wc-feed-card group relative overflow-hidden cursor-pointer animate-fade-in"
    :data-post-id="postId"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter.prevent="emit('click')"
  >
    <div v-if="imageUrl && !imageFailed" class="wc-feed-image-wrap relative overflow-hidden">
      <img
        :src="imageUrl"
        :alt="title"
        width="320"
        height="426"
        loading="lazy"
        decoding="async"
        class="wc-feed-cover w-full h-full object-cover block"
        @error="imageFailed = true"
      />
      <span
        v-if="likeCount >= 10"
        class="wc-hot-badge absolute top-2 left-2 flex items-center gap-1"
      >
        <Icon icon="material-symbols:local-fire-department" class="w-3 h-3" />
        热帖
      </span>
    </div>

    <div v-else class="brand-placeholder wc-feed-image-wrap flex items-center justify-center">
      <WorldCoffeeLogoMini :size="48" :with-circle="false" />
      <span
        v-if="likeCount >= 10"
        class="wc-hot-badge absolute top-2 left-2 flex items-center gap-1"
      >
        <Icon icon="material-symbols:local-fire-department" class="w-3 h-3" />
        热帖
      </span>
    </div>

    <div class="wc-feed-body">
      <h3 class="wc-feed-title text-[13px] text-ink leading-snug line-clamp-2 font-semibold">
        {{ title }}
      </h3>

      <div class="wc-feed-meta flex items-center justify-between">
        <div class="flex items-center gap-1.5 min-w-0">
          <img
            v-if="authorAvatar"
            :src="authorAvatar"
            width="20"
            height="20"
            loading="lazy"
            decoding="async"
            class="w-5 h-5 rounded-full object-cover shrink-0"
            :alt="authorName"
          />
          <span
            v-else
            class="w-5 h-5 rounded-full bg-surface-soft flex items-center justify-center shrink-0 text-[10px] font-bold text-ink-muted"
          >
            {{ authorName.slice(0, 1).toUpperCase() }}
          </span>
          <span class="text-[11.5px] text-ink-muted truncate">{{ authorName }}</span>
        </div>

        <div class="flex items-center gap-1 shrink-0 text-ink-muted">
          <Icon icon="material-symbols:favorite-border" class="w-3.5 h-3.5 text-[var(--brand-red)]" />
          <span class="text-[11.5px]">{{ formattedLikeCount }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { normalizeUrl } from '../api'
import WorldCoffeeLogoMini from './WorldCoffeeLogoMini.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])
const imageFailed = ref(false)

const postId = computed(() => props.post?.id || props.post?.postId || '')

const title = computed(() => {
  const raw = props.post?.title || props.post?.content || '一杯咖啡的瞬间'
  return String(raw).replace(/<[^>]*>/g, '').trim() || '一杯咖啡的瞬间'
})

const imageUrl = computed(() => {
  const post = props.post
  if (!post) return ''
  if (Array.isArray(post.images) && post.images.length > 0) {
    const first = post.images[0]
    return normalizeUrl(typeof first === 'string' ? first : (first?.url || first?.imageUrl || ''))
  }
  if (typeof post.images === 'string' && post.images.trim()) {
    const raw = post.images.trim()
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0]
          return normalizeUrl(typeof first === 'string' ? first : (first?.url || first?.imageUrl || ''))
        }
      } catch {}
    }
    return normalizeUrl(raw.split(',').map(item => item.trim()).filter(Boolean)[0] || '')
  }
  return normalizeUrl(post.imageUrl || post.coverImage || post.cover || post.coverUrl || '')
})

const authorAvatar = computed(() => normalizeUrl(
  props.post?.author?.avatar
  || props.post?.user?.avatar
  || props.post?.authorAvatar
  || props.post?.userAvatar
  || props.post?.avatar
  || ''
))

const authorName = computed(() => (
  props.post?.author?.nickname
  || props.post?.author?.username
  || props.post?.user?.nickname
  || props.post?.user?.username
  || props.post?.nickname
  || props.post?.username
  || props.post?.authorName
  || '咖啡爱好者'
))

const likeCount = computed(() => Number(props.post?.like_count ?? props.post?.likeCount ?? props.post?.likes ?? 0) || 0)

const formattedLikeCount = computed(() => {
  const n = likeCount.value
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n
})

watch(imageUrl, () => {
  imageFailed.value = false
})
</script>
