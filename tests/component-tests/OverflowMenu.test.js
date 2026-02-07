/*
================================================================================
File: tests/component-tests/OverflowMenu.test.js
Description: Component tests for OverflowMenu.vue.
             Tests menu toggle, action emissions, and edit mode behavior.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-06
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OverflowMenu from '../../source/components/OverflowMenu.vue';

// -----------------------------------------------------------------------------
// OverflowMenu Component Tests
// -----------------------------------------------------------------------------

describe('OverflowMenu', () => {
  let wrapper;

  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    // Mock getBoundingClientRect for dropdown positioning
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 100,
      right: 200,
      bottom: 140,
      width: 100,
      height: 40,
      x: 100,
      y: 100,
    }));
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    wrapper = mount(OverflowMenu, {
      props: {
        itemId: 'test-id',
        menuType: 'item',
        ...props,
      },
      attachTo: document.body,
    });
    return wrapper;
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should render the menu trigger button
    it('should render the menu trigger button', () => {
      const w = createWrapper();
      expect(w.find('button').exists()).toBe(true);
    });

    // Test Case 2: Should show three-dot icon when not editing
    it('should show three-dot icon when not editing', () => {
      const w = createWrapper({ isEditing: false });
      const circles = w.findAll('circle');
      expect(circles.length).toBe(3);
    });

    // Test Case 3: Should show checkmark icon when isEditing is true
    it('should show checkmark icon when isEditing is true', () => {
      const w = createWrapper({ isEditing: true });
      const circles = w.findAll('circle');
      expect(circles.length).toBe(0);
      // Should have a path element for the checkmark
      expect(w.find('path').exists()).toBe(true);
    });

    // Test Case 4: Dropdown should not be visible initially
    it('should not show dropdown menu initially', () => {
      const w = createWrapper();
      // Only the trigger button should exist
      expect(w.findAll('button').length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Menu Toggle
  // ---------------------------------------------------------------------------

  describe('menu toggle', () => {
    // Test Case 5: Should show dropdown when trigger button is clicked
    it('should show dropdown menu when trigger button is clicked', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      // After click: 1 trigger + 3 actions (edit, copy, delete) = 4
      expect(w.findAll('button').length).toBe(4);
    });

    // Test Case 6: Should hide dropdown on second click
    it('should hide dropdown menu when trigger button is clicked again', async () => {
      const w = createWrapper();
      const trigger = w.find('button');
      await trigger.trigger('click');
      await trigger.trigger('click');
      expect(w.findAll('button').length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Menu Actions
  // ---------------------------------------------------------------------------

  describe('menu actions', () => {
    // Test Case 7: Should emit edit when edit option is clicked
    it('should emit "edit" when edit option is clicked', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      const actionButtons = w.findAll('button');
      // [0]=trigger, [1]=edit, [2]=copy, [3]=delete
      await actionButtons[1].trigger('click');
      expect(w.emitted('edit')).toHaveLength(1);
    });

    // Test Case 8: Should emit copy when copy option is clicked
    it('should emit "copy" when copy option is clicked', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      const actionButtons = w.findAll('button');
      await actionButtons[2].trigger('click');
      expect(w.emitted('copy')).toHaveLength(1);
    });

    // Test Case 9: Should emit delete when delete option is clicked
    it('should emit "delete" when delete option is clicked', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      const actionButtons = w.findAll('button');
      await actionButtons[3].trigger('click');
      expect(w.emitted('delete')).toHaveLength(1);
    });

    // Test Case 10: Should close dropdown after an action is performed
    it('should close dropdown after an action is performed', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      const actionButtons = w.findAll('button');
      await actionButtons[1].trigger('click'); // edit
      // Should be back to just the trigger button
      expect(w.findAll('button').length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Edit Mode
  // ---------------------------------------------------------------------------

  describe('edit mode', () => {
    // Test Case 11: Should emit confirm-edit when checkmark is clicked
    it('should emit "confirm-edit" when checkmark is clicked in edit mode', async () => {
      const w = createWrapper({ isEditing: true });
      await w.find('button').trigger('click');
      expect(w.emitted('confirm-edit')).toHaveLength(1);
    });

    // Test Case 12: Should not open dropdown menu when in edit mode
    it('should not open dropdown menu when in edit mode', async () => {
      const w = createWrapper({ isEditing: true });
      await w.find('button').trigger('click');
      // Should only have the trigger button, no menu items
      expect(w.findAll('button').length).toBe(1);
    });
  });
});
