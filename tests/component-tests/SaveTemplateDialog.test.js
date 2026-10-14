/*
================================================================================
File: tests/component-tests/SaveTemplateDialog.test.js
Description: Component tests for naming and saving personal templates.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import SaveTemplateDialog from '../../source/components/SaveTemplateDialog.vue';

// -----------------------------------------------------------------------------
// Test Setup
// -----------------------------------------------------------------------------

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      common: { cancel: 'Cancel', save: 'Save' },
      template: {
        saveAsTemplate: 'Save as Template',
        templateName: 'Template Name',
        nameRequired: 'Enter a template name.',
      },
    },
  },
});

/**
 * @param {object} props - Component props
 * @returns {import('@vue/test-utils').VueWrapper} Mounted dialog
 */
function createWrapper(props = {}) {
  return mount(SaveTemplateDialog, {
    attachTo: document.body,
    props: { visible: true, initialName: 'Weekend', ...props },
    global: { plugins: [i18n] },
  });
}

// -----------------------------------------------------------------------------
// SaveTemplateDialog Tests
// -----------------------------------------------------------------------------

describe('SaveTemplateDialog', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Rendering and Focus
  // ---------------------------------------------------------------------------

  // Test Case 1: Should render an accessible dialog with the initial name
  it('renders an accessible dialog with the initial name', async () => {
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[role="dialog"]').attributes('aria-modal')).toBe('true');
    expect(wrapper.get('[data-testid="save-template-name"]').element.value).toBe('Weekend');
  });

  // Test Case 2: Should focus and select the name input when opened
  it('focuses the name input when opened', async () => {
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(wrapper.get('[data-testid="save-template-name"]').element);
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Save Validation
  // ---------------------------------------------------------------------------

  // Test Case 3: Should emit a trimmed template name when submitted
  it('emits a trimmed template name when submitted', async () => {
    const wrapper = createWrapper();
    const input = wrapper.get('[data-testid="save-template-name"]');
    await input.setValue('  Beach weekend  ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toEqual([['Beach weekend']]);
  });

  // Test Case 4: Should show an error instead of saving an empty name
  it('shows an error instead of saving an empty name', async () => {
    const wrapper = createWrapper({ initialName: '' });
    await wrapper.get('form').trigger('submit');

    expect(wrapper.text()).toContain('template.nameRequired');
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Dismissal
  // ---------------------------------------------------------------------------

  // Test Case 5: Should emit close when Escape is pressed
  it('emits close when Escape is pressed', async () => {
    const wrapper = createWrapper();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  // Test Case 6: Should emit close when the backdrop or cancel button is selected
  it('emits close from the backdrop and cancel button', async () => {
    const wrapper = createWrapper();
    await wrapper.get('[role="presentation"]').trigger('click.self');
    await wrapper.findAll('button')[0].trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  // Test Case 7: Should reset validation and name whenever it reopens
  it('resets validation and name whenever it reopens', async () => {
    const wrapper = createWrapper({ initialName: '' });
    await wrapper.get('form').trigger('submit');
    expect(wrapper.text()).toContain('template.nameRequired');

    await wrapper.setProps({ visible: false, initialName: 'Beach' });
    await wrapper.setProps({ visible: true });

    expect(wrapper.get('[data-testid="save-template-name"]').element.value).toBe('Beach');
    expect(wrapper.text()).not.toContain('template.nameRequired');
  });

  // Test Case 8: Should restore focus to the element active before opening
  it('restores focus to the element active before opening', async () => {
    const previousButton = document.createElement('button');
    document.body.appendChild(previousButton);
    previousButton.focus();
    const wrapper = createWrapper({ visible: false });

    await wrapper.setProps({ visible: true });
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(wrapper.get('[data-testid="save-template-name"]').element);

    await wrapper.setProps({ visible: false });
    expect(document.activeElement).toBe(previousButton);

    wrapper.unmount();
    previousButton.remove();
  });

  // Test Case 9: Should trap forward and reverse Tab navigation inside the dialog
  it('traps forward and reverse Tab navigation inside the dialog', async () => {
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    const first = wrapper.get('[data-testid="save-template-name"]').element;
    const last = wrapper.get('[data-testid="save-template-confirm"]').element;

    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true })
    );
    expect(document.activeElement).toBe(last);

    wrapper.unmount();
  });

  // Test Case 10: Should ignore keyboard dismissal while hidden and unrelated keys while visible
  it('ignores keyboard dismissal while hidden and unrelated keys while visible', async () => {
    const wrapper = createWrapper({ visible: false });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('close')).toBeUndefined();

    await wrapper.setProps({ visible: true });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(wrapper.emitted('close')).toBeUndefined();

    wrapper.unmount();
  });
});
