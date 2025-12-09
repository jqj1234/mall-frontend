import request from '@/utils/request'

// export function createOrder ({ itemId, userId, addressId, count, paymentType }) {
//   const res = request.post('/orders', {
//     itemId,
//     userId,
//     addressId,
//     count,
//     paymentType
//   })
//   return res
// }

export function createOrderForm (orderFormDTO) {
  const res = request.post('/orders', orderFormDTO)
  return res
}

export function getOrder (pageNum, pageSize) {
  const res = request.get('/orders', {
    params: {
      pageNum,
      pageSize
    }
  })
  return res
}

// 获取订单详情
export function getOrderDetails (orderId) {
  const res = request.get(`/orders/details/${orderId}`)
  return res
}

// 根据订单id获取订单信息
export function getOrderById (orderId) {
  const res = request.get(`/orders/${orderId}`)
  return res
}
