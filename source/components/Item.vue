<!--
================================================================================
File: source/components/Item.vue
Description: Item component - displays a single packing item with inline edit
             and packing checkbox behavior.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2025-09-19
================================================================================
-->

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <div
    ref="itemRoot"
    :class="[
      'group cursor-grab rounded-md px-0 py-0.5 transition-all duration-200',
      categoryCompleted ? 'bg-success-state-bg text-success-state-complete' : 'bg-white',
      isDragging ? 'scale-105 cursor-grabbing opacity-50 shadow-lg' : '',
      { 'touch-item': touchPresentation },
      { 'desktop-item-inset': !touchControls },
    ]"
    data-testid="item-row"
    :data-attention="actionsOpen ? 'true' : undefined"
    :data-completed="categoryCompleted ? 'true' : undefined"
    :data-drag-hover-suppressed="suppressDragHover ? 'true' : undefined"
    :data-item-id="item.id"
    :data-inline-item-id="item.id"
    @keydown.esc="closeActionsFromKeyboard"
    @mouseenter="handleMouseEnter"
    @mouseleave="isHovered = false"
    @focusin="handleFocusIn"
    @focusout="isHovered = false"
  >
    <div class="flex items-center">
      <label
        :for="`item-${item.id}-packed`"
        class="touch-target mr-1 flex size-9 flex-none items-center justify-center rounded-lg focus-within:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-interactive-focus has-[:focus-visible]:ring-offset-1 md:mr-2 md:size-6"
      >
        <input
          :id="`item-${item.id}-packed`"
          :checked="isItemPacked"
          :name="`item-${item.id}-packed`"
          type="checkbox"
          data-testid="item-checkbox"
          :aria-label="$t('item.togglePacked')"
          :aria-disabled="isSavingPacked || undefined"
          :class="[
            'size-5 flex-none shrink-0 cursor-pointer focus:outline-none md:size-4',
            isItemPacked
              ? 'border-success-state-border accent-success-state-accent'
              : 'border-border-color-medium accent-control-accent',
          ]"
          :style="isItemPacked ? { accentColor: 'var(--theme-primary)' } : {}"
          @change="handlePackedChange"
        />
      </label>

      <!-- Item name - editable when in edit mode -->
      <div
        class="min-w-0 grow"
        @blur="handleEditBlur"
        @focusout="handleEditBlur"
      >
        <input
          v-if="isEditing"
          :id="`item-${item.id}-name`"
          ref="editInput"
          v-model="editedName"
          :disabled="isSavingEdit"
          :name="`item-${item.id}-name`"
          :aria-label="$t('item.name')"
          data-testid="item-edit-input"
          :class="[
            'w-full bg-transparent px-1 py-0.5 text-lg leading-snug focus:outline-none md:text-base',
            {
              'md:!text-lg': touchControls,
              'text-secondary line-through': item.isPacked && !categoryCompleted,
              'text-control-accent line-through': item.isPacked && categoryCompleted,
            },
          ]"
          style="border-radius: 0; box-shadow: inset 0 -2px 0 0 var(--interactive-focus)"
          @keydown.enter="handleEnterKey"
          @keyup.escape="cancelEdit"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        />

        <span
          v-else
          :class="[
            'touch-name block cursor-pointer rounded-lg px-1 py-0.5 text-lg leading-snug focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:text-base',
            {
              'md:!text-lg': touchControls,
              'text-secondary line-through': item.isPacked && !categoryCompleted,
              'text-control-accent line-through': item.isPacked && categoryCompleted,
            },
          ]"
          style="word-break: break-word; overflow-wrap: break-word"
          role="button"
          tabindex="0"
          data-testid="item-name"
          @click="startEdit"
          @keydown.enter.prevent="startEdit"
          @keydown.space.prevent="startEdit"
        >
          {{ item.name }}
        </span>
        <p
          v-if="editSaveFailed"
          class="text-sm text-danger-text"
          role="alert"
        >
          {{
            $t(
              editErrorCode === 'conflict' ||
                editErrorCode === 'quota' ||
                editErrorCode === 'lock-unavailable'
                ? `storage.${editErrorCode}`
                : 'common.saveFailed'
            )
          }}
        </p>
      </div>

      <!-- Quantity control - Amazon-style stepper -->
      <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
      <div
        v-if="!touchPresentation"
        class="relative ml-1 sm:ml-1.5"
        :class="[
          isEditing || item.quantity > 1 || (item.quantity === 1 && isHovered)
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none absolute opacity-0 md:static',
          'focus-within:pointer-events-auto focus-within:static focus-within:opacity-100', // Ensure visible when children have focus
        ]"
        data-testid="item-quantity-controls"
        @mouseenter="isQuantityHovered = true"
        @mouseleave="isQuantityHovered = false"
        @focusin="isQuantityHovered = true"
        @focusout="isQuantityHovered = false"
      >
        <!-- Quantity stepper: [-] [x5] [+] -->
        <div class="flex items-center gap-1">
          <!-- Decrement button / Delete button (when quantity = 1) -->
          <button
            type="button"
            class="flex size-9 flex-none items-center justify-center rounded-lg text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:size-6"
            :class="[
              buttonVisibilityClass,
              categoryCompleted ? 'hover:bg-success-state-control-hover' : 'hover:bg-control-hover',
            ]"
            data-testid="item-quantity-decrement"
            :aria-label="item.quantity === 1 ? $t('common.delete') : $t('item.decreaseQuantity')"
            :title="item.quantity === 1 ? $t('common.delete') : $t('item.decreaseQuantity')"
            @click.stop="item.quantity === 1 ? handleDelete() : decrementQuantity()"
            @mousedown.prevent
          >
            <!-- Trash icon when quantity is 1 -->
            <AppIcon
              v-if="item.quantity === 1"
              name="delete"
              size="inline"
            />

            <!-- Minus icon when quantity > 1 -->
            <AppIcon
              v-else
              name="decrease"
              size="compact"
            />
          </button>

          <!-- Quantity display -->
          <div
            class="flex h-9 w-8 items-center justify-center rounded-lg px-1 text-xs font-semibold text-secondary transition-colors md:h-6"
            :class="{ '!text-control-accent': categoryCompleted }"
            data-testid="item-quantity-value"
          >
            <span class="mr-0.5">x</span>
            <span>{{ item.quantity }}</span>
          </div>

          <!-- Increment button -->
          <button
            type="button"
            class="flex size-9 flex-none items-center justify-center rounded-lg text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 md:size-6"
            :class="[
              buttonVisibilityClass,
              categoryCompleted ? 'hover:bg-success-state-control-hover' : 'hover:bg-control-hover',
            ]"
            data-testid="item-quantity-increment"
            :aria-label="$t('item.increaseQuantity')"
            :title="$t('item.increaseQuantity')"
            @click.stop="incrementQuantity"
            @mousedown.prevent
          >
            <AppIcon
              name="add"
              size="compact"
            />
          </button>
        </div>
      </div>

      <!-- To-buy icon button -->
      <button
        v-if="!touchPresentation"
        type="button"
        :class="[
          'relative ml-1.5 flex size-9 flex-none items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive-focus focus-visible:ring-offset-1 sm:ml-2 md:size-6',
          categoryCompleted ? 'hover:bg-success-state-control-hover' : 'hover:bg-control-hover',
          item.isPending ? 'text-pending-foreground' : 'text-secondary hover:text-primary',
          pendingButtonVisibilityClass,
          'focus:pointer-events-auto focus:static focus:opacity-100', // Ensure visible on focus
        ]"
        data-testid="item-pending-toggle"
        :title="item.isPending ? $t('item.markedAsPending') : $t('item.markAsPending')"
        :aria-label="item.isPending ? $t('item.markedAsPending') : $t('item.markAsPending')"
        :aria-pressed="item.isPending"
        @click.stop="togglePending"
        @mousedown.prevent
      >
        <AppIcon
          :name="item.isPending ? 'clipboardCheck' : 'clipboard'"
          size="inline"
        />
      </button>

      <span
        v-if="touchPresentation && item.isPending"
        class="px-1 text-pending-foreground"
        :aria-label="$t('item.markedAsPending')"
        data-testid="item-pending-summary"
        ><AppIcon
          name="clipboardCheck"
          size="inline"
      /></span>
      <span
        v-if="touchPresentation && (item.quantity > 1 || item.isPending)"
        class="touch-quantity-summary px-1 text-sm font-semibold text-secondary"
        :class="{ '!text-control-accent': categoryCompleted }"
        :aria-hidden="item.quantity > 1 ? undefined : 'true'"
        data-testid="item-quantity-summary"
        >{{ item.quantity > 1 ? `×${item.quantity}` : '' }}</span
      >
      <!-- Overflow menu -->
      <OverflowMenu
        ref="actionsMenu"
        :inline-actions="touchPresentation"
        :inline-expanded="actionsOpen"
        :inline-controls="`item-${item.id}-actions`"
        :touch-minimal="touchPresentation"
        :success-surface="categoryCompleted"
        :item-id="item.id"
        :force-visible="isHovered"
        :use-group-hover="false"
        :is-editing="isEditing"
        menu-type="item"
        alignment="left"
        class="ml-1"
        :class="{ 'touch-item-menu': touchPresentation, 'md:mr-1': !touchControls }"
        @toggle-inline="toggleActions"
        @edit="startEdit"
        @copy="$emit('copy:item', item.id)"
        @delete="handleDelete"
        @confirm-edit="saveEdit"
      />
    </div>
    <Transition
      name="item-actions"
      @before-leave="hideInlineActions"
    >
      <div
        v-if="touchPresentation && actionsOpen"
        class="grid grid-rows-[1fr]"
        data-height-motion
        :inert="!actionsOpen"
        :aria-hidden="!actionsOpen"
      >
        <div class="min-h-0 overflow-hidden">
          <div
            :id="`item-${item.id}-actions`"
            class="item-inline-actions flex flex-wrap items-center justify-between gap-1 border-t border-border-color-light px-2"
            role="group"
            :aria-label="$t('common.moreOptions')"
            data-testid="item-inline-actions"
          >
            <div class="inline-action-group inline-quantity-group">
              <button
                type="button"
                class="inline-action"
                data-testid="item-quantity-decrement"
                :aria-label="
                  item.quantity === 1 ? $t('common.delete') : $t('item.decreaseQuantity')
                "
                @pointerdown.prevent
                @click="runInlineAction(item.quantity === 1 ? handleDelete : decrementQuantity)"
              >
                <AppIcon
                  :name="item.quantity === 1 ? 'delete' : 'decrease'"
                  size="inline"
                />
              </button>
              <span
                class="inline-quantity-value"
                data-testid="item-quantity-value"
                >×{{ item.quantity }}</span
              >
              <button
                type="button"
                class="inline-action"
                data-testid="item-quantity-increment"
                :aria-label="$t('item.increaseQuantity')"
                @pointerdown.prevent
                @click="runInlineAction(incrementQuantity)"
              >
                <AppIcon
                  name="add"
                  size="inline"
                />
              </button>
            </div>
            <div class="inline-action-group">
              <button
                type="button"
                class="inline-action"
                :class="{ 'text-pending-foreground': item.isPending }"
                data-testid="item-pending-toggle"
                :aria-label="item.isPending ? $t('item.markedAsPending') : $t('item.markAsPending')"
                :aria-pressed="item.isPending"
                @pointerdown.prevent
                @click="runInlineAction(togglePending)"
              >
                <AppIcon
                  :name="item.isPending ? 'clipboardCheck' : 'clipboard'"
                  size="inline"
                />
              </button>
              <button
                type="button"
                class="inline-action"
                data-testid="item-action-edit"
                :aria-label="$t('item.editName')"
                @pointerdown.prevent
                @click="startEdit"
              >
                <AppIcon
                  name="edit"
                  size="inline"
                />
              </button>
              <button
                type="button"
                class="inline-action"
                data-testid="item-action-copy"
                :aria-label="$t('common.copy')"
                @pointerdown.prevent
                @click="runInlineAction(() => $emit('copy:item', item.id))"
              >
                <AppIcon
                  name="copy"
                  size="inline"
                />
              </button>
              <button
                type="button"
                class="inline-action text-danger-text"
                data-testid="item-action-delete"
                :aria-label="$t('common.delete')"
                @pointerdown.prevent
                @click="runInlineAction(handleDelete)"
              >
                <AppIcon
                  name="delete"
                  size="inline"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import type { PropType } from 'vue';
