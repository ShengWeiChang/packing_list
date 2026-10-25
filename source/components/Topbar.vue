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
  <header
    class="flex w-full items-center justify-between border-b border-border-color-light bg-white px-3 py-2 md:hidden"
  >
    <!-- Toggle sidebar navigation -->
    <button
      class="rounded-md p-2 hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
      :aria-label="$t('topbar.toggleNav')"
      data-testid="topbar-toggle"
      @click="$emit('toggle')"
    >
      <AppIcon
        class="text-secondary"
        name="menu"
        size="navigation"
      />
    </button>

    <!-- New checklist action -->
    <button
      class="rounded-md p-2 hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
      :aria-label="$t('topbar.newChecklist')"
      data-testid="topbar-new"
      @click="$emit('new')"
    >
      <AppIcon
        class="text-secondary"
        name="add"
        size="navigation"
      />
    </button>
  </header>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

import AppIcon from './AppIcon.vue';

// Props
defineProps({
  title: {
    type: String,
    default: 'Packing List',
  },
});

// Emits
defineEmits(['toggle', 'new']);
</script>
