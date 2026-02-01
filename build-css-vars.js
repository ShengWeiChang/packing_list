#!/usr/bin/env node

/*
================================================================================
File: build-css-vars.js
Description: Automatically generates CSS custom properties (variables) from
             JavaScript theme constants. This ensures single source of truth
             for all color definitions.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-11-01
================================================================================
*/

/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Node.js globals for build scripts
const { process } = globalThis;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import theme colors from constants
const constantsPath = join(__dirname, 'source', 'utils', 'constants.js');
const constantsContent = readFileSync(constantsPath, 'utf-8');

// Extract THEME_COLORS object using regex
const themeColorsMatch = constantsContent.match(/export const THEME_COLORS = \{([\s\S]*?)\n\};/m);

if (!themeColorsMatch) {
  console.error('Could not find THEME_COLORS in constants.js');
  process.exit(1);
}

/**
 * Convert rgba string to appropriate CSS format
 * - Fully opaque colors (alpha = 1) -> hex format (#212121)
 * - Transparent colors (alpha < 1) -> keep rgba format
 * @param {string} rgba - rgba string like "rgba(33, 33, 33, 1)" or "rgba(0, 0, 0, 0.5)"
 * @returns {string} - hex string like "#212121" or rgba string
 */
function normalizeColor(rgba) {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgba;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] ? parseFloat(match[4]) : 1;

  // If fully opaque, convert to hex
  if (a === 1) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Keep rgba format for transparent colors
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Convert camelCase to kebab-case
 * @param {string} str - input string (e.g., "cardForeground")
 * @returns {string} - kebab-case string (e.g., "card-foreground")
 */
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Parse flat THEME_COLORS object
 * @param {string} content - JS object content as string
 * @returns {object} - flat object with CSS variable names as keys
 */
function parseThemeColors(content) {
  const colors = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed === '' ||
      trimmed.startsWith('*')
    ) {
      continue;
    }

    // Parse color value: key: 'rgba(...)',
    const colorMatch = trimmed.match(/^(\w+):\s*'(rgba?\([^)]+\))',?/);
    if (colorMatch) {
      const key = colorMatch[1];
      const value = colorMatch[2];
      const varName = '--' + toKebabCase(key);
      colors[varName] = normalizeColor(value);
    }
  }

  return colors;
}

// Parse theme colors
const themeColorsContent = themeColorsMatch[1];
const cssVars = parseThemeColors(themeColorsContent);

// Generate CSS variables string
let cssVarsString =
  '  /* ============================================================================\n';
cssVarsString += '   * Theme Colors - Auto-generated from constants.js\n';
cssVarsString += '   * DO NOT EDIT THIS SECTION MANUALLY\n';
cssVarsString += '   * Run: npm run build:css-vars to regenerate\n';
cssVarsString +=
  '   * ============================================================================ */\n\n';

// Group variables by category for better readability
const groups = {
  text: ['--text-primary', '--text-secondary'],
  background: ['--bg-primary', '--bg-secondary'],
  theme: ['--theme-primary', '--theme-secondary'],
  dragDrop: ['--ghost-background', '--ghost-border', '--drop-zone'],
  shadow: ['--shadow-light', '--shadow-medium', '--shadow-success', '--shadow-success-light'],
  success: ['--success'],
  pending: ['--pending', '--pending-foreground', '--pending-accent', '--pending-button'],
  overlay: ['--overlay'],
  interaction: [
    '--interactive-focus',
    '--interactive-hover',
    '--interactive-hover-light',
    '--interactive-hover-dark',
  ],
  surface: [
    '--border-light',
    '--border-medium',
    '--border-dark',
    '--control-bg',
    '--control-hover',
    '--control-accent',
  ],
  stateSuccess: [
    '--success-bg',
    '--success-text',
    '--success-text-dark',
    '--success-border',
    '--success-accent',
    '--success-text-complete',
  ],
  stateDanger: ['--danger-text', '--danger-bg', '--danger-focus'],
};

// Text colors
cssVarsString += '  /* Text Colors */\n';
for (const varName of groups.text) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Background colors
cssVarsString += '  /* Background Colors */\n';
for (const varName of groups.background) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Theme/Brand colors
cssVarsString += '  /* Theme/Brand Colors */\n';
for (const varName of groups.theme) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Drag & Drop colors
cssVarsString += '  /* Drag & Drop Colors */\n';
for (const varName of groups.dragDrop) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Shadow colors
cssVarsString += '  /* Shadow Colors */\n';
for (const varName of groups.shadow) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Success colors
cssVarsString += '  /* Success Colors */\n';
for (const varName of groups.success) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Pending status colors
cssVarsString += '  /* Pending Status Colors */\n';
for (const varName of groups.pending) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Overlay colors
cssVarsString += '  /* Overlay Colors */\n';
for (const varName of groups.overlay) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Interaction colors
cssVarsString += '  /* Interaction Colors */\n';
for (const varName of groups.interaction) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// Surface colors
cssVarsString += '  /* Surface Colors */\n';
for (const varName of groups.surface) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// State - Success colors
cssVarsString += '  /* State - Success/Complete Colors */\n';
for (const varName of groups.stateSuccess) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}
cssVarsString += '\n';

// State - Danger colors
cssVarsString += '  /* State - Danger/Delete Colors */\n';
for (const varName of groups.stateDanger) {
  if (cssVars[varName]) {
    cssVarsString += `  ${varName}: ${cssVars[varName]};\n`;
  }
}

// Read current index.css
const cssPath = join(__dirname, 'source', 'index.css');
let cssContent = readFileSync(cssPath, 'utf-8');

// Define markers for auto-generated section
const startMarker =
  '  /* ============================================================================';
const endMarker =
  '\n\n  /* ============================================================================\n   * Legacy';

// Find the :root section and replace
const rootStart = cssContent.indexOf(':root {');
const rootEnd = cssContent.indexOf('}', rootStart);

if (rootStart === -1) {
  console.error('Could not find :root section in index.css');
  process.exit(1);
}

// Build new :root content
const newRootContent = `:root {\n${cssVarsString}}`;

// Find where :root ends and what comes after
const afterRoot = cssContent.substring(rootEnd + 1);

// Rebuild the CSS file
const beforeRoot = cssContent.substring(0, rootStart);
cssContent = beforeRoot + newRootContent + afterRoot;

// Write updated CSS
writeFileSync(cssPath, cssContent, 'utf-8');

console.log('CSS variables generated successfully!');
console.log('Generated ' + Object.keys(cssVars).length + ' CSS variables');
console.log('Output: source/index.css');
