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
  <div
    ref="appShell"
    :class="['min-h-screen text-primary', isMobileViewport ? 'flex flex-col' : 'flex']"
  >
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
      <div
        class="fixed inset-y-0 left-0 z-50"
        :inert="showPackingCompletion || undefined"
        data-testid="overlay-sidebar"
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
      <h1
        ref="mainHeading"
        class="sr-only"
        tabindex="-1"
      >
        {{ $t('storage.mainHeading') }}
      </h1>
      <section
        v-for="problem in storageProblems"
        :key="problem.domain"
        class="mb-4 rounded-lg border border-border-color-medium bg-white p-4"
        role="alert"
      >
        <h2 class="font-semibold text-primary">
          {{ $t(`storage.${problem.domain}`) }}
        </h2>
        <p class="mt-1 text-sm text-secondary">
          {{
            $t(
              `storage.${problem.code === 'corrupt' || problem.code === 'unsupported' ? problem.code : 'unavailable'}`
            )
          }}
        </p>
        <p
          v-if="exportFailure === problem.domain"
          class="mt-2 text-sm text-danger-text"
        >
          {{ $t('storage.exportFailed') }}
        </p>
        <div class="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-lg bg-theme-primary px-3 py-2 text-sm text-white"
            @click="retryStorage(problem.domain, $event)"
          >
            {{ $t('storage.retry') }}
          </button>
          <button
            v-if="problem.code === 'corrupt' || problem.code === 'unsupported'"
            type="button"
            class="rounded-lg px-3 py-2 text-sm text-primary underline"
            @click="exportStorage(problem.domain)"
          >
            {{ $t('storage.export') }}
          </button>
        </div>
      </section>
      <p
        v-if="visibleOperationError"
        class="mb-4 rounded-lg bg-white p-4 text-sm text-danger-text"
        role="alert"
      >
        {{ $t(`storage.${visibleOperationError}`) }}
      </p>
      <p
        v-if="checklistRefreshAfterSaveFailed || templateRefreshAfterSaveFailed"
        class="mb-4 rounded-lg bg-white p-4 text-sm text-primary"
        role="status"
      >
        {{ $t('storage.savedRefreshFailed') }}
      </p>
      <section
        v-for="draft in displacedDrafts"
        :key="draft.id"
        class="mb-4 rounded-lg border border-border-color-medium bg-white p-4"
        role="status"
      >
        <p>{{ $t('storage.displacedDraft') }}</p>
        <p class="mt-2 break-words font-semibold">{{ draft.name }}</p>
        <p
          v-if="draft.startDate || draft.endDate"
          class="text-sm text-secondary"
        >
          {{ draft.startDate }} – {{ draft.endDate }}
        </p>
        <button
          type="button"
          class="mt-2 underline"
          @click="dismissDraft(draft.id)"
        >
          {{ $t('storage.dismissDraft') }}
        </button>
      </section>
      <TemplateEditor
        v-if="templateEditing"
        :template="templateEditing"
        :saving="isSavingTemplateEdit"
        :save-error="templateEditSaveFailed"
        :error-code="templateOperationError"
        @cancel="handleTemplateEditCancel"
        @delete="handleTemplateEditDelete"
        @save="handleTemplateEditSave"
      />
      <div v-else-if="selectedChecklist">
        <ChecklistComponent
          :key="selectedChecklist.id"
          :checklist="selectedChecklist"
          :categories="categories"
          :items="items"
          :newly-created-item-id="newlyCreatedItemId"
          :newly-created-category-id="newlyCreatedCategoryId"
          :newly-created-checklist-id="newlyCreatedChecklistId"
          :save-checklist-edit="handleChecklistUpdate"
          :save-category-edit="handleCategoryUpdate"
          :save-item-edit="handleItemUpdate"
          :edit-error-code="checklistOperationError"
          :set-category-packed-action="handleCategoryPacked"
          :update-item-action="handleItemUpdate"
          :retain-draft="retainDisplacedDraft"
          :edit-cancelled="clearInlineFailure"
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
        v-else-if="!checklistStorageHealth"
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
      :saving="isCreatingChecklist"
      :save-error="checklistCreateFailed"
      :error-code="checklistOperationError"
      @close="showNewChecklistDialog = false"
      @select="handleNewChecklistSelect"
    />
    <SaveTemplateDialog
      :initial-name="templateChecklistName"
      :visible="showSaveTemplateDialog"
      :saving="isSavingTemplate"
      :save-error="templateSaveFailed"
      :error-code="templateOperationError"
      @close="showSaveTemplateDialog = false"
      @save="handleTemplateSave"
    />

    <Teleport to="body">
      <PackingCompletionOverlay
        v-if="showPackingCompletion && packingCompletion"
        :checklist-name="packingCompletion.checklistName"
        :end-date="packingCompletion.endDate"
        :start-date="packingCompletion.startDate"
        @close="handlePackingCompletionClose"
      />
    </Teleport>

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

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ChecklistComponent from './components/Checklist.vue';
import type {
  CategoryPackedChange,
  ChecklistSelection,
  EditKind,
  ItemMove,
  RetainedDraft,
  TemplateView,
} from './components/componentContracts';
import NewChecklistDialog from './components/NewChecklistDialog.vue';
import PackingCompletionOverlay from './components/PackingCompletionOverlay.vue';
import SaveTemplateDialog from './components/SaveTemplateDialog.vue';
import Sidebar from './components/Sidebar.vue';
import TemplateEditor from './components/TemplateEditor.vue';
import Topbar from './components/Topbar.vue';
import { usePackingLists } from './composables/usePackingLists';
import { useTemplates } from './composables/useTemplates';
import type { CategoryDTO, ChecklistDTO, ItemDTO, TemplateDTO } from './models/contracts';
import { RecommendedListService } from './services/recommendedListService';
import type { ChecklistSourceOptions, SeedData } from './services/storageTypes';
import { STORAGE_KEYS, VALIDATION } from './utils/constants';
import { generateSecureId } from './utils/helpers';

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
  storageHealth: checklistStorageHealth,
  operationError: checklistOperationError,
  operationErrorVersion: checklistOperationErrorVersion,
  clearOperationError: clearChecklistOperationError,
  refreshAfterSaveFailed: checklistRefreshAfterSaveFailed,
  createChecklist,
  getChecklists,
  updateChecklist,
  updateMultipleChecklists,
  deleteChecklist,
  duplicateChecklist,
  createCategory,
  getCategories,
  updateCategory,
  updateMultipleCategories,
  deleteCategory,
  duplicateCategory,
  createItem,
  getItems,
  updateItem,
  updateMultipleItems,
  deleteItem,
  duplicateItem,
  setCategoryPacked,
  canUndoPackingChange,
  canRedoPackingChange,
  undoPackingChange,
  redoPackingChange,
} = usePackingLists();

