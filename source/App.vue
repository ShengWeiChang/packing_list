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
  <div :class="[
    'min-h-screen text-slate-800',
    isMobileViewport ? 'flex flex-col' : 'flex'
  ]">
    <!-- Overlay for narrow screens when sidebar is open -->
    <div
      v-if="(isMobileViewport || (isSmallDesktop && isSidebarOpen)) && isSidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-40 z-40 backdrop-blur-sm"
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
    <teleport to="body" v-if="isOverlayVisible">
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
    <div v-else-if="!isMobileViewport" class="relative z-50">
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
        'p-4 md:p-6 overflow-y-auto bg-gray-50 min-w-0 transition-filter duration-200',
        isMobileViewport ? 'flex-1' : 'flex-1',
        { 'filter blur-sm pointer-events-none': (isSidebarOpen && (isMobileViewport || isSmallDesktop)) }
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
        />
      </div>
      <div
        v-else
        class="text-center text-secondary mt-20"
      >
        Please create a new checklist first.
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import ChecklistComponent from './components/Checklist.vue';
import Sidebar from './components/Sidebar.vue';
import Topbar from './components/Topbar.vue';
import { usePackingLists } from './composables/usePackingLists';

// Local key for remembering manual sidebar collapse on desktop.
// Kept local because only App.vue uses this preference.
const SIDEBAR_COLLAPSED_KEY = 'sidebar-manually-collapsed';

// Initialize composable
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
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem
} = usePackingLists();

// Responsive breakpoints
const BREAKPOINTS = {
  MOBILE: 768, // md breakpoint
  SIDEBAR_OVERLAY: 900 // width under which sidebar becomes overlay
};

// UI State
// Renamed for clearer intent:
// - isSidebarOpen: whether the sidebar is currently open/expanded
// - isMobileViewport: true when viewport is mobile-sized
// - isSmallDesktop: a narrow desktop / small-window breakpoint where the
//   sidebar should behave as an overlay
const isSidebarOpen = ref(true);
const isMobileViewport = ref(false);
const isSmallDesktop = ref(false);
const newlyCreatedItemId = ref(null);
const newlyCreatedCategoryId = ref(null);
const newlyCreatedChecklistId = ref(null);

// Computed properties for template logic
const isOverlayVisible = computed(() =>
  (isMobileViewport.value || (isSmallDesktop.value && isSidebarOpen.value)) && isSidebarOpen.value
);

// Generic error handler
const handleAsyncAction = async (action, ...args) => {
  try {
    return await action(...args);
  } catch (err) {
    // Error is already handled by useCheckList, just propagate if needed
    throw err;
  }
};

// Check if screen is mobile size
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

// Handle window resize
function handleResize() {
  checkScreenSize();
}

// Methods
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

// ----------------------
// Item handlers
// ----------------------

async function handleItemCreate(categoryId) {
  const newItemData = {
    name: 'New Item',
    quantity: 1,
    categoryId: categoryId,
    isPacked: false
  };

  const newItem = await handleAsyncAction(createItem, newItemData);
  if (newItem) {
    newlyCreatedItemId.value = newItem.id;
  }
}

async function handleItemUpdate(item) {
  await handleAsyncAction(updateItem, item);

  // Clear the newly created flag if this was the item being edited
  if (newlyCreatedItemId.value === item.id) {
    newlyCreatedItemId.value = null;
  }
}

async function handleItemDelete(itemId) {
  await handleAsyncAction(deleteItem, itemId);
}

// ----------------------
// Category handlers
// ----------------------

async function handleCategoryCreate() {
  const newCategoryData = {
    name: 'New Category'
  };

  const newCategory = await handleAsyncAction(createCategory, newCategoryData);
  if (newCategory) {
    newlyCreatedCategoryId.value = newCategory.id;
  }
}

async function handleCategoryUpdate(category) {
  await handleAsyncAction(updateCategory, category);

  // Clear the newly-created flag if this was the category being edited
  if (newlyCreatedCategoryId.value === category.id) {
    newlyCreatedCategoryId.value = null;
  }
}

async function handleCategoryDelete(categoryId) {
  await handleAsyncAction(deleteCategory, categoryId);
}

// ----------------------
// Checklist handlers
// ----------------------

async function handleChecklistCreate() {
  const newChecklistData = {
    destination: 'New Checklist',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  };

  const newChecklist = await handleAsyncAction(createChecklist, newChecklistData);
  if (newChecklist) {
    selectedChecklistId.value = newChecklist.id;
    newlyCreatedChecklistId.value = newChecklist.id;
  }
}

async function handleChecklistUpdate(checklist) {
  await handleAsyncAction(updateChecklist, checklist);

  // Clear the newly created flag if this was the checklist being edited
  if (newlyCreatedChecklistId.value === checklist.id) {
    newlyCreatedChecklistId.value = null;
  }

  // Clear the edit triggered flag if this was the checklist being edited
  if (editTriggeredChecklistId.value === checklist.id) {
    editTriggeredChecklistId.value = null;
  }
}

async function handleChecklistDelete(checklistId) {
  await handleAsyncAction(deleteChecklist, checklistId);
  // If the deleted checklist was selected, clear selection
  if (selectedChecklistId.value === checklistId) {
    selectedChecklistId.value = null;
  }
}

// Lifecycle hooks
onMounted(async () => {
  await initialize();

  // Set up responsive behavior
  checkScreenSize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Prevent layout shift caused by scrollbar/body resizing when overlay drawer is active
watch([isSidebarOpen, isMobileViewport, isSmallDesktop], () => {
  const overlayActive = isSidebarOpen.value && (isMobileViewport.value || (isSmallDesktop.value && isSidebarOpen.value));
  if (overlayActive) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style>
.backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
