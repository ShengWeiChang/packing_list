import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import test from 'node:test';

import { validatePlaywrightReport, validateVitestReport } from '../scripts/reportValidation.js';

const root = '/project';
const expectedVitest = [{ file: '/project/tests/example.test.js', name: 'group > example' }];
const goodVitest = {
  success: true,
  numFailedTests: 0,
  numPendingTests: 0,
  numTodoTests: 0,
  numFailedTestSuites: 0,
  numPendingTestSuites: 0,
  numTotalTestSuites: 1,
  numPassedTestSuites: 1,
  numTotalTests: 1,
  numPassedTests: 1,
  testResults: [
    {
      name: '/project/tests/example.test.js',
      status: 'passed',
      assertionResults: [{ ancestorTitles: ['group'], title: 'example', status: 'passed' }],
    },
  ],
};
const makePlaywright = () => ({
  errors: [],
  stats: { expected: 1, skipped: 0, unexpected: 0, flaky: 0 },
  suites: [
    {
      specs: [
        {
          id: 'example-id',
          file: 'example.spec.js',
          title: 'example',
          tests: [
            {
              projectName: 'chromium',
              expectedStatus: 'passed',
              status: 'expected',
              results: [{ status: 'passed' }],
            },
          ],
        },
      ],
    },
  ],
});

test('Vitest reports reject skipped, todo, omitted, and incomplete cases', () => {
  validateVitestReport(goodVitest, expectedVitest, root);
  for (const status of ['pending', 'todo', 'failed']) {
    const report = structuredClone(goodVitest);
    report.testResults[0].assertionResults[0].status = status;
    assert.throws(() => validateVitestReport(report, expectedVitest, root));
  }
  for (const mutate of [
    (report) => (report.testResults = []),
    (report) => (report.numTodoTests = 1),
    (report) => (report.numPendingTests = 1),
    (report) => (report.success = false),
    (report) => (report.testResults[0].name = '/project/tests/other.test.js'),
    (report) => delete report.testResults[0].assertionResults,
  ]) {
    const report = structuredClone(goodVitest);
    mutate(report);
    assert.throws(() => validateVitestReport(report, expectedVitest, root));
  }
  assert.throws(() => validateVitestReport(goodVitest, [], root));
  assert.throws(() => validateVitestReport(null, expectedVitest, root));
});

test('Playwright reports reject skipped, flaky, omitted, and incomplete cases', () => {
  const expected = makePlaywright();
  validatePlaywrightReport(makePlaywright(), expected);
  for (const status of ['skipped', 'flaky', 'unexpected']) {
    const report = makePlaywright();
    report.suites[0].specs[0].tests[0].status = status;
    assert.throws(() => validatePlaywrightReport(report, expected));
  }
  for (const mutate of [
    (report) => (report.suites = []),
    (report) => (report.errors = [{ message: 'runner error' }]),
    (report) => (report.stats.skipped = 1),
    (report) => (report.stats.flaky = 1),
    (report) => (report.suites[0].specs[0].id = 'different-id'),
    (report) => (report.suites[0].specs[0].tests[0].results = []),
    (report) => (report.suites[0].specs[0].tests[0].results[0].status = 'failed'),
    (report) => (report.suites[0].specs[0].tests[0].expectedStatus = 'skipped'),
  ]) {
    const report = makePlaywright();
    mutate(report);
    assert.throws(() => validatePlaywrightReport(report, expected));
  }
  assert.throws(() => validatePlaywrightReport(makePlaywright(), { suites: [], errors: [] }));
  assert.throws(() => validatePlaywrightReport(null, expected));
});

test('failed verification removes only stale generated reports before running checks', () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'packing-report-contract-')));
  try {
    const scripts = join(directory, 'scripts');
    const bin = join(directory, 'bin');
    const reports = join(directory, 'test-inventory-reports');
    mkdirSync(scripts);
    mkdirSync(bin);
    mkdirSync(reports);
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
    writeFileSync(
      join(scripts, 'verify-feature.js'),
      readFileSync(resolve('scripts/verify-feature.js'))
    );
    writeFileSync(join(bin, 'npm'), '#!/bin/sh\nexit 51\n', { mode: 0o755 });
    for (const name of ['vitest.json', 'playwright.json', 'keep.txt']) {
      writeFileSync(join(reports, name), 'old');
    }
    const result = spawnSync(process.execPath, [join(scripts, 'verify-feature.js')], {
      cwd: directory,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Validate formatting and lint rules failed/);
    assert.equal(existsSync(join(reports, 'vitest.json')), false);
    assert.equal(existsSync(join(reports, 'playwright.json')), false);
    assert.equal(readFileSync(join(reports, 'keep.txt'), 'utf8'), 'old');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('inventory rejects missing or malformed report files', () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'packing-report-input-')));
  try {
    mkdirSync(join(directory, 'scripts'));
    mkdirSync(join(directory, 'docs'));
    mkdirSync(join(directory, 'test-inventory-reports'));
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
    writeFileSync(join(directory, 'docs', 'testing-guide.md'), 'fixture');
    for (const name of [
      'test-inventory.js',
      'reportValidation.js',
      'coreSmokeValidation.js',
      'playwrightInventory.js',
    ]) {
      writeFileSync(join(directory, 'scripts', name), readFileSync(resolve('scripts', name)));
    }
    const execute = () =>
      spawnSync(
        process.execPath,
        [join(directory, 'scripts', 'test-inventory.js'), '--from-reports'],
        {
          cwd: directory,
          encoding: 'utf8',
        }
      );
    const missing = execute();
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /Vitest report is missing/);
    writeFileSync(join(directory, 'test-inventory-reports', 'vitest.json'), '{invalid');
    const corrupt = execute();
    assert.notEqual(corrupt.status, 0);
    assert.match(corrupt.stderr, /SyntaxError/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('inventory includes Vitest failure details before removing its temporary report', () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'packing-report-failure-')));
  try {
    mkdirSync(join(directory, 'scripts'));
    mkdirSync(join(directory, 'docs'));
    mkdirSync(join(directory, 'node_modules', 'vitest'), { recursive: true });
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
    writeFileSync(join(directory, 'docs', 'testing-guide.md'), 'fixture');
    for (const name of [
      'test-inventory.js',
      'reportValidation.js',
      'coreSmokeValidation.js',
      'playwrightInventory.js',
    ]) {
      writeFileSync(join(directory, 'scripts', name), readFileSync(resolve('scripts', name)));
    }
    writeFileSync(
      join(directory, 'node_modules', 'vitest', 'vitest.mjs'),
      `import { writeFileSync } from 'node:fs';
       const path = process.argv[process.argv.indexOf('--outputFile') + 1];
       writeFileSync(path, JSON.stringify({ testResults: [{ name: 'fixture.test.js', assertionResults: [{ fullName: 'controlled failure', status: 'failed', failureMessages: ['specific assertion error'] }] }] }));
       process.exitCode = 1;`
    );
    const result = spawnSync(process.execPath, [join(directory, 'scripts', 'test-inventory.js')], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /controlled failure: specific assertion error/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
