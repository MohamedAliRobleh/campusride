import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/utilisateurs": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/trajets": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/reservations": {   
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },

      "/notifications": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/vehicules": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/admin": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/evaluations": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/messages": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
