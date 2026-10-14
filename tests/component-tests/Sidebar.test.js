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

const createMockTemplates = () => [
  { id: 'template-1', name: 'Weekend', order: 0, categories: [], items: [] },
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
        select: 'Language',
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
      expect(wrapper.emitted('select-checklist')[0][0]).toBe('cl-1');
    });

    // Test Case 8: Should emit copy-checklist from OverflowMenu
    it('should emit "copy-checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menus = wrapper.findAllComponents({ name: 'OverflowMenu' });
      expect(menus.length).toBeGreaterThan(0);

      await menus[0].vm.$emit('copy');

      expect(wrapper.emitted('copy-checklist')).toHaveLength(1);
      expect(wrapper.emitted('copy-checklist')[0][0]).toBe('cl-2');
    });

    // Test Case 9: Should emit delete-checklist from OverflowMenu
    it('should emit "delete-checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menus = wrapper.findAllComponents({ name: 'OverflowMenu' });

      await menus[0].vm.$emit('delete');

      expect(wrapper.emitted('delete-checklist')).toHaveLength(1);
      expect(wrapper.emitted('delete-checklist')[0][0]).toBe('cl-2');
    });

    // Test Case 10: Should emit edit-checklist from OverflowMenu
    it('should emit "edit-checklist" from OverflowMenu', async () => {
      const wrapper = createWrapper();
      const menus = wrapper.findAllComponents({ name: 'OverflowMenu' });

      await menus[0].vm.$emit('edit');

      expect(wrapper.emitted('edit-checklist')).toHaveLength(1);
      expect(wrapper.emitted('edit-checklist')[0][0]).toBe('cl-2');
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
      // The selected checklist remains active after newest-first sorting.
      expect(listItems[1].attributes('aria-current')).toBe('page');
    });

    // Test Case 12: Non-selected checklist should not have aria-current
    it('should not highlight non-selected checklists', () => {
      const wrapper = createWrapper({ selectedChecklistId: 'cl-1' });
      const listItems = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      expect(listItems[0].attributes('aria-current')).toBeUndefined();
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
      expect(langBtn.text()).toContain('language.select');

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
    // Test Case 19: Should retain newest-first order when draggable updates
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
      expect(emitted[0][0][0].order).toBe(1);
      expect(emitted[0][0][1].order).toBe(0);
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
      expect(buttons[1].classes()).toContain('cursor-grabbing');
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
    // Test Case 22: Should display newest checklists first
    it('should display checklists in descending order property order', () => {
      const checklists = [
        { id: 'cl-b', name: 'Beta', startDate: '2026-01-01', endDate: '2026-01-10', order: 2 },
        { id: 'cl-a', name: 'Alpha', startDate: '2026-01-01', endDate: '2026-01-10', order: 0 },
        { id: 'cl-c', name: 'Charlie', startDate: '2026-01-01', endDate: '2026-01-10', order: 1 },
      ];
      const wrapper = createWrapper({ checklists });
      const items = wrapper.findAll('[data-testid="sidebar-checklist-item"]');
      expect(items[0].text()).toContain('Beta');
      expect(items[1].text()).toContain('Charlie');
      expect(items[2].text()).toContain('Alpha');
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
  // Test Group 10: Settings Dropdown Layout
  // ---------------------------------------------------------------------------

  describe('settings dropdown layout', () => {
    // Test Case 24: Should position dropdown above and match the button width
    it('should position the language dropdown relative to its button', async () => {
      const wrapper = createWrapper({ isExpanded: true });

      const langButton = wrapper.find('[data-testid="sidebar-language-button"]');
      await langButton.trigger('click');
      await wrapper.vm.$nextTick();

      const dropdown = wrapper.find('[data-testid="sidebar-language-dropdown"]');
      expect(dropdown.exists()).toBe(true);
      expect(dropdown.classes()).toContain('absolute');
      expect(dropdown.classes()).toContain('bottom-full');
      expect(dropdown.classes()).toContain('w-full');
    });

    // Test Case 25: Should use the same layout for language and template dropdowns
    it('should use the same layout for language and template dropdowns', async () => {
      const wrapper = createWrapper({ isExpanded: true, templates: createMockTemplates() });
      await wrapper.get('[data-testid="sidebar-templates-button"]').trigger('click');
      const templateClasses = wrapper.get('[data-testid="sidebar-templates-dropdown"]').classes();
      await wrapper.get('[data-testid="sidebar-language-button"]').trigger('click');
      const languageClasses = wrapper.get('[data-testid="sidebar-language-dropdown"]').classes();

      expect(templateClasses).toEqual(languageClasses);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 11: Lifecycle Cleanup
  // ---------------------------------------------------------------------------

  describe('lifecycle', () => {
    // Test Case 26: Should remove event listeners on unmount
    it('should clean up document and window listeners on unmount', () => {
      const docRemoveSpy = vi.spyOn(document, 'removeEventListener');
      const winRemoveSpy = vi.spyOn(window, 'removeEventListener');

      const wrapper = createWrapper();
      wrapper.unmount();

      expect(docRemoveSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(winRemoveSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 12: Templates Menu
  // ---------------------------------------------------------------------------

  describe('templates menu', () => {
    // Test Case 27: Should close when clicking outside the settings area
    it('should close when clicking outside the settings area', async () => {
      const wrapper = createWrapper({ templates: createMockTemplates() });
      await wrapper.get('[data-testid="sidebar-templates-button"]').trigger('click');
      expect(wrapper.find('[data-testid="sidebar-templates-dropdown"]').exists()).toBe(true);

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="sidebar-templates-dropdown"]').exists()).toBe(false);
    });

    // Test Case 28: Should close and emit edit-template when a template is selected
    it('should close and emit edit-template when a template is selected', async () => {
      const wrapper = createWrapper({ templates: createMockTemplates() });
      await wrapper.get('[data-testid="sidebar-templates-button"]').trigger('click');
      await wrapper.get('[data-testid="sidebar-template-use-template-1"]').trigger('click');

      expect(wrapper.emitted('edit-template')).toEqual([['template-1']]);
      expect(wrapper.find('[data-testid="sidebar-templates-dropdown"]').exists()).toBe(false);
    });

    // Test Case 29: Should not render a template overflow menu on narrow screens
    it('should not render a template overflow menu on narrow screens', async () => {
      const wrapper = createWrapper({
        isMobile: true,
        templates: createMockTemplates(),
      });
      await wrapper.get('[data-testid="sidebar-templates-button"]').trigger('click');

      const templateMenus = wrapper
        .findAllComponents({ name: 'OverflowMenu' })
        .filter((menu) => menu.props('menuType') === 'template');
      expect(templateMenus).toHaveLength(0);
      expect(wrapper.get('[data-testid="sidebar-template-use-template-1"]').exists()).toBe(true);
    });

    // Test Case 30: Should render templates by order and highlight the active template
    it('renders templates by order and highlights the active template', async () => {
      const wrapper = createWrapper({
        selectedTemplateId: 'template-first',
        templates: [
          { id: 'template-later', name: 'Later', order: 2, categories: [], items: [] },
          { id: 'template-first', name: 'First', order: 0, categories: [], items: [] },
        ],
      });
      await wrapper.get('[data-testid="sidebar-templates-button"]').trigger('click');
      const templateButtons = wrapper.findAll('[data-testid^="sidebar-template-use-"]');

      expect(templateButtons.map((button) => button.text())).toEqual(['First', 'Later']);
      expect(templateButtons[0].element.parentElement.className).toContain(
        'bg-interactive-hover-light'
      );
    });

    // Test Case 31: Should display the empty state when no personal templates exist
    it('displays the empty state when no personal templates exist', async () => {
      const wrapper = createWrapper({ templates: [] });

      await wrapper.get('[data-testid="sidebar-templates-button"]').trigger('click');

      expect(wrapper.get('[data-testid="sidebar-templates-dropdown"]').text()).toContain(
        'template.noTemplates'
      );
    });

    // Test Case 32: Should close the template menu when Escape is pressed
    it('closes the template menu when Escape is pressed', async () => {
      const wrapper = createWrapper({ templates: createMockTemplates() });
      await wrapper.get('[data-testid="sidebar-templates-button"]').trigger('click');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="sidebar-templates-dropdown"]').exists()).toBe(false);
    });

    // Test Case 33: Should forward save-as-template from a checklist overflow menu
    it('forwards save-as-template from a checklist overflow menu', async () => {
      const wrapper = createWrapper();
      const checklistMenu = wrapper
        .findAllComponents({ name: 'OverflowMenu' })
        .find((menu) => menu.props('menuType') === 'checklist');

      await checklistMenu.vm.$emit('save-as-template');

      expect(wrapper.emitted('save-as-template')).toEqual([['cl-2']]);
    });
  });
});
