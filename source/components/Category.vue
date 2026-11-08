<!--
================================================================================
File: source/components/Category.vue
Description: Category component - groups items, shows progress and allows editing
             of the category name.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div
    :class="[
      'group relative rounded-xl p-3 shadow-md transition-all duration-200 hover:shadow-lg',
      isCompleted ? 'bg-success-state-bg' : 'bg-white',
    ]"
    data-testid="category-card"
    :data-category-id="category.id"
    :data-completed="isCompleted ? 'true' : 'false'"
    :data-collapsed="isCollapsed ? 'true' : 'false'"
  >
    <!-- Category Header -->
    <div class="relative mb-3 flex items-center justify-between">
      <div class="flex min-w-0 grow items-center">
        <label
          :for="`category-${category.id}-packed`"
          class="touch-target mr-1 flex size-9 flex-none items-center justify-center rounded-lg focus-within:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-interactive-focus has-[:focus-visible]:ring-offset-1 md:mr-2 md:size-6"
          :class="{ 'desktop-checkbox-inset': !touchControls }"
        >
          <input
            :id="`category-${category.id}-packed`"
            :checked="isCompleted"
            :disabled="sortedItems.length === 0"
            :indeterminate="isPartiallyCompleted"
            :name="`category-${category.id}-packed`"
            type="checkbox"
            :aria-label="isCompleted ? $t('category.unpackAll') : $t('category.packAll')"
            :aria-checked="isPartiallyCompleted ? 'mixed' : isCompleted ? 'true' : 'false'"
            :aria-disabled="isSavingPacked || undefined"
            data-testid="category-checkbox"
            :class="[
              'size-5 flex-none shrink-0 cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:size-4',
              isCompleted
                ? 'border-success-state-border accent-success-state-accent'
                : 'border-border-color-medium accent-control-accent',
            ]"
            :style="isCompleted ? { accentColor: 'var(--theme-primary)' } : {}"
            @change="toggleCategoryPacked"
            @click.stop
            @mousedown.stop
            @touchstart.stop
          />
        </label>
        <div class="-ml-1.5 min-w-0 grow md:-ml-1">
          <input
            v-if="isEditing"
            :id="`category-${category.id}-name`"
            ref="editInput"
            v-model="editedName"
            :disabled="isSavingEdit"
            :name="`category-${category.id}-name`"
            :aria-label="$t('category.name')"
            data-testid="category-name-input"
            class="w-full bg-transparent p-1 text-2xl font-semibold leading-snug text-primary focus:outline-none md:text-xl"
            style="box-shadow: inset 0 -2px 0 0 var(--interactive-focus)"
            @keydown.enter="handleEnterKey"
            @keyup.escape="cancelEdit"
            @blur="handleBlur"
            @compositionstart="handleCompositionStart"
            @compositionend="handleCompositionEnd"
          />
          <h3
            v-else
            class="cursor-pointer rounded p-1 text-2xl font-semibold leading-snug text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus md:text-xl"
            style="word-break: break-word; overflow-wrap: break-word"
            role="button"
            tabindex="0"
            data-testid="category-name"
            @click="startEdit"
            @keydown.enter.prevent="startEdit"
            @keydown.space.prevent="startEdit"
          >
            {{ category.name }}
          </h3>
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
        </div>
      </div>

      <!-- Overflow menu -->
      <div class="flex items-center">
        <!-- Collapse/Expand Button -->
        <button
          type="button"
          class="touch-target ml-2 flex size-9 flex-none items-center justify-center rounded-lg text-secondary transition-colors duration-200 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:size-6 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
          :class="
            touchControls
              ? 'bg-transparent md:!opacity-100'
              : isCompleted
                ? 'bg-transparent hover:bg-success-state-control-hover'
                : 'bg-transparent hover:bg-control-hover'
          "
          :title="isCollapsed ? $t('category.expand') : $t('category.collapse')"
          :aria-label="isCollapsed ? $t('category.expand') : $t('category.collapse')"
          :aria-expanded="!isCollapsed"
          :aria-controls="`category-${category.id}-items`"
          data-testid="category-collapse-toggle"
          @click.stop="toggleCollapse"
        >
          <!-- Down arrow (Expand) -->
          <AppIcon
            v-if="isCollapsed"
            class="md:size-4"
            name="expand"
          />
          <!-- Up arrow (Collapse) -->
          <AppIcon
            v-else
            class="md:size-4"
            name="collapse"
          />
        </button>

        <OverflowMenu
          :item-id="category.id"
          menu-type="category"
          alignment="left"
          :force-visible="touchControls"
          :touch-minimal="touchControls"
          :success-surface="isCompleted"
          class="ml-2"
          :class="{ 'md:mr-1': !touchControls }"
          @edit="startEdit"
          @copy="$emit('copy:category', category.id)"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Category Progress Bar -->
    <ProgressBar
      :total="sortedItems.length"
      :completed="sortedItems.filter((item) => item.isPacked).length"
      class="mb-3 px-1"
    />

    <!-- Items List -->
    <div
      :id="`category-${category.id}-items`"
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
      data-testid="category-items-container"
      data-height-motion
    >
      <div
        class="min-h-0 overflow-hidden"
        :aria-hidden="isCollapsed"
        :inert="isCollapsed"
      >
        <div class="space-y-1 pt-1">
          <draggable
            ref="itemDraggable"
            v-model="draggableItems"
            item-key="id"
            :delay="200"
            filter="button, input, label, a, [contenteditable], [data-testid=item-inline-actions]"
            :prevent-on-filter="false"
            :delay-on-touch-only="true"
            :fallback-on-body="true"
            :group="{
              name: 'items',
              pull: true,
              put: putOnlyFromGroup('items'),
            }"
            :animation="200"
            :ghost-class="'ghost-item'"
            :chosen-class="'chosen-item'"
            :drag-class="'drag-item'"
            :class="[
              'gap-1',
              {
                'md:gap-0': touchControls,
              },
            ]"
            data-testid="category-items-draggable"
            :data-category-id="category.id"
            @start="onItemDragStart"
            @end="onItemDragEnd"
            @change="onItemChange"
          >
            <template #item="{ element: item }">
              <div
                :key="item.id"
                :data-item-id="item.id"
              >
                <Item
                  :item="item"
                  :touch-controls="touchControls"
                  :actions-open="openItemActionsId === item.id"
                  :newly-created-item-id="newlyCreatedItemId"
                  :category-completed="isCompleted"
                  :is-dragging="draggingItemId === item.id"
                  :suppress-drag-hover="suppressDragHover"
                  :save-item-edit="saveItemEdit"
                  :commit-edit-on-blur="commitEditOnBlur"
                  :edit-error-code="editErrorCode"
                  :update-item-action="updateItemAction"
                  :retain-draft="retainDraft"
                  :edit-cancelled="editCancelled"
                  @toggle-actions="$emit('toggle-item-actions', $event)"
                  @close-actions="$emit('close-item-actions')"
                  @update:item="(...args) => $emit('update:item', ...args)"
                  @copy:item="$emit('copy:item', $event)"
                  @delete:item="$emit('delete:item', $event)"
                />
              </div>
            </template>
            <template #footer>
              <AddItemButton
                :category-completed="isCompleted"
                :touch-controls="touchControls"
                :suppress-drag-hover="suppressDragHover"
                @click="$emit('create:item', category.id)"
              />
            </template>
          </draggable>
        </div>
      </div>
    </div>
    <Transition
      name="collapsed-preview"
      @after-leave="clearCollapsedPreview"
    >
      <div
        v-if="isCollapsed && showCollapsedPreview && collapsedPreview"
        class="pointer-events-none grid grid-rows-[1fr]"
        data-height-motion
        aria-hidden="true"
        inert
      >
        <div class="min-h-0 overflow-hidden">
          <div class="pt-1">
            <div
              class="flex items-center rounded-md px-0 py-0.5"
              :class="{ 'md:pl-2': !touchControls }"
              data-testid="collapsed-drop-preview"
            >
              <span
                class="touch-target mr-1 flex size-9 flex-none items-center justify-center md:mr-2 md:size-6"
              >
                <input
                  :checked="collapsedPreview.isPacked"
                  type="checkbox"
                  disabled
                  tabindex="-1"
                  class="size-5 accent-control-accent md:size-4"
                />
              </span>
              <span
                class="min-w-0 grow break-words px-1 py-0.5 text-lg leading-snug md:text-base"
                data-testid="collapsed-preview-name"
                :class="[
                  { 'md:!text-lg': touchControls },
                  collapsedPreview.isPacked
                    ? isCompleted
                      ? 'text-control-accent line-through'
                      : 'text-secondary line-through'
                    : '',
                ]"
                >{{ collapsedPreview.name }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <draggable
      v-show="isCollapsed && itemDragActive"
      ref="collapsedReceiver"
      v-model="collapsedDropItems"
      item-key="id"
      :sort="false"
      :disabled="!isCollapsed || !itemDragActive"
      :group="{ name: 'items', pull: false, put: putOnlyFromGroup('items') }"
      ghost-class="collapsed-item-ghost"
      class="absolute inset-0 rounded-xl"
      data-testid="collapsed-category-drop"
      aria-hidden="true"
      @change="onCollapsedItemChange"
    >
      <template #item="{ element: item }">
        <div :data-item-id="item.id" />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import type { PropType } from 'vue';
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue';

import { Category } from '../models/Category';
import type { CategoryDTO, ItemDTO } from '../models/contracts';
import { isolateDragPreview, putOnlyFromGroup } from '../utils/dragDrop';
import { focusEditingInput } from '../utils/focusEditingInput';
import { insertAtVisibleIndex, renumberOrder, reorderVisibleSlots } from '../utils/order';
import AddItemButton from './AddItemButton.vue';
import AppIcon from './AppIcon.vue';
import type {
  CategoryPackedChange,
  DragStart,
  EditCancelled,
  ItemDragChange,
  ItemMove,
  RetainDraft,
  SaveCategoryEdit,
  SaveItemEdit,
  SetCategoryPackedAction,
  UpdateItemAction,
} from './componentContracts';
import Item from './Item.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';
import type { DraggableControl } from './typedDraggable';
import { draggableFor, useDraggableControls } from './typedDraggable';

const draggable = draggableFor<Readonly<ItemDTO>>();
const itemDraggable = useDraggableControls();

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
const props = defineProps({
  touchControls: { type: Boolean, default: false },
  itemDragActive: { type: Boolean, default: false },
  openItemActionsId: { type: String as PropType<string | null>, default: null },
  commitEditOnBlur: { type: Boolean, default: false },
  retainDraft: { type: Function as PropType<RetainDraft | null>, default: null },
  editCancelled: { type: Function as PropType<EditCancelled | null>, default: null },
  saveCategoryEdit: { type: Function as PropType<SaveCategoryEdit | null>, default: null },
  saveItemEdit: { type: Function as PropType<SaveItemEdit | null>, default: null },
  editErrorCode: { type: String as PropType<string | null>, default: null },
  setCategoryPackedAction: {
    type: Function as PropType<SetCategoryPackedAction | null>,
    default: null,
  },
  waitForCategoryMoves: {
    type: Function as PropType<((categoryId: string) => Promise<boolean>) | null>,
    default: null,
  },
  updateItemAction: { type: Function as PropType<UpdateItemAction | null>, default: null },
  category: {
    type: Object as PropType<Readonly<CategoryDTO>>,
    required: true,
    validator: (value: Record<string, unknown>) => {
      // Validate that the object has the required properties for a category
      return (
        value &&
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.checklistId === 'string'
      );
    },
  },
  items: {
    type: Array as PropType<readonly Readonly<ItemDTO>[]>,
    required: true,
  },
  displayItems: {
    type: Array as PropType<readonly Readonly<ItemDTO>[] | null>,
    default: null,
  },
  newlyCreatedItemId: {
    type: String as PropType<string | null>,
    default: null,
  },
  newlyCreatedCategoryId: {
    type: String as PropType<string | null>,
    default: null,
  },
  showUnpackedOnly: {
    type: Boolean,
    default: false,
  },
  dragBaselineItems: {
    type: Array as PropType<readonly Readonly<ItemDTO>[] | null>,
    default: null,
  },
  dragPreviewReset: { type: Number, default: 0 },
  suppressDragHover: { type: Boolean, default: false },
});

// Emits
const emit = defineEmits<{
  'toggle-item-actions': [id: string];
  'close-item-actions': [];
  'collapse:category': [id: string];
  'update:item': [item: ItemDTO, expected?: ItemDTO];
  'copy:item': [id: string];
  'delete:item': [id: string];
  'create:item': [categoryId: string];
  'update:category': [category: CategoryDTO, expected?: CategoryDTO];
  'copy:category': [id: string];
  'delete:category': [id: string];
  'move:item': [move: ItemMove];
  'drag:item-start': [];
  'drag:item-end': [event: unknown];
  'set-category-packed': [change: CategoryPackedChange];
}>();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Editing state
const isEditing = ref(false);
const isSavingEdit = ref(false);
const isSavingPacked = ref(false);
const editSaveFailed = ref(false);
const editedName = ref('');
let editBaseline: CategoryDTO | null = null;
const editInput = ref<HTMLInputElement | null>(null);
const isComposing = ref(false);
let cleanupEditingFocus = () => {};
let isUnmounted = false;

// Drag state
const draggingItemId = ref<string | null>(null);
let cleanupDragPreview: (() => void) | undefined;
const dragPreview = ref<Readonly<ItemDTO>[] | null>(null);
let dragPreviewFilter = false;
watch(
  () => props.dragPreviewReset,
  () => {
    dragPreview.value = null;
  }
);

// Collapse state
const isCollapsed = ref(false);
const collapsedDropItems = ref<Readonly<ItemDTO>[]>([]);
const collapsedReceiver = ref<DraggableControl | null>(null);
const collapsedPreview = ref<Readonly<ItemDTO> | null>(null);
const showCollapsedPreview = ref(false);
let stopCollapsedPreview = () => {};

// Sortable inserts its native placeholder before committing modelValue. Observe only
// that receiver so the preview is transient and never modifies saved item state.
onMounted(() => {
  const root = collapsedReceiver.value?.$el;
  if (!root || typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(() => {
    const ghost = root.querySelector<HTMLElement>('.collapsed-item-ghost');
    const id =
      ghost?.dataset.itemId ?? ghost?.querySelector<HTMLElement>('[data-item-id]')?.dataset.itemId;
    const item = (props.displayItems ?? props.items).find((entry) => entry.id === id);
    if (props.itemDragActive && isCollapsed.value && item) {
      collapsedPreview.value = { ...item };
      showCollapsedPreview.value = true;
    } else showCollapsedPreview.value = false;
  });
  observer.observe(root, { childList: true });
  stopCollapsedPreview = () => observer.disconnect();
});
watch(
  () => props.itemDragActive,
  (active) => {
    if (!active) showCollapsedPreview.value = false;
  }
);
watch(isCollapsed, (collapsed) => {
  if (!collapsed) showCollapsedPreview.value = false;
});

/** Keep the last visual snapshot until its closing animation has finished. */
function clearCollapsedPreview() {
  if (!showCollapsedPreview.value) collapsedPreview.value = null;
}

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Use the displayed membership for progress, packing controls, and visible rows.
const sortedItems = computed(() => {
  const filteredItems = (props.displayItems ?? props.items).filter(
    (item) => item.categoryId === props.category.id
  );
  // Sort by order field to maintain correct sequence
  return filteredItems.sort((a, b) => (a.order || 0) - (b.order || 0));
});

// Items currently visible in this category. The full set remains available to
// progress, completion, and category-wide packing controls.
const visibleItems = computed(() => {
  if (!props.showUnpackedOnly) return sortedItems.value;
  return sortedItems.value.filter((item) => !item.isPacked);
});

/**
 * Return whether an item participates in the current visible drag list.
 * @param {object} item - Item to evaluate.
 * @returns {boolean} Whether the item is visible.
 */
function isItemVisible(item: Readonly<ItemDTO>) {
  return !props.showUnpackedOnly || !item.isPacked;
}

// Draggable items (two-way binding with vuedraggable)
const draggableItems = computed({
  get() {
    if (!dragPreview.value || dragPreviewFilter !== props.showUnpackedOnly) {
      return visibleItems.value;
    }
    const previews = dragPreview.value.flatMap((preview) => {
      const current = (props.displayItems ?? props.items).find((item) => item.id === preview.id);
      const item = current ? { ...preview, ...current, categoryId: props.category.id } : null;
      return item && isItemVisible(item) ? [item] : [];
    });
    const baselineIds = new Set((props.dragBaselineItems ?? props.items).map((item) => item.id));
    return [...previews, ...visibleItems.value.filter((item) => !baselineIds.has(item.id))];
  },
  set(newItems) {
    // Keep Sortable's dropped order visible while the guarded write completes.
    dragPreview.value = newItems;
    dragPreviewFilter = props.showUnpackedOnly;
  },
});

// Completing state
const isCompleted = computed(() => {
  const items = sortedItems.value;
  if (!items.length) return false;
  return items.every((i) => i.isPacked);
});

const isPartiallyCompleted = computed(() => {
  const items = sortedItems.value;
  if (!items.length) return false;
  return items.some((item) => item.isPacked) && !items.every((item) => item.isPacked);
});

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- UI Handlers ----------

/**
 * Toggle category collapse state
 */
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  if (isCollapsed.value) emit('collapse:category', props.category.id);
}

/**
 * Request one atomic packed-state change for all items in this category.
 * @param {Event} event - Checkbox change event
 */
async function toggleCategoryPacked(event: Event) {
  if (isSavingPacked.value) {
    (event.target as HTMLInputElement).checked = isCompleted.value;
    return;
  }
  const requested = (event.target as HTMLInputElement).checked;
  // Keep the control aligned with committed state until the asynchronous write succeeds.
  (event.target as HTMLInputElement).checked = isCompleted.value;
  const change = {
    categoryId: props.category.id,
    isPacked: requested,
  };
  isSavingPacked.value = true;
  try {
    if (props.waitForCategoryMoves && !(await props.waitForCategoryMoves(props.category.id))) {
      return;
    }
    if (isUnmounted) return;
    if (props.setCategoryPackedAction) await props.setCategoryPackedAction(change);
    else emit('set-category-packed', change);
  } finally {
    isSavingPacked.value = false;
  }
}

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
  if (props.commitEditOnBlur && isEditing.value && document.activeElement !== editInput.value)
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
 * Handle blur event - save edit if not in IME composition
 * Although modern browsers fire compositionend before blur,
 * this check provides defensive programming against edge cases
 */
function handleBlur() {
  if (!isComposing.value && !editSaveFailed.value) {
    saveEdit();
  }
}

/**
 * Enter edit mode and focus on the category name input
 */
async function startEdit() {
  cleanupEditingFocus();
  isEditing.value = true;
  editSaveFailed.value = false;
  editBaseline = { ...props.category };
  editedName.value = props.category.name;

  await nextTick();
  cleanupEditingFocus = focusEditingInput(editInput.value);
}

/**
 * Save the edited category name if changed
 */
async function saveEdit() {
  if (isSavingEdit.value) return;
  cleanupEditingFocus();
  if (!editBaseline) return;
  const hasNameChanged = editedName.value.trim() && editedName.value !== editBaseline.name;

  if (hasNameChanged) {
    const updatedCategory = new Category({
      ...editBaseline,
      name: editedName.value.trim(),
    });
    if (props.saveCategoryEdit) {
      const restoreFocus = document.activeElement === editInput.value;
      isSavingEdit.value = true;
      editSaveFailed.value = false;
      try {
        if (!(await props.saveCategoryEdit(updatedCategory, editBaseline))) {
          editSaveFailed.value = true;
          isSavingEdit.value = false;
          await nextTick();
          if (restoreFocus)
            cleanupEditingFocus = focusEditingInput(editInput.value, { select: false });
          return;
        }
      } finally {
        isSavingEdit.value = false;
      }
    } else {
      emit('update:category', updatedCategory, editBaseline);
    }
  }
  if (editSaveFailed.value) {
    editSaveFailed.value = false;
    props.editCancelled?.('category', props.category.id);
  }
  isEditing.value = false;
}

/**
 * Cancel editing and restore original category name
 */
function cancelEdit() {
  if (isSavingEdit.value) return;
  cleanupEditingFocus();
  editSaveFailed.value = false;
  props.editCancelled?.('category', props.category.id);
  isEditing.value = false;
  editedName.value = props.category.name;
}

// ---------- Category Management ----------

/**
 * Emit delete event for this category
 */
function handleDelete() {
  emit('delete:category', props.category.id);
}

// ---------- Drag and Drop Handlers ----------

/**
 * Set dragging item ID when drag starts
 * @param {object} event - Sortable drag event
 */
function onItemDragStart(event: DragStart) {
  cleanupDragPreview?.();
  cleanupDragPreview = isolateDragPreview();
  emit('drag:item-start');
  const item = event.item.querySelector<HTMLElement>('[data-item-id]');
  if (item) {
    draggingItemId.value = item.dataset.itemId!;
  }
}

/**
 * Clear dragging item ID when drag ends
 * @param {object} event - Sortable drag event
 */
function onItemDragEnd(event: unknown) {
  cleanupDragPreview?.();
  cleanupDragPreview = undefined;
  draggingItemId.value = null;
  emit('drag:item-end', event);
}

/** Receive an item without exposing or rearranging a collapsed category's hidden rows. */
function onCollapsedItemChange(event: ItemDragChange) {
  if (event.added) {
    onItemChange({ added: { ...event.added, newIndex: visibleItems.value.length } });
  }
  collapsedDropItems.value = [];
}

/**
 * Handle item reorder or move events from vue-draggable.
 * @param {object} event - Sortable change event.
 */
function onItemChange(event: ItemDragChange) {
  const baseline = props.dragBaselineItems ?? props.items;
  const categoryItems = baseline
    .filter((entry) => entry.categoryId === props.category.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  // Case 1: Cross-category move (target side)
  // When an item is dragged from another category to this one
  // Note: event.removed is intentionally ignored.
  // The category's order will be corrected by a data refresh from the parent component, avoiding race conditions from simultaneous updates.
  if (event.added) {
    const item = event.added.element;
    const newIndex = event.added.newIndex;

    const sourceItems = baseline
      .filter((entry) => entry.categoryId === item.categoryId && entry.id !== item.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const targetItems = categoryItems.filter((entry) => entry.id !== item.id);
    const movedItem = {
      ...item,
      categoryId: props.category.id,
    };
    const reorderedSourceItems = renumberOrder(sourceItems);
    const reorderedTargetItems = insertAtVisibleIndex(
      targetItems,
      movedItem,
      newIndex,
      isItemVisible
    );

    emit('move:item', {
      type: 'move',
      items: [...reorderedSourceItems, ...reorderedTargetItems],
      expectedItems: baseline.map((entry) => (entry.id === item.id ? { ...item } : { ...entry })),
    });
  }

  // Case 2: Same-category reorder
  // When an item is moved within the same category
  if (event.moved) {
    const oldIndex = event.moved.oldIndex;
    const newIndex = event.moved.newIndex;

    const reorderedVisibleItems = categoryItems.filter(isItemVisible);
    const [removed] = reorderedVisibleItems.splice(oldIndex, 1);
    reorderedVisibleItems.splice(newIndex, 0, removed!);
    const itemsWithNewOrder = reorderVisibleSlots(
      categoryItems,
      reorderedVisibleItems,
      isItemVisible
    );

    emit('move:item', {
      items: itemsWithNewOrder,
      expectedItems: baseline.map((entry) =>
        entry.id === event.moved!.element?.id ? { ...event.moved!.element } : { ...entry }
      ),
      categoryId: props.category.id,
      type: 'reorder',
    });
  }
}

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

// Watch for newly created category and auto-start edit
watch(
  () => props.newlyCreatedCategoryId,
  (newId) => {
    if (newId === props.category.id) {
      nextTick(() => {
        startEdit();
      });
    }
  }
);

onBeforeUnmount(() => {
  stopCollapsedPreview();
  cleanupDragPreview?.();
  if (isEditing.value && editBaseline && editedName.value !== editBaseline.name) {
    props.retainDraft?.({ name: editedName.value });
  }
  if (editSaveFailed.value) props.editCancelled?.('category', props.category.id);
});
onUnmounted(() => {
  isUnmounted = true;
  cleanupEditingFocus();
});
</script>

<style scoped>
[data-testid='collapsed-category-drop'] :deep(.collapsed-item-ghost) {
  display: none;
}
.ghost-item,
[data-testid='collapsed-drop-preview'] {
  background-color: var(--ghost-background);
  outline: 2px dashed var(--ghost-border);
  outline-offset: -2px;
  border-radius: 0.375rem;
  opacity: 0.5;
}
/* Keep insertion geometry normal rather than inheriting grabbed-row effects. */
.ghost-item :deep([data-testid='item-row']) {
  transform: none;
  opacity: 1;
  box-shadow: none;
}
.collapsed-preview-enter-active,
.collapsed-preview-leave-active {
  transition: grid-template-rows 300ms ease-in-out;
}
.collapsed-preview-enter-from,
.collapsed-preview-leave-to {
  grid-template-rows: 0fr;
}
@media (hover: hover) {
  [data-testid='category-name']:hover {
    background-color: var(--control-hover);
  }
  [data-completed='true'] [data-testid='category-name']:hover {
    background-color: var(--success-control-hover);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-testid='category-items-container'],
  .collapsed-preview-enter-active,
  .collapsed-preview-leave-active {
    transition: none;
  }
}
[data-testid='category-collapse-toggle'] {
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 768px) {
  .desktop-checkbox-inset {
    margin-left: 0.5rem;
  }
}
/* Drag and drop styles */
/* Gap follows visual order even when Sortable appends a ghost after the footer. */
[data-testid='category-items-draggable'] {
  display: flex;
  flex-direction: column;
}
[data-testid='category-items-draggable'] > [data-testid='add-item-button'] {
  order: 1;
}
.chosen-item {
  cursor: grabbing !important;
}

.drag-item {
  opacity: 0.5;
  transform: scale(1.05);
  box-shadow:
    0 10px 15px -3px var(--shadow-medium),
    0 4px 6px -2px var(--shadow-light);
}

/* Keep the floating preview in viewport pixels; Sortable owns its translation. */
.drag-item.sortable-fallback {
  transform: none;
}

/* Drag handle */
.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Drop zone visual feedback */
.bg-blue-50 {
  background-color: var(--drop-zone);
}

.border-dashed {
  border-style: dashed;
}

/* Success flash animation */
@keyframes flash-success {
  0%,
  100% {
    border-color: transparent;
  }
  50% {
    border-color: var(--success);
  }
}

.flash-success {
  animation: flash-success 0.6s ease-in-out;
}
</style>
