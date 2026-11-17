import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CORE_SMOKE_CASES,
  RWD_CASES,
  validateCoreSmokeCoverage,
} from '../scripts/coreSmokeValidation.js';

/** Build one clean result per required browser case.
 * @returns {object} Synthetic Playwright report.
 */
function completeReport() {
  const specs = [];
  for (const [cases, projects, tags] of [
    [CORE_SMOKE_CASES, ['chromium', 'webkit-core'], ['core-smoke']],
    [RWD_CASES, ['chromium', 'webkit-rwd'], []],
  ]) {
    for (const [file, title] of cases) {
      specs.push({
        file,
        title,
        tags,
        tests: projects.map((projectName) => ({
          projectName,
          expectedStatus: 'passed',
          status: 'expected',
          results: [{ status: 'passed' }],
        })),
      });
    }
  }
  return { suites: [{ specs }] };
}

test('core coverage rejects cases missing from both the runner list and results', () => {
  const good = completeReport();
  assert.doesNotThrow(() => validateCoreSmokeCoverage(good));
  good.suites[0].specs.shift();
  assert.throws(() => validateCoreSmokeCoverage(good), /missing or duplicate/);
});

test('core coverage rejects wrong tag, duplicate, skipped, and flaky cases', () => {
  for (const mutate of [
    (r) => {
      r.suites[0].specs[0].tags = [];
    },
    (r) => {
      r.suites[0].specs.push({
        file: 'extra.spec.js',
        title: 'unapproved',
        tags: ['core-smoke'],
        tests: [
          {
            projectName: 'webkit-core',
            expectedStatus: 'passed',
            status: 'expected',
            results: [{ status: 'passed' }],
          },
        ],
      });
    },
    (r) => {
      r.suites[0].specs.push({
        file: 'extra.spec.js',
        title: 'unapproved',
        tags: ['core-smoke'],
        tests: [
          {
            projectName: 'chromium',
            expectedStatus: 'passed',
            status: 'expected',
            results: [{ status: 'passed' }],
          },
        ],
      });
    },
    (r) => {
      r.suites[0].specs.push(r.suites[0].specs[0]);
    },
    (r) => {
      r.suites[0].specs[0].tests[0].status = 'skipped';
    },
    (r) => {
      r.suites[0].specs[0].tests[0].results.push({ status: 'failed' });
    },
  ]) {
    const report = completeReport();
    mutate(report);
    assert.throws(() => validateCoreSmokeCoverage(report));
  }
});

test('inventory counts one source case once but counts both browser executions', async () => {
  const { summarizePlaywrightCases } = await import('../scripts/playwrightInventory.js');
  const records = [
    { filePath: 'a.spec.js', caseKey: '["group","case"]', count: 1 },
    { filePath: 'a.spec.js', caseKey: '["group","case"]', count: 1 },
    { filePath: 'a.spec.js', caseKey: '["other group","case"]', count: 1 },
    { filePath: 'a.spec.js', caseKey: '["group","case",42,1]', count: 1 },
  ];
  assert.deepEqual(summarizePlaywrightCases(records), [
    { filePath: 'a.spec.js', count: 4, uniqueCaseCount: 3 },
  ]);
});
