<!--
================================================================================
File: source/App.vue
Description: Main application component handling layout, routing and state
             management for the packing list application.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div :class="['min-h-screen text-slate-800', isMobileViewport ? 'flex flex-col' : 'flex']">
    <!-- Overlay for narrow screens when sidebar is open -->
    <div
      v-if="(isMobileViewport || (isSmallDesktop && isSidebarOpen)) && isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      @click="toggleSidebar"
    ></div>

    <!-- Mobile Topbar -->
    <Topbar
      v-if="isMobileViewport"
      :title="selectedChecklist ? selectedChecklist.destination : 'Packing List'"
      @toggle="toggleSidebar"
      @new="handleChecklistCreate"
    />

    <!-- Sidebar -->
    <!-- Overlay Sidebar (Mobile or Narrow + Expanded) -->
    <teleport
      v-if="isOverlayVisible"
      to="body"
    >
      <div class="fixed inset-y-0 left-0 z-50">
        <Sidebar
          :is-expanded="isSidebarOpen"
          :is-mobile="isMobileViewport"
          :is-narrow="isSmallDesktop"
          :checklists="checklists"
          :selected-checklist-id="selectedChecklistId"
          @toggle-sidebar="toggleSidebar"
          @create-checklist="handleChecklistCreate"
          @select-checklist="selectedChecklistId = $event"
          @delete-checklist="handleChecklistDelete"
        />
      </div>
    </teleport>

    <!-- Inline Sidebar (Desktop only, when not in overlay mode) -->
    <div
      v-else-if="!isMobileViewport"
      class="relative z-50"
    >
      <Sidebar
        :is-expanded="isSidebarOpen"
        :is-mobile="isMobileViewport"
        :is-narrow="isSmallDesktop"
        :checklists="checklists"
        :selected-checklist-id="selectedChecklistId"
        @toggle-sidebar="toggleSidebar"
        @create-checklist="handleChecklistCreate"
        @select-checklist="selectedChecklistId = $event"
        @delete-checklist="handleChecklistDelete"
      />
    </div>

    <!-- Main Content -->
    <main
      :class="[
        'min-w-0 flex-1 overflow-y-auto bg-gray-50 p-4 duration-200 md:p-6',
        {
          'pointer-events-none blur-sm': isSidebarOpen && (isMobileViewport || isSmallDesktop),
        },
      ]"
    >
      <div v-if="selectedChecklist">
        <ChecklistComponent
          :checklist="selectedChecklist"
          :categories="categories"
          :items="items"
          :newly-created-item-id="newlyCreatedItemId"
          :newly-created-category-id="newlyCreatedCategoryId"
          :newly-created-checklist-id="newlyCreatedChecklistId"
          @update:checklist="handleChecklistUpdate"
          @delete:checklist="handleChecklistDelete"
          @create:item="handleItemCreate"
          @update:item="handleItemUpdate"
          @delete:item="handleItemDelete"
          @create:category="handleCategoryCreate"
          @update:category="handleCategoryUpdate"
          @delete:category="handleCategoryDelete"
          @reorder:categories="handleCategoryReorder"
          @move:item="handleItemMove"
        />
      </div>
      <div
        v-else
        class="text-secondary mt-20 text-center"
      >
        {{ $t('checklist.pleaseCreate') }}
      </div>
    </main>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ChecklistComponent from './components/Checklist.vue';
import Sidebar from './components/Sidebar.vue';
import Topbar from './components/Topbar.vue';
import { usePackingLists } from './composables/usePackingLists';

// ------------------------------------------------------------------------------
// Internationalization (i18n)
// ------------------------------------------------------------------------------

const { t } = useI18n();

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

// Local key for remembering manual sidebar collapse on desktop
const SIDEBAR_COLLAPSED_KEY = 'sidebar-manually-collapsed';

// Responsive breakpoints
const BREAKPOINTS = {
  MOBILE: 600, // md breakpoint
  SIDEBAR_OVERLAY: 1000, // width under which sidebar becomes overlay
};

