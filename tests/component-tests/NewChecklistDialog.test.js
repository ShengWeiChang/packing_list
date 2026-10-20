/*
================================================================================
File: tests/component-tests/NewChecklistDialog.test.js
Description: Component tests for checklist source and recommended-list selection.
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
  const recommendedList = {
    id: 'general',
    name: 'General Travel',
    description: 'A balanced starting point.',
    categories: [{ id: 'documents', name: 'Documents', order: 0 }],
    items: [{ id: 'passport', name: 'Passport', categoryId: 'documents', order: 0 }],
  };

  // ---------------------------------------------------------------------------
  // Test Group 1: Source Selection
  // ---------------------------------------------------------------------------

  // Test Case 1: Should emit the selected empty source
  it('emits the selected empty source', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });
    await wrapper.get('[data-testid="new-checklist-option-empty"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([[{ source: 'empty' }]]);
  });

  // Test Case 2: Should select a personal template from its source list
  it('selects a personal template from its source list', async () => {
    const wrapper = mount(NewChecklistDialog, {
      props: { visible: true, templates: [template] },
    });
    await wrapper.get('[data-testid="new-checklist-option-template"]').trigger('click');
    await wrapper.get('[data-testid="new-checklist-template-template-1"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([[{ source: 'template', templateId: 'template-1' }]]);
  });

  // Test Case 3: Should select a recommended list from its source list
  it('selects a recommended list from its source list', async () => {
    const wrapper = mount(NewChecklistDialog, {
      props: { visible: true, recommendedLists: [recommendedList] },
    });
    await wrapper.get('[data-testid="new-checklist-option-recommended"]').trigger('click');
    await wrapper.get('[data-testid="new-checklist-recommended-general"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([
      [{ source: 'recommended', recommendedListId: 'general' }],
    ]);
    expect(wrapper.text()).toContain('A balanced starting point.');
  });

  // Test Case 4: Should keep all sources visible without personal templates
  it('keeps all sources visible and only disables personal templates when none exist', () => {
    const wrapper = mount(NewChecklistDialog, {
      props: { visible: true, recommendedLists: [recommendedList] },
    });

    expect(wrapper.get('[data-testid="new-checklist-option-empty"]').exists()).toBe(true);
    expect(
      wrapper.get('[data-testid="new-checklist-option-template"]').attributes('disabled')
    ).toBe('');
    expect(
      wrapper.get('[data-testid="new-checklist-option-recommended"]').attributes('disabled')
    ).toBe(undefined);
  });

  // Test Case 5: Should restore focus to the personal-template source after Back
  it('restores focus to the personal-template source after Back', async () => {
    const wrapper = mount(NewChecklistDialog, {
      attachTo: document.body,
      props: { visible: true, templates: [template] },
    });
    await wrapper.get('[data-testid="new-checklist-option-template"]').trigger('click');
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-template-template-1"]').element
    );

    await wrapper.get('[data-testid="new-checklist-back"]').trigger('click');
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-option-template"]').element
    );
    wrapper.unmount();
  });

  // Test Case 6: Should restore focus to the recommended-list source after Back
  it('restores focus to the recommended-list source after Back', async () => {
    const wrapper = mount(NewChecklistDialog, {
      attachTo: document.body,
      props: { visible: true, recommendedLists: [recommendedList] },
    });
    await wrapper.get('[data-testid="new-checklist-option-recommended"]').trigger('click');
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-recommended-general"]').element
    );

    await wrapper.get('[data-testid="new-checklist-back"]').trigger('click');
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-option-recommended"]').element
    );
    wrapper.unmount();
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Accessibility and Dialog Lifecycle
  // ---------------------------------------------------------------------------

  // Test Case 7: Should close the dialog when Escape is pressed
  it('closes the dialog when Escape is pressed', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  // Test Case 8: Should close from the backdrop and Cancel button
  it('closes from the backdrop and Cancel button', async () => {
    const wrapper = mount(NewChecklistDialog, { props: { visible: true } });

    await wrapper.get('[data-testid="new-checklist-dialog-backdrop"]').trigger('click.self');
    await wrapper.get('[data-testid="new-checklist-cancel"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  // Test Case 9: Should focus the first source and restore prior focus after closing
  it('focuses the first source and restores prior focus after closing', async () => {
    const previousButton = document.createElement('button');
    document.body.appendChild(previousButton);
    previousButton.focus();
    const wrapper = mount(NewChecklistDialog, {
      attachTo: document.body,
      props: { visible: true },
    });
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="new-checklist-option-empty"]').element
    );

    await wrapper.setProps({ visible: false });
    expect(document.activeElement).toBe(previousButton);

    wrapper.unmount();
    previousButton.remove();
  });

  // Test Case 10: Should trap forward and reverse Tab navigation inside the dialog
  it('traps forward and reverse Tab navigation inside the dialog', async () => {
    const wrapper = mount(NewChecklistDialog, {
      attachTo: document.body,
      props: { visible: true },
    });
    await wrapper.vm.$nextTick();
    const first = wrapper.get('[data-testid="new-checklist-option-empty"]').element;
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

  // Test Case 11: Should reset the nested source step whenever the dialog reopens
  it('resets the nested source step whenever the dialog reopens', async () => {
    const wrapper = mount(NewChecklistDialog, {
      props: { visible: true, recommendedLists: [recommendedList] },
    });
    await wrapper.get('[data-testid="new-checklist-option-recommended"]').trigger('click');
    expect(wrapper.find('[data-testid="new-checklist-back"]').exists()).toBe(true);

    await wrapper.setProps({ visible: false });
    await wrapper.setProps({ visible: true });

    expect(wrapper.find('[data-testid="new-checklist-back"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="new-checklist-option-recommended"]').exists()).toBe(true);
  });

  // Test Case 12: Should ignore keyboard dismissal while hidden and unrelated keys while visible
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
