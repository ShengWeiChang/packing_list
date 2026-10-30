/*
================================================================================
File: tests/unit-tests/scripts/verifyFeature.test.js
Description: Unit tests for feature-verification report diagnostics.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-24
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import process from 'node:process';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  runFeatureVerification,
  summarizePlaywrightFailures,
} from '../../../scripts/verify-feature.js';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal();
  const exec = vi.fn();
  return { ...actual, execFileSync: exec, default: { ...actual.default, execFileSync: exec } };
});
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  const methods = { mkdirSync: vi.fn(), writeFileSync: vi.fn() };
  return { ...actual, ...methods, default: { ...actual.default, ...methods } };
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(execFileSync).mockReset();
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('verify-feature report diagnostics', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Playwright failure summaries
  // ---------------------------------------------------------------------------

  // Test Case 1: Should summarize and deduplicate Playwright failures
  it('should summarize Playwright failures without ANSI formatting', () => {
    const report = {
      suites: [
        {
          specs: [
            {
              file: 'tests/end2end-tests/recommended-lists.spec.js',
              tests: [
                {
                  results: [
                    {
                      errors: [
                        {
                          location: {
                            file: 'tests/end2end-tests/recommended-lists.spec.js',
                            line: 29,
                            column: 29,
                          },
                          message: '\u001B[31mError:\u001B[39m expected compact source name',
                        },
                      ],
                    },
                    {
                      errors: [
                        {
                          location: {
                            file: 'tests/end2end-tests/recommended-lists.spec.js',
                            line: 29,
                            column: 29,
                          },
                          message: '\u001B[31mError:\u001B[39m expected compact source name',
                        },
                      ],
                    },
                  ],
                },
              ],
              suites: [],
            },
          ],
          suites: [],
        },
      ],
    };

    expect(summarizePlaywrightFailures(report)).toBe(
      'Playwright failure summary:\n' +
        '- tests/end2end-tests/recommended-lists.spec.js:29:29 — Error: expected compact source name'
    );
  });

  // Test Case 2: Should explain when a report has no individual failure details
  it('should report missing individual errors', () => {
    expect(summarizePlaywrightFailures({ suites: [] })).toBe(
      'Playwright failed, but its JSON report contained no individual test errors.'
    );
  });

  // Test Case 3: Should summarize a runner failure before tests begin
  it('should summarize top-level Playwright runner failures', () => {
    expect(
      summarizePlaywrightFailures({
        errors: [
          { message: 'Error: Process from config.webServer was not able to start. Exit code: 1' },
        ],
        suites: [],
      })
    ).toBe(
      'Playwright failure summary:\n' +
        '- Playwright runner — Error: Process from config.webServer was not able to start. Exit code: 1'
    );
  });

  // Test Group 2: Type checking in the feature gate
  // Test Case 4: Run type checking before runtime tests and report it as executed
  it('checks types before tests and includes the layer in its success summary', () => {
    vi.mocked(execFileSync).mockReturnValue('');
    const output = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    runFeatureVerification();
    const argumentsList = vi.mocked(execFileSync).mock.calls.map(([, args]) => args);
    expect(argumentsList[2]).toEqual(['run', 'typecheck']);
    expect(argumentsList[3][1]).toBe('run');
    expect(argumentsList[3]).toContain('--coverage');
    expect(output.mock.calls.map(([message]) => message).join('')).toContain('npm run typecheck');
  });

  // Test Case 5: Stop the gate when type checking fails rather than running later layers
  it('stops before runtime tests when type checking fails', () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.mocked(execFileSync).mockImplementation((_command, args) => {
      if (args.includes('typecheck')) throw new Error('Type error');
      return '';
    });
    expect(() => runFeatureVerification()).toThrow(
      'Check application types and compiler contracts failed'
    );
    expect(execFileSync).toHaveBeenCalledTimes(3);
  });
});
