/*
================================================================================
File: tests/component-tests/Checklist.test.js
Description: Component tests for Checklist.vue.
             Tests name/date editing, event emissions, progress bar integration,
             pending items display, and overflow menu interactions.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import Checklist from '../../source/components/Checklist.vue';
import ProgressBar from '../../source/components/ProgressBar.vue';

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const createMockChecklist = (overrides = {}) => ({
  id: 'cl-1',
  name: 'Japan Trip',
  startDate: '2026-03-01',
  endDate: '2026-03-15',
  order: 0,
  ...overrides,
});

const createMockCategories = () => [
  { id: 'cat-1', name: 'Clothing', checklistId: 'cl-1', order: 0 },
  { id: 'cat-2', name: 'Documents', checklistId: 'cl-1', order: 1 },
];

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
    name: 'Passport',
    quantity: 1,
    categoryId: 'cat-2',
    isPacked: true,
    isPending: false,
    checklistId: 'cl-1',
    order: 0,
  },
  {
    id: 'item-3',
    name: 'Toothbrush',
    quantity: 1,
    categoryId: 'cat-1',
    isPacked: false,
    isPending: true,
    checklistId: 'cl-1',
    order: 1,
  },
];

const BLUR_SETTLE_MS = 100;

// -----------------------------------------------------------------------------
// i18n Setup
// -----------------------------------------------------------------------------

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      checklist: {
        name: 'Checklist Name',
        untitled: 'Untitled Checklist',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
    },
  },
});

// -----------------------------------------------------------------------------
// Checklist Component Tests
// -----------------------------------------------------------------------------

describe('Checklist', () => {
  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    return shallowMount(Checklist, {
      props: {
        checklist: createMockChecklist(),
        categories: createMockCategories(),
        items: createMockItems(),
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs: {
          draggable: {
            name: 'draggable',
            template:
              '<div><template v-for="item in modelValue" :key="item.id"><slot name="item" :element="item" /></template></div>',
            props: ['modelValue', 'itemKey', 'group'],
            emits: ['start', 'end', 'update', 'update:modelValue'],
          },
        },
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should display the checklist name
    it('should display the checklist name', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('Japan Trip');
    });

    // Test Case 2: Should display date range
    it('should display the formatted date range', () => {
      const wrapper = createWrapper();
      // Date range should be displayed when not editing
      expect(wrapper.text()).toMatch(/Mar/);
    });

    // Test Case 3: Should pass correct counts to ProgressBar
    it('should pass correct item counts to ProgressBar', () => {
      const wrapper = createWrapper();
      const progressBar = wrapper.findComponent(ProgressBar);
      // 3 total items, 1 packed
      expect(progressBar.props('total')).toBe(3);
      expect(progressBar.props('completed')).toBe(1);
    });

    // Test Case 4: Should render categories via Category components
    it('should render Category components for each category', () => {
      const wrapper = createWrapper();
      const categoryComponents = wrapper.findAllComponents({ name: 'Category' });
      expect(categoryComponents).toHaveLength(2);
    });

    // Test Case 5: Should render PendingItemsCategory when pending items exist
    it('should show PendingItemsCategory when pending items exist', () => {
      const wrapper = createWrapper();
      const pending = wrapper.findAllComponents({ name: 'PendingItemsCategory' });
      expect(pending).toHaveLength(1);
    });

    // Test Case 6: Should not render PendingItemsCategory when no pending items
    it('should hide PendingItemsCategory when no pending items', () => {
      const items = createMockItems().map((i) => ({ ...i, isPending: false }));
      const wrapper = createWrapper({ items });
      const pending = wrapper.findComponent({ name: 'PendingItemsCategory' });
      expect(pending.exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Name Editing
  // ---------------------------------------------------------------------------

  describe('name editing', () => {
    // Test Case 7: Should enter edit mode when checklist name is clicked
    it('should show input when checklist name is clicked', async () => {
      const wrapper = createWrapper();
      const nameHeading = wrapper.get('[data-testid="checklist-name"]');
      await nameHeading.trigger('click');

      expect(wrapper.get('[data-testid="checklist-name-input"]').element.value).toBe('Japan Trip');
    });

    // Test Case 8: Should emit update:checklist with new name on Enter
    it('should emit "update:checklist" with new name on Enter', async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      const input = wrapper.find('[data-testid="checklist-name-input"]');
      await input.setValue('Updated Trip');
      await input.trigger('keydown.enter');

      const emitted = wrapper.emitted('update:checklist');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].name).toBe('Updated Trip');
    });

    // Test Case 9: Should cancel edit mode on Escape key
    it('should cancel edit mode on Escape key', async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      const input = wrapper.find('[data-testid="checklist-name-input"]');
      await input.setValue('Changed');
      await input.trigger('keyup.escape');

      expect(wrapper.get('[data-testid="checklist-name"]').text()).toBe('Japan Trip');
      expect(wrapper.text()).toContain('Japan Trip');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Event Emissions
  // ---------------------------------------------------------------------------

  describe('event emissions', () => {
    // Test Case 10: Should emit copy:checklist when OverflowMenu triggers copy
    it('should emit "copy:checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menu = wrapper.findComponent({ name: 'OverflowMenu' });
      await menu.vm.$emit('copy');

      expect(wrapper.emitted('copy:checklist')).toHaveLength(1);
      expect(wrapper.emitted('copy:checklist')[0][0]).toBe('cl-1');
    });

    // Test Case 11: Should emit delete:checklist when OverflowMenu triggers delete
    it('should emit "delete:checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menu = wrapper.findComponent({ name: 'OverflowMenu' });
      await menu.vm.$emit('delete');

      expect(wrapper.emitted('delete:checklist')).toHaveLength(1);
      expect(wrapper.emitted('delete:checklist')[0][0]).toBe('cl-1');
    });

    // Test Case 12: Should emit create:category when AddCategoryButton is clicked
    it('should emit "create:category" from AddCategoryButton', async () => {
      const wrapper = createWrapper();
      const addBtn = wrapper.findComponent({ name: 'AddCategoryButton' });
      await addBtn.vm.$emit('click');

      expect(wrapper.emitted('create:category')).toHaveLength(1);
    });

    // Test Cases 13–15: Should forward events from Category component
    it.each([
      ['update:item', { id: 'item-1', name: 'Updated', isPacked: true }],
      ['copy:category', 'cat-1'],
      ['delete:category', 'cat-1'],
    ])('should forward "%s" from Category component', async (eventName, payload) => {
      const wrapper = createWrapper();
      const category = wrapper.findComponent({ name: 'Category' });
      await category.vm.$emit(eventName, payload);

      expect(wrapper.emitted(eventName)).toHaveLength(1);
      expect(wrapper.emitted(eventName)[0][0]).toEqual(payload);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Untitled Checklist
  // ---------------------------------------------------------------------------

  describe('untitled checklist', () => {
    // Test Case 13: Should show untitled text for empty name
    it('should display untitled placeholder for empty name', () => {
      const wrapper = createWrapper({
        checklist: createMockChecklist({ name: '' }),
      });
      expect(wrapper.text()).toContain('checklist.untitled');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: Date Constraint Watchers
  // ---------------------------------------------------------------------------

  describe('date constraint watchers', () => {
    // Test Case 14: End date should auto-adjust when start date is moved later
    it('should adjust end date when start date moves past it', async () => {
      const wrapper = createWrapper();

      // Enter edit mode
      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      // Find date inputs
      const dateInputs = wrapper.findAll('input[type="date"]');
      const startInput = dateInputs[0];
      const endInput = dateInputs[1];

      // Set start date after end date
      await startInput.setValue('2026-03-20');
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      // End date should have been adjusted to match or be after start date
      expect(endInput.element.value).toBe('2026-03-20');
    });

    // Test Case 15: End date should not change when start date is before it
    it('should not change end date when start date is still before it', async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      const dateInputs = wrapper.findAll('input[type="date"]');
      const startInput = dateInputs[0];
      const endInput = dateInputs[1];

      // Set start date before end date (should not trigger adjustment)
      await startInput.setValue('2026-03-05');
      await wrapper.vm.$nextTick();

      // End date should remain at original value (2026-03-15)
      expect(endInput.element.value).toBe('2026-03-15');
    });

    // Test Case 16: End date earlier than start should auto-correct
    it('should auto-correct end date set earlier than start date', async () => {
      const wrapper = createWrapper();

      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      const dateInputs = wrapper.findAll('input[type="date"]');
      const startInput = dateInputs[0];
      const endInput = dateInputs[1];

      // First set a start date
      await startInput.setValue('2026-03-10');
      await wrapper.vm.$nextTick();

      // Now set end date BEFORE start date
      await endInput.setValue('2026-03-05');
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      // End date should have been corrected to match start date
      expect(endInput.element.value).toBe('2026-03-10');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Edit Blur / IME / handleEnterKey
  // ---------------------------------------------------------------------------

  describe('edit blur and IME composition', () => {
    // Test Case 17: Should not save during IME composition
    it('should not save on Enter during IME composition', async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      const input = wrapper.find('[data-testid="checklist-name-input"]');
      await input.setValue('新旅行');

      await input.trigger('compositionstart');
      await input.trigger('keydown.enter');

      // Should NOT emit during composition
      expect(wrapper.emitted('update:checklist')).toBeUndefined();

      await input.trigger('compositionend');
      await input.trigger('keydown.enter');

      // NOW it should emit
      expect(wrapper.emitted('update:checklist')).toHaveLength(1);
    });

    // Test Case 18: Should not emit when name is unchanged
    it('should not emit update when name has not changed', async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      // Press Enter without changing anything
      const input = wrapper.find('[data-testid="checklist-name-input"]');
      await input.trigger('keydown.enter');

      expect(wrapper.emitted('update:checklist')).toBeUndefined();
    });

    // Test Case 19: Should use untitled when saving empty name
    it('should use untitled placeholder when saving empty name', async () => {
      const wrapper = createWrapper();
      await wrapper.find('[data-testid="checklist-name"]').trigger('click');

      const input = wrapper.find('[data-testid="checklist-name-input"]');
      await input.setValue('');
      await input.trigger('keydown.enter');

      const emitted = wrapper.emitted('update:checklist');
      expect(emitted).toHaveLength(1);
      // When empty, saveEdit uses t('checklist.untitled') as fallback
      expect(emitted[0][0].name).toBe('Untitled Checklist');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: OverflowMenu Edit Action
  // ---------------------------------------------------------------------------

  describe('overflow menu edit action', () => {
    // Test Case 20: Should enter edit mode from OverflowMenu edit event
    it('should enter edit mode when OverflowMenu triggers edit', async () => {
      const wrapper = createWrapper();
      const menu = wrapper.findComponent({ name: 'OverflowMenu' });
      await menu.vm.$emit('edit');

      await wrapper.vm.$nextTick();

      expect(wrapper.get('[data-testid="checklist-name-input"]').attributes('aria-label')).toBe(
        'checklist.name'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Newly Created Checklist Watcher
  // ---------------------------------------------------------------------------

  describe('newly created checklist watcher', () => {
    // Test Case 21: Should auto-start edit when newlyCreatedChecklistId matches
    it('should enter edit mode when newlyCreatedChecklistId matches', async () => {
      const wrapper = createWrapper({ newlyCreatedChecklistId: null });

      expect(wrapper.find('[data-testid="checklist-name-input"]').exists()).toBe(false);

      await wrapper.setProps({ newlyCreatedChecklistId: 'cl-1' });
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.get('[data-testid="checklist-name-input"]').attributes('aria-label')).toBe(
        'checklist.name'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Additional Event Forwarding
  // ---------------------------------------------------------------------------

  describe('additional event forwarding', () => {
    // Test Cases 25–29: Should forward various events from Category component
    it.each([
      ['copy:item', 'item-1'],
      ['delete:item', 'item-1'],
      ['create:item', 'cat-1'],
      ['update:category', { id: 'cat-1', name: 'Updated' }],
      ['move:item', { item: {}, type: 'move' }],
    ])('should forward "%s" from Category component', async (eventName, payload) => {
      const wrapper = createWrapper();
      const category = wrapper.findComponent({ name: 'Category' });
      await category.vm.$emit(eventName, payload);

      expect(wrapper.emitted(eventName)).toHaveLength(1);
      expect(wrapper.emitted(eventName)[0][0]).toEqual(payload);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 10: Date Formatting
  // ---------------------------------------------------------------------------

  describe('date formatting', () => {
    // Test Case 22: Should show single date when start and end are the same
    it('should display single date when start and end dates are equal', () => {
      const wrapper = createWrapper({
        checklist: createMockChecklist({
          startDate: '2026-03-10',
          endDate: '2026-03-10',
        }),
      });
      // Same date: should only show one date with year
      const text = wrapper.text();
      expect(text).toMatch(/Mar\s+10/);
      expect(text).toMatch(/2026/);
    });

    // Test Case 23: Should handle empty dates gracefully
    it('should handle empty dates gracefully', () => {
      const wrapper = createWrapper({
        checklist: createMockChecklist({
          startDate: '',
          endDate: '',
        }),
      });
      // formatDateRange returns '' for empty dates
      expect(wrapper.get('[data-testid="checklist-name"]').text()).toBe('Japan Trip');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 11: PendingItemsCategory forwarding
  // ---------------------------------------------------------------------------

  describe('PendingItemsCategory forwarding', () => {
    // Test Case 24: Should forward update:item from PendingItemsCategory
    it('should forward "update:item" from PendingItemsCategory', async () => {
      const wrapper = createWrapper();
      const pending = wrapper.getComponent({ name: 'PendingItemsCategory' });

      const mockItem = { id: 'item-3', isPending: false };
      await pending.vm.$emit('update:item', mockItem);

      expect(wrapper.emitted('update:item')).toHaveLength(1);
      expect(wrapper.emitted('update:item')[0][0]).toEqual(mockItem);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 12: Category Drag Handlers
  // ---------------------------------------------------------------------------

  describe('category drag handlers', () => {
    // Test Case 25: Should handle category drag start
    it('should set isDraggingCategory on drag start', async () => {
      const wrapper = createWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      const categoryEl = document.createElement('div');
      const innerEl = document.createElement('div');
      innerEl.dataset.categoryId = 'cat-1';
      categoryEl.appendChild(innerEl);

      draggableComp.vm.$emit('start', { item: categoryEl });
      await wrapper.vm.$nextTick();

      // The dragging class should be applied to the draggable container
      expect(draggableComp.classes()).toContain('dragging');
    });

    // Test Case 26: Should handle category drag end
    it('should clear drag state on category drag end', async () => {
      const wrapper = createWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      // First start drag
      const categoryEl = document.createElement('div');
      const innerEl = document.createElement('div');
      innerEl.dataset.categoryId = 'cat-1';
      categoryEl.appendChild(innerEl);
      draggableComp.vm.$emit('start', { item: categoryEl });
      await wrapper.vm.$nextTick();

      // Verify dragging is active
      expect(draggableComp.classes()).toContain('dragging');

      // Then end drag
      draggableComp.vm.$emit('end', {});
      await wrapper.vm.$nextTick();

      // Dragging class should be removed
      expect(draggableComp.classes()).not.toContain('dragging');
    });

    // Test Case 27: Should emit reorder:categories when draggable updates the array
    it('should emit "reorder:categories" with renumbered order when v-model changes', async () => {
      const wrapper = createWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      const original = createMockCategories();
      const swapped = [original[1], original[0]];

      draggableComp.vm.$emit('update:modelValue', swapped);
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('reorder:categories');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0]).toHaveLength(2);
      expect(emitted[0][0][0].id).toBe('cat-2');
      expect(emitted[0][0][1].id).toBe('cat-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 13: Checklist Edit Blur (handleEditBlur)
  // ---------------------------------------------------------------------------

  describe('edit blur handler', () => {
    // Test Case 28: Should save on blur when focus leaves editing area
    it('should save when focus leaves all editing inputs', async () => {
      vi.useFakeTimers();
      const wrapper = createWrapper();

      // Enter edit mode
      await wrapper.find('[data-testid="checklist-name"]').trigger('click');
      const input = wrapper.find('[data-testid="checklist-name-input"]');
      await input.setValue('New Trip Name');

      // Simulate blur / focusout
      const editDiv = input.element.parentElement;
      editDiv.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

      vi.advanceTimersByTime(BLUR_SETTLE_MS);
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('update:checklist');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].name).toBe('New Trip Name');

      vi.useRealTimers();
    });
  });
});
