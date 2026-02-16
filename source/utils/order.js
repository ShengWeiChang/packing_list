/*
================================================================================
File: source/utils/order.js
Description: Utilities for handling ordered lists (e.g., checklists/categories)
             in a consistent, testable way.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

/**
 * Renumber the `order` field based on array index.
 *
 * @template T
 * @param {Array<T & { order?: number }>} items - Items to renumber.
 * @param {object} [options] - Optional renumbering configuration.
 * @param {number} [options.start=0] - Starting order value.
 * @returns {Array<T & { order: number }>} New array with updated order fields.
 */
export function renumberOrder(items, { start = 0 } = {}) {
  return (items || []).map((item, index) => ({
    ...item,
    order: start + index,
  }));
}
