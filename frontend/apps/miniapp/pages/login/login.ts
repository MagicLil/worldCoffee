// login.ts —— 账号密码登录（与 web 端共用同一后端接口与 JWT）
import { login } from '../../utils/auth'

Page({
  data: {
    username: '',
    password: '',
    submitting: false
  },

  onUsernameInput(e: any) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value })
  },

  async handleSubmit() {
    const { username, password, submitting } = this.data
    if (submitting) return
    if (!username.trim() || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      const ok = await login(username.trim(), password)
      if (ok) {
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 600)
      } else {
        wx.showToast({ title: '用户名或密码错误', icon: 'none' })
      }
    } catch (e: any) {
      wx.showToast({ title: e.message || '登录失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
