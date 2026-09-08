<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/dashboard', title: '仪表盘', icon: 'Odometer' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/products', title: '商品管理', icon: 'Goods' },
  { path: '/orders', title: '订单管理', icon: 'List' },
  { path: '/marketing', title: '营销管理', icon: 'Present' },
  { path: '/moderation', title: '举报审核', icon: 'Warning' },
  { path: '/governance', title: '内容治理', icon: 'Filter' }
]

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    type: 'warning'
  }).then(() => {
    sessionStorage.removeItem('admin_token')
    router.push('/login')
  }).catch(() => {})
}
</script>

<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background: #304156">
      <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: bold; border-bottom: 1px solid #3d4a5a">
        ☕ World Coffee 后台
      </div>
      <el-menu
        :default-active="route.path"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="display: flex; align-items: center; justify-content: flex-end; border-bottom: 1px solid #eee; background: #fff">
        <span style="margin-right: 16px; color: #666">管理员</span>
        <el-button type="danger" text @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          退出
        </el-button>
      </el-header>

      <el-main style="background: #f5f7fa; padding: 20px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
