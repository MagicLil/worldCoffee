import axios from 'axios'
import { getToken, clearAuth } from '../composables/useAuth'
import type { Result, LoginVO, LoginPayload, RegisterPayload } from '../types'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

/**
 * 请求拦截：自动附带 JWT（直接读取 ref 值，避免创建 computed）
 */
http.interceptors.request.use(config => {
  const t = getToken()
  if (t) {
    // axios v1 中拦截器的 headers 恒为 AxiosHeaders 实例，断言安全
    ;(config.headers as any).Authorization = `Bearer ${t}`
  }
  return config
})

/**
 * 响应拦截：
 *  - 业务码 !== 200 → reject，错误信息走 msg 字段
 *  - HTTP 401 → 清本地 token 并强制跳登录
 *  - 其余网络异常 → reject
 */
http.interceptors.response.use(
  res => {
    const data = res.data
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code !== 200) {
        return Promise.reject(data)
      }
    }
    return res
  },
  err => {
    if (err && err.response && err.response.status === 401) {
      clearAuth()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── URL 归一化 ───────────────────────────────────────
/**
 * 统一 URL 处理：
 *  - 外部 CDN URL（https://） → 原样返回
 *  - 内部静态资源（/uploads/xxx） → 原样返回
 *  - 相对路径（uploads/xxx）→ 补 /
 *  - 危险协议（javascript:/data:）→ 拒绝返回空
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const result = url.trim()
  if (/^\s*(javascript|data|vbscript|about)\s*:/i.test(result)) return ''
  if (/^https?:\/\//i.test(result)) return result
  if (result.startsWith('/')) return result
  return '/' + result
}

/**
 * 对单个帖子对象的 images 和 avatars 进行 URL 归一化
 * images 可能是数组、JSON 字符串、逗号分隔字符串
 */
function normalizePostImageUrls(post) {
  if (!post) return post
  const next = { ...post }

  if (next.images) {
    if (typeof next.images === 'string') {
      const raw = next.images.trim()
      if (raw.startsWith('[') || raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            next.images = parsed.map(normalizeUrl)
          } else if (typeof parsed === 'string') {
            next.images = [normalizeUrl(parsed)]
          } else {
            next.images = []
          }
        } catch {
          next.images = [normalizeUrl(raw)]
        }
      } else if (raw.includes(',')) {
        next.images = raw.split(',').map(s => normalizeUrl(s.trim())).filter(Boolean)
      } else if (raw.includes('|')) {
        next.images = raw.split('|').map(s => normalizeUrl(s.trim())).filter(Boolean)
      } else if (raw) {
        next.images = [normalizeUrl(raw)]
      } else {
        next.images = []
      }
    } else if (Array.isArray(next.images)) {
      next.images = next.images.map(normalizeUrl).filter(Boolean)
    }
  }

  // 作者头像：从多种字段名里取值
  const authorAv = next.avatar || next.authorAvatar || (next.user?.avatar) || (next.author?.avatar)
  if (authorAv) next._avatar = normalizeUrl(authorAv)

  // 评论里的头像
  if (Array.isArray(next.comments)) {
    next.comments = next.comments.map(c => {
      const nc = { ...c }
      const cav = nc.avatar || nc.userAvatar || nc.fromUserAvatar || nc.senderAvatar || (nc.user?.avatar) || (nc.fromUser?.avatar)
      if (cav) nc._avatar = normalizeUrl(cav)
      return nc
    })
  }

  return next
}

/** 对帖子列表进行归一化 */
function normalizePostList(posts) {
  if (!Array.isArray(posts)) return posts
  return posts.map(normalizePostImageUrls)
}

/** 统一错误提取（供页面 .catch 用） */
export function extractApiError(err) {
  if (!err) return '网络异常，请稍后重试'
  if (typeof err === 'string') return err
  if (err.msg) return err.msg
  if (err.response && err.response.data && err.response.data.message) return err.response.data.message
  if (err.response && err.response.data && err.response.data.msg) return err.response.data.msg
  if (err.message) return err.message
  return '请求失败，请稍后重试'
}

/** 别名导出，所有视图统一使用 getApiError */
export { extractApiError as getApiError }

