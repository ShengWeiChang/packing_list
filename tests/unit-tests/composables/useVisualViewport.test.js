/*
================================================================================
File: tests/unit-tests/composables/useVisualViewport.test.js
Description: Visual viewport subscription and cleanup tests.
License: MIT (SPDX: MIT)
Created: 2026-11-04
================================================================================
*/

import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';

import { useVisualViewport } from '../../../source/composables/useVisualViewport';

// Test Case 1: Keyboard viewport offsets update modal bounds and listeners are released.
it('updates fixed modal bounds and removes viewport listeners on unmount', async () => {
  const viewport = new EventTarget();
  Object.assign(viewport, { offsetTop: 20, offsetLeft: 0, width: 390, height: 400 });
  const previous = Object.getOwnPropertyDescriptor(window, 'visualViewport');
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  const remove = vi.spyOn(viewport, 'removeEventListener');
  const component = {
    setup: () => ({ bounds: useVisualViewport() }),
    template: '<div :style="bounds" />',
  };
  const wrapper = mount(component);
  try {
    await wrapper.vm.$nextTick();
    expect(wrapper.element.style.height).toBe('400px');
    viewport.height = 250;
    viewport.offsetTop = 50;
    viewport.dispatchEvent(new Event('resize'));
    await wrapper.vm.$nextTick();
    expect(wrapper.element.style.height).toBe('250px');
    expect(wrapper.element.style.top).toBe('50px');
  } finally {
    wrapper.unmount();
    expect(remove).toHaveBeenCalledTimes(2);
    if (previous) Object.defineProperty(window, 'visualViewport', previous);
    else delete window.visualViewport;
  }
});
