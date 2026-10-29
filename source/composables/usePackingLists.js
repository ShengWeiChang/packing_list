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

import { computed, getCurrentInstance, onMounted, onUnmounted, readonly, ref, watch } from 'vue';

import { Category } from '../models/Category';
import { Checklist } from '../models/Checklist';
import { Item } from '../models/Item';
import { LocalStorageService } from '../services/localStorageService';
import { StorageError } from '../services/storageTransaction';
import { STORAGE_KEYS } from '../utils/constants';
import { debounce } from '../utils/helpers';

const PACKING_HISTORY_LIMIT = 50;

/**
 * Require the user's observed state before submitting a field-level change.
 * @param {object|undefined} value - Entity observed before editing.
 * @returns {object} Detached baseline.
 */
function requireEditBaseline(value) {
  if (!value) throw new StorageError('conflict', 'The edited record no longer exists');
  return value.toJSON?.() ?? { ...value };
}

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
  // Cross-tab sync (storage event)
  // ---------------------------------------------------------------------------

  const refreshFromStorage = debounce(() => {
    // Refresh in-memory state after a short burst of cross-tab writes settles.
    void initialize();
  }, 50);

  const handleStorageEvent = (e) => {
    // Only react to app data changes coming from other tabs/windows.
    if (!e || (e.key !== STORAGE_KEYS.APP_DATA && e.key !== null)) return;

    // History becomes unsafe immediately, even while the refresh is debounced.
    clearPackingHistory();
    itemsRequestRevision += 1;
    categoriesRequestRevision += 1;
    refreshFromStorage();
  };

  // Register lifecycle hooks only when used within a component `setup()`.
  // (Unit tests may call this composable directly without an active instance.)
  if (getCurrentInstance()) {
    onMounted(() => {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('storage', handleStorageEvent);
      }
    });

    onUnmounted(() => {
      refreshFromStorage.cancel();
      dataService.dispose();
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('storage', handleStorageEvent);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const checklists = ref([]);
  const categories = ref([]);
  const items = ref([]);
  const selectedChecklistId = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const storageHealth = ref(null);
  const operationError = ref(null);
  const operationErrorVersion = ref(0);
  const refreshAfterSaveFailed = ref(false);
  let postCommitRefreshes = 0;
  const packingUndoStack = ref([]);
  const packingRedoStack = ref([]);
  let isApplyingPackingHistory = false;
  let packingHistoryRevision = 0;
  let selectionRevision = 0;
  let itemsRequestRevision = 0;
  let categoriesRequestRevision = 0;

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
  const canUndoPackingChange = computed(() => packingUndoStack.value.length > 0);
  const canRedoPackingChange = computed(() => packingRedoStack.value.length > 0);

  // ---------------------------------------------------------------------------
  // Functions
  // ---------------------------------------------------------------------------

  /**
   * Read the checklist last opened in this browser profile.
   * @returns {string|null} Stored checklist ID, if available
   */
  function getLastOpenedChecklistId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID) || null;
    } catch {
      return null;
    }
  }

  /**
   * Persist or clear the last opened checklist without blocking the current UI.
   * @param {string|null} checklistId - Checklist ID to persist
   */
  function persistLastOpenedChecklistId(checklistId) {
    try {
      if (checklistId) {
        localStorage.setItem(STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID, checklistId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.LAST_OPENED_CHECKLIST_ID);
      }
    } catch {
      // Storage can be unavailable (for example, disabled browser storage).
      // Keep the in-memory selection usable even when it cannot be remembered.
    }
  }

  /**
   * Return the canonical ID that appears at the top of the descending Sidebar.
   * @returns {string|null} Highest-order checklist ID, if available
   */
  function getSidebarTopChecklistId() {
    return checklists.value.at(-1)?.id || null;
  }

  /**
   * Keep a valid in-memory selection, otherwise restore the saved selection or
   * recover to the checklist shown first in the Sidebar.
   */
  function resolveSelectedChecklist() {
    if (checklists.value.some((checklist) => checklist.id === selectedChecklistId.value)) {
      return;
    }

    if (!selectedChecklistId.value) {
      const lastOpenedChecklistId = getLastOpenedChecklistId();
      if (checklists.value.some((checklist) => checklist.id === lastOpenedChecklistId)) {
        selectedChecklistId.value = lastOpenedChecklistId;
        return;
      }
    }

    selectedChecklistId.value = getSidebarTopChecklistId();
    if (!selectedChecklistId.value) {
      persistLastOpenedChecklistId(null);
    }
  }

  /**
   * Generic wrapper for async data operations with error handling and loading state
   * @param {Function} loader - Async function to execute
   * @param {string} errorMessage - Error message prefix for failures
   * @param {boolean} [isRead=false] - Whether this operation reads existing data.
   * @returns {Promise<*>} Result from loader function or null on error
   */
  async function loadData(loader, errorMessage, isRead = false) {
    isLoading.value = true;
    try {
      const result = await loader();
      if (!isRead) {
        operationError.value = null;
        refreshAfterSaveFailed.value = false;
      }
      return result;
    } catch (e) {
      error.value = `${errorMessage}: ${e.message}`;
      if (isRead) {
        storageHealth.value = e.code || 'unavailable';
        if (postCommitRefreshes) refreshAfterSaveFailed.value = true;
      } else {
        operationError.value = e.code || 'unavailable';
        operationErrorVersion.value += 1;
      }
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /** Refresh visible state after a successful commit without misreporting the write.
   * @param {Function} refresh - Refresh operation to run.
   */
  async function refreshAfterCommit(refresh) {
    postCommitRefreshes += 1;
    try {
      await refresh();
    } finally {
      postCommitRefreshes -= 1;
    }
  }

  /** Dismiss an error only if it still belongs to the cancelled operation.
   * @param {number} version - Error revision captured by the editor.
   */
  function clearOperationError(version) {
    if (operationErrorVersion.value === version) operationError.value = null;
  }

  /**
   * Clear packing-only undo and redo history.
   * History is intentionally scoped to the current checklist and browser tab.
   */
  function clearPackingHistory() {
    packingHistoryRevision += 1;
    packingUndoStack.value = [];
    packingRedoStack.value = [];
  }

  /**
   * Record one logical category-wide packing status change.
   * @param {Array<object>} beforeItems - Items before the operation
   * @param {Array<object>} afterItems - Items after the operation
   * @param {string|null} [checklistId=selectedChecklistId.value] - Checklist owning the change
   */
  function recordPackingBatchChange(
    beforeItems,
    afterItems,
    checklistId = selectedChecklistId.value
  ) {
    const changes = afterItems
      .map((afterItem) => {
        const beforeItem = beforeItems.find((item) => item.id === afterItem.id);
        if (!beforeItem) return null;

        const before = {
          isPacked: beforeItem.isPacked,
          isPending: beforeItem.isPending,
        };
        const after = {
          isPacked: afterItem.isPacked,
          isPending: afterItem.isPending,
        };

        if (before.isPacked === after.isPacked && before.isPending === after.isPending) {
          return null;
        }

        return { itemId: afterItem.id, before, after };
      })
      .filter(Boolean);

    if (changes.length === 0 || !checklistId) return;

    packingHistoryRevision += 1;
    packingUndoStack.value = [...packingUndoStack.value, { checklistId, changes }].slice(
      -PACKING_HISTORY_LIMIT
    );
    packingRedoStack.value = [];
  }

  /**
   * Invalidate redo when an individual item changes packing state.
   * Individual item actions stay outside the category-level undo history.
   * @param {object|undefined} beforeItem - Item before the update
   * @param {object} afterItem - Item after the update
   */
  function invalidatePackingRedo(beforeItem, afterItem) {
    if (
      !beforeItem ||
      (beforeItem.isPacked === afterItem.isPacked && beforeItem.isPending === afterItem.isPending)
    ) {
      return;
    }

    packingHistoryRevision += 1;
    packingRedoStack.value = [];
  }

  /**
   * Apply one stored history entry against the latest in-memory item data.
   * Only packing fields are changed so later edits to names or quantities survive.
   * @param {object} entry - Packing history entry
   * @param {'before'|'after'} direction - State snapshot to apply
   * @returns {Promise<boolean>} Whether the entry was applied
   */
  async function applyPackingHistoryEntry(entry, direction) {
    if (!entry || entry.checklistId !== selectedChecklistId.value) return false;

    const updates = entry.changes
      .map((change) => {
        const currentItem = items.value.find((item) => item.id === change.itemId);
        if (!currentItem) return null;
        return new Item({ ...currentItem, ...change[direction] });
      })
      .filter(Boolean);

    if (updates.length === 0 || updates.length !== entry.changes.length) return false;
    const result = await updateMultipleItems(updates, { recordHistory: false });
    return Boolean(result && entry.checklistId === selectedChecklistId.value);
  }

  /**
   * Undo the latest category-wide packing status change.
   * @returns {Promise<boolean>} Whether a change was undone
   */
  async function undoPackingChange() {
    if (isApplyingPackingHistory) return false;
    isApplyingPackingHistory = true;
    try {
      const entry = packingUndoStack.value.at(-1);
      const revision = packingHistoryRevision;
      if (!(await applyPackingHistoryEntry(entry, 'before'))) return false;
      if (packingHistoryRevision !== revision || packingUndoStack.value.at(-1) !== entry) {
        return false;
      }

      packingHistoryRevision += 1;
      packingUndoStack.value = packingUndoStack.value.slice(0, -1);
      packingRedoStack.value = [...packingRedoStack.value, entry].slice(-PACKING_HISTORY_LIMIT);
      return true;
    } finally {
      isApplyingPackingHistory = false;
    }
  }

  /**
   * Redo the latest undone category-wide packing status change.
   * @returns {Promise<boolean>} Whether a change was redone
   */
  async function redoPackingChange() {
    if (isApplyingPackingHistory) return false;
    isApplyingPackingHistory = true;
    try {
      const entry = packingRedoStack.value.at(-1);
      const revision = packingHistoryRevision;
      if (!(await applyPackingHistoryEntry(entry, 'after'))) return false;
      if (packingHistoryRevision !== revision || packingRedoStack.value.at(-1) !== entry) {
        return false;
      }

      packingHistoryRevision += 1;
      packingRedoStack.value = packingRedoStack.value.slice(0, -1);
      packingUndoStack.value = [...packingUndoStack.value, entry].slice(-PACKING_HISTORY_LIMIT);
      return true;
    } finally {
      isApplyingPackingHistory = false;
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
      storageHealth.value = null;
      refreshAfterSaveFailed.value = false;

      // Normalize legacy defaults in memory without modifying stored data.
      const rawChecklists = raw.checklists || [];
      const preChecklists = rawChecklists.map((cl, index) => {
        if (typeof cl.order === 'undefined') {
          return Checklist.fromJSON({ ...cl, order: index });
        }
        return Checklist.fromJSON(cl);
      });
      const preCategories = (raw.categories || []).map((cat) => Category.fromJSON(cat));
      const preItems = (raw.items || []).map((it) => Item.fromJSON(it));

      // Sort checklists by order
      preChecklists.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Load checklists and restore the user's saved context when possible.
      checklists.value = preChecklists;
      resolveSelectedChecklist();

      // Load categories and items for the currently selected checklist
      if (selectedChecklistId.value) {
        categories.value = preCategories.filter((c) => c.checklistId === selectedChecklistId.value);
        items.value = preItems.filter((i) => i.checklistId === selectedChecklistId.value);
      } else {
        categories.value = [];
        items.value = [];
      }
    } catch (e) {
      storageHealth.value = e.code || 'unavailable';
      error.value = `Error initializing data: ${e.message}`;
    } finally {
      isLoading.value = false;
    }
  }

  // -----------------------------------------------------------------------------
  // CHECKLIST CRUD OPERATIONS
  // -----------------------------------------------------------------------------

  /**
   * Create a new checklist with optional data source
   * @param {object} checklistData - Checklist data to create
   * @param {object} [options] - Creation options { source: 'recommended'|'empty'|'template', seedData }
   * @returns {Promise<object|null>} Created checklist object or null on error
   */
  async function createChecklist(checklistData, options = {}) {
    const result = await loadData(
      () => dataService.createChecklist(checklistData, options),
      'Error creating checklist'
    );
    if (result) {
      await refreshAfterCommit(getChecklists);
      if (!refreshAfterSaveFailed.value) selectedChecklistId.value = result.id;
      return result;
    }
    return null;
  }

  /**
   * Get all checklists from storage
   * @returns {Promise<Array>} Array of checklist objects sorted by order
   */
  async function getChecklists() {
    const result = await loadData(
      () => dataService.getChecklists(),
      'Error getting checklists',
      true
    );
    if (!result) return checklists.value;

    checklists.value = result.sort((a, b) => (a.order || 0) - (b.order || 0));
    resolveSelectedChecklist();
    return checklists.value;
  }

  /**
   * Update an existing checklist
   * @param {object} checklistData - Updated checklist data (must include id)
   * @param {object} [editBaseline] - Checklist before editing.
   * @returns {Promise<object|null>} Updated checklist or null on error
   */
  async function updateChecklist(checklistData, editBaseline) {
    const expected =
      editBaseline ?? checklists.value.find((checklist) => checklist.id === checklistData.id);
    const result = await loadData(
      () => dataService.updateChecklist(checklistData, requireEditBaseline(expected)),
      'Error updating checklist'
    );
    if (result) {
      await refreshAfterCommit(getChecklists);
      return result;
    }
    return null;
  }

  /**
   * Update multiple checklists in a single transaction
   * This prevents race conditions when updating multiple checklists in parallel
   * @param {Array<object>} checklistsData - Array of checklist data to update
   * @param {Array<object>} [editBaseline] - Checklists before dragging.
   * @returns {Promise<Array<object>|null>} Array of updated checklists or null on error
   */
  async function updateMultipleChecklists(checklistsData, editBaseline) {
    const expected = (editBaseline ?? checklists.value).map((checklist) =>
      requireEditBaseline(checklist)
    );
    const result = await loadData(
      () =>
        dataService.updateMultipleChecklists(
          checklistsData.map((checklist) => ({
            ...requireEditBaseline(expected.find((entry) => entry.id === checklist.id)),
            order: checklist.order,
          })),
          expected
        ),
      'Error updating checklists'
    );
    if (result) {
      await refreshAfterCommit(getChecklists);
      return result;
    }
    return null;
  }

  /**
   * Delete a checklist and update selection if needed
   * @param {string} checklistId - Checklist ID to delete
   * @returns {Promise<boolean>} Whether the deletion was committed.
   */
  async function deleteChecklist(checklistId) {
    const deleted = await loadData(async () => {
      await dataService.deleteChecklist(checklistId);
      return true;
    }, 'Error deleting checklist');
    if (!deleted) return false;
    await refreshAfterCommit(getChecklists);
    return true;
  }

  /**
   * Duplicate an existing checklist with all its categories and items
   * @param {string} checklistId - Checklist ID to duplicate
   * @returns {Promise<object|null>} Duplicated checklist or null on error
   */
  async function duplicateChecklist(checklistId) {
    const result = await loadData(
      () => dataService.duplicateChecklist(checklistId),
      'Error duplicating checklist'
    );
    if (result) {
      await refreshAfterCommit(getChecklists);
      return result;
    }
    return null;
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
      await refreshAfterCommit(getCategories);
      return result;
    }
    return null;
  }

  /**
   * Get all categories for the current checklist
   * @returns {Promise<Array>} Array of category objects sorted by order
   */
  async function getCategories() {
    const checklistId = selectedChecklistId.value;
    const selectionAtStart = selectionRevision;
    const requestRevision = ++categoriesRequestRevision;
    if (!checklistId) {
      categories.value = [];
      return [];
    }
    const result = await loadData(
      () => dataService.getCategories(checklistId),
      'Error getting categories',
      true
    );
    if (
      selectedChecklistId.value !== checklistId ||
      selectionRevision !== selectionAtStart ||
      categoriesRequestRevision !== requestRevision
    ) {
      return categories.value;
    }
    if (!result) return categories.value;
    categories.value = (result || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    return categories.value;
  }

  /**
   * Update an existing category
   * @param {object} categoryData - Updated category data (must include id)
   * @param {object} [editBaseline] - Category before editing.
   * @returns {Promise<object|null>} Updated category or null on error
   */
  async function updateCategory(categoryData, editBaseline) {
    const expected =
      editBaseline ?? categories.value.find((category) => category.id === categoryData.id);
    const result = await loadData(
      () => dataService.updateCategory(categoryData, requireEditBaseline(expected)),
      'Error updating category'
    );
    if (!result) {
      return null;
    }
    await refreshAfterCommit(getCategories);
    return result;
  }

  /**
   * Reorder categories with one guarded storage write.
   * @param {Array<object>} categoryData - Updated categories.
   * @param {Array<object>} [editBaseline] - Categories before dragging.
   * @returns {Promise<Array<object>|null>} Committed categories or null on failure.
   */
  async function updateMultipleCategories(categoryData, editBaseline) {
    const expected = (editBaseline ?? categories.value).map((category) =>
      requireEditBaseline(category)
    );
    const result = await loadData(
      () =>
        dataService.updateMultipleCategories(
          categoryData.map((category) => ({
            ...requireEditBaseline(expected.find((entry) => entry.id === category.id)),
            order: category.order,
          })),
          expected
        ),
      'Error updating categories'
    );
    if (result) await refreshAfterCommit(getCategories);
    return result;
  }

  /**
   * Delete a category and all its items
   * @param {string} categoryId - Category ID to delete
   * @returns {Promise<boolean>} Whether the deletion was committed.
   */
  async function deleteCategory(categoryId) {
    const deleted = await loadData(async () => {
      await dataService.deleteCategory(categoryId);
      return true;
    }, 'Error deleting category');
    if (!deleted) return false;
    clearPackingHistory();
    await refreshAfterCommit(() => Promise.all([getCategories(), getItems()]));
    return true;
  }

  /**
   * Duplicate an existing category with all its items
   * @param {string} categoryId - Category ID to duplicate
   * @returns {Promise<object|null>} Duplicated category or null on error
   */
  async function duplicateCategory(categoryId) {
    const result = await loadData(
      () => dataService.duplicateCategory(categoryId),
      'Error duplicating category'
    );
    if (result) {
      await refreshAfterCommit(() => Promise.all([getCategories(), getItems()]));
      return result;
    }
    return null;
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
      await refreshAfterCommit(getItems);
      return result;
    }
    return null;
  }

  /**
   * Get all items for the current checklist sorted by category and item order
   * @returns {Promise<Array>} Array of item objects
   */
  async function getItems() {
    const checklistId = selectedChecklistId.value;
    const selectionAtStart = selectionRevision;
    const requestRevision = ++itemsRequestRevision;
    if (!checklistId) {
      items.value = [];
      return [];
    }
    const result = await loadData(
      () => dataService.getItems(checklistId),
      'Error getting items',
      true
    );
    if (
      selectedChecklistId.value !== checklistId ||
      selectionRevision !== selectionAtStart ||
      itemsRequestRevision !== requestRevision
    ) {
      return items.value;
    }
    if (!result) return items.value;
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
   * @param {object} [editBaseline] - Item before editing.
   * @returns {Promise<object|null>} Updated item or null on error
   */
  async function updateItem(itemData, editBaseline) {
    const checklistId = selectedChecklistId.value;
    const selectionAtStart = selectionRevision;
    if (!checklistId) return null;
    const previousItem = items.value.find((item) => item.id === itemData.id);
    const result = await loadData(
      () =>
        dataService.updateItem(
          checklistId,
          itemData,
          requireEditBaseline(editBaseline ?? previousItem)
        ),
      'Error updating item'
    );
    if (result) {
      if (selectedChecklistId.value !== checklistId || selectionRevision !== selectionAtStart) {
        return result;
      }
      await refreshAfterCommit(getItems);
      if (selectedChecklistId.value !== checklistId || selectionRevision !== selectionAtStart) {
        return result;
      }
      invalidatePackingRedo(previousItem, result);
      return result;
    }
    return null;
  }

  /**
   * Update multiple existing items as one operation.
   * @param {Array<object>} itemData - Updated items
   * @param {object} [options] - Update behavior
   * @param {boolean} [options.recordHistory=false] - Whether to record one category packing change
   * @param {Array<string>} [options.fields] - Fields intentionally changed by a reorder.
   * @param {Array<object>} [options.expectedItems] - Items observed before the reorder.
   * @returns {Promise<Array<object>|null>} Updated items or null on error
   */
  async function updateMultipleItems(
    itemData,
    { recordHistory = false, fields, expectedItems } = {}
  ) {
    const checklistId = selectedChecklistId.value;
    const selectionAtStart = selectionRevision;
    if (!checklistId || itemData.length === 0) return [];
    const itemIds = new Set(itemData.map((item) => item.id));
    const previousItems = items.value.filter((item) => itemIds.has(item.id));
    const baseline = (expectedItems ?? previousItems).map((item) => item.toJSON?.() ?? { ...item });
    const result = await loadData(() => {
      const intendedItems = fields
        ? itemData.map((item) => {
            const expected = requireEditBaseline(baseline.find((entry) => entry.id === item.id));
            return {
              ...expected,
              ...Object.fromEntries(fields.map((field) => [field, item[field]])),
            };
          })
        : itemData;
      return dataService.updateMultipleItems(checklistId, intendedItems, baseline);
    }, 'Error updating items');
    if (result) {
      if (selectedChecklistId.value !== checklistId || selectionRevision !== selectionAtStart) {
        return null;
      }
      await refreshAfterCommit(getItems);
      if (selectedChecklistId.value !== checklistId || selectionRevision !== selectionAtStart) {
        return null;
      }
      if (recordHistory) {
        recordPackingBatchChange(previousItems, result, checklistId);
      }
      return result;
    }
    return null;
  }

  /**
   * Pack or unpack every item in a category as one undoable action.
   * @param {string} categoryId - Category ID
   * @param {boolean} isPacked - Target packed state
   * @returns {Promise<Array<object>|null>} Updated items or null on error
   */
  async function setCategoryPacked(categoryId, isPacked) {
    const categoryItems = items.value
      .filter((item) => item.categoryId === categoryId)
      .filter((item) => item.isPacked !== isPacked || (isPacked && item.isPending))
      .map(
        (item) =>
          new Item({
            ...item,
            isPacked,
            isPending: isPacked ? false : item.isPending,
          })
      );

    if (categoryItems.length === 0) return [];
    return updateMultipleItems(categoryItems, { recordHistory: true });
  }

  /**
   * Delete an item from the current checklist
   * @param {string} itemId - Item ID to delete
   * @returns {Promise<boolean>} Whether the deletion was committed.
   */
  async function deleteItem(itemId) {
    if (!selectedChecklistId.value) return false;
    const deleted = await loadData(async () => {
      await dataService.deleteItem(selectedChecklistId.value, itemId);
      return true;
    }, 'Error deleting item');
    if (!deleted) return false;
    clearPackingHistory();
    await refreshAfterCommit(getItems);
    return true;
  }

  /**
   * Duplicate an existing item within the same category
   * @param {string} itemId - Item ID to duplicate
   * @returns {Promise<object|null>} Duplicated item or null on error
   */
  async function duplicateItem(itemId) {
    if (!selectedChecklistId.value) return null;
    const result = await loadData(
      () => dataService.duplicateItem(selectedChecklistId.value, itemId),
      'Error duplicating item'
    );
    if (result) {
      await refreshAfterCommit(getItems);
      return result;
    }
    return null;
  }

  // -----------------------------------------------------------------------------
  // Watchers
  // -----------------------------------------------------------------------------

  // Watch for checklist changes to load relevant items
  watch(
    selectedChecklistId,
    (newId, oldId) => {
      if (newId !== oldId) {
        // Scoped arrays belong to the previous checklist until their new reads succeed.
        categories.value = [];
        items.value = [];
        persistLastOpenedChecklistId(newId);
        selectionRevision += 1;
        clearPackingHistory();
      }
    },
    { flush: 'sync' }
  );

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
    storageHealth: readonly(storageHealth),
    operationError: readonly(operationError),
    operationErrorVersion: readonly(operationErrorVersion),
    clearOperationError,
    refreshAfterSaveFailed: readonly(refreshAfterSaveFailed),

    // Computed
    selectedChecklist,
    totalItems,
    packedItems,
    progress,
    canUndoPackingChange,
    canRedoPackingChange,

    // System
    initialize,

    // CRUD Operations - Checklists
    createChecklist,
    getChecklists,
    updateChecklist,
    updateMultipleChecklists,
    deleteChecklist,
    duplicateChecklist,

    // CRUD Operations - Categories
    createCategory,
    getCategories,
    updateCategory,
    updateMultipleCategories,
    deleteCategory,
    duplicateCategory,

    // CRUD Operations - Items
    createItem,
    getItems,
    updateItem,
    updateMultipleItems,
    deleteItem,
    duplicateItem,

    // Item utilities
    toggleItemPacked,
    setCategoryPacked,
    undoPackingChange,
    redoPackingChange,
  };
}
