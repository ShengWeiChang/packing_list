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
    class="flex items-center w-full py-0.5 px-2 rounded-md transition-colors duration-200 text-sm justify-start"
    :class="[ categoryCompleted ? 'bg-green-50' : 'bg-white hover:bg-gray-100' ]"
    @click="$emit('click')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Icon aligned with checkbox column -->
    <span
      class="flex-none w-4 h-4 mr-2 flex items-center justify-center"
      :class="isHovered ? 'text-primary' : 'text-secondary'"
    >
      <svg
        class="w-4 h-4"
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

    <!-- Label aligns with item name area -->
    <span
      class="flex-grow text-base text-left"
      :class="isHovered ? 'text-primary' : 'text-secondary'"
    >
      {{ $t('item.newItem') }}
    </span>
  </button>
</template>

<script setup>
// ----------------------
// Imports
// ----------------------

import { ref } from 'vue';

// ----------------------
// Props & Emits
// ----------------------

// Props
const props = defineProps({
  categoryCompleted: { 
    type: Boolean, 
    default: false 
  }
});

// Emits
defineEmits(['click']);

// ----------------------
// States
// ----------------------

// Hover state
const isHovered = ref(false);

</script>