// ─── 统一响应解析（返回 { code, msg, data }）────────────
/**
 * ok(): 把 axios 的响应包装成统一的 Result 对象
 * 后端返回 { code, msg, data }，res.data 就是这个对象
 */
function ok<T = any>(res: any): Result<T> {
  if (!res || !res.data) return { code: -1, msg: '网络异常，请稍后重试', data: null }
  const raw = res.data
  if (raw && typeof raw === 'object' && 'code' in raw) {
    return {
      code: raw.code,
      msg: raw.msg || raw.message || '',
      data: raw.data == null ? null : raw.data
    }
  }
  return { code: 200, msg: '', data: raw }
}

/**
 * 用于返回帖子列表的 API（getPosts / getMyPosts 等）
 * 返回 { code, msg, data } 结构，data 为归一化后的数组或分页对象
 */
function withImageUrlList(res) {
  const result = ok(res)
  if (!result.data) return result

  if (Array.isArray(result.data)) {
    result.data = normalizePostList(result.data)
  } else if (typeof result.data === 'object') {
    if (Array.isArray(result.data.data)) {
      result.data.data = normalizePostList(result.data.data)
    }
    if (Array.isArray(result.data.records)) {
      result.data.records = normalizePostList(result.data.records)
    }
    if (Array.isArray(result.data.list)) {
      result.data.list = normalizePostList(result.data.list)
    }
  }
  return result
}

// ═════════════════════════════════════════════════════════
// 用户模块 /api/users
// ═════════════════════════════════════════════════════════
export const userApi = {
  //// 方法名: 入参 => HTTP方法('路径', 数据).then(统一包装)
  /** 登录：后端 LoginFrom = { username, password }，返回 LoginVO */
  login: (data: LoginPayload): Promise<Result<LoginVO>> => http.post('/user/login', data).then(ok),
  /** 注册：后端 RegisterForm = {username, password, phone}，成功直接返回 token */
  register: (data: RegisterPayload): Promise<Result<LoginVO>> => http.post('/user/register', data).then(ok),

  /** 当前登录用户信息（ReturnMeVO） */
  getMe: () => http.get('/user/me').then(res => {
    const result = ok(res)
    if (result && result.data) {
      result.data.avatar = normalizeUrl(result.data.avatar)
    }
    return result
  }),

  /** 修改资料（PUT）- body: { username, phone, avatar } */
  updateProfile: data => http.put('/user/profile', data).then(ok),

  /** 修改密码（PATCH）- body: { oldPassword, newPassword } */
  changePassword: data => http.put('/user/password', data).then(ok),

  /** 获取指定用户主页 + 最近帖子（UserProfileVO） */
  getUserProfile: id => http.get(`/user/${id}`).then(ok),

  /** 关注 / 取消关注（返回当前是否已关注） */
  toggleFollow: id => http.post(`/user/${id}/follow`).then(ok),

  /** 上传头像 - 返回归一化后的头像路径 */
  uploadAvatar: formData => http.post('/coffee/upload', formData, {
    timeout: 60000
  }).then(res => {
    const result = ok(res)
    if (result && typeof result.data === 'string') {
      result.data = normalizeUrl(result.data)
    }
    return result
  }),

  /** 我的统计（发帖/获赞/收藏/评论/关注/粉丝数） */
  getMeStats: () => http.get('/user/me/stats').then(ok),

  /** 登出（后端拉黑 token + 清 Redis 缓存，前端随后再清本地登录态） */
  logout: () => http.post('/user/logout').then(ok),

  /** 批量获取用户信息（ids: 逗号分隔的用户 ID 字符串） */
  batchGetUsers: ids => http.get('/user/batch', { params: { ids } }).then(ok),

  /** 发送短信验证码 */
  sendSmsCode: phone => http.post('/user/sms-code', null, { params: { phone } }).then(ok),

  /** 绑定/更换手机号（body: { Phone, code }） */
  bindPhone: data => http.put('/user/bind-phone', data).then(ok)
}

