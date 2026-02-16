/*
================================================================================
File: tests/setup/setup.js
Description: Vitest global setup - configures test environment with mocks for
             localStorage, crypto, and Vue Test Utils.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-05
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { config } from '@vue/test-utils';
import { afterEach, vi } from 'vitest';

// Mock i18n globally
config.global.mocks = {
  $t: (key) => key,
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 11),
  },
  writable: true,
  configurable: true,
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
