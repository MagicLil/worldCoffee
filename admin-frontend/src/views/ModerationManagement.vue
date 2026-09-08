<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const reports = ref([])
const loading = ref(false)
const status = ref<any>(0)
const page = ref(1)
const pageSize = 20
const total = ref(0)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待处理', value: 0 },
  { label: '已忽略', value: 1 },
  { label: '已下架', value: 2 }
]

async function loadReports() {
  loading.value = true
  try {
    reports.value = await request.get('/api/admin/community/reports', {
      params: {
        status: status.value === '' ? undefined : status.value,
        page: page.value,
        size: pageSize
      }
    })
    total.value = reports.value.length < pageSize ? (page.value - 1) * pageSize + reports.value.length : page.value * pageSize + 1
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  page.value = 1
  loadReports()
}

function handlePageChange(p) {
  page.value = p
  loadReports()
}

function statusTag(row) {
  if (row.status === 2) return 'danger'
  if (row.status === 1) return 'info'
  return 'warning'
}

function formatTime(t) {
  return t ? t.replace('T', ' ').substring(0, 19) : '-'
}

async function handleReport(row, action) {
  const isRemove = action === 'REMOVE_POST'
  const title = isRemove ? '确认下架该帖子吗？' : '确认忽略该举报吗？'
  const remark = isRemove ? '举报成立，帖子已下架' : '举报不成立，已忽略'
  await ElMessageBox.confirm(title, '审核确认', { type: isRemove ? 'warning' : 'info' })
  await request.post(`/api/admin/community/reports/${row.id}/handle`, { action, remark })
  ElMessage.success(isRemove ? '已下架帖子' : '已忽略举报')
  loadReports()
}

onMounted(loadReports)
</script>

<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span style="font-size: 18px; font-weight: 600">举报审核</span>
          <el-button icon="Refresh" @click="loadReports">刷新</el-button>
        </div>
      </template>

      <el-row :gutter="12">
        <el-col :span="6">
          <el-select v-model="status" placeholder="处理状态" style="width: 100%" @change="handleFilterChange">
            <el-option v-for="item in statusOptions" :key="item.label" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <el-table :data="reports" v-loading="loading" border stripe>
      <el-table-column prop="id" label="举报ID" width="90" />
      <el-table-column label="帖子" min-width="300">
        <template #default="{ row }">
          <div style="display: flex; gap: 12px; align-items: flex-start">
            <el-image
              v-if="row.postImages?.length"
              :src="row.postImages[0]"
              fit="cover"
              style="width: 64px; height: 64px; border-radius: 8px; flex: none"
              :preview-src-list="row.postImages"
              preview-teleported
            />
            <div>
              <div style="font-weight: 600; margin-bottom: 4px">#{{ row.postId }} {{ row.postTitle || '无标题' }}</div>
              <div style="color: #666; font-size: 13px; line-height: 1.5; max-width: 520px">
                {{ row.postContent || '-' }}
              </div>
              <div style="color: #999; font-size: 12px; margin-top: 6px">作者ID：{{ row.postAuthorId || '-' }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="举报原因" min-width="180" show-overflow-tooltip />
      <el-table-column prop="remark" label="处理备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="reporterId" label="举报人ID" width="110" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row)">{{ row.statusText || '待处理' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="举报时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="处理时间" width="180">
        <template #default="{ row }">{{ formatTime(row.handleTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button type="primary" size="small" text @click="handleReport(row, 'IGNORE')">忽略</el-button>
            <el-button type="danger" size="small" text @click="handleReport(row, 'REMOVE_POST')">下架</el-button>
          </template>
          <span v-else style="color: #999">已处理</span>
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
