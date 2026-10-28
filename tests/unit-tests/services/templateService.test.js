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
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({ checklists: [{ id: 'checklist-1' }], categories: [], items: [] })
    );
    service = new TemplateService();
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Template Snapshot and Application
  // ---------------------------------------------------------------------------

  // Test Case 1: Should create a storage-safe snapshot from a checklist
  it('creates a storage-safe snapshot from a checklist', async () => {
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({
        checklists: [{ id: 'checklist-1' }],
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
      })
    );
    const template = await service.createFromChecklist('checklist-1', 'Weekend');

    expect(template.categories).toEqual([{ id: 'category-1', name: 'Clothes', order: 0 }]);
    expect(template.items).toEqual([
      { name: 'Shirt', quantity: 2, categoryId: 'category-1', order: 0 },
    ]);
    expect(template.items[0]).not.toHaveProperty('id');
    expect(template.items[0]).not.toHaveProperty('isPacked');
    expect(JSON.parse(storage.get(STORAGE_KEYS.TEMPLATES))).toHaveLength(1);
  });

  // Test Case 2: Should apply a template with fresh IDs and reset runtime state
  it('applies a template with fresh IDs and reset runtime state', async () => {
    const template = await service.createTemplate({
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
  it('updates only the template storage key', async () => {
    const original = await service.createTemplate({ name: 'Weekend', categories: [], items: [] });
    localStorage.setItem.mockClear();

    await service.updateTemplate(
      {
        ...original,
        name: 'Beach Weekend',
        categories: [{ id: 'category-1', name: 'Beach', order: 0 }],
      },
      original
    );

    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.TEMPLATES, expect.any(String));
    expect(localStorage.setItem).not.toHaveBeenCalledWith(
      STORAGE_KEYS.APP_DATA,
      expect.any(String)
    );
  });

  // Test Case 4: Should preserve malformed template storage without changing app data
  it('preserves malformed template storage without changing app data', () => {
    storage.set(STORAGE_KEYS.TEMPLATES, '{not-json');
    storage.set(STORAGE_KEYS.APP_DATA, JSON.stringify({ checklists: [{ id: 'checklist-1' }] }));

    expect(() => service.getTemplates()).toThrow('valid JSON');
    expect(storage.get(STORAGE_KEYS.TEMPLATES)).toBe('{not-json');
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(JSON.parse(storage.get(STORAGE_KEYS.APP_DATA)).checklists).toHaveLength(1);
  });

  // Test Case 5: Should propagate localStorage write failures
  it('propagates localStorage write failures', async () => {
    localStorage.setItem.mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    await expect(service.createTemplate({ name: 'Weekend' })).rejects.toThrow('Quota exceeded');
  });

  // Test Case 6: Should return templates in ascending persisted order
  it('returns templates in ascending persisted order', () => {
    storage.set(
      STORAGE_KEYS.TEMPLATES,
      JSON.stringify([
        { id: 'template-later', name: 'Later', order: 2 },
        { id: 'template-first', name: 'First', order: 0 },
      ])
    );

    expect(service.getTemplates().map((template) => template.id)).toEqual([
      'template-first',
      'template-later',
    ]);
    expect(service.getTemplateById('missing-template')).toBeNull();
  });

  // Test Case 7: Should update and delete an existing template
  it('updates and deletes an existing template', async () => {
    const original = await service.createTemplate({ name: 'Weekend', categories: [], items: [] });
    const updated = await service.updateTemplate({ ...original, name: 'Beach Weekend' }, original);

    expect(updated.name).toBe('Beach Weekend');
    await service.deleteTemplate(original.id);
    expect(service.getTemplates()).toEqual([]);
  });

  // Test Case 8: Should reject updates and deletes for missing templates
  it('rejects updates and deletes for missing templates', async () => {
    await expect(
      service.updateTemplate({ id: 'missing-template', name: 'Missing' })
    ).rejects.toThrow('Template with id missing-template not found');
    await expect(service.deleteTemplate('missing-template')).rejects.toThrow(
      'Template with id missing-template not found'
    );
  });

  // Test Case 9: Should reorder requested templates and append unspecified templates
  it('reorders requested templates and appends unspecified templates', async () => {
    const first = await service.createTemplate({ name: 'First', order: 0 });
    const second = await service.createTemplate({ name: 'Second', order: 1 });
    const third = await service.createTemplate({ name: 'Third', order: 2 });

    await service.reorderTemplates([third.id, first.id, 'missing-template']);

    expect(service.getTemplates().map(({ id, order }) => ({ id, order }))).toEqual([
      { id: third.id, order: 0 },
      { id: first.id, order: 1 },
      { id: second.id, order: 2 },
    ]);
  });

  // Test Case 10: Should snapshot persisted checklist data when UI data is partial
  it('snapshots persisted checklist data when UI data is partial', async () => {
    storage.set(
      STORAGE_KEYS.APP_DATA,
      JSON.stringify({
        checklists: [{ id: 'checklist-1' }],
        categories: [{ id: 'category-1', name: 'Clothes', checklistId: 'checklist-1', order: 0 }],
        items: [
          {
            id: 'item-1',
            name: 'Shirt',
            quantity: 1,
            categoryId: 'category-1',
            checklistId: 'checklist-1',
            order: 0,
          },
        ],
      })
    );

    const template = await service.createFromChecklist('checklist-1', 'Weekend');

    expect(template.categories).toEqual([{ id: 'category-1', name: 'Clothes', order: 0 }]);
    expect(template.items).toEqual([
      { name: 'Shirt', quantity: 1, categoryId: 'category-1', order: 0 },
    ]);
  });

  // Test Case 11: Should preserve malformed application data and reject snapshots
  it('preserves malformed application data and rejects snapshots', async () => {
    storage.set(STORAGE_KEYS.APP_DATA, '{not-json');
    await expect(service.createFromChecklist('checklist-1', 'Weekend')).rejects.toMatchObject({
      code: 'corrupt',
    });
    expect(storage.get(STORAGE_KEYS.APP_DATA)).toBe('{not-json');
    expect(storage.has(STORAGE_KEYS.TEMPLATES)).toBe(false);
  });

  // Test Case 12: Should reject applying a missing template
  it('rejects applying a missing template', () => {
    expect(() => service.applyToNewChecklist('missing-template', 'checklist-1')).toThrow(
      'Template with id missing-template not found'
    );
  });

  // Test Case 13: Should append checklist snapshots after existing templates
  it('appends checklist snapshots after existing templates', async () => {
    await service.createTemplate({ name: 'First', order: 3 });

    const created = await service.createFromChecklist('checklist-1', 'Second');

    expect(created.order).toBe(4);
  });

  // Test Case 14: Should reload externally changed template storage after cache invalidation
  it('reloads externally changed template storage after cache invalidation', () => {
    expect(service.getTemplates()).toEqual([]);
    storage.set(
      STORAGE_KEYS.TEMPLATES,
      JSON.stringify([{ id: 'template-external', name: 'External', order: 0 }])
    );

    service.clearCache();

    expect(service.getTemplates()).toEqual([
      expect.objectContaining({ id: 'template-external', name: 'External' }),
    ]);
  });

  // Test Case 15: Should preserve orphan category references and apply item defaults
  it('preserves orphan category references and applies item defaults', async () => {
    const template = await service.createTemplate({
      name: 'Minimal',
      categories: [],
      items: [{ name: 'Passport', categoryId: 'missing-category' }],
    });

    const applied = service.applyToNewChecklist(template.id, 'checklist-1');

    expect(applied.items[0]).toMatchObject({
      name: 'Passport',
      quantity: 1,
      categoryId: 'missing-category',
      checklistId: 'checklist-1',
      order: 0,
      isPacked: false,
    });
  });
});
