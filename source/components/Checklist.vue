<!--
================================================================================
File: source/components/Checklist.vue
Description: Checklist component - displays a checklist with categories and items
             for a specific travel destination.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div>
    <!-- Checklist Header -->
    <div class="mb-2 p-4">
      <!-- Header content -->
      <div class="mb-4 flex min-h-[4rem] items-center justify-between gap-4">
        <div class="flex min-w-0 flex-grow items-baseline space-x-4">
          <!-- Editable destination name -->
          <div
            class="flex min-h-[3rem] min-w-0 flex-grow items-center"
            @blur="handleEditBlur"
            @focusout="handleEditBlur"
          >
            <input
              v-if="isEditing"
              :id="`checklist-${checklist.id}-destination`"
              ref="destinationInput"
              v-model="editedDestination"
              :name="`checklist-${checklist.id}-destination`"
              :placeholder="$t('checklist.destination')"
              class="text-primary w-full min-w-0 border-b-2 border-blue-300 bg-transparent text-2xl font-bold focus:border-blue-500 focus:outline-none md:text-3xl"
              @keyup.enter="saveEdit"
              @keyup.escape="cancelEdit"
            />
            <h2
              v-else
              class="text-primary cursor-pointer truncate rounded px-1 py-1 text-2xl font-bold hover:bg-gray-50 md:text-3xl"
              @click="startEdit"
            >
              {{ checklist.destination || $t('checklist.untitled') }}
            </h2>
          </div>

          <!-- Editable dates -->
          <div
            class="flex min-h-[2.5rem] flex-shrink-0 items-center space-x-2"
            @blur="handleEditBlur"
            @focusout="handleEditBlur"
          >
            <div
              v-if="isEditing"
              class="flex flex-wrap items-center space-x-1 sm:flex-nowrap sm:space-x-2"
            >
              <input
                :id="`checklist-${checklist.id}-start-date`"
                ref="startDateInput"
                v-model="editedStartDate"
                :name="`checklist-${checklist.id}-start-date`"
                type="date"
                class="text-secondary w-28 rounded border border-gray-300 bg-transparent px-1 py-1 text-sm focus:border-blue-500 focus:outline-none sm:w-auto sm:px-2 sm:text-base"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
              <span class="text-secondary hidden sm:inline">-</span>
              <input
                :id="`checklist-${checklist.id}-end-date`"
                ref="endDateInput"
                v-model="editedEndDate"
                :name="`checklist-${checklist.id}-end-date`"
                type="date"
                :min="editedStartDate"
                class="text-secondary w-28 rounded border border-gray-300 bg-transparent px-1 py-1 text-sm focus:border-blue-500 focus:outline-none sm:w-auto sm:px-2 sm:text-base"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
              />
            </div>
            <span
              v-else
              class="text-secondary cursor-pointer rounded px-2 py-1 text-base hover:bg-gray-50"
              @click="startEdit"
            >
              {{ formatDateRange(checklist.startDate, checklist.endDate) }}
            </span>
          </div>
        </div>

        <!-- Overflow menu -->
        <div class="flex-shrink-0">
          <OverflowMenu
            :item-id="checklist.id"
            :force-visible="true"
            :use-group-hover="false"
            menu-type="checklist"
            alignment="left"
            class="ml-2"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>
      </div>

      <!-- Progress bar -->
      <ProgressBar
        :total="items.length"
        :completed="items.filter((item) => item.isPacked).length"
      />
    </div>

    <!-- Categories Grid -->
    <div>
      <draggable
        v-model="draggableCategories"
        item-key="id"
        :group="{
          name: 'categories',
          pull: true,
          put: function (to, from, dragEl, evt) {
            // Only allow categories to be dropped in the category container
            return from.options.group.name === 'categories';
          },
        }"
        :animation="200"
        :ghost-class="'ghost-category'"
        :chosen-class="'chosen-category'"
        :drag-class="'drag-category'"
        :class="['categories-masonry', isDraggingCategory ? 'dragging' : '']"
        @start="onCategoryDragStart"
        @end="onCategoryDragEnd"
        @update="onCategoryUpdate"
      >
        <template #item="{ element: category }">
          <div class="category-item">
            <Category
              :key="category.id"
              :data-category-id="category.id"
              :category="category"
              :items="items"
              :newly-created-item-id="newlyCreatedItemId"
              :newly-created-category-id="newlyCreatedCategoryId"
              @update:item="$emit('update:item', $event)"
              @delete:item="$emit('delete:item', $event)"
              @create:item="$emit('create:item', $event)"
              @update:category="$emit('update:category', $event)"
              @delete:category="$emit('delete:category', $event)"
              @move:item="handleItemMove"
            />
          </div>
        </template>
      </draggable>

      <div class="category-item">
        <AddCategoryButton @click="$emit('create:category')" />
      </div>
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';

