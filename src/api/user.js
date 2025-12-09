import request from '@/utils/request'

export function getCode () {
  const res = request.get('/users/captcha')
  return res
}

export function login ({ username, password, code, sessionId }) {
  const res = request.post('/users/login', {
    username,
    password,
    code,
    sessionId
  })

  return res
}

export function register ({ username, password, code, sessionId }) {
  const res = request.post('/users/register', {
    username,
    password,
    code,
    sessionId
  })
  return res
}

export function getUserInfo () {
  const res = request.get('/users/info', {})
  return res
}

export function updateUser (user) {
  const res = request.put('/users', user)
  return res
}

export function findMyAddresses () {
  const res = request.get('/addresses')
  return res
}

export function addOrUpdateAddress (address) {
  const res = request.post('/addresses', address)
  return res
}

export function deleteAddress (id) {
  const res = request.delete(`/addresses/${id}`)
  return res
}
