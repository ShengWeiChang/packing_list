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
      class="w-full rounded-lg hover:bg-gray-100 flex items-center mb-2"
      @click="$emit('toggle-sidebar')"
    >
      <div class="p-3 flex-shrink-0">
        <svg
          class="w-6 h-6 text-secondary"
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
      class="w-full rounded-lg hover:bg-gray-100 flex items-center overflow-hidden whitespace-nowrap mb-4"
      :class="[ isExpanded || isMobile ? 'pr-4' : '' ]"
      @click="$emit('create-checklist')"
    >
      <div class="p-3 flex-shrink-0">
        <svg
          class="w-6 h-6 text-secondary"
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
                :class="[
                  'w-full text-left py-2 px-4 transition-colors duration-300 ease-in-out',
                  (isExpanded || isMobile) ? [
                    selectedChecklistId === checklist.id
                      ? 'text-primary font-medium'
                      : 'text-secondary'
                  ] : ''
                ]"
                @click="$emit('select-checklist', checklist.id)"
              >
                <span
                  class="inline-block transition-all duration-300 ease-in-out"
                  :class="{ 'opacity-0 -translate-x-4': !isExpanded && !isMobile, 'opacity-100 translate-x-0 delay-200': isExpanded || isMobile }"
                >
                  {{ checklist.destination || $t('checklist.untitled') }}
                </span>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Language Setting Button -->
    <div ref="settingsRoot" class="mt-auto pt-4 relative">
      <button
        ref="languageButtonRef"
        class="w-full rounded-lg hover:bg-gray-100 flex items-center overflow-hidden whitespace-nowrap transition-colors duration-200"
        :class="[ isExpanded || isMobile ? 'pr-4' : '' ]"
        :aria-label="$t('language.switchLanguage')"
        :title="$t('language.switchLanguage')"
        @click="toggleLanguageMenu"
      >
        <div class="p-3 flex-shrink-0">
          <svg
            class="w-6 h-6 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <!-- Outer circle -->
            <circle cx="12" cy="12" r="10" stroke-width="2" />

            <!-- Parallels (latitude-like curves): top, middle (straight), bottom -->
            <path d="M4  6 c4  2 8  2 16 0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M2 12 h20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M4 18 c4 -2 8 -2 16 0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Meridians (longitude-like curves): left, center (straight), right -->
            <path d="M12 2 C 6 6  6 18 12 22" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M12 2 v20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M12 2 C18 6 18 18 12 22" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </button>

      <!-- Language Dropdown Menu -->
      <div
        v-if="showLanguageMenu"
        ref="languageDropdownRef"
        class="bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 min-w-[160px]"
        :style="languageDropdownStyle"
      >
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          class="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150"
          :class="currentLocale === lang.code ? 'text-primary font-medium bg-gray-50' : 'text-secondary'"
          @click="selectLanguage(lang.code)"
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

// Current language label no longer shown on the button; dropdown indicates selection

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
