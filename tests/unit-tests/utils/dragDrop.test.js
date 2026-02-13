/*
================================================================================
File: tests/unit-tests/utils/dragDrop.test.js
Description: Unit tests for drag-and-drop helpers.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

import { describe, expect, it } from 'vitest';

import { putOnlyFromGroup } from '../../../source/utils/dragDrop';

describe('dragDrop utils', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: vuedraggable put guard
  // ---------------------------------------------------------------------------

  // Test Case 1: Put guard should accept drops from specified group
  it('should allow drops only from the specified group name', () => {
    const guard = putOnlyFromGroup('items');

    const fromItems = { options: { group: { name: 'items' } } };
    const fromCategories = { options: { group: { name: 'categories' } } };

    expect(guard(null, fromItems, null, null)).toBe(true);
    expect(guard(null, fromCategories, null, null)).toBe(false);
  });

  // Test Case 2: Put guard should reject drops when group info is missing
  it('should return false when from group is missing', () => {
    const guard = putOnlyFromGroup('items');

    expect(guard(null, {}, null, null)).toBe(false);
    expect(guard(null, null, null, null)).toBe(false);
  });
});
