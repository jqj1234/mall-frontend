import request from '@/utils/request'

export function getList ({
  pageNum,
  pageSize,
  key,
  category,
  brand,
  minPrice,
  maxPrice,
  isAsc,
  sortBy
}) {
  const res = request.get('/search/list', {
    params: {
      pageNum,
      pageSize,
      isAsc,
      sortBy,
      key,
      category,
      brand,
      minPrice,
      maxPrice
    }
  })
  return res
}

export function getItem (id) {
  const res = request.get(`/items/${id}`)
  return res
}

export function getFilters ({
  pageNum,
  pageSize,
  key,
  category,
  brand,
  minPrice,
  maxPrice,
  isAsc,
  sortBy
}) {
  const res = request.post('/search/filters', {
    pageNum,
    pageSize,
    isAsc,
    sortBy,
    key,
    category,
    brand,
    minPrice,
    maxPrice
  })
  return res
}

export function uploadImage (file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = request.post('/items/upload', formData)
  return res
}

export function imageSearch (url) {
  const res = request.post('/search/image', { url })
  return res
}

// 查询秒杀商品列表
export function getSeckillList ({ lastBeginTime, lastItemId, limit }) {
  const res = request.get('/seckill/cursor', {
    params: {
      lastBeginTime,
      lastItemId,
      limit
    }
  })
  return res
}
