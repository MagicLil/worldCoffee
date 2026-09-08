<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const coupons = ref([])
const loading = ref(false)
const filterType = ref('')

const typeMap = {
  1: { label: '满减券', type: '' },
  2: { label: '折扣券', type: 'warning' },
  3: { label: '秒杀券', type: 'danger' }
}

async function loadCoupons() {
  loading.value = true
  try {
    const params: any = {}
    if (filterType.value !== '') params.type = filterType.value
    coupons.value = await request.get('/api/admin/marketing/coupons', { params })
  } finally {
    loading.value = false
  }
}

function search() {
  loadCoupons()
}

function formatTime(t) {
  if (!t) return ''
  return String(t).replace('T', ' ').substring(0, 19)
}

// ==================== 新增/编辑弹窗 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('新增优惠券')
const editingId = ref(null)
const form = ref<any>({})

function openCreateDialog() {
  dialogTitle.value = '新增优惠券'
  editingId.value = null
  form.value = {
    name: '', type: 1, value: 0, seckillPrice: 0,
    minAmount: 0, stock: 0, startTime: '', endTime: ''
  }
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑优惠券'
  editingId.value = row.id
  // 把时间转成 datetime-local 格式
  form.value = {
    ...row,
    startTime: row.startTime ? formatTime(row.startTime).replace(' ', 'T') : '',
    endTime: row.endTime ? formatTime(row.endTime).replace(' ', 'T') : ''
  }
  dialogVisible.value = true
}

async function submitForm() {
  if (!form.value.name) {
    ElMessage.warning('请填写优惠券名称')
    return
  }
  if (editingId.value) {
    await request.put(`/api/admin/marketing/coupons/${editingId.value}`, form.value)
    ElMessage.success('优惠券已更新')
  } else {
    await request.post('/api/admin/marketing/coupons', form.value)
    ElMessage.success('优惠券已创建')
  }
  dialogVisible.value = false
  loadCoupons()
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除优惠券「${row.name}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await request.delete(`/api/admin/marketing/coupons/${row.id}`)
      ElMessage.success('优惠券已删除')
      loadCoupons()
    })
    .catch(() => {})
}

async function toggleStatus(row) {
  const action = row.status === 1 ? '下架' : '上架'
  await ElMessageBox.confirm(`确定${action}优惠券「${row.name}」？`, '提示', { type: 'warning' })
  await request.post(`/api/admin/marketing/coupons/${row.id}/toggle`)
  ElMessage.success(`已${action}`)
  loadCoupons()
}

// ==================== 领取记录弹窗 ====================
const participantsVisible = ref(false)
const participants = ref([])
const participantsLoading = ref(false)

async function viewParticipants(row) {
  participantsLoading.value = true
  participantsVisible.value = true
  try {
    participants.value = await request.get(`/api/admin/marketing/coupons/${row.id}/participants`)
  } finally {
    participantsLoading.value = false
  }
}

// ==================== 秒杀关联商品弹窗 ====================
const productsVisible = ref(false)
const productIdsInput = ref('')
const currentCouponId = ref(null)

async function openProductsDialog(row) {
  currentCouponId.value = row.id
  const ids = await request.get(`/api/admin/marketing/coupons/${row.id}/products`)
  productIdsInput.value = ids.join(', ')
  productsVisible.value = true
}

async function saveProducts() {
  const ids = productIdsInput.value
    .split(/[,，\s]+/)
    .filter(s => s.trim())
    .map(Number)
    .filter(n => !isNaN(n))
  await request.put(`/api/admin/marketing/coupons/${currentCouponId.value}/products`, ids)
  ElMessage.success('关联商品已更新')
  productsVisible.value = false
}

onMounted(() => {
  loadCoupons()
})
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">营销管理</h2>

    <!-- 筛选栏 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-select v-model="filterType" placeholder="按类型筛选" clearable @change="search">
          <el-option label="满减券" :value="1" />
          <el-option label="折扣券" :value="2" />
          <el-option label="秒杀券" :value="3" />
        </el-select>
      </el-col>
      <el-col :span="18" style="text-align: right">
        <el-button type="primary" @click="openCreateDialog">新增优惠券</el-button>
      </el-col>
    </el-row>

    <!-- 优惠券表格 -->
    <el-table :data="coupons" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="typeMap[row.type]?.type || ''">
            {{ typeMap[row.type]?.label || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="面额/秒杀价" width="120">
        <template #default="{ row }">
          <span v-if="row.type === 3">¥{{ row.seckillPrice }}</span>
          <span v-else-if="row.type === 2">{{ row.value }}折</span>
          <span v-else>减¥{{ row.value }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最低消费" width="100">
        <template #default="{ row }">¥{{ row.minAmount }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column label="有效期" width="170">
        <template #default="{ row }">
          <div style="font-size: 12px">
            {{ formatTime(row.startTime) }}<br />~ {{ formatTime(row.endTime) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="openEditDialog(row)">编辑</el-button>
          <el-button :type="row.status === 1 ? 'warning' : 'success'" size="small" text @click="toggleStatus(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button type="info" size="small" text @click="viewParticipants(row)">领取记录</el-button>
          <el-button v-if="row.type === 3" type="danger" size="small" text @click="openProductsDialog(row)">关联商品</el-button>
          <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="秒杀券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type !== 3" label="面额">
          <el-input-number v-model="form.value" :min="0" :precision="2" />
          <span v-if="form.type === 2" style="margin-left: 8px; color: #999">折扣券填折扣数（如 8.5 表示 8.5 折）</span>
          <span v-else style="margin-left: 8px; color: #999">满减券填减免金额</span>
        </el-form-item>
        <el-form-item v-if="form.type === 3" label="秒杀价">
          <el-input-number v-model="form.seckillPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="最低消费">
          <el-input-number v-model="form.minAmount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 领取记录弹窗 -->
    <el-dialog v-model="participantsVisible" title="领取记录" width="600px">
      <el-table :data="participants" border stripe v-loading="participantsLoading" size="small">
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="领取时间" width="170">
          <template #default="{ row }">{{ formatTime(row.receiveTime) }}</template>
        </el-table-column>
        <el-table-column label="使用状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.used === 1 ? 'success' : 'info'">
              {{ row.used === 1 ? '已使用' : '未使用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 秒杀关联商品弹窗 -->
    <el-dialog v-model="productsVisible" title="关联秒杀商品" width="440px">
      <p style="color: #999; margin-bottom: 12px">输入商品ID，多个用逗号分隔</p>
      <el-input v-model="productIdsInput" type="textarea" :rows="3" placeholder="如：1, 2, 3" />
      <template #footer>
        <el-button @click="productsVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProducts">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
