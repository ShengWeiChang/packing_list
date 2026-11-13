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
      'flex flex-col border-r border-border-color-light bg-white p-2 transition-all duration-300 ease-in-out',
      isMobile ? 'h-full' : 'h-dvh',
      // Mobile: overlay drawer when expanded, hidden when collapsed
      isMobile
        ? [isExpanded ? 'w-72 translate-x-0' : 'w-72 -translate-x-full']
        : [
            // Desktop: sticky positioning with width based on expanded state
            'sticky top-0',
            isExpanded ? 'w-52' : 'w-16',
          ],
    ]"
    :data-expanded="isExpanded || isMobile"
    aria-label="Sidebar"
  >
    <!-- Toggle Button -->
    <button
      ref="sidebarToggle"
      class="touch-target mb-2 flex w-full items-center rounded-lg hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
      :aria-label="$t('sidebar.toggle')"
      data-sidebar-control
      data-testid="sidebar-toggle"
      @click="$emit('toggle-sidebar')"
    >
      <div class="shrink-0 p-3">
        <AppIcon
          class="text-secondary"
          name="menu"
          size="navigation"
        />
      </div>
    </button>

    <!-- New Checklist Button -->
    <button
      class="touch-target mb-4 flex w-full items-center overflow-hidden whitespace-nowrap rounded-lg hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
      :class="[isExpanded || isMobile ? 'pr-4' : '']"
      :aria-label="$t('sidebar.newChecklist')"
      :title="isExpanded || isMobile ? undefined : $t('sidebar.newChecklist')"
      data-sidebar-control
      data-testid="sidebar-new-checklist"
      @click="$emit('create-checklist')"
    >
      <div class="shrink-0 p-3">
        <AppIcon
          class="text-secondary"
          name="add"
          size="navigation"
        />
      </div>
      <span
        class="text-lg text-secondary transition-opacity duration-300 ease-in-out md:text-base"
        :aria-hidden="!isExpanded && !isMobile"
        data-sidebar-label
      >
        {{ $t('sidebar.newChecklist') }}
      </span>
    </button>

    <!-- Checklist Items -->
    <div
      ref="checklistScrollport"
      class="mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      data-testid="sidebar-checklists-scrollport"
    >
      <div class="flex flex-col">
        <h1 class="mb-2 overflow-hidden whitespace-nowrap px-2 text-2xl font-bold md:text-xl">
          <span
            class="inline-block text-primary transition-all duration-300 ease-in-out"
            :class="{
              '-translate-x-4 opacity-0': !isExpanded && !isMobile,
              'translate-x-0 opacity-100 delay-150': isExpanded || isMobile,
            }"
          >
            {{ $t('sidebar.title') }}
          </span>
        </h1>
        <draggable
          ref="checklistDraggable"
          v-model="draggableChecklists"
          item-key="id"
          tag="ul"
          :delay="200"
          :delay-on-touch-only="true"
          filter="[data-testid^=overflow-trigger-checklist-]"
          :prevent-on-filter="false"
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
          data-testid="sidebar-checklists-draggable"
          @start="onChecklistDragStart"
          @end="onChecklistDragEnd"
        >
          <template #item="{ element: checklist }">
            <li
              :key="checklist.id"
              :data-checklist-id="checklist.id"
              class="whitespace-nowrap"
              :class="{
                invisible:
                  !isExpanded && !isMobile && !visibleCollapsedChecklistIds.has(checklist.id),
              }"
            >
              <div
                class="group relative flex items-center rounded-lg px-1 transition-colors duration-200"
                :class="[
                  selectedChecklistId === checklist.id
                    ? 'bg-interactive-hover'
                    : 'hover:bg-interactive-hover',
                ]"
              >
                <button
                  class="touch-target"
                  :class="[
                    'relative min-w-0 grow overflow-hidden py-3 text-left transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus md:py-2',
                    isExpanded || isMobile ? 'px-4 pr-8' : 'px-4 pr-0',
                    isExpanded || isMobile
                      ? [
                          selectedChecklistId === checklist.id
                            ? 'font-medium text-primary'
                            : 'text-secondary',
                          // Apply cursor styles only when dragging is enabled
                          draggingChecklistId === checklist.id ? 'cursor-grabbing' : 'cursor-grab',
                        ]
                      : [
                          selectedChecklistId === checklist.id
                            ? 'font-medium text-primary'
                            : 'text-secondary',
                        ],
                  ]"
                  :aria-label="checklist.name || $t('checklist.untitled')"
                  :title="
                    isExpanded || isMobile ? undefined : checklist.name || $t('checklist.untitled')
                  "
                  :aria-current="selectedChecklistId === checklist.id ? 'page' : undefined"
                  data-testid="sidebar-checklist-item"
                  :data-checklist-id="checklist.id"
                  @click="$emit('select-checklist', checklist.id)"
                >
                  <span
                    class="block truncate text-lg transition-all duration-300 ease-in-out md:text-base"
                    aria-hidden="true"
                    data-sidebar-checklist-label
                  >
                    {{ checklist.name || $t('checklist.untitled') }}
                  </span>
                  <span
                    class="absolute inset-0 flex items-center justify-center text-lg md:text-base"
                    aria-hidden="true"
                    data-sidebar-initial
                  >
                    {{ (checklist.name || $t('checklist.untitled')).charAt(0).toUpperCase() }}
                  </span>
                </button>

                <!-- Overflow Menu for Checklist -->
                <div
                  v-if="isExpanded || isMobile"
                  class="absolute right-1 shrink-0"
                  :data-sidebar-delayed-menu="!isMobile ? '' : undefined"
                >
                  <OverflowMenu
                    :item-id="checklist.id"
                    menu-type="checklist"
                    alignment="left"
                    :use-group-hover="true"
                    :focus-trigger-on-open="true"
                    :force-visible="touchControls"
                    :touch-minimal="touchControls"
                    @edit="$emit('edit-checklist', checklist.id)"
                    @copy="$emit('copy-checklist', checklist.id)"
                    @save-as-template="$emit('save-as-template', checklist.id)"
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
      data-testid="sidebar-language-settings"
      @focusout="handleSettingsFocusOut"
    >
      <div class="relative">
        <button
          ref="templatesButtonRef"
          class="touch-target flex w-full items-center overflow-hidden whitespace-nowrap rounded-lg transition-colors duration-200 hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
          :class="[isExpanded || isMobile ? 'pr-4' : '']"
          :aria-expanded="showTemplatesMenu"
          :aria-label="$t('template.myTemplates')"
          :title="isExpanded || isMobile ? undefined : $t('template.myTemplates')"
          aria-haspopup="true"
          data-sidebar-control
          data-testid="sidebar-templates-button"
          @click="toggleTemplatesMenu"
        >
          <span class="shrink-0 p-3 text-secondary">
            <AppIcon
              name="templateLibrary"
              size="navigation"
            />
          </span>
          <span
            class="truncate text-lg text-secondary transition-opacity duration-300 ease-in-out md:text-base"
            :aria-hidden="!isExpanded && !isMobile"
            data-sidebar-label
            >{{ $t('template.myTemplates') }}</span
          >
        </button>
        <div
          v-if="showTemplatesMenu"
          class="absolute bottom-full z-50 mb-2 rounded-md border border-border-color-light bg-white py-1 shadow-lg"
          :class="isExpanded || isMobile ? 'left-0 w-full' : 'left-full ml-2 w-52'"
          data-testid="sidebar-templates-dropdown"
        >
          <p
            v-if="sortedTemplates.length === 0"
            class="px-3 py-2 text-base text-secondary md:text-sm"
          >
            {{ $t('template.noTemplates') }}
          </p>
          <button
            v-for="template in sortedTemplates"
            :key="template.id"
            class="touch-target flex w-full items-center px-3 py-2 text-base text-primary transition-colors duration-150 hover:bg-interactive-hover focus:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus md:text-sm"
            :class="{
              'bg-interactive-hover-light font-medium': selectedTemplateId === template.id,
            }"
            :title="template.name"
            :data-testid="`sidebar-template-use-${template.id}`"
            @click="openTemplateEditor(template.id)"
          >
            <span class="truncate">{{ template.name }}</span>
          </button>
        </div>
      </div>
      <div class="relative">
        <button
          ref="languageButtonRef"
          class="touch-target flex w-full items-center overflow-hidden whitespace-nowrap rounded-lg transition-colors duration-200 hover:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus"
          :class="[isExpanded || isMobile ? 'pr-4' : '']"
          :aria-label="$t('language.switchLanguage')"
          :title="$t('language.switchLanguage')"
          :aria-expanded="showLanguageMenu"
          aria-haspopup="true"
          data-sidebar-control
          data-testid="sidebar-language-button"
          @click="toggleLanguageMenu"
        >
          <div class="shrink-0 p-3">
            <AppIcon
              class="text-secondary"
              name="language"
              size="navigation"
            />
          </div>
          <span
            class="truncate text-lg text-secondary transition-opacity duration-300 ease-in-out md:text-base"
            :aria-hidden="!isExpanded && !isMobile"
            data-sidebar-label
            >{{ $t('language.select') }}</span
          >
        </button>

        <!-- Language Dropdown Menu -->
        <div
          v-if="showLanguageMenu"
          class="absolute bottom-full z-50 mb-2 rounded-md border border-border-color-light bg-white py-1 shadow-lg"
          :class="isExpanded || isMobile ? 'left-0 w-full' : 'left-full ml-2 w-52'"
          data-testid="sidebar-language-dropdown"
        >
          <button
            v-for="lang in availableLanguages"
            :key="lang.code"
            class="touch-target flex w-full items-center px-3 py-2 text-base transition-colors duration-150 hover:bg-interactive-hover focus:bg-interactive-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-interactive-focus md:text-sm"
            :class="
              currentLocale === lang.code
                ? 'bg-interactive-hover-light font-medium text-primary'
                : 'text-primary'
            "
            :data-testid="`sidebar-language-option-${lang.code}`"
            @click="selectLanguage(lang.code)"
          >
            <span>{{ lang.label }}</span>
            <AppIcon
              v-if="currentLocale === lang.code"
              class="ml-auto text-primary"
              name="confirm"
              size="inline"
            />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import type { PropType } from 'vue';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useTouchLayout } from '../composables/useTouchLayout';
