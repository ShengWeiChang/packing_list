<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center backdrop"
    @click="$emit('close')"
  >
    <div
      class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full"
      @click.stop
      :style="{ '--primary': THEME_COLORS.PRIMARY, '--muted': THEME_COLORS.MUTED }"
    >
      <h3 class="text-xl font-bold mb-4">
        {{ isEditing ? 'Edit Checklist' : 'New Checklist' }}
      </h3>
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label for="checklist-destination" class="block text-primary">Destination</label>
          <input
            type="text"
            id="checklist-destination"
            v-model="form.destination"
            class="w-full px-4 py-2 mt-1 border rounded-md focus:ring focus:ring-blue-200"
            required
          >
        </div>

        <div class="mb-4">
          <label for="checklist-date" class="block text-primary">Travel Dates</label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-secondary mt-1">Start</span>
              <input
                type="date"
                id="checklist-start-date"
                v-model="form.startDate"
                class="w-full px-4 py-2 mt-1 border rounded-md focus:ring focus:ring-blue-200"
                required
              >
            </div>
            <div>
              <span class="text-sm text-secondary mt-1">End</span>
              <input
                type="date"
                id="checklist-end-date"
                v-model="form.endDate"
                class="w-full px-4 py-2 mt-1 border rounded-md focus:ring focus:ring-blue-200"
                required
                :min="form.startDate"
              >
            </div>
          </div>
        </div>

        <div class="mb-4">
          <label for="checklist-notes" class="block text-primary">Notes</label>
          <textarea
            id="checklist-notes"
            v-model="form.notes"
            rows="3"
            class="w-full px-4 py-2 mt-1 border rounded-md focus:ring focus:ring-blue-200"
          ></textarea>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 text-primary bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 text-white rounded-lg transition-colors duration-200"
            :style="{
              background: 'var(--primary)',
              boxShadow: '0 1px 0 rgba(0,0,0,0.05)'
            }"
            @mouseover="hovering = true"
            @mouseleave="hovering = false"
          >
            {{ isEditing ? 'Save' : 'Add' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { THEME_COLORS } from '../utils/constants';

const props = defineProps({
  checklist: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'close']);

const form = ref({
  destination: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  notes: ''
});
const hovering = ref(false);

onMounted(() => {
  if (props.checklist) {
    form.value = { ...props.checklist };
  }
});

function handleSubmit() {
  emit('submit', { ...form.value });
}
</script>

<style scoped>
.backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
