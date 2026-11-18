/* Run the selected Chromium smoke with independent, fail-closed reports. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import {
  readWindowsSmokeReport,
  validateWindowsSmokeReports,
  validateWindowsSmokeSelection,
} from './windowsSmokeValidation.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cli = require.resolve('@playwright/test/cli');
const artifactRoot = resolve(root, '.container-test-artifacts');
mkdirSync(artifactRoot, { recursive: true });
const requested = process.env.CI_ARTIFACT_DIR;
let output;
if (requested) {
  output = resolve(root, requested);
  const part = relative(artifactRoot, output);
  if (
    !part ||
    part.startsWith('..') ||
    isAbsolute(part) ||
    part.includes('/') ||
    part.includes('\\')
  )
    throw new Error('CI_ARTIFACT_DIR must be a new direct child of .container-test-artifacts.');
  mkdirSync(output);
} else {
  output = mkdtempSync(resolve(artifactRoot, 'windows-smoke-local-'));
}
const metadataPath = resolve(output, 'metadata.json');
const meta = {
  checkout: null,
  expectedCheckout: process.env.GITHUB_SHA ?? 'not-a-github-run',
  prHead: process.env.PR_HEAD_SHA ?? 'not-a-pr',
  prBase: process.env.PR_BASE_SHA ?? 'not-a-pr',
  runId: process.env.GITHUB_RUN_ID ?? 'local',
  runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? 'local',
  runnerOS: process.env.RUNNER_OS ?? os.platform(),
  runnerArch: process.env.RUNNER_ARCH ?? os.arch(),
  platform: os.platform(),
  release: os.release(),
  osVersion: os.version(),
  node: process.version,
  playwright: require('@playwright/test/package.json').version,
  browser: null,
  viewport: 'Test-specific; see selected specs (320x900, 1280x900, 1280x720, 1280x500).',
  startedAt: new Date().toISOString(),
};

/** Write the current metadata even when a later step fails. */
function saveMetadata() {
  writeFileSync(metadataPath, JSON.stringify(meta, null, 2));
}

/** Run Playwright without platform-specific npm shell quoting.
 * @param {string[]} args - Playwright CLI arguments.
 * @param {string} outputFile - Output path for the JSON reporter.
 * @returns {import('node:child_process').SpawnSyncReturns<string>} Runner result.
 */
function runPlaywright(args, outputFile) {
  const env = { ...process.env };
  delete env.PLAYWRIGHT_JSON_OUTPUT_DIR;
  delete env.PLAYWRIGHT_JSON_OUTPUT_NAME;
  delete env.PLAYWRIGHT_JSON_OUTPUT_FILE;
  delete env.PLAYWRIGHT_JSON_ONLY_FAILURES;
  const result = spawnSync(process.execPath, [cli, 'test', ...args, '--reporter=json'], {
    cwd: root,
    env,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.stdout) writeFileSync(outputFile, result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  return result;
}

try {
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (git.status !== 0 || !git.stdout.trim()) throw new Error('Could not identify the checkout.');
  meta.checkout = git.stdout.trim();
  saveMetadata();
  if (process.env.GITHUB_SHA && meta.checkout !== process.env.GITHUB_SHA)
    throw new Error('Checkout does not match the GitHub event revision.');
  const browser = await chromium.launch();
  try {
    meta.browser = {
      name: 'Playwright Chromium',
      version: browser.version(),
      bundledExecutablePath: chromium.executablePath(),
    };
  } finally {
    await browser.close();
  }
  saveMetadata();
  const selection = ['--project=chromium', '--grep', '@core-smoke'];
  const listPath = resolve(output, 'list.json');
  const listStarted = Date.now();
  const listed = runPlaywright([...selection, '--list'], listPath);
  meta.listDurationMs = Date.now() - listStarted;
  if (listed.status !== 0)
    throw new Error(`Windows smoke collection failed (exit ${listed.status}).`);
  const list = readWindowsSmokeReport(listPath);
  validateWindowsSmokeSelection(list);
  const reportPath = resolve(output, 'report.json');
  const runStarted = Date.now();
  const executed = runPlaywright(
    [...selection, `--output=${resolve(output, 'test-results')}`],
    reportPath
  );
  meta.testDurationMs = Date.now() - runStarted;
  if (executed.status !== 0)
    throw new Error(`Windows smoke execution failed (exit ${executed.status}).`);
  const report = readWindowsSmokeReport(reportPath);
  validateWindowsSmokeReports(report, list);
  meta.result = {
    expected: report.stats.expected,
    skipped: report.stats.skipped,
    unexpected: report.stats.unexpected,
    flaky: report.stats.flaky,
  };
  process.stdout.write(`Core smoke passed: ${report.stats.expected} Chromium cases.\n`);
} catch (error) {
  meta.error = error instanceof Error ? error.message : String(error);
  console.error(`Core smoke failed: ${meta.error}`);
  process.exitCode = 1;
} finally {
  meta.finishedAt = new Date().toISOString();
  saveMetadata();
  process.stdout.write(`Smoke artifacts: ${output}\n`);
}