// ------------------------------------------------------------------------------
// Composables
// ------------------------------------------------------------------------------

// Initialize packing lists composable
const {
  checklists,
  categories,
  items,
  selectedChecklistId,
  selectedChecklist,
  initialize,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createItem,
  getItems,
  updateItem,
  deleteItem,
} = usePackingLists();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// UI state
const isSidebarOpen = ref(true);
const isMobileViewport = ref(false);
const isSmallDesktop = ref(false);

// Newly created item tracking for auto-edit
const newlyCreatedItemId = ref(null);
const newlyCreatedCategoryId = ref(null);
const newlyCreatedChecklistId = ref(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Determine if sidebar should show as overlay
const isOverlayVisible = computed(
  () =>
    (isMobileViewport.value || (isSmallDesktop.value && isSidebarOpen.value)) && isSidebarOpen.value
);

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

// Generic error handler for async operations
const handleAsyncAction = async (action, ...args) => {
  return await action(...args);
};

/**
 * Check if screen is mobile size and adjust UI accordingly
 */
function checkScreenSize() {
  isMobileViewport.value = window.innerWidth < BREAKPOINTS.MOBILE;
  isSmallDesktop.value = window.innerWidth < BREAKPOINTS.SIDEBAR_OVERLAY;

  // Auto-collapse sidebar on small screens
  if (isMobileViewport.value || isSmallDesktop.value) {
    isSidebarOpen.value = false;
  } else {
    // Auto-expand on desktop if not manually collapsed
    if (!localStorage.getItem(SIDEBAR_COLLAPSED_KEY)) {
      isSidebarOpen.value = true;
    }
  }
}

// ------------------------------------------------------------------------------
// UI Handlers
// ------------------------------------------------------------------------------

/**
 * Handle window resize events and update viewport state
 */
function handleResize() {
  checkScreenSize();
}

/**
 * Toggle sidebar open/closed state
 */
function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;

  // Remember manual toggle on desktop
  if (!isMobileViewport.value) {
    if (isSidebarOpen.value) {
      localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
    } else {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
    }
  }
}

// ------------------------------------------------------------------------------
// Item Handlers
// ------------------------------------------------------------------------------

/**
 * Create a new item in the specified category with default values
 * @param {string} categoryId - The ID of the category to add the item to
 */
async function handleItemCreate(categoryId) {
  // Find the max order in this category
  const categoryItems = items.value.filter((item) => item.categoryId === categoryId);
  const maxOrder =
    categoryItems.length > 0 ? Math.max(...categoryItems.map((item) => item.order || 0)) : -1;

  const newItemData = {
    name: t('item.defaultName'),
    quantity: 1,
    categoryId: categoryId,
    isPacked: false,
    order: maxOrder + 1,
  };

  const newItem = await handleAsyncAction(createItem, newItemData);
  if (newItem) {
    newlyCreatedItemId.value = newItem.id;
  }
}

/**
 * Update an existing item with new data
 * @param {object} item - The item object with updated properties
 */
async function handleItemUpdate(item) {
  await handleAsyncAction(updateItem, item);

  // Clear the newly created flag if this was the item being edited
  if (newlyCreatedItemId.value === item.id) {
    newlyCreatedItemId.value = null;
  }
}

/**
 * Delete an item by ID
 * @param {string} itemId - The ID of the item to delete
 */
async function handleItemDelete(itemId) {
  await handleAsyncAction(deleteItem, itemId);
}

/**
 * Handle item drag-and-drop movement or reordering within categories
 * @param {object} moveData - Move data containing item, category IDs, and reordered items
 */
