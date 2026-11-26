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
    <Teleport to="body">
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
    </Teleport>

    <!-- Mobile Topbar -->
    <Topbar
      v-if="isMobileViewport"
      :title="templateEditing?.name || selectedChecklist?.name || 'Packing List'"
      :can-undo="canUndoPackingChange"
      :can-redo="canRedoPackingChange"
      :history-blocked="historyBlocked"
      :editing="activeEditors.size > 0"
      :hidden="mobileTopbarOffset >= mobileTopbarHeight"
      :offset="mobileTopbarOffset"
      @undo="handleUndoPackingChange"
      @redo="handleRedoPackingChange"
      @reveal="mobileTopbarOffset = 0"
      @toggle="toggleSidebar"
      @new="handleChecklistCreate"
    />

    <!-- Sidebar -->
    <!-- Overlay Sidebar (Mobile or Narrow + Expanded) -->
    <teleport to="body">
      <Transition
        name="mobile-drawer"
        :css="isMobileViewport"
        @before-leave="prepareSidebarLeave"
      >
        <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
        <div
          v-if="isOverlayVisible"
          ref="sidebarOverlay"
          class="fixed inset-y-0 left-0 z-50"
          :inert="isDialogVisible || showPackingCompletion || undefined"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('topbar.toggleNav')"
          tabindex="-1"
          data-testid="overlay-sidebar"
          @keydown="handleSidebarKeydown"
        >
          <Sidebar
            :is-expanded="isSidebarOpen"
            :is-mobile="isMobileViewport"
            :is-narrow="isSmallDesktop"
            :checklists="checklists"
            :templates="templates"
            :selected-checklist-id="templateEditing ? null : selectedChecklistId"
            :selected-template-id="templateEditing?.id || null"
            :can-undo="canUndoPackingChange"
            :can-redo="canRedoPackingChange"
            :history-blocked="historyBlocked"
            :editing="activeEditors.size > 0"
            @undo="handleUndoPackingChange"
            @redo="handleRedoPackingChange"
            @toggle-sidebar="toggleSidebar"
            @create-checklist="handleChecklistCreate"
            @select-checklist="handleChecklistSelect"
            @edit-checklist="handleChecklistEdit"
            @copy-checklist="handleChecklistCopy"
            @delete-checklist="handleChecklistDelete"
            @move:checklists="handleChecklistMove"
            @save-as-template="handleSaveAsTemplate"
            @edit-template="handleTemplateEdit"
            @delete-template="handleTemplateDelete"
          />
          <div
            v-if="
              !drawerFeedbackDismissed &&
              (visibleOperationError ||
                crossChecklistHistoryFeedback ||
                (historyBarrierVersion && historyBarrierVersion > dismissedHistoryBarrierVersion) ||
                historyResult)
            "
            class="absolute inset-x-2 bottom-4 rounded-lg bg-primary px-4 py-3 text-sm text-white shadow-lg"
            :class="
              !visibleOperationError && crossChecklistHistoryFeedback
                ? 'w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)]'
                : ''
            "
            :role="visibleOperationError ? 'alert' : 'status'"
            data-testid="sidebar-history-feedback"
          >
            <span
              :class="
                !visibleOperationError && crossChecklistHistoryFeedback ? 'block truncate' : ''
              "
            >
              {{
                visibleOperationError
                  ? $t(`storage.${visibleOperationError}`)
                  : crossChecklistHistoryFeedback ||
                    (historyBarrierVersion && historyBarrierVersion > dismissedHistoryBarrierVersion
                      ? $t('storage.historyClearedByChange')
                      : $t(
                          historyResult === 'undo'
                            ? 'history.undone'
                            : historyResult === 'redo'
                              ? 'history.redone'
                              : 'history.interrupted'
                        ))
              }}
            </span>
            <button
              v-if="
                visibleOperationError ||
                (!crossChecklistHistoryFeedback &&
                  historyBarrierVersion &&
                  historyBarrierVersion > dismissedHistoryBarrierVersion)
              "
              type="button"
              class="ml-2 font-semibold underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              @click="dismissDrawerHistoryFeedback"
            >
              {{ $t('storage.dismissHistoryNotice') }}
            </button>
          </div>
        </div>
      </Transition>
    </teleport>

    <!-- Inline Sidebar (Desktop only, when not in overlay mode) -->
    <div
      v-if="!isOverlayVisible && !isMobileViewport"
      class="relative z-50"
    >
      <Sidebar
        :is-expanded="isSidebarOpen"
        :is-mobile="isMobileViewport"
        :is-narrow="isSmallDesktop"
        :checklists="checklists"
        :templates="templates"
        :selected-checklist-id="templateEditing ? null : selectedChecklistId"
        :selected-template-id="templateEditing?.id || null"
        :can-undo="canUndoPackingChange"
        :can-redo="canRedoPackingChange"
        :history-blocked="historyBlocked"
        :editing="activeEditors.size > 0"
        @undo="handleUndoPackingChange"
        @redo="handleRedoPackingChange"
        @toggle-sidebar="toggleSidebar"
        @create-checklist="handleChecklistCreate"
        @select-checklist="handleChecklistSelect"
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
      ref="mainScrollport"
      :class="[
        'min-w-0 flex-1 bg-bg-secondary p-4 duration-200 md:p-6',
        !templateEditing && 'overflow-y-auto',
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
        v-if="templateNavigationMissing"
        class="mb-4 rounded-lg bg-white p-4 text-sm text-danger-text"
        role="alert"
        data-testid="template-navigation-missing"
      >
        {{ $t('template.destinationMissing') }}
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
        ref="templateEditorRef"
        :template="templateEditing"
        :saving="isSavingTemplateEdit"
        :save-error="templateEditSaveFailed"
        :error-code="templateOperationError"
        @cancel="handleTemplateEditCancel"
        @delete="handleTemplateEditDelete"
        @save="handleTemplateEditSave"
        @composition-end="resumeTemplateNavigation"
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
          :edit-started="startInlineEdit"
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
    <Teleport to="body">
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
      <UnsavedTemplateDialog
        v-if="showUnsavedTemplateDialog"
        @stay="stayInTemplate"
        @discard="discardTemplateAndContinue"
        @save="saveTemplateAndContinue"
      />
    </Teleport>

    <Teleport to="body">
      <PackingCompletionOverlay
        v-if="showPackingCompletion && packingCompletion"
        :checklist-name="packingCompletion.checklistName"
        :end-date="packingCompletion.endDate"
        :start-date="packingCompletion.startDate"
        @close="handlePackingCompletionClose"
      />
    </Teleport>

    <Teleport to="body">
      <div
        v-if="
          historyBarrierVersion &&
          historyBarrierVersion > dismissedHistoryBarrierVersion &&
          !crossChecklistHistoryFeedback &&
          !showPackingCompletion &&
          !isDialogVisible &&
          !isOverlayVisible
        "
        class="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded-lg bg-primary px-4 py-3 text-white shadow-lg"
        role="status"
        data-testid="history-barrier-feedback"
      >
        <span class="min-w-0 break-words">{{ $t('storage.historyClearedByChange') }}</span>
        <button
          type="button"
          class="shrink-0 font-semibold text-white underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          @click="dismissedHistoryBarrierVersion = historyBarrierVersion"
        >
          {{ $t('storage.dismissHistoryNotice') }}
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="
          crossChecklistHistoryFeedback &&
          !showPackingCompletion &&
          !isDialogVisible &&
          !isOverlayVisible
        "
        class="fixed bottom-4 left-1/2 z-[60] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded-lg bg-primary px-4 py-3 text-white shadow-lg"
        role="status"
        data-testid="cross-checklist-history-feedback"
      >
        <span class="min-w-0 truncate">{{ crossChecklistHistoryFeedback }}</span>
      </div>
    </Teleport>

    <div
      v-if="
        historyResult &&
        !crossChecklistHistoryFeedback &&
        !showPackingCompletion &&
        !isDialogVisible &&
        !isOverlayVisible
      "
      class="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-primary px-4 py-3 text-sm text-white shadow-lg"
      role="status"
      data-testid="history-result"
    >
      {{
        $t(
          historyResult === 'undo'
            ? 'history.undone'
            : historyResult === 'redo'
              ? 'history.redone'
              : 'history.interrupted'
        )
      }}
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
import UnsavedTemplateDialog from './components/UnsavedTemplateDialog.vue';
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
  getPackingBatchEventVersion,
  canUndoPackingChange,
  canRedoPackingChange,
  historyBusy,
  historyBarrierVersion,
  historyEventVersion,
  lastPackingHistoryAction,
  invalidateHistoryForUnsupportedChange,
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
} = useTemplates(() => invalidateHistoryForUnsupportedChange());
const recommendedListService = new RecommendedListService();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// UI state
const dismissedHistoryBarrierVersion = ref(0);
const crossChecklistHistoryAction = ref<{
  checklistId: string;
  direction: 'undo' | 'redo';
  eventVersion: number;
} | null>(null);
const crossChecklistHistoryFeedback = computed(() => {
  const action = crossChecklistHistoryAction.value;
  if (!action) return '';
  const name = checklists.value.find((checklist) => checklist.id === action.checklistId)?.name;
  if (!name) {
    return t(
      action.direction === 'undo'
        ? 'storage.undoOtherChecklistUnknown'
        : 'storage.redoOtherChecklistUnknown'
    );
  }
  return t(
    action.direction === 'undo' ? 'storage.undoOtherChecklist' : 'storage.redoOtherChecklist',
    { name }
  );
});
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
const failedInlineDrafts = new Map<string, symbol>();
const activeEditors = ref(new Set<string>());
const mobileTopbarOffset = ref(0);
const mobileTopbarHeight = ref(1);
const drawerFeedbackDismissed = ref(false);
const mainScrollport = ref<HTMLElement | null>(null);
let lastDocumentScroll = 0;
let lastMainScroll = 0;
let wasShortMobileViewport = false;
const displacedDrafts = ref<(RetainedDraft & { id: number })[]>([]);
let nextDisplacedDraftId = 0;
const exportFailure = ref<string | null>(null);
const mainHeading = ref<HTMLElement | null>(null);
const templateEditing = ref<TemplateView | null>(null);
const templateEditorRef = ref<InstanceType<typeof TemplateEditor> | null>(null);
const showUnsavedTemplateDialog = ref(false);
type TemplateNavigation = { run: () => void; isAvailable: () => boolean };
let pendingTemplateNavigation: TemplateNavigation | null = null;
let composingTemplateNavigation: TemplateNavigation | null = null;
const templateNavigationMissing = ref(false);
let resolvingTemplateNavigation = false;
const isSavingTemplateEdit = ref(false);
const templateEditSaveFailed = ref(false);
const templateDraftAtRisk = ref(false);
const historyResult = ref<'undo' | 'redo' | 'interrupted' | null>(null);
let historyResultTimer: number | undefined;
const showPackingCompletion = ref(false);
const packingCompletion = ref<ReturnType<typeof getPackingCompletionSnapshot> | null>(null);
const appShell = ref<HTMLElement | null>(null);
const sidebarOverlay = ref<HTMLElement | null>(null);
let sidebarTrigger: HTMLElement | null = null;
let previousBodyOverflow: string | null = null;
let previousBodyPaddingRight: string | null = null;
let previousViewportWidth: number | null = null;
let packingCompletionTrigger: HTMLElement | null = null;

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
const isDialogVisible = computed(
  () =>
    showNewChecklistDialog.value || showSaveTemplateDialog.value || showUnsavedTemplateDialog.value
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
  inlineSaveFailed.value = false;
}

