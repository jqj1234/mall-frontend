import request from '@/utils/request'

// 根据秒杀商品id查询秒杀商品详情
export function getSeckillItemById (id) {
  const res = request.get(`/seckill/${id}`)
  return res
}

// 创建秒杀订单
export function createSeckillOrder ({
  seckillItemId,
  addressId,
  paymentType,
  itemId
}) {
  const res = request.post('/orders/seckill', {
    seckillItemId,
    addressId,
    paymentType,
    itemId
  })
  return res
}
