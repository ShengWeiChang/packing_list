<template>
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    :style="viewportStyle"
  >
    <div
      ref="dialog"
      class="mx-4 w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      style="max-height: calc(100% - 2rem)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-template-title"
      data-testid="unsaved-template-dialog"
    >
      <h2
        id="unsaved-template-title"
        class="text-lg font-semibold text-primary"
      >
        {{ $t('template.unsavedTitle') }}
      </h2>
      <p class="mt-3 text-sm text-secondary">{{ $t('template.unsavedDescription') }}</p>
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button
          ref="stayButton"
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-secondary hover:bg-interactive-hover"
          data-testid="template-unsaved-stay"
          @click="$emit('stay')"
        >
          {{ $t('template.continueEditing') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-danger-text hover:bg-danger-bg"
          data-testid="template-unsaved-discard"
          @click="$emit('discard')"
        >
          {{ $t('template.discardAndLeave') }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-theme-primary px-4 py-2 text-sm text-white hover:opacity-90"
          data-testid="template-unsaved-save"
          @click="$emit('save')"
        >
          {{ $t('template.saveAndLeave') }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { useVisualViewport } from '../composables/useVisualViewport';

const emit = defineEmits<{ stay: []; discard: []; save: [] }>();
const viewportStyle = useVisualViewport();
const dialog = ref<HTMLElement | null>(null);
const stayButton = ref<HTMLButtonElement | null>(null);
const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

/** Keep modal keyboard navigation within the dialog. */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('stay');
    return;
  }
  if (event.key !== 'Tab') return;
  const buttons = dialog.value?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
  if (!buttons?.length) return;
  if (event.shiftKey && document.activeElement === buttons[0]) {
    event.preventDefault();
    buttons[buttons.length - 1]?.focus();
  } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
    event.preventDefault();
    buttons[0]?.focus();
  }
}
onMounted(async () => {
  document.addEventListener('keydown', handleKeydown, true);
  await nextTick();
  stayButton.value?.focus();
});
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true);
  void nextTick(() => {
    if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus();
  });
});
</script>