import AddCategoryButton from './AddCategoryButton.vue';
import Category from './Category.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';

// ------------------------------------------------------------------------------
// Internationalization (i18n)
// ------------------------------------------------------------------------------

const { t } = useI18n();

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props validation
const props = defineProps({
  checklist: {
    type: Object,
    required: true,
    validator: (value) => {
      // Validate that the object has the required properties for a checklist
      return (
        value &&
        typeof value.id === 'string' &&
        typeof value.destination === 'string' &&
        typeof value.startDate === 'string' &&
        typeof value.endDate === 'string'
      );
    },
  },
  categories: {
    type: Array,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  newlyCreatedItemId: {
    type: String,
    default: null,
  },
  newlyCreatedCategoryId: {
    type: String,
    default: null,
  },
  newlyCreatedChecklistId: {
    type: String,
    default: null,
  },
});

// Emits
const emit = defineEmits([
  'update:checklist',
  'delete:checklist',
  'update:item',
  'delete:item',
  'create:item',
  'update:category',
  'delete:category',
  'create:category',
  'reorder:categories',
  'move:item',
]);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Editing state
const isEditing = ref(false);
const editedDestination = ref('');
const editedStartDate = ref('');
const editedEndDate = ref('');
const destinationInput = ref(null);
const startDateInput = ref(null);
const endDateInput = ref(null);

// Drag state
const draggingCategoryId = ref(null);
const isDraggingCategory = ref(false);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Sorted categories for this checklist (sorted by order)
const sortedCategories = computed(() => {
  return [...props.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
});

// Draggable categories (two-way binding with vuedraggable)
const draggableCategories = computed({
  get() {
    return sortedCategories.value;
  },
  set(newCategories) {
    // When vuedraggable updates the array, emit the reorder event
    const categoriesWithNewOrder = newCategories.map((category, index) => ({
      ...category,
      order: index,
    }));

    emit('reorder:categories', categoriesWithNewOrder);
  },
});

// ------------------------------------------------------------------------------
// Editing functions
// ------------------------------------------------------------------------------

/**
 * Save edit when focus moves outside the edit area
 * @param {Event} _event - Blur event (unused)
 */
function handleEditBlur(_event) {
  // Use a small timeout to allow focus to move to the other input
  setTimeout(() => {
    // Check if focus is still within editing elements
    const activeElement = document.activeElement;
    const isStillEditing =
      activeElement === destinationInput.value ||
      activeElement === startDateInput.value ||
      activeElement === endDateInput.value;

    if (!isStillEditing && isEditing.value) {
      saveEdit();
    }
  }, 10);
}

/**
 * Enter edit mode and focus on destination input
 */
async function startEdit() {
  isEditing.value = true;
  editedDestination.value = props.checklist.destination;
  editedStartDate.value = props.checklist.startDate;
  editedEndDate.value = props.checklist.endDate;

  await nextTick();
  if (destinationInput.value) {
    destinationInput.value.focus();
    destinationInput.value.select();
  }
}

/**
 * Save changes to checklist if any values were modified
 */
function saveEdit() {
  const hasDestinationChanged = editedDestination.value.trim() !== props.checklist.destination;
  const hasStartDateChanged = editedStartDate.value !== props.checklist.startDate;
  const hasEndDateChanged = editedEndDate.value !== props.checklist.endDate;

  if (hasDestinationChanged || hasStartDateChanged || hasEndDateChanged) {
    const updatedChecklist = {
      ...props.checklist,
      destination: editedDestination.value.trim() || t('checklist.untitled'),
      startDate: editedStartDate.value,
      endDate: editedEndDate.value,
    };
    emit('update:checklist', updatedChecklist);
  }
  isEditing.value = false;
}

/**
 * Cancel editing and restore original values
 */
function cancelEdit() {
  isEditing.value = false;
  editedDestination.value = props.checklist.destination;
  editedStartDate.value = props.checklist.startDate;
  editedEndDate.value = props.checklist.endDate;
}

// ------------------------------------------------------------------------------
// Checklist management
// ------------------------------------------------------------------------------

/**
 * Emit delete event for this checklist
 */
function handleDelete() {
  emit('delete:checklist', props.checklist.id);
}

// ------------------------------------------------------------------------------
// Drag and drop handlers (vuedraggable events)
// ------------------------------------------------------------------------------

/**
 * Set dragging category ID when drag starts
 * @param {object} event - Sortable drag event
 */
function onCategoryDragStart(event) {
  const categoryElement = event.item.querySelector('[data-category-id]') || event.item;
  if (categoryElement.dataset.categoryId) {
    draggingCategoryId.value = categoryElement.dataset.categoryId;
  }
  isDraggingCategory.value = true;
}

/**
 * Clear dragging state when drag ends
 * @param {object} _event - Sortable drag event (unused)
 */
function onCategoryDragEnd(_event) {
  draggingCategoryId.value = null;
  isDraggingCategory.value = false;
}

/**
 * Handle category update event (delegated to draggableCategories setter)
 * @param {object} _event - Sortable update event (unused)
 */
function onCategoryUpdate(_event) {
  // This event is now handled by the draggableCategories setter
}

/**
 * Emit item move event to parent component
 * @param {object} moveData - Move data containing item and reorder information
 */
function handleItemMove(moveData) {
  emit('move:item', moveData);
}

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
 * Format date range as string for display
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} Formatted date range string
 */
function formatDateRange(startDate, endDate) {
  /**
   * Parse YYYY-MM-DD date string to local Date object
   * @param {string} dateStr - Date string
   * @returns {Date|null} Parsed date or null
   */
  function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return new Date(dateStr);
    const [y, m, d] = parts.map(Number);
    // new Date(year, monthIndex, day) creates a date in local timezone
    return new Date(y, m - 1, d);
  }

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (!start || !end) return '';

  // If same date, just return one date
  if (startDate === endDate) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Different dates
  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

// Watch for newly created checklists and auto-start edit
watch(
  () => props.newlyCreatedChecklistId,
  (newId) => {
    if (newId === props.checklist.id) {
      nextTick(() => {
        startEdit();
      });
    }
  }
);
</script>

<style scoped>
/* Category drag and drop styles */
.ghost-category {
  opacity: 0.3;
  background: #f3f4f6;
  border: 2px dashed #9ca3af;
  border-radius: 0.75rem;
}

.chosen-category {
  cursor: grabbing !important;
}

.drag-category {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 1000;
}

/* Masonry layout using CSS columns */
.categories-masonry {
  column-count: 1;
  column-gap: 0.75rem; /* gap-3 for better spacing */
}

/* Breakpoints calculated to ensure minimum 280px per column */
/* 2 columns: 280*2 + 12 = 572px minimum, using 768px for comfort */
@media (min-width: 768px) {
  .categories-masonry {
    column-count: 2;
  }
}

/* 3 columns: 280*3 + 24 = 864px minimum, using 1180px for comfort */
@media (min-width: 1180px) {
  .categories-masonry {
    column-count: 3;
  }
}

/* 4 columns: 280*4 + 36 = 1156px minimum, using 1536px for comfort */
@media (min-width: 1536px) {
  .categories-masonry {
    column-count: 4;
  }
}

/* Prevent categories from breaking across columns */
.category-item {
  break-inside: avoid;
  page-break-inside: avoid; /* For older browsers */
  margin-bottom: 0.75rem; /* gap-3 */
  display: inline-block;
  width: 100%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Layout preservation during drag */
.categories-masonry.dragging > * {
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

/* Smooth transitions for masonry items */
.categories-masonry > * {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Success animation */
@keyframes flash-success {
  0%,
  100% {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  50% {
    box-shadow:
      0 4px 6px -1px rgba(16, 185, 129, 0.3),
      0 2px 4px -1px rgba(16, 185, 129, 0.2);
  }
}

.flash-success {
  animation: flash-success 0.6s ease-in-out;
}
</style>
