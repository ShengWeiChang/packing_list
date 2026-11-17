import { readFileSync } from 'node:fs';

import { CORE_SMOKE_CASES } from './coreSmokeValidation.js';
import { validatePlaywrightReport } from './reportValidation.js';

/** Read a required Playwright report without accepting missing or invalid JSON.
 * @param {string} path - Report path.
 * @returns {object} Parsed report.
 */
export function readWindowsSmokeReport(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Validate a selected Chromium smoke list against the fixed cross-platform contract.
 * @param {object} report - Playwright JSON list or execution report.
 * @returns {void}
 */
export function validateWindowsSmokeSelection(report) {
  if (
    !report ||
    !Array.isArray(report.suites) ||
    !Array.isArray(report.errors) ||
    report.errors.length
  )
    throw new Error('Windows smoke report is missing suites or has runner errors.');
  const expected = new Set(CORE_SMOKE_CASES.map(([file, title]) => JSON.stringify([file, title])));
  if (CORE_SMOKE_CASES.length !== 6 || expected.size !== 6)
    throw new Error('Windows smoke contract must contain six distinct cases.');
  const seen = new Set();
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      const key = JSON.stringify([spec.file, spec.title]);
      if (!expected.has(key) || seen.has(key))
        throw new Error(`Unexpected or duplicate Windows smoke case: ${key}`);
      if (
        !spec.id ||
        !Array.isArray(spec.tags) ||
        !spec.tags.includes('core-smoke') ||
        !Array.isArray(spec.tests) ||
        spec.tests.length !== 1 ||
        spec.tests[0].projectName !== 'chromium' ||
        spec.tests[0].expectedStatus !== 'passed'
      )
        throw new Error(`Incomplete or invalid Windows smoke case: ${key}`);
      seen.add(key);
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites) visit(suite);
  if (seen.size !== expected.size)
    throw new Error(`Windows smoke cases missing: ${expected.size - seen.size}`);
}

/** Check independent selected cases and the complete executed result.
 * @param {object} report - Executed Playwright JSON report.
 * @param {object} list - Playwright list JSON report.
 * @returns {void}
 */
export function validateWindowsSmokeReports(report, list) {
  validateWindowsSmokeSelection(list);
  validateWindowsSmokeSelection(report);
  validatePlaywrightReport(report, list);
}
