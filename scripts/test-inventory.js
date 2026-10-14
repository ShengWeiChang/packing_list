/*
================================================================================
File: scripts/test-inventory.js
Description: Execute Vitest and Playwright, then verify test comments and guide
             inventory against their real results. Use --write to sync counts.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import process from 'node:process';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const TEMP_PREFIX = join(tmpdir(), 'packing-list-test-inventory-');
const TEST_GUIDES = ['docs/testing-guide.md', 'docs/testing-guide-zh.md'];
const WRITE_MODE = process.argv.includes('--write');

// -----------------------------------------------------------------------------
// Test Execution
// -----------------------------------------------------------------------------

/**
 * Execute a command and preserve its output when it fails.
 * @param {string} command - Executable command.
 * @param {string[]} args - Command arguments.
 * @returns {string} Standard output from the successful command.
 */
function runCommand(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${command} ${args.join(' ')} failed.\n${output}`);
  }
}

/**
 * Run Vitest once and return its JSON result.
 * @param {string} reportDirectory - Temporary directory for the JSON report.
 * @returns {object} Vitest JSON report.
 */
function runVitest(reportDirectory) {
  const reportPath = join(reportDirectory, 'vitest.json');
  const vitestPath = join(PROJECT_ROOT, 'node_modules', 'vitest', 'vitest.mjs');

  runCommand(process.execPath, [vitestPath, 'run', '--reporter=json', '--outputFile', reportPath]);

  if (!existsSync(reportPath)) {
    throw new Error('Vitest completed without writing its JSON report.');
  }

  return JSON.parse(readFileSync(reportPath, 'utf8'));
}

/**
 * Run every Playwright test once and return its JSON result.
 * @returns {object} Playwright JSON report.
 */
function runPlaywright() {
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const output = runCommand(npxCommand, ['playwright', 'test', '--reporter=json']);
  return JSON.parse(output);
}

// -----------------------------------------------------------------------------
// Result Parsing
// -----------------------------------------------------------------------------

/**
 * Determine the documentation layer for a test file.
 * @param {string} filePath - Absolute or project-relative test file path.
 * @returns {'unit' | 'component' | 'e2e'} Test layer.
 */
function getLayer(filePath) {
  const normalizedPath = `/${filePath.replaceAll('\\', '/').replace(/^\/+/, '')}`;

  if (normalizedPath.includes('/tests/unit-tests/')) return 'unit';
  if (normalizedPath.includes('/tests/component-tests/')) return 'component';
  if (normalizedPath.includes('/tests/end2end-tests/')) return 'e2e';

  throw new Error(`Cannot determine test layer for ${filePath}.`);
}

/**
 * Normalize an absolute or project-relative path into a project-relative path.
 * @param {string} filePath - File path from a test reporter.
 * @returns {string} Project-relative path.
 */
function toProjectRelativePath(filePath) {
  const absolutePath = filePath.startsWith('/') ? filePath : resolve(PROJECT_ROOT, filePath);
  return relative(PROJECT_ROOT, absolutePath).replaceAll('\\', '/');
}

/**
 * Normalize a Playwright report path, which is relative to its configured root.
 * @param {string} filePath - File path from Playwright JSON output.
 * @param {string} testRoot - Absolute Playwright test root.
 * @returns {string} Project-relative path.
 */
function toPlaywrightProjectPath(filePath, testRoot) {
  const absolutePath = filePath.startsWith('/') ? filePath : resolve(testRoot, filePath);
  return toProjectRelativePath(absolutePath);
}

/**
 * Convert Vitest test results into per-file inventory records.
 * @param {object} report - Vitest JSON report.
 * @returns {Array<{filePath: string, layer: string, count: number}>} File records.
 */
function collectVitestRecords(report) {
  if (!report.success) {
    throw new Error('Vitest reported one or more failed tests.');
  }

  return report.testResults.map((result) => {
    const filePath = toProjectRelativePath(result.name);

    return {
      filePath,
      layer: getLayer(filePath),
      count: result.assertionResults.length,
    };
  });
}

/**
 * Recursively collect Playwright specs from a JSON report suite.
 * @param {object} suite - Playwright JSON suite.
 * @param {Array<{filePath: string, layer: string, count: number}>} records - Destination records.
 * @param {string} testRoot - Absolute Playwright test root.
 * @returns {void}
 */
function collectPlaywrightSuite(suite, records, testRoot) {
  for (const spec of suite.specs ?? []) {
    const filePath = toPlaywrightProjectPath(spec.file ?? suite.file, testRoot);
    const count = spec.tests.filter((test) => test.status !== 'skipped').length;
    records.push({ filePath, layer: getLayer(filePath), count });
  }

  for (const nestedSuite of suite.suites ?? []) {
    collectPlaywrightSuite(nestedSuite, records, testRoot);
  }
}

/**
 * Convert Playwright results into one combined record per test file.
 * @param {object} report - Playwright JSON report.
 * @returns {Array<{filePath: string, layer: string, count: number}>} File records.
 */
function collectPlaywrightRecords(report) {
  if (report.errors.length > 0 || report.stats.unexpected > 0 || report.stats.flaky > 0) {
    throw new Error('Playwright reported failed, flaky, or infrastructure-error tests.');
  }

  const specRecords = [];
  for (const suite of report.suites) {
    collectPlaywrightSuite(suite, specRecords, report.config.rootDir);
  }

  const totals = new Map();
  for (const record of specRecords) {
    totals.set(record.filePath, (totals.get(record.filePath) ?? 0) + record.count);
  }

  return [...totals].map(([filePath, count]) => ({ filePath, layer: getLayer(filePath), count }));
}

// -----------------------------------------------------------------------------
// Inventory Validation
// -----------------------------------------------------------------------------

/**
 * Collect all explicit Test Case numbers and inclusive ranges from a test file.
 * @param {string} source - Test file contents.
 * @returns {number[]} Sorted unique case numbers.
 */
function getCommentCaseNumbers(source) {
  const caseNumbers = new Set();
  const pattern = /\/\/\s*Test Cases?\s+(\d+)(?:\s*[–-]\s*(\d+))?\s*:/gi;

  for (const match of source.matchAll(pattern)) {
    const start = Number(match[1]);
    const end = Number(match[2] ?? start);

    for (let number = start; number <= end; number += 1) {
      caseNumbers.add(number);
    }
  }

  return [...caseNumbers].sort((left, right) => left - right);
}

/**
 * Return comment-numbering issues for a test inventory record.
 * @param {{filePath: string, count: number}} record - Actual test record.
 * @returns {string[]} Validation errors.
 */
function getCommentErrors(record) {
  const source = readFileSync(join(PROJECT_ROOT, record.filePath), 'utf8');
  const commentNumbers = getCommentCaseNumbers(source);
  const expectedNumbers = Array.from({ length: record.count }, (_, index) => index + 1);

  if (commentNumbers.join(',') === expectedNumbers.join(',')) {
    return [];
  }

  return [
    `${record.filePath}: Test Case comments cover ${commentNumbers.length} cases; expected 1-${record.count}.`,
  ];
}

/**
 * Create a comparison key that distinguishes duplicate basenames across layers.
 * @param {{filePath: string, layer: string, count: number}} record - Test record.
 * @returns {string} Stable inventory key.
 */
function getRecordKey(record) {
  return `${record.layer}:${basename(record.filePath)}:${record.count}`;
}

/**
 * Parse inventory file headings from a testing guide.
 * @param {string} guide - Testing guide contents.
 * @returns {Array<{layer: string, fileName: string, count: number}>} Inventory headings.
 */
function getGuideInventoryHeadings(guide) {
  const headings = [];
  const pattern =
    /^#{3,5}\s+8\.(?<layer>[123])(?:\.\d+)+\s+.*?(?<fileName>[\w-]+\.(?:test|spec)\.js).*?[（(](?<count>\d+)(?:\s+tests)?[)）].*$/gm;

  for (const match of guide.matchAll(pattern)) {
    headings.push({
      layer: { 1: 'unit', 2: 'component', 3: 'e2e' }[match.groups.layer],
      fileName: match.groups.fileName,
      count: Number(match.groups.count),
    });
  }

  return headings;
}

/**
 * Read layer totals from the test records.
 * @param {Array<{layer: string, count: number}>} records - Test records.
 * @returns {{unit: number, component: number, e2e: number, total: number}} Layer totals.
 */
function getTotals(records) {
  const totals = { unit: 0, component: 0, e2e: 0, total: 0 };

  for (const record of records) {
    totals[record.layer] += record.count;
    totals.total += record.count;
  }

  return totals;
}

/**
 * Verify the documented order, file headings, and counts against actual results.
 * @param {string} guidePath - Project-relative guide path.
 * @param {Array<{filePath: string, layer: string, count: number}>} records - Actual test records.
 * @returns {string[]} Documentation validation errors.
 */
function getGuideErrors(guidePath, records) {
  const guide = readFileSync(join(PROJECT_ROOT, guidePath), 'utf8');
  const headings = getGuideInventoryHeadings(guide);
  const actualKeys = records.map(getRecordKey).sort();
  const documentedKeys = headings
    .map((heading) => `${heading.layer}:${heading.fileName}:${heading.count}`)
    .sort();
  const errors = [];

  const layerOrder = { unit: 1, component: 2, e2e: 3 };
  const hasOutOfOrderLayer = headings.some(
    (heading, index) =>
      index > 0 && layerOrder[heading.layer] < layerOrder[headings[index - 1].layer]
  );

  if (hasOutOfOrderLayer) {
    errors.push(`${guidePath}: inventory sections must be ordered Unit → Component → E2E.`);
  }

  if (actualKeys.join('|') !== documentedKeys.join('|')) {
    errors.push(`${guidePath}: inventory file headings or counts differ from executed tests.`);
  }

  return errors;
}

/**
 * Update only generated totals and file-heading counts in a testing guide.
 * @param {string} guide - Existing testing guide contents.
 * @param {Array<{filePath: string, layer: string, count: number}>} records - Actual test records.
 * @returns {string} Updated guide contents.
 */
function updateGuideCounts(guide, records) {
  const totals = getTotals(records);
  const recordsByLayerAndName = new Map(
    records.map((record) => [`${record.layer}:${basename(record.filePath)}`, record.count])
  );
  const totalLabels = [
    ['Total tests', totals.total],
    ['Unit tests', totals.unit],
    ['Component tests', totals.component],
    ['E2E tests', totals.e2e],
  ];
  let updatedGuide = guide;

  for (const [label, count] of totalLabels) {
    const pattern = new RegExp(`(\\|\\s*${label}[^|]*\\|\\s*)\\d+(\\s*\\|)`, 'g');
    updatedGuide = updatedGuide.replace(pattern, `$1${count}$2`);
  }

  for (const [layer, count] of Object.entries(totals)) {
    if (layer === 'total') continue;

    const label = layer[0].toUpperCase() + layer.slice(1);
    const pattern = new RegExp(`(\\|\\s*${label}\\s*\\|[^|]*\\|\\s*)\\d+(\\s*\\|)`, 'g');
    updatedGuide = updatedGuide.replace(pattern, `$1${count}$2`);
  }

  return updatedGuide.replace(
    /^(?<prefix>#{3,5}\s+8\.(?<layer>[123])(?:\.\d+)+\s+.*?(?<fileName>[\w-]+\.(?:test|spec)\.js).*?[（(])\d+(?<suffix>(?:\s+tests)?[)）].*)$/gm,
    (heading, _prefix, _layer, _fileName, _suffix, _offset, _source, groups) => {
      const layer = { 1: 'unit', 2: 'component', 3: 'e2e' }[groups.layer];
      const count = recordsByLayerAndName.get(`${layer}:${groups.fileName}`);
      return count === undefined ? heading : `${groups.prefix}${count}${groups.suffix}`;
    }
  );
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

/**
 * Execute the test inventory audit and return its exit code.
 * @returns {number} Process exit code.
 */
function main() {
  const reportDirectory = mkdtempSync(TEMP_PREFIX);

  try {
    const vitestReport = runVitest(reportDirectory);
    const playwrightReport = runPlaywright();
    const records = [
      ...collectVitestRecords(vitestReport),
      ...collectPlaywrightRecords(playwrightReport),
    ].sort((left, right) => left.filePath.localeCompare(right.filePath));
    const errors = records.flatMap(getCommentErrors);

    if (WRITE_MODE && errors.length === 0) {
      for (const guidePath of TEST_GUIDES) {
        const guidePathOnDisk = join(PROJECT_ROOT, guidePath);
        const updatedGuide = updateGuideCounts(readFileSync(guidePathOnDisk, 'utf8'), records);
        writeFileSync(guidePathOnDisk, updatedGuide);
      }
    }

    for (const guidePath of TEST_GUIDES) {
      errors.push(...getGuideErrors(guidePath, records));
    }

    if (errors.length > 0) {
      console.error('Test inventory audit failed:');
      for (const error of errors) console.error(`- ${error}`);
      return 1;
    }

    const totals = getTotals(records);
    process.stdout.write(
      `Test inventory audit passed: ${totals.unit} Unit + ${totals.component} Component + ${totals.e2e} E2E = ${totals.total} tests.\n`
    );
    return 0;
  } finally {
    rmSync(reportDirectory, { force: true, recursive: true });
  }
}

process.exitCode = main();
