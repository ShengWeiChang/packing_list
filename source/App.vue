<template>
  <div
    :class="[
      'min-h-screen text-slate-800',
      isMobile ? 'flex flex-col' : 'flex'
    ]"
  >
    <!-- Overlay for narrow screens when sidebar is open -->
    <div
      v-if="(isMobile || (isNarrow && isSidebarExpanded)) && isSidebarExpanded"
      class="fixed inset-0 bg-black bg-opacity-40 z-40 backdrop-blur-sm"
      @click="toggleSidebar"
    ></div>

    <!-- Mobile Topbar -->
    <Topbar
      v-if="isMobile"
      :title="selectedChecklist ? selectedChecklist.destination : 'Packing List'"
      @toggle="toggleSidebar"
      @new="showAddChecklistModal = true"
    />

    <!-- Sidebar -->
    <!-- Overlay Sidebar (Mobile or Narrow + Expanded) -->
    <teleport to="body" v-if="isOverlayVisible">
      <div class="fixed inset-y-0 left-0 z-50">
        <Sidebar
          :is-expanded="isSidebarExpanded"
          :is-mobile="isMobile"
          :is-narrow="isNarrow"
          :checklists="checklists"
          :selected-checklist-id="selectedChecklistId"
          @toggle-sidebar="toggleSidebar"
          @new-checklist="showAddChecklistModal = true"
          @select-checklist="selectedChecklistId = $event"
          @edit-checklist="handleEditChecklist"
          @delete-checklist="handleDeleteChecklist"
        />
      </div>
    </teleport>

    <!-- Inline Sidebar (Desktop only, when not in overlay mode) -->
    <div v-else-if="!isMobile" class="relative z-50">
      <Sidebar
        :is-expanded="isSidebarExpanded"
        :is-mobile="isMobile"
        :is-narrow="isNarrow"
        :checklists="checklists"
        :selected-checklist-id="selectedChecklistId"
        @toggle-sidebar="toggleSidebar"
        @new-checklist="showAddChecklistModal = true"
        @select-checklist="selectedChecklistId = $event"
        @edit-checklist="handleEditChecklist"
        @delete-checklist="handleDeleteChecklist"
      />
    </div>

    <!-- Main Content -->
    <main
      :class="[
        'p-4 md:p-6 overflow-y-auto bg-gray-50 min-w-0 transition-filter duration-200',
        isMobile ? 'flex-1' : 'flex-1',
        { 'filter blur-sm pointer-events-none': (isSidebarExpanded && (isMobile || isNarrow)) }
      ]"
    >
      <div v-if="selectedChecklist">
        <ChecklistComponent
          :checklist="selectedChecklist"
          :categories="categories"
          :items="items"
          :newly-created-item-id="newlyCreatedItemId"
          @edit-checklist="showEditChecklistModal = true"
          @update:item="handleItemUpdate"
          @delete:item="handleItemDelete"
          @create:item="handleCreateItemClick"
          @update:category="handleCategoryUpdate"
          @delete:category="handleCategoryDelete"
          @create:category="handleCreateCategoryClick"
        />
      </div>

      <div v-else class="text-center text-secondary mt-20">
        Please create a checklist first.
      </div>
    </main>

    <!-- Add/Edit Checklist Modal -->
    <Teleport to="body">
      <ChecklistForm
        v-if="showAddChecklistModal || showEditChecklistModal"
        :checklist="showEditChecklistModal ? selectedChecklist : null"
        :is-editing="showEditChecklistModal"
        @submit="handleChecklistSubmit"
        @close="closeChecklistModal"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import ChecklistComponent from './components/Checklist.vue';
import ChecklistForm from './components/ChecklistForm.vue';
import Sidebar from './components/Sidebar.vue';
import Topbar from './components/Topbar.vue';
import { usePackingLists } from './composables/usePackingLists';

// Local key for remembering manual sidebar collapse on desktop.
// Kept local because only App.vue uses this preference.
const SIDEBAR_COLLAPSED_KEY = 'sidebar-manually-collapsed';

// Initialize composable
const {
  checklists,
  categories,
  items,
  selectedChecklistId,
  selectedChecklist,
  initialize,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem
} = usePackingLists();