import type { ChecklistDTO } from '../models/contracts';
import AppIcon from './AppIcon.vue';
import type { DragStart, TemplateView } from './componentContracts';
import OverflowMenu from './OverflowMenu.vue';
import { draggableFor, useDraggableControls } from './typedDraggable';

// ------------------------------------------------------------------------------
// Internationalization (i18n)
// ------------------------------------------------------------------------------

const { locale } = useI18n();
const { touchControls } = useTouchLayout();

// Available languages configuration
// TODO: Expand this array when adding more language support
const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
];

const draggable = draggableFor<Readonly<ChecklistDTO>>();
const checklistDraggable = useDraggableControls();

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
    type: Array as PropType<readonly Readonly<ChecklistDTO>[]>,
    required: true,
  },
  templates: {
    type: Array as PropType<readonly TemplateView[]>,
    default: () => [],
  },
  selectedChecklistId: {
    type: String as PropType<string | null>,
    default: null,
  },
  selectedTemplateId: {
    type: String as PropType<string | null>,
    default: null,
  },
});

// Emits
const emit = defineEmits<{
  'toggle-sidebar': [];
  'create-checklist': [];
  'select-checklist': [id: string];
  'edit-checklist': [id: string];
  'copy-checklist': [id: string];
  'delete-checklist': [id: string];
  'move:checklists': [
    checklists: ChecklistDTO[],
    expected: ChecklistDTO[],
    settled?: (succeeded: boolean, awaitingRefresh?: boolean) => void,
  ];
  'save-as-template': [id: string];
  'edit-template': [id: string];
  'delete-template': [id: string];
}>();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

