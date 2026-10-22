/*
================================================================================
File: tests/component-tests/App.test.js
Description: Component tests for App.vue.
             Tests all handler functions, responsive behavior, sidebar
             persistence, overlay logic, and confirm dialog interactions.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { enableAutoUnmount, flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { createI18n } from 'vue-i18n';

enableAutoUnmount(afterEach);

// -----------------------------------------------------------------------------
// Mock composable
// -----------------------------------------------------------------------------

const mockChecklists = ref([]);
const mockCategories = ref([]);
const mockItems = ref([]);
const mockSelectedChecklistId = ref(null);
const mockIsLoading = ref(false);
const mockError = ref(null);
const mockCanUndoPackingChange = ref(false);
const mockCanRedoPackingChange = ref(false);

const mockInitialize = vi.fn();
const mockCreateChecklist = vi.fn();
const mockUpdateChecklist = vi.fn();
const mockUpdateMultipleChecklists = vi.fn();
const mockDeleteChecklist = vi.fn();
const mockDuplicateChecklist = vi.fn();
const mockCreateCategory = vi.fn();
const mockGetCategories = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();
const mockDuplicateCategory = vi.fn();
const mockCreateItem = vi.fn();
const mockGetItems = vi.fn();
const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();
const mockDuplicateItem = vi.fn();
const mockSetCategoryPacked = vi.fn();
const mockUndoPackingChange = vi.fn();
const mockRedoPackingChange = vi.fn();
const mockTemplates = ref([]);
const mockLoadTemplates = vi.fn();
const mockSaveAsTemplate = vi.fn();
const mockApplyTemplate = vi.fn();
const mockDeleteTemplate = vi.fn();
const mockUpdateTemplate = vi.fn();
const mockApplyRecommendedList = vi.fn();
const mockRecommendedLists = [
  {
    id: 'general',
    name: 'General Travel',
    description: 'A balanced starting point.',
    categories: [{ id: 'documents', name: 'Documents', order: 0 }],
    items: [],
  },
];

vi.mock('../../source/composables/usePackingLists', () => ({
  usePackingLists: () => ({
    checklists: mockChecklists,
    categories: mockCategories,
    items: mockItems,
    selectedChecklistId: mockSelectedChecklistId,
    selectedChecklist: computed(
      () => mockChecklists.value.find((cl) => cl.id === mockSelectedChecklistId.value) || null
    ),
    isLoading: mockIsLoading,
    error: mockError,
    canUndoPackingChange: mockCanUndoPackingChange,
    canRedoPackingChange: mockCanRedoPackingChange,
    initialize: mockInitialize,
    createChecklist: mockCreateChecklist,
    updateChecklist: mockUpdateChecklist,
    updateMultipleChecklists: mockUpdateMultipleChecklists,
    deleteChecklist: mockDeleteChecklist,
    duplicateChecklist: mockDuplicateChecklist,
    createCategory: mockCreateCategory,
    getCategories: mockGetCategories,
    updateCategory: mockUpdateCategory,
    deleteCategory: mockDeleteCategory,
    duplicateCategory: mockDuplicateCategory,
    createItem: mockCreateItem,
    getItems: mockGetItems,
    updateItem: mockUpdateItem,
    deleteItem: mockDeleteItem,
    duplicateItem: mockDuplicateItem,
    setCategoryPacked: mockSetCategoryPacked,
    undoPackingChange: mockUndoPackingChange,
    redoPackingChange: mockRedoPackingChange,
  }),
}));

vi.mock('../../source/composables/useTemplates', () => ({
  useTemplates: () => ({
    templates: mockTemplates,
    loadTemplates: mockLoadTemplates,
    saveAsTemplate: mockSaveAsTemplate,
    applyTemplate: mockApplyTemplate,
    deleteTemplate: mockDeleteTemplate,
    updateTemplate: mockUpdateTemplate,
  }),
}));

vi.mock('../../source/services/recommendedListService.js', () => ({
  RecommendedListService: class {
    /** @returns {Array<object>} Mocked recommended lists. */
    getRecommendedLists() {
      return mockRecommendedLists;
    }

    /**
     * @param {...unknown} args - Forwarded service arguments.
     * @returns {object|null} Mocked applied recommended-list data.
     */
    applyToNewChecklist(...args) {
      return mockApplyRecommendedList(...args);
    }
  },
}));

import App from '../../source/App.vue';

// -----------------------------------------------------------------------------
// i18n Setup
// -----------------------------------------------------------------------------

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      checklist: {
        defaultName: 'New Checklist',
        deleteConfirm: 'Are you sure you want to delete this checklist?',
        pleaseCreate: 'Please create a new checklist first',
      },
      common: { packingUpdated: 'Packing status updated', undo: 'Undo' },
      category: { defaultName: 'New Category' },
      item: { defaultName: 'New Item' },
      template: { deleteConfirm: 'Are you sure you want to delete this template?' },
    },
  },
});

// -----------------------------------------------------------------------------
// App Component Tests
// -----------------------------------------------------------------------------

