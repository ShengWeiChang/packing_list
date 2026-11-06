/*
================================================================================
File: source/utils/positioning.ts
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
  anchorRect: { left: number; top: number },
  dropdownRect: { width: number; height: number },
  viewportWidth: number,
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
  anchorRect: { left: number; top: number },
  dropdownRect: { width: number; height: number },
  viewport: { width: number },
  { gap = 8, minPadding = 8 } = {}
) {
  const left = clampDropdownLeft(anchorRect, dropdownRect, viewport.width, { minPadding });
  const top = anchorRect.top - dropdownRect.height - gap;

  return {
    position: 'fixed' as const,
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999,
  };
}

/** Fit an anchored menu above or below its trigger in the visible viewport. */
export function positionDropdownWithinViewport(
  anchor: Pick<DOMRect, 'right' | 'top' | 'bottom'>,
  menu: Pick<DOMRect, 'width' | 'height'>,
  viewport: { left: number; top: number; width: number; height: number },
  minVisibleHeight = 0
) {
  const edge = 8;
  const gap = 6;
  const topEdge = viewport.top + edge;
  const bottomEdge = viewport.top + viewport.height - edge;
  const below = Math.max(0, bottomEdge - anchor.bottom - gap);
  const above = Math.max(0, anchor.top - gap - topEdge);
  const openAbove = menu.height > below && above > below;
  const available = Math.max(1, openAbove ? above : below);
  const viewportHeight = Math.max(1, bottomEdge - topEdge);
  const overlapAnchor = available < Math.min(minVisibleHeight, viewportHeight);
  const maxHeight = overlapAnchor ? viewportHeight : available;
  const height = Math.min(menu.height, maxHeight);
  const left = Math.max(
    viewport.left + edge,
    Math.min(anchor.right - menu.width, viewport.left + viewport.width - menu.width - edge)
  );
  const top = Math.max(
    topEdge,
    Math.min(
      overlapAnchor ? topEdge : openAbove ? anchor.top - gap - height : anchor.bottom + gap,
      bottomEdge - height
    )
  );
  return {
    position: 'fixed' as const,
    left: `${left}px`,
    top: `${top}px`,
    maxHeight: `${maxHeight}px`,
    maxWidth: `${Math.max(1, viewport.width - edge * 2)}px`,
    overflowY: 'auto' as const,
    zIndex: 9999,
  };
}
