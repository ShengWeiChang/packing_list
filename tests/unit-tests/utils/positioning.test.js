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

import {
  clampDropdownLeft,
  positionDropdownAbove,
  positionDropdownWithinViewport,
} from '../../../source/utils/positioning';

describe('positioning utils', () => {
  // Test Case 4: Bottom-edge and tall menus stay inside the visible viewport.
  it('fits bottom-edge and oversized menus inside an offset visual viewport', () => {
    const viewport = { left: 10, top: 40, width: 320, height: 300 };
    const anchor = { right: 320, top: 300, bottom: 324 };
    const style = positionDropdownWithinViewport(anchor, { width: 160, height: 120 }, viewport);
    expect(style.top).toBe('174px');
    expect(style.left).toBe('160px');
    const tall = positionDropdownWithinViewport(anchor, { width: 160, height: 600 }, viewport);
    expect(tall.top).toBe('48px');
    expect(tall.maxHeight).toBe('246px');
    expect(tall.overflowY).toBe('auto');
    const short = positionDropdownWithinViewport(
      { right: 220, top: 80, bottom: 130 },
      { width: 160, height: 400 },
      { left: 0, top: 0, width: 320, height: 200 },
      80
    );
    expect(short.top).toBe('8px');
    expect(short.maxHeight).toBe('184px');
  });
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
