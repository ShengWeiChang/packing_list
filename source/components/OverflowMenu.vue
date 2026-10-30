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
    :data-testid="`overflow-root-${props.menuType}-${props.itemId}`"
    @focusout="handleFocusOut"
  >
    <!-- Three-dot menu button or checkmark button when editing -->
    <button
      ref="buttonRef"
      type="button"
      :class="buttonClass"
      :aria-label="props.isEditing ? $t('common.save') : $t('common.moreOptions')"
      aria-haspopup="true"
      :aria-expanded="showMenu"
      :data-testid="`overflow-trigger-${props.menuType}-${props.itemId}`"
      @click.stop="props.isEditing ? handleConfirmEdit() : toggleMenu()"
    >
      <!-- Checkmark icon when editing -->
      <AppIcon
        v-if="props.isEditing"
        name="confirm"
        :size="triggerIconSize"
      />

      <!-- Three-dot menu icon when not editing -->
      <AppIcon
        v-else
        name="more"
        :size="triggerIconSize"
      />
    </button>

    <!-- Dropdown menu with edit and delete actions -->
    <div
      v-if="showMenu"
      ref="dropdownRef"
      :class="dropdownClass"
      :style="dropdownStyle"
      :data-testid="`overflow-dropdown-${props.menuType}-${props.itemId}`"
    >
      <button
        class="flex w-full items-center px-3 py-2 text-base text-primary hover:bg-interactive-hover focus:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus md:text-sm"
        :data-testid="`overflow-action-edit-${props.menuType}-${props.itemId}`"
        @click="handleEdit"
      >
        <AppIcon
          class="mr-2"
          name="edit"
          size="inline"
        />
        {{ $t('common.edit') }}
      </button>

      <button
        v-if="props.menuType !== 'template'"
        class="flex w-full items-center px-3 py-2 text-base text-primary hover:bg-interactive-hover focus:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus md:text-sm"
        :data-testid="`overflow-action-copy-${props.menuType}-${props.itemId}`"
        @click="handleCopy"
      >
        <AppIcon
          class="mr-2"
          name="copy"
          size="inline"
        />
        {{ $t('common.copy') }}
      </button>

      <!-- Save as Template (checklist only) -->
      <button
        v-if="props.menuType === 'checklist'"
        class="flex w-full items-center px-3 py-2 text-base text-primary hover:bg-interactive-hover focus:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus md:text-sm"
        :data-testid="`overflow-action-save-template-${props.menuType}-${props.itemId}`"
        @click="handleSaveAsTemplate"
      >
        <AppIcon
          class="mr-2"
          name="saveTemplate"
          size="inline"
        />
        {{ $t('template.saveAsTemplate') }}
      </button>

      <button
        class="flex w-full items-center px-3 py-2 text-base text-danger-text hover:bg-danger-bg focus:bg-danger-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-danger-focus md:text-sm"
        :data-testid="`overflow-action-delete-${props.menuType}-${props.itemId}`"
        @click="handleDelete"
      >
        <AppIcon
          class="mr-2"
          name="delete"
          size="inline"
        />
        {{ $t('common.delete') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import type { PropType } from 'vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import AppIcon from './AppIcon.vue';

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
    validator: (value: string) => ['item', 'category', 'checklist', 'template'].includes(value),
  },
  alignment: {
    type: String,
    default: 'left',
    validator: (value: string) => ['left', 'right'].includes(value),
  },
  forceVisible: {
    type: Boolean,
    default: false,
  },
  useGroupHover: {
    type: Boolean,
    default: true,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  triggerIconSize: {
    type: String as PropType<'compact' | 'inline' | 'control' | 'feature' | 'navigation' | null>,
    default: null,
    validator: (value: string) =>
      value === null || ['compact', 'inline', 'control', 'feature', 'navigation'].includes(value),
  },
  transparentTrigger: {
    type: Boolean,
    default: false,
  },
  triggerFrameSize: {
    type: String,
    default: 'standard',
    validator: (value: string) => ['standard', 'spacious'].includes(value),
  },
});