// Initialize templates composable
const {
  templates,
  loadTemplates,
  saveAsTemplate,
  deleteTemplate,
  updateTemplate,
  storageHealth: templateStorageHealth,
  operationError: templateOperationError,
  refreshAfterSaveFailed: templateRefreshAfterSaveFailed,
} = useTemplates();
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
const templateChecklistId = ref<string | null>(null);
const templateChecklistName = ref('');
const isSavingTemplate = ref(false);
const templateSaveFailed = ref(false);
const isCreatingChecklist = ref(false);
const checklistCreateFailed = ref(false);
const inlineSaveFailed = ref(false);
let inlineFailureVersion: number | null = null;
let inlineFailureOwner: string | null = null;
// A displaced editor cannot display an async failure; leave that error global.
let inlineDraftGeneration = 0;
const displacedDrafts = ref<(RetainedDraft & { id: number })[]>([]);
let nextDisplacedDraftId = 0;
const exportFailure = ref<string | null>(null);
const mainHeading = ref<HTMLElement | null>(null);
const templateEditing = ref<TemplateView | null>(null);
const isSavingTemplateEdit = ref(false);
const templateEditSaveFailed = ref(false);
const templateDraftAtRisk = ref(false);
const showPackingUndo = ref(false);
const showPackingCompletion = ref(false);
const packingCompletion = ref<ReturnType<typeof getPackingCompletionSnapshot> | null>(null);
const appShell = ref<HTMLElement | null>(null);
let packingUndoTimer: number | undefined;
let packingCompletionTrigger: HTMLElement | null = null;
let packingUndoPendingAfterCompletion = false;

