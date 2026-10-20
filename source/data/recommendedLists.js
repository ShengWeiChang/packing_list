/*
================================================================================
File: source/data/recommendedLists.js
Description: Locale-aware resolver for built-in recommended packing lists.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-15
================================================================================
*/

import { recommendedListContentEn } from './recommendedListContentEn.js';
import { recommendedListContentZhTw } from './recommendedListContentZhTw.js';
import {
  GENERAL_RECOMMENDED_LIST_ID,
  recommendedListDefinitions,
} from './recommendedListDefinitions.js';

const contentByLocale = {
  en: recommendedListContentEn,
  'zh-TW': recommendedListContentZhTw,
  zh: recommendedListContentZhTw,
};

/**
 * Resolve all recommended lists for a locale.
 * @param {string} locale - Active application locale.
 * @returns {Array<object>} Localized recommended-list snapshots.
 */
export function getRecommendedLists(locale = 'en') {
  const content = contentByLocale[locale] || recommendedListContentEn;

  return recommendedListDefinitions.map((recommendedList, listOrder) => {
    const listContent =
      content.recommendedLists[recommendedList.id] ||
      recommendedListContentEn.recommendedLists[recommendedList.id];
    const categories = recommendedList.categories.map((category, categoryOrder) => ({
      id: category.id,
      name: content.categories[category.id] || recommendedListContentEn.categories[category.id],
      order: categoryOrder,
    }));
    const items = recommendedList.categories.flatMap((category) =>
      category.itemIds.map((itemId, itemOrder) => ({
        id: itemId,
        name: content.items[itemId] || recommendedListContentEn.items[itemId],
        quantity: 1,
        categoryId: category.id,
        order: itemOrder,
      }))
    );

    return {
      id: recommendedList.id,
      name: listContent.name,
      description: listContent.description,
      order: listOrder,
      categories,
      items,
    };
  });
}

/**
 * Resolve a single localized recommended list.
 * @param {string} recommendedListId - Stable recommended-list ID.
 * @param {string} locale - Active application locale.
 * @returns {object|null} Localized recommended list or null when not found.
 */
export function getRecommendedList(recommendedListId, locale = 'en') {
  return getRecommendedLists(locale).find((list) => list.id === recommendedListId) || null;
}

/**
 * Resolve the general recommended list used by callers that omit creation options.
 * @param {string} locale - Active application locale.
 * @returns {object} Localized general recommended list.
 */
export function getGeneralRecommendedList(locale = 'en') {
  return getRecommendedList(GENERAL_RECOMMENDED_LIST_ID, locale);
}
