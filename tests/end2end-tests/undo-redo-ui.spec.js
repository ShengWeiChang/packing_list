import { expect, test } from '@playwright/test';

/** Seed a long checklist for responsive history tests.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {string} [fixture] - Additional fixture variant.
 */
async function seed(page, fixture = 'default') {
  await page.addInitScript((fixture) => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'trip', name: 'Trip', order: 0 },
          ...(fixture === 'drag' ? [{ id: 'second', name: 'Second', order: 1 }] : []),
          ...(fixture === 'fade'
            ? [
                { id: 'second', name: '新清單', order: 1 },
                { id: 'third', name: 'Travel', order: 2 },
              ]
            : []),
        ],
        categories: [
          { id: 'clothes', checklistId: 'trip', name: 'Clothes', order: 0 },
          ...(fixture === 'category'
            ? [{ id: 'other', checklistId: 'trip', name: 'Other', order: 1 }]
            : []),
        ],
        items: [
          ...Array.from({ length: 30 }, (_, order) => ({
            id: `item-${order}`,
            checklistId: 'trip',
            categoryId: 'clothes',
            name: `Item ${order}`,
            quantity: 1,
            order,
            isPacked: false,
            isPending: false,
          })),
          ...(fixture === 'category'
            ? [
                {
                  id: 'other-item',
                  checklistId: 'trip',
                  categoryId: 'other',
                  name: 'Other item',
                  quantity: 1,
                  order: 0,
                  isPacked: false,
                  isPending: false,
                },
              ]
            : []),
        ],
      })
    );
  }, fixture);
}

// Test Case 1: desktop history controls undo and redo a status change and protect an active draft.
test('desktop history controls undo and redo a status change and protect an active draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const undo = page.getByTestId('history-undo');
  const redo = page.getByTestId('history-redo');
  await expect(undo).toBeDisabled();
  const checkbox = page.getByTestId('item-checkbox').first();
  await checkbox.click();
  await expect(undo).toBeEnabled();
  await undo.click();
  await expect(checkbox).not.toBeChecked();
  await expect(redo).toBeEnabled();
  await redo.click();
  await expect(checkbox).toBeChecked();
  await page.getByTestId('item-name').first().click();
  const input = page.getByTestId('item-edit-input').first();
  await input.fill('Unsaved draft');
  await expect(undo).toBeDisabled();
  await undo.click({ force: true });
  await expect(input).toHaveValue('Unsaved draft');
});

// Test Case 2: mobile topbar hides on downward scroll and returns on upward scroll.
test('mobile topbar hides on downward scroll and returns on upward scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/');
  const bar = page.getByTestId('mobile-topbar');
  await expect(bar).toBeVisible();
  await page.getByTestId('topbar-toggle').click();
  await page.getByTestId('overlay-sidebar').getByTestId('sidebar-toggle').click();
  await expect(page.getByTestId('overlay-sidebar')).toHaveCount(0);
  await page.mouse.move(200, 500);
  const offset = () =>
    bar.evaluate((element) => -new DOMMatrix(getComputedStyle(element).transform).m42);
  await page.mouse.wheel(0, 20);
  await expect.poll(offset).toBeCloseTo(20, 0);
  await expect(bar).not.toHaveAttribute('inert', '');
  await page.mouse.wheel(0, -8);
  await expect.poll(offset).toBeCloseTo(12, 0);
  await page.waitForTimeout(250);
  expect(await offset()).toBeCloseTo(12, 0);
  await bar.getByTestId('topbar-new').focus();
  await expect.poll(offset).toBeCloseTo(0, 0);
  await bar.getByTestId('topbar-new').evaluate((element) => element.blur());
  await page.mouse.wheel(0, 500);
  await expect(bar).toHaveAttribute('inert', '');
  const hiddenOffset = await offset();
  await page.setViewportSize({ width: 390, height: 864 });
  expect(await offset()).toBeCloseTo(hiddenOffset, 0);
  await page.mouse.wheel(0, -200);
  await expect(bar).not.toHaveAttribute('inert', '');
  await expect.poll(offset).toBeCloseTo(0, 0);
  await expect(bar.getByTestId('history-undo')).toBeVisible();
});

// Test Case 3: mobile controls restore the last deleted checklist and reset after reload.
test('mobile controls restore the last deleted checklist and reset after reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await seed(page);
  await page.goto('/');
  await page.getByTestId('overflow-trigger-checklist-trip').last().click();
  await page.getByTestId('overflow-action-delete-checklist-trip').last().click();
  await expect(page.getByTestId('history-undo')).toBeEnabled();
  await page.getByTestId('history-undo').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip');
  await expect(page.getByTestId('history-redo')).toBeEnabled();
  await page.reload();
  await expect(page.getByTestId('history-undo')).toBeDisabled();
  await expect(page.getByTestId('history-redo')).toBeDisabled();
});

