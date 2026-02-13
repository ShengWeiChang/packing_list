/*
================================================================================
File: tests/test-setup/domMocks.js
Description: Shared DOM mock helpers for component tests.
             Centralizes getBoundingClientRect and requestAnimationFrame mocks
             used across multiple test files.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

import { vi } from 'vitest';

// -----------------------------------------------------------------------------
// Default DOMRect values
// -----------------------------------------------------------------------------

const DEFAULT_RECT = {
  top: 100,
  left: 100,
  right: 200,
  bottom: 140,
  width: 100,
  height: 40,
  x: 100,
  y: 100,
};

// -----------------------------------------------------------------------------
// Mock helpers
// -----------------------------------------------------------------------------

/**
 * Mock `Element.prototype.getBoundingClientRect` with a default or custom rect.
 * @param {Partial<DOMRect>} [overrides] - Optional overrides for specific rect values
 * @returns {import('vitest').Mock} The vi.fn() mock for further assertions
 */
export function mockGetBoundingClientRect(overrides = {}) {
  const rect = { ...DEFAULT_RECT, ...overrides };
  const mock = vi.fn(() => rect);
  Element.prototype.getBoundingClientRect = mock;
  return mock;
}

/**
 * Mock `requestAnimationFrame` to execute callbacks synchronously.
 * Useful for testing dropdown positioning that relies on rAF.
 */
export function mockRequestAnimationFrame() {
  vi.stubGlobal('requestAnimationFrame', (cb) => cb());
}
