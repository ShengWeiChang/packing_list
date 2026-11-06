/*
================================================================================
File: source/composables/useVisualViewport.ts
Description: Visual viewport bounds shared by modal surfaces.
License: MIT (SPDX: MIT)
Created: 2026-11-04
================================================================================
*/

import { onMounted, onUnmounted, ref } from 'vue';

/** Keep fixed modal surfaces inside the viewport still visible above a keyboard. */
export function useVisualViewport() {
  const style = ref<Record<string, string>>({});
  let viewport: VisualViewport | null = null;
  const update = () => {
    style.value = {
      top: `${viewport?.offsetTop ?? 0}px`,
      left: `${viewport?.offsetLeft ?? 0}px`,
      width: `${viewport?.width || window.innerWidth}px`,
      height: `${viewport?.height || window.innerHeight}px`,
    };
  };
  onMounted(() => {
    viewport = window.visualViewport;
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
  });
  onUnmounted(() => {
    viewport?.removeEventListener('resize', update);
    viewport?.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  });
  return style;
}
