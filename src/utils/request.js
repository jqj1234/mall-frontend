import axios from 'axios'
import store from '@/store'
import router from '@/router'
import { Message } from 'element-ui'

const request = axios.create({
  baseURL: '/api',
  timeout: 50000
})

request.interceptors.request.use(
  function (config) {
    const token = store.state.user.user.token
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    // Stream and other raw responses can bypass the unified code parsing.
    if (response.config && response.config.rawResponse) {
      return response
    }

    if (response.status === 200 && response.data.code === 1) {
      return response.data.data
    }

    Message.error((response.data && response.data.msg) || 'Request failed')
    return Promise.reject(response.data)
  },
  err => {
    const status = err && err.response ? err.response.status : null
    if (status === 401) {
      if (router.currentRoute.path !== '/login') {
        router.push('/login')
        Message.error('Login expired, please sign in again')
      }
    }
    return Promise.reject(err)
  }
)

export default request
