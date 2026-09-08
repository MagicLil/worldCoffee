<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const words = ref([])
const logs = ref([])
const loadingWords = ref(false)
const loadingLogs = ref(false)
const keyword = ref('')
const formVisible = ref(false)
const editingId = ref(null)
const form = ref({
  word: '',
  category: 'general',
  action: 1
})

async function loadWords() {
  loadingWords.value = true
  try {
    words.value = await request.get('/api/admin/governance/sensitive-words', {
      params: { keyword: keyword.value || undefined }
    })
  } finally {
    loadingWords.value = false
  }
}

async function loadLogs() {
  loadingLogs.value = true
  try {
    logs.value = await request.get('/api/admin/governance/operation-logs', {
      params: { page: 1, size: 20 }
    })
  } finally {
    loadingLogs.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { word: '', category: 'general', action: 1 }
  formVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    word: row.word,
    category: row.category || 'general',
    action: row.action || 1
  }
  formVisible.value = true
}

async function submitForm() {
  if (editingId.value) {
    await request.put(`/api/admin/governance/sensitive-words/${editingId.value}`, form.value)
    ElMessage.success('已更新敏感词')
  } else {
    await request.post('/api/admin/governance/sensitive-words', form.value)
    ElMessage.success('已新增敏感词')
  }
  formVisible.value = false
  await loadWords()
  await loadLogs()
}

async function toggleWord(row) {
  await request.post(`/api/admin/governance/sensitive-words/${row.id}/toggle`)
  ElMessage.success(row.status === 1 ? '已停用' : '已启用')
  await loadWords()
  await loadLogs()
}

function actionText(action) {
  return action === 2 ? '直接拒绝' : '进入审核'
}

function formatTime(t) {
  return t ? t.replace('T', ' ').substring(0, 19) : '-'
}

onMounted(() => {
  loadWords()
  loadLogs()
})
</script>

<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span style="font-size: 18px; font-weight: 600">内容治理</span>
          <el-button type="primary" icon="Plus" @click="openCreate">新增敏感词</el-button>
        </div>
      </template>

      <el-row :gutter="12">
        <el-col :span="8">
          <el-input v-model="keyword" clearable placeholder="搜索敏感词" @keyup.enter="loadWords" />
        </el-col>
        <el-col :span="4">
          <el-button icon="Search" @click="loadWords">搜索</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" style="margin-bottom: 16px">
      <template #header>敏感词库</template>
      <el-table :data="words" v-loading="loadingWords" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="word" label="敏感词" min-width="160" />
        <el-table-column prop="category" label="分类" width="140" />
        <el-table-column label="动作" width="120">
          <template #default="{ row }">{{ actionText(row.action) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" text :type="row.status === 1 ? 'warning' : 'success'" @click="toggleWord(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span>最近操作日志</span>
          <el-button icon="Refresh" @click="loadLogs">刷新</el-button>
        </div>
      </template>
      <el-table :data="logs" v-loading="loadingLogs" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="adminName" label="管理员" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="动作" width="180" />
        <el-table-column prop="targetType" label="对象" width="140" />
        <el-table-column prop="targetId" label="对象ID" width="100" />
        <el-table-column prop="detail" label="详情" min-width="220" show-overflow-tooltip />
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑敏感词' : '新增敏感词'" width="420px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="敏感词">
          <el-input v-model="form.word" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" maxlength="40" />
        </el-form-item>
        <el-form-item label="命中动作">
          <el-radio-group v-model="form.action">
            <el-radio :label="1">进入审核</el-radio>
            <el-radio :label="2">直接拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
