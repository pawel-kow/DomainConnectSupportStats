import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * E2E against the production build served by `vite preview`, which serves the data release under
 * `/data/` like the deployed site (DATA_DIR, default: the contract's example export) and the
 * registry under `/registry/` (REGISTRY_DIR, default: the contract's golden copy), and the derived
 * data of DATA_DIR under `/data/derived/`.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run derive && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/index.html`,
    // Never reuse a running preview: it would serve a stale build.
    reuseExistingServer: false,
    timeout: 120_000,
    env: { REGISTRY_DIR: process.env.REGISTRY_DIR ?? 'contract/registry/examples' },
  },
});
