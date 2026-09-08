<template>
  <div class="wc-web-page profile-desktop min-h-screen pb-12">
    <header class="profile-header wc-web-header sticky top-0 z-40">
      <div class="profile-header-inner mx-auto h-[72px] px-6 flex items-center justify-between">
        <button class="profile-brand tap-scale" @click="router.push('/')">
          <WorldCoffeeLogo size="sm" variant="bare" />
          <span>
            <strong>WorldCoffee</strong>
            <em>个人咖啡主页</em>
          </span>
        </button>

        <div class="profile-top-actions">
          <button class="profile-top-link tap-scale" @click="openComposer">
            <Icon icon="material-symbols:edit-square-outline" class="w-4 h-4" />
            发布笔记
          </button>
          <button class="wc-web-icon-btn tap-scale" @click="router.push('/settings')" title="设置">
            <Icon icon="material-symbols:settings" class="w-5 h-5 text-ink-soft" />
          </button>
        </div>
      </div>
    </header>

    <main class="profile-layout wc-web-main mx-auto px-6 pt-7">
      <aside class="profile-left">
        <section v-if="user" class="profile-user-card wc-web-card">
          <div class="profile-cover">
            <div class="profile-cover-bean">☕</div>
          </div>

          <div class="profile-user-body">
            <div class="profile-avatar-lg">
              <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
              <span v-else>{{ user.username?.charAt(0)?.toUpperCase() }}</span>
            </div>

            <h1>{{ user.username }}</h1>
            <p class="profile-subtitle">{{ greeting }}，今天也适合记录一杯咖啡</p>
            <p class="profile-date">加入 WorldCoffee 于 {{ formatDate(user.createTime) }}</p>

            <div class="profile-badges">
              <span :class="['profile-badge', user.status === 1 ? 'is-ok' : 'is-danger']">
                <Icon :icon="user.status === 1 ? 'material-symbols:check-circle' : 'material-symbols:error-outline'" class="w-3.5 h-3.5" />
                {{ user.status === 1 ? '账号正常' : '账号异常' }}
              </span>
              <span v-if="user.phone" class="profile-badge is-phone">
                <Icon icon="material-symbols:phone" class="w-3.5 h-3.5" />
                {{ user.phone }}
              </span>
            </div>
          </div>

          <div class="profile-stat-grid">
            <div><strong>{{ stats.posts }}</strong><span>笔记</span></div>
            <div><strong>{{ stats.likes }}</strong><span>获赞</span></div>
            <div><strong>{{ stats.favorites }}</strong><span>收藏</span></div>
            <div><strong>{{ stats.comments }}</strong><span>评论</span></div>
            <div><strong>{{ stats.following }}</strong><span>关注</span></div>
            <div><strong>{{ stats.followers }}</strong><span>粉丝</span></div>
          </div>

          <div class="profile-primary-actions">
            <button v-if="false" class="profile-main-btn tap-scale" @click="openComposer">
              <Icon icon="material-symbols:add-photo-alternate-outline" class="w-4 h-4" />
              写一篇咖啡笔记
            </button>
            <button class="profile-ghost-btn tap-scale" @click="router.push('/settings/account')">
              编辑资料
            </button>
          </div>
        </section>

        <section v-else class="profile-user-card wc-web-card animate-pulse">
          <div class="profile-cover"></div>
          <div class="profile-user-body">
            <div class="skeleton w-24 h-24 rounded-[28px] mx-auto" />
            <div class="skeleton h-5 w-32 rounded mx-auto mt-5" />
            <div class="skeleton h-3 w-44 rounded mx-auto mt-3" />
          </div>
          <div class="profile-stat-grid">
            <div v-for="n in 6" :key="n"><strong>0</strong><span>加载中</span></div>
          </div>
        </section>
      </aside>

      <section class="profile-center">
        <div class="profile-hero-row">
          <div>
            <p class="profile-kicker">MY COFFEE SPACE</p>
            <h2>我的咖啡内容</h2>
            <span>管理你的笔记、喜欢和收藏，不再挤在一个手机页面里。</span>
          </div>
          <button v-if="false" class="profile-main-btn tap-scale" @click="router.push('/shop')">
            <Icon icon="material-symbols:storefront-outline" class="w-4 h-4" />
            去咖啡商城
          </button>
        </div>

        <section class="profile-content wc-web-card">
          <div class="profile-tabs">
            <button
              v-for="tab in contentTabs"
              :key="tab.key"
              :class="{ active: activeContentTab === tab.key }"
              @click="switchContentTab(tab.key)"
            >
              <Icon :icon="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </div>

          <div v-if="contentLoading && contentPosts.length === 0" class="profile-post-grid">
            <div v-for="n in 6" :key="n" class="profile-post-card skeleton-card">
              <div class="skeleton h-56 rounded-[22px]" />
              <div class="p-4 space-y-2">
                <div class="skeleton h-4 w-4/5 rounded" />
                <div class="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>

          <div v-else-if="!contentLoading && contentPosts.length === 0" class="profile-empty">
            <WorldCoffeeLogo size="lg" variant="bare" />
            <h3>这里还没有内容</h3>
            <p>发布第一篇咖啡笔记，让主页真正热起来。</p>
            <button class="profile-main-btn tap-scale" @click="openComposer">去发布</button>
          </div>

          <div v-else class="profile-post-grid">
            <article
              v-for="post in contentPosts"
              :key="post.id"
              class="profile-post-card tap-scale"
              @click="router.push(`/posts/${post.id}`)"
            >
              <div class="profile-post-image">
                <img v-if="post.images && post.images.length" :src="post.images[0]" :alt="post.title" loading="lazy" />
                <div v-else><WorldCoffeeLogo size="sm" variant="bare" /></div>
                <span v-if="post.likeCount >= 10" class="profile-hot-badge">
                  <Icon icon="material-symbols:favorite" class="w-3 h-3" />
                  {{ post.likeCount }}
                </span>
              </div>
              <div class="profile-post-meta">
                <h4>{{ post.title }}</h4>
                <div>
                  <span>{{ formatDate(post.createTime) }}</span>
                  <span><Icon icon="material-symbols:favorite-outline" class="w-3 h-3" />{{ post.likeCount || 0 }}</span>
                </div>
              </div>
            </article>
          </div>

          <div v-if="contentHasMore" class="profile-load-more">
            <button :disabled="contentLoading" @click="loadMoreContent">
              {{ contentLoading ? '加载中...' : '加载更多内容' }}
            </button>
          </div>
        </section>
      </section>

      <aside class="profile-right">
        <section class="profile-service-card wc-web-card">
          <div class="profile-side-title">
            <Icon icon="material-symbols:local-cafe" class="w-5 h-5" />
            咖啡服务
          </div>
          <button class="profile-shop-entry" @click="router.push('/shop')">
            <span>
              <Icon icon="material-symbols:storefront-outline" class="w-5 h-5" />
              <strong>去 Coffee 商城</strong>
              <em>咖啡豆、器具和周边</em>
            </span>
            <Icon icon="material-symbols:arrow-forward" class="w-4 h-4" />
          </button>
          <button class="profile-service-item" @click="router.push('/shop/cart')">
            <span><Icon icon="material-symbols:shopping-cart" class="w-4 h-4" />购物车</span>
            <Icon icon="material-symbols:chevron-right" class="w-4 h-4" />
          </button>
          <button class="profile-service-item" @click="router.push('/shop/orders')">
            <span><Icon icon="material-symbols:receipt-long" class="w-4 h-4" />我的订单</span>
            <Icon icon="material-symbols:chevron-right" class="w-4 h-4" />
          </button>
          <button class="profile-service-item" @click="router.push('/shop/coupons')">
            <span><Icon icon="material-symbols:confirmation-number" class="w-4 h-4" />优惠券</span>
            <Icon icon="material-symbols:chevron-right" class="w-4 h-4" />
          </button>
        </section>

        <section v-if="false" class="profile-note-card wc-web-card">
          <p>今日灵感</p>
          <h3>写下这杯咖啡的一个细节</h3>
          <ul>
            <li>豆子的香气像什么？</li>
            <li>在哪家店喝到的？</li>
            <li>适合推荐给谁？</li>
          </ul>
        </section>
      </aside>
    </main>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="composerOpen"
          class="profile-composer-overlay fixed inset-0 z-[70] flex items-start justify-center px-3 py-5 sm:px-5 sm:py-8 lg:py-10"
          @click.self="closeComposer"
        >
          <div class="absolute inset-0 bg-black/45 backdrop-blur-[3px]" />
          <section class="profile-composer-modal relative w-full max-w-[760px] max-h-[90vh] overflow-hidden rounded-[26px] bg-surface-elevated border border-line/70 shadow-[0_28px_90px_rgba(33,28,24,.30)]">
            <div class="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-surface-elevated/92 border-b border-line/60 backdrop-blur-xl">
              <div class="min-w-0">
                <p class="text-[10px] font-black tracking-[0.18em] text-brand uppercase">WorldCoffee Note</p>
                <h2 class="text-[17px] font-black text-ink leading-tight">发布咖啡笔记</h2>
              </div>
              <button type="button" class="profile-composer-close tap-scale" aria-label="关闭发布面板" @click="closeComposer">
                <Icon icon="material-symbols:close" class="w-5 h-5" />
              </button>
            </div>
            <div class="profile-composer-body max-h-[calc(90vh-74px)] overflow-y-auto px-5 py-5">
              <CreatePost embedded @success="handleComposerSuccess" />
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { userApi, coffeeApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { WorldCoffeeLogo } from '@wc/shared'
import CreatePost from '../CreatePost.vue'

const router = useRouter()
const toast = inject<any>('toast')
const { updateUser, avatar: authAvatar } = useAuth()

function extractList(res) {
  if (!res || !res.data) return []
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data.data)) return res.data.data
  if (Array.isArray(res.data.records)) return res.data.records
  if (Array.isArray(res.data.list)) return res.data.list
  return []
}

