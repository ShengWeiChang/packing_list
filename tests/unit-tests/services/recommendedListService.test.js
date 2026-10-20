/*
================================================================================
File: tests/unit-tests/services/recommendedListService.test.js
Description: Unit tests for applying immutable recommended lists to checklists.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-15
================================================================================
*/

import { describe, expect, it } from 'vitest';

import { RecommendedListService } from '../../../source/services/recommendedListService.js';

describe('RecommendedListService', () => {
  const service = new RecommendedListService();

  // Test Case 1: Should materialize every recommended list with valid runtime relationships
  it('materializes every recommended list with fresh runtime relationships', () => {
    for (const recommendedList of service.getRecommendedLists('en')) {
      const applied = service.applyToNewChecklist(
        recommendedList.id,
        `checklist-${recommendedList.id}`,
        'en'
      );
      const categoryIds = new Set(applied.categories.map((category) => category.id));

      expect(applied.categories).toHaveLength(recommendedList.categories.length);
      expect(applied.items).toHaveLength(recommendedList.items.length);
      expect(
        applied.categories.every(
          (category) => category.checklistId === `checklist-${recommendedList.id}`
        )
      ).toBe(true);
      expect(applied.items.every((item) => categoryIds.has(item.categoryId))).toBe(true);
      expect(
        applied.items.every(
          (item) =>
            item.checklistId === `checklist-${recommendedList.id}` &&
            item.isPacked === false &&
            item.isPending === false
        )
      ).toBe(true);
    }
  });

  // Test Case 2: Should isolate repeated applications
  it('isolates repeated applications from each other and the source', () => {
    const source = service.getRecommendedLists('en')[0];
    const first = service.applyToNewChecklist(source.id, 'checklist-1', 'en');
    const second = service.applyToNewChecklist(source.id, 'checklist-2', 'en');

    expect(first.categories[0].id).not.toBe(second.categories[0].id);
    expect(first.items[0].id).not.toBe(second.items[0].id);
    expect(first.categories[0].id).not.toBe(source.categories[0].id);
    first.items[0].name = 'Changed';
    expect(second.items[0].name).not.toBe('Changed');
    expect(service.getRecommendedLists('en')[0].items[0].name).not.toBe('Changed');
  });

  // Test Case 3: Should reject missing recommended lists without producing partial data
  it('rejects missing recommended lists', () => {
    expect(() => service.applyToNewChecklist('missing', 'checklist-1', 'en')).toThrow(
      'Recommended list with id missing not found'
    );
  });

  // Test Case 4: Should apply the localized general recommended list
  it('applies the localized general recommended list', () => {
    const applied = service.applyGeneralToNewChecklist('checklist-1', 'zh-TW');

    expect(applied.categories.length).toBeGreaterThan(0);
    expect(applied.items.length).toBeGreaterThan(0);
    expect(applied.categories.every((category) => category.checklistId === 'checklist-1')).toBe(
      true
    );
  });
});
