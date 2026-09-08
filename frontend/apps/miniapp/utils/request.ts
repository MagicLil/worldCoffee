/**
 * request.ts —— wx.request Promise 封装
 * 对齐 web 端 @wc/shared/api 的契约：
 *  - 统一响应 { code, msg, data }，code === 200 为成功
 *  - 请求头自动附带 Authorization: Bearer <token>
 *  - HTTP 401 → 清 token 跳登录页
 * 后端地址统一走网关 wc-gateway :8080。
 */

/** 开发环境网关地址；生产环境替换为已备案的 HTTPS 域名 */
export const BASE_URL = 'http://localhost:8080'

/** 后端统一响应包装 */
export interface Result<T = any> {
  code: number
  msg: string
  data: T
}

const TOKEN_KEY = 'wc_token'

function getToken(): string {
  try {
    return (wx.getStorageSync(TOKEN_KEY) as string) || ''
  } catch {
    return ''
  }
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
}

export function request<T = any>(opts: RequestOptions): Promise<Result<T>> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    wx.request({
      url: BASE_URL + opts.url,
      method: opts.method || 'GET',
      data: opts.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (res: any) => {
        const body = res.data
        if (res.statusCode === 401) {
          try { wx.removeStorageSync(TOKEN_KEY) } catch { /* ignore */ }
          wx.showToast({ title: '请先登录', icon: 'none' })
          wx.navigateTo({ url: '/pages/login/login' })
          reject(new Error('未登录'))
          return
        }
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code !== 200) {
            reject(new Error(body.msg || body.message || '请求失败'))
            return
          }
          resolve(body as Result<T>)
        } else {
          // 非 Result 包装的直接返回
          resolve({ code: 200, msg: '', data: body } as Result<T>)
        }
      },
      fail: (err: any) => {
        reject(new Error(err.errMsg || '网络异常，请稍后重试'))
      }
    })
  })
}

/**
 * 图片相对路径 → 完整 URL
 * 后端返回 /uploads/xxx（网关 302 到 MinIO），小程序需拼完整域名
 */
export function imageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return ''
  const u = url.trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return BASE_URL + (u.startsWith('/') ? u : '/' + u)
}

/** 帖子列表兼容提取：data 可能是数组或 { records | list | data } 分页形态 */
export function extractList(result: Result<any>): any[] {
  const d = result?.data
  if (!d) return []
  if (Array.isArray(d)) return d
  if (Array.isArray(d.records)) return d.records
  if (Array.isArray(d.list)) return d.list
  if (Array.isArray(d.data)) return d.data
  return []
}
