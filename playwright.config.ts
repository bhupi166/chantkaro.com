import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort --host 127.0.0.1',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Production build with the service worker enabled, used only by
      // e2e/pwa-offline.spec.ts to verify real offline caching.
      command: 'npm run build && npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'Mobile Android (Pixel 5)',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile iOS (iPhone SE)',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
