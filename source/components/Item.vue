<template>
  <div
    :class="[
      'flex items-center py-0.5 pl-2 pr-1 rounded-md transition-colors duration-200',
      categoryCompleted ? 'bg-green-50 text-green-800' : 'bg-white hover:bg-gray-100'
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <input
      type="checkbox"
      :id="`item-${item.id}-packed`"
      :name="`item-${item.id}-packed`"
      v-model="isItemPacked"
      :class="[
        'flex-none flex-shrink-0 w-4 h-4 mr-2 rounded-full',
        isItemPacked ? 'border-green-300 accent-green-600' : 'border-gray-300 accent-gray-600'
      ]"
      :style="isItemPacked ? { accentColor: 'var(--color-theme-primary)' } : {}"
    />

    <!-- Item name - editable when in edit mode -->
    <div class="flex-grow" @blur="handleEditBlur" @focusout="handleEditBlur">
      <input
        v-if="isEditing"
        :id="`item-${item.id}-name`"
        :name="`item-${item.id}-name`"
        v-model="editedName"
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        ref="editInput"
        class="w-full text-base bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500"
        :class="{ 'line-through text-secondary': item.isPacked }"
      />

      <span
        v-else
        class="text-base"
        :class="{ 'line-through text-secondary': item.isPacked }"
      >
        {{ item.name }}
      </span>
    </div>

    <!-- Quantity - editable when in edit mode, hidden when quantity is 1 -->
    <div
      v-if="isEditing || item.quantity > 1"
      class="ml-2"
      @blur="handleEditBlur"
      @focusout="handleEditBlur"
    >
      <input
        v-if="isEditing"
        :id="`item-${item.id}-quantity`"
        :name="`item-${item.id}-quantity`"
        v-model.number="editedQuantity"
        type="number"
        min="1"
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        @click.stop
        ref="quantityInput"
        class="w-12 px-1 py-0.5 text-xs font-semibold text-secondary bg-gray-100 border border-gray-300 rounded-full text-center focus:outline-none focus:border-gray-500"
      />

      <span
        v-else-if="item.quantity > 1"
        class="px-1.5 py-0.5 text-xs font-semibold text-secondary bg-gray-100 rounded-full"
      >
        x{{ item.quantity }}
      </span>
    </div>

    <!-- Overflow menu -->
    <OverflowMenu
      :item-id="item.id"
      menu-type="item"
      alignment="left"
      :force-visible="isHovered"
      :use-group-hover="false"
      @edit="startEdit"
      @delete="handleDelete"
      class="ml-2"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { Item } from '../models/Item';
import OverflowMenu from './OverflowMenu.vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
    validator: (value) => {
      // Validate that the object has the required properties for an item
      return value &&
             typeof value.id === 'string' &&
             typeof value.name === 'string' &&
             typeof value.quantity === 'number' &&
             typeof value.categoryId === 'string' &&
             typeof value.isPacked === 'boolean' &&
             typeof value.checklistId === 'string';
    }
  },
  newlyCreatedItemId: {
    type: String,
    default: null
  },
  categoryCompleted: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:item',
  'delete'
]);

// Editing state
const isEditing = ref(false);
const isHovered = ref(false);
const editedName = ref('');
const editedQuantity = ref(1);
const editInput = ref(null);
const quantityInput = ref(null);

// Handle edit blur - only save if focus is moving outside edit area
function handleEditBlur(event) {
  // Use a small timeout to allow focus to move to the other input
  setTimeout(() => {
    // Check if focus is still within editing elements
    const activeElement = document.activeElement;
    const isStillEditing = activeElement === editInput.value || activeElement === quantityInput.value;

    if (!isStillEditing && isEditing.value) {
      saveEdit();
    }
  }, 10);
}

// Start editing mode
async function startEdit() {
  isEditing.value = true;
  editedName.value = props.item.name;
  editedQuantity.value = props.item.quantity;

  await nextTick();
  if (editInput.value) {
    editInput.value.focus();
    editInput.value.select();
  }
}

// Save edited name
function saveEdit() {
  const hasNameChanged = editedName.value.trim() && editedName.value !== props.item.name;
  const hasQuantityChanged = editedQuantity.value !== props.item.quantity;

  if (hasNameChanged || hasQuantityChanged) {
    const updatedItem = new Item({
      ...props.item,
      name: editedName.value.trim() || props.item.name,
      quantity: Math.max(1, editedQuantity.value) // Ensure quantity is at least 1
    });
    emit('update:item', updatedItem);
  }
  isEditing.value = false;
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false;
  editedName.value = props.item.name;
  editedQuantity.value = props.item.quantity;
}

// Handle delete action
function handleDelete() {
  emit('delete');
}

// Watch for newly created items and auto-start edit
watch(() => props.newlyCreatedItemId, (newId) => {
  if (newId === props.item.id) {
    nextTick(() => {
      startEdit();
    });
  }
});

const isItemPacked = computed({
  get: () => {
    return props.item.isPacked;
  },
  set: (newValue) => {
    // update emitted to parent

    const updatedItem = new Item({
      id: props.item.id,
      name: props.item.name,
      quantity: props.item.quantity,
      categoryId: props.item.categoryId,
      isPacked: newValue,
      checklistId: props.item.checklistId
    });
    emit('update:item', updatedItem);
  }
});
</script>
