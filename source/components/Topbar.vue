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
    :class="[
      'sticky top-0 z-30 transition-transform duration-200',
      hidden ? 'pointer-events-none -translate-y-full' : 'translate-y-0',
    ]"
    :inert="hidden || undefined"
    data-testid="mobile-topbar"
  >
    <div class="flex items-center">
      <!-- Toggle sidebar navigation -->
      <button
        class="touch-target rounded-md p-2 hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
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

      <HistoryControls
        :can-undo="canUndo"
        :can-redo="canRedo"
        :blocked="historyBlocked"
        :editing="editing"
        @undo="$emit('undo')"
        @redo="$emit('redo')"
      />
    </div>

    <!-- New checklist action -->
    <button
      class="touch-target rounded-md p-2 hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
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

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

import AppIcon from './AppIcon.vue';
import HistoryControls from './HistoryControls.vue';

// Props
defineProps({
  canUndo: Boolean,
  canRedo: Boolean,
  historyBlocked: Boolean,
  editing: Boolean,
  hidden: Boolean,
  title: {
    type: String,
    default: 'Packing List',
  },
});

// Emits
defineEmits<{ toggle: []; new: []; undo: []; redo: [] }>();
</script>
