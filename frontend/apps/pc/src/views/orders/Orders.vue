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
          <h1 class="font-serif text-lg text-ink truncate">
            我的订单
          </h1>
        </div>

        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-surface transition-colors flex-shrink-0"
          :disabled="loading"
          @click="fetchOrders(true)"
        >
          <Icon
            icon="material-symbols:refresh"
            class="w-5 h-5 text-brand"
            :class="{ 'animate-spin': loading }"
          />
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto pb-10 px-3 md:px-4">
      <!-- ─── 骨架屏 ─────────────────────────── -->
      <div v-if="loading && orders.length === 0" class="space-y-3 pt-3">
        <div v-for="n in 4" :key="n" class="bg-surface-elevated rounded-2xl p-4 shadow-[0_2px_8px_rgba(62,39,35,0.06)]">
          <div class="flex items-center justify-between mb-3">
            <div class="skeleton h-3.5 w-32 rounded" />
            <div class="skeleton h-5 w-14 rounded-full" />
          </div>
          <div class="skeleton h-4 w-1/2 rounded mb-3" />
          <div class="flex items-center justify-between pt-2">
            <div class="skeleton h-3.5 w-28 rounded" />
            <div class="skeleton h-5 w-20 rounded" />
          </div>
        </div>
      </div>

      <!-- ─── 空状态 ─────────────────────────── -->
      <EmptyState
        v-else-if="!loading && orders.length === 0"
        icon="📦"
        title="还没有订单"
        description="去商城看看，挑几样喜欢的咖啡吧"
      >
        <button
          class="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-[12px] brand-gradient-btn text-sm font-semibold shadow-[0_4px_14px_rgba(109,76,65,0.28)] hover:brightness-110 transition-all tap-scale"
          @click="router.push('/shop')"
        >
          <Icon icon="material-symbols:shopping-bag-outline" class="w-4 h-4" />
          去下单
        </button>
      </EmptyState>

      <!-- ─── 订单列表 ─────────────────────────── -->
      <div v-else class="pt-3 space-y-3">
        <div
          v-for="(order, i) in orders"
          :key="order.id"
          :id="`order-${order.id}`"
          class="bg-surface-elevated rounded-2xl shadow-[0_2px_8px_rgba(62,39,35,0.06)] hover:shadow-[0_4px_16px_rgba(62,39,35,0.1)] transition-shadow animate-fade-up overflow-hidden"
          :class="{ 'ring-2 ring-brand/40 highlight-pulse': highlightedOrderId === order.id }"
          :style="{ animationDelay: `${(i % 8) * 40}ms` }"
        >
          <!-- 点击展开的主区域 -->
          <div
            class="p-4 cursor-pointer"
            @click="toggleOrder(order.id)"
          >
            <!-- 顶部：订单号 + 状态 -->
            <div class="flex items-start justify-between gap-3 mb-2.5">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[11px] text-ink-muted font-mono tracking-wide">订单号</span>
                </div>
                <div class="text-sm font-semibold text-ink truncate font-mono">
                  {{ order.orderNo }}
                </div>
                <div class="text-[11px] text-ink-muted mt-1 flex items-center gap-1">
                  <Icon icon="material-symbols:schedule" class="w-3 h-3" />
                  {{ formatOrderTime(order.createTime) }}
                </div>
              </div>
              <div
                class="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                :class="statusBadgeClass(order.status)"
              >
                <Icon :icon="statusIcon(order.status)" class="w-3 h-3" />
                {{ statusText(order.status) }}
              </div>
            </div>

            <!-- 待支付倒计时 -->
            <div
              v-if="order.status === 0 && countdownMap[order.id] != null"
              class="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              :class="isCountdownUrgent(order.id) ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber'"
            >
              <Icon icon="material-symbols:timer-outline" class="w-3.5 h-3.5" />
              <span>剩余支付时间</span>
              <span class="font-bold font-mono tracking-wide">{{ formatCountdown(countdownMap[order.id]) }}</span>
            </div>

            <!-- 分隔线 -->
            <div class="divider-coffee my-3" />

            <!-- 商品摘要 + 金额 -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-xl brand-placeholder flex items-center justify-center flex-shrink-0">
                  <WorldCoffeeLogoMini :size="22" :with-circle="false" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-ink truncate">
                    {{ firstProductName(order) }}
                  </div>
                  <div class="text-[11px] text-ink-muted mt-0.5">
                    等 {{ totalQuantity(order) }} 件商品
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-lg font-bold text-brand leading-none">
                  <span class="text-xs">¥</span>{{ formatPrice(order.totalAmount) }}
                </div>
                <div class="mt-1.5 text-[10px] text-ink-muted flex items-center justify-end gap-1">
                  <Icon icon="material-symbols:expand-more" class="w-3 h-3" :class="{ 'rotate-180': expandedOrderId === order.id }" />
                  详情
                </div>
              </div>
            </div>

            <!-- 地址 -->
            <div v-if="order.address" class="mt-3 flex items-start gap-2 pt-3 border-t border-line/30">
              <Icon icon="material-symbols:location-on-outline" class="w-3.5 h-3.5 text-ink-muted mt-0.5 flex-shrink-0" />
              <div class="text-[12px] text-ink-soft leading-relaxed line-clamp-2">
                {{ order.address }}
              </div>
            </div>

            <!-- 备注 -->
            <div v-if="order.remark" class="mt-2 flex items-start gap-2">
              <Icon icon="material-symbols:sticky-note-2-outline" class="w-3.5 h-3.5 text-ink-muted mt-0.5 flex-shrink-0" />
              <div class="text-[12px] text-ink-soft leading-relaxed line-clamp-2">
                备注：{{ order.remark }}
              </div>
            </div>

            <!-- 操作按钮 -->
            <div v-if="order.status === 0 || order.status === 2" class="mt-3 flex items-center justify-end gap-2 pt-3 border-t border-line/30">
              <button
                v-if="order.status === 0"
                class="h-8 px-4 rounded-lg border border-line text-ink-muted text-xs font-medium hover:bg-surface transition-colors disabled:opacity-40"
                :disabled="!!orderActionLoading[order.id]"
                @click.stop="handleCancelOrder(order)"
              >
                取消订单
              </button>
              <button
                v-if="order.status === 0"
                class="h-8 px-4 rounded-lg brand-gradient-btn text-xs font-semibold shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                :disabled="!!orderActionLoading[order.id]"
                @click.stop="router.push(`/shop/payment/${order.id}`)"
              >
                去支付
              </button>
              <button
                v-if="order.status === 2"
                class="h-8 px-4 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-semibold shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                :disabled="!!orderActionLoading[order.id]"
                @click.stop="handleUpdateStatus(order, 3)"
              >
                <Icon v-if="orderActionLoading[order.id] === 'confirm'" icon="material-symbols:progress-activity" class="w-3.5 h-3.5 animate-spin inline -mt-0.5 mr-1" />
                确认收货
              </button>
            </div>
          </div>

          <!-- 展开区域：所有订单明细 -->
          <Transition name="expand">
            <div v-if="expandedOrderId === order.id" class="bg-surface/50 border-t border-line/40">
              <!-- 加载中 -->
              <div v-if="!loadedDetails[order.id]" class="p-4 flex items-center justify-center gap-2 text-ink-muted text-sm">
                <Icon icon="material-symbols:progress-activity" class="w-4 h-4 animate-spin" />
                加载订单详情...
              </div>
              <div v-else class="p-4 space-y-2.5">
                <div class="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                  商品明细
                </div>
                <div
                  v-for="item in order.items"
                  :key="item.productId"
                  class="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-surface-elevated/70"
                >
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-9 h-9 rounded-lg brand-placeholder flex items-center justify-center flex-shrink-0">
                      <WorldCoffeeLogoMini :size="18" :with-circle="false" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-[13px] font-medium text-ink truncate">
                        {{ item.productName }}
                      </div>
                      <div class="text-[11px] text-ink-muted">
                        x {{ item.quantity }}
                      </div>
                    </div>
                  </div>
                  <div class="text-[13px] font-semibold text-brand flex-shrink-0">
                    ¥{{ formatPrice(item.price) }}
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && orders.length > 0" class="flex justify-center py-8">
        <AppButton
          variant="secondary"
          :loading="loading"
          @click="loadMore"
        >
          <span v-if="loading">加载中...</span>
          <span v-else>加载更多</span>
        </AppButton>
      </div>

      <!-- 到底啦 -->
      <div v-if="!hasMore && !loading && orders.length > 0" class="flex justify-center py-8">
        <div class="flex items-center gap-2 text-[12px] text-ink-muted">
          <div class="w-12 h-px bg-line/50"></div>
          <span>— 已经到底啦 —</span>
          <div class="w-12 h-px bg-line/50"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, inject, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { shopApi, getApiError } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { AppButton } from '@wc/shared'
