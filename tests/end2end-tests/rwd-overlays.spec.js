/*
================================================================================
File: tests/end2end-tests/rwd-overlays.spec.js
Description: Responsive focus, overlay and keyboard geometry workflows.
License: MIT (SPDX: MIT)
Created: 2026-11-04
================================================================================
*/

import { expect, test } from '@playwright/test';

import { selectGeneralRecommendedList } from './checklistHelpers.js';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

/** Create an isolated recommended list through the visible navigation.
 * @param {import('@playwright/test').Page} page - Browser page.
 */
async function createList(page) {
  await page.goto('/');
  await page
    .getByTestId(page.viewportSize().width < 600 ? 'topbar-new' : 'sidebar-new-checklist')
    .click();
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
}

// Test Case 1: Drawer owns focus and preserves itself during height-only resize and nested dialogs.
test('drawer isolates background, traps keyboard and restores focus through nested dialogs', async ({
  page,
}) => {
  await createList(page);
  const trigger = page.getByTestId('topbar-toggle');
  await trigger.click();
  const drawer = page.getByTestId('overlay-sidebar');
  await expect(drawer).toBeVisible();
  const opening = await drawer.evaluate(
    (element) =>
      new Promise((resolve) => {
        const start = performance.now();
        const positions = [];
        const sample = () => {
          positions.push(element.getBoundingClientRect().x);
          if (performance.now() - start < 350) requestAnimationFrame(sample);
          else resolve(positions);
        };
        requestAnimationFrame(sample);
      })
  );
  const drawerWidth = (await drawer.boundingBox()).width;
  expect(opening.some((x) => x < -1 && x > -drawerWidth + 1)).toBe(true);
  expect(Math.abs(opening.at(-1))).toBeLessThan(1);
  await expect
    .poll(() => drawer.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  await page
    .getByTestId('item-name')
    .first()
    .evaluate((element) => element.focus());
  await expect
    .poll(() => drawer.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  const controls = drawer.locator(
    'button:visible:not([disabled]), input:visible:not([disabled]), select:visible:not([disabled])'
  );
  await controls.first().focus();
  await page.keyboard.press('Shift+Tab');
  await expect(controls.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(controls.first()).toBeFocused();
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(drawer).toBeVisible();
  await page.getByTestId('sidebar-new-checklist').click();
  await expect(page.getByTestId('new-checklist-dialog')).toBeVisible();
  await expect(drawer).toHaveAttribute('inert');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('new-checklist-dialog')).toHaveCount(0);
  await expect(drawer).toBeVisible();
  await expect
    .poll(() => drawer.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  const closing = page.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now();
        const positions = [];
        const sample = () => {
          const element = document.querySelector('[data-testid="overlay-sidebar"]');
          if (element)
            positions.push({ x: element.getBoundingClientRect().x, inert: element.inert });
          if (performance.now() - start < 400) requestAnimationFrame(sample);
          else resolve(positions);
        };
        requestAnimationFrame(sample);
      })
  );
  await page.keyboard.press('Escape');
  const closingFrames = await closing;
  expect(
    closingFrames.some((frame) => frame.x < -1 && frame.x > -drawerWidth + 1 && frame.inert)
  ).toBe(true);
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await trigger.click();
  await page.keyboard.press('Escape');
  await trigger.click();
  await expect(drawer).toHaveCount(1);
  await expect(drawer).not.toHaveAttribute('inert');
  await expect
    .poll(() => drawer.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  await page.setViewportSize({ width: 820, height: 820 });
  await expect(drawer).toHaveCount(0);
  await expect(page.getByLabel('Close sidebar')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.querySelector('#app > div').inert))
    .toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect(page.getByTestId('sidebar-toggle')).toBeVisible();
  await page.getByTestId('sidebar-toggle').click();
  await expect(drawer).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 820 });
  await expect(drawer).toHaveCount(0);
  await expect(page.getByLabel('Close sidebar')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.querySelector('#app > div').inert))
    .toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect(page.getByTestId('sidebar-toggle')).toBeVisible();
});

