<template>
  <ResponsivePageShell
    title="账号管理"
    subtitle="Profile & Security"
    mobile-subtitle="资料与安全"
    @back="router.back()"
  >
    <!-- 顶部栏 -->
    <header v-if="false" class="account-header sticky top-0 z-30 bg-surface-elevated/90 backdrop-blur-xl border-b border-line/40">
      <div class="account-header-inner mx-auto px-6 h-16 flex items-center justify-between">
        <button
          class="p-2 -ml-2 rounded-xl hover:bg-surface-soft transition-colors tap-scale"
          @click="router.back()"
          aria-label="返回"
        >
          <Icon icon="material-symbols:arrow-back" class="w-5 h-5 text-ink-soft" />
        </button>
        <h1 class="text-[15px] font-semibold text-ink">账号管理</h1>
        <div class="w-9" />
      </div>
    </header>

    <div class="account-main animate-fade-up">
      <!-- 头像卡片 -->
      <section
        class="account-avatar-card rounded-3xl p-6 bg-surface-elevated border border-line/40 cursor-pointer tap-scale"
        style="box-shadow: var(--shadow-card);"
        @click="triggerAvatarUpload"
      >
        <div class="flex items-center gap-4">
          <div class="relative">
            <div
              class="w-[72px] h-[72px] rounded-3xl overflow-hidden flex items-center justify-center text-xl font-bold"
              style="background: linear-gradient(135deg, var(--coffee-brown, #6D4C41), var(--coffee-espresso, #2C1810)); color: var(--text-inverse, #fff); box-shadow: var(--shadow-sm);"
            >
              <img v-if="profileForm.avatar" :src="profileForm.avatar" class="w-full h-full object-cover" @error="handleAvatarError" />
              <span v-else>{{ userNameInitial }}</span>
            </div>
            <!-- 上传状态指示 -->
            <div
              v-if="avatarUploading"
              class="absolute inset-0 rounded-3xl backdrop-blur-sm flex items-center justify-center"
              style="background: rgba(44, 24, 16, 0.6);"
            >
              <svg class="animate-spin-slow w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
            </div>
            <!-- 相机小图标 -->
            <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-2xl bg-surface-elevated border border-line/40 flex items-center justify-center" style="box-shadow: var(--shadow-xs);">
              <Icon icon="material-symbols:photo-camera" class="w-4 h-4" style="color: var(--coffee-brown, #6D4C41);" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-[15px] font-semibold text-ink">更换头像</h2>
            <p class="text-xs text-ink-muted mt-0.5">点击上传新的头像照片</p>
          </div>
          <Icon icon="material-symbols:chevron-right" class="w-5 h-5 text-ink-muted" />
        </div>
      </section>

      <!-- 个人信息卡片 -->
      <section class="account-profile-card rounded-3xl p-6 bg-surface-elevated border border-line/40 space-y-5" style="box-shadow: var(--shadow-card);">
        <h3 class="text-[15px] font-semibold text-ink">个人资料</h3>

        <AppInput
          v-model="profileForm.username"
          label="用户名"
          placeholder="2-20 个字符"
          :maxlength="20"
          showCounter
        />

        <AppInput
          v-model="profileForm.phone"
          label="手机号"
          placeholder="选填，11 位数字"
          :maxlength="11"
        />

        <div v-if="profileError" class="flex items-start gap-2 text-sm px-3.5 py-2.5 rounded-2xl animate-fade-in" style="background: var(--danger-bg); color: var(--danger-fg); border: 1px solid var(--danger-bg);">
          <Icon icon="material-symbols:error-outline" class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ profileError }}</span>
        </div>

        <button
          :disabled="profileLoading"
          @click="updateProfile"
          class="w-full min-h-[48px] rounded-2xl font-semibold text-[15px] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style="background: linear-gradient(135deg, var(--coffee-brown, #6D4C41), var(--coffee-espresso, #2C1810)); color: var(--text-inverse, #fff); box-shadow: var(--shadow-card);"
        >
          <svg v-if="profileLoading" class="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          <span>{{ profileLoading ? '保存中…' : '保存资料' }}</span>
        </button>
      </section>

      <!-- 账号安全卡片 -->
      <section class="account-security-card rounded-3xl p-6 bg-surface-elevated border border-line/40 space-y-5" style="box-shadow: var(--shadow-card);">
        <h3 class="text-[15px] font-semibold text-ink flex items-center gap-2">
          <Icon icon="material-symbols:lock-outline" class="w-5 h-5" style="color: var(--coffee-brown, #6D4C41);" />
          账号安全
        </h3>

        <AppInput
          v-model="passwordForm.oldPassword"
          type="password"
          label="当前密码"
          placeholder="输入当前密码"
          autocomplete="current-password"
          :maxlength="64"
        />

        <AppInput
          v-model="passwordForm.newPassword"
          type="password"
          label="新密码"
          placeholder="至少 6 位，建议包含字母和数字"
          autocomplete="new-password"
          :maxlength="64"
          showCounter
          @input="calcPasswordStrength"
        />

        <!-- 密码强度指示器 -->
        <div v-if="passwordForm.newPassword" class="space-y-1.5 animate-fade-in">
          <div class="flex gap-1.5">
            <span
              v-for="i in 4"
              :key="i"
              class="h-1.5 flex-1 rounded-full transition-colors duration-200"
              :style="{ background: i <= passwordStrength.level ? passwordStrength.colorHex : 'var(--divider)' }"
            />
          </div>
          <p class="text-[11px]" :style="{ color: passwordStrength.textColorHex }">
            {{ passwordStrength.text }}
          </p>
        </div>

        <AppInput
          v-model="passwordForm.confirmPassword"
          type="password"
          label="确认新密码"
          placeholder="再次输入新密码"
          autocomplete="new-password"
          :maxlength="64"
        />

        <div v-if="passwordError" class="flex items-start gap-2 text-sm px-3.5 py-2.5 rounded-2xl animate-fade-in" style="background: var(--danger-bg); color: var(--danger-fg); border: 1px solid var(--danger-bg);">
          <Icon icon="material-symbols:error-outline" class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ passwordError }}</span>
        </div>

        <button
          :disabled="passwordLoading"
          @click="changePassword"
          class="w-full min-h-[48px] rounded-2xl font-semibold text-[15px] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style="background: var(--bg-elevated); color: var(--accent); border: 2px solid var(--border);"
        >
          <svg v-if="passwordLoading" class="animate-spin-slow w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          <span>{{ passwordLoading ? '修改中…' : '修改密码' }}</span>
        </button>
      </section>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="avatarInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleAvatarSelect"
    />
  </ResponsivePageShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { userApi, getApiError, normalizeUrl } from '@wc/shared'
