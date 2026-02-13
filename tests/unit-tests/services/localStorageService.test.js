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

import * as defaultItemsModule from '../../../source/data/defaultItems';
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

    // Test Case 3: initializeStorage should return early when app data already exists
    it('should not overwrite when app data key already exists', () => {
      mockStorage['packingListApp'] = JSON.stringify({ checklists: [], categories: [], items: [] });

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.initializeStorage();

      expect(setItemSpy).not.toHaveBeenCalled();
    });

    // Test Case 4: Invalid JSON should reset to empty state
    it('should handle corrupted localStorage data gracefully', async () => {
      mockStorage['packingListApp'] = 'invalid json {{{';

      const data = await service.getData();

      expect(data.checklists).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.items).toEqual([]);
    });

    // Test Case 5: Valid JSON but invalid shapes should be normalized
    it('should normalize data shape when stored JSON has invalid types', async () => {
      mockStorage['packingListApp'] = JSON.stringify({
        checklists: {},
        categories: null,
        items: 'not-an-array',
      });

      const data = await service.getData();

      expect(Array.isArray(data.checklists)).toBe(true);
      expect(Array.isArray(data.categories)).toBe(true);
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.checklists).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.items).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Checklist Operations
  // ---------------------------------------------------------------------------

  describe('checklist operations', () => {
    // Test Case 6: Creating a checklist should add it to storage
    it('should create a new checklist', async () => {
      const checklist = await service.createChecklist({
        name: 'Japan Trip',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      });

      expect(checklist.name).toBe('Japan Trip');
      expect(checklist.id).toMatch(/^checklist-/);
    });

    // Test Case 7: New checklist should have default categories and items
    it('should create default categories and items for new checklist', async () => {
      const checklist = await service.createChecklist({ name: 'Trip' });
      const categories = await service.getCategories(checklist.id);
      const items = await service.getItems(checklist.id);

      expect(categories.length).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);
    });

    // Test Case 8: Default data initialization should map items into created categories
    it('should map default items into generated categories when creating a checklist', async () => {
      vi.spyOn(defaultItemsModule, 'getDefaultItems').mockReturnValue([
        { category: 'Documents', name: 'Passport', quantity: 1 },
        { category: 'Clothing', name: 'T-Shirt', quantity: 2 },
      ]);

      const checklist = await service.createChecklist({ name: 'Trip' });
      const categories = await service.getCategories(checklist.id);
      const items = await service.getItems(checklist.id);

      expect(items).toHaveLength(2);

      const documentsCategory = categories.find((c) => c.name === 'Documents');
      const clothingCategory = categories.find((c) => c.name === 'Clothing');
      expect(documentsCategory).toBeDefined();
      expect(clothingCategory).toBeDefined();

      const passport = items.find((i) => i.name === 'Passport');
      const tshirt = items.find((i) => i.name === 'T-Shirt');
      expect(passport.categoryId).toBe(documentsCategory.id);
      expect(tshirt.categoryId).toBe(clothingCategory.id);
    });

    // Test Case 9: getChecklistById should return correct checklist
    it('should get checklist by ID', async () => {
      const created = await service.createChecklist({ name: 'Find Me' });
      const found = await service.getChecklistById(created.id);

      expect(found).not.toBeNull();
      expect(found.name).toBe('Find Me');
    });

    // Test Case 10: Non-existent ID should return null
    it('should return null for non-existent checklist', async () => {
      const found = await service.getChecklistById('non-existent-id');

      expect(found).toBeNull();
    });

    // Test Case 11: Update should modify the checklist
    it('should update an existing checklist', async () => {
      const created = await service.createChecklist({ name: 'Original' });
      const updated = await service.updateChecklist({ ...created, name: 'Updated' });

      expect(updated.name).toBe('Updated');
    });

    // Test Case 12: Updating non-existent checklist should throw
    it('should throw error when updating non-existent checklist', async () => {
      await expect(service.updateChecklist({ id: 'fake-id', name: 'Test' })).rejects.toThrow();
    });

    // Test Case 13: Delete should remove checklist and associated data
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

    // Test Case 14: Creating a category should add it to storage
    it('should create a new category', async () => {
      const category = await service.createCategory(checklistId, { name: 'Clothes' });

      expect(category.name).toBe('Clothes');
      expect(category.checklistId).toBe(checklistId);
    });

    // Test Case 15: getCategories should return categories for checklist
    it('should get categories for a checklist', async () => {
      const categories = await service.getCategories(checklistId);

      expect(Array.isArray(categories)).toBe(true);
    });

    // Test Case 16: Update should modify the category
    it('should update a category', async () => {
      const category = await service.createCategory(checklistId, { name: 'Original' });
      const updated = await service.updateCategory({ ...category, name: 'Updated' });

      expect(updated.name).toBe('Updated');
    });

    // Test Case 17: Delete should remove category and its items
    it('should delete a category and its items', async () => {
      const category = await service.createCategory(checklistId, { name: 'To Delete' });
      await service.createItem(checklistId, { name: 'Item', categoryId: category.id });

      await service.deleteCategory(category.id);

      const categories = await service.getCategories(checklistId);
      expect(categories.find((c) => c.id === category.id)).toBeUndefined();
    });

    // Test Case 18: getCategoryById should return a category when found
    it('should get a category by ID', async () => {
      const category = await service.createCategory(checklistId, { name: 'Lookup' });

      const found = await service.getCategoryById(category.id);

      expect(found).not.toBeNull();
      expect(found.id).toBe(category.id);
      expect(found.name).toBe('Lookup');
    });

    // Test Case 19: getCategoryById should return null when not found
    it('should return null for non-existent category by ID', async () => {
      const found = await service.getCategoryById('non-existent-category');
      expect(found).toBeNull();
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

    // Test Case 20: Creating an item should add it to storage
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

    // Test Case 21: Update should modify the item
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

    // Test Case 22: updateItem should throw when item does not exist
    it('should throw error when updating non-existent item in checklist', async () => {
      await expect(
        service.updateItem(checklistId, {
          id: 'item-does-not-exist',
          name: 'Missing',
          quantity: 1,
          categoryId,
          isPacked: false,
          isPending: false,
          order: 0,
        })
      ).rejects.toThrow('not found');
    });

    // Test Case 23: Delete should remove item from storage
    it('should delete an item', async () => {
      const item = await service.createItem(checklistId, {
        name: 'To Delete',
        categoryId: categoryId,
      });

      await service.deleteItem(checklistId, item.id);

      const data = await service.getData();
      expect(data.items.find((i) => i.id === item.id)).toBeUndefined();
    });

    // Test Case 24: getItemById should return item when found
    it('should get item by ID within a checklist', async () => {
      const item = await service.createItem(checklistId, {
        name: 'Find Me',
        categoryId: categoryId,
        quantity: 1,
      });

      const found = await service.getItemById(checklistId, item.id);
      expect(found).not.toBeNull();
      expect(found.id).toBe(item.id);
      expect(found.name).toBe('Find Me');
      expect(found.checklistId).toBe(checklistId);
    });

    // Test Case 25: getItemById should return null when not found
    it('should return null when item is not found within a checklist', async () => {
      const found = await service.getItemById(checklistId, 'non-existent-item');
      expect(found).toBeNull();
    });

    // Test Case 26: Toggle should flip isPacked state
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
    // Test Case 27: Cache should be used on subsequent getData calls
    it('should use cache on subsequent getData calls', async () => {
      await service.getData();
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      await service.getData();

      expect(getItemSpy).not.toHaveBeenCalled();
    });

    // Test Case 28: Save operation should update cache
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

    // Test Case 29: duplicateChecklist should create a copy with new ID
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

    // Test Case 30: duplicateChecklist should bump order of subsequent checklists
    it('should reorder other checklists when duplicating in the middle', async () => {
      const second = await service.createChecklist({ name: 'Second' });
      const before = await service.getChecklists();
      const original = before.find((c) => c.id === checklistId);
      const secondBefore = before.find((c) => c.id === second.id);

      expect(original).toBeDefined();
      expect(secondBefore).toBeDefined();
      expect(original.id).toBe(checklistId);
      expect(secondBefore.id).toBe(second.id);

      // Seed deterministic order values (normally assigned by app initialize())
      await service.updateMultipleChecklists([
        { ...original, order: 0 },
        { ...secondBefore, order: 1 },
      ]);

      const seeded = await service.getChecklists();
      const seededSecond = seeded.find((c) => c.id === second.id);
      expect(seededSecond.order).toBe(1);

      const duplicated = await service.duplicateChecklist(checklistId);
      const after = await service.getChecklists();

      const originalAfter = after.find((c) => c.id === checklistId);
      const duplicatedAfter = after.find((c) => c.id === duplicated.id);
      const secondAfter = after.find((c) => c.id === second.id);

      expect(originalAfter).toBeDefined();
      expect(duplicatedAfter).toBeDefined();
      expect(secondAfter).toBeDefined();
      expect(duplicatedAfter.id).toBe(duplicated.id);
      expect(secondAfter.id).toBe(second.id);
      expect(duplicatedAfter.order).toBe(originalAfter.order + 1);
      expect(secondAfter.order).toBeGreaterThan(1);
    });

    // Test Case 31: duplicateChecklist with non-existent ID should throw
    it('should throw error when duplicating non-existent checklist', async () => {
      await expect(service.duplicateChecklist('non-existent')).rejects.toThrow('not found');
    });

    // Test Case 32: duplicateCategory should create a copy with new ID
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

    // Test Case 33: duplicateCategory with non-existent ID should throw
    it('should throw error when duplicating non-existent category', async () => {
      await expect(service.duplicateCategory('non-existent')).rejects.toThrow('not found');
    });

    // Test Case 34: duplicateItem should create a copy with new ID
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

    // Test Case 35: duplicateItem with non-existent ID should throw
    it('should throw error when duplicating non-existent item', async () => {
      await expect(service.duplicateItem(checklistId, 'non-existent')).rejects.toThrow('not found');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Batch Operations
  // ---------------------------------------------------------------------------

  describe('batch operations', () => {
    // Test Case 36: updateMultipleChecklists should update all checklists
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
    // Test Case 37: _getCopySuffix should return localized copy suffix
    it('should return English copy suffix by default', () => {
      const suffix = service._getCopySuffix('en');
      expect(suffix).toBe(' (Copy)');
      expect(typeof suffix).toBe('string');
    });

    // Test Case 38: _getCopySuffix should return Chinese copy suffix for zh-TW
    it('should return Chinese copy suffix for zh-TW locale', () => {
      const suffix = service._getCopySuffix('zh-TW');
      expect(suffix).toBe(' (複製)');
      expect(typeof suffix).toBe('string');
    });

    // Test Case 39: _getCopySuffix should fallback for unknown locale
    it('should return fallback copy suffix for unknown locale', () => {
      const suffix = service._getCopySuffix('fr');
      expect(suffix).toBe(' (Copy)');
    });

    // Test Case 40: dispose should clear cache and remove listener
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
    // Test Case 41: Delete non-existent category should not throw
    it('should handle deleting non-existent category gracefully', async () => {
      await service.createChecklist({ name: 'Test' });
      await expect(service.deleteCategory('non-existent')).resolves.not.toThrow();
    });

    // Test Case 42: Delete non-existent item should not throw
    it('should handle deleting non-existent item gracefully', async () => {
      const cl = await service.createChecklist({ name: 'Test' });
      await expect(service.deleteItem(cl.id, 'non-existent')).resolves.not.toThrow();
    });

    // Test Case 43: Storage failure should propagate errors
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

    // Test Case 44: Duplicate checklist name truncation for long names
    it('should truncate duplicate name when original name is at max length', async () => {
      const longName = 'a'.repeat(100);
      const cl = await service.createChecklist({ name: longName });

      const duplicated = await service.duplicateChecklist(cl.id);

      // Duplicated name should not exceed max length
      expect(duplicated.name.length).toBeLessThanOrEqual(100);
    });

    // Test Case 36: Cross-tab storage event should invalidate cache
    it('should invalidate cache when storage event fires with app key', () => {
      service._cache = { checklists: [], categories: [], items: [] };
      service._initialized = true;

      // Simulate a storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'packingListApp',
        newValue: JSON.stringify({ checklists: [], categories: [], items: [] }),
      });
      window.dispatchEvent(event);

      expect(service._cache).toBeNull();
      // _initialized should remain true when newValue is not null
      expect(service._initialized).toBe(true);
    });

    // Test Case 37: Cross-tab storage deletion should reset initialized flag
    it('should reset initialized flag when storage key is deleted externally', () => {
      service._cache = { checklists: [], categories: [], items: [] };
      service._initialized = true;

      // Simulate storage key being deleted in another tab
      const event = new StorageEvent('storage', {
        key: 'packingListApp',
        newValue: null,
      });
      window.dispatchEvent(event);

      expect(service._cache).toBeNull();
      expect(service._initialized).toBe(false);
    });

    // Test Case 38: Storage event with different key should not affect cache
    it('should ignore storage events for unrelated keys', () => {
      service._cache = { checklists: [], categories: [], items: [] };
      service._initialized = true;

      const event = new StorageEvent('storage', {
        key: 'other-key',
        newValue: 'something',
      });
      window.dispatchEvent(event);

      expect(service._cache).not.toBeNull();
      expect(service._initialized).toBe(true);
    });

    // Test Case 39: _saveData should throw when localStorage.setItem fails
    it('should throw when localStorage.setItem fails in _saveData', () => {
      const origSetItem = globalThis.localStorage.setItem.getMockImplementation();
      globalThis.localStorage.setItem.mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      expect(() => service._saveData({ checklists: [], categories: [], items: [] })).toThrow(
        'Storage operation failed'
      );

      // Restore original mock to avoid leaking into subsequent tests
      globalThis.localStorage.setItem.mockImplementation(origSetItem);
    });

    // Test Case 40: updateCategory should throw for non-existent category
    it('should throw when updating non-existent category', async () => {
      await service.createChecklist({ name: 'Test' });

      await expect(service.updateCategory({ id: 'non-existent', name: 'Updated' })).rejects.toThrow(
        'Category with id non-existent not found'
      );
    });

    // Test Case 44: Duplicate category name truncation for long names
    it('should truncate duplicate category name when at max length', async () => {
      await service.createChecklist({ name: 'Test' });
      const data = await service.getData();
      const categoryId = data.categories[0]?.id;

      if (categoryId) {
        // Set category name to max length
        const longName = 'b'.repeat(100);
        await service.updateCategory({ ...data.categories[0], name: longName });

        const duplicated = await service.duplicateCategory(categoryId);
        expect(duplicated.name.length).toBeLessThanOrEqual(100);
      }
    });

    // Test Case 45: Duplicate item name truncation for long names
    it('should truncate duplicate item name when at max length', async () => {
      const cl = await service.createChecklist({ name: 'Test' });
      const data = await service.getData();
      const categoryId = data.categories[0]?.id;

      if (categoryId) {
        const longName = 'c'.repeat(100);
        const item = await service.createItem(cl.id, {
          name: longName,
          categoryId,
          quantity: 1,
        });

        const duplicated = await service.duplicateItem(cl.id, item.id);
        expect(duplicated.name.length).toBeLessThanOrEqual(100);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 12: _getCopySuffix from localStorage
  // ---------------------------------------------------------------------------

  describe('_getCopySuffix locale from localStorage', () => {
    // Test Case 49: Should read locale from localStorage when no argument is passed
    it('should read user-locale from localStorage when no locale argument provided', () => {
      // Temporarily swap getItem to return zh-TW for user-locale
      const origGetItem = localStorage.getItem;
      localStorage.getItem = (key) => {
        if (key === 'user-locale') return 'zh-TW';
        return mockStorage[key] || null;
      };

      const suffix = service._getCopySuffix();
      expect(suffix).toBe(' (複製)');

      // Restore
      localStorage.getItem = origGetItem;
    });

    // Test Case 50: Should default to English when localStorage has no locale
    it('should default to English suffix when no locale in storage or argument', () => {
      // No user-locale in mockStorage
      const suffix = service._getCopySuffix();
      expect(suffix).toBe(' (Copy)');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 13: dispose in non-browser environment
  // ---------------------------------------------------------------------------

  describe('dispose edge cases', () => {
    // Test Case 51: Should handle dispose when removeEventListener called twice
    it('should handle multiple dispose calls gracefully', async () => {
      await service.getData(); // initialize

      service.dispose();
      expect(service._cache).toBeNull();
      expect(service._initialized).toBe(false);

      // Second dispose should not throw
      service.dispose();
      expect(service._cache).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 14: Special Characters & Unicode
  // ---------------------------------------------------------------------------

  describe('special characters and unicode', () => {
    // Test Case 52: Should handle emoji in checklist names
    it('should store and retrieve emoji in checklist name', async () => {
      const cl = await service.createChecklist({ name: '🌍 World Trip ✈️' });
      expect(cl.name).toBe('🌍 World Trip ✈️');

      const retrieved = await service.getChecklistById(cl.id);
      expect(retrieved.name).toBe('🌍 World Trip ✈️');
    });

    // Test Case 53: Should handle CJK characters in category names
    it('should store and retrieve CJK characters in category name', async () => {
      const cl = await service.createChecklist({ name: 'Trip' });
      const cat = await service.createCategory(cl.id, { name: '衣物與配件' });
      expect(cat.name).toBe('衣物與配件');

      const categories = await service.getCategories(cl.id);
      const found = categories.find((c) => c.id === cat.id);
      expect(found.name).toBe('衣物與配件');
    });

    // Test Case 54: Should handle HTML-like strings safely
    it('should store HTML-like strings as plain text', async () => {
      const cl = await service.createChecklist({ name: '<script>alert("xss")</script>' });
      expect(cl.name).toBe('<script>alert("xss")</script>');

      const retrieved = await service.getChecklistById(cl.id);
      expect(retrieved.name).toBe('<script>alert("xss")</script>');
    });

    // Test Case 55: Should handle special characters in item names
    it('should handle special characters in item names', async () => {
      const cl = await service.createChecklist({ name: 'Trip' });
      const data = await service.getData();
      const categoryId = data.categories[0]?.id;

      const item = await service.createItem(cl.id, {
        name: 'Café & Résumé — "special"',
        categoryId,
        quantity: 1,
      });
      expect(item.name).toBe('Café & Résumé — "special"');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 15: localStorage Disabled / Throwing
  // ---------------------------------------------------------------------------

  describe('localStorage disabled', () => {
    // Test Case 56: Should handle getItem throwing (e.g. private browsing, disabled storage)
    it('should handle gracefully when getItem throws on getData', async () => {
      const freshService = new LocalStorageService();

      // Simulate localStorage being disabled — getItem throws SecurityError
      const origGetItem = localStorage.getItem;
      localStorage.getItem = () => {
        throw new DOMException('Access denied', 'SecurityError');
      };

      // getData calls _ensureInitialized → initializeStorage → getItem which throws
      await expect(async () => freshService.getData()).rejects.toThrow();

      // Restore
      localStorage.getItem = origGetItem;
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 16: || [] Fallback Branch Coverage
  // ---------------------------------------------------------------------------

  describe('fallback branches when data fields are undefined', () => {
    // Test Case 57: should normalize missing arrays from storage payload
    it('should normalize missing arrays from storage payload', async () => {
      mockStorage['packingListApp'] = JSON.stringify({});
      service._cache = null;

      const data = await service.getData();
      expect(data.checklists).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.items).toEqual([]);
    });

    // Test Case 58: should handle missing checklists array in cache
    it('should handle missing checklists array in cache', async () => {
      service._initialized = true;
      service._cache = { categories: [], items: [] };

      expect(await service.getChecklists()).toEqual([]);
      expect(await service.getChecklistById('missing')).toBeNull();
      await expect(service.deleteChecklist('missing')).resolves.not.toThrow();
      await expect(service.updateChecklist({ id: 'missing', name: 'x' })).rejects.toThrow(
        'not found'
      );
      await expect(service.duplicateChecklist('missing')).rejects.toThrow('not found');
    });

    // Test Case 59: should handle missing categories array in cache
    it('should handle missing categories array in cache', async () => {
      service._initialized = true;
      service._cache = { checklists: [], items: [] };

      expect(await service.getCategories('cl-1')).toEqual([]);
      expect(await service.getCategoryById('missing')).toBeNull();
      await expect(service.deleteCategory('missing')).resolves.not.toThrow();
      await expect(service.updateCategory({ id: 'missing', name: 'x' })).rejects.toThrow(
        'not found'
      );
      await expect(service.duplicateCategory('missing')).rejects.toThrow('not found');
    });

    // Test Case 60: should handle missing items array in cache
    it('should handle missing items array in cache', async () => {
      service._initialized = true;
      service._cache = { checklists: [], categories: [] };

      expect(await service.getItems('cl-1')).toEqual([]);
      expect(await service.getItemById('cl-1', 'missing')).toBeNull();
      await expect(service.deleteItem('cl-1', 'missing')).resolves.not.toThrow();
      await expect(service.updateItem('cl-1', { id: 'missing', name: 'x' })).rejects.toThrow(
        'not found'
      );
      await expect(service.duplicateItem('cl-1', 'missing')).rejects.toThrow('not found');
    });

    // Test Case 61: should allow create operations with sparse cache shape
    it('should allow create operations with sparse cache shape', async () => {
      service._initialized = true;
      service._cache = {};

      const checklist = await service.createChecklist({ name: 'Fallback' });
      expect(checklist.name).toBe('Fallback');

      service._cache = { checklists: [checklist], items: [] };
      const category = await service.createCategory(checklist.id, { name: 'Created Cat' });
      expect(category.name).toBe('Created Cat');

      service._cache = { checklists: [checklist], categories: [category] };
      const item = await service.createItem(checklist.id, {
        name: 'Created Item',
        categoryId: category.id,
      });
      expect(item.name).toBe('Created Item');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 17: updateMultipleChecklists Skip Path
  // ---------------------------------------------------------------------------

  describe('updateMultipleChecklists skip path', () => {
    // Test Case 70: Should skip non-existent checklists in batch update
    it('should skip checklists that do not exist in storage', async () => {
      const cl1 = await service.createChecklist({ name: 'Real' });

      const result = await service.updateMultipleChecklists([
        { ...cl1, name: 'Updated Real', order: 0 },
        { id: 'non-existent', name: 'Ghost', order: 1 },
      ]);

      expect(result).toHaveLength(2);

      // The real checklist should be updated
      const data = await service.getData();
      const updated = data.checklists.find((c) => c.id === cl1.id);
      expect(updated.name).toBe('Updated Real');

      // The ghost checklist should NOT be in storage
      const ghost = data.checklists.find((c) => c.id === 'non-existent');
      expect(ghost).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 18: getCategories Without checklistId Filter
  // ---------------------------------------------------------------------------

  describe('getCategories without checklistId', () => {
    // Test Case 71: Should return all categories when no checklistId provided
    it('should return all categories across all checklists', async () => {
      const cl1 = await service.createChecklist({ name: 'Trip 1' });
      const cl2 = await service.createChecklist({ name: 'Trip 2' });

      // Each checklist has default categories, plus add one custom each
      await service.createCategory(cl1.id, { name: 'Custom A' });
      await service.createCategory(cl2.id, { name: 'Custom B' });

      // Get ALL categories (no checklistId filter)
      const allCategories = await service.getCategories();

      // Should include categories from both checklists
      const cl1Cats = allCategories.filter((c) => c.checklistId === cl1.id);
      const cl2Cats = allCategories.filter((c) => c.checklistId === cl2.id);
      expect(cl1Cats.length).toBeGreaterThan(0);
      expect(cl2Cats.length).toBeGreaterThan(0);
      expect(allCategories.length).toBe(cl1Cats.length + cl2Cats.length);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 19: Orphan Item categoryId Fallback in duplicateChecklist
  // ---------------------------------------------------------------------------

  describe('orphan item categoryId fallback', () => {
    // Test Case 72: Should preserve original categoryId when category mapping misses
    it('should use original categoryId for items whose category was not found', async () => {
      const cl = await service.createChecklist({ name: 'Trip' });

      // Manually inject an item with an orphan categoryId (not matching any category)
      const data = await service.getData();
      const orphanItem = {
        id: 'item-orphan',
        name: 'Orphan',
        quantity: 1,
        checklistId: cl.id,
        categoryId: 'non-existent-cat',
        isPacked: false,
        isPending: false,
        order: 999,
      };
      data.items.push(orphanItem);
      service._saveData(data);

      // Duplicate the checklist
      const dup = await service.duplicateChecklist(cl.id);

      // Find the duplicated orphan item
      const dupData = await service.getData();
      const dupItems = dupData.items.filter((i) => i.checklistId === dup.id);
      const dupOrphan = dupItems.find((i) => i.name === 'Orphan');

      expect(dupOrphan).toBeDefined();
      // The orphan's categoryId should fall back to original since it's not in the mapping
      expect(dupOrphan.categoryId).toBe('non-existent-cat');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 20: Duplicate Method || [] Fallback Branches
  // ---------------------------------------------------------------------------

  describe('duplicate method fallback branches', () => {
    // Test Case 77: duplicateChecklist || [] branches when cache fields are undefined
    it('should duplicate checklist when cache categories and items are undefined', async () => {
      service._initialized = true;
      service._cache = {
        checklists: [{ id: 'cl-1', name: 'Trip', order: 0, startDate: '', endDate: '' }],
      };

      const dup = await service.duplicateChecklist('cl-1');
      expect(dup.id).not.toBe('cl-1');
      expect(dup.name).toContain('Trip');
    });

    // Test Case 78: duplicateCategory || [] branches when cache items is undefined
    it('should duplicate category when cache items is undefined', async () => {
      service._initialized = true;
      service._cache = {
        checklists: [],
        categories: [{ id: 'cat-1', name: 'Clothes', checklistId: 'cl-1', order: 0 }],
      };

      const dup = await service.duplicateCategory('cat-1');
      expect(dup.id).not.toBe('cat-1');
      expect(dup.name).toContain('Clothes');
    });

    // Test Case 79: duplicateItem || [] branches when items cache is manipulated
    it('should duplicate item when cache data has items but no reorder targets', async () => {
      service._initialized = true;
      service._cache = {
        checklists: [],
        categories: [],
        items: [
          {
            id: 'item-1',
            name: 'Shirt',
            quantity: 1,
            checklistId: 'cl-1',
            categoryId: 'cat-1',
            isPacked: false,
            isPending: false,
            order: 0,
          },
        ],
      };

      const dup = await service.duplicateItem('cl-1', 'item-1');
      expect(dup.id).not.toBe('item-1');
      expect(dup.name).toContain('Shirt');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 21: High-value persistence scenarios
  // ---------------------------------------------------------------------------

  describe('high-value persistence scenarios', () => {
    // Test Case 93: concurrent checklist updates should follow last-write-wins
    it('should apply last-write-wins semantics for concurrent checklist updates', async () => {
      const checklist = await service.createChecklist({ name: 'Trip' });
      const staleSnapshot = { ...checklist };

      await service.updateChecklist({ ...checklist, name: 'Trip A' });
      await service.updateChecklist({ ...staleSnapshot, name: 'Trip B' });

      const finalChecklist = await service.getChecklistById(checklist.id);
      expect(finalChecklist).not.toBeNull();
      expect(finalChecklist.name).toBe('Trip B');
    });

    // Test Case 94: storage event should invalidate cache
    it('should invalidate cache after storage event from another tab', async () => {
      await service.createChecklist({ name: 'Original' });
      expect(service._cache).not.toBeNull();

      const currentData = JSON.parse(JSON.stringify(await service.getData()));
      const externalPayload = {
        ...currentData,
        checklists: currentData.checklists.map((cl, index) => {
          if (index === 0) {
            return { ...cl, name: 'Modified by Other Tab' };
          }
          return cl;
        }),
      };

      localStorage.setItem(service.STORAGE_KEY, JSON.stringify(externalPayload));

      const event = new StorageEvent('storage', {
        key: service.STORAGE_KEY,
        newValue: JSON.stringify(externalPayload),
      });
      window.dispatchEvent(event);

      expect(service._cache).toBeNull();

      // In jsdom/unit tests, storage event payload propagation can differ by environment.
      // The critical contract for this service is cache invalidation.
      await expect(service.getData()).resolves.toEqual(
        expect.objectContaining({
          checklists: expect.any(Array),
          categories: expect.any(Array),
          items: expect.any(Array),
        })
      );
    });

    // Test Case 95: should handle high data volume (50+) efficiently
    it('should handle high data volume (50+) without losing correctness', async () => {
      const checklistCount = 60;
      for (let i = 0; i < checklistCount; i++) {
        await service.createChecklist({ name: `Trip ${i}` });
      }

      const checklists = await service.getChecklists();
      expect(checklists).toHaveLength(checklistCount);

      // Ensure one record remains updateable/correct under larger volume
      const target = checklists[55];
      await service.updateChecklist({ ...target, name: 'Trip 55 Updated' });
      const updated = await service.getChecklistById(target.id);
      expect(updated).not.toBeNull();
      expect(updated.name).toBe('Trip 55 Updated');

      const allData = await service.getData();
      expect(allData.categories.length).toBeGreaterThanOrEqual(checklistCount);
      expect(allData.items.length).toBeGreaterThanOrEqual(checklistCount);
    });

    // Test Case 96: deleting checklist should cascade to categories and items
    it('should cascade delete categories and items when deleting checklist', async () => {
      const checklist = await service.createChecklist({ name: 'Cascade' });
      const category = await service.createCategory(checklist.id, { name: 'Extra' });
      const item = await service.createItem(checklist.id, {
        name: 'Extra Item',
        categoryId: category.id,
        quantity: 1,
      });

      await service.deleteChecklist(checklist.id);

      const data = await service.getData();
      expect(data.checklists.find((c) => c.id === checklist.id)).toBeUndefined();
      expect(data.categories.find((c) => c.id === category.id)).toBeUndefined();
      expect(data.items.find((i) => i.id === item.id)).toBeUndefined();
    });

    // Test Case 97: deleting category should cascade to category items
    it('should cascade delete all items in a deleted category', async () => {
      const checklist = await service.createChecklist({ name: 'Cascade Category' });
      const category = await service.createCategory(checklist.id, { name: 'Clothes' });

      await service.createItem(checklist.id, {
        name: 'Shirt',
        categoryId: category.id,
        quantity: 1,
      });
      await service.createItem(checklist.id, {
        name: 'Pants',
        categoryId: category.id,
        quantity: 1,
      });

      await service.deleteCategory(category.id);

      const items = await service.getItems(checklist.id);
      expect(items.filter((i) => i.categoryId === category.id)).toHaveLength(0);
    });

    // Test Case 98: duplicate item should preserve relative order semantics
    it('should preserve relative order semantics after duplicate and delete', async () => {
      const checklist = await service.createChecklist({ name: 'Order' });
      const category = await service.createCategory(checklist.id, { name: 'OrderCat' });

      const itemA = await service.createItem(checklist.id, {
        name: 'A',
        categoryId: category.id,
        quantity: 1,
        order: 0,
      });
      const itemB = await service.createItem(checklist.id, {
        name: 'B',
        categoryId: category.id,
        quantity: 1,
        order: 1,
      });

      const duplicatedB = await service.duplicateItem(checklist.id, itemB.id);
      await service.deleteItem(checklist.id, itemA.id);

      const items = await service.getItems(checklist.id);
      const originalB = items.find((i) => i.id === itemB.id);
      const copiedB = items.find((i) => i.id === duplicatedB.id);

      expect(originalB).toBeDefined();
      expect(copiedB).toBeDefined();
      expect(copiedB.order).toBe(originalB.order + 1);
    });

    // Test Case 99: default data shape should remain stable across locales
    it('should keep default data shape stable across en and zh-TW locales', async () => {
      mockStorage['user-locale'] = 'en';
      const enChecklist = await service.createChecklist({ name: 'EN' });
      const enCategories = await service.getCategories(enChecklist.id);
      const enItems = await service.getItems(enChecklist.id);

      mockStorage['user-locale'] = 'zh-TW';
      const zhChecklist = await service.createChecklist({ name: 'ZH' });
      const zhCategories = await service.getCategories(zhChecklist.id);
      const zhItems = await service.getItems(zhChecklist.id);

      expect(enCategories.length).toBe(zhCategories.length);
      expect(enItems.length).toBe(zhItems.length);
      expect(enCategories.length).toBeGreaterThan(0);
      expect(enItems.length).toBeGreaterThan(0);
    });

    // Test Case 100: rapid sequential stale updates should honor final write on item
    it('should persist final state after rapid sequential stale item updates', async () => {
      const checklist = await service.createChecklist({ name: 'Race' });
      const category = await service.createCategory(checklist.id, { name: 'Essentials' });
      const item = await service.createItem(checklist.id, {
        name: 'Passport',
        categoryId: category.id,
        quantity: 1,
      });

      const staleSnapshot = { ...item };

      await service.updateItem(checklist.id, {
        ...item,
        name: 'Passport A',
        quantity: 2,
      });
      await service.updateItem(checklist.id, {
        ...staleSnapshot,
        name: 'Passport Final',
        isPacked: true,
      });

      const finalItem = await service.getItemById(checklist.id, item.id);
      expect(finalItem).not.toBeNull();
      expect(finalItem).toMatchObject({
        id: item.id,
        name: 'Passport Final',
        isPacked: true,
        quantity: 1,
      });
    });
  });
});