const user = ref(null)
const stats = ref({
  posts: 0,
  likes: 0,
  favorites: 0,
  comments: 0,
  following: 0,
  followers: 0
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早安'
  if (h < 14) return '午安'
  if (h < 18) return '下午好'
  return '晚上好'
})

function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchStatsFor() {
  try {
    const res = await userApi.getMeStats()
    if (res && res.code === 200 && res.data) {
      const d = res.data
      stats.value = {
        posts: d.postCount ?? 0,
        likes: d.likeCount ?? 0,
        favorites: d.favoriteCount ?? 0,
        comments: d.commentCount ?? 0,
        following: d.followingCount ?? 0,
        followers: d.followerCount ?? 0
      }
    }
  } catch (e) {
    // 统计不是主流程，失败不打断个人页
  }
}

async function fetchUser() {
  try {
    const res = await userApi.getMe()
    if (res && res.code === 200) {
      if (!res.data?.avatar && authAvatar.value) {
        res.data.avatar = authAvatar.value
      }
      user.value = res.data

      if (res.data?.avatar) {
        updateUser({ avatar: res.data.avatar })
      }

      fetchStatsFor()
    } else {
      toast.show(res?.msg || '获取用户信息失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  }
}

const contentTabs = [
  { key: 'posts', label: '我的笔记', icon: 'material-symbols:article' },
  { key: 'likes', label: '我的赞', icon: 'material-symbols:favorite-outline' },
  { key: 'favorites', label: '我的收藏', icon: 'material-symbols:star-outline' }
]

const activeContentTab = ref('posts')
const contentPosts = ref([])
const contentLoading = ref(false)
const contentPage = ref(1)
const contentHasMore = ref(false)
const composerOpen = ref(false)

function openComposer() {
  composerOpen.value = true
}

function closeComposer() {
  composerOpen.value = false
}

function handleComposerSuccess() {
  composerOpen.value = false
  fetchContent(true)
  fetchStatsFor()
}

async function fetchContent(reset = false) {
  if (contentLoading.value) return
  if (reset) {
    contentPage.value = 1
    contentPosts.value = []
    contentHasMore.value = true
  }

  contentLoading.value = true
  try {
    const params = { page: contentPage.value, size: 12 }
    let res
    if (activeContentTab.value === 'likes') {
      res = await coffeeApi.getMyLikes(params)
    } else if (activeContentTab.value === 'favorites') {
      res = await coffeeApi.getMyFavorites(params)
    } else {
      res = await coffeeApi.getMyPosts(params)
    }
    if (res && res.code === 200) {
      const data = extractList(res)
      if (reset) contentPosts.value = data
      else contentPosts.value = [...contentPosts.value, ...data]
      contentHasMore.value = data.length >= 12
    } else {
      toast.show(res?.msg || '加载失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    contentLoading.value = false
  }
}

function switchContentTab(tab) {
  activeContentTab.value = tab
  fetchContent(true)
}

function loadMoreContent() {
  contentPage.value++
  fetchContent()
}

onMounted(() => {
  fetchUser()
  fetchContent(true)
})
</script>

<style scoped>
.profile-desktop {
  background:
    radial-gradient(circle at 8% 0%, rgba(166, 106, 67, .16), transparent 28%),
    radial-gradient(circle at 94% 12%, rgba(215, 204, 200, .24), transparent 30%),
    linear-gradient(180deg, #fbf7f2 0%, var(--bg-primary) 54%);
}
.profile-header-inner,
.profile-layout {
  width: min(1480px, 100%);
}
.profile-brand,
.profile-top-actions,
.profile-top-link,
.profile-service-item span {
  display: flex;
  align-items: center;
}
.profile-brand {
  gap: 12px;
  padding: 8px 12px 8px 8px;
  border-radius: 999px;
}
.profile-brand:hover { background: rgba(109, 76, 65, .06); }
.profile-brand strong {
  display: block;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.1;
  letter-spacing: -.03em;
}
.profile-brand em {
  display: block;
  margin-top: 2px;
  color: var(--text-muted);
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.profile-top-actions { gap: 10px; }
.profile-top-link {
  gap: 7px;
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  color: #fff8ef;
  background: linear-gradient(135deg, #8D5A3B, #3E2723);
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(109, 76, 65, .18);
}
.profile-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 280px;
  gap: 24px;
}
.profile-left,
.profile-right {
  position: sticky;
  top: 96px;
  align-self: start;
}
.profile-user-card,
.profile-content,
.profile-service-card,
.profile-note-card {
  border-radius: 28px;
  overflow: hidden;
}
.profile-cover {
  position: relative;
  height: 112px;
  background:
    linear-gradient(135deg, rgba(109, 76, 65, .92), rgba(166, 106, 67, .66)),
    radial-gradient(circle at 20% 20%, rgba(255, 248, 225, .36), transparent 32%);
}
.profile-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(120deg, rgba(255,255,255,.18), transparent 38%, rgba(255,255,255,.08));
}
.profile-cover-bean {
  position: absolute;
  right: 20px;
  bottom: 12px;
  z-index: 1;
  opacity: .34;
  font-size: 56px;
}
.profile-user-body {
  padding: 0 22px 20px;
  text-align: center;
}
.profile-avatar-lg {
  position: relative;
  z-index: 2;
  width: 98px;
  height: 98px;
  margin: -49px auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  overflow: hidden;
  border: 5px solid color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  color: #fff8ef;
  background: linear-gradient(135deg, #9a6346, #3E2723);
  box-shadow: 0 16px 34px rgba(62, 39, 35, .22);
  font-size: 32px;
  font-weight: 900;
}
.profile-avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-user-body h1 {
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -.04em;
}
.profile-subtitle {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
.profile-date {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 11px;
}
.profile-badges {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.profile-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}
.profile-badge.is-ok { color: #347553; background: rgba(124,174,140,.16); }
.profile-badge.is-danger { color: #b85c5c; background: rgba(232,139,139,.16); }
.profile-badge.is-phone { color: #2563eb; background: rgba(141,180,199,.16); }
.profile-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--divider);
  border-bottom: 1px solid var(--divider);
}
.profile-stat-grid div {
  min-height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.profile-stat-grid div:not(:nth-child(3n)) { border-right: 1px solid var(--divider); }
.profile-stat-grid div:nth-child(-n+3) { border-bottom: 1px solid var(--divider); }
.profile-stat-grid strong {
  color: var(--text-primary);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  line-height: 1;
}
.profile-stat-grid span {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 11px;
}
.profile-primary-actions {
  display: grid;
  gap: 10px;
  padding: 18px 20px 22px;
}
.profile-main-btn,
.profile-ghost-btn {
  height: 42px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 900;
}
.profile-main-btn {
  color: #fff8ef;
  background: linear-gradient(135deg, #8D5A3B, #3E2723);
  box-shadow: 0 12px 26px rgba(109, 76, 65, .2);
}
.profile-ghost-btn {
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 76%, transparent);
  border: 1px solid var(--divider);
}
.profile-center { min-width: 0; }
.profile-hero-row {
  min-height: 112px;
  margin-bottom: 18px;
  padding: 4px 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.profile-kicker {
  color: #a06d50;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .18em;
}
.profile-hero-row h2 {
  margin-top: 6px;
  color: var(--text-primary);
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1;
  font-weight: 950;
  letter-spacing: -.06em;
}
.profile-hero-row span {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 13px;
}
.profile-content { min-height: 520px; }
.profile-tabs {
  display: flex;
  gap: 8px;
  padding: 14px;
  border-bottom: 1px solid var(--divider);
}
.profile-tabs button {
  height: 38px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 800;
  transition: background .2s ease, color .2s ease;
}
.profile-tabs button:hover,
.profile-tabs button.active {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent-cream) 66%, transparent);
}
.profile-post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 18px;
  padding: 18px;
}
.profile-post-card {
  overflow: hidden;
  border-radius: 24px;
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  box-shadow: 0 8px 26px rgba(62, 39, 35, .055);
  cursor: pointer;
  transition: transform .22s ease, box-shadow .22s ease;
}
.profile-post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 42px rgba(62, 39, 35, .12);
}
.profile-post-image {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--bg-secondary);
}
.profile-post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-post-image > div {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-hot-badge {
  position: absolute;
  right: 10px;
  top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 999px;
  color: #ef4444;
  background: rgba(255,255,255,.9);
  font-size: 11px;
  font-weight: 900;
  backdrop-filter: blur(10px);
}
.profile-post-meta {
  padding: 13px 14px 14px;
}
.profile-post-meta h4 {
  min-height: 40px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.45;
  font-weight: 800;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.profile-post-meta > div {
  margin-top: 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 11px;
}
.profile-post-meta span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.profile-empty {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 20px;
}
.profile-empty h3 {
  margin-top: 18px;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 900;
}
.profile-empty p {
  margin: 8px 0 18px;
  color: var(--text-muted);
  font-size: 13px;
}
.profile-load-more {
  padding: 0 18px 20px;
  text-align: center;
}
.profile-load-more button {
  height: 40px;
  padding: 0 22px;
  border-radius: 999px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 72%, transparent);
  font-size: 13px;
  font-weight: 800;
}
.profile-right {
  display: grid;
  gap: 16px;
}
.profile-service-card,
.profile-note-card {
  padding: 18px;
}
.profile-side-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 900;
}
.profile-service-item {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
  transition: background .2s ease, color .2s ease;
}
.profile-service-item:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent-cream) 56%, transparent);
}
.profile-service-item span { gap: 8px; }
.profile-shop-entry {
  width: 100%;
  min-height: 78px;
  margin-bottom: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 22px;
  color: #fff8ef;
  text-align: left;
  background:
    radial-gradient(circle at 86% 0%, rgba(255,248,225,.22), transparent 34%),
    linear-gradient(135deg, #9a6346, #3E2723);
  box-shadow: 0 16px 32px rgba(109, 76, 65, .20);
}
.profile-shop-entry > span {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  column-gap: 10px;
  align-items: center;
  min-width: 0;
}
.profile-shop-entry svg:first-child {
  grid-row: span 2;
  width: 34px;
  height: 34px;
  padding: 8px;
  border-radius: 14px;
  background: rgba(255,255,255,.14);
}
.profile-shop-entry strong {
  display: block;
  font-size: 14px;
  font-weight: 950;
  line-height: 1.2;
}
.profile-shop-entry em {
  display: block;
  margin-top: 4px;
  color: rgba(255,248,239,.72);
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
}
.profile-note-card {
  background:
    linear-gradient(160deg, rgba(109, 76, 65, .9), rgba(62, 39, 35, .94)) !important;
  color: #fff8ef;
}
.profile-note-card p {
  color: rgba(255,248,239,.66);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .14em;
}
.profile-note-card h3 {
  margin-top: 8px;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 950;
  letter-spacing: -.04em;
}
.profile-note-card ul {
  margin-top: 18px;
  display: grid;
  gap: 9px;
  color: rgba(255,248,239,.78);
  font-size: 13px;
}
.skeleton-card {
  cursor: default;
}
.profile-composer-overlay {
  isolation: isolate;
}
.profile-composer-modal {
  animation: profile-composer-pop .18s ease-out both;
}
.profile-composer-body {
  overscroll-behavior: contain;
}
.profile-composer-close {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 999px;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--bg-secondary) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
}
@keyframes profile-composer-pop {
  from { opacity: 0; transform: translateY(18px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 1180px) {
  .profile-layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }
  .profile-right {
    display: none;
  }
}
@media (max-width: 860px) {
  .profile-header-inner,
  .profile-layout {
    padding-left: 14px;
    padding-right: 14px;
  }
  .profile-layout {
    display: block;
  }
  .profile-left {
    position: static;
    margin-bottom: 18px;
  }
  .profile-hero-row {
    min-height: auto;
    align-items: flex-start;
    flex-direction: column;
  }
  .profile-post-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 12px;
  }
  .profile-post-image {
    aspect-ratio: 1 / 1;
  }
}
</style>

