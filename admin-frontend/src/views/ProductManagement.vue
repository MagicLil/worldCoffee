<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

// ==================== 分类 ====================
const categories = ref([])
const categoryLoading = ref(false)
const newCategoryName = ref('')

async function loadCategories() {
  categoryLoading.value = true
  try {
    categories.value = await request.get('/api/admin/categories')
  } finally {
    categoryLoading.value = false
  }
}

async function addCategory() {
  if (!newCategoryName.value.trim()) return
  await request.post('/api/admin/categories', null, { params: { name: newCategoryName.value.trim() } })
  ElMessage.success('分类已添加')
  newCategoryName.value = ''
  loadCategories()
}

function handleDeleteCategory(cat) {
  ElMessageBox.confirm(`确定删除分类「${cat.name}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await request.delete(`/api/admin/categories/${cat.id}`)
      ElMessage.success('分类已删除')
      loadCategories()
    })
    .catch(() => {})
}

// ==================== 商品 ====================
const products = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const filterCategoryId = ref('')
const filterStatus = ref('')

async function loadProducts() {
  loading.value = true
  try {
    const params: any = { page: page.value, size: pageSize }
    if (filterCategoryId.value) params.categoryId = filterCategoryId.value
    if (filterStatus.value !== '' && filterStatus.value !== '') params.status = filterStatus.value
    products.value = await request.get('/api/admin/products', { params })
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadProducts()
}

// ==================== 商品表单弹窗 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('新增商品')
const editingProductId = ref(null)
const form = ref<any>({})

function openCreateDialog() {
  dialogTitle.value = '新增商品'
  editingProductId.value = null
  form.value = { name: '', description: '', price: 0, images: '', origin: '', roastLevel: '', weight: '', stock: 0 }
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑商品'
  editingProductId.value = row.id
  form.value = { ...row }
  dialogVisible.value = true
}

async function submitForm() {
  if (!form.value.name || !form.value.price) {
    ElMessage.warning('商品名称和价格必填')
    return
  }
  if (editingProductId.value) {
    await request.put(`/api/admin/products/${editingProductId.value}`, form.value)
    ElMessage.success('商品已更新')
  } else {
    await request.post('/api/admin/products', form.value)
    ElMessage.success('商品已创建')
  }
  dialogVisible.value = false
  loadProducts()
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除商品「${row.name}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await request.delete(`/api/admin/products/${row.id}`)
      ElMessage.success('商品已删除')
      loadProducts()
    })
    .catch(() => {})
}

async function toggleStatus(row) {
  const action = row.status === 1 ? '下架' : '上架'
  await ElMessageBox.confirm(`确定${action}商品「${row.name}」？`, '提示', { type: 'warning' })
  await request.post(`/api/admin/products/${row.id}/toggle`)
  ElMessage.success(`已${action}`)
  loadProducts()
}

function formatTime(t) {
  if (!t) return ''
  return String(t).replace('T', ' ').substring(0, 19)
}

onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<template>
  <div>
    <h2 style="margin-bottom: 16px">商品管理</h2>

    <!-- 分类管理 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>分类管理</span>
      </template>
      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px">
        <el-input v-model="newCategoryName" placeholder="新分类名称" style="width: 200px" @keyup.enter="addCategory" />
        <el-button type="primary" @click="addCategory">添加分类</el-button>
      </div>
      <el-tag
        v-for="cat in categories"
        :key="cat.id"
        closable
        style="margin-right: 8px; margin-bottom: 8px"
        @close="handleDeleteCategory(cat)"
      >
        {{ cat.name }}
      </el-tag>
      <el-tag v-if="categories.length === 0" type="info">暂无分类</el-tag>
    </el-card>

    <!-- 筛选栏 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-select v-model="filterCategoryId" placeholder="按分类筛选" clearable @change="search">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select v-model="filterStatus" placeholder="按状态筛选" clearable @change="search">
          <el-option label="上架中" :value="1" />
          <el-option label="已下架" :value="0" />
        </el-select>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-button type="primary" @click="openCreateDialog">新增商品</el-button>
      </el-col>
    </el-row>

    <!-- 商品表格 -->
    <el-table :data="products" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="price" label="价格" width="100">
        <template #default="{ row }">
          ¥{{ row.price }}
        </template>
      </el-table-column>
      <el-table-column prop="origin" label="产地" width="100" />
      <el-table-column prop="roastLevel" label="烘焙度" width="80" />
      <el-table-column prop="weight" label="规格" width="80" />
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column prop="sales" label="销量" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架中' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="openEditDialog(row)">编辑</el-button>
          <el-button :type="row.status === 1 ? 'warning' : 'success'" size="small" text @click="toggleStatus(row)">
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="(p) => { page = p; loadProducts() }"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="form.images" placeholder="图片链接，多张用逗号分隔" />
        </el-form-item>
        <el-form-item label="产地">
          <el-input v-model="form.origin" />
        </el-form-item>
        <el-form-item label="烘焙度">
          <el-select v-model="form.roastLevel" placeholder="选择烘焙度">
            <el-option label="浅烘" value="浅烘" />
            <el-option label="中烘" value="中烘" />
            <el-option label="中深烘" value="中深烘" />
            <el-option label="深烘" value="深烘" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.weight" placeholder="如 250g" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
