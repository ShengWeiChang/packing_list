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
  <div :class="['min-h-screen text-primary', isMobileViewport ? 'flex flex-col' : 'flex']">
    <!-- Overlay for narrow screens when sidebar is open -->
    <div
      v-if="(isMobileViewport || (isSmallDesktop && isSidebarOpen)) && isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      role="button"
      tabindex="0"
      aria-label="Close sidebar"
      @click="toggleSidebar"
      @keydown.enter="toggleSidebar"
      @keydown.space="toggleSidebar"
    ></div>

    <!-- Mobile Topbar -->
    <Topbar
      v-if="isMobileViewport"
      :title="templateEditing?.name || selectedChecklist?.name || 'Packing List'"
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
          :templates="templates"
          :selected-checklist-id="selectedChecklistId"
          :selected-template-id="templateEditing?.id || null"
          @toggle-sidebar="toggleSidebar"
          @create-checklist="handleChecklistCreate"
          @select-checklist="selectedChecklistId = $event"
          @edit-checklist="handleChecklistEdit"
          @copy-checklist="handleChecklistCopy"
          @delete-checklist="handleChecklistDelete"
          @move:checklists="handleChecklistMove"
          @save-as-template="handleSaveAsTemplate"
          @edit-template="handleTemplateEdit"
          @delete-template="handleTemplateDelete"
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
        :templates="templates"
        :selected-checklist-id="selectedChecklistId"
        :selected-template-id="templateEditing?.id || null"
        @toggle-sidebar="toggleSidebar"
        @create-checklist="handleChecklistCreate"
        @select-checklist="selectedChecklistId = $event"
        @edit-checklist="handleChecklistEdit"
        @copy-checklist="handleChecklistCopy"
        @delete-checklist="handleChecklistDelete"
        @move:checklists="handleChecklistMove"
        @save-as-template="handleSaveAsTemplate"
        @edit-template="handleTemplateEdit"
        @delete-template="handleTemplateDelete"
      />
    </div>

    <!-- Main Content -->
    <main
      :class="[
        'min-w-0 flex-1 overflow-y-auto bg-bg-secondary p-4 duration-200 md:p-6',
        {
          'pointer-events-none blur-sm': isSidebarOpen && (isMobileViewport || isSmallDesktop),
        },
      ]"
    >
      <TemplateEditor
        v-if="templateEditing"
        :template="templateEditing"
        @cancel="handleTemplateEditCancel"
        @delete="handleTemplateEditDelete"
        @save="handleTemplateEditSave"
      />
      <div v-else-if="selectedChecklist">
        <ChecklistComponent
          :checklist="selectedChecklist"
          :categories="categories"
          :items="items"
          :newly-created-item-id="newlyCreatedItemId"
          :newly-created-category-id="newlyCreatedCategoryId"
          :newly-created-checklist-id="newlyCreatedChecklistId"
          @update:checklist="handleChecklistUpdate"
          @copy:checklist="handleChecklistCopy"
          @delete:checklist="handleChecklistDelete"
          @create:item="handleItemCreate"
          @update:item="handleItemUpdate"
          @copy:item="handleItemCopy"
          @delete:item="handleItemDelete"
          @create:category="handleCategoryCreate"
          @update:category="handleCategoryUpdate"
          @copy:category="handleCategoryCopy"
          @delete:category="handleCategoryDelete"
          @set-category-packed="handleCategoryPacked"
          @reorder:categories="handleCategoryReorder"
          @move:item="handleItemMove"
          @save-as-template="handleSaveAsTemplate"
        />
      </div>
      <div
        v-else
        class="mt-20 text-center text-secondary"
        data-testid="empty-state"
      >
        {{ $t('checklist.pleaseCreate') }}
      </div>
    </main>

    <!-- New Checklist Dialog -->
    <NewChecklistDialog
      :visible="showNewChecklistDialog"
      :templates="templates"
      :recommended-lists="recommendedLists"
      @close="showNewChecklistDialog = false"
      @select="handleNewChecklistSelect"
    />
    <SaveTemplateDialog
      :initial-name="templateChecklistName"
      :visible="showSaveTemplateDialog"
      @close="showSaveTemplateDialog = false"
      @save="handleTemplateSave"
    />

    <div
      v-if="showPackingUndo && canUndoPackingChange"
      class="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 rounded-lg bg-primary px-4 py-3 text-white shadow-lg"
      role="status"
      data-testid="packing-undo-toast"
    >
      <span>{{ $t('common.packingUpdated') }}</span>
      <button
        type="button"
        class="font-semibold text-white underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        @click="handleUndoPackingChange"
      >
        {{ $t('common.undo') }}
      </button>
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ChecklistComponent from './components/Checklist.vue';
import NewChecklistDialog from './components/NewChecklistDialog.vue';
import SaveTemplateDialog from './components/SaveTemplateDialog.vue';
import Sidebar from './components/Sidebar.vue';
import TemplateEditor from './components/TemplateEditor.vue';
import Topbar from './components/Topbar.vue';
import { usePackingLists } from './composables/usePackingLists';
import { useTemplates } from './composables/useTemplates';
import { RecommendedListService } from './services/recommendedListService.js';
import { VALIDATION } from './utils/constants.js';
import { generateSecureId } from './utils/helpers.js';

