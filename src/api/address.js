import request from '@/utils/request'

export function getAddress () {
  const res = request.get('/addresses')
  return res
}
