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
const mockHistoryBarrierVersion = ref(0);
const mockHistoryEventVersion = ref(0);
const mockLastPackingHistoryAction = ref(null);

const mockInitialize = vi.fn();
const mockCreateChecklist = vi.fn();
const mockUpdateChecklist = vi.fn();
const mockUpdateMultipleChecklists = vi.fn();
const mockDeleteChecklist = vi.fn();
const mockDuplicateChecklist = vi.fn();
const mockCreateCategory = vi.fn();
const mockGetCategories = vi.fn();
const mockUpdateCategory = vi.fn();
const mockUpdateMultipleCategories = vi.fn();
const mockDeleteCategory = vi.fn();
const mockDuplicateCategory = vi.fn();
const mockCreateItem = vi.fn();
const mockGetItems = vi.fn();
const mockUpdateItem = vi.fn();
const mockUpdateMultipleItems = vi.fn();
const mockDeleteItem = vi.fn();
const mockDuplicateItem = vi.fn();
const mockSetCategoryPacked = vi.fn();
const mockGetPackingBatchEventVersion = vi.fn();
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
    historyBarrierVersion: mockHistoryBarrierVersion,
    historyEventVersion: mockHistoryEventVersion,
    lastPackingHistoryAction: mockLastPackingHistoryAction,
    initialize: mockInitialize,
    createChecklist: mockCreateChecklist,
    updateChecklist: mockUpdateChecklist,
    updateMultipleChecklists: mockUpdateMultipleChecklists,
    deleteChecklist: mockDeleteChecklist,
    duplicateChecklist: mockDuplicateChecklist,
    createCategory: mockCreateCategory,
    getCategories: mockGetCategories,
    updateCategory: mockUpdateCategory,
    updateMultipleCategories: mockUpdateMultipleCategories,
    deleteCategory: mockDeleteCategory,
    duplicateCategory: mockDuplicateCategory,
    createItem: mockCreateItem,
    getItems: mockGetItems,
    updateItem: mockUpdateItem,
    updateMultipleItems: mockUpdateMultipleItems,
    deleteItem: mockDeleteItem,
    duplicateItem: mockDuplicateItem,
    setCategoryPacked: mockSetCategoryPacked,
    getPackingBatchEventVersion: mockGetPackingBatchEventVersion,
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

