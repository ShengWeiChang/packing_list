/*
================================================================================
File: tests/component-tests/AddItemButton.test.js
Description: Component tests for AddItemButton.vue.
             Tests rendering, styling based on category state, and click events.
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

import AddItemButton from '../../source/components/AddItemButton.vue';

// -----------------------------------------------------------------------------
// AddItemButton Component Tests
// -----------------------------------------------------------------------------

describe('AddItemButton', () => {
  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    return mount(AddItemButton, {
      props: {
        categoryCompleted: false,
        ...props,
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should render the add item button with label
    it('should render the add item button with label', () => {
      const wrapper = createWrapper();
      const button = wrapper.get('button');
      expect(button.element.tagName).toBe('BUTTON');
      expect(wrapper.text()).toContain('item.newItem');
    });

    // Test Case 2: Should apply success background when category is completed
    it('should apply success background when category is completed', () => {
      const wrapper = createWrapper({ categoryCompleted: true });
      const button = wrapper.find('button');
      expect(button.classes()).toContain('bg-success-state-bg');
    });

    // Test Case 3: Should apply default background when category is not completed
    it('should apply default background when category is not completed', () => {
      const wrapper = createWrapper({ categoryCompleted: false });
      const button = wrapper.find('button');
      expect(button.classes()).toContain('bg-white');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Events
  // ---------------------------------------------------------------------------

  describe('events', () => {
    // Test Case 4: Should emit click event when button is clicked
    it('should emit "click" when button is clicked', async () => {
      const wrapper = createWrapper();
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Hover State
  // ---------------------------------------------------------------------------

  describe('hover state', () => {
    // Test Case 5: Should apply primary text on mouseenter
    it('should apply primary text color on mouseenter', async () => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('mouseenter');

      const icon = wrapper.get('[data-testid="add-item-button-icon"]');
      expect(icon.classes()).toContain('text-primary');
    });

    // Test Case 6: Should revert to secondary text on mouseleave
    it('should revert to secondary text color on mouseleave', async () => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('mouseenter');
      await button.trigger('mouseleave');

      const icon = wrapper.get('[data-testid="add-item-button-icon"]');
      expect(icon.classes()).toContain('text-secondary');
    });

    // Test Case 7: Should apply primary text on focus
    it('should apply primary text color on focus', async () => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('focus');

      const icon = wrapper.get('[data-testid="add-item-button-icon"]');
      expect(icon.classes()).toContain('text-primary');
    });

    // Test Case 8: Should revert to secondary text on blur
    it('should revert to secondary text color on blur', async () => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('focus');
      await button.trigger('blur');

      const icon = wrapper.get('[data-testid="add-item-button-icon"]');
      expect(icon.classes()).toContain('text-secondary');
    });
  });
});
