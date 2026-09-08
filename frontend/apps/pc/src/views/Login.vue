<!-- ============================================================
     WorldCoffee 登录页（含 Logo · 双主题）
============================================================ -->
<template>
  <div class="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm">

      <!-- ===== 顶部 Logo ===== -->
      <div class="text-center mb-8">
        <WorldCoffeeLogo :size="100" variant="full" />
      </div>

      <!-- ===== 登录卡片 ===== -->
      <div class="bg-surface-elevated rounded-[28px] p-7 border border-line/40 animate-fade-up" style="box-shadow: var(--shadow-card);">
        <h1 class="text-[22px] font-bold text-ink text-center">欢迎回来</h1>
        <p class="mt-2 text-center text-[13px] text-ink-muted">用账号登录，发现你的好咖啡</p>

        <!-- 表单 -->
        <form class="mt-7 space-y-4" @submit.prevent="handleLogin">
          <div>
            <label class="text-[12px] font-semibold text-ink-soft mb-1.5 block">账号</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="用户名 / 邮箱"
              class="w-full h-11 px-4 rounded-xl bg-surface-soft border border-transparent focus:border-line focus:bg-surface-elevated text-[14px] text-ink placeholder:text-ink-muted outline-none transition-all"
              required
            />
          </div>

          <div>
            <label class="text-[12px] font-semibold text-ink-soft mb-1.5 block">密码</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              class="w-full h-11 px-4 rounded-xl bg-surface-soft border border-transparent focus:border-line focus:bg-surface-elevated text-[14px] text-ink placeholder:text-ink-muted outline-none transition-all"
              required
            />
          </div>

          <div class="flex items-center justify-between text-[12px] pt-1">
            <label class="flex items-center gap-2 text-ink-muted cursor-pointer">
              <input v-model="form.remember" type="checkbox" class="w-4 h-4 rounded" style="accent-color: var(--accent);" />
              <span>记住我</span>
            </label>
            <a class="text-ink font-medium hover:underline" href="javascript:;">忘记密码？</a>
          </div>

          <p v-if="loginError" class="text-[12px] text-red-500 text-center">{{ loginError }}</p>

          <button
            type="submit"
            class="w-full h-12 rounded-xl text-[15px] font-semibold active:scale-[0.98] transition-all tap-scale"
            style="background: linear-gradient(135deg, var(--coffee-brown, #6D4C41), var(--coffee-espresso, #2C1810)); color: var(--text-inverse, #fff); box-shadow: var(--shadow-card);"
          >
            登录
          </button>
        </form>

        <!-- 分隔 -->
        <div class="flex items-center gap-3 my-6">
          <span class="flex-1 h-px" style="background: var(--divider);" />
          <span class="text-[11px] text-ink-muted tracking-widest">或</span>
          <span class="flex-1 h-px" style="background: var(--divider);" />
        </div>

        <!-- 注册入口 -->
        <p class="text-center text-[13px] text-ink-muted">
          还没有账号？
          <router-link to="/register" class="ml-1 text-ink font-semibold hover:underline">立即注册</router-link>
        </p>

        <!-- 第三方 -->
        <div class="mt-5 flex items-center justify-center gap-4">
          <button class="w-10 h-10 rounded-full bg-surface-soft hover:bg-line/40 transition-colors">
            <span class="text-[18px]">🌍</span>
          </button>
          <button class="w-10 h-10 rounded-full bg-surface-soft hover:bg-line/40 transition-colors">
            <span class="text-[18px]">📧</span>
          </button>
          <button class="w-10 h-10 rounded-full bg-surface-soft hover:bg-line/40 transition-colors">
            <span class="text-[18px]">☕</span>
          </button>
        </div>
      </div>

      <!-- 返回首页 -->
      <div class="mt-6 text-center">
        <router-link to="/" class="text-[12px] text-ink-muted hover:text-ink transition-colors">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@wc/shared'
import { WorldCoffeeLogo } from '@wc/shared'

const router = useRouter()
const { login } = useAuth()

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const loginError = ref('')

async function handleLogin() {
  loginError.value = ''
  try {
    const ok = await login({
      username: form.username,
      password: form.password,
      remember: form.remember
    })
    if (ok) {
      router.push('/')
    } else {
      loginError.value = '用户名或密码错误'
    }
  } catch (e) {
    console.error('登录失败', e)
    loginError.value = '网络错误，请稍后重试'
  }
}
</script>
