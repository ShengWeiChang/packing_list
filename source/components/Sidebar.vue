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
      @click="$emit('create-checklist')"
      class="rounded-lg hover:bg-gray-100 mb-4 flex items-center overflow-hidden whitespace-nowrap"
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
        {{ $t('sidebar.newChecklist') }}
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
            {{ $t('sidebar.title') }}
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
                  'w-full text-left py-2 px-4 transition-colors duration-300 ease-in-out',
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
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Language setting -->
    <div class="mt-auto pt-4 border-t border-gray-200 relative" ref="settingsRoot">
      <button
        @click="toggleLanguageMenu"
        class="w-full p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors duration-200"
        ref="languageButtonRef"
        :aria-label="$t('language.switchLanguage')"
      >
        <!-- Globe Icon (Heroicons outline) -->
        <svg
          class="w-6 h-6 text-secondary flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span
          v-if="isExpanded || isMobile"
          class="ml-3 text-sm text-secondary transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-0': !isExpanded && !isMobile, 'opacity-100 delay-150': isExpanded || isMobile }"
        >
          {{ currentLanguageLabel }}
        </span>
      </button>

      <!-- Language Dropdown Menu -->
      <div
        v-if="showLanguageMenu"
        ref="languageDropdownRef"
        :style="languageDropdownStyle"
        class="bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 min-w-[160px]"
      >
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          @click="selectLanguage(lang.code)"
          class="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150"
          :class="currentLocale === lang.code ? 'text-primary font-medium bg-gray-50' : 'text-secondary'"
        >
          <span class="mr-2">{{ lang.icon }}</span>
          <span>{{ lang.label }}</span>
          <svg
            v-if="currentLocale === lang.code"
            class="w-4 h-4 ml-auto text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
// ----------------------
// Imports
// ----------------------

import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

// ----------------------
// Internationalization (i18n)
// ----------------------

const { locale } = useI18n();

// Available languages configuration
// TODO: Expand this array when adding more language support
const availableLanguages = [
  { code: 'en', label: 'English', icon: '🇺🇸' },
  { code: 'zh-TW', label: '繁體中文', icon: '🇹🇼' }
];

// ----------------------
// Props & Emits
// ----------------------

// Props
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

// Emits
defineEmits(['toggle-sidebar', 'create-checklist', 'select-checklist']);

// ----------------------
// States
// ----------------------

// Language menu state
const showLanguageMenu = ref(false);
const languageDropdownStyle = ref({});
const languageDropdownRef = ref(null);
const languageButtonRef = ref(null);
const settingsRoot = ref(null);

// ----------------------
// Computed
// ----------------------

// Current locale (two-way binding)
const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val;
    localStorage.setItem('user-locale', val);
  }
});

// Current language label for display
const currentLanguageLabel = computed(() => {
  const current = availableLanguages.find(lang => lang.code === currentLocale.value);
  return current ? current.label : 'Language';
});

// ----------------------
// Language menu functions
// ----------------------

// Toggle language dropdown menu
function toggleLanguageMenu() {
  const willOpen = !showLanguageMenu.value;
  showLanguageMenu.value = willOpen;
  
  if (willOpen) {
    // Position dropdown off-screen first to measure
    languageDropdownStyle.value = { position: 'fixed', left: '-9999px', top: '-9999px', zIndex: 9999 };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        positionLanguageDropdown();
      });
    });
  }
}

// Position language dropdown relative to button
function positionLanguageDropdown() {
  if (!languageButtonRef.value || !languageDropdownRef.value) return;
  const btnRect = languageButtonRef.value.getBoundingClientRect();
  const ddRect = languageDropdownRef.value.getBoundingClientRect();
  
  // Position above the button
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
    zIndex: 9999
  };
}

// Select language and close menu
function selectLanguage(langCode) {
  currentLocale.value = langCode;
  showLanguageMenu.value = false;
}

// Close menu when clicking outside
function closeLanguageMenu(event) {
  const target = event.target;
  const clickedInsideRoot = settingsRoot.value && settingsRoot.value.contains(target);
  const clickedInsideDropdown = languageDropdownRef.value && languageDropdownRef.value.contains(target);
  
  if (!clickedInsideRoot && !clickedInsideDropdown) {
    showLanguageMenu.value = false;
  }
}

// Close menu on scroll
function closeLanguageMenuOnScroll() {
  showLanguageMenu.value = false;
}

// ----------------------
// Lifecycle Hooks
// ----------------------

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
