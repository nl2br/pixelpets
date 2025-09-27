import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://gateway:3000',  // service Docker
        changeOrigin: true,
        ws: true,
        // timeouts plus larges (évite les coupures sur 1er appel IA ou DB lente)
        proxyTimeout: 120000,
        timeout: 120000,
        // (optionnel) un peu de debug si besoin
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error('[VITE PROXY ERROR]', req.method, req.url, err.message)
          })
        }
      }
    }
  }
})
