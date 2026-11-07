<!--
================================================================================
File: source/components/Checklist.vue
Description: Checklist component - displays a checklist with categories and items
             for a specific trip.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div
    ref="checklistRoot"
    :class="{ 'touch-layout': touchControls }"
  >
    <!-- Checklist Header -->
    <div class="mb-2 px-2 pb-4 pt-2">
      <!-- Header content -->
      <div class="mb-3 flex items-start justify-between gap-4 md:items-center">
        <div class="flex min-w-0 grow flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <!-- Editable checklist name -->
          <div
            class="flex min-w-0 grow"
            @blur="handleEditBlur"
            @focusout="handleEditBlur"
          >
            <input
              v-if="isEditing"
              :id="`checklist-${checklist.id}-name`"
              ref="nameInput"
              v-model="editedName"
              :disabled="isSavingEdit"
              :name="`checklist-${checklist.id}-name`"
              :placeholder="$t('checklist.name')"
              :aria-label="$t('checklist.name')"
              data-testid="checklist-name-input"
              class="w-full bg-transparent p-1 text-3xl font-bold text-primary focus:outline-none"
              style="box-shadow: inset 0 -2px 0 0 var(--interactive-focus)"
              @keydown.enter="handleEnterKey"
              @keyup.escape="cancelEdit"
              @compositionstart="handleCompositionStart"
              @compositionend="handleCompositionEnd"
            />
            <h2
              v-else
              class="cursor-pointer break-words rounded p-1 text-3xl font-bold text-primary hover:bg-interactive-hover-light focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-2"
              role="button"
              tabindex="0"
              data-testid="checklist-name"
              @click="startEdit"
              @keydown.enter.prevent="startEdit"
              @keydown.space.prevent="startEdit"
            >
              {{ checklist.name || $t('checklist.untitled') }}
            </h2>
          </div>

          <!-- Editable dates -->
          <div
            v-if="showDates"
            class="flex min-h-12 shrink-0 items-center gap-2"
            @blur="handleEditBlur"
            @focusout="handleEditBlur"
          >
            <div
              v-if="isEditing"
              class="flex flex-wrap items-center gap-1 md:flex-nowrap md:gap-2"
            >
              <input
                :id="`checklist-${checklist.id}-start-date`"
                ref="startDateInput"
                v-model="editedStartDate"
                :disabled="isSavingEdit"
                :name="`checklist-${checklist.id}-start-date`"
                type="date"
                :aria-label="$t('checklist.startDate')"
                class="w-28 rounded border border-border-color-medium bg-transparent p-1 text-base text-secondary focus:border-interactive-focus focus:outline-none sm:w-auto sm:px-2"
                @keydown.enter="handleEnterKey"
                @keyup.escape="cancelEdit"
              />
              <span class="hidden text-secondary md:inline">-</span>
              <input
                :id="`checklist-${checklist.id}-end-date`"
                ref="endDateInput"
                v-model="editedEndDate"
                :disabled="isSavingEdit"
                :name="`checklist-${checklist.id}-end-date`"
                type="date"
                :min="editedStartDate as string"
                :aria-label="$t('checklist.endDate')"
                class="w-28 rounded border border-border-color-medium bg-transparent p-1 text-base text-secondary focus:border-interactive-focus focus:outline-none sm:w-auto sm:px-2"
                @keydown.enter="handleEnterKey"
                @keyup.escape="cancelEdit"
              />
            </div>
            <span
              v-else
              class="cursor-pointer whitespace-nowrap rounded py-1 pl-1 pr-2 text-lg text-secondary hover:bg-interactive-hover-light focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-2 md:px-2 md:text-base"
              role="button"
              tabindex="0"
              @click="startEdit"
              @keydown.enter.prevent="startEdit"
              @keydown.space.prevent="startEdit"
            >
              {{ formatDateRange(checklist.startDate, checklist.endDate) }}
            </span>
          </div>
        </div>

        <!-- Checklist actions -->
        <div
          v-if="showItemFilter || showOverflowMenu"
          class="flex shrink-0 items-center gap-1 md:gap-2"
        >
          <button
            v-if="showItemFilter && !isEditing"
            type="button"
            data-testid="unpacked-items-filter-toggle"
            :class="[
              'touch-target inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-1 md:size-8',
              showUnpackedOnly
                ? 'bg-theme-secondary text-theme-primary'
                : touchControls
                  ? 'text-secondary'
                  : 'text-secondary hover:bg-control-hover hover:text-primary',
            ]"
            :title="$t('checklist.showUnpackedOnly')"
            :aria-label="$t('checklist.showUnpackedOnly')"
            :aria-pressed="showUnpackedOnly"
            @click="showUnpackedOnly = !showUnpackedOnly"
          >
            <AppIcon
              class="shrink-0"
              name="filter"
              size="control"
            />
          </button>

          <!-- Overflow menu -->
          <div
            v-if="showOverflowMenu"
            class="shrink-0"
          >
            <OverflowMenu
              :item-id="checklist.id"
              :force-visible="true"
              :use-group-hover="false"
              menu-type="checklist"
              alignment="left"
              trigger-icon-size="navigation"
              trigger-frame-size="spacious"
              transparent-trigger
              @edit="startEdit"
              @copy="$emit('copy:checklist', checklist.id)"
              @delete="handleDelete"
              @save-as-template="$emit('save-as-template', checklist.id)"
            />
          </div>
        </div>
      </div>

      <p
        v-if="editSaveFailed"
        class="text-sm text-danger-text"
        role="alert"
      >
        {{
          $t(
            editErrorCode === 'conflict' ||
              editErrorCode === 'quota' ||
              editErrorCode === 'lock-unavailable'
              ? `storage.${editErrorCode}`
              : 'common.saveFailed'
          )
        }}
      </p>

      <!-- Progress bar -->
      <ProgressBar
        class="px-1"
        :total="items.length"
        :completed="items.filter((item) => item.isPacked).length"
      />
    </div>

    <!-- Pending Items (Virtual Category for to-buy items) -->
    <div
      v-if="pendingItemsForDisplay.length > 0"
      class="category-item mb-3"
    >
      <PendingItemsCategory
        :items="pendingItemsForDisplay"
        :touch-controls="touchControls"
        @update:item="$emit('update:item', $event)"
      />
    </div>

    <!-- Categories Grid -->
    <div>
      <draggable
        ref="categoryDraggable"
        v-model="draggableCategories"
        item-key="id"
        :delay="200"
        filter="button, input, label, a, [contenteditable], [data-testid=category-items-draggable]"
        :prevent-on-filter="false"
        :delay-on-touch-only="true"
        :fallback-on-body="true"
        :group="{
          name: 'categories',
          pull: true,
          put: putOnlyFromGroup('categories'),
        }"
        :animation="animationDuration"
        easing="cubic-bezier(0.2, 0, 0, 1)"
        :ghost-class="'ghost-category'"
        :chosen-class="'chosen-category'"
        :drag-class="'drag-category'"
        :class="['categories-masonry', isDraggingCategory ? 'dragging' : '']"
        @start="onCategoryDragStart"
        @end="onCategoryDragEnd"
        @update="onCategoryUpdate"
      >
        <template #item="{ element: category }">
          <div class="category-item">
            <Category
              :key="category.id"
              :data-category-id="category.id"
              :category="category"
              :touch-controls="touchControls"
              :open-item-actions-id="openItemActionsId"
              :items="items"
              :display-items="projectedItems"
              :drag-baseline-items="dragBaselineItems"
              :drag-preview-reset="dragPreviewReset"
              :suppress-drag-hover="suppressDragHover"
              :show-unpacked-only="showUnpackedOnly"
              :newly-created-item-id="newlyCreatedItemId"
              :newly-created-category-id="newlyCreatedCategoryId"
              :save-category-edit="saveCategoryEdit"
              :save-item-edit="saveItemEdit"
              :commit-edit-on-blur="commitEditOnBlur"
              :edit-error-code="editErrorCode"
              :set-category-packed-action="setCategoryPackedAction"
              :wait-for-category-moves="waitForCategoryMoves"
              :update-item-action="updateItemAction"
              :retain-draft="retainDraft"
              :edit-cancelled="editCancelled"
              @toggle-item-actions="toggleItemActions"
              @close-item-actions="openItemActionsId = null"
              @collapse:category="closeCategoryActions"
              @update:item="(...args) => $emit('update:item', ...args)"
              @copy:item="$emit('copy:item', $event)"
              @delete:item="$emit('delete:item', $event)"
              @create:item="$emit('create:item', $event)"
              @update:category="(...args) => $emit('update:category', ...args)"
              @copy:category="$emit('copy:category', $event)"
              @delete:category="$emit('delete:category', $event)"
              @set-category-packed="$emit('set-category-packed', $event)"
              @move:item="handleItemMove"
              @drag:item-start="onItemDragStart"
              @drag:item-end="onItemDragEnd"
            />
          </div>
        </template>
      </draggable>

      <div class="category-item">
        <AddCategoryButton @click="$emit('create:category')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import type { PropType } from 'vue';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';

