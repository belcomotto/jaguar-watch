import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 2500,
    },
    server: {
      proxy: {
        '/api/firms': {
          target: 'https://firms.modaps.eosdis.nasa.gov',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const u = new URL(path, 'http://x')
            const product = u.searchParams.get('product')
            const bbox    = u.searchParams.get('bbox')
            const days    = u.searchParams.get('days')
            return `/api/area/csv/${env.VITE_FIRMS_KEY}/${product}/${bbox}/${days}`
          },
        },
      },
    },
  }
})