/** Track edit mode before blur can submit a draft. */
function startInlineEdit(kind: EditKind, id: string) {
  activeEditors.value.add(`${kind}:${id}`);
  mobileTopbarOffset.value = 0;
}

/** Clear the suppression for an inline editor that was cancelled or removed.
 * @param {string} kind - Type of edited entity.
 * @param {string} id - ID of the edited entity.
 */
function clearInlineFailure(kind: EditKind, id: string) {
  activeEditors.value.delete(`${kind}:${id}`);
  finishInlineSave(kind, id);
}

/** Release a completed save while retaining edit-mode protection until the editor closes. */
function finishInlineSave(kind: EditKind, id: string) {
  failedInlineDrafts.delete(`${kind}:${id}`);
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

// Track in-flight actions so a shortcut cannot jump ahead of the action it follows.
const pendingActions = new Set<Promise<boolean>>();
let actionStartVersion = 0;
let shortcutTail: Promise<void> = Promise.resolve();

// Generic error handler for async operations
const handleAsyncAction = async <Args extends unknown[], Result>(
  action: (...args: Args) => Result,
  ...args: Args
): Promise<Awaited<Result>> => {
  inlineSaveFailed.value = false;
  templateEditSaveFailed.value = false;
  actionStartVersion += 1;
  const result = action(...args);
  const settled = Promise.resolve(result).then(
    (value) => value !== null && value !== false,
    () => false
  );
  pendingActions.add(settled);
  void settled.then(() => pendingActions.delete(settled));
  return await result;
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
  return true;
}

/** Close the completion overlay and return focus to the triggering control when possible. */
async function handlePackingCompletionClose() {
  showPackingCompletion.value = false;
  await nextTick();
  packingCompletionTrigger?.focus();
  packingCompletionTrigger = null;
  packingCompletion.value = null;
}

/**
 * Check if screen is mobile size and adjust UI accordingly
 */
function checkScreenSize() {
  if (previousViewportWidth === window.innerWidth) return;
  const previousBucket =
    previousViewportWidth === null
      ? null
      : previousViewportWidth < BREAKPOINTS.MOBILE
        ? 'mobile'
        : previousViewportWidth < BREAKPOINTS.SIDEBAR_OVERLAY
          ? 'narrow'
          : 'desktop';
  previousViewportWidth = window.innerWidth;
  isMobileViewport.value = window.innerWidth < BREAKPOINTS.MOBILE;
  isSmallDesktop.value = window.innerWidth < BREAKPOINTS.SIDEBAR_OVERLAY;
  const bucket = isMobileViewport.value ? 'mobile' : isSmallDesktop.value ? 'narrow' : 'desktop';
  if (previousBucket === bucket) return;

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
  const widthChanged = previousViewportWidth !== window.innerWidth;
  const isShortViewport = window.innerHeight <= 250;
  const shortViewportChanged = isShortViewport !== wasShortMobileViewport;
  wasShortMobileViewport = isShortViewport;
  checkScreenSize();
  if (widthChanged || shortViewportChanged) {
    mobileTopbarOffset.value = 0;
    lastDocumentScroll = Math.max(0, window.scrollY);
    lastMainScroll = Math.max(0, mainScrollport.value?.scrollTop ?? 0);
  }
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

/** Keep keyboard navigation inside the active drawer, below any dialog. */
function handleSidebarKeydown(event: KeyboardEvent) {
  if (isDialogVisible.value || showPackingCompletion.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    isSidebarOpen.value = false;
  } else if (event.key === 'Tab') {
    const controls = Array.from(
      sidebarOverlay.value?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]'
      ) ?? []
    ).filter((element) => element.getClientRects().length && !element.closest('[inert]'));
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) {
      event.preventDefault();
      sidebarOverlay.value?.focus();
    } else if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === sidebarOverlay.value)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
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
  const draftOwner = `item:${item.id}`;
  const draftToken = expected ? Symbol(draftOwner) : null;
  if (draftToken) failedInlineDrafts.set(draftOwner, draftToken);
  const updatedItem = await handleAsyncAction(updateItem, item, expected);
  if (expected && !updatedItem && failedInlineDrafts.get(draftOwner) === draftToken) {
    inlineSaveFailed.value = true;
    inlineFailureVersion = checklistOperationErrorVersion?.value ?? null;
    inlineFailureOwner = `item:${item.id}`;
  }
  if (updatedItem) {
    if (expected && failedInlineDrafts.get(draftOwner) === draftToken)
      finishInlineSave('item', item.id);
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
async function handleItemMove(
  moveData: ItemMove,
  settled?: (succeeded: boolean, awaitingRefresh?: boolean) => void
) {
  let succeeded = false;
  let awaitingRefresh = false;
  try {
    if (!['move', 'reorder'].includes(moveData.type) || !moveData.items?.length) return;
    const result = await handleAsyncAction(updateMultipleItems, moveData.items, {
      fields: ['order', 'categoryId'],
      expectedItems: moveData.expectedItems,
    });
    if (!result) await getItems?.();
    succeeded = !!result;
    awaitingRefresh = !!result && !!checklistRefreshAfterSaveFailed?.value;
  } finally {
    settled?.(succeeded, awaitingRefresh);
  }
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
  const draftOwner = `category:${category.id}`;
  const draftToken = expected ? Symbol(draftOwner) : null;
  if (draftToken) failedInlineDrafts.set(draftOwner, draftToken);
  const updatedCategory = await handleAsyncAction(updateCategory, category, expected);
  if (expected && !updatedCategory && failedInlineDrafts.get(draftOwner) === draftToken) {
    inlineSaveFailed.value = true;
    inlineFailureVersion = checklistOperationErrorVersion?.value ?? null;
    inlineFailureOwner = `category:${category.id}`;
  }

  if (updatedCategory && expected && failedInlineDrafts.get(draftOwner) === draftToken) {
    finishInlineSave('category', category.id);
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
 * Pack or unpack all items in a category as one history action.
 * @param {object} change - Category packing intent
 * @param {string} change.categoryId - Category ID
 * @param {boolean} change.isPacked - Target packed state
 */
async function handleCategoryPacked({ categoryId, isPacked }: CategoryPackedChange) {
  const checklistId = selectedChecklistId.value;
  const before = getPackingCompletionSnapshot();
  const updatedItems = await handleAsyncAction(setCategoryPacked, categoryId, isPacked);
  if (
    !updatedItems?.length ||
    selectedChecklistId.value !== checklistId ||
    getPackingBatchEventVersion(updatedItems) !== historyEventVersion.value
  ) {
    return;
  }

  showPackingCompletionForTransition(before);
}

/** Announce a history action affecting another checklist. */
function showCrossChecklistHistoryFeedback() {
  const action = lastPackingHistoryAction?.value;
  if (action && action.eventVersion !== (historyEventVersion?.value ?? 0)) return;
  if (action && action.checklistId !== selectedChecklistId.value) {
    dismissedHistoryBarrierVersion.value = historyBarrierVersion?.value ?? 0;
  }
  crossChecklistHistoryAction.value =
    action && action.checklistId !== selectedChecklistId.value ? action : null;
}

/** Announce a successful history action without moving focus. */
function announceHistoryResult(direction: 'undo' | 'redo' | 'interrupted') {
  dismissedHistoryBarrierVersion.value = historyBarrierVersion?.value ?? 0;
  historyResult.value = direction;
  window.clearTimeout(historyResultTimer);
  historyResultTimer = window.setTimeout(() => {
    historyResult.value = null;
    crossChecklistHistoryAction.value = null;
  }, 2500);
}

/** Undo the most recent category-wide packing status change. */
async function performUndoPackingChange() {
  if (!(await undoPackingChange(isHistoryActionAllowed))) return;
  const action = lastPackingHistoryAction?.value;
  if (!action || action.eventVersion !== (historyEventVersion?.value ?? 0)) return;
  showCrossChecklistHistoryFeedback();
  announceHistoryResult('undo');
}

/**
 * Redo the most recent category-wide packing change and celebrate if it completes the list.
 */
async function performRedoPackingChange() {
  const before = getPackingCompletionSnapshot();
  if (await redoPackingChange(isHistoryActionAllowed)) {
    const action = lastPackingHistoryAction?.value;
    if (!action || action.eventVersion !== (historyEventVersion?.value ?? 0)) return;
    showCrossChecklistHistoryFeedback();
    announceHistoryResult('redo');
    const ownerId = action.checklistId;
    if (
      ownerId &&
      action.eventVersion === (historyEventVersion?.value ?? 0) &&
      ownerId === before.checklistId &&
      ownerId === selectedChecklistId.value
    ) {
      showPackingCompletionForTransition(before);
    }
  }
}

let ongoingHistory: Promise<void> | null = null;

/** Share the active history operation between buttons and queued shortcuts. */
function runHistoryAction(redo: boolean): Promise<void> {
  if (ongoingHistory) return ongoingHistory;
  const action = redo ? performRedoPackingChange() : performUndoPackingChange();
  ongoingHistory = action;
  void action.then(
    () => {
      if (ongoingHistory === action) ongoingHistory = null;
    },
    () => {
      if (ongoingHistory === action) ongoingHistory = null;
    }
  );
  return action;
}

/** Serialize toolbar and keyboard history after the mutations they follow. */
function queueHistoryAction(redo: boolean): Promise<void> {
  const pending = [...pendingActions];
  const actionVersion = actionStartVersion;
  const activeHistory = ongoingHistory;
  const barrierVersion = historyBarrierVersion?.value ?? 0;
  shortcutTail = shortcutTail.then(async () => {
    const completed = await Promise.all(pending);
    if (activeHistory) await activeHistory;
    if (
      completed.some((success) => !success) ||
      barrierVersion !== (historyBarrierVersion?.value ?? 0) ||
      !isHistoryActionAllowed()
    )
      return;
    if (actionVersion !== actionStartVersion) {
      announceHistoryResult('interrupted');
      return;
    }
    if (redo ? canRedoPackingChange.value : canUndoPackingChange.value) {
      await runHistoryAction(redo);
    }
  });
  return shortcutTail;
}

/** Run an undo action through the shared history operation. */
function handleUndoPackingChange() {
  return queueHistoryAction(false);
}
/** Run a redo action through the shared history operation. */
function handleRedoPackingChange() {
  return queueHistoryAction(true);
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
    (target instanceof HTMLInputElement &&
      ![
        'checkbox',
        'radio',
        'button',
        'submit',
        'reset',
        'range',
        'color',
        'file',
        'image',
        'hidden',
      ].includes(target.type)) ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

/** History may be waiting for the storage lock while an editor starts saving. */
function isHistoryActionAllowed() {
  return (
    !showPackingCompletion.value &&
    !isDialogVisible.value &&
    !templateEditing.value &&
    failedInlineDrafts.size === 0 &&
    activeEditors.value.size === 0
  );
}

const historyBlocked = computed(() => !isHistoryActionAllowed() || Boolean(historyBusy?.value));

/** Move the mobile bar by the same distance as the active scrollport. */
function handleMobileScroll(event: Event) {
  if (!isMobileViewport.value) return;
  if (window.innerHeight <= 250) {
    mobileTopbarOffset.value = 0;
    return;
  }
  const target = event.target;
  if (target !== document && target !== mainScrollport.value) return;
  const isDocument = target === document;
  const maxScroll = isDocument
    ? Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    : Math.max(
        0,
        (mainScrollport.value?.scrollHeight ?? 0) - (mainScrollport.value?.clientHeight ?? 0)
      );
  const position = Math.min(
    maxScroll,
    Math.max(0, isDocument ? window.scrollY : (mainScrollport.value?.scrollTop ?? 0))
  );
  const previous = isDocument ? lastDocumentScroll : lastMainScroll;
  if (isDocument) lastDocumentScroll = position;
  else lastMainScroll = position;
  const bar = document.querySelector<HTMLElement>('[data-testid="mobile-topbar"]');
  if (!bar) return;
  mobileTopbarHeight.value = bar.getBoundingClientRect().height || 1;
  const active = document.activeElement;
  const keepVisible =
    isOverlayVisible.value ||
    isDialogVisible.value ||
    showPackingCompletion.value ||
    activeEditors.value.size > 0 ||
    isEditableTarget(active) ||
    Boolean(active?.matches(':focus-visible') && active.closest('[data-testid="mobile-topbar"]')) ||
    Boolean(document.querySelector('.chosen-item, .chosen-category, .chosen-checklist'));
  if (position <= 0 || keepVisible) mobileTopbarOffset.value = 0;
  else
    mobileTopbarOffset.value = Math.min(
      mobileTopbarHeight.value,
      Math.max(0, mobileTopbarOffset.value + position - previous)
    );
}

/**
 * Handle global undo/redo shortcuts when no modal or template editor owns focus.
 * @param {KeyboardEvent} event - Window keydown event
 */
function handlePackingHistoryKeydown(event: KeyboardEvent) {
  if (
    !isHistoryActionAllowed() ||
    event.isComposing ||
    event.repeat ||
    event.altKey ||
    (!event.ctrlKey && !event.metaKey) ||
    !['z', 'y'].includes(event.key.toLowerCase()) ||
    (event.key.toLowerCase() === 'y' && (!event.ctrlKey || event.metaKey || event.shiftKey)) ||
    isEditableTarget(event.target)
  ) {
    return;
  }

  const redo = event.shiftKey || event.key.toLowerCase() === 'y';
  if (
    !(redo ? canRedoPackingChange.value : canUndoPackingChange.value) &&
    !pendingActions.size &&
    !historyBusy?.value
  )
    return;
  event.preventDefault();
  void queueHistoryAction(redo);
}

/**
 * Handle category drag-and-drop reordering
 * @param {Array<object>} reorderedCategories - Array of categories with updated order properties
 * @param {Array<object>} [expectedCategories] - Categories before the drag.
 */
async function handleCategoryReorder(
  reorderedCategories: CategoryDTO[],
  expectedCategories?: CategoryDTO[],
  settled?: (awaitingRefresh?: boolean) => void
) {
  let awaitingRefresh = false;
  try {
    const result = await handleAsyncAction(
      updateMultipleCategories,
      reorderedCategories,
      expectedCategories
    );
    if (!result) await getCategories?.();
    awaitingRefresh = !!result && !!checklistRefreshAfterSaveFailed?.value;
  } finally {
    settled?.(awaitingRefresh);
  }
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
  void requestTemplateNavigation(() => {
    checklistCreateFailed.value = false;
    showNewChecklistDialog.value = true;
  });
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
        if (isOverlayVisible.value) isSidebarOpen.value = false;
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
        if (isOverlayVisible.value) isSidebarOpen.value = false;
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
  const draftOwner = `checklist:${checklist.id}`;
  const draftToken = expected ? Symbol(draftOwner) : null;
  if (draftToken) failedInlineDrafts.set(draftOwner, draftToken);
  const result = await handleAsyncAction(updateChecklist, checklist, expected);
  if (expected && !result && failedInlineDrafts.get(draftOwner) === draftToken) {
    inlineSaveFailed.value = true;
    inlineFailureVersion = checklistOperationErrorVersion?.value ?? null;
    inlineFailureOwner = `checklist:${checklist.id}`;
  }
  if (result && expected && failedInlineDrafts.get(draftOwner) === draftToken) {
    finishInlineSave('checklist', checklist.id);
  }
  return result;
}

/**
 * Handle checklist edit from sidebar - select the checklist and mark for edit
 * @param {string} checklistId - The ID of the checklist to edit
 */
function handleChecklistEdit(checklistId: string) {
  void requestTemplateNavigation(
    () => {
      if (!checklists.value.some((checklist) => checklist.id === checklistId)) return;
      if (isOverlayVisible.value) isSidebarOpen.value = false;
      selectedChecklistId.value = checklistId;
      newlyCreatedChecklistId.value = checklistId;
    },
    () => checklists.value.some((checklist) => checklist.id === checklistId)
  );
}

/** Navigate to a checklist only after the template draft is resolved. */
function handleChecklistSelect(checklistId: string) {
  void requestTemplateNavigation(
    () => {
      if (!checklists.value.some((checklist) => checklist.id === checklistId)) return;
      selectedChecklistId.value = checklistId;
      if (isOverlayVisible.value) isSidebarOpen.value = false;
    },
    () => checklists.value.some((checklist) => checklist.id === checklistId)
  );
}

/**
 * Handle checklist copy from sidebar
 * @param {string} checklistId - The ID of the checklist to copy
 */
function handleChecklistCopy(checklistId: string) {
  void requestTemplateNavigation(
    () => {
      void copyChecklistAfterNavigation(checklistId);
    },
    () => checklists.value.some((checklist) => checklist.id === checklistId)
  );
}

/** Copy after any template draft has been resolved. */
async function copyChecklistAfterNavigation(checklistId: string) {
  const result = await handleAsyncAction(duplicateChecklist, checklistId);
  if (result && !checklistRefreshAfterSaveFailed?.value) {
    // Select the new checklist
    // Note: duplicateChecklist internally calls getChecklists() via await,
    // ensuring all data is loaded before this assignment executes
    selectedChecklistId.value = result.id;
  }
}

/**
 * Delete a checklist by ID; the change remains available in history.
 * @param {string} checklistId - The ID of the checklist to delete
 */
async function handleChecklistDelete(checklistId: string) {
  const active = document.activeElement;
  const wasInDrawer = Boolean(active && sidebarOverlay.value?.contains(active));
  await handleAsyncAction(deleteChecklist, checklistId);
  await nextTick();
  if (wasInDrawer && isOverlayVisible.value && document.activeElement === document.body) {
    sidebarOverlay.value?.querySelector<HTMLElement>('[data-testid="sidebar-toggle"]')?.focus();
  }
}

/**
 * Handle checklist drag-and-drop movement or reordering
 * @param {Array} reorderedChecklists - Array of checklists with updated order
 * @param {Array<object>} [expectedChecklists] - Checklists before the drag.
 */
async function handleChecklistMove(
  reorderedChecklists: ChecklistDTO[],
  expectedChecklists?: ChecklistDTO[],
  settled?: (succeeded: boolean, awaitingRefresh?: boolean) => void
) {
  let succeeded = false;
  let awaitingRefresh = false;
  try {
    // Update all checklists in a single transaction to avoid race conditions.
    const result = await handleAsyncAction(
      updateMultipleChecklists,
      reorderedChecklists,
      expectedChecklists
    );
    if (!result) await getChecklists?.();
    succeeded = !!result;
    awaitingRefresh = !!result && !!checklistRefreshAfterSaveFailed?.value;
  } finally {
    settled?.(succeeded, awaitingRefresh);
  }
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
  void requestTemplateNavigation(
    () => {
      const template = templates.value.find((item) => item.id === templateId);
      if (!template) return;
      if (isOverlayVisible.value) isSidebarOpen.value = false;
      templateEditSaveFailed.value = false;
      templateDraftAtRisk.value = false;
      templateEditing.value = template;
    },
    () => templates.value.some((item) => item.id === templateId)
  );
}

/** Delay navigation until the isolated draft has been explicitly resolved. */
async function requestTemplateNavigation(
  action: () => void,
  isAvailable: () => boolean = () => true
) {
  if (isSavingTemplateEdit.value || showUnsavedTemplateDialog.value || resolvingTemplateNavigation)
    return;
  templateNavigationMissing.value = false;
  const navigation: TemplateNavigation = { run: action, isAvailable };
  if (!templateEditing.value) {
    if (isAvailable()) action();
    else reportMissingTemplateDestination();
    return;
  }
  if (templateEditorRef.value?.isComposing()) {
    composingTemplateNavigation ??= navigation;
    return;
  }
  resolvingTemplateNavigation = true;
  try {
    await nextTick();
    if (templateEditorRef.value?.hasChanges() || templateDraftAtRisk.value) {
      pendingTemplateNavigation = navigation;
      showUnsavedTemplateDialog.value = true;
      return;
    }
    if (!isAvailable()) {
      reportMissingTemplateDestination();
      return;
    }
    templateEditing.value = null;
    action();
  } finally {
    resolvingTemplateNavigation = false;
  }
}

/** Retry the original navigation after the inline IME composition settles. */
function resumeTemplateNavigation() {
  const navigation = composingTemplateNavigation;
  composingTemplateNavigation = null;
  if (navigation) void requestTemplateNavigation(navigation.run, navigation.isAvailable);
}

/** Explain why a requested destination is no longer available. */
function reportMissingTemplateDestination() {
  templateNavigationMissing.value = true;
  if (isOverlayVisible.value) isSidebarOpen.value = false;
}

/** Keep editing the unchanged in-memory draft. */
function stayInTemplate() {
  pendingTemplateNavigation = null;
  showUnsavedTemplateDialog.value = false;
}

/** Discard the draft and continue to the originally requested destination. */
function discardTemplateAndContinue() {
  const navigation = pendingTemplateNavigation;
  pendingTemplateNavigation = null;
  showUnsavedTemplateDialog.value = false;
  if (navigation && !navigation.isAvailable()) {
    reportMissingTemplateDestination();
    return;
  }
  templateEditSaveFailed.value = false;
  templateDraftAtRisk.value = false;
  templateEditing.value = null;
  navigation?.run();
}

/** Save the draft before continuing to the originally requested destination. */
function saveTemplateAndContinue() {
  const snapshot = templateEditorRef.value?.getSnapshot();
  if (!snapshot) return;
  showUnsavedTemplateDialog.value = false;
  void handleTemplateEditSave(snapshot);
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
      const navigation = pendingTemplateNavigation;
      pendingTemplateNavigation = null;
      if (navigation && !navigation.isAvailable()) reportMissingTemplateDestination();
      else navigation?.run();
    } else {
      templateEditSaveFailed.value = true;
      templateDraftAtRisk.value = true;
      pendingTemplateNavigation = null;
      if (isOverlayVisible.value) isSidebarOpen.value = false;
    }
  } finally {
    isSavingTemplateEdit.value = false;
  }
}

/** Discard the in-memory template draft. */
function handleTemplateEditCancel() {
  void requestTemplateNavigation(() => {
    templateEditSaveFailed.value = false;
    templateDraftAtRisk.value = false;
  });
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
  wasShortMobileViewport = window.innerHeight <= 250;
  lastDocumentScroll = Math.max(0, window.scrollY);
  lastMainScroll = Math.max(0, mainScrollport.value?.scrollTop ?? 0);
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handlePackingHistoryKeydown);
  window.addEventListener('scroll', handleMobileScroll, true);
});

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handlePackingHistoryKeydown);
  window.removeEventListener('scroll', handleMobileScroll, true);
  window.clearTimeout(historyResultTimer);
  if (appShell.value) appShell.value.inert = false;
  restoreBodyScroll();
});

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