import { EmptyState } from '@wc/shared'
import { WorldCoffeeLogoMini } from '@wc/shared'

const router = useRouter()
const route = useRoute()
const toast = inject<any>('toast')
const { isLoggedIn } = useAuth()

// ─── 状态 ───────────────────────────────
const orders = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 10
const expandedOrderId = ref(null)
const highlightedOrderId = ref(null)
const orderActionLoading = reactive({}) // id -> 'cancel' | 'pay' | 'confirm'
const loadedDetails = reactive({}) // id -> true，记录已加载过详情的订单

// ── 待支付订单倒计时 ────────────────────
const countdownMap = reactive({}) // orderId -> 剩余秒数
const PAYMENT_TIMEOUT = 15 * 60 // 15 分钟
let countdownTimer = null

/** 根据订单 createTime 计算剩余秒数并启动倒计时 */
function startOrderCountdowns() {
  // 清理旧的
  Object.keys(countdownMap).forEach(k => delete countdownMap[k])

  const pendingOrders = orders.value.filter(o => o.status === 0 && o.createTime)
  if (pendingOrders.length === 0) {
    stopCountdownTimer()
    return
  }

  pendingOrders.forEach(order => {
    const created = new Date(order.createTime).getTime()
    const elapsed = Math.floor((Date.now() - created) / 1000)
    countdownMap[order.id] = Math.max(0, PAYMENT_TIMEOUT - elapsed)
  })

  // 启动全局 tick
  if (!countdownTimer) {
    countdownTimer = setInterval(() => {
      let allDone = true
      for (const id of Object.keys(countdownMap)) {
        countdownMap[id]--
        if (countdownMap[id] <= 0) {
          delete countdownMap[id]
        } else {
          allDone = false
        }
      }
      if (allDone || Object.keys(countdownMap).length === 0) {
        stopCountdownTimer()
        // 倒计时结束，刷新订单列表（可能已被系统取消）
        fetchOrders(true)
      }
    }, 1000)
  }
}

