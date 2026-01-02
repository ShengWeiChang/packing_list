<!--
================================================================================
File: source/components/Sidebar.vue
Description: Sidebar component - displays list of checklists with navigation
             and creation functionality.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <aside
    :class="[
      'flex flex-col border-r border-gray-200 bg-white p-2 transition-all duration-300 ease-in-out',
      isMobile ? 'h-full' : 'h-screen',
      // Mobile: overlay drawer when expanded, hidden when collapsed
      isMobile
        ? [isExpanded ? 'w-72 translate-x-0' : 'w-72 -translate-x-full']
        : [
            // Desktop: sticky positioning with width based on expanded state
            'sticky top-0',
            isExpanded ? 'w-52' : 'w-16',
          ],
    ]"
    aria-label="Sidebar"
  >
    <!-- Toggle Button -->
    <button
      class="mb-2 flex w-full items-center rounded-lg hover:bg-gray-100"
      @click="$emit('toggle-sidebar')"
    >
      <div class="shrink-0 p-3">
        <svg
          class="text-secondary size-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>
    </button>

    <!-- New Checklist Button -->
    <button
      class="mb-4 flex w-full items-center overflow-hidden whitespace-nowrap rounded-lg hover:bg-gray-100"
      :class="[isExpanded || isMobile ? 'pr-4' : '']"
      @click="$emit('create-checklist')"
    >
      <div class="shrink-0 p-3">
        <svg
          class="text-secondary size-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <span
        class="text-secondary ml-4 text-lg transition-opacity duration-300 ease-in-out md:text-base"
        :class="{
          'opacity-0': !isExpanded && !isMobile,
          'opacity-100 delay-150': isExpanded || isMobile,
        }"
      >
        {{ $t('sidebar.newChecklist') }}
      </span>
    </button>

    <!-- Checklist Items -->
    <div class="mt-2 min-h-0 flex-1 overflow-y-auto">
      <div class="flex flex-col">
        <h1 class="mb-2 overflow-hidden whitespace-nowrap px-2 text-2xl font-bold md:text-xl">
          <span
            class="text-primary inline-block transition-all duration-300 ease-in-out"
            :class="{
              '-translate-x-4 opacity-0': !isExpanded && !isMobile,
              'translate-x-0 opacity-100 delay-150': isExpanded || isMobile,
            }"
          >
            {{ $t('sidebar.title') }}
          </span>
        </h1>
        <draggable
          v-model="draggableChecklists"
          item-key="id"
          tag="ul"
          :delay="200"
          :delay-on-touch-only="true"
          :group="{
            name: 'checklists',
            pull: false,
            put: false,
          }"
          :animation="200"
          :ghost-class="'ghost-checklist'"
          :chosen-class="'chosen-checklist'"
          :drag-class="'drag-checklist'"
          :disabled="!isExpanded && !isMobile"
          @start="onChecklistDragStart"
          @end="onChecklistDragEnd"
        >
          <template #item="{ element: checklist }">
            <li
              :key="checklist.id"
              :data-checklist-id="checklist.id"
              class="whitespace-nowrap"
            >
              <div
                class="group relative flex items-center rounded-lg px-1 transition-colors duration-200"
                :class="[
                  selectedChecklistId === checklist.id ? 'bg-gray-100' : 'hover:bg-gray-100',
                ]"
              >
                <button
                  :class="[
                    'min-w-0 grow py-3 text-left transition-colors duration-300 ease-in-out md:py-2',
                    isExpanded || isMobile ? 'px-4 pr-8' : 'flex items-center justify-center px-3',
                    isExpanded || isMobile
                      ? [
                          selectedChecklistId === checklist.id
                            ? 'text-primary font-medium'
                            : 'text-secondary',
                          // Apply cursor styles only when dragging is enabled
                          draggingChecklistId === checklist.id ? 'cursor-grabbing' : 'cursor-grab',
                        ]
                      : [
                          selectedChecklistId === checklist.id
                            ? 'text-primary font-medium'
                            : 'text-secondary',
                        ],
                  ]"
                  @click="$emit('select-checklist', checklist.id)"
                >
                  <!-- Expanded: show full name -->
                  <span
                    v-if="isExpanded || isMobile"
                    class="block truncate text-lg transition-all duration-300 ease-in-out md:text-base"
                  >
                    {{ checklist.name || $t('checklist.untitled') }}
                  </span>
                  <!-- Collapsed: show first character -->
                  <span
                    v-else
                    class="block"
                  >
                    {{ (checklist.name || $t('checklist.untitled')).charAt(0).toUpperCase() }}
                  </span>
                </button>

                <!-- Overflow Menu for Checklist -->
                <div
                  v-if="isExpanded || isMobile"
                  class="absolute right-1 shrink-0"
                >
                  <OverflowMenu
                    :item-id="checklist.id"
                    menu-type="checklist"
                    alignment="left"
                    :use-group-hover="true"
                    @edit="$emit('edit-checklist', checklist.id)"
                    @copy="$emit('copy-checklist', checklist.id)"
                    @delete="$emit('delete-checklist', checklist.id)"
                  />
                </div>
              </div>
            </li>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Language Setting Button -->
    <div
      ref="settingsRoot"
      class="relative mt-auto pt-4"
    >
      <button
        ref="languageButtonRef"
        class="flex w-full items-center overflow-hidden whitespace-nowrap rounded-lg transition-colors duration-200 hover:bg-gray-100"
        :class="[isExpanded || isMobile ? 'pr-4' : '']"
        :aria-label="$t('language.switchLanguage')"
        :title="$t('language.switchLanguage')"
        @click="toggleLanguageMenu"
      >
        <div class="shrink-0 p-3">
          <svg
            class="text-secondary size-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <!-- Outer circle -->
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke-width="2"
            />

            <!-- Parallels (latitude-like curves): top, middle (straight), bottom -->
            <path
              d="M4  6 c4  2 8  2 16 0"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M2 12 h20"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M4 18 c4 -2 8 -2 16 0"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Meridians (longitude-like curves): left, center (straight), right -->
            <path
              d="M12 2 C 6 6  6 18 12 22"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 2 v20"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 2 C18 6 18 18 12 22"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </button>

      <!-- Language Dropdown Menu -->
      <div
        v-if="showLanguageMenu"
        ref="languageDropdownRef"
        class="z-50 min-w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        :style="languageDropdownStyle"
      >
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          class="flex w-full items-center px-4 py-2 text-base transition-colors duration-150 hover:bg-gray-100 md:text-sm"
          :class="
            currentLocale === lang.code ? 'text-primary bg-gray-50 font-medium' : 'text-secondary'
          "
          @click="selectLanguage(lang.code)"
        >
          <span class="mr-2">{{ lang.icon }}</span>
          <span>{{ lang.label }}</span>
          <svg
            v-if="currentLocale === lang.code"
            class="text-primary ml-auto size-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';

