/*
================================================================================
File: tests/component-tests/Topbar.test.js
Description: Component tests for Topbar.vue.
             Tests rendering, navigation toggle, and new checklist actions.
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

import Topbar from '../../source/components/Topbar.vue';

// -----------------------------------------------------------------------------
// Topbar Component Tests
// -----------------------------------------------------------------------------

describe('Topbar', () => {
  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    return mount(Topbar, {
      props: {
        title: 'Packing List',
        ...props,
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Events
  // ---------------------------------------------------------------------------

  describe('events', () => {
    // Test Case 1: Should emit toggle when hamburger button is clicked
    it('should emit "toggle" when hamburger button is clicked', async () => {
      const wrapper = createWrapper();
      await wrapper.get('[data-testid="topbar-toggle"]').trigger('click');
      expect(wrapper.emitted('toggle')).toHaveLength(1);
    });

    // Test Case 2: Should emit new when plus button is clicked
    it('should emit "new" when plus button is clicked', async () => {
      const wrapper = createWrapper();
      await wrapper.get('[data-testid="topbar-new"]').trigger('click');
      expect(wrapper.emitted('new')).toHaveLength(1);
    });
  });
});