function stopCountdownTimer() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function formatCountdown(seconds) {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function isCountdownUrgent(orderId) {
  return countdownMap[orderId] != null && countdownMap[orderId] <= 60
}

// ─── 登录守卫 ───────────────────────────
watch(isLoggedIn, (val) => {
  if (!val) {
    toast.show('请先登录', 'warn')
    router.replace('/login')
  }
}, { immediate: true })

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

function formatOrderTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function firstProductName(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) return '—'
  return order.items[0].productName || '—'
}

function totalQuantity(order) {
  if (!order || !Array.isArray(order.items)) return 0
  return order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
}

function statusText(status) {
  const map = {
    0: '待支付',
    1: '已支付',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return map[status] != null ? map[status] : '未知状态'
}

function statusIcon(status) {
  const map = {
    0: 'material-symbols:schedule',
    1: 'material-symbols:credit-card',
    2: 'material-symbols:local-shipping',
    3: 'material-symbols:check-circle',
    4: 'material-symbols:cancel'
  }
  return map[status] || 'material-symbols:help-outline'
}

function statusBadgeClass(status) {
  const map = {
    0: 'bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600 border border-orange-200/60',
    1: 'bg-gradient-to-br from-blue-50 to-sky-100 text-blue-600 border border-blue-200/60',
    2: 'bg-gradient-to-br from-violet-50 to-purple-100 text-purple-600 border border-purple-200/60',
    3: 'bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-600 border border-emerald-200/60',
    4: 'bg-gradient-to-br from-gray-50 to-slate-100 text-gray-500 border border-gray-200/60'
  }
  return map[status] || map[4]
}

// ─── 交互 ───────────────────────────────
async function toggleOrder(id) {
  if (expandedOrderId.value === id) {
    expandedOrderId.value = null
    return
  }
  expandedOrderId.value = id

  // 列表接口不含 items，首次展开时请求详情
  if (!loadedDetails[id]) {
    const order = orders.value.find(o => o.id === id)
    if (!order) return
    try {
      const res = await shopApi.getOrderDetail(id)
      if (res && res.code === 200 && res.data) {
        // 合并详情（主要是 items 数组）
        Object.assign(order, res.data)
        loadedDetails[id] = true
      }
    } catch (e) {
      toast.show(getApiError(e), 'error')
    }
  }
}

// ─── 订单操作 ─────────────────────────────
async function handleCancelOrder(order) {
  if (!order?.id) return
  const confirmed = window.confirm('确定要取消这笔订单吗？')
  if (!confirmed) return

  orderActionLoading[order.id] = 'cancel'
  try {
    const res = await shopApi.cancelOrder(order.id)
    if (res && res.code === 200) {
      order.status = 4 // cancelled
      toast.show('订单已取消')
    } else {
      toast.show(res?.msg || '取消失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    delete orderActionLoading[order.id]
  }
}

async function handlePayOrder(order) {
  if (!order?.id) return

  orderActionLoading[order.id] = 'pay'
  try {
    const res = await shopApi.payOrder(order.id)
    if (res && res.code === 200 && res.data) {
      const { orderNo, transactionId } = res.data
      // 调用支付回调，真正更新订单状态为已支付
      const cbRes = await shopApi.payCallback({ orderNo, transactionId })
      if (cbRes && cbRes.code === 200) {
        order.status = 1
        toast.show('支付成功')
      } else {
        toast.show(cbRes?.msg || '支付回调失败', 'error')
      }
    } else {
      toast.show(res?.msg || '支付失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    delete orderActionLoading[order.id]
  }
}

async function handleUpdateStatus(order, targetStatus) {
  if (!order?.id) return

  const actionMap = { 2: 'ship', 3: 'confirm' }
  const labelMap = { 2: '发货', 3: '确认收货' }
  orderActionLoading[order.id] = actionMap[targetStatus] || 'action'

  try {
    const res = await shopApi.updateOrderStatus(order.id, targetStatus)
    if (res && res.code === 200) {
      order.status = targetStatus
      toast.show(`订单已${labelMap[targetStatus]}`)
    } else {
      toast.show(res?.msg || '操作失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    delete orderActionLoading[order.id]
  }
}

function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/shop')
  }
}

// ─── 数据加载 ───────────────────────────
async function fetchOrders(reset = false) {
  if (loading.value) return
  if (!isLoggedIn.value) return

  if (reset) {
    page.value = 1
    orders.value = []
    hasMore.value = true
  }

  loading.value = true
  try {
    const res = await shopApi.getOrders({ page: page.value, size: pageSize })
    if (res && res.code === 200) {
      const newOrders = extractList(res)
      if (reset) {
        orders.value = newOrders
      } else {
        orders.value = [...orders.value, ...newOrders]
      }
      hasMore.value = newOrders.length >= pageSize
    } else {
      toast.show(res?.msg || '加载订单失败', 'error')
    }
  } catch (e) {
    toast.show(getApiError(e), 'error')
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value++
  fetchOrders()
}

// ─── 初始化 ─────────────────────────────
onMounted(async () => {
  if (isLoggedIn.value) {
    await fetchOrders(true)
    startOrderCountdowns()

    // 从支付页跳转过来时，高亮新订单
    const highlightId = route.query.highlight
    if (highlightId) {
      const id = Number(highlightId) || highlightId
      highlightedOrderId.value = id
      expandedOrderId.value = id

      await nextTick()
      const el = document.getElementById(`order-${id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }
})

onUnmounted(() => {
  stopCountdownTimer()
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 600px;
  opacity: 1;
}

@keyframes highlightPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(109, 76, 65, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(109, 76, 65, 0); }
}

.highlight-pulse {
  animation: highlightPulse 2s ease-in-out 3;
}
</style>
