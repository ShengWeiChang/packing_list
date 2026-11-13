/* Real pointer regression coverage for pending drops and cancelled touch drags. */
import { expect, test } from '@playwright/test';

import { checkTouchHold } from './touchDragHelpers.js';

/**
 * Seed isolated storage once so reload observes the actual persisted result.
 * @param {import('@playwright/test').Page} page - Isolated page.
 * @param {object} options - Fixture options.
 * @param {number} [options.width] - Viewport width.
 * @param {number} [options.height] - Viewport height.
 * @param {boolean} [options.filtered] - Hide packed items.
 */
async function openFixture(page, { width = 390, height = 844, filtered = false } = {}) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => {
    if (localStorage.getItem('packingListApp')) return;
    localStorage.setItem('packingListLastOpenedChecklistId', 'trip');
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: ['trip', 'other', 'third'].map((id, order) => ({
          id,
          name: `Trip ${id}`,
          startDate: '',
          endDate: '',
          order,
        })),
        categories: ['a', 'b', 'c'].map((id, order) => ({
          id,
          name: `Category ${id}`,
          checklistId: 'trip',
          order,
        })),
        items: ['a', 'b'].flatMap((categoryId) =>
          [0, 1].map((order) => ({
            id: `${categoryId}${order}`,
            name: `Item ${categoryId}${order}`,
            quantity: 1,
            categoryId,
            checklistId: 'trip',
            isPacked: categoryId === 'b',
            isPending: false,
            order,
          }))
        ),
      })
    );
  });
  await page.goto('/');
  await expect(page.getByTestId('category-card')).toHaveCount(3);
  if (filtered) await page.getByTestId('unpacked-items-filter-toggle').click();
}

/**
 * Wait for layout transitions before taking gesture coordinates.
 * @param {import('@playwright/test').Page} page - Isolated page.
 */
async function settle(page) {
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {}))
    );
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

/**
 * Queue a synthetic compatibility click before the release guard's timer runs.
 * @param {import('@playwright/test').Locator} row - Dragged item row.
 */
async function nameForReleaseProbe(row) {
  await row
    .getByTestId('item-name')
    .first()
    .evaluate((name) => {
      document.addEventListener(
        'touchend',
        () => {
          queueMicrotask(() => {
            window.releaseClickProbe = true;
            window.releaseClickAllowed = name.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true })
            );
          });
        },
        { once: true }
      );
    });
}

/**
 * Open the responsive sidebar and wait for its reveal animation.
 * @param {import('@playwright/test').Page} page - Isolated page.
 * @param {number} width - Viewport width.
 */
async function openSidebar(page, width) {
  if (width < 640) await page.getByTestId('topbar-toggle').click();
  else if ((await page.locator('aside').getAttribute('data-expanded')) === 'false') {
    await page.getByTestId('sidebar-toggle').click();
  }
  await expect(page.getByTestId('sidebar-checklist-item').first()).toBeVisible();
  await settle(page);
}

/**
 * Read only real rows, excluding the fallback clone appended outside the lists.
 * @param {import('@playwright/test').Page} page - Isolated page.
 * @param {string} [kind] - List family to inspect.
 * @returns {Promise<string[]>} Visible row membership and order.
 */
async function visibleOrder(page, kind = 'item') {
  return page.evaluate((type) => {
    const selectors = {
      item: '[data-testid="category-items-draggable"] [data-testid="item-row"]',
      category: '[data-testid="category-card"]',
      sidebar:
        '[data-testid="sidebar-checklists-draggable"] [data-testid="sidebar-checklist-item"]',
    };
    const key = { item: 'itemId', category: 'categoryId', sidebar: 'checklistId' }[type];
    return [...document.querySelectorAll(selectors[type])]
      .filter((row) => !row.closest('.sortable-fallback'))
      .map((row) =>
        type === 'item'
          ? `${row.closest('[data-testid="category-items-draggable"]').dataset.categoryId}:${row.dataset.itemId}`
          : row.dataset[key]
      );
  }, kind);
}

/**
 * Capture the full persisted payload, including hidden filtered items.
 * @param {import('@playwright/test').Page} page - Isolated page.
 * @returns {Promise<object>} Persisted app data.
 */
async function storedData(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')));
}

/**
 * Hold the real Web Lock to expose the asynchronous persistence boundary.
 * @param {import('@playwright/test').Page} page - Isolated page.
 */
async function holdStorage(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        void navigator.locks.request('packing-list-storage-write', async () => {
          resolve();
          await new Promise((release) => {
            window.releaseDragStorage = release;
          });
        });
      })
  );
}

/**
 * Wait until every queued storage transaction has completed.
 * @param {import('@playwright/test').Page} page - Isolated page.
 */
