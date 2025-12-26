<!--
================================================================================
File: source/components/AddItemButton.vue
Description: Add item button component - triggers creation of new items
             within a category.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <button
    class="flex w-full items-center justify-start rounded-md py-0.5 pl-0 pr-1 transition-colors duration-200 md:pl-2"
    :class="[categoryCompleted ? 'bg-green-50' : 'bg-white hover:bg-gray-100']"
    @click="$emit('click')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Plus icon aligned with checkbox column -->
    <span
      class="mr-1 flex min-h-[44px] min-w-[44px] flex-none items-center justify-center sm:mr-2 md:mr-2 md:min-h-0 md:min-w-0"
      :class="isHovered ? 'text-primary' : 'text-secondary'"
    >
      <svg
        class="size-5 md:size-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    </span>

    <!-- Button label aligned with item name area -->
    <span
      class="min-w-0 grow text-left text-lg md:text-base"
      :class="isHovered ? 'text-primary' : 'text-secondary'"
    >
      {{ $t('item.newItem') }}
    </span>
  </button>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { ref } from 'vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
defineProps({
  categoryCompleted: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits(['click']);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Hover state
const isHovered = ref(false);
</script>