// ═════════════════════════════════════════════════════════
// 咖啡帖子模块 /api/coffee
// ═════════════════════════════════════════════════════════
export const coffeeApi = {
  getPosts: params => http.get('/coffee/posts', { params }).then(withImageUrlList),
  getPostDetail: id => http.get(`/coffee/posts/${id}`).then(res => {
    const result = ok(res)
    if (result && result.data) {
      result.data = normalizePostImageUrls(result.data)
    }
    return result
  }),
  createPost: data => http.post('/coffee/posts', data).then(ok),
  updatePost: (id, data) => http.put(`/coffee/posts/${id}`, data).then(ok),
  deletePost: id => http.delete(`/coffee/posts/${id}`).then(ok),
  toggleLike: id => http.post(`/coffee/posts/${id}/like`).then(ok),
  toggleFavorite: id => http.post(`/coffee/posts/${id}/favorite`).then(ok),
  addComment: (id, data) => http.post(`/coffee/posts/${id}/comment`, data).then(ok),
  deleteComment: id => http.delete(`/coffee/comments/${id}`).then(ok),
  toggleCommentLike: id => http.post(`/coffee/comments/${id}/like`).then(ok),
  reportPost: (id, data) => http.post(`/coffee/posts/${id}/report`, data).then(ok),
  getMyPosts: params => http.get('/coffee/posts/my', { params }).then(withImageUrlList),
  getMyFavorites: params => http.get('/coffee/favorites/my', { params }).then(withImageUrlList),
  getMyLikes: params => http.get('/coffee/likes/my', { params }).then(withImageUrlList),
  getHotPosts: params => http.get('/coffee/posts/hot', { params }).then(withImageUrlList),
  getRecommendedPosts: params => http.get('/coffee/posts/recommend', { params }).then(withImageUrlList),
  getFollowingPosts: params => http.get('/coffee/posts/following', { params }).then(withImageUrlList),
  getTopics: params => http.get('/coffee/topics', { params }).then(ok),
  getTopicPosts: params => http.get('/coffee/posts/topic', { params }).then(withImageUrlList),
  getMyDraft: () => http.get('/coffee/drafts/me').then(ok),
  saveMyDraft: data => http.put('/coffee/drafts/me', data).then(ok),
  deleteMyDraft: () => http.delete('/coffee/drafts/me').then(ok),
  getCreatorStats: () => http.get('/coffee/creator/stats').then(ok),
  getCollections: () => http.get('/coffee/collections').then(ok),
  createCollection: data => http.post('/coffee/collections', data).then(ok),
  updateCollection: (id, data) => http.put(`/coffee/collections/${id}`, data).then(ok),
  deleteCollection: id => http.delete(`/coffee/collections/${id}`).then(ok),
  addPostToCollection: (collectionId, postId) => http.post(`/coffee/collections/${collectionId}/posts/${postId}`).then(ok),
  removePostFromCollection: (collectionId, postId) => http.delete(`/coffee/collections/${collectionId}/posts/${postId}`).then(ok),
  getCollectionPosts: (collectionId, params) => http.get(`/coffee/collections/${collectionId}/posts`, { params }).then(withImageUrlList),
  markNotInterested: (id, data = {}) => http.post(`/coffee/posts/${id}/not-interested`, data).then(ok),
  recordFeedEvent: data => http.post('/coffee/feed-events', data).then(ok),
  unifiedSearch: params => http.get('/coffee/search/unified', { params }).then(ok),
  search: params => http.get('/coffee/search', { params }).then(withImageUrlList),
  upload: formData => http.post('/coffee/upload', formData, {
    timeout: 60000
  }).then(res => {
    const result = ok(res)
    if (result && typeof result.data === 'string') {
      result.data = normalizeUrl(result.data)
    }
    return result
  })
}