import { computed, nextTick, onBeforeUnmount, onUnmounted, ref, watch } from 'vue';

import type { ItemDTO } from '../models/contracts';
import { Item } from '../models/Item';
import { focusEditingInput } from '../utils/focusEditingInput';
import AppIcon from './AppIcon.vue';
import type {
  EditCancelled,
  RetainDraft,
  SaveItemEdit,
  UpdateItemAction,
} from './componentContracts';
import OverflowMenu from './OverflowMenu.vue';

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

// Props
const props = defineProps({
  touchControls: { type: Boolean, default: false },
  actionsOpen: { type: Boolean, default: false },
  commitEditOnBlur: { type: Boolean, default: false },
  retainDraft: { type: Function as PropType<RetainDraft | null>, default: null },
  editCancelled: { type: Function as PropType<EditCancelled | null>, default: null },
  saveItemEdit: { type: Function as PropType<SaveItemEdit | null>, default: null },
  editErrorCode: { type: String as PropType<string | null>, default: null },
  updateItemAction: { type: Function as PropType<UpdateItemAction | null>, default: null },
  item: {
    type: Object as PropType<Readonly<ItemDTO>>,
    required: true,
    validator: (value: Record<string, unknown>) => {
      // Validate that the object has the required properties for an item
      return (
        value &&
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.quantity === 'number' &&
        typeof value.categoryId === 'string' &&
        typeof value.isPacked === 'boolean' &&
        typeof value.isPending === 'boolean' &&
        typeof value.checklistId === 'string'
      );
    },
  },
  newlyCreatedItemId: {
    type: String as PropType<string | null>,
    default: null,
  },
  categoryCompleted: {
    type: Boolean,
    default: false,
  },
  isDragging: {
    type: Boolean,
    default: false,
  },
  suppressDragHover: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits<{
  'toggle-actions': [id: string];
  'close-actions': [];
  'update:item': [item: ItemDTO, expected?: ItemDTO];
  'copy:item': [id: string];
  'delete:item': [id: string];
}>();

// ------------------------------------------------------------------------------
// States
// ------------------------------------------------------------------------------

const actionsMenu = ref<InstanceType<typeof OverflowMenu> | null>(null);
const itemRoot = ref<HTMLElement | null>(null);
const touchActivated = ref(false);
const touchPresentation = computed(() => props.touchControls || touchActivated.value);
const isEditing = ref(false);
const isSavingEdit = ref(false);
const isSavingPacked = ref(false);
const editSaveFailed = ref(false);
const isHovered = ref(false);
watch(
  () => props.suppressDragHover,
  (suppressed) => {
    if (suppressed && !itemRoot.value?.querySelector(':focus-visible')) isHovered.value = false;
  }
);
const isQuantityHovered = ref(false);
const editedName = ref('');
let editBaseline: ItemDTO | null = null;
const editInput = ref<HTMLInputElement | null>(null);
const isComposing = ref(false);
let cleanupEditingFocus = () => {};
let inlineActionInProgress = false;
let pendingEditSave: Promise<void> | null = null;
let pendingCompositionAction: (() => void) | null = null;

// ------------------------------------------------------------------------------
// Computed
// ------------------------------------------------------------------------------

/**
 * Button visibility classes for mobile/desktop
 * Mobile: hidden when not hovered/editing (completely removed from layout)
 * Desktop: invisible when not hovered/editing (preserves layout space)
 */
const buttonVisibilityClass = computed(() => {
  const shouldShow = isHovered.value || isEditing.value;
  return shouldShow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';
});

/**
 * Pending button visibility (includes isPending state)
 */
const pendingButtonVisibilityClass = computed(() => {
  const shouldShow = props.item.isPending || isHovered.value || isEditing.value;
  return shouldShow
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none absolute md:static';
});

const isItemPacked = computed({
  get: () => {
    return props.item.isPacked;
  },
  set: (newValue) => {
    const updatedItem = new Item({
      id: props.item.id,
      name: props.item.name,
      quantity: props.item.quantity,
      categoryId: props.item.categoryId,
      isPacked: newValue,
      isPending: newValue ? false : props.item.isPending, // Auto-clear isPending when packed
      checklistId: props.item.checklistId,
      order: props.item.order,
    });
    emit('update:item', updatedItem);
  },
});

/** Keep the checkbox at its committed value until the update is reflected in props.
 * @param {Event} event - Checkbox change event.
 */
async function handlePackedChange(event: Event) {
  if (isSavingPacked.value) {
    (event.target as HTMLInputElement).checked = props.item.isPacked;
    return;
  }
  const requested = (event.target as HTMLInputElement).checked;
  (event.target as HTMLInputElement).checked = props.item.isPacked;
  if (!props.updateItemAction) {
    isItemPacked.value = requested;
    return;
  }
  isSavingPacked.value = true;
  try {
    await props.updateItemAction(
      new Item({
        ...props.item,
        isPacked: requested,
        isPending: requested ? false : props.item.isPending,
      })
    );
  } finally {
    isSavingPacked.value = false;
  }
}

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

// ---------- UI Handlers ----------

// Handle mouse enter - prevent hover state on touch devices to avoid accidental button clicks
const handleMouseEnter = () => {
  // Only enable hover state if the device supports hover (i.e., has a mouse/pointer)
  if (!props.suppressDragHover && window.matchMedia('(hover: hover)').matches) {
    isHovered.value = true;
  }
};

/** Reveal keyboard controls only for keyboard-visible focus. */
function handleFocusIn(event: FocusEvent) {
  if (event.target instanceof Element && event.target.matches(':focus-visible')) {
    isHovered.value = true;
  }
}

/** Open the controlled inline region only after the current edit can finish. */
async function toggleActions() {
  if (isEditing.value) {
    if (isComposing.value || isSavingEdit.value) return;
    await saveEdit();
    if (isEditing.value) return;
  }
  touchActivated.value = true;
  emit('toggle-actions', props.item.id);
}

/** Remove closing controls from focus and accessibility while the height animates out. */
function hideInlineActions(element: Element) {
  if (element instanceof HTMLElement) element.inert = true;
  element.setAttribute('aria-hidden', 'true');
}

/** Only Escape inside this non-modal item restores focus to its own trigger. */
function closeActionsFromKeyboard(event: KeyboardEvent) {
  if (!props.actionsOpen || isEditing.value) return;
  event.stopPropagation();
  emit('close-actions');
  actionsMenu.value?.focusTrigger();
}

// ---------- Editing Functions ----------

/**
 * Handle composition start (IME input begins)
 */
function handleCompositionStart() {
  isComposing.value = true;
}

/**
 * Handle composition end (IME input completes)
 */
function handleCompositionEnd() {
  isComposing.value = false;
  const action = pendingCompositionAction;
  pendingCompositionAction = null;
  if (action) {
    void nextTick(() => runInlineAction(action));
    return;
  }
  if (props.commitEditOnBlur && isEditing.value && document.activeElement !== editInput.value)
    saveEdit();
}

/**
 * Handle Enter key press - only save if not in IME composition
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleEnterKey(event: KeyboardEvent) {
  event.preventDefault();
  // If currently composing (e.g., selecting Chinese characters), return early
  if (isComposing.value) {
    return;
  }
  // Otherwise, save the edit
  saveEdit();
}

/**
 * Save edit when focus moves outside the edit area
 * Includes IME composition check for defensive programming
 * @param {FocusEvent} event - Focus change from the edit area.
 */
function handleEditBlur(event: FocusEvent) {
  if (props.commitEditOnBlur) {
    if (event.target !== editInput.value) return;
    if (isEditing.value && !isComposing.value) saveEdit();
    return;
  }
  // Use a small timeout to allow focus to move to another element
  setTimeout(() => {
    // Check if focus is still within the name input
    const activeElement = document.activeElement;
    const isStillEditing = activeElement === editInput.value;

    // Only save if not editing and not in IME composition
    if (!isStillEditing && isEditing.value && !isComposing.value && !editSaveFailed.value) {
      saveEdit();
    }
  }, 50); // 50ms: balance between focus transfer reliability and user responsiveness
}

/**
 * Enter edit mode and focus on item name input
 */
async function startEdit() {
  if (isEditing.value || isSavingEdit.value) {
    editInput.value?.focus({ preventScroll: true });
    return;
  }
  cleanupEditingFocus();
  isEditing.value = true;
  editSaveFailed.value = false;
  editBaseline = { ...props.item };
  editedName.value = props.item.name;

  await nextTick();
  cleanupEditingFocus = focusEditingInput(editInput.value);
}

/** Save an active draft before executing another inline action. */
async function runInlineAction(action: () => void) {
  if (inlineActionInProgress) return;
  if (isComposing.value) {
    pendingCompositionAction ??= action;
    editInput.value?.blur();
    return;
  }
  inlineActionInProgress = true;
  try {
    if (isEditing.value) {
      await saveEdit();
      if (isEditing.value) return;
      await nextTick();
    }
    action();
  } finally {
    inlineActionInProgress = false;
  }
}

/**
 * Save changes to item if name was modified
 */
async function saveEdit() {
  if (pendingEditSave) return pendingEditSave;
  pendingEditSave = performSaveEdit();
  try {
    await pendingEditSave;
  } finally {
    pendingEditSave = null;
  }
}

/** Commit the current edit once, preserving the draft on failure. */
async function performSaveEdit() {
  if (isSavingEdit.value) return;
  cleanupEditingFocus();
  if (!editBaseline) return;
  const hasNameChanged = editedName.value.trim() && editedName.value !== editBaseline.name;

  if (hasNameChanged) {
    const updatedItem = new Item({
      ...editBaseline,
      name: editedName.value.trim() || editBaseline.name,
    });
    if (props.saveItemEdit) {
      const restoreFocus = document.activeElement === editInput.value;
      isSavingEdit.value = true;
      editSaveFailed.value = false;
      try {
        if (!(await props.saveItemEdit(updatedItem, editBaseline))) {
          editSaveFailed.value = true;
          isSavingEdit.value = false;
          await nextTick();
          if (restoreFocus)
            cleanupEditingFocus = focusEditingInput(editInput.value, { select: false });
          return;
        }
      } finally {
        isSavingEdit.value = false;
      }
    } else {
      emit('update:item', updatedItem, editBaseline);
    }
  }
  if (editSaveFailed.value) {
    editSaveFailed.value = false;
    props.editCancelled?.('item', props.item.id);
  }
  isEditing.value = false;
}

/**
 * Cancel editing and restore original values
 */
function cancelEdit() {
  if (isSavingEdit.value) return;
  pendingCompositionAction = null;
  cleanupEditingFocus();
  editSaveFailed.value = false;
  props.editCancelled?.('item', props.item.id);
  isEditing.value = false;
  editedName.value = props.item.name;
}

// ---------- Item Actions ----------

/**
 * Toggle the to-buy state of the item
 */
function togglePending() {
  const newPending = !props.item.isPending;
  const updatedItem = new Item({
    ...props.item,
    isPending: newPending,
    // If user marks as pending, automatically clear packed state to avoid contradiction
    isPacked: newPending ? false : props.item.isPacked,
  });
  emit('update:item', updatedItem);
}

/**
 * Increment item quantity
 */
function incrementQuantity() {
  const updatedItem = new Item({
    ...props.item,
    quantity: props.item.quantity + 1,
  });
  emit('update:item', updatedItem);
}

/**
 * Decrement item quantity (minimum 1)
 */
function decrementQuantity() {
  if (props.item.quantity <= 1) return;

  const updatedItem = new Item({
    ...props.item,
    quantity: props.item.quantity - 1,
  });
  emit('update:item', updatedItem);
}

/**
 * Emit delete event for this item
 */
function handleDelete() {
  emit('delete:item', props.item.id);
}

// ------------------------------------------------------------------------------
// Watchers
// ------------------------------------------------------------------------------

// Keep a touch interaction stable until it closes, then restore the device default.
watch(
  () => props.actionsOpen,
  (open) => {
    if (!open) touchActivated.value = false;
  }
);

// Watch for newly created items and auto-start edit
watch(
  () => props.newlyCreatedItemId,
  (newId) => {
    if (newId === props.item.id) {
      nextTick(() => {
        startEdit();
      });
    }
  }
);

onBeforeUnmount(() => {
  if (isEditing.value && editBaseline && editedName.value !== editBaseline.name) {
    props.retainDraft?.({ name: editedName.value });
  }
  if (editSaveFailed.value) props.editCancelled?.('item', props.item.id);
});
onUnmounted(() => cleanupEditingFocus());
</script>

<style scoped>
.item-actions-enter-active,
.item-actions-leave-active {
  transition: grid-template-rows 300ms ease-in-out;
}
.item-actions-enter-from,
.item-actions-leave-to {
  grid-template-rows: 0fr;
}
@media (prefers-reduced-motion: reduce) {
  .item-actions-enter-active,
  .item-actions-leave-active {
    transition: none;
  }
}

[data-attention='true'] {
  background-color: var(--interactive-hover);
}
[data-attention='true'][data-completed='true'] {
  background-color: var(--success-attention);
}
@media (hover: hover) {
  [data-testid='item-row']:not([data-drag-hover-suppressed='true']) .touch-name:hover,
  .inline-action:hover {
    background-color: var(--control-hover);
  }
  [data-testid='item-row'][data-completed='true']:not([data-drag-hover-suppressed='true'])
    .touch-name:hover,
  [data-testid='item-row'][data-completed='true'] .inline-action:hover {
    background-color: var(--success-control-hover);
  }
  [data-testid='item-row']:not([data-drag-hover-suppressed='true']):hover {
    background-color: var(--interactive-hover);
  }
  [data-testid='item-row'][data-completed='true']:not([data-drag-hover-suppressed='true']):hover {
    background-color: var(--success-attention);
  }
}
.touch-item {
  padding-right: 0;
  padding-left: 0;
}
@media (min-width: 768px) {
  .group.desktop-item-inset {
    padding-left: 0.5rem;
  }
}
.touch-item-menu {
  margin-left: 0.5rem;
}
.touch-quantity-summary {
  display: flex;
  width: 2.75rem;
  flex: none;
  justify-content: center;
}
.inline-action {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 0.5rem;
}
.inline-action-group {
  display: flex;
  align-items: center;
  gap: 0;
}
.inline-quantity-value {
  min-width: 2rem;
  text-align: center;
  font-size: 1rem;
  color: var(--text-secondary);
}
.inline-action:focus-visible {
  outline: 2px solid var(--interactive-focus);
  outline-offset: 2px;
}
@media (max-width: 340px) {
  .item-inline-actions {
    justify-content: flex-start;
  }
}
</style>
