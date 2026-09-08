import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    proxy: {
      //接口代理
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      //静态资源代理
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      // 源码直引 shared 包，保持 HMR 与开发体验
      '@wc/shared': fileURLToPath(new URL('../../packages/shared/src', import.meta.url))
    }
  },
  optimizeDeps: {
    exclude: ['@wc/shared']
  },
  css: {
    // PostCSS 配置内联（原 postcss.config.js 已移除，构建链全 TS）
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  }
})
