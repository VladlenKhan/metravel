import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  base: '/metravel/', // ⚠️ ОБЯЗАТЕЛЬНО (имя репозитория)

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:5066',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})