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

import { describe, expect, it } from 'vitest';

import { summarizePlaywrightFailures } from '../../../scripts/verify-feature.js';

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
});