// ═════════════════════════════════════════════════════════
// 商城模块 /api/shop
// ═════════════════════════════════════════════════════════
export const shopApi = {
  /** 商品列表（兼容直接数组 / 分页包装） */
  getProducts: (params = { page: 1, size: 10 }) =>
    http.get('/shop/products', { params }).then(res => {
      const result = ok(res)
      if (!result || !result.data) return result

      const normalizeItem = p => ({
        ...p,
        images: parseProductImages(p.images),
        coverImage: normalizeUrl(p.coverImage || p.cover || p.image || '')
      })

      if (Array.isArray(result.data)) {
        result.data = result.data.map(normalizeItem)
      } else if (typeof result.data === 'object') {
        if (Array.isArray(result.data.data)) {
          result.data.data = result.data.data.map(normalizeItem)
        }
        if (Array.isArray(result.data.records)) {
          result.data.records = result.data.records.map(normalizeItem)
        }
        if (Array.isArray(result.data.list)) {
          result.data.list = result.data.list.map(normalizeItem)
        }
      }
      return result
    }),

  /** 商品详情 */
  getProductDetail: id => http.get(`/shop/products/${id}`).then(res => {
    const result = ok(res)
    if (result && result.data) {
      result.data.images = parseProductImages(result.data.images)
    }
    return result
  }),

  /** 加入购物车 */
  addToCart: (productId, quantity = 1) =>
    http.post('/shop/cart', { productId, quantity }).then(ok),

  /** 购物车列表（兼容直接数组 / 分页包装） */
  getCart: () => http.get('/shop/cart').then(res => {
    const result = ok(res)
    if (!result || !result.data) return result

    const normalizeItem = item => ({
      ...item,
      image: normalizeUrl(item.image || item.coverImage || item.productImage || item.product?.image || '')
    })

    if (Array.isArray(result.data)) {
      result.data = result.data.map(normalizeItem)
    } else if (typeof result.data === 'object') {
      if (Array.isArray(result.data.data)) {
        result.data.data = result.data.data.map(normalizeItem)
      }
      if (Array.isArray(result.data.records)) {
        result.data.records = result.data.records.map(normalizeItem)
      }
      if (Array.isArray(result.data.list)) {
        result.data.list = result.data.list.map(normalizeItem)
      }
    }
    return result
  }),

  /** 修改购物车数量 */
  updateCart: (id, quantity) =>
    http.put(`/shop/cart/${id}`, null, { params: { quantity } }).then(ok),

  /** 删除购物车项 */
  removeFromCart: id =>
    http.delete(`/shop/cart/${id}`).then(ok),

  /** 提交订单（couponId 可选，使用优惠券时传入） */
  createOrder: (address, remark = '', couponId = null) =>
    http.post('/shop/orders', { address, remark, couponId }).then(ok),

  /** 我的订单列表（兼容直接数组 / 分页包装，订单内商品图片归一化） */
  getOrders: (params = { page: 1, size: 10 }) =>
    http.get('/shop/orders', { params }).then(res => {
      const result = ok(res)
      if (!result || !result.data) return result

      const normalizeOrderItem = item => {
        const next = { ...item }
        if (next.image) next.image = normalizeUrl(next.image)
        if (next.coverImage) next.coverImage = normalizeUrl(next.coverImage)
        if (next.productImage) next.productImage = normalizeUrl(next.productImage)
        return next
      }

      const normalizeOrder = order => {
        const next = { ...order }
        // 兼容 order.items / order.orderItems / order.products 三种可能
        if (Array.isArray(next.items)) next.items = next.items.map(normalizeOrderItem)
        if (Array.isArray(next.orderItems)) next.orderItems = next.orderItems.map(normalizeOrderItem)
        if (Array.isArray(next.products)) next.products = next.products.map(normalizeOrderItem)
        // 订单本身可能也有一个封面图片
        if (next.coverImage) next.coverImage = normalizeUrl(next.coverImage)
        return next
      }

      if (Array.isArray(result.data)) {
        result.data = result.data.map(normalizeOrder)
      } else if (typeof result.data === 'object') {
        if (Array.isArray(result.data.data)) result.data.data = result.data.data.map(normalizeOrder)
        if (Array.isArray(result.data.records)) result.data.records = result.data.records.map(normalizeOrder)
        if (Array.isArray(result.data.list)) result.data.list = result.data.list.map(normalizeOrder)
      }
      return result
    }),

  /** 订单详情 */
  getOrderDetail: id => http.get(`/shop/orders/${id}`).then(ok),

  /** 取消订单（仅待支付状态） */
  cancelOrder: id => http.patch(`/shop/orders/${id}/cancel`).then(ok),

  /** 模拟支付（POST /shop/orders/{id}/pay） */
  payOrder: id => http.post(`/shop/orders/${id}/pay`).then(ok),

  /** 支付回调（模拟支付完成后通知后端更新订单状态） */
  payCallback: data => http.post('/shop/pay/callback', data).then(ok),

  /** 推进订单状态（0→1支付, 1→2发货, 2→3完成） */
  updateOrderStatus: (id, status) =>
    http.patch(`/shop/orders/${id}/status`, null, { params: { status } }).then(ok),

  // ─── 收货地址 ───────────────────────────────

  /** 地址列表 */
  getAddresses: () => http.get('/shop/addresses').then(ok),

  /** 单个地址详情 */
  getAddress: id => http.get(`/shop/addresses/${id}`).then(ok),

  /** 新建地址 */
  createAddress: data => http.post('/shop/addresses', data).then(ok),

  /** 修改地址 */
  updateAddress: (id, data) => http.put(`/shop/addresses/${id}`, data).then(ok),

  /** 删除地址 */
  deleteAddress: id => http.delete(`/shop/addresses/${id}`).then(ok),

  /** 分类列表（动态加载） */
  listCategories: () => http.get('/shop/categories').then(ok),

  /** ES 搜索商品（按关键词匹配名称和描述） */
  searchProducts: (keyword, params = {}) => http.get('/shop/products/search', { params: { keyword, ...params } }).then(res => {
    const result = ok(res)
    if (!result || !result.data) return result

    const normalizeItem = p => ({
      ...p,
      images: parseProductImages(p.images),
      coverImage: normalizeUrl(p.coverImage || p.cover || p.image || '')
    })

    if (Array.isArray(result.data)) {
      result.data = result.data.map(normalizeItem)
    }
    return result
  })
}