// Newly created item tracking for auto-edit
const newlyCreatedItemId = ref<string | null>(null);
const newlyCreatedCategoryId = ref<string | null>(null);
const newlyCreatedChecklistId = ref<string | null>(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Determine if sidebar should show as overlay
const isOverlayVisible = computed(
  () =>
    (isMobileViewport.value || (isSmallDesktop.value && isSidebarOpen.value)) && isSidebarOpen.value
);
const recommendedLists = computed(() => recommendedListService.getRecommendedLists(locale.value));
const storageProblems = computed(() =>
  [
    { domain: 'checklists', code: checklistStorageHealth?.value },
    { domain: 'templates', code: templateStorageHealth?.value },
  ].filter((problem) => problem.code)
);
const visibleOperationError = computed(() => {
  if (
    showNewChecklistDialog.value ||
    showSaveTemplateDialog.value ||
    inlineSaveFailed.value ||
    templateEditSaveFailed.value
  )
    return null;
  const code = checklistOperationError?.value || templateOperationError?.value;
  return ['conflict', 'quota', 'lock-unavailable'].some((candidate) => candidate === code)
    ? code
    : code
      ? 'writeFailed'
      : null;
});

/** Preserve unsaved text when its editor is removed or selection changes.
 * @param {object} draft - Unsaved values from the disappearing editor.
 */
function retainDisplacedDraft(draft: RetainedDraft) {
  displacedDrafts.value.push({ ...draft, id: ++nextDisplacedDraftId });
  inlineDraftGeneration++;
  inlineSaveFailed.value = false;
}

/** Clear the suppression for an inline editor that was cancelled or removed.
 * @param {string} kind - Type of edited entity.
 * @param {string} id - ID of the edited entity.
 */
function clearInlineFailure(kind: EditKind, id: string) {
  if (inlineFailureOwner !== `${kind}:${id}`) return;
  inlineSaveFailed.value = false;
  if (inlineFailureVersion !== null) clearChecklistOperationError?.(inlineFailureVersion);
  inlineFailureVersion = null;
  inlineFailureOwner = null;
}

/** Dismiss a displayed, locally retained draft.
 * @param {number} id - Draft identifier.
 */
function dismissDraft(id: number) {
  displacedDrafts.value = displacedDrafts.value.filter((draft) => draft.id !== id);
}

/** Retry decoding one storage domain without modifying its data.
 * @param {string} domain - Domain to read again.
 * @param {Event} event - Event from the retry control.
 */
async function retryStorage(domain: string, event: Event) {
  const focusedRetry = document.activeElement === event.currentTarget;
  if (domain === 'checklists') await initialize();
  else loadTemplates();
  const remaining =
    domain === 'checklists' ? checklistStorageHealth?.value : templateStorageHealth?.value;
  if (!remaining && focusedRetry) {
    await nextTick();
    mainHeading.value?.focus();
  }
}

/** Offer the original stored bytes for download without changing storage.
 * @param {string} domain - Domain whose original data is exported.
 */
function exportStorage(domain: string) {
  exportFailure.value = null;
  try {
    const key = domain === 'checklists' ? STORAGE_KEYS.APP_DATA : STORAGE_KEYS.TEMPLATES;
    const raw = localStorage.getItem(key);
    if (raw === null) {
      exportFailure.value = domain;
      return;
    }
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${key}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    exportFailure.value = domain;
  }
}

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- General Helpers ----------

// Generic error handler for async operations
const handleAsyncAction = async <Args extends unknown[], Result>(
  action: (...args: Args) => Result,
  ...args: Args
): Promise<Awaited<Result>> => {
  inlineSaveFailed.value = false;
  templateEditSaveFailed.value = false;
  return await action(...args);
};

/**
 * Capture the active checklist's packing progress before or after a local action.
 * @returns {{checklistId: string|null, checklistName: string, startDate: string, endDate: string, total: number, completed: number}} Current packing progress.
 */
function getPackingCompletionSnapshot() {
  return {
    checklistId: selectedChecklistId.value,
    checklistName: selectedChecklist.value?.name || t('checklist.untitled'),
    endDate: selectedChecklist.value?.endDate || '',
    startDate: selectedChecklist.value?.startDate || '',
    total: items.value.length,
    completed: items.value.filter((item) => item.isPacked).length,
  };
}

/**
 * Return whether a non-empty snapshot represents a fully packed checklist.
 * @param {{total: number, completed: number}} snapshot - Packing progress snapshot.
 * @returns {boolean} `true` when every item in the snapshot is packed.
 */
function isPackingComplete(snapshot: { total: number; completed: number }) {
  return snapshot.total > 0 && snapshot.total === snapshot.completed;
}

/** Pause the current packing Undo notice until the completion overlay closes. */
function deferPackingUndoUntilCompletionClose() {
  showPackingUndo.value = false;
  window.clearTimeout(packingUndoTimer);
  packingUndoPendingAfterCompletion = true;
}

/**
 * Open the completion overlay only for a successful local incomplete-to-complete transition.
 * @param {{checklistId: string|null, total: number, completed: number}} before - Pre-action state.
 * @returns {boolean} Whether the overlay opened.
 */
function showPackingCompletionForTransition(before: {
  checklistId: string | null;
  total: number;
  completed: number;
}) {
  const after = getPackingCompletionSnapshot();
  if (
    !before.checklistId ||
    before.checklistId !== after.checklistId ||
    isPackingComplete(before) ||
    !isPackingComplete(after)
  ) {
    return false;
  }

  packingCompletionTrigger =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  packingCompletion.value = after;
  showPackingCompletion.value = true;
  if (showPackingUndo.value && canUndoPackingChange.value) {
    deferPackingUndoUntilCompletionClose();
  }
  return true;
}

/** Close the completion overlay and return focus to the triggering control when possible. */
async function handlePackingCompletionClose() {
  showPackingCompletion.value = false;
  await nextTick();
  packingCompletionTrigger?.focus();
  packingCompletionTrigger = null;
  packingCompletion.value = null;

  if (packingUndoPendingAfterCompletion && canUndoPackingChange.value) {
    packingUndoPendingAfterCompletion = false;
    showPackingUndoToast();
  }
}

/** Show the category packing recovery action for its complete five-second window. */
function showPackingUndoToast() {
  showPackingUndo.value = true;
  window.clearTimeout(packingUndoTimer);
  packingUndoTimer = window.setTimeout(() => {
    showPackingUndo.value = false;
  }, 5000);
}

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
    let manuallyCollapsed = false;
    try {
      manuallyCollapsed = Boolean(localStorage.getItem(SIDEBAR_COLLAPSED_KEY));
    } catch {
      // Keep the default layout when the preference cannot be read.
    }
    if (!manuallyCollapsed) {
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
    try {
      if (isSidebarOpen.value) {
        localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
      } else {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
      }
    } catch {
      // The current session still retains the selected sidebar state.
    }
  }
}

