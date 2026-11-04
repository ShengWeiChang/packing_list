/*
================================================================================
File: source/utils/focusEditingInput.ts
Description: Focus and select inline-edit inputs without unnecessary page
             movement while preserving mobile keyboard visibility.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-20
================================================================================
*/

const activeEditors = new WeakMap<HTMLElement, () => void>();

/**
 * Focus an inline editor and maintain a comfort buffer inside its visible scrollport.
 * @param {HTMLInputElement|null} input - Input to focus and select
 * @returns {Function} Cleanup function for scheduled work and viewport listeners
 */
export function focusEditingInput(input: HTMLInputElement | null, { select = true } = {}) {
  if (!input) return () => {};

  let disposed = false;
  const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
  let owner: HTMLElement | null = input.parentElement;
  while (owner && !/(auto|scroll)/.test(window.getComputedStyle(owner).overflowY)) {
    owner = owner.parentElement;
  }
  // An unconstrained overflow:auto element is not a scrollport.
  while (owner && owner.scrollHeight <= owner.clientHeight) {
    owner = owner.parentElement;
    while (owner && !/(auto|scroll)/.test(window.getComputedStyle(owner).overflowY))
      owner = owner.parentElement;
  }
  const scrollport = owner ?? (document.scrollingElement as HTMLElement | null);
  const paddingTarget = owner ?? document.body;
  activeEditors.get(paddingTarget)?.();
  const oldPadding = paddingTarget.style.paddingBottom;
  const basePadding = Number.parseFloat(window.getComputedStyle(paddingTarget).paddingBottom) || 0;
  let appliedPadding: string | null = null;
  let frame = 0;

  const ensureVisible = () => {
    if (disposed || !input.isConnected || document.activeElement !== input) return;

    const rect = input.getBoundingClientRect();
    const viewportTop = viewport?.offsetTop || 0;
    const viewportHeight = viewport?.height || window.innerHeight;
    const portRect = owner?.getBoundingClientRect();
    const top = Math.max(viewportTop, portRect ? portRect.top + owner!.clientTop : viewportTop);
    const bottom = Math.min(
      viewportTop + viewportHeight,
      portRect ? portRect.top + owner!.clientTop + owner!.clientHeight : Infinity
    );
    const buffer = Math.min(28, Math.max(0, (bottom - top - rect.height) / 2));
    const errorRect = input.parentElement?.querySelector('[role="alert"]')?.getBoundingClientRect();
    const targetBottom =
      errorRect && errorRect.bottom - rect.top <= bottom - top - buffer * 2
        ? Math.max(rect.bottom, errorRect.bottom)
        : rect.bottom;
    const occlusion = Math.max(0, window.innerHeight - viewportHeight - viewportTop);
    const padding = `${basePadding + occlusion + buffer}px`;
    paddingTarget.style.paddingBottom = padding;
    appliedPadding = padding;
    const delta =
      targetBottom > bottom - buffer
        ? targetBottom - bottom + buffer
        : rect.top < top + buffer
          ? rect.top - top - buffer
          : 0;
    if (delta && scrollport)
      scrollport.scrollTop = Math.max(
        0,
        Math.min(scrollport.scrollHeight - scrollport.clientHeight, scrollport.scrollTop + delta)
      );
  };

  const schedule = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(ensureVisible);
  };

  input.focus({ preventScroll: true });
  if (select && input.type !== 'date') input.select();

  schedule();
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  window.addEventListener('resize', schedule);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  if (input.parentElement) observer?.observe(input.parentElement);

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    window.cancelAnimationFrame(frame);
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    observer?.disconnect();
    if (appliedPadding !== null && paddingTarget.style.paddingBottom === appliedPadding) {
      paddingTarget.style.paddingBottom = oldPadding;
    }
    if (activeEditors.get(paddingTarget) === cleanup) activeEditors.delete(paddingTarget);
  };
  activeEditors.set(paddingTarget, cleanup);
  return cleanup;
}
