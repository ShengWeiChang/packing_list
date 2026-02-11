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

    // Test Case 13: Should emit copy:category when OverflowMenu triggers copy
    it('should emit "copy:category" when copy is triggered', async () => {
      const wrapper = createWrapper();
      const menu = wrapper.findComponent({ name: 'OverflowMenu' });
      await menu.vm.$emit('copy');

      expect(wrapper.emitted('copy:category')).toHaveLength(1);
      expect(wrapper.emitted('copy:category')[0][0]).toBe('cat-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Blur Save
  // ---------------------------------------------------------------------------

  describe('blur save', () => {
    // Test Case 14: Should save on blur when name is changed
    it('should emit "update:category" on blur with changed name', async () => {
      const wrapper = createWrapper();
      await wrapper.find('h3').trigger('click');

      const input = wrapper.find('#category-cat-1-name');
      await input.setValue('Updated Clothing');
      await input.trigger('blur');

      const emitted = wrapper.emitted('update:category');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].name).toBe('Updated Clothing');
    });

    // Test Case 15: Should not emit on blur when name is unchanged
    it('should not emit "update:category" on blur when name is unchanged', async () => {
      const wrapper = createWrapper();
      await wrapper.find('h3').trigger('click');

      const input = wrapper.find('#category-cat-1-name');
      // Don't change the value
      await input.trigger('blur');

      expect(wrapper.emitted('update:category')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Empty Name Handling
  // ---------------------------------------------------------------------------

  describe('empty name handling', () => {
    // Test Case 16: Should not save empty name
    it('should not emit "update:category" when name is empty', async () => {
      const wrapper = createWrapper();
      await wrapper.find('h3').trigger('click');

      const input = wrapper.find('#category-cat-1-name');
      await input.setValue('');
      await input.trigger('keydown.enter');

      expect(wrapper.emitted('update:category')).toBeUndefined();
    });

    // Test Case 17: Should not save whitespace-only name
    it('should not emit "update:category" when name is whitespace only', async () => {
      const wrapper = createWrapper();
      await wrapper.find('h3').trigger('click');

      const input = wrapper.find('#category-cat-1-name');
      await input.setValue('   ');
      await input.trigger('keydown.enter');

      expect(wrapper.emitted('update:category')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Drag and Drop Handlers
  // ---------------------------------------------------------------------------

  describe('drag and drop handlers', () => {
    const createDragWrapper = (props = {}) => {
      return shallowMount(Category, {
        props: {
          category: createMockCategory(),
          items: createMockItems(),
          ...props,
        },
        global: {
          stubs: {
            draggable: {
              name: 'draggable',
              template:
                '<div><template v-for="item in modelValue" :key="item.id"><slot name="item" :element="item" /></template></div>',
              props: ['modelValue', 'itemKey'],
              emits: ['start', 'end', 'change'],
            },
          },
        },
      });
    };

    // Test Case 18: Should set dragging item ID on drag start
    it('should set dragging item ID on drag start', async () => {
      const wrapper = createDragWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      const itemEl = document.createElement('div');
      const childEl = document.createElement('div');
      childEl.dataset.itemId = 'item-1';
      itemEl.appendChild(childEl);

      draggableComp.vm.$emit('start', { item: itemEl });
      await wrapper.vm.$nextTick();

      // The Item component with id=item-1 should now have isDragging=true
      const items = wrapper.findAllComponents({ name: 'Item' });
      const item1 = items.find((c) => c.props('item').id === 'item-1');
      if (item1) {
        expect(item1.props('isDragging')).toBe(true);
      }
    });

    // Test Case 19: Should clear dragging item ID on drag end
    it('should clear dragging item ID on drag end', async () => {
      const wrapper = createDragWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      // Start drag
      const itemEl = document.createElement('div');
      const childEl = document.createElement('div');
      childEl.dataset.itemId = 'item-1';
      itemEl.appendChild(childEl);
      draggableComp.vm.$emit('start', { item: itemEl });
      await wrapper.vm.$nextTick();

      // End drag
      draggableComp.vm.$emit('end', {});
      await wrapper.vm.$nextTick();

      // All items should have isDragging=false
      const items = wrapper.findAllComponents({ name: 'Item' });
      items.forEach((item) => {
        expect(item.props('isDragging')).toBe(false);
      });
    });

    // Test Case 20: Should emit move:item with type 'move' on cross-category add
    it('should emit "move:item" with type "move" when item is added from another category', async () => {
      const wrapper = createDragWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      const addedItem = {
        id: 'item-new',
        name: 'New Item',
        categoryId: 'cat-other',
        order: 0,
        isPacked: false,
        isPending: false,
        quantity: 1,
        checklistId: 'cl-1',
      };

      draggableComp.vm.$emit('change', {
        added: { element: addedItem, newIndex: 0 },
      });

      const emitted = wrapper.emitted('move:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].type).toBe('move');
      expect(emitted[0][0].item.categoryId).toBe('cat-1');
      expect(emitted[0][0].newCategoryId).toBe('cat-1');
      expect(emitted[0][0].oldCategoryId).toBe('cat-other');
    });

    // Test Case 21: Should emit move:item with type 'reorder' on same-category move
    it('should emit "move:item" with type "reorder" when item is moved within same category', async () => {
      const wrapper = createDragWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      draggableComp.vm.$emit('change', {
        moved: { element: createMockItems()[0], oldIndex: 0, newIndex: 1 },
      });

      const emitted = wrapper.emitted('move:item');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].type).toBe('reorder');
      expect(emitted[0][0].categoryId).toBe('cat-1');
      expect(emitted[0][0].items).toHaveLength(2); // Only cat-1 items
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Newly Created Category Watcher
  // ---------------------------------------------------------------------------

  describe('newly created category watcher', () => {
    // Test Case 22: Should auto-start edit for newly created category
    it('should enter edit mode when newlyCreatedCategoryId matches', async () => {
      const wrapper = createWrapper({ newlyCreatedCategoryId: null });

      // Initially not editing
      expect(wrapper.find('#category-cat-1-name').exists()).toBe(false);

      // Simulate newlyCreatedCategoryId changing to match this category
      await wrapper.setProps({ newlyCreatedCategoryId: 'cat-1' });
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      // Should be in edit mode
      expect(wrapper.find('#category-cat-1-name').exists()).toBe(true);
    });

    // Test Case 23: Should not start edit for non-matching category ID
    it('should not enter edit mode when newlyCreatedCategoryId does not match', async () => {
      const wrapper = createWrapper({ newlyCreatedCategoryId: null });
      await wrapper.setProps({ newlyCreatedCategoryId: 'cat-other' });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('#category-cat-1-name').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 10: IME Composition
  // ---------------------------------------------------------------------------

  describe('IME composition', () => {
    // Test Case 24: Should not save on Enter during IME composition
    it('should not save during IME composition', async () => {
      const wrapper = createWrapper();
      await wrapper.find('h3').trigger('click');

      const input = wrapper.find('#category-cat-1-name');
      await input.setValue('新名稱');

      // Simulate IME composition start
      await input.trigger('compositionstart');
      await input.trigger('keydown.enter');

      // Should NOT emit because composing
      expect(wrapper.emitted('update:category')).toBeUndefined();

      // End composition and save
      await input.trigger('compositionend');
      await input.trigger('keydown.enter');

      // NOW it should emit
      expect(wrapper.emitted('update:category')).toHaveLength(1);
    });
  });
});
