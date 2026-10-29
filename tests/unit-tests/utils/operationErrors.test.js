/*
================================================================================
File: tests/unit-tests/utils/operationErrors.test.js
Description: Unknown failures translated at the reactive operation boundary.
License: MIT (SPDX: MIT)
================================================================================
*/

import { describe, expect, it } from 'vitest';

import { StorageError } from '../../../source/services/storageTransaction';
import { describeOperationError } from '../../../source/utils/operationErrors';

describe('operation failure reporting', () => {
  // Test Group 1: Supported Failures and Safe Fallbacks

  // Test Case 1: Preserve diagnostic messages on ordinary errors.
  it('preserves ordinary error messages and uses the unavailable fallback', () => {
    expect(describeOperationError(new Error('Offline'))).toEqual({
      code: 'unavailable',
      message: 'Offline',
    });
  });

  // Test Case 2: Preserve each supported storage category, including error-like records.
  it('preserves storage categories on service errors and error-like records', () => {
    for (const code of [
      'unavailable',
      'corrupt',
      'unsupported',
      'quota',
      'lock-unavailable',
      'conflict',
    ]) {
      expect(describeOperationError(new StorageError(code, 'Failure'))).toEqual({
        code,
        message: 'Failure',
      });
      expect(describeOperationError({ code, message: 'Failure' })).toEqual({
        code,
        message: 'Failure',
      });
    }
  });

  // Test Case 3: Unknown thrown values never become an unsupported public error category.
  it('handles unknown failures without trusting arbitrary codes', () => {
    for (const failure of [
      null,
      undefined,
      'Offline',
      22,
      Symbol('failure'),
      { code: 22 },
      { code: 'unknown' },
    ]) {
      expect(describeOperationError(failure)).toEqual({ code: 'unavailable', message: undefined });
    }
  });
});
