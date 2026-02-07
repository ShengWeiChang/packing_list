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
});
