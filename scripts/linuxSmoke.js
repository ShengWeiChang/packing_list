/* Run the shared Chromium smoke inside the isolated Linux test container. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import process from 'node:process';

import {
  readWindowsSmokeReport,
  validateWindowsSmokeReports,
  validateWindowsSmokeSelection,
} from './windowsSmokeValidation.js';

const require = createRequire(import.meta.url);
const cli = require.resolve('@playwright/test/cli');
const output = resolve('test-inventory-reports');
mkdirSync(output, { recursive: true });
const selection = ['--project=chromium', '--grep', '@core-smoke', '--retries=0'];

/** Run a Playwright selection and retain its report even when it fails.
 * @param {string[]} args - Playwright test arguments.
 * @param {string} name - Report filename.
 * @returns {object} Parsed report.
 */
function runReport(args, name) {
  const env = { ...process.env };
  for (const key of [
    'PLAYWRIGHT_JSON_OUTPUT_DIR',
    'PLAYWRIGHT_JSON_OUTPUT_NAME',
    'PLAYWRIGHT_JSON_OUTPUT_FILE',
    'PLAYWRIGHT_JSON_ONLY_FAILURES',
  ])
    delete env[key];
  const result = spawnSync(process.execPath, [cli, 'test', ...args, '--reporter=json'], {
    encoding: 'utf8',
    env,
    maxBuffer: 32 * 1024 * 1024,
  });
  const path = resolve(output, name);
  if (result.stdout) writeFileSync(path, result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Playwright smoke failed (exit ${result.status}).`);
  return readWindowsSmokeReport(path);
}

try {
  const list = runReport([...selection, '--list'], 'smoke-list.json');
  validateWindowsSmokeSelection(list);
  const report = runReport(selection, 'smoke.json');
  validateWindowsSmokeReports(report, list);
  process.stdout.write(`Linux core smoke passed: ${report.stats.expected} Chromium cases.\n`);
} catch (error) {
  process.stderr.write(
    `Linux core smoke failed: ${error instanceof Error ? error.message : error}\n`
  );
  process.exitCode = 1;
}
