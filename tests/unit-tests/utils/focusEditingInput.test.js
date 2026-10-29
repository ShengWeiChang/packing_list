/*
================================================================================
File: tests/unit-tests/utils/focusEditingInput.test.js
Description: Unit tests for stable edit-input focus and viewport handling.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-20
================================================================================
*/

import { afterEach, describe, expect, it, vi } from 'vitest';

import { focusEditingInput } from '../../../source/utils/focusEditingInput';

describe('focusEditingInput', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Test Case 1: Visible input should focus and select without scrolling
  it('should focus without scrolling, select the name, and keep a visible input in place', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback();
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const input = document.createElement('input');
    input.value = 'New Item';
    document.body.append(input);
    input.getBoundingClientRect = vi.fn(() => ({ top: 100, bottom: 130 }));
    input.scrollIntoView = vi.fn();
    const focusSpy = vi.spyOn(input, 'focus');
    const selectSpy = vi.spyOn(input, 'select');

    focusEditingInput(input);

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(selectSpy).toHaveBeenCalledOnce();
    expect(input.scrollIntoView).not.toHaveBeenCalled();
    input.remove();
  });

  // Test Case 2: A multi-stage viewport resize should keep monitoring until cleanup
  it('should scroll when a later viewport resize occludes the input and stop after cleanup', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback();
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const viewport = new EventTarget();
    viewport.offsetTop = 0;
    viewport.height = 800;
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    });
    const input = document.createElement('input');
    document.body.append(input);
    input.getBoundingClientRect = vi.fn(() => ({ top: 700, bottom: 730 }));
    input.scrollIntoView = vi.fn();

    const cleanup = focusEditingInput(input);

    viewport.height = 750;
    viewport.dispatchEvent(new Event('resize'));
    expect(input.scrollIntoView).not.toHaveBeenCalled();

    viewport.height = 600;
    viewport.dispatchEvent(new Event('resize'));

    expect(input.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
    cleanup();
    viewport.dispatchEvent(new Event('resize'));
    expect(input.scrollIntoView).toHaveBeenCalledTimes(1);
    input.remove();
  });
});
