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

    // Mock requestAnimationFrame to execute synchronously
    vi.stubGlobal('requestAnimationFrame', (cb) => cb());
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

  // ---------------------------------------------------------------------------
  // Test Group 5: Close Handlers
  // ---------------------------------------------------------------------------

  describe('close handlers', () => {
    // Test Case 13: Should close menu on outside click
    it('should close menu when clicking outside the component', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      expect(w.findAll('button').length).toBe(4);

      // Click outside
      document.dispatchEvent(new Event('click', { bubbles: true }));
      await w.vm.$nextTick();

      expect(w.findAll('button').length).toBe(1);
    });

    // Test Case 14: Should close menu on scroll
    it('should close menu on window scroll', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      expect(w.findAll('button').length).toBe(4);

      window.dispatchEvent(new Event('scroll'));
      await w.vm.$nextTick();

      expect(w.findAll('button').length).toBe(1);
    });

    // Test Case 15: Should close menu on focusout to external element
    it('should close menu when focus leaves the component', async () => {
      const w = createWrapper();
      await w.find('button').trigger('click');
      expect(w.findAll('button').length).toBe(4);

      // Trigger focusout with relatedTarget outside component
      const rootDiv = w.find('.relative');
      await rootDiv.trigger('focusout', { relatedTarget: document.body });

      expect(w.findAll('button').length).toBe(1);
    });

    // Test Case 16: Should close this menu when another overflow menu opens
    it('should close when another overflow menu opens', async () => {
      const w = createWrapper({ itemId: 'my-id', menuType: 'item' });
      await w.find('button').trigger('click');
      expect(w.findAll('button').length).toBe(4);

      // Simulate another menu opening
      window.dispatchEvent(
        new CustomEvent('overflow-menu-open', {
          detail: { id: 'other-id', type: 'item' },
        })
      );
      await w.vm.$nextTick();

      expect(w.findAll('button').length).toBe(1);
    });

    // Test Case 17: Should NOT close when same menu dispatches its own open event
    it('should not close when the same menu dispatches its own open event', async () => {
      const w = createWrapper({ itemId: 'my-id', menuType: 'item' });
      await w.find('button').trigger('click');
      expect(w.findAll('button').length).toBe(4);

      // Simulate same menu opening (should be ignored)
      window.dispatchEvent(
        new CustomEvent('overflow-menu-open', {
          detail: { id: 'my-id', type: 'item' },
        })
      );
      await w.vm.$nextTick();

      expect(w.findAll('button').length).toBe(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: SVG Size
  // ---------------------------------------------------------------------------

  describe('icon sizing', () => {
    // Test Case 18: Should use smaller icon for item menu type
    it('should use size-4 class for item menu type', () => {
      const w = createWrapper({ menuType: 'item' });
      const svg = w.find('svg');
      expect(svg.classes()).toContain('size-4');
    });

    // Test Case 19: Should use larger icon for category menu type
    it('should use size-5 class for category menu type', () => {
      const w = createWrapper({ menuType: 'category' });
      const svg = w.find('svg');
      expect(svg.classes()).toContain('size-5');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Dropdown Positioning
  // ---------------------------------------------------------------------------

  describe('dropdown positioning', () => {
    // Test Case 20: Should apply fixed positioning when menu opens
    it('should apply fixed positioning styles to dropdown', async () => {
      // Use deferred rAF so positionDropdown runs after Vue renders the dropdown
      const rafCallbacks = [];
      vi.stubGlobal('requestAnimationFrame', (cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });

      const w = createWrapper();
      await w.find('button').trigger('click');
      await w.vm.$nextTick(); // Vue renders v-if="showMenu" dropdown

      // Flush the two nested rAF callbacks
      while (rafCallbacks.length) rafCallbacks.shift()();
      await w.vm.$nextTick();

      const dropdownEl = w.find('[style*="position: fixed"]');
      expect(dropdownEl.exists()).toBe(true);
      const style = dropdownEl.attributes('style');
      expect(style).toContain('position: fixed');
      expect(style).not.toContain('-9999px');
    });

    // Test Case 21: Should dispatch custom event when menu opens
    it('should dispatch overflow-menu-open CustomEvent when opened', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const w = createWrapper({ itemId: 'test-item', menuType: 'item' });

      await w.find('button').trigger('click');

      const customEvents = dispatchSpy.mock.calls.filter(
        (call) => call[0] instanceof CustomEvent && call[0].type === 'overflow-menu-open'
      );
      expect(customEvents.length).toBe(1);
      expect(customEvents[0][0].detail).toEqual({ id: 'test-item', type: 'item' });
    });

    // Test Case 22: Should clamp dropdown position within viewport bounds
    it('should clamp dropdown position within viewport bounds', async () => {
      // Use deferred rAF
      const rafCallbacks = [];
      vi.stubGlobal('requestAnimationFrame', (cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });

      // Mock getBoundingClientRect to return position near viewport edge
      Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100,
        left: 2,
        right: 102,
        bottom: 140,
        width: 100,
        height: 40,
        x: 2,
        y: 100,
      });

      const w = createWrapper();
      await w.find('button').trigger('click');
      await w.vm.$nextTick();

      while (rafCallbacks.length) rafCallbacks.shift()();
      await w.vm.$nextTick();

      const dropdownEl = w.find('[style*="position: fixed"]');
      expect(dropdownEl.exists()).toBe(true);
      const style = dropdownEl.attributes('style');
      expect(style).toContain('position: fixed');
      // Left should be clamped to minimum padding (8px) since btnRect.right - ddRect.width = 2
      expect(style).toContain('left: 8px');
    });

    // Test Case 23: Should use CustomEvent fallback when constructor throws
    it('should fall back to createEvent when CustomEvent constructor throws', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

      // Mock CustomEvent constructor to throw
      const origCustomEvent = window.CustomEvent;
      vi.stubGlobal('CustomEvent', function () {
        throw new Error('Not supported');
      });

      const w = createWrapper({ itemId: 'fallback-id', menuType: 'category' });
      await w.find('button').trigger('click');

      // The fallback should have dispatched an event via createEvent
      expect(dispatchSpy).toHaveBeenCalled();
      const lastCall = dispatchSpy.mock.calls[dispatchSpy.mock.calls.length - 1][0];
      expect(lastCall.type).toBe('overflow-menu-open');

      // Restore
      vi.stubGlobal('CustomEvent', origCustomEvent);
    });
  });
});
