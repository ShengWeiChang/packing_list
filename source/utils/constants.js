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
  MAX_QUANTITY: 999
};

/**
 * 6-Color Theme System - Source of Truth
 * Simplified for easy theme switching
 */
export const THEME_COLORS = {
  // 2 Text colors
  TEXT_PRIMARY: 'rgba(33, 33, 33, 1)',        // dark gray (main text)
  TEXT_SECONDARY: 'rgba(100, 100, 100, 1)',   // lighter gray (secondary text)

  // 2 Theme colors
  PRIMARY: 'rgba(47, 107, 70, 1)',            // deep forest green (actions, progress)
  SECONDARY: 'rgba(211, 227, 219, 1)',        // gray-green (completion states, accents)

  // 2 Background colors
  BACKGROUND_PRIMARY: 'rgba(255, 255, 255, 1)', // white (cards, panels, sidebar)
  BACKGROUND_SECONDARY: 'rgba(248, 250, 252, 1)' // light gray (app background, hover states)
};
