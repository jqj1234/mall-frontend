import request from '@/utils/request'

export function getItemPage ({
  pageNo,
  pageSize,
  sortBy = 'update_time',
  isAsc = false
}) {
  const res = request.get('/items/page', {
    params: {
      pageNo,
      pageSize,
      sortBy,
      isAsc
    }
  })
  return res
}

export function getItemById (id) {
  const res = request.get(`/items/${id}`)
  return res
}

export function createItem (payload) {
  const res = request.post('/items', payload)
  return res
}

export function updateItem (payload) {
  const res = request.put('/items', payload)
  return res
}

export function updateItemStatus (id, status) {
  const res = request.put(`/items/status/${id}/${status}`)
  return res
}

export function deleteItem (id) {
  const res = request.delete(`/items/${id}`)
  return res
}
