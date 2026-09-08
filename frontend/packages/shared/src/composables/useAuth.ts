// ============================================================
// useAuth —— 登录 / 注册 / token 管理
// ============================================================
import { ref, computed } from 'vue'
import { userApi } from '../api'
import type { AuthUser, LoginPayload, RegisterPayload } from '../types'

const TOKEN_KEY = 'wc_token'
const USER_KEY = 'wc_user'

// 全局共享的状态
const token = ref(readToken())
const user = ref<AuthUser | null>(readUser())

const isLoggedIn = computed(() => !!token.value)

function readToken() {
  if (typeof window === 'undefined') return ''
  try { return window.localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

function readUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveToken(t) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(TOKEN_KEY, t || '') } catch {}
}

function saveUser(u) {
  if (typeof window === 'undefined') return
  try {
    if (u) window.localStorage.setItem(USER_KEY, JSON.stringify(u))
    else window.localStorage.removeItem(USER_KEY)
  } catch {}
}

export function useAuth() {
  return {
    token,
    user,
    isLoggedIn,
    username: computed(() => user.value?.username || user.value?.nickname || ''),
    nickname: computed(() => user.value?.nickname || user.value?.username || ''),
    avatar: computed(() => user.value?.avatar || ''),
    currentUserId: computed(() => user.value?.id ?? user.value?.userId ?? null),

    async login(data: LoginPayload) {
      try {
        const res = await userApi.login(data)
        if (res && (res.code === 200 || res.code === 0 || res.success)) {
          // 后端 LoginVO: { token, userId, username ... }
          const payload = res.data || res.result || res
          const t = payload.token || payload.access_token
          if (!t) return false // 没有 token 视为登录失败，不用假值冒充登录态
          const uid = payload.userId || payload.id

          token.value = t
          user.value = {
            id: uid,
            username: payload.username || data.username,
            nickname: payload.nickname || data.username,
            avatar: payload.avatar || ''
          }
          saveToken(token.value)
          saveUser(user.value)
          return true
        }
        return false
      } catch (e) {
        console.error('login error', e)
        return false
      }
    },

    async register(data: RegisterPayload) {
      try {
        const res = await userApi.register({
          username: data.username,
          password: data.password,
          phone: data.phone || ''
        })
        if (res && (res.code === 200 || res.code === 0 || res.success)) {
          // 注册成功直接登录（后端注册接口会返回 token）
          const t = res.data?.token
          if (!t) return false // 没有 token 视为失败，不用假值冒充登录态
          token.value = t
          user.value = {
            id: res.data?.userId || res.data?.id,
            username: data.username,
            nickname: data.nickname || data.username,
            avatar: ''
          }
          saveToken(token.value)
          saveUser(user.value)
          return true
        }
        return false
      } catch (e) {
        console.error('register error', e)
        return false
      }
    },

    logout() {
      token.value = ''
      user.value = null
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(TOKEN_KEY)
          window.localStorage.removeItem(USER_KEY)
        } catch {}
      }
    },

    /** 更新本地用户信息（fields 为要更新的字段，如 { avatar, username }），可选同步后端
     * @param {Object} fields - 字段对象
     * @param {Object} opts - { sync: true } 则同时调用 userApi.updateProfile 同步后端 */
    updateUser(fields, opts?) {
      const options = opts || {}
      user.value = { ...(user.value || {}), ...fields }
      saveUser(user.value)
      // 如果调用者希望同步后端
      if (options.sync) {
        return userApi.updateProfile(fields).catch(err => {
          console.error('updateUser sync failed', err)
          return { code: 500, msg: 'update failed' }
        })
      }
      return Promise.resolve({ code: 200, data: user.value })
    }
  }
}

export function getToken() {
  return token.value || readToken()
}

export function clearAuth() {
  token.value = ''
  user.value = null
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_KEY)
    } catch {}
  }
}

export default useAuth