// ═════════════════════════════════════════════════════════
// 优惠券模块 /api/shop/coupons
// ═════════════════════════════════════════════════════════
export const couponApi = {
  /** 可领取的优惠券列表 */
  getAvailable: () => http.get('/shop/coupons').then(ok),

  /** 领取优惠券 */
  claim: id => http.post(`/shop/coupons/${id}/claim`).then(ok),

  /** 我的优惠券（未使用） */
  getMy: () => http.get('/shop/coupons/my').then(ok)
}

// ═════════════════════════════════════════════════════════
// 秒杀模块 /api/shop/seckill
// ═════════════════════════════════════════════════════════
export const seckillApi = {
  /** 秒杀活动列表（含原价、秒杀价、活动时间） */
  getActivities: () => http.get('/shop/seckill/activities').then(res => {
    const result = ok(res)
    if (!result || !result.data) return result

    const normalizeItem = p => ({
      ...p,
      images: parseProductImages(p.images),
      coverImage: normalizeUrl(p.coverImage || p.cover || p.image || '')
    })

    if (Array.isArray(result.data)) {
      result.data = result.data.map(normalizeItem)
    }
    return result
  }),

  /** 获取秒杀验证码 */
  getCaptcha: () => http.get('/shop/seckill/captcha').then(ok),

  /** 用验证码换取秒杀 token */
  getToken: captcha => http.post('/shop/seckill/token', null, { params: { captcha } }).then(ok),

  /** 秒杀下单（领券+下单一步完成）body: { couponId, productId, address, seckillToken } */
  buy: data => http.post('/shop/seckill/buy', data).then(ok)
}

/** 解析商品图片（后端存 JSON 字符串或单字符串） */
function parseProductImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images.map(normalizeUrl)
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed.map(normalizeUrl)
      if (typeof parsed === 'string') return [normalizeUrl(parsed)]
    } catch (e) {
      // 不是 JSON，可能是逗号分隔或单张图
      if (images.includes(',')) return images.split(',').map(s => normalizeUrl(s.trim()))
      if (images.includes('|')) return images.split('|').map(s => normalizeUrl(s.trim()))
      return [normalizeUrl(images)]
    }
  }
  return []
}