// Settings menu state
const showLanguageMenu = ref(false);
const showTemplatesMenu = ref(false);
const settingsRoot = ref<HTMLElement | null>(null);
const templatesButtonRef = ref<HTMLButtonElement | null>(null);
const languageButtonRef = ref<HTMLButtonElement | null>(null);

// Only fully visible entries remain interactive while the narrow rail is clipped.
const sidebarToggle = ref<HTMLButtonElement | null>(null);
const checklistScrollport = ref<HTMLElement | null>(null);
const visibleCollapsedChecklistIds = ref(new Set<string>());
let checklistResizeObserver: ResizeObserver | undefined;
let checklistResizeFrame: number | undefined;

// Drag state
const draggingChecklistId = ref<string | null>(null);

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

// Current locale (two-way binding)
const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val;
    try {
      localStorage.setItem('user-locale', val);
    } catch {
      // Keep the selected locale for this session if the preference cannot be stored.
    }
  },
});

// Sorted checklists for display (newest first)
const sortedChecklists = computed(() => {
  return [...props.checklists].sort((a, b) => (b.order || 0) - (a.order || 0));
});

// Sorted templates for display (sorted by order)
const sortedTemplates = computed(() => {
  return [...props.templates].sort((a, b) => (a.order || 0) - (b.order || 0));
});

