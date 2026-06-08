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
      configureServer(server) {
        server.middlewares.use('/api/firms', async (req, res) => {
          const u = new URL(req.url, 'http://x')
          const product = u.searchParams.get('product')
          const bbox    = u.searchParams.get('bbox')
          const days    = u.searchParams.get('days')
          const key     = env.VITE_FIRMS_KEY
          try {
            const upstream = await fetch(
              `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${product}/${bbox}/${days}`
            )
            const text = await upstream.text()
            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            res.statusCode = upstream.status
            res.end(text)
          } catch {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Failed to fetch FIRMS data' }))
          }
        })
      },
    },
  }
})
