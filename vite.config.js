import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: 'public/manifest.webmanifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          // ativos estáticos
          {
            urlPattern: ({ request }) => request.destination !== 'document',
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-v1',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          // Google Drive – network first
          {
            urlPattern: ({ url }) => url.origin.includes('googleapis.com'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'drive-backup',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 10 }
            }
          },
          // páginas
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'pages' }
          }
        ]
      }
    })
  ]
})
