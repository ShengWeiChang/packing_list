<!--
================================================================================
File: source/components/OverflowMenu.vue
Description: Overflow menu component - provides contextual actions for items,
             categories and checklists.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      ref="buttonRef"
      type="button"
      :class="buttonClass"
      @click.stop="toggleMenu"
    >
      <svg
        :class="svgClass"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="6"
          cy="12"
          r="1.5"
        />
        <circle
          cx="12"
          cy="12"
          r="1.5"
        />
        <circle
          cx="18"
          cy="12"
          r="1.5"
        />
      </svg>
    </button>

    <!-- Dropdown menu (fixed, positioned at runtime to avoid clipping) -->
    <div
      v-if="showMenu"
      ref="dropdownRef"
      :class="dropdownClass"
      :style="dropdownStyle"
    >
      <button
        class="text-primary flex w-full items-center px-3 py-2 text-sm hover:bg-gray-100"
        @click="handleEdit"
      >
        <svg
          class="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L15.232 5.232z"
          />
        </svg>
        {{ $t('common.edit') }}
      </button>

      <button
        class="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        @click="handleDelete"
      >
        <svg
          class="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        {{ $t('common.delete') }}
      </button>
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { computed, onMounted, onUnmounted, ref } from 'vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
const props = defineProps({
  itemId: {
    type: String,
    required: true,
  },
  menuType: {
    type: String,
    required: true,
    validator: (value) => ['item', 'category', 'checklist'].includes(value),
  },
  alignment: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value),
  },
  forceVisible: {
    type: Boolean,
    default: false,
  },
  useGroupHover: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits(['edit', 'delete']);

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Menu state
const showMenu = ref(false);
const dropdownStyle = ref({});
const dropdownRef = ref(null);
const buttonRef = ref(null);
const root = ref(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Button visibility based on props and menu state
const buttonClass = computed(() => {
  const baseClass =
    'p-1 flex items-center justify-center text-secondary rounded-md transition-opacity duration-200 hover:bg-gray-200 hover:text-primary';

  // Show the button when menu is open or forceVisible is true
  if (showMenu.value || props.forceVisible) {
    return `${baseClass} opacity-100`;
  }

  // If using group-hover behavior (default), show on ancestor hover
  if (props.useGroupHover) {
    return `${baseClass} opacity-0 group-hover:opacity-100`;
  }

  // Otherwise keep hidden unless forced or open
  return `${baseClass} opacity-0`;
});

// Dropdown styling
const dropdownClass = computed(
  () => `mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-auto max-w-xs`
);

// SVG icon size based on menu type
const svgClass = computed(() => {
  return props.menuType === 'item' ? 'w-5 h-5' : 'w-6 h-6';
});

// ------------------------------------------------------------------------------
// Menu positioning
// ------------------------------------------------------------------------------

// Position dropdown relative to button
/**
 *
 */
function positionDropdown() {
  if (!buttonRef.value || !dropdownRef.value) return;
  const btnRect = buttonRef.value.getBoundingClientRect();
  const ddRect = dropdownRef.value.getBoundingClientRect();

  // Align dropdown right edge with the button's right edge
  let left = btnRect.right - ddRect.width;

  // Clamp within viewport with 8px padding
  const minPadding = 8;
  const maxLeft = window.innerWidth - ddRect.width - minPadding;
  if (left < minPadding) left = minPadding;
  if (left > maxLeft) left = maxLeft;

  const top = btnRect.bottom + 6; // 6px gap

  dropdownStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999,
  };
}

// ------------------------------------------------------------------------------
// Menu actions
// ------------------------------------------------------------------------------

// Toggle dropdown menu
/**
 *
 */
function toggleMenu() {
  const willOpen = !showMenu.value;
  showMenu.value = willOpen;

  if (willOpen) {
    // First position dropdown off-screen to measure, then position correctly
    dropdownStyle.value = { position: 'fixed', left: '-9999px', top: '-9999px', zIndex: 9999 };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        positionDropdown();
      });
    });

    const payload = { id: props.itemId, type: props.menuType };
    try {
      window.dispatchEvent(new CustomEvent('overflow-menu-open', { detail: payload }));
    } catch {
      // Fallback for older browsers that don't support CustomEvent constructor
      const ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('overflow-menu-open', true, true, payload);
      window.dispatchEvent(ev);
    }
  }
}

// Handle edit action
/**
 *
 */
function handleEdit() {
  showMenu.value = false;
  emit('edit');
}

// Handle delete action
/**
 *
 */
function handleDelete() {
  showMenu.value = false;
  emit('delete');
}

// ------------------------------------------------------------------------------
// Event handlers
// ------------------------------------------------------------------------------

// Close menu when clicking outside
/**
 *
 * @param event
 */
function closeMenu(event) {
  const target = event.target;
  const clickedInsideRoot = root.value && root.value.contains(target);
  const clickedInsideDropdown = dropdownRef.value && dropdownRef.value.contains(target);

  if (!clickedInsideRoot && !clickedInsideDropdown) {
    showMenu.value = false;
  }
}

// Close menu when scrolling
/**
 *
 */
function closeMenuOnScroll() {
  showMenu.value = false;
}

// Close when another menu opens
/**
 *
 * @param e
 */
function closeWhenOtherOpens(e) {
  const detail = e?.detail || {};
  const otherId = detail.id;

  if (otherId && otherId !== props.itemId) {
    showMenu.value = false;
  }
}

// ------------------------------------------------------------------------------
// Lifecycle Hooks
// ------------------------------------------------------------------------------

// Set up event listeners
onMounted(() => {
  document.addEventListener('click', closeMenu);
  window.addEventListener('scroll', closeMenuOnScroll, true);
  window.addEventListener('overflow-menu-open', closeWhenOtherOpens);
});

// Clean up event listeners
onUnmounted(() => {
  document.removeEventListener('click', closeMenu);
  window.removeEventListener('scroll', closeMenuOnScroll, true);
  window.removeEventListener('overflow-menu-open', closeWhenOtherOpens);
});
</script>
