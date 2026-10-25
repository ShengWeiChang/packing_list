<!--
================================================================================
File: source/components/AppIcon.vue
Description: Centralized semantic icon wrapper for the application's UI icons.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-24
================================================================================
-->

<template>
  <component
    :is="iconComponent"
    :class="iconClass"
    :aria-hidden="isDecorative ? 'true' : undefined"
    :aria-label="isDecorative ? undefined : label"
    :role="isDecorative ? undefined : 'img'"
    :focusable="false"
    :stroke-width="2"
    v-bind="forwardedAttrs"
  />
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  Ellipsis,
  FilePlus2,
  Files,
  Filter,
  Globe2,
  Menu,
  Minus,
  Pencil,
  Plus,
  Trash2,
} from '@lucide/vue';
import { computed, useAttrs } from 'vue';

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

const icons = {
  add: Plus,
  back: ArrowLeft,
  clipboardCheck: ClipboardCheck,
  collapse: ChevronUp,
  confirm: Check,
  copy: Copy,
  decrease: Minus,
  delete: Trash2,
  edit: Pencil,
  more: Ellipsis,
  expand: ChevronDown,
  filter: Filter,
  language: Globe2,
  menu: Menu,
  saveTemplate: FilePlus2,
  templateLibrary: Files,
};

const sizeClasses = {
  compact: 'size-3.5',
  inline: 'size-4',
  control: 'size-5',
  feature: 'size-8',
  navigation: 'size-6',
};

// ------------------------------------------------------------------------------
// Props
// ------------------------------------------------------------------------------

const props = defineProps({
  decorative: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
    validator: (value) =>
      [
        'add',
        'back',
        'clipboardCheck',
        'collapse',
        'confirm',
        'copy',
        'decrease',
        'delete',
        'edit',
        'expand',
        'filter',
        'language',
        'menu',
        'more',
        'saveTemplate',
        'templateLibrary',
      ].includes(value),
  },
  size: {
    type: String,
    default: 'control',
    validator: (value) => ['compact', 'inline', 'control', 'feature', 'navigation'].includes(value),
  },
});

// ------------------------------------------------------------------------------
// Attributes and computed values
// ------------------------------------------------------------------------------

const attrs = useAttrs();

const forwardedAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([name]) => name !== 'class'))
);

const iconClass = computed(() => [sizeClasses[props.size], attrs.class]);
const iconComponent = computed(() => icons[props.name]);
const isDecorative = computed(() => props.decorative || props.label.trim().length === 0);
</script>
