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
      'p-3 rounded-xl shadow-md transition-all duration-200 group',
      isCompleted ? 'bg-green-50 hover:shadow-lg' : 'bg-white hover:shadow-lg'
    ]"
  >
    <!-- Category Header -->
    <div class="flex items-center justify-between mb-3 relative">
      <div class="flex-grow">
        <input
          v-if="isEditing"
          :id="`category-${category.id}-name`"
          :name="`category-${category.id}-name`"
          v-model="editedName"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          @blur="saveEdit"
          ref="editInput"
          class="w-full text-xl font-semibold text-slate-800 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500"
        >
        <h3
          v-else
          class="text-xl font-semibold text-primary cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
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
        @edit="startEdit"
        @delete="handleDelete"
        class="ml-2"
      />
    </div>

    <!-- Category Progress Bar -->
    <ProgressBar
      :total="sortedItems.length"
      :completed="sortedItems.filter(item => item.isPacked).length"
      class="mb-3"
    />

    <!-- Items List -->
    <div class="space-y-0.5">
      <draggable
        v-model="draggableItems"
        :group="{ 
          name: 'items', 
          pull: true, 
          put: function(to, from, dragEl, evt) {
            // Only allow items to be dropped in item containers, not categories
            return from.options.group.name === 'items';
          }
        }"
        item-key="id"
        :animation="200"
        :ghost-class="'ghost-item'"
        :chosen-class="'chosen-item'"
        :drag-class="'drag-item'"
        @start="onItemDragStart"
        @end="onItemDragEnd"
        @add="onItemAdd"
        @remove="onItemRemove"
        @update="onItemUpdate"
      >
        <template #item="{ element: item }">
          <div :key="item.id" :data-item-id="item.id">
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
        class="px-2 py-1 text-sm"
        :category-completed="isCompleted"
        @click="$emit('create:item', category.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { Category } from '../models/Category';
import AddItemButton from './AddItemButton.vue';
import Item from './Item.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';

// ----------------------
// Props & Emits
// ----------------------

// Props
const props = defineProps({
  category: {
    type: Object,
    required: true,
    validator: (value) => {
      // Validate that the object has the required properties for a category
      return value &&
             typeof value.id === 'string' &&
             typeof value.name === 'string' &&
             typeof value.checklistId === 'string';
    }
  },
  items: {
    type: Array,
    required: true
  },
  newlyCreatedItemId: {
    type: String,
    default: null
  },
  newlyCreatedCategoryId: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits([
  'update:item',
  'delete:item',
  'create:item',
  'update:category',
  'delete:category',
  'move:item'
]);

// ----------------------
// States
// ----------------------

// Editing state
const isEditing = ref(false);
const editedName = ref('');
const editInput = ref(null);

// Drag state
const draggingItemId = ref(null);

// ----------------------
// Computed
// ----------------------

// Sorted items for this category (filtered from all items, then sorted by order)
const sortedItems = computed(() => {
  const filteredItems = props.items.filter(item => item.categoryId === props.category.id);
  // Sort by order field to maintain correct sequence
  return filteredItems.sort((a, b) => (a.order || 0) - (b.order || 0));
});

// Draggable items (two-way binding with vuedraggable)
const draggableItems = computed({
  get() {
    return sortedItems.value;
  },
  set(newItems) {
    // When vuedraggable updates the array, emit the reorder event
    // Check if this is a cross-category move (new item added)
    const currentItemIds = new Set(sortedItems.value.map(i => i.id));
    const newItemIds = new Set(newItems.map(i => i.id));
    const addedItems = newItems.filter(item => !currentItemIds.has(item.id));
    const removedItems = sortedItems.value.filter(item => !newItemIds.has(item.id));
    
    if (addedItems.length > 0) {
      // Don't handle cross-category moves here, let onItemAdd handle them
      return;
    }
    
    if (removedItems.length > 0) {
      // Don't handle cross-category moves here, let onItemRemove handle them
      return;
    }
    
    // This is a same-category reorder
    const itemsWithNewOrder = newItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    emit('move:item', {
      items: itemsWithNewOrder,
      categoryId: props.category.id,
      type: 'reorder'
    });
  }
});

// Completing state
const isCompleted = computed(() => {
  const items = sortedItems.value;
  if (!items.length) return false;
  return items.every(i => i.isPacked);
});

// ----------------------
// Editing functions
// ----------------------

// Start editing mode
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
function saveEdit() {
  const hasNameChanged = editedName.value.trim() && editedName.value !== props.category.name;

  if (hasNameChanged) {
    const updatedCategory = new Category({
      ...props.category,
      name: editedName.value.trim()
    });
    emit('update:category', updatedCategory);
  }
  isEditing.value = false;
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false;
  editedName.value = props.category.name;
}

// ----------------------
// Category management
// ----------------------

// Handle delete action
function handleDelete() {
  emit('delete:category', props.category.id);
}

// ----------------------
// Drag and drop handlers (vuedraggable events)
// ----------------------

// Track which item is being dragged
function onItemDragStart(evt) {
  const item = evt.item.querySelector('[data-item-id]');
  if (item) {
    draggingItemId.value = item.dataset.itemId;
  }
}

// Clean up drag state when drag ends
function onItemDragEnd(evt) {
  draggingItemId.value = null;
}

// Handle same-category reorder (handled by draggableItems setter instead)
function onItemUpdate(evt) {
  // This event is now handled by the draggableItems setter
}

// Handle item moved from another category to this category
function onItemAdd(evt) {
  // Handle item moved from another category
  const newElement = evt.item;
  const itemId = newElement.getAttribute('data-item-id');
  
  if (itemId) {
    const item = props.items.find(i => i.id === itemId);
    if (item && item.categoryId !== props.category.id) {
      
      // Get current items in this category (excluding the newly added item)
      const currentCategoryItems = sortedItems.value.filter(i => i.id !== itemId);
      
      // Create new item with updated category and order
      const updatedItem = {
        ...item,
        categoryId: props.category.id,
        order: evt.newIndex
      };
      
      // Update order of existing items that come after the insertion point
      const reorderedItems = currentCategoryItems.map((existingItem, index) => {
        let newOrder = index;
        if (index >= evt.newIndex) {
          newOrder = index + 1; // Shift items down
        }
        return {
          ...existingItem,
          order: newOrder
        };
      });
      
      emit('move:item', {
        item: updatedItem,
        reorderedItems: reorderedItems,
        newCategoryId: props.category.id,
        oldCategoryId: item.categoryId,
        newIndex: evt.newIndex,
        type: 'move'
      });
    }
  }
}

// Handle item moved from this category to another category
function onItemRemove(evt) {
  // After item removal, reorder the remaining items
  setTimeout(() => {
    const remainingItems = sortedItems.value.map((item, index) => ({
      ...item,
      order: index
    }));
    
    if (remainingItems.length > 0) {
      emit('move:item', {
        items: remainingItems,
        categoryId: props.category.id,
        type: 'reorder'
      });
    }
  }, 10);
}

// ----------------------
// Watchers
// ----------------------

// Watch for newly created category and auto-start edit
watch(() => props.newlyCreatedCategoryId, (newId) => {
  if (newId === props.category.id) {
    nextTick(() => {
      startEdit();
    });
  }
});

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
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
  0%, 100% { border-color: transparent; }
  50% { border-color: #10b981; }
}

.flash-success {
  animation: flash-success 0.6s ease-in-out;
}
</style>
