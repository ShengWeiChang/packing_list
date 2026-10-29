<!--
================================================================================
File: source/components/TemplateEditor.vue
Description: Isolated in-memory editor for a personal checklist template.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
-->

<template>
  <div>
    <div
      class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-theme-secondary bg-bg-primary p-3"
    >
      <p class="text-sm text-primary">
        {{ $t('template.editingTemplate', { name: template.name }) }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-lg px-3 py-2 text-sm text-secondary hover:bg-interactive-hover"
          type="button"
          :disabled="saving"
          @click="$emit('cancel')"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          class="rounded-lg bg-danger-text px-3 py-2 text-sm text-white hover:opacity-90"
          type="button"
          data-testid="template-editor-delete"
          :disabled="saving"
          @click="$emit('delete', template.id)"
        >
          {{ $t('template.deleteTemplate') }}
        </button>
        <button
          class="rounded-lg bg-theme-primary px-3 py-2 text-sm text-white hover:opacity-90"
          type="button"
          data-testid="template-editor-save"
          :disabled="saving"
          @click="saveTemplate"
        >
          {{ $t('template.saveChanges') }}
        </button>
      </div>
    </div>

    <p
      v-if="saveError"
      class="mb-4 text-sm text-danger-text"
      role="alert"
    >
      {{
        $t(
          errorCode === 'conflict' || errorCode === 'quota' || errorCode === 'lock-unavailable'
            ? `storage.${errorCode}`
            : 'common.saveFailed'
        )
      }}
    </p>

    <div
      :inert="saving || undefined"
      @compositionstart="isComposing = true"
      @compositionend="isComposing = false"
    >
      <Checklist
        :checklist="draftChecklist"
        :categories="draftCategories"
        :items="draftItems"
        :newly-created-item-id="newlyCreatedItemId"
        :newly-created-category-id="newlyCreatedCategoryId"
        :show-dates="false"
        :show-item-filter="false"
        :show-overflow-menu="false"
        :commit-edit-on-blur="true"
        @update:checklist="updateChecklist"
        @create:item="createItem"
        @update:item="updateItem"
        @copy:item="copyItem"
        @delete:item="deleteItem"
        @create:category="createCategory"
        @update:category="updateCategory"
        @copy:category="copyCategory"
        @delete:category="deleteCategory"
        @reorder:categories="reorderCategories"
        @move:item="moveItem"
      />
    </div>
  </div>
</template>

<script setup>
// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { Category } from '../models/Category';
import { Item } from '../models/Item';
import { generateSecureId } from '../utils/helpers.js';
import Checklist from './Checklist.vue';

// ------------------------------------------------------------------------------
// Internationalization (i18n)
// ------------------------------------------------------------------------------

const { t } = useI18n();

// ------------------------------------------------------------------------------
// Props & Emits
// ------------------------------------------------------------------------------

const props = defineProps({
  saving: { type: Boolean, default: false },
  saveError: { type: Boolean, default: false },
  errorCode: { type: String, default: null },
  template: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['cancel', 'delete', 'save']);

// ------------------------------------------------------------------------------
// State
// ------------------------------------------------------------------------------

const draftChecklist = ref(createDraftChecklist(props.template));
const draftCategories = ref([]);
const draftItems = ref([]);
const newlyCreatedItemId = ref(null);
const newlyCreatedCategoryId = ref(null);
const isComposing = ref(false);

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Build the checklist-shaped header state used by Checklist.
 * @param {object} template - Source template
 * @returns {object} Draft checklist header
 */
function createDraftChecklist(template) {
  return {
    id: `template-editor-${template.id}`,
    name: template.name,
    startDate: '',
    endDate: '',
    order: 0,
  };
}

/**
 * Reset the in-memory draft from a template snapshot.
 * @param {object} template - Source template
 */
function loadDraft(template) {
  draftChecklist.value = createDraftChecklist(template);
  draftCategories.value = (template.categories || []).map(
    (category) => new Category({ ...category, checklistId: draftChecklist.value.id })
  );
  draftItems.value = (template.items || []).map(
    (item) =>
      new Item({
        ...item,
        id: generateSecureId('item-'),
        checklistId: draftChecklist.value.id,
        isPacked: false,
        isPending: false,
      })
  );
  newlyCreatedItemId.value = null;
  newlyCreatedCategoryId.value = null;
}

/**
 * Replace an entry in an array by ID.
 * @param {Array<object>} collection - Source collection
 * @param {object} updated - Updated entry
 * @returns {Array<object>} Updated collection
 */
function replaceById(collection, updated) {
  return collection.map((entry) => (entry.id === updated.id ? updated : entry));
}

/** @param {object} checklist - Updated draft header */
function updateChecklist(checklist) {
  draftChecklist.value = checklist;
}

/** @param {string} categoryId - Target category ID */
function createItem(categoryId) {
  const categoryItems = draftItems.value.filter((item) => item.categoryId === categoryId);
  const maxOrder =
    categoryItems.length > 0 ? Math.max(...categoryItems.map((item) => item.order || 0)) : -1;
  const item = new Item({
    name: t('item.defaultName'),
    quantity: 1,
    categoryId,
    checklistId: draftChecklist.value.id,
    order: maxOrder + 1,
  });
  draftItems.value.push(item);
  newlyCreatedItemId.value = item.id;
}

/** @param {object} item - Updated draft item */
function updateItem(item) {
  draftItems.value = replaceById(draftItems.value, item);
  if (newlyCreatedItemId.value === item.id) newlyCreatedItemId.value = null;
}

/** @param {string} itemId - Item ID to copy */
function copyItem(itemId) {
  const source = draftItems.value.find((item) => item.id === itemId);
  if (!source) return;
  const copy = new Item({
    ...source,
    id: generateSecureId('item-'),
    name: `${source.name}${t('common.copySuffix')}`,
    order: source.order + 1,
  });
  draftItems.value.push(copy);
}

/** @param {string} itemId - Item ID to delete */
function deleteItem(itemId) {
  draftItems.value = draftItems.value.filter((item) => item.id !== itemId);
}

/** @param {object} moveData - Item move or reorder payload */
function moveItem(moveData) {
  if (!['move', 'reorder'].includes(moveData.type)) return;
  for (const item of moveData.items || []) updateItem(item);
}

/** Create a category in the draft. */
function createCategory() {
  const maxOrder =
    draftCategories.value.length > 0
      ? Math.max(...draftCategories.value.map((category) => category.order || 0))
      : -1;
  const category = new Category({
    name: t('category.defaultName'),
    checklistId: draftChecklist.value.id,
    order: maxOrder + 1,
  });
  draftCategories.value.push(category);
  newlyCreatedCategoryId.value = category.id;
}

/** @param {object} category - Updated draft category */
function updateCategory(category) {
  draftCategories.value = replaceById(draftCategories.value, category);
  if (newlyCreatedCategoryId.value === category.id) newlyCreatedCategoryId.value = null;
}

/** @param {string} categoryId - Category ID to copy */
function copyCategory(categoryId) {
  const source = draftCategories.value.find((category) => category.id === categoryId);
  if (!source) return;
  const copy = new Category({
    ...source,
    id: generateSecureId('category-'),
    name: `${source.name}${t('common.copySuffix')}`,
    order: source.order + 1,
  });
  draftCategories.value.push(copy);
  const copiedItems = draftItems.value
    .filter((item) => item.categoryId === categoryId)
    .map(
      (item) =>
        new Item({
          ...item,
          id: generateSecureId('item-'),
          categoryId: copy.id,
        })
    );
  draftItems.value.push(...copiedItems);
}

/** @param {string} categoryId - Category ID to delete */
function deleteCategory(categoryId) {
  draftCategories.value = draftCategories.value.filter((category) => category.id !== categoryId);
  draftItems.value = draftItems.value.filter((item) => item.categoryId !== categoryId);
}

/** @param {Array<object>} categories - Reordered draft categories */
function reorderCategories(categories) {
  draftCategories.value = categories;
}

/** Emit a storage-safe template snapshot. */
function saveTemplate() {
  if (props.saving || isComposing.value) return;
  emit('save', {
    ...props.template,
    name: draftChecklist.value.name,
    categories: draftCategories.value.map(({ id, name, order }) => ({ id, name, order })),
    items: draftItems.value.map(({ name, quantity, categoryId, order }) => ({
      name,
      quantity,
      categoryId,
      order,
    })),
  });
}

watch(
  () => props.template.id,
  () => loadDraft(props.template),
  { immediate: true }
);

watch(
  () => props.template.name,
  (name) => {
    draftChecklist.value = { ...draftChecklist.value, name };
  }
);
</script>
