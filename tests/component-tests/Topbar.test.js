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
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should render a header element
    it('should render a header element', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('header').exists()).toBe(true);
    });

    // Test Case 2: Should be hidden on desktop viewport (md:hidden class)
    it('should have md:hidden class for mobile-only visibility', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('header').classes()).toContain('md:hidden');
    });

    // Test Case 3: Should render toggle and new checklist buttons
    it('should render two action buttons', () => {
      const wrapper = createWrapper();
      const buttons = wrapper.findAll('button');
      expect(buttons).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Events
  // ---------------------------------------------------------------------------

  describe('events', () => {
    // Test Case 4: Should emit toggle when hamburger button is clicked
    it('should emit "toggle" when hamburger button is clicked', async () => {
      const wrapper = createWrapper();
      const buttons = wrapper.findAll('button');
      await buttons[0].trigger('click');
      expect(wrapper.emitted('toggle')).toHaveLength(1);
    });

    // Test Case 5: Should emit new when plus button is clicked
    it('should emit "new" when plus button is clicked', async () => {
      const wrapper = createWrapper();
      const buttons = wrapper.findAll('button');
      await buttons[1].trigger('click');
      expect(wrapper.emitted('new')).toHaveLength(1);
    });
  });
});
