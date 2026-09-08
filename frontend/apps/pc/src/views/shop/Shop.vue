<template>
  <div class="min-h-screen pb-20 md:pb-6">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-line/30">
      <div class="max-w-6xl mx-auto px-3 md:px-6 h-16 flex items-center gap-3">
        <!-- 返回按钮 -->
        <button
          class="flex items-center justify-center w-9 h-9 rounded-2xl bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] hover:shadow-[0_2px_12px_rgba(62,39,35,0.08)] transition-shadow flex-shrink-0 tap-scale"
          @click="router.push('/')"
        >
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-brand" />
        </button>

        <!-- 标题 -->
        <div class="flex items-center gap-2 flex-shrink-0 min-w-0">
          <WorldCoffeeLogoMini :size="36" :with-circle="false" />
          <div class="hidden sm:block">
            <div class="text-base font-bold text-brand leading-tight">咖啡商城</div>
            <div class="text-[11px] text-ink-muted">精选好豆 · 原厂直发</div>
          </div>
        </div>

        <!-- 搜索框 -->
        <div class="flex-1 relative min-w-0">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索咖啡..."
            class="w-full h-9 pl-9 pr-8 rounded-xl bg-surface-elevated border border-line/30 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all"
            @keyup.enter="handleSearch"
            @keydown.escape="clearSearch"
          />
          <Icon icon="material-symbols:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none" />
          <button
            v-if="searchKeyword"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-line/30 transition-colors"
            @click="clearSearch"
          >
            <Icon icon="material-symbols:close" class="w-3.5 h-3.5 text-ink-muted" />
          </button>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <router-link
            to="/shop/coupons"
            class="p-2.5 rounded-2xl bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] hover:shadow-[0_2px_12px_rgba(62,39,35,0.08)] transition-shadow tap-scale"
          >
            <Icon icon="material-symbols:confirmation-number-outline" class="w-5 h-5 text-brand" />
          </router-link>
          <router-link
            v-if="isLoggedIn"
            to="/shop/cart"
            class="relative p-2.5 rounded-2xl bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] hover:shadow-[0_2px_12px_rgba(62,39,35,0.08)] transition-shadow tap-scale"
          >
            <Icon icon="material-symbols:shopping-cart-outline" class="w-5 h-5 text-brand" />
            <span
              v-if="cartCount > 0"
              class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {{ cartCount > 99 ? '99+' : cartCount }}
            </span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="max-w-6xl mx-auto px-3 md:px-6 pt-4 pb-8">
      <!-- 秒杀轮播 -->
      <div v-if="seckillActivities.length > 0" class="mb-5">
        <div
          class="relative rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(62,39,35,0.08)]"
          @touchstart="onCarouselTouchStart"
          @touchmove="onCarouselTouchMove"
          @touchend="onCarouselTouchEnd"
          @mouseenter="pauseCarousel"
          @mouseleave="resumeCarousel"
        >
          <!-- 滑动轨道 -->
          <div
            class="flex transition-transform duration-500 ease-out"
            :style="{ transform: `translateX(-${carouselIndex * 100}%)` }"
          >
            <div
              v-for="act in seckillActivities"
              :key="act.id"
              class="w-full shrink-0 cursor-pointer group"
              @click="openSeckillModal(act)"
            >
              <!-- 图片 + 标签 -->
              <div class="relative h-[160px] overflow-hidden bg-surface-soft">
                <img
                  v-if="act.productImage"
                  :src="act.productImage"
                  :alt="act.productName || act.name"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center brand-placeholder">
                  <WorldCoffeeLogoMini :size="40" :with-circle="false" />
                </div>
                <!-- 秒杀标签 -->
                <span class="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(239,68,68,0.4)] flex items-center gap-1">
                  <Icon icon="material-symbols:flash-on" class="w-3 h-3" />
                  秒杀
                </span>
                <!-- 倒计时 -->
                <span class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-full">
                  {{ getCountdown(act) }}
                </span>
              </div>
              <!-- 内容 -->
              <div class="p-3 bg-surface-elevated">
                <div class="flex items-center justify-between">
                  <h3 class="text-[13px] font-bold text-brand leading-snug line-clamp-1 flex-1 min-w-0">
                    {{ act.productName || act.name }}
                  </h3>
                  <div class="flex items-baseline gap-1.5 ml-3 shrink-0">
                    <span class="text-[11px] text-red-500 font-bold">¥</span>
                    <span class="text-base font-bold text-red-500 leading-none">{{ formatPrice(act.seckillPrice) }}</span>
                    <span class="text-[10px] text-ink-muted line-through">¥{{ formatPrice(act.value) }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-1.5">
                  <span v-if="act.stock !== null && act.stock !== undefined" class="text-[10px] text-ink-muted">
                    仅剩 <span class="text-red-500 font-semibold">{{ act.stock }}</span> 件
                  </span>
                  <span v-else class="text-[10px] text-ink-muted">限量抢购</span>
                  <button class="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_14px_rgba(239,68,68,0.4)] transition-all tap-scale">
                    立即秒杀
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 圆点指示器 -->
          <div v-if="seckillActivities.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            <span
              v-for="(_, i) in seckillActivities"
              :key="i"
              :class="[
                'block rounded-full transition-all duration-300',
                i === carouselIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
              ]"
            />
          </div>
        </div>
      </div>

      <!-- 分类过滤 -->
      <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        <button
          class="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all tap-scale"
          :class="activeCategoryId === null
            ? 'brand-gradient-btn shadow-[0_2px_12px_rgba(109,76,65,0.25)]'
            : 'bg-surface-elevated text-brand/80 hover:text-brand shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] hover:shadow-[0_2px_12px_rgba(109,76,65,0.08)]'"
          @click="activeCategoryId = null; fetchProducts(true)"
        >
          <Icon icon="material-symbols:coffee" class="w-4 h-4" />
          全部
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'shrink-0 px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all tap-scale',
            activeCategoryId === cat.id
              ? 'brand-gradient-btn shadow-[0_2px_12px_rgba(109,76,65,0.25)]'
              : 'bg-surface-elevated text-brand/80 hover:text-brand shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] hover:shadow-[0_2px_12px_rgba(109,76,65,0.08)]'
          ]"
          @click="activeCategoryId = cat.id; fetchProducts(true)"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- 骨架屏 -->
      <div v-if="loading && products.length === 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <div v-for="n in 8" :key="n" class="rounded-2xl overflow-hidden bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)]">
          <div class="skeleton aspect-square" />
          <div class="p-3 space-y-2.5">
            <div class="skeleton h-3.5 w-full rounded" />
            <div class="skeleton h-3.5 w-1/2 rounded" />
            <div class="flex items-center justify-between pt-1">
              <div class="skeleton h-4 w-16 rounded" />
              <div class="skeleton h-3 w-12 rounded" />
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && products.length === 0" class="py-20 text-center">
        <div class="w-28 h-28 mx-auto mb-4 rounded-3xl brand-placeholder flex items-center justify-center shadow-inner">
          <WorldCoffeeLogoMini :size="56" :with-circle="false" />
        </div>
        <h3 class="text-[17px] font-bold text-brand mb-1">暂无商品</h3>
        <p class="text-[13px] text-ink-muted">商城正在备货中，敬请期待</p>
      </div>

      <!-- 商品网格 -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <article
          v-for="(product, i) in products"
          :key="product.id"
          class="group bg-surface-elevated rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] border border-transparent hover:border-line/50 hover:shadow-[0_4px_20px_rgba(62,39,35,0.12)] transition-all duration-300 cursor-pointer animate-fade-up"
          :style="{ animationDelay: `${(i % 12) * 40}ms` }"
          @click="goToDetail(product)"
        >
          <!-- 图片 -->
          <div class="relative overflow-hidden bg-surface-soft aspect-square">
            <img
              v-if="product.images && product.images.length"
              :src="product.images[0]"
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              loading="lazy"
              @error="handleImgError($event, product)"
            />
            <div v-if="imgErrors[product.id]" class="absolute inset-0 flex items-center justify-center brand-placeholder">
              <WorldCoffeeLogoMini :size="40" :with-circle="false" />
            </div>
            <div v-else-if="!product.images || !product.images.length" class="absolute inset-0 flex items-center justify-center brand-placeholder">
              <WorldCoffeeLogoMini :size="40" :with-circle="false" />
            </div>

            <!-- 热销徽章 -->
            <span
              v-if="(product.sales || 0) >= 50"
              class="absolute top-2 left-2 bg-gradient-to-br from-rose-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(232,139,139,0.4)] flex items-center gap-1"
            >
              <Icon icon="material-symbols:local-fire-department" class="w-3 h-3" />
              热销
            </span>

            <!-- 库存不足 -->
            <span
              v-else-if="product.stock !== undefined && product.stock > 0 && product.stock < 10"
              class="absolute top-2 left-2 bg-gradient-to-br from-amber-400 to-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
            >
              仅剩 {{ product.stock }}
            </span>

            <!-- 售罄 -->
            <div v-if="product.stock === 0" class="absolute inset-0 bg-brand/30 backdrop-blur-[2px] flex items-center justify-center">
              <span class="text-white font-bold text-sm px-4 py-1.5 rounded-full bg-brand/70">已售罄</span>
            </div>
          </div>

          <!-- 内容区 -->
          <div class="p-3">
            <h3 class="text-[13px] font-bold text-brand leading-snug line-clamp-2 min-h-[36px] mb-2">
              {{ product.name }}
            </h3>

            <!-- 烘焙度/产地 -->
            <div class="flex flex-wrap items-center gap-1 mb-2.5">
              <span v-if="product.roastLevel" class="inline-flex items-center gap-1 bg-surface-soft text-brand text-[10.5px] px-1.5 py-1 rounded-lg font-medium">
                {{ product.roastLevel }}
              </span>
              <span v-if="product.origin" class="inline-flex items-center gap-1 bg-blue-50/70 text-blue-600 text-[10.5px] px-1.5 py-1 rounded-lg font-medium truncate">
                {{ product.origin.length > 8 ? product.origin.slice(0, 8) + '…' : product.origin }}
              </span>
            </div>

            <!-- 价格 + 销量 -->
            <div class="flex items-end justify-between mb-3">
              <div class="flex items-baseline gap-0.5">
                <span class="text-[11px] text-amber font-bold">¥</span>
                <span class="text-xl font-bold text-brand leading-none">{{ formatPrice(product.price) }}</span>
              </div>
              <span class="text-[11px] text-ink-muted">{{ formatSales(product.sales) }} 已售</span>
            </div>

            <!-- 加入购物车按钮 -->
            <button
              :disabled="!!addCartLoading[product.id] || product.stock === 0"
              class="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-bold transition-all brand-gradient-btn shadow-[0_2px_8px_rgba(109,76,65,0.25)] hover:shadow-[0_4px_14px_rgba(109,76,65,0.35)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 tap-scale"
              @click.stop="handleAddToCart(product)"
            >
              <Icon v-if="!addCartLoading[product.id]" icon="material-symbols:shopping-bag" class="w-3.5 h-3.5" />
              <Icon v-else icon="material-symbols:refresh" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ product.stock === 0 ? '已售罄' : '加入购物车' }}</span>
            </button>
          </div>
        </article>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && products.length > 0" class="flex justify-center py-8">
        <button
          class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface-elevated shadow-[0_1px_2px_rgba(62,39,35,0.04),0_2px_8px_rgba(62,39,35,0.05)] text-brand text-sm font-semibold tap-scale transition-all hover:shadow-[0_2px_12px_rgba(62,39,35,0.08)] disabled:opacity-50"
          :disabled="loading"
          @click="fetchProducts()"
        >
          <Icon v-if="loading" icon="material-symbols:refresh" class="w-4 h-4 animate-spin" />
          <Icon v-else icon="material-symbols:expand-more" class="w-4 h-4" />
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>

      <!-- 到底啦 -->
      <div v-if="!hasMore && !loading && products.length > 0" class="flex justify-center py-8">
        <div class="flex items-center gap-2 text-[12px] text-ink-muted">
          <div class="w-12 h-px bg-line/50"></div>
          <span>— 已经到底啦 —</span>
          <div class="w-12 h-px bg-line/50"></div>
        </div>
      </div>
    </main>

    <!-- 秒杀弹窗 -->
    <Teleport to="body">
      <div v-if="seckillModal.show" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center" @click.self="closeSeckillModal">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeSeckillModal"></div>
        <!-- 弹窗内容 -->
        <div class="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
          <!-- 头部 -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-line/30">
            <h3 class="text-base font-bold text-brand flex items-center gap-2">
              <Icon icon="material-symbols:flash-on" class="w-5 h-5 text-red-500" />
              秒杀确认
            </h3>
            <button class="p-1.5 rounded-full hover:bg-surface-soft transition-colors" @click="closeSeckillModal">
              <Icon icon="material-symbols:close" class="w-5 h-5 text-ink-muted" />
            </button>
          </div>

          <div class="px-5 py-4 space-y-4">
            <!-- 商品信息 -->
            <div class="flex gap-3 p-3 bg-surface-soft rounded-2xl">
              <img
                v-if="seckillModal.activity?.productImage"
                :src="seckillModal.activity.productImage"
                class="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold text-brand line-clamp-1">{{ seckillModal.activity?.productName || seckillModal.activity?.name }}</h4>
                <div class="flex items-baseline gap-2 mt-1">
                  <span class="text-base font-bold text-red-500">¥{{ formatPrice(seckillModal.activity?.seckillPrice) }}</span>
                  <span class="text-xs text-ink-muted line-through">¥{{ formatPrice(seckillModal.activity?.value) }}</span>
                </div>
              </div>
            </div>

            <!-- 收货地址 -->
            <div>
              <label class="text-xs font-semibold text-ink-muted mb-1.5 block">收货地址</label>
              <input
                v-model="seckillModal.address"
                type="text"
                placeholder="请输入收货地址（姓名、电话、详细地址）"
                class="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-line/30 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-red-400/50 focus:ring-2 focus:ring-red-400/10 transition-all"
              />
            </div>

            <!-- 验证码 -->
            <div v-if="seckillModal.step === 'captcha'">
              <label class="text-xs font-semibold text-ink-muted mb-1.5 block">验证码</label>
              <div class="flex gap-2">
                <input
                  v-model="seckillModal.captchaInput"
                  type="text"
                  maxlength="4"
                  placeholder="请输入验证码"
                  class="flex-1 h-10 px-3 rounded-xl bg-surface-elevated border border-line/30 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-red-400/50 focus:ring-2 focus:ring-red-400/10 transition-all"
                  @keyup.enter="handleSeckillSubmit"
                />
                <button
                  class="shrink-0 h-10 px-4 rounded-xl bg-surface-elevated border border-line/30 text-sm text-brand font-semibold hover:bg-surface-soft transition-colors"
                  :disabled="seckillModal.captchaLoading"
                  @click="fetchCaptcha"
                >
                  {{ seckillModal.captchaLoading ? '获取中...' : (seckillModal.captchaCode ? seckillModal.captchaCode : '获取验证码') }}
                </button>
              </div>
              <p class="text-[10px] text-ink-muted mt-1">点击右侧按钮获取验证码，60秒有效</p>
            </div>

            <!-- 处理中 -->
            <div v-if="seckillModal.step === 'processing'" class="flex items-center justify-center py-4">
              <Icon icon="material-symbols:progress-activity" class="w-8 h-8 text-red-500 animate-spin" />
              <span class="ml-2 text-sm text-ink-muted">秒杀处理中...</span>
            </div>

            <!-- 成功 -->
            <div v-if="seckillModal.step === 'success'" class="text-center py-4">
              <Icon icon="material-symbols:check-circle" class="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p class="text-sm font-bold text-brand">秒杀成功！</p>
              <p class="text-xs text-ink-muted mt-1">订单号：{{ seckillModal.orderNo }}</p>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div v-if="seckillModal.step !== 'success' && seckillModal.step !== 'processing'" class="px-5 pb-5 pt-2 flex gap-3">
            <button
              class="flex-1 h-11 rounded-xl bg-surface-elevated border border-line/30 text-sm font-semibold text-ink hover:bg-surface-soft transition-colors"
              @click="closeSeckillModal"
            >
              取消
            </button>
            <button
              class="flex-1 h-11 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-[0_2px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canSeckill"
              @click="handleSeckillSubmit"
            >
              {{ seckillModal.step === 'captcha' ? '确认秒杀' : '获取验证码' }}
            </button>
          </div>
          <div v-if="seckillModal.step === 'success'" class="px-5 pb-5 pt-2">
            <button
              class="w-full h-11 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-[0_2px_12px_rgba(239,68,68,0.3)] transition-all"
              @click="closeSeckillModal"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { shopApi, seckillApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { WorldCoffeeLogoMini } from '@wc/shared'

const router = useRouter()
const toast = inject<any>('toast')
const { isLoggedIn } = useAuth()

const products = ref([])
const imgErrors = reactive({})
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 12
const addCartLoading = reactive({})
const cartCount = ref(0)
const activeCategoryId = ref(null)
const categories = ref([])
const searchKeyword = ref('')
const isSearchMode = ref(false)

// ─── 秒杀相关 ───────────────────────────────
const seckillActivities = ref([])

// ─── 轮播相关 ───────────────────────────────
const carouselIndex = ref(0)
let carouselTimer = null
let touchStartX = 0
let touchDeltaX = 0
const seckillModal = reactive({
  show: false,
  activity: null,
  address: '',
  step: 'captcha',        // captcha | processing | success
  captchaCode: '',
  captchaInput: '',
  captchaLoading: false,
  seckillToken: '',
  orderNo: ''
})
let countdownTimer = null

function handleImgError(e, product) {
  if (product?.id != null) imgErrors[product.id] = true
}

function formatPrice(price) {
  if (price == null) return '0.00'
  const num = Number(price)
  if (Number.isInteger(num)) return num.toFixed(0)
  return num.toFixed(2)
}

function formatSales(sales) {
  if (!sales) return 0
  if (sales >= 10000) return (sales / 10000).toFixed(1) + 'w'
  if (sales >= 1000) return (sales / 1000).toFixed(1) + 'k'
  return sales
}

function extractList(res) {
  if (!res || !res.data) return []
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data.data)) return res.data.data
  if (Array.isArray(res.data.records)) return res.data.records
  if (Array.isArray(res.data.list)) return res.data.list
  return []
}

