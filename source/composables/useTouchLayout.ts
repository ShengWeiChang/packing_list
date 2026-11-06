/*
================================================================================
File: source/composables/useTouchLayout.ts
Description: Input-capability subscriptions shared by a checklist view.
License: MIT (SPDX: MIT)
Created: 2026-10-30
================================================================================
*/

import { computed, onMounted, onUnmounted, ref } from 'vue';

/** Keep input capabilities independent from the width used for layout. */
export function useTouchLayout() {
  const compact = ref(false);
  const coarse = ref(false);
  const noHover = ref(false);
  const queries: Array<{ query: MediaQueryList; update: () => void }> = [];

  onMounted(() => {
    for (const [media, target] of [
      ['(max-width: 767px)', compact],
      ['(any-pointer: coarse)', coarse],
      ['(hover: none)', noHover],
    ] as const) {
      const query = window.matchMedia(media);
      const update = () => {
        target.value = query.matches;
      };
      update();
      query.addEventListener('change', update);
      queries.push({ query, update });
    }
  });
  onUnmounted(() => {
    for (const { query, update } of queries) query.removeEventListener('change', update);
  });

  return { touchControls: computed(() => compact.value || coarse.value || noHover.value) };
}
