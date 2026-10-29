/*
================================================================================
File: source/utils/instantiateTemplate.ts
Description: Create isolated runtime categories and items from template-shaped
             source content.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-15
================================================================================
*/

import { Category } from '../models/Category';
import type { TemplateContent } from '../models/contracts';
import { Item } from '../models/Item';
import { generateSecureId } from './helpers';

/**
 * Materialize template-shaped content for a newly created checklist.
 * @param {object} source - Source object containing categories and items.
 * @param {string} checklistId - Target checklist ID.
 * @returns {object} Fresh { categories, items } runtime data.
 */
export function instantiateTemplateContent(source: TemplateContent, checklistId: string) {
  const categoryIdMap: Record<string, string> = {};
  const categories = (source.categories || []).map((category) => {
    const newCategory = new Category({
      name: category.name,
      checklistId,
      order: category.order ?? 0,
    });
    categoryIdMap[category.id] = newCategory.id;
    return newCategory;
  });

  const items = (source.items || []).map(
    (item) =>
      new Item({
        id: generateSecureId('item-'),
        name: item.name,
        quantity: item.quantity ?? 1,
        checklistId,
        categoryId: categoryIdMap[String(item.categoryId)] || item.categoryId,
        order: item.order ?? 0,
        isPacked: false,
        isPending: false,
      })
  );

  return { categories, items };
}
