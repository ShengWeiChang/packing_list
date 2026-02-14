/*
================================================================================
File: tests/unit-tests/utils/helpers.test.js
Description: Unit tests for helper utility functions.
             Tests date formatting, ID generation, percentage calculation,
             deep cloning, and debounce.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-05
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  calculatePercentage,
  debounce,
  deepClone,
  formatDate,
  generateSecureId,
} from '../../../source/utils/helpers';

// -----------------------------------------------------------------------------
// Helper Functions Tests
// -----------------------------------------------------------------------------

describe('helpers', () => {
  const DEBOUNCE_WAIT_MS = 100;

  // ---------------------------------------------------------------------------
  // Test Group 1: generateSecureId
  // ---------------------------------------------------------------------------

  describe('generateSecureId', () => {
    // Test Case 1: Should generate ID with empty prefix when called without args
    it('should generate ID with empty prefix when called without args', () => {
      const id = generateSecureId();

      // When called without args, prefix is empty string
      expect(id).toEqual(expect.any(String));
      expect(id.length).toBeGreaterThan(0);
    });

    // Test Case 2: Should generate ID with custom prefix
    it('should generate ID with custom prefix', () => {
      const id = generateSecureId('item-');

      expect(id).toMatch(/^item-/);
    });

    // Test Case 3: Should generate unique IDs
    it('should generate unique IDs', () => {
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        ids.add(generateSecureId());
      }

      expect(ids.size).toBe(100);
    });

    // Test Case 4: Should generate IDs of consistent length
    it('should generate IDs of consistent length', () => {
      const id1 = generateSecureId('test-');
      const id2 = generateSecureId('test-');

      expect(id1.length).toBe(id2.length);
    });

    // Test Case 5: Should fallback when crypto is unavailable
    it('should fallback to Date.now/Math.random when crypto is unavailable', () => {
      const originalCrypto = globalThis.crypto;

      // Remove crypto
      // (setup.js makes this configurable)

      globalThis.crypto = undefined;

      const id = generateSecureId('fallback-');
      expect(id).toMatch(/^fallback-/);

      // Restore
      globalThis.crypto = originalCrypto;
    });

    // Test Case 6: Should fallback when crypto.randomUUID throws
    it('should fallback when crypto.randomUUID throws', () => {
      const originalCrypto = globalThis.crypto;

      Object.defineProperty(globalThis, 'crypto', {
        value: {
          randomUUID: () => {
            throw new Error('randomUUID failed');
          },
        },
        writable: true,
        configurable: true,
      });

      const id = generateSecureId('fallback-');
      expect(id).toMatch(/^fallback-/);

      // Restore
      globalThis.crypto = originalCrypto;
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: formatDate
  // ---------------------------------------------------------------------------

  describe('formatDate', () => {
    // Test Case 7: Should format date string correctly
    it('should format date string correctly', () => {
      const formatted = formatDate('2026-03-15');

      expect(formatted).toMatch(/2026/);
      expect(formatted).toMatch(/3|03|Mar/i);
      expect(formatted).toMatch(/15|14|16/);
    });

    // Test Case 8: Should handle null date (returns epoch date)
    it('should handle null date (returns epoch date)', () => {
      const formatted = formatDate(null);

      // Date(null) = epoch = December 31, 1969 in local timezone
      expect(formatted).toMatch(/December 31, 1969/);
    });

    // Test Case 9: Should handle undefined date (returns Invalid Date)
    it('should handle undefined date (returns Invalid Date)', () => {
      const formatted = formatDate(undefined);

      expect(formatted).toBe('Invalid Date');
    });

    // Test Case 10: Should handle empty string (returns Invalid Date)
    it('should handle empty string (returns Invalid Date)', () => {
      const formatted = formatDate('');

      expect(formatted).toBe('Invalid Date');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: calculatePercentage
  // ---------------------------------------------------------------------------

  describe('calculatePercentage', () => {
    // Test Case 11: Should calculate percentage correctly
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 4)).toBe(25);
    });

    // Test Case 12: Should return 0 when total is 0
    it('should return 0 when total is 0', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    // Test Case 13: Should handle 100%
    it('should handle 100%', () => {
      expect(calculatePercentage(100, 100)).toBe(100);
      expect(calculatePercentage(5, 5)).toBe(100);
    });

    // Test Case 14: Should round to integer
    it('should round to integer', () => {
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(2, 3)).toBe(67);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: deepClone
  // ---------------------------------------------------------------------------

  describe('deepClone', () => {
    // Test Case 15: Should clone primitive values
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    // Test Case 16: Should deep clone objects
    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    // Test Case 17: Should deep clone arrays
    it('should deep clone arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
      expect(cloned[2]).not.toBe(original[2]);
    });

    // Test Case 18: Modifying clone should not affect original
    it('should not affect original when modifying clone', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      cloned.a = 999;
      cloned.b.c = 888;

      expect(original.a).toBe(1);
      expect(original.b.c).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: debounce
  // ---------------------------------------------------------------------------

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Test Case 19: Should delay function execution
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, DEBOUNCE_WAIT_MS);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(DEBOUNCE_WAIT_MS);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    // Test Case 20: Should only execute once for rapid calls
    it('should only execute once for rapid calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, DEBOUNCE_WAIT_MS);

      debouncedFn();
      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(DEBOUNCE_WAIT_MS);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    // Test Case 21: Should pass arguments to debounced function
    it('should pass arguments to debounced function', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, DEBOUNCE_WAIT_MS);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(DEBOUNCE_WAIT_MS);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
