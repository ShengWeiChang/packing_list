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

import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePackingLists } from '../../../source/composables/usePackingLists';
import { useTemplates } from '../../../source/composables/useTemplates';
import { LocalStorageService } from '../../../source/services/localStorageService';
import { STORAGE_KEYS } from '../../../source/utils/constants';

enableAutoUnmount(afterEach);

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

    vi.stubGlobal('localStorage', {
      clear: () => {
        mockStorage = {};
      },
      getItem: (key) => mockStorage[key] || null,
      removeItem: (key) => {
        delete mockStorage[key];
      },
      setItem: (key, value) => {
        mockStorage[key] = value;
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
      vi.spyOn(LocalStorageService.prototype, 'getData').mockResolvedValue({
        checklists: [
          {
            id: 'cl-1',
            name: 'Trip A',
            startDate: '2026-01-01',
            endDate: '2026-01-05',
            order: 0,
          },
        ],
        categories: [{ id: 'cat-1', name: 'Clothing', checklistId: 'cl-1', order: 0 }],
        items: [
          {
            id: 'item-1',
            name: 'Passport',
            quantity: 1,
            categoryId: 'cat-1',
            isPacked: false,
            isPending: false,
            checklistId: 'cl-1',
            order: 0,
          },
        ],
      });

      const { initialize, checklists, selectedChecklistId, categories, items } = usePackingLists();

      await initialize();

      expect(checklists.value).toHaveLength(1);
      expect(checklists.value[0].id).toBe('cl-1');
      expect(selectedChecklistId.value).toBe('cl-1');
      expect(categories.value).toHaveLength(1);
      expect(items.value).toHaveLength(1);
    });

    // Test Case 4: isLoading should transition during async operation
    it('should manage loading state during initialization', async () => {
      const { initialize, isLoading } = usePackingLists();
      mockStorage[STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID] = 'stale-checklist';

      expect(isLoading.value).toBe(false);

      // After initialize completes, loading should be false
      await initialize();
      expect(isLoading.value).toBe(false);
      expect(mockStorage[STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID]).toBeUndefined();
    });

    // Test Case 5: Legacy checklist order repair should restore the saved checklist
    it('should normalize missing checklist order in memory and restore the saved checklist', async () => {
      vi.spyOn(LocalStorageService.prototype, 'getData').mockResolvedValue({
        checklists: [
          {
            id: 'cl-legacy',
            name: 'Legacy Checklist',
            startDate: '2026-03-01',
            endDate: '2026-03-02',
          },
          {
            id: 'cl-ordered',
            name: 'Ordered Checklist',
            startDate: '2026-04-01',
            endDate: '2026-04-02',
            order: 5,
          },
        ],
        categories: [
          { id: 'cat-legacy', name: 'Legacy Category', checklistId: 'cl-legacy', order: 0 },
          { id: 'cat-ordered', name: 'Ordered Category', checklistId: 'cl-ordered', order: 0 },
        ],
        items: [
          {
            id: 'item-legacy',
            name: 'Legacy Item',
            quantity: 1,
            categoryId: 'cat-legacy',
            isPacked: false,
            isPending: false,
            checklistId: 'cl-legacy',
            order: 0,
          },
          {
            id: 'item-ordered',
            name: 'Ordered Item',
            quantity: 1,
            categoryId: 'cat-ordered',
            isPacked: false,
            isPending: false,
            checklistId: 'cl-ordered',
            order: 0,
          },
        ],
      });
      const updateChecklistSpy = vi
        .spyOn(LocalStorageService.prototype, 'updateChecklist')
        .mockResolvedValue({});
      mockStorage[STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID] = 'cl-legacy';

      const { initialize, checklists, selectedChecklistId, categories, items } = usePackingLists();
      await initialize();

      expect(updateChecklistSpy).not.toHaveBeenCalled();
      expect(checklists.value[0].order).toBe(0);
      expect(checklists.value.map((c) => c.id)).toEqual(['cl-legacy', 'cl-ordered']);
      expect(selectedChecklistId.value).toBe('cl-legacy');
      expect(categories.value).toEqual([expect.objectContaining({ id: 'cat-legacy' })]);
      expect(items.value).toEqual([expect.objectContaining({ id: 'item-legacy' })]);
    });

    // Test Case 6: Deleted selected checklist should fallback to the sidebar top
    it('should fallback selected checklist and reload scoped categories/items', async () => {
      vi.spyOn(LocalStorageService.prototype, 'getData').mockResolvedValue({
        checklists: [
          { id: 'cl-1', name: 'Trip A', startDate: '2026-05-01', endDate: '2026-05-10', order: 0 },
          { id: 'cl-2', name: 'Trip B', startDate: '2026-06-01', endDate: '2026-06-10', order: 1 },
        ],
        categories: [
          { id: 'cat-1', name: 'A', checklistId: 'cl-1', order: 0 },
          { id: 'cat-2', name: 'B', checklistId: 'cl-2', order: 0 },
        ],
        items: [
          {
            id: 'item-1',
            name: 'Item A',
            quantity: 1,
            categoryId: 'cat-1',
            isPacked: false,
            isPending: false,
            checklistId: 'cl-1',
            order: 0,
          },
          {
            id: 'item-2',
            name: 'Item B',
            quantity: 1,
            categoryId: 'cat-2',
            isPacked: false,
            isPending: false,
            checklistId: 'cl-2',
            order: 0,
          },
        ],
      });

      const api = usePackingLists();
      api.selectedChecklistId.value = 'cl-deleted';

      await api.initialize();

      expect(api.selectedChecklistId.value).toBe('cl-2');
      expect(mockStorage[STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID]).toBe('cl-2');
      expect(api.categories.value).toHaveLength(1);
      expect(api.categories.value[0].checklistId).toBe('cl-2');
      expect(api.items.value).toHaveLength(1);
      expect(api.items.value[0].checklistId).toBe('cl-2');
    });

    // Test Case 7: Initialize should surface errors when data service throws
    it('should set error and clear state when initialize fails unexpectedly', async () => {
      vi.spyOn(LocalStorageService.prototype, 'getData').mockRejectedValue(new Error('boom'));

      const { initialize, checklists, categories, items, error } = usePackingLists();
      await initialize();

      expect(checklists.value).toEqual([]);
      expect(categories.value).toEqual([]);
      expect(items.value).toEqual([]);
      expect(error.value).toBe('Error initializing data: boom');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Checklist Operations
  // ---------------------------------------------------------------------------

  describe('checklist operations', () => {
    // Test Case 8: Creating a checklist should add it to state
    it('should create a new checklist', async () => {
      const { initialize, createChecklist, checklists, selectedChecklistId } = usePackingLists();

      await initialize();
      const checklist = await createChecklist({ name: 'Japan Trip' });

      expect(checklist).not.toBeNull();
      expect(checklist.name).toBe('Japan Trip');
      expect(checklists.value.length).toBeGreaterThan(0);
      expect(selectedChecklistId.value).toBe(checklist.id);
    });

    // Test Case 9: First checklist should be auto-selected
    it('should select the first checklist after creation', async () => {
      const { initialize, createChecklist, selectedChecklistId, selectedChecklist } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'First' });

      expect(selectedChecklistId.value).not.toBeNull();
      expect(selectedChecklist.value).toEqual(expect.objectContaining({ name: 'First' }));
    });

    // Test Case 10: Update should modify checklist data
    it('should update an existing checklist', async () => {
      const {
        initialize,
        createChecklist,
        getChecklists,
        selectedChecklistId,
        updateChecklist,
        checklists,
      } = usePackingLists();

      await initialize();
      const created = await createChecklist({ name: 'Original' });
      await updateChecklist({ ...created, name: 'Updated' });

      const updated = checklists.value.find((c) => c.id === created.id);
      expect(updated.name).toBe('Updated');

      vi.spyOn(LocalStorageService.prototype, 'getChecklists').mockRejectedValue(
        new Error('Storage error')
      );
      await getChecklists();

      expect(checklists.value).toEqual([expect.objectContaining({ id: created.id })]);
      expect(selectedChecklistId.value).toBe(created.id);
      expect(mockStorage[STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID]).toBe(created.id);
    });

    // Test Case 11: Delete should remove checklist from state
    it('should delete a checklist', async () => {
      const { initialize, createChecklist, deleteChecklist, checklists, selectedChecklistId } =
        usePackingLists();

      await initialize();
      const first = await createChecklist({ name: 'First' });
      await createChecklist({ name: 'Second' });
      const newest = await createChecklist({ name: 'Newest' });
      selectedChecklistId.value = first.id;
      const countBefore = checklists.value.length;

      await deleteChecklist(first.id);

      expect(checklists.value.length).toBe(countBefore - 1);
      expect(checklists.value.find((c) => c.id === first.id)).toBeUndefined();
      expect(selectedChecklistId.value).toBe(newest.id);
      expect(mockStorage[STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID]).toBe(newest.id);
    });

    // Test Case 12: createChecklist should return null when service call fails
    it('should return null when createChecklist service call fails', async () => {
      const api = usePackingLists();
      const selectedBefore = api.selectedChecklistId.value;

      vi.spyOn(LocalStorageService.prototype, 'createChecklist').mockRejectedValue(
        new Error('Service error')
      );

      const result = await api.createChecklist({ name: 'Failing Checklist' });
      expect(result).toBeNull();
      expect(api.selectedChecklistId.value).toBe(selectedBefore);
    });

    // Test Case 13: updateChecklist should return null when service call fails
    it('should return null when updateChecklist service call fails', async () => {
      const api = usePackingLists();
      await api.initialize();
      const created = await api.createChecklist({ name: 'Original' });

      vi.spyOn(LocalStorageService.prototype, 'updateChecklist').mockRejectedValue(
        new Error('Service error')
      );

      const result = await api.updateChecklist({ ...created, name: 'Updated' });
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Category Operations
  // ---------------------------------------------------------------------------

  describe('category operations', () => {
    // Test Case 14: Category should be created in current checklist
    it('should create a category in the selected checklist', async () => {
      const { initialize, createChecklist, createCategory, categories } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      const category = await createCategory({ name: 'Clothes' });

      expect(category).not.toBeNull();
      expect(category.name).toBe('Clothes');
      expect(categories.value.some((c) => c.name === 'Clothes')).toBe(true);
    });

    // Test Case 15: Category operations should fail without selected checklist
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
    // Test Case 16: Item should be created with correct properties
    it('should create an item in the selected checklist', async () => {
      const { initialize, createChecklist, categories, createItem, items } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await flushPromises();

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toEqual(expect.any(String));

      const item = await createItem({ name: 'Passport', categoryId });

      expect(item).not.toBeNull();
      expect(item.name).toBe('Passport');
      expect(items.value.some((i) => i.name === 'Passport')).toBe(true);
    });

    // Test Case 17: Toggle should flip isPacked state
    it('should toggle item packed status', async () => {
      const {
        initialize,
        createChecklist,
        categories,
        createItem,
        toggleItemPacked,
        items,
        canUndoPackingChange,
      } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await flushPromises();

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toEqual(expect.any(String));

      const item = await createItem({ name: 'Test Item', categoryId });
      expect(item.isPacked).toBe(false);

      await toggleItemPacked(item);

      const updated = items.value.find((i) => i.id === item.id);
      expect(updated.isPacked).toBe(true);
      expect(canUndoPackingChange.value).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Computed Properties
  // ---------------------------------------------------------------------------

  describe('computed properties', () => {
    // Test Case 18: Progress should reflect packed/total ratio
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
      await flushPromises();

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toEqual(expect.any(String));

      const item1 = await createItem({ name: 'Item 1', categoryId });
      await createItem({ name: 'Item 2', categoryId });

      const initialPacked = packedItems.value;
      const initialTotal = totalItems.value;

      await toggleItemPacked(item1);

      expect(packedItems.value).toBe(initialPacked + 1);
      expect(totalItems.value).toBe(initialTotal);
      expect(progress.value).toBeGreaterThan(0);
    });

    // Test Case 19: Empty items should result in 0 progress
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
    // Test Case 20: localStorage corruption should be handled gracefully
    it('should handle storage errors gracefully during initialization', async () => {
      const { initialize, checklists, error } = usePackingLists();

      mockStorage['packingListApp'] = 'invalid json {{{';

      await initialize();

      // Corrupt content must be reported rather than treated as missing data.
      expect(checklists.value).toEqual([]);
      expect(error.value).toContain('Stored data is not valid JSON');
      expect(mockStorage['packingListApp']).toBe('invalid json {{{');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Duplicate Operations
  // ---------------------------------------------------------------------------

  describe('duplicate operations', () => {
    // Test Case 21: Should duplicate a checklist
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

    // Test Case 22: Should duplicate a category
    it('should duplicate a category and refresh state', async () => {
      const { initialize, createChecklist, categories, duplicateCategory } = usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await flushPromises();

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toEqual(expect.any(String));
      const countBefore = categories.value.length;

      const duplicated = await duplicateCategory(categoryId);

      expect(duplicated).not.toBeNull();
      expect(duplicated.id).not.toBe(categoryId);
      expect(categories.value.length).toBe(countBefore + 1);
    });

    // Test Case 23: Should duplicate an item
    it('should duplicate an item and refresh state', async () => {
      const { initialize, createChecklist, categories, createItem, duplicateItem, items } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await flushPromises();

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toEqual(expect.any(String));

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
    // Test Case 24: Should delete a category and its items
    it('should delete a category and refresh both categories and items', async () => {
      const { initialize, createChecklist, categories, items, createItem, deleteCategory } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await flushPromises();

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toEqual(expect.any(String));

      const item = await createItem({ name: 'Test Item', categoryId });
      expect(items.value.some((entry) => entry.id === item.id)).toBe(true);

      await deleteCategory(categoryId);

      expect(categories.value.find((c) => c.id === categoryId)).toBeUndefined();
      expect(items.value.some((entry) => entry.id === item.id)).toBe(false);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_DATA));
      expect(stored.items.some((entry) => entry.id === item.id)).toBe(false);
    });

    // Test Case 25: Should delete an item
    it('should delete an item and refresh items', async () => {
      const { initialize, createChecklist, categories, createItem, deleteItem, items } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await flushPromises();

      const categoryId = categories.value[0]?.id;
      expect(categoryId).toEqual(expect.any(String));

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
    // Test Case 26: Should update multiple checklists at once
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
    // Test Case 27: createItem without selected checklist should return null
    it('should return null when creating item without selected checklist', async () => {
      const { createItem } = usePackingLists();

      const result = await createItem({ name: 'Test' });
      expect(result).toBeNull();
    });

    // Test Case 28: duplicateItem without selected checklist should return null
    it('should return null when duplicating item without selected checklist', async () => {
      const { duplicateItem } = usePackingLists();

      const result = await duplicateItem('fake-id');
      expect(result).toBeNull();
    });

    // Test Case 29: updateItem without selected checklist should return null
    it('should return null when updating item without selected checklist', async () => {
      const { updateItem } = usePackingLists();

      const result = await updateItem({ id: 'fake', name: 'Test' });
      expect(result).toBeNull();
    });

    // Test Case 30: getCategories without selected checklist should return empty
    it('should return empty array when getting categories without selected checklist', async () => {
      const { getCategories, categories } = usePackingLists();

      const result = await getCategories();
      expect(result).toEqual([]);
      expect(categories.value).toEqual([]);
    });

    // Test Case 31: getItems without selected checklist should return empty
    it('should return empty array when getting items without selected checklist', async () => {
      const { getItems, items } = usePackingLists();

      const result = await getItems();
      expect(result).toEqual([]);
      expect(items.value).toEqual([]);
    });

    // Test Case 32: deleteItem without selected checklist should return early
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
    // Test Cases 33–37: Operations requiring a selected checklist should
    // return null when the underlying service call rejects.
    it.each([
      ['createItem', 'createItem', { name: 'Item' }],
      ['duplicateCategory', 'duplicateCategory', 'fake-cat-id'],
      ['updateItem', 'updateItem', { id: 'fake', name: 'Updated' }],
      ['duplicateItem', 'duplicateItem', 'fake-item-id'],
      ['createCategory', 'createCategory', { name: 'Clothing' }],
    ])(
      'should return null when %s service call fails (with checklist)',
      async (composableFn, serviceFn, arg) => {
        const api = usePackingLists();
        const cl = await api.createChecklist({ name: 'Trip' });
        api.selectedChecklistId.value = cl.id;

        vi.spyOn(LocalStorageService.prototype, serviceFn).mockRejectedValue(
          new Error('Service error')
        );

        const result = await api[composableFn](arg);
        expect(result).toBeNull();
      }
    );

    // Test Cases 38–39: Operations that don't need a selected checklist should
    // also return null when the service rejects.
    it.each([
      ['duplicateChecklist', 'duplicateChecklist', 'fake-cl-id'],
      ['updateCategory', 'updateCategory', { id: 'fake', name: 'Updated' }],
    ])(
      'should return null when %s service call fails (no checklist)',
      async (composableFn, serviceFn, arg) => {
        const api = usePackingLists();

        vi.spyOn(LocalStorageService.prototype, serviceFn).mockRejectedValue(
          new Error('Service error')
        );

        const result = await api[composableFn](arg);
        expect(result).toBeNull();
      }
    );

    // Test Cases 40–41: Should return null when the service resolves with a falsy value.
    it.each([
      ['updateCategory', 'updateCategory', { id: 'fake', name: 'Updated' }],
      [
        'updateMultipleChecklists',
        'updateMultipleChecklists',
        [{ id: 'cl-1', name: 'A', order: 0 }],
      ],
    ])(
      'should return null when %s service returns undefined',
      async (composableFn, serviceFn, arg) => {
        const api = usePackingLists();

        vi.spyOn(LocalStorageService.prototype, serviceFn).mockResolvedValue(undefined);

        const result = await api[composableFn](arg);
        expect(result).toBeNull();
      }
    );

    // Test Case 42: Real service throws for non-existent entity
    it('should return null when updateCategory throws (real service)', async () => {
      const { updateCategory } = usePackingLists();

      const result = await updateCategory({
        id: 'cat-does-not-exist',
        name: 'Updated',
        checklistId: 'cl-1',
        order: 0,
      });

      expect(result).toBeNull();
    });

    // Test Case 43: updateCategory should refresh and return updated data on success
    it('should refresh categories and return updated category on success', async () => {
      const api = usePackingLists();
      const { initialize, createChecklist, getCategories, categories, updateCategory } = api;

      await initialize();
      const cl = await createChecklist({ name: 'Trip' });
      expect(cl).not.toBeNull();

      await getCategories();
      const first = categories.value[0];
      expect(first).toEqual(expect.objectContaining({ id: expect.any(String) }));

      const updated = await updateCategory({ ...first, name: 'Updated Category' });
      expect(updated).not.toBeNull();
      expect(updated.name).toBe('Updated Category');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 13: Cross-tab Sync (storage event)
  // ---------------------------------------------------------------------------

  describe('cross-tab sync', () => {
    // Test Case 44: APP_DATA refresh should preserve valid selection and recover deleted selection
    it('should preserve valid selection and recover deleted selection on app data refresh', async () => {
      vi.useFakeTimers();

      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const getDataSpy = vi.spyOn(LocalStorageService.prototype, 'getData');
      const activeChecklistData = {
        checklists: [
          {
            id: 'cl-older',
            name: 'Older',
            startDate: '2026-01-01',
            endDate: '2026-01-02',
            order: 0,
          },
          {
            id: 'cl-newest',
            name: 'Newest',
            startDate: '2026-02-01',
            endDate: '2026-02-02',
            order: 1,
          },
        ],
        categories: [],
        items: [],
      };
      let api;

      const Host = {
        template: '<div />',
        setup() {
          api = usePackingLists();
          return { api };
        },
      };

      const wrapper = mount(Host);
      getDataSpy.mockResolvedValue(activeChecklistData);
      await api.initialize();
      api.selectedChecklistId.value = 'cl-older';
      await flushPromises();
      getDataSpy.mockClear();

      const storageCalls = addSpy.mock.calls.filter((call) => call[0] === 'storage');
      expect(storageCalls.length).toBeGreaterThan(0);

      // LocalStorageService also registers a storage listener in its constructor.
      // The composable registers its own debounced listener onMounted, which is
      // expected to be the last registration.
      const handler = storageCalls[storageCalls.length - 1][1];
      expect(typeof handler).toBe('function');

      // Unrelated key should be ignored
      handler({ key: 'other-key' });
      handler({ key: STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID });
      vi.runAllTimers();
      await Promise.resolve();
      expect(getDataSpy).not.toHaveBeenCalled();

      // A valid in-memory selection remains active after another tab changes app data.
      handler({ key: 'packingListApp' });
      vi.runAllTimers();
      await flushPromises();
      expect(getDataSpy).toHaveBeenCalled();
      expect(api.selectedChecklistId.value).toBe('cl-older');

      // If another tab deleted the active checklist, recover to the sidebar top.
      getDataSpy.mockResolvedValue({
        checklists: [activeChecklistData.checklists[1]],
        categories: [],
        items: [],
      });
      handler({ key: 'packingListApp' });
      vi.runAllTimers();
      await flushPromises();
      expect(api.selectedChecklistId.value).toBe('cl-newest');

      wrapper.unmount();
      expect(removeSpy).toHaveBeenCalledWith('storage', handler);

      vi.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 14: Packing History
  // ---------------------------------------------------------------------------

  describe('packing history', () => {
    it('restores a deleted checklist subtree with the same IDs and values, then redoes deletion', async () => {
      const api = usePackingLists();
      await api.initialize();
      const list = await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothes' });
      const item = await api.createItem({
        name: 'Hat',
        categoryId: category.id,
        quantity: 3,
        isPending: true,
      });
      const before = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      expect(await api.deleteChecklist(list.id)).toBe(true);
      expect(await api.undoPackingChange()).toBe(true);
      const restored = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      expect(restored.checklists.find((entry) => entry.id === list.id)).toEqual(
        before.checklists.find((entry) => entry.id === list.id)
      );
      expect(restored.categories.find((entry) => entry.id === category.id)).toEqual(
        before.categories.find((entry) => entry.id === category.id)
      );
      expect(restored.items.find((entry) => entry.id === item.id)).toEqual(
        before.items.find((entry) => entry.id === item.id)
      );
      expect(await api.redoPackingChange()).toBe(true);
      const deleted = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      expect(deleted.checklists.some((entry) => entry.id === list.id)).toBe(false);
      expect(deleted.items.some((entry) => entry.id === item.id)).toBe(false);
    });

    it('undoes and redoes item edits, pending status, duplication and deletion as separate steps', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothes' });
      const item = await api.createItem({ name: 'Hat', categoryId: category.id, quantity: 1 });
      api.clearPackingHistory();
      await api.updateItem({ ...item, name: 'Cap', quantity: 2 }, item);
      const edited = api.items.value.find((entry) => entry.id === item.id);
      await api.updateItem({ ...edited, isPending: true }, edited);
      const copy = await api.duplicateItem(item.id);
      await api.deleteItem(item.id);
      expect(api.items.value.map((entry) => entry.id)).toEqual([copy.id]);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value.find((entry) => entry.id === item.id)).toMatchObject({
        name: 'Cap',
        quantity: 2,
        isPending: true,
      });
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value.some((entry) => entry.id === copy.id)).toBe(false);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value.find((entry) => entry.id === item.id).isPending).toBe(false);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value.find((entry) => entry.id === item.id)).toMatchObject({
        name: 'Hat',
        quantity: 1,
      });
      expect(api.canUndoPackingChange.value).toBe(false);
      for (let index = 0; index < 4; index++) expect(await api.redoPackingChange()).toBe(true);
      expect(api.items.value.map((entry) => entry.id)).toEqual([copy.id]);
    });

    it('restores a category deletion with its items and reverses a cross-category move', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const first = await api.createCategory({ name: 'First', order: 0 });
      const second = await api.createCategory({ name: 'Second', order: 1 });
      const item = await api.createItem({ name: 'Hat', categoryId: first.id, order: 0 });
      api.clearPackingHistory();
      await api.updateMultipleItems([{ ...item, categoryId: second.id, order: 0 }], {
        fields: ['categoryId', 'order'],
        expectedItems: [item],
      });
      await api.deleteCategory(second.id);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value.find((entry) => entry.id === item.id).categoryId).toBe(second.id);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value.find((entry) => entry.id === item.id).categoryId).toBe(first.id);
      expect(await api.redoPackingChange()).toBe(true);
      expect(await api.redoPackingChange()).toBe(true);
      expect(api.items.value.some((entry) => entry.id === item.id)).toBe(false);
    });

    it('rejects undoing a cross-category move when the destination membership changed', async () => {
      const api = usePackingLists();
      await api.initialize();
      const list = await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const first = await api.createCategory({ name: 'First' });
      const second = await api.createCategory({ name: 'Second' });
      const item = await api.createItem({ name: 'Hat', categoryId: first.id });
      await api.updateMultipleItems([{ ...item, categoryId: second.id }], {
        fields: ['categoryId', 'order'],
        expectedItems: [item],
      });
      const external = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      external.items.push({
        id: 'external',
        checklistId: list.id,
        categoryId: second.id,
        name: 'External',
        quantity: 1,
        isPacked: false,
        isPending: false,
        order: 1,
      });
      mockStorage[STORAGE_KEYS.APP_DATA] = JSON.stringify(external);
      expect(await api.undoPackingChange()).toBe(false);
      expect(api.operationError.value).toBe('conflict');
      expect(JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA])).toEqual(external);
    });

    it('undoes and redoes category duplication with its complete item subtree', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothes' });
      await api.createItem({ name: 'Hat', categoryId: category.id, quantity: 4 });
      api.clearPackingHistory();
      const copy = await api.duplicateCategory(category.id);
      const copiedItem = api.items.value.find((entry) => entry.categoryId === copy.id);
      expect(copiedItem.quantity).toBe(4);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.categories.value.some((entry) => entry.id === copy.id)).toBe(false);
      expect(api.items.value.some((entry) => entry.id === copiedItem.id)).toBe(false);
      expect(await api.redoPackingChange()).toBe(true);
      expect(api.items.value.find((entry) => entry.id === copiedItem.id)).toMatchObject({
        categoryId: copy.id,
        quantity: 4,
      });
    });

    it('rejects undoing a created checklist if another tab added a descendant before its event', async () => {
      const api = usePackingLists();
      await api.initialize();
      const list = await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const external = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      external.categories.push({
        id: 'external',
        checklistId: list.id,
        name: 'External',
        order: 0,
      });
      mockStorage[STORAGE_KEYS.APP_DATA] = JSON.stringify(external);
      expect(await api.undoPackingChange()).toBe(false);
      expect(api.operationError.value).toBe('conflict');
      expect(JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA])).toEqual(external);
    });

    it('rejects undo of a reorder after another tab changes membership, preserving the other edit', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const first = await api.createCategory({ name: 'First', order: 0 });
      const second = await api.createCategory({ name: 'Second', order: 1 });
      await api.updateMultipleCategories(
        [
          { ...first, order: 1 },
          { ...second, order: 0 },
        ],
        [first, second]
      );
      const external = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      external.categories.push({
        id: 'external',
        checklistId: first.checklistId,
        name: 'External',
        order: 2,
      });
      mockStorage[STORAGE_KEYS.APP_DATA] = JSON.stringify(external);
      expect(await api.undoPackingChange()).toBe(false);
      expect(api.operationError.value).toBe('conflict');
      expect(JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA])).toEqual(external);
    });

    it('reverses an edit without overwriting an unrelated external field change', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothes' });
      const item = await api.createItem({ name: 'Hat', categoryId: category.id, quantity: 1 });
      await api.updateItem({ ...item, name: 'Cap' }, item);
      const external = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      external.items.find((entry) => entry.id === item.id).quantity = 7;
      mockStorage[STORAGE_KEYS.APP_DATA] = JSON.stringify(external);
      expect(await api.undoPackingChange()).toBe(true);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.find((entry) => entry.id === item.id)
      ).toMatchObject({ name: 'Hat', quantity: 7 });
    });

    it('rejects undo if a different tab changed the saved status before its event arrives', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      await flushPromises();
      const category = await api.createCategory({ name: 'Clothing' });
      const item = await api.createItem({ name: 'Hat', categoryId: category.id });
      await api.setCategoryPacked(category.id, true);

      const external = JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]);
      const changed = external.items.find((entry) => entry.id === item.id);
      changed.isPacked = false;
      changed.isPending = true;
      mockStorage[STORAGE_KEYS.APP_DATA] = JSON.stringify(external);

      expect(await api.undoPackingChange()).toBe(false);
      expect(JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items[0]).toMatchObject({
        isPacked: false,
        isPending: true,
      });
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(api.operationError.value).toBe('conflict');
    });
    it('keeps history for a no-op and undoes a later edit before the packing change', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothing' });
      await api.createItem({ name: 'Hat', categoryId: category.id });
      await api.setCategoryPacked(category.id, true);
      const unchanged = api.items.value[0];
      await api.updateItem({ ...unchanged }, unchanged);
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(api.historyBarrierVersion.value).toBe(0);
      await api.updateItem({ ...unchanged, name: 'Cap' }, unchanged);
      expect(api.historyBarrierVersion.value).toBe(0);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value[0].name).toBe('Hat');
      expect(api.items.value[0].isPacked).toBe(true);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value[0].isPacked).toBe(false);
    });

    it('preserves a committed batch in history if the following refresh fails', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothing' });
      await api.createItem({ name: 'Hat', categoryId: category.id });
      vi.spyOn(LocalStorageService.prototype, 'getItems').mockRejectedValueOnce(
        new Error('denied')
      );
      const result = await api.setCategoryPacked(category.id, true);
      expect(result).toHaveLength(1);
      expect(api.refreshAfterSaveFailed.value).toBe(true);
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items[0].isPacked).toBe(true);
      expect(await api.undoPackingChange()).toBe(true);
    });

    it('does not redirect an in-flight undo when the selected checklist changes', async () => {
      const api = usePackingLists();
      await api.initialize();
      const first = await api.createChecklist({ name: 'First' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothing' });
      const item = await api.createItem({ name: 'Hat', categoryId: category.id });
      const second = await api.createChecklist({ name: 'Second' }, { source: 'empty' });
      api.selectedChecklistId.value = first.id;
      await flushPromises();
      await api.setCategoryPacked(category.id, true);
      const original = LocalStorageService.prototype.applyHistory;
      let release;
      let entered;
      const ready = new Promise((resolve) => {
        entered = resolve;
      });
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      vi.spyOn(LocalStorageService.prototype, 'applyHistory').mockImplementation(async function (
        ...args
      ) {
        entered();
        await gate;
        return original.apply(this, args);
      });
      const pending = api.undoPackingChange();
      await ready;
      api.selectedChecklistId.value = second.id;
      await flushPromises();
      release();
      expect(await pending).toBe(true);
      expect(api.selectedChecklistId.value).toBe(second.id);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.find((row) => row.id === item.id)
      ).toMatchObject({ isPacked: false });
      expect(api.canRedoPackingChange.value).toBe(true);
    });

    it('preserves newer redo when an older item update refresh finishes later', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const first = await api.createCategory({ name: 'First' });
      const second = await api.createCategory({ name: 'Second' });
      const firstItem = await api.createItem({ name: 'Hat', categoryId: first.id });
      await api.createItem({ name: 'Coat', categoryId: second.id });
      const original = LocalStorageService.prototype.getItems;
      let calls = 0;
      let release;
      let entered;
      const ready = new Promise((resolve) => {
        entered = resolve;
      });
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      vi.spyOn(LocalStorageService.prototype, 'getItems').mockImplementation(async function (
        ...args
      ) {
        calls += 1;
        if (calls === 1) {
          entered();
          await gate;
        }
        return original.apply(this, args);
      });
      const earlierUpdate = api.updateItem({ ...firstItem, isPacked: true }, firstItem);
      await ready;
      expect(JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items[0].isPacked).toBe(true);
      await api.setCategoryPacked(second.id, true);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.canRedoPackingChange.value).toBe(true);
      release();
      await earlierUpdate;
      expect(api.canRedoPackingChange.value).toBe(true);
      expect(await api.redoPackingChange()).toBe(true);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.map((row) => row.isPacked)
      ).toEqual([true, true]);
    });

    it('keeps the committed batch version even when its refresh finishes after undo', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const older = await api.createCategory({ name: 'Older' });
      const newer = await api.createCategory({ name: 'Newer' });
      await api.createItem({ name: 'Hat', categoryId: older.id });
      await api.createItem({ name: 'Coat', categoryId: newer.id });
      await api.setCategoryPacked(older.id, true);
      const original = LocalStorageService.prototype.getItems;
      let calls = 0;
      let release;
      let entered;
      const ready = new Promise((resolve) => {
        entered = resolve;
      });
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      vi.spyOn(LocalStorageService.prototype, 'getItems').mockImplementation(async function (
        ...args
      ) {
        calls += 1;
        if (calls === 1) {
          entered();
          await gate;
        }
        return original.apply(this, args);
      });
      const pending = api.setCategoryPacked(newer.id, true);
      await ready;
      expect(await api.undoPackingChange()).toBe(true);
      const undoVersion = api.historyEventVersion.value;
      release();
      const oldResult = await pending;
      expect(api.getPackingBatchEventVersion(oldResult)).toBeLessThan(undoVersion);
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(api.canRedoPackingChange.value).toBe(true);
    });

    it('retains a newer action committed while an undo refresh is pending', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const first = await api.createCategory({ name: 'First' });
      const second = await api.createCategory({ name: 'Second' });
      await api.createItem({ name: 'Hat', categoryId: first.id });
      await api.createItem({ name: 'Coat', categoryId: second.id });
      await api.setCategoryPacked(first.id, true);
      const original = LocalStorageService.prototype.getItems;
      let calls = 0;
      let release;
      let entered;
      const ready = new Promise((resolve) => {
        entered = resolve;
      });
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      vi.spyOn(LocalStorageService.prototype, 'getItems').mockImplementation(async function (
        ...args
      ) {
        calls += 1;
        if (calls === 1) {
          entered();
          await gate;
        }
        return original.apply(this, args);
      });
      const pending = api.undoPackingChange();
      await ready;
      await api.setCategoryPacked(second.id, true);
      release();
      expect(await pending).toBe(true);
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(await api.undoPackingChange()).toBe(true);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.map((row) => row.isPacked)
      ).toEqual([false, false]);
    });

    it('prevents an older undo from committing after a newer packing action', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const first = await api.createCategory({ name: 'First' });
      const second = await api.createCategory({ name: 'Second' });
      await api.createItem({ name: 'Hat', categoryId: first.id });
      await api.createItem({ name: 'Coat', categoryId: second.id });
      await api.setCategoryPacked(first.id, true);
      const original = LocalStorageService.prototype.applyHistory;
      let release;
      let entered;
      const ready = new Promise((resolve) => {
        entered = resolve;
      });
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      vi.spyOn(LocalStorageService.prototype, 'applyHistory').mockImplementation(async function (
        ...args
      ) {
        entered();
        await gate;
        return original.apply(this, args);
      });
      const pending = api.undoPackingChange();
      await ready;
      await api.setCategoryPacked(second.id, true);
      release();
      expect(await pending).toBe(false);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.every((row) => row.isPacked)
      ).toBe(true);
      expect(api.operationError.value).toBe('conflict');
      expect(await api.undoPackingChange()).toBe(true);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.map((row) => row.isPacked)
      ).toEqual([true, false]);
    });

    it('clears history only when a template change actually commits', async () => {
      const api = usePackingLists();
      let notifications = 0;
      const templates = useTemplates(() => {
        api.clearPackingHistory();
        notifications += 1;
      });
      await api.initialize();
      const checklist = await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothing' });
      await api.createItem({ name: 'Hat', categoryId: category.id });
      const saved = await templates.saveAsTemplate(checklist.id, 'Template');
      expect(saved).toBeTruthy();
      await api.setCategoryPacked(category.id, true);
      expect(api.canUndoPackingChange.value).toBe(true);
      const count = notifications;
      await templates.updateTemplate(saved, saved);
      expect(notifications).toBe(count);
      expect(api.canUndoPackingChange.value).toBe(true);
      await templates.updateTemplate({ ...saved, name: 'New name' }, saved);
      expect(notifications).toBe(count + 1);
      expect(api.canUndoPackingChange.value).toBe(false);
    });

    it('does not clear history when a stale delete changes no data', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      const category = await api.createCategory({ name: 'Clothing' });
      await api.createItem({ name: 'Hat', categoryId: category.id });
      await api.setCategoryPacked(category.id, true);
      expect(await api.deleteItem('missing')).toBe(true);
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(await api.deleteCategory('missing')).toBe(true);
      expect(api.canUndoPackingChange.value).toBe(true);
    });

    // Test Case 45: Preserve data and history after a failed deletion.
    it('keeps history and visible data when item or category deletion fails', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      await flushPromises();
      const category = await api.createCategory({ name: 'Clothing' });
      const item = await api.createItem({ name: 'Hat', categoryId: category.id });
      await api.setCategoryPacked(category.id, true);
      vi.spyOn(LocalStorageService.prototype, 'deleteItem').mockRejectedValue(new Error('denied'));
      vi.spyOn(LocalStorageService.prototype, 'deleteCategory').mockRejectedValue(
        new Error('denied')
      );

      expect(await api.deleteItem(item.id)).toBe(false);
      expect(await api.deleteCategory(category.id)).toBe(false);
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(api.items.value.some((entry) => entry.id === item.id)).toBe(true);
      expect(api.categories.value.some((entry) => entry.id === category.id)).toBe(true);
      expect(api.error.value).toContain('denied');
    });

    // Test Case 46: Preserve visible data when refresh fails.
    it('retains visible categories and items if a later refresh fails', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      await flushPromises();
      const category = await api.createCategory({ name: 'Clothing' });
      const item = await api.createItem({ name: 'Hat', categoryId: category.id });
      vi.spyOn(LocalStorageService.prototype, 'getCategories').mockRejectedValue(
        new Error('denied')
      );
      vi.spyOn(LocalStorageService.prototype, 'getItems').mockRejectedValue(new Error('denied'));

      await api.getCategories();
      await api.getItems();
      expect(api.categories.value.some((entry) => entry.id === category.id)).toBe(true);
      expect(api.items.value.some((entry) => entry.id === item.id)).toBe(true);
    });

    // Test Case 47: Distinguish a committed write from a failed refresh.
    it('reports a committed change separately when the subsequent refresh fails', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      await flushPromises();
      const category = await api.createCategory({ name: 'Clothing' });
      vi.spyOn(LocalStorageService.prototype, 'getCategories').mockRejectedValue(
        new Error('denied')
      );

      const result = await api.updateCategory({ ...category, name: 'Clothes' }, category);

      expect(result.name).toBe('Clothes');
      expect(api.refreshAfterSaveFailed.value).toBe(true);
      expect(api.operationError.value).toBeNull();
      expect(JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).categories[0].name).toBe('Clothes');
    });

    // Test Case 48: Never show a previous checklist's data under a new selection.
    it('clears the previous checklist data when switching and the new read fails', async () => {
      const api = usePackingLists();
      await api.initialize();
      const first = await api.createChecklist({ name: 'First' }, { source: 'empty' });
      await flushPromises();
      const category = await api.createCategory({ name: 'First category' });
      await api.createItem({ name: 'First item', categoryId: category.id });
      const second = await api.createChecklist({ name: 'Second' }, { source: 'empty' });
      api.selectedChecklistId.value = first.id;
      await flushPromises();
      expect(api.items.value).toHaveLength(1);
      vi.spyOn(LocalStorageService.prototype, 'getCategories').mockRejectedValue(
        new Error('denied')
      );
      vi.spyOn(LocalStorageService.prototype, 'getItems').mockRejectedValue(new Error('denied'));

      api.selectedChecklistId.value = second.id;
      await flushPromises();
      expect(api.categories.value).toEqual([]);
      expect(api.items.value).toEqual([]);
      expect(api.storageHealth.value).toBe('unavailable');
    });

    // Test Case 49: Category pack-all should be one undoable mixed-state action
    it('should treat a category pack-all as one undoable action and restore mixed state', async () => {
      const api = usePackingLists();
      await api.initialize();
      await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
      await flushPromises();
      const category = await api.createCategory({ name: 'Clothing' });
      const unpackedPending = await api.createItem({
        name: 'Buy sunscreen',
        categoryId: category.id,
        isPacked: false,
        isPending: true,
      });
      const packed = await api.createItem({
        name: 'Hat',
        categoryId: category.id,
        isPacked: true,
        isPending: false,
      });
      const batchSpy = vi.spyOn(LocalStorageService.prototype, 'updateMultipleItems');

      await api.setCategoryPacked(category.id, true);

      expect(batchSpy).toHaveBeenCalledTimes(1);
      expect(api.items.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: unpackedPending.id, isPacked: true, isPending: false }),
          expect.objectContaining({ id: packed.id, isPacked: true, isPending: false }),
        ])
      );
      expect(api.canUndoPackingChange.value).toBe(true);

      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: unpackedPending.id, isPacked: false, isPending: true }),
          expect.objectContaining({ id: packed.id, isPacked: true, isPending: false }),
        ])
      );
      expect(api.canRedoPackingChange.value).toBe(true);

      expect(await api.redoPackingChange()).toBe(true);
      expect(api.items.value.every((item) => item.isPacked && !item.isPending)).toBe(true);

      expect(await api.undoPackingChange()).toBe(true);
      expect(api.canRedoPackingChange.value).toBe(true);
      const currentPackedItem = api.items.value.find((item) => item.id === packed.id);
      await api.updateItem({ ...currentPackedItem, isPacked: false, isPending: true });
      expect(api.canUndoPackingChange.value).toBe(true);
      expect(api.canRedoPackingChange.value).toBe(false);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.items.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: packed.id, isPacked: true, isPending: false }),
        ])
      );
    });

    // Test Case 50: Switching checklists retains history and preserves selection.
    it('undoes and redoes a batch on its owning checklist after switching', async () => {
      const api = usePackingLists();
      await api.initialize();
      const first = await api.createChecklist({ name: 'First' }, { source: 'empty' });
      await flushPromises();
      const category = await api.createCategory({ name: 'Clothing' });
      const item = await api.createItem({ name: 'Hat', categoryId: category.id });
      const second = await api.createChecklist({ name: 'Second' }, { source: 'empty' });
      api.selectedChecklistId.value = first.id;
      await flushPromises();
      await api.setCategoryPacked(category.id, true);
      api.selectedChecklistId.value = second.id;
      await flushPromises();

      expect(api.canUndoPackingChange.value).toBe(true);
      expect(await api.undoPackingChange()).toBe(true);
      expect(api.selectedChecklistId.value).toBe(second.id);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.find((row) => row.id === item.id)
      ).toMatchObject({ isPacked: false });
      expect(await api.redoPackingChange()).toBe(true);
      expect(api.selectedChecklistId.value).toBe(second.id);
      expect(
        JSON.parse(mockStorage[STORAGE_KEYS.APP_DATA]).items.find((row) => row.id === item.id)
      ).toMatchObject({ isPacked: true });
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 15: Drag Intent and Concurrent Edits
  // ---------------------------------------------------------------------------

  // Test Case 51: A stale drag must not overwrite unrelated remote edits
  it('preserves remote item edits when committing a stale drag payload', async () => {
    const api = usePackingLists();
    await api.initialize();
    const checklist = await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
    const source = await api.createCategory({ name: 'Source' });
    const destination = await api.createCategory({ name: 'Destination' });
    const item = await api.createItem({ name: 'Old name', categoryId: source.id, quantity: 1 });
    const dragBaseline = { ...item };

    const remote = new LocalStorageService();
    await remote.updateItem(checklist.id, { ...item, name: 'Remote name', quantity: 2 }, item);
    await api.initialize();
    const result = await api.updateMultipleItems(
      [{ ...dragBaseline, categoryId: destination.id, order: 0 }],
      { fields: ['order', 'categoryId'], expectedItems: [dragBaseline] }
    );

    expect(result[0]).toMatchObject({
      name: 'Remote name',
      quantity: 2,
      categoryId: destination.id,
    });
    expect(await remote.getItemById(checklist.id, item.id)).toMatchObject({
      name: 'Remote name',
      quantity: 2,
      categoryId: destination.id,
    });

    await remote.updateCategory({ ...source, name: 'Remote category' }, source);
    await api.initialize();
    const categories = await api.updateMultipleCategories([{ ...source, order: 3 }], [source]);
    expect(categories[0]).toMatchObject({ name: 'Remote category', order: 3 });

    await remote.updateChecklist({ ...checklist, name: 'Remote trip' }, checklist);
    await api.initialize();
    const checklists = await api.updateMultipleChecklists(
      [{ ...checklist, order: 3 }],
      [checklist]
    );
    expect(checklists[0]).toMatchObject({ name: 'Remote trip', order: 3 });
    remote.dispose();
  });

  // Test Case 52: A drag retains its original membership baseline across later reads
  it('rejects stale drag membership without overwriting a remotely added item', async () => {
    const api = usePackingLists();
    await api.initialize();
    const checklist = await api.createChecklist({ name: 'Trip' }, { source: 'empty' });
    const source = await api.createCategory({ name: 'Source' });
    const destination = await api.createCategory({ name: 'Destination' });
    const moved = await api.createItem({ name: 'Moved', categoryId: source.id });
    const target = await api.createItem({ name: 'Target', categoryId: destination.id });
    const expectedItems = api.items.value.map((item) => ({ ...item }));
    const remote = new LocalStorageService();
    const added = await remote.createItem(checklist.id, {
      name: 'Added remotely',
      categoryId: destination.id,
      order: 1,
    });
    await api.initialize();

    const result = await api.updateMultipleItems(
      [
        { ...target, order: 0 },
        { ...moved, categoryId: destination.id, order: 1 },
      ],
      { fields: ['order', 'categoryId'], expectedItems }
    );

    expect(result).toBeNull();
    expect(api.operationError.value).toBe('conflict');
    expect(await remote.getItemById(checklist.id, moved.id)).toMatchObject({
      categoryId: source.id,
      order: 0,
    });
    expect(await remote.getItemById(checklist.id, added.id)).toMatchObject({
      categoryId: destination.id,
      order: 1,
    });
    remote.dispose();
  });
});
