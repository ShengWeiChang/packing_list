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

import {
  insertAtVisibleIndex,
  renumberOrder,
  reorderVisibleSlots,
} from '../../../source/utils/order';

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

  // Test Case 3: Renumber should handle null/undefined input gracefully
  it('should return empty array for null or undefined input', () => {
    expect(renumberOrder(null)).toEqual([]);
    expect(renumberOrder(undefined)).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: filtered ordering
  // ---------------------------------------------------------------------------

  // Test Case 4: Should reorder visible entries within their original slots
  it('should reorder visible entries without moving hidden slots', () => {
    const items = [
      { id: '1', isPacked: true, order: 0 },
      { id: '2', isPacked: false, order: 1 },
      { id: '3', isPacked: true, order: 2 },
      { id: '4', isPacked: false, order: 3 },
      { id: '5', isPacked: true, order: 4 },
    ];

    const result = reorderVisibleSlots(items, [items[3], items[1]], (item) => !item.isPacked);

    expect(result.map((item) => item.id)).toEqual(['1', '4', '3', '2', '5']);
    expect(result.map((item) => item.order)).toEqual([0, 1, 2, 3, 4]);
    expect(items.map((item) => item.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  // Test Case 5: Should leave complete order unchanged for an invalid visible set
  it('should keep complete order when visible entries do not match', () => {
    const items = [
      { id: '1', isPacked: false, order: 4 },
      { id: '2', isPacked: true, order: 9 },
    ];

    const result = reorderVisibleSlots(items, [], (item) => !item.isPacked);

    expect(result.map((item) => item.id)).toEqual(['1', '2']);
    expect(result.map((item) => item.order)).toEqual([0, 1]);
  });

  // Test Case 6: Should insert before the visible anchor while preserving hidden entries
  it('should insert at a visible position in the complete order', () => {
    const items = [
      { id: '4', isPacked: false, order: 0 },
      { id: '5', isPacked: true, order: 1 },
      { id: '6', isPacked: false, order: 2 },
    ];

    const result = insertAtVisibleIndex(
      items,
      { id: '1', isPacked: false, order: 0 },
      1,
      (item) => !item.isPacked
    );

    expect(result.map((item) => item.id)).toEqual(['4', '5', '1', '6']);
    expect(result.map((item) => item.order)).toEqual([0, 1, 2, 3]);
  });

  // Test Case 7: Should append after the complete list at the visible end
  it('should append at the complete end when dropped after all visible entries', () => {
    const items = [
      { id: '4', isPacked: false, order: 0 },
      { id: '5', isPacked: true, order: 1 },
    ];

    const result = insertAtVisibleIndex(
      items,
      { id: '1', isPacked: false, order: 0 },
      1,
      (item) => !item.isPacked
    );

    expect(result.map((item) => item.id)).toEqual(['4', '5', '1']);
  });

  // Test Case 8: Should append when the target has no visible entries
  it('should append when every target entry is hidden', () => {
    const items = [{ id: '4', isPacked: true, order: 0 }];

    const result = insertAtVisibleIndex(
      items,
      { id: '1', isPacked: false, order: 0 },
      0,
      (item) => !item.isPacked
    );

    expect(result.map((item) => item.id)).toEqual(['4', '1']);
  });
});
