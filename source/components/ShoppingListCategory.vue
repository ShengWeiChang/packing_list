<!--
================================================================================
File: source/components/ShoppingListCategory.vue
Description: Special virtual category component for displaying items marked as "to buy"
             Provides a simplified view with shopping cart functionality only
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-11-01
================================================================================
-->

<template>
  <div
    v-if="toBuyItems.length > 0"
    class="group rounded-xl p-3 shadow-md transition-all duration-200 hover:shadow-lg"
    :style="{ backgroundColor: THEME_COLORS.SHOPPING_CART.BACKGROUND }"
  >
    <!-- Header -->
    <div class="relative mb-3 flex items-center justify-between">
      <div class="flex-grow">
        <h3
          class="text-primary cursor-pointer rounded px-1 py-1 text-xl font-semibold"
          :style="{ color: THEME_COLORS.SHOPPING_CART.TEXT }"
        >
          {{ $t('category.shoppingList') }}
        </h3>
      </div>

      <!-- Item count (replaces overflow menu) -->
      <span
        class="font-medium"
        :style="{ color: THEME_COLORS.SHOPPING_CART.ACCENT }"
      >
        {{ toBuyItems.length }} {{ $t('category.itemsLeft') }}
      </span>
    </div>

    <!-- Items grid - multi-column layout matching category columns -->
    <div class="shopping-items-grid">
      <div
        v-for="item in toBuyItems"
        :key="item.id"
        class="group flex items-center rounded-md py-0.5 pl-1 pr-1 transition-all duration-200"
      >
        <!-- Shopping cart button (left side) - mark as bought -->
        <button
          type="button"
          class="mr-1.5 flex h-5 w-5 flex-none flex-shrink-0 items-center justify-center rounded-full text-white transition-all hover:scale-110 sm:mr-2"
          :style="{
            backgroundColor: THEME_COLORS.SHOPPING_CART.BUTTON,
          }"
          :title="$t('item.markAsBought')"
          :aria-label="$t('item.markAsBought')"
          @click.stop="markAsBought(item)"
          @mouseenter="
            (e) => (e.target.style.backgroundColor = THEME_COLORS.SHOPPING_CART.BUTTON_HOVER)
          "
          @mouseleave="(e) => (e.target.style.backgroundColor = THEME_COLORS.SHOPPING_CART.BUTTON)"
        >
          <!-- Checkmark icon -->
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>

        <!-- Item name -->
        <span
          class="flex-grow truncate text-base"
          :style="{ color: THEME_COLORS.TEXT_PRIMARY }"
        >
          {{ item.name }}
        </span>
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
          typeof item.isToBuy === 'boolean'
      );
    },
  },
});

const emit = defineEmits(['update:item']);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

/**
 * Filter items that are marked as "to buy"
 */
const toBuyItems = computed(() => {
  return props.items.filter((item) => item.isToBuy);
});

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Mark an item as bought by removing the isToBuy flag
 * This will automatically remove it from the shopping list
 * @param {object} item - The item to mark as bought
 */
function markAsBought(item) {
  const updatedItem = new Item({
    ...item,
    isToBuy: false, // Remove from shopping list
    // isPacked remains unchanged - buying doesn't mean packing
  });
  emit('update:item', updatedItem);
}
</script>

<style scoped>
/* Multi-column grid layout matching category columns */
.shopping-items-grid {
  display: grid;
  column-gap: 2.25rem;
  row-gap: 0.25rem;
  grid-template-columns: 1fr;
}

/* Match category column breakpoints (values from index.css :root) */
/* Source: index.css --breakpoint-tablet */
@media (min-width: 768px) {
  .shopping-items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Source: index.css --breakpoint-desktop */
@media (min-width: 1180px) {
  .shopping-items-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Source: index.css --breakpoint-large-desktop */
@media (min-width: 1536px) {
  .shopping-items-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
