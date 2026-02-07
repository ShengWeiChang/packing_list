/*
================================================================================
File: tests/component-tests/PendingItemsCategory.test.js
Description: Component tests for PendingItemsCategory.vue.
             Tests filtering of pending items, rendering, and completion action.
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

import PendingItemsCategory from '../../source/components/PendingItemsCategory.vue';

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const createMockItems = () => [
  {
    id: 'item-1',
    name: 'Toothbrush',
    quantity: 1,
    categoryId: 'cat-1',
    isPacked: false,
    isPending: true,
    checklistId: 'cl-1',
    order: 0,
  },
  {
    id: 'item-2',
    name: 'Sunscreen',
    quantity: 2,
    categoryId: 'cat-1',
    isPacked: false,
    isPending: true,
    checklistId: 'cl-1',
    order: 1,
  },
  {
    id: 'item-3',
    name: 'Passport',
    quantity: 1,
    categoryId: 'cat-1',
    isPacked: false,
    isPending: false,
    checklistId: 'cl-1',
    order: 2,
  },
];

// -----------------------------------------------------------------------------
// PendingItemsCategory Component Tests
// -----------------------------------------------------------------------------

describe('PendingItemsCategory', () => {
  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    return mount(PendingItemsCategory, {
      props: {
        items: createMockItems(),
        ...props,
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should display only items with isPending=true
    it('should display only pending items', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('Toothbrush');
      expect(wrapper.text()).toContain('Sunscreen');
      expect(wrapper.text()).not.toContain('Passport');
    });

    // Test Case 2: Should not render when there are no pending items
    it('should not render when there are no pending items', () => {
      const items = createMockItems().map((item) => ({ ...item, isPending: false }));
      const wrapper = createWrapper({ items });
      // The root v-if should prevent rendering
      expect(wrapper.find('.group').exists()).toBe(false);
    });

    // Test Case 3: Should display the pending items count
    it('should display the pending items count', () => {
      const wrapper = createWrapper();
      // 2 pending items
      expect(wrapper.text()).toContain('2');
    });

    // Test Case 4: Should show quantity badge when quantity > 1
    it('should show quantity badge when quantity is greater than 1', () => {
      const wrapper = createWrapper();
      // Sunscreen has quantity 2 — look for the badge container
      const badges = wrapper.findAll('.text-xs.font-semibold');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Actions
  // ---------------------------------------------------------------------------

  describe('actions', () => {
    // Test Case 5: Should emit update:item with isPending=false on completion
    it('should emit "update:item" with isPending=false when completion button clicked', async () => {
      const wrapper = createWrapper();
      const completeButtons = wrapper.findAll('button');
      await completeButtons[0].trigger('click');

      const emitted = wrapper.emitted('update:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].isPending).toBe(false);
      expect(emitted[0][0].id).toBe('item-1');
    });
  });
});
