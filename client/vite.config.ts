// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Все запросы, начинающиеся с /api, будут перенаправляться на бэкенд
      '/api': {
        target: 'https://localhost:5066', 
        changeOrigin: true,
        secure: false,                        // важно, если у бэкенда самоподписанный HTTPS сертификат
        rewrite: (path) => path.replace(/^\/api/, '/api'), 
      },
    },
  },
})