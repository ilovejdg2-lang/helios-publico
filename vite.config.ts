import { assertPublicClientEnv } from './scripts/client-env.ts'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  assertPublicClientEnv(loadEnv(mode, process.cwd(), 'VITE_'))
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'brand/helios-ecg-bg.jpg',
          'brand/helmet-default.jpg',
          'brand/helmet-selected.jpg',
        ],
        manifest: {
          name: 'HELIOS',
          short_name: 'HELIOS',
          description:
            'Health Evaluation & Life Indicators Observation System. Datos ficticios.',
          lang: 'es',
          theme_color: '#F5004F',
          background_color: '#FFF5F8',
          display: 'standalone',
          icons: [
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: {
      proxy: {
        '/api': 'http://127.0.0.1:3000',
      },
    },
    test: {
      environment: 'node',
      include: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'server/**/*.test.ts',
        'shared/**/*.test.ts',
      ],
    },
  }
})
