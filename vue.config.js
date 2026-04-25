const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        // target: 'http://8.137.196.225:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        },
        onProxyRes (proxyRes, req) {
          if (req.url && req.url.indexOf('/chat') !== -1) {
            proxyRes.headers['Cache-Control'] = 'no-cache'
            proxyRes.headers['X-Accel-Buffering'] = 'no'
          }
        }
      }
    }
  }
})
