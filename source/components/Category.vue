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
      'group rounded-xl p-3 shadow-md transition-all duration-200 hover:shadow-lg',
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
        <div
          class="mr-1 flex size-9 flex-none items-center justify-center rounded-lg focus-within:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-interactive-focus has-[:focus-visible]:ring-offset-1 md:mr-2 md:size-6"
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
        </div>
        <div class="min-w-0 grow">
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
            class="cursor-pointer rounded p-1 text-2xl font-semibold leading-snug text-primary hover:bg-interactive-hover-light focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus md:text-xl"
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
          class="ml-2 flex size-9 flex-none items-center justify-center rounded-lg bg-control-bg text-secondary transition-all duration-200 hover:bg-control-hover hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:size-6 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
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
          class="ml-2"
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
    >
      <div
        class="min-h-0 overflow-hidden"
        :aria-hidden="isCollapsed"
      >
        <div class="space-y-1 pt-1">
          <draggable
            v-model="draggableItems"
            item-key="id"
            :delay="200"
            :delay-on-touch-only="true"
            :group="{
              name: 'items',
              pull: true,
              put: putOnlyFromGroup('items'),
            }"
            :animation="200"
            :ghost-class="'ghost-item'"
            :chosen-class="'chosen-item'"
            :drag-class="'drag-item'"
            :class="['space-y-1', { 'min-h-12': showUnpackedOnly && visibleItems.length === 0 }]"
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
                  :newly-created-item-id="newlyCreatedItemId"
                  :category-completed="isCompleted"
                  :is-dragging="draggingItemId === item.id"
                  :save-item-edit="saveItemEdit"
                  :commit-edit-on-blur="commitEditOnBlur"
                  :edit-error-code="editErrorCode"
                  :update-item-action="updateItemAction"
                  :retain-draft="retainDraft"
                  :edit-cancelled="editCancelled"
                  @update:item="(...args) => $emit('update:item', ...args)"
                  @copy:item="$emit('copy:item', $event)"
                  @delete:item="$emit('delete:item', $event)"
                />
              </div>
            </template>
          </draggable>

          <AddItemButton
            :category-completed="isCompleted"
            @click="$emit('create:item', category.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, nextTick, onBeforeUnmount, onUnmounted, ref, watch } from 'vue';
import draggable from 'vuedraggable';

