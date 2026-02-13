/*
================================================================================
File: tests/component-tests/AddCategoryButton.test.js
Description: Component tests for AddCategoryButton.vue.
             Tests rendering and click event emission.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-06
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AddCategoryButton from '../../source/components/AddCategoryButton.vue';

// -----------------------------------------------------------------------------
// AddCategoryButton Component Tests
// -----------------------------------------------------------------------------

describe('AddCategoryButton', () => {
  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = () => {
    return mount(AddCategoryButton);
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 2: Should display the i18n label text
    it('should display the new category label', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('category.newCategory');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Events
  // ---------------------------------------------------------------------------

  describe('events', () => {
    // Test Case 3: Should emit click event when button is clicked
    it('should emit "click" when button is clicked', async () => {
      const wrapper = createWrapper();
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toHaveLength(1);
    });
  });
});
