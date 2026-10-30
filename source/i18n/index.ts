/*
================================================================================
File: source/i18n/index.ts
Description: i18n configuration for Vue application with locale persistence
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-10-18
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { createI18n } from 'vue-i18n';

import en from '../locales/en.json';
import zhTW from '../locales/zh-TW.json';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

// Local storage key for user language preference
const LOCALE_STORAGE_KEY = 'user-locale';

// Supported locales
const SUPPORTED_LOCALES = ['en', 'zh-TW'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
type MessageSchema = typeof en;

/** Check a preference before using it as a message locale. */
function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((locale) => locale === value);
}

// TODO: Add support for more languages (e.g., zh-CN, ja, ko, es, fr)
// - Update SUPPORTED_LOCALES array
// - Add corresponding locale JSON files in ../locales/
// - Update mapToSupportedLocale() to handle new language mappings
// - Add recommended-list content for the new locale

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

/**
 * Map browser language to supported locale
 * @param {string} lang - Browser language code
 * @returns {string} Mapped locale ('en' or 'zh-TW')
 */
function mapToSupportedLocale(lang: unknown): SupportedLocale {
  if (!lang) return 'en';

  const lower = String(lang).toLowerCase();

  // Match all Traditional Chinese variants to zh-TW
  // Covers: zh, zh-TW, zh-Hant, zh-HK, zh-MO
  if (
    lower === 'zh' ||
    lower.startsWith('zh-') ||
    lower.includes('hant') ||
    lower.includes('tw') ||
    lower.includes('hk') ||
    lower.includes('mo')
  ) {
    return 'zh-TW';
  }

  // Default to English for all other cases
  return 'en';
}

/**
 * Detect user's preferred language with priority:
 * 1) Saved preference in localStorage
 * 2) Browser language detection
 * 3) Fallback to English
 * @returns {string} Locale string ('en' or 'zh-TW')
 */
function getPreferredLocale(): SupportedLocale {
  // 1. Check saved preference first
  let savedLocale;
  try {
    savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    // Locale is an optional preference; browser detection remains available.
  }
  if (savedLocale && isSupportedLocale(savedLocale)) {
    return savedLocale;
  }

  // 2. Detect browser language (prefer navigator.languages array)
  const browserLangs =
    Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage];

  // Try each browser language candidate
  for (const lang of browserLangs) {
    const mapped = mapToSupportedLocale(lang);
    if (SUPPORTED_LOCALES.includes(mapped)) {
      return mapped;
    }
  }

  // 3. Default to English
  return 'en';
}

// Detect initial locale
const initialLocale = getPreferredLocale();

// Create i18n instance
const i18n = createI18n<[MessageSchema], SupportedLocale, false>({
  legacy: false, // Use Composition API mode
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    en: en,
    'zh-TW': zhTW,
    // TODO: Add messages for additional locales here
    // Example: 'zh-CN': zhCN, 'ja': ja, 'ko': ko
  },
});

// Persist initial detection to localStorage if not already saved
try {
  if (!localStorage.getItem(LOCALE_STORAGE_KEY)) {
    localStorage.setItem(LOCALE_STORAGE_KEY, initialLocale);
  }
} catch {
  // The app can continue with the detected locale for this session.
}

/**
 * Update locale and persist to localStorage
 * @param {string} newLocale - New locale to set
 */
export function setLocale(newLocale: string) {
  if (!isSupportedLocale(newLocale)) {
    console.warn(`Unsupported locale: ${newLocale}`);
    return;
  }

  if (i18n.global.locale) {
    i18n.global.locale.value = newLocale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // Keep the in-memory locale even when persistence is unavailable.
    }
  }
}

/**
 * Get current locale
 * @returns {string} Current locale
 */
export function getLocale() {
  return i18n.global.locale?.value || 'en';
}

export default i18n;
