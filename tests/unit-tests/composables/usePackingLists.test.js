/*
================================================================================
File: tests/unit-tests/composables/usePackingLists.test.js
Description: Unit tests for usePackingLists composable.
             Tests reactive state management and CRUD operations.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-05
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePackingLists } from '../../../source/composables/usePackingLists';
import { LocalStorageService } from '../../../source/services/localStorageService';

// -----------------------------------------------------------------------------
// usePackingLists Tests
// -----------------------------------------------------------------------------

describe('usePackingLists', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Initial State
  // ---------------------------------------------------------------------------

  describe('initial state', () => {
    // Test Case 1: Composable should start with empty collections
    it('should return initial empty state', () => {
      const { checklists, categories, items, selectedChecklistId, isLoading, error } =
        usePackingLists();

      expect(checklists.value).toEqual([]);
      expect(categories.value).toEqual([]);
      expect(items.value).toEqual([]);
      expect(selectedChecklistId.value).toBeNull();
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    // Test Case 2: Computed properties should be accessible
    it('should have computed properties', () => {
      const { selectedChecklist, totalItems, packedItems, progress } = usePackingLists();

      expect(selectedChecklist.value).toBeUndefined();
      expect(totalItems.value).toBe(0);
      expect(packedItems.value).toBe(0);
      expect(progress.value).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Initialize
  // ---------------------------------------------------------------------------

  describe('initialize', () => {
    // Test Case 3: Initialize should populate state from localStorage
    it('should load data from storage on initialize', async () => {
      const { initialize, checklists } = usePackingLists();

      await initialize();

      expect(Array.isArray(checklists.value)).toBe(true);
    });

    // Test Case 4: isLoading should transition during async operation
    it('should manage loading state during initialization', async () => {
      const { initialize, isLoading } = usePackingLists();

      expect(isLoading.value).toBe(false);

      // After initialize completes, loading should be false
      await initialize();
      expect(isLoading.value).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Checklist Operations
  // ---------------------------------------------------------------------------

  describe('checklist operations', () => {
    // Test Case 5: Creating a checklist should add it to state
    it('should create a new checklist', async () => {
      const { initialize, createChecklist, checklists, selectedChecklistId } = usePackingLists();

      await initialize();
      const checklist = await createChecklist({ name: 'Japan Trip' });

      expect(checklist).not.toBeNull();
      expect(checklist.name).toBe('Japan Trip');
      expect(checklists.value.length).toBeGreaterThan(0);
      expect(selectedChecklistId.value).toBe(checklist.id);
    });

    // Test Case 6: First checklist should be auto-selected
    it('should select the first checklist after creation', async () => {
      const { initialize, createChecklist, selectedChecklistId, selectedChecklist } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'First' });

      expect(selectedChecklistId.value).not.toBeNull();
      expect(selectedChecklist.value).toBeDefined();
      expect(selectedChecklist.value.name).toBe('First');
    });

    // Test Case 7: Update should modify checklist data
    it('should update an existing checklist', async () => {
      const { initialize, createChecklist, updateChecklist, checklists } = usePackingLists();

      await initialize();
      const created = await createChecklist({ name: 'Original' });
      await updateChecklist({ ...created, name: 'Updated' });

      const updated = checklists.value.find((c) => c.id === created.id);
      expect(updated.name).toBe('Updated');
    });

    // Test Case 8: Delete should remove checklist from state
    it('should delete a checklist', async () => {
      const { initialize, createChecklist, deleteChecklist, checklists } = usePackingLists();

      await initialize();
      const created = await createChecklist({ name: 'To Delete' });
      const countBefore = checklists.value.length;

      await deleteChecklist(created.id);

      expect(checklists.value.length).toBe(countBefore - 1);
      expect(checklists.value.find((c) => c.id === created.id)).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Category Operations
  // ---------------------------------------------------------------------------

  describe('category operations', () => {
    // Test Case 9: Category should be created in current checklist
    it('should create a category in the selected checklist', async () => {
      const { initialize, createChecklist, createCategory, categories } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      const category = await createCategory({ name: 'Clothes' });

      expect(category).not.toBeNull();
      expect(category.name).toBe('Clothes');
      expect(categories.value.some((c) => c.name === 'Clothes')).toBe(true);
    });

    // Test Case 10: Category operations should fail without selected checklist
    it('should return null if no checklist is selected', async () => {
      const { createCategory } = usePackingLists();

      const result = await createCategory({ name: 'Test' });

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: Item Operations
  // ---------------------------------------------------------------------------

  describe('item operations', () => {
    // Test Case 11: Item should be created with correct properties
    it('should create an item in the selected checklist', async () => {
      const { initialize, createChecklist, categories, createItem, items } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toBeDefined();

      const item = await createItem({ name: 'Passport', categoryId });

      expect(item).not.toBeNull();
      expect(item.name).toBe('Passport');
      expect(items.value.some((i) => i.name === 'Passport')).toBe(true);
    });

    // Test Case 12: Toggle should flip isPacked state
    it('should toggle item packed status', async () => {
      const { initialize, createChecklist, categories, createItem, toggleItemPacked, items } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toBeDefined();

      const item = await createItem({ name: 'Test Item', categoryId });
      expect(item.isPacked).toBe(false);

      await toggleItemPacked(item);

      const updated = items.value.find((i) => i.id === item.id);
      expect(updated.isPacked).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Computed Properties
  // ---------------------------------------------------------------------------

  describe('computed properties', () => {
    // Test Case 13: Progress should reflect packed/total ratio
    it('should calculate progress correctly', async () => {
      const {
        initialize,
        createChecklist,
        categories,
        createItem,
        toggleItemPacked,
        progress,
        totalItems,
        packedItems,
      } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toBeDefined();

      const item1 = await createItem({ name: 'Item 1', categoryId });
      await createItem({ name: 'Item 2', categoryId });

      const initialPacked = packedItems.value;
      const initialTotal = totalItems.value;

      await toggleItemPacked(item1);

      expect(packedItems.value).toBe(initialPacked + 1);
      expect(totalItems.value).toBe(initialTotal);
      expect(progress.value).toBeGreaterThan(0);
    });

    // Test Case 14: Empty items should result in 0 progress
    it('should return 0 progress for empty checklist', async () => {
      const { progress, totalItems } = usePackingLists();

      expect(totalItems.value).toBe(0);
      expect(progress.value).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Error Handling
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    // Test Case 15: localStorage corruption should be handled gracefully
    it('should handle storage errors gracefully during initialization', async () => {
      const { initialize, checklists, error } = usePackingLists();

      mockStorage['packingListApp'] = 'invalid json {{{';

      await initialize();

      // The service handles corrupted JSON by resetting to empty arrays
      // so the composable should not see an error
      expect(checklists.value).toEqual([]);
      expect(error.value).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Duplicate Operations
  // ---------------------------------------------------------------------------

  describe('duplicate operations', () => {
    // Test Case 16: Should duplicate a checklist
    it('should duplicate a checklist and refresh state', async () => {
      const { initialize, createChecklist, duplicateChecklist, checklists } = usePackingLists();

      await initialize();
      const original = await createChecklist({ name: 'My Trip' });
      const countBefore = checklists.value.length;

      const duplicated = await duplicateChecklist(original.id);

      expect(duplicated).not.toBeNull();
      expect(duplicated.id).not.toBe(original.id);
      expect(checklists.value.length).toBe(countBefore + 1);
    });

    // Test Case 17: Should duplicate a category
    it('should duplicate a category and refresh state', async () => {
      const { initialize, createChecklist, categories, duplicateCategory } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toBeDefined();
      const countBefore = categories.value.length;

      const duplicated = await duplicateCategory(categoryId);

      expect(duplicated).not.toBeNull();
      expect(duplicated.id).not.toBe(categoryId);
      expect(categories.value.length).toBe(countBefore + 1);
    });

    // Test Case 18: Should duplicate an item
    it('should duplicate an item and refresh state', async () => {
      const { initialize, createChecklist, categories, createItem, duplicateItem, items } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toBeDefined();

      const item = await createItem({ name: 'Shirt', categoryId });
      const countBefore = items.value.length;

      const duplicated = await duplicateItem(item.id);

      expect(duplicated).not.toBeNull();
      expect(duplicated.id).not.toBe(item.id);
      expect(items.value.length).toBe(countBefore + 1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Delete Category & Item
  // ---------------------------------------------------------------------------

  describe('delete category and item', () => {
    // Test Case 19: Should delete a category and its items
    it('should delete a category and refresh both categories and items', async () => {
      const { initialize, createChecklist, categories, createItem, deleteCategory } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toBeDefined();

      await createItem({ name: 'Test Item', categoryId });

      await deleteCategory(categoryId);

      expect(categories.value.find((c) => c.id === categoryId)).toBeUndefined();
    });

    // Test Case 20: Should delete an item
    it('should delete an item and refresh items', async () => {
      const { initialize, createChecklist, categories, createItem, deleteItem, items } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toBeDefined();

      const item = await createItem({ name: 'To Remove', categoryId });
      const countBefore = items.value.length;

      await deleteItem(item.id);

      expect(items.value.length).toBe(countBefore - 1);
      expect(items.value.find((i) => i.id === item.id)).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 10: updateMultipleChecklists
  // ---------------------------------------------------------------------------

  describe('updateMultipleChecklists', () => {
    // Test Case 21: Should update multiple checklists at once
    it('should update multiple checklists and refresh state', async () => {
      const { initialize, createChecklist, updateMultipleChecklists, checklists } =
        usePackingLists();

      await initialize();
      const cl1 = await createChecklist({ name: 'List A' });
      const cl2 = await createChecklist({ name: 'List B' });

      const result = await updateMultipleChecklists([
        { ...cl1, order: 1 },
        { ...cl2, order: 0 },
      ]);

      expect(result).not.toBeNull();
      // After update, checklists should be re-sorted
      expect(checklists.value[0].id).toBe(cl2.id);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 11: Null-guard paths
  // ---------------------------------------------------------------------------

  describe('null-guard paths', () => {
    // Test Case 22: createItem without selected checklist should return null
    it('should return null when creating item without selected checklist', async () => {
      const { createItem } = usePackingLists();

      const result = await createItem({ name: 'Test' });
      expect(result).toBeNull();
    });

    // Test Case 23: duplicateItem without selected checklist should return null
    it('should return null when duplicating item without selected checklist', async () => {
      const { duplicateItem } = usePackingLists();

      const result = await duplicateItem('fake-id');
      expect(result).toBeNull();
    });

    // Test Case 24: updateItem without selected checklist should return null
    it('should return null when updating item without selected checklist', async () => {
      const { updateItem } = usePackingLists();

      const result = await updateItem({ id: 'fake', name: 'Test' });
      expect(result).toBeNull();
    });

    // Test Case 25: getCategories without selected checklist should return empty
    it('should return empty array when getting categories without selected checklist', async () => {
      const { getCategories, categories } = usePackingLists();

      const result = await getCategories();
      expect(result).toEqual([]);
      expect(categories.value).toEqual([]);
    });

    // Test Case 26: getItems without selected checklist should return empty
    it('should return empty array when getting items without selected checklist', async () => {
      const { getItems, items } = usePackingLists();

      const result = await getItems();
      expect(result).toEqual([]);
      expect(items.value).toEqual([]);
    });

    // Test Case 27: deleteItem without selected checklist should return early
    it('should return early when deleting item without selected checklist', async () => {
      const { deleteItem } = usePackingLists();

      // Should not throw
      await deleteItem('fake-id');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 12: Service Failure Paths (null return from loadData)
  // ---------------------------------------------------------------------------

  describe('service failure paths', () => {
    // Test Case 28: createItem should return null when service fails
    it('should return null when createItem service call fails', async () => {
      const { createItem, createChecklist, selectedChecklistId } = usePackingLists();

      const cl = await createChecklist({ name: 'Trip' });
      selectedChecklistId.value = cl.id;

      // Mock the service method to throw
      vi.spyOn(LocalStorageService.prototype, 'createItem').mockRejectedValue(
        new Error('Service error')
      );

      const result = await createItem({ name: 'Item' });
      expect(result).toBeNull();
    });

    // Test Case 29: duplicateCategory should return null when service fails
    it('should return null when duplicateCategory service call fails', async () => {
      const { duplicateCategory, createChecklist, selectedChecklistId } = usePackingLists();

      const cl = await createChecklist({ name: 'Trip' });
      selectedChecklistId.value = cl.id;

      vi.spyOn(LocalStorageService.prototype, 'duplicateCategory').mockRejectedValue(
        new Error('Service error')
      );

      const result = await duplicateCategory('fake-cat-id');
      expect(result).toBeNull();
    });

    // Test Case 30: updateItem should return null when service fails
    it('should return null when updateItem service call fails', async () => {
      const { updateItem, createChecklist, selectedChecklistId } = usePackingLists();

      const cl = await createChecklist({ name: 'Trip' });
      selectedChecklistId.value = cl.id;

      vi.spyOn(LocalStorageService.prototype, 'updateItem').mockRejectedValue(
        new Error('Service error')
      );

      const result = await updateItem({ id: 'fake', name: 'Updated' });
      expect(result).toBeNull();
    });

    // Test Case 31: duplicateItem should return null when service fails
    it('should return null when duplicateItem service call fails', async () => {
      const { duplicateItem, createChecklist, selectedChecklistId } = usePackingLists();

      const cl = await createChecklist({ name: 'Trip' });
      selectedChecklistId.value = cl.id;

      vi.spyOn(LocalStorageService.prototype, 'duplicateItem').mockRejectedValue(
        new Error('Service error')
      );

      const result = await duplicateItem('fake-item-id');
      expect(result).toBeNull();
    });

    // Test Case 32: duplicateChecklist should return null when service fails
    it('should return null when duplicateChecklist service call fails', async () => {
      const { duplicateChecklist } = usePackingLists();

      vi.spyOn(LocalStorageService.prototype, 'duplicateChecklist').mockRejectedValue(
        new Error('Service error')
      );

      const result = await duplicateChecklist('fake-cl-id');
      expect(result).toBeNull();
    });

    // Test Case 33: createCategory should return null when service fails
    it('should return null when createCategory service call fails', async () => {
      const { createCategory, createChecklist, selectedChecklistId } = usePackingLists();

      const cl = await createChecklist({ name: 'Trip' });
      selectedChecklistId.value = cl.id;

      vi.spyOn(LocalStorageService.prototype, 'createCategory').mockRejectedValue(
        new Error('Service error')
      );

      const result = await createCategory({ name: 'Clothing' });
      expect(result).toBeNull();
    });

    // Test Case 34: updateCategory should return null when service fails
    it('should return null when updateCategory service call fails', async () => {
      const { updateCategory } = usePackingLists();

      vi.spyOn(LocalStorageService.prototype, 'updateCategory').mockRejectedValue(
        new Error('Service error')
      );

      const result = await updateCategory({ id: 'fake', name: 'Updated' });
      expect(result).toBeNull();
    });
  });
});
