/*
================================================================================
File: source/services/recommendedListService.ts
Description: Read and apply immutable built-in recommended packing lists.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-15
================================================================================
*/

import {
  getGeneralRecommendedList,
  getRecommendedList,
  getRecommendedLists,
} from '../data/recommendedLists';
import { instantiateTemplateContent } from '../utils/instantiateTemplate';

/** Service for reading and applying immutable built-in recommended lists. */
export class RecommendedListService {
  /**
   * Get localized recommended lists.
   * @param {string} locale - Active application locale.
   * @returns {Array<object>} Localized recommended lists.
   */
  getRecommendedLists(locale = 'en') {
    return getRecommendedLists(locale);
  }

  /**
   * Apply a selected recommended list to a new checklist.
   * @param {string} recommendedListId - Stable recommended-list ID.
   * @param {string} checklistId - Target checklist ID.
   * @param {string} locale - Active application locale.
   * @returns {object} Fresh { categories, items } runtime data.
   */
  applyToNewChecklist(recommendedListId: string, checklistId: string, locale = 'en') {
    const recommendedList = getRecommendedList(recommendedListId, locale);
    if (!recommendedList) {
      throw new Error(`Recommended list with id ${recommendedListId} not found`);
    }
    return instantiateTemplateContent(recommendedList, checklistId);
  }

  /**
   * Apply the general recommended list for callers that omit creation options.
   * @param {string} checklistId - Target checklist ID.
   * @param {string} locale - Active application locale.
   * @returns {object} Fresh { categories, items } runtime data.
   */
  applyGeneralToNewChecklist(checklistId: string, locale = 'en') {
    return instantiateTemplateContent(getGeneralRecommendedList(locale), checklistId);
  }
}
