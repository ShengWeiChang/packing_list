<!--
================================================================================
File: source/components/Topbar.vue
Description: Mobile topbar component - provides navigation and actions for
             mobile viewport layout.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <header class="w-full bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between md:hidden">
    <!-- Toggle Navigation Button -->
    <button
      class="p-2 rounded-md hover:bg-gray-100"
      :aria-label="$t('topbar.toggleNav')"
      @click="$emit('toggle')"
    >
      <svg
        class="w-6 h-6 text-secondary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>

    <!-- New Checklist Button -->
    <button
      class="p-2 rounded-md hover:bg-gray-100"
      :aria-label="$t('topbar.newChecklist')"
      @click="$emit('new')"
    >
      <svg
        class="w-6 h-6 text-secondary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  </header>
</template>

<script setup>
// ----------------------
// Props & Emits
// ----------------------

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Packing List'
  }
});

// Emits
defineEmits(['toggle', 'new']);

</script>
