/*
File: source/composables/useMasonryMotion.ts
Description: Animate CSS-column reflow through the existing Sortable animation owner.
License: MIT (SPDX: MIT)
*/
import type { ShallowRef } from 'vue';
import { computed, onBeforeUnmount, onBeforeUpdate, onMounted, ref } from 'vue';

import type { DraggableControl, DraggableReflow } from '../components/typedDraggable';
import { animateDraggableReflow, cancelDraggableMotion } from '../components/typedDraggable';

/** Observe layout changes without an idle frame loop or a second transform owner. */
export function useMasonryMotion(
  control: Readonly<ShallowRef<DraggableControl | null>>,
  isDragging: () => boolean
) {
  const reducedMotion = ref(false);
  let dispose = () => {};
  let queue = () => {};
  onBeforeUpdate(() => queue());
  onMounted(() => {
    const root = control.value?.$el;
    if (!root) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previous = new Map<HTMLElement, { x: number; y: number }>();
    let width = root.clientWidth;
    let frame = 0;
    const observed = new Set<HTMLElement>();
    const measure = () => {
      const bounds = root.getBoundingClientRect();
      const resizing = root.clientWidth !== width;
      width = root.clientWidth;
      const next = new Map<HTMLElement, { x: number; y: number }>();
      const changes: DraggableReflow[] = [];
      // A collapsing grid already moves same-column siblings continuously. Starting
      // another easing on each resize would make them lag behind its growing height.
      const changingHeight = [
        ...root.querySelectorAll('[data-testid="category-items-container"]'),
      ].some(
        (element) =>
          typeof element.getAnimations === 'function' &&
          element.getAnimations().some((animation) => animation.playState === 'running')
      );
      for (const child of root.children) {
        if (!(child instanceof HTMLElement) || child.classList.contains('sortable-fallback'))
          continue;
        const visual = child.getBoundingClientRect();
        const transform = getComputedStyle(child).transform;
        const matrix = transform && transform !== 'none' ? new DOMMatrixReadOnly(transform) : null;
        const layout = new DOMRect(
          visual.x - (matrix?.m41 ?? 0),
          visual.y - (matrix?.m42 ?? 0),
          visual.width,
          visual.height
        );
        const position = { x: layout.x - bounds.x, y: layout.y - bounds.y };
        const before = previous.get(child);
        if (before && !resizing && !reducedMotion.value) {
          const dx = position.x - before.x;
          const dy = position.y - before.y;
          if (Math.abs(dx) > 0.5 || (!changingHeight && Math.abs(dy) > 0.5)) {
            changes.push({
              element: child,
              from: new DOMRect(visual.x - dx, visual.y - dy, visual.width, visual.height),
              to: layout,
            });
          }
        }
        next.set(child, position);
      }
      previous = next;
      if (resizing || reducedMotion.value) cancelDraggableMotion(control.value);
      else if (!isDragging()) animateDraggableReflow(control.value, changes);
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
      }
    };
    queue = schedule;
    root.addEventListener('click', schedule, true);
    root.addEventListener('input', schedule, true);
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    const observeChildren = () => {
      for (const child of observed) {
        if (child.parentElement !== root) {
          resize?.unobserve(child);
          observed.delete(child);
        }
      }
      for (const child of root.children) {
        if (child instanceof HTMLElement && !observed.has(child)) {
          resize?.observe(child);
          observed.add(child);
        }
      }
      schedule();
    };
    const updatePreference = () => {
      reducedMotion.value = preference.matches;
      if (reducedMotion.value) cancelDraggableMotion(control.value);
      schedule();
    };
    updatePreference();
    measure();
    resize?.observe(root);
    observeChildren();
    const mutation = new MutationObserver(observeChildren);
    mutation.observe(root, { childList: true });
    preference.addEventListener('change', updatePreference);
    dispose = () => {
      queue = () => {};
      root.removeEventListener('click', schedule, true);
      root.removeEventListener('input', schedule, true);
      resize?.disconnect();
      mutation.disconnect();
      preference.removeEventListener('change', updatePreference);
      cancelAnimationFrame(frame);
      cancelDraggableMotion(control.value);
      previous.clear();
      observed.clear();
    };
  });
  onBeforeUnmount(() => dispose());
  return { animationDuration: computed(() => (reducedMotion.value ? 0 : 200)) };
}
