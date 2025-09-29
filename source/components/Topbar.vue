<template>
  <header class="w-full bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between md:hidden">
    <button
      @click="$emit('toggle')"
      aria-label="Open navigation"
      class="p-2 rounded-md hover:bg-gray-100"
    >
      <!-- hamburger icon -->
      <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>

    <button
      @click="$emit('new')"
      aria-label="New checklist"
      class="p-2 rounded-md hover:bg-gray-100"
    >
      <!-- plus icon -->
      <svg class="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
    </button>
  </header>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'Packing List'
  }
});

defineEmits(['toggle', 'new']);
</script>
