/*
================================================================================
File: tests/unit-tests/services/templateService.test.js
Description: Unit tests for personal template persistence and application.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

import { beforeEach, describe, expect, it } from 'vitest';

import { TemplateService } from '../../../source/services/templateService';
import { STORAGE_KEYS } from '../../../source/utils/constants.js';

describe('TemplateService', () => {
  let storage;
  let service;

  beforeEach(() => {
    storage = new Map();
    localStorage.getItem.mockImplementation((key) => storage.get(key) ?? null);
    localStorage.setItem.mockImplementation((key, value) => storage.set(key, value));
    service = new TemplateService();
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Template Snapshot and Application
  // ---------------------------------------------------------------------------

  // Test Case 1: Should create a storage-safe snapshot from a checklist
  it('creates a storage-safe snapshot from a checklist', () => {
    const template = service.createFromChecklist('checklist-1', 'Weekend', {
      categories: [{ id: 'category-1', name: 'Clothes', checklistId: 'checklist-1', order: 0 }],
      items: [
        {
          id: 'item-1',
          name: 'Shirt',
          quantity: 2,
          categoryId: 'category-1',
          checklistId: 'checklist-1',
          isPacked: true,
          isPending: true,
          order: 0,
        },
      ],
    });

    expect(template.categories).toEqual([{ id: 'category-1', name: 'Clothes', order: 0 }]);
    expect(template.items).toEqual([
      { name: 'Shirt', quantity: 2, categoryId: 'category-1', order: 0 },
    ]);
    expect(template.items[0]).not.toHaveProperty('id');
    expect(template.items[0]).not.toHaveProperty('isPacked');
    expect(JSON.parse(storage.get(STORAGE_KEYS.TEMPLATES))).toHaveLength(1);
  });

  // Test Case 2: Should apply a template with fresh IDs and reset runtime state
  it('applies a template with fresh IDs and reset runtime state', () => {
    const template = service.createTemplate({
      name: 'Weekend',
      categories: [{ id: 'old-category', name: 'Clothes', order: 0 }],
      items: [{ name: 'Shirt', quantity: 2, categoryId: 'old-category', order: 0 }],
    });

    const applied = service.applyToNewChecklist(template.id, 'new-checklist');

    expect(applied.categories[0].id).not.toBe('old-category');
    expect(applied.categories[0].checklistId).toBe('new-checklist');
    expect(applied.items[0].categoryId).toBe(applied.categories[0].id);
    expect(applied.items[0].checklistId).toBe('new-checklist');
    expect(applied.items[0].isPacked).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Storage Isolation and Errors
  // ---------------------------------------------------------------------------

  // Test Case 3: Should update only the template storage key
  it('updates only the template storage key', () => {
    const original = service.createTemplate({ name: 'Weekend', categories: [], items: [] });
    localStorage.setItem.mockClear();

    service.updateTemplate({
      ...original,
      name: 'Beach Weekend',
      categories: [{ id: 'category-1', name: 'Beach', order: 0 }],
    });

    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.TEMPLATES, expect.any(String));
    expect(localStorage.setItem).not.toHaveBeenCalledWith(
      STORAGE_KEYS.APP_DATA,
      expect.any(String)
    );
  });

  // Test Case 4: Should recover from malformed template storage without changing app data
  it('recovers from malformed template storage without changing app data', () => {
    storage.set(STORAGE_KEYS.TEMPLATES, '{not-json');
    storage.set(STORAGE_KEYS.APP_DATA, JSON.stringify({ checklists: [{ id: 'checklist-1' }] }));

    expect(service.getTemplates()).toEqual([]);
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(JSON.parse(storage.get(STORAGE_KEYS.APP_DATA)).checklists).toHaveLength(1);
  });

  // Test Case 5: Should propagate localStorage write failures
  it('propagates localStorage write failures', () => {
    localStorage.setItem.mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(() => service.createTemplate({ name: 'Weekend' })).toThrow('Quota exceeded');
  });
});
