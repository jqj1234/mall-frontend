const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://8.137.167.89:8080', // 后端服务器地址
        // target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '' // 将 /api 重写为空字符串
        }
      }
    }
  }
})
