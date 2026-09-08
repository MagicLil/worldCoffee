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
            购物车
          </h1>
        </div>

        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-surface transition-colors flex-shrink-0"
          :disabled="refreshLoading"
          @click="fetchCart(true)"
        >
          <Icon
            icon="material-symbols:refresh"
            class="w-5 h-5 text-brand"
            :class="{ 'animate-spin': refreshLoading }"
          />
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto pb-24 px-3 md:px-4">
      <!-- ─── 骨架屏 ─────────────────────────── -->
      <div v-if="loading" class="space-y-3 pt-3 animate-pulse">
        <div v-for="n in 4" :key="n" class="bg-surface-elevated rounded-2xl p-3 flex gap-3 shadow-[0_2px_8px_rgba(62,39,35,0.06)]">
          <div class="skeleton w-24 h-24 rounded-xl flex-shrink-0" />
          <div class="flex-1 space-y-2 py-1">
            <div class="skeleton h-4 w-3/4 rounded" />
            <div class="skeleton h-3 w-1/4 rounded" />
            <div class="skeleton h-8 w-32 rounded-lg mt-3" />
          </div>
        </div>
      </div>

      <!-- ─── 空状态 ─────────────────────────── -->
      <EmptyState
        v-else-if="cartItems.length === 0"
        title="购物车空空如也"
        description="去挑几样喜欢的咖啡吧 ☕"
      >
        <template #icon>
          <WorldCoffeeLogo size="xl" />
        </template>
        <button
          class="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-[12px] brand-gradient-btn text-sm font-semibold shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 transition-all tap-scale"
          @click="router.push('/shop')"
        >
          <Icon icon="material-symbols:shopping-bag-outline" class="w-4 h-4" />
          去逛逛
        </button>
      </EmptyState>

      <!-- ─── 购物车列表 ─────────────────────────── -->
      <template v-else>
        <div class="pt-3 space-y-3">
          <div
            v-for="(item, i) in cartItems"
            :key="item.id"
            class="bg-surface-elevated rounded-2xl p-3 md:p-4 flex gap-3 md:gap-4 shadow-[0_2px_8px_rgba(62,39,35,0.06)] hover:shadow-[0_4px_16px_rgba(62,39,35,0.1)] transition-shadow animate-fade-up cursor-pointer"
            :style="{ animationDelay: `${(i % 8) * 40}ms` }"
            @click="goToDetail(item)"
          >
            <!-- 商品图片 -->
            <div
              class="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-surface/60"
              @click.stop
            >
              <img
                v-if="item.image && !imgErrors[item.id]"
                :src="item.image"
                :alt="item.productName"
                class="w-full h-full object-cover"
                @error="handleImgError($event, item)"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center brand-placeholder"
              >
                <WorldCoffeeLogo size="md" variant="bare" />
              </div>
            </div>

            <!-- 右侧信息 -->
            <div class="flex-1 min-w-0 flex flex-col" @click.stop>
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-semibold text-[14px] md:text-sm text-ink leading-snug line-clamp-2">
                  {{ item.productName }}
                </h3>
                <button
                  class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  :disabled="!!deleteLoading[item.id]"
                  @click="handleDelete(item)"
                >
                  <Icon v-if="!deleteLoading[item.id]" icon="material-symbols:delete-outline" class="w-4 h-4" />
                  <Icon v-else icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
                </button>
              </div>

              <p class="text-[11px] text-ink-muted mb-2">
                库存 {{ item.stock }} 件
              </p>

              <div class="flex items-end justify-between gap-2 mt-auto">
                <div class="flex items-baseline gap-0.5 text-brand font-bold">
                  <span class="text-xs text-amber">¥</span>
                  <span class="text-lg md:text-xl leading-none">{{ formatPrice(item.price) }}</span>
                </div>

                <!-- 数量选择器 -->
                <div class="flex items-center gap-2 bg-surface/70 rounded-xl p-1">
                  <button
                    class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-surface-elevated shadow-sm flex items-center justify-center text-brand hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="getQuantity(item) <= 1 || !!updateLoading[item.id]"
                    @click="changeQuantity(item, getQuantity(item) - 1)"
                  >
                    <Icon icon="material-symbols:remove" class="w-3.5 h-3.5" />
                  </button>
                  <input
                    :value="getQuantity(item)"
                    type="text"
                    inputmode="numeric"
                    class="w-8 md:w-10 text-center bg-transparent text-ink font-semibold outline-none text-sm"
                    @blur="onQuantityInput($event, item)"
                  />
                  <button
                    class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-surface-elevated shadow-sm flex items-center justify-center text-brand hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="getQuantity(item) >= (item.stock || 0) || !!updateLoading[item.id]"
                    @click="changeQuantity(item, getQuantity(item) + 1)"
                  >
                    <Icon icon="material-symbols:add" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- ─── 底部固定结算栏 ────────────────────────── -->
    <div
      v-if="!loading && cartItems.length > 0"
      class="fixed bottom-0 left-0 right-0 z-40 bg-surface-elevated/95 backdrop-blur-xl border-t border-line/40 safe-bottom"
    >
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
        <div class="flex-shrink-0">
          <div class="flex items-baseline gap-0.5">
            <span class="text-amber text-xs font-bold">合计</span>
            <span class="text-amber text-lg font-bold">¥</span>
            <span class="text-brand text-2xl font-bold">{{ formatPrice(totalAmount) }}</span>
          </div>
          <p class="text-[11px] text-ink-muted">共 {{ totalItems }} 件</p>
        </div>

        <div class="flex-1" />

        <button
          class="h-12 px-6 md:px-8 rounded-[12px] flex items-center justify-center gap-2 text-sm font-semibold brand-gradient-btn transition-all tap-scale shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="checkoutLoading"
          @click="openCheckoutModal"
        >
          <Icon v-if="!checkoutLoading" icon="material-symbols:credit-card" class="w-4 h-4" />
            <Icon v-else icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
            <span>去结算</span>
        </button>
      </div>
    </div>

    <!-- ─── 结算 Modal ────────────────────────── -->
    <teleport to="body">
      <transition name="modal">
        <div
          v-if="showCheckoutModal"
          class="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          @click.self="closeCheckoutModal"
        >
          <div class="absolute inset-0 bg-brand/30 backdrop-blur-sm" />
          <div class="relative w-full md:max-w-md bg-surface-elevated md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up md:animate-fade-up">
            <div class="px-5 pt-5 pb-3 flex items-center justify-between border-b border-line/40">
              <h2 class="font-serif text-lg text-ink">确认订单</h2>
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-surface transition-colors"
                @click="closeCheckoutModal"
              >
                <Icon icon="material-symbols:close" class="w-5 h-5" />
              </button>
            </div>

            <div class="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <!-- 订单摘要 -->
              <div class="bg-surface/50 rounded-xl p-3 space-y-1.5">
                <div v-for="item in cartItems" :key="item.id" class="flex justify-between text-sm">
                  <span class="text-ink truncate pr-2">{{ item.productName }} × {{ getQuantity(item) }}</span>
                  <span class="text-brand font-semibold flex-shrink-0">¥{{ formatPrice((item.price || 0) * getQuantity(item)) }}</span>
                </div>
                <div class="flex justify-between pt-2 mt-1 border-t border-line/40 text-sm">
                  <span class="text-ink font-medium">商品合计</span>
                  <span class="text-brand font-bold text-base">¥{{ formatPrice(totalAmount) }}</span>
                </div>
                <!-- 折扣 -->
                <div v-if="discountAmount > 0" class="flex justify-between text-sm text-emerald-600">
                  <span>优惠券</span>
                  <span class="font-semibold">-¥{{ formatPrice(discountAmount) }}</span>
                </div>
                <div class="flex justify-between pt-1 mt-1 border-t border-line/40 text-sm">
                  <span class="text-ink font-semibold">实付</span>
                  <span class="text-brand font-bold text-base">¥{{ formatPrice(finalTotal) }}</span>
                </div>
              </div>

              <!-- 优惠券选择 -->
              <div>
                <label class="block text-sm font-medium text-ink mb-2 flex items-center gap-1.5">
                  <Icon icon="material-symbols:confirmation-number-outline" class="w-4 h-4 text-brand" />
                  优惠券
                </label>
                <div v-if="couponsLoading" class="text-xs text-ink-muted py-2">加载中...</div>
                <div v-else-if="myCoupons.length === 0" class="text-xs text-ink-muted py-2">暂无可用优惠券</div>
                <div v-else class="space-y-2">
                  <!-- 不使用优惠券 -->
                  <button
                    class="w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all"
                    :class="selectedCouponId === null
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-line/40 text-ink-muted hover:border-brand/50'"
                    @click="selectedCouponId = null"
                  >
                    不使用优惠券
                  </button>
                  <!-- 可选优惠券列表 -->
                  <button
                    v-for="c in myCoupons"
                    :key="c.id"
                    class="w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between gap-2"
                    :class="selectedCouponId === c.id
                      ? 'border-brand bg-brand/5'
                      : 'border-line/40 hover:border-brand/50'"
                    :disabled="c.minAmount && totalAmount < Number(c.minAmount)"
                    @click="selectedCouponId = selectedCouponId === c.id ? null : c.id"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="font-semibold text-brand flex-shrink-0">{{ couponDesc(c) }}</span>
                      <span class="text-ink truncate">{{ c.name }}</span>
                    </div>
                    <span v-if="c.minAmount && totalAmount < Number(c.minAmount)" class="text-[11px] text-ink-muted flex-shrink-0">
                      差¥{{ formatPrice(Number(c.minAmount) - totalAmount) }}可用
                    </span>
                  </button>
                </div>
              </div>

              <!-- 收货地址 -->
              <div>
                <label class="block text-sm font-medium text-ink mb-2 flex items-center gap-1.5">
                  <Icon icon="material-symbols:location-on" class="w-4 h-4 text-brand" />
                  收货地址
                </label>
                <textarea
                  v-model="addressInput"
                  rows="3"
                  placeholder="请输入完整的收货地址，包括姓名、电话及详细地址..."
                  class="w-full px-3 py-2.5 rounded-xl bg-surface/50 border border-line/40 text-ink text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none placeholder:text-ink-muted/80"
                />
              </div>

              <!-- 备注 -->
              <div>
                <label class="block text-sm font-medium text-ink mb-2 flex items-center gap-1.5">
                  <Icon icon="material-symbols:sticky-note-2-outline" class="w-4 h-4 text-brand" />
                  订单备注
                </label>
                <textarea
                  v-model="remarkInput"
                  rows="2"
                  placeholder="选填，请告知您的特殊需求..."
                  class="w-full px-3 py-2.5 rounded-xl bg-surface/50 border border-line/40 text-ink text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none placeholder:text-ink-muted/80"
                />
              </div>
            </div>

            <div class="px-5 py-4 border-t border-line/40 flex items-center gap-3">
              <button
                class="flex-1 h-11 rounded-xl bg-surface-elevated border border-line text-brand text-sm font-semibold hover:bg-surface transition-colors"
                :disabled="checkoutLoading"
                @click="closeCheckoutModal"
              >
                取消
              </button>
              <button
                class="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all bg-gradient-to-br from-coffee-brown to-coffee-dark shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="checkoutLoading || !addressInput.trim()"
                @click="handleSubmitOrder"
              >
                <Icon v-if="!checkoutLoading" icon="material-symbols:check-circle" class="w-4 h-4" />
              <Icon v-else icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
              <span>提交订单</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { shopApi, couponApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { EmptyState } from '@wc/shared'
import { WorldCoffeeLogo } from '@wc/shared'

const router = useRouter()
const toast = inject<any>('toast')
const { isLoggedIn } = useAuth()

// ─── 状态 ─────────────────────────────────
const loading = ref(true)
const refreshLoading = ref(false)
const cartItems = ref([])
const imgErrors = reactive({})

const updateLoading = reactive({}) // id -> bool
const deleteLoading = reactive({}) // id -> bool

// 本地 quantities 映射：id -> number，优先使用 API 返回的数据
const localQuantities = reactive({})

const showCheckoutModal = ref(false)
const addressInput = ref('')
const remarkInput = ref('')
const checkoutLoading = ref(false)

// ─── 优惠券 ────────────────────────────
const myCoupons = ref([])
const selectedCouponId = ref(null)
const couponsLoading = ref(false)

// ─── 计算属性 ────────────────────────────
function getQuantity(item) {
  if (!item) return 0
  if (localQuantities[item.id] != null) return localQuantities[item.id]
  return Number(item.quantity) || 1
}

const totalItems = computed(() => {
  if (!Array.isArray(cartItems.value)) return 0
  return cartItems.value.reduce((sum, item) => sum + getQuantity(item), 0)
})

const totalAmount = computed(() => {
  if (!Array.isArray(cartItems.value)) return 0
  return cartItems.value.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * getQuantity(item),
    0
  )
})