// Draggable checklists (two-way binding with vuedraggable)
const checklistPreview = ref<Readonly<ChecklistDTO>[] | null>(null);
let pendingChecklistMoves = 0;
let awaitingChecklistRefresh = false;

/** Keep the last dropped order until all saves and their refreshes have finished. */
function resetChecklistPreviewWhenIdle() {
  if (!pendingChecklistMoves && !awaitingChecklistRefresh && !draggingChecklistId.value) {
    checklistPreview.value = null;
  }
}

watch(
  () => props.checklists,
  () => {
    if (!awaitingChecklistRefresh) return;
    awaitingChecklistRefresh = false;
    void nextTick(resetChecklistPreviewWhenIdle);
  }
);

const draggableChecklists = computed({
  get() {
    if (!checklistPreview.value) return sortedChecklists.value;
    // Project only ordering: concurrent renames, additions and deletions remain current.
    const previewIds = new Set(checklistPreview.value.map((checklist) => checklist.id));
    return [
      ...checklistPreview.value.flatMap((preview) => {
        const current = props.checklists.find((checklist) => checklist.id === preview.id);
        return current ? [{ ...current, order: preview.order }] : [];
      }),
      ...sortedChecklists.value.filter((checklist) => !previewIds.has(checklist.id)),
    ];
  },
  set(newChecklists) {
    // Keep the first visible checklist newest after a drag-and-drop reorder.
    const checklistsWithNewOrder = newChecklists.map((checklist, index) => ({
      ...checklist,
      order: newChecklists.length - index - 1,
    }));

    checklistPreview.value = checklistsWithNewOrder;
    pendingChecklistMoves += 1;

    emit(
      'move:checklists',
      checklistsWithNewOrder,
      newChecklists.map((checklist) => ({ ...checklist })),
      (_succeeded, awaitingRefresh) => {
        pendingChecklistMoves -= 1;
        if (awaitingRefresh) awaitingChecklistRefresh = true;
        void nextTick(resetChecklistPreviewWhenIdle);
      }
    );
  },
});

// Current language label no longer shown on the button; dropdown indicates selection

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- Settings Menu Handlers ----------

/**
 * Toggle language dropdown menu visibility
 */
function toggleLanguageMenu() {
  showLanguageMenu.value = !showLanguageMenu.value;
  showTemplatesMenu.value = false;
}

/**
 * Change the application language and close the language menu
 * @param {string} langCode - The language code to switch to (e.g., 'en', 'zh-TW')
 */
function selectLanguage(langCode: string) {
  currentLocale.value = langCode;
  showLanguageMenu.value = false;
}

/**
 * Close language menu when user clicks outside
 * @param {Event} event - The click event
 */
function closeSettingsMenusOnClick(event: MouseEvent) {
  const target = event.target;
  const clickedInsideRoot =
    settingsRoot.value && settingsRoot.value.contains(target as Node | null);

  if (!clickedInsideRoot) {
    showLanguageMenu.value = false;
    showTemplatesMenu.value = false;
  }
}

/**
 * Handle focus out event to close menu when tabbing away
 * @param {FocusEvent} event - The focus event
 */
function handleSettingsFocusOut(event: FocusEvent) {
  // Check if the new focus target is still within the settings component or dropdown
  const newFocus = event.relatedTarget;
  const isFocusInRoot = settingsRoot.value && settingsRoot.value.contains(newFocus as Node | null);

  if (!isFocusInRoot) {
    showLanguageMenu.value = false;
    showTemplatesMenu.value = false;
  }
}

/**
 * Close language menu when user scrolls the page
 */
function closeSettingsMenusOnScroll(event: Event) {
  if (event.target instanceof Node && settingsRoot.value?.contains(event.target)) return;
  showLanguageMenu.value = false;
  showTemplatesMenu.value = false;
}

/** Close both Sidebar settings menus from the keyboard. */
function closeSettingsMenus() {
  showLanguageMenu.value = false;
  showTemplatesMenu.value = false;
}

