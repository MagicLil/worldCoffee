/**
 * 三端共享的领域类型定义（唯一事实来源）
 * 与后端契约对齐：
 *  - 统一响应 { code, msg, data }，code === 200 为成功
 *  - LoginVO 仅 { token, userId, username }（后端 domain/vo/LoginVO.java）
 * 后端字段同时存在 snake_case / camelCase 两种历史形态，实体带索引签名宽松兼容，
 * 待后端字段统一后可逐步收紧。
 */

/** 后端统一响应包装（带索引签名：兼容 success/result 等历史多形态） */
export interface Result<T = any> {
  code: number
  msg: string
  data: T
  [key: string]: any
}

/** 登录/注册返回（POST /api/user/login|register） */
export interface LoginVO {
  token: string
  userId: number
  username: string
  /** 以下为历史多形态兼容字段 */
  id?: number
  nickname?: string
  avatar?: string
  access_token?: string
}

/** 登录入参 */
export interface LoginPayload {
  username: string
  password: string
  remember?: boolean
}

/** 注册入参（后端 RegisterForm：phone 可选） */
export interface RegisterPayload {
  username: string
  password: string
  phone?: string
  nickname?: string
}

/** 本地缓存的登录用户（useAuth 写入 localStorage wc_user） */
export interface AuthUser {
  id?: number
  userId?: number
  username?: string
  nickname?: string
  avatar?: string
  [key: string]: any
}

/** 帖子作者（后端返回形态不稳定，做多路兼容取值） */
export interface PostAuthor {
  id?: number
  username?: string
  nickname?: string
  avatar?: string
  [key: string]: any
}

/** 帖子（列表/详情通用，字段兼容 like_count/likeCount 等双形态） */
export interface Post {
  id?: number
  postId?: number
  title?: string
  content?: string
  images?: string[] | string
  coverImage?: string
  imageUrl?: string
  like_count?: number
  likeCount?: number
  commentCount?: number
  favoriteCount?: number
  topic?: string
  createTime?: string
  author?: PostAuthor
  user?: PostAuthor
  [key: string]: any
}

/** 分页包装（后端 MyBatis-Plus Page 形态） */
export interface PageResult<T = any> {
  records?: T[]
  total?: number
  size?: number
  current?: number
  pages?: number
  [key: string]: any
}

/** 商品（/api/shop/products） */
export interface Product {
  id?: number
  name?: string
  title?: string
  price?: number
  image?: string
  images?: string | string[]
  description?: string
  stock?: number
  categoryId?: number
  [key: string]: any
}
