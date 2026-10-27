/*
================================================================================
File: tests/component-tests/PackingCompletionOverlay.test.js
Description: Tests the accessible controls and packing details in the completion
             journey overlay.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-25
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import PackingCompletionOverlay from '../../source/components/PackingCompletionOverlay.vue';

enableAutoUnmount(afterEach);
afterEach(() => vi.useRealTimers());

// -----------------------------------------------------------------------------
// i18n Setup
// -----------------------------------------------------------------------------

/**
 * Create the real locale messages used by the overlay tests.
 * @param {string} [locale='en'] - Active locale.
 * @returns {ReturnType<typeof createI18n>} Vue I18n test instance.
 */
function createTestI18n(locale = 'en') {
  return createI18n({
    legacy: false,
    locale,
    messages: {
      en: {
        completion: {
          ready: 'Ready to go!',
          skip: 'Skip animation',
        },
      },
      'zh-TW': {
        completion: {
          ready: '準備出發！',
          skip: '略過動畫',
        },
      },
    },
  });
}

// -----------------------------------------------------------------------------
// PackingCompletionOverlay Component Tests
// -----------------------------------------------------------------------------

describe('PackingCompletionOverlay', () => {
  const createWrapper = (props = {}, locale = 'en') => {
    const i18n = createTestI18n(locale);
    return mount(PackingCompletionOverlay, {
      props: {
        checklistName: 'Tokyo Departure',
        endDate: '2026-11-02',
        startDate: '2026-10-26',
        ...props,
      },
      attachTo: document.body,
      global: {
        mocks: { $t: (key) => i18n.global.t(key) },
        plugins: [i18n],
      },
    });
  };

  /**
   * Mark all illustration requests as settled so the synchronized timeline can start.
   * @param {import('@vue/test-utils').VueWrapper} wrapper - Mounted overlay wrapper.
   * @returns {Promise<void>} Completion after all load handlers run.
   */
  async function settleIllustrations(wrapper) {
    for (const image of wrapper.findAll('img')) await image.trigger('load');
    await wrapper.vm.$nextTick();
  }

  // Test Case 1: Should show the trip dates, checklist name, and departure message on the luggage sticker
  it('shows the trip dates, checklist name, and departure message on the luggage sticker', () => {
    const wrapper = createWrapper();

    expect(wrapper.get('[data-testid="packing-completion-overlay"]').attributes('role')).toBe(
      'dialog'
    );
    expect(wrapper.text()).toContain('10/26–11/02/2026');
    expect(wrapper.text()).toContain('Tokyo Departure');
    expect(wrapper.text()).toContain('Ready to go!');
    expect(wrapper.text()).not.toContain('12 / 12');
    expect(wrapper.text()).not.toContain('completion.destination');
    expect(wrapper.text()).not.toContain('completion.packed');
  });

  // Test Case 2: Should use the four independent travel-illustration image layers
  it('uses the four independent travel-illustration image layers', () => {
    const wrapper = createWrapper();

    expect(wrapper.get('.packing-completion-overlay__terminal').attributes('src')).toContain(
      'airport-terminal.png'
    );
    expect(wrapper.get('.packing-completion-overlay__suitcase-art').attributes('src')).toContain(
      'packing-suitcase.png'
    );
    expect(wrapper.get('.packing-completion-overlay__sticker-art').attributes('src')).toContain(
      'baggage-label.png'
    );
    expect(wrapper.get('.packing-completion-overlay__plane').attributes('src')).toContain(
      'takeoff-plane.png'
    );
  });

  // Test Case 3: Should focus and contain keyboard navigation on the skip control
  it('focuses and contains keyboard navigation on the skip control', async () => {
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    const skipButton = wrapper.get('[data-testid="packing-completion-skip"]');

    expect(document.activeElement).toBe(skipButton.element);
    await skipButton.trigger('keydown', { key: 'Tab' });
    expect(document.activeElement).toBe(skipButton.element);
    await skipButton.trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(skipButton.element);
  });

  // Test Case 4: Should emit close when the user skips the animation
  it('emits close once when the user skips the animation', async () => {
    vi.useFakeTimers();
    const wrapper = createWrapper();

    await wrapper.get('[data-testid="packing-completion-skip"]').trigger('click');
    vi.advanceTimersByTime(5000);

    expect(wrapper.emitted('close')).toHaveLength(1);
    vi.useRealTimers();
  });

  // Test Case 5: Should emit close from Escape and a real backdrop click
  it('emits close from Escape and a backdrop click', async () => {
    const escapeWrapper = createWrapper();
    await escapeWrapper.get('[data-testid="packing-completion-skip"]').trigger('keydown', {
      key: 'Escape',
    });
    expect(escapeWrapper.emitted('close')).toHaveLength(1);
    escapeWrapper.unmount();

    const backdropWrapper = createWrapper();
    await backdropWrapper.get('[data-testid="packing-completion-overlay"]').trigger('click');
    expect(backdropWrapper.emitted('close')).toHaveLength(1);
  });

  // Test Case 6: Should emit close after the journey animation duration
  it('emits close after the journey animation duration', async () => {
    vi.useFakeTimers();
    const wrapper = createWrapper();
    await settleIllustrations(wrapper);

    vi.advanceTimersByTime(4999);
    expect(wrapper.emitted('close')).toBeUndefined();

    vi.advanceTimersByTime(1);

    expect(wrapper.emitted('close')).toHaveLength(1);
    vi.useRealTimers();
  });

  // Test Case 7: Should wait for every illustration before starting the synchronized timeline
  it('waits for every illustration before starting the synchronized timeline', async () => {
    const wrapper = createWrapper();
    const overlay = wrapper.get('[data-testid="packing-completion-overlay"]');
    const images = wrapper.findAll('img');

    expect(overlay.attributes('data-assets-ready')).toBe('false');
    for (const image of images.slice(0, -1)) await image.trigger('load');
    expect(overlay.attributes('data-assets-ready')).toBe('false');
    await images.at(-1).trigger('error');
    await wrapper.vm.$nextTick();
    expect(overlay.attributes('data-assets-ready')).toBe('true');
  });

  // Test Case 8: Should handle single, missing, and invalid trip dates without throwing
  it('handles single, missing, and invalid trip dates', () => {
    const singleDateWrapper = createWrapper({ endDate: '2026-10-26', startDate: '2026-10-26' });
    expect(singleDateWrapper.get('.packing-completion-overlay__sticker-date').text()).toBe(
      '10/26/2026'
    );
    singleDateWrapper.unmount();

    const invalidDateWrapper = createWrapper({ endDate: '', startDate: 'not-a-date' });
    expect(invalidDateWrapper.get('.packing-completion-overlay__sticker-date').text()).toBe('');
    invalidDateWrapper.unmount();

    const impossibleDateWrapper = createWrapper({ endDate: '', startDate: '2026-02-31' });
    expect(impossibleDateWrapper.get('.packing-completion-overlay__sticker-date').text()).toBe('');
    impossibleDateWrapper.unmount();

    const crossYearWrapper = createWrapper({ endDate: '2027-01-02', startDate: '2026-12-31' });
    expect(crossYearWrapper.get('.packing-completion-overlay__sticker-date').text()).toBe(
      '12/31/2026–01/02/2027'
    );
  });

  // Test Case 9: Should render localized Traditional Chinese sticker copy
  it('renders localized Traditional Chinese sticker copy', () => {
    const wrapper = createWrapper({}, 'zh-TW');

    expect(wrapper.text()).toContain('準備出發！');
    expect(wrapper.text()).toContain('2026/10/26–11/02');
  });

  // Test Case 10: Should expose one synchronized timeline to JavaScript and CSS
  it('exposes one synchronized timeline to JavaScript and CSS', () => {
    const wrapper = createWrapper();
    const style = wrapper.get('[data-testid="packing-completion-overlay"]').attributes('style');

    expect(style).toContain('--completion-duration: 5000ms');
    expect(style).toContain('--completion-fade-delay: 4500ms');
    expect(style).toContain('--completion-fade-duration: 500ms');
    expect(style).toContain('--terminal-reveal-duration: 4000ms');
  });
});
