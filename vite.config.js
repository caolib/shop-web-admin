import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 从环境变量中获取 TAURI_DEV_HOST，用于指定开发服务器的 host
const host = process.env.TAURI_DEV_HOST

export default defineConfig(async () => ({
  plugins: [
    vue(),
    vueDevTools({
      // 使用 VS Code 打开编辑器
      launchEditor: 'code',
    }),
  ],
  resolve: {
    alias: {
      // 设置路径别名，方便引用 src 下的模块
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // Vite 选项，专门为 Tauri 开发和构建定制
  clearScreen: false, // 防止屏蔽掉 rust 错误信息
  server: {
    port: 14200, // 固定端口，确保 Tauri 预期使用相同端口
    strictPort: true, // 若端口被占用则报错
    host: host || false, // 根据环境变量设置 host，如果没有则使用默认
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 忽略监视 src-tauri 目录，防止不必要的重启
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      '/api': { // 匹配请求路径中含有 /api 的请求
        // target: 'http://localhost:8080', // 后端服务地址
        target: 'http://laptop:8080', // 后端服务地址
        changeOrigin: true,
        // rewrite 会在请求中去掉 /api 前缀
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
}))
