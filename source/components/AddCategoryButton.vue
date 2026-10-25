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
  <button
    type="button"
    data-testid="add-category-button"
    class="flex min-h-32 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border-color-medium bg-white p-4 shadow-md transition-shadow duration-200 hover:border-border-color-dark hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-2"
    @click="$emit('click')"
  >
    <div class="text-center">
      <AppIcon
        class="mx-auto mb-2 text-secondary"
        name="add"
        size="feature"
      />

      <!-- Button label -->
      <span class="text-base text-secondary group-hover:text-primary">
        {{ $t('category.newCategory') }}
      </span>
    </div>
  </button>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import AppIcon from './AppIcon.vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Emits
defineEmits(['click']);
</script>
