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

import { flushPromises, mount } from '@vue/test-utils';
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
    try {
      wrapper?.unmount();
    } finally {
      vi.useRealTimers();
    }
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
    // Retain the item name draft until save succeeds.
    // Test Case 1: keeps an item name draft on failed save and closes only after a successful retry.
    it('keeps an item name draft on failed save and closes only after a successful retry', async () => {
      const saveItemEdit = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'item-1' });
      const w = createWrapper({ saveItemEdit });
      const draft = 'A long item name that should remain available when saving fails';
      await w.get('[data-testid="item-name"]').trigger('click');
      await w.get('[data-testid="item-edit-input"]').setValue(draft);
      await w.get('[data-testid="item-edit-input"]').trigger('keydown.enter');
      await flushPromises();
      expect(w.get('[data-testid="item-edit-input"]').element.value).toBe(draft);
      expect(w.find('[role="alert"]').exists()).toBe(true);
      await w.get('[data-testid="item-edit-input"]').trigger('keydown.enter');
      await flushPromises();
      expect(w.find('[data-testid="item-edit-input"]').exists()).toBe(false);
      expect(saveItemEdit).toHaveBeenCalledTimes(2);
    });
    // Test Case 2: releases its draft owner on unmount while a failed edit retry is pending.
    it('releases its draft owner on unmount while a failed edit retry is pending', async () => {
      let finish;
      const saveItemEdit = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finish = resolve;
            })
        );
      const retainDraft = vi.fn();
      const editCancelled = vi.fn();
      const w = createWrapper({ saveItemEdit, retainDraft, editCancelled });
      await w.get('[data-testid="item-name"]').trigger('click');
      await w.get('[data-testid="item-edit-input"]').setValue('Unsaved hat');
      await w.get('[data-testid="item-edit-input"]').trigger('keydown.enter');
      await flushPromises();
      await w.get('[data-testid="item-edit-input"]').trigger('keydown.enter');
      w.unmount();
      wrapper = null;
      expect(retainDraft).toHaveBeenCalledWith({ name: 'Unsaved hat' });
      expect(editCancelled).toHaveBeenCalledWith('item', 'item-1');
      finish(null);
      await flushPromises();
    });

    // A failed save retains the draft during another item's gesture.
    // Test Case 3: preserves a failed draft during another item pointer gesture.
    it('preserves a failed draft during another item pointer gesture', async () => {
      const saveItemEdit = vi.fn().mockResolvedValue(null);
      const retainDraft = vi.fn();
      const w = createWrapper({ saveItemEdit, retainDraft, commitEditOnBlur: true });
      const list = document.createElement('div');
      list.dataset.testid = 'category-items-draggable';
      const other = document.createElement('div');
      other.dataset.testid = 'item-row';
      list.append(other);
      document.body.append(list);
      try {
        await w.get('[data-testid="item-name"]').trigger('click');
        const input = w.get('[data-testid="item-edit-input"]');
        await input.setValue('A longer draft');
        const down = new Event('pointerdown', { bubbles: true });
        Object.defineProperties(down, {
          isPrimary: { value: true },
          button: { value: 0 },
          pointerId: { value: 4 },
        });
        other.dispatchEvent(down);
        await input.trigger('focusout');
        await flushPromises();
        expect(saveItemEdit).toHaveBeenCalledOnce();
        expect(w.get('[data-testid="item-edit-input"]').element.value).toBe('A longer draft');
        expect(w.find('[role="alert"]').exists()).toBe(true);
        const up = new Event('pointerup', { bubbles: true });
        Object.defineProperty(up, 'pointerId', { value: 4 });
        other.dispatchEvent(up);
        await flushPromises();
        expect(w.get('[data-testid="item-edit-input"]').element.value).toBe('A longer draft');
        w.unmount();
        wrapper = null;
        expect(retainDraft).toHaveBeenCalledWith({ name: 'A longer draft' });
      } finally {
        list.remove();
      }
    });
    // The matching pointer release or cancellation ends the gesture.
    // Test Cases 4–5: releases a held edit after each case.
    it.each(['pointerup', 'pointercancel'])('releases a held edit after %s', async (endType) => {
      const w = createWrapper({ commitEditOnBlur: true });
      const list = document.createElement('div');
      list.dataset.testid = 'category-items-draggable';
      const other = document.createElement('div');
      other.dataset.testid = 'item-row';
      list.append(other);
      document.body.append(list);
      try {
        await w.get('[data-testid="item-name"]').trigger('click');
        const input = w.get('[data-testid="item-edit-input"]');
        const down = new Event('pointerdown', { bubbles: true });
        Object.defineProperties(down, {
          isPrimary: { value: true },
          button: { value: 0 },
          pointerId: { value: 4 },
        });
        other.dispatchEvent(down);
        await input.trigger('focusout');
        await flushPromises();
        expect(w.find('[data-testid="item-edit-input"]').exists()).toBe(true);
        const unrelated = new Event(endType, { bubbles: true });
        Object.defineProperty(unrelated, 'pointerId', { value: 9 });
        other.dispatchEvent(unrelated);
        await flushPromises();
        expect(w.find('[data-testid="item-edit-input"]').exists()).toBe(true);
        const end = new Event(endType, { bubbles: true });
        Object.defineProperty(end, 'pointerId', { value: 4 });
        other.dispatchEvent(end);
        await vi.waitFor(() =>
          expect(w.find('[data-testid="item-edit-input"]').exists()).toBe(false)
        );
      } finally {
        list.remove();
      }
    });
    // Should display the item name
    // Test Case 6: should display the item name.
    it('should display the item name', () => {
      const w = createWrapper();
      expect(w.text()).toContain('Passport');
    });

    // Should render a checkbox input
    // Test Case 7: should render a checkbox input.
    it('should render a checkbox input', () => {
      const w = createWrapper();
      const checkbox = w.get('input[type="checkbox"]');
      expect(checkbox.attributes('type')).toBe('checkbox');
    });

    // Should check the checkbox when item is packed
    // Test Case 8: should check the checkbox when item is packed.
    it('should check the checkbox when item is packed', () => {
      const w = createWrapper({
        item: createMockItem({ isPacked: true }),
      });
      const checkbox = w.find('input[type="checkbox"]');
      expect(checkbox.element.checked).toBe(true);
    });

    // Should apply line-through styling when item is packed
    // Test Case 9: should apply line-through styling when item is packed.
    it('should apply line-through styling when item is packed', () => {
      const w = createWrapper({
        item: createMockItem({ isPacked: true }),
      });
      const nameSpan = w.find('span[role="button"]');
      expect(nameSpan.classes()).toContain('line-through');
    });

    // Should display quantity
    // Test Case 10: should display quantity value.
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
    // Should emit update:item with toggled isPacked
    // Test Case 11: should emit.
    it('should emit "update:item" with toggled isPacked when checkbox is clicked', async () => {
      const w = createWrapper();
      const checkbox = w.find('input[type="checkbox"]');
      await checkbox.setValue(true);

      const emitted = w.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].isPacked).toBe(true);
    });

    // Should clear isPending when item becomes packed
    // Test Case 12: should clear isPending when item becomes packed.
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
    // Should show input field when item name is clicked
    // Test Case 13: should enter edit mode when item name is clicked.
    it('should enter edit mode when item name is clicked', async () => {
      const w = createWrapper();
      const nameSpan = w.get('span[role="button"]');
      await nameSpan.trigger('click');

      const input = w.get('[data-testid="item-edit-input"]');
      expect(input.element.value).toBe('Passport');
      expect(document.activeElement).toBe(input.element);
      expect(input.element.selectionStart).toBe(0);
      expect(input.element.selectionEnd).toBe('Passport'.length);
    });

    // Should save edited name on Enter key
    // Test Case 14: should save edited name on Enter key.
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

    // Should cancel edit mode on Escape key
    // Test Case 15: should cancel edit mode on Escape key.
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
    // Should increment quantity
    // Test Case 16: should emit.
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

    // Should decrement quantity
    // Test Case 17: should emit.
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

    // Should emit delete:item when quantity is 1 and delete button clicked
    // Test Case 18: should emit.
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
    // Should toggle pending state
    // Test Case 19: should emit.
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

    // Should clear isPacked when item is marked as pending
    // Test Case 20: should clear isPacked when item is marked as pending.
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
    // Should emit copy:item from OverflowMenu
    // Test Case 21: should emit.
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
    // Should save on blur when name is changed
    // Test Case 22: should emit.
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

    // Should not save empty name on blur
    // Test Case 23: should not emit.
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
    // Should emit delete:item from OverflowMenu
    // Test Case 24: should emit.
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
    // Should show controls on mouseenter
    // Test Case 25: should show action buttons on mouseenter.
    it('should show action buttons on mouseenter', async () => {
      const w = createWrapper();
      const mainDiv = w.get('[data-testid="item-row"]');
      await mainDiv.trigger('mouseenter');

      // OverflowMenu should get forceVisible=true
      const menu = w.findComponent({ name: 'OverflowMenu' });
      expect(menu.props('forceVisible')).toBe(true);

      const matches = vi.spyOn(mainDiv.element, 'matches').mockReturnValue(true);
      for (const categoryCompleted of [false, true]) {
        await w.setProps({ categoryCompleted, suppressDragHover: true });
        expect(menu.props('forceVisible')).toBe(false);
        await w.setProps({ suppressDragHover: false });
        expect(menu.props('forceVisible')).toBe(true);
      }
      await w.setProps({ suppressDragHover: true });
      matches.mockReturnValue(false);
      await w.setProps({ suppressDragHover: false });
      expect(menu.props('forceVisible')).toBe(false);
      matches.mockReturnValue(true);
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
      await w.setProps({ suppressDragHover: true });
      await w.setProps({ suppressDragHover: false });
      expect(menu.props('forceVisible')).toBe(false);
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      await mainDiv.trigger('mouseenter');
      const query = vi
        .spyOn(mainDiv.element, 'querySelector')
        .mockImplementation((selector) =>
          selector === ':focus-visible' ? document.createElement('button') : null
        );
      await w.setProps({ suppressDragHover: true });
      expect(menu.props('forceVisible')).toBe(true);
      matches.mockReturnValue(false);
      await w.setProps({ suppressDragHover: false });
      expect(menu.props('forceVisible')).toBe(true);
      query.mockRestore();
      matches.mockRestore();
    });

    // Test Case 26: keeps hover controls when focus leaves an editor while the pointer remains on the row.
    it('keeps hover controls when focus leaves an editor while the pointer remains on the row', async () => {
      const w = createWrapper();
      const row = w.get('[data-testid="item-row"]');
      const matches = vi
        .spyOn(row.element, 'matches')
        .mockImplementation((selector) => selector === ':hover');
      await row.trigger('mouseenter');
      await row.trigger('focusout');
      expect(w.findComponent({ name: 'OverflowMenu' }).props('forceVisible')).toBe(true);
      await row.trigger('mouseleave');
      expect(w.findComponent({ name: 'OverflowMenu' }).props('forceVisible')).toBe(false);
      matches.mockRestore();
    });

    // Test Case 27: does not restore mouse hover on touch-only devices or during drag suppression.
    it('does not restore mouse hover on touch-only devices or during drag suppression', async () => {
      const w = createWrapper();
      const row = w.get('[data-testid="item-row"]');
      const matches = vi.spyOn(row.element, 'matches').mockReturnValue(true);
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
      await row.trigger('focusout');
      expect(w.findComponent({ name: 'OverflowMenu' }).props('forceVisible')).toBe(false);
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      await w.setProps({ suppressDragHover: true });
      await row.trigger('focusout');
      expect(w.findComponent({ name: 'OverflowMenu' }).props('forceVisible')).toBe(false);
      matches.mockRestore();
    });

    // Should hide controls on mouseleave
    // Test Case 28: should hide action buttons on mouseleave.
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
    // Should not save on Enter during IME composition
    // Test Case 29: should not save during IME composition.
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
    // Should auto-start edit when newlyCreatedItemId matches
    // Test Case 30: should enter edit mode when newlyCreatedItemId matches.
    it('should enter edit mode when newlyCreatedItemId matches', async () => {
      const w = createWrapper({ newlyCreatedItemId: null });

      expect(w.find('[data-testid="item-edit-input"]').exists()).toBe(false);

      await w.setProps({ newlyCreatedItemId: 'item-1' });
      await w.vm.$nextTick();
      await w.vm.$nextTick();

      const input = w.get('[data-testid="item-edit-input"]');
      expect(document.activeElement).toBe(input.element);
      expect(input.element.selectionStart).toBe(0);
      expect(input.element.selectionEnd).toBe('Passport'.length);
    });

    // Should not start edit for non-matching item ID
    // Test Case 31: should not enter edit mode when newlyCreatedItemId does not match.
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
    // Should not decrement below 1
    // Test Case 32: should not decrement quantity below 1.
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
    // Should apply dragging class when isDragging is true
    // Test Case 33: should apply cursor-grabbing when isDragging is true.
    it('should apply cursor-grabbing when isDragging is true', () => {
      const w = createWrapper({ isDragging: true });
      const mainDiv = w.get('[data-testid="item-row"]');
      expect(mainDiv.classes()).toContain('cursor-grabbing');
    });
  });
});

