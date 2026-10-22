/*
================================================================================
File: source/utils/focusEditingInput.js
Description: Focus and select inline-edit inputs without unnecessary page
             movement while preserving mobile keyboard visibility.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-20
================================================================================
*/

/**
 * Focus and select an inline-edit input, scrolling only when it is outside the
 * currently visible viewport.
 * @param {HTMLInputElement|null} input - Input to focus and select
 * @returns {Function} Cleanup function for scheduled work and viewport listeners
 */
export function focusEditingInput(input) {
  if (!input) return () => {};

  let disposed = false;
  const viewport = typeof window !== 'undefined' ? window.visualViewport : null;

  const ensureVisible = () => {
    if (disposed || document.activeElement !== input) return;

    const rect = input.getBoundingClientRect();
    const viewportTop = viewport?.offsetTop || 0;
    const viewportHeight = viewport?.height || window.innerHeight;
    const viewportBottom = viewportTop + viewportHeight;

    if (rect.top < viewportTop || rect.bottom > viewportBottom) {
      input.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  };

  input.focus({ preventScroll: true });
  input.select();

  const animationFrame = window.requestAnimationFrame(ensureVisible);
  viewport?.addEventListener('resize', ensureVisible);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrame);
    viewport?.removeEventListener('resize', ensureVisible);
  };
}