/**
 * Close settings menus when Escape is pressed.
 * @param {KeyboardEvent} event - Document keyboard event
 */
function handleSettingsKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || (!showTemplatesMenu.value && !showLanguageMenu.value)) return;
  const sidebar = settingsRoot.value?.closest('aside');
  const drawer = sidebar?.closest('[data-testid="overlay-sidebar"]');
  const target = event.target;
  const isUnobstructedBody =
    target === document.body && !document.querySelector('[aria-modal="true"]');
  if (
    target instanceof Node &&
    !isUnobstructedBody &&
    target !== document &&
    !sidebar?.contains(target) &&
    !drawer?.contains(target)
  )
    return;
  event.preventDefault();
  event.stopPropagation();
  const trigger = showTemplatesMenu.value ? templatesButtonRef.value : languageButtonRef.value;
  closeSettingsMenus();
  trigger?.focus();
}

// ---------- Template Menu Handlers ----------

/** Toggle the templates menu and close the language menu. */
function toggleTemplatesMenu() {
  showTemplatesMenu.value = !showTemplatesMenu.value;
  showLanguageMenu.value = false;
}

/**
 * Open a template in the editor and close the templates menu.
 * @param {string} templateId - Template ID to edit
 */
function openTemplateEditor(templateId: string) {
  showTemplatesMenu.value = false;
  emit('edit-template', templateId);
}

// ---------- Drag and Drop Handlers ----------

/**
 * Set dragging checklist ID when drag starts
 * @param {object} event - Sortable drag event
 */
function onChecklistDragStart(event: DragStart) {
  // The data-checklist-id attribute is on the <li> element (event.item itself)
  if (event.item.dataset.checklistId) {
    draggingChecklistId.value = event.item.dataset.checklistId;
  }
}

/**
 * Clear dragging state when drag ends
 * @param {object} _event - Sortable drag event (unused)
 */
function onChecklistDragEnd(_event: unknown) {
  draggingChecklistId.value = null;
  void nextTick(resetChecklistPreviewWhenIdle);
}

// ------------------------------------------------------------------------------
// Lifecycle Hooks
// ------------------------------------------------------------------------------

/** Keep clipped checklist entries out of keyboard and screen-reader navigation. */
function updateVisibleCollapsedChecklists() {
  const scrollport = checklistScrollport.value;
  if (!scrollport || props.isExpanded || props.isMobile) return;

  const bounds = scrollport.getBoundingClientRect();
  const visible = new Set<string>();
  for (const row of scrollport.querySelectorAll<HTMLElement>('li[data-checklist-id]')) {
    const rect = row.getBoundingClientRect();
    const id = row.dataset.checklistId;
    if (id && rect.height > 0 && rect.top >= bounds.top && rect.bottom <= bounds.bottom) {
      visible.add(id);
    }
  }
  const focusedRow = document.activeElement?.closest<HTMLElement>('li[data-checklist-id]');
  if (focusedRow && scrollport.contains(focusedRow)) {
    const focusedId = focusedRow.dataset.checklistId;
    if (focusedId && !visible.has(focusedId)) sidebarToggle.value?.focus({ preventScroll: true });
  }
  const previous = visibleCollapsedChecklistIds.value;
  if (previous.size !== visible.size || [...visible].some((id) => !previous.has(id))) {
    visibleCollapsedChecklistIds.value = visible;
  }
}

/** Track animated viewport resizing when ResizeObserver is unavailable. */
function scheduleCollapsedChecklistUpdate() {
  if (checklistResizeFrame !== undefined) window.cancelAnimationFrame(checklistResizeFrame);
  const deadline = window.performance.now() + 350;
  const update = () => {
    updateVisibleCollapsedChecklists();
    if (!checklistResizeObserver && !props.isExpanded && window.performance.now() < deadline) {
      checklistResizeFrame = window.requestAnimationFrame(update);
    } else {
      checklistResizeFrame = undefined;
    }
  };
  checklistResizeFrame = window.requestAnimationFrame(update);
}

watch(
  () => [props.isExpanded, props.isMobile, draggableChecklists.value] as const,
  () => void nextTick(updateVisibleCollapsedChecklists),
  { flush: 'post' }
);

