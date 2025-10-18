import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Parkinfo',
        short_name: 'Parkinfo',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        description: 'Find parking in Tallinn'
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('openstreetmap.org') || url.hostname.includes('tile'),
            handler: 'CacheFirst',
            options: { cacheName: 'tiles', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          },
          {
            urlPattern: ({ url }) => url.hostname.includes('overpass-api.de'),
            handler: 'NetworkFirst',
            options: { cacheName: 'overpass', networkTimeoutSeconds: 5 }
          },
          {
            urlPattern: ({ url }) => url.hostname.includes('gis.tallinn.ee'),
            handler: 'NetworkFirst',
            options: { cacheName: 'arcgis', networkTimeoutSeconds: 5 }
          },
          {
            urlPattern: ({ url }) => url.hostname.includes('nominatim.openstreetmap.org'),
            handler: 'NetworkFirst',
            options: { cacheName: 'nominatim', networkTimeoutSeconds: 5 }
          }
        ]
      }
    })
  ],
  server: { port: 5173, host: true }
})