import { useAuth } from '@wc/shared'
import { AppInput } from '@wc/shared'
import ResponsivePageShell from '../layouts/ResponsivePageShell.vue'

const router = useRouter()
const toast = inject<any>('toast')
const { updateUser, user: authUser, logout } = useAuth()

const avatarInput = ref(null)
const avatarUploading = ref(false)

const profileForm = reactive({ username: '', phone: '', avatar: '' })
const profileLoading = ref(false)
const profileError = ref('')

const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordLoading = ref(false)
const passwordError = ref('')

const passwordStrength = reactive({ level: 0, text: '输入密码以评估强度', colorHex: '', textColorHex: '' })

const userNameInitial = computed(() => {
  const name = profileForm.username || authUser.value?.username || 'W'
  return name.charAt(0).toUpperCase()
})

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

function handleAvatarError() {
  profileForm.avatar = ''
}

/* ---------------- 图片压缩 ---------------- */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const MAX_SIZE = 512
    const QUALITY = 0.85
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * MAX_SIZE / width)
            width = MAX_SIZE
          } else {
            width = Math.round(width * MAX_SIZE / height)
            height = MAX_SIZE
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('压缩失败')),
          'image/jpeg',
          QUALITY
        )
      }
      img.src = e.target.result as string
    }
    reader.readAsDataURL(file)
  })
}

async function handleAvatarSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.show('请选择图片文件', 'error')
    e.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.show('图片不能超过 5MB', 'error')
    e.target.value = ''
    return
  }

  avatarUploading.value = true
  try {
    const uploadBlob = file.type === 'image/jpeg' || file.type === 'image/png'
      ? await compressImage(file)
      : file
    const fd = new FormData()
    fd.append('file', uploadBlob, uploadBlob.type === 'image/jpeg' ? 'avatar.jpg' : file.name)

    const res = await userApi.uploadAvatar(fd)
    if (res && res.code === 200) {
      const avatarUrl = normalizeUrl(res.data) || res.data
      profileForm.avatar = avatarUrl
      updateUser({ avatar: avatarUrl })
      toast.show('头像已更新')
    } else {
      toast.show(res?.msg || '上传失败', 'error')
    }
  } catch (err) {
    toast.show(getApiError(err), 'error')
  } finally {
    avatarUploading.value = false
    e.target.value = ''
  }
}

/* ---------------- 保存资料 ---------------- */
async function updateProfile() {
  profileError.value = ''
  const username = profileForm.username.trim()
  if (!username) {
    profileError.value = '用户名不能为空'
    return
  }
  if (username.length < 2) {
    profileError.value = '用户名至少 2 个字符'
    return
  }
  if (username.length > 20) {
    profileError.value = '用户名不能超过 20 个字符'
    return
  }
  const phone = profileForm.phone.trim()
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    profileError.value = '手机号格式不正确'
    return
  }
  profileLoading.value = true
  try {
    const res = await userApi.updateProfile({
      username,
      phone: phone || null,
      avatar: profileForm.avatar || null
    })
    if (res && res.code === 200) {
      const uid = authUser.value?.id ?? authUser.value?.userId
      const idField = authUser.value?.id !== undefined ? 'id' : 'userId'
      updateUser({
        [idField]: uid,
        username,
        avatar: profileForm.avatar || null,
        phone: phone || null
      })
      toast.show('资料已更新')
    } else {
      profileError.value = res?.msg || '更新失败'
    }
  } catch (e) {
    profileError.value = getApiError(e)
  } finally {
    profileLoading.value = false
  }
}

