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
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const REPORT_DIRECTORY = resolve(PROJECT_ROOT, 'test-inventory-reports');
const DOCUMENTATION_MODE = process.argv.includes('--docs');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const ANSI_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');

/**
 * Convert a child-process output value to text.
 * @param {string | Buffer | undefined} output - Child-process output.
 * @returns {string} Text output.
 */
function outputToText(output) {
  return output ? output.toString().trim() : '';
}

/**
 * Remove terminal formatting from a test failure message.
 * @param {string} message - Potentially ANSI-formatted error message.
 * @returns {string} Plain-text error message.
 */
function stripAnsi(message) {
  return message.replace(ANSI_ESCAPE_PATTERN, '');
}

/**
 * Shorten a failure path when it belongs to this repository.
 * @param {string} file - Reporter file path.
 * @returns {string} Repository-relative path when possible.
 */
function relativeToProject(file) {
  const projectPrefix = `${PROJECT_ROOT}/`;
  return file.startsWith(projectPrefix) ? file.slice(projectPrefix.length) : file;
}

/**
 * Return a concise, de-duplicated summary of Playwright test failures.
 * @param {object} report - Playwright JSON reporter output.
 * @returns {string} Human-readable failure summary.
 */
export function summarizePlaywrightFailures(report) {
  const failures = [];

  for (const error of report.errors || []) {
    failures.push({
      file: error.location?.file || 'Playwright runner',
      line: error.location?.line,
      column: error.location?.column,
      message: error.message || 'Unknown Playwright runner failure',
    });
  }

  /**
   * Collect every reported test error from nested Playwright suites.
   * @param {object[]} suites - Reporter suites.
   * @returns {void}
   */
  function collectSuites(suites = []) {
    for (const suite of suites) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          for (const result of test.results || []) {
            for (const error of result.errors || []) {
              failures.push({
                file: error.location?.file || spec.file || 'unknown file',
                line: error.location?.line,
                column: error.location?.column,
                message: error.message || 'Unknown Playwright failure',
              });
            }
          }
        }
      }
      collectSuites(suite.suites);
    }
  }

  collectSuites(report.suites);

  if (failures.length === 0) {
    return 'Playwright failed, but its JSON report contained no individual test errors.';
  }

  const uniqueFailures = new Map();
  for (const failure of failures) {
    const location = [relativeToProject(failure.file), failure.line, failure.column]
      .filter(Boolean)
      .join(':');
    const message = stripAnsi(failure.message).replace(/\s+/g, ' ').trim();
    uniqueFailures.set(`${location}\n${message}`, { location, message });
  }

  return [
    'Playwright failure summary:',
    ...[...uniqueFailures.values()].map(
      ({ location, message }) => `- ${location} — ${message.slice(0, 240)}`
    ),
  ].join('\n');
}

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
    const output = [outputToText(error.stdout), outputToText(error.stderr)]
      .filter(Boolean)
      .join('\n');
    throw new Error(`${label} failed.${output ? `\n${output}` : ''}`);
  }
}

/**
 * Run Playwright, retaining its JSON report when tests fail and surfacing a
 * concise diagnostic summary instead of the full reporter payload.
 * @returns {string} Playwright JSON reporter output.
 */
function runPlaywrightE2E() {
  const label = 'Run Playwright E2E';
  const reportPath = resolve(REPORT_DIRECTORY, 'playwright.json');
  const args = ['playwright', 'test', '--reporter=json'];

  process.stdout.write(`\n→ ${label}\n`);

  try {
    const report = execFileSync(npxCommand, args, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    writeFileSync(reportPath, report);
    return report;
  } catch (error) {
    const report = outputToText(error.stdout);
    if (report) {
      writeFileSync(reportPath, report);
    }

    let summary = 'Playwright did not return a parseable JSON report.';
    try {
      summary = summarizePlaywrightFailures(JSON.parse(report));
    } catch {
      // Preserve the child-process stderr below when JSON reporting is unavailable.
    }

    const stderr = outputToText(error.stderr);
    throw new Error(`${label} failed.\n${summary}${stderr ? `\n${stderr}` : ''}`);
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
  const executed = ['npm run validate', 'npm run docs:check-pairs'];
  const skipped = [
    'Vitest coverage (documentation-only scope)',
    'Playwright E2E (documentation-only scope)',
    'test inventory (documentation-only scope)',
    'production build (documentation-only scope)',
  ];

  runCommand('Validate formatting and lint rules', npmCommand, ['run', 'validate']);
  runCommand('Check paired documentation structure', npmCommand, ['run', 'docs:check-pairs']);
  reportResult('docs', executed, skipped);
}

/**
 * Run all validation layers required for a user-visible feature change.
 * @returns {void}
 */
function runFeatureVerification() {
  const executed = [
    'npm run validate',
    'npm run docs:check-pairs',
    'Vitest coverage with JSON report',
    'Playwright E2E with JSON report',
    'npm run test:inventory:ci',
    'npm run build',
  ];

  mkdirSync(REPORT_DIRECTORY, { recursive: true });
  runCommand('Validate formatting and lint rules', npmCommand, ['run', 'validate']);
  runCommand('Check paired documentation structure', npmCommand, ['run', 'docs:check-pairs']);

  const vitestPath = resolve(PROJECT_ROOT, 'node_modules', 'vitest', 'vitest.mjs');
  runCommand('Run Vitest coverage', process.execPath, [
    vitestPath,
    'run',
    '--coverage',
    '--reporter=json',
    '--outputFile',
    resolve(REPORT_DIRECTORY, 'vitest.json'),
  ]);

  runPlaywrightE2E();

  runCommand('Audit test inventory', npmCommand, ['run', 'test:inventory:ci']);
  runCommand('Build production bundle', npmCommand, ['run', 'build']);
  reportResult('feature', executed, []);
}

/**
 * Run the verification scope selected by command-line arguments.
 * @returns {void}
 */
function main() {
  if (DOCUMENTATION_MODE) {
    runDocumentationVerification();
  } else {
    runFeatureVerification();
  }
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`\nFeature verification failed.\n${error.message}\n`);
    process.exitCode = 1;
  }
}