async function storageIdle(page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.locks
          .query()
          .then(
            (state) =>
              [...state.held, ...state.pending].filter(
                (lock) => lock.name === 'packing-list-storage-write'
              ).length
          )
      )
    )
    .toBe(0);
}

/**
 * Move a real pointer while keeping the gesture active for preview assertions.
 * @param {import('@playwright/test').Page} page - Isolated page.
 * @param {import('@playwright/test').Locator} source - Drag start.
 * @param {import('@playwright/test').Locator} target - Drop destination.
 * @param {import('@playwright/test').CDPSession} [client] - Touch input; omit for mouse.
 */
async function startDrag(page, source, target, client) {
  await source.scrollIntoViewIfNeeded();
  await settle(page);
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + Math.min(8, to.height / 4) };
  if (client) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await page.waitForTimeout(280);
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
  }
  for (let step = 1; step <= 35; step++) {
    const point = {
      x: start.x + ((end.x - start.x) * step) / 35,
      y: start.y + ((end.y - start.y) * step) / 35,
    };
    if (client)
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    else await page.mouse.move(point.x, point.y);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
}

/**
 * Check cleanup after either successful or cancelled settlement.
 * @param {import('@playwright/test').Page} page - Isolated page.
 */
async function expectClean(page) {
  await expect(
    page.locator('.sortable-fallback, .chosen-item, .chosen-category, .chosen-checklist')
  ).toHaveCount(0);
}

// Test Cases 1-3: A mouse reorder remains visible while the Web Lock is pending on every layout.
for (const [label, width, height] of [
  ['desktop', 1280, 900],
  ['phone', 390, 844],
  ['tablet', 820, 1180],
]) {
  test(`keeps sidebar mouse drop visible through delayed storage on ${label}`, async ({ page }) => {
    await openFixture(page, { width, height });
    await openSidebar(page, width);
    await holdStorage(page);
    const before = await storedData(page);
    const rows = page.getByTestId('sidebar-checklist-item');
    const original = await visibleOrder(page, 'sidebar');
    await startDrag(page, rows.nth(1), rows.nth(0));
    await expect.poll(() => visibleOrder(page, 'sidebar')).not.toEqual(original);
    const expected = await visibleOrder(page, 'sidebar');
    await page.mouse.up();
    await expectClean(page);
    await settle(page);
    expect(await visibleOrder(page, 'sidebar')).toEqual(expected);
    expect(await storedData(page)).toEqual(before);
    await page.evaluate(() => window.releaseDragStorage());
    await storageIdle(page);
    expect(await visibleOrder(page, 'sidebar')).toEqual(expected);
    expect(
      (await storedData(page)).checklists.sort((a, b) => b.order - a.order).map((entry) => entry.id)
    ).toEqual(expected);
    await page.reload();
    await openSidebar(page, width);
    expect(await visibleOrder(page, 'sidebar')).toEqual(expected);
  });
}

// Test Case 4: Failed sidebar persistence restores the authoritative order and survives reload.
test('restores sidebar order when a pending mouse drop fails to save', async ({ page }) => {
  await openFixture(page, { width: 1280, height: 900 });
  await openSidebar(page, 1280);
  const before = await storedData(page);
  const original = await visibleOrder(page, 'sidebar');
  await holdStorage(page);
  const rows = page.getByTestId('sidebar-checklist-item');
  await startDrag(page, rows.nth(1), rows.nth(0));
  await page.mouse.up();
  await page.evaluate(() => {
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListApp') {
        Storage.prototype.setItem = originalSet;
        throw new DOMException('Storage full', 'QuotaExceededError');
      }
      return originalSet.call(this, key, value);
    };
    window.releaseDragStorage();
  });
  await expect(page.getByRole('alert')).toBeVisible();
  await storageIdle(page);
  expect(await visibleOrder(page, 'sidebar')).toEqual(original);
  expect(await storedData(page)).toEqual(before);
  await expectClean(page);
  await page.reload();
  expect(await visibleOrder(page, 'sidebar')).toEqual(original);
});

