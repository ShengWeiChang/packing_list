import { relative } from 'node:path';

/** @param {string} root - Project root.
 * @param {string} file - Runner path.
 * @returns {string} Portable relative path.
 */
function projectPath(root, file) {
  if (typeof file !== 'string' || !file) throw new Error('Missing test file path.');
  return relative(root, file).replaceAll('\\', '/');
}

/** @param {string[]} expected - Expected IDs.
 * @param {string[]} actual - Executed IDs.
 * @param {string} runner - Runner name.
 * @returns {void}
 */
function compareIds(expected, actual, runner) {
  if (!expected.length || new Set(expected).size !== expected.length)
    throw new Error(`${runner} expected test inventory is empty or has duplicate IDs.`);
  if (new Set(actual).size !== actual.length)
    throw new Error(`${runner} report has duplicate test IDs.`);
  const wanted = new Set(expected);
  const observed = new Set(actual);
  const missing = expected.filter((id) => !observed.has(id));
  const extra = actual.filter((id) => !wanted.has(id));
  if (missing.length || extra.length)
    throw new Error(`${runner} test IDs differ: missing ${missing.length}, extra ${extra.length}.`);
}

/** Validate Vitest execution against a fresh runner inventory.
 * @param {object} report - Vitest JSON report.
 * @param {object[]} expected - Vitest list entries.
 * @param {string} root - Project root.
 * @returns {void}
 */
export function validateVitestReport(report, expected, root) {
  if (!report || !Array.isArray(report.testResults) || !Array.isArray(expected))
    throw new Error('Invalid Vitest report or expected inventory.');
  if (
    report.success !== true ||
    report.numFailedTests !== 0 ||
    report.numPendingTests !== 0 ||
    report.numTodoTests !== 0 ||
    report.numFailedTestSuites !== 0 ||
    report.numPendingTestSuites !== 0 ||
    !Number.isInteger(report.numTotalTestSuites) ||
    report.numTotalTestSuites < 1 ||
    report.numPassedTestSuites !== report.numTotalTestSuites
  )
    throw new Error('Vitest report includes failed, pending, or todo tests.');
  const expectedIds = expected.map((entry) =>
    JSON.stringify([projectPath(root, entry.file), entry.name])
  );
  const actualIds = report.testResults.flatMap((file) => {
    if (file.status !== 'passed' || !Array.isArray(file.assertionResults))
      throw new Error('Vitest report has a non-passing or incomplete file.');
    return file.assertionResults.map((assertion) => {
      if (assertion.status !== 'passed' || !Array.isArray(assertion.ancestorTitles))
        throw new Error('Vitest report has a skipped, todo, or incomplete test.');
      return JSON.stringify([
        projectPath(root, file.name),
        [...assertion.ancestorTitles, assertion.title].join(' > '),
      ]);
    });
  });
  if (report.numTotalTests !== actualIds.length || report.numPassedTests !== actualIds.length)
    throw new Error('Vitest report counts do not match executed tests.');
  compareIds(expectedIds, actualIds, 'Vitest');
}

/** Extract Playwright IDs and validate executed statuses when required.
 * @param {object} report - Playwright JSON report.
 * @param {boolean} executed - Whether this is an execution report.
 * @returns {string[]} Test IDs.
 */
function playwrightIds(report, executed) {
  if (!report || !Array.isArray(report.suites) || !Array.isArray(report.errors))
    throw new Error('Invalid Playwright report.');
  if (report.errors.length) throw new Error('Playwright report contains runner errors.');
  const ids = [];
  const visit = (suite) => {
    if (!Array.isArray(suite.specs) && !Array.isArray(suite.suites))
      throw new Error('Incomplete Playwright suite.');
    for (const spec of suite.specs ?? []) {
      if (!spec.id || !spec.file || !Array.isArray(spec.tests) || !spec.tests.length)
        throw new Error('Incomplete Playwright spec.');
      for (const test of spec.tests) {
        if (!test.projectName || test.expectedStatus !== 'passed')
          throw new Error(`Playwright ${spec.file}: ${spec.title} is skipped or has no project.`);
        if (
          executed &&
          (test.status !== 'expected' ||
            !Array.isArray(test.results) ||
            !test.results.length ||
            test.results.some((result) => result.status !== 'passed'))
        )
          throw new Error(
            `Playwright ${spec.file}: ${spec.title} (${test.projectName}) is ${test.status} or incomplete.`
          );
        ids.push(JSON.stringify([spec.file, spec.id, test.projectName]));
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites) visit(suite);
  return ids;
}

/** Validate Playwright execution against a fresh runner inventory.
 * @param {object} report - Execution report.
 * @param {object} expected - Playwright list report.
 * @returns {void}
 */
export function validatePlaywrightReport(report, expected) {
  const expectedIds = playwrightIds(expected, false);
  const actualIds = playwrightIds(report, true);
  if (
    !report.stats ||
    report.stats.expected !== actualIds.length ||
    report.stats.skipped !== 0 ||
    report.stats.unexpected !== 0 ||
    report.stats.flaky !== 0
  )
    throw new Error('Playwright report counts or statuses are incomplete.');
  compareIds(expectedIds, actualIds, 'Playwright');
}