// Responsive breakpoints
const BREAKPOINTS = {
  MOBILE: 768, // md breakpoint
  SIDEBAR_OVERLAY: 900 // width under which sidebar becomes overlay
};

// UI State
const isSidebarExpanded = ref(true);
const isMobile = ref(false);
const isNarrow = ref(false);
const showAddChecklistModal = ref(false);
const showEditChecklistModal = ref(false);
const newlyCreatedItemId = ref(null);

// Computed properties for template logic
const isOverlayVisible = computed(() =>
  (isMobile.value || (isNarrow.value && isSidebarExpanded.value)) && isSidebarExpanded.value
);

// Generic error handler
const handleAsyncAction = async (action, ...args) => {
  try {
    return await action(...args);
  } catch (err) {
    // Error is already handled by useCheckList, just propagate if needed
    throw err;
  }
};

// Check if screen is mobile size
function checkScreenSize() {
  isMobile.value = window.innerWidth < BREAKPOINTS.MOBILE;
  isNarrow.value = window.innerWidth < BREAKPOINTS.SIDEBAR_OVERLAY;

  // Auto-collapse sidebar on small screens
  if (isMobile.value || isNarrow.value) {
    isSidebarExpanded.value = false;
  } else {
    // Auto-expand on desktop if not manually collapsed
    if (!localStorage.getItem(SIDEBAR_COLLAPSED_KEY)) {
      isSidebarExpanded.value = true;
    }
  }
}

// Handle window resize
function handleResize() {
  checkScreenSize();
}

// Methods
function toggleSidebar() {
  isSidebarExpanded.value = !isSidebarExpanded.value;

  // Remember manual toggle on desktop
    if (!isMobile.value) {
    if (isSidebarExpanded.value) {
      localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
    } else {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
    }
  }
}

function closeChecklistModal() {
  showAddChecklistModal.value = false;
  showEditChecklistModal.value = false;
}

async function handleCreateItemClick(categoryId) {
  const newItemData = {
    name: 'New Item',
    quantity: 1,
    categoryId: categoryId,
    isPacked: false
  };

  const newItem = await handleAsyncAction(createItem, newItemData);
  if (newItem) {
    newlyCreatedItemId.value = newItem.id;
  }
}

async function handleCreateCategoryClick() {
  const newCategoryData = {
    name: 'New Category'
  };

  await handleAsyncAction(createCategory, newCategoryData);
}

async function handleCategoryUpdate(category) {
  await handleAsyncAction(updateCategory, category);
}

async function handleCategoryDelete(categoryId) {
  await handleAsyncAction(deleteCategory, categoryId);
}

async function handleChecklistSubmit(formData) {
  if (showEditChecklistModal.value) {
    await handleAsyncAction(updateChecklist, {
      ...selectedChecklist.value,
      ...formData
    });
  } else {
    const newChecklist = await handleAsyncAction(createChecklist, formData);
    if (newChecklist) {
      selectedChecklistId.value = newChecklist.id;
    }
  }
  closeChecklistModal();
}

async function handleEditChecklist(checklistId) {
  selectedChecklistId.value = checklistId;
  showEditChecklistModal.value = true;
}

async function handleDeleteChecklist(checklistId) {
  await handleAsyncAction(deleteChecklist, checklistId);
  // If the deleted checklist was selected, clear selection
  if (selectedChecklistId.value === checklistId) {
    selectedChecklistId.value = null;
  }
}

async function handleItemUpdate(item) {
  await handleAsyncAction(updateItem, item);

  // Clear the newly created flag if this was the item being edited
  if (newlyCreatedItemId.value === item.id) {
    newlyCreatedItemId.value = null;
  }
}

async function handleItemDelete(itemId) {
  await handleAsyncAction(deleteItem, itemId);
}

// Lifecycle hooks
onMounted(async () => {
  await initialize();

  // Set up responsive behavior
  checkScreenSize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Prevent layout shift caused by scrollbar/body resizing when overlay drawer is active
watch([isSidebarExpanded, isMobile, isNarrow], () => {
  const overlayActive = isSidebarExpanded.value && (isMobile.value || (isNarrow.value && isSidebarExpanded.value));
  if (overlayActive) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style>
.backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
