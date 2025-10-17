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
    <div class="p-4 mb-2">
      <!-- Header content -->
      <div class="flex items-center justify-between mb-4 min-h-[4rem] gap-4">
        <div class="flex items-baseline space-x-4 flex-grow min-w-0">
          <!-- Editable destination name -->
          <div class="flex-grow min-h-[3rem] flex items-center min-w-0" @blur="handleEditBlur" @focusout="handleEditBlur">
            <input
              v-if="isEditing"
              :id="`checklist-${checklist.id}-destination`"
              :name="`checklist-${checklist.id}-destination`"
              v-model="editedDestination"
              @keyup.enter="saveEdit"
              @keyup.escape="cancelEdit"
              ref="destinationInput"
              class="w-full text-2xl md:text-3xl font-bold text-primary bg-transparent border-b-2 border-blue-300 focus:outline-none focus:border-blue-500 min-w-0"
              placeholder="Destination"
            />
            <h2
              v-else
              class="text-2xl md:text-3xl font-bold text-primary cursor-pointer hover:bg-gray-50 px-1 py-1 rounded truncate"
              @click="startEdit"
            >
              {{ checklist.destination || 'Untitled Checklist' }}
            </h2>
          </div>

          <!-- Editable dates -->
          <div class="flex items-center space-x-2 min-h-[2.5rem] flex-shrink-0" @blur="handleEditBlur" @focusout="handleEditBlur">
            <div v-if="isEditing" class="flex items-center space-x-1 sm:space-x-2 flex-wrap sm:flex-nowrap">
              <input
                type="date"
                :id="`checklist-${checklist.id}-start-date`"
                :name="`checklist-${checklist.id}-start-date`"
                v-model="editedStartDate"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
                ref="startDateInput"
                class="text-sm sm:text-base text-secondary bg-transparent border border-gray-300 rounded px-1 sm:px-2 py-1 focus:outline-none focus:border-blue-500 w-28 sm:w-auto"
              />
              <span class="text-secondary hidden sm:inline">-</span>
              <input
                type="date"
                :id="`checklist-${checklist.id}-end-date`"
                :name="`checklist-${checklist.id}-end-date`"
                v-model="editedEndDate"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
                ref="endDateInput"
                :min="editedStartDate"
                class="text-sm sm:text-base text-secondary bg-transparent border border-gray-300 rounded px-1 sm:px-2 py-1 focus:outline-none focus:border-blue-500 w-28 sm:w-auto"
              />
            </div>
            <span
              v-else
              class="text-base text-secondary cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
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
            menu-type="checklist"
            alignment="left"
            :force-visible="true"
            :use-group-hover="false"
            @edit="startEdit"
            @delete="handleDelete"
            class="ml-2"
          />
        </div>
      </div>

      <!-- Progress bar -->
      <ProgressBar
        :total="items.length"
        :completed="items.filter(item => item.isPacked).length"
      />
    </div>

    <!-- Categories Grid -->
    <div>
      <draggable
        v-model="draggableCategories"
        :group="{ 
          name: 'categories', 
          pull: true, 
          put: function(to, from, dragEl, evt) {
            // Only allow categories to be dropped in the category container
            return from.options.group.name === 'categories';
          }
        }"
        item-key="id"
        :animation="200"
        :ghost-class="'ghost-category'"
        :chosen-class="'chosen-category'"
        :drag-class="'drag-category'"
        :class="[
          'categories-masonry',
          isDraggingCategory ? 'dragging' : ''
        ]"
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
import { computed, nextTick, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import AddCategoryButton from './AddCategoryButton.vue';
import Category from './Category.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';

// ----------------------
// Props & Emits
// ----------------------

// Props validation
const props = defineProps({
  checklist: {
    type: Object,
    required: true,
    validator: (value) => {
      // Validate that the object has the required properties for a checklist
      return value &&
             typeof value.id === 'string' &&
             typeof value.destination === 'string' &&
             typeof value.startDate === 'string' &&
             typeof value.endDate === 'string';
    }
  },
  categories: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  newlyCreatedItemId: {
    type: String,
    default: null
  },
  newlyCreatedCategoryId: {
    type: String,
    default: null
  },
  newlyCreatedChecklistId: {
    type: String,
    default: null
  }
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
  'move:item'
]);

// ----------------------
// States
// ----------------------

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

// ----------------------
// Computed
// ----------------------

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
      order: index
    }));
    
    emit('reorder:categories', categoriesWithNewOrder);
  }
});