// ------------------------------------------------------------------------------
// Internationalization (i18n)
// ------------------------------------------------------------------------------

const { locale, t } = useI18n();

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
  updateMultipleChecklists,
  deleteChecklist,
  duplicateChecklist,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  duplicateCategory,
  createItem,
  getItems,
  updateItem,
  deleteItem,
  duplicateItem,
  setCategoryPacked,
  canUndoPackingChange,
  canRedoPackingChange,
  undoPackingChange,
  redoPackingChange,
} = usePackingLists();

// Initialize templates composable
const { templates, loadTemplates, saveAsTemplate, applyTemplate, deleteTemplate, updateTemplate } =
  useTemplates();
const recommendedListService = new RecommendedListService();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// UI state
const isSidebarOpen = ref(true);
const isMobileViewport = ref(false);
const isSmallDesktop = ref(false);
const showNewChecklistDialog = ref(false);
const showSaveTemplateDialog = ref(false);
const templateChecklistId = ref(null);
const templateChecklistName = ref('');
const templateEditing = ref(null);
const showPackingUndo = ref(false);
let packingUndoTimer = null;

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
const recommendedLists = computed(() => recommendedListService.getRecommendedLists(locale.value));

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- General Helpers ----------

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

// ---------- Item Handlers ----------

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
 * Handle item copy
 * @param {string} itemId - The ID of the item to copy
 */
