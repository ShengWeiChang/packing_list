/*
================================================================================
File: source/utils/positioning.js
Description: Positioning helpers for dropdowns/popovers.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

/**
 * Calculate a clamped left position for a dropdown.
 *
 * @param {{ left: number, top: number }} anchorRect - Anchor/button bounding rect.
 * @param {{ width: number, height: number }} dropdownRect - Dropdown bounding rect.
 * @param {number} viewportWidth - Current viewport width in pixels.
 * @param {object} [options] - Optional clamp settings.
 * @param {number} [options.minPadding=8] - Minimum padding from viewport edges.
 * @returns {number} Clamped left position in pixels.
 */
export function clampDropdownLeft(
  anchorRect,
  dropdownRect,
  viewportWidth,
  { minPadding = 8 } = {}
) {
  let left = anchorRect.left;
  const maxLeft = viewportWidth - dropdownRect.width - minPadding;

  if (left < minPadding) left = minPadding;
  if (left > maxLeft) left = maxLeft;

  return left;
}

/**
 * Position a dropdown above an anchor/button, clamped within the viewport.
 *
 * @param {{ left: number, top: number }} anchorRect - Anchor/button bounding rect.
 * @param {{ width: number, height: number }} dropdownRect - Dropdown bounding rect.
 * @param {{ width: number }} viewport - Viewport dimensions used for clamping.
 * @param {object} [options] - Optional positioning settings.
 * @param {number} [options.gap=8] - Vertical gap between anchor and dropdown.
 * @param {number} [options.minPadding=8] - Minimum horizontal viewport padding.
 * @returns {{ position: 'fixed', left: string, top: string, zIndex: number }} CSS positioning object for inline style binding.
 */
export function positionDropdownAbove(
  anchorRect,
  dropdownRect,
  viewport,
  { gap = 8, minPadding = 8 } = {}
) {
  const left = clampDropdownLeft(anchorRect, dropdownRect, viewport.width, { minPadding });
  const top = anchorRect.top - dropdownRect.height - gap;

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999,
  };
}
