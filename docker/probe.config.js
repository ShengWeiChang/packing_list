import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'probe.spec.js',
  retries: 0,
  workers: 1,
  outputDir: '../test-results',
});