async function handleItemMove(moveData) {
  if (moveData.type === 'move') {
    // Item moved to different category
    const updatedItem = {
      ...moveData.item,
      categoryId: moveData.newCategoryId,
    };
    await handleAsyncAction(updateItem, updatedItem);

    // Also update the reordered items in the target category
    if (moveData.reorderedItems && moveData.reorderedItems.length > 0) {
      for (const item of moveData.reorderedItems) {
        await handleAsyncAction(updateItem, item);
      }
    }
  } else if (moveData.type === 'reorder') {
    // Items reordered within same category
    for (const item of moveData.items) {
      await handleAsyncAction(updateItem, item);
    }
  }

  // Refresh items list
  await getItems();
}

// ------------------------------------------------------------------------------
// Category Handlers
// ------------------------------------------------------------------------------

/**
 * Create a new category with default name
 */
async function handleCategoryCreate() {
  // Find the highest order among all categories
  const maxOrder =
    categories.value.length > 0 ? Math.max(...categories.value.map((cat) => cat.order || 0)) : -1;

  const newCategoryData = {
    name: t('category.defaultName'),
    order: maxOrder + 1,
  };

  const newCategory = await handleAsyncAction(createCategory, newCategoryData);
  if (newCategory) {
    newlyCreatedCategoryId.value = newCategory.id;
  }
}

/**
 * Update an existing category with new data
 * @param {object} category - The category object with updated properties
 */
async function handleCategoryUpdate(category) {
  await handleAsyncAction(updateCategory, category);

  // Clear the newly-created flag if this was the category being edited
  if (newlyCreatedCategoryId.value === category.id) {
    newlyCreatedCategoryId.value = null;
  }
}

/**
 * Delete a category by ID
 * @param {string} categoryId - The ID of the category to delete
 */
async function handleCategoryDelete(categoryId) {
  await handleAsyncAction(deleteCategory, categoryId);
}

/**
 * Handle category drag-and-drop reordering
 * @param {Array<object>} reorderedCategories - Array of categories with updated order properties
 */
async function handleCategoryReorder(reorderedCategories) {
  // Update all categories with new order
  for (const category of reorderedCategories) {
    await handleAsyncAction(updateCategory, category);
  }

  // Refresh categories after all updates to ensure consistency
  await getCategories();
}

// ------------------------------------------------------------------------------
// Checklist Handlers
// ------------------------------------------------------------------------------

/**
 * Create a new checklist with default name
 */
async function handleChecklistCreate() {
  const newChecklistData = {
    name: t('checklist.defaultName'),
  };
  const newChecklist = await handleAsyncAction(createChecklist, newChecklistData);
  if (newChecklist) {
    newlyCreatedChecklistId.value = newChecklist.id;
  }
}

/**
 * Update an existing checklist with new data
 * @param {object} checklist - The checklist object with updated properties
 */
async function handleChecklistUpdate(checklist) {
  await handleAsyncAction(updateChecklist, checklist);
}

/**
 * Delete a checklist by ID after user confirmation
 * @param {string} checklistId - The ID of the checklist to delete
 */
async function handleChecklistDelete(checklistId) {
  const confirmed = confirm(t('checklist.deleteConfirm'));
  if (!confirmed) return;

  await handleAsyncAction(deleteChecklist, checklistId);

  if (selectedChecklistId.value === checklistId) {
    // Switch to first available checklist
    selectedChecklistId.value = checklists.value[0]?.id || null;
  }
}

// ------------------------------------------------------------------------------
// Lifecycle Hooks
// ------------------------------------------------------------------------------

// Initialize app and set up responsive behavior
onMounted(async () => {
  await initialize();

  // Set up responsive behavior
  checkScreenSize();
  window.addEventListener('resize', handleResize);
});

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

// Prevent layout shift caused by scrollbar/body resizing when overlay drawer is active
watch([isSidebarOpen, isMobileViewport, isSmallDesktop], () => {
  const overlayActive =
    isSidebarOpen.value &&
    (isMobileViewport.value || (isSmallDesktop.value && isSidebarOpen.value));
  if (overlayActive) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style>
.backdrop {
  background-color: var(--color-overlay-backdrop);
}
</style>
