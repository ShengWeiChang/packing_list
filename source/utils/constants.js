/*
================================================================================
File: source/utils/constants.js
Description: Application constants including theme colors, storage keys and
             configuration values.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  APP_DATA: 'packingListApp',
};

/**
 * Minimum and maximum values for form inputs
 */
export const VALIDATION = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  NOTES_MAX_LENGTH: 500,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 999,
};

/**
 * Theme Color System - Single Source of Truth
 *
 * Naming Logic:
 * - text-primary / text-secondary: Text colors (charcoal, gray)
 * - bg-primary / bg-secondary: Background colors (white, light gray)
 * - theme-primary / theme-secondary: Brand colors (green, light green)
 *
 * Usage:
 * - CSS: var(--text-primary), var(--bg-primary)
 * - Tailwind: text-primary, bg-primary (requires registration in tailwind.config.js)
 * - JS: THEME_COLORS.textPrimary, THEME_COLORS.bgPrimary
 *
 * Run `npm run build:css-vars` after making changes to regenerate CSS
 */
export const THEME_COLORS = {
  // ============================================================================
  // Text Colors
  // ============================================================================

  textPrimary: 'rgba(33, 33, 33, 1)', // Primary text - charcoal gray #212121
  textSecondary: 'rgba(100, 100, 100, 1)', // Secondary text - gray #646464

  // ============================================================================
  // Background Colors
  // ============================================================================

  bgPrimary: 'rgba(255, 255, 255, 1)', // Primary background - white (cards, sidebar)
  bgSecondary: 'rgba(248, 250, 252, 1)', // Secondary background - light gray (page background)

  // ============================================================================
  // Theme/Brand Colors
  // ============================================================================

  themePrimary: 'rgba(47, 107, 70, 1)', // Primary brand color - dark forest green #2f6b46 (progress bar)
  themeSecondary: 'rgba(211, 227, 219, 1)', // Secondary brand color - light grayish green #d3e3db (progress bar background)

  // ============================================================================
  // Drag & Drop Colors
  // ============================================================================

  ghostBackground: 'rgba(243, 244, 246, 1)', // Ghost background (gray-100)
  ghostBorder: 'rgba(156, 163, 175, 1)', // Ghost border (gray-400)
  dropZone: 'rgba(239, 246, 255, 1)', // Drop zone (blue-50)

  // ============================================================================
  // Shadow Colors
  // ============================================================================

  shadowLight: 'rgba(0, 0, 0, 0.05)', // Light shadow
  shadowMedium: 'rgba(0, 0, 0, 0.1)', // Medium shadow
  shadowSuccess: 'rgba(34, 197, 94, 0.3)', // Success animation shadow (green-500)
  shadowSuccessLight: 'rgba(34, 197, 94, 0.2)',

  // ============================================================================
  // Status Colors - Success
  // ============================================================================

  success: 'rgba(22, 163, 74, 1)', // Success border (green-600)

  // ============================================================================
  // Status Colors - Pending (Orange theme)
  // ============================================================================

  pending: 'rgba(255, 247, 237, 1)', // Pending background (orange-50)
  pendingForeground: 'rgba(124, 45, 18, 1)', // Pending text (orange-900)
  pendingAccent: 'rgba(234, 88, 12, 1)', // Pending accent (orange-600)
  pendingButton: 'rgba(249, 115, 22, 1)', // Pending button (orange-500)

  // ============================================================================
  // Overlay Colors
  // ============================================================================

  overlay: 'rgba(0, 0, 0, 0.5)', // Overlay background

  // ============================================================================
  // Interaction Colors (Interactive States)
  // ============================================================================

  interactiveFocus: 'rgba(59, 130, 246, 1)', // Focus indicator - blue #3b82f6 (blue-500)
  interactiveHover: 'rgba(243, 244, 246, 1)', // Hover background - light gray #f3f4f6 (gray-100)
  interactiveHoverLight: 'rgba(249, 250, 251, 1)', // Hover background (light) - very light gray #f9fafb (gray-50)
  interactiveHoverDark: 'rgba(229, 231, 235, 1)', // Hover background (dark) - medium gray #e5e7eb (gray-200)

  // ============================================================================
  // Surface Colors (Surface Decoration - borders, controls)
  // ============================================================================

  borderLight: 'rgba(229, 231, 235, 1)', // Light border #e5e7eb (gray-200)
  borderMedium: 'rgba(209, 213, 219, 1)', // Medium border #d1d5db (gray-300)
  borderDark: 'rgba(156, 163, 175, 1)', // Dark border #9ca3af (gray-400)

  controlBg: 'rgba(243, 244, 246, 1)', // Control background #f3f4f6 (gray-100)
  controlHover: 'rgba(229, 231, 235, 1)', // Control hover #e5e7eb (gray-200)
  controlAccent: 'rgba(75, 85, 99, 1)', // Control accent #4b5563 (gray-600)

  // ============================================================================
  // State Colors - Success/Complete (Green theme)
  // ============================================================================

  successBg: 'rgba(240, 253, 244, 1)', // Success background #f0fdf4 (green-50)
  successText: 'rgba(22, 163, 74, 1)', // Success text #16a34a (green-600)
  successTextDark: 'rgba(21, 128, 61, 1)', // Success text (dark) #15803d (green-700)
  successBorder: 'rgba(134, 239, 172, 1)', // Success border #86efac (green-300)
  successAccent: 'rgba(22, 163, 74, 1)', // Success accent #16a34a (green-600)
  successTextComplete: 'rgba(22, 101, 52, 1)', // Complete text (darkest) #166534 (green-800)

  // ============================================================================
  // State Colors - Danger/Delete (Red theme)
  // ============================================================================

  dangerText: 'rgba(220, 38, 38, 1)', // Danger text #dc2626 (red-600)
  dangerBg: 'rgba(254, 242, 242, 1)', // Danger background #fef2f2 (red-50)
  dangerFocus: 'rgba(239, 68, 68, 1)', // Danger focus #ef4444 (red-500)
};
