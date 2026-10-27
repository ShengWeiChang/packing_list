/*
================================================================================
File: scripts/check-doc-pairs.js
Description: Check structural invariants shared by tracked English and
             Traditional Chinese documentation pairs.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-21
================================================================================
*/

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const DOCUMENT_PAIRS = [
  ['docs/assets.md', 'docs/assets-zh.md'],
  ['docs/product-spec.md', 'docs/product-spec-zh.md'],
  ['docs/code-quality.md', 'docs/code-quality-zh.md'],
  ['docs/testing-guide.md', 'docs/testing-guide-zh.md'],
];

/**
 * Read a project-relative document as individual lines.
 * @param {string} filePath - Project-relative document path.
 * @returns {string[]} Document lines.
 */
function readLines(filePath) {
  return readFileSync(resolve(PROJECT_ROOT, filePath), 'utf8').split('\n');
}

/**
 * Extract the heading levels in document order.
 * @param {string[]} lines - Document lines.
 * @returns {number[]} Markdown heading levels.
 */
function getHeadingLevels(lines) {
  return lines.flatMap((line) => {
    const match = /^(#{1,6})\s+/.exec(line);
    return match ? [match[1].length] : [];
  });
}

/**
 * Extract fenced-code delimiters in document order.
 * @param {string[]} lines - Document lines.
 * @returns {string[]} Fenced-code delimiters.
 */
function getCodeFences(lines) {
  return lines.filter((line) => /^```/.test(line));
}

/**
 * Extract inline code that represents a shell command.
 * @param {string[]} lines - Document lines.
 * @returns {string[]} Sorted command tokens.
 */
function getTechnicalInlineCode(lines) {
  const tokens = new Set();
  let insideCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      insideCodeFence = !insideCodeFence;
      continue;
    }

    if (insideCodeFence) continue;

    for (const match of line.matchAll(/`([^`]+)`/g)) {
      const token = match[1];
      if (/^(?:npm|npx|node|git)\b/.test(token)) {
        tokens.add(token);
      }
    }
  }

  return [...tokens].sort();
}

/**
 * Return invariant errors for one tracked document pair.
 * @param {string} englishPath - English document path.
 * @param {string} chinesePath - Traditional Chinese document path.
 * @returns {string[]} Pair validation errors.
 */
function getPairErrors(englishPath, chinesePath) {
  const englishLines = readLines(englishPath);
  const chineseLines = readLines(chinesePath);
  const englishHeadings = getHeadingLevels(englishLines);
  const chineseHeadings = getHeadingLevels(chineseLines);
  const englishFences = getCodeFences(englishLines);
  const chineseFences = getCodeFences(chineseLines);
  const englishTechnicalCode = getTechnicalInlineCode(englishLines);
  const chineseTechnicalCode = getTechnicalInlineCode(chineseLines);
  const errors = [];

  if (englishLines.length !== chineseLines.length) {
    errors.push(`${englishPath} and ${chinesePath} must have the same line count.`);
  }

  if (englishHeadings.join(',') !== chineseHeadings.join(',')) {
    errors.push(`${englishPath} and ${chinesePath} must have matching heading hierarchy.`);
  }

  if (englishFences.join('\n') !== chineseFences.join('\n')) {
    errors.push(`${englishPath} and ${chinesePath} must have matching code-fence structure.`);
  }

  if (englishTechnicalCode.some((command) => !chineseTechnicalCode.includes(command))) {
    errors.push(`${chinesePath} must preserve every inline command listed in ${englishPath}.`);
  }

  return errors;
}

const errors = DOCUMENT_PAIRS.flatMap(([englishPath, chinesePath]) =>
  getPairErrors(englishPath, chinesePath)
);

if (errors.length > 0) {
  console.error('Documentation pair check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Documentation pair check passed: ${DOCUMENT_PAIRS.length} pairs.\n`);
}
