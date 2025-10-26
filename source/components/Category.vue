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
      'group rounded-xl p-3 shadow-md transition-all duration-200',
      isCompleted ? 'bg-green-50 hover:shadow-lg' : 'bg-white hover:shadow-lg',
    ]"
  >
    <!-- Category Header -->
    <div class="relative mb-3 flex items-center justify-between">
      <div class="flex-grow">
        <input
          v-if="isEditing"
          :id="`category-${category.id}-name`"
          ref="editInput"
          v-model="editedName"
          :name="`category-${category.id}-name`"
          class="w-full border-b border-blue-300 bg-transparent text-xl font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          @blur="saveEdit"
        />
        <h3
          v-else
          class="text-primary cursor-pointer rounded px-1 py-1 text-xl font-semibold hover:bg-gray-50"
          @click="startEdit"
        >
          {{ category.name }}
        </h3>
      </div>

      <!-- Overflow menu -->
      <OverflowMenu
        :item-id="category.id"
        menu-type="category"
        alignment="left"
        class="ml-2"
        @edit="startEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Category Progress Bar -->
    <ProgressBar
      :total="sortedItems.length"
      :completed="sortedItems.filter((item) => item.isPacked).length"
      class="mb-3"
    />

    <!-- Items List -->
    <div class="space-y-0.5">
      <draggable
        v-model="draggableItems"
        item-key="id"
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
              @delete:item="$emit('delete:item', $event)"
            />
          </div>
        </template>
      </draggable>

      <AddItemButton
        :category-completed="isCompleted"
        class="px-2 py-1 text-sm"
        @click="$emit('create:item', category.id)"
      />
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
  'delete:item',
  'create:item',
  'update:category',
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

// Drag state
const draggingItemId = ref(null);

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
// Editing functions
// ------------------------------------------------------------------------------

// Start editing mode
/**
 *
 */
async function startEdit() {
  isEditing.value = true;
  editedName.value = props.category.name;

  await nextTick();
  if (editInput.value) {
    editInput.value.focus();
    editInput.value.select();
  }
}

// Save edited category
/**
 *
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

// Cancel editing
/**
 *
 */
function cancelEdit() {
  isEditing.value = false;
  editedName.value = props.category.name;
}

// ------------------------------------------------------------------------------
// Category management
// ------------------------------------------------------------------------------

// Handle delete action
/**
 *
 */
function handleDelete() {
  emit('delete:category', props.category.id);
}

// ------------------------------------------------------------------------------
// Drag and drop handlers (vuedraggable events)
// ------------------------------------------------------------------------------

// Track which item is being dragged
/**
 *
 * @param evt
 */
function onItemDragStart(evt) {
  const item = evt.item.querySelector('[data-item-id]');
  if (item) {
    draggingItemId.value = item.dataset.itemId;
  }
}

// Clean up drag state when drag ends
/**
 *
 * @param _evt
 */
function onItemDragEnd(_evt) {
  draggingItemId.value = null;
}

// Handle item change events from vuedraggable
/**
 *
 * @param evt
 */
function onItemChange(evt) {
  // Case 1: Cross-category move (target side)
  // When an item is dragged from another category to this one
  // Note: evt.removed is intentionally ignored.
  // The category's order will be corrected by a data refresh from the parent component, avoiding race conditions from simultaneous updates.
  if (evt.added) {
    const item = evt.added.element;
    const newIndex = evt.added.newIndex;

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
  if (evt.moved) {
    const oldIndex = evt.moved.oldIndex;
    const newIndex = evt.moved.newIndex;

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
  background: #f3f4f6;
  border: 2px dashed #9ca3af;
}

.chosen-item {
  cursor: grabbing !important;
}

.drag-item {
  opacity: 0.5;
  transform: scale(1.05);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
  background-color: rgb(239 246 255);
}

.border-dashed {
  border-style: dashed;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Success flash animation */
@keyframes flash-success {
  0%,
  100% {
    border-color: transparent;
  }
  50% {
    border-color: #10b981;
  }
}

.flash-success {
  animation: flash-success 0.6s ease-in-out;
}
</style>
