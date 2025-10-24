/*
================================================================================
File: source/utils/helpers.js
Description: Utility helper functions for ID generation, validation and
             common operations.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

/**
 * Format a date string to localized date format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a secure unique ID using crypto.randomUUID when available,
 * with a safe fallback for older browsers/environments.
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Secure unique ID
 */
export function generateSecureId(prefix = '') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return `${prefix}${crypto.randomUUID()}`;
    } catch {
      // fall through to fallback
    }
  }
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Calculate percentage
 * @param {number} numerator - The numerator
 * @param {number} denominator - The denominator
 * @returns {number} Percentage rounded to nearest integer
 */
export function calculatePercentage(numerator, denominator) {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
