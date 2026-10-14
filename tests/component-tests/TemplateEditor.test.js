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
});
