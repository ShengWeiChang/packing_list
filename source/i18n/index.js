/*
================================================================================
File: source/i18n/index.js
Description: i18n configuration for Vue application with locale persistence
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-10-18
================================================================================
*/

import { createI18n } from 'vue-i18n';

import en from '../locales/en.json';
import zhTW from '../locales/zh-TW.json';

// Local storage key for user language preference
const LOCALE_STORAGE_KEY = 'user-locale';

// Supported locales
const SUPPORTED_LOCALES = ['en', 'zh-TW'];

// TODO: Add support for more languages (e.g., zh-CN, ja, ko, es, fr)
// - Update SUPPORTED_LOCALES array
// - Add corresponding locale JSON files in ../locales/
// - Update mapToSupportedLocale() to handle new language mappings
// - Create defaultItems.{locale}.js files for new languages

/**
 * Map browser language to supported locale
 * @param {string} lang - Browser language code
 * @returns {string} Mapped locale ('en' or 'zh-TW')
 */
function mapToSupportedLocale(lang) {
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
function getPreferredLocale() {
  // 1. Check saved preference first
  const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
    return savedLocale;
  }

  // 2. Detect browser language (prefer navigator.languages array)
  const browserLangs =
    Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage];

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
const i18n = createI18n({
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
if (!localStorage.getItem(LOCALE_STORAGE_KEY)) {
  localStorage.setItem(LOCALE_STORAGE_KEY, initialLocale);
}

/**
 * Update locale and persist to localStorage
 * @param {string} newLocale - New locale to set
 */
export function setLocale(newLocale) {
  if (!SUPPORTED_LOCALES.includes(newLocale)) {
    console.warn(`Unsupported locale: ${newLocale}`);
    return;
  }

  if (i18n.global.locale) {
    i18n.global.locale.value = newLocale;
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
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
