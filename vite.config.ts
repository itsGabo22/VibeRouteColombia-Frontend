import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'GOOGLE_'],
  define: {
    global: 'window',
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    open: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
})
