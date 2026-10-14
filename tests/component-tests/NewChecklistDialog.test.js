/*
================================================================================
File: tests/component-tests/NewChecklistDialog.test.js
Description: Component tests for template-aware checklist creation choices.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-13
================================================================================
*/

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NewChecklistDialog from '../../source/components/NewChecklistDialog.vue';

describe('NewChecklistDialog', () => {
  const template = {
    id: 'template-1',
    name: 'Winter trip',
    categories: [{ id: 'category-1', name: 'Clothes', order: 0 }],
    items: [],
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Source Selection
  // ---------------------------------------------------------------------------

  // Test Case 1: Should emit the selected default source
  it('emits the selected default source', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });
    await wrapper.get('[data-testid="new-checklist-option-default"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([[{ source: 'default' }]]);
  });

  // Test Case 2: Should select a template after opening the template list
  it('selects a template after opening the template list', async () => {
    const wrapper = mount(NewChecklistDialog, {
      props: { visible: true, templates: [template] },
    });
    await wrapper.get('[data-testid="new-checklist-option-template"]').trigger('click');
    await wrapper.get('[data-testid="new-checklist-template-template-1"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([[{ source: 'template', templateId: 'template-1' }]]);
    expect(wrapper.text()).toContain('template.categoryCount');
  });

  // Test Case 3: Should label the previous step as Back and restore focus
  it('labels the previous step as Back and restores focus', async () => {
    const wrapper = mount(NewChecklistDialog, {
      attachTo: document.body,
      props: { visible: true, templates: [template] },
    });
    const templateOption = wrapper.get('[data-testid="new-checklist-option-template"]');
    await templateOption.trigger('click');
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-template-template-1"]').element
    );

    const back = wrapper.get('[data-testid="new-checklist-back"]');
    expect(back.text()).toBe('common.back');
    await back.trigger('click');
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-option-template"]').element
    );
    wrapper.unmount();
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Accessibility and Empty State
  // ---------------------------------------------------------------------------

  // Test Case 4: Should close the dialog when Escape is pressed
  it('closes the dialog when Escape is pressed', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  // Test Case 5: Should disable template selection when no templates exist
  it('disables template selection when no templates exist', () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });

    expect(
      wrapper.get('[data-testid="new-checklist-option-template"]').attributes('disabled')
    ).toBe('');
  });

  // Test Case 6: Should emit the selected empty source
  it('emits the selected empty source', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });

    await wrapper.get('[data-testid="new-checklist-option-empty"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([[{ source: 'empty' }]]);
  });

  // Test Case 7: Should close from the backdrop and Cancel button
  it('closes from the backdrop and Cancel button', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });

    await wrapper.get('[data-testid="new-checklist-dialog-backdrop"]').trigger('click.self');
    await wrapper.get('[data-testid="new-checklist-cancel"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  // Test Case 8: Should focus the first choice and restore prior focus after closing
  it('focuses the first choice and restores prior focus after closing', async () => {
    const previousButton = document.createElement('button');
    document.body.appendChild(previousButton);
    previousButton.focus();
    const wrapper = mount(NewChecklistDialog, {
      attachTo: document.body,
      props: { visible: true, templates: [template] },
    });
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-option-default"]').element
    );

    await wrapper.setProps({ visible: false });
    expect(document.activeElement).toBe(previousButton);

    wrapper.unmount();
    previousButton.remove();
  });

  // Test Case 9: Should trap forward and reverse Tab navigation inside the dialog
  it('traps forward and reverse Tab navigation inside the dialog', async () => {
    const wrapper = mount(NewChecklistDialog, {
      attachTo: document.body,
      props: { visible: true, templates: [template] },
    });
    await wrapper.vm.$nextTick();
    const first = wrapper.get('[data-testid="new-checklist-option-default"]').element;
    const last = wrapper.get('[data-testid="new-checklist-cancel"]').element;

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

  // Test Case 10: Should reset the template step whenever the dialog reopens
  it('resets the template step whenever the dialog reopens', async () => {
    const wrapper = mount(NewChecklistDialog, {
      props: { visible: true, templates: [template] },
    });
    await wrapper.get('[data-testid="new-checklist-option-template"]').trigger('click');
    expect(wrapper.find('[data-testid="new-checklist-back"]').exists()).toBe(true);

    await wrapper.setProps({ visible: false });
    await wrapper.setProps({ visible: true });

    expect(wrapper.find('[data-testid="new-checklist-back"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="new-checklist-option-default"]').exists()).toBe(true);
  });

  // Test Case 11: Should ignore keyboard dismissal while hidden and unrelated keys while visible
  it('ignores keyboard dismissal while hidden and unrelated keys while visible', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: false } });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('close')).toBeUndefined();

    await wrapper.setProps({ visible: true });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(wrapper.emitted('close')).toBeUndefined();

    wrapper.unmount();
  });
});
