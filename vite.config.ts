import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // В dev-режиме запросы /api/<host>/... идут через прокси Vite —
      // как на продакшн-сервере (server.js). GREEN-API не отдаёт CORS-заголовки,
      // поэтому прямые запросы из браузера блокируются.
      '^/api/[^/]+/': {
        target: 'https://api.green-api.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/[^/]+/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const host = req.url?.match(/^\/api\/([^/]+)\//)?.[1]
            if (host) proxyReq.setHeader('host', host)
          })
        },
      },
    },
  },
})
