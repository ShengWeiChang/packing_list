<!--
================================================================================
File: source/components/PackingCompletionOverlay.vue
Description: Full-page travel-themed feedback shown when a checklist becomes
             fully packed through a local packing action.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-25
================================================================================
-->

<!-- eslint-disable tailwindcss/no-custom-classname -->
<template>
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div
    class="packing-completion-overlay"
    :class="{ 'packing-completion-overlay--ready': assetsReady }"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('completion.ready')"
    :data-assets-ready="assetsReady"
    data-testid="packing-completion-overlay"
    :style="timelineStyles"
    @click.self="close"
    @keydown.esc.prevent="close"
    @keydown.tab.prevent="keepFocusInside"
  >
    <button
      ref="skipButton"
      type="button"
      class="packing-completion-overlay__skip"
      data-testid="packing-completion-skip"
      @click="close"
    >
      {{ $t('completion.skip') }}
    </button>

    <div class="packing-completion-overlay__scene">
      <img
        class="packing-completion-overlay__terminal"
        :src="airportTerminal"
        aria-hidden="true"
        alt=""
        @error="handleAssetSettled"
        @load="handleAssetSettled"
      />

      <div
        class="packing-completion-overlay__flight"
        aria-hidden="true"
      >
        <img
          class="packing-completion-overlay__plane"
          :src="takeoffPlane"
          alt=""
          @error="handleAssetSettled"
          @load="handleAssetSettled"
        />
      </div>

      <div class="packing-completion-overlay__suitcase">
        <img
          class="packing-completion-overlay__suitcase-art"
          :src="packingSuitcase"
          alt=""
          aria-hidden="true"
          @error="handleAssetSettled"
          @load="handleAssetSettled"
        />
        <div class="packing-completion-overlay__sticker">
          <img
            class="packing-completion-overlay__sticker-art"
            :src="baggageLabel"
            alt=""
            aria-hidden="true"
            @error="handleAssetSettled"
            @load="handleAssetSettled"
          />
          <div class="packing-completion-overlay__sticker-copy">
            <p class="packing-completion-overlay__sticker-date">
              {{ formattedTripDates }}
            </p>
            <strong>{{ checklistName }}</strong>
            <span class="packing-completion-overlay__sticker-ready">
              {{ $t('completion.ready') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import type { PropType } from 'vue';
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import airportTerminal from '@/assets/completion/airport-terminal.png';
import baggageLabel from '@/assets/completion/baggage-label.png';
import packingSuitcase from '@/assets/completion/packing-suitcase.png';
import takeoffPlane from '@/assets/completion/takeoff-plane.png';

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

const COMPLETION_DURATION_MS = 5000;
const COMPLETION_ASSET_COUNT = 4;
const TERMINAL_REVEAL_DURATION_MS = 4000;

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

const props = defineProps({
  checklistName: {
    type: String,
    required: true,
  },
  endDate: {
    type: String as PropType<unknown>,
    required: true,
  },
  startDate: {
    type: String as PropType<unknown>,
    required: true,
  },
});

const emit = defineEmits<{ close: [] }>();

const { locale } = useI18n();
const timelineStyles = {
  '--completion-duration': `${COMPLETION_DURATION_MS}ms`,
  '--completion-fade-delay': `${COMPLETION_DURATION_MS - 500}ms`,
  '--completion-fade-duration': '500ms',
  '--terminal-reveal-duration': `${TERMINAL_REVEAL_DURATION_MS}ms`,
};

/**
 * Parse one stored local-calendar date without allowing JavaScript normalization.
 * @param {string} date - Date in YYYY-MM-DD format.
 * @returns {Date|null} Local date, or null for missing, malformed, or impossible input.
 */
function parseTripDate(date: unknown) {
  // RegExp.exec performs native string coercion, including for legacy date values.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date as string);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsedDate = new Date(0);
  parsedDate.setHours(12, 0, 0, 0);
  parsedDate.setFullYear(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

/**
 * Format one stored local-calendar date without shifting it across time zones.
 * @param {string} date - Date in YYYY-MM-DD format.
 * @param {boolean} [includeYear=true] - Whether to include the year.
 * @returns {string} Localized date, or an empty string for missing or invalid input.
 */
function formatTripDate(date: unknown, includeYear = true) {
  const parsedDate = parseTripDate(date);
  if (!parsedDate) return '';

  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(parsedDate);
}

const formattedTripDates = computed(() => {
  const parsedStartDate = parseTripDate(props.startDate);
  const parsedEndDate = parseTripDate(props.endDate);
  const startDate = formatTripDate(props.startDate);
  const endDate = formatTripDate(props.endDate);
  if (!startDate) return endDate;
  if (!endDate || props.startDate === props.endDate) return startDate;

  const startYear = parsedStartDate!.getFullYear();
  const endYear = parsedEndDate!.getFullYear();
  if (startYear !== endYear) return `${startDate}–${endDate}`;

  const dateParts = new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(parsedStartDate!);
  const yearFirst =
    dateParts.findIndex((part) => part.type === 'year') <
    dateParts.findIndex((part) => part.type === 'month');

  return yearFirst
    ? `${startDate}–${formatTripDate(props.endDate, false)}`
    : `${formatTripDate(props.startDate, false)}–${endDate}`;
});

// ------------------------------------------------------------------------------
// State
// ------------------------------------------------------------------------------

const skipButton = ref<HTMLButtonElement | null>(null);
const assetsReady = ref(false);
let closeTimer: number | undefined;
let isClosed = false;
let settledAssetCount = 0;

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/** Close the overlay and cancel its scheduled automatic close. */
function close() {
  if (isClosed) return;
  isClosed = true;
  window.clearTimeout(closeTimer);
  emit('close');
}

/** Keep both Tab directions on the dialog's only interactive control. */
function keepFocusInside() {
  skipButton.value?.focus();
}

/** Start the synchronized journey after all image requests have settled. */
function handleAssetSettled() {
  if (assetsReady.value || isClosed) return;
  settledAssetCount += 1;
  if (settledAssetCount < COMPLETION_ASSET_COUNT) return;

  assetsReady.value = true;
  closeTimer = window.setTimeout(close, COMPLETION_DURATION_MS);
}

// ------------------------------------------------------------------------------
// Lifecycle Hooks
// ------------------------------------------------------------------------------

onMounted(async () => {
  await nextTick();
  skipButton.value?.focus();
});

onUnmounted(() => {
  window.clearTimeout(closeTimer);
});
</script>

<style scoped>
.packing-completion-overlay {
  align-items: center;
  background: transparent;
  display: flex;
  inset: 0;
  justify-content: center;
  overflow: hidden;
  position: fixed;
  z-index: 70;
  animation: overlay-dismiss var(--completion-fade-duration) ease-in var(--completion-fade-delay)
    both;
  animation-play-state: paused;
}

.packing-completion-overlay::before {
  background: rgba(235, 241, 237, 0.9);
  content: '';
  inset: 0;
  opacity: 0;
  position: absolute;
  animation: backdrop-reveal 1s ease-out both;
}

.packing-completion-overlay__skip {
  background: var(--text-primary);
  border: 1px solid var(--text-primary);
  border-radius: 999px;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.5rem 0.875rem;
  position: absolute;
  right: 1rem;
  top: 1rem;
  z-index: 2;
}

.packing-completion-overlay__skip:focus-visible {
  outline: 2px solid var(--interactive-focus);
  outline-offset: 2px;
}

.packing-completion-overlay__skip:hover {
  opacity: 0.88;
}

.packing-completion-overlay__skip:active {
  transform: translateY(1px);
}

.packing-completion-overlay__scene {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  pointer-events: none;
  position: relative;
  width: 100vw;
  z-index: 1;
}

.packing-completion-overlay__terminal {
  bottom: 3rem;
  left: 50%;
  object-fit: contain;
  opacity: 0;
  position: absolute;
  transform: translateX(-52%);
  width: min(120vw, 100rem);
  z-index: 2;
  animation: terminal-drift var(--terminal-reveal-duration) ease-out both;
  animation-play-state: paused;
}

.packing-completion-overlay__flight {
  bottom: 10%;
  height: 14rem;
  opacity: 0;
  position: absolute;
  right: 4%;
  width: 20rem;
  z-index: 1;
  animation: flight-takeoff var(--completion-duration) ease-in-out both;
  animation-play-state: paused;
}

.packing-completion-overlay__plane {
  height: auto;
  position: absolute;
  right: 0;
  top: 0;
  width: 9rem;
}

.packing-completion-overlay__suitcase {
  bottom: 3.25rem;
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
  width: clamp(16rem, 28vw, 23rem);
  z-index: 3;
  animation: suitcase-journey var(--completion-duration) cubic-bezier(0.22, 0.61, 0.36, 1) both;
  animation-play-state: paused;
}

.packing-completion-overlay__suitcase-art {
  display: block;
  height: auto;
  width: 100%;
}

.packing-completion-overlay__sticker {
  left: 50%;
  opacity: 0;
  position: absolute;
  top: 34%;
  transform: translateX(-50%);
  width: 72%;
  animation: sticker-attach var(--completion-duration) cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-play-state: paused;
}

.packing-completion-overlay--ready,
.packing-completion-overlay--ready .packing-completion-overlay__terminal,
.packing-completion-overlay--ready .packing-completion-overlay__flight,
.packing-completion-overlay--ready .packing-completion-overlay__suitcase,
.packing-completion-overlay--ready .packing-completion-overlay__sticker {
  animation-play-state: running;
}

.packing-completion-overlay__sticker-art {
  display: block;
  height: auto;
  width: 100%;
}

.packing-completion-overlay__sticker-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  left: 15%;
  line-height: 1.05;
  max-width: 68%;
  min-width: 0;
  position: absolute;
  top: 24%;
  gap: 0.2rem;
}

.packing-completion-overlay__sticker-date {
  color: var(--text-secondary);
  font-size: clamp(0.55rem, 0.8vw, 0.7rem);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
  margin: 0;
  white-space: nowrap;
}

.packing-completion-overlay__sticker-copy strong {
  color: var(--text-primary);
  font-size: clamp(0.7rem, 1.1vw, 0.9rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.packing-completion-overlay__sticker-ready {
  color: var(--theme-primary);
  font-size: clamp(1.15rem, 2.25vw, 1.65rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

@keyframes terminal-drift {
  0% {
    opacity: 0;
    transform: translateX(-52%);
  }

  60% {
    opacity: 1;
    transform: translateX(-52%);
  }

  100% {
    opacity: 1;
    transform: translateX(-52%);
  }
}

@keyframes backdrop-reveal {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

@keyframes suitcase-journey {
  0% {
    opacity: 1;
    transform: translateX(-150vw);
  }

  40%,
  70% {
    opacity: 1;
    transform: translateX(-50%);
  }

  100% {
    opacity: 1;
    transform: translateX(-50%);
  }
}

@keyframes overlay-dismiss {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@keyframes sticker-attach {
  0%,
  25% {
    opacity: 0;
    transform: translate(-50%, -1.4rem) scale(1.34) rotate(-5deg);
  }

  60%,
  100% {
    opacity: 1;
    transform: translateX(-50%);
  }
}

@keyframes flight-takeoff {
  0%,
  30% {
    opacity: 0;
    transform: translate(-70rem, 5rem) scale(0.78);
  }

  90%,
  100% {
    opacity: 1;
    transform: translate(-5rem, -15rem) scale(1.15);
  }
}

@media (max-width: 600px) {
  .packing-completion-overlay__suitcase {
    bottom: 4.5rem;
    width: min(72vw, 20rem);
  }

  .packing-completion-overlay__flight {
    bottom: 14%;
    right: -4rem;
    width: 16rem;
  }

  .packing-completion-overlay__terminal {
    bottom: 3rem;
    width: 120vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .packing-completion-overlay {
    animation: none;
  }

  .packing-completion-overlay::before {
    animation: none;
    opacity: 1;
  }

  .packing-completion-overlay__terminal,
  .packing-completion-overlay__flight,
  .packing-completion-overlay__suitcase,
  .packing-completion-overlay__sticker {
    animation: none;
  }

  .packing-completion-overlay__suitcase {
    transform: translateX(-50%);
  }

  .packing-completion-overlay__terminal {
    opacity: 1;
    transform: translateX(-52%);
  }

  .packing-completion-overlay__flight {
    opacity: 1;
    transform: translate(2rem, -4rem) scale(1);
  }

  .packing-completion-overlay__sticker {
    opacity: 1;
  }
}
</style>
