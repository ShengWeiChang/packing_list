/*
================================================================================
File: tests/unit-tests/utils/order.test.js
Description: Unit tests for order utilities.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

import { describe, expect, it } from 'vitest';

import { renumberOrder } from '../../../source/utils/order';

describe('order utils', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: renumberOrder
  // ---------------------------------------------------------------------------

  // Test Case 1: Renumber should assign sequential order starting from 0
  it('should renumber order based on array index', () => {
    const items = [
      { id: 'a', order: 10 },
      { id: 'b', order: 11 },
    ];

    const result = renumberOrder(items);

    expect(result).toEqual([
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
    ]);
  });

  // Test Case 2: Renumber should support custom start offset
  it('should support custom start offset', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

    const result = renumberOrder(items, { start: 5 });

    expect(result.map((x) => x.order)).toEqual([5, 6, 7]);
  });
});
