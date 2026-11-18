/** Summarize executed browser cases separately from their project executions.
 * @param {Array<{filePath: string, caseKey: string, count: number}>} records - Executed specs.
 * @returns {Array<{filePath: string, count: number, uniqueCaseCount: number}>} Per-file totals.
 */
export function summarizePlaywrightCases(records) {
  const files = new Map();
  for (const { filePath, caseKey, count } of records) {
    if (!files.has(filePath)) files.set(filePath, { count: 0, cases: new Set() });
    const file = files.get(filePath);
    file.count += count;
    file.cases.add(caseKey);
  }
  return [...files].map(([filePath, value]) => ({
    filePath,
    count: value.count,
    uniqueCaseCount: value.cases.size,
  }));
}
