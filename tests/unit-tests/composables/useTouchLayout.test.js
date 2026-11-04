/*
================================================================================
File: tests/unit-tests/composables/useTouchLayout.test.js
Description: Capability changes and lifecycle cleanup for touch presentation.
License: MIT (SPDX: MIT)
Created: 2026-10-30
================================================================================
*/

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import { useTouchLayout } from '../../../source/composables/useTouchLayout';

describe('useTouchLayout', () => {
  // Test Case 1: Media changes keep touch layout enabled for a wide tablet and dispose every subscription.
  it('tracks capabilities independently of width and cleans up subscriptions', async () => {
    const original = window.matchMedia;
    const queries = new Map();
    window.matchMedia = vi.fn((media) => {
      const query = {
        matches: media === '(any-pointer: coarse)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      queries.set(media, query);
      return query;
    });
    const w = mount(
      defineComponent({ setup: useTouchLayout, template: '<div>{{ touchControls }}</div>' })
    );
    try {
      await nextTick();
      expect(w.text()).toBe('true');
      const coarse = queries.get('(any-pointer: coarse)');
      coarse.matches = false;
      coarse.addEventListener.mock.calls[0][1]();
      await nextTick();
      expect(w.text()).toBe('false');
      const width = queries.get('(max-width: 767px)');
      width.matches = true;
      width.addEventListener.mock.calls[0][1]();
      await nextTick();
      expect(w.text()).toBe('true');
      w.unmount();
      for (const query of queries.values())
        expect(query.removeEventListener).toHaveBeenCalledWith(
          'change',
          query.addEventListener.mock.calls[0][1]
        );
    } finally {
      w.unmount();
      window.matchMedia = original;
    }
  });
});
