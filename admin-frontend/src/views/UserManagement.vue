<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const users = ref([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const total = ref(0)
const pageSize = 20

async function loadUsers() {
  loading.value = true
  try {
    users.value = await request.get('/api/admin/users', {
      params: { page: page.value, size: pageSize, keyword: keyword.value || undefined }
    })
    // 后端返回的是列表，简单估算总数
    total.value = users.value.length < pageSize ? (page.value - 1) * pageSize + users.value.length : page.value * pageSize + 1
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadUsers()
}

function handlePageChange(p) {
  page.value = p
  loadUsers()
}

function toggleFreeze(row) {
  const action = row.status === 1 ? '冻结' : '解冻'
  ElMessageBox.confirm(`确定要${action}用户「${row.username}」吗？`, '提示', { type: 'warning' })
    .then(async () => {
      const endpoint = row.status === 1 ? 'freeze' : 'unfreeze'
      await request.post(`/api/admin/users/${row.id}/${endpoint}`)
      ElMessage.success(`${action}成功`)
      loadUsers()
    }).catch(() => {})
}

function formatTime(t) {
  return t ? t.replace('T', ' ').substring(0, 19) : '-'
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <h2 style="margin-bottom: 20px">用户管理</h2>

    <!-- 搜索栏 -->
    <el-row :gutter="12" style="margin-bottom: 16px">
      <el-col :span="8">
        <el-input v-model="keyword" placeholder="搜索用户名/手机号" clearable @keyup.enter="handleSearch">
          <template #append>
            <el-button @click="handleSearch" icon="Search" />
          </template>
        </el-input>
      </el-col>
    </el-row>

    <!-- 用户表格 -->
    <el-table :data="users" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="avatar" label="头像" width="80">
        <template #default="{ row }">
          <el-avatar v-if="row.avatar" :src="row.avatar" :size="36" />
          <el-avatar v-else :size="36" icon="User" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '正常' : '冻结' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            :type="row.status === 1 ? 'danger' : 'success'"
            size="small" text
            @click="toggleFreeze(row)">
            {{ row.status === 1 ? '冻结' : '解冻' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 16px; justify-content: flex-end"
      layout="prev, pager, next"
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      @current-change="handlePageChange"
    />
  </div>
</template>
