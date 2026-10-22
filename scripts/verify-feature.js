/*
================================================================================
File: scripts/verify-feature.js
Description: Run the repeatable feature-verification layers used by local
             development and future CI integration.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-21
================================================================================
*/

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const REPORT_DIRECTORY = resolve(PROJECT_ROOT, 'test-inventory-reports');
const DOCUMENTATION_MODE = process.argv.includes('--docs');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

/**
 * Run one named verification command and preserve its failure output.
 * @param {string} label - User-facing verification step name.
 * @param {string} command - Executable command.
 * @param {string[]} args - Arguments for the executable.
 * @param {object} options - Additional child-process options.
 * @returns {string} Command standard output.
 */
function runCommand(label, command, args, options = {}) {
  process.stdout.write(`\n→ ${label}\n`);

  try {
    return execFileSync(command, args, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${label} failed.${output ? `\n${output}` : ''}`);
  }
}

/**
 * Print the machine and human-readable verification summary.
 * @param {string} scope - Verification scope.
 * @param {string[]} executed - Completed validation layers.
 * @param {string[]} skipped - Intentionally skipped validation layers.
 * @returns {void}
 */
function reportResult(scope, executed, skipped) {
  process.stdout.write('\nFeature verification passed.\n');
  process.stdout.write(`Scope: ${scope}\n`);
  process.stdout.write(`Executed: ${executed.join('; ')}\n`);
  process.stdout.write(`Skipped: ${skipped.length === 0 ? 'none' : skipped.join('; ')}\n`);
}

/**
 * Run the reduced validation appropriate for documentation-only changes.
 * @returns {void}
 */
function runDocumentationVerification() {
  const executed = ['npm run validate'];
  const skipped = [
    'Vitest coverage (documentation-only scope)',
    'Playwright E2E (documentation-only scope)',
    'test inventory (documentation-only scope)',
    'production build (documentation-only scope)',
  ];

  runCommand('Validate formatting and lint rules', npmCommand, ['run', 'validate']);
  reportResult('docs', executed, skipped);
}

/**
 * Run all validation layers required for a user-visible feature change.
 * @returns {void}
 */
function runFeatureVerification() {
  const executed = [
    'npm run validate',
    'Vitest coverage with JSON report',
    'Playwright E2E with JSON report',
    'npm run test:inventory:ci',
    'npm run build',
  ];

  mkdirSync(REPORT_DIRECTORY, { recursive: true });
  runCommand('Validate formatting and lint rules', npmCommand, ['run', 'validate']);

  const vitestPath = resolve(PROJECT_ROOT, 'node_modules', 'vitest', 'vitest.mjs');
  runCommand('Run Vitest coverage', process.execPath, [
    vitestPath,
    'run',
    '--coverage',
    '--reporter=json',
    '--outputFile',
    resolve(REPORT_DIRECTORY, 'vitest.json'),
  ]);

  const playwrightReport = runCommand('Run Playwright E2E', npxCommand, [
    'playwright',
    'test',
    '--reporter=json',
  ]);
  writeFileSync(resolve(REPORT_DIRECTORY, 'playwright.json'), playwrightReport);

  runCommand('Audit test inventory', npmCommand, ['run', 'test:inventory:ci']);
  runCommand('Build production bundle', npmCommand, ['run', 'build']);
  reportResult('feature', executed, []);
}

try {
  if (DOCUMENTATION_MODE) {
    runDocumentationVerification();
  } else {
    runFeatureVerification();
  }
} catch (error) {
  process.stderr.write(`\nFeature verification failed.\n${error.message}\n`);
  process.exitCode = 1;
}
