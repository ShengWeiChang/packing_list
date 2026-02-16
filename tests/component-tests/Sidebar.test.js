/*
================================================================================
File: tests/component-tests/Sidebar.test.js
Description: Component tests for Sidebar.vue.
             Tests checklist navigation, new checklist creation, language menu,
             overflow menu interactions, and drag-and-drop behavior.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import Sidebar from '../../source/components/Sidebar.vue';
import { mockGetBoundingClientRect, mockRequestAnimationFrame } from '../test-setup/domMocks';

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const createMockChecklists = () => [
  { id: 'cl-1', name: 'Japan Trip', startDate: '2026-03-01', endDate: '2026-03-15', order: 0 },
  { id: 'cl-2', name: 'Europe Tour', startDate: '2026-06-01', endDate: '2026-06-20', order: 1 },
];

// -----------------------------------------------------------------------------
// i18n Setup
// -----------------------------------------------------------------------------

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      sidebar: {
        toggle: 'Toggle Sidebar',
        newChecklist: 'New Checklist',
        title: 'My Lists',
      },
      checklist: {
        untitled: 'Untitled Checklist',
      },
      language: {
        switchLanguage: 'Switch Language',
      },
    },
  },
});

// -----------------------------------------------------------------------------
// Sidebar Component Tests
// -----------------------------------------------------------------------------

describe('Sidebar', () => {
  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    // Mock localStorage for locale persistence
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

    // Mock requestAnimationFrame to execute synchronously
    mockRequestAnimationFrame();

    // Mock getBoundingClientRect for dropdown positioning
    mockGetBoundingClientRect({ top: 500, left: 50, right: 150, bottom: 540, x: 50, y: 500 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  const createWrapper = (props = {}) => {
    return shallowMount(Sidebar, {
      props: {
        isExpanded: true,
        isMobile: false,
        checklists: createMockChecklists(),
        selectedChecklistId: 'cl-1',
        ...props,
      },
      global: {
        plugins: [i18n],
        stubs: {
          draggable: {
            name: 'draggable',
            template:
              '<component :is="tag || \'div\'"><template v-for="item in modelValue" :key="item.id"><slot name="item" :element="item" /></template></component>',
            props: ['modelValue', 'tag', 'itemKey'],
            emits: ['update:modelValue', 'start', 'end'],
          },
        },
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should display checklist names when expanded
    it('should display checklist names when expanded', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('Japan Trip');
      expect(wrapper.text()).toContain('Europe Tour');
    });

    // Test Case 2: Should show new checklist button
    it('should show the new checklist button', () => {
      const wrapper = createWrapper();
      const newBtn = wrapper.get('[data-testid="sidebar-new-checklist"]');
      expect(newBtn.text()).toContain('sidebar.newChecklist');
    });

    // Test Case 3: Should render sidebar title
    it('should display the sidebar title', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('sidebar.title');
    });

    // Test Case 4: Should render checklist items
    it('should render checklist item buttons', () => {
      const wrapper = createWrapper();
      const checklistBtns = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      expect(checklistBtns).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Event Emissions
  // ---------------------------------------------------------------------------

  describe('event emissions', () => {
    // Test Case 5: Should emit toggle-sidebar when hamburger button clicked
    it('should emit "toggle-sidebar" on hamburger click', async () => {
      const wrapper = createWrapper();
      const toggleBtn = wrapper.get('[data-testid="sidebar-toggle"]');
      await toggleBtn.trigger('click');

      expect(wrapper.emitted('toggle-sidebar')).toHaveLength(1);
    });

    // Test Case 6: Should emit create-checklist when new button clicked
    it('should emit "create-checklist" on new checklist button click', async () => {
      const wrapper = createWrapper();
      const newBtn = wrapper.find('[data-testid="sidebar-new-checklist"]');
      await newBtn.trigger('click');

      expect(wrapper.emitted('create-checklist')).toHaveLength(1);
    });

    // Test Case 7: Should emit select-checklist when checklist item clicked
    it('should emit "select-checklist" with checklist ID on item click', async () => {
      const wrapper = createWrapper();
      const checklistBtns = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      await checklistBtns[1].trigger('click');

      expect(wrapper.emitted('select-checklist')).toHaveLength(1);
      expect(wrapper.emitted('select-checklist')[0][0]).toBe('cl-2');
    });

    // Test Case 8: Should emit copy-checklist from OverflowMenu
    it('should emit "copy-checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menus = wrapper.findAllComponents({ name: 'OverflowMenu' });
      expect(menus.length).toBeGreaterThan(0);

      await menus[0].vm.$emit('copy');

      expect(wrapper.emitted('copy-checklist')).toHaveLength(1);
      expect(wrapper.emitted('copy-checklist')[0][0]).toBe('cl-1');
    });

    // Test Case 9: Should emit delete-checklist from OverflowMenu
    it('should emit "delete-checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menus = wrapper.findAllComponents({ name: 'OverflowMenu' });

      await menus[0].vm.$emit('delete');

      expect(wrapper.emitted('delete-checklist')).toHaveLength(1);
      expect(wrapper.emitted('delete-checklist')[0][0]).toBe('cl-1');
    });

    // Test Case 10: Should emit edit-checklist from OverflowMenu
    it('should emit "edit-checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menus = wrapper.findAllComponents({ name: 'OverflowMenu' });

      await menus[0].vm.$emit('edit');

      expect(wrapper.emitted('edit-checklist')).toHaveLength(1);
      expect(wrapper.emitted('edit-checklist')[0][0]).toBe('cl-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Selected State
  // ---------------------------------------------------------------------------

  describe('selected state', () => {
    // Test Case 11: Should apply active styling to selected checklist
    it('should highlight the selected checklist', () => {
      const wrapper = createWrapper({ selectedChecklistId: 'cl-1' });
      const listItems = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      // First checklist button should have aria-current="page"
      expect(listItems[0].attributes('aria-current')).toBe('page');
    });

    // Test Case 12: Non-selected checklist should not have aria-current
    it('should not highlight non-selected checklists', () => {
      const wrapper = createWrapper({ selectedChecklistId: 'cl-1' });
      const listItems = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      expect(listItems[1].attributes('aria-current')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Collapsed State
  // ---------------------------------------------------------------------------

  describe('collapsed state', () => {
    // Test Case 13: Should show first character of checklist name when collapsed
    it('should show first character when collapsed on desktop', () => {
      const wrapper = createWrapper({ isExpanded: false, isMobile: false });
      // When collapsed, should show first character
      expect(wrapper.text()).toContain('J');
      expect(wrapper.text()).toContain('E');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: Language Menu
  // ---------------------------------------------------------------------------

  describe('language menu', () => {
    // Test Case 14: Should toggle language menu on button click
    it('should show language dropdown on language button click', async () => {
      const wrapper = createWrapper();
      // Find the language button by its aria-label
      const langBtn = wrapper.get('[data-testid="sidebar-language-button"]');

      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      // Language menu should now be visible
      expect(wrapper.text()).toContain('English');
      expect(wrapper.text()).toContain('繁體中文');
    });

    // Test Case 15: Should select a language and close menu
    it('should change locale and close menu when a language is selected', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.get('[data-testid="sidebar-language-button"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      // Click the second language option (zh-TW)
      const zhTwOption = wrapper.get('[data-testid="sidebar-language-option-zh-TW"]');
      await zhTwOption.trigger('click');

      // Menu should close
      expect(wrapper.find('[data-testid="sidebar-language-dropdown"]').exists()).toBe(false);
    });

    // Test Case 16: Should close language menu on focusout
    it('should close language menu when focus leaves', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.get('[data-testid="sidebar-language-button"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(
        wrapper.get('[data-testid="sidebar-language-dropdown"]').attributes('data-testid')
      ).toBe('sidebar-language-dropdown');

      // Trigger focusout with relatedTarget outside the component
      const settingsDiv = wrapper.find('[data-testid="sidebar-language-settings"]');
      await settingsDiv.trigger('focusout', { relatedTarget: document.body });

      expect(wrapper.find('[data-testid="sidebar-language-dropdown"]').exists()).toBe(false);
    });

    // Test Case 17: Should close language menu on scroll
    it('should close language menu on window scroll', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.get('[data-testid="sidebar-language-button"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(
        wrapper.get('[data-testid="sidebar-language-dropdown"]').attributes('data-testid')
      ).toBe('sidebar-language-dropdown');

      // Simulate scroll event
      window.dispatchEvent(new Event('scroll'));

      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="sidebar-language-dropdown"]').exists()).toBe(false);
    });

    // Test Case 18: Should close language menu on outside click
    it('should close language menu on outside click', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.get('[data-testid="sidebar-language-button"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(
        wrapper.get('[data-testid="sidebar-language-dropdown"]').attributes('data-testid')
      ).toBe('sidebar-language-dropdown');

      // Simulate click on document body (outside)
      document.dispatchEvent(new Event('click', { bubbles: true }));

      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="sidebar-language-dropdown"]').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Checklist Reorder (draggableChecklists setter)
  // ---------------------------------------------------------------------------

  describe('checklist reorder', () => {
    // Test Case 19: Should emit move:checklists with renumbered order when draggable updates
    it('should emit "move:checklists" with updated order when v-model changes', async () => {
      const wrapper = createWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      const original = createMockChecklists();
      const swapped = [original[1], original[0]];

      draggableComp.vm.$emit('update:modelValue', swapped);
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('move:checklists');
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0]).toHaveLength(2);
      expect(emitted[0][0][0].id).toBe('cl-2');
      expect(emitted[0][0][1].id).toBe('cl-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Drag and Drop
  // ---------------------------------------------------------------------------

  describe('drag and drop', () => {
    // Test Case 20: Should handle checklist drag start
    it('should set dragging state on drag start', async () => {
      const wrapper = createWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      // Simulate drag start event
      const mockItem = document.createElement('li');
      mockItem.dataset.checklistId = 'cl-1';
      draggableComp.vm.$emit('start', { item: mockItem });

      await wrapper.vm.$nextTick();
      // Verify drag state is applied via cursor-grabbing class
      const buttons = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      expect(buttons[0].classes()).toContain('cursor-grabbing');
    });

    // Test Case 21: Should clear dragging state on drag end
    it('should clear dragging state on drag end', async () => {
      const wrapper = createWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      // First start drag
      const mockItem = document.createElement('li');
      mockItem.dataset.checklistId = 'cl-1';
      draggableComp.vm.$emit('start', { item: mockItem });
      await wrapper.vm.$nextTick();

      // Then end drag
      draggableComp.vm.$emit('end', {});
      await wrapper.vm.$nextTick();

      // Dragging class should be removed
      const buttons = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      expect(buttons[0].classes()).not.toContain('cursor-grabbing');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Sorted Checklists
  // ---------------------------------------------------------------------------

  describe('sorted checklists', () => {
    // Test Case 22: Should display checklists sorted by order
    it('should display checklists sorted by order property', () => {
      const checklists = [
        { id: 'cl-b', name: 'Beta', startDate: '2026-01-01', endDate: '2026-01-10', order: 2 },
        { id: 'cl-a', name: 'Alpha', startDate: '2026-01-01', endDate: '2026-01-10', order: 0 },
        { id: 'cl-c', name: 'Charlie', startDate: '2026-01-01', endDate: '2026-01-10', order: 1 },
      ];
      const wrapper = createWrapper({ checklists });
      const items = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      expect(items[0].text()).toContain('Alpha');
      expect(items[1].text()).toContain('Charlie');
      expect(items[2].text()).toContain('Beta');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Untitled Checklist
  // ---------------------------------------------------------------------------

  describe('untitled checklist', () => {
    // Test Case 23: Should show untitled text for empty name
    it('should display untitled placeholder for empty checklist name', () => {
      const checklists = [
        { id: 'cl-1', name: '', startDate: '2026-01-01', endDate: '2026-01-10', order: 0 },
      ];
      const wrapper = createWrapper({ checklists, isExpanded: true });
      expect(wrapper.text()).toContain('checklist.untitled');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 10: Language Dropdown Positioning
  // ---------------------------------------------------------------------------

  describe('language dropdown positioning', () => {
    // Test Case 24: Should position dropdown above the language button
    it('should apply positioning styles when language menu opens', async () => {
      const wrapper = createWrapper({ isExpanded: true });

      const langButton = wrapper.find('[data-testid="sidebar-language-button"]');
      await langButton.trigger('click');
      await wrapper.vm.$nextTick();

      // positionDropdownAbove should have been called; verify the dropdown exists
      // with position: fixed (set by positionDropdownAbove)
      const dropdown = wrapper.find('[data-testid="sidebar-language-dropdown"]');
      expect(dropdown.exists()).toBe(true);
      // The style should contain 'fixed' from positionDropdownAbove
      expect(dropdown.attributes('style')).toContain('fixed');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 11: Lifecycle Cleanup
  // ---------------------------------------------------------------------------

  describe('lifecycle', () => {
    // Test Case 25: Should remove event listeners on unmount
    it('should clean up document and window listeners on unmount', () => {
      const docRemoveSpy = vi.spyOn(document, 'removeEventListener');
      const winRemoveSpy = vi.spyOn(window, 'removeEventListener');

      const wrapper = createWrapper();
      wrapper.unmount();

      expect(docRemoveSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(winRemoveSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    });
  });
});
