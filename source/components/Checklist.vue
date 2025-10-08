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
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      <Category
        v-for="category in categories"
        :key="category.id"
        :category="category"
        :items="items"
        :newly-created-item-id="newlyCreatedItemId"
        :newly-created-category-id="newlyCreatedCategoryId"
        @update:item="$emit('update:item', $event)"
        @delete:item="$emit('delete:item', $event)"
        @create:item="$emit('create:item', $event)"
        @update:category="$emit('update:category', $event)"
        @delete:category="$emit('delete:category', $event)"
      />

      <AddCategoryButton @click="$emit('create:category')" />
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import AddCategoryButton from './AddCategoryButton.vue';
import Category from './Category.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';

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

const emit = defineEmits([
  'update:checklist',
  'delete:checklist',
  'update:item',
  'delete:item',
  'create:item',
  'update:category',
  'delete:category',
  'create:category'
]);

// Editing state
const isEditing = ref(false);
const editedDestination = ref('');
const editedStartDate = ref('');
const editedEndDate = ref('');
const destinationInput = ref(null);
const startDateInput = ref(null);
const endDateInput = ref(null);

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

// Handle delete action
function handleDelete() {
  emit('delete:checklist', props.checklist.id);
}

// Watch for newly created checklists and auto-start edit
watch(() => props.newlyCreatedChecklistId, (newId) => {
  if (newId === props.checklist.id) {
    nextTick(() => {
      startEdit();
    });
  }
});

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
</script>
