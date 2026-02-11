/*
================================================================================
File: tests/unit-tests/services/localStorageService.test.js
Description: Unit tests for LocalStorageService.
             Tests CRUD operations for checklists, categories, and items
             using mocked localStorage.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-05
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageService } from '../../../source/services/localStorageService';

// -----------------------------------------------------------------------------
// LocalStorageService Tests
// -----------------------------------------------------------------------------

describe('LocalStorageService', () => {
  let service;
  let mockStorage;

  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    mockStorage = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockStorage[key];
    });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      mockStorage = {};
    });

    service = new LocalStorageService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Initialization
  // ---------------------------------------------------------------------------

  describe('initialization', () => {
    // Test Case 1: First run should create empty structure
    it('should initialize with empty data when localStorage is empty', async () => {
      const data = await service.getData();

      expect(data).toHaveProperty('checklists');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('items');
      expect(data.checklists).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.items).toEqual([]);
    });

    // Test Case 2: Multiple initializations should not reset data
    it('should not overwrite data on repeated initialization', async () => {
      const checklist = await service.createChecklist({ name: 'Test Persist' });
      expect(checklist.name).toBe('Test Persist');

      service.initializeStorage();

      const data = await service.getData();
      expect(data.checklists.some((c) => c.name === 'Test Persist')).toBe(true);
    });

    // Test Case 3: Invalid JSON should reset to empty state
    it('should handle corrupted localStorage data gracefully', async () => {
      mockStorage['packingListApp'] = 'invalid json {{{';

      const data = await service.getData();

      expect(data.checklists).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.items).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Checklist Operations
  // ---------------------------------------------------------------------------

  describe('checklist operations', () => {
    // Test Case 4: Creating a checklist should add it to storage
    it('should create a new checklist', async () => {
      const checklist = await service.createChecklist({
        name: 'Japan Trip',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      });

      expect(checklist.name).toBe('Japan Trip');
      expect(checklist.id).toMatch(/^checklist-/);
    });

    // Test Case 5: New checklist should have default categories and items
    it('should create default categories and items for new checklist', async () => {
      const checklist = await service.createChecklist({ name: 'Trip' });
      const categories = await service.getCategories(checklist.id);
      const items = await service.getItems(checklist.id);

      expect(categories.length).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);
    });

    // Test Case 6: getChecklistById should return correct checklist
    it('should get checklist by ID', async () => {
      const created = await service.createChecklist({ name: 'Find Me' });
      const found = await service.getChecklistById(created.id);

      expect(found).not.toBeNull();
      expect(found.name).toBe('Find Me');
    });

    // Test Case 7: Non-existent ID should return null
    it('should return null for non-existent checklist', async () => {
      const found = await service.getChecklistById('non-existent-id');

      expect(found).toBeNull();
    });

    // Test Case 8: Update should modify the checklist
    it('should update an existing checklist', async () => {
      const created = await service.createChecklist({ name: 'Original' });
      const updated = await service.updateChecklist({ ...created, name: 'Updated' });

      expect(updated.name).toBe('Updated');
    });

    // Test Case 9: Updating non-existent checklist should throw
    it('should throw error when updating non-existent checklist', async () => {
      await expect(service.updateChecklist({ id: 'fake-id', name: 'Test' })).rejects.toThrow();
    });

    // Test Case 10: Delete should remove checklist and associated data
    it('should delete a checklist and its associated data', async () => {
      const checklist = await service.createChecklist({ name: 'To Delete' });
      await service.deleteChecklist(checklist.id);

      const found = await service.getChecklistById(checklist.id);
      expect(found).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Category Operations
  // ---------------------------------------------------------------------------

  describe('category operations', () => {
    let checklistId;

    beforeEach(async () => {
      const checklist = await service.createChecklist({ name: 'Test' });
      checklistId = checklist.id;
    });

    // Test Case 11: Creating a category should add it to storage
    it('should create a new category', async () => {
      const category = await service.createCategory(checklistId, { name: 'Clothes' });

      expect(category.name).toBe('Clothes');
      expect(category.checklistId).toBe(checklistId);
    });

    // Test Case 12: getCategories should return categories for checklist
    it('should get categories for a checklist', async () => {
      const categories = await service.getCategories(checklistId);

      expect(Array.isArray(categories)).toBe(true);
    });

    // Test Case 13: Update should modify the category
    it('should update a category', async () => {
      const category = await service.createCategory(checklistId, { name: 'Original' });
      const updated = await service.updateCategory({ ...category, name: 'Updated' });

      expect(updated.name).toBe('Updated');
    });

    // Test Case 14: Delete should remove category and its items
    it('should delete a category and its items', async () => {
      const category = await service.createCategory(checklistId, { name: 'To Delete' });
      await service.createItem(checklistId, { name: 'Item', categoryId: category.id });

      await service.deleteCategory(category.id);

      const categories = await service.getCategories(checklistId);
      expect(categories.find((c) => c.id === category.id)).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Item Operations
  // ---------------------------------------------------------------------------

  describe('item operations', () => {
    let checklistId;
    let categoryId;

    beforeEach(async () => {
      const checklist = await service.createChecklist({ name: 'Test' });
      checklistId = checklist.id;
      const category = await service.createCategory(checklistId, { name: 'TestCat' });
      categoryId = category.id;
    });

    // Test Case 15: Creating an item should add it to storage
    it('should create a new item', async () => {
      const item = await service.createItem(checklistId, {
        name: 'Passport',
        categoryId: categoryId,
        quantity: 1,
      });

      expect(item.name).toBe('Passport');
      expect(item.checklistId).toBe(checklistId);
      expect(item.isPacked).toBe(false);
    });

    // Test Case 16: Update should modify the item
    it('should update an item', async () => {
      const item = await service.createItem(checklistId, {
        name: 'Original',
        categoryId: categoryId,
      });

      const updated = await service.updateItem(checklistId, {
        ...item,
        name: 'Updated',
        isPacked: true,
      });

      expect(updated.name).toBe('Updated');
      expect(updated.isPacked).toBe(true);
    });

    // Test Case 17: Delete should remove item from storage
    it('should delete an item', async () => {
      const item = await service.createItem(checklistId, {
        name: 'To Delete',
        categoryId: categoryId,
      });

      await service.deleteItem(checklistId, item.id);

      const data = await service.getData();
      expect(data.items.find((i) => i.id === item.id)).toBeUndefined();
    });

    // Test Case 18: Toggle should flip isPacked state
    it('should toggle item packed status', async () => {
      const item = await service.createItem(checklistId, {
        name: 'Toggle Me',
        categoryId: categoryId,
      });

      expect(item.isPacked).toBe(false);

      const toggled = await service.updateItem(checklistId, {
        ...item,
        isPacked: true,
      });

      expect(toggled.isPacked).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: Caching Behavior
  // ---------------------------------------------------------------------------

  describe('caching behavior', () => {
    // Test Case 19: Cache should be used on subsequent getData calls
    it('should use cache on subsequent getData calls', async () => {
      await service.getData();
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      await service.getData();

      expect(getItemSpy).not.toHaveBeenCalled();
    });

    // Test Case 20: Save operation should update cache
    it('should update cache after save operation', async () => {
      await service.createChecklist({ name: 'New' });

      // Verify the data is immediately available via the same service (from cache)
      const data = await service.getData();

      expect(data.checklists.some((c) => c.name === 'New')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Duplicate Operations
  // ---------------------------------------------------------------------------

  describe('duplicate operations', () => {
    let checklistId;
    let categoryId;

    beforeEach(async () => {
      const checklist = await service.createChecklist({ name: 'Trip' });
      checklistId = checklist.id;
      const category = await service.createCategory(checklistId, { name: 'Clothes' });
      categoryId = category.id;
    });

    // Test Case 21: duplicateChecklist should create a copy with new ID
    it('should duplicate a checklist with all categories and items', async () => {
      await service.createItem(checklistId, { name: 'Shirt', categoryId, quantity: 2 });

      const duplicated = await service.duplicateChecklist(checklistId);

      expect(duplicated.id).not.toBe(checklistId);
      expect(duplicated.name).toContain('Trip');

      const dupCategories = await service.getCategories(duplicated.id);
      expect(dupCategories.length).toBeGreaterThan(0);

      const dupItems = await service.getItems(duplicated.id);
      expect(dupItems.length).toBeGreaterThan(0);
      // Duplicated items should have isPacked reset to false
      expect(dupItems.every((i) => i.isPacked === false)).toBe(true);
    });

    // Test Case 22: duplicateChecklist with non-existent ID should throw
    it('should throw error when duplicating non-existent checklist', async () => {
      await expect(service.duplicateChecklist('non-existent')).rejects.toThrow('not found');
    });

    // Test Case 23: duplicateCategory should create a copy with new ID
    it('should duplicate a category with all its items', async () => {
      await service.createItem(checklistId, { name: 'Pants', categoryId });

      const duplicated = await service.duplicateCategory(categoryId);

      expect(duplicated.id).not.toBe(categoryId);
      expect(duplicated.name).toContain('Clothes');
      expect(duplicated.checklistId).toBe(checklistId);

      // New category should have its own items
      const data = await service.getData();
      const dupItems = data.items.filter((i) => i.categoryId === duplicated.id);
      expect(dupItems.length).toBeGreaterThan(0);
      expect(dupItems.every((i) => i.isPacked === false)).toBe(true);
    });

    // Test Case 24: duplicateCategory with non-existent ID should throw
    it('should throw error when duplicating non-existent category', async () => {
      await expect(service.duplicateCategory('non-existent')).rejects.toThrow('not found');
    });

    // Test Case 25: duplicateItem should create a copy with new ID
    it('should duplicate an item within the same category', async () => {
      const item = await service.createItem(checklistId, {
        name: 'Shirt',
        categoryId,
        quantity: 3,
      });

      const duplicated = await service.duplicateItem(checklistId, item.id);

      expect(duplicated.id).not.toBe(item.id);
      expect(duplicated.name).toContain('Shirt');
      expect(duplicated.quantity).toBe(3);
      expect(duplicated.categoryId).toBe(categoryId);
      expect(duplicated.isPacked).toBe(false);
    });

    // Test Case 26: duplicateItem with non-existent ID should throw
    it('should throw error when duplicating non-existent item', async () => {
      await expect(service.duplicateItem(checklistId, 'non-existent')).rejects.toThrow('not found');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Batch Operations
  // ---------------------------------------------------------------------------

  describe('batch operations', () => {
    // Test Case 27: updateMultipleChecklists should update all checklists
    it('should update multiple checklists at once', async () => {
      const cl1 = await service.createChecklist({ name: 'List A' });
      const cl2 = await service.createChecklist({ name: 'List B' });

      const result = await service.updateMultipleChecklists([
        { ...cl1, name: 'Updated A', order: 1 },
        { ...cl2, name: 'Updated B', order: 0 },
      ]);

      expect(result).toHaveLength(2);

      const data = await service.getData();
      const updatedA = data.checklists.find((c) => c.id === cl1.id);
      const updatedB = data.checklists.find((c) => c.id === cl2.id);
      expect(updatedA.name).toBe('Updated A');
      expect(updatedB.name).toBe('Updated B');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: _getCopySuffix and dispose
  // ---------------------------------------------------------------------------

  describe('internal helpers', () => {
    // Test Case 28: _getCopySuffix should return localized copy suffix
    it('should return English copy suffix by default', () => {
      const suffix = service._getCopySuffix('en');
      expect(suffix).toBeTruthy();
      expect(typeof suffix).toBe('string');
    });

    // Test Case 29: _getCopySuffix should return Chinese copy suffix for zh-TW
    it('should return Chinese copy suffix for zh-TW locale', () => {
      const suffix = service._getCopySuffix('zh-TW');
      expect(suffix).toBeTruthy();
      expect(typeof suffix).toBe('string');
    });

    // Test Case 30: _getCopySuffix should fallback for unknown locale
    it('should return fallback copy suffix for unknown locale', () => {
      const suffix = service._getCopySuffix('fr');
      expect(suffix).toBe(' (Copy)');
    });

    // Test Case 31: dispose should clear cache and remove listener
    it('should dispose resources and clear cache', async () => {
      await service.getData(); // populate cache

      service.dispose();

      expect(service._cache).toBeNull();
      expect(service._initialized).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Edge Cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    // Test Case 32: Delete non-existent category should not throw
    it('should handle deleting non-existent category gracefully', async () => {
      await service.createChecklist({ name: 'Test' });
      await expect(service.deleteCategory('non-existent')).resolves.not.toThrow();
    });

    // Test Case 33: Delete non-existent item should not throw
    it('should handle deleting non-existent item gracefully', async () => {
      const cl = await service.createChecklist({ name: 'Test' });
      await expect(service.deleteItem(cl.id, 'non-existent')).resolves.not.toThrow();
    });

    // Test Case 34: Storage failure should propagate errors
    it('should propagate errors when storage save fails', async () => {
      await service.getData(); // Initialize cache

      // Override _saveData to simulate storage failure
      service._saveData = () => {
        throw new Error('Storage operation failed: quota exceeded');
      };

      await expect(service.createChecklist({ name: 'Overflow' })).rejects.toThrow(
        'Storage operation failed'
      );
    });

    // Test Case 35: Duplicate checklist name truncation for long names
    it('should truncate duplicate name when original name is at max length', async () => {
      const longName = 'a'.repeat(100);
      const cl = await service.createChecklist({ name: longName });

      const duplicated = await service.duplicateChecklist(cl.id);

      // Duplicated name should not exceed max length
      expect(duplicated.name.length).toBeLessThanOrEqual(100);
    });
  });
});
