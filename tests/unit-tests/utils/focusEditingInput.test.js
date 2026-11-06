import { afterEach, describe, expect, it, vi } from 'vitest';

import { focusEditingInput } from '../../../source/utils/focusEditingInput';

describe('focusEditingInput', () => {
  let cleanup = () => {};
  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  /** Build a measurable scrollport and visual viewport.
   * @param {number} top - Input top position.
   * @returns {object} Test geometry and DOM.
   */
  function setup(top = 100) {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback();
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const viewport = new EventTarget();
    Object.assign(viewport, { offsetTop: 0, height: 800 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    const port = document.createElement('div');
    port.style.overflowY = 'auto';
    port.style.paddingBottom = '10px';
    Object.defineProperties(port, { clientHeight: { value: 800 }, scrollHeight: { value: 2000 } });
    port.getBoundingClientRect = () => ({ top: 0, bottom: 800 });
    const input = document.createElement('input');
    input.value = 'Draft';
    port.append(input);
    document.body.append(port);
    input.getBoundingClientRect = () => ({ top, bottom: top + 30, height: 30 });
    return { port, input, viewport };
  }

  // Test Case 1: Focus/select a visible input without moving its scrollport.
  it('keeps a visible input in place and restores temporary space', () => {
    const { input, port } = setup();
    const focus = vi.spyOn(input, 'focus');
    cleanup = focusEditingInput(input);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(input.selectionEnd).toBe(5);
    expect(port.scrollTop).toBe(0);
    cleanup();
    expect(port.style.paddingBottom).toBe('10px');
  });

  // Test Case 2: Resize reserves a 28px buffer using the real scrollport.
  it('scrolls by the minimum delta after keyboard resize and stops after cleanup', () => {
    const { input, port, viewport } = setup(700);
    cleanup = focusEditingInput(input);
    viewport.height = 600;
    viewport.dispatchEvent(new Event('resize'));
    expect(port.scrollTop).toBe(158);
    expect(Number.parseFloat(port.style.paddingBottom)).toBeGreaterThan(28);
    cleanup();
    const position = port.scrollTop;
    viewport.height = 300;
    viewport.dispatchEvent(new Event('resize'));
    expect(port.scrollTop).toBe(position);
  });

  // Test Case 3: A new editor owns cleanup; an older cleanup cannot erase its space.
  it('transfers temporary space ownership between editors', () => {
    const { input, port } = setup();
    const first = focusEditingInput(input);
    const other = document.createElement('input');
    other.getBoundingClientRect = () => ({ top: 100, bottom: 130, height: 30 });
    port.append(other);
    cleanup = focusEditingInput(other);
    first();
    expect(port.style.paddingBottom).not.toBe('10px');
    cleanup();
    expect(port.style.paddingBottom).toBe('10px');
  });
});
