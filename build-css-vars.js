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
const themeColorsMatch = constantsContent.match(/export const THEME_COLORS = {([\s\S]*?)^};/m);

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
 * Convert SCREAMING_SNAKE_CASE or camelCase to kebab-case
 * @param {string} str - input string
 * @returns {string} - kebab-case string
 */
function toKebabCase(str) {
  return str
    .split('_') // Split by underscores first
    .map((part) => {
      // Convert each part from camelCase to kebab-case
      return part
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Add hyphen between lowercase and uppercase
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Handle consecutive capitals
        .toLowerCase();
    })
    .join('-'); // Join all parts with hyphens
}

/**
 * Parse THEME_COLORS object recursively
 * @param {string} content - JS object content as string
 * @param {string} prefix - CSS variable prefix
 * @returns {object} - flat object with CSS variable names as keys
 */
function parseThemeColors(content, prefix = '') {
  const colors = {};
  const lines = content.split('\n');

  let currentKey = '';
  let nestedContent = '';
  let braceLevel = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('//') || trimmed === '') continue;

    // Check for nested object
    const nestedMatch = trimmed.match(/^(\w+):\s*{/);
    if (nestedMatch) {
      currentKey = nestedMatch[1];
      braceLevel = 1;
      nestedContent = '';
      continue;
    }

    // Inside nested object
    if (braceLevel > 0) {
      nestedContent += line + '\n';
      braceLevel += (line.match(/{/g) || []).length;
      braceLevel -= (line.match(/}/g) || []).length;

      if (braceLevel === 0) {
        // Recursively parse nested content
        const nestedColors = parseThemeColors(
          nestedContent,
          prefix + toKebabCase(currentKey) + '-'
        );
        Object.assign(colors, nestedColors);
        currentKey = '';
        nestedContent = '';
      }
      continue;
    }

    // Parse color value
    const colorMatch = trimmed.match(/^(\w+):\s*'(rgba?\([^)]+\))',?/);
    if (colorMatch) {
      const key = colorMatch[1];
      const value = colorMatch[2];
      const varName = '--color-' + prefix + toKebabCase(key);
      colors[varName] = normalizeColor(value);
    }
  }

  return colors;
}

// Parse theme colors
const themeColorsContent = themeColorsMatch[1];
const cssVars = parseThemeColors(themeColorsContent);

// Generate CSS variables string
let cssVarsString = '  /* Theme Colors - Auto-generated from constants.js */\n';
cssVarsString += '  /* DO NOT EDIT THIS SECTION MANUALLY */\n';
cssVarsString += '  /* Run: npm run build:css-vars to regenerate */\n\n';

// Group by category for better readability
const groups = {
  text: [],
  theme: [],
  background: [],
  pending: [],
};

for (const [varName, value] of Object.entries(cssVars)) {
  if (varName.includes('text-')) {
    groups.text.push(`  ${varName}: ${value};`);
  } else if (varName.includes('pending-items-')) {
    groups.pending.push(`  ${varName}: ${value};`);
  } else if (varName.includes('background-')) {
    groups.background.push(`  ${varName}: ${value};`);
  } else {
    groups.theme.push(`  ${varName}: ${value};`);
  }
}

// Add text colors
if (groups.text.length > 0) {
  cssVarsString += '  /* Text Colors */\n';
  cssVarsString += groups.text.join('\n') + '\n\n';
}

// Add theme colors
if (groups.theme.length > 0) {
  cssVarsString += '  /* Theme Colors */\n';
  cssVarsString += groups.theme.join('\n') + '\n\n';
}

// Add background colors
if (groups.background.length > 0) {
  cssVarsString += '  /* Background Colors */\n';
  cssVarsString += groups.background.join('\n') + '\n\n';
}

// Add pending items colors
if (groups.pending.length > 0) {
  cssVarsString += '  /* Pending Items Colors */\n';
  cssVarsString += groups.pending.join('\n') + '\n';
}

// Read current index.css
const cssPath = join(__dirname, 'source', 'index.css');
let cssContent = readFileSync(cssPath, 'utf-8');

// Define markers for auto-generated section
const startMarker = '  /* Theme Colors - Auto-generated from constants.js */';
const endMarker = '  /* Additional utility colors (manually maintained) */';

// Find the auto-generated section
const startIndex = cssContent.indexOf(startMarker);
const endIndex = cssContent.indexOf(endMarker);

if (startIndex === -1) {
  console.error('   Could not find start marker in index.css');
  console.error('   Expected: "/* Theme Colors - Auto-generated from constants.js */"');
  process.exit(1);
}

if (endIndex === -1) {
  console.error('。 Could not find end marker in index.css');
  console.error('   Expected: "/* Additional utility colors (manually maintained) */"');
  process.exit(1);
}

// Replace the auto-generated section
const beforeSection = cssContent.substring(0, startIndex);
const afterSection = cssContent.substring(endIndex);

cssContent = beforeSection + cssVarsString + '\n' + afterSection;

// Write updated CSS
writeFileSync(cssPath, cssContent, 'utf-8');

console.log('  CSS variables generated successfully!');
console.log(`   Generated ${Object.keys(cssVars).length} CSS variables`);
console.log('   Output: source/index.css');
