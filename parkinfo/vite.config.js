import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Parkinfo',
        short_name: 'Parkinfo',
        description: 'Find the closest and cheapest legal parking spot in Tallinn',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            urlPattern: ({ url }) => url.hostname.includes('nominatim') || url.hostname.includes('overpass'),
            handler: 'NetworkFirst',
            options: { cacheName: 'search-overpass', networkTimeoutSeconds: 3 }
          },
          {
            urlPattern: ({ url }) => url.hostname.includes('arcgis') || url.hostname.includes('esri'),
            handler: 'NetworkFirst',
            options: { cacheName: 'arcgis', networkTimeoutSeconds: 3 }
          }
        ]
      }
    })
  ],
})
