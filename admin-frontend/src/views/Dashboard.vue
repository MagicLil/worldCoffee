<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const stats = ref({})
const loading = ref(true)

async function loadStats() {
  loading.value = true
  try {
    stats.value = await request.get('/api/admin/dashboard')
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)

const cards = [
  { key: 'userCount', title: '用户总数', icon: 'User', color: '#409eff' },
  { key: 'productCount', title: '商品总数', icon: 'Goods', color: '#67c23a' },
  { key: 'orderCount', title: '订单总数', icon: 'List', color: '#e6a23c' },
  { key: 'todayOrderCount', title: '今日新增订单', icon: 'Calendar', color: '#f56c6c' },
  { key: 'pendingShipCount', title: '待发货', icon: 'Van', color: '#909399' },
  { key: 'totalRevenue', title: '总销售额', icon: 'Money', color: '#b37feb' }
]
</script>

<template>
  <div v-loading="loading">
    <h2 style="margin-bottom: 20px">仪表盘</h2>
    <el-row :gutter="20">
      <el-col :span="8" v-for="card in cards" :key="card.key">
        <el-card shadow="hover" style="margin-bottom: 20px">
          <div style="display: flex; align-items: center; gap: 16px">
            <el-icon :size="40" :color="card.color"><component :is="card.icon" /></el-icon>
            <div>
              <div style="font-size: 14px; color: #999">{{ card.title }}</div>
              <div style="font-size: 28px; font-weight: bold; color: #333">
                {{ stats[card.key] ?? '-' }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
