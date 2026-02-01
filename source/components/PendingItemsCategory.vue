<!--
================================================================================
File: source/components/PendingItemsCategory.vue
Description: Special virtual category component for displaying pending items
             (to-buy / to-do). Provides a simplified view with completion
             functionality.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-11-01
================================================================================
-->

<template>
  <div
    v-if="pendingItems.length > 0"
    class="group rounded-xl p-3 shadow-md transition-all duration-200 hover:shadow-lg"
    :style="{ backgroundColor: THEME_COLORS.pending }"
  >
    <!-- Header -->
    <div class="relative mb-3 flex items-center justify-between">
      <div class="grow">
        <h3
          class="cursor-pointer rounded p-1 text-xl font-semibold text-primary"
          :style="{ color: THEME_COLORS.pendingForeground }"
        >
          {{ $t('category.shoppingList') }}
        </h3>
      </div>

      <!-- Item count (replaces overflow menu) -->
      <span
        class="font-medium"
        :style="{ color: THEME_COLORS.pendingAccent }"
      >
        {{ pendingItems.length }} {{ $t('category.itemsLeft') }}
      </span>
    </div>

    <!-- Items grid - multi-column layout matching category columns -->
    <div class="pending-items-grid">
      <div
        v-for="item in pendingItems"
        :key="item.id"
        class="group flex items-center rounded-md px-1 py-0.5 transition-all duration-200"
      >
        <!-- Completion button (left side) - mark as completed -->
        <button
          type="button"
          class="mr-1.5 flex size-5 flex-none shrink-0 items-center justify-center rounded-full bg-pending-button text-white transition-all hover:scale-110 sm:mr-2"
          :title="$t('item.markAsBought')"
          :aria-label="$t('item.markAsBought')"
          @click.stop="markAsCompleted(item)"
        >
          <!-- Checkmark icon -->
          <svg
            class="size-4"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 5L19 7"
            />
          </svg>
        </button>

        <!-- Item name and optional quantity -->
        <div class="flex grow items-center gap-1">
          <span class="truncate text-base text-primary">
            {{ item.name }}
          </span>

          <!-- Quantity display (only show if quantity > 1) -->
          <div
            v-if="item.quantity > 1"
            class="flex h-6 w-8 shrink-0 items-center justify-center rounded-md bg-control-bg px-1 text-xs font-semibold text-secondary"
          >
            <span class="mr-0.5">x</span>
            <span>{{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed } from 'vue';

import { Item } from '../models/Item';
import { THEME_COLORS } from '../utils/constants';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (items) => {
      return items.every(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.isPending === 'boolean'
      );
    },
  },
});

const emit = defineEmits(['update:item']);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

/**
 * Filter items that are marked as pending (to-buy / to-do)
 */
const pendingItems = computed(() => {
  return props.items.filter((item) => item.isPending);
});

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Mark an item as completed by removing the isPending flag
 * This will automatically remove it from the pending items list
 * @param {object} item - The item to mark as completed
 */
function markAsCompleted(item) {
  const updatedItem = new Item({
    ...item,
    isPending: false, // Remove from pending items list
    // isPacked remains unchanged - completing doesn't mean packing
  });
  emit('update:item', updatedItem);
}
</script>

<style scoped>
/* Pending complete button - uses CSS variables for consistent theming */
.pending-complete-btn {
  background-color: var(--pending-button);
}

.pending-complete-btn:hover,
.pending-complete-btn:focus {
  background-color: var(--pending-accent);
}

/* Multi-column grid layout matching category columns */
.pending-items-grid {
  display: grid;
  column-gap: 2.25rem;
  row-gap: 0.25rem;
  grid-template-columns: 1fr;
}

/* Match category column breakpoints (values from index.css :root) */
/* Source: index.css --breakpoint-tablet */
@media (min-width: 768px) {
  .pending-items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Source: index.css --breakpoint-desktop */
@media (min-width: 1180px) {
  .pending-items-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Source: index.css --breakpoint-large-desktop */
@media (min-width: 1536px) {
  .pending-items-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
