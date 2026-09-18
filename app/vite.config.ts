import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The UI calls the API as /app (same origin). In development forward it to the
    // Python server; override with VACUULA_API if it runs on another machine.
    proxy: {
      '/app': {
        target: process.env.VACUULA_API ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