import OverflowMenu from './OverflowMenu.vue';

// ------------------------------------------------------------------------------
// Internationalization (i18n)
// ------------------------------------------------------------------------------

const { locale } = useI18n();

// Available languages configuration
// TODO: Expand this array when adding more language support
const availableLanguages = [
  { code: 'en', label: 'English', icon: '🇺🇸' },
  { code: 'zh-TW', label: '繁體中文', icon: '🇹🇼' },
];

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
const props = defineProps({
  isExpanded: {
    type: Boolean,
    required: true,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  isNarrow: {
    type: Boolean,
    default: false,
  },
  checklists: {
    type: Array,
    required: true,
  },
  selectedChecklistId: {
    type: String,
    default: null,
  },
});

// Emits
const emit = defineEmits([
  'toggle-sidebar',
  'create-checklist',
  'select-checklist',
  'edit-checklist',
  'copy-checklist',
  'delete-checklist',
  'move:checklists',
]);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Language menu state
const showLanguageMenu = ref(false);
const languageDropdownStyle = ref({});
const languageDropdownRef = ref(null);
const languageButtonRef = ref(null);
const settingsRoot = ref(null);

// Drag state
const draggingChecklistId = ref(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Current locale (two-way binding)
const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val;
    localStorage.setItem('user-locale', val);
  },
});

