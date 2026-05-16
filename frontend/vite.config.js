import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:4000",
      "/users": "http://localhost:4000",
      "/posts": "http://localhost:4000",
      "/categories": "http://localhost:4000",
      "/rankings": "http://localhost:4000",
      "/ai": "http://localhost:4000",
      "/db": "http://localhost:4000",
      "/health": "http://localhost:4000",
      "/seed": "http://localhost:4000",
    },
  },
})
