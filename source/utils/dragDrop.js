/*
================================================================================
File: source/utils/dragDrop.js
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
 * @returns {(to: any, from: any, dragEl: any, evt: any) => boolean} Predicate used by Sortable to allow or block drops.
 */
export function putOnlyFromGroup(allowedGroupName) {
  return function putGuard(_to, from, _dragEl, _evt) {
    const fromGroupName = from?.options?.group?.name;
    return fromGroupName === allowedGroupName;
  };
}
