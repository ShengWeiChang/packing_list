<!--
================================================================================
File: source/components/ProgressBar.vue
Description: Progress bar component - shows completion percentage for
             category or checklist items.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div class="w-full">
    <div class="w-full h-2 mb-2 rounded-full overflow-hidden" :style="{ background: backgroundColor }">
      <div
        class="h-full rounded-full transition-all duration-300 ease-in-out"
        :style="{ width: `${percentage}%`, background: progressColor }"
      ></div>
    </div>
    <div class="flex justify-between items-center">
      <p class="text-sm font-medium" :style="{ color: textColor }">{{ text }}</p>
      <p class="text-sm font-medium" :style="{ color: textColor }">{{ percentage }}%</p>
    </div>
  </div>
</template>

<script setup>
// ----------------------
// Imports
// ----------------------

import { computed } from 'vue';
import { THEME_COLORS } from '../utils/constants';

// ----------------------
// Constants
// ----------------------

// Theme colors
const progressColor = THEME_COLORS.PRIMARY;
const textColor = THEME_COLORS.TEXT_PRIMARY;
const backgroundColor = THEME_COLORS.SECONDARY;

// ----------------------
// Props & Emits
// ----------------------

// Props
const props = defineProps({
  total: {
    type: Number,
    required: true
  },
  completed: {
    type: Number,
    required: true
  }
});

// ----------------------
// Computed
// ----------------------

// Calculate completion percentage
const percentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.completed / props.total) * 100);
});

// Display text for progress
const text = computed(() => {
  return `${props.completed} / ${props.total}`;
});

</script>