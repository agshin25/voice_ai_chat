import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'https://sublunated-predominately-kyleigh.ngrok-free.dev',
    },
    allowedHosts: 'all'
  },
})