// Test Case 4: category packing has no toast and undo shows a brief result.
test('category packing has no toast and undo shows a brief result', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page, 'category');
  await page.goto('/');
  await page.getByTestId('category-checkbox').first().click();
  await expect(page.getByTestId('category-checkbox').first()).toBeChecked();
  await expect(page.getByTestId('packing-undo-toast')).toHaveCount(0);
  await expect(page.getByTestId('history-result')).toHaveCount(0);
  await page.getByTestId('history-undo').click();
  await expect(page.getByTestId('history-result')).toContainText('Undone');
  await expect(page.getByTestId('category-checkbox').first()).not.toBeChecked();
});

// Test Case 5: keyboard history works immediately after packing and quantity controls retain checkbox focus.
test('keyboard history works immediately after packing and quantity controls retain checkbox focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const checkbox = page.getByTestId('item-checkbox').first();
  await checkbox.click();
  await page.keyboard.press('Control+z');
  await expect(checkbox).not.toBeChecked();
  await page.keyboard.press('Control+Shift+z');
  await expect(checkbox).toBeChecked();
  await checkbox.click();
  await page.keyboard.press('Control+z');
  await expect(checkbox).toBeChecked();
  await page.getByTestId('item-row').first().hover();
  const quantity = page.getByTestId('item-quantity-value').first();
  await page.getByTestId('item-quantity-increment').first().click();
  await page.keyboard.press('Control+z');
  await expect(quantity).toContainText('1');
  await page.keyboard.press('Control+y');
  await expect(quantity).toContainText('2');
});

// Test Case 6: desktop history controls share the menu row and mobile controls stay beside the menu.
test('desktop history controls share the menu row and mobile controls stay beside the menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const menu = await page.getByTestId('sidebar-toggle').boundingBox();
  const undo = await page.getByTestId('history-undo').boundingBox();
  const redo = await page.getByTestId('history-redo').boundingBox();
  const add = await page.getByTestId('sidebar-new-checklist').boundingBox();
  expect(Math.abs(menu.y + menu.height / 2 - (undo.y + undo.height / 2))).toBeLessThanOrEqual(1);
  expect(undo.x).toBeGreaterThanOrEqual(menu.x + menu.width);
  expect(redo.x).toBeGreaterThanOrEqual(undo.x + undo.width);
  expect(add.y).toBeGreaterThanOrEqual(menu.y + menu.height);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileMenu = await page.getByTestId('topbar-toggle').boundingBox();
  const mobileUndo = await page.getByTestId('history-undo').boundingBox();
  const mobileRedo = await page.getByTestId('history-redo').boundingBox();
  const mobileAdd = await page.getByTestId('topbar-new').boundingBox();
  expect(mobileUndo.x - (mobileMenu.x + mobileMenu.width)).toBeLessThanOrEqual(8);
  expect(mobileRedo.x + mobileRedo.width).toBeLessThan(mobileAdd.x);
});

// Test Case 7: collapsed desktop sidebar hides history controls while shortcuts still work.
test('collapsed desktop sidebar hides history controls while shortcuts still work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const checkbox = page.getByTestId('item-checkbox').first();
  await checkbox.click();
  await expect(page.getByTestId('history-undo')).toBeEnabled();
  const group = page.locator('[data-sidebar-history-reveal]');
  await page.getByTestId('sidebar-toggle').click();
  await expect(group).toHaveAttribute('inert', '');
  await expect(group).toHaveCSS('opacity', '0');
  await page.keyboard.press('Control+z');
  await expect(checkbox).not.toBeChecked();
  await page.keyboard.press('Control+Shift+z');
  await expect(checkbox).toBeChecked();
  await page.getByTestId('sidebar-toggle').click();
  await expect(group).not.toHaveAttribute('inert', '');
  await page.getByTestId('history-undo').focus();
  await page.getByTestId('sidebar-toggle').evaluate((button) => button.click());
  await expect(page.getByTestId('sidebar-toggle')).toBeFocused();
});

