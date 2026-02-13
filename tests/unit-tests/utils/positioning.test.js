/*
================================================================================
File: tests/unit-tests/utils/positioning.test.js
Description: Unit tests for positioning utilities.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

import { describe, expect, it } from 'vitest';

import { clampDropdownLeft, positionDropdownAbove } from '../../../source/utils/positioning';

describe('positioning utils', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Dropdown Positioning
  // ---------------------------------------------------------------------------

  // Test Case 1: Left clamping should respect minimum padding
  it('should clamp dropdown left within viewport padding', () => {
    const anchorRect = { left: 0, top: 200 };
    const dropdownRect = { width: 120, height: 100 };

    const left = clampDropdownLeft(anchorRect, dropdownRect, 320, { minPadding: 8 });
    expect(left).toBe(8);
  });

  // Test Case 2: Left clamping should respect maximum boundary
  it('should clamp dropdown left to max when near right edge', () => {
    const anchorRect = { left: 500, top: 200 };
    const dropdownRect = { width: 200, height: 100 };

    const left = clampDropdownLeft(anchorRect, dropdownRect, 600, { minPadding: 8 });
    expect(left).toBe(392); // maxLeft = 600 - 200 - 8 = 392
  });

  // Test Case 3: Position should include gap, zIndex, and clamped left
  it('should position dropdown above anchor with gap and zIndex', () => {
    const style = positionDropdownAbove(
      { left: 10, top: 200 },
      { width: 100, height: 50 },
      { width: 320 },
      { gap: 8, minPadding: 8 }
    );

    expect(style.position).toBe('fixed');
    expect(style.left).toBe('10px');
    expect(style.top).toBe('142px'); // 200 - 50 - 8
    expect(style.zIndex).toBe(9999);
  });
});