/** Remove a closing drawer from interaction while its visual transition finishes. */
function prepareSidebarLeave(element: Element) {
  const drawer = element as HTMLElement;
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');
}

/** Lock document scrolling while preserving the pre-lock layout width. */
function lockBodyScroll() {
  if (previousBodyOverflow !== null) return;

  previousBodyOverflow = document.body.style.overflow;
  previousBodyPaddingRight = document.body.style.paddingRight;
  const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight);

  document.body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
  }
}

/** Restore the inline body styles captured before the first active overlay. */
function restoreBodyScroll() {
  if (previousBodyOverflow === null) return;

  document.body.style.overflow = previousBodyOverflow;
  document.body.style.paddingRight = previousBodyPaddingRight ?? '';
  previousBodyOverflow = null;
  previousBodyPaddingRight = null;
}

// Keep shared overlay locking and scrollbar compensation active until the last surface closes.
watch([isOverlayVisible, isDialogVisible, showPackingCompletion], () => {
  const overlayActive =
    showPackingCompletion.value || isOverlayVisible.value || isDialogVisible.value;
  if (overlayActive) {
    lockBodyScroll();
  } else restoreBodyScroll();

  if (appShell.value) appShell.value.inert = overlayActive;
});

watch(isOverlayVisible, async (open) => {
  if (open) {
    sidebarTrigger =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : document.querySelector<HTMLElement>(
            isMobileViewport.value
              ? '[data-testid="topbar-toggle"]'
              : '[data-testid="sidebar-toggle"]'
          );
    await nextTick();
    if (!isOverlayVisible.value || isDialogVisible.value || showPackingCompletion.value) return;
    const first = sidebarOverlay.value?.querySelector<HTMLElement>('button:not([disabled])');
    (first ?? sidebarOverlay.value)?.focus({ preventScroll: true });
  } else {
    await nextTick();
    if (
      !isDialogVisible.value &&
      !showPackingCompletion.value &&
      sidebarTrigger?.isConnected &&
      (document.activeElement === document.body ||
        !document.activeElement?.isConnected ||
        document.activeElement?.closest('[data-testid="overlay-sidebar"][inert]'))
    ) {
      sidebarTrigger.focus({ preventScroll: true });
    }
  }
});