// ═════════════════════════════════════════════════════════
// 通知模块 /api/notifications
// ═════════════════════════════════════════════════════════
export const notificationApi = {
  /** 通知列表：filter=unread|all，默认 all — 兼容分页包装，对 avatar 归一化 */
  getList: (params = {}) => http.get('/notifications', { params }).then(res => {
    const result = ok(res)
    if (!result || !result.data) return result

    const normalizeItem = item => {
      const next = { ...item }
      if (next.senderAvatar) next.senderAvatar = normalizeUrl(next.senderAvatar)
      if (next.avatar) next.avatar = normalizeUrl(next.avatar)
      if (next.fromUserAvatar) next.fromUserAvatar = normalizeUrl(next.fromUserAvatar)
      if (next.sender && next.sender.avatar) next.sender = { ...next.sender, avatar: normalizeUrl(next.sender.avatar) }
      if (next.fromUser && next.fromUser.avatar) next.fromUser = { ...next.fromUser, avatar: normalizeUrl(next.fromUser.avatar) }
      if (next.user && next.user.avatar) next.user = { ...next.user, avatar: normalizeUrl(next.user.avatar) }
      return next
    }

    if (Array.isArray(result.data)) {
      result.data = result.data.map(normalizeItem)
    } else if (typeof result.data === 'object') {
      if (Array.isArray(result.data.data)) result.data.data = result.data.data.map(normalizeItem)
      if (Array.isArray(result.data.records)) result.data.records = result.data.records.map(normalizeItem)
      if (Array.isArray(result.data.list)) result.data.list = result.data.list.map(normalizeItem)
    }
    return result
  }),

  /** 未读数量（badge） */
  getUnreadCount: () => http.get('/notifications/unread-count').then(ok),

  /** 标记单条已读 */
  markRead: id => http.put(`/notifications/${id}/read`).then(ok),

  /** 一键全部已读 */
  markAllAsRead: () => http.put('/notifications/read-all').then(ok),

  /** 删除单条通知 */
  deleteNotification: id => http.delete(`/notifications/${id}`).then(ok)
}

// ═════════════════════════════════════════════════════════
// 私信模块 /api/messages
// ═════════════════════════════════════════════════════════
export const messageApi = {
  /** 发送私信：body = { toId, content, messageType?:1 } */
  sendMessage: (body) => http.post('/messages', body).then(res => {
    const result = ok(res)
    if (result && result.data) {
      const m = { ...result.data }
      if (m.fromAvatar) m.fromAvatar = normalizeUrl(m.fromAvatar)
      if (m.fromUser && m.fromUser.avatar) m.fromUser = { ...m.fromUser, avatar: normalizeUrl(m.fromUser.avatar) }
      result.data = m
    }
    return result
  }),

  /** 获取当前用户的所有会话列表（含每条会话的最新消息和未读数） */
  getSessions: () => http.get('/messages/sessions').then(res => {
    const result = ok(res)
    if (!result || !result.data) return result

    const normalizeSession = s => {
      const next = { ...s }
      // 归一化对方用户头像
      if (next.avatar) next.avatar = normalizeUrl(next.avatar)
      if (next.userAvatar) next.userAvatar = normalizeUrl(next.userAvatar)
      if (next.lastMessageAvatar) next.lastMessageAvatar = normalizeUrl(next.lastMessageAvatar)
      if (next.user && next.user.avatar) next.user = { ...next.user, avatar: normalizeUrl(next.user.avatar) }
      if (next.otherUser && next.otherUser.avatar) next.otherUser = { ...next.otherUser, avatar: normalizeUrl(next.otherUser.avatar) }
      return next
    }

    if (Array.isArray(result.data)) {
      result.data = result.data.map(normalizeSession)
    } else if (typeof result.data === 'object') {
      if (Array.isArray(result.data.data)) result.data.data = result.data.data.map(normalizeSession)
      if (Array.isArray(result.data.records)) result.data.records = result.data.records.map(normalizeSession)
      if (Array.isArray(result.data.list)) result.data.list = result.data.list.map(normalizeSession)
    }
    return result
  }),

  /** 获取与指定用户的聊天历史：page=1 最新，按时间倒序返回 */
  getChatHistory: (userId, params = {}) => http.get(`/messages/chat/${userId}`, { params }).then(res => {
    const result = ok(res)
    if (!result || !result.data) return result

    const normalizeMessage = m => {
      const next = { ...m }
      if (next.fromAvatar) next.fromAvatar = normalizeUrl(next.fromAvatar)
      if (next.fromUser && next.fromUser.avatar) next.fromUser = { ...next.fromUser, avatar: normalizeUrl(next.fromUser.avatar) }
      return next
    }

    if (Array.isArray(result.data)) {
      result.data = result.data.map(normalizeMessage)
    } else if (typeof result.data === 'object') {
      if (Array.isArray(result.data.data)) result.data.data = result.data.data.map(normalizeMessage)
      if (Array.isArray(result.data.records)) result.data.records = result.data.records.map(normalizeMessage)
      if (Array.isArray(result.data.list)) result.data.list = result.data.list.map(normalizeMessage)
    }
    return result
  }),

  /** 把与指定用户的对话标记为已读 */
  markAsRead: (userId) => http.put(`/messages/chat/${userId}/read`).then(ok),

  /** 当前用户未读消息总数（用于底部导航角标） */
  getUnreadCount: () => http.get('/messages/unread-count').then(ok)
}

