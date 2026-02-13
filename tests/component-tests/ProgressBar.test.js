/*
================================================================================
File: tests/component-tests/ProgressBar.test.js
Description: Component tests for ProgressBar.vue.
             Tests rendering, computed percentage, and accessibility attributes.
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

import ProgressBar from '../../source/components/ProgressBar.vue';

// -----------------------------------------------------------------------------
// ProgressBar Component Tests
// -----------------------------------------------------------------------------

describe('ProgressBar', () => {
  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    return mount(ProgressBar, {
      props: {
        total: 10,
        completed: 5,
        ...props,
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should display progress text as "completed / total"
    it('should display progress text as "completed / total"', () => {
      const wrapper = createWrapper({ total: 10, completed: 3 });
      expect(wrapper.text()).toContain('3 / 10');
    });

    // Test Case 2: Should display the correct percentage
    it('should display the correct percentage', () => {
      const wrapper = createWrapper({ total: 10, completed: 3 });
      expect(wrapper.text()).toContain('30%');
    });

    // Test Case 3: Progress bar fill should have correct width style
    it('should set progress bar fill width based on percentage', () => {
      const wrapper = createWrapper({ total: 10, completed: 5 });
      const fill = wrapper.get('[data-testid="progress-bar-fill"]');
      expect(fill.attributes('style')).toContain('width: 50%');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Percentage Calculation
  // ---------------------------------------------------------------------------

  describe('percentage calculation', () => {
    // Test Case 4: Should show 0% when total is 0
    it('should show 0% when total is 0', () => {
      const wrapper = createWrapper({ total: 0, completed: 0 });
      expect(wrapper.text()).toContain('0%');
      expect(wrapper.text()).toContain('0 / 0');
    });

    // Test Case 5: Should show 100% when all items are completed
    it('should show 100% when all items are completed', () => {
      const wrapper = createWrapper({ total: 5, completed: 5 });
      expect(wrapper.text()).toContain('100%');
    });

    // Test Case 6: Should round percentage to nearest integer
    it('should round percentage to nearest integer', () => {
      const wrapper = createWrapper({ total: 3, completed: 1 });
      // 1/3 = 33.33...% → rounds to 33%
      expect(wrapper.text()).toContain('33%');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Accessibility
  // ---------------------------------------------------------------------------

  describe('accessibility', () => {
    // Test Case 8: Should have correct ARIA value attributes
    it('should have correct aria-valuenow, aria-valuemin, and aria-valuemax', () => {
      const wrapper = createWrapper({ total: 10, completed: 7 });
      const progressbar = wrapper.find('[role="progressbar"]');
      expect(progressbar.attributes('aria-valuenow')).toBe('70');
      expect(progressbar.attributes('aria-valuemin')).toBe('0');
      expect(progressbar.attributes('aria-valuemax')).toBe('100');
    });

    // Test Case 9: Should have an aria-label describing progress
    it('should have an aria-label describing progress', () => {
      const wrapper = createWrapper({ total: 10, completed: 7 });
      const progressbar = wrapper.find('[role="progressbar"]');
      // Global $t mock returns the i18n key as-is
      expect(progressbar.attributes('aria-label')).toBe('progress.label');
    });
  });
});