/* ---------------- 密码强度 ---------------- */
function calcPasswordStrength() {
  const pw = passwordForm.newPassword
  if (!pw) {
    passwordStrength.level = 0
    passwordStrength.text = '输入密码以评估强度'
    passwordStrength.colorHex = ''
    passwordStrength.textColorHex = ''
    return
  }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) {
    passwordStrength.level = 1
    passwordStrength.text = '密码强度：弱 — 建议使用更长或更复杂的密码'
    passwordStrength.colorHex = '#E88B8B'
    passwordStrength.textColorHex = '#C96B6B'
  } else if (score <= 2) {
    passwordStrength.level = 2
    passwordStrength.text = '密码强度：一般 — 可以更复杂一点'
    passwordStrength.colorHex = '#EEC27B'
    passwordStrength.textColorHex = '#C99A4B'
  } else if (score <= 3) {
    passwordStrength.level = 3
    passwordStrength.text = '密码强度：良好'
    passwordStrength.colorHex = '#7CAE8C'
    passwordStrength.textColorHex = '#5A8A6E'
  } else {
    passwordStrength.level = 4
    passwordStrength.text = '密码强度：非常强'
    passwordStrength.colorHex = '#7CAE8C'
    passwordStrength.textColorHex = '#5A8A6E'
  }
}

/* ---------------- 修改密码 ---------------- */
async function changePassword() {
  passwordError.value = ''
  if (!passwordForm.oldPassword) {
    passwordError.value = '请输入当前密码'
    return
  }
  if (!passwordForm.newPassword) {
    passwordError.value = '请输入新密码'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    passwordError.value = '新密码至少 6 位'
    return
  }
  if (!passwordForm.confirmPassword) {
    passwordError.value = '请再次输入新密码'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }
  if (passwordForm.oldPassword === passwordForm.newPassword) {
    passwordError.value = '新密码不能与旧密码相同'
    return
  }

  passwordLoading.value = true
  try {
    const res = await userApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    if (res && res.code === 200) {
      toast.show('密码已修改，请重新登录')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      logout()
      router.push('/login')
    } else {
      passwordError.value = res?.msg || '修改失败'
    }
  } catch (e) {
    passwordError.value = getApiError(e)
  } finally {
    passwordLoading.value = false
  }
}

/* ---------------- 初始化 ---------------- */
async function fetchUser() {
  try {
    const res = await userApi.getMe()
    if (res && res.code === 200 && res.data) {
      profileForm.username = res.data.username || ''
      profileForm.phone = res.data.phone || ''
      profileForm.avatar = normalizeUrl(res.data.avatar) || ''
      if (profileForm.avatar) {
        updateUser({ avatar: profileForm.avatar })
      }
    }
  } catch (e) { /* ignore */ }
}
fetchUser()
</script>

<style scoped>
.account-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(166, 106, 67, .16), transparent 28%),
    radial-gradient(circle at 92% 14%, rgba(215, 204, 200, .22), transparent 30%),
    linear-gradient(180deg, #fbf7f2 0%, var(--bg-primary) 56%);
}
.account-header {
  box-shadow: 0 10px 28px rgba(62, 39, 35, .055);
}
.account-header-inner,
.account-main {
  width: min(1120px, 100%);
}
.account-header h1 {
  font-size: 17px;
  font-weight: 950;
  letter-spacing: -.03em;
}
.account-main {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  grid-template-areas:
    "avatar profile"
    "avatar security";
  gap: 22px;
  align-items: start;
}
.account-avatar-card {
  grid-area: avatar;
  position: sticky;
  top: 88px;
  min-height: 220px;
  display: flex;
  align-items: center;
}
.account-profile-card {
  grid-area: profile;
}
.account-security-card {
  grid-area: security;
}
.account-avatar-card,
.account-profile-card,
.account-security-card {
  background: color-mix(in srgb, var(--bg-elevated) 88%, transparent) !important;
  border-color: color-mix(in srgb, var(--border) 70%, transparent) !important;
  box-shadow: 0 16px 44px rgba(62, 39, 35, .07) !important;
  backdrop-filter: blur(14px);
}
.account-avatar-card :deep(.flex.items-center.gap-4) {
  width: 100%;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.account-avatar-card :deep(.w-\[72px\]) {
  width: 112px;
  height: 112px;
  border-radius: 34px;
}
.account-profile-card h3,
.account-security-card h3 {
  font-size: 18px;
  font-weight: 950;
}
@media (max-width: 900px) {
  .account-header-inner,
  .account-main {
    padding-left: 14px;
    padding-right: 14px;
  }
  .account-main {
    display: block;
  }
  .account-avatar-card {
    position: static;
    min-height: auto;
    margin-bottom: 16px;
  }
  .account-security-card {
    margin-top: 16px;
  }
}
</style>
