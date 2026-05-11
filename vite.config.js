import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Generate source maps for production debugging (Vercel handles these securely)
    sourcemap: false,
    // Chunk size warning threshold (kB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor code into a separate chunk for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