vi.mock('../../source/services/recommendedListService', () => ({
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
        defaultNameFromEmpty: 'New Checklist (Empty)',
        defaultNameFromTemplate: 'New Checklist ({name})',
        defaultNameFromRecommended: 'New Checklist ({name})',
        deleteConfirm: 'Are you sure you want to delete this checklist?',
        pleaseCreate: 'Please create a new checklist first',
      },
      storage: { historyClearedByChange: 'History was cleared', dismissHistoryNotice: 'Dismiss' },
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
      { id: 'cl-1', name: 'Trip A', startDate: '2025-12-01', endDate: '2025-12-02', order: 0 },
      { id: 'cl-2', name: 'Trip B', startDate: '2025-12-08', endDate: '2025-12-09', order: 1 },
    ];
    mockCategories.value = [{ id: 'cat-1', name: 'Clothing', checklistId: 'cl-1', order: 0 }];
    mockItems.value = [
      { id: 'item-1', name: 'Shirt', categoryId: 'cat-1', isPacked: false, order: 0, quantity: 1 },
      { id: 'item-2', name: 'Pants', categoryId: 'cat-1', isPacked: true, order: 1, quantity: 1 },
    ];
    mockSelectedChecklistId.value = 'cl-1';
    mockCanUndoPackingChange.value = false;
    mockCanRedoPackingChange.value = false;
    mockHistoryBarrierVersion.value = 0;
    mockHistoryEventVersion.value = 0;
    mockLastPackingHistoryAction.value = null;
    mockTemplates.value = [];

    // Clear call history and isolate the composable mock implementations.
    vi.clearAllMocks();
    for (const mock of [
      mockInitialize,
      mockCreateChecklist,
      mockUpdateChecklist,
      mockUpdateMultipleChecklists,
      mockDeleteChecklist,
      mockDuplicateChecklist,
      mockCreateCategory,
      mockGetCategories,
      mockUpdateCategory,
      mockUpdateMultipleCategories,
      mockDeleteCategory,
      mockDuplicateCategory,
      mockCreateItem,
      mockGetItems,
      mockUpdateItem,
      mockUpdateMultipleItems,
      mockDeleteItem,
      mockDuplicateItem,
      mockSetCategoryPacked,
      mockGetPackingBatchEventVersion,
      mockUndoPackingChange,
      mockRedoPackingChange,
      mockLoadTemplates,
      mockSaveAsTemplate,
      mockApplyTemplate,
      mockDeleteTemplate,
      mockUpdateTemplate,
      mockApplyRecommendedList,
    ])
      mock.mockReset();
    mockInitialize.mockResolvedValue(undefined);
    mockGetPackingBatchEventVersion.mockImplementation(() => mockHistoryEventVersion.value);

    // Reset localStorage mock (global setup replaces globalThis.localStorage)
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockImplementation(() => {});
    localStorage.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
    vi.useRealTimers();
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
              'undo',
              'redo',
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
              'saveItemEdit',
              'retainDraft',
              'editCancelled',
              'editStarted',
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
            methods: { isComposing: () => false, hasChanges: () => false },
          },
          PackingCompletionOverlay: {
            name: 'PackingCompletionOverlay',
            template: '<section class="packing-completion-overlay-stub" />',
            props: ['checklistName', 'endDate', 'startDate'],
            emits: ['close'],
          },
          teleport: true,
        },
      },
    });
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    // Should render the main layout
    // Test Case 1: should render the main layout with sidebar and content.
    it('should render the main layout with sidebar and content', () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      expect(wrapper.get('main').attributes('class')).toContain('min-w-0');
    });

    // Should show empty state when no checklist is selected
    // Test Case 2: should show empty state when no checklist is selected.
    it('should show empty state when no checklist is selected', () => {
      mockSelectedChecklistId.value = null;
      setInnerWidth(1280);
      const wrapper = createWrapper();
      expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('checklist.pleaseCreate');
    });

    // Should show Checklist component when a checklist is selected
    // Test Case 3: should show ChecklistComponent when a checklist is selected.
    it('should show ChecklistComponent when a checklist is selected', () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      expect(wrapper.getComponent({ name: 'ChecklistComponent' }).props('checklist').id).toBe(
        'cl-1'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 1A: Packing Completion Feedback
  // ---------------------------------------------------------------------------

  describe('packing completion feedback', () => {
    // Should show the journey overlay after the final local item is packed
    // Test Case 4: shows the completion overlay after the final local item is packed.
    it('shows the completion overlay after the final local item is packed', async () => {
      mockUpdateItem.mockImplementation(async (item) => {
        mockItems.value = mockItems.value.map((existing) =>
          existing.id === item.id ? { ...existing, ...item } : existing
        );
        return item;
      });
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'ChecklistComponent' }).vm.$emit('update:item', {
        ...mockItems.value[0],
        isPacked: true,
      });
      await flushPromises();

      const overlay = wrapper.getComponent({ name: 'PackingCompletionOverlay' });
      expect(overlay.props()).toMatchObject({
        checklistName: 'Trip A',
        endDate: '2025-12-02',
        startDate: '2025-12-01',
      });
    });

    // Should show the journey only when redo successfully completes the checklist
    // Test Case 5: shows the completion overlay only when redo completes the checklist.
    it('shows the completion overlay only when redo completes the checklist', async () => {
      mockCanRedoPackingChange.value = true;
      mockRedoPackingChange.mockImplementationOnce(async () => {
        mockLastPackingHistoryAction.value = {
          checklistId: 'cl-1',
          direction: 'redo',
          eventVersion: 0,
        };
        mockItems.value = mockItems.value.map((item) => ({ ...item, isPacked: true }));
        return true;
      });
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();

      await wrapper.findComponent({ name: 'Topbar' }).vm.$emit('toggle');
      await wrapper.vm.$nextTick();
      expect(wrapper.get('[data-testid="overlay-sidebar"]').attributes('inert')).toBeUndefined();

      const completingRedo = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        cancelable: true,
      });
      window.dispatchEvent(completingRedo);
      await flushPromises();

      expect(completingRedo.defaultPrevented).toBe(true);
      expect(mockRedoPackingChange).toHaveBeenCalledOnce();
      expect(wrapper.getComponent({ name: 'PackingCompletionOverlay' }).props()).toMatchObject({
        checklistName: 'Trip A',
        endDate: '2025-12-02',
        startDate: '2025-12-01',
      });
      expect(wrapper.get('[data-testid="overlay-sidebar"]').attributes('inert')).toBe('true');

      await wrapper.findComponent({ name: 'PackingCompletionOverlay' }).vm.$emit('close');
      await flushPromises();
      expect(wrapper.get('[data-testid="overlay-sidebar"]').attributes('inert')).toBeUndefined();
      wrapper.unmount();

      mockItems.value = mockItems.value.map((item, index) => ({
        ...item,
        isPacked: index !== 0,
      }));
      mockRedoPackingChange.mockResolvedValueOnce(true);
      const guardedWrapper = createWrapper();
      await flushPromises();

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          shiftKey: true,
          cancelable: true,
        })
      );
      await flushPromises();

      expect(mockRedoPackingChange).toHaveBeenCalledTimes(2);
      expect(guardedWrapper.findComponent({ name: 'PackingCompletionOverlay' }).exists()).toBe(
        false
      );
    });

    // Should not show the journey for passive completed-state changes
    // Test Case 6: does not celebrate another checklist completing while redo is pending.
    it('does not celebrate another checklist completing while redo is pending', async () => {
      mockCanRedoPackingChange.value = true;
      let finish;
      mockRedoPackingChange.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const wrapper = createWrapper();
      await flushPromises();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, cancelable: true })
      );
      await flushPromises();
      mockItems.value = mockItems.value.map((item) => ({ ...item, isPacked: true }));
      mockLastPackingHistoryAction.value = {
        checklistId: 'cl-2',
        direction: 'redo',
        eventVersion: 0,
      };
      finish(true);
      await flushPromises();
      expect(wrapper.findComponent({ name: 'PackingCompletionOverlay' }).exists()).toBe(false);
    });

    // Test Case 7: keeps completed initialization and checklist switching silent.
    it('keeps completed initialization and checklist switching silent', async () => {
      mockItems.value = mockItems.value.map((item) => ({ ...item, isPacked: true }));
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.findComponent({ name: 'PackingCompletionOverlay' }).exists()).toBe(false);

      mockSelectedChecklistId.value = 'cl-2';
      mockCategories.value = [{ id: 'cat-2', name: 'Documents', checklistId: 'cl-2', order: 0 }];
      mockItems.value = [
        {
          id: 'item-3',
          name: 'Passport',
          categoryId: 'cat-2',
          isPacked: true,
          order: 0,
          quantity: 1,
        },
      ];
      await flushPromises();

      expect(wrapper.findComponent({ name: 'PackingCompletionOverlay' }).exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Responsive Behavior
  // ---------------------------------------------------------------------------

  describe('responsive behavior — checkScreenSize', () => {
    // Should detect mobile viewport
    // Test Case 8: should set isMobileViewport to true for narrow screens.
    it('should set isMobileViewport to true for narrow screens', async () => {
      setInnerWidth(375);
      const wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      // On mobile, Topbar should be rendered
      expect(wrapper.getComponent({ name: 'Topbar' }).props('title')).toBe('Trip A');
    });

    // Should hide sidebar on mobile
    // Test Case 9: should auto-collapse sidebar on mobile viewport.
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

    // Should auto-expand sidebar on wide desktop if not manually collapsed
    // Test Case 10: should auto-expand sidebar on wide desktop when not manually collapsed.
    it('should auto-expand sidebar on wide desktop when not manually collapsed', async () => {
      // localStorage returns null for collapsed key (not manually collapsed)
      setViewportWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      // Sidebar should exist and be visible (inline, not overlay)
      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      expect(sidebar.props('isMobile')).toBe(false);
    });

    // Should NOT auto-expand sidebar on desktop when manually collapsed key exists
    // Test Case 11: should not auto-expand sidebar when manually collapsed key exists after resize from mobile.
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

    // Should detect small desktop (overlay zone)
    // Test Case 12: should detect small desktop viewport as overlay zone.
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
    // Should toggle sidebar open/closed on Sidebar emit
    // Test Case 13: should toggle sidebar when sidebar emits toggle-sidebar.
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

    // Should persist sidebar collapse to localStorage on desktop
    // Test Case 14: should persist sidebar collapse to localStorage on desktop.
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

    // Should remove localStorage key when sidebar re-opened on desktop
    // Test Case 15: should remove collapsed key from localStorage when sidebar re-opened.
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

    // Should toggle sidebar from Topbar on mobile
    // Test Case 16: should toggle sidebar from Topbar on mobile.
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
    // Should open source selection from Sidebar without creating immediately
    // Test Case 17: should open source selection from Sidebar without creating immediately.
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

    // Should open source selection from Topbar on mobile
    // Test Case 18: should open source selection from Topbar on mobile.
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

    // handleChecklistEdit should select checklist and mark for edit
    // Test Case 19: should select and mark checklist for editing on handleChecklistEdit.
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

    // handleChecklistCopy should duplicate and select the new checklist
    // Test Case 20: should duplicate checklist and select the copy on handleChecklistCopy.
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

    // Test Case 21: deletes a checklist without a confirmation dialog.
    it('deletes a checklist without a confirmation dialog', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockDeleteChecklist.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('delete-checklist', 'cl-1');
      await wrapper.vm.$nextTick();

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockDeleteChecklist).toHaveBeenCalledWith('cl-1');
    });

    // Test Case 22: delegates a failed checklist deletion without confirmation.
    it('delegates a failed checklist deletion without confirmation', async () => {
      vi.spyOn(window, 'confirm');
      mockDeleteChecklist.mockResolvedValue(false);
      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();
      wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('delete-checklist', 'cl-1');
      await flushPromises();
      expect(mockDeleteChecklist).toHaveBeenCalledWith('cl-1');
      expect(window.confirm).not.toHaveBeenCalled();
    });

    // handleChecklistDelete should delegate selection recovery to the composable
    // Test Case 23: should delegate selected checklist deletion to the composable.
    it('should delegate selected checklist deletion to the composable', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockDeleteChecklist.mockResolvedValue(undefined);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'Sidebar' });
      await sidebar.vm.$emit('delete-checklist', 'cl-1');
      await wrapper.vm.$nextTick();

      expect(mockDeleteChecklist).toHaveBeenCalledWith('cl-1');
    });

    // handleChecklistUpdate should call updateChecklist
    // Test Case 24: should update checklist via ChecklistComponent emit.
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

      expect(mockUpdateChecklist).toHaveBeenCalledWith(updatedData, undefined);
    });

    // handleChecklistMove should call updateMultipleChecklists
    // Test Case 25: should call updateMultipleChecklists on handleChecklistMove.
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

      expect(mockUpdateMultipleChecklists).toHaveBeenCalledWith(reordered, undefined);
    });

    // Overlay sidebar should update selected checklist on select event
    // Test Case 26: should update selectedChecklistId from overlay sidebar select-checklist event.
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

    // Inline sidebar should update selected checklist on select event
    // Test Case 27: should update selectedChecklistId from inline sidebar select-checklist event.
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
    // handleItemCreate should create item with correct order
    // Test Case 28: should create item with maxOrder + 1 in the target category.
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

    // handleItemCreate should handle empty category
    // Test Case 29: should create item with order 0 in an empty category.
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

    // handleItemUpdate should update item and clear newly created flag
    // Test Case 30: should update item and clear newlyCreatedItemId if matching.
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

      expect(mockUpdateItem).toHaveBeenCalledWith(updatedItem, undefined);
    });

    // handleItemCopy should call duplicateItem
    // Test Case 31: should call duplicateItem on copy:item emit.
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

    // handleItemDelete should call deleteItem
    // Test Case 32: should call deleteItem on delete:item emit.
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
    // Should handle cross-category item move
    // Test Case 33: should batch all source and target item updates on move type.
    it('should batch all source and target item updates on move type', async () => {
      mockUpdateMultipleItems.mockResolvedValue([]);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const moveData = {
        type: 'move',
        items: [
          { id: 'item-1', name: 'Shirt', categoryId: 'cat-2', order: 0 },
          { id: 'item-3', name: 'Socks', categoryId: 'cat-2', order: 1 },
        ],
      };

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('move:item', moveData);
      await flushPromises();

      expect(mockUpdateMultipleItems).toHaveBeenCalledOnce();
      expect(mockUpdateMultipleItems).toHaveBeenCalledWith(moveData.items, {
        fields: ['order', 'categoryId'],
        expectedItems: moveData.expectedItems,
      });
    });

    // Should handle same-category reorder
    // Test Case 34: should update all items with new order on reorder type.
    it('should update all items with new order on reorder type', async () => {
      mockUpdateMultipleItems.mockResolvedValue([]);

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

      expect(mockUpdateMultipleItems).toHaveBeenCalledOnce();
      expect(mockUpdateMultipleItems).toHaveBeenCalledWith(moveData.items, {
        fields: ['order', 'categoryId'],
        expectedItems: moveData.expectedItems,
      });
    });

    // Should ignore incomplete move payloads
    // Test Case 35: should ignore a move payload without item updates.
    it('should ignore a move payload without item updates', async () => {
      mockUpdateMultipleItems.mockResolvedValue([]);

      setInnerWidth(1280);
      const wrapper = createWrapper();
      dispatchResize();
      await wrapper.vm.$nextTick();

      const moveData = {
        type: 'move',
        items: [],
      };

      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      await checklist.vm.$emit('move:item', moveData);
      await flushPromises();

      expect(mockUpdateMultipleItems).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 7: Category Handlers
  // ---------------------------------------------------------------------------

  describe('category handlers', () => {
    // handleCategoryCreate should create with maxOrder + 1
    // Test Case 36: should create category with correct order.
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

    // handleCategoryUpdate should call updateCategory
    // Test Case 37: should update category and clear newlyCreatedCategoryId if matching.
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

      expect(mockUpdateCategory).toHaveBeenCalledWith(
        { id: 'cat-new', name: 'Renamed' },
        undefined
      );
    });

    // handleCategoryCopy should call duplicateCategory
    // Test Case 38: should call duplicateCategory on copy:category emit.
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

    // handleCategoryDelete should call deleteCategory
    // Test Case 39: should call deleteCategory on delete:category emit.
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
    // Should update all categories and refresh
    // Test Case 40: should submit all categories in one operation.
    it('should submit all categories in one operation', async () => {
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

      expect(mockUpdateMultipleCategories).toHaveBeenCalledWith(reordered, undefined);
      expect(mockUpdateCategory).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 9: Overlay Behavior
  // ---------------------------------------------------------------------------

  describe('overlay and body scroll lock', () => {
    // Should show overlay on mobile when sidebar is open
    // Test Case 41: should display overlay backdrop when sidebar is open on mobile.
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

    // Should close sidebar when overlay is clicked
    // Test Case 42: should close sidebar when overlay backdrop is clicked.
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

    // Should lock body scroll when overlay is active
    // Test Case 43: should set body overflow hidden when overlay is active.
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

    // Should compensate and restore body padding around an overlay lock
    // Test Case 44: should preserve the existing right padding while compensating for a hidden scrollbar.
    it('should preserve the existing right padding while compensating for a hidden scrollbar', async () => {
      const originalClientWidth = Object.getOwnPropertyDescriptor(
        document.documentElement,
        'clientWidth'
      );
      const originalPaddingRight = document.body.style.paddingRight;

      try {
        Object.defineProperty(document.documentElement, 'clientWidth', {
          configurable: true,
          value: 360,
        });
        document.body.style.paddingRight = '12px';
        setInnerWidth(375);
        const wrapper = createWrapper();
        await flushPromises();
        await wrapper.vm.$nextTick();

        await wrapper.findComponent({ name: 'Topbar' }).vm.$emit('toggle');
        await wrapper.vm.$nextTick();

        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.style.paddingRight).toBe('27px');

        await wrapper.findComponent({ name: 'Topbar' }).vm.$emit('toggle');
        await wrapper.vm.$nextTick();

        expect(document.body.style.overflow).toBe('');
        expect(document.body.style.paddingRight).toBe('12px');
      } finally {
        document.body.style.paddingRight = originalPaddingRight;
        if (originalClientWidth) {
          Object.defineProperty(document.documentElement, 'clientWidth', originalClientWidth);
        } else {
          delete document.documentElement.clientWidth;
        }
      }
    });

    // Should lock body scroll on small desktop overlay
    // Test Case 45: should set body overflow hidden when sidebar opens on small desktop.
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
    // Should call initialize on mount
    // Test Case 46: should call initialize on mount.
    it('should call initialize on mount', () => {
      setInnerWidth(1280);
      createWrapper();
      expect(mockInitialize).toHaveBeenCalledWith();
    });

    // Should remove resize listener on unmount
    // Test Case 47: should clean up resize event listener on unmount.
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
    // Should open an isolated editor without creating a checklist
    // Test Case 48: should open an isolated editor without creating a checklist.
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

    // Should save only through the templates composable
    // Test Case 49: should save only through the templates composable.
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

      expect(mockUpdateTemplate).toHaveBeenCalledWith(template, template);
      expect(mockUpdateChecklist).not.toHaveBeenCalled();
      expect(mockCreateChecklist).not.toHaveBeenCalled();
    });

    // Should save a selected checklist through the named template dialog
    // Test Case 50: opens the named template dialog and saves its selected checklist.
    it('opens the named template dialog and saves its selected checklist', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'cl-1');
      await wrapper.vm.$nextTick();
      await wrapper.findComponent({ name: 'SaveTemplateDialog' }).vm.$emit('save', 'Trip Template');

      expect(mockSaveAsTemplate).toHaveBeenCalledWith('cl-1', 'Trip Template');
    });

    // Preserve the template dialog until retry succeeds.
    // Test Case 51: keeps the template dialog open after failure and closes after retry succeeds.
    it('keeps the template dialog open after failure and closes after retry succeeds', async () => {
      mockSaveAsTemplate.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'template-1' });
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'cl-1');
      const dialog = wrapper.findComponent({ name: 'SaveTemplateDialog' });

      dialog.vm.$emit('save', 'My draft');
      await flushPromises();
      expect(mockSaveAsTemplate).toHaveBeenCalledTimes(1);
      expect(dialog.props('visible')).toBe(true);
      expect(wrapper.findComponent({ name: 'SaveTemplateDialog' }).props('saveError')).toBe(true);
      wrapper.findComponent({ name: 'SaveTemplateDialog' }).vm.$emit('save', 'My draft');
      await flushPromises();
      expect(mockSaveAsTemplate).toHaveBeenLastCalledWith('cl-1', 'My draft');
      expect(wrapper.findComponent({ name: 'SaveTemplateDialog' }).props('visible')).toBe(false);
    });

    // Should create a checklist from a selected personal template
    // Test Case 52: creates a checklist from a selected personal template.
    it('creates a checklist from a selected personal template', async () => {
      const longTemplateName = 'W'.repeat(100);
      mockTemplates.value = [
        { id: 'template-1', name: longTemplateName, order: 0, categories: [], items: [] },
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

      expect(mockApplyTemplate).not.toHaveBeenCalled();
      expect(mockCreateChecklist).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^checklist-/),
          name: expect.stringMatching(/^New Checklist \(W+\)$/),
        }),
        expect.objectContaining({
          source: 'template',
          templateId: 'template-1',
          expectedTemplate: mockTemplates.value[0],
        })
      );
      expect(mockCreateChecklist.mock.calls[0][0].name).toHaveLength(100);
    });

    // Should delete the active template and leave the editor
    // Test Case 53: deletes the active template and leaves the editor.
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
      await flushPromises();

      expect(mockDeleteTemplate).toHaveBeenCalledWith(template.id);
      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(false);
    });

    // Should create an explicitly empty checklist
    // Test Case 54: creates an explicitly empty checklist.
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
        expect.objectContaining({ name: 'New Checklist (Empty)', order: 2 }),
        { source: 'empty' }
      );
    });

    // Should handle a failed template creation and ignore missing sources
    // Test Case 55: handles failed template creation and ignores missing sources.
    it('handles failed template creation and ignores missing sources', async () => {
      mockTemplates.value = [{ id: 'template-1', name: 'Weekend', categories: [], items: [] }];
      mockCreateChecklist.mockResolvedValue(null);
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'template', templateId: 'template-1' });

      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'template', templateId: 'missing-template' });
      await wrapper
        .findComponent({ name: 'NewChecklistDialog' })
        .vm.$emit('select', { source: 'recommended', recommendedListId: 'missing-list' });

      expect(mockCreateChecklist).toHaveBeenCalledTimes(1);
      expect(mockApplyTemplate).not.toHaveBeenCalled();
    });

    // Preserve the checklist source selection until retry succeeds.
    // Test Case 56: keeps checklist source selection open after a failed creation and closes on retry.
    it('keeps checklist source selection open after a failed creation and closes on retry', async () => {
      mockCreateChecklist.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'cl-retry' });
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('create-checklist');
      const dialog = wrapper.findComponent({ name: 'NewChecklistDialog' });

      dialog.vm.$emit('select', { source: 'empty' });
      await flushPromises();
      expect(mockCreateChecklist).toHaveBeenCalledTimes(1);
      expect(dialog.props('visible')).toBe(true);
      expect(wrapper.findComponent({ name: 'NewChecklistDialog' }).props('saveError')).toBe(true);
      wrapper.findComponent({ name: 'NewChecklistDialog' }).vm.$emit('select', { source: 'empty' });
      await flushPromises();
      expect(wrapper.findComponent({ name: 'NewChecklistDialog' }).props('visible')).toBe(false);
      expect(mockCreateChecklist).toHaveBeenCalledTimes(2);
    });

    // Should ignore requests to edit a missing template
    // Test Case 57: ignores requests to edit a missing template.
    it('ignores requests to edit a missing template', async () => {
      mockTemplates.value = [];
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', 'missing');

      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(false);
    });

    // Should keep the editor open when saving a template fails
    // Test Case 58: keeps the editor open when saving a template fails.
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

    // Should discard a template draft when editing is canceled
    // Test Case 59: discards a template draft when editing is canceled.
    it('discards a template draft when editing is canceled', async () => {
      const template = { id: 'template-1', name: 'Weekend', categories: [], items: [] };
      mockTemplates.value = [template];
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', template.id);
      await wrapper.vm.$nextTick();

      await wrapper.findComponent({ name: 'TemplateEditor' }).vm.$emit('cancel');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(false);
      expect(mockUpdateTemplate).not.toHaveBeenCalled();
    });

    // Should preserve a template when deletion is canceled
    // Test Case 60: preserves a template when deletion is canceled.
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

    // Should close both template dialogs without performing an operation
    // Test Case 61: closes both template dialogs without performing an operation.
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

    // Should leave checklist state unchanged when empty creation fails
    // Test Case 62: leaves checklist state unchanged when empty creation fails.
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

    // Should keep the editor open when template deletion fails
    // Test Case 63: keeps the editor open when template deletion fails.
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

    // Should use an empty initial name for an unknown checklist
    // Test Case 64: uses an empty initial name for an unknown checklist.
    it('uses an empty initial name for an unknown checklist', async () => {
      setInnerWidth(1280);
      const wrapper = createWrapper();

      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'missing');

      expect(wrapper.findComponent({ name: 'SaveTemplateDialog' }).props('initialName')).toBe('');
    });

    // Should ignore duplicate template save events after source state is cleared
    // Test Case 65: ignores duplicate template save events after source state is cleared.
    it('ignores duplicate template save events after source state is cleared', async () => {
      mockSaveAsTemplate.mockResolvedValue({ id: 'template-1' });
      setInnerWidth(1280);
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('save-as-template', 'cl-1');
      const dialog = wrapper.findComponent({ name: 'SaveTemplateDialog' });

      await dialog.vm.$emit('save', 'Trip Template');
      await flushPromises();
      await dialog.vm.$emit('save', 'Trip Template');

      expect(mockSaveAsTemplate).toHaveBeenCalledTimes(1);
    });

    // Should create a checklist from a selected recommended list
    // Test Case 66: creates a checklist from a selected recommended list.
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
        expect.objectContaining({
          id: expect.stringMatching(/^checklist-/),
          name: 'New Checklist (General Travel)',
        }),
        { source: 'recommended', seedData }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 14: Packing Undo
  // ---------------------------------------------------------------------------

  describe('packing undo', () => {
    // Test Case 67: does not replace a newer barrier with an earlier delayed undo result.
    it('does not replace a newer barrier with an earlier delayed undo result', async () => {
      mockCanUndoPackingChange.value = true;
      let finish;
      mockUndoPackingChange.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const wrapper = createWrapper();
      await flushPromises();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true })
      );
      await flushPromises();
      mockLastPackingHistoryAction.value = {
        checklistId: 'cl-1',
        direction: 'undo',
        eventVersion: 0,
      };
      mockSelectedChecklistId.value = 'cl-2';
      mockHistoryBarrierVersion.value = 1;
      mockHistoryEventVersion.value = 1;
      await wrapper.vm.$nextTick();
      finish(true);
      await flushPromises();
      expect(wrapper.find('[data-testid="history-barrier-feedback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="cross-checklist-history-feedback"]').exists()).toBe(false);
    });

    // Test Case 68: does not show an outdated batch toast after that batch was undone.
    it('does not show an outdated batch toast after that batch was undone', async () => {
      mockCanUndoPackingChange.value = true;
      let finish;
      mockSetCategoryPacked.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const wrapper = createWrapper();
      await flushPromises();
      wrapper
        .findComponent({ name: 'ChecklistComponent' })
        .vm.$emit('set-category-packed', { categoryId: 'cat-1', isPacked: true });
      mockHistoryEventVersion.value = 2;
      mockGetPackingBatchEventVersion.mockReturnValueOnce(1);
      finish([{ id: 'item-1', isPacked: true }]);
      await flushPromises();
      expect(wrapper.find('[data-testid="packing-undo-toast"]').exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'PackingCompletionOverlay' }).exists()).toBe(false);
    });

    // Test Case 69: does not route global undo into the checklist while a template editor is open.
    it('does not route global undo into the checklist while a template editor is open', async () => {
      mockCanUndoPackingChange.value = true;
      mockTemplates.value = [
        { id: 'template-1', name: 'Weekend', order: 0, categories: [], items: [] },
      ];
      const wrapper = createWrapper();
      await wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('edit-template', 'template-1');
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(true);
      const key = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true });
      window.dispatchEvent(key);
      expect(key.defaultPrevented).toBe(false);
      expect(mockUndoPackingChange).not.toHaveBeenCalled();
      expect(wrapper.findComponent({ name: 'TemplateEditor' }).exists()).toBe(true);
    });

    // Test Case 70: does not undo the underlying item when its inline edit failed to save.
    it('does not undo the underlying item when its inline edit failed to save', async () => {
      mockCanUndoPackingChange.value = true;
      mockUpdateItem.mockResolvedValue(null);
      const wrapper = createWrapper();
      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      const original = {
        id: 'item-1',
        name: 'Hat',
        categoryId: 'cat-1',
        checklistId: 'cl-1',
        quantity: 1,
        order: 0,
        isPacked: false,
        isPending: false,
      };
      const save = checklist.props('saveItemEdit');
      expect(await save({ ...original, name: 'Unsaved draft' }, original)).toBeNull();
      await checklist.vm.$emit('copy:item', 'different-item');
      await flushPromises();
      let finish;
      mockUpdateItem.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const retry = save({ ...original, name: 'Unsaved draft' }, original);
      const key = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true });
      window.dispatchEvent(key);
      expect(key.defaultPrevented).toBe(false);
      expect(mockUndoPackingChange).not.toHaveBeenCalled();
      expect(checklist.exists()).toBe(true);
      finish({ ...original, name: 'Unsaved draft' });
      await retry;
      const afterSave = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true });
      window.dispatchEvent(afterSave);
      expect(afterSave.defaultPrevented).toBe(true);
      await flushPromises();
      expect(mockUndoPackingChange).toHaveBeenCalledOnce();
    });

    // Test Case 71: keeps draft owners independent when another editor is displaced during a save.
    it('keeps draft owners independent when another editor is displaced during a save', async () => {
      mockCanUndoPackingChange.value = true;
      let finish;
      mockUpdateItem.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const wrapper = createWrapper();
      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      const item = {
        id: 'item-1',
        name: 'Hat',
        categoryId: 'cat-1',
        checklistId: 'cl-1',
        quantity: 1,
        order: 0,
        isPacked: false,
        isPending: false,
      };
      const pending = checklist.props('saveItemEdit')({ ...item, name: 'Cap' }, item);
      checklist.props('retainDraft')({ name: 'Other displaced draft' });
      checklist.props('editCancelled')('item', 'item-2');
      finish({ ...item, name: 'Cap' });
      await pending;
      const key = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true });
      window.dispatchEvent(key);
      expect(key.defaultPrevented).toBe(true);
      await flushPromises();
      expect(mockUndoPackingChange).toHaveBeenCalledOnce();
    });

    // Test Case 72: keeps history blocked after a save until the editor actually closes.
    it('keeps history blocked after a save until the editor actually closes', async () => {
      mockCanUndoPackingChange.value = true;
      const wrapper = createWrapper();
      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      const item = {
        id: 'item-1',
        name: 'Hat',
        categoryId: 'cat-1',
        checklistId: 'cl-1',
        quantity: 1,
        order: 0,
        isPacked: false,
        isPending: false,
      };
      checklist.props('editStarted')('item', item.id);
      mockUpdateItem.mockResolvedValueOnce({ ...item, name: 'Cap' });
      await checklist.props('saveItemEdit')({ ...item, name: 'Cap' }, item);
      const duringEdit = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        cancelable: true,
      });
      window.dispatchEvent(duringEdit);
      expect(duringEdit.defaultPrevented).toBe(false);
      expect(mockUndoPackingChange).not.toHaveBeenCalled();
      checklist.props('editCancelled')('item', item.id);
      const afterEdit = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true });
      window.dispatchEvent(afterEdit);
      expect(afterEdit.defaultPrevented).toBe(true);
      await flushPromises();
      expect(mockUndoPackingChange).toHaveBeenCalledOnce();
    });

    // Test Case 73: does not dismiss a newer barrier after a delayed redo finishes.
    it('does not dismiss a newer barrier after a delayed redo finishes', async () => {
      setInnerWidth(1280);
      mockCanRedoPackingChange.value = true;
      let finish;
      mockRedoPackingChange.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const wrapper = createWrapper();
      await flushPromises();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, cancelable: true })
      );
      await flushPromises();
      mockLastPackingHistoryAction.value = {
        checklistId: 'cl-1',
        direction: 'redo',
        eventVersion: 0,
      };
      mockHistoryEventVersion.value = 1;
      mockHistoryBarrierVersion.value = 1;
      await wrapper.vm.$nextTick();
      finish(true);
      await flushPromises();
      expect(wrapper.find('[data-testid="history-barrier-feedback"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="history-result"]').exists()).toBe(false);
    });

    // Test Case 74: replaces the success notice with a subsequent external history barrier.
    it('replaces the success notice with a subsequent external history barrier', async () => {
      setInnerWidth(1280);
      mockCanUndoPackingChange.value = true;
      mockUndoPackingChange.mockImplementation(async () => {
        mockLastPackingHistoryAction.value = {
          checklistId: 'cl-1',
          direction: 'undo',
          eventVersion: mockHistoryEventVersion.value,
        };
        return true;
      });
      const wrapper = createWrapper();
      await flushPromises();
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true })
      );
      await flushPromises();
      expect(wrapper.find('[data-testid="history-result"]').exists()).toBe(true);
      mockHistoryBarrierVersion.value += 1;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="history-result"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="history-barrier-feedback"]').exists()).toBe(true);
    });

    // Test Case 75: replaces an older history barrier when a later undo succeeds.
    it('replaces an older history barrier when a later undo succeeds', async () => {
      setInnerWidth(1280);
      mockCanUndoPackingChange.value = true;
      mockUndoPackingChange.mockImplementation(async () => {
        mockLastPackingHistoryAction.value = {
          checklistId: 'cl-1',
          direction: 'undo',
          eventVersion: mockHistoryEventVersion.value,
        };
        return true;
      });
      const wrapper = createWrapper();
      await flushPromises();
      mockHistoryBarrierVersion.value += 1;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="history-barrier-feedback"]').exists()).toBe(true);
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true })
      );
      await flushPromises();
      expect(wrapper.find('[data-testid="history-barrier-feedback"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="history-result"]').exists()).toBe(true);
    });

    // Test Case 76: waits for a button history action before running the next keyboard shortcut.
    it('waits for a button history action before running the next keyboard shortcut', async () => {
      mockCanUndoPackingChange.value = true;
      let finish;
      mockUndoPackingChange
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finish = resolve;
            })
        )
        .mockResolvedValueOnce(true);
      const wrapper = createWrapper();
      await flushPromises();
      wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('undo');
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true })
      );
      await flushPromises();
      expect(mockUndoPackingChange).toHaveBeenCalledTimes(1);
      finish(true);
      await flushPromises();
      expect(mockUndoPackingChange).toHaveBeenCalledTimes(2);
    });

    // Test Case 77: waits for a pending item update before a toolbar undo.
    it('waits for a pending item update before a toolbar undo', async () => {
      mockCanUndoPackingChange.value = true;
      let finish;
      mockUpdateItem.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const wrapper = createWrapper();
      await flushPromises();
      wrapper
        .findComponent({ name: 'ChecklistComponent' })
        .vm.$emit('update:item', { id: 'item-1', name: 'Updated' });
      wrapper.findComponent({ name: 'Sidebar' }).vm.$emit('undo');
      await flushPromises();
      expect(mockUndoPackingChange).not.toHaveBeenCalled();
      finish({ id: 'item-1', name: 'Updated' });
      await flushPromises();
      expect(mockUndoPackingChange).toHaveBeenCalledTimes(1);
    });

    // Test Case 78: explains when a newer action interrupts a queued shortcut.
    it('explains when a newer action interrupts a queued shortcut', async () => {
      setInnerWidth(1280);
      mockCanUndoPackingChange.value = true;
      let finish;
      mockUpdateItem
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finish = resolve;
            })
        )
        .mockResolvedValueOnce(null);
      const wrapper = createWrapper();
      await flushPromises();
      const checklist = wrapper.findComponent({ name: 'ChecklistComponent' });
      checklist.vm.$emit('update:item', { id: 'item-1', name: 'First' });
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true })
      );
      checklist.vm.$emit('update:item', { id: 'item-1', name: 'Second' });
      finish({ id: 'item-1', name: 'First' });
      await flushPromises();
      expect(mockUndoPackingChange).not.toHaveBeenCalled();
      expect(wrapper.get('[data-testid="history-result"]').text()).toContain('history.interrupted');
    });

    // Test Case 79: announces and dismisses a history barrier.
    it('announces and dismisses a history barrier', async () => {
      const wrapper = createWrapper();
      mockHistoryBarrierVersion.value += 1;
      await wrapper.vm.$nextTick();
      const notice = wrapper
        .findAll('[role="status"]')
        .find((node) => node.text().includes('storage.historyClearedByChange'));
      expect(notice).toBeDefined();
      await notice.get('button').trigger('click');
      expect(wrapper.text()).not.toContain('storage.historyClearedByChange');
    });

    // Category packing changes do not produce a contextual Undo notice.
    // Test Case 80: applies a category packing change without a contextual undo notice.
    it('applies a category packing change without a contextual undo notice', async () => {
      mockSetCategoryPacked.mockResolvedValue([{ id: 'item-1', isPacked: true }]);
      mockCanUndoPackingChange.value = true;
      const wrapper = createWrapper();
      await wrapper
        .findComponent({ name: 'ChecklistComponent' })
        .vm.$emit('set-category-packed', { categoryId: 'cat-1', isPacked: true });
      await flushPromises();
      expect(mockSetCategoryPacked).toHaveBeenCalledWith('cat-1', true);
      expect(wrapper.find('[data-testid="packing-undo-toast"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="history-result"]').exists()).toBe(false);
    });

    // Should preserve native undo inside an input
    // Test Case 81: should use Ctrl+Z for packing undo but preserve input-native undo.
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