/** 根据选中的优惠券计算折扣金额 */
const discountAmount = computed(() => {
  if (!selectedCouponId.value) return 0
  const coupon = myCoupons.value.find(c => c.id === selectedCouponId.value)
  if (!coupon) return 0
  const total = totalAmount.value
  // 满减券：直接减固定面额
  if (coupon.type === 1) {
    if (coupon.minAmount && total < Number(coupon.minAmount)) return 0
    return Math.min(Number(coupon.value) || 0, total)
  }
  // 折扣券：value=8 表示打 8 折，优惠 20%
  if (coupon.type === 2) {
    if (coupon.minAmount && total < Number(coupon.minAmount)) return 0
    const val = Number(coupon.value) || 0
    return Math.round(total * (10 - val) / 10 * 100) / 100
  }
  return 0
})

/** 实付金额 = 原价 - 折扣 */
const finalTotal = computed(() => {
  const t = totalAmount.value - discountAmount.value
  return t > 0 ? t : 0
})

// ─── 工具函数 ────────────────────────────
function extractList(res) {
  if (!res || !res.data) return []
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.data.data)) return res.data.data
  if (Array.isArray(res.data.records)) return res.data.records
  if (Array.isArray(res.data.list)) return res.data.list
  return []
}

function formatPrice(price) {
  if (price == null) return '0.00'
  const num = Number(price)
  if (Number.isInteger(num)) return num.toFixed(0)
  return num.toFixed(2)
}

