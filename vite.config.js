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
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export default defineConfig({
  plugins: [vue()],
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    cssTarget: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./source', import.meta.url)),
    },
  },
});
