/*
================================================================================
File: tests/unit-tests/composables/useTemplates.test.js
Description: Unit tests for personal template composable state and error handling.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = {
  getTemplates: vi.fn(),
  createFromChecklist: vi.fn(),
  deleteTemplate: vi.fn(),
  getTemplateById: vi.fn(),
  updateTemplate: vi.fn(),
  applyToNewChecklist: vi.fn(),
  clearCache: vi.fn(),
};

vi.mock('../../../source/services/templateService', () => ({
  TemplateService: class {
    /** @returns {object} Mocked template service */
    constructor() {
      return service;
    }
  },
}));

import { useTemplates } from '../../../source/composables/useTemplates';

// -----------------------------------------------------------------------------
// useTemplates Tests
// -----------------------------------------------------------------------------

describe('useTemplates', () => {
  beforeEach(() => {
    Object.values(service).forEach((mock) => mock.mockReset());
    service.getTemplates.mockReturnValue([]);
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Template State
  // ---------------------------------------------------------------------------

  // Test Case 1: Should load templates into readonly state
  it('loads templates into readonly state', () => {
    const templates = [{ id: 'template-1', name: 'Weekend' }];
    service.getTemplates.mockReturnValue(templates);
    const api = useTemplates();

    api.loadTemplates();

    expect(api.templates.value).toEqual(templates);
    expect(api.isLoading.value).toBe(false);
    expect(api.error.value).toBeNull();
  });

  // Test Case 2: Should record loading errors without replacing state
  it('records loading errors without replacing state', () => {
    service.getTemplates.mockImplementation(() => {
      throw new Error('Unavailable');
    });
    const api = useTemplates();

    api.loadTemplates();

    expect(api.templates.value).toEqual([]);
    expect(api.error.value).toBe('Error loading templates: Unavailable');
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Template Operations
  // ---------------------------------------------------------------------------

  // Test Case 3: Should save a template and refresh state
  it('saves a template and refreshes state', async () => {
    const created = { id: 'template-1', name: 'Weekend' };
    service.createFromChecklist.mockReturnValue(created);
    service.getTemplates.mockReturnValue([created]);
    const api = useTemplates();

    expect(await api.saveAsTemplate('checklist-1', 'Weekend')).toEqual(created);
    expect(service.createFromChecklist).toHaveBeenCalledWith('checklist-1', 'Weekend');
    expect(api.templates.value).toEqual([created]);
  });

  // Test Case 4: Should return null and record errors from template operations
  it('returns null and records errors from template operations', () => {
    service.applyToNewChecklist.mockImplementation(() => {
      throw new Error('Missing template');
    });
    const api = useTemplates();

    expect(api.applyTemplate('missing', 'checklist-1')).toBeNull();
    expect(api.error.value).toBe('Error applying template: Missing template');
  });

  // Test Case 5: Should rename an existing template and refresh state
  it('renames an existing template and refreshes state', async () => {
    const existing = { id: 'template-1', name: 'Weekend', categories: [], items: [] };
    const updated = { ...existing, name: 'Beach Weekend' };
    service.getTemplateById.mockReturnValue(existing);
    service.updateTemplate.mockReturnValue(updated);
    service.getTemplates.mockReturnValue([updated]);
    const api = useTemplates();

    expect(await api.renameTemplate(existing.id, updated.name)).toEqual(updated);
    expect(service.updateTemplate).toHaveBeenCalledWith(updated, existing);
    expect(api.templates.value).toEqual([updated]);
  });

  // Test Case 6: Should return false when deleting a missing template
  it('returns false when deleting a missing template', async () => {
    service.deleteTemplate.mockImplementation(() => {
      throw new Error('Missing template');
    });
    const api = useTemplates();

    expect(await api.deleteTemplate('missing')).toBe(false);
    expect(api.error.value).toBe('Error deleting template: Missing template');
  });

  // Test Case 7: Should delete a template and refresh state
  it('deletes a template and refreshes state', async () => {
    const remaining = [{ id: 'template-2', name: 'Beach' }];
    service.getTemplates.mockReturnValue(remaining);
    const api = useTemplates();

    expect(await api.deleteTemplate('template-1')).toBe(true);
    expect(service.deleteTemplate).toHaveBeenCalledWith('template-1');
    expect(api.templates.value).toEqual(remaining);
  });

  // Test Case 8: Should return null and record save errors
  it('returns null and records save errors', async () => {
    service.createFromChecklist.mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    const api = useTemplates();

    expect(await api.saveAsTemplate('checklist-1', 'Weekend')).toBeNull();
    expect(api.error.value).toBe('Error saving template: Quota exceeded');
  });

  // Test Case 9: Should return null when renaming a missing template
  it('returns null when renaming a missing template', async () => {
    service.getTemplateById.mockReturnValue(null);
    const api = useTemplates();

    expect(await api.renameTemplate('missing', 'Weekend')).toBeNull();
    expect(service.updateTemplate).not.toHaveBeenCalled();
  });

  // Test Case 10: Should return null and record rename errors
  it('returns null and records rename errors', async () => {
    service.getTemplateById.mockImplementation(() => {
      throw new Error('Unavailable');
    });
    const api = useTemplates();

    expect(await api.renameTemplate('template-1', 'Weekend')).toBeNull();
    expect(api.error.value).toBe('Error renaming template: Unavailable');
  });

  // Test Case 11: Should return applied template data
  it('returns applied template data', () => {
    const applied = { categories: [{ id: 'category-1' }], items: [] };
    service.applyToNewChecklist.mockReturnValue(applied);
    const api = useTemplates();

    expect(api.applyTemplate('template-1', 'checklist-1')).toEqual(applied);
  });

  // Test Case 12: Should update a template and refresh state
  it('updates a template and refreshes state', async () => {
    const updated = { id: 'template-1', name: 'Beach', categories: [], items: [] };
    service.updateTemplate.mockReturnValue(updated);
    service.getTemplates.mockReturnValue([updated]);
    const api = useTemplates();

    expect(await api.updateTemplate(updated)).toEqual(updated);
    expect(api.templates.value).toEqual([updated]);
  });

  // Test Case 13: Should return null and record update errors
  it('returns null and records update errors', async () => {
    service.updateTemplate.mockImplementation(() => {
      throw new Error('Missing template');
    });
    const api = useTemplates();

    expect(await api.updateTemplate({ id: 'missing', name: 'Missing' })).toBeNull();
    expect(api.error.value).toBe('Error updating template: Missing template');
  });

  // Test Case 14: Should expose its service instance for direct operations
  it('exposes its service instance', () => {
    expect(useTemplates().getService()).toBe(service);
  });

  // Test Case 15: Should refresh templates on relevant storage events and clean up on unmount
  it('refreshes for template and clear events only while mounted', () => {
    const wrapper = mount({
      setup() {
        useTemplates();
        return () => null;
      },
    });
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
    expect(service.getTemplates).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent('storage', { key: 'packingListTemplates' }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(service.clearCache).toHaveBeenCalledTimes(2);
    expect(service.getTemplates).toHaveBeenCalledTimes(2);
    wrapper.unmount();
    window.dispatchEvent(new StorageEvent('storage', { key: 'packingListTemplates' }));
    expect(service.getTemplates).toHaveBeenCalledTimes(2);
  });
});
