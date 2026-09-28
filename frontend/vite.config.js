import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT) || 5273,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || `http://127.0.0.1:${process.env.BACKEND_PORT || 5000}`,
        changeOrigin: true
      }
    }
  }
})
