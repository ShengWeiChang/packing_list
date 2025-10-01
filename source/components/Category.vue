<!--
================================================================================
File: source/components/Category.vue
Description: Category component - groups items, shows progress and allows editing
             of the category name.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
Last-Modified: 2025-09-30
================================================================================
-->

<template>
  <div
    :class="[
      'p-3 rounded-xl shadow-md transition-shadow duration-200 group',
      isCompleted ? 'bg-green-50 hover:shadow-lg' : 'bg-white hover:shadow-lg'
    ]"
  >
    <!-- Category Header -->
    <div class="flex items-center justify-between mb-3 relative">
      <div class="flex-grow">
        <input
          v-if="isEditing"
          :id="`category-${category.id}-name`"
          :name="`category-${category.id}-name`"
          v-model="editedName"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          @blur="saveEdit"
          ref="editInput"
          class="w-full text-xl font-semibold text-slate-800 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500"
        >
        <h3 v-else class="text-xl font-semibold text-primary">{{ category.name }}</h3>
      </div>

      <!-- Overflow menu -->
      <OverflowMenu
        :item-id="category.id"
        menu-type="category"
        alignment="left"
        @edit="startEdit"
        @delete="handleDelete"
        class="ml-2"
      />
    </div>

    <!-- Category Progress Bar -->
    <ProgressBar
      :total="itemsForCategory.length"
      :completed="itemsForCategory.filter(item => item.isPacked).length"
      class="mb-3"
    />

    <!-- Items List -->
    <div class="space-y-0.5">
      <Item
        v-for="item in itemsForCategory"
        :key="item.id"
        :item="item"
        :newly-created-item-id="newlyCreatedItemId"
        :category-completed="isCompleted"
        @update:item="$emit('update:item', $event)"
        @delete="$emit('delete:item', item.id)"
      />

      <AddItemButton
        class="px-2 py-1 text-sm"
        :category-completed="isCompleted"
        @click="$emit('create:item', category.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { Category } from '../models/Category';
import AddItemButton from './AddItemButton.vue';
import Item from './Item.vue';
import OverflowMenu from './OverflowMenu.vue';
import ProgressBar from './ProgressBar.vue';

const props = defineProps({
  category: {
    type: Object,
    required: true,
    validator: (value) => {
      // Validate that the object has the required properties for a category
      return value &&
             typeof value.id === 'string' &&
             typeof value.name === 'string' &&
             typeof value.checklistId === 'string';
    }
  },
  items: {
    type: Array,
    required: true
  },
  newlyCreatedItemId: {
    type: String,
    default: null
  }
  ,
  newlyCreatedCategoryId: {
    type: String,
    default: null
  }
});

const emit = defineEmits([
  'update:item',
  'delete:item',
  'create:item',
  'update:category',
  'delete:category'
]);

// Editing state
const isEditing = ref(false);
const editedName = ref('');
const editInput = ref(null);

const itemsForCategory = computed(() => {
  const filteredItems = props.items.filter(item => item.categoryId === props.category.id);
  return filteredItems;
});

// Whether the category is completed: has items and all are packed
const isCompleted = computed(() => {
  const items = itemsForCategory.value;
  if (!items.length) return false;
  return items.every(i => i.isPacked);
});

// Start editing mode
async function startEdit() {
  isEditing.value = true;
  editedName.value = props.category.name;

  await nextTick();
  if (editInput.value) {
    editInput.value.focus();
    editInput.value.select();
  }
}

// Save edited name
function saveEdit() {
  const hasNameChanged = editedName.value.trim() && editedName.value !== props.category.name;

  if (hasNameChanged) {
    const updatedCategory = new Category({
      ...props.category,
      name: editedName.value.trim()
    });
    emit('update:category', updatedCategory);
  }
  isEditing.value = false;
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false;
  editedName.value = props.category.name;
}

// Handle delete action
function handleDelete() {
  emit('delete:category', props.category.id);
}

// Watch for newly created category and auto-start edit
watch(() => props.newlyCreatedCategoryId, (newId) => {
  if (newId === props.category.id) {
    nextTick(() => {
      startEdit();
    });
  }
});
</script>