/** Keep drawer feedback dismissible without clearing the underlying storage error. */
function dismissDrawerHistoryFeedback() {
  sidebarOverlay.value?.querySelector<HTMLElement>('[data-testid="sidebar-toggle"]')?.focus();
  drawerFeedbackDismissed.value = true;
  crossChecklistHistoryAction.value = null;
  dismissedHistoryBarrierVersion.value = historyBarrierVersion?.value ?? 0;
}

watch(
  [
    visibleOperationError,
    checklistOperationErrorVersion,
    historyEventVersion,
    historyBarrierVersion,
  ],
  () => {
    drawerFeedbackDismissed.value = false;
  }
);

watch(
  () =>
    Boolean(
      visibleOperationError.value ||
        crossChecklistHistoryFeedback.value ||
        (historyBarrierVersion?.value &&
          historyBarrierVersion.value > dismissedHistoryBarrierVersion.value)
    ),
  (hasFeedback, hadFeedback) => {
    if (
      !hasFeedback &&
      hadFeedback &&
      document.activeElement?.closest('[data-testid="sidebar-history-feedback"]')
    ) {
      sidebarOverlay.value?.querySelector<HTMLElement>('[data-testid="sidebar-toggle"]')?.focus();
    }
  },
  { flush: 'sync' }
);

// A contextual packing action must never target a newer, unrelated history entry.
watch(
  [isOverlayVisible, isDialogVisible, showPackingCompletion],
  ([drawer, dialog, completion]) => {
    if (drawer || dialog || completion) mobileTopbarOffset.value = 0;
  }
);

watch(
  () => historyEventVersion?.value,
  (version, previous) => {
    if (version === previous) return;
    crossChecklistHistoryAction.value = null;
    historyResult.value = null;
    window.clearTimeout(historyResultTimer);
  },
  { flush: 'sync' }
);

watch(
  () => historyBarrierVersion?.value,
  (version, previous) => {
    if (!version || version === previous) return;
    historyResult.value = null;
    window.clearTimeout(historyResultTimer);
    crossChecklistHistoryAction.value = null;
  },
  { flush: 'sync' }
);
</script>

<style>
.mobile-drawer-enter-active,
.mobile-drawer-leave-active {
  transition: transform 300ms ease-in-out;
}

.mobile-drawer-enter-from,
.mobile-drawer-leave-to {
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-drawer-enter-active,
  .mobile-drawer-leave-active {
    transition: none;
  }
}

.backdrop {
  background-color: var(--overlay);
}
</style>