// Test Case 2: Drawer commands retain modal ownership and transfer focus to editors.
test('drawer popup traps focus and edit actions unlock their destination', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([{ id: 'rwd-template', name: 'Travel', order: 0, categories: [], items: [] }])
    );
  });
  await createList(page);
  await page.reload();
  await page.getByTestId('topbar-toggle').click();
  const drawer = page.getByTestId('overlay-sidebar');
  const trigger = drawer.locator('[data-testid^="overflow-trigger-checklist-"]').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const popup = page.locator('[data-testid^="overflow-dropdown-checklist-"]');
  await expect(popup.locator('button').first()).toBeFocused();
  await expect
    .poll(() =>
      popup.evaluate((element) => Boolean(element.closest('[data-testid="overlay-sidebar"]')))
    )
    .toBe(true);
  await trigger.focus();
  await expect(popup).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(drawer).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(popup.locator('button').first()).toBeFocused();
  await popup.locator('button').last().focus();
  await page.keyboard.press('Tab');
  await expect
    .poll(() => drawer.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(popup.locator('button').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(page.getByTestId('topbar-toggle')).toBeFocused();
  await page.getByTestId('topbar-toggle').click();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await popup.locator('button').first().click();
  await expect(drawer).toHaveCount(0);
  const editor = page.getByTestId('checklist-name-input');
  await expect(editor).toBeFocused();
  await editor.fill('Renamed from drawer');
  await editor.press('Enter');
  await expect(page.getByTestId('checklist-name')).toHaveText('Renamed from drawer');
  await page.getByTestId('topbar-toggle').click();
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-rwd-template').click();
  await expect(drawer).toHaveCount(0);
  await page.getByTestId('checklist-name').click();
  await expect(editor).toBeFocused();
  await editor.fill('Template draft');
  await editor.press('Enter');
  await expect(page.getByTestId('checklist-name')).toHaveText('Template draft');
});

// Test Case 3: Short source-selection dialog remains bounded and its cancel action is reachable.
test('short dialogs and narrow date editing fit without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 300 });
  await page.goto('/');
  await page.getByTestId('topbar-new').click();
  const dialog = page.getByTestId('new-checklist-dialog');
  const box = await dialog.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(300);
  await page.getByTestId('new-checklist-cancel').click();
  await expect(dialog).toHaveCount(0);
  await createList(page);
  await page.setViewportSize({ width: 320, height: 200 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  const checklistTrigger = page.locator('[data-testid^="overflow-trigger-checklist-"]').last();
  await checklistTrigger.tap();
  const menu = page.locator('[data-testid^="overflow-dropdown-checklist-"]');
  await expect(menu).toBeVisible();
  await expect.poll(async () => (await menu.boundingBox()).y).toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => {
      const box = await menu.boundingBox();
      return box.y + box.height;
    })
    .toBeLessThanOrEqual(200);
  await expect
    .poll(() => menu.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await menu.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(menu).toBeVisible();
  await expect
    .poll(() =>
      menu.evaluate((element) => {
        const last = element.lastElementChild.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return last.bottom <= box.bottom + 1 && last.top >= box.top - 1;
      })
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await page.evaluate(() => (document.documentElement.style.fontSize = ''));
  await page.setViewportSize({ width: 320, height: 300 });
  await page.getByTestId('checklist-name').click();
  for (const input of await page.locator('input[type="date"]').all()) {
    await input.scrollIntoViewIfNeeded();
    const bounds = await input.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Test Case 4: Visual viewport shrink leaves a comfort buffer at the bottom-most editor and cleanup removes it.
test('bottom item input keeps a buffer above a simulated keyboard', async ({ page }) => {
  await page.addInitScript(() => {
    const viewport = new EventTarget();
    Object.assign(viewport, { offsetTop: 0, offsetLeft: 0, width: 390, height: 844 });
    Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
  });
  await createList(page);
  await page.getByTestId('add-item-button').last().click();
  const input = page.getByTestId('item-edit-input');
  await expect(input).toBeFocused();
  await page.evaluate(() => {
    window.visualViewport.height = 400;
    window.visualViewport.dispatchEvent(new Event('resize'));
  });
  await expect
    .poll(async () => (await input.boundingBox()).y + (await input.boundingBox()).height)
    .toBeLessThanOrEqual(373);
  await input.fill('Keyboard buffer');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListApp') throw new DOMException('Quota', 'QuotaExceededError');
      original.call(this, key, value);
    };
    window.restoreRwdStorage = () => {
      Storage.prototype.setItem = original;
    };
  });
  await input.press('Enter');
  await expect(input).toHaveValue('Keyboard buffer');
  await expect(input.locator('xpath=..').getByRole('alert')).toBeVisible();
  await expect
    .poll(async () => (await input.boundingBox()).y + (await input.boundingBox()).height)
    .toBeLessThanOrEqual(373);
  await page.evaluate(() => window.restoreRwdStorage());
  await input.press('Enter');
  await expect(input).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.paddingBottom)).toBe('');
});

test.describe('desktop popup', () => {
  test.use({ viewport: { width: 1280, height: 500 }, hasTouch: false, isMobile: false });
  // Test Case 5: A bottom-edge menu opens upward outside transformed item cards; Escape returns focus.
  test('bottom popup fits and keyboard can activate and dismiss it', async ({ page }) => {
    await createList(page);
    const row = page.getByTestId('item-row').last();
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    const trigger = row.locator('[data-testid^="overflow-trigger-item-"]');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const menu = page.locator('[data-testid^="overflow-dropdown-item-"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('button').first()).toBeFocused();
    const bounds = await menu.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(500);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});