import { useMasonryMotion } from '../composables/useMasonryMotion';
import { useTouchLayout } from '../composables/useTouchLayout';
import type { CategoryDTO, ChecklistDTO, ItemDTO } from '../models/contracts';
import { isolateDragPreview, putOnlyFromGroup } from '../utils/dragDrop';
import { focusEditingInput } from '../utils/focusEditingInput';
import { renumberOrder } from '../utils/order';
import AddCategoryButton from './AddCategoryButton.vue';
import AppIcon from './AppIcon.vue';
import Category from './Category.vue';
import type {
  CategoryPackedChange,
  DragStart,
  EditCancelled,
  ItemMove,
  RetainDraft,
  SaveCategoryEdit,
  SaveChecklistEdit,
  SaveItemEdit,
  SetCategoryPackedAction,
  UpdateItemAction,
} from './componentContracts';
import OverflowMenu from './OverflowMenu.vue';
import PendingItemsCategory from './PendingItemsCategory.vue';
import ProgressBar from './ProgressBar.vue';
import { draggableFor, useDraggableControls } from './typedDraggable';

// ------------------------------------------------------------------------------
// Internationalization (i18n)
// ------------------------------------------------------------------------------

const { t } = useI18n();

const draggable = draggableFor<Readonly<CategoryDTO>>();
const categoryDraggable = useDraggableControls();
const { animationDuration } = useMasonryMotion(categoryDraggable, () => isDraggingCategory.value);

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props validation
const props = defineProps({
  commitEditOnBlur: { type: Boolean, default: false },
  retainDraft: { type: Function as PropType<RetainDraft | null>, default: null },
  editCancelled: { type: Function as PropType<EditCancelled | null>, default: null },
  saveChecklistEdit: { type: Function as PropType<SaveChecklistEdit | null>, default: null },
  saveCategoryEdit: { type: Function as PropType<SaveCategoryEdit | null>, default: null },
  saveItemEdit: { type: Function as PropType<SaveItemEdit | null>, default: null },
  editErrorCode: { type: String as PropType<string | null>, default: null },
  setCategoryPackedAction: {
    type: Function as PropType<SetCategoryPackedAction | null>,
    default: null,
  },
  updateItemAction: { type: Function as PropType<UpdateItemAction | null>, default: null },
  checklist: {
    type: Object as PropType<Readonly<ChecklistDTO>>,
    required: true,
    validator: (value: Record<string, unknown>) => {
      // Validate that the object has the required properties for a checklist
      return (
        value &&
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.startDate === 'string' &&
        typeof value.endDate === 'string' &&
        typeof value.order === 'number'
      );
    },
  },
  categories: {
    type: Array as PropType<readonly Readonly<CategoryDTO>[]>,
    required: true,
  },
  items: {
    type: Array as PropType<readonly Readonly<ItemDTO>[]>,
    required: true,
  },
  newlyCreatedItemId: {
    type: String as PropType<string | null>,
    default: null,
  },
  newlyCreatedCategoryId: {
    type: String as PropType<string | null>,
    default: null,
  },
  newlyCreatedChecklistId: {
    type: String as PropType<string | null>,
    default: null,
  },
  showDates: {
    type: Boolean,
    default: true,
  },
  showOverflowMenu: {
    type: Boolean,
    default: true,
  },
  showItemFilter: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits<{
  'update:checklist': [checklist: ChecklistDTO, expected?: ChecklistDTO];
  'copy:checklist': [id: string];
  'delete:checklist': [id: string];
  'update:item': [item: ItemDTO, expected?: ItemDTO];
  'copy:item': [id: string];
  'delete:item': [id: string];
  'create:item': [categoryId: string];
  'update:category': [category: CategoryDTO, expected?: CategoryDTO];
  'copy:category': [id: string];
  'delete:category': [id: string];
  'create:category': [];
  'reorder:categories': [
    categories: CategoryDTO[],
    expected: CategoryDTO[],
    settled?: (awaitingRefresh?: boolean) => void,
  ];
  'move:item': [move: ItemMove, settled?: (succeeded: boolean, awaitingRefresh?: boolean) => void];
  'save-as-template': [id: string];
  'set-category-packed': [change: CategoryPackedChange];
}>();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

const showUnpackedOnly = ref(false);
const { touchControls } = useTouchLayout();
const checklistRoot = ref<HTMLElement | null>(null);
const openItemActionsId = ref<string | null>(null);
const dragBaselineItems = ref<Readonly<ItemDTO>[] | null>(null);
const dragPreviewReset = ref(0);
const suppressDragHover = ref(false);
const pendingItemMoves = shallowRef<ItemMove[]>([]);
const awaitingItemRefresh = new Set<ItemMove>();
const itemMoveResults = new Map<ItemMove, Promise<boolean>>();
let isDraggingItem = false;
let restoreItemHover = () => {};

/** Clear the item preview after pending saves and active drags have finished. */
function resetItemPreviewWhenIdle() {
  if (pendingItemMoves.value.length || isDraggingItem) return;
  dragBaselineItems.value = null;
  dragPreviewReset.value += 1;
}

watch(
  () => props.items,
  () => {
    if (!awaitingItemRefresh.size) return;
    pendingItemMoves.value = pendingItemMoves.value.filter(
      (move) => !awaitingItemRefresh.has(move)
    );
    for (const move of awaitingItemRefresh) itemMoveResults.delete(move);
    awaitingItemRefresh.clear();
    void nextTick(resetItemPreviewWhenIdle);
  }
);

// Only ordering fields are projected; other fields continue to follow fresh data.
const projectedItems = computed(() =>
  props.items.map((item) => {
    const result = { ...item };
    for (const move of pendingItemMoves.value) {
      const update = move.items.find((entry) => entry.id === item.id);
      if (update) {
        result.categoryId = update.categoryId;
        result.order = update.order;
      }
    }
    return result;
  })
);

/** Wait for relevant moves before capturing a category-wide packing batch. */
async function waitForCategoryMoves(categoryId: string): Promise<boolean> {
  for (;;) {
    const relevant = pendingItemMoves.value.filter((move) =>
      move.items.some(
        (item) =>
          item.categoryId === categoryId ||
          move.expectedItems.find((previous) => previous.id === item.id)?.categoryId === categoryId
      )
    );
    if (!relevant.length) return true;
    const results = await Promise.all(
      relevant.map((move) => itemMoveResults.get(move) ?? Promise.resolve(false))
    );
    if (results.some((succeeded) => !succeeded)) return false;
  }
}

/** Capture the latest visible ordering before Sortable changes either list. */
function onItemDragStart() {
  isDraggingItem = true;
  restoreItemHover();
  suppressDragHover.value = !touchControls.value;
  dragBaselineItems.value = projectedItems.value.map((item) => ({ ...item }));
}

/** Keep the old mouse position from highlighting the next row after a drop. */
function onItemDragEnd(event: unknown) {
  isDraggingItem = false;
  void nextTick(resetItemPreviewWhenIdle);
  if (touchControls.value) return;
  const original = (event as { originalEvent?: MouseEvent }).originalEvent;
  const position = original ? { x: original.clientX, y: original.clientY } : null;
  const onMove = (move: MouseEvent) => {
    if (position && move.clientX === position.x && move.clientY === position.y) return;
    restoreItemHover();
    suppressDragHover.value = false;
  };
  window.addEventListener('mousemove', onMove, true);
  restoreItemHover = () => window.removeEventListener('mousemove', onMove, true);
}
onUnmounted(() => restoreItemHover());

/** Toggle the one active item across all categories. */
function toggleItemActions(id: string) {
  openItemActionsId.value = openItemActionsId.value === id ? null : id;
}

/** Close an item hidden by its category collapse control. */
function closeCategoryActions(categoryId: string) {
  if (
    props.items.some(
      (item) => item.id === openItemActionsId.value && item.categoryId === categoryId
    )
  ) {
    openItemActionsId.value = null;
  }
}

/** Capture a completed click without swallowing the user's outside action. */
function closeOutsideItem(event: MouseEvent) {
  if (!openItemActionsId.value) return;
  const inside = event
    .composedPath()
    .some(
      (node) =>
        node instanceof HTMLElement &&
        node.dataset.inlineItemId === openItemActionsId.value &&
        checklistRoot.value?.contains(node)
    );
  if (!inside) openItemActionsId.value = null;
}
onMounted(() => document.addEventListener('click', closeOutsideItem, true));
onUnmounted(() => document.removeEventListener('click', closeOutsideItem, true));
watch(
  () => props.checklist.id,
  () => {
    openItemActionsId.value = null;
  }
);
watch(
  () => [props.items, props.categories, showUnpackedOnly.value] as const,
  () => {
    const item = props.items.find((entry) => entry.id === openItemActionsId.value);
    if (
      !item ||
      (showUnpackedOnly.value && item.isPacked) ||
      !props.categories.some((category) => category.id === item.categoryId)
    ) {
      const active = document.activeElement;
      const focusedItem =
        active instanceof HTMLElement ? active.closest<HTMLElement>('[data-inline-item-id]') : null;
      const restoreRemovedFocus =
        focusedItem?.dataset.inlineItemId === openItemActionsId.value &&
        checklistRoot.value?.contains(focusedItem);
      openItemActionsId.value = null;
      if (restoreRemovedFocus)
        nextTick(() => {
          if (document.activeElement !== document.body && document.activeElement?.isConnected)
            return;
          const candidates = checklistRoot.value?.querySelectorAll<HTMLElement>(
            '[data-testid="item-name"], [data-testid="category-collapse-toggle"], [data-testid="add-item-button"]'
          );
          Array.from(candidates ?? [])
            .find((element) => !element.closest('[inert]'))
            ?.focus({ preventScroll: true });
        });
    }
  }
);

// Editing state
const isEditing = ref(false);
const isSavingEdit = ref(false);
const editSaveFailed = ref(false);
const editedName = ref('');
let editBaseline: ChecklistDTO | null = null;
// Legacy dates are unvalidated. Local casts retain native DOM / Date coercion;
// they do not narrow the stored DTO or claim these values are validated strings.
const editedStartDate = ref<unknown>('');
const editedEndDate = ref<unknown>('');
const nameInput = ref<HTMLInputElement | null>(null);
const startDateInput = ref<HTMLInputElement | null>(null);
const endDateInput = ref<HTMLInputElement | null>(null);
const isComposing = ref(false);
const isAdjustingDates = ref(false); // Guard flag to prevent watcher infinite loops
let cleanupEditingFocus = () => {};

// Drag state
const draggingCategoryId = ref<string | null>(null);
let cleanupDragPreview: (() => void) | undefined;
const isDraggingCategory = ref(false);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Filter items that are marked as to buy
const pendingItemsForDisplay = computed(() => {
  return props.items.filter(
    (item) => item.isPending && (!showUnpackedOnly.value || !item.isPacked)
  );
});

// Sorted categories for this checklist (sorted by order)
const sortedCategories = computed(() => {
  return [...props.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
});

// Draggable categories (two-way binding with vuedraggable)
const categoryPreview = ref<Readonly<CategoryDTO>[] | null>(null);
let pendingCategoryMoves = 0;
let awaitingCategoryRefresh = false;
/** Clear the category preview after saves and active drags have finished. */
function resetCategoryPreviewWhenIdle() {
  if (!pendingCategoryMoves && !awaitingCategoryRefresh && !isDraggingCategory.value) {
    categoryPreview.value = null;
  }
}
watch(
  () => props.categories,
  () => {
    if (!awaitingCategoryRefresh) return;
    awaitingCategoryRefresh = false;
    void nextTick(resetCategoryPreviewWhenIdle);
  }
);
const draggableCategories = computed({
  get() {
    if (!categoryPreview.value) return sortedCategories.value;
    const previews = categoryPreview.value.flatMap((preview) => {
      const current = props.categories.find((category) => category.id === preview.id);
      return current ? [{ ...current, order: preview.order }] : [];
    });
    const previewIds = new Set(categoryPreview.value.map((category) => category.id));
    return [
      ...previews,
      ...sortedCategories.value.filter((category) => !previewIds.has(category.id)),
    ];
  },
  set(newCategories) {
    // When vuedraggable updates the array, emit the reorder event
    const categoriesWithNewOrder = renumberOrder(newCategories);
    categoryPreview.value = categoriesWithNewOrder;
    pendingCategoryMoves += 1;

    emit(
      'reorder:categories',
      categoriesWithNewOrder,
      newCategories.map((category) => ({ ...category })),
      (awaitingRefresh) => {
        pendingCategoryMoves -= 1;
        if (awaitingRefresh) awaitingCategoryRefresh = true;
        void nextTick(resetCategoryPreviewWhenIdle);
      }
    );
  },
});

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- Editing Functions ----------

/**
 * Handle composition start (IME input begins)
 */
function handleCompositionStart() {
  isComposing.value = true;
}

/**
 * Handle composition end (IME input completes)
 */
function handleCompositionEnd() {
  isComposing.value = false;
  if (
    props.commitEditOnBlur &&
    isEditing.value &&
    ![nameInput.value, startDateInput.value, endDateInput.value].some(
      (input) => input === document.activeElement
    )
  )
    saveEdit();
}

/**
 * Handle Enter key press - only save if not in IME composition
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleEnterKey(event: KeyboardEvent) {
  event.preventDefault();
  // If currently composing (e.g., selecting Chinese characters), return early
  if (isComposing.value) {
    return;
  }
  // Otherwise, save the edit
  saveEdit();
}

/**
 * Save edit when focus moves outside the edit area
 * Includes IME composition check for defensive programming
 * @param {FocusEvent} event - Focus change from the edit area.
 */
function handleEditBlur(event: FocusEvent) {
  if (props.commitEditOnBlur) {
    if (
      ![nameInput.value, startDateInput.value, endDateInput.value].some(
        (input) => input === event.target
      )
    )
      return;
    const next = event.relatedTarget;
    const movingWithinEditor =
      next &&
      (next === nameInput.value || next === startDateInput.value || next === endDateInput.value);
    if (!movingWithinEditor && isEditing.value && !isComposing.value) saveEdit();
    return;
  }
  // Use a small timeout to allow focus to move to the other input
  setTimeout(() => {
    // Check if focus is still within editing elements
    const activeElement = document.activeElement;
    const isStillEditing =
      activeElement === nameInput.value ||
      activeElement === startDateInput.value ||
      activeElement === endDateInput.value;

    // Only save if not editing and not in IME composition
    if (!isStillEditing && isEditing.value && !isComposing.value && !editSaveFailed.value) {
      saveEdit();
    }
  }, 50); // 50ms: balance between focus transfer reliability and user responsiveness
}

/**
 * Enter edit mode and focus on name input
 */
async function startEdit() {
  cleanupEditingFocus();
  isEditing.value = true;
  editSaveFailed.value = false;
  editBaseline = { ...props.checklist };
  editedName.value = props.checklist.name;
  editedStartDate.value = props.checklist.startDate;
  editedEndDate.value = props.checklist.endDate;

  await nextTick();
  cleanupEditingFocus = focusEditingInput(nameInput.value);
}

/**
 * Save changes to checklist if any values were modified
 */
async function saveEdit() {
  if (isSavingEdit.value) return;
  cleanupEditingFocus();
  if (!editBaseline) return;
  const hasNameChanged = editedName.value.trim() !== editBaseline.name;
  const hasStartDateChanged = editedStartDate.value !== editBaseline.startDate;
  const hasEndDateChanged = editedEndDate.value !== editBaseline.endDate;

  if (hasNameChanged || hasStartDateChanged || hasEndDateChanged) {
    const updatedChecklist = {
      ...editBaseline,
      name: editedName.value.trim() || t('checklist.untitled'),
      startDate: editedStartDate.value,
      endDate: editedEndDate.value,
    };
    if (props.saveChecklistEdit) {
      const restoreFocus = [nameInput.value, startDateInput.value, endDateInput.value].some(
        (input) => input === document.activeElement
      )
        ? document.activeElement
        : null;
      isSavingEdit.value = true;
      editSaveFailed.value = false;
      try {
        if (!(await props.saveChecklistEdit(updatedChecklist, editBaseline))) {
          editSaveFailed.value = true;
          isSavingEdit.value = false;
          await nextTick();
          if (restoreFocus)
            cleanupEditingFocus = focusEditingInput(restoreFocus as HTMLInputElement, {
              select: false,
            });
          return;
        }
      } finally {
        isSavingEdit.value = false;
      }
    } else {
      emit('update:checklist', updatedChecklist, editBaseline);
    }
  }
  if (editSaveFailed.value) {
    editSaveFailed.value = false;
    props.editCancelled?.('checklist', props.checklist.id);
  }
  isEditing.value = false;
}

/**
 * Cancel editing and restore original values
 */
function cancelEdit() {
  if (isSavingEdit.value) return;
  cleanupEditingFocus();
  editSaveFailed.value = false;
  props.editCancelled?.('checklist', props.checklist.id);
  isEditing.value = false;
  editedName.value = props.checklist.name;
  editedStartDate.value = props.checklist.startDate;
  editedEndDate.value = props.checklist.endDate;
}

// ---------- Checklist Management ----------

/**
 * Emit delete event for this checklist
 */
function handleDelete() {
  emit('delete:checklist', props.checklist.id);
}

// --- Drag and Drop Handlers ---

/**
 * Set dragging category ID when drag starts
 * @param {object} event - Sortable drag event
 */
function onCategoryDragStart(event: DragStart) {
  cleanupDragPreview?.();
  cleanupDragPreview = isolateDragPreview();
  const categoryElement = event.item.querySelector<HTMLElement>('[data-category-id]') || event.item;
  if (categoryElement.dataset.categoryId) {
    draggingCategoryId.value = categoryElement.dataset.categoryId;
  }
  isDraggingCategory.value = true;
}

/**
 * Clear dragging state when drag ends
 * @param {object} _event - Sortable drag event (unused)
 */
function onCategoryDragEnd(_event: unknown) {
  cleanupDragPreview?.();
  cleanupDragPreview = undefined;
  draggingCategoryId.value = null;
  isDraggingCategory.value = false;
  void nextTick(resetCategoryPreviewWhenIdle);
}

/**
 * Handle category update event (delegated to draggableCategories setter)
 * @param {object} _event - Sortable update event (unused)
 */
function onCategoryUpdate(_event: unknown) {
  // This event is now handled by the draggableCategories setter
}

/**
 * Emit item move event to parent component
 * @param {object} moveData - Move data containing item and reorder information
 */
function handleItemMove(moveData: ItemMove) {
  if (!moveData.items?.length) {
    emit('move:item', moveData);
    return;
  }
  let resolveMove: (succeeded: boolean) => void = () => {};
  const result = new Promise<boolean>((resolve) => {
    resolveMove = resolve;
  });
  itemMoveResults.set(moveData, result);
  pendingItemMoves.value = [...pendingItemMoves.value, moveData];
  emit('move:item', moveData, (succeeded, awaitingRefresh) => {
    if (awaitingRefresh) awaitingItemRefresh.add(moveData);
    else {
      pendingItemMoves.value = pendingItemMoves.value.filter((entry) => entry !== moveData);
      itemMoveResults.delete(moveData);
    }
    resolveMove(succeeded && !awaitingRefresh);
    void nextTick(resetItemPreviewWhenIdle);
  });
}

// --- Helpers ---

/**
 * Format date range as string for display
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} Formatted date range string
 */
function formatDateRange(startDate: unknown, endDate: unknown) {
  /**
   * Parse YYYY-MM-DD date string to local Date object
   * @param {string} dateStr - Date string
   * @returns {Date|null} Parsed date or null
   */
  function parseLocalDate(dateStr: unknown) {
    if (!dateStr) return null;
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return new Date(dateStr as string);
    const [y, m, d] = parts.map(Number);
    // new Date(year, monthIndex, day) creates a date in local timezone
    return new Date(y!, m! - 1, d!);
  }

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (!start || !end) return '';

  // If same date, just return one date
  if (startDate === endDate) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const crossesYear = start.getFullYear() !== end.getFullYear();

  // Different dates
  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(crossesYear ? { year: 'numeric' } : {}),
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

// Watch for newly created checklists and auto-start edit
watch(
  () => props.newlyCreatedChecklistId,
  (newId) => {
    if (newId === props.checklist.id) {
      nextTick(() => {
        startEdit();
      });
    }
  }
);

// Watch start date changes - ensure end date is not earlier than start date
watch(editedStartDate, (newStartDate) => {
  if (!isEditing.value) return;
  if (isAdjustingDates.value) return; // Prevent watcher loops
  if (!newStartDate) return;

  // If end date is empty or earlier than the new start date, set end date to start date
  if (!editedEndDate.value || (editedEndDate.value as string) < (newStartDate as string)) {
    isAdjustingDates.value = true;
    editedEndDate.value = newStartDate;
    nextTick(() => {
      isAdjustingDates.value = false;
    });
  }
});

// Watch end date changes - ensure end date is not earlier than start date
watch(editedEndDate, (newEndDate) => {
  if (!isEditing.value) return;
  if (isAdjustingDates.value) return; // Prevent watcher loops
  if (!newEndDate || !editedStartDate.value) return;

  // If end date is earlier than start date, set end date to start date
  if ((newEndDate as string) < (editedStartDate.value as string)) {
    isAdjustingDates.value = true;
    editedEndDate.value = editedStartDate.value;
    nextTick(() => {
      isAdjustingDates.value = false;
    });
  }
});

onBeforeUnmount(() => {
  cleanupDragPreview?.();
  if (
    isEditing.value &&
    editBaseline &&
    (editedName.value !== editBaseline.name ||
      editedStartDate.value !== editBaseline.startDate ||
      editedEndDate.value !== editBaseline.endDate)
  ) {
    props.retainDraft?.({
      name: editedName.value,
      startDate: editedStartDate.value,
      endDate: editedEndDate.value,
    });
  }
  if (editSaveFailed.value) props.editCancelled?.('checklist', props.checklist.id);
});
onUnmounted(() => cleanupEditingFocus());
</script>

<style scoped>
/* Category drag and drop styles */
.ghost-category {
  opacity: 0.3;
  background: var(--ghost-background);
  border: 2px dashed var(--ghost-border);
  border-radius: 0.75rem;
}

.chosen-category {
  cursor: grabbing !important;
}

.drag-category {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow:
    0 20px 25px -5px var(--shadow-medium),
    0 10px 10px -5px var(--shadow-light);
  z-index: 1000;
}

/* Masonry layout using CSS columns */
.categories-masonry {
  column-count: 1;
  column-gap: 0.75rem; /* gap-3 for better spacing */
}

/* Breakpoints calculated to ensure minimum 280px per column */
/* 2 columns: 280*2 + 12 = 572px minimum, using 768px for comfort */
@media (min-width: 768px) {
  .categories-masonry {
    column-count: 2;
  }
}

/* 3 columns: 280*3 + 24 = 864px minimum, using 1180px for comfort */
@media (min-width: 1180px) {
  .categories-masonry {
    column-count: 3;
  }
}

/* 4 columns: 280*4 + 36 = 1156px minimum, using 1536px for comfort */
@media (min-width: 1536px) {
  .categories-masonry {
    column-count: 4;
  }
}

.touch-layout .categories-masonry {
  column-count: 4;
  column-width: 340px;
  contain: layout;
}

/* Prevent categories from breaking across columns */
.category-item {
  break-inside: avoid;
  page-break-inside: avoid; /* For older browsers */
  margin-bottom: 0.75rem; /* gap-3 */
  display: inline-block;
  width: 100%;
}

/* Sortable updates the preview transform from its current matrix on every touch move. */
.category-item.sortable-fallback {
  transition: none;
  transform: none;
}

/* Success animation */
@keyframes flash-success {
  0%,
  100% {
    box-shadow:
      0 4px 6px -1px var(--shadow-medium),
      0 2px 4px -1px var(--shadow-light);
  }
  50% {
    box-shadow:
      0 4px 6px -1px var(--shadow-success),
      0 2px 4px -1px var(--shadow-success-light);
  }
}

.flash-success {
  animation: flash-success 0.6s ease-in-out;
}
</style>
