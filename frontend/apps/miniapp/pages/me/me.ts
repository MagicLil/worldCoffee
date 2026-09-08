// me.ts —— 我的：登录态展示与退出
import { isLoggedIn, getStoredUser, logout, LoginVO } from '../../utils/auth'

Page({
  data: {
    loggedIn: false,
    user: null as LoginVO | null
  },

  onShow() {
    this.setData({
      loggedIn: isLoggedIn(),
      user: isLoggedIn() ? getStoredUser() : null
    })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  async handleLogout() {
    await logout()
    this.setData({ loggedIn: false, user: null })
    wx.showToast({ title: '已退出登录', icon: 'success' })
  }
})
