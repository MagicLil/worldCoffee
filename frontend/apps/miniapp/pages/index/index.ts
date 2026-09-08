// index.ts —— 首页：推荐帖子流
// GET /api/coffee/posts/recommend 在网关白名单（可选鉴权），未登录也可浏览
import { request, imageUrl, extractList, Result } from '../../utils/request'
import { isLoggedIn } from '../../utils/auth'

interface FeedItem {
  id: number
  title: string
  content: string
  cover: string
  images: string[]
  authorName: string
  authorAvatar: string
  likeCount: number
  createTime: string
}

Page({
  data: {
    posts: [] as FeedItem[],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    loggedIn: false
  },

  onLoad() {
    this.setData({ loggedIn: isLoggedIn() })
    this.loadPosts(true)
  },

  onShow() {
    // 从登录页返回后刷新登录态
    const loggedIn = isLoggedIn()
    if (loggedIn !== this.data.loggedIn) this.setData({ loggedIn })
  },

  onPullDownRefresh() {
    this.loadPosts(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadPosts(false)
  },

  async loadPosts(reset: boolean): Promise<void> {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page + 1
    this.setData({ loading: true })
    try {
      const res = await request({
        url: '/api/coffee/posts/recommend',
        method: 'GET',
        data: { page, size: this.data.pageSize }
      })
      const rawList = extractList(res as Result<any>)
      const items: FeedItem[] = rawList.map((p: any) => ({
        id: Number(p.id || p.postId || 0),
        title: p.title || (p.content || '').slice(0, 40) || '一杯咖啡的瞬间',
        content: p.content || '',
        cover: imageUrl(
          (Array.isArray(p.images) && p.images.length ? p.images[0] : '') ||
          p.coverImage || p.imageUrl || ''
        ),
        images: (Array.isArray(p.images) ? p.images : [])
          .slice(0, 3)
          .map((i: any) => imageUrl(String(i))),
        authorName:
          p.author?.nickname || p.author?.username ||
          p.user?.nickname || p.user?.username ||
          p.nickname || p.username || '咖啡爱好者',
        authorAvatar: imageUrl(
          p.author?.avatar || p.user?.avatar || p.avatar || ''
        ),
        likeCount: Number(p.like_count ?? p.likeCount ?? p.likes ?? 0) || 0,
        createTime: p.createTime || ''
      }))
      this.setData({
        posts: reset ? items : this.data.posts.concat(items),
        page,
        hasMore: items.length >= this.data.pageSize
      })
    } catch (e: any) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      if (reset) this.setData({ posts: [], hasMore: false })
    } finally {
      this.setData({ loading: false })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
