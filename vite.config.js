import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DJANGO = 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Django REST API
      '/api': { target: DJANGO, changeOrigin: true },
      // Google OAuth token exchange endpoints only — NOT /auth/callback (that's a React route)
      '/auth/google': { target: DJANGO, changeOrigin: true },
      // Media file downloads served by Django in DEBUG mode
      '/media': { target: DJANGO, changeOrigin: true },
    },
  },
})
