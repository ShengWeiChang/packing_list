import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { CORE_SMOKE_CASES } from '../scripts/coreSmokeValidation.js';
import {
  readWindowsSmokeReport,
  validateWindowsSmokeReports,
  validateWindowsSmokeSelection,
} from '../scripts/windowsSmokeValidation.js';

/** Construct a complete focused report without running a browser.
 * @returns {object} Synthetic Playwright report.
 */
function smokeReport() {
  return {
    errors: [],
    stats: { expected: CORE_SMOKE_CASES.length, skipped: 0, unexpected: 0, flaky: 0 },
    suites: [
      {
        specs: CORE_SMOKE_CASES.map(([file, title], i) => ({
          file,
          title,
          id: `case-${i}`,
          tags: ['core-smoke'],
          tests: [
            {
              projectName: 'chromium',
              expectedStatus: 'passed',
              status: 'expected',
              results: [{ status: 'passed' }],
            },
          ],
        })),
      },
    ],
  };
}

test('Windows smoke selection fails closed for omitted, extra, duplicate, skipped or wrong cases', () => {
  const good = smokeReport();
  assert.doesNotThrow(() => validateWindowsSmokeReports(good, smokeReport()));
  for (const mutate of [
    (r) => {
      r.suites[0].specs.pop();
    },
    (r) => {
      r.suites[0].specs.push({ ...r.suites[0].specs[0], title: 'extra' });
    },
    (r) => {
      r.suites[0].specs.push(r.suites[0].specs[0]);
    },
    (r) => {
      r.suites[0].specs[0].tags = [];
    },
    (r) => {
      r.suites[0].specs[0].tests[0].projectName = 'webkit-core';
    },
    (r) => {
      r.suites[0].specs[0].tests[0].expectedStatus = 'skipped';
    },
    (r) => {
      r.errors.push({ message: 'runner error' });
    },
    (r) => {
      r.suites = [];
    },
  ]) {
    const report = smokeReport();
    mutate(report);
    assert.throws(() => validateWindowsSmokeSelection(report));
    assert.throws(() => validateWindowsSmokeReports(report, smokeReport()));
  }
  assert.throws(() => validateWindowsSmokeSelection(null));
  const incomplete = smokeReport();
  incomplete.suites[0].specs.pop();
  assert.throws(() => validateWindowsSmokeReports(incomplete, incomplete));
});

test('Windows smoke report reading rejects missing, empty and corrupt files', () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'smoke-report-'));
  const path = join(dir, 'report.json');
  try {
    assert.throws(() => readWindowsSmokeReport(path));
    writeFileSync(path, '');
    assert.throws(() => readWindowsSmokeReport(path));
    writeFileSync(path, '{broken');
    assert.throws(() => readWindowsSmokeReport(path));
    writeFileSync(path, JSON.stringify(smokeReport()));
    assert.doesNotThrow(() => validateWindowsSmokeSelection(readWindowsSmokeReport(path)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Windows smoke execution rejects incomplete, mismatched, flaky and skipped reports', () => {
  for (const mutate of [
    (r) => {
      r.suites[0].specs[0].id = 'different';
    },
    (r) => {
      r.suites[0].specs[0].tests[0].results = [];
    },
    (r) => {
      r.suites[0].specs[0].tests[0].results.push({ status: 'failed' });
    },
    (r) => {
      r.suites[0].specs[0].tests[0].status = 'flaky';
      r.stats.flaky = 1;
    },
    (r) => {
      r.stats.skipped = 1;
    },
    (r) => {
      r.stats.unexpected = 1;
    },
    (r) => {
      delete r.stats;
    },
  ]) {
    const report = smokeReport();
    mutate(report);
    assert.throws(() => validateWindowsSmokeReports(report, smokeReport()));
  }
  assert.throws(() => validateWindowsSmokeReports(null, smokeReport()));
  assert.throws(() => validateWindowsSmokeReports(smokeReport(), null));
});
