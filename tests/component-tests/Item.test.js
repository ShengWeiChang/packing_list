/*
================================================================================
File: tests/component-tests/Item.test.js
Description: Component tests for Item.vue.
             Tests checkbox toggle, edit mode, quantity controls, pending state,
             and event emissions.
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

import Item from '../../source/components/Item.vue';
import { mockGetBoundingClientRect } from '../test-setup/domMocks';

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const createMockItem = (overrides = {}) => ({
  id: 'item-1',
  name: 'Passport',
  quantity: 1,
  categoryId: 'cat-1',
  isPacked: false,
  isPending: false,
  checklistId: 'cl-1',
  order: 0,
  ...overrides,
});

const BLUR_SETTLE_MS = 100;

// -----------------------------------------------------------------------------
// Item Component Tests
// -----------------------------------------------------------------------------

describe('Item', () => {
  let wrapper;

  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    // Mock window.matchMedia for hover detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(hover: hover)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock getBoundingClientRect for OverflowMenu positioning
    mockGetBoundingClientRect({ top: 0, left: 0, right: 100, bottom: 40, x: 0, y: 0 });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    wrapper = mount(Item, {
      props: {
        item: createMockItem(),
        ...props,
      },
      global: {
        stubs: {
          OverflowMenu: true,
        },
      },
      attachTo: document.body,
    });
    return wrapper;
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should display the item name
    it('should display the item name', () => {
      const w = createWrapper();
      expect(w.text()).toContain('Passport');
    });

    // Test Case 2: Should render a checkbox input
    it('should render a checkbox input', () => {
      const w = createWrapper();
      const checkbox = w.get('input[type="checkbox"]');
      expect(checkbox.attributes('type')).toBe('checkbox');
    });

    // Test Case 3: Should check the checkbox when item is packed
    it('should check the checkbox when item is packed', () => {
      const w = createWrapper({
        item: createMockItem({ isPacked: true }),
      });
      const checkbox = w.find('input[type="checkbox"]');
      expect(checkbox.element.checked).toBe(true);
    });

    // Test Case 4: Should apply line-through styling when item is packed
    it('should apply line-through styling when item is packed', () => {
      const w = createWrapper({
        item: createMockItem({ isPacked: true }),
      });
      const nameSpan = w.find('span[role="button"]');
      expect(nameSpan.classes()).toContain('line-through');
    });

    // Test Case 5: Should display quantity
    it('should display quantity value', () => {
      const w = createWrapper({
        item: createMockItem({ quantity: 3 }),
      });
      expect(w.text()).toContain('x');
      expect(w.text()).toContain('3');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Checkbox Interaction
  // ---------------------------------------------------------------------------

  describe('checkbox interaction', () => {
    // Test Case 6: Should emit update:item with toggled isPacked
    it('should emit "update:item" with toggled isPacked when checkbox is clicked', async () => {
      const w = createWrapper();
      const checkbox = w.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      const emitted = w.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].isPacked).toBe(true);
    });

    // Test Case 7: Should clear isPending when item becomes packed
    it('should clear isPending when item becomes packed', async () => {
      const w = createWrapper({
        item: createMockItem({ isPending: true }),
      });
      const checkbox = w.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      const emitted = w.emitted('update:item');
      expect(emitted[0][0].isPacked).toBe(true);
      expect(emitted[0][0].isPending).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Edit Mode
  // ---------------------------------------------------------------------------

  describe('edit mode', () => {
    // Test Case 8: Should show input field when item name is clicked
    it('should enter edit mode when item name is clicked', async () => {
      const w = createWrapper();
      const nameSpan = w.get('span[role="button"]');
      await nameSpan.trigger('click');

      expect(w.get('[data-testid="item-edit-input"]').element.value).toBe('Passport');
    });

    // Test Case 9: Should save edited name on Enter key
    it('should save edited name on Enter key', async () => {
      const w = createWrapper();
      await w.find('span[role="button"]').trigger('click');

      const input = w.find('[data-testid="item-edit-input"]');
      await input.setValue('Updated Passport');
      await input.trigger('keydown.enter');

      const emitted = w.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].name).toBe('Updated Passport');
    });

    // Test Case 10: Should cancel edit mode on Escape key
    it('should cancel edit mode on Escape key', async () => {
      const w = createWrapper();
      await w.find('span[role="button"]').trigger('click');

      const input = w.find('[data-testid="item-edit-input"]');
      await input.setValue('Changed Name');
      await input.trigger('keyup.escape');

      // Should exit edit mode, showing the span again with original name
      expect(w.get('span[role="button"]').text()).toBe('Passport');
      expect(w.text()).toContain('Passport');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Quantity Controls
  // ---------------------------------------------------------------------------

  describe('quantity controls', () => {
    // Test Case 11: Should increment quantity
    it('should emit "update:item" with incremented quantity', async () => {
      const w = createWrapper({
        item: createMockItem({ quantity: 2 }),
      });

      const incrementButton = w
        .findAll('button')
        .find((btn) => btn.attributes('aria-label') === 'item.increaseQuantity');
      await incrementButton.trigger('click');

      const emitted = w.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].quantity).toBe(3);
    });

    // Test Case 12: Should decrement quantity
    it('should emit "update:item" with decremented quantity', async () => {
      const w = createWrapper({
        item: createMockItem({ quantity: 3 }),
      });

      const decrementButton = w
        .findAll('button')
        .find((btn) => btn.attributes('aria-label') === 'item.decreaseQuantity');
      await decrementButton.trigger('click');

      const emitted = w.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].quantity).toBe(2);
    });

    // Test Case 13: Should emit delete:item when quantity is 1 and delete button clicked
    it('should emit "delete:item" when quantity is 1 and delete button is clicked', async () => {
      const w = createWrapper({
        item: createMockItem({ quantity: 1 }),
      });

      const deleteButton = w
        .findAll('button')
        .find((btn) => btn.attributes('aria-label') === 'common.delete');
      await deleteButton.trigger('click');

      expect(w.emitted('delete:item')).toHaveLength(1);
      expect(w.emitted('delete:item')[0][0]).toBe('item-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: Pending State
  // ---------------------------------------------------------------------------

  describe('pending state', () => {
    // Test Case 14: Should toggle pending state
    it('should emit "update:item" with toggled isPending', async () => {
      const w = createWrapper();

      const pendingButton = w
        .findAll('button')
        .find((btn) => btn.attributes('aria-label') === 'item.markAsPending');
      await pendingButton.trigger('click');

      const emitted = w.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].isPending).toBe(true);
      expect(emitted[0][0].isPacked).toBe(false);
    });

    // Test Case 15: Should clear isPacked when item is marked as pending
    it('should clear isPacked when item is marked as pending', async () => {
      const w = createWrapper({
        item: createMockItem({ isPacked: true }),
      });

      const pendingButton = w
        .findAll('button')
        .find((btn) => btn.attributes('aria-label') === 'item.markAsPending');
      await pendingButton.trigger('click');

      const emitted = w.emitted('update:item');
      expect(emitted[0][0].isPending).toBe(true);
      expect(emitted[0][0].isPacked).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Copy Event
  // ---------------------------------------------------------------------------

  describe('copy event', () => {
    // Test Case 16: Should emit copy:item from OverflowMenu
    it('should emit "copy:item" when OverflowMenu triggers copy', async () => {
      const w = createWrapper();
      const menu = w.findComponent({ name: 'OverflowMenu' });
      await menu.vm.$emit('copy');

      expect(w.emitted('copy:item')).toHaveLength(1);
      expect(w.emitted('copy:item')[0][0]).toBe('item-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Blur Save
  // ---------------------------------------------------------------------------

  describe('blur save', () => {
    // Test Case 17: Should save on blur when name is changed
    it('should emit "update:item" on blur with changed name', async () => {
      vi.useFakeTimers();
      const w = createWrapper();
      await w.find('span[role="button"]').trigger('click');

      const input = w.find('[data-testid="item-edit-input"]');
      await input.setValue('Updated Passport');

      // Move focus away from input to trigger blur-save logic
      input.element.blur();
      document.body.focus();

      // Trigger focusout on the wrapper div (which has the handler)
      const editWrapper = input.element.parentElement;
      editWrapper.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

      // Advance past the 50ms blur timeout
      vi.advanceTimersByTime(BLUR_SETTLE_MS);
      await w.vm.$nextTick();

      const emitted = w.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].name).toBe('Updated Passport');
      vi.useRealTimers();
    });

    // Test Case 18: Should not save empty name on blur
    it('should not emit "update:item" on blur with empty name', async () => {
      vi.useFakeTimers();
      const w = createWrapper();
      await w.find('span[role="button"]').trigger('click');

      const input = w.find('[data-testid="item-edit-input"]');
      await input.setValue('');

      input.element.blur();
      document.body.focus();
      const editWrapper = input.element.parentElement;
      editWrapper.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

      vi.advanceTimersByTime(BLUR_SETTLE_MS);
      await w.vm.$nextTick();

      // Empty name should never trigger update:item (saveEdit guards on trim())
      expect(w.emitted('update:item')).toBeUndefined();
      vi.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Delete from OverflowMenu
  // ---------------------------------------------------------------------------

  describe('delete from overflow menu', () => {
    // Test Case 19: Should emit delete:item from OverflowMenu
    it('should emit "delete:item" when OverflowMenu triggers delete', async () => {
      const w = createWrapper();
      const menu = w.findComponent({ name: 'OverflowMenu' });
      await menu.vm.$emit('delete');

      expect(w.emitted('delete:item')).toHaveLength(1);
      expect(w.emitted('delete:item')[0][0]).toBe('item-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Hover & Visibility
  // ---------------------------------------------------------------------------

  describe('hover and visibility', () => {
    // Test Case 20: Should show controls on mouseenter
    it('should show action buttons on mouseenter', async () => {
      const w = createWrapper();
      const mainDiv = w.get('[data-testid="item-row"]');
      await mainDiv.trigger('mouseenter');

      // OverflowMenu should get forceVisible=true
      const menu = w.findComponent({ name: 'OverflowMenu' });
      expect(menu.props('forceVisible')).toBe(true);
    });

    // Test Case 21: Should hide controls on mouseleave
    it('should hide action buttons on mouseleave', async () => {
      const w = createWrapper();
      const mainDiv = w.get('[data-testid="item-row"]');
      await mainDiv.trigger('mouseenter');
      await mainDiv.trigger('mouseleave');

      const menu = w.findComponent({ name: 'OverflowMenu' });
      expect(menu.props('forceVisible')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 10: IME Composition
  // ---------------------------------------------------------------------------

  describe('IME composition', () => {
    // Test Case 22: Should not save on Enter during IME composition
    it('should not save during IME composition', async () => {
      const w = createWrapper();
      await w.find('span[role="button"]').trigger('click');

      const input = w.find('[data-testid="item-edit-input"]');
      await input.setValue('新護照');

      await input.trigger('compositionstart');
      await input.trigger('keydown.enter');

      // Should NOT emit during composition
      expect(w.emitted('update:item')).toBeUndefined();

      await input.trigger('compositionend');
      await input.trigger('keydown.enter');

      // NOW it should emit
      expect(w.emitted('update:item')).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 11: Newly Created Item Watcher
  // ---------------------------------------------------------------------------

  describe('newly created item watcher', () => {
    // Test Case 23: Should auto-start edit when newlyCreatedItemId matches
    it('should enter edit mode when newlyCreatedItemId matches', async () => {
      const w = createWrapper({ newlyCreatedItemId: null });

      expect(w.find('[data-testid="item-edit-input"]').exists()).toBe(false);

      await w.setProps({ newlyCreatedItemId: 'item-1' });
      await w.vm.$nextTick();
      await w.vm.$nextTick();

      expect(w.get('[data-testid="item-edit-input"]').attributes('data-testid')).toBe(
        'item-edit-input'
      );
    });

    // Test Case 24: Should not start edit for non-matching item ID
    it('should not enter edit mode when newlyCreatedItemId does not match', async () => {
      const w = createWrapper({ newlyCreatedItemId: null });
      await w.setProps({ newlyCreatedItemId: 'item-other' });
      await w.vm.$nextTick();

      expect(w.find('[data-testid="item-edit-input"]').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 12: Quantity Edge Cases
  // ---------------------------------------------------------------------------

  describe('quantity edge cases', () => {
    // Test Case 25: Should not decrement below 1
    it('should not decrement quantity below 1', async () => {
      const w = createWrapper({
        item: createMockItem({ quantity: 1 }),
      });

      // At quantity=1, the decrement button becomes a delete button
      const btn = w.get('[data-testid="item-quantity-decrement"]');
      expect(btn.attributes('aria-label')).toBe('common.delete');

      await btn.trigger('click');

      // Should emit delete:item, NOT update:item with decremented quantity
      expect(w.emitted('delete:item')).toHaveLength(1);
      expect(w.emitted('update:item')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 13: Dragging State
  // ---------------------------------------------------------------------------

  describe('dragging state', () => {
    // Test Case 26: Should apply dragging class when isDragging is true
    it('should apply cursor-grabbing when isDragging is true', () => {
      const w = createWrapper({ isDragging: true });
      const mainDiv = w.get('[data-testid="item-row"]');
      expect(mainDiv.classes()).toContain('cursor-grabbing');
    });
  });
});
