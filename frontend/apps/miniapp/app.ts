// app.ts —— 小程序入口
import { isLoggedIn } from './utils/auth'

App({
  onLaunch() {
    // 启动时仅检查登录态；未登录也可浏览首页推荐流（免鉴权接口）
    console.log('[wc-miniapp] launched, logged in:', isLoggedIn())
  }
})
