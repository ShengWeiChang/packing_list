<!--
================================================================================
File: source/components/AddCategoryButton.vue
Description: Add category button component - triggers creation of new categories
             within a checklist.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
Last-Modified: 2025-09-30
================================================================================
-->

<template>
  <div
    @click="$emit('click')"
    class="p-4 bg-white rounded-xl shadow-md transition-shadow duration-200 hover:shadow-lg cursor-pointer flex items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 hover:border-gray-400"
  >
    <div class="text-center">
      <svg class="w-8 h-8 text-secondary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
      <span class="ml-2 text-base text-secondary group-hover:text-primary">New Category</span>
    </div>
  </div>
</template>

<script setup>
defineEmits(['click']);
</script>