/**
 * SSE 订阅：浏览器原生 EventSource 无法设置自定义 header，
 * 使用 fetch + ReadableStream 手动解析 SSE 协议，
 * 这样就能在请求头中附带标准的 Authorization: Bearer token。
 *
 * 返回的对象提供简化接口：
 *   - onmessage(fn)   // 消息回调，传入 (dataString)
 *   - onopen(fn)      // 连接建立回调
 *   - onerror(fn)     // 错误回调
 *   - close()         // 主动关闭
 */
export function createSSESubscriber() {
  const token = getToken()
  if (!token) return null

  const state = {
    controller: new AbortController(),
    closed: false,
    onMessageCb: null,
    onOpenCb: null,
    onErrorCb: null,
    reader: null
  }

  // 异步启动 fetch + 流解析
  ;(async () => {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store',
        signal: state.controller.signal
      })

      if (!response.ok || !response.body) {
        if (state.onErrorCb) state.onErrorCb(new Error(`HTTP ${response.status}`))
        return
      }

      if (state.onOpenCb) state.onOpenCb()

      const reader = response.body.getReader()
      state.reader = reader
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (!state.closed) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE 消息以空行分隔
        let idx
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const dataLines = []
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim())
            }
          }
          if (dataLines.length > 0 && state.onMessageCb) {
            state.onMessageCb(dataLines.join('\n'))
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError' && state.onErrorCb) {
        state.onErrorCb(err)
      }
    }
  })()

  return {
    onmessage(fn) { state.onMessageCb = fn },
    onopen(fn) { state.onOpenCb = fn },
    onerror(fn) { state.onErrorCb = fn },
    close() {
      state.closed = true
      state.controller.abort()
      if (state.reader) {
        try { state.reader.cancel() } catch (e) { /* ignore */ }
      }
    }
  }
}

// ─── AI 对话 ───────────────────────────────────────
/**
 * 发送消息给 AI，流式接收返回（打字机效果）
 * POST /api/ai/chat
 *   body: 纯文本消息
 *   ?chatId=xxx （对话记忆，默认 "default"，最多保留 20 条）
 *   返回: text/html 文本流，一个字一个字返回
 *
 * 使用：
 *   aiApi.chat('你好', { chatId: 'my-chat',
 *     onMessage: text => console.log('收到片段:', text),
 *     onEnd: () => console.log('完成'),
 *     onError: err => console.error(err)
 *   })
 */
/** AI 流式对话回调选项 */
interface ChatStreamOptions {
  chatId?: string
  onMessage?: (text: string) => void
  onEnd?: () => void
  onError?: (err: unknown) => void
}

