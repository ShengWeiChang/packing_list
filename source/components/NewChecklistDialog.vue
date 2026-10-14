<!--
================================================================================
File: source/components/NewChecklistDialog.vue
Description: Dialog component for creating new checklists with options to use
             default items, a personal template, or start empty.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
-->

<template>
  <!-- Backdrop -->
  <div
    v-if="visible"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    role="presentation"
    data-testid="new-checklist-dialog-backdrop"
    @click.self="$emit('close')"
  >
    <!-- Dialog -->
    <div
      ref="dialogRef"
      class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-checklist-dialog-title"
      data-testid="new-checklist-dialog"
    >
      <h2
        id="new-checklist-dialog-title"
        class="mb-4 text-lg font-semibold text-primary"
      >
        {{ $t('template.newChecklistFrom') }}
      </h2>

      <!-- Step 1: Choose source -->
      <div
        v-if="!showTemplateList"
        class="space-y-3"
      >
        <!-- Default -->
        <button
          ref="defaultOptionRef"
          class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          type="button"
          data-testid="new-checklist-option-default"
          @click="$emit('select', { source: 'default' })"
        >
          <svg
            class="mr-3 size-5 shrink-0 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span class="text-primary">{{ $t('template.useDefault') }}</span>
        </button>

        <!-- From Template -->
        <button
          ref="templateOptionRef"
          class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          :disabled="templates.length === 0"
          :class="{ 'cursor-not-allowed opacity-50': templates.length === 0 }"
          type="button"
          data-testid="new-checklist-option-template"
          @click="showTemplates"
        >
          <svg
            class="mr-3 size-5 shrink-0 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <span class="text-primary">{{ $t('template.useTemplate') }}</span>
          <span
            v-if="templates.length === 0"
            class="ml-auto text-xs text-secondary"
          >
            {{ $t('template.noTemplates') }}
          </span>
        </button>

        <!-- Empty -->
        <button
          class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          type="button"
          data-testid="new-checklist-option-empty"
          @click="$emit('select', { source: 'empty' })"
        >
          <svg
            class="mr-3 size-5 shrink-0 text-secondary"
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
          <span class="text-primary">{{ $t('template.useEmpty') }}</span>
        </button>
      </div>

      <!-- Step 2: Template list -->
      <div v-else>
        <button
          class="mb-3 flex items-center text-sm text-secondary hover:text-primary"
          type="button"
          data-testid="new-checklist-back"
          @click="showSources"
        >
          <svg
            class="mr-1 size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {{ $t('common.back') }}
        </button>
        <div class="max-h-60 space-y-2 overflow-y-auto">
          <button
            v-for="tpl in templates"
            :key="tpl.id"
            ref="templateButtonRefs"
            class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
            type="button"
            :data-testid="`new-checklist-template-${tpl.id}`"
            @click="$emit('select', { source: 'template', templateId: tpl.id })"
          >
            <span class="truncate text-primary">{{ tpl.name }}</span>
            <span class="ml-auto shrink-0 text-xs text-secondary">
              {{ $t('template.categoryCount', tpl.categories.length) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Cancel button -->
      <div class="mt-4 flex justify-end">
        <button
          class="rounded-lg px-4 py-2 text-sm text-secondary hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          type="button"
          data-testid="new-checklist-cancel"
          @click="$emit('close')"
        >
          {{ $t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  templates: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'select']);

// ------------------------------------------------------------------------------
// State
// ------------------------------------------------------------------------------

const showTemplateList = ref(false);
const dialogRef = ref(null);
const defaultOptionRef = ref(null);
const templateOptionRef = ref(null);
const templateButtonRefs = ref([]);
const previouslyFocusedElement = ref(null);

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/** Show template choices and move focus into the new step. */
async function showTemplates() {
  if (props.templates.length === 0) return;
  showTemplateList.value = true;
  await nextTick();
  templateButtonRefs.value[0]?.focus();
}

/** Return to source choices and restore focus to the template option. */
async function showSources() {
  showTemplateList.value = false;
  await nextTick();
  templateOptionRef.value?.focus();
}

/**
 * Handle Escape and keep Tab focus inside the visible modal.
 * @param {KeyboardEvent} event - Document keyboard event
 */
function handleDialogKeydown(event) {
  if (!props.visible) return;
  if (event.key === 'Escape') {
    emit('close');
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = dialogRef.value?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable?.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      previouslyFocusedElement.value = document.activeElement;
      showTemplateList.value = false;
      await nextTick();
      defaultOptionRef.value?.focus();
    } else {
      previouslyFocusedElement.value?.focus();
    }
  },
  { immediate: true }
);

// ------------------------------------------------------------------------------
// Lifecycle Hooks
// ------------------------------------------------------------------------------

onMounted(() => document.addEventListener('keydown', handleDialogKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleDialogKeydown));
</script>