async function handleItemCopy(itemId) {
  await handleAsyncAction(duplicateItem, itemId);
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

// ---------- Category Handlers ----------

/**
 * Create a new category with default values
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
 * Handle category copy
 * @param {string} categoryId - The ID of the category to copy
 */
async function handleCategoryCopy(categoryId) {
  await handleAsyncAction(duplicateCategory, categoryId);
}

/**
 * Delete a category by ID
 * @param {string} categoryId - The ID of the category to delete
 */
async function handleCategoryDelete(categoryId) {
  await handleAsyncAction(deleteCategory, categoryId);
}

/**
 * Pack or unpack all items in a category and offer a short-lived undo action.
 * @param {object} change - Category packing intent
 * @param {string} change.categoryId - Category ID
 * @param {boolean} change.isPacked - Target packed state
 */
async function handleCategoryPacked({ categoryId, isPacked }) {
  const checklistId = selectedChecklistId.value;
  const updatedItems = await handleAsyncAction(setCategoryPacked, categoryId, isPacked);
  if (
    !updatedItems?.length ||
    selectedChecklistId.value !== checklistId ||
    !canUndoPackingChange.value
  ) {
    return;
  }

  showPackingUndo.value = true;
  window.clearTimeout(packingUndoTimer);
  packingUndoTimer = window.setTimeout(() => {
    showPackingUndo.value = false;
  }, 5000);
}

/**
 * Undo the most recent category-wide packing status change.
 */
async function handleUndoPackingChange() {
  if (await undoPackingChange()) {
    showPackingUndo.value = false;
    window.clearTimeout(packingUndoTimer);
  }
}

/**
 * Return whether a keyboard event originated in an editable control.
 * @param {EventTarget|null} target - Keyboard event target
 * @returns {boolean} Whether native text editing should retain the shortcut
 */
function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

/**
 * Handle global undo/redo shortcuts for category-wide packing status changes.
 * @param {KeyboardEvent} event - Window keydown event
 */
function handlePackingHistoryKeydown(event) {
  if (
    event.repeat ||
    event.altKey ||
    (!event.ctrlKey && !event.metaKey) ||
    event.key.toLowerCase() !== 'z' ||
    isEditableTarget(event.target)
  ) {
    return;
  }

  if (event.shiftKey) {
    if (!canRedoPackingChange.value) return;
    event.preventDefault();
    void redoPackingChange();
  } else {
    if (!canUndoPackingChange.value) return;
    event.preventDefault();
    void handleUndoPackingChange();
  }
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

// ---------- Checklist Handlers ----------

/**
 * Build a default checklist name that identifies how it was created.
 * Source names are truncated so the generated value still satisfies model limits.
 * @param {'empty'|'template'|'recommended'} source - Creation source
 * @param {string} [sourceName=''] - Localized template or recommended-list name
 * @returns {string} Source-aware checklist name
 */
function buildSourceAwareChecklistName(source, sourceName = '') {
  const key = `checklist.defaultNameFrom${source[0].toUpperCase()}${source.slice(1)}`;
  if (source === 'empty') return t(key);

  const wrapperLength = t(key, { name: '' }).length;
  const availableNameLength = Math.max(0, VALIDATION.NAME_MAX_LENGTH - wrapperLength);
  return t(key, { name: sourceName.slice(0, availableNameLength) });
}

/**
 * Open the new checklist dialog to let user choose source
 */
function handleChecklistCreate() {
  showNewChecklistDialog.value = true;
}

/**
 * Handle user's selection from the new checklist dialog
 * @param {object} selection - Selected source and optional template/list ID.
 */
async function handleNewChecklistSelect(selection) {
  showNewChecklistDialog.value = false;

  // Find the highest order among all checklists
  const maxOrder =
    checklists.value.length > 0 ? Math.max(...checklists.value.map((cl) => cl.order || 0)) : -1;

  if (
    (selection.source === 'template' && selection.templateId) ||
    (selection.source === 'recommended' && selection.recommendedListId)
  ) {
    const checklistId = generateSecureId('checklist-');
    let seedData = null;
    let sourceName = '';

    if (selection.source === 'template') {
      const selectedTemplate = templates.value.find(
        (template) => template.id === selection.templateId
      );
      if (!selectedTemplate) return;
      sourceName = selectedTemplate.name;
      seedData = applyTemplate(selection.templateId, checklistId);
    } else {
      const selectedRecommendedList = recommendedLists.value.find(
        (list) => list.id === selection.recommendedListId
      );
      if (!selectedRecommendedList) return;
      sourceName = selectedRecommendedList.name;
      try {
        seedData = recommendedListService.applyToNewChecklist(
          selection.recommendedListId,
          checklistId,
          locale.value
        );
      } catch {
        return;
      }
    }
    if (!seedData) return;

    const checklistWithId = {
      id: checklistId,
      name: buildSourceAwareChecklistName(selection.source, sourceName),
      order: maxOrder + 1,
    };
    const options = { source: selection.source, seedData };
    const newChecklist = await handleAsyncAction(createChecklist, checklistWithId, options);
    if (newChecklist) {
      newlyCreatedChecklistId.value = newChecklist.id;
    }
  } else if (selection.source === 'empty') {
    const newChecklistData = {
      name: buildSourceAwareChecklistName('empty'),
      order: maxOrder + 1,
    };
    const options = { source: 'empty' };
    const newChecklist = await handleAsyncAction(createChecklist, newChecklistData, options);
    if (newChecklist) {
      newlyCreatedChecklistId.value = newChecklist.id;
    }
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
 * Handle checklist edit from sidebar - select the checklist and mark for edit
 * @param {string} checklistId - The ID of the checklist to edit
 */
function handleChecklistEdit(checklistId) {
  // Select the checklist first
  selectedChecklistId.value = checklistId;
  // Mark it for editing
  newlyCreatedChecklistId.value = checklistId;
}

/**
 * Handle checklist copy from sidebar
 * @param {string} checklistId - The ID of the checklist to copy
 */
async function handleChecklistCopy(checklistId) {
  const result = await handleAsyncAction(duplicateChecklist, checklistId);
  if (result) {
    // Select the new checklist
    // Note: duplicateChecklist internally calls getChecklists() via await,
    // ensuring all data is loaded before this assignment executes
    selectedChecklistId.value = result.id;
  }
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

/**
 * Handle checklist drag-and-drop movement or reordering
 * @param {Array} reorderedChecklists - Array of checklists with updated order
 */
async function handleChecklistMove(reorderedChecklists) {
  // Update all checklists in a single transaction to avoid race conditions
  await handleAsyncAction(updateMultipleChecklists, reorderedChecklists);
}

// ---------- Template Handlers ----------

/**
 * Open the dialog to save a checklist as a personal template.
 * @param {string} checklistId - Checklist ID to snapshot
 */
function handleSaveAsTemplate(checklistId) {
  const checklist = checklists.value.find((item) => item.id === checklistId);
  templateChecklistId.value = checklistId;
  templateChecklistName.value = checklist?.name || '';
  showSaveTemplateDialog.value = true;
}

/**
 * Persist the named template snapshot and clear the dialog source state.
 * @param {string} templateName - User-supplied template name
 */
function handleTemplateSave(templateName) {
  if (templateChecklistId.value) {
    saveAsTemplate(templateChecklistId.value, templateName);
    templateChecklistId.value = null;
  }
  showSaveTemplateDialog.value = false;
}

/**
 * Open a template in its isolated, in-memory editor.
 * @param {string} templateId - Template ID to edit
 */
function handleTemplateEdit(templateId) {
  const template = templates.value.find((item) => item.id === templateId);
  if (!template) return;
  templateEditing.value = template;
}

/**
 * Save the isolated editor snapshot to the active template.
 * @param {object} template - Complete template snapshot from the editor
 */
function handleTemplateEditSave(template) {
  const updated = updateTemplate(template);
  if (updated) templateEditing.value = null;
}

/** Discard the in-memory template draft. */
function handleTemplateEditCancel() {
  templateEditing.value = null;
}

/**
 * Delete the active template from the editor after confirmation.
 * @param {string} templateId - Active template ID
 */
function handleTemplateEditDelete(templateId) {
  handleTemplateDelete(templateId);
}

/**
 * Delete a personal template after confirmation.
 * @param {string} templateId - Template ID to delete
 */
function handleTemplateDelete(templateId) {
  if (confirm(t('template.deleteConfirm'))) {
    const deleted = deleteTemplate(templateId);
    if (deleted && templateEditing.value?.id === templateId) templateEditing.value = null;
  }
}

// ------------------------------------------------------------------------------
// Lifecycle Hooks
// ------------------------------------------------------------------------------

// Initialize app and set up responsive behavior
onMounted(async () => {
  await initialize();
  loadTemplates();

  // Set up responsive behavior
  checkScreenSize();
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handlePackingHistoryKeydown);
});

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handlePackingHistoryKeydown);
  window.clearTimeout(packingUndoTimer);
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

watch(canUndoPackingChange, (canUndo) => {
  if (canUndo) return;
  showPackingUndo.value = false;
  window.clearTimeout(packingUndoTimer);
});
</script>

<style>
.backdrop {
  background-color: var(--overlay);
}
</style>
