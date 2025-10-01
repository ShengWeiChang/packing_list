<template>
  <div>
    <!-- Checklist Header -->
    <div class="p-4 mb-2">
      <!-- Header content -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-baseline space-x-4">
          <h2 class="text-3xl font-bold text-primary">{{ checklist.destination }}</h2>
          <span class="text-base text-secondary">{{ formatDateRange(checklist.startDate, checklist.endDate) }}</span>
        </div>
        <button
          @click="$emit('edit-checklist')"
          class="p-2 text-secondary rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L15.232 5.232z"></path>
          </svg>
        </button>
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
import AddCategoryButton from './AddCategoryButton.vue';
import Category from './Category.vue';
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
             typeof value.endDate === 'string' &&
             typeof value.notes === 'string';
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
  }
});

const emit = defineEmits([
  'edit-checklist',
  'update:item',
  'delete:item',
  'create:item',
  'update:category',
  'delete:category',
  'create:category'
]);

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

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
