<template>
  <div class="min-h-screen pb-24 md:pb-8 bg-surface">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-line/30">
      <div class="max-w-2xl mx-auto px-3 md:px-6 h-14 flex items-center gap-3">
        <button
          class="flex items-center justify-center w-9 h-9 rounded-2xl bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] hover:shadow-[0_2px_12px_rgba(62,39,35,0.08)] transition-shadow flex-shrink-0 tap-scale"
          @click="router.push('/shop')"
        >
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-brand" />
        </button>
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #6D4C41, #3E2723);">
            <Icon icon="material-symbols:confirmation-number-outline" class="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="text-base font-bold text-brand leading-tight">优惠券中心</div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-3 md:px-6 pt-4">
      <!-- Tab 切换 -->
      <div class="flex gap-1 p-1 bg-surface-elevated rounded-2xl mb-5 shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)]">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all tap-scale',
            activeTab === tab.key
              ? 'bg-brand text-white shadow-[0_2px_8px_rgba(109,76,65,0.3)]'
              : 'text-ink-muted hover:text-ink'
          ]"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.badge" class="ml-1 text-[10px] opacity-80">({{ tab.badge }})</span>
        </button>
      </div>

      <!-- ==================== 可领取优惠券 ==================== -->
      <div v-if="activeTab === 'available'">
        <!-- 骨架屏 -->
        <div v-if="loading" class="space-y-3">
          <div v-for="n in 3" :key="n" class="rounded-2xl overflow-hidden bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)]">
            <div class="p-5 flex items-center gap-4">
              <div class="skeleton w-20 h-20 rounded-2xl flex-shrink-0" />
              <div class="flex-1 space-y-2.5">
                <div class="skeleton h-4 w-2/3 rounded" />
                <div class="skeleton h-3 w-1/2 rounded" />
                <div class="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="availableCoupons.length === 0" class="py-20 text-center">
          <div class="w-24 h-24 mx-auto mb-4 rounded-3xl brand-placeholder flex items-center justify-center shadow-inner">
            <Icon icon="material-symbols:confirmation-number-outline" class="w-12 h-12 text-brand/40" />
          </div>
          <h3 class="text-[17px] font-bold text-ink mb-1">暂无可领取的优惠券</h3>
          <p class="text-[13px] text-ink-muted">过段时间再来看看吧</p>
        </div>

        <!-- 优惠券列表 -->
        <div v-else class="space-y-3">
          <div
            v-for="coupon in availableCoupons"
            :key="coupon.id"
            class="group relative rounded-2xl overflow-hidden bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] hover:shadow-[0_4px_16px_rgba(62,39,35,0.1)] transition-all duration-300 animate-fade-up"
          >
            <!-- 锯齿装饰线 -->
            <div class="absolute left-[88px] top-0 bottom-0 w-px border-l border-dashed border-line/50" />
            <div class="absolute left-[84px] -top-2 w-4 h-4 rounded-full bg-surface" />
            <div class="absolute left-[84px] -bottom-2 w-4 h-4 rounded-full bg-surface" />

            <div class="flex items-center">
              <!-- 左侧：优惠金额区 -->
              <div class="w-[88px] flex-shrink-0 flex flex-col items-center justify-center py-5 relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.06]" :style="{ background: getCouponGradient(coupon.type) }" />
                <div class="relative text-center">
                  <template v-if="coupon.type === 2">
                    <div class="text-2xl font-black text-brand leading-none">{{ formatDiscount(coupon.value) }}</div>
                    <div class="text-[10px] text-ink-muted mt-0.5">折</div>
                  </template>
                  <template v-else>
                    <div class="text-[11px] text-ink-muted">¥</div>
                    <div class="text-2xl font-black text-brand leading-none">{{ formatPrice(coupon.value) }}</div>
                  </template>
                </div>
              </div>

              <!-- 右侧：信息区 -->
              <div class="flex-1 min-w-0 px-4 py-4">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <h3 class="text-[14px] font-bold text-ink leading-tight truncate">{{ coupon.name }}</h3>
                    <p v-if="coupon.minAmount && coupon.minAmount > 0" class="text-[11.5px] text-ink-muted mt-1">
                      满 ¥{{ formatPrice(coupon.minAmount) }} 可用
                    </p>
                    <p v-else class="text-[11.5px] text-ink-muted mt-1">无门槛使用</p>
                    <div class="flex items-center gap-2 mt-2">
                      <span class="text-[10px] font-medium px-2 py-0.5 rounded-md" :class="getTypeBadgeClass(coupon.type)">
                        {{ getTypeLabel(coupon.type) }}
                      </span>
                      <span v-if="coupon.endTime" class="text-[10px] text-ink-muted">
                        有效期至 {{ formatDate(coupon.endTime) }}
                      </span>
                    </div>
                  </div>

                  <!-- 领取按钮 -->
                  <button
                    v-if="!coupon.claimed"
                    class="flex-shrink-0 px-4 py-2 rounded-xl brand-gradient-btn text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(109,76,65,0.25)] hover:brightness-110 transition-all tap-scale disabled:opacity-50"
                    :disabled="claimingId === coupon.id"
                    @click.stop="handleClaim(coupon)"
                  >
                    <Icon v-if="claimingId === coupon.id" icon="material-symbols:progress-activity" class="w-3.5 h-3.5 animate-spin inline -mt-0.5 mr-1" />
                    {{ claimingId === coupon.id ? '领取中...' : '立即领取' }}
                  </button>
                  <span v-else class="flex-shrink-0 px-4 py-2 rounded-xl bg-surface-soft text-ink-muted text-[12px] font-medium">
                    已领取
                  </span>
                </div>
                <!-- 库存提示 -->
                <div v-if="coupon.stock && coupon.stock > 0 && coupon.stock <= 50 && !coupon.claimed" class="mt-2">
                  <span class="text-[10px] text-amber-600 font-medium">
                    <Icon icon="material-symbols:local-fire-department" class="w-3 h-3 inline -mt-0.5" />
                    仅剩 {{ coupon.stock }} 张
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 我的优惠券 ==================== -->
      <div v-if="activeTab === 'my'">
        <!-- 需要登录 -->
        <div v-if="!isLoggedIn" class="py-20 text-center">
          <div class="w-24 h-24 mx-auto mb-4 rounded-3xl brand-placeholder flex items-center justify-center shadow-inner">
            <Icon icon="material-symbols:person-outline" class="w-12 h-12 text-brand/40" />
          </div>
          <h3 class="text-[17px] font-bold text-ink mb-1">请先登录</h3>
          <p class="text-[13px] text-ink-muted mb-5">登录后查看您的优惠券</p>
          <router-link
            to="/login"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl brand-gradient-btn text-sm font-semibold text-white shadow-[0_4px_14px_rgba(109,76,65,0.25)] tap-scale"
          >
            立即登录
          </router-link>
        </div>

        <!-- 骨架屏 -->
        <div v-else-if="myLoading" class="space-y-3">
          <div v-for="n in 3" :key="n" class="rounded-2xl overflow-hidden bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)]">
            <div class="p-5 flex items-center gap-4">
              <div class="skeleton w-20 h-20 rounded-2xl flex-shrink-0" />
              <div class="flex-1 space-y-2.5">
                <div class="skeleton h-4 w-2/3 rounded" />
                <div class="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="myCoupons.length === 0" class="py-20 text-center">
          <div class="w-24 h-24 mx-auto mb-4 rounded-3xl brand-placeholder flex items-center justify-center shadow-inner">
            <Icon icon="material-symbols:confirmation-number-outline" class="w-12 h-12 text-brand/40" />
          </div>
          <h3 class="text-[17px] font-bold text-ink mb-1">暂无优惠券</h3>
          <p class="text-[13px] text-ink-muted mb-5">去领取一些优惠券吧</p>
          <button
            class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl brand-gradient-btn text-sm font-semibold text-white shadow-[0_4px_14px_rgba(109,76,65,0.25)] tap-scale"
            @click="switchTab('available')"
          >
            去领取
          </button>
        </div>

        <!-- 我的优惠券列表 -->
        <div v-else class="space-y-3">
          <div
            v-for="coupon in myCoupons"
            :key="coupon.id"
            class="relative rounded-2xl overflow-hidden bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] animate-fade-up"
          >
            <!-- 锯齿装饰线 -->
            <div class="absolute left-[88px] top-0 bottom-0 w-px border-l border-dashed border-line/50" />
            <div class="absolute left-[84px] -top-2 w-4 h-4 rounded-full bg-surface" />
            <div class="absolute left-[84px] -bottom-2 w-4 h-4 rounded-full bg-surface" />

            <div class="flex items-center">
              <!-- 左侧：优惠金额区 -->
              <div class="w-[88px] flex-shrink-0 flex flex-col items-center justify-center py-5 relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.06]" :style="{ background: getCouponGradient(coupon.type) }" />
                <div class="relative text-center">
                  <template v-if="coupon.type === 2">
                    <div class="text-2xl font-black text-brand leading-none">{{ formatDiscount(coupon.value) }}</div>
                    <div class="text-[10px] text-ink-muted mt-0.5">折</div>
                  </template>
                  <template v-else>
                    <div class="text-[11px] text-ink-muted">¥</div>
                    <div class="text-2xl font-black text-brand leading-none">{{ formatPrice(coupon.value) }}</div>
                  </template>
                </div>
              </div>

              <!-- 右侧：信息区 -->
              <div class="flex-1 min-w-0 px-4 py-4">
                <h3 class="text-[14px] font-bold text-ink leading-tight truncate">{{ coupon.name }}</h3>
                <p v-if="coupon.minAmount && coupon.minAmount > 0" class="text-[11.5px] text-ink-muted mt-1">
                  满 ¥{{ formatPrice(coupon.minAmount) }} 可用
                </p>
                <p v-else class="text-[11.5px] text-ink-muted mt-1">无门槛使用</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-md" :class="getTypeBadgeClass(coupon.type)">
                    {{ getTypeLabel(coupon.type) }}
                  </span>
                  <span v-if="coupon.endTime" class="text-[10px] text-ink-muted">
                    有效期至 {{ formatDate(coupon.endTime) }}
                  </span>
                </div>
                <!-- 去使用按钮 -->
                <button
                  class="mt-3 px-4 py-1.5 rounded-lg border border-brand/30 text-brand text-[11.5px] font-semibold hover:bg-brand/5 transition-colors tap-scale"
                  @click="router.push('/shop')"
                >
                  去使用
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { couponApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'

const router = useRouter()
const toast = inject<any>('toast')
const { isLoggedIn } = useAuth()

const tabs = [
  { key: 'available', label: '可领取', badge: ref(0) },
  { key: 'my', label: '我的优惠券', badge: ref(0) }
]
const activeTab = ref('available')

const availableCoupons = ref([])
const myCoupons = ref([])
const loading = ref(false)
const myLoading = ref(false)
const claimingId = ref(null)

function switchTab(key) {
  activeTab.value = key
  if (key === 'available' && availableCoupons.value.length === 0) {
    fetchAvailable()
  }
  if (key === 'my' && isLoggedIn.value && myCoupons.value.length === 0) {
    fetchMyCoupons()
  }
}

async function fetchAvailable() {
  loading.value = true
  try {
    const res = await couponApi.getAvailable()
    availableCoupons.value = res.data || []
    tabs[0].badge.value = availableCoupons.value.length
  } catch (e) {
    toast?.show(getApiError(e), 'error')
  } finally {
    loading.value = false
  }
}

async function fetchMyCoupons() {
  if (!isLoggedIn.value) return
  myLoading.value = true
  try {
    const res = await couponApi.getMy()
    myCoupons.value = res.data || []
    tabs[1].badge.value = myCoupons.value.length
  } catch (e) {
    toast?.show(getApiError(e), 'error')
  } finally {
    myLoading.value = false
  }
}

async function handleClaim(coupon) {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  claimingId.value = coupon.id
  try {
    await couponApi.claim(coupon.id)
    toast?.show('领取成功！', 'success')
    coupon.claimed = true
    // 刷新我的优惠券
    if (isLoggedIn.value) {
      fetchMyCoupons()
    }
  } catch (e) {
    toast?.show(getApiError(e), 'error')
  } finally {
    claimingId.value = null
  }
}

// ─── 工具函数 ───────────────────────────────
function formatPrice(price) {
  if (price == null) return '0'
  const num = Number(price)
  if (Number.isInteger(num)) return num.toFixed(0)
  return num.toFixed(2)
}

function formatDiscount(value) {
  if (value == null) return '0'
  const num = Number(value)
  // 后端存的可能是 0.85 表示 8.5 折，也可能是 8.5 直接表示
  if (num < 1) return (num * 10).toFixed(1)
  return num.toFixed(1)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function getTypeLabel(type) {
  switch (type) {
    case 1: return '满减券'
    case 2: return '折扣券'
    case 3: return '秒杀券'
    default: return '优惠券'
  }
}

function getTypeBadgeClass(type) {
  switch (type) {
    case 1: return 'bg-brand/10 text-brand'
    case 2: return 'bg-amber-50 text-amber-700'
    case 3: return 'bg-red-50 text-red-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getCouponGradient(type) {
  switch (type) {
    case 1: return 'linear-gradient(135deg, #6D4C41, #3E2723)'
    case 2: return 'linear-gradient(135deg, #F59E0B, #D97706)'
    case 3: return 'linear-gradient(135deg, #EF4444, #DC2626)'
    default: return 'linear-gradient(135deg, #6D4C41, #3E2723)'
  }
}

onMounted(() => {
  fetchAvailable()
  if (isLoggedIn.value) {
    fetchMyCoupons()
  }
})
</script>
