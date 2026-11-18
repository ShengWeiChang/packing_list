/* Focused real-touch gestures for long-press drag activation. */
import { expect } from '@playwright/test';

/**
 * Hold with early finger movement, then check whether dragging can start.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {import('@playwright/test').CDPSession} client - Chromium touch input.
 * @param {import('@playwright/test').Locator} target - Drag start or excluded control.
 * @param {{ jitter?: number, shouldDrag?: boolean }} options - Expected gesture behavior.
 */
export async function checkTouchHold(page, client, target, { jitter = 2, shouldDrag = true } = {}) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  await page.waitForTimeout(60);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: start.x + jitter, y: start.y + jitter }],
  });
  await page.waitForTimeout(220);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  const chosen = page.locator('.chosen-item, .chosen-category, .chosen-checklist');
  await expect(chosen).toHaveCount(shouldDrag ? 1 : 0);
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(chosen).toHaveCount(0);
  await expect(page.locator('.sortable-fallback')).toHaveCount(0);
}

/**
 * Start scrolling before the hold delay; the list must not enter drag mode.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {import('@playwright/test').CDPSession} client - Chromium touch input.
 * @param {import('@playwright/test').Locator} target - Item name within scrollable content.
 */
export async function checkTouchScroll(page, client, target) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const before = await page.evaluate(() => window.scrollY);
  const scrollState = await page.evaluateHandle(() => {
    const state = { ended: false, lastScroll: performance.now(), released: 0 };
    const onScroll = () => {
      state.ended = false;
      state.lastScroll = performance.now();
    };
    const onEnd = () => (state.ended = true);
    document.addEventListener('scroll', onScroll);
    document.addEventListener('scrollend', onEnd);
    return {
      state,
      cleanup: () => {
        document.removeEventListener('scroll', onScroll);
        document.removeEventListener('scrollend', onEnd);
      },
    };
  });
  try {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [start],
    });
    for (let step = 1; step <= 8; step++) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x, y: start.y - step * 20 }],
      });
      await page.waitForTimeout(16);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await scrollState.evaluate(({ state }) => {
      state.released = performance.now();
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
    // A CDP touch gesture may scroll without an observed document scrollend event.
    // Require a quiet period after the latest scroll or touch release as a fallback.
    await expect
      .poll(() =>
        scrollState.evaluate(
          ({ state }) =>
            state.ended || performance.now() - Math.max(state.lastScroll, state.released) >= 300
        )
      )
      .toBe(true);
    await expect(page.locator('.sortable-fallback, .chosen-item, .chosen-category')).toHaveCount(0);
  } finally {
    await scrollState.evaluate(({ cleanup }) => cleanup());
    await scrollState.dispose();
  }
}