// Emits
const emit = defineEmits<{
  edit: [];
  copy: [];
  'save-as-template': [];
  delete: [];
  'confirm-edit': [];
}>();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Menu state
const showMenu = ref(false);
const dropdownStyle = ref({});
const dropdownRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);
const root = ref<HTMLElement | null>(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Button visibility based on props and menu state
const buttonClass = computed(() => {
  const frameSizeClass =
    props.triggerFrameSize === 'spacious' ? 'size-9 md:size-8' : 'size-9 md:size-6';
  const baseClass = `${frameSizeClass} flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-control-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1`;
  const surfaceClass = props.transparentTrigger ? 'bg-transparent' : 'bg-control-bg';

  // Green checkmark style when editing
  if (props.isEditing) {
    return `${baseClass} ${surfaceClass} opacity-100 text-success-state-text hover:text-success-state-text-dark hover:bg-success-state-bg`;
  }

  // Gray three-dot style when not editing
  const normalClass = `${baseClass} ${surfaceClass} text-secondary hover:text-primary`;

  // Show the button when menu is open or forceVisible is true
  if (showMenu.value || props.forceVisible) {
    return `${normalClass} opacity-100`;
  }

  // If using group-hover behavior (default), show on ancestor hover
  if (props.useGroupHover) {
    return `${normalClass} md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 md:focus:opacity-100`;
  }

  // Otherwise keep hidden unless forced or open
  // Mobile: always visible, Desktop: only when forced
  // Also ensure visible when focused (keyboard navigation)
  return `${normalClass} opacity-100 md:opacity-0 focus:opacity-100 md:focus:opacity-100`;
});

const triggerIconSize = computed(
  () => props.triggerIconSize ?? (props.menuType === 'item' ? 'inline' : 'control')
);

// Dropdown styling
const dropdownClass = computed(
  () => `mt-1 bg-white border border-border-color-light rounded-md shadow-lg z-50 w-auto max-w-xs`
);

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- Menu Positioning ----------

/**
 * Calculate and apply dropdown position to avoid viewport overflow
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

// ---------- Menu Actions ----------

/**
 * Toggle the overflow menu visibility and dispatch custom event
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

/**
 * Emit edit event and close the menu
 */
function handleEdit() {
  showMenu.value = false;
  emit('edit');
}

/**
 * Emit copy event and close the menu
 */
function handleCopy() {
  showMenu.value = false;
  emit('copy');
}

/**
 * Emit save-as-template event and close the menu
 */
function handleSaveAsTemplate() {
  showMenu.value = false;
  emit('save-as-template');
}

/**
 * Emit delete event and close the menu
 */
function handleDelete() {
  showMenu.value = false;
  emit('delete');
}

/**
 * Emit confirm-edit event when checkmark is clicked
 */
function handleConfirmEdit() {
  emit('confirm-edit');
}

// ---------- Event Handlers ----------

/**
 * Close menu when focus leaves the component
 * @param {FocusEvent} event - The focus event
 */
function handleFocusOut(event: FocusEvent) {
  // Check if the new focus target is still within this component
  // event.relatedTarget is the element receiving focus
  const newFocus = event.relatedTarget;
  const isFocusInside =
    (root.value && root.value.contains(newFocus as Node | null)) ||
    (dropdownRef.value && dropdownRef.value.contains(newFocus as Node | null));

  if (!isFocusInside) {
    showMenu.value = false;
  }
}

/**
 * Close menu when user clicks outside the dropdown
 * @param {Event} event - The click event
 */
function closeMenu(event: MouseEvent) {
  const target = event.target;
  const clickedInsideRoot = root.value && root.value.contains(target as Node | null);
  const clickedInsideDropdown =
    dropdownRef.value && dropdownRef.value.contains(target as Node | null);

  if (!clickedInsideRoot && !clickedInsideDropdown) {
    showMenu.value = false;
  }
}

/**
 * Close menu when user scrolls the page
 */
function closeMenuOnScroll() {
  showMenu.value = false;
}

/**
 * Close this menu when another overflow menu opens
 * @param {CustomEvent} event - The custom event with menu details
 */
function closeWhenOtherOpens(event: Event) {
  const detail = (event as CustomEvent<{ id?: string }>).detail || {};
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
