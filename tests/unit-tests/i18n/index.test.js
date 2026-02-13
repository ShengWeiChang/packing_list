/*
================================================================================
File: tests/unit-tests/i18n/index.test.js
Description: Unit tests for i18n locale detection and persistence.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-12
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Dynamically load the i18n module after resetting module cache.
 * @returns {Promise<typeof import('../../../source/i18n/index.js')>} Loaded i18n module.
 */
async function loadI18nModule() {
  vi.resetModules();
  return import('../../../source/i18n/index.js');
}

// -----------------------------------------------------------------------------
// i18n Tests
// -----------------------------------------------------------------------------

describe('i18n locale selection and persistence', () => {
  let mockStorage;
  let getItemSpy;
  let setItemSpy;
  let originalLanguagesDescriptor;
  let originalLanguageDescriptor;

  // ---------------------------------------------------------------------------
  // Test Setup and Teardown
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    mockStorage = {};

    getItemSpy = vi.spyOn(globalThis.localStorage, 'getItem').mockImplementation((key) => {
      return mockStorage[key] || null;
    });
    setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value;
    });

    originalLanguagesDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'languages');
    originalLanguageDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'language');

    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['en-US'],
    });
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'en-US',
    });
  });

  afterEach(() => {
    if (originalLanguagesDescriptor) {
      Object.defineProperty(window.navigator, 'languages', originalLanguagesDescriptor);
    }

    if (originalLanguageDescriptor) {
      Object.defineProperty(window.navigator, 'language', originalLanguageDescriptor);
    }

    getItemSpy?.mockRestore();
    setItemSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Initial Locale Detection
  // ---------------------------------------------------------------------------

  // Test Case 1: Should use saved locale from localStorage
  it('should use saved locale when it is supported', async () => {
    mockStorage['user-locale'] = 'zh-TW';

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
  });

  // Test Case 2: Should map Traditional Chinese variants to zh-TW and persist
  it('should map zh-HK browser language to zh-TW and persist initial locale', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['zh-HK', 'en-US'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
    expect(setItemSpy).toHaveBeenCalledWith('user-locale', 'zh-TW');
  });

  // Test Case 3: Should fallback to en for unsupported browser language
  it('should fallback to en for unsupported browser language', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['fr-FR'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('en');
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Locale Update and Guard Behavior
  // ---------------------------------------------------------------------------

  // Test Case 4: Should persist locale when setLocale receives supported value
  it('should persist locale when setLocale receives a supported value', async () => {
    const { getLocale, setLocale } = await loadI18nModule();

    setLocale('zh-TW');

    expect(getLocale()).toBe('zh-TW');
    expect(setItemSpy).toHaveBeenCalledWith('user-locale', 'zh-TW');
  });

  // Test Case 5: Should reject unsupported locale values
  it('should ignore unsupported setLocale values and keep current locale', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getLocale, setLocale } = await loadI18nModule();

    setLocale('fr');

    expect(getLocale()).toBe('en');
    expect(warnSpy).toHaveBeenCalled();
  });
});
