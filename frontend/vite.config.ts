import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['vue', 'vue-router']
  },
  server: {
    open: true,
    host: "localhost",
    port: 5173
  },
  plugins: [
    Vue()
  ]
})