// ---------- Item Handlers ----------

/**
 * Create a new item in the specified category with default values
 * @param {string} categoryId - The ID of the category to add the item to
 */
async function handleItemCreate(categoryId: string) {
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
 * @param {object} [expected] - Item before editing.
 * @returns {Promise<object|null>} Committed item or null on failure.
 */
async function handleItemUpdate(item: ItemDTO, expected?: ItemDTO) {
  const before = getPackingCompletionSnapshot();
  const draftGeneration = inlineDraftGeneration;
  const updatedItem = await handleAsyncAction(updateItem, item, expected);
  if (expected && !updatedItem && draftGeneration === inlineDraftGeneration) {
    inlineSaveFailed.value = true;
    inlineFailureVersion = checklistOperationErrorVersion?.value ?? null;
    inlineFailureOwner = `item:${item.id}`;
  }
  if (updatedItem) {
    showPackingCompletionForTransition(before);
  }

  // Clear the newly created flag if this was the item being edited
  if (updatedItem && newlyCreatedItemId.value === item.id) {
    newlyCreatedItemId.value = null;
  }
  return updatedItem;
}

/**
 * Handle item copy
 * @param {string} itemId - The ID of the item to copy
 */
async function handleItemCopy(itemId: string) {
  await handleAsyncAction(duplicateItem, itemId);
}

/**
 * Delete an item by ID
 * @param {string} itemId - The ID of the item to delete
 */
async function handleItemDelete(itemId: string) {
  await handleAsyncAction(deleteItem, itemId);
}

/**
 * Handle item drag-and-drop movement or reordering within categories
 * @param {object} moveData - Move data containing item, category IDs, and reordered items
 */
async function handleItemMove(moveData: ItemMove) {
  if (!['move', 'reorder'].includes(moveData.type) || !moveData.items?.length) return;
  const result = await handleAsyncAction(updateMultipleItems, moveData.items, {
    fields: ['order', 'categoryId'],
    expectedItems: moveData.expectedItems,
  });
  if (!result) await getItems?.();
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
 * @param {object} [expected] - Category before editing.
 * @returns {Promise<object|null>} Committed category or null on failure.
 */
async function handleCategoryUpdate(category: CategoryDTO, expected?: CategoryDTO) {
  const draftGeneration = inlineDraftGeneration;
  const updatedCategory = await handleAsyncAction(updateCategory, category, expected);
  if (expected && !updatedCategory && draftGeneration === inlineDraftGeneration) {
    inlineSaveFailed.value = true;
    inlineFailureVersion = checklistOperationErrorVersion?.value ?? null;
    inlineFailureOwner = `category:${category.id}`;
  }

  // Clear the newly-created flag if this was the category being edited
  if (updatedCategory && newlyCreatedCategoryId.value === category.id) {
    newlyCreatedCategoryId.value = null;
  }
  return updatedCategory;
}

/**
 * Handle category copy
 * @param {string} categoryId - The ID of the category to copy
 */
async function handleCategoryCopy(categoryId: string) {
  await handleAsyncAction(duplicateCategory, categoryId);
}

/**
 * Delete a category by ID
 * @param {string} categoryId - The ID of the category to delete
 */
async function handleCategoryDelete(categoryId: string) {
  await handleAsyncAction(deleteCategory, categoryId);
}

/**
 * Pack or unpack all items in a category and offer a short-lived undo action.
 * @param {object} change - Category packing intent
 * @param {string} change.categoryId - Category ID
 * @param {boolean} change.isPacked - Target packed state
 */
async function handleCategoryPacked({ categoryId, isPacked }: CategoryPackedChange) {
  const checklistId = selectedChecklistId.value;
  const before = getPackingCompletionSnapshot();
  const updatedItems = await handleAsyncAction(setCategoryPacked, categoryId, isPacked);
  if (!updatedItems?.length || selectedChecklistId.value !== checklistId) {
    return;
  }

  const completionShown = showPackingCompletionForTransition(before);
  if (completionShown) {
    if (canUndoPackingChange.value) deferPackingUndoUntilCompletionClose();
    return;
  }

  if (!canUndoPackingChange.value) return;
  showPackingUndoToast();
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
 * Redo the most recent category-wide packing change and celebrate if it completes the list.
 */
async function handleRedoPackingChange() {
  const before = getPackingCompletionSnapshot();
  if (await redoPackingChange()) {
    showPackingCompletionForTransition(before);
  }
}

/**
 * Return whether a keyboard event originated in an editable control.
 * @param {EventTarget|null} target - Keyboard event target
 * @returns {boolean} Whether native text editing should retain the shortcut
 */
function isEditableTarget(target: EventTarget | null) {
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
function handlePackingHistoryKeydown(event: KeyboardEvent) {
  if (
    showPackingCompletion.value ||
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
    void handleRedoPackingChange();
  } else {
    if (!canUndoPackingChange.value) return;
    event.preventDefault();
    void handleUndoPackingChange();
  }
}

/**
 * Handle category drag-and-drop reordering
 * @param {Array<object>} reorderedCategories - Array of categories with updated order properties
 * @param {Array<object>} [expectedCategories] - Categories before the drag.
 */
async function handleCategoryReorder(
  reorderedCategories: CategoryDTO[],
  expectedCategories?: CategoryDTO[]
) {
  const result = await handleAsyncAction(
    updateMultipleCategories,
    reorderedCategories,
    expectedCategories
  );
  if (!result) await getCategories?.();
}

// ---------- Checklist Handlers ----------

/**
 * Build a default checklist name that identifies how it was created.
 * Source names are truncated so the generated value still satisfies model limits.
 * @param {'empty'|'template'|'recommended'} source - Creation source
 * @param {string} [sourceName=''] - Localized template or recommended-list name
 * @returns {string} Source-aware checklist name
 */
function buildSourceAwareChecklistName(source: ChecklistSelection['source'], sourceName = '') {
  const key = `checklist.defaultNameFrom${source[0]!.toUpperCase()}${source.slice(1)}`;
  if (source === 'empty') return t(key);

  const wrapperLength = t(key, { name: '' }).length;
  const availableNameLength = Math.max(0, VALIDATION.NAME_MAX_LENGTH - wrapperLength);
  return t(key, { name: sourceName.slice(0, availableNameLength) });
}

/**
 * Open the new checklist dialog to let user choose source
 */
function handleChecklistCreate() {
  checklistCreateFailed.value = false;
  showNewChecklistDialog.value = true;
}

/**
 * Handle user's selection from the new checklist dialog
 * @param {object} selection - Selected source and optional template/list ID.
 */
async function handleNewChecklistSelect(selection: ChecklistSelection) {
  if (isCreatingChecklist.value) return;
  isCreatingChecklist.value = true;
  checklistCreateFailed.value = false;
  try {
    // Find the highest order among all checklists
    const maxOrder =
      checklists.value.length > 0 ? Math.max(...checklists.value.map((cl) => cl.order || 0)) : -1;

    if (
      (selection.source === 'template' && selection.templateId) ||
      (selection.source === 'recommended' && selection.recommendedListId)
    ) {
      const checklistId = generateSecureId('checklist-');
      let seedData: SeedData | null = null;
      let sourceName = '';
      let expectedTemplate: TemplateView | null = null;

      if (selection.source === 'template') {
        const selectedTemplate = templates.value.find(
          (template) => template.id === selection.templateId
        );
        if (!selectedTemplate) return;
        sourceName = selectedTemplate.name;
        expectedTemplate = selectedTemplate;
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
      if (selection.source === 'recommended' && !seedData) return;

      const checklistWithId = {
        id: checklistId,
        name: buildSourceAwareChecklistName(selection.source, sourceName),
        order: maxOrder + 1,
      };
      const options: ChecklistSourceOptions =
        selection.source === 'template'
          ? {
              source: 'template',
              templateId: selection.templateId,
              expectedTemplate: copyTemplateBaseline(expectedTemplate),
            }
          : { source: selection.source, seedData };
      const newChecklist = await handleAsyncAction(createChecklist, checklistWithId, options);
      if (newChecklist) {
        newlyCreatedChecklistId.value = newChecklist.id;
        showNewChecklistDialog.value = false;
      } else {
        checklistCreateFailed.value = true;
      }
    } else if (selection.source === 'empty') {
      const newChecklistData = {
        name: buildSourceAwareChecklistName('empty'),
        order: maxOrder + 1,
      };
      const options: ChecklistSourceOptions = { source: 'empty' };
      const newChecklist = await handleAsyncAction(createChecklist, newChecklistData, options);
      if (newChecklist) {
        newlyCreatedChecklistId.value = newChecklist.id;
        showNewChecklistDialog.value = false;
      } else {
        checklistCreateFailed.value = true;
      }
    }
  } finally {
    isCreatingChecklist.value = false;
  }
}

/**
 * Update an existing checklist with new data
 * @param {object} checklist - The checklist object with updated properties
 * @param {object} [expected] - Checklist before editing.
 * @returns {Promise<object|null>} Committed checklist or null on failure.
 */
async function handleChecklistUpdate(checklist: ChecklistDTO, expected?: ChecklistDTO) {
  const draftGeneration = inlineDraftGeneration;
  const result = await handleAsyncAction(updateChecklist, checklist, expected);
  if (expected && !result && draftGeneration === inlineDraftGeneration) {
    inlineSaveFailed.value = true;
    inlineFailureVersion = checklistOperationErrorVersion?.value ?? null;
    inlineFailureOwner = `checklist:${checklist.id}`;
  }
  return result;
}

/**
 * Handle checklist edit from sidebar - select the checklist and mark for edit
 * @param {string} checklistId - The ID of the checklist to edit
 */
function handleChecklistEdit(checklistId: string) {
  // Select the checklist first
  selectedChecklistId.value = checklistId;
  // Mark it for editing
  newlyCreatedChecklistId.value = checklistId;
}

/**
 * Handle checklist copy from sidebar
 * @param {string} checklistId - The ID of the checklist to copy
 */
async function handleChecklistCopy(checklistId: string) {
  const result = await handleAsyncAction(duplicateChecklist, checklistId);
  if (result && !checklistRefreshAfterSaveFailed?.value) {
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
async function handleChecklistDelete(checklistId: string) {
  const confirmed = confirm(t('checklist.deleteConfirm'));
  if (!confirmed) return;

  await handleAsyncAction(deleteChecklist, checklistId);
}

/**
 * Handle checklist drag-and-drop movement or reordering
 * @param {Array} reorderedChecklists - Array of checklists with updated order
 * @param {Array<object>} [expectedChecklists] - Checklists before the drag.
 */
async function handleChecklistMove(
  reorderedChecklists: ChecklistDTO[],
  expectedChecklists?: ChecklistDTO[]
) {
  // Update all checklists in a single transaction to avoid race conditions
  const result = await handleAsyncAction(
    updateMultipleChecklists,
    reorderedChecklists,
    expectedChecklists
  );
  if (!result) await getChecklists?.();
}

// ---------- Template Handlers ----------

/**
 * Open the dialog to save a checklist as a personal template.
 * @param {string} checklistId - Checklist ID to snapshot
 */
function handleSaveAsTemplate(checklistId: string) {
  const checklist = checklists.value.find((item) => item.id === checklistId);
  templateChecklistId.value = checklistId;
  templateChecklistName.value = checklist?.name || '';
  templateSaveFailed.value = false;
  showSaveTemplateDialog.value = true;
}

/**
 * Persist the named template snapshot and clear the dialog source state.
 * @param {string} templateName - User-supplied template name
 */
async function handleTemplateSave(templateName: string) {
  if (isSavingTemplate.value || !templateChecklistId.value) return;
  isSavingTemplate.value = true;
  templateSaveFailed.value = false;
  try {
    const saved = await saveAsTemplate(templateChecklistId.value, templateName);
    if (!saved) {
      templateSaveFailed.value = true;
      return;
    }
    templateChecklistId.value = null;
    showSaveTemplateDialog.value = false;
  } finally {
    isSavingTemplate.value = false;
  }
}

/**
 * Open a template in its isolated, in-memory editor.
 * @param {string} templateId - Template ID to edit
 */
function handleTemplateEdit(templateId: string) {
  if (isSavingTemplateEdit.value || templateEditing.value?.id === templateId) return;
  if (
    templateDraftAtRisk.value &&
    templateEditing.value?.id !== templateId &&
    !confirm(t('template.discardFailedDraftConfirm'))
  )
    return;
  const template = templates.value.find((item) => item.id === templateId);
  if (!template) return;
  templateEditSaveFailed.value = false;
  templateDraftAtRisk.value = false;
  templateEditing.value = template;
}

/** Copy readonly snapshots into the service's mutable DTO input contract. */
function copyTemplateBaseline(template: TemplateView | null): TemplateDTO | undefined {
  if (!template) return undefined;
  return {
    ...template,
    categories: template.categories.map((category) => ({ ...category })),
    items: template.items.map((item) => ({ ...item })),
  };
}

/**
 * Save the isolated editor snapshot to the active template.
 * @param {object} template - Complete template snapshot from the editor
 */
async function handleTemplateEditSave(template: TemplateDTO) {
  if (isSavingTemplateEdit.value) return;
  isSavingTemplateEdit.value = true;
  templateEditSaveFailed.value = false;
  try {
    const updated = await updateTemplate(template, copyTemplateBaseline(templateEditing.value));
    if (updated) {
      templateDraftAtRisk.value = false;
      templateEditing.value = null;
    } else {
      templateEditSaveFailed.value = true;
      templateDraftAtRisk.value = true;
    }
  } finally {
    isSavingTemplateEdit.value = false;
  }
}

/** Discard the in-memory template draft. */
function handleTemplateEditCancel() {
  if (isSavingTemplateEdit.value) return;
  templateEditSaveFailed.value = false;
  templateDraftAtRisk.value = false;
  templateEditing.value = null;
}

/**
 * Delete the active template from the editor after confirmation.
 * @param {string} templateId - Active template ID
 */
async function handleTemplateEditDelete(templateId: string) {
  await handleTemplateDelete(templateId);
}

/**
 * Delete a personal template after confirmation.
 * @param {string} templateId - Template ID to delete
 */
async function handleTemplateDelete(templateId: string) {
  if (isSavingTemplateEdit.value) return;
  templateEditSaveFailed.value = false;
  if (confirm(t('template.deleteConfirm'))) {
    const deleted = await deleteTemplate(templateId);
    if (deleted && templateEditing.value?.id === templateId) {
      templateDraftAtRisk.value = false;
      templateEditing.value = null;
    }
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
  if (appShell.value) appShell.value.inert = false;
  document.body.style.overflow = '';
});

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

// Prevent layout shift caused by scrollbar/body resizing when overlay drawer is active
watch([isSidebarOpen, isMobileViewport, isSmallDesktop, showPackingCompletion], () => {
  const overlayActive =
    showPackingCompletion.value ||
    (isSidebarOpen.value &&
      (isMobileViewport.value || (isSmallDesktop.value && isSidebarOpen.value)));
  if (overlayActive) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  if (appShell.value) appShell.value.inert = showPackingCompletion.value;
});

watch(canUndoPackingChange, (canUndo) => {
  if (canUndo) return;
  packingUndoPendingAfterCompletion = false;
  showPackingUndo.value = false;
  window.clearTimeout(packingUndoTimer);
});
</script>

<style>
.backdrop {
  background-color: var(--overlay);
}
</style>
