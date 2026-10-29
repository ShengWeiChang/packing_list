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

import en from '../../../source/locales/en.json';
import zhTW from '../../../source/locales/zh-TW.json';

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

/**
 * Collect leaf translation keys from a locale object.
 * @param {object} messages - Locale messages
 * @param {string} [prefix] - Parent key path
 * @returns {Array<string>} Sorted leaf key paths
 */
function getTranslationKeys(messages, prefix = '') {
  return Object.entries(messages)
    .flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return value && typeof value === 'object' ? getTranslationKeys(value, path) : path;
    })
    .sort();
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

  // Test Case 2: Continue with a session locale when storage is denied.
  it('continues with a session locale when browser storage is denied', async () => {
    getItemSpy.mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    setItemSpy.mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const { getLocale, setLocale } = await loadI18nModule();

    expect(getLocale()).toBe('en');
    expect(() => setLocale('zh-TW')).not.toThrow();
    expect(getLocale()).toBe('zh-TW');
  });

  // Test Case 3: Should map Traditional Chinese variants to zh-TW and persist
  it('should map zh-HK browser language to zh-TW and persist initial locale', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['zh-HK', 'en-US'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
    expect(setItemSpy).toHaveBeenCalledWith('user-locale', 'zh-TW');
  });

  // Test Case 4: Should fallback to en for unsupported browser language
  it('should fallback to en for unsupported browser language', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['fr-FR'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('en');
  });

  // Test Case 5: Should ignore invalid saved locale and use browser language
  it('should ignore invalid saved locale and detect from browser', async () => {
    mockStorage['user-locale'] = 'xx-INVALID';

    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['zh-TW'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
  });

  // Test Case 6: Should fallback to navigator.language when navigator.languages is empty
  it('should use navigator.language when navigator.languages is empty', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: [],
    });
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'zh-MO',
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
  });

  // Test Case 7: Should map bare "zh" to zh-TW
  it('should map bare "zh" browser language to zh-TW', async () => {
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: ['zh'],
    });

    const { getLocale } = await loadI18nModule();

    expect(getLocale()).toBe('zh-TW');
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Locale Update and Guard Behavior
  // ---------------------------------------------------------------------------

  // Test Case 8: Should persist locale when setLocale receives supported value
  it('should persist locale when setLocale receives a supported value', async () => {
    const { getLocale, setLocale } = await loadI18nModule();

    setLocale('zh-TW');

    expect(getLocale()).toBe('zh-TW');
    expect(setItemSpy).toHaveBeenCalledWith('user-locale', 'zh-TW');
  });

  // Test Case 9: Should reject unsupported locale values
  it('should ignore unsupported setLocale values and keep current locale', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getLocale, setLocale } = await loadI18nModule();

    setLocale('fr');

    expect(getLocale()).toBe('en');
    expect(warnSpy).toHaveBeenCalledWith('Unsupported locale: fr');
  });
});

describe('locale message parity', () => {
  // ---------------------------------------------------------------------------
  // Test Group 3: Translation Parity
  // ---------------------------------------------------------------------------

  // Test Case 10: Should keep English and Traditional Chinese translation keys aligned
  it('should keep English and Traditional Chinese translation keys aligned', () => {
    expect(getTranslationKeys(zhTW)).toEqual(getTranslationKeys(en));
  });
});

describe('locale message rendering', () => {
  // ---------------------------------------------------------------------------
  // Test Group 4: Real Translation and Fallback
  // ---------------------------------------------------------------------------

  // Test Case 11: Should render interpolated and pluralized messages in both locales
  it('should render real interpolated and pluralized messages in both locales', async () => {
    const { default: i18n, setLocale } = await loadI18nModule();

    setLocale('en');
    expect(i18n.global.t('template.editingTemplate', { name: 'Travel' })).toBe(
      'Editing template: Travel'
    );
    expect(i18n.global.t('template.categoryCount', 1)).toBe('1 category');
    expect(i18n.global.t('template.categoryCount', 2)).toBe('2 categories');

    setLocale('zh-TW');
    expect(i18n.global.t('template.editingTemplate', { name: '旅行' })).toBe('正在編輯範本：旅行');
    expect(i18n.global.t('template.categoryCount', 2)).toBe('2 個分類');
  });

  // Test Case 12: Should fall back to English when a message is missing in Chinese
  it('should render the English fallback when a Chinese message is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { default: i18n, setLocale } = await loadI18nModule();

    i18n.global.setLocaleMessage('zh-TW', {});
    setLocale('zh-TW');

    expect(i18n.global.t('sidebar.title')).toBe(en.sidebar.title);
    warnSpy.mockRestore();
  });
});
