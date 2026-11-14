import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径：既能跑在本地根目录，也能跑在 GitHub Pages 的 /<repo>/ 子路径下。
  // 站点用 hash 路由，没有服务端重写需求，所以相对 base 是安全的。
  base: './',
  server: { port: 5173, host: '127.0.0.1' },
  build: { outDir: 'dist', assetsInlineLimit: 2048 },
})
