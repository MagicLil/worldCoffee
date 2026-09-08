<template>
  <ResponsivePageShell
    title="设置"
    subtitle="WorldCoffee Account"
    mobile-subtitle="账号中心"
    @back="router.back()"
  >
    <template #web>
      <div class="settings-main">
        <aside class="settings-profile-card settings-card">
          <div class="settings-avatar">
            <img v-if="userAvatar" :src="userAvatar" />
            <span v-else>{{ userName?.charAt(0)?.toUpperCase() || '?' }}</span>
          </div>
          <h1>{{ userName || 'WorldCoffee 用户' }}</h1>
          <p>{{ userPhone || '未设置手机号' }}</p>
          <button class="settings-primary-btn tap-scale" @click="router.push('/settings/account')">
            编辑资料
          </button>
        </aside>

        <section class="settings-content">
          <div class="settings-hero settings-card">
            <p>ACCOUNT CENTER</p>
            <h2>管理你的 WorldCoffee 账号</h2>
            <span>Web 端使用宽屏卡片和双栏布局；移动端保留轻量列表，不再混用一套手机页。</span>
          </div>

          <div class="settings-grid">
            <button class="settings-action-card settings-card" @click="router.push('/settings/account')">
              <Icon icon="material-symbols:manage-accounts-outline" class="w-7 h-7" />
              <strong>账号管理</strong>
              <span>修改资料、头像、手机号和密码</span>
            </button>

            <button class="settings-action-card settings-card" @click="router.push('/settings/about')">
              <Icon icon="material-symbols:info-outline" class="w-7 h-7" />
              <strong>关于我们</strong>
              <span>查看版本信息和联系方式</span>
            </button>
          </div>

          <button class="settings-logout tap-scale" @click="handleLogout">
            <Icon icon="material-symbols:logout" class="w-4 h-4" />
            退出登录
          </button>
        </section>
      </div>
    </template>

    <template #mobile>
      <div class="settings-mobile">
        <section class="settings-mobile-profile settings-card">
          <div class="settings-avatar is-mobile">
            <img v-if="userAvatar" :src="userAvatar" />
            <span v-else>{{ userName?.charAt(0)?.toUpperCase() || '?' }}</span>
          </div>
          <div class="min-w-0">
            <h1>{{ userName || 'WorldCoffee 用户' }}</h1>
            <p>{{ userPhone || '未设置手机号' }}</p>
          </div>
        </section>

        <section class="settings-mobile-list settings-card">
          <button @click="router.push('/settings/account')">
            <Icon icon="material-symbols:manage-accounts-outline" class="w-5 h-5" />
            <span>
              <strong>账号管理</strong>
              <em>修改资料、头像和密码</em>
            </span>
            <Icon icon="material-symbols:chevron-right" class="w-5 h-5" />
          </button>
          <button @click="router.push('/settings/about')">
            <Icon icon="material-symbols:info-outline" class="w-5 h-5" />
            <span>
              <strong>关于我们</strong>
              <em>版本信息和联系方式</em>
            </span>
            <Icon icon="material-symbols:chevron-right" class="w-5 h-5" />
          </button>
        </section>

        <button class="settings-logout tap-scale" @click="handleLogout">
          <Icon icon="material-symbols:logout" class="w-4 h-4" />
          退出登录
        </button>
      </div>
    </template>
  </ResponsivePageShell>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { userApi } from '@wc/shared'
import { useAuth } from '@wc/shared'
import ResponsivePageShell from '../layouts/ResponsivePageShell.vue'

const router = useRouter()
const toast = inject<any>('toast')
const { avatar: authAvatar } = useAuth()

const userName = ref('')
const userPhone = ref('')
const userAvatar = ref('')

async function handleLogout() {
  try {
    await userApi.logout()
  } catch (e) {
    // 即使后端退出失败，也继续清理本地登录态
  }
  toast.logout()
  toast.show('已退出登录')
  router.push('/login')
}

async function fetchUser() {
  try {
    const res = await userApi.getMe()
    if (res && res.code === 200 && res.data) {
      userName.value = res.data.username || ''
      userPhone.value = res.data.phone || ''
      userAvatar.value = res.data.avatar || authAvatar.value || ''
    }
  } catch (e) {
    // 设置页不打断用户操作
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.settings-main {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.settings-card {
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg-elevated) 86%, transparent);
  box-shadow: 0 16px 44px rgba(62, 39, 35, .07);
  backdrop-filter: blur(14px);
}
.settings-profile-card {
  position: sticky;
  top: 92px;
  padding: 28px 22px;
  border-radius: 30px;
  text-align: center;
}
.settings-avatar {
  width: 108px;
  height: 108px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 34px;
  color: #fff8ef;
  background: linear-gradient(135deg, #9a6346, #3E2723);
  box-shadow: 0 16px 34px rgba(62, 39, 35, .22);
  font-size: 32px;
  font-weight: 950;
}
.settings-avatar.is-mobile {
  width: 62px;
  height: 62px;
  margin: 0;
  border-radius: 22px;
  font-size: 20px;
  flex-shrink: 0;
}
.settings-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.settings-profile-card h1,
.settings-mobile-profile h1 {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 950;
}
.settings-mobile-profile h1 {
  font-size: 17px;
}
.settings-profile-card p,
.settings-mobile-profile p {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 13px;
}
.settings-primary-btn,
.settings-logout {
  height: 42px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 900;
}
.settings-primary-btn {
  width: 100%;
  margin-top: 20px;
  color: #fff8ef;
  background: linear-gradient(135deg, #8D5A3B, #3E2723);
  box-shadow: 0 12px 26px rgba(109, 76, 65, .2);
}
.settings-content {
  display: grid;
  gap: 18px;
}
.settings-hero {
  min-height: 172px;
  padding: 28px;
  border-radius: 30px;
}
.settings-hero p {
  color: #a06d50;
  font-size: 10px;
  font-weight: 950;
  letter-spacing: .18em;
}
.settings-hero h2 {
  margin-top: 8px;
  color: var(--text-primary);
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1.05;
  font-weight: 950;
  letter-spacing: -.06em;
}
.settings-hero span {
  display: block;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 13px;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.settings-action-card {
  min-height: 156px;
  padding: 22px;
  border-radius: 26px;
  text-align: left;
  color: var(--text-secondary);
}
.settings-action-card:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent-cream) 42%, var(--bg-elevated));
}
.settings-action-card strong {
  display: block;
  margin-top: 16px;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 950;
}
.settings-action-card span {
  display: block;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 13px;
}
.settings-logout {
  width: 100%;
  color: #ef4444;
  background: color-mix(in srgb, #fff 84%, transparent);
  border: 1px solid rgba(239, 68, 68, .22);
}
.settings-mobile {
  display: grid;
  gap: 14px;
}
.settings-mobile-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 24px;
}
.settings-mobile-list {
  overflow: hidden;
  border-radius: 24px;
}
.settings-mobile-list button {
  width: 100%;
  min-height: 68px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  text-align: left;
  border-bottom: 1px solid var(--divider);
}
.settings-mobile-list button:last-child {
  border-bottom: 0;
}
.settings-mobile-list span {
  min-width: 0;
  flex: 1;
}
.settings-mobile-list strong,
.settings-mobile-list em {
  display: block;
}
.settings-mobile-list strong {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 900;
}
.settings-mobile-list em {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 11px;
  font-style: normal;
}
</style>
