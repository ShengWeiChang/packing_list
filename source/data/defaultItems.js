/*
================================================================================
File: source/data/defaultItems.js
Description: Dynamic default packing items loader with multi-language support
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { defaultItemsEN } from './defaultItems_en.js';
import { defaultItemsZhTW } from './defaultItems_zh-TW.js';

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

/**
 * Get default items based on user's locale
 * @param {string} locale - User's preferred locale ('en', 'zh-TW', etc.)
 * @returns {Array} Default items array for the specified locale
 */
export function getDefaultItems(locale = 'en') {
  const itemsMap = {
    en: defaultItemsEN,
    'zh-TW': defaultItemsZhTW,
    zh: defaultItemsZhTW, // Fallback for simplified Chinese
    // TODO: Add support for more languages
    // - Import new defaultItems_{locale}.js files
    // - Add entries to itemsMap for new locales (e.g., 'zh-CN', 'ja', 'ko')
  };

  return itemsMap[locale] || defaultItemsEN;
}

// Backward compatibility: export default English items
export const defaultItems = defaultItemsEN;
