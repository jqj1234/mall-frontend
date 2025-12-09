const KEY = 'USER'

// 获取用户信息，并将其从 JSON 字符串解析为对象
export const getUser = () => {
  const userStr = localStorage.getItem(KEY)
  return userStr ? JSON.parse(userStr) : {} // 如果没有找到数据，则返回 {}
}

// 设置用户信息，将对象序列化为 JSON 字符串后存储
export const setUser = newUser => {
  localStorage.setItem(KEY, JSON.stringify(newUser)) // 使用 JSON.stringify 序列化对象
}

// 删除用户信息
export const delUser = () => {
  localStorage.removeItem(KEY)
}
