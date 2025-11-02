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
        'mr-1.5 h-4 w-4 flex-none flex-shrink-0 rounded-full sm:mr-2',
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
          'w-full border-b border-blue-300 bg-transparent px-1 py-1 text-base leading-none focus:border-blue-500 focus:outline-none',
          {
            'text-secondary line-through': item.isPacked,
          },
        ]"
        style="border-radius: 0"
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

    <!-- Pending (to-buy / to-do) icon button - always visible; toggling will clear packed state to keep states mutually exclusive -->
    <button
      type="button"
      :class="[
        'ml-1.5 flex h-6 w-6 flex-none items-center justify-center rounded-full transition-colors duration-200 sm:ml-2',
        item.isPending
          ? 'bg-orange-500 text-white hover:bg-orange-600'
          : 'bg-gray-200 text-gray-400 hover:bg-gray-300',
        item.isPending || isHovered || isEditing ? 'visible' : 'invisible',
      ]"
      :title="item.isPending ? $t('item.markedAsPending') : $t('item.markAsPending')"
      :aria-label="item.isPending ? $t('item.markedAsPending') : $t('item.markAsPending')"
      @click.stop="togglePending"
      @mousedown.prevent
    >
      <!-- clipboard with checklist icon -->
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- Quantity control - Amazon-style stepper -->
    <div
      class="relative ml-1 sm:ml-1.5"
      :class="
        isEditing || item.quantity > 1 || (item.quantity === 1 && isHovered)
          ? 'visible'
          : 'invisible'
      "
      @mouseenter="isQuantityHovered = true"
      @mouseleave="isQuantityHovered = false"
    >
      <!-- Quantity stepper: [-] [x5] [+] -->
      <div class="flex items-center gap-0">
        <!-- Decrement button / Delete button (when quantity = 1) -->
        <button
          type="button"
          class="text-secondary flex h-6 w-6 flex-none items-center justify-center rounded-md bg-gray-100 transition-colors hover:bg-gray-200"
          :class="isHovered || isEditing ? 'visible' : 'invisible'"
          :title="item.quantity === 1 ? $t('common.delete') : $t('item.decreaseQuantity')"
          @click.stop="item.quantity === 1 ? handleDelete() : decrementQuantity()"
          @mousedown.prevent
        >
          <!-- Trash icon when quantity is 1 -->
          <svg
            v-if="item.quantity === 1"
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>

          <!-- Minus icon when quantity > 1 -->
          <svg
            v-else
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20 12H4"
            />
          </svg>
        </button>

        <!-- Quantity display -->
        <div
          class="text-secondary flex h-6 w-8 items-center justify-center rounded-md bg-gray-100 px-1 text-xs font-semibold transition-colors hover:bg-gray-200"
        >
          <span class="mr-0.5">x</span>
          <span>{{ item.quantity }}</span>
        </div>

        <!-- Increment button -->
        <button
          type="button"
          class="text-secondary flex h-6 w-6 flex-none items-center justify-center rounded-md bg-gray-100 transition-colors hover:bg-gray-200"
          :class="isHovered || isEditing ? 'visible' : 'invisible'"
          :title="$t('item.increaseQuantity')"
          @click.stop="incrementQuantity"
          @mousedown.prevent
        >
          <svg
            class="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Overflow menu -->
    <OverflowMenu
      :item-id="item.id"
      :force-visible="isHovered"
      :use-group-hover="false"
      :is-editing="isEditing"
      menu-type="item"
      alignment="left"
      class="ml-0"
      @edit="startEdit"
      @delete="handleDelete"
      @confirm-edit="saveEdit"
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
        typeof value.isPending === 'boolean' &&
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

const isEditing = ref(false);
const isHovered = ref(false);
const isQuantityHovered = ref(false);
const editedName = ref('');
const editInput = ref(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

const isItemPacked = computed({
  get: () => {
    return props.item.isPacked;
  },
  set: (newValue) => {
    const updatedItem = new Item({
      id: props.item.id,
      name: props.item.name,
      quantity: props.item.quantity,
      categoryId: props.item.categoryId,
      isPacked: newValue,
      isPending: newValue ? false : props.item.isPending, // Auto-clear isPending when packed
      checklistId: props.item.checklistId,
      order: props.item.order,
    });
    emit('update:item', updatedItem);
  },
});

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Toggle the pending state of the item (to-buy / to-do)
 */
function togglePending() {
  const newPending = !props.item.isPending;
  const updatedItem = new Item({
    ...props.item,
    isPending: newPending,
    // If user marks as pending, automatically clear packed state to avoid contradiction
    isPacked: newPending ? false : props.item.isPacked,
  });
  emit('update:item', updatedItem);
}

/**
 * Increment item quantity
 */
function incrementQuantity() {
  const updatedItem = new Item({
    ...props.item,
    quantity: props.item.quantity + 1,
  });
  emit('update:item', updatedItem);
}

/**
 * Decrement item quantity (minimum 1)
 */
function decrementQuantity() {
  if (props.item.quantity <= 1) return;

  const updatedItem = new Item({
    ...props.item,
    quantity: props.item.quantity - 1,
  });
  emit('update:item', updatedItem);
}

/**
 * Save edit when focus moves outside the edit area
 * @param {Event} _event - Blur event (unused)
 */
function handleEditBlur(_event) {
  // Use a small timeout to allow focus to move to another element
  setTimeout(() => {
    // Check if focus is still within the name input
    const activeElement = document.activeElement;
    const isStillEditing = activeElement === editInput.value;

    if (!isStillEditing && isEditing.value) {
      saveEdit();
    }
  }, 10);
}

/**
 * Enter edit mode and focus on item name input
 */
async function startEdit() {
  isEditing.value = true;
  editedName.value = props.item.name;

  await nextTick();
  if (editInput.value) {
    editInput.value.focus();
    editInput.value.select();
  }
}

/**
 * Save changes to item if name was modified
 */
function saveEdit() {
  const hasNameChanged = editedName.value.trim() && editedName.value !== props.item.name;

  if (hasNameChanged) {
    const updatedItem = new Item({
      ...props.item,
      name: editedName.value.trim() || props.item.name,
    });
    emit('update:item', updatedItem);
  }
  isEditing.value = false;
}

/**
 * Cancel editing and restore original values
 */
function cancelEdit() {
  isEditing.value = false;
  editedName.value = props.item.name;
}

/**
 * Emit delete event for this item
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
