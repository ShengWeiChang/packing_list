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
      isCompleted ? 'bg-green-50' : 'bg-white',
    ]"
  >
    <!-- Category Header -->
    <div class="relative mb-3 flex items-center justify-between">
      <div class="grow">
        <input
          v-if="isEditing"
          :id="`category-${category.id}-name`"
          ref="editInput"
          v-model="editedName"
          :name="`category-${category.id}-name`"
          :aria-label="$t('category.name')"
          class="w-full border-b border-blue-300 bg-transparent p-1 text-2xl font-semibold text-slate-800 focus:border-blue-500 focus:outline-none md:text-xl"
          @keydown.enter="handleEnterKey"
          @keyup.escape="cancelEdit"
          @blur="handleBlur"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        />
        <h3
          v-else
          class="text-primary cursor-pointer rounded p-1 text-2xl font-semibold leading-snug hover:bg-gray-50 md:text-xl"
          style="word-break: break-word; overflow-wrap: break-word"
          role="button"
          tabindex="0"
          @click="startEdit"
          @keydown.enter.prevent="startEdit"
          @keydown.space.prevent="startEdit"
        >
          {{ category.name }}
        </h3>
      </div>

      <!-- Overflow menu -->
      <div class="flex items-center">
        <!-- Collapse/Expand Button -->
        <button
          type="button"
          class="ml-2 flex size-8 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 focus:visible focus:opacity-100 md:invisible md:size-6 md:group-hover:visible"
          :title="isCollapsed ? $t('category.expand') : $t('category.collapse')"
          :aria-label="isCollapsed ? $t('category.expand') : $t('category.collapse')"
          :aria-expanded="!isCollapsed"
          :aria-controls="`category-${category.id}-items`"
          @click.stop="toggleCollapse"
        >
          <!-- Down arrow (Expand) -->
          <svg
            v-if="isCollapsed"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-5 md:size-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
          <!-- Up arrow (Collapse) -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="size-5 md:size-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
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
    >
      <div class="min-h-0 overflow-hidden">
        <div class="space-y-0.5 pt-1">
          <draggable
            v-model="draggableItems"
            item-key="id"
            :delay="200"
            :delay-on-touch-only="true"
            :group="{
              name: 'items',
              pull: true,
              put: function (to, from, dragEl, evt) {
                // Only allow items to be dropped in item containers, not categories
                return from.options.group.name === 'items';
              },
            }"
            :animation="200"
            :ghost-class="'ghost-item'"
            :chosen-class="'chosen-item'"
            :drag-class="'drag-item'"
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
                  @update:item="$emit('update:item', $event)"
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

import { computed, nextTick, ref, watch } from 'vue';
import draggable from 'vuedraggable';

import { Category } from '../models/Category';
import AddItemButton from './AddItemButton.vue';
import Item from './Item.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
const props = defineProps({
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
]);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Editing state
const isEditing = ref(false);
const editedName = ref('');
const editInput = ref(null);
const isComposing = ref(false);

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

// Draggable items (two-way binding with vuedraggable)
const draggableItems = computed({
  get() {
    return sortedItems.value;
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
  if (!isComposing.value) {
    saveEdit();
  }
}

/**
 * Enter edit mode and focus on the category name input
 */
async function startEdit() {
  isEditing.value = true;
  editedName.value = props.category.name;

  await nextTick();
  if (editInput.value) {
    editInput.value.focus();
    editInput.value.select();
    // Scroll the input into view to prevent keyboard from covering it on mobile
    setTimeout(() => {
      editInput.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
}

/**
 * Save the edited category name if changed
 */
function saveEdit() {
  const hasNameChanged = editedName.value.trim() && editedName.value !== props.category.name;

  if (hasNameChanged) {
    const updatedCategory = new Category({
      ...props.category,
      name: editedName.value.trim(),
    });
    emit('update:category', updatedCategory);
  }
  isEditing.value = false;
}

/**
 * Cancel editing and restore original category name
 */
function cancelEdit() {
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

    // Get current items in this category (excluding the newly added item)
    const currentCategoryItems = sortedItems.value.filter((i) => i.id !== item.id);

    // Create updated item with new category and order
    const updatedItem = {
      ...item,
      categoryId: props.category.id,
      order: newIndex,
    };

    // Shift down items that come after the insertion point
    const reorderedItems = currentCategoryItems.map((existingItem, index) => {
      let newOrder = index;
      if (index >= newIndex) {
        newOrder = index + 1;
      }
      return {
        ...existingItem,
        order: newOrder,
      };
    });

    emit('move:item', {
      item: updatedItem,
      reorderedItems: reorderedItems,
      newCategoryId: props.category.id,
      oldCategoryId: item.categoryId,
      newIndex: newIndex,
      type: 'move',
    });
  }

  // Case 2: Same-category reorder
  // When an item is moved within the same category
  if (event.moved) {
    const oldIndex = event.moved.oldIndex;
    const newIndex = event.moved.newIndex;

    // Build the new order by simulating the move
    const items = [...sortedItems.value];
    const [removed] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, removed);

    // Renumber all items based on the new order
    const itemsWithNewOrder = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    emit('move:item', {
      items: itemsWithNewOrder,
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
</script>

<style scoped>
/* Drag and drop styles */
.ghost-item {
  opacity: 0.3;
  background: var(--color-gray-gray-100);
  border: 2px dashed var(--color-gray-gray-400);
}

.chosen-item {
  cursor: grabbing !important;
}

.drag-item {
  opacity: 0.5;
  transform: scale(1.05);
  box-shadow:
    0 10px 15px -3px var(--color-shadow-black-10),
    0 4px 6px -2px var(--color-shadow-black-5);
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
  background-color: var(--color-blue-blue-50);
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
    border-color: var(--color-green-green-600);
  }
}

.flash-success {
  animation: flash-success 0.6s ease-in-out;
}
</style>