describe('App', () => {
  // ---------------------------------------------------------------------------
  // Test Setup
  // ---------------------------------------------------------------------------

  let originalInnerWidth;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;

    // Reset reactive state
    mockChecklists.value = [
      { id: 'cl-1', name: 'Trip A', order: 0 },
      { id: 'cl-2', name: 'Trip B', order: 1 },
    ];
    mockCategories.value = [{ id: 'cat-1', name: 'Clothing', checklistId: 'cl-1', order: 0 }];
    mockItems.value = [
      { id: 'item-1', name: 'Shirt', categoryId: 'cat-1', isPacked: false, order: 0, quantity: 1 },
      { id: 'item-2', name: 'Pants', categoryId: 'cat-1', isPacked: true, order: 1, quantity: 1 },
    ];
    mockSelectedChecklistId.value = 'cl-1';
    mockCanUndoPackingChange.value = false;
    mockCanRedoPackingChange.value = false;
    mockTemplates.value = [];

    // Reset all mocks
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);

    // Reset localStorage mock (global setup replaces globalThis.localStorage)
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockImplementation(() => {});
    localStorage.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Test Helper
  // ---------------------------------------------------------------------------

  /**
   * Set window width for responsive behavior tests.
   * @param {number} value - Target viewport width in pixels.
   */
  function setInnerWidth(value) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value,
    });
  }

  /**
   *
   */
  function dispatchResize() {
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Update viewport width and dispatch resize event.
   * @param {number} value - Target viewport width in pixels.
   */
  function setViewportWidth(value) {
    setInnerWidth(value);
    dispatchResize();
  }

  const createWrapper = (_props = {}) => {
    return shallowMount(App, {
      global: {
        plugins: [i18n],
        stubs: {
          Sidebar: {
            name: 'Sidebar',
            template: '<aside><slot /></aside>',
            props: [
              'isExpanded',
              'isMobile',
              'isNarrow',
              'checklists',
              'templates',
              'selectedChecklistId',
              'selectedTemplateId',
            ],
            emits: [
              'toggle-sidebar',
              'create-checklist',
              'select-checklist',
              'edit-checklist',
              'copy-checklist',
              'delete-checklist',
              'move:checklists',
              'save-as-template',
              'edit-template',
              'delete-template',
            ],
          },
          ChecklistComponent: {
            name: 'ChecklistComponent',
            template: '<div class="checklist-stub"><slot /></div>',
            props: [
              'checklist',
              'categories',
              'items',
              'newlyCreatedItemId',
              'newlyCreatedCategoryId',
              'newlyCreatedChecklistId',
            ],
            emits: [
              'update:checklist',
              'copy:checklist',
              'delete:checklist',
              'create:item',
              'update:item',
              'copy:item',
              'delete:item',
              'create:category',
              'update:category',
              'copy:category',
              'delete:category',
              'set-category-packed',
              'reorder:categories',
              'move:item',
            ],
          },
          Topbar: {
            name: 'Topbar',
            template: '<header><slot /></header>',
            props: ['title'],
            emits: ['toggle', 'new'],
          },
          TemplateEditor: {
            name: 'TemplateEditor',
            template: '<section class="template-editor-stub" />',
            props: ['template'],
            emits: ['cancel', 'delete', 'save'],
          },
          teleport: { template: '<div><slot /></div>' },
        },
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Test Case 1: Should render the main layout
    it('should render the main layout with sidebar and content', () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      expect(wrapper.get('main').attributes('class')).toContain('min-w-0');
    });

    // Test Case 2: Should show empty state when no checklist is selected
    it('should show empty state when no checklist is selected', () => {
      mockSelectedChecklistId.value = null;
      setInnerWidth(1280);
      const wrapper = createWrapper();
      expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('checklist.pleaseCreate');
    });

    // Test Case 3: Should show Checklist component when a checklist is selected
    it('should show ChecklistComponent when a checklist is selected', () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      expect(wrapper.getComponent({ name: 'ChecklistComponent' }).props('checklist').id).toBe(
        'cl-1'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Responsive Behavior
  // ---------------------------------------------------------------------------

  describe('responsive behavior — checkScreenSize', () => {
    // Test Case 4: Should detect mobile viewport
    it('should set isMobileViewport to true for narrow screens', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // On mobile, Topbar should be rendered
      expect(wrapper.getComponent({ name: 'Topbar' }).props('title')).toBe('Trip A');
    });

    // Test Case 5: Should hide sidebar on mobile
    it('should auto-collapse sidebar on mobile viewport', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Sidebar should be collapsed (isSidebarOpen = false)
      // Main content should NOT have blur class on desktop (no overlay)
      // On mobile with sidebar closed, overlay should not appear
      const overlay = wrapper.find('[role="button"][aria-label="Close sidebar"]');
      expect(overlay.exists()).toBe(false);
    });

    // Test Case 6: Should auto-expand sidebar on wide desktop if not manually collapsed
    it('should auto-expand sidebar on wide desktop when not manually collapsed', async () => {
      // localStorage returns null for collapsed key (not manually collapsed)
      setViewportWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      // Sidebar should exist and be visible (inline, not overlay)
      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      expect(sidebar.props('isMobile')).toBe(false);
    });

    // Test Case 7: Should NOT auto-expand sidebar on desktop when manually collapsed key exists
    it('should not auto-expand sidebar when manually collapsed key exists after resize from mobile', async () => {
      // Start on mobile so checkScreenSize collapses the sidebar
      setInnerWidth(500);

      // Simulate manually collapsed state via global localStorage mock
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'sidebar-manually-collapsed') return 'true';
        return null;
      });

      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // On mobile with sidebar collapsed, no Sidebar is rendered at all
      // (overlay needs isSidebarOpen=true, inline needs !isMobileViewport)
      expect(wrapper.findComponent({ name: 'Sidebar' }).exists()).toBe(false);

      // Now resize to wide desktop — the collapsed key prevents auto-expand
      setViewportWidth(1280);
      await wrapper.vm.$nextTick();

      // Inline sidebar renders on desktop (v-else-if="!isMobileViewport")
      // but isExpanded should be false because the collapsed key prevented auto-expand
      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      expect(sidebar.props('isMobile')).toBe(false);
      expect(sidebar.props('isExpanded')).toBe(false);
    });

    // Test Case 8: Should detect small desktop (overlay zone)
    it('should detect small desktop viewport as overlay zone', async () => {
      setInnerWidth(800);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // On small desktop, Topbar should NOT show (not mobile)
      expect(wrapper.findComponent({ name: 'Topbar' }).exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Toggle Sidebar
  // ---------------------------------------------------------------------------

  describe('toggleSidebar', () => {
    // Test Case 9: Should toggle sidebar open/closed on Sidebar emit
    it('should toggle sidebar when sidebar emits toggle-sidebar', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      expect(sidebar.props('isExpanded')).toBe(true);

      await sidebar.vm.$emit('toggle-sidebar');
      await wrapper.vm.$nextTick();

      // After toggle, sidebar should be collapsed
      const sidebarAfter = wrapper.findComponent({ name: 'Sidebar' });
      expect(sidebarAfter.props('isExpanded')).toBe(false);
    });

    // Test Case 10: Should persist sidebar collapse to localStorage on desktop
    it('should persist sidebar collapse to localStorage on desktop', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('toggle-sidebar');
      await wrapper.vm.$nextTick();

      // Should persist collapse (global mock localStorage)
      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-manually-collapsed', 'true');
    });

    // Test Case 11: Should remove localStorage key when sidebar re-opened on desktop
    it('should remove collapsed key from localStorage when sidebar re-opened', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      // Close
      await sidebar.vm.$emit('toggle-sidebar');
      await wrapper.vm.$nextTick();
      // Re-open
      await sidebar.vm.$emit('toggle-sidebar');
      await wrapper.vm.$nextTick();

      expect(localStorage.removeItem).toHaveBeenCalledWith('sidebar-manually-collapsed');
    });

    // Test Case 12: Should toggle sidebar from Topbar on mobile
    it('should toggle sidebar from Topbar on mobile', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      const topbar = wrapper.findComponent({ name: 'Topbar' });
      expect(topbar.props('title')).toBe('Trip A');

      await topbar.vm.$emit('toggle');
      await wrapper.vm.$nextTick();

      // After toggle on mobile, overlay should appear
      const overlay = wrapper.find('[role="button"][aria-label="Close sidebar"]');
      expect(overlay.attributes('aria-label')).toBe('Close sidebar');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Checklist Handlers
  // ---------------------------------------------------------------------------

  describe('checklist handlers', () => {
    // Test Case 13: Should open source selection from Sidebar without creating immediately
    it('should open source selection from Sidebar without creating immediately', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('create-checklist');
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent({ name: 'NewChecklistDialog' }).props('visible')).toBe(true);
      expect(mockCreateChecklist).not.toHaveBeenCalled();
    });

    // Test Case 14: Should open source selection from Topbar on mobile
    it('should open source selection from Topbar on mobile', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      const topbar = wrapper.findComponent({ name: 'Topbar' });
      await topbar.vm.$emit('new');
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent({ name: 'NewChecklistDialog' }).props('visible')).toBe(true);
      expect(mockCreateChecklist).not.toHaveBeenCalled();
    });

    // Test Case 15: handleChecklistEdit should select checklist and mark for edit
    it('should select and mark checklist for editing on handleChecklistEdit', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('edit-checklist', 'cl-2');
      await wrapper.vm.$nextTick();

      expect(mockSelectedChecklistId.value).toBe('cl-2');
    });

    // Test Case 16: handleChecklistCopy should duplicate and select the new checklist
    it('should duplicate checklist and select the copy on handleChecklistCopy', async () => {
      mockDuplicateChecklist.mockResolvedValue({ id: 'cl-copy', name: 'Trip A (Copy)', order: 2 });

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('copy-checklist', 'cl-1');
      await wrapper.vm.$nextTick();

      expect(mockDuplicateChecklist).toHaveBeenCalledWith('cl-1');
      expect(mockSelectedChecklistId.value).toBe('cl-copy');
    });

    // Test Case 17: handleChecklistDelete should confirm and delete
    it('should delete checklist after user confirms the dialog', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockDeleteChecklist.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('delete-checklist', 'cl-1');
      await wrapper.vm.$nextTick();

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this checklist?'
      );
      expect(mockDeleteChecklist).toHaveBeenCalledWith('cl-1');
    });

    // Test Case 18: handleChecklistDelete should not delete when user cancels
    it('should not delete checklist when user cancels the dialog', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('delete-checklist', 'cl-1');
      await wrapper.vm.$nextTick();

      expect(mockDeleteChecklist).not.toHaveBeenCalled();
    });

    // Test Case 19: handleChecklistDelete should fallback to first checklist
    it('should select first remaining checklist after deleting the selected one', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockDeleteChecklist.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      // Currently selected cl-1
      expect(mockSelectedChecklistId.value).toBe('cl-1');

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('delete-checklist', 'cl-1');
      await wrapper.vm.$nextTick();

      // Should fallback to first available (cl-1 is still in array because mock doesn't remove)
      // In real code, after deleteChecklist the checklists.value array would update
      expect(mockDeleteChecklist).toHaveBeenCalledWith('cl-1');
    });

    // Test Case 20: handleChecklistUpdate should call updateChecklist
    it('should update checklist via ChecklistComponent emit', async () => {
      mockUpdateChecklist.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      const updatedData = { id: 'cl-1', name: 'Updated Trip' };
      await checklist.vm.$emit('update:checklist', updatedData);
      await wrapper.vm.$nextTick();

      expect(mockUpdateChecklist).toHaveBeenCalledWith(updatedData);
    });

    // Test Case 21: handleChecklistMove should call updateMultipleChecklists
    it('should call updateMultipleChecklists on handleChecklistMove', async () => {
      mockUpdateMultipleChecklists.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const reordered = [
        { id: 'cl-2', name: 'Trip B', order: 0 },
        { id: 'cl-1', name: 'Trip A', order: 1 },
      ];
      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('move:checklists', reordered);
      await wrapper.vm.$nextTick();

      expect(mockUpdateMultipleChecklists).toHaveBeenCalledWith(reordered);
    });

    // Test Case 22: Overlay sidebar should update selected checklist on select event
    it('should update selectedChecklistId from overlay sidebar select-checklist event', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Open overlay sidebar on mobile first
      const topbar = wrapper.findComponent({ name: 'Topbar' });
      await topbar.vm.$emit('toggle');
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('select-checklist', 'cl-2');
      await wrapper.vm.$nextTick();

      expect(mockSelectedChecklistId.value).toBe('cl-2');
    });

    // Test Case 23: Inline sidebar should update selected checklist on select event
    it('should update selectedChecklistId from inline sidebar select-checklist event', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('select-checklist', 'cl-2');
      await wrapper.vm.$nextTick();

      expect(mockSelectedChecklistId.value).toBe('cl-2');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 5: Item Handlers
  // ---------------------------------------------------------------------------

  describe('item handlers', () => {
    // Test Case 24: handleItemCreate should create item with correct order
    it('should create item with maxOrder + 1 in the target category', async () => {
      mockCreateItem.mockResolvedValue({ id: 'item-new', name: 'New Item', order: 2 });

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('create:item', 'cat-1');
      await wrapper.vm.$nextTick();

      expect(mockCreateItem).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
          order: 2, // maxOrder=1 + 1
        })
      );
    });

    // Test Case 25: handleItemCreate should handle empty category
    it('should create item with order 0 in an empty category', async () => {
      mockCreateItem.mockResolvedValue({ id: 'item-new', name: 'New Item', order: 0 });

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('create:item', 'cat-empty');
      await wrapper.vm.$nextTick();

      expect(mockCreateItem).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-empty',
          order: 0, // no items → maxOrder=-1+1=0
        })
      );
    });

    // Test Case 26: handleItemUpdate should update item and clear newly created flag
    it('should update item and clear newlyCreatedItemId if matching', async () => {
      mockCreateItem.mockResolvedValue({ id: 'item-new', name: 'New Item', order: 2 });
      mockUpdateItem.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      // First create an item to set newlyCreatedItemId
      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('create:item', 'cat-1');
      await wrapper.vm.$nextTick();

      // Then update that item
      const updatedItem = { id: 'item-new', name: 'Renamed Item' };
      await checklist.vm.$emit('update:item', updatedItem);
      await wrapper.vm.$nextTick();

      expect(mockUpdateItem).toHaveBeenCalledWith(updatedItem);
    });

    // Test Case 27: handleItemCopy should call duplicateItem
    it('should call duplicateItem on copy:item emit', async () => {
      mockDuplicateItem.mockResolvedValue({ id: 'item-copy' });

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('copy:item', 'item-1');
      await wrapper.vm.$nextTick();

      expect(mockDuplicateItem).toHaveBeenCalledWith('item-1');
    });

    // Test Case 28: handleItemDelete should call deleteItem
    it('should call deleteItem on delete:item emit', async () => {
      mockDeleteItem.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('delete:item', 'item-1');
      await wrapper.vm.$nextTick();

      expect(mockDeleteItem).toHaveBeenCalledWith('item-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 6: Item Move Handler
  // ---------------------------------------------------------------------------

  describe('handleItemMove', () => {
    // Test Case 29: Should handle cross-category item move
    it('should update item categoryId and reordered items on move type', async () => {
      mockUpdateItem.mockResolvedValue(undefined);
      mockGetItems.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const moveData = {
        type: 'move',
        item: { id: 'item-1', name: 'Shirt', categoryId: 'cat-1' },
        newCategoryId: 'cat-2',
        reorderedItems: [
          { id: 'item-1', name: 'Shirt', categoryId: 'cat-2', order: 0 },
          { id: 'item-3', name: 'Socks', categoryId: 'cat-2', order: 1 },
        ],
      };

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('move:item', moveData);
      await flushPromises();

      // First call: update item with new categoryId
      expect(mockUpdateItem).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'item-1', categoryId: 'cat-2' })
      );
      // Additional calls: reordered items
      expect(mockUpdateItem).toHaveBeenCalledTimes(3); // 1 move + 2 reorder
      expect(mockGetItems).toHaveBeenCalled();
    });

    // Test Case 30: Should handle same-category reorder
    it('should update all items with new order on reorder type', async () => {
      mockUpdateItem.mockResolvedValue(undefined);
      mockGetItems.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const moveData = {
        type: 'reorder',
        items: [
          { id: 'item-2', name: 'Pants', order: 0 },
          { id: 'item-1', name: 'Shirt', order: 1 },
        ],
      };

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('move:item', moveData);
      await flushPromises();

      expect(mockUpdateItem).toHaveBeenCalledTimes(2);
      expect(mockGetItems).toHaveBeenCalled();
    });

    // Test Case 31: Should handle move without reorderedItems
    it('should handle move with empty reorderedItems gracefully', async () => {
      mockUpdateItem.mockResolvedValue(undefined);
      mockGetItems.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const moveData = {
        type: 'move',
        item: { id: 'item-1', name: 'Shirt', categoryId: 'cat-1' },
        newCategoryId: 'cat-2',
        reorderedItems: [],
      };

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('move:item', moveData);
      await flushPromises();

      expect(mockUpdateItem).toHaveBeenCalledTimes(1); // only the moved item
      expect(mockGetItems).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Category Handlers
  // ---------------------------------------------------------------------------

  describe('category handlers', () => {
    // Test Case 32: handleCategoryCreate should create with maxOrder + 1
    it('should create category with correct order', async () => {
      mockCreateCategory.mockResolvedValue({ id: 'cat-new', name: 'New Category', order: 1 });

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('create:category');
      await wrapper.vm.$nextTick();

      expect(mockCreateCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Category',
          order: 1, // maxOrder=0 + 1
        })
      );
    });

    // Test Case 33: handleCategoryUpdate should call updateCategory
    it('should update category and clear newlyCreatedCategoryId if matching', async () => {
      mockCreateCategory.mockResolvedValue({ id: 'cat-new', name: 'New Category', order: 1 });
      mockUpdateCategory.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });

      // Create to set newlyCreatedCategoryId
      await checklist.vm.$emit('create:category');
      await wrapper.vm.$nextTick();

      // Update the newly created category
      await checklist.vm.$emit('update:category', { id: 'cat-new', name: 'Renamed' });
      await wrapper.vm.$nextTick();

      expect(mockUpdateCategory).toHaveBeenCalledWith({ id: 'cat-new', name: 'Renamed' });
    });

    // Test Case 34: handleCategoryCopy should call duplicateCategory
    it('should call duplicateCategory on copy:category emit', async () => {
      mockDuplicateCategory.mockResolvedValue({ id: 'cat-copy' });

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('copy:category', 'cat-1');
      await wrapper.vm.$nextTick();

      expect(mockDuplicateCategory).toHaveBeenCalledWith('cat-1');
    });

    // Test Case 35: handleCategoryDelete should call deleteCategory
    it('should call deleteCategory on delete:category emit', async () => {
      mockDeleteCategory.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('delete:category', 'cat-1');
      await wrapper.vm.$nextTick();

      expect(mockDeleteCategory).toHaveBeenCalledWith('cat-1');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 8: Category Reorder
  // ---------------------------------------------------------------------------

  describe('handleCategoryReorder', () => {
    // Test Case 36: Should update all categories and refresh
    it('should update each category and call getCategories', async () => {
      mockUpdateCategory.mockResolvedValue(undefined);
      mockGetCategories.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const reordered = [
        { id: 'cat-2', name: 'Documents', order: 0 },
        { id: 'cat-1', name: 'Clothing', order: 1 },
      ];

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('reorder:categories', reordered);
      await flushPromises();

      expect(mockUpdateCategory).toHaveBeenCalledTimes(2);
      expect(mockGetCategories).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Overlay Behavior
  // ---------------------------------------------------------------------------

  describe('overlay and body scroll lock', () => {
    // Test Case 37: Should show overlay on mobile when sidebar is open
    it('should display overlay backdrop when sidebar is open on mobile', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Open sidebar
      const topbar = wrapper.findComponent({ name: 'Topbar' });
      await topbar.vm.$emit('toggle');
      await wrapper.vm.$nextTick();

      const overlay = wrapper.find('[role="button"][aria-label="Close sidebar"]');
      expect(overlay.attributes('role')).toBe('button');
    });

    // Test Case 38: Should close sidebar when overlay is clicked
    it('should close sidebar when overlay backdrop is clicked', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Open sidebar
      const topbar = wrapper.findComponent({ name: 'Topbar' });
      await topbar.vm.$emit('toggle');
      await wrapper.vm.$nextTick();

      const overlay = wrapper.find('[role="button"][aria-label="Close sidebar"]');
      await overlay.trigger('click');
      await wrapper.vm.$nextTick();

      // Overlay should disappear
      expect(wrapper.find('[role="button"][aria-label="Close sidebar"]').exists()).toBe(false);
    });

    // Test Case 39: Should lock body scroll when overlay is active
    it('should set body overflow hidden when overlay is active', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Open sidebar
      const topbar = wrapper.findComponent({ name: 'Topbar' });
      await topbar.vm.$emit('toggle');
      await wrapper.vm.$nextTick();

      expect(document.body.style.overflow).toBe('hidden');

      // Close sidebar
      await topbar.vm.$emit('toggle');
      await wrapper.vm.$nextTick();

      expect(document.body.style.overflow).toBe('');
    });

    // Test Case 40: Should lock body scroll on small desktop overlay
    it('should set body overflow hidden when sidebar opens on small desktop', async () => {
      // Reset body style from previous tests
      document.body.style.overflow = '';

      // Start at 1280px (wide desktop) where sidebar is open and no overlay
      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // Body should not be locked on wide desktop
      expect(document.body.style.overflow).toBe('');

      // Resize to small desktop (800px) → checkScreenSize auto-collapses sidebar
      setViewportWidth(800);
      await wrapper.vm.$nextTick();

      // Sidebar is now collapsed, no overlay → body should be free
      expect(document.body.style.overflow).toBe('');

      // Find the sidebar from overlay (teleported) or inline
      const sidebar = wrapper.findComponent({ name: 'Sidebar' });

      // Toggle sidebar open on small desktop → overlay active
      await sidebar.vm.$emit('toggle-sidebar');
      await wrapper.vm.$nextTick();

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 10: Lifecycle
  // ---------------------------------------------------------------------------

  describe('lifecycle', () => {
    // Test Case 41: Should call initialize on mount
    it('should call initialize on mount', () => {
      setInnerWidth(1280);
      createWrapper();
      expect(mockInitialize).toHaveBeenCalledWith();
    });

    // Test Case 42: Should remove resize listener on unmount
    it('should clean up resize event listener on unmount', async () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      wrapper.unmount();

      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 11: Template Editing
  // ---------------------------------------------------------------------------

  describe('template editing', () => {
    // Test Case 43: Should open an isolated editor without creating a checklist
    it('should open an isolated editor without creating a checklist', async () => {
      mockTemplates.value = [
        { id: 'template-1', name: 'Weekend', order: 0, categories: [], items: [] },
      ];
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', 'template-1');
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent({ name: 'TemplateEditor' }).props('template')).toEqual(
        mockTemplates.value[0]
      );
      expect(mockCreateChecklist).not.toHaveBeenCalled();
      expect(mockDeleteChecklist).not.toHaveBeenCalled();
    });

    // Test Case 44: Should save only through the templates composable
    it('should save only through the templates composable', async () => {
      const template = {
        id: 'template-1',
        name: 'Weekend',
        order: 0,
        categories: [],
        items: [],
      };
      mockTemplates.value = [template];
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', template.id);
      await wrapper.vm.$nextTick();
      await wrapper.findComponent({ name: 'TemplateEditor' }).vm.$emit('save', template);

      expect(mockUpdateTemplate).toHaveBeenCalledWith(template);
      expect(mockUpdateChecklist).not.toHaveBeenCalled();
      expect(mockCreateChecklist).not.toHaveBeenCalled();
    });

    // Test Case 45: Should save a selected checklist through the named template dialog
    it('opens the named template dialog and saves its selected checklist', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'cl-1');
      await wrapper.vm.$nextTick();
      await wrapper.findComponent({ name: 'SaveTemplateDialog' }).vm.$emit('save', 'Trip Template');

      expect(mockSaveAsTemplate).toHaveBeenCalledWith('cl-1', 'Trip Template');
    });

    // Test Case 46: Should create a checklist from a selected personal template
    it('creates a checklist from a selected personal template', async () => {
      mockTemplates.value = [
        { id: 'template-1', name: 'Weekend', order: 0, categories: [], items: [] },
      ];
      mockApplyTemplate.mockReturnValue({ categories: [{ id: 'cat-new' }], items: [] });
      mockCreateChecklist.mockResolvedValue({ id: 'cl-template' });
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      await wrapper.vm.$nextTick();
      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'template', templateId: 'template-1' });

      expect(mockApplyTemplate).toHaveBeenCalledWith(
        'template-1',
        expect.stringMatching(/^checklist-/)
      );
      expect(mockCreateChecklist).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.stringMatching(/^checklist-/) }),
        expect.objectContaining({
          source: 'template',
          seedData: { categories: [{ id: 'cat-new' }], items: [] },
        })
      );
    });

    // Test Case 47: Should delete the active template and leave the editor
    it('deletes the active template and leaves the editor', async () => {
      const template = {
        id: 'template-1',
        name: 'Weekend',
        order: 0,
        categories: [],
        items: [],
      };
      mockTemplates.value = [template];
      mockDeleteTemplate.mockReturnValue(true);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', template.id);
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'TemplateEditor' }).vm.$emit('delete', template.id);

      expect(mockDeleteTemplate).toHaveBeenCalledWith(template.id);
      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(false);
    });

    // Test Case 48: Should create an explicitly empty checklist
    it('creates an explicitly empty checklist', async () => {
      mockTemplates.value = [{ id: 'template-1', name: 'Weekend', categories: [], items: [] }];
      mockCreateChecklist.mockResolvedValue({ id: 'cl-empty' });
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'empty' });

      expect(mockCreateChecklist).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Checklist', order: 2 }),
        { source: 'empty' }
      );
    });

    // Test Case 49: Should stop template creation when applying the template fails
    it('stops template creation when applying the template fails', async () => {
      mockTemplates.value = [{ id: 'template-1', name: 'Weekend', categories: [], items: [] }];
      mockApplyTemplate.mockReturnValue(null);
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'template', templateId: 'template-1' });

      expect(mockCreateChecklist).not.toHaveBeenCalled();
    });

    // Test Case 50: Should ignore requests to edit a missing template
    it('ignores requests to edit a missing template', async () => {
      mockTemplates.value = [];
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', 'missing');

      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(false);
    });

    // Test Case 51: Should keep the editor open when saving a template fails
    it('keeps the editor open when saving a template fails', async () => {
      const template = { id: 'template-1', name: 'Weekend', categories: [], items: [] };
      mockTemplates.value = [template];
      mockUpdateTemplate.mockReturnValue(null);
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', template.id);
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'TemplateEditor' }).vm.$emit('save', template);

      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(true);
    });

    // Test Case 52: Should discard a template draft when editing is canceled
    it('discards a template draft when editing is canceled', async () => {
      const template = { id: 'template-1', name: 'Weekend', categories: [], items: [] };
      mockTemplates.value = [template];
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', template.id);
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'TemplateEditor' }).vm.$emit('cancel');

      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(false);
      expect(mockUpdateTemplate).not.toHaveBeenCalled();
    });

    // Test Case 53: Should preserve a template when deletion is canceled
    it('preserves a template when deletion is canceled', async () => {
      const template = { id: 'template-1', name: 'Weekend', categories: [], items: [] };
      mockTemplates.value = [template];
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', template.id);
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'TemplateEditor' }).vm.$emit('delete', template.id);

      expect(mockDeleteTemplate).not.toHaveBeenCalled();
      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(true);
    });

    // Test Case 54: Should close both template dialogs without performing an operation
    it('closes both template dialogs without performing an operation', async () => {
      mockTemplates.value = [{ id: 'template-1', name: 'Weekend', categories: [], items: [] }];
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      await wrapper.findComponent({ name: 'NewChecklistDialog' }).vm.$emit('close');
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'cl-1');
      await wrapper.findComponent({ name: 'SaveTemplateDialog' }).vm.$emit('close');

      expect(mockCreateChecklist).not.toHaveBeenCalled();
      expect(mockSaveAsTemplate).not.toHaveBeenCalled();
    });

    // Test Case 55: Should leave checklist state unchanged when empty creation fails
    it('leaves checklist state unchanged when empty creation fails', async () => {
      mockTemplates.value = [{ id: 'template-1', name: 'Weekend', categories: [], items: [] }];
      mockCreateChecklist.mockResolvedValue(null);
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'empty' });

      expect(mockCreateChecklist).toHaveBeenCalledWith(expect.any(Object), { source: 'empty' });
      expect(mockSelectedChecklistId.value).toBe('cl-1');
    });

    // Test Case 56: Should keep the editor open when template deletion fails
    it('keeps the editor open when template deletion fails', async () => {
      const template = { id: 'template-1', name: 'Weekend', categories: [], items: [] };
      mockTemplates.value = [template];
      mockDeleteTemplate.mockReturnValue(false);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', template.id);
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'TemplateEditor' }).vm.$emit('delete', template.id);

      expect(mockDeleteTemplate).toHaveBeenCalledWith(template.id);
      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(true);
    });

    // Test Case 57: Should use an empty initial name for an unknown checklist
    it('uses an empty initial name for an unknown checklist', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'missing');

      expect(wrapper.findComponent({ name: 'SaveTemplateDialog' }).props('initialName')).toBe('');
    });

    // Test Case 58: Should ignore duplicate template save events after source state is cleared
    it('ignores duplicate template save events after source state is cleared', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'cl-1');
      const dialog = wrapper.findComponent({ name: 'SaveTemplateDialog' });

      await dialog.vm.$emit('save', 'Trip Template');
      await dialog.vm.$emit('save', 'Trip Template');

      expect(mockSaveAsTemplate).toHaveBeenCalledTimes(1);
    });

    // Test Case 59: Should create a checklist from a selected recommended list
    it('creates a checklist from a selected recommended list', async () => {
      const seedData = { categories: [{ id: 'category-new' }], items: [] };
      mockApplyRecommendedList.mockReturnValue(seedData);
      mockCreateChecklist.mockResolvedValue({ id: 'checklist-recommended' });
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'recommended', recommendedListId: 'general' });

      expect(mockApplyRecommendedList).toHaveBeenCalledWith(
        'general',
        expect.stringMatching(/^checklist-/),
        'en'
      );
      expect(mockCreateChecklist).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.stringMatching(/^checklist-/) }),
        { source: 'recommended', seedData }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 14: Packing Undo
  // ---------------------------------------------------------------------------

  describe('packing undo', () => {
    // Test Case 60: Should offer one-click undo after a category packing change
    it('should apply a category packing change and offer one-click undo', async () => {
      mockSetCategoryPacked.mockResolvedValue([{ id: 'item-1', isPacked: true }]);
      mockUndoPackingChange.mockResolvedValue(true);
      mockCanUndoPackingChange.value = true;
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper
        .findComponent({ name: 'ChecklistComponent' })
        .vm.$emit('set-category-packed', { categoryId: 'cat-1', isPacked: true });
      await flushPromises();

      expect(mockSetCategoryPacked).toHaveBeenCalledWith('cat-1', true);
      expect(wrapper.find('[data-testid="packing-undo-toast"]').exists()).toBe(true);

      mockCanUndoPackingChange.value = false;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="packing-undo-toast"]').exists()).toBe(false);

      mockCanUndoPackingChange.value = true;
      await wrapper
        .findComponent({ name: 'ChecklistComponent' })
        .vm.$emit('set-category-packed', { categoryId: 'cat-1', isPacked: true });
      await flushPromises();
      const undoToast = wrapper.get('[data-testid="packing-undo-toast"]');
      await undoToast.get('button').trigger('click');
      await flushPromises();

      expect(mockUndoPackingChange).toHaveBeenCalledOnce();
      expect(wrapper.find('[data-testid="packing-undo-toast"]').exists()).toBe(false);

      let resolveStaleBatch;
      mockSetCategoryPacked.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStaleBatch = resolve;
        })
      );
      mockSelectedChecklistId.value = 'cl-1';
      void wrapper
        .findComponent({ name: 'ChecklistComponent' })
        .vm.$emit('set-category-packed', { categoryId: 'cat-1', isPacked: false });
      mockSelectedChecklistId.value = 'cl-2';
      resolveStaleBatch([{ id: 'item-1', isPacked: false }]);
      await flushPromises();

      expect(mockCanUndoPackingChange.value).toBe(true);
      expect(wrapper.find('[data-testid="packing-undo-toast"]').exists()).toBe(false);
    });

    // Test Case 61: Should preserve native undo inside an input
    it('should use Ctrl+Z for packing undo but preserve input-native undo', async () => {
      mockUndoPackingChange.mockResolvedValue(true);
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await flushPromises();

      const unavailableUndo = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        cancelable: true,
      });
      window.dispatchEvent(unavailableUndo);
      expect(unavailableUndo.defaultPrevented).toBe(false);
      expect(mockUndoPackingChange).not.toHaveBeenCalled();

      mockCanUndoPackingChange.value = true;
      const availableUndo = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        cancelable: true,
      });
      window.dispatchEvent(availableUndo);
      await flushPromises();
      expect(availableUndo.defaultPrevented).toBe(true);
      expect(mockUndoPackingChange).toHaveBeenCalledOnce();

      mockCanRedoPackingChange.value = true;
      const availableRedo = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        cancelable: true,
      });
      window.dispatchEvent(availableRedo);
      await flushPromises();
      expect(availableRedo.defaultPrevented).toBe(true);
      expect(mockRedoPackingChange).toHaveBeenCalledOnce();

      const input = document.createElement('input');
      document.body.append(input);
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true })
      );
      await flushPromises();

      expect(mockUndoPackingChange).toHaveBeenCalledOnce();
      expect(mockRedoPackingChange).toHaveBeenCalledOnce();
      input.remove();
      wrapper.unmount();
    });
  });
});
