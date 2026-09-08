import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const token = sessionStorage.getItem('admin_token')
  if (token) {
    // axios v1 中拦截器的 headers 恒为 AxiosHeaders 实例，断言安全
    ;(config.headers as any).Authorization = 'Bearer ' + token
  }
  return config
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    }
    const message = res.message || res.msg || '请求失败'
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      ElMessage.error('登录已过期，请重新登录')
      sessionStorage.removeItem('admin_token')
      router.push('/login')
    } else {
      ElMessage.error(error.response?.data?.message || error.response?.data?.msg || '网络错误')
    }
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器在运行时已把 Result 解包为业务 data，
 * 这里把导出类型对齐为 Promise<any>（与运行时行为一致），
 * 视图层可直接 `const data = await request.get(...)`
 */
type UnwrappedHttp = {
  get: (url: string, config?: any) => Promise<any>
  post: (url: string, data?: any, config?: any) => Promise<any>
  put: (url: string, data?: any, config?: any) => Promise<any>
  delete: (url: string, config?: any) => Promise<any>
}

export default request as unknown as UnwrappedHttp

