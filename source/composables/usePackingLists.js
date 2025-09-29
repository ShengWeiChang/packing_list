import { computed, readonly, ref, watch } from 'vue';
import { Category } from '../models/Category';
import { Checklist } from '../models/Checklist';
import { Item } from '../models/Item';
import { LocalStorageService } from '../services/localStorageService';

export function usePackingLists() {
  const dataService = new LocalStorageService();

  const checklists = ref([]);
  const categories = ref([]);
  const items = ref([]);
  const selectedChecklistId = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Computed properties
  const selectedChecklist = computed(() =>
    checklists.value.find(cl => cl.id === selectedChecklistId.value)
  );

  const totalItems = computed(() => items.value.length);
  const packedItems = computed(() => items.value.filter(item => item.isPacked).length);
  const progress = computed(() => {
    if (totalItems.value === 0) return 0;
    return Math.round((packedItems.value / totalItems.value) * 100);
  });

  // Generic data loading function
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

  // Toggle item packed status
  async function toggleItemPacked(item) {
    const updatedItem = new Item({ ...item, isPacked: !item.isPacked });
    await updateItem(updatedItem);
  }

  // Initial data loading
  async function initialize() {
    // Load the entire storage once to avoid multiple JSON.parse calls
    try {
      isLoading.value = true;
      error.value = null;
      const raw = await dataService.getAll();

      // Populate checklists, categories and items from the raw data
      const preChecklists = (raw.checklists || []).map(cl => Checklist.fromJSON(cl));
      const preCategories = (raw.categories || []).map(cat => Category.fromJSON(cat));
      const preItems = (raw.items || []).map(it => Item.fromJSON(it));

      checklists.value = preChecklists;

      // Load categories scoped to the selected checklist (if any)
      if (selectedChecklistId.value) {
        categories.value = preCategories.filter(c => c.checklistId === selectedChecklistId.value);
      } else {
        categories.value = [];
      }

      // If no selected checklist yet, pick the first
      if (checklists.value.length > 0 && !selectedChecklistId.value) {
        selectedChecklistId.value = checklists.value[0].id;
      }

      // Load items for currently selected checklist
      if (selectedChecklistId.value) {
        items.value = preItems.filter(i => i.checklistId === selectedChecklistId.value);
      } else {
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

  // ============================================================================
  // CHECKLIST CRUD OPERATIONS
  // ============================================================================

  async function createChecklist(checklistData) {
    const checklist = new Checklist(checklistData);
    await loadData(
      () => dataService.saveChecklist(checklist),
      'Error creating checklist'
    );
    await readChecklists();
    selectedChecklistId.value = checklist.id;
    return checklist;
  }

  async function readChecklists() {
    const result = await loadData(
      () => dataService.getChecklists(),
      'Error reading checklists'
    );
    checklists.value = result || [];
    if (checklists.value.length > 0 && !selectedChecklistId.value) {
      selectedChecklistId.value = checklists.value[0].id;
    }
    return checklists.value;
  }

  async function updateChecklist(checklistData) {
    const checklist = new Checklist(checklistData);
    await loadData(
      () => dataService.saveChecklist(checklist),
      'Error updating checklist'
    );
    await readChecklists();
    return checklist;
  }

  async function deleteChecklist(id) {
    await loadData(
      () => dataService.deleteChecklist(id),
      'Error deleting checklist'
    );
    await readChecklists();
    if (selectedChecklistId.value === id) {
      selectedChecklistId.value = checklists.value[0]?.id || null;
    }
  }

  // ============================================================================
  // CATEGORY CRUD OPERATIONS
  // ============================================================================

  async function createCategory(categoryData) {
    const category = new Category({ ...categoryData, checklistId: selectedChecklistId.value });
    await loadData(
      () => dataService.saveCategory(category),
      'Error creating category'
    );
    await readCategories();
    return category;
  }

  async function readCategories() {
    const result = await loadData(
      () => dataService.getCategoriesForChecklist(selectedChecklistId.value),
      'Error reading categories'
    );
    categories.value = result || [];
    return categories.value;
  }

  async function updateCategory(categoryData) {
    const category = new Category({ ...categoryData, checklistId: selectedChecklistId.value });
    await loadData(
      () => dataService.saveCategory(category),
      'Error updating category'
    );
    await readCategories();
    return category;
  }

  async function deleteCategory(categoryId) {
    await loadData(
      () => dataService.deleteCategory(categoryId),
      'Error deleting category'
    );
    await Promise.all([readCategories(), readItems()]);
  }

  // ============================================================================
  // ITEM CRUD OPERATIONS
  // ============================================================================

  async function createItem(itemData) {
    if (!selectedChecklistId.value) return;
    const item = new Item({ ...itemData, checklistId: selectedChecklistId.value });
    await loadData(
      () => dataService.saveItem(selectedChecklistId.value, item),
      'Error creating item'
    );
    await readItems();
    return item;
  }

  async function readItems() {
    if (!selectedChecklistId.value) {
      items.value = [];
      return [];
    }
    const result = await loadData(
      () => dataService.getItems(selectedChecklistId.value),
      'Error reading items'
    );
    items.value = result || [];
    return items.value;
  }

  async function updateItem(itemData) {
    if (!selectedChecklistId.value) return;
    const item = new Item({ ...itemData, checklistId: selectedChecklistId.value });
    await loadData(
      () => dataService.saveItem(selectedChecklistId.value, item),
      'Error updating item'
    );
    await readItems();
    return item;
  }

  async function deleteItem(itemId) {
    if (!selectedChecklistId.value) return;
    await loadData(
      () => dataService.deleteItem(selectedChecklistId.value, itemId),
      'Error deleting item'
    );
    await readItems();
  }

  // Watch for checklist changes to load relevant items
  watch(selectedChecklistId, (newId) => {
    if (newId) {
      readItems();
    } else {
      items.value = [];
    }
  });

  // When checklist selection changes, reload categories for that checklist
  watch(selectedChecklistId, (newId) => {
    if (newId) {
      readCategories();
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
    readChecklists,
    updateChecklist,
    deleteChecklist,

    // CRUD Operations - Categories
    createCategory,
    readCategories,
    updateCategory,
    deleteCategory,

    // CRUD Operations - Items
    createItem,
    readItems,
    updateItem,
    deleteItem,

    // Item utilities
    toggleItemPacked
  };
}
