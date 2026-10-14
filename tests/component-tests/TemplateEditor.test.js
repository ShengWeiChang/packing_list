/*
================================================================================
File: tests/component-tests/TemplateEditor.test.js
Description: Component tests for the isolated personal template editor.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import TemplateEditor from '../../source/components/TemplateEditor.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      common: { cancel: 'Cancel', copySuffix: ' (Copy)' },
      template: {
        editingTemplate: 'Editing template: {name}',
        deleteTemplate: 'Delete template',
        saveChanges: 'Save changes',
      },
      item: { defaultName: 'New Item' },
      category: { defaultName: 'New Category' },
    },
  },
});

const template = {
  id: 'template-1',
  name: 'Weekend',
  order: 0,
  categories: [{ id: 'category-1', name: 'Clothes', order: 0 }],
  items: [{ name: 'Shirt', quantity: 2, categoryId: 'category-1', order: 0 }],
};

/** @returns {import('@vue/test-utils').VueWrapper} Mounted template editor */
function createWrapper() {
  return shallowMount(TemplateEditor, {
    props: { template },
    global: { plugins: [i18n] },
  });
}

describe('TemplateEditor', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Editor Rendering
  // ---------------------------------------------------------------------------

  // Test Case 1: Should configure Checklist without dates or an overflow menu
  it('configures Checklist without dates or checklist overflow menu', () => {
    const checklist = createWrapper().findComponent({ name: 'Checklist' });

    expect(checklist.props('showDates')).toBe(false);
    expect(checklist.props('showOverflowMenu')).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Template Persistence
  // ---------------------------------------------------------------------------

  // Test Case 2: Should emit a storage-safe edited template snapshot
  it('emits an edited template snapshot without runtime checklist fields', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });
    await checklist.vm.$emit('update:checklist', {
      ...checklist.props('checklist'),
      name: 'Updated Weekend',
    });
    await checklist.vm.$emit('create:item', 'category-1');
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.name).toBe('Updated Weekend');
    expect(saved.items).toHaveLength(2);
    expect(saved.items[0]).toEqual({
      name: 'Shirt',
      quantity: 2,
      categoryId: 'category-1',
      order: 0,
    });
    expect(saved.items[0]).not.toHaveProperty('checklistId');
    expect(saved.items[0]).not.toHaveProperty('isPacked');
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Editor Actions
  // ---------------------------------------------------------------------------

  // Test Case 3: Should emit delete without saving the draft
  it('emits delete without saving the draft', async () => {
    const wrapper = createWrapper();
    await wrapper.get('[data-testid="template-editor-delete"]').trigger('click');

    expect(wrapper.emitted('delete')).toEqual([['template-1']]);
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  // Test Case 4: Should discard the draft when cancel is selected
  it('discards the draft when cancel is selected', async () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  // Test Case 5: Should create draft items and categories without persisting them
  it('creates draft items and categories without persisting them', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });

    await checklist.vm.$emit('create:item', 'category-1');
    await checklist.vm.$emit('create:category');
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    const saved = wrapper.emitted('save')[0][0];
    expect(saved.items).toHaveLength(2);
    expect(saved.items[1]).toMatchObject({ name: 'New Item', categoryId: 'category-1', order: 1 });
    expect(saved.categories).toHaveLength(2);
    expect(saved.categories[1]).toMatchObject({ name: 'New Category', order: 1 });
  });

  // Test Case 6: Should copy and delete categories with their draft items
  it('copies and deletes categories with their draft items', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });

    await checklist.vm.$emit('copy:category', 'category-1');
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');
    const copied = wrapper.emitted('save')[0][0];
    const copiedCategory = copied.categories.find((category) => category.id !== 'category-1');

    expect(copiedCategory.name).toBe('Clothes (Copy)');
    expect(copied.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: copiedCategory.id, name: 'Shirt' }),
      ])
    );

    await checklist.vm.$emit('delete:category', 'category-1');
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');
    const deleted = wrapper.emitted('save')[1][0];

    expect(deleted.categories).toEqual([copiedCategory]);
    expect(deleted.items).toEqual([
      expect.objectContaining({ categoryId: copiedCategory.id, name: 'Shirt' }),
    ]);
  });

  // Test Case 7: Should update, copy, move and delete draft items in memory
  it('updates, copies, moves and deletes draft items in memory', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });
    const secondCategory = { id: 'category-2', name: 'Toiletries', order: 1 };

    await checklist.vm.$emit('reorder:categories', [template.categories[0], secondCategory]);
    await checklist.vm.$emit('update:item', {
      id: checklist.props('items')[0].id,
      name: 'Updated Shirt',
      quantity: 3,
      categoryId: 'category-1',
      order: 0,
    });
    await checklist.vm.$emit('copy:item', checklist.props('items')[0].id);
    const copiedItemId = checklist.props('items')[1].id;
    await checklist.vm.$emit('move:item', {
      type: 'move',
      item: { ...checklist.props('items')[0], categoryId: 'category-1' },
      newCategoryId: 'category-2',
      reorderedItems: [],
    });
    await checklist.vm.$emit('delete:item', copiedItemId);
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    expect(wrapper.emitted('save')[0][0]).toMatchObject({
      categories: [
        { id: 'category-1', name: 'Clothes', order: 0 },
        { id: 'category-2', name: 'Toiletries', order: 1 },
      ],
      items: [{ name: 'Updated Shirt', quantity: 3, categoryId: 'category-2', order: 0 }],
    });
  });

  // Test Case 8: Should reset the in-memory draft when the selected template changes
  it('resets the in-memory draft when the selected template changes', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });
    await checklist.vm.$emit('create:item', 'category-1');

    await wrapper.setProps({
      template: { id: 'template-2', name: 'Beach', order: 0, categories: [], items: [] },
    });
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    expect(wrapper.emitted('save')[0][0]).toMatchObject({
      id: 'template-2',
      name: 'Beach',
      categories: [],
      items: [],
    });
  });

  // Test Case 9: Should finish auto-edit state after updating newly created entries
  it('finishes auto-edit state after updating newly created entries', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });

    await checklist.vm.$emit('create:item', 'category-1');
    const newItem = checklist.props('items')[1];
    expect(checklist.props('newlyCreatedItemId')).toBe(newItem.id);
    await checklist.vm.$emit('update:item', { ...newItem, name: 'Socks' });
    expect(checklist.props('newlyCreatedItemId')).toBeNull();

    await checklist.vm.$emit('create:category');
    const newCategory = checklist.props('categories')[1];
    expect(checklist.props('newlyCreatedCategoryId')).toBe(newCategory.id);
    await checklist.vm.$emit('update:category', { ...newCategory, name: 'Documents' });
    expect(checklist.props('newlyCreatedCategoryId')).toBeNull();
  });

  // Test Case 10: Should apply same-category item reorder payloads
  it('applies same-category item reorder payloads', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });
    const reorderedItem = { ...checklist.props('items')[0], order: 4 };

    await checklist.vm.$emit('move:item', { type: 'reorder', items: [reorderedItem] });
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    expect(wrapper.emitted('save')[0][0].items[0].order).toBe(4);
  });

  // Test Case 11: Should ignore copy requests for missing draft entries
  it('ignores copy requests for missing draft entries', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });

    await checklist.vm.$emit('copy:item', 'missing-item');
    await checklist.vm.$emit('copy:category', 'missing-category');
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    expect(wrapper.emitted('save')[0][0]).toMatchObject({
      categories: template.categories,
      items: [expect.objectContaining({ name: 'Shirt' })],
    });
  });

  // Test Case 12: Should move an item without an optional reordered-items payload
  it('moves an item without an optional reordered-items payload', async () => {
    const wrapper = createWrapper();
    const checklist = wrapper.findComponent({ name: 'Checklist' });

    await checklist.vm.$emit('move:item', {
      type: 'move',
      item: checklist.props('items')[0],
      newCategoryId: 'category-2',
    });
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    expect(wrapper.emitted('save')[0][0].items[0].categoryId).toBe('category-2');
  });

  // Test Case 13: Should assign zero order when creating the first category and item
  it('assigns zero order when creating the first category and item', async () => {
    const wrapper = shallowMount(TemplateEditor, {
      props: {
        template: { id: 'template-empty', name: 'Empty', categories: [], items: [] },
      },
      global: { plugins: [i18n] },
    });
    const checklist = wrapper.findComponent({ name: 'Checklist' });

    await checklist.vm.$emit('create:category');
    const newCategory = checklist.props('categories')[0];
    await checklist.vm.$emit('create:item', newCategory.id);
    await wrapper.get('[data-testid="template-editor-save"]').trigger('click');

    expect(wrapper.emitted('save')[0][0]).toMatchObject({
      categories: [expect.objectContaining({ order: 0 })],
      items: [expect.objectContaining({ categoryId: newCategory.id, order: 0 })],
    });
  });
});
