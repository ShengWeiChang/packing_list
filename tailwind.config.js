/*
================================================================================
File: tailwind.config.js
Description: Tailwind CSS configuration - content paths and theme extensions.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export default {
  content: ['./index.html', './source/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
      },
      colors: {
        // ====================================================================
        // Semantic Colors (mapped to CSS variables from constants.js)
        // Usage: text-primary, text-secondary, bg-primary, bg-secondary
        // ====================================================================

        // Text colors - for text-primary, text-secondary classes
        primary: 'var(--text-primary)', // Charcoal gray #212121 (primary text)
        secondary: 'var(--text-secondary)', // Gray #646464 (secondary text)

        // Background colors - for bg-primary, bg-secondary classes
        // Note: Using nested object so bg-primary works (not bg-bg-primary)
        'bg-primary': 'var(--bg-primary)', // White (cards, sidebar)
        'bg-secondary': 'var(--bg-secondary)', // Light gray (page background)

        // Theme/Brand colors - for progress bars, accents
        'theme-primary': 'var(--theme-primary)', // Dark forest green #2f6b46
        'theme-secondary': 'var(--theme-secondary)', // Light grayish green #d3e3db

        // Drag & Drop colors
        ghost: {
          DEFAULT: 'var(--ghost-background)',
          border: 'var(--ghost-border)',
        },
        dropzone: 'var(--drop-zone)',

        // Shadow colors (for box-shadow in scoped styles)
        shadow: {
          light: 'var(--shadow-light)',
          medium: 'var(--shadow-medium)',
          success: 'var(--shadow-success)',
          'success-light': 'var(--shadow-success-light)',
        },

        // Success color
        success: 'var(--success)',

        // Status colors - Pending (orange)
        pending: {
          DEFAULT: 'var(--pending)',
          foreground: 'var(--pending-foreground)',
          accent: 'var(--pending-accent)',
          button: 'var(--pending-button)',
        },

        // Overlay
        overlay: 'var(--overlay)',

        // ====================================================================
        // Interaction Colors (Interactive States)
        // ====================================================================

        interactive: {
          focus: 'var(--interactive-focus)', // Blue focus ring
          hover: 'var(--interactive-hover)', // Hover background (light gray)
          'hover-light': 'var(--interactive-hover-light)', // Hover background (very light)
          'hover-dark': 'var(--interactive-hover-dark)', // Hover background (darker)
        },

        // ====================================================================
        // Surface Colors (Surface Decoration)
        // ====================================================================

        'border-color': {
          light: 'var(--border-light)', // Light border
          medium: 'var(--border-medium)', // Medium border
          dark: 'var(--border-dark)', // Dark border
        },

        control: {
          bg: 'var(--control-bg)', // Control background
          hover: 'var(--control-hover)', // Control hover
          accent: 'var(--control-accent)', // Control accent
        },

        // ====================================================================
        // State Colors - Success/Complete
        // ====================================================================

        'success-state': {
          bg: 'var(--success-bg)', // Success background
          text: 'var(--success-text)', // Success text
          'text-dark': 'var(--success-text-dark)', // Success text (darker)
          border: 'var(--success-border)', // Success border
          accent: 'var(--success-accent)', // Success accent
          complete: 'var(--success-text-complete)', // Complete text (darkest)
        },

        // ====================================================================
        // State Colors - Danger/Delete
        // ====================================================================

        danger: {
          text: 'var(--danger-text)', // Danger text
          bg: 'var(--danger-bg)', // Danger background
          focus: 'var(--danger-focus)', // Danger focus
        },
      },
    },
  },
  plugins: [],
};
