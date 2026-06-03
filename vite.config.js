import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2500,
  },
  server: {
    proxy: {
      '/firms-api': {
        target: 'https://firms.modaps.eosdis.nasa.gov',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/firms-api/, ''),
        secure: true,
      },
    },
  },
})
