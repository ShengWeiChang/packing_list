/*
================================================================================
File: tests/component-tests/Category.test.js
Description: Component tests for Category.vue.
             Tests name editing, collapse toggle, completion state, and event
             emissions with stubbed child components.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-06
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Category from '../../source/components/Category.vue';
import ProgressBar from '../../source/components/ProgressBar.vue';

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const createMockCategory = (overrides = {}) => ({
  id: 'cat-1',
  name: 'Clothing',
  checklistId: 'cl-1',
  order: 0,
  ...overrides,
});

const createMockItems = () => [
  {
    id: 'item-1',
    name: 'T-Shirt',
    quantity: 1,
    categoryId: 'cat-1',
    isPacked: false,
    isPending: false,
    checklistId: 'cl-1',
    order: 0,
  },
  {
    id: 'item-2',
    name: 'Pants',
    quantity: 1,
    categoryId: 'cat-1',
    isPacked: true,
    isPending: false,
    checklistId: 'cl-1',
    order: 1,
  },
  {
    id: 'item-3',
    name: 'Shoes',
    quantity: 1,
    categoryId: 'cat-2',
    isPacked: false,
    isPending: false,
    checklistId: 'cl-1',
    order: 0,
  },
];

// -----------------------------------------------------------------------------
// Category Component Tests
// -----------------------------------------------------------------------------

describe('Category', () => {
  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    return shallowMount(Category, {
      props: {
        category: createMockCategory(),
        items: createMockItems(),
        ...props,
      },
      global: {
        stubs: {
          draggable: {
            template: '<div><slot /></div>',
            props: ['modelValue'],
          },
        },
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should display the category name
    it('should display the category name', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('Clothing');
    });

    // Test Case 2: Should pass filtered item counts to ProgressBar
    it('should pass correct item counts to ProgressBar', () => {
      const wrapper = createWrapper();
      const progressBar = wrapper.findComponent(ProgressBar);
      // cat-1 has 2 items: item-1 (unpacked) and item-2 (packed)
      expect(progressBar.props('total')).toBe(2);
      expect(progressBar.props('completed')).toBe(1);
    });

    // Test Case 3: Should only count items belonging to this category
    it('should filter items by categoryId', () => {
      const wrapper = createWrapper();
      const progressBar = wrapper.findComponent(ProgressBar);
      // item-3 belongs to cat-2, so only 2 items for cat-1
      expect(progressBar.props('total')).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Completion State
  // ---------------------------------------------------------------------------

  describe('completion state', () => {
    // Test Case 4: Should not apply completed styling when partially packed
    it('should not apply completed styling when some items are unpacked', () => {
      const wrapper = createWrapper();
      // Default: 1 packed + 1 unpacked → not completed
      expect(wrapper.find('.bg-success-state-bg').exists()).toBe(false);
    });

    // Test Case 5: Should apply completed styling when all items are packed
    it('should apply completed styling when all items are packed', () => {
      const items = createMockItems().map((item) => ({
        ...item,
        isPacked: item.categoryId === 'cat-1' ? true : item.isPacked,
      }));
      const wrapper = createWrapper({ items });
      expect(wrapper.find('.bg-success-state-bg').exists()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Collapse Toggle
  // ---------------------------------------------------------------------------

  describe('collapse toggle', () => {
    // Test Case 6: Should start with items visible (not collapsed)
    it('should start with items visible (not collapsed)', () => {
      const wrapper = createWrapper();
      const itemsContainer = wrapper.find('.grid');
      expect(itemsContainer.classes()).toContain('grid-rows-[1fr]');
    });

    // Test Case 7: Should collapse items when toggle button is clicked
    it('should collapse items when toggle button is clicked', async () => {
      const wrapper = createWrapper();
      const collapseButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('aria-label') === 'category.collapse');
      await collapseButton.trigger('click');

      const itemsContainer = wrapper.find('.grid');
      expect(itemsContainer.classes()).toContain('grid-rows-[0fr]');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Name Editing
  // ---------------------------------------------------------------------------

  describe('name editing', () => {
    // Test Case 8: Should enter edit mode when category name is clicked
    it('should show input when category name is clicked', async () => {
      const wrapper = createWrapper();
      const nameHeading = wrapper.find('h3');
      await nameHeading.trigger('click');

      expect(wrapper.find('#category-cat-1-name').exists()).toBe(true);
    });

    // Test Case 9: Should emit update:category with new name on Enter
    it('should emit "update:category" with new name on Enter', async () => {
      const wrapper = createWrapper();
      await wrapper.find('h3').trigger('click');

      const input = wrapper.find('#category-cat-1-name');
      await input.setValue('Updated Clothing');
      await input.trigger('keydown.enter');

      const emitted = wrapper.emitted('update:category');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].name).toBe('Updated Clothing');
    });

    // Test Case 10: Should cancel edit mode on Escape key
    it('should cancel edit mode on Escape key', async () => {
      const wrapper = createWrapper();
      await wrapper.find('h3').trigger('click');

      const input = wrapper.find('#category-cat-1-name');
      await input.setValue('Changed');
      await input.trigger('keyup.escape');

      expect(wrapper.find('h3').exists()).toBe(true);
      expect(wrapper.text()).toContain('Clothing');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: Event Emissions
  // ---------------------------------------------------------------------------

  describe('event emissions', () => {
    // Test Case 11: Should emit create:item with category ID
    it('should emit "create:item" when AddItemButton triggers click', async () => {
      const wrapper = createWrapper();
      const addButton = wrapper.findComponent({ name: 'AddItemButton' });
      await addButton.vm.$emit('click');

      expect(wrapper.emitted('create:item')).toHaveLength(1);
      expect(wrapper.emitted('create:item')[0][0]).toBe('cat-1');
    });

    // Test Case 12: Should emit delete:category when OverflowMenu triggers delete
    it('should emit "delete:category" when delete is triggered', async () => {
      const wrapper = createWrapper();
      const menu = wrapper.findComponent({ name: 'OverflowMenu' });
      await menu.vm.$emit('delete');

      expect(wrapper.emitted('delete:category')).toHaveLength(1);
      expect(wrapper.emitted('delete:category')[0][0]).toBe('cat-1');
    });
  });
});
