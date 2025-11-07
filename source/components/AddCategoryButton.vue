<!--
================================================================================
File: source/components/AddCategoryButton.vue
Description: Add category button component - triggers creation of new categories
             within a checklist.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div
    class="flex min-h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 shadow-md transition-shadow duration-200 hover:border-gray-400 hover:shadow-lg"
    @click="$emit('click')"
  >
    <div class="text-center">
      <!-- Plus icon -->
      <svg
        class="text-secondary mx-auto mb-2 size-8"
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

      <!-- Button label -->
      <span class="text-secondary group-hover:text-primary text-base">
        {{ $t('category.newCategory') }}
      </span>
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Emits
defineEmits(['click']);
</script>
