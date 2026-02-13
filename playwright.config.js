/*
================================================================================
File: playwright.config.js
Description: Playwright configuration for E2E testing with Vite dev server.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-06
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { defineConfig } from '@playwright/test';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export default defineConfig({
  testDir: './tests/end2end-tests',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
