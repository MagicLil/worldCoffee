<template>
  <div class="min-h-screen bg-surface/50">
    <!-- ─── Header ─────────────────────────────── -->
    <header class="sticky top-0 z-40 bg-surface-elevated/85 backdrop-blur-xl border-b border-line/40">
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-surface transition-colors flex-shrink-0"
          @click="handleBack"
        >
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-brand" />
        </button>
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <h1 class="font-serif text-lg text-ink truncate">订单支付</h1>
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto pb-10 px-4">
      <!-- ─── 骨架屏 ─────────────────────────── -->
      <div v-if="pageLoading" class="space-y-4 pt-6">
        <div class="bg-surface-elevated rounded-2xl p-5 shadow-[0_2px_8px_rgba(62,39,35,0.06)]">
          <div class="skeleton h-5 w-40 rounded mb-4" />
          <div class="skeleton h-4 w-full rounded mb-2" />
          <div class="skeleton h-4 w-3/4 rounded mb-4" />
          <div class="skeleton h-8 w-32 rounded" />
        </div>
        <div class="bg-surface-elevated rounded-2xl p-5 shadow-[0_2px_8px_rgba(62,39,35,0.06)]">
          <div class="skeleton h-5 w-32 rounded mb-3" />
          <div class="skeleton h-20 w-full rounded-xl" />
        </div>
      </div>

      <!-- ─── 订单已超时 ─────────────────────── -->
      <div v-else-if="timedOut" class="pt-10 flex flex-col items-center text-center animate-fade-up">
        <div class="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5">
          <Icon icon="material-symbols:timer-off-outline" class="w-10 h-10 text-rose-400" />
        </div>
        <h2 class="font-serif text-xl text-ink mb-2">订单已超时</h2>
        <p class="text-sm text-ink-muted mb-8">支付超时，订单已自动取消</p>
        <button
          class="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] brand-gradient-btn text-sm font-semibold shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 transition-all tap-scale"
          @click="router.push('/shop/orders')"
        >
          <Icon icon="material-symbols:list-alt-outline" class="w-4 h-4" />
          查看我的订单
        </button>
      </div>

      <!-- ─── 支付成功 ─────────────────────── -->
      <div v-else-if="paySuccess" class="pt-10 flex flex-col items-center text-center animate-fade-up">
        <div class="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
          <Icon icon="material-symbols:check-circle-outline" class="w-10 h-10 text-emerald-500" />
        </div>
        <h2 class="font-serif text-xl text-ink mb-2">支付成功</h2>
        <p class="text-sm text-ink-muted mb-8">订单已确认，正在准备发货</p>
        <button
          class="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] brand-gradient-btn text-sm font-semibold shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 transition-all tap-scale"
          @click="router.push({ path: '/shop/orders', query: { highlight: order?.id } })"
        >
          <Icon icon="material-symbols:list-alt-outline" class="w-4 h-4" />
          查看我的订单
        </button>
      </div>

      <!-- ─── 正常支付页面 ─────────────────────── -->
      <div v-else-if="order" class="space-y-4 pt-4">
        <!-- 倒计时卡片 -->
        <div class="bg-surface-elevated rounded-2xl p-5 shadow-[0_2px_8px_rgba(62,39,35,0.06)] animate-fade-up">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-ink-muted">请在以下时间内完成支付</span>
            <div
              class="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
              :class="countdownUrgent ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber'"
            >
              <Icon icon="material-symbols:timer-outline" class="w-4 h-4" />
              {{ formatCountdown }}
            </div>
          </div>
          <!-- 进度条 -->
          <div class="w-full h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-1000 ease-linear"
              :class="countdownUrgent ? 'bg-rose-400' : 'bg-amber'"
              :style="{ width: countdownPercent + '%' }"
            />
          </div>
        </div>

        <!-- 订单信息卡片 -->
        <div class="bg-surface-elevated rounded-2xl p-5 shadow-[0_2px_8px_rgba(62,39,35,0.06)] animate-fade-up" style="animation-delay: 60ms">
          <div class="flex items-center gap-2 mb-4">
            <Icon icon="material-symbols:receipt-long-outline" class="w-5 h-5 text-brand" />
            <h3 class="font-serif text-base text-ink">订单信息</h3>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-ink-muted">订单编号</span>
              <span class="text-ink font-mono text-xs">{{ order.orderNo }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">下单时间</span>
              <span class="text-ink">{{ formatTime(order.createTime) }}</span>
            </div>
            <div v-if="order.address" class="flex justify-between">
              <span class="text-ink-muted">收货地址</span>
              <span class="text-ink text-right max-w-[60%] truncate">{{ order.address }}</span>
            </div>
          </div>

          <!-- 商品列表 -->
          <div class="border-t border-line/30 pt-3 space-y-2.5">
            <div
              v-for="item in orderItems"
              :key="item.id || item.productId"
              class="flex items-center gap-3"
            >
              <div class="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface/60">
                <img
                  v-if="item.image && !item._imgErr"
                  :src="item.image"
                  class="w-full h-full object-cover"
                  @error="item._imgErr = true"
                />
                <div v-else class="w-full h-full flex items-center justify-center brand-placeholder">
                  <span class="text-lg">☕</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-ink truncate">{{ item.productName }}</p>
                <div class="flex items-baseline gap-1 mt-0.5">
                  <span class="text-xs text-amber">¥</span>
                  <span class="text-sm font-semibold text-brand">{{ formatPrice(item.price) }}</span>
                  <span class="text-xs text-ink-muted ml-1">× {{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 金额明细 -->
        <div class="bg-surface-elevated rounded-2xl p-5 shadow-[0_2px_8px_rgba(62,39,35,0.06)] animate-fade-up" style="animation-delay: 120ms">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-ink-muted">商品总额</span>
              <span class="text-ink">¥{{ formatPrice(order.totalAmount) }}</span>
            </div>
            <div v-if="order.discountAmount > 0" class="flex justify-between text-emerald-600">
              <span>优惠券减免</span>
              <span class="font-semibold">-¥{{ formatPrice(order.discountAmount) }}</span>
            </div>
            <div class="flex justify-between pt-2 mt-1 border-t border-line/30">
              <span class="text-ink font-semibold text-base">实付金额</span>
              <div class="flex items-baseline gap-0.5">
                <span class="text-xs text-amber font-bold">¥</span>
                <span class="text-xl font-bold text-brand">{{ formatPrice(actualAmount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 支付按钮 -->
        <div class="pt-2 animate-fade-up" style="animation-delay: 180ms">
          <button
            class="w-full h-14 rounded-[14px] flex items-center justify-center gap-2.5 text-base font-bold text-white transition-all tap-scale shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="paying ? '' : 'bg-gradient-to-br from-coffee-brown to-coffee-dark'"
            :disabled="paying"
            @click="handlePay"
          >
            <Icon v-if="paying" icon="material-symbols:progress-activity" class="w-5 h-5 animate-spin" />
            <Icon v-else icon="material-symbols:account-balance-wallet-outline" class="w-5 h-5" />
            <span>{{ paying ? '支付中...' : '模拟支付' }}</span>
          </button>
          <p class="text-center text-xs text-ink-muted mt-3">
            这是模拟支付，不会真实扣款
          </p>
        </div>
      </div>

      <!-- ─── 加载失败 ─────────────────────── -->
      <div v-else class="pt-10 flex flex-col items-center text-center animate-fade-up">
        <div class="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5">
          <Icon icon="material-symbols:error-outline" class="w-10 h-10 text-rose-400" />
        </div>
        <h2 class="font-serif text-xl text-ink mb-2">订单不存在</h2>
        <p class="text-sm text-ink-muted mb-8">{{ errorMsg || '无法找到该订单信息' }}</p>
        <button
          class="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] brand-gradient-btn text-sm font-semibold shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 transition-all tap-scale"
          @click="router.push('/shop/orders')"
        >
          返回订单列表
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { shopApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { inject } from 'vue'

const route = useRoute()
const router = useRouter()
const toast = inject<any>('toast')
const { isLoggedIn } = useAuth()

// ─── 状态 ─────────────────────────────────
const pageLoading = ref(true)
const order = ref(null)
const orderItems = ref([])
const errorMsg = ref('')

const paying = ref(false)
const paySuccess = ref(false)
const timedOut = ref(false)

// 倒计时：总秒数 15 分钟
const TOTAL_SECONDS = 15 * 60
const remainSeconds = ref(TOTAL_SECONDS)
let countdownTimer = null

// ─── 计算属性 ──────────────────────────────
const actualAmount = computed(() => {
  if (!order.value) return 0
  const total = Number(order.value.totalAmount) || 0
  const discount = Number(order.value.discountAmount) || 0
  const result = total - discount
  return result > 0 ? result : 0
})

const countdownPercent = computed(() => {
  return Math.max(0, (remainSeconds.value / TOTAL_SECONDS) * 100)
})

const countdownUrgent = computed(() => remainSeconds.value <= 60)

const formatCountdown = computed(() => {
  const s = Math.max(0, remainSeconds.value)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

// ─── 工具函数 ──────────────────────────────
function formatPrice(price) {
  if (price == null) return '0.00'
  const num = Number(price)
  return num.toFixed(2)
}

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  if (isNaN(d.getTime())) return time
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/shop/orders')
  }
}

// ─── 加载订单 ──────────────────────────────
async function fetchOrder() {
  const orderId = route.params.orderId
  if (!orderId) {
    errorMsg.value = '缺少订单ID'
    pageLoading.value = false
    return
  }

  try {
    const res = await shopApi.getOrderDetail(orderId)
    if (res && res.code === 200 && res.data) {
      order.value = res.data

      // 提取订单商品
      const items = res.data.items || res.data.orderItems || res.data.products || []
      orderItems.value = items.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1
      }))

      // 如果订单已经不是待支付状态，直接跳转
      if (res.data.status === 1) {
        paySuccess.value = true
      } else if (res.data.status !== 0) {
        timedOut.value = true
      } else {
        // 待支付 → 计算倒计时
        initCountdown(res.data.createTime)
      }
    } else {
      errorMsg.value = res?.msg || '加载订单失败'
    }
  } catch (e) {
    errorMsg.value = getApiError(e)
  } finally {
    pageLoading.value = false
  }
}

// ─── 倒计时 ────────────────────────────────
function initCountdown(createTime) {
  if (!createTime) {
    remainSeconds.value = TOTAL_SECONDS
    startTimer()
    return
  }

  const created = new Date(createTime).getTime()
  const now = Date.now()
  const elapsed = Math.floor((now - created) / 1000)
  remainSeconds.value = Math.max(0, TOTAL_SECONDS - elapsed)

  if (remainSeconds.value <= 0) {
    timedOut.value = true
    return
  }

  startTimer()
}

function startTimer() {
  countdownTimer = setInterval(() => {
    remainSeconds.value--
    if (remainSeconds.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      timedOut.value = true
    }
  }, 1000)
}

// ─── 支付 ──────────────────────────────────
async function handlePay() {
  if (!order.value || paying.value) return

  paying.value = true
  try {
    // 第一步：创建支付记录（后端同时发送超时延时消息）
    const res = await shopApi.payOrder(order.value.id)
    if (res && res.code === 200 && res.data) {
      const { orderNo, transactionId } = res.data

      // 第二步：支付回调，真正更新订单状态
      const cbRes = await shopApi.payCallback({ orderNo, transactionId })
      if (cbRes && cbRes.code === 200) {
        paySuccess.value = true
        if (countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
        toast.show('支付成功！', 'success')
      } else {
        toast.show(cbRes?.msg || '支付回调失败', 'error')
      }
    } else {
      toast.show(res?.msg || '支付失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    paying.value = false
  }
}

// ─── 生命周期 ──────────────────────────────
onMounted(() => {
  if (!isLoggedIn.value) {
    toast.show('请先登录', 'warn')
    router.push('/login')
    return
  }
  fetchOrder()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>
