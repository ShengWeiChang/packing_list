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
 * 命名邏輯：
 * - text-primary / text-secondary: 文字色（灰黑、灰）
 * - bg-primary / bg-secondary: 背景色（白、淺灰）
 * - theme-primary / theme-secondary: 品牌色（綠、淺綠）
 *
 * 使用方式：
 * - CSS: var(--text-primary), var(--bg-primary)
 * - Tailwind: text-primary, bg-primary (需在 tailwind.config.js 註冊)
 * - JS: THEME_COLORS.textPrimary, THEME_COLORS.bgPrimary
 *
 * Run `npm run build:css-vars` after making changes to regenerate CSS
 */
export const THEME_COLORS = {
  // ============================================================================
  // Text Colors (文字色)
  // ============================================================================

  textPrimary: 'rgba(33, 33, 33, 1)', // 主要文字 - 灰黑色 #212121
  textSecondary: 'rgba(100, 100, 100, 1)', // 次要文字 - 灰色 #646464

  // ============================================================================
  // Background Colors (背景色)
  // ============================================================================

  bgPrimary: 'rgba(255, 255, 255, 1)', // 主要背景 - 白色 (卡片、sidebar)
  bgSecondary: 'rgba(248, 250, 252, 1)', // 次要背景 - 淺灰 (頁面背景)

  // ============================================================================
  // Theme/Brand Colors (品牌色)
  // ============================================================================

  themePrimary: 'rgba(47, 107, 70, 1)', // 品牌主色 - 深森林綠 #2f6b46 (進度條)
  themeSecondary: 'rgba(211, 227, 219, 1)', // 品牌副色 - 淺灰綠 #d3e3db (進度條背景)

  // ============================================================================
  // Drag & Drop Colors (拖放相關)
  // ============================================================================

  ghostBackground: 'rgba(243, 244, 246, 1)', // ghost 背景 (gray-100)
  ghostBorder: 'rgba(156, 163, 175, 1)', // ghost 邊框 (gray-400)
  dropZone: 'rgba(239, 246, 255, 1)', // 放置區 (blue-50)

  // ============================================================================
  // Shadow Colors (陰影色)
  // ============================================================================

  shadowLight: 'rgba(0, 0, 0, 0.05)', // 淡陰影
  shadowMedium: 'rgba(0, 0, 0, 0.1)', // 中陰影
  shadowSuccess: 'rgba(34, 197, 94, 0.3)', // 成功動畫陰影 (green-500)
  shadowSuccessLight: 'rgba(34, 197, 94, 0.2)',

  // ============================================================================
  // Status Colors - Success (成功狀態)
  // ============================================================================

  success: 'rgba(22, 163, 74, 1)', // 成功邊框 (green-600)

  // ============================================================================
  // Status Colors - Pending (待辦狀態 - 橘色系)
  // ============================================================================

  pending: 'rgba(255, 247, 237, 1)', // 待辦背景 (orange-50)
  pendingForeground: 'rgba(124, 45, 18, 1)', // 待辦文字 (orange-900)
  pendingAccent: 'rgba(234, 88, 12, 1)', // 待辦強調 (orange-600)
  pendingButton: 'rgba(249, 115, 22, 1)', // 待辦按鈕 (orange-500)

  // ============================================================================
  // Overlay Colors (覆蓋層)
  // ============================================================================

  overlay: 'rgba(0, 0, 0, 0.5)', // 遮罩背景
};
