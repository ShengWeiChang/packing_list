/*
================================================================================
File: tests/unit-tests/data/recommendedLists.test.js
Description: Unit tests for localized built-in recommended-list resolution.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-15
================================================================================
*/

import { describe, expect, it } from 'vitest';

import { recommendedListDefinitions } from '../../../source/data/recommendedListDefinitions.js';
import { getRecommendedList, getRecommendedLists } from '../../../source/data/recommendedLists.js';

describe('recommendedLists', () => {
  // Test Case 1: Should resolve complete localized recommended lists with valid references
  it('resolves complete localized recommended lists with valid category references', () => {
    for (const locale of ['en', 'zh-TW']) {
      const recommendedLists = getRecommendedLists(locale);
      expect(recommendedLists).toHaveLength(recommendedListDefinitions.length);
      expect(new Set(recommendedLists.map((list) => list.id)).size).toBe(recommendedLists.length);

      for (const recommendedList of recommendedLists) {
        const categoryIds = new Set(recommendedList.categories.map((category) => category.id));
        expect(recommendedList.name).toBeTruthy();
        expect(recommendedList.description).toBeTruthy();
        expect(categoryIds.size).toBe(recommendedList.categories.length);
        expect(recommendedList.items.length).toBeGreaterThan(0);
        expect(recommendedList.items.every((item) => categoryIds.has(item.categoryId))).toBe(true);
        expect(recommendedList.items.every((item) => item.name && item.quantity > 0)).toBe(true);
      }
    }
  });

  // Test Case 2: Should include core clothing in every recommended list
  it('includes core clothing in every recommended list', () => {
    const coreClothingItemIds = ['tops', 'bottoms', 'underwear', 'socks', 'pajamas'];

    for (const recommendedList of recommendedListDefinitions) {
      const itemIds = recommendedList.categories.flatMap((category) => category.itemIds);
      expect(itemIds).toEqual(expect.arrayContaining(coreClothingItemIds));
    }
  });

  // Test Case 3: Should fall back to English for unsupported locales
  it('falls back to English for unsupported locales', () => {
    expect(getRecommendedLists('fr')).toEqual(getRecommendedLists('en'));
    expect(getRecommendedList('missing', 'en')).toBeNull();
  });

  // Test Case 4: Should return isolated resolved data
  it('returns isolated resolved data', () => {
    const first = getRecommendedLists('en');
    first[0].categories[0].name = 'Changed';
    first[0].items[0].name = 'Changed';

    const second = getRecommendedLists('en');
    expect(second[0].categories[0].name).not.toBe('Changed');
    expect(second[0].items[0].name).not.toBe('Changed');
  });
});
