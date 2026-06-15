import { defineConfig, devices } from '@playwright/test';

// E2E happy paths (Spec §10). Runs against the app in mock mode (default), so no
// backend or database is needed. The webServer builds + starts the app on 3100
// and is reused if already running.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // tiny happy-path suite; serial avoids first-render contention flake
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: 'list',
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_PUBLIC_USE_MOCKS: 'true' },
  },
});
