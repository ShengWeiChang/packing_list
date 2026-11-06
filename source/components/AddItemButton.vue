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
    class="touch-target flex w-full items-center justify-start rounded-md p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus md:pl-2"
    data-testid="add-item-button"
    :class="[
      categoryCompleted ? 'bg-success-state-bg' : 'bg-white hover:bg-interactive-hover',
      { '!py-0 !pl-0': touchControls },
    ]"
    @click="$emit('click')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isHovered = true"
    @blur="isHovered = false"
  >
    <!-- Plus icon aligned with checkbox column -->
    <span
      class="mr-2 flex size-9 flex-none items-center justify-center md:mr-3 md:size-6"
      :class="[
        isHovered ? 'text-primary' : 'text-secondary',
        { '!mr-1 min-h-[44px] min-w-[44px] md:!mr-2': touchControls },
      ]"
      data-testid="add-item-button-icon"
    >
      <AppIcon
        class="md:size-4"
        name="add"
        size="control"
      />
    </span>

    <!-- Button label aligned with item name area -->
    <span
      class="min-w-0 grow text-left text-lg md:text-base"
      :class="[
        isHovered ? 'text-primary' : 'text-secondary',
        { 'pl-1 md:!text-lg': touchControls },
      ]"
    >
      {{ $t('item.newItem') }}
    </span>
  </button>
</template>

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { ref } from 'vue';

import AppIcon from './AppIcon.vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
defineProps({
  touchControls: { type: Boolean, default: false },
  categoryCompleted: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits<{ click: [] }>();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Hover state
const isHovered = ref(false);
</script>
