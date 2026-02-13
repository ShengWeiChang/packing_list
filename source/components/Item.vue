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
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div
    :class="[
      'group flex cursor-grab items-center rounded-md px-1 py-0.5 transition-all duration-200 md:pl-2',
      categoryCompleted
        ? 'bg-success-state-bg text-success-state-complete'
        : 'bg-white hover:bg-interactive-hover',
      isDragging ? 'scale-105 cursor-grabbing opacity-50 shadow-lg' : '',
    ]"
    data-testid="item-row"
    :data-item-id="item.id"
    @mouseenter="handleMouseEnter"
    @mouseleave="isHovered = false"
    @focusin="isHovered = true"
    @focusout="isHovered = false"
  >
    <div
      class="mr-1 flex size-9 flex-none items-center justify-center rounded-lg focus-within:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-interactive-focus has-[:focus-visible]:ring-offset-1 md:mr-2 md:size-6"
    >
      <input
        :id="`item-${item.id}-packed`"
        v-model="isItemPacked"
        :name="`item-${item.id}-packed`"
        type="checkbox"
        data-testid="item-checkbox"
        :aria-label="$t('item.togglePacked')"
        :class="[
          'size-5 flex-none shrink-0 cursor-pointer focus:outline-none md:size-4',
          isItemPacked
            ? 'border-success-state-border accent-success-state-accent'
            : 'border-border-color-medium accent-control-accent',
        ]"
        :style="isItemPacked ? { accentColor: 'var(--theme-primary)' } : {}"
      />
    </div>

    <!-- Item name - editable when in edit mode -->
    <div
      class="grow"
      @blur="handleEditBlur"
      @focusout="handleEditBlur"
    >
      <input
        v-if="isEditing"
        :id="`item-${item.id}-name`"
        ref="editInput"
        v-model="editedName"
        :name="`item-${item.id}-name`"
        :aria-label="$t('item.name')"
        data-testid="item-edit-input"
        :class="[
          'w-full bg-transparent px-1 py-0.5 text-lg leading-snug focus:outline-none md:text-base',
          {
            'text-secondary line-through': item.isPacked,
          },
        ]"
        style="border-radius: 0; box-shadow: inset 0 -2px 0 0 var(--interactive-focus)"
        @keydown.enter="handleEnterKey"
        @keyup.escape="cancelEdit"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      />

      <span
        v-else
        :class="[
          'block cursor-pointer rounded-lg px-1 py-0.5 text-lg leading-snug hover:bg-interactive-hover-light focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:text-base',
          {
            'text-secondary line-through': item.isPacked,
          },
        ]"
        style="word-break: break-word; overflow-wrap: break-word"
        role="button"
        tabindex="0"
        data-testid="item-name"
        @click="startEdit"
        @keydown.enter.prevent="startEdit"
        @keydown.space.prevent="startEdit"
      >
        {{ item.name }}
      </span>
    </div>

    <!-- Pending (to-buy / to-do) icon button - always visible; toggling will clear packed state to keep states mutually exclusive -->
    <button
      type="button"
      :class="[
        'ml-1.5 flex size-9 flex-none items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 sm:ml-2 md:size-6',
        item.isPending
          ? 'bg-pending-button text-white hover:bg-pending-accent'
          : 'bg-control-bg text-secondary hover:bg-control-hover',
        pendingButtonVisibilityClass,
        'focus:pointer-events-auto focus:static focus:opacity-100', // Ensure visible on focus
      ]"
      data-testid="item-pending-toggle"
      :title="item.isPending ? $t('item.markedAsPending') : $t('item.markAsPending')"
      :aria-label="item.isPending ? $t('item.markedAsPending') : $t('item.markAsPending')"
      @click.stop="togglePending"
      @mousedown.prevent
    >
      <!-- clipboard with checklist icon -->
      <svg
        class="size-4"
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
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <div
      class="relative ml-1 sm:ml-1.5"
      :class="[
        isEditing || item.quantity > 1 || (item.quantity === 1 && isHovered)
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none absolute opacity-0 md:static',
        'focus-within:pointer-events-auto focus-within:static focus-within:opacity-100', // Ensure visible when children have focus
      ]"
      data-testid="item-quantity-controls"
      @mouseenter="isQuantityHovered = true"
      @mouseleave="isQuantityHovered = false"
      @focusin="isQuantityHovered = true"
      @focusout="isQuantityHovered = false"
    >
      <!-- Quantity stepper: [-] [x5] [+] -->
      <div class="flex items-center gap-1">
        <!-- Decrement button / Delete button (when quantity = 1) -->
        <button
          type="button"
          class="flex size-9 flex-none items-center justify-center rounded-lg bg-control-bg text-secondary transition-colors hover:bg-control-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:size-6"
          :class="buttonVisibilityClass"
          data-testid="item-quantity-decrement"
          :aria-label="item.quantity === 1 ? $t('common.delete') : $t('item.decreaseQuantity')"
          :title="item.quantity === 1 ? $t('common.delete') : $t('item.decreaseQuantity')"
          @click.stop="item.quantity === 1 ? handleDelete() : decrementQuantity()"
          @mousedown.prevent
        >
          <!-- Trash icon when quantity is 1 -->
          <svg
            v-if="item.quantity === 1"
            class="size-4"
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
            class="size-3.5"
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
          class="flex h-9 w-8 items-center justify-center rounded-lg bg-control-bg px-1 text-xs font-semibold text-secondary transition-colors hover:bg-control-hover md:h-6"
          :class="{ 'bg-transparent': !isHovered && !isEditing && item.quantity > 1 }"
          data-testid="item-quantity-value"
        >
          <span class="mr-0.5">x</span>
          <span>{{ item.quantity }}</span>
        </div>

        <!-- Increment button -->
        <button
          type="button"
          class="flex size-9 flex-none items-center justify-center rounded-lg bg-control-bg text-secondary transition-colors hover:bg-control-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:size-6"
          :class="buttonVisibilityClass"
          data-testid="item-quantity-increment"
          :aria-label="$t('item.increaseQuantity')"
          :title="$t('item.increaseQuantity')"
          @click.stop="incrementQuantity"
          @mousedown.prevent
        >
          <svg
            class="size-3.5"
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
      class="ml-1"
      @edit="startEdit"
      @copy="$emit('copy:item', item.id)"
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
const emit = defineEmits(['update:item', 'copy:item', 'delete:item']);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

