/*
================================================================================
File: tailwind.config.js
Description: Tailwind CSS configuration - content paths and theme extensions.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
Last-Modified: 2025-10-01
================================================================================
*/

module.exports = {
  content: [
    "./index.html",
    "./source/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif']
      }
    },
  },
  plugins: [],
}