function handleImgError(e, item) {
  if (e?.target) e.target.style.display = 'none'
  if (item?.id != null) imgErrors[item.id] = true
}

// ─── 数据加载 ────────────────────────────
async function fetchCart(showRefreshBtn = false) {
  if (!isLoggedIn.value) {
    toast.show('请先登录后再查看购物车', 'warn')
    router.push('/login')
    return
  }

  if (showRefreshBtn) {
    refreshLoading.value = true
  } else {
    loading.value = true
  }

  try {
    const res = await shopApi.getCart()
    if (res && res.code === 200) {
      const items = extractList(res)
      cartItems.value = items.map((item) => ({
        ...item,
        quantity: Number(item.quantity) || 1,
        stock: Number(item.stock) || 0,
        price: Number(item.price) || 0
      }))
      // 重置本地 quantities 映射
      Object.keys(localQuantities).forEach((k) => delete localQuantities[k])
      cartItems.value.forEach((item) => {
        localQuantities[item.id] = item.quantity
      })
    } else {
      toast.show(res?.msg || '加载购物车失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    loading.value = false
    refreshLoading.value = false
  }
}

// ─── 修改数量 ───────────────────────────
function onQuantityInput(e, item) {
  const raw = e.target?.value
  const num = parseInt(raw, 10)
  if (!Number.isFinite(num) || num < 1) {
    e.target.value = getQuantity(item)
    return
  }
  const max = Number(item.stock) || 0
  const next = max > 0 ? Math.min(num, max) : num
  changeQuantity(item, next)
}

async function changeQuantity(item, nextQuantity) {
  const stock = Number(item.stock) || 0
  const qty = Math.max(1, nextQuantity)
  const finalQty = stock > 0 ? Math.min(qty, stock) : qty

  // 乐观更新
  const previous = getQuantity(item)
  localQuantities[item.id] = finalQty

  if (previous === finalQty) return

  updateLoading[item.id] = true
  try {
    const res = await shopApi.updateCart(item.id, finalQty)
    if (res && res.code === 200) {
      // 更新成功，同步 item 的 quantity 字段
      item.quantity = finalQty
    } else {
      localQuantities[item.id] = previous
      toast.show(res?.msg || '修改数量失败', 'error')
    }
  } catch (e) {
    localQuantities[item.id] = previous
    toast.show(getApiError(e), 'error')
  } finally {
    updateLoading[item.id] = false
  }
}

// ─── 删除 ───────────────────────────
async function handleDelete(item) {
  if (!item?.id) return
  const confirmed = typeof window !== 'undefined' && window.confirm(`确定要从购物车中移除"${item.productName}"吗？`)
  if (!confirmed) return

  deleteLoading[item.id] = true
  try {
    const res = await shopApi.removeFromCart(item.id)
    if (res && res.code === 200) {
      cartItems.value = cartItems.value.filter((i) => i.id !== item.id)
      delete localQuantities[item.id]
      toast.show('已从购物车中移除', 'success')
    } else {
      toast.show(res?.msg || '删除失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    deleteLoading[item.id] = false
  }
}

// ─── 导航 ───────────────────────────
function goToDetail(item) {
  if (item?.productId) {
    router.push(`/shop/product/${item.productId}`)
  }
}

// ─── 优惠券 ───────────────────────────
async function fetchMyCoupons() {
  couponsLoading.value = true
  try {
    const res = await couponApi.getMy()
    if (res && res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : []
      // 只保留满减券和折扣券（秒杀券不能在普通订单用）
      myCoupons.value = list.filter(c => c.type === 1 || c.type === 2)
    }
  } catch (e) {
    // 静默失败，不影响下单
    myCoupons.value = []
  } finally {
    couponsLoading.value = false
  }
}

function couponDesc(c) {
  if (c.type === 1) return `满${c.minAmount || 0}减${c.value}`
  if (c.type === 2) return `${c.value}折`
  return ''
}

// ─── 结算 ───────────────────────────
function openCheckoutModal() {
  if (!isLoggedIn.value) {
    toast.show('请先登录后再结算', 'warn')
    router.push('/login')
    return
  }
  if (!cartItems.value.length) {
    toast.show('购物车暂无商品', 'warn')
    return
  }
  selectedCouponId.value = null
  showCheckoutModal.value = true
  fetchMyCoupons()
}

function closeCheckoutModal() {
  if (checkoutLoading.value) return
  showCheckoutModal.value = false
}

async function handleSubmitOrder() {
  const address = addressInput.value.trim()
  if (!address) {
    toast.show('请填写收货地址', 'warn')
    return
  }

  checkoutLoading.value = true
  try {
    const res = await shopApi.createOrder(
      address,
      remarkInput.value.trim(),
      selectedCouponId.value
    )
    if (res && res.code === 200) {
      toast.show('下单成功！', 'success', 3500)
      showCheckoutModal.value = false
      addressInput.value = ''
      remarkInput.value = ''
      selectedCouponId.value = null
      const orderId = res.data?.id || res.data
      setTimeout(() => {
        router.push(orderId ? `/shop/payment/${orderId}` : '/shop/orders')
      }, 600)
    } else {
      toast.show(res?.msg || '下单失败，请稍后重试', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    checkoutLoading.value = false
  }
}

// ─── 生命周期 ───────────────────────────
watch(isLoggedIn, (val) => {
  if (!val) {
    toast.show('请先登录后再查看购物车', 'warn')
    router.push('/login')
  }
})

onMounted(() => {
  if (!isLoggedIn.value) {
    toast.show('请先登录后再查看购物车', 'warn')
    router.push('/login')
    return
  }
  fetchCart(false)
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: translateY(40px);
  opacity: 0;
}
</style>
