import request from '@/utils/request'

export function applyPayOrder (applyDTO) {
  const res = request.post('/pay-orders', applyDTO)
  return res
}

export function tryPayOrderByBalance (id, form) {
  const res = request.post(`/pay-orders/${id}`, form)
  return res
}
