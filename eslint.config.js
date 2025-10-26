/*
================================================================================
File: eslint.config.js
Description: ESLint configuration - sets up rules and plugins for code quality
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-10-26
================================================================================
*/

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginVue from 'eslint-plugin-vue';

export default [
  // Ignore patterns
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '!eslint.config.js'],
  },

  // Base JS rules
  js.configs.recommended,

  // Vue recommended rules
  ...pluginVue.configs['flat/recommended'],

  // Custom rules and plugins
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        CustomEvent: 'readonly',
        crypto: 'readonly',
        confirm: 'readonly',
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      jsdoc,
    },
    rules: {
      // Import/Export sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // JSDoc rules
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
        },
      ],
      'jsdoc/require-param': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'warn',

      // Vue specific rules
      'vue/multi-word-component-names': 'off', // Allow single-word component names (Item, Category, etc.)
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'warn',
      'vue/no-mutating-props': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',

      // Vue template attributes order (based on official recommendation)
      'vue/attributes-order': [
        'error',
        {
          order: [
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'GLOBAL',
            ['UNIQUE', 'SLOT'],
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'OTHER_ATTR',
            'EVENTS',
            'CONTENT',
          ],
          alphabetical: false,
        },
      ],

      // General JS best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Disable conflicting rules with Prettier
  eslintConfigPrettier,
];
