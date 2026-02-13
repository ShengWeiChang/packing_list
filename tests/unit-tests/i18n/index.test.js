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
 *
 */
async function loadI18nModule() {
  vi.resetModules();
  return import('../../../source/i18n/index.js');
}

// -----------------------------------------------------------------------------
// i18n Tests
// -----------------------------------------------------------------------------

describe.skip('i18n locale selection and persistence', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value;
    });

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
    vi.restoreAllMocks();
  });

  it('should use saved locale when it is supported', async () => {
    mockStorage['user-locale'] = 'zh-TW';

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
  });

  it('should map zh-HK browser language to zh-TW and persist initial locale', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['zh-HK', 'en-US'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('user-locale', 'zh-TW');
  });

  it('should fallback to en for unsupported browser language', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['fr-FR'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('en');
  });

  it('should persist locale when setLocale receives a supported value', async () => {
    const { getLocale, setLocale } = await loadI18nModule();

    setLocale('zh-TW');

    expect(getLocale()).toBe('zh-TW');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('user-locale', 'zh-TW');
  });

  it('should ignore unsupported setLocale values and keep current locale', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getLocale, setLocale } = await loadI18nModule();

    setLocale('fr');

    expect(getLocale()).toBe('en');
    expect(warnSpy).toHaveBeenCalled();
  });
});
