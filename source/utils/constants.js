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
 * All colors should be defined here and used via CSS variables
 * Run `npm run build:css-vars` after making changes to regenerate CSS
 */
export const THEME_COLORS = {
  // ============================================================================
  // Core Theme Colors (6-Color System)
  // ============================================================================

  // Text colors
  TEXT_PRIMARY: 'rgba(33, 33, 33, 1)', // dark gray (main text)
  TEXT_SECONDARY: 'rgba(100, 100, 100, 1)', // lighter gray (secondary text)

  // Brand theme colors
  PRIMARY: 'rgba(47, 107, 70, 1)', // deep forest green (actions, progress)
  SECONDARY: 'rgba(211, 227, 219, 1)', // gray-green (completion states, accents)

  // Background colors
  BACKGROUND_PRIMARY: 'rgba(255, 255, 255, 1)', // white (cards, panels, sidebar)
  BACKGROUND_SECONDARY: 'rgba(248, 250, 252, 1)', // light gray (app background, hover states)

  // ============================================================================
  // Pending Items Theme Colors
  // ============================================================================

  PENDING_ITEMS: {
    BACKGROUND: 'rgba(255, 247, 237, 1)', // orange-50 (light orange background)
    TEXT: 'rgba(124, 45, 18, 1)', // orange-900 (dark orange text)
    ACCENT: 'rgba(234, 88, 12, 1)', // orange-600 (accent color)
    BUTTON: 'rgba(249, 115, 22, 1)', // orange-500 (button background)
    BUTTON_HOVER: 'rgba(234, 88, 12, 1)', // orange-600 (button hover)
  },

  // ============================================================================
  // Utility Colors (Gray Scale)
  // ============================================================================

  GRAY: {
    GRAY_50: 'rgba(249, 250, 251, 1)', // lightest gray
    GRAY_100: 'rgba(243, 244, 246, 1)', // very light gray (drag ghost bg)
    GRAY_200: 'rgba(229, 231, 235, 1)', // light gray
    GRAY_300: 'rgba(209, 213, 219, 1)', // medium-light gray
    GRAY_400: 'rgba(156, 163, 175, 1)', // medium gray (borders, dashed lines)
    GRAY_600: 'rgba(75, 85, 99, 1)', // dark gray
  },

  // ============================================================================
  // Semantic Colors (Green for success/completion)
  // ============================================================================

  GREEN: {
    GREEN_50: 'rgba(240, 253, 244, 1)', // lightest green
    GREEN_100: 'rgba(220, 252, 231, 1)', // very light green
    GREEN_200: 'rgba(187, 247, 208, 1)', // light green
    GREEN_300: 'rgba(134, 239, 172, 1)', // medium-light green
    GREEN_500: 'rgba(34, 197, 94, 1)', // medium green
    GREEN_600: 'rgba(16, 185, 129, 1)', // primary green (animations, borders)
    GREEN_800: 'rgba(5, 126, 71, 1)', // dark green
  },

  // ============================================================================
  // Additional Utility Colors (Orange for highlights)
  // ============================================================================

  ORANGE: {
    ORANGE_50: 'rgba(255, 247, 237, 1)', // lightest orange
    ORANGE_500: 'rgba(249, 115, 22, 1)', // medium orange
    ORANGE_600: 'rgba(234, 88, 12, 1)', // primary orange
    ORANGE_900: 'rgba(124, 45, 18, 1)', // dark orange
  },

  // ============================================================================
  // Additional Utility Colors (Blue for info/drops)
  // ============================================================================

  BLUE: {
    BLUE_50: 'rgba(239, 246, 255, 1)', // lightest blue (drop zones)
    BLUE_300: 'rgba(147, 197, 253, 1)', // light blue
    BLUE_500: 'rgba(59, 130, 246, 1)', // medium blue
  },

  // ============================================================================
  // System Colors (Shadows, Overlays)
  // ============================================================================

  SHADOW: {
    BLACK_10: 'rgba(0, 0, 0, 0.1)', // light shadow
    BLACK_5: 'rgba(0, 0, 0, 0.05)', // very light shadow
    BLACK_4: 'rgba(0, 0, 0, 0.04)', // extra light shadow
    BLACK_6: 'rgba(0, 0, 0, 0.06)', // subtle shadow
    GREEN_30: 'rgba(16, 185, 129, 0.3)', // success shadow
    GREEN_20: 'rgba(16, 185, 129, 0.2)', // success shadow light
  },

  OVERLAY: {
    BACKDROP: 'rgba(0, 0, 0, 0.5)', // modal/overlay backdrop
  },
};