export const aiApi = {
  chat(message: string, opts: ChatStreamOptions = {}) {
    const chatId = opts.chatId || 'default'
    const token = getToken()
    const controller = new AbortController()

    // 启动流式请求
    ;(async () => {
      try {
        const response = await fetch(`/api/ai/chat?chatId=${encodeURIComponent(chatId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
            'Accept': 'text/html;charset=utf-8',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: message,
          cache: 'no-store',
          signal: controller.signal
        })

        if (!response.ok) {
          let msg = `HTTP ${response.status}`
          if (response.status === 401) msg = '请先登录后再使用 magic 顾问'
          else if (response.status === 403) msg = '请求被拒绝，请刷新页面后重试'
          else if (response.status === 500) msg = '服务繁忙，请稍后再试'
          if (opts.onError) opts.onError(new Error(msg))
          return
        }

        if (!response.body) {
          if (opts.onError) opts.onError(new Error('响应无流'))
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let done = false

        while (!done) {
          const chunk = await reader.read()
          done = chunk.done
          if (chunk.value) {
            const text = decoder.decode(chunk.value, { stream: !done })
            if (text && opts.onMessage) opts.onMessage(text)
          }
        }

        if (opts.onEnd) opts.onEnd()
      } catch (err) {
        if (err.name !== 'AbortError' && opts.onError) {
          opts.onError(err)
        }
      }
    })()

    return {
      cancel() { controller.abort() }
    }
  },

  /**
   * 获取当前用户的会话列表
   * GET /api/ai/conversations
   * 后端返回 Result<List<AiConversation>> = { code, msg, data: [{id, chatId, title, createdAt, updatedAt}] }
   */
  async listConversations() {
    try {
      const token = getToken()
      const res = await fetch('/api/ai/conversations', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (!res.ok) {
        console.error('[aiApi.listConversations] HTTP', res.status)
        return []
      }
      const data = await res.json()
      if (!data) return []
      const codeOk = (typeof data.code === 'number') && (data.code === 200 || data.code === 0)
      const successOk = data.success === true || data.success === 'true'
      if (!(codeOk || successOk)) return []
      const list = Array.isArray(data.data) ? data.data : []
      // 确保每一项都有 chatId（后端可能用 id 或 chatId）
      return list.map(item => {
        if (!item) return item
        const chatId = item.chatId || item.chat_id || item.id
        return { ...item, chatId }
      })
    } catch (e) {
      console.error('[aiApi.listConversations]', e)
      return []
    }
  },

  /**
   * 删除指定会话
   * DELETE /api/ai/conversations/{chatId}
   * 后端返回 Result<Void> = { code, msg, data }
   * code === 200 / 0 视为成功
   */
  async deleteConversation(chatId) {
    try {
      if (!chatId) return false
      const token = getToken()
      if (!token) { console.warn('[aiApi] 未登录，无 token'); return false }
      const res = await fetch(`/api/ai/conversations/${encodeURIComponent(chatId)}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      console.log('[aiApi.deleteConversation] 响应:', data)
      if (!res.ok || !data) {
        console.error('[aiApi.deleteConversation] 失败:', res.status, data)
        return false
      }
      return data.code === 200 || data.code === 0
    } catch (e) {
      console.error('[aiApi.deleteConversation]', e)
      return false
    }
  },

  /**
   * 获取指定会话的历史消息
   * GET /api/ai/conversations/{chatId}/messages
   * 后端返回 Result<List<Map>> = { code, msg, data: [{role, content, time}] }
   * 兼容 role / type 字段（后端自己查的那张表字段名叫 type，DTO 里可能叫 role）
   */
  async getConversationMessages(chatId) {
    try {
      if (!chatId) return []
      const token = getToken()
      const res = await fetch(`/api/ai/conversations/${encodeURIComponent(chatId)}/messages`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      if (!res.ok) {
        console.error('[aiApi.getConversationMessages] HTTP', res.status)
        return []
      }
      const data = await res.json()
      if (!data) return []
      const codeOk = (typeof data.code === 'number') && (data.code === 200 || data.code === 0)
      const successOk = data.success === true || data.success === 'true'
      if (!(codeOk || successOk)) return []
      const list = Array.isArray(data.data) ? data.data : []
      return list
        .filter(m => {
          const raw = (m.role || m.type || '').toString().toUpperCase()
          return raw === 'USER' || raw === 'ASSISTANT'
        })
        .map(m => ({
          role: (m.role || m.type || '').toString().toUpperCase() === 'USER' ? 'user' : 'assistant',
          content: m.content || '',
          time: m.time || m.timestamp || null
        }))
    } catch (e) {
      console.error('[aiApi.getConversationMessages]', e)
      return []
    }
  },

  /**
   * 上传知识库文档
   * POST /api/ai/knowledge/upload?title=xx
   *   body: 纯文本内容
   *   返回: { code, msg, data }
   */
  async uploadKnowledge(title, text) {
    try {
      const token = getToken()
      const res = await fetch(`/api/ai/knowledge/upload?title=${encodeURIComponent(title || '')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: text
      })
      const data = await res.json()
      if (!res.ok || !data) return { code: -1, msg: `HTTP ${res.status}`, data: null }
      return {
        code: data.code ?? (res.ok ? 200 : -1),
        msg: data.msg || '',
        data: data.data ?? null
      }
    } catch (e) {
      console.error('[aiApi.uploadKnowledge]', e)
      return { code: -1, msg: '上传失败', data: null }
    }
  }
}