// Sorted checklists for display (sorted by order)
const sortedChecklists = computed(() => {
  return [...props.checklists].sort((a, b) => (a.order || 0) - (b.order || 0));
});

// Draggable checklists (two-way binding with vuedraggable)
const draggableChecklists = computed({
  get() {
    return sortedChecklists.value;
  },
  set(newChecklists) {
    // When vuedraggable updates the array, emit the reorder event
    const checklistsWithNewOrder = newChecklists.map((checklist, index) => ({
      ...checklist,
      order: index,
    }));

    emit('move:checklists', checklistsWithNewOrder);
  },
});

// Current language label no longer shown on the button; dropdown indicates selection

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- Language Menu Handlers ----------

/**
 * Toggle language dropdown menu visibility
 */
function toggleLanguageMenu() {
  const willOpen = !showLanguageMenu.value;
  showLanguageMenu.value = willOpen;

  if (willOpen) {
    // Position dropdown off-screen first to measure
    languageDropdownStyle.value = {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      zIndex: 9999,
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        positionLanguageDropdown();
      });
    });
  }
}

/**
 * Calculate and apply language dropdown position
 */
function positionLanguageDropdown() {
  if (!languageButtonRef.value || !languageDropdownRef.value) return;
  const btnRect = languageButtonRef.value.getBoundingClientRect();
  const ddRect = languageDropdownRef.value.getBoundingClientRect();

  // Position above the button, aligned to the left
  let left = btnRect.left;
  const top = btnRect.top - ddRect.height - 8; // 8px gap

  // Clamp within viewport with padding
  const minPadding = 8;
  const maxLeft = window.innerWidth - ddRect.width - minPadding;
  if (left < minPadding) left = minPadding;
  if (left > maxLeft) left = maxLeft;

  languageDropdownStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999,
  };
}

/**
 * Change the application language and close the language menu
 * @param {string} langCode - The language code to switch to (e.g., 'en', 'zh-TW')
 */
function selectLanguage(langCode) {
  currentLocale.value = langCode;
  showLanguageMenu.value = false;
}

/**
 * Close language menu when user clicks outside
 * @param {Event} event - The click event
 */
function closeLanguageMenu(event) {
  const target = event.target;
  const clickedInsideRoot = settingsRoot.value && settingsRoot.value.contains(target);
  const clickedInsideDropdown =
    languageDropdownRef.value && languageDropdownRef.value.contains(target);

  if (!clickedInsideRoot && !clickedInsideDropdown) {
    showLanguageMenu.value = false;
  }
}

/**
 * Close language menu when user scrolls the page
 */
function closeLanguageMenuOnScroll() {
  showLanguageMenu.value = false;
}

// --- Drag and Drop Handlers ---

/**
 * Set dragging checklist ID when drag starts
 * @param {object} event - Sortable drag event
 */
function onChecklistDragStart(event) {
  // The data-checklist-id attribute is on the <li> element (event.item itself)
  if (event.item.dataset.checklistId) {
    draggingChecklistId.value = event.item.dataset.checklistId;
  }
}

/**
 * Clear dragging state when drag ends
 * @param {object} _event - Sortable drag event (unused)
 */
function onChecklistDragEnd(_event) {
  draggingChecklistId.value = null;
}

// ------------------------------------------------------------------------------
// Lifecycle Hooks
// ------------------------------------------------------------------------------

// Set up event listeners for language menu
onMounted(() => {
  document.addEventListener('click', closeLanguageMenu);
  window.addEventListener('scroll', closeLanguageMenuOnScroll, true);
});

// Clean up event listeners
onUnmounted(() => {
  document.removeEventListener('click', closeLanguageMenu);
  window.removeEventListener('scroll', closeLanguageMenuOnScroll, true);
});
</script>

<style scoped>
/* Checklist drag and drop styles */
.ghost-checklist {
  opacity: 0.3;
  background: var(--color-gray-gray-100);
  border: 2px dashed var(--color-gray-gray-400);
  border-radius: 0.5rem;
}

.chosen-checklist {
  cursor: grabbing !important;
}

.drag-checklist {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow:
    0 10px 15px -3px var(--color-shadow-black-10),
    0 4px 6px -2px var(--color-shadow-black-5);
}
</style>