async function fetchCategories() {
  try {
    const res = await shopApi.listCategories()
    if (res && res.code === 200) {
      categories.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    console.warn('获取分类失败', e)
  }
}

async function fetchProducts(reset = false) {
  if (loading.value) return
  if (reset) { page.value = 1; products.value = []; hasMore.value = true }

  loading.value = true
  try {
    // 搜索模式
    if (isSearchMode.value && searchKeyword.value.trim()) {
      const res = await shopApi.searchProducts(searchKeyword.value.trim())
      if (res && res.code === 200) {
        products.value = Array.isArray(res.data) ? res.data : []
        hasMore.value = false // 搜索结果不分页
      }
    } else {
      // 正常浏览模式
      const params: any = { page: page.value, size: pageSize }
      if (activeCategoryId.value !== null) params.categoryId = activeCategoryId.value
      const res = await shopApi.getProducts(params)
      if (res && res.code === 200) {
        const newProducts = extractList(res)
        products.value = [...products.value, ...newProducts]
        hasMore.value = newProducts.length >= pageSize
      }
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    isSearchMode.value = true
    fetchProducts(true)
  } else {
    clearSearch()
  }
}

function clearSearch() {
  searchKeyword.value = ''
  isSearchMode.value = false
  fetchProducts(true)
}

function goToDetail(product) {
  if (product?.id) router.push(`/shop/product/${product.id}`)
}

async function handleAddToCart(product) {
  if (!product?.id) return
  if (!isLoggedIn.value) {
    toast.show('请先登录后再加入购物车', 'warn')
    router.push('/login')
    return
  }
  if (product.stock === 0) {
    toast.show('商品已售罄', 'warn')
    return
  }

  addCartLoading[product.id] = true
  try {
    const res = await shopApi.addToCart(product.id, 1)
    if (res && res.code === 200) {
      toast.show('已加入购物车', 'success')
      cartCount.value = (cartCount.value || 0) + 1
    } else {
      toast.show(res?.msg || '加入购物车失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    addCartLoading[product.id] = false
  }
}

// ─── 秒杀方法 ───────────────────────────────
async function fetchSeckillActivities() {
  try {
    const res = await seckillApi.getActivities()
    if (res && res.code === 200) {
      seckillActivities.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    console.warn('获取秒杀活动失败', e)
  }
}

function getCountdown(act) {
  if (!act?.endTime) return '--:--:--'
  const end = new Date(act.endTime).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function startCountdown() {
  stopCountdown()
  countdownTimer = setInterval(() => {
    // 触发响应式更新：重新赋值数组
    seckillActivities.value = [...seckillActivities.value]
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// ─── 轮播逻辑 ───────────────────────────────
function nextSlide() {
  if (seckillActivities.value.length <= 1) return
  carouselIndex.value = (carouselIndex.value + 1) % seckillActivities.value.length
}

function startCarousel() {
  stopCarousel()
  carouselTimer = setInterval(nextSlide, 4000)
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
}

function pauseCarousel() {
  stopCarousel()
}

function resumeCarousel() {
  if (seckillActivities.value.length > 1) startCarousel()
}

function onCarouselTouchStart(e) {
  touchStartX = e.touches[0].clientX
  touchDeltaX = 0
  pauseCarousel()
}

function onCarouselTouchMove(e) {
  touchDeltaX = e.touches[0].clientX - touchStartX
}

function onCarouselTouchEnd() {
  if (Math.abs(touchDeltaX) > 50) {
    if (touchDeltaX < 0) {
      // 左滑 → 下一张
      carouselIndex.value = Math.min(carouselIndex.value + 1, seckillActivities.value.length - 1)
    } else {
      // 右滑 → 上一张
      carouselIndex.value = Math.max(carouselIndex.value - 1, 0)
    }
  }
  resumeCarousel()
}

// 秒杀数据变化时重置轮播位置
watch(seckillActivities, (list) => {
  if (list.length > 0) {
    carouselIndex.value = 0
    if (list.length > 1) startCarousel()
    else stopCarousel()
  } else {
    stopCarousel()
  }
})

function openSeckillModal(act) {
  if (!isLoggedIn.value) {
    toast.show('请先登录后再参与秒杀', 'warn')
    router.push('/login')
    return
  }
  seckillModal.activity = act
  seckillModal.address = ''
  seckillModal.step = 'captcha'
  seckillModal.captchaCode = ''
  seckillModal.captchaInput = ''
  seckillModal.captchaLoading = false
  seckillModal.seckillToken = ''
  seckillModal.orderNo = ''
  seckillModal.show = true
}

function closeSeckillModal() {
  seckillModal.show = false
  seckillModal.activity = null
}

async function fetchCaptcha() {
  seckillModal.captchaLoading = true
  try {
    const res = await seckillApi.getCaptcha()
    if (res && res.code === 200) {
      seckillModal.captchaCode = res.data
      toast.show('验证码已获取，请尽快输入', 'success')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    seckillModal.captchaLoading = false
  }
}

const canSeckill = computed(() => {
  if (seckillModal.step === 'processing') return false
  if (seckillModal.step === 'captcha') {
    return seckillModal.captchaInput.trim().length === 4 && seckillModal.address.trim().length > 0
  }
  // step 不是 captcha 时（初始状态），至少要有地址
  return seckillModal.address.trim().length > 0
})

async function handleSeckillSubmit() {
  // 第一步：获取验证码
  if (seckillModal.step !== 'captcha') {
    // 还没到验证码阶段，先获取验证码
    await fetchCaptcha()
    return
  }

  // 第二步：用验证码换 token，然后下单
  if (!seckillModal.captchaInput.trim()) {
    toast.show('请输入验证码', 'warn')
    return
  }
  if (!seckillModal.address.trim()) {
    toast.show('请填写收货地址', 'warn')
    return
  }

  seckillModal.step = 'processing'
  try {
    // 1. 用验证码换 token
    const tokenRes = await seckillApi.getToken(seckillModal.captchaInput.trim())
    if (!tokenRes || tokenRes.code !== 200) {
      toast.show(tokenRes?.msg || '验证码错误', 'error')
      seckillModal.step = 'captcha'
      return
    }
    seckillModal.seckillToken = tokenRes.data

    // 2. 秒杀下单
    const act = seckillModal.activity
    const buyRes = await seckillApi.buy({
      couponId: act.id,
      productId: act.productId,
      address: seckillModal.address.trim(),
      remark: '',
      seckillToken: seckillModal.seckillToken
    })

    if (buyRes && buyRes.code === 200) {
      seckillModal.orderNo = buyRes.data?.orderNo || ''
      seckillModal.step = 'success'
      toast.show('秒杀成功！', 'success')
    } else {
      toast.show(buyRes?.msg || '秒杀失败', 'error')
      seckillModal.step = 'captcha'
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
    seckillModal.step = 'captcha'
  }
}

onMounted(() => {
  fetchCategories()
  fetchProducts(true)
  fetchSeckillActivities()
  startCountdown()
  startCarousel()
})

onUnmounted(() => {
  stopCountdown()
  stopCarousel()
})
</script>

<style scoped>
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
