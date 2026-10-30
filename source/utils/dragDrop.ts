/*
================================================================================
File: source/utils/dragDrop.ts
Description: Small, testable helpers for drag-and-drop configuration.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

/**
 * Create a vuedraggable `group.put` guard that only allows drops from a specific
 * group name.
 *
 * vuedraggable / Sortable signature: put(to, from, dragEl, evt)
 *
 * @param {string} allowedGroupName - Source drag group name allowed to drop.
 * @returns {Function} Predicate used by Sortable to allow or block drops.
 */
export function putOnlyFromGroup(allowedGroupName: string) {
  return function putGuard(
    _to: unknown,
    from: { options?: { group?: { name?: string } } } | null | undefined,
    _dragEl: unknown,
    _evt: unknown
  ) {
    const fromGroupName = from?.options?.group?.name;
    return fromGroupName === allowedGroupName;
  };
}
