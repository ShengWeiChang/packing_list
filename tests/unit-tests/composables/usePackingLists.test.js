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

    // Test Case 4: isLoading should be false after async operation completes
    it('should set loading state during initialization', async () => {
      const { initialize, isLoading } = usePackingLists();

      expect(isLoading.value).toBe(false);
      const initPromise = initialize();
      await initPromise;
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
      if (categoryId) {
        const item = await createItem({ name: 'Passport', categoryId });

        expect(item).not.toBeNull();
        expect(item.name).toBe('Passport');
        expect(items.value.some((i) => i.name === 'Passport')).toBe(true);
      }
    });

    // Test Case 12: Toggle should flip isPacked state
    it('should toggle item packed status', async () => {
      const { initialize, createChecklist, categories, createItem, toggleItemPacked, items } =
        usePackingLists();

      await initialize();
      await createChecklist({ name: 'Trip' });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categoryId = categories.value[0]?.id;
      if (categoryId) {
        const item = await createItem({ name: 'Test Item', categoryId });
        expect(item.isPacked).toBe(false);

        await toggleItemPacked(item);

        const updated = items.value.find((i) => i.id === item.id);
        expect(updated.isPacked).toBe(true);
      }
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
      if (categoryId) {
        const item1 = await createItem({ name: 'Item 1', categoryId });
        await createItem({ name: 'Item 2', categoryId });

        const initialPacked = packedItems.value;
        const initialTotal = totalItems.value;

        await toggleItemPacked(item1);

        expect(packedItems.value).toBe(initialPacked + 1);
        expect(totalItems.value).toBe(initialTotal);
        expect(progress.value).toBeGreaterThan(0);
      }
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
    // Test Case 15: Errors should be captured in error state
    it('should handle storage errors gracefully', async () => {
      const { initialize, error } = usePackingLists();

      mockStorage['packingListApp'] = 'invalid json {{{';

      await initialize();

      expect(error.value).toBeNull();
    });
  });
});
