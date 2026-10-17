import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = (env.VITE_APP_BASE_PATH || '/console/').trim()

  if (!base.startsWith('/') || base.startsWith('//') || !base.endsWith('/') || /[?#]/.test(base)) {
    throw new Error('VITE_APP_BASE_PATH must be a local path such as /console/')
  }

  return {
    base,
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          // Development proxy only; this address is not included in the production bundle.
          target: env.VITE_LARAVEL_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