// ----------------------
// Editing functions
// ----------------------

// Handle edit blur - only save if focus is moving outside edit area
function handleEditBlur(event) {
  // Use a small timeout to allow focus to move to the other input
  setTimeout(() => {
    // Check if focus is still within editing elements
    const activeElement = document.activeElement;
    const isStillEditing = activeElement === destinationInput.value ||
                           activeElement === startDateInput.value ||
                           activeElement === endDateInput.value;

    if (!isStillEditing && isEditing.value) {
      saveEdit();
    }
  }, 10);
}

// Start editing mode
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

// Save edited checklist
function saveEdit() {
  const hasDestinationChanged = editedDestination.value.trim() !== props.checklist.destination;
  const hasStartDateChanged = editedStartDate.value !== props.checklist.startDate;
  const hasEndDateChanged = editedEndDate.value !== props.checklist.endDate;

  if (hasDestinationChanged || hasStartDateChanged || hasEndDateChanged) {
    const updatedChecklist = {
      ...props.checklist,
      destination: editedDestination.value.trim() || 'Untitled Checklist',
      startDate: editedStartDate.value,
      endDate: editedEndDate.value
    };
    emit('update:checklist', updatedChecklist);
  }
  isEditing.value = false;
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false;
  editedDestination.value = props.checklist.destination;
  editedStartDate.value = props.checklist.startDate;
  editedEndDate.value = props.checklist.endDate;
}

// ----------------------
// Checklist management
// ----------------------

// Handle delete action
function handleDelete() {
  emit('delete:checklist', props.checklist.id);
}

// ----------------------
// Drag and drop handlers (vuedraggable events)
// ----------------------

// Track which category is being dragged
function onCategoryDragStart(evt) {
  const categoryElement = evt.item.querySelector('[data-category-id]') || evt.item;
  if (categoryElement.dataset.categoryId) {
    draggingCategoryId.value = categoryElement.dataset.categoryId;
  }
  isDraggingCategory.value = true;
}

// Clean up drag state when drag ends
function onCategoryDragEnd(evt) {
  draggingCategoryId.value = null;
  isDraggingCategory.value = false;
}

// Handle category reorder (handled by draggableCategories setter instead)
function onCategoryUpdate(evt) {
  // This event is now handled by the draggableCategories setter
}

// Handle item movement between categories
function handleItemMove(moveData) {
  emit('move:item', moveData);
}

// ----------------------
// Helpers
// ----------------------

// Format date range for display
function formatDateRange(startDate, endDate) {
  // Parse YYYY-MM-DD strings into local Date objects to avoid timezone shifts
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
      year: 'numeric'
    });
  }

  // Different dates
  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`;
}

// ----------------------
// Watchers
// ----------------------

// Watch for newly created checklists and auto-start edit
watch(() => props.newlyCreatedChecklistId, (newId) => {
  if (newId === props.checklist.id) {
    nextTick(() => {
      startEdit();
    });
  }
});

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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 1000;
}

/* Masonry layout using CSS columns */
.categories-masonry {
  column-count: 1;
  column-gap: 0.5rem; /* gap-2 */
}

@media (min-width: 600px) {
  .categories-masonry {
    column-count: 2;
  }
}

@media (min-width: 840px) {
  .categories-masonry {
    column-count: 3;
  }
}

@media (min-width: 1280px) {
  .categories-masonry {
    column-count: 4;
  }
}

/* Prevent categories from breaking across columns */
.category-item {
  break-inside: avoid;
  page-break-inside: avoid; /* For older browsers */
  margin-bottom: 0.5rem; /* gap-2 */
  display: inline-block;
  width: 100%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Layout preservation during drag */
.categories-masonry.dragging > * {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

/* Smooth transitions for masonry items */
.categories-masonry > * {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Success animation */
@keyframes flash-success {
  0%, 100% { 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  50% { 
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2);
  }
}

.flash-success {
  animation: flash-success 0.6s ease-in-out;
}
</style>
