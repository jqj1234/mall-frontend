/* 封装axios用于发送请求 */
import axios from 'axios'
import store from '@/store'
import router from '@/router'
import { Message } from 'element-ui'

// 创建一个新的axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 50000
})

// 添加请求拦截器
request.interceptors.request.use(
  function (config) {
    const token = store.state.user.user.token
    if (token) {
      // console.log(token);

      config.headers['Authorization'] = token
    }
    return config
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 添加响应拦截器
request.interceptors.response.use(
  response => {
    if (response.status === 200 && response.data.code === 1) {
      // 成功
      return response.data.data
    } else {
      Message.error(response.data.msg)
    }
    return Promise.reject(response.data)
  },
  err => {
    // 对响应错误做点什么  普通错误 + 401情况
    if (err.response.status === 401) {
      // 安全跳转：避免重复导航
      if (router.currentRoute.path !== '/login') {
        router.push('/login')
        Message.error('登录过期，请重新登录')
      }
    }
    return Promise.reject(err)
  }
)

export default request
