import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    // Proxy API requests to the Express server during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Your Express server's address
        changeOrigin: true,
      }
    }
  }
})
