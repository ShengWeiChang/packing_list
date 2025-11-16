/*
================================================================================
File: source/composables/usePackingLists.js
Description: Composable to manage checklists, categories and items state and CRUD
             operations using the configured data service.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { computed, readonly, ref, watch } from 'vue';

import { Category } from '../models/Category';
import { Checklist } from '../models/Checklist';
import { Item } from '../models/Item';
import { LocalStorageService } from '../services/localStorageService';

/**
 * Composable for managing packing list state and operations
 * @returns {object} Packing list management API with state, computed properties and CRUD operations
 */
export function usePackingLists() {
  // ---------------------------------------------------------------------------
  // Service initialization
  // ---------------------------------------------------------------------------

  const dataService = new LocalStorageService();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const checklists = ref([]);
  const categories = ref([]);
  const items = ref([]);
  const selectedChecklistId = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // ---------------------------------------------------------------------------
  // Computed properties
  // ---------------------------------------------------------------------------

  const selectedChecklist = computed(() =>
    checklists.value.find((cl) => cl.id === selectedChecklistId.value)
  );
  const totalItems = computed(() => items.value.length);
  const packedItems = computed(() => items.value.filter((item) => item.isPacked).length);
  const progress = computed(() => {
    if (totalItems.value === 0) return 0;
    return Math.round((packedItems.value / totalItems.value) * 100);
  });

  // ---------------------------------------------------------------------------
  // Functions
  // ---------------------------------------------------------------------------

  /**
   * Generic wrapper for async data operations with error handling and loading state
   * @param {Function} loader - Async function to execute
   * @param {string} errorMessage - Error message prefix for failures
   * @returns {Promise<*>} Result from loader function or null on error
   */
  async function loadData(loader, errorMessage) {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await loader();
      return result;
    } catch (e) {
      error.value = `${errorMessage}: ${e.message}`;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Toggle the packed status of an item
   * @param {object} item - Item object to toggle
   * @returns {Promise<void>}
   */
  async function toggleItemPacked(item) {
    const updatedItem = new Item({ ...item, isPacked: !item.isPacked });
    await updateItem(updatedItem);
  }

  /**
   * Initialize data by loading all checklists, categories and items from storage
   * @returns {Promise<void>}
   */
  async function initialize() {
    // Load the entire storage once to avoid multiple JSON.parse calls
    try {
      isLoading.value = true;
      error.value = null;
      const raw = await dataService.getData();

      // Populate checklists, categories and items from the raw data
      const preChecklists = (raw.checklists || []).map((cl) => Checklist.fromJSON(cl));
      const preCategories = (raw.categories || []).map((cat) => Category.fromJSON(cat));
      const preItems = (raw.items || []).map((it) => Item.fromJSON(it));

      // Ensure all checklists have order values and sort them
      preChecklists.forEach((checklist, index) => {
        if (typeof checklist.order === 'undefined') {
          checklist.order = index;
        }
      });
      preChecklists.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Load checklists
      checklists.value = preChecklists;
      // If no selected checklist yet, pick the first
      if (checklists.value.length > 0 && !selectedChecklistId.value) {
        selectedChecklistId.value = checklists.value[0].id;
      }

      // Load categories and items for the currently selected checklist
      if (selectedChecklistId.value) {
        categories.value = preCategories.filter((c) => c.checklistId === selectedChecklistId.value);
        items.value = preItems.filter((i) => i.checklistId === selectedChecklistId.value);
      } else {
        categories.value = [];
        items.value = [];
      }
    } catch (e) {
      error.value = `Error initializing data: ${e.message}`;
      checklists.value = [];
      categories.value = [];
      items.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // -----------------------------------------------------------------------------
  // CHECKLIST CRUD OPERATIONS
  // -----------------------------------------------------------------------------

  /**
   * Create a new checklist with default categories and items
   * @param {object} checklistData - Checklist data to create
   * @returns {Promise<object|null>} Created checklist object or null on error
   */
  async function createChecklist(checklistData) {
    const result = await loadData(
      () => dataService.createChecklist(checklistData),
      'Error creating checklist'
    );
    if (result) {
      await getChecklists();
      selectedChecklistId.value = result.id;
      return result;
    }
    return null;
  }

  /**
   * Get all checklists from storage
   * @returns {Promise<Array>} Array of checklist objects sorted by order
   */
  async function getChecklists() {
    const result = await loadData(() => dataService.getChecklists(), 'Error getting checklists');
    checklists.value = (result || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (checklists.value.length > 0 && !selectedChecklistId.value) {
      selectedChecklistId.value = checklists.value[0].id;
    }
    return checklists.value;
  }

  /**
   * Update an existing checklist
   * @param {object} checklistData - Updated checklist data (must include id)
   * @returns {Promise<object|null>} Updated checklist or null on error
   */
  async function updateChecklist(checklistData) {
    const result = await loadData(
      () => dataService.updateChecklist(checklistData),
      'Error updating checklist'
    );
    if (result) {
      await getChecklists();
      return result;
    }
    return null;
  }

  /**
   * Delete a checklist and update selection if needed
   * @param {string} id - Checklist ID to delete
   * @returns {Promise<void>}
   */
  async function deleteChecklist(id) {
    await loadData(() => dataService.deleteChecklist(id), 'Error deleting checklist');
    await getChecklists();
    if (selectedChecklistId.value === id) {
      selectedChecklistId.value = checklists.value[0]?.id || null;
    }
  }

  // -----------------------------------------------------------------------------
  // CATEGORY CRUD OPERATIONS
  // -----------------------------------------------------------------------------

  /**
   * Create a new category in the current checklist
   * @param {object} categoryData - Category data to create
   * @returns {Promise<object|null>} Created category or null on error
   */
  async function createCategory(categoryData) {
    if (!selectedChecklistId.value) return null;
    const result = await loadData(
      () => dataService.createCategory(selectedChecklistId.value, categoryData),
      'Error creating category'
    );
    if (result) {
      await getCategories();
      return result;
    }
    return null;
  }

  /**
   * Get all categories for the current checklist
   * @returns {Promise<Array>} Array of category objects sorted by order
   */
  async function getCategories() {
    if (!selectedChecklistId.value) {
      categories.value = [];
      return [];
    }
    const result = await loadData(
      () => dataService.getCategories(selectedChecklistId.value),
      'Error getting categories'
    );
    categories.value = (result || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    return categories.value;
  }

  /**
   * Update an existing category
   * @param {object} categoryData - Updated category data (must include id)
   * @returns {Promise<object|null>} Updated category or null on error
   */
  async function updateCategory(categoryData) {
    const result = await loadData(
      () => dataService.updateCategory(categoryData),
      'Error updating category'
    );
    if (result) {
      await getCategories();
      return result;
    }
    return null;
  }

  /**
   * Delete a category and all its items
   * @param {string} categoryId - Category ID to delete
   * @returns {Promise<void>}
   */
  async function deleteCategory(categoryId) {
    await loadData(() => dataService.deleteCategory(categoryId), 'Error deleting category');
    await Promise.all([getCategories(), getItems()]);
  }

  // -----------------------------------------------------------------------------
  // ITEM CRUD OPERATIONS
  // -----------------------------------------------------------------------------

  /**
   * Create a new item in the current checklist
   * @param {object} itemData - Item data to create
   * @returns {Promise<object|null>} Created item or null on error
   */
  async function createItem(itemData) {
    if (!selectedChecklistId.value) return null;
    const result = await loadData(
      () => dataService.createItem(selectedChecklistId.value, itemData),
      'Error creating item'
    );
    if (result) {
      await getItems();
      return result;
    }
    return null;
  }

  /**
   * Get all items for the current checklist sorted by category and item order
   * @returns {Promise<Array>} Array of item objects
   */
  async function getItems() {
    if (!selectedChecklistId.value) {
      items.value = [];
      return [];
    }
    const result = await loadData(
      () => dataService.getItems(selectedChecklistId.value),
      'Error getting items'
    );
    items.value = (result || []).sort((a, b) => {
      // First sort by category order, then by item order within category
      const catA = categories.value.find((c) => c.id === a.categoryId);
      const catB = categories.value.find((c) => c.id === b.categoryId);
      const catOrderA = catA ? catA.order || 0 : 0;
      const catOrderB = catB ? catB.order || 0 : 0;

      if (catOrderA !== catOrderB) {
        return catOrderA - catOrderB;
      }
      return (a.order || 0) - (b.order || 0);
    });
    return items.value;
  }

  /**
   * Update an existing item
   * @param {object} itemData - Updated item data (must include id)
   * @returns {Promise<object|null>} Updated item or null on error
   */
  async function updateItem(itemData) {
    if (!selectedChecklistId.value) return null;
    const result = await loadData(
      () => dataService.updateItem(selectedChecklistId.value, itemData),
      'Error updating item'
    );
    if (result) {
      await getItems();
      return result;
    }
    return null;
  }

  /**
   * Delete an item from the current checklist
   * @param {string} itemId - Item ID to delete
   * @returns {Promise<void>}
   */
  async function deleteItem(itemId) {
    if (!selectedChecklistId.value) return;
    await loadData(
      () => dataService.deleteItem(selectedChecklistId.value, itemId),
      'Error deleting item'
    );
    await getItems();
  }

  // -----------------------------------------------------------------------------
  // Watchers
  // -----------------------------------------------------------------------------

  // Watch for checklist changes to load relevant items
  watch(selectedChecklistId, (newId) => {
    if (newId) {
      getItems();
    } else {
      items.value = [];
    }
  });

  // Watch for checklist changes to load relevant categories
  watch(selectedChecklistId, (newId) => {
    if (newId) {
      getCategories();
    } else {
      categories.value = [];
    }
  });

  return {
    // State (reactive data)
    checklists: readonly(checklists),
    categories: readonly(categories),
    items: readonly(items),
    selectedChecklistId,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    selectedChecklist,
    totalItems,
    packedItems,
    progress,

    // System
    initialize,

    // CRUD Operations - Checklists
    createChecklist,
    getChecklists,
    updateChecklist,
    deleteChecklist,

    // CRUD Operations - Categories
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,

    // CRUD Operations - Items
    createItem,
    getItems,
    updateItem,
    deleteItem,

    // Item utilities
    toggleItemPacked,
  };
}
