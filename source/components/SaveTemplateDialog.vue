<!--
================================================================================
File: source/components/SaveTemplateDialog.vue
Description: Dialog for naming a checklist template before saving its snapshot.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
-->

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    role="presentation"
    @click.self="close"
  >
    <form
      ref="dialogRef"
      class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
      @submit.prevent="save"
    >
      <h2
        id="save-template-title"
        class="text-lg font-semibold text-primary"
      >
        {{ $t('template.saveAsTemplate') }}
      </h2>
      <p class="mt-4 block text-sm font-medium text-secondary">
        {{ $t('template.templateName') }}
      </p>
      <input
        ref="nameInput"
        v-model="name"
        :disabled="saving"
        class="mt-1 w-full rounded-lg border border-border-color-light px-3 py-2 text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
        maxlength="100"
        type="text"
        :aria-label="$t('template.templateName')"
        data-testid="save-template-name"
      />
      <p
        v-if="showError"
        class="mt-2 text-sm text-danger-text"
      >
        {{ $t('template.nameRequired') }}
      </p>
      <p
        v-if="saveError"
        class="mt-2 text-sm text-danger-text"
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
      <div class="mt-6 flex justify-end gap-2">
        <button
          class="rounded-lg px-4 py-2 text-sm text-secondary hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          type="button"
          :disabled="saving"
          @click="close"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          class="rounded-lg bg-theme-primary px-4 py-2 text-sm text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus"
          data-testid="save-template-confirm"
          type="submit"
          :disabled="saving"
        >
          {{ $t('common.save') }}
        </button>
      </div>
    </form>
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
  initialName: { type: String, default: '' },
  visible: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  saveError: { type: Boolean, default: false },
  errorCode: { type: String, default: null },
});

const emit = defineEmits(['close', 'save']);

// ------------------------------------------------------------------------------
// State
// ------------------------------------------------------------------------------

const name = ref('');
const nameInput = ref(null);
const showError = ref(false);
const dialogRef = ref(null);
const previouslyFocusedElement = ref(null);

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Validate and emit the requested template name.
 */
function save() {
  if (props.saving) return;
  if (!name.value.trim()) {
    showError.value = true;
    return;
  }
  emit('save', name.value.trim());
}

/** Close only when no save is in flight. */
function close() {
  if (!props.saving) emit('close');
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
  async (visible) => {
    if (visible) {
      previouslyFocusedElement.value = document.activeElement;
      name.value = props.initialName;
      showError.value = false;
      await nextTick();
      nameInput.value?.focus();
      nameInput.value?.select();
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
