/*
================================================================================
File: source/utils/order.ts
Description: Utilities for handling ordered lists (e.g., checklists/categories)
             in a consistent, testable way.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

/**
 * Renumber the `order` field based on array index.
 * The spread result is plain data; pass model DTOs rather than class instances.
 *
 * @template T
 * @param {Array<T & { order?: number }>} items - Items to renumber.
 * @param {object} [options] - Optional renumbering configuration.
 * @param {number} [options.start=0] - Starting order value.
 * @returns {Array<T & { order: number }>} New array with updated order fields.
 */
export function renumberOrder<T extends Record<string, unknown>>(
  items: T[],
  { start = 0 } = {}
): (Omit<T, 'order'> & { order: number })[] {
  return (items || []).map((item, index) => ({
    ...item,
    order: start + index,
  }));
}

/**
 * Reorder only the visible slots in a complete ordered collection.
 * Hidden entries remain in their original slots while visible entries are
 * replaced in the order supplied by the drag interaction.
 *
 * @template T
 * @param {Array<T & { id: string, order?: number }>} items - Complete ordered collection.
 * @param {Array<T & { id: string, order?: number }>} reorderedVisibleItems - Visible entries after reordering.
 * @param {(item: T) => boolean} isVisible - Visibility predicate.
 * @returns {Array<T & { id: string, order: number }>} Merged collection with sequential order.
 */
export function reorderVisibleSlots<T extends Record<string, unknown> & { id: string }>(
  items: T[],
  reorderedVisibleItems: T[],
  isVisible: (item: T) => boolean
) {
  const completeItems = items || [];
  const visibleItems = reorderedVisibleItems || [];
  const expectedIds = completeItems.filter(isVisible).map((item) => item.id);
  const reorderedIds = visibleItems.map((item) => item.id);

  if (
    expectedIds.length !== reorderedIds.length ||
    expectedIds.some((id) => !reorderedIds.includes(id))
  ) {
    return renumberOrder(completeItems);
  }

  let visibleIndex = 0;
  const mergedItems = completeItems.map((item) => {
    if (!isVisible(item)) return item;
    const replacement = visibleItems[visibleIndex]!; // Count and membership checked above.
    visibleIndex += 1;
    return replacement;
  });

  return renumberOrder(mergedItems);
}

/**
 * Insert an entry using its position among currently visible entries.
 * The entry is inserted before the visible anchor at `visibleIndex`; dropping
 * after the last visible entry appends it to the complete collection.
 *
 * @template T
 * @param {Array<T & { id: string, order?: number }>} items - Complete target collection.
 * @param {T & { id: string, order?: number }} item - Entry to insert.
 * @param {number} visibleIndex - Drop position in the visible collection.
 * @param {(item: T) => boolean} isVisible - Visibility predicate.
 * @returns {Array<T & { id: string, order: number }>} Collection with the inserted entry.
 */
export function insertAtVisibleIndex<T extends Record<string, unknown> & { id: string }>(
  items: T[],
  item: T,
  visibleIndex: number,
  isVisible: (item: T) => boolean
) {
  const completeItems = (items || []).filter((entry) => entry.id !== item.id);
  const visibleItems = completeItems.filter(isVisible);
  const normalizedIndex = Math.max(0, Math.min(Number(visibleIndex) || 0, visibleItems.length));

  if (normalizedIndex === visibleItems.length) {
    return renumberOrder([...completeItems, item]);
  }

  const anchorId = visibleItems[normalizedIndex]!.id;
  const fullIndex = completeItems.findIndex((entry) => entry.id === anchorId);
  const withInsertedItem = [...completeItems];
  withInsertedItem.splice(fullIndex, 0, item);
  return renumberOrder(withInsertedItem);
}
