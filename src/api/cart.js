import request from '@/utils/request'

export function addItemToCart (cartFormDTO) {
  const res = request.post('/carts', cartFormDTO)
  return res
}

export function getMyCarts () {
  const res = request.get('/carts')
  return res
}

export function updateCart (payload) {
  const res = request.put('/carts', payload)
  return res
}

export function deleteCartItem (id) {
  const res = request.delete(`/carts/${id}`)
  return res
}
