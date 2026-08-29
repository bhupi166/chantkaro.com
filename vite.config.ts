/// <reference types="vitest/config" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Chant Karo',
        short_name: 'Chant Karo',
        description:
          'Count chants, prayers and positive affirmations by tap or voice. No login required. Your personal progress stays privately in your browser.',
        lang: 'en',
        dir: 'ltr',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#FFF8EE',
        theme_color: '#E8734A',
        categories: ['lifestyle', 'health', 'spirituality'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // The SPA shell, not a static "offline" page — Workbox serves this
        // for every navigation that isn't otherwise precached (e.g. a
        // direct visit to /settings), online or offline, so React Router
        // can take over client-side. Pointing this at a static offline
        // page instead made every direct route visit show "You're
        // offline" regardless of actual connectivity.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/totals/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'global-totals',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['e2e/**', 'worker/**', 'src/test/**'],
    },
  },
});
