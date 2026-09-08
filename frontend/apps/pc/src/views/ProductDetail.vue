<template>
  <div class="min-h-screen bg-surface/50">
    <!-- ─── Header ─────────────────────────────── -->
    <header class="sticky top-0 z-40 bg-surface-elevated/85 backdrop-blur-xl border-b border-line/40">
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-surface transition-colors flex-shrink-0"
          @click="router.back()"
        >
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-brand" />
        </button>

        <div class="flex items-center gap-2 flex-1 min-w-0">
          <h1 class="font-serif text-lg text-ink truncate">
            商品详情
          </h1>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            class="relative p-2 rounded-xl hover:bg-surface transition-colors"
            @click="router.push('/shop')"
          >
            <Icon icon="material-symbols:storefront" class="w-5 h-5 text-brand" />
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto pb-24">
      <!-- ─── 骨架屏 ─────────────────────────── -->
      <div v-if="loading" class="animate-pulse">
        <div class="skeleton aspect-square md:aspect-[4/3]" />
        <div class="p-4 bg-surface-elevated md:mt-4 md:rounded-coffee-lg space-y-3">
          <div class="skeleton h-5 w-3/4 rounded" />
          <div class="skeleton h-4 w-1/3 rounded" />
          <div class="skeleton h-3 w-full rounded" />
          <div class="skeleton h-3 w-5/6 rounded" />
        </div>
        <div class="mt-3 p-4 bg-surface-elevated md:rounded-coffee-lg space-y-2">
          <div class="skeleton h-3 w-full rounded" />
          <div class="skeleton h-3 w-full rounded" />
          <div class="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>

      <!-- ─── 空状态 / 失败状态 ─────────────────────── -->
      <EmptyState
        v-else-if="!product"
        :title="errorMsg ? '加载失败' : '商品不存在'"
        :description="errorMsg || '该商品已下架或不存在'"
      >
        <template #icon>
          <WorldCoffeeLogo size="lg" variant="bare" />
        </template>
        <button
          v-if="errorMsg"
          class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] brand-gradient-btn text-sm shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 transition-all tap-scale"
          @click="fetchProduct()"
        >
          <Icon icon="material-symbols:refresh" class="w-4 h-4" />
          重新加载
        </button>
        <button
          v-else
          class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-surface-elevated text-brand border border-line text-sm hover:bg-surface transition-all tap-scale"
          @click="router.push('/shop')"
        >
          <Icon icon="material-symbols:arrow-back" class="w-4 h-4" />
          返回商城
        </button>
      </EmptyState>

      <!-- ─── 商品内容 ─────────────────────────── -->
      <template v-else>
        <!-- 图片画廊 -->
        <div class="bg-surface-elevated md:mt-4 md:mx-4 md:rounded-coffee-lg md:shadow-soft overflow-hidden">
          <div class="relative w-full aspect-square md:aspect-[4/3] bg-surface/50">
            <transition name="fade" mode="out-in">
              <img
                v-if="currentImageSrc && !imageError"
                :key="activeImgIndex"
                :src="currentImageSrc"
                :alt="product.name"
                class="w-full h-full object-cover"
                @error="handleImgError"
              />
              <div v-else class="absolute inset-0 flex items-center justify-center brand-placeholder">
                <WorldCoffeeLogo size="xl" variant="bare" />
              </div>
            </transition>

            <!-- 左右切换 -->
            <button
              v-if="product.images.length > 1"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-elevated/80 backdrop-blur shadow-sm flex items-center justify-center hover:bg-surface-elevated transition-colors"
              @click="prevImage"
            >
              <Icon icon="material-symbols:chevron-left" class="w-5 h-5 text-brand" />
            </button>
            <button
              v-if="product.images.length > 1"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-elevated/80 backdrop-blur shadow-sm flex items-center justify-center hover:bg-surface-elevated transition-colors"
              @click="nextImage"
            >
              <Icon icon="material-symbols:chevron-right" class="w-5 h-5 text-brand" />
            </button>

            <!-- 图片索引 -->
            <span
              v-if="product.images.length > 1"
              class="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur"
            >
              {{ activeImgIndex + 1 }}/{{ product.images.length }}
            </span>
          </div>

          <!-- 横向缩略图 -->
          <div
            v-if="product.images.length > 1"
            class="flex gap-2 overflow-x-auto scrollbar-none p-3 border-t border-line/30"
          >
            <button
              v-for="(img, idx) in product.images"
              :key="idx"
              class="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all"
              :class="activeImgIndex === idx ? 'border-brand ring-2 ring-brand/20' : 'border-transparent hover:border-line'"
              @click="activeImgIndex = idx; imageError = false"
            >
              <img
                :src="img"
                :alt="`${product.name}-${idx + 1}`"
                class="w-full h-full object-cover"
                @error="($event.target.style.display = 'none')"
              />
              <div v-if="!img" class="absolute inset-0 flex items-center justify-center brand-placeholder">
                <WorldCoffeeLogo size="sm" variant="bare" />
              </div>
            </button>
          </div>
        </div>

        <!-- 商品基本信息 -->
        <section class="mt-3 bg-surface-elevated p-5 md:mx-4 md:rounded-coffee-lg md:shadow-soft animate-fade-up">
          <!-- 价格区 -->
          <div class="flex items-baseline gap-1 mb-3">
            <span class="text-amber text-xl font-bold">¥</span>
            <span class="text-brand text-3xl font-bold">{{ formatPrice(product.price) }}</span>
            <span v-if="product.stock === 0" class="ml-3 text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded-lg">
              已售罄
            </span>
            <span v-else-if="product.stock < 10" class="ml-3 text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded-lg">
              仅剩 {{ product.stock }} 件
            </span>
          </div>

          <!-- 商品名 -->
          <h1 class="font-serif text-xl md:text-2xl text-ink leading-tight mb-3">
            {{ product.name }}
          </h1>

          <!-- 标签区 -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-if="product.sales >= 50"
              class="inline-flex items-center gap-1 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm"
            >
              <Icon icon="material-symbols:local-fire-department" class="w-3 h-3" />
              热销 {{ formatSales(product.sales) }}
            </span>
            <span
              v-if="product.roastLevel"
              class="inline-flex items-center gap-1 bg-surface text-brand text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            >
              <Icon icon="material-symbols:local-cafe" class="w-3 h-3" />
              {{ product.roastLevel }}
            </span>
            <span
              v-if="product.origin"
              class="inline-flex items-center gap-1 bg-surface text-brand text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            >
              <Icon icon="material-symbols:location-on" class="w-3 h-3" />
              {{ product.origin }}
            </span>
            <span
              v-if="product.weight"
              class="inline-flex items-center gap-1 bg-surface text-brand text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            >
              <Icon icon="material-symbols:scale" class="w-3 h-3" />
              {{ product.weight }}
            </span>
          </div>

          <!-- 元信息行 -->
          <div class="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-soft pt-3 border-t border-line/40">
            <div class="flex items-center gap-1.5">
              <Icon icon="material-symbols:trending-up" class="w-4 h-4 text-brand/70" />
              <span>{{ formatSales(product.sales) }} 已售</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Icon icon="material-symbols:package" class="w-4 h-4 text-brand/70" />
              <span>{{ product.stock }} 件库存</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Icon icon="material-symbols:badge" class="w-4 h-4 text-brand/70" />
              <span>编号 {{ product.id }}</span>
            </div>
          </div>
        </section>

        <!-- 数量选择 -->
        <section class="mt-3 bg-surface-elevated p-5 md:mx-4 md:rounded-coffee-lg md:shadow-soft animate-fade-up" style="animation-delay: 50ms">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-ink">购买数量</span>
            <div class="flex items-center gap-3 bg-surface/70 rounded-xl p-1.5">
              <button
                class="w-9 h-9 rounded-lg bg-surface-elevated shadow-sm flex items-center justify-center text-brand hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="quantity <= 1 || addingLoading"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                <Icon icon="material-symbols:remove" class="w-4 h-4" />
              </button>
              <input
                v-model.number="quantityInput"
                type="text"
                inputmode="numeric"
                class="w-12 text-center bg-transparent text-ink font-semibold outline-none"
                @blur="normalizeQuantity"
              />
              <button
                class="w-9 h-9 rounded-lg bg-surface-elevated shadow-sm flex items-center justify-center text-brand hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="quantity >= maxQuantity || addingLoading"
                @click="quantity = Math.min(maxQuantity, quantity + 1)"
              >
                <Icon icon="material-symbols:add" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p class="mt-2 text-[12px] text-ink-muted text-right">
            最多可购买 {{ maxQuantity }} 件
          </p>
        </section>

        <!-- 商品描述 -->
        <section v-if="product.description" class="mt-3 bg-surface-elevated p-5 md:mx-4 md:rounded-coffee-lg md:shadow-soft animate-fade-up" style="animation-delay: 100ms">
          <h2 class="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <Icon icon="material-symbols:description" class="w-4 h-4 text-brand" />
            商品介绍
          </h2>
          <div class="text-[14px] text-ink-soft leading-relaxed whitespace-pre-wrap">
            {{ product.description }}
          </div>
        </section>
      </template>
    </main>

    <!-- ─── 底部固定操作栏 ────────────────────────── -->
    <div
      v-if="!loading && product"
      class="fixed bottom-0 left-0 right-0 z-40 bg-surface-elevated/95 backdrop-blur-xl border-t border-line/40 safe-bottom"
    >
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
        <!-- 价格区 -->
        <div class="flex-shrink-0">
          <div class="flex items-baseline gap-0.5">
            <span class="text-amber text-xs font-bold">¥</span>
            <span class="text-brand text-2xl font-bold">{{ formatPrice((product.price || 0) * quantity) }}</span>
          </div>
          <p class="text-[11px] text-ink-muted">{{ quantity }} 件</p>
        </div>

        <div class="flex-1 flex items-center gap-2">
          <!-- 加入购物车 -->
          <button
            class="flex-1 h-12 rounded-[12px] flex items-center justify-center gap-2 text-sm font-semibold transition-all tap-scale bg-surface-elevated text-brand border border-line hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="product.stock === 0 || addingLoading"
            @click="handleAddToCart"
          >
            <Icon v-if="!addingLoading" icon="material-symbols:add-shopping-cart" class="w-4 h-4" />
            <Icon v-else icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
            <span>加入购物车</span>
          </button>

          <!-- 立即购买 -->
          <button
            class="flex-1 h-12 rounded-[12px] flex items-center justify-center gap-2 text-sm font-semibold brand-gradient-btn transition-all tap-scale shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="product.stock === 0 || buyingLoading"
            @click="handleBuyNow"
          >
            <Icon v-if="!buyingLoading" icon="material-symbols:bolt" class="w-4 h-4" />
            <Icon v-else icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
            <span>立即购买</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { shopApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { EmptyState } from '@wc/shared'
import { WorldCoffeeLogo } from '@wc/shared'

const route = useRoute()
const router = useRouter()
const toast = inject<any>('toast')
const { isLoggedIn } = useAuth()

// ─── 状态 ─────────────────────────────────
const loading = ref(true)
const errorMsg = ref('')
const product = ref(null)
const activeImgIndex = ref(0)
const imageError = ref(false)

const quantity = ref(1)
const addingLoading = ref(false)
const buyingLoading = ref(false)

// ─── 计算属性 ────────────────────────────
const productId = computed(() => route.params.id)

const maxQuantity = computed(() => {
  const stock = Number(product.value?.stock) || 0
  return stock
})

const currentImageSrc = computed(() => {
  const imgs = product.value?.images || []
  if (!imgs.length) return ''
  return imgs[activeImgIndex.value] || ''
})

const quantityInput = computed({
  get: () => String(quantity.value),
  set: (val) => {
    const num = parseInt(val, 10)
    if (!Number.isNaN(num) && num > 0) {
      quantity.value = Math.min(num, maxQuantity.value)
    }
  }
})

// ─── 工具函数 ────────────────────────────
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

function normalizeQuantity() {
  if (quantity.value < 1) quantity.value = 1
  if (maxQuantity.value > 0 && quantity.value > maxQuantity.value) {
    quantity.value = maxQuantity.value
  }
}

function prevImage() {
  const total = product.value?.images?.length || 0
  if (total <= 1) return
  activeImgIndex.value = activeImgIndex.value === 0 ? total - 1 : activeImgIndex.value - 1
  imageError.value = false
}

function nextImage() {
  const total = product.value?.images?.length || 0
  if (total <= 1) return
  activeImgIndex.value = (activeImgIndex.value + 1) % total
  imageError.value = false
}

function handleImgError(e) {
  if (e?.target) e.target.style.display = 'none'
  imageError.value = true
}

// ─── 数据加载 ────────────────────────────
async function fetchProduct() {
  if (!productId.value) {
    loading.value = false
    return
  }
  loading.value = true
  errorMsg.value = ''
  product.value = null
  activeImgIndex.value = 0
  imageError.value = false

  try {
    const res = await shopApi.getProductDetail(productId.value)
    if (res && res.code === 200 && res.data) {
      product.value = res.data
      // 归一化 images，确保是数组
      if (!Array.isArray(product.value.images)) {
        product.value.images = []
      }
    } else {
      errorMsg.value = res?.msg || '商品加载失败'
      toast.show(errorMsg.value, 'error')
    }
  } catch (e) {
    errorMsg.value = getApiError(e)
    toast.show(errorMsg.value, 'error')
  } finally {
    loading.value = false
  }
}

function requireAuth(actionName) {
  if (!isLoggedIn.value) {
    toast.show(`请先登录后再${actionName}`, 'warn')
    router.push('/login')
    return false
  }
  return true
}

// ─── 加入购物车 ───────────────────────────
async function handleAddToCart() {
  if (!product.value || !product.value.id) return
  if (product.value.stock === 0) {
    toast.show('商品已售罄', 'warn')
    return
  }
  if (!requireAuth('加入购物车')) return

  addingLoading.value = true
  try {
    const res = await shopApi.addToCart(product.value.id, quantity.value)
    if (res && res.code === 200) {
      toast.show('已加入购物车', 'success', 3500)
      // 展示"去购物车"按钮的轻量方案：通过 confirm 式 toast 提示
      // 由于项目的 toast 是简单消息，这里追加一个便捷操作按钮（通过第二次 toast 引导）
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.confirm('是否前往购物车查看？')) {
          router.push('/shop/cart')
        }
      }, 500)
    } else {
      toast.show(res?.msg || '加入购物车失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    addingLoading.value = false
  }
}

// ─── 立即购买 ───────────────────────────
async function handleBuyNow() {
  if (!product.value || !product.value.id) return
  if (product.value.stock === 0) {
    toast.show('商品已售罄', 'warn')
    return
  }
  if (!requireAuth('购买')) return

  buyingLoading.value = true
  try {
    const res = await shopApi.addToCart(product.value.id, quantity.value)
    if (res && res.code === 200) {
      toast.show('已加入购物车', 'success')
      router.push('/shop/cart')
    } else {
      toast.show(res?.msg || '操作失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    buyingLoading.value = false
  }
}

// ─── 生命周期 ───────────────────────────
watch(productId, () => {
  quantity.value = 1
  fetchProduct()
})

onMounted(() => {
  quantity.value = 1
  fetchProduct()
})
</script>

<style>
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