// Test Case 8: sidebar heading and checklist names fade with New Checklist without horizontal motion.
test('sidebar heading and checklist names fade with New Checklist without horizontal motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page, 'fade');
  await page.goto('/');
  await expect(page.getByTestId('sidebar-checklist-item')).toHaveCount(3);
  const samples = await page.evaluate(async () => {
    const toggle = document.querySelector('[data-testid="sidebar-toggle"]');
    const label = document.querySelector(
      '[data-testid="sidebar-new-checklist"] [data-sidebar-label]'
    );
    const heading = document.querySelector('[data-sidebar-heading]');
    const history = document.querySelector('[data-sidebar-history-reveal]');
    const names = [...document.querySelectorAll('[data-sidebar-checklist-label]')];
    const runs = [];
    for (let i = 0; i < 2; i++) {
      toggle.click();
      await Promise.resolve();
      const frames = [];
      const start = performance.now();
      while (performance.now() - start < 500) {
        await new Promise(requestAnimationFrame);
        frames.push({
          label: Number(getComputedStyle(label).opacity),
          heading: Number(getComputedStyle(heading).opacity),
          headingX: heading.getBoundingClientRect().x,
          history: Number(getComputedStyle(history).opacity),
          names: names.map((name) => Number(getComputedStyle(name).opacity)),
        });
      }
      runs.push(frames);
    }
    return runs;
  });
  for (const frames of samples) {
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(Math.abs(frame.label - frame.heading)).toBeLessThan(0.03);
      expect(Math.abs(frame.label - frame.history)).toBeLessThan(0.03);
      for (const opacity of frame.names) expect(Math.abs(frame.label - opacity)).toBeLessThan(0.03);
      expect(Math.abs(frame.headingX - frames[0].headingX)).toBeLessThan(1);
    }
  }
  expect(samples[0].at(-1).heading).toBe(0);
  expect(samples[1].at(-1).heading).toBe(1);
});

// Test Case 9: sidebar history respects reduced motion and rapid open-close.
test('sidebar history respects reduced motion and rapid open-close', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page);
  await page.goto('/');
  const toggle = page.getByTestId('sidebar-toggle');
  const group = page.locator('[data-sidebar-history-reveal]');
  await toggle.click();
  await expect(group).toHaveAttribute('inert', '');
  await toggle.click();
  await expect(group).not.toHaveAttribute('inert', '');
  await toggle.click();
  await expect(group).toHaveAttribute('inert', '');
  await toggle.click();
  await expect(group).not.toHaveAttribute('inert', '');
});

// Test Case 10: history controls remain inert until their shared fade completes.
test('history controls remain inert until their shared fade completes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  await page.getByTestId('item-checkbox').first().click();
  const toggle = page.getByTestId('sidebar-toggle');
  const group = page.locator('[data-sidebar-history-reveal]');
  await toggle.click();
  await expect(group).toHaveCSS('opacity', '0');
  const style = await page.addStyleTag({
    content: '[data-sidebar-history-reveal] { transition-duration: 1s !important; }',
  });
  await toggle.click();
  await expect(group).toHaveAttribute('inert', '');
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('history-undo')).not.toBeFocused();
  await expect(group).not.toHaveAttribute('inert', '', { timeout: 3000 });
  await style.evaluate((element) => element.remove());
  await expect(page.getByTestId('history-undo')).toBeEnabled();
});

// Test Case 11: toolbar undo waits for a pending locked status update.
test('toolbar undo waits for a pending locked status update', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const boxes = page.getByTestId('item-checkbox');
  await boxes.nth(0).click();
  await expect(page.getByTestId('history-undo')).toBeEnabled();
  await page.evaluate(async () => {
    await new Promise((ready) => {
      void navigator.locks.request('packing-list-storage-write', async () => {
        ready();
        await new Promise((release) => {
          window.releaseHistoryTestLock = release;
        });
      });
    });
  });
  await boxes.nth(1).click();
  await expect
    .poll(() => page.evaluate(async () => (await navigator.locks.query()).pending.length))
    .toBeGreaterThan(0);
  await page.getByTestId('history-undo').click();
  await page.evaluate(() => window.releaseHistoryTestLock());
  await expect(boxes.nth(1)).not.toBeChecked();
  await expect(boxes.nth(0)).toBeChecked();
  await expect(page.getByTestId('history-redo')).toBeEnabled();
});

// Test Case 12: dragging a checklist creates one reversible history step.
test('dragging a checklist creates one reversible history step', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page, 'drag');
  await page.goto('/');
  const rows = page.getByTestId('sidebar-checklist-item');
  const names = () => rows.allTextContents();
  const before = await names();
  await rows.nth(1).dragTo(rows.nth(0));
  await expect.poll(names).toEqual([...before].reverse());
  await page.getByTestId('history-undo').click();
  await expect.poll(names).toEqual(before);
  await page.getByTestId('history-redo').click();
  await expect.poll(names).toEqual([...before].reverse());
});

