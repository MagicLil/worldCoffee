<!-- ============================================================
     WorldCoffee 注册页
============================================================ -->
<template>
  <div class="min-h-screen bg-coffee-foam flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm">

      <!-- 顶部 Logo -->
      <div class="text-center mb-8">
        <WorldCoffeeLogo :size="96" variant="full" />
      </div>

      <div class="bg-white rounded-[28px] shadow-[0_8px_32px_rgba(62,39,35,0.08)] p-7">
        <h1 class="text-[22px] font-bold text-coffee-espresso text-center">创建账号</h1>
        <p class="mt-2 text-center text-[13px] text-coffee-mocha">加入 WorldCoffee，和咖啡爱好者一起分享</p>

        <form class="mt-7 space-y-3.5" @submit.prevent="handleRegister">
          <div>
            <label class="text-[12px] font-semibold text-coffee-dark mb-1.5 block">昵称</label>
            <input v-model="form.nickname" type="text" placeholder="你希望别人怎么称呼你"
              class="w-full h-11 px-4 rounded-xl bg-coffee-foam/60 border border-transparent focus:border-coffee-sand focus:bg-white text-[14px] text-coffee-espresso placeholder:text-coffee-mocha/50 outline-none transition-all" required />
          </div>

          <div>
            <label class="text-[12px] font-semibold text-coffee-dark mb-1.5 block">账号</label>
            <input v-model="form.username" type="text" placeholder="用户名或邮箱"
              class="w-full h-11 px-4 rounded-xl bg-coffee-foam/60 border border-transparent focus:border-coffee-sand focus:bg-white text-[14px] text-coffee-espresso placeholder:text-coffee-mocha/50 outline-none transition-all" required />
          </div>

          <div>
            <label class="text-[12px] font-semibold text-coffee-dark mb-1.5 block">密码</label>
            <input v-model="form.password" type="password" placeholder="至少 6 位"
              class="w-full h-11 px-4 rounded-xl bg-coffee-foam/60 border border-transparent focus:border-coffee-sand focus:bg-white text-[14px] text-coffee-espresso placeholder:text-coffee-mocha/50 outline-none transition-all" required />
          </div>

          <div>
            <label class="text-[12px] font-semibold text-coffee-dark mb-1.5 block">确认密码</label>
            <input v-model="form.confirm" type="password" placeholder="再次输入密码"
              class="w-full h-11 px-4 rounded-xl bg-coffee-foam/60 border border-transparent focus:border-coffee-sand focus:bg-white text-[14px] text-coffee-espresso placeholder:text-coffee-mocha/50 outline-none transition-all" required />
          </div>

          <label class="flex items-start gap-2 text-[12px] text-coffee-mocha pt-1 cursor-pointer">
            <input v-model="form.agree" type="checkbox" class="mt-0.5 w-4 h-4 rounded accent-coffee-bean shrink-0" required />
            <span>我已阅读并同意 <a href="javascript:;" class="text-coffee-bean font-medium hover:underline">《用户协议》</a> 和 <a href="javascript:;" class="text-coffee-bean font-medium hover:underline">《隐私政策》</a></span>
          </label>

          <button type="submit" class="w-full h-12 rounded-xl bg-coffee-bean text-white text-[15px] font-semibold hover:bg-coffee-dark active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(62,39,35,0.2)] tap-scale">
            注册
          </button>
        </form>

        <div class="mt-6 text-center text-[13px] text-coffee-mocha">
          已有账号？
          <router-link to="/login" class="ml-1 text-coffee-bean font-semibold hover:underline">去登录</router-link>
        </div>
      </div>

      <div class="mt-6 text-center">
        <router-link to="/" class="text-[12px] text-coffee-mocha hover:text-coffee-bean transition-colors">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@wc/shared'
import { WorldCoffeeLogo } from '@wc/shared'

const router = useRouter()
const { register } = useAuth()

const form = reactive({
  nickname: '',
  username: '',
  password: '',
  confirm: '',
  agree: false
})

async function handleRegister() {
  if (form.password !== form.confirm) {
    alert('两次密码不一致')
    return
  }
  try {
    const ok = await register({
      nickname: form.nickname,
      username: form.username,
      password: form.password
    })
    if (ok) router.push('/')
  } catch (e) {
    console.error('注册失败', e)
  }
}
</script>