import { Category } from '../models/Category';
import { putOnlyFromGroup } from '../utils/dragDrop.js';
import { focusEditingInput } from '../utils/focusEditingInput.js';
import { insertAtVisibleIndex, renumberOrder, reorderVisibleSlots } from '../utils/order.js';
import AddItemButton from './AddItemButton.vue';
import AppIcon from './AppIcon.vue';
import Item from './Item.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
const props = defineProps({
  commitEditOnBlur: { type: Boolean, default: false },
  retainDraft: { type: Function, default: null },
  editCancelled: { type: Function, default: null },
  saveCategoryEdit: { type: Function, default: null },
  saveItemEdit: { type: Function, default: null },
  editErrorCode: { type: String, default: null },
  setCategoryPackedAction: { type: Function, default: null },
  updateItemAction: { type: Function, default: null },
  category: {
    type: Object,
    required: true,
    validator: (value) => {
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
    type: Array,
    required: true,
  },
  newlyCreatedItemId: {
    type: String,
    default: null,
  },
  newlyCreatedCategoryId: {
    type: String,
    default: null,
  },
  showUnpackedOnly: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([
  'update:item',
  'copy:item',
  'delete:item',
  'create:item',
  'update:category',
  'copy:category',
  'delete:category',
  'move:item',
  'set-category-packed',
]);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Editing state
const isEditing = ref(false);
const isSavingEdit = ref(false);
const isSavingPacked = ref(false);
const editSaveFailed = ref(false);
const editedName = ref('');
let editBaseline = null;
const editInput = ref(null);
const isComposing = ref(false);
let cleanupEditingFocus = () => {};

// Drag state
const draggingItemId = ref(null);

// Collapse state
const isCollapsed = ref(false);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Sorted items for this category (filtered from all items, then sorted by order)
const sortedItems = computed(() => {
  const filteredItems = props.items.filter((item) => item.categoryId === props.category.id);
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
function isItemVisible(item) {
  return !props.showUnpackedOnly || !item.isPacked;
}

// Draggable items (two-way binding with vuedraggable)
const draggableItems = computed({
  get() {
    return visibleItems.value;
  },
  set(_newItems) {
    // This setter is intentionally empty (no-op) since we handle ALL drag events via @change event
    // - evt.added: Cross-category move (target side)
    // - evt.removed: Cross-category move (source side)
    // - evt.moved: Same-category reorder
    //
    // The setter must exist for v-model to work, but it does nothing.
    // The actual data updates happen via emit('move:item') in @change handler,
    // then flow back through props → sortedItems → getter.
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
}

/**
 * Request one atomic packed-state change for all items in this category.
 * @param {Event} event - Checkbox change event
 */
async function toggleCategoryPacked(event) {
  if (isSavingPacked.value) {
    event.target.checked = isCompleted.value;
    return;
  }
  const requested = event.target.checked;
  // Keep the control aligned with committed state until the asynchronous write succeeds.
  event.target.checked = isCompleted.value;
  const change = {
    categoryId: props.category.id,
    isPacked: requested,
  };
  if (!props.setCategoryPackedAction) {
    emit('set-category-packed', change);
    return;
  }
  isSavingPacked.value = true;
  try {
    await props.setCategoryPackedAction(change);
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
function handleEnterKey(event) {
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
          if (restoreFocus) editInput.value?.focus({ preventScroll: true });
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
function onItemDragStart(event) {
  const item = event.item.querySelector('[data-item-id]');
  if (item) {
    draggingItemId.value = item.dataset.itemId;
  }
}

/**
 * Clear dragging item ID when drag ends
 * @param {object} _event - Sortable drag event (unused)
 */
function onItemDragEnd(_event) {
  draggingItemId.value = null;
}

/**
 * Handle item reorder or move events from vue-draggable
 * @param {object} event - Sortable change event with added/removed/moved properties
 */
function onItemChange(event) {
  // Case 1: Cross-category move (target side)
  // When an item is dragged from another category to this one
  // Note: event.removed is intentionally ignored.
  // The category's order will be corrected by a data refresh from the parent component, avoiding race conditions from simultaneous updates.
  if (event.added) {
    const item = event.added.element;
    const newIndex = event.added.newIndex;

    const sourceItems = props.items
      .filter((entry) => entry.categoryId === item.categoryId && entry.id !== item.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const targetItems = sortedItems.value.filter((entry) => entry.id !== item.id);
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
      expectedItems: props.items.map((entry) =>
        entry.id === item.id ? { ...item } : { ...entry }
      ),
    });
  }

  // Case 2: Same-category reorder
  // When an item is moved within the same category
  if (event.moved) {
    const oldIndex = event.moved.oldIndex;
    const newIndex = event.moved.newIndex;

    const reorderedVisibleItems = [...visibleItems.value];
    const [removed] = reorderedVisibleItems.splice(oldIndex, 1);
    reorderedVisibleItems.splice(newIndex, 0, removed);
    const itemsWithNewOrder = reorderVisibleSlots(
      sortedItems.value,
      reorderedVisibleItems,
      isItemVisible
    );

    emit('move:item', {
      items: itemsWithNewOrder,
      expectedItems: props.items.map((entry) =>
        entry.id === event.moved.element?.id ? { ...event.moved.element } : { ...entry }
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
  if (isEditing.value && editBaseline && editedName.value !== editBaseline.name) {
    props.retainDraft?.({ name: editedName.value });
  }
  if (editSaveFailed.value) props.editCancelled?.('category', props.category.id);
});
onUnmounted(() => cleanupEditingFocus());
</script>

<style scoped>
/* Drag and drop styles */
.ghost-item {
  opacity: 0.3;
  background: var(--ghost-background);
  border: 2px dashed var(--ghost-border);
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
