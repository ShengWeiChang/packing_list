<template>
  <div
    class="flex items-center gap-1"
    role="group"
    :aria-label="$t('history.actions')"
    @pointerdown.capture="preventDraftBlur"
  >
    <button
      type="button"
      class="touch-target rounded-md p-2 text-secondary hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus disabled:cursor-not-allowed disabled:opacity-35"
      :disabled="!canUndo || blocked"
      :aria-label="$t('history.undo')"
      :title="$t('history.undo')"
      data-testid="history-undo"
      @click="$emit('undo')"
    >
      <AppIcon
        name="undo"
        size="control"
      />
    </button>
    <button
      type="button"
      class="touch-target rounded-md p-2 text-secondary hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus disabled:cursor-not-allowed disabled:opacity-35"
      :disabled="!canRedo || blocked"
      :aria-label="$t('history.redo')"
      :title="$t('history.redo')"
      data-testid="history-redo"
      @click="$emit('redo')"
    >
      <AppIcon
        name="redo"
        size="control"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue';

const props = defineProps<{
  canUndo: boolean;
  canRedo: boolean;
  blocked: boolean;
  editing: boolean;
}>();
defineEmits<{ undo: []; redo: [] }>();

/** Keep a disabled history control from blurring and implicitly saving an editor. */
function preventDraftBlur(event: PointerEvent) {
  if (props.editing) event.preventDefault();
}
</script>
