const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        // target: 'http://localhost:8080',
        target: 'http://8.137.196.225:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '' // 将 /api 重写为空字符串
        }
      },
      '/chat': {
        // target: 'http://47.109.132.232:5001',
        target: 'http://8.137.196.225:5001',
        changeOrigin: true,
        pathRewrite: {
          '^/chat': '/chat'
        },
        onProxyRes: function (proxyRes) {
          proxyRes.headers['Cache-Control'] = 'no-cache'
          proxyRes.headers['X-Accel-Buffering'] = 'no'
        }
      }
    }
  }
})
