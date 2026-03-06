import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'CampusRide',
        short_name: 'CampusRide',
        description: 'Covoiturage exclusif pour la communauté du Collège La Cité',
        theme_color: '#198754',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        lang: 'fr',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Rechercher un trajet',
            url: '/passager/search',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Mes réservations',
            url: '/passager/mes-reservations',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache les appels API GET (trajets, profil, etc.)
            urlPattern: /^\/.*(trajets|utilisateurs|notifications|evaluations).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
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
