import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://kaew-amornrat.vercel.app',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    locale: 'th-TH',
  },
  projects: [
    // Setup: login once and save session
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: 'desktop',
      dependencies: ['setup'],
      // responsive.spec.ts tests hamburger/mobile sidebar — only valid on mobile viewport
      testIgnore: [/auth\.spec\.ts/, /responsive\.spec\.ts/],
      use: { viewport: { width: 1440, height: 900 }, storageState: './e2e/.auth/admin.json' },
    },
    {
      name: 'mobile',
      dependencies: ['setup'],
      testIgnore: /auth\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 }, isMobile: true, storageState: './e2e/.auth/admin.json' },
    },
    // Auth tests: independent, no saved session, no dependency on setup
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      use: { storageState: undefined, viewport: { width: 1440, height: 900 } },
    },
  ],
  // No webServer — testing against live production
});