// Test Case 13: mobile sidebar controls undo and redo a checklist deletion.
test('mobile sidebar controls undo and redo a checklist deletion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/');
  await page.getByTestId('topbar-toggle').click();
  const drawer = page.getByTestId('overlay-sidebar');
  const undo = drawer.getByTestId('history-undo');
  const redo = drawer.getByTestId('history-redo');
  await expect(undo).toBeVisible();
  await expect(undo).toBeDisabled();
  let dialogs = 0;
  page.on('dialog', async (dialog) => {
    dialogs++;
    await dialog.dismiss();
  });
  await drawer.getByTestId('overflow-trigger-checklist-trip').click();
  await drawer.getByTestId('overflow-action-delete-checklist-trip').click();
  await expect(undo).toBeEnabled();
  await expect(drawer.getByTestId('sidebar-toggle')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(undo).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(drawer.getByTestId('sidebar-toggle')).toBeFocused();
  expect(dialogs).toBe(0);
  await undo.click();
  await expect(drawer.getByTestId('sidebar-checklist-item')).toContainText('Trip');
  const feedback = drawer.getByTestId('sidebar-history-feedback');
  await expect(feedback).toBeVisible();
  await expect(feedback.getByRole('button')).toHaveCount(0);
  await expect(feedback).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(redo).toBeFocused();
  await expect(redo).toBeEnabled();
  await redo.click();
  await expect(drawer.getByTestId('sidebar-checklist-item')).toHaveCount(0);
  await undo.click();
  await drawer.getByTestId('sidebar-toggle').click();
  await expect(page.getByTestId('item-row')).toHaveCount(30);
});

// Test Case 14: keyboard focus keeps the mobile topbar visible while scrolling.
test('keyboard focus keeps the mobile topbar visible while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const button = page.getByTestId('topbar-toggle');
  await expect(button).toBeFocused();
  await page.mouse.move(200, 500);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(page.getByTestId('mobile-topbar')).not.toHaveAttribute('inert', '');
  await expect(button).toBeFocused();
});

// Test Case 15: failed deletion is visible and dismissible inside the mobile sidebar.
test('failed checklist deletion is visible and dismissible inside mobile sidebar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/');
  const before = await page.evaluate(() => localStorage.getItem('packingListApp'));
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListApp') throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.getByTestId('topbar-toggle').click();
  const drawer = page.getByTestId('overlay-sidebar');
  await drawer.getByTestId('overflow-trigger-checklist-trip').click();
  await drawer.getByTestId('overflow-action-delete-checklist-trip').click();
  const feedback = drawer.getByTestId('sidebar-history-feedback');
  await expect(feedback).toHaveAttribute('role', 'alert');
  await expect(feedback).toContainText('storage is full');
  await expect(drawer.getByTestId('sidebar-checklist-item')).toHaveCount(1);
  await expect(drawer.getByTestId('history-undo')).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('packingListApp'))).toBe(before);
  await expect(page.getByTestId('history-result')).toHaveCount(0);
  await feedback.getByRole('button').click();
  await expect(feedback).toHaveCount(0);
  await expect(drawer.getByTestId('sidebar-toggle')).toBeFocused();
});

// Test Case 16: touch scrolling hides and reveals the mobile topbar after closing the drawer.
test('touch scrolling hides and reveals the topbar after closing the drawer', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await seed(page);
  await page.goto('/');
  await page.getByTestId('topbar-toggle').tap();
  await page.getByTestId('overlay-sidebar').getByTestId('sidebar-toggle').tap();
  const client = await context.newCDPSession(page);
  await expect(page.getByTestId('overlay-sidebar')).toHaveCount(0);
  const bar = page.getByTestId('mobile-topbar');
  const snapshot = () =>
    page.evaluate(() => ({
      scroll: window.scrollY,
      offset: -new DOMMatrix(
        getComputedStyle(document.querySelector('[data-testid="mobile-topbar"]')).transform
      ).m42,
    }));
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 365, y: 700 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 365, y: 670 }],
  });
  await expect.poll(async () => (await snapshot()).scroll).toBeGreaterThan(0);
  const first = await snapshot();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 365, y: 658 }],
  });
  await expect.poll(async () => (await snapshot()).scroll).toBeGreaterThan(first.scroll);
  const second = await snapshot();
  expect(second.offset - first.offset).toBeCloseTo(second.scroll - first.scroll, 0);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 365, y: 668 }],
  });
  await expect.poll(async () => (await snapshot()).scroll).toBeLessThan(second.scroll);
  const reverse = await snapshot();
  expect(reverse.offset - second.offset).toBeCloseTo(reverse.scroll - second.scroll, 0);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await snapshot()).scroll).toBe(0);
  const swipe = async (startY, endY) => {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 365, y: startY }],
    });
    for (let i = 1; i <= 8; i++)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 365, y: startY + ((endY - startY) * i) / 8 }],
      });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe(700, 300);
  await expect(bar).toHaveAttribute('inert', '');
  await swipe(300, 550);
  await expect(bar).not.toHaveAttribute('inert', '');
  await context.close();
});
