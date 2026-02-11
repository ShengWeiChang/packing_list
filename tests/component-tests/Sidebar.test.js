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

import { mount, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import Sidebar from '../../source/components/Sidebar.vue';

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
    vi.stubGlobal('requestAnimationFrame', (cb) => cb());

    // Mock getBoundingClientRect for dropdown positioning
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 500,
      left: 50,
      right: 150,
      bottom: 540,
      width: 100,
      height: 40,
      x: 50,
      y: 500,
    }));
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
            emits: ['update:modelValue'],
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
      const newBtn = wrapper.find('[data-testid="sidebar-new-checklist"]');
      expect(newBtn.exists()).toBe(true);
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
      const toggleBtn = wrapper.find('button');
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
      const langBtn = wrapper.find('[aria-label="language.switchLanguage"]');
      expect(langBtn.exists()).toBe(true);

      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      // Language menu should now be visible
      expect(wrapper.text()).toContain('English');
      expect(wrapper.text()).toContain('繁體中文');
    });

    // Test Case 15: Should select a language and close menu
    it('should change locale and close menu when a language is selected', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.find('[aria-label="language.switchLanguage"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      // Click the second language option (zh-TW)
      const langOptions = wrapper.findAll('.min-w-40 button');
      expect(langOptions.length).toBe(2);
      await langOptions[1].trigger('click');

      // Menu should close
      expect(wrapper.find('.min-w-40').exists()).toBe(false);
    });

    // Test Case 16: Should close language menu on focusout
    it('should close language menu when focus leaves', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.find('[aria-label="language.switchLanguage"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.min-w-40').exists()).toBe(true);

      // Trigger focusout with relatedTarget outside the component
      const settingsDiv = wrapper.find('.relative.mt-auto');
      await settingsDiv.trigger('focusout', { relatedTarget: document.body });

      expect(wrapper.find('.min-w-40').exists()).toBe(false);
    });

    // Test Case 17: Should close language menu on scroll
    it('should close language menu on window scroll', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.find('[aria-label="language.switchLanguage"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.min-w-40').exists()).toBe(true);

      // Simulate scroll event
      window.dispatchEvent(new Event('scroll'));

      await wrapper.vm.$nextTick();
      expect(wrapper.find('.min-w-40').exists()).toBe(false);
    });

    // Test Case 18: Should close language menu on outside click
    it('should close language menu on outside click', async () => {
      const wrapper = createWrapper();
      const langBtn = wrapper.find('[aria-label="language.switchLanguage"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.min-w-40').exists()).toBe(true);

      // Simulate click on document body (outside)
      document.dispatchEvent(new Event('click', { bubbles: true }));

      await wrapper.vm.$nextTick();
      expect(wrapper.find('.min-w-40').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Drag and Drop
  // ---------------------------------------------------------------------------

  describe('drag and drop', () => {
    // Test Case 19: Should handle checklist drag start
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

    // Test Case 20: Should clear dragging state on drag end
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
  // Test Group 7: Sorted Checklists
  // ---------------------------------------------------------------------------

  describe('sorted checklists', () => {
    // Test Case 21: Should display checklists sorted by order
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

    // Test Case 26: Should emit move:checklists when draggable reorders
    it('should emit "move:checklists" when checklists are reordered', async () => {
      const wrapper = createWrapper();
      const draggableComp = wrapper.findComponent({ name: 'draggable' });

      // Simulate vuedraggable updating the model value (reordered array)
      const reordered = [
        createMockChecklists()[1], // Europe Tour first
        createMockChecklists()[0], // Japan Trip second
      ];
      draggableComp.vm.$emit('update:modelValue', reordered);
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('move:checklists');
      expect(emitted).toBeTruthy();
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0][0].order).toBe(0);
      expect(emitted[0][0][1].order).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Untitled Checklist
  // ---------------------------------------------------------------------------

  describe('untitled checklist', () => {
    // Test Case 22: Should show untitled text for empty name
    it('should display untitled placeholder for empty checklist name', () => {
      const checklists = [
        { id: 'cl-1', name: '', startDate: '2026-01-01', endDate: '2026-01-10', order: 0 },
      ];
      const wrapper = createWrapper({ checklists, isExpanded: true });
      expect(wrapper.text()).toContain('checklist.untitled');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Language Menu Positioning (with mount)
  // ---------------------------------------------------------------------------

  describe('language menu positioning', () => {
    const createMountWrapper = (props = {}) => {
      return mount(Sidebar, {
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
            },
            OverflowMenu: true,
          },
        },
        attachTo: document.body,
      });
    };

    afterEach(() => {
      // Clean up any mounted wrappers
      document.body.innerHTML = '';
    });

    // Test Case 23: Should position language dropdown when opened
    it('should apply fixed positioning to language dropdown', async () => {
      // Use deferred rAF so positionLanguageDropdown runs after Vue renders
      const rafCallbacks = [];
      vi.stubGlobal('requestAnimationFrame', (cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });

      const wrapper = createMountWrapper();
      const langBtn = wrapper.find('[aria-label="language.switchLanguage"]');
      await langBtn.trigger('click');
      await wrapper.vm.$nextTick();

      // Flush nested rAF callbacks after DOM has updated
      while (rafCallbacks.length) rafCallbacks.shift()();
      await wrapper.vm.$nextTick();

      const dropdown = wrapper.find('.min-w-40');
      expect(dropdown.exists()).toBe(true);
      const style = dropdown.attributes('style');
      expect(style).toContain('position: fixed');
      expect(style).not.toContain('-9999px');
    });

    // Test Case 24: Should handle lifecycle mount/unmount (addEventListener)
    it('should add event listeners on mount', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const scrollSpy = vi.spyOn(window, 'addEventListener');

      const wrapper = createMountWrapper();

      expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(scrollSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);

      wrapper.unmount();
    });

    // Test Case 25: Should remove event listeners on unmount
    it('should remove event listeners on unmount', () => {
      const wrapper = createMountWrapper();

      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const scrollRemoveSpy = vi.spyOn(window, 'removeEventListener');

      wrapper.unmount();

      expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(scrollRemoveSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    });
  });
});
