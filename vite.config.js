/*
================================================================================
File: vite.config.js
Description: Vite configuration - sets up Vue plugin and path aliases for the project.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './source'),
    },
  },
});
