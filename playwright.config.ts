import { defineConfig, devices } from '@playwright/test';

const baseProjects = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
];

const edgeProject =
  process.env.PLAYWRIGHT_SKIP_EDGE === '1'
    ? []
    : [{ name: 'msedge', use: { ...devices['Desktop Edge'], channel: 'msedge' as const } }];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
  },
  projects: [...baseProjects, ...edgeProject],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // .env.local suele tener VITE_MOCK_API=true; e2e necesita fetch real + page.route.
        command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          VITE_MOCK_API: 'false',
          VITE_ENABLE_ETHNICITY: 'false',
          VITE_ENABLE_AGE: 'false',
        },
      },
});
