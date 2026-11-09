import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Đường dẫn tương đối: chạy được ở https://zacflower.github.io/ZL/ lẫn tên miền riêng
  base: './',
  plugins: [vue()],
  server: {
    // API key Google chỉ cho phép http://localhost:5173/* → luôn chạy đúng cổng này.
    // Nếu cổng đang bận, Vite báo lỗi thay vì tự nhảy sang cổng khác (sẽ bị Google chặn 403).
    port: 5173,
    strictPort: true,
  },
})