describe('Item touch editing boundaries', () => {
  // A toolbar action waits for the final IME model update.
  // Test Case 34: defers an inline action until composition ends and the name is saved.
  it('defers an inline action until composition ends and the name is saved', async () => {
    const saveItemEdit = vi.fn().mockResolvedValue({ ...createMockItem(), name: '中文' });
    const w = mount(Item, {
      props: { item: createMockItem(), touchControls: true, actionsOpen: true, saveItemEdit },
      global: { stubs: { OverflowMenu: true } },
      attachTo: document.body,
    });
    try {
      await w.get('[data-testid="item-action-edit"]').trigger('click');
      const input = w.get('[data-testid="item-edit-input"]');
      await input.trigger('compositionstart');
      input.element.value = '中文';
      await input.trigger('input');
      await w.get('[data-testid="item-action-copy"]').trigger('click');
      expect(w.emitted('copy:item')).toBeUndefined();
      expect(saveItemEdit).not.toHaveBeenCalled();
      await input.trigger('compositionend');
      await flushPromises();
      expect(saveItemEdit).toHaveBeenCalledOnce();
      expect(saveItemEdit.mock.calls[0][0].name).toBe('中文');
      expect(w.emitted('copy:item')).toEqual([['item-1']]);
    } finally {
      w.unmount();
    }
  });
  // Save acknowledgement gates actions and failures preserve the draft.
  // Test Case 35: waits for the name save before an inline action and retains a failed draft.
  it('waits for the name save before an inline action and retains a failed draft', async () => {
    let finishSave;
    const saveItemEdit = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => (finishSave = resolve)))
      .mockResolvedValueOnce(null);
    const w = mount(Item, {
      props: { item: createMockItem(), touchControls: true, actionsOpen: true, saveItemEdit },
      global: { stubs: { OverflowMenu: true } },
      attachTo: document.body,
    });
    try {
      await w.get('[data-testid="item-action-edit"]').trigger('click');
      await w.get('[data-testid="item-edit-input"]').setValue('New name');
      await w.get('[data-testid="item-action-copy"]').trigger('click');
      expect(w.emitted('copy:item')).toBeUndefined();
      finishSave({ ...createMockItem(), name: 'New name' });
      await flushPromises();
      expect(w.emitted('copy:item')).toEqual([['item-1']]);
      await w.get('[data-testid="item-action-edit"]').trigger('click');
      await w.get('[data-testid="item-edit-input"]').setValue('Failed draft');
      await w.get('[data-testid="item-action-delete"]').trigger('click');
      await flushPromises();
      expect(w.emitted('delete:item')).toBeUndefined();
      expect(w.get('[data-testid="item-edit-input"]').element.value).toBe('Failed draft');
      expect(w.get('[role="alert"]').exists()).toBe(true);
    } finally {
      w.unmount();
    }
  });
  // Repeated rename entry keeps a failed draft and the original optimistic baseline.
  // Test Case 36: preserves a failed name draft when another edit entry is activated.
  it('preserves a failed name draft when another edit entry is activated', async () => {
    const saveItemEdit = vi.fn().mockResolvedValue(null);
    const w = mount(Item, {
      props: { item: createMockItem(), touchControls: true, saveItemEdit },
      global: { stubs: { OverflowMenu: true } },
      attachTo: document.body,
    });
    try {
      await w.get('[data-testid="item-name"]').trigger('click');
      await w.get('[data-testid="item-edit-input"]').setValue('Unsaved draft');
      await w.get('[data-testid="item-edit-input"]').trigger('keydown.enter');
      await flushPromises();
      w.getComponent({ name: 'OverflowMenu' }).vm.$emit('edit');
      await flushPromises();
      expect(w.get('[data-testid="item-edit-input"]').element.value).toBe('Unsaved draft');
      expect(w.get('[role="alert"]').exists()).toBe(true);
      w.getComponent({ name: 'OverflowMenu' }).vm.$emit('toggle-inline');
      await flushPromises();
      expect(w.emitted('toggle-actions')).toBeUndefined();
      expect(w.get('[data-testid="item-edit-input"]').element.value).toBe('Unsaved draft');
    } finally {
      w.unmount();
    }
  });
  // Quantity one retains the trash action while pending and copy remain ordinary inline buttons.
  // Test Case 37: keeps the quantity-one delete action in the expanded touch region.
  it('keeps the quantity-one delete action in the expanded touch region', async () => {
    const w = mount(Item, {
      props: { item: createMockItem(), touchControls: true, actionsOpen: true },
      global: { stubs: { OverflowMenu: true } },
    });
    try {
      expect(w.find('[data-testid="item-quantity-summary"]').exists()).toBe(false);
      await w.get('[data-testid="item-quantity-decrement"]').trigger('click');
      expect(w.emitted('delete:item')).toEqual([['item-1']]);
      expect(w.emitted('update:item')).toBeUndefined();
      await w.get('[data-testid="item-action-copy"]').trigger('click');
      expect(w.emitted('copy:item')).toEqual([['item-1']]);
    } finally {
      w.unmount();
    }
  });
});