const isEditing = ref(false);
const isHovered = ref(false);
const isQuantityHovered = ref(false);
const editedName = ref('');
const editInput = ref(null);
const isComposing = ref(false);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

/**
 * Button visibility classes for mobile/desktop
 * Mobile: hidden when not hovered/editing (completely removed from layout)
 * Desktop: invisible when not hovered/editing (preserves layout space)
 */
const buttonVisibilityClass = computed(() => {
  const shouldShow = isHovered.value || isEditing.value;
  return shouldShow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';
});

/**
 * Pending button visibility (includes isPending state)
 */
const pendingButtonVisibilityClass = computed(() => {
  const shouldShow = props.item.isPending || isHovered.value || isEditing.value;
  return shouldShow
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none absolute md:static';
});

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

// ---------- UI Handlers ----------

// Handle mouse enter - prevent hover state on touch devices to avoid accidental button clicks
const handleMouseEnter = () => {
  // Only enable hover state if the device supports hover (i.e., has a mouse/pointer)
  if (window.matchMedia('(hover: hover)').matches) {
    isHovered.value = true;
  }
};

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
 * Save edit when focus moves outside the edit area
 * Includes IME composition check for defensive programming
 * @param {Event} _event - Blur event (unused)
 */
function handleEditBlur(_event) {
  // Use a small timeout to allow focus to move to another element
  setTimeout(() => {
    // Check if focus is still within the name input
    const activeElement = document.activeElement;
    const isStillEditing = activeElement === editInput.value;

    // Only save if not editing and not in IME composition
    if (!isStillEditing && isEditing.value && !isComposing.value) {
      saveEdit();
    }
  }, 50); // 50ms: balance between focus transfer reliability and user responsiveness
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
    // Scroll the input into view to prevent keyboard from covering it on mobile
    setTimeout(() => {
      editInput.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
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

// ---------- Item Actions ----------

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
