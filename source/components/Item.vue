<!--
================================================================================
File: source/components/Item.vue
Description: Item component - displays a single packing item with inline edit
             and packing checkbox behavior.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div
    :class="[
      'group flex cursor-grab items-center rounded-md py-0.5 pl-2 pr-1 transition-all duration-200',
      categoryCompleted ? 'bg-green-50 text-green-800' : 'bg-white hover:bg-gray-100',
      isDragging ? 'scale-105 cursor-grabbing opacity-50 shadow-lg' : '',
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <input
      :id="`item-${item.id}-packed`"
      v-model="isItemPacked"
      :name="`item-${item.id}-packed`"
      type="checkbox"
      :class="[
        'mr-2 h-4 w-4 flex-none flex-shrink-0 rounded-full',
        isItemPacked ? 'border-green-300 accent-green-600' : 'border-gray-300 accent-gray-600',
      ]"
      :style="isItemPacked ? { accentColor: 'var(--color-theme-primary)' } : {}"
    />

    <!-- Item name - editable when in edit mode -->
    <div
      class="flex-grow"
      @blur="handleEditBlur"
      @focusout="handleEditBlur"
    >
      <input
        v-if="isEditing"
        :id="`item-${item.id}-name`"
        ref="editInput"
        v-model="editedName"
        :name="`item-${item.id}-name`"
        :class="[
          'w-full border-b border-blue-300 bg-transparent text-base focus:border-blue-500 focus:outline-none',
          {
            'text-secondary line-through': item.isPacked,
          },
        ]"
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
      />

      <span
        v-else
        :class="[
          'cursor-pointer rounded px-1 py-1 text-base hover:bg-gray-50',
          {
            'text-secondary line-through': item.isPacked,
          },
        ]"
        @click="startEdit"
      >
        {{ item.name }}
      </span>
    </div>

    <!-- Quantity - editable when in edit mode, hidden when quantity is 1 -->
    <div
      v-if="isEditing || item.quantity > 1"
      class="ml-2"
      @blur="handleEditBlur"
      @focusout="handleEditBlur"
    >
      <input
        v-if="isEditing"
        :id="`item-${item.id}-quantity`"
        ref="quantityInput"
        v-model.number="editedQuantity"
        :name="`item-${item.id}-quantity`"
        type="number"
        min="1"
        class="text-secondary w-12 rounded-full border border-gray-300 bg-gray-100 px-1 py-0.5 text-center text-xs font-semibold focus:border-gray-500 focus:outline-none"
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        @click.stop
      />

      <span
        v-else-if="item.quantity > 1"
        class="text-secondary rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-semibold"
      >
        x{{ item.quantity }}
      </span>
    </div>

    <!-- Overflow menu -->
    <OverflowMenu
      :item-id="item.id"
      :force-visible="isHovered"
      :use-group-hover="false"
      menu-type="item"
      alignment="left"
      class="ml-2"
      @edit="startEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, nextTick, ref, watch } from 'vue';

import { Item } from '../models/Item';
import OverflowMenu from './OverflowMenu.vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true,
    validator: (value) => {
      // Validate that the object has the required properties for an item
      return (
        value &&
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.quantity === 'number' &&
        typeof value.categoryId === 'string' &&
        typeof value.isPacked === 'boolean' &&
        typeof value.checklistId === 'string'
      );
    },
  },
  newlyCreatedItemId: {
    type: String,
    default: null,
  },
  categoryCompleted: {
    type: Boolean,
    default: false,
  },
  isDragging: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['update:item', 'delete:item']);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Editing state
const isEditing = ref(false);
const isHovered = ref(false);
const editedName = ref('');
const editedQuantity = ref(1);
const editInput = ref(null);
const quantityInput = ref(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Packing state
const isItemPacked = computed({
  get: () => {
    return props.item.isPacked;
  },
  set: (newValue) => {
    // update emitted to parent

    const updatedItem = new Item({
      id: props.item.id,
      name: props.item.name,
      quantity: props.item.quantity,
      categoryId: props.item.categoryId,
      isPacked: newValue,
      checklistId: props.item.checklistId,
      order: props.item.order, // Preserve order to prevent reordering
    });
    emit('update:item', updatedItem);
  },
});

// ------------------------------------------------------------------------------
// Editing functions
// ------------------------------------------------------------------------------

// Handle edit blur - only save if focus is moving outside edit area
/**
 *
 * @param _event
 */
function handleEditBlur(_event) {
  // Use a small timeout to allow focus to move to the other input
  setTimeout(() => {
    // Check if focus is still within editing elements
    const activeElement = document.activeElement;
    const isStillEditing =
      activeElement === editInput.value || activeElement === quantityInput.value;

    if (!isStillEditing && isEditing.value) {
      saveEdit();
    }
  }, 10);
}

// Start editing mode
/**
 *
 */
async function startEdit() {
  isEditing.value = true;
  editedName.value = props.item.name;
  editedQuantity.value = props.item.quantity;

  await nextTick();
  if (editInput.value) {
    editInput.value.focus();
    editInput.value.select();
  }
}

// Save edited item
/**
 *
 */
function saveEdit() {
  const hasNameChanged = editedName.value.trim() && editedName.value !== props.item.name;
  const hasQuantityChanged = editedQuantity.value !== props.item.quantity;

  if (hasNameChanged || hasQuantityChanged) {
    const updatedItem = new Item({
      ...props.item,
      name: editedName.value.trim() || props.item.name,
      quantity: Math.max(1, editedQuantity.value), // Ensure quantity is at least 1
    });
    emit('update:item', updatedItem);
  }
  isEditing.value = false;
}

// Cancel editing
/**
 *
 */
function cancelEdit() {
  isEditing.value = false;
  editedName.value = props.item.name;
  editedQuantity.value = props.item.quantity;
}

// ------------------------------------------------------------------------------
// Item management
// ------------------------------------------------------------------------------

// Handle delete action
/**
 *
 */
function handleDelete() {
  emit('delete:item', props.item.id);
}

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

// Watch for newly created items and auto-start edit
watch(
  () => props.newlyCreatedItemId,
  (newId) => {
    if (newId === props.item.id) {
      nextTick(() => {
        startEdit();
      });
    }
  }
);
</script>
