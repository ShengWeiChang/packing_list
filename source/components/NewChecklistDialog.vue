<!--
================================================================================
File: source/components/NewChecklistDialog.vue
Description: Dialog component for creating new checklists from an empty list,
             a personal template, or a built-in recommended list.
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
    @click.self="close"
  >
    <!-- Dialog -->
    <div
      ref="dialogRef"
      class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
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
      <p
        v-if="saveError"
        class="mb-4 text-sm text-danger-text"
        role="alert"
      >
        {{
          $t(
            errorCode === 'conflict' || errorCode === 'quota' || errorCode === 'lock-unavailable'
              ? `storage.${errorCode}`
              : 'common.saveFailed'
          )
        }}
      </p>

      <!-- Step 1: Choose source -->
      <div
        v-if="!activeList"
        class="space-y-3"
      >
        <!-- Empty -->
        <button
          ref="emptyOptionRef"
          class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          type="button"
          data-testid="new-checklist-option-empty"
          :disabled="saving"
          @click="$emit('select', { source: 'empty' })"
        >
          <AppIcon
            class="mr-3 shrink-0 text-secondary"
            name="add"
          />
          <span>
            <span class="block text-primary">{{ $t('template.useEmpty') }}</span>
            <span class="mt-0.5 block text-xs text-secondary">
              {{ $t('template.emptyDescription') }}
            </span>
          </span>
        </button>

        <!-- Personal Templates -->
        <button
          ref="templateOptionRef"
          class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          :disabled="saving || templates.length === 0"
          :class="{ 'cursor-not-allowed opacity-50': templates.length === 0 }"
          type="button"
          data-testid="new-checklist-option-template"
          @click="showList('template')"
        >
          <AppIcon
            class="mr-3 shrink-0 text-secondary"
            name="templateLibrary"
          />
          <span class="min-w-0">
            <span class="block text-primary">{{ $t('template.useTemplate') }}</span>
            <span class="mt-0.5 block text-xs text-secondary">
              {{
                templates.length === 0
                  ? $t('template.noTemplates')
                  : $t('template.personalDescription')
              }}
            </span>
          </span>
        </button>

        <!-- Recommended Lists -->
        <button
          ref="recommendedOptionRef"
          class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          type="button"
          data-testid="new-checklist-option-recommended"
          :disabled="saving"
          @click="showList('recommended')"
        >
          <AppIcon
            class="mr-3 shrink-0 text-secondary"
            name="clipboardCheck"
          />
          <span>
            <span class="block text-primary">{{ $t('template.useRecommended') }}</span>
            <span class="mt-0.5 block text-xs text-secondary">
              {{ $t('template.recommendedDescription') }}
            </span>
          </span>
        </button>
      </div>

      <!-- Step 2: Personal template or recommended list -->
      <div v-else>
        <button
          class="mb-3 flex items-center text-sm text-secondary hover:text-primary"
          type="button"
          data-testid="new-checklist-back"
          :disabled="saving"
          @click="showSources"
        >
          <AppIcon
            class="mr-1"
            name="back"
            size="inline"
          />
          {{ $t('common.back') }}
        </button>

        <h3 class="mb-3 text-sm font-medium text-primary">
          {{
            activeList === 'template'
              ? $t('template.selectTemplate')
              : $t('template.selectRecommendedList')
          }}
        </h3>

        <div
          v-if="activeList === 'template'"
          class="max-h-72 space-y-2 overflow-y-auto"
        >
          <button
            v-for="template in templates"
            :key="template.id"
            ref="templateButtonRefs"
            class="flex w-full items-center rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
            type="button"
            :data-testid="`new-checklist-template-${template.id}`"
            :disabled="saving"
            @click="$emit('select', { source: 'template', templateId: template.id })"
          >
            <span class="truncate text-primary">{{ template.name }}</span>
            <span class="ml-auto shrink-0 text-xs text-secondary">
              {{ $t('template.categoryCount', template.categories.length) }}
            </span>
          </button>
        </div>

        <div
          v-else
          class="max-h-72 space-y-2 overflow-y-auto"
        >
          <button
            v-for="recommendedList in recommendedLists"
            :key="recommendedList.id"
            ref="recommendedListButtonRefs"
            class="w-full rounded-lg border border-border-color-light px-4 py-3 text-left transition-colors hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
            type="button"
            :data-testid="`new-checklist-recommended-${recommendedList.id}`"
            :disabled="saving"
            @click="
              $emit('select', { source: 'recommended', recommendedListId: recommendedList.id })
            "
          >
            <span class="flex items-center">
              <span class="truncate font-medium text-primary">{{ recommendedList.name }}</span>
              <span class="ml-auto shrink-0 text-xs text-secondary">
                {{ $t('template.categoryCount', recommendedList.categories.length) }}
              </span>
            </span>
            <span class="mt-1 block text-xs text-secondary">{{ recommendedList.description }}</span>
          </button>
        </div>
      </div>

      <!-- Cancel button -->
      <div class="mt-4 flex justify-end">
        <button
          class="rounded-lg px-4 py-2 text-sm text-secondary hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          type="button"
          data-testid="new-checklist-cancel"
          :disabled="saving"
          @click="close"
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

import AppIcon from './AppIcon.vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

const props = defineProps({
  saving: { type: Boolean, default: false },
  saveError: { type: Boolean, default: false },
  errorCode: { type: String, default: null },
  visible: {
    type: Boolean,
    default: false,
  },
  templates: {
    type: Array,
    default: () => [],
  },
  recommendedLists: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'select']);

// ------------------------------------------------------------------------------
// State
// ------------------------------------------------------------------------------

const activeList = ref(null);
const dialogRef = ref(null);
const emptyOptionRef = ref(null);
const templateOptionRef = ref(null);
const recommendedOptionRef = ref(null);
const templateButtonRefs = ref([]);
const recommendedListButtonRefs = ref([]);
const previouslyFocusedElement = ref(null);

/** Close only when no creation is in flight. */
function close() {
  if (!props.saving) emit('close');
}

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Show one source list and move focus to its first choice.
 * @param {'template'|'recommended'} list - List to show.
 */
async function showList(list) {
  if (list === 'template' && props.templates.length === 0) return;
  activeList.value = list;
  await nextTick();
  const firstChoice =
    list === 'template' ? templateButtonRefs.value[0] : recommendedListButtonRefs.value[0];
  firstChoice?.focus();
}

/** Return to source choices and restore focus to the source that opened the list. */
async function showSources() {
  const previousList = activeList.value;
  activeList.value = null;
  await nextTick();
  if (previousList === 'template') {
    templateOptionRef.value?.focus();
  } else {
    recommendedOptionRef.value?.focus();
  }
}

/**
 * Handle Escape and keep Tab focus inside the visible modal.
 * @param {KeyboardEvent} event - Document keyboard event
 */
function handleDialogKeydown(event) {
  if (!props.visible) return;
  if (event.key === 'Escape') {
    close();
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
  async (value) => {
    if (value) {
      previouslyFocusedElement.value = document.activeElement;
      activeList.value = null;
      await nextTick();
      emptyOptionRef.value?.focus();
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