// Test Case 5: A finished touch drag must not swallow the next real tap.
test('touch drag completion leaves the next action tap usable across drag surfaces', async ({
  browser,
}) => {
  for (const scenario of ['phone-item', 'tablet-item', 'category', 'sidebar', 'normal-item']) {
    const width = scenario === 'tablet-item' ? 1024 : 390;
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await openFixture(page, { width });
    const client = await context.newCDPSession(page);
    const row = page.locator('[data-testid="item-row"][data-item-id="a0"]');
    let source = row.getByTestId('item-name');
    if (scenario === 'category') source = page.getByTestId('category-name').first();
    if (scenario === 'sidebar') {
      await openSidebar(page, width);
      source = page.getByTestId('sidebar-checklist-item').first();
    }
    await source.scrollIntoViewIfNeeded();
    await settle(page);
    const box = await source.boundingBox();
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await page.waitForTimeout(280);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: point.x + 3, y: point.y + 3 }],
    });
    await expect(page.locator('.sortable-fallback')).toHaveCount(1);
    if (scenario === 'normal-item') {
      // Emulate a release compatibility click in the same task, before the guard expires.
      await nameForReleaseProbe(row);
    }
    await client.send('Input.dispatchTouchEvent', {
      type: scenario === 'normal-item' ? 'touchEnd' : 'touchCancel',
      touchPoints: [],
    });
    await expectClean(page);
    if (scenario === 'normal-item') {
      expect(await page.evaluate(() => window.releaseClickProbe)).toBe(true);
      expect(await page.evaluate(() => window.releaseClickAllowed)).toBe(false);
    }
    await expect(row.getByTestId('item-edit-input')).toHaveCount(0);
    if (scenario === 'sidebar') {
      await page.getByTestId('sidebar-language-button').tap();
      await expect(page.getByTestId('sidebar-language-dropdown')).toBeVisible();
    } else {
      await row.locator('[data-testid^="overflow-trigger-item-"]').tap();
      await expect(row.getByTestId('item-inline-actions')).toBeVisible();
    }
    await client.detach();
    await context.close();
  }
});

// Test Cases 6-12: Cancellation after a real moved placeholder cannot persist any reorder or move.
for (const scenario of ['same', 'cross', 'empty', 'collapsed', 'filtered', 'category', 'sidebar']) {
  test(`touchcancel restores ${scenario} drag after its placeholder moves`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await openFixture(page, { filtered: scenario === 'filtered' });
    const client = await context.newCDPSession(page);
    const card = (id) => page.locator(`[data-testid="category-card"][data-category-id="${id}"]`);
    const item = (id) => page.locator(`[data-testid="item-row"][data-item-id="${id}"]`);
    let source = item('a1').getByTestId('item-name');
    let target = item('a0');
    let kind = 'item';
    if (scenario === 'same') await checkTouchHold(page, client, source);
    if (scenario === 'cross') target = item('b0');
    if (scenario === 'empty') target = card('c').getByTestId('add-item-button');
    if (scenario === 'filtered') target = card('b').getByTestId('add-item-button');
    if (scenario === 'collapsed') {
      await card('c').getByTestId('category-collapse-toggle').click();
      target = card('c').getByTestId('category-name');
    }
    if (scenario === 'category') {
      kind = 'category';
      source = card('b').getByTestId('category-name');
      target = card('a').getByTestId('category-name');
    }
    if (scenario === 'sidebar') {
      kind = 'sidebar';
      await openSidebar(page, 390);
      source = page.getByTestId('sidebar-checklist-item').nth(1);
      target = page.getByTestId('sidebar-checklist-item').nth(0);
    }
    const before = await storedData(page);
    const original = await visibleOrder(page, kind);
    await startDrag(page, source, target, client);
    await expect.poll(() => visibleOrder(page, kind)).not.toEqual(original);
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expectClean(page);
    await storageIdle(page);
    await expect.poll(() => visibleOrder(page, kind)).toEqual(original);
    expect(await storedData(page)).toEqual(before);
    await page.reload();
    await expect(page.getByTestId('category-card')).toHaveCount(3);
    if (scenario === 'filtered') await page.getByTestId('unpacked-items-filter-toggle').click();
    if (scenario === 'sidebar') await openSidebar(page, 390);
    expect(await visibleOrder(page, kind)).toEqual(original);
    expect(await storedData(page)).toEqual(before);
    await client.detach();
    await context.close();
  });
}

// Test Cases 13-15: Normal touchend continues to persist item, category, and sidebar reorders.
for (const kind of ['item', 'category', 'sidebar']) {
  test(`normal touchend saves ${kind} order`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await openFixture(page);
    const client = await context.newCDPSession(page);
    let rows = page.getByTestId('item-name');
    if (kind === 'category') rows = page.getByTestId('category-name');
    if (kind === 'sidebar') {
      await openSidebar(page, 390);
      rows = page.getByTestId('sidebar-checklist-item');
    }
    const original = await visibleOrder(page, kind);
    await startDrag(page, rows.nth(1), rows.nth(0), client);
    await expect.poll(() => visibleOrder(page, kind)).not.toEqual(original);
    const expected = await visibleOrder(page, kind);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expectClean(page);
    await storageIdle(page);
    expect(await visibleOrder(page, kind)).toEqual(expected);
    await page.reload();
    await expect(page.getByTestId('category-card')).toHaveCount(3);
    if (kind === 'sidebar') await openSidebar(page, 390);
    expect(await visibleOrder(page, kind)).toEqual(expected);
    await client.detach();
    await context.close();
  });
}
