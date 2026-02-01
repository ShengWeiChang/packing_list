/*
================================================================================
File: tailwind.config.js
Description: Tailwind CSS configuration - content paths and theme extensions.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

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
        primary: 'var(--text-primary)', // 灰黑色 #212121 (主要文字)
        secondary: 'var(--text-secondary)', // 灰色 #646464 (次要文字)

        // Background colors - for bg-primary, bg-secondary classes
        // Note: Using nested object so bg-primary works (not bg-bg-primary)
        'bg-primary': 'var(--bg-primary)', // 白色 (卡片、sidebar)
        'bg-secondary': 'var(--bg-secondary)', // 淺灰 (頁面背景)

        // Theme/Brand colors - for progress bars, accents
        'theme-primary': 'var(--theme-primary)', // 深森林綠 #2f6b46
        'theme-secondary': 'var(--theme-secondary)', // 淺灰綠 #d3e3db

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
      },
    },
  },
  plugins: [],
};