// Set up event listeners for settings menus
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined' && checklistScrollport.value) {
    checklistResizeObserver = new ResizeObserver(updateVisibleCollapsedChecklists);
    checklistResizeObserver.observe(checklistScrollport.value);
    const list = checklistScrollport.value.querySelector(
      '[data-testid="sidebar-checklists-draggable"]'
    );
    if (list) checklistResizeObserver.observe(list);
  }
  window.addEventListener('resize', scheduleCollapsedChecklistUpdate);
  void nextTick(updateVisibleCollapsedChecklists);
  document.addEventListener('click', closeSettingsMenusOnClick);
  document.addEventListener('keydown', handleSettingsKeydown, true);
  window.addEventListener('overflow-menu-open', closeSettingsMenus);
  window.addEventListener('scroll', closeSettingsMenusOnScroll, true);
});

// Clean up event listeners
onUnmounted(() => {
  checklistResizeObserver?.disconnect();
  window.removeEventListener('resize', scheduleCollapsedChecklistUpdate);
  if (checklistResizeFrame !== undefined) window.cancelAnimationFrame(checklistResizeFrame);
  document.removeEventListener('click', closeSettingsMenusOnClick);
  document.removeEventListener('keydown', handleSettingsKeydown, true);
  window.removeEventListener('overflow-menu-open', closeSettingsMenus);
  window.removeEventListener('scroll', closeSettingsMenusOnScroll, true);
});
</script>

<style scoped>
[data-sidebar-label],
[data-sidebar-checklist-label] {
  opacity: 0;
  transition: opacity 150ms ease-in-out;
}
aside[data-expanded='true'] [data-sidebar-label],
aside[data-expanded='true'] [data-sidebar-checklist-label] {
  opacity: 1;
  transition-delay: 150ms;
}
aside[data-expanded='false'] [data-testid='sidebar-checklists-scrollport'] {
  overflow: clip;
}
aside[data-expanded='false'] [data-testid='sidebar-checklists-draggable'] > li > div {
  padding-inline: 0;
}
aside[data-expanded='false'] [data-testid='sidebar-checklists-draggable'] > li > div > button {
  min-width: min(44px, 100%);
}
[data-sidebar-initial] {
  opacity: 1;
  transition: opacity 150ms ease-in-out 300ms;
}
aside[data-expanded='true'] [data-sidebar-initial] {
  opacity: 0;
  transition-delay: 0s;
}
[data-testid='sidebar-templates-dropdown'],
[data-testid='sidebar-language-dropdown'] {
  max-height: min(24rem, calc(100dvh - 8rem));
  overflow-y: auto;
}

@keyframes sidebar-overflow-reveal {
  from {
    opacity: 0;
    visibility: hidden;
  }
  to {
    opacity: 1;
    visibility: visible;
  }
}

@media (prefers-reduced-motion: reduce) {
  aside,
  aside * {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    animation: none !important;
  }
}

@media (any-pointer: coarse), (hover: none), (max-width: 767px) {
  [data-sidebar-delayed-menu] {
    animation: sidebar-overflow-reveal 150ms ease-in-out 300ms both;
  }
  aside[data-expanded='true']
    [data-testid='sidebar-checklists-draggable']
    > li
    > div
    > button.pr-8 {
    padding-right: 0;
  }
  aside[data-expanded='true'] [data-sidebar-checklist-label] {
    max-width: max(0px, calc(100% - 3rem));
  }
  [data-sidebar-control]:hover {
    background-color: transparent;
  }
  [data-testid='sidebar-templates-dropdown'] p,
  [data-testid='sidebar-templates-dropdown'] button,
  [data-testid='sidebar-language-dropdown'] button {
    font-size: 1rem;
  }
}

@media (min-width: 600px) and (any-pointer: coarse), (min-width: 600px) and (hover: none) {
  [data-testid='sidebar-checklists-draggable'] > li > div {
    padding-inline: 0;
  }
  [data-testid='sidebar-checklists-draggable'] > li > div > button {
    padding-left: 0.75rem;
  }
}
/* Checklist drag and drop styles */
.ghost-checklist {
  opacity: 0.3;
  background: var(--ghost-background);
  border: 2px dashed var(--ghost-border);
  border-radius: 0.5rem;
}

.chosen-checklist {
  cursor: grabbing !important;
}

.drag-checklist {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow:
    0 10px 15px -3px var(--shadow-medium),
    0 4px 6px -2px var(--shadow-light);
}
</style>
