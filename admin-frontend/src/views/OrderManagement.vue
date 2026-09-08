<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const orders = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20

// 筛选
const filterStatus = ref('')
const filterUserId = ref('')
const filterOrderNo = ref('')

// 详情弹窗
const detailVisible = ref(false)
const currentOrder = ref(null)

// 发货弹窗
const shipVisible = ref(false)
const shipOrderId = ref(null)
const shipForm = ref({ shippingCompany: '', trackingNo: '' })

const statusMap = {
  0: { label: '待支付', type: 'info' },
  1: { label: '已支付', type: 'warning' },
  2: { label: '已发货', type: 'primary' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已取消', type: 'danger' }
}

async function loadOrders() {
  loading.value = true
  try {
    const params: any = { page: page.value, size: pageSize }
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (filterUserId.value) params.userId = filterUserId.value
    if (filterOrderNo.value.trim()) params.orderNo = filterOrderNo.value.trim()
    orders.value = await request.get('/api/admin/orders', { params })
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadOrders()
}

function formatTime(t) {
  if (!t) return ''
  return String(t).replace('T', ' ').substring(0, 19)
}

// 查看详情
async function viewDetail(row) {
  const data = await request.get(`/api/admin/orders/${row.id}`)
  currentOrder.value = data
  detailVisible.value = true
}

// 打开发货弹窗
function openShipDialog(row) {
  shipOrderId.value = row.id
  shipForm.value = { shippingCompany: '', trackingNo: '' }
  shipVisible.value = true
}

// 确认发货
async function submitShip() {
  if (!shipForm.value.shippingCompany || !shipForm.value.trackingNo) {
    ElMessage.warning('请填写快递公司和快递单号')
    return
  }
  await request.post(`/api/admin/orders/${shipOrderId.value}/ship`, null, {
    params: shipForm.value
  })
  ElMessage.success('发货成功')
  shipVisible.value = false
  loadOrders()
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">订单管理</h2>

    <!-- 筛选栏 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="5">
        <el-select v-model="filterStatus" placeholder="按状态筛选" clearable @change="search">
          <el-option label="待支付" :value="0" />
          <el-option label="已支付" :value="1" />
          <el-option label="已发货" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </el-col>
      <el-col :span="5">
        <el-input v-model="filterUserId" placeholder="用户ID" clearable @clear="search" @keyup.enter="search" />
      </el-col>
      <el-col :span="6">
        <el-input v-model="filterOrderNo" placeholder="订单号" clearable @clear="search" @keyup.enter="search" />
      </el-col>
      <el-col :span="8" style="text-align: right">
        <el-button type="primary" @click="search">搜索</el-button>
      </el-col>
    </el-row>

    <!-- 订单表格 -->
    <el-table :data="orders" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="orderNo" label="订单号" min-width="180" />
      <el-table-column prop="userId" label="用户ID" width="80" />
      <el-table-column label="金额" width="100">
        <template #default="{ row }">
          ¥{{ row.totalAmount }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'">
            {{ statusMap[row.status]?.label || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="viewDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 1"
            type="success"
            size="small"
            text
            @click="openShipDialog(row)"
          >
            发货
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        layout="prev, pager, next"
        @current-change="(p) => { page = p; loadOrders() }"
      />
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <div v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentOrder.userId }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ currentOrder.totalAmount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusMap[currentOrder.status]?.type">
              {{ statusMap[currentOrder.status]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.address }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatTime(currentOrder.createTime) }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 16px 0 8px">商品明细</h4>
        <el-table :data="currentOrder.items" border size="small">
          <el-table-column prop="productName" label="商品" />
          <el-table-column label="单价" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="小计" width="100">
            <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 发货弹窗 -->
    <el-dialog v-model="shipVisible" title="订单发货" width="440px">
      <el-form :model="shipForm" label-width="80px">
        <el-form-item label="快递公司">
          <el-input v-model="shipForm.shippingCompany" placeholder="如：顺丰速运" />
        </el-form-item>
        <el-form-item label="快递单号">
          <el-input v-model="shipForm.trackingNo" placeholder="如：SF1234567890" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>
