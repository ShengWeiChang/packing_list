<!--
================================================================================
File: source/components/Sidebar.vue
Description: Sidebar component - displays list of checklists with navigation
             and creation functionality.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
Last-Modified: 2025-09-30
================================================================================
-->

<template>
  <aside
    :class="[
      'bg-white border-r border-gray-200 p-2 flex flex-col transition-all duration-300 ease-in-out h-screen',
      // Mobile: overlay drawer when expanded, hidden when collapsed
      isMobile ? [
        isExpanded ? 'w-52 translate-x-0' : 'w-52 -translate-x-full'
      ] : [
        // Desktop: sticky positioning with width based on expanded state
        'sticky top-0',
        isExpanded ? 'w-52' : 'w-16'
      ]
    ]"
    aria-label="Sidebar"
  >
    <!-- Toggle Button -->
    <button
      @click="$emit('toggle-sidebar')"
      class="p-2 rounded-lg hover:bg-gray-100 mb-2"
    >
      <svg
        class="w-6 h-6 text-secondary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 18 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16">
        </path>
      </svg>
    </button>

    <!-- New Checklist Button -->
    <button
      @click="$emit('new-checklist')"
      class="rounded-lg hover:bg-gray-100 mb-12 flex items-center overflow-hidden whitespace-nowrap"
      :class="[isExpanded || isMobile ? 'pr-4' : '']"
    >
      <div class="p-2 flex-shrink-0">
        <svg
          class="w-6 h-6 text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 18 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4">
          </path>
        </svg>
      </div>
      <span
        class="text-secondary transition-opacity duration-300 ease-in-out ml-4"
        :class="{ 'opacity-0': !isExpanded && !isMobile, 'opacity-100 delay-150': isExpanded || isMobile }"
      >
        New Checklist
      </span>
    </button>

    <!-- Checklist Items -->
    <div class="mt-2">
      <div class="flex flex-col">
        <h1 class="text-xl font-bold mb-2 px-2 overflow-hidden whitespace-nowrap">
          <span
            class="inline-block text-primary transition-all duration-300 ease-in-out"
            :class="{ 'opacity-0 -translate-x-4': !isExpanded && !isMobile, 'opacity-100 translate-x-0 delay-150': isExpanded || isMobile }"
          >
            Checklists
          </span>
        </h1>
        <ul class="space-y-1">
          <li
            v-for="checklist in checklists"
            :key="checklist.id"
            class="whitespace-nowrap"
          >
            <div
              class="flex items-center group rounded-lg transition-colors duration-200 px-1"
              :class="(selectedChecklistId === checklist.id && (isExpanded || isMobile)) ? 'bg-gray-100' : 'hover:bg-gray-100'"
            >
              <button
                @click="$emit('select-checklist', checklist.id)"
                :class="[
                  'flex-grow text-left py-2 px-4 transition-colors duration-300 ease-in-out',
                  (isExpanded || isMobile) ? [
                    selectedChecklistId === checklist.id
                      ? 'text-primary font-medium'
                      : 'text-secondary'
                  ] : ''
                ]"
              >
                <span
                  class="inline-block transition-all duration-300 ease-in-out"
                  :class="{ 'opacity-0 -translate-x-4': !isExpanded && !isMobile, 'opacity-100 translate-x-0 delay-200': isExpanded || isMobile }"
                >
                  {{ checklist.destination }}
                </span>
              </button>

              <OverflowMenu
                v-if="isExpanded || isMobile"
                :item-id="String(checklist.id)"
                menu-type="category"
                size="small"
                :force-visible="true"
                :use-group-hover="false"
                class="ml-2"
                @edit="$emit('edit-checklist', checklist.id)"
                @delete="$emit('delete-checklist', checklist.id)"
              />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup>
import OverflowMenu from './OverflowMenu.vue';

defineProps({
  isExpanded: {
    type: Boolean,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isNarrow: {
    type: Boolean,
    default: false
  },
  checklists: {
    type: Array,
    required: true
  },
  selectedChecklistId: {
    type: String,
    default: null
  }
});

defineEmits(['toggle-sidebar', 'new-checklist', 'select-checklist', 'edit-checklist', 'delete-checklist']);
</script>
