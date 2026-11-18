/* Stable cross-browser expectations, independent of Playwright's discovered list. */
export const CORE_SMOKE_CASES = [
  ['checklist-dates.spec.js', 'edits labeled dates and confirms changes at 320px in en'],
  ['checklist-dates.spec.js', 'edits labeled dates and confirms changes at 1280px in en'],
  ['core-smoke.spec.js', 'creates, edits, packs and deletes a persisted item'],
  ['drag-and-drop.spec.js', 'should reorder items within a category by drag-and-drop'],
  ['rwd-overlays.spec.js', 'bottom popup fits and keyboard can activate and dismiss it'],
  [
    'storage-recovery.spec.js',
    'keeps a checklist draft after a real storage failure and saves it on retry',
  ],
];

export const RWD_CASES = [
  'WebKit touch actions persist and drawer dismisses accessibly',
  'WebKit short dialogs and date fields fit the narrow viewport',
  'WebKit tablet columns retain visible touch actions',
  'WebKit short mobile sidebar keeps navigation reachable',
].map((title) => ['rwd-webkit.spec.js', title]);

/** Verify stable named core and RWD cases were actually executed in both engines.
 * @param {object} report - Complete executed Playwright JSON report.
 * @returns {void}
 */
export function validateCoreSmokeCoverage(report) {
  if (!report || !Array.isArray(report.suites)) throw new Error('Missing Playwright suites.');
  const seen = new Map();
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const result of spec.tests ?? []) {
        const key = JSON.stringify([result.projectName, spec.file, spec.title]);
        const entries = seen.get(key) ?? [];
        entries.push({ result, tags: spec.tags ?? [] });
        seen.set(key, entries);
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites) visit(suite);
  const coreKeys = new Set(
    CORE_SMOKE_CASES.flatMap(([file, title]) =>
      ['chromium', 'webkit-core'].map((project) => JSON.stringify([project, file, title]))
    )
  );
  const rwdKeys = new Set(
    RWD_CASES.map(([file, title]) => JSON.stringify(['webkit-rwd', file, title]))
  );
  for (const [key, entries] of seen) {
    const [project] = JSON.parse(key);
    if (
      ((project === 'chromium' && entries.some(({ tags }) => tags.includes('core-smoke'))) ||
        project === 'webkit-core') &&
      !coreKeys.has(key)
    )
      throw new Error(`Unexpected core smoke case: ${key}`);
    if (project === 'webkit-rwd' && !rwdKeys.has(key))
      throw new Error(`Unexpected WebKit RWD case: ${key}`);
  }
  for (const [cases, projects, tag] of [
    [CORE_SMOKE_CASES, ['chromium', 'webkit-core'], 'core-smoke'],
    [RWD_CASES, ['chromium', 'webkit-rwd'], null],
  ]) {
    for (const project of projects) {
      for (const [file, title] of cases) {
        const key = JSON.stringify([project, file, title]);
        const entries = seen.get(key) ?? [];
        if (entries.length !== 1)
          throw new Error(`Required browser case missing or duplicate: ${key}`);
        const { result, tags } = entries[0];
        if (tag && !tags.includes(tag)) throw new Error(`Required core tag missing: ${key}`);
        if (
          result.expectedStatus !== 'passed' ||
          result.status !== 'expected' ||
          !result.results?.length ||
          result.results.some((attempt) => attempt.status !== 'passed')
        )
          throw new Error(`Required browser case did not pass cleanly: ${key}`);
      }
    }
  }
}
