/*
================================================================================
File: tests/end2end-tests/rwd-phone.spec.js
Description: Touch actions, geometry, tablet rotation, mouse controls and sorting.
License: MIT (SPDX: MIT)
Created: 2026-10-30
================================================================================
*/

import { expect, test } from '@playwright/test';

import { selectGeneralRecommendedList } from './checklistHelpers.js';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

/**
 * Create isolated data through the visible navigation at each width.
 * @param {import('@playwright/test').Page} page - Test page.
 */
async function createList(page) {
  await page.goto('/');
  const create =
    page.viewportSize().width < 600
      ? page.getByTestId('topbar-new')
      : page.getByTestId('sidebar-new-checklist');
  await create.tap();
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect(page.getByTestId('checklist-name')).toBeVisible();
}

/**
 * Locate the stable item action trigger.
 * @param {import('@playwright/test').Locator} row - Item row.
 * @returns {Promise<import('@playwright/test').Locator>} Trigger locator.
 */
async function triggerFor(row) {
  return row.locator('[data-testid^="overflow-trigger-item-"]');
}

/**
 * Read the actual text start, including an element's left padding.
 * @param {import('@playwright/test').Locator} locator - Text container.
 * @returns {Promise<number>} Horizontal text start in CSS pixels.
 */
async function textStart(locator) {
  return locator.evaluate(
    (element) =>
      element.getBoundingClientRect().left + parseFloat(getComputedStyle(element).paddingLeft)
  );
}

/**
 * Count dark rendered pixels in a visible label, independent of font shape.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {import('@playwright/test').Locator} label - Visible text label.
 * @returns {Promise<number>} Number of dark pixels.
 */
async function renderedTextPixels(page, label) {
  const box = await label.boundingBox();
  const screenshot = await page.screenshot();
  return page.evaluate(
    async ({ imageData, rect }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${imageData}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const scale = image.width / window.innerWidth;
      const pixels = context.getImageData(
        Math.round(rect.x * scale),
        Math.round(rect.y * scale),
        Math.round(rect.width * scale),
        Math.round(rect.height * scale)
      ).data;
      let darkPixels = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 100 && pixels[i + 1] < 100 && pixels[i + 2] < 100) darkPixels++;
      }
      return darkPixels;
    },
    { imageData: screenshot.toString('base64'), rect: box }
  );
}

// Test Case 1: A real touch context reaches all quick actions and persists successive changes.
test('touch actions remain open and persist quantity and pending state', async ({ page }) => {
  await createList(page);
  const row = page.getByTestId('item-row').first();
  const firstCategory = page.getByTestId('category-card').first();
  for (const control of [
    firstCategory.getByTestId('category-collapse-toggle'),
    firstCategory.locator('[data-testid^="overflow-trigger-category-"]'),
    await triggerFor(row),
  ]) {
    await expect(control).toHaveCSS('opacity', '1');
    await expect(control).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  for (const type of ['category', 'checklist']) {
    const trigger = page.locator(`[data-testid^="overflow-trigger-${type}-"]`).last();
    await trigger.tap();
    const menu = page.locator(`[data-testid^="overflow-dropdown-${type}-"]`);
    await expect(menu).toBeVisible();
    await expect.poll(async () => (await menu.boundingBox()).x).toBeGreaterThanOrEqual(0);
    const menuBox = await menu.boundingBox();
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(320);
    for (const action of await menu.locator('button').all()) {
      expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await expect(action).toHaveCSS('font-size', '16px');
    }
    await trigger.tap();
    await expect(menu).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const id = await row.getAttribute('data-item-id');
  const initialName = await row.getByTestId('item-name').textContent();
  await expect(row.getByTestId('item-inline-actions')).toHaveCount(0);
  await (await triggerFor(row)).tap();
  await expect(await triggerFor(row)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(row).toHaveCSS('background-color', 'rgb(243, 244, 246)');
  await expect(row.getByTestId('item-inline-actions')).toHaveCSS('height', '45px');
  await expect(row.locator('.inline-quantity-group')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)'
  );
  await expect(row.getByTestId('item-edit-input')).toHaveCount(0);
  const actionTargets = [
    row.getByTestId('item-quantity-decrement'),
    row.getByTestId('item-quantity-increment'),
    row.getByTestId('item-pending-toggle'),
    row.getByTestId('item-action-edit'),
    row.getByTestId('item-action-copy'),
    row.getByTestId('item-action-delete'),
  ];
  const actionBoxes = await Promise.all(actionTargets.map((target) => target.boundingBox()));
  for (const box of actionBoxes) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(box.y - actionBoxes[0].y)).toBeLessThan(1);
  }
  for (const target of actionTargets.slice(2)) {
    await expect(target).toHaveAttribute('aria-label', /.+/);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  const toolbar = await row.getByTestId('item-inline-actions').boundingBox();
  const narrowBoxes = await Promise.all(actionTargets.map((target) => target.boundingBox()));
  for (const box of narrowBoxes) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(toolbar.x);
    expect(box.x + box.width).toBeLessThanOrEqual(toolbar.x + toolbar.width + 1);
  }
  for (let first = 0; first < narrowBoxes.length; first++) {
    for (let second = first + 1; second < narrowBoxes.length; second++) {
      const a = narrowBoxes[first];
      const b = narrowBoxes[second];
      expect(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y
      ).toBe(true);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await row.getByTestId('item-pending-toggle').tap();
  const pendingSummary = row.getByTestId('item-pending-summary');
  const emptyQuantity = row.getByTestId('item-quantity-summary');
  await expect(emptyQuantity).toHaveAttribute('aria-hidden', 'true');
  await expect(emptyQuantity).toHaveText('');
  const pendingAtOne = await pendingSummary.boundingBox();
  await row.getByTestId('item-quantity-increment').tap();
  await expect(emptyQuantity).toHaveText('×2');
  await expect(emptyQuantity).not.toHaveAttribute('aria-hidden');
  const pendingAtTwo = await pendingSummary.boundingBox();
  expect(Math.abs(pendingAtOne.x - pendingAtTwo.x)).toBeLessThan(1);
  await row.getByTestId('item-quantity-decrement').tap();
  await row.getByTestId('item-pending-toggle').tap();
  await expect(emptyQuantity).toHaveCount(0);
  for (let n = 0; n < 3; n++) await row.getByTestId('item-quantity-increment').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×4');
  await row.getByTestId('item-quantity-decrement').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×3');
  await expect(row.getByTestId('item-pending-toggle').locator('svg')).toHaveClass(
    /lucide-clipboard(?!-check)/
  );
  await row.getByTestId('item-pending-toggle').tap();
  await expect(row.getByTestId('item-pending-toggle')).toHaveAttribute('aria-pressed', 'true');
  const pendingToggle = row.getByTestId('item-pending-toggle');
  await expect(pendingToggle).toHaveCSS('color', 'rgb(124, 45, 18)');
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(pendingToggle.locator('svg')).toHaveClass(/lucide-clipboard-check/);
  await page.emulateMedia({ forcedColors: 'none' });
  const pendingRow = page.getByTestId('pending-item-row').first();
  const complete = pendingRow.getByTestId('pending-item-complete');
  const completeBox = await complete.boundingBox();
  const circleBox = await complete.locator('span').boundingBox();
  expect(completeBox.width).toBeGreaterThanOrEqual(44);
  expect(completeBox.height).toBeGreaterThanOrEqual(44);
  expect(circleBox.width).toBe(20);
  expect(circleBox.height).toBe(20);
  await expect(pendingRow.locator('div > span').first()).toHaveCSS('font-size', '18px');
  await expect(pendingRow.getByTestId('pending-item-quantity')).toHaveCSS('font-size', '14px');
  await complete.tap({ position: { x: 2, y: 2 } });
  await expect(pendingRow).toHaveCount(0);
  await (await triggerFor(row)).tap();
  await row.getByTestId('item-pending-toggle').tap();
  await expect(row.getByTestId('item-pending-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(row.getByTestId('item-inline-actions')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('phone-open.png') });
  await page.reload();
  const restored = page.locator(`[data-testid="item-row"][data-item-id="${id}"]`);
  await expect(restored.getByTestId('item-name')).toHaveText(initialName.trim());
  await expect(restored.getByTestId('item-quantity-summary')).toHaveText('×3');
  await expect(restored.getByTestId('item-pending-summary')).toBeVisible();
  const category = restored.locator('xpath=ancestor::*[@data-testid="category-card"]');
  const boxes = await Promise.all([
    category.getByTestId('category-checkbox').boundingBox(),
    restored.getByTestId('item-checkbox').boundingBox(),
    category.getByTestId('category-collapse-toggle').boundingBox(),
    restored.getByTestId('item-quantity-summary').boundingBox(),
    category.locator('[data-testid^="overflow-trigger-category-"]').boundingBox(),
    (await triggerFor(restored)).boundingBox(),
    category.getByTestId('add-item-button-icon').boundingBox(),
  ]);
  const centerX = (box) => box.x + box.width / 2;
  for (const [first, second] of [
    [0, 1],
    [2, 3],
    [4, 5],
    [1, 6],
  ]) {
    expect(Math.abs(centerX(boxes[first]) - centerX(boxes[second]))).toBeLessThan(1);
  }
  const addLabel = category.getByTestId('add-item-button').locator(':scope > span').last();
  expect(
    Math.abs((await textStart(addLabel)) - (await textStart(restored.getByTestId('item-name'))))
  ).toBeLessThan(1);
  await expect(addLabel).toHaveCSS('font-size', '18px');
  await restored.locator('label').tap();
  await expect(restored.getByTestId('item-checkbox')).toBeChecked();
  await expect(restored.getByTestId('item-pending-summary')).toHaveCount(0);
  await category.getByTestId('category-checkbox').tap();
  await expect(category).toHaveAttribute('data-completed', 'true');
  await (await triggerFor(restored)).tap();
  await expect(restored).toHaveCSS('background-color', 'rgb(227, 242, 232)');
  await expect(await triggerFor(restored)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await (await triggerFor(restored)).tap();
  await expect(restored).toHaveCSS('background-color', 'rgb(240, 253, 244)');
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await expect
    .poll(async () =>
      Math.abs((await textStart(addLabel)) - (await textStart(restored.getByTestId('item-name'))))
    )
    .toBeLessThan(1);
  await expect
    .poll(async () => {
      const plus = await category.getByTestId('add-item-button-icon').boundingBox();
      const checkbox = await restored.getByTestId('item-checkbox').boundingBox();
      return Math.abs(centerX(plus) - centerX(checkbox));
    })
    .toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Test Case 2: Opening a long-name row only adds a second row; targets include their visible edges.
test('keeps name geometry stable and makes checkbox edges actionable', async ({ page }) => {
  await createList(page);
  const row = page.getByTestId('item-row').first();
  await row.getByTestId('item-name').tap();
  await row.getByTestId('item-edit-input').fill('防水保暖外套與登山旅行備用衣物 ABCDEFGHIJKLMNOP');
  await row.getByTestId('item-edit-input').press('Enter');
  const before = await row.getByTestId('item-name').boundingBox();
  await (await triggerFor(row)).tap();
  const after = await row.getByTestId('item-name').boundingBox();
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
  for (const target of [
    row.locator('label'),
    await triggerFor(row),
    row.getByTestId('item-quantity-increment'),
  ]) {
    const bounds = await target.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  }
  const label = row.locator('label');
  await label.tap({ position: { x: 2, y: 2 } });
  await expect(row.getByTestId('item-checkbox')).toBeChecked();
  await label.tap({ position: { x: 2, y: 2 } });
  await expect(row.getByTestId('item-checkbox')).not.toBeChecked();
  await page.setViewportSize({ width: 320, height: 844 });
  await row.getByTestId('item-pending-toggle').tap();
  await expect(row.getByTestId('item-pending-toggle')).toHaveAttribute('aria-pressed', 'true');
  const nameBox = await row.getByTestId('item-name').boundingBox();
  const pendingBox = await row.getByTestId('item-pending-summary').boundingBox();
  const menuBox = await (await triggerFor(row)).boundingBox();
  expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(pendingBox.x);
  expect(pendingBox.x + pendingBox.width).toBeLessThanOrEqual(menuBox.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  const id = await row.getAttribute('data-item-id');
  await page.evaluate((itemId) => {
    const data = JSON.parse(localStorage.getItem('packingListApp'));
    data.items.find((item) => item.id === itemId).quantity = 999;
    localStorage.setItem('packingListApp', JSON.stringify(data));
  }, id);
  await page.reload();
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  const summary = page.locator(`[data-item-id="${id}"] [data-testid="item-quantity-summary"]`);
  await expect(summary).toHaveText('×999');
  await expect
    .poll(() =>
      summary.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const column = element.getBoundingClientRect();
        return text.left >= column.left && text.right <= column.right;
      })
    )
    .toBe(true);
  const largeRow = page.locator(`[data-testid="item-row"][data-item-id="${id}"]`);
  const largePending = await largeRow.getByTestId('item-pending-summary').boundingBox();
  const largeSummary = await summary.boundingBox();
  const largeMenu = await (await triggerFor(largeRow)).boundingBox();
  expect(largePending.x + largePending.width).toBeLessThanOrEqual(largeSummary.x);
  expect(largeSummary.x + largeSummary.width).toBeLessThanOrEqual(largeMenu.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

// Test Case 3: Switching items, explicit rename and Escape use one activation and proper focus.
test('switches one open item and shares the direct rename flow', async ({ page }) => {
  await createList(page);
  const rows = page.getByTestId('item-row');
  await (await triggerFor(rows.nth(0))).tap();
  await (await triggerFor(rows.nth(1))).tap();
  await expect(page.getByTestId('item-inline-actions')).toHaveCount(1);
  await expect(rows.nth(1).getByTestId('item-inline-actions')).toBeVisible();
  await rows.nth(1).getByTestId('item-action-edit').tap();
  await expect(rows.nth(1).getByTestId('item-edit-input')).toBeFocused();
  await expect(rows.nth(1).getByTestId('item-inline-actions')).toBeVisible();
  await rows.nth(1).getByTestId('item-edit-input').fill('改名測試');
  await rows.nth(1).getByTestId('item-quantity-increment').tap();
  await expect(rows.nth(1).getByTestId('item-name')).toHaveText('改名測試');
  await expect(rows.nth(1).getByTestId('item-quantity-value')).toHaveText('×2');
  await rows.nth(1).getByTestId('item-action-copy').focus();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('item-inline-actions')).toHaveCount(0);
  await expect(await triggerFor(rows.nth(1))).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(rows.nth(1).getByTestId('item-inline-actions')).toBeVisible();
  await expect(await triggerFor(rows.nth(1))).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('item-inline-actions')).toHaveCount(0);
  await expect(await triggerFor(rows.nth(1))).toBeFocused();
  await (await triggerFor(rows.nth(0))).tap();
  await rows.nth(1).getByTestId('item-name').tap();
  await expect(rows.nth(1).getByTestId('item-edit-input')).toBeFocused();
});

test.describe('touch tablet', () => {
  test.use({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
  // Test Case 4: Tablet columns follow available width without losing touch controls.
  test('fits tablet categories to available width while keeping touch actions', async ({
    page,
  }) => {
    await createList(page);
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('packingListApp'));
      const original = data.checklists[0];
      for (let index = 0; index < 30; index++) {
        data.checklists.push({
          ...original,
          id: `sidebar-scroll-${index}`,
          name: `長清單 ${index}`,
          order: index + 1,
        });
      }
      localStorage.setItem('packingListApp', JSON.stringify(data));
    });
    await page.reload();
    const sidebarScrollport = page
      .locator('aside [data-testid="sidebar-checklists-draggable"]')
      .locator('xpath=../..');
    await expect
      .poll(() =>
        sidebarScrollport.evaluate((element) => element.scrollHeight > element.clientHeight)
      )
      .toBe(true);
    await sidebarScrollport.evaluate((element) => {
      element.scrollTop = 300;
    });
    await expect
      .poll(() => sidebarScrollport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await sidebarScrollport.evaluate((element) => {
      element.scrollTop = 0;
    });
    const sidebarOverflowDuringToggle = () =>
      page.evaluate(async () => {
        const samples = [];
        for (let i = 0; i < 2; i++) {
          document.querySelector('aside [data-testid="sidebar-toggle"]').click();
          const start = performance.now();
          await new Promise((resolve) => {
            const sample = () => {
              const list = document.querySelector(
                'aside [data-testid="sidebar-checklists-draggable"]'
              );
              const scrollport = list?.closest('.overflow-y-auto');
              if (scrollport) samples.push(scrollport.scrollWidth - scrollport.clientWidth);
              if (performance.now() - start < 400) requestAnimationFrame(sample);
              else resolve();
            };
            requestAnimationFrame(sample);
          });
        }
        return samples;
      });
    let sidebarSamples = await sidebarOverflowDuringToggle();
    expect(sidebarSamples.length).toBeGreaterThan(0);
    expect(Math.max(...sidebarSamples)).toBeLessThanOrEqual(0);
    expect(
      (await page.getByTestId('sidebar-checklist-item').first().boundingBox()).width
    ).toBeGreaterThanOrEqual(44);
    await page.setViewportSize({ width: 1376, height: 1032 });
    await expect.poll(async () => (await page.locator('aside').boundingBox()).width).toBe(64);
    sidebarSamples = await sidebarOverflowDuringToggle();
    expect(sidebarSamples.length).toBeGreaterThan(0);
    expect(Math.max(...sidebarSamples)).toBeLessThanOrEqual(0);
    await page.evaluate(() => localStorage.removeItem('sidebar-manually-collapsed'));
    await page.setViewportSize({ width: 820, height: 1180 });
    const categories = page.getByTestId('category-card');
    const columnCount = async () => {
      const boxes = await categories.all();
      const positions = await Promise.all(boxes.map(async (box) => (await box.boundingBox()).x));
      return new Set(positions.map(Math.round)).size;
    };
    await expect.poll(columnCount).toBe(2);
    await page.mouse.move(0, 0);
    const category = categories.first();
    const collapse = category.getByTestId('category-collapse-toggle');
    const categoryMenu = category.locator('[data-testid^="overflow-trigger-category-"]');
    await expect(collapse).toHaveCSS('-webkit-tap-highlight-color', 'rgba(0, 0, 0, 0)');
    for (const control of [collapse, categoryMenu]) {
      await expect(control).toHaveCSS('opacity', '1');
      await expect(control).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      const box = await control.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await categoryMenu.tap();
    await expect(categoryMenu).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    expect(await categoryMenu.evaluate((element) => element.matches(':focus-visible'))).toBe(false);
    await expect(page.locator('[data-testid^="overflow-dropdown-category-"]')).toBeVisible();
    for (const action of await page
      .locator('[data-testid^="overflow-dropdown-category-"] button')
      .all()) {
      expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await expect(action).toHaveCSS('font-size', '16px');
    }
    await categoryMenu.tap();
    const checklistTrigger = page.locator('[data-testid^="overflow-trigger-checklist-"]').last();
    await checklistTrigger.tap();
    const checklistMenu = page.locator('[data-testid^="overflow-dropdown-checklist-"]');
    await expect(checklistMenu).toBeVisible();
    for (const action of await checklistMenu.locator('button').all()) {
      expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await expect(action).toHaveCSS('font-size', '16px');
    }
    await checklistTrigger.tap();
    await collapse.hover();
    await page.mouse.down();
    await expect(collapse).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page.mouse.up();
    await expect(collapse).toHaveAttribute('aria-expanded', 'false');
    await expect(collapse).toHaveCSS('opacity', '1');
    expect(
      await collapse.evaluate((element) => getComputedStyle(element).transitionProperty)
    ).not.toContain('all');
    await collapse.tap();
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    expect(await collapse.evaluate((element) => element.matches(':focus-visible'))).toBe(false);
    const row = page.getByTestId('item-row').first();
    const secondRow = categories.first().getByTestId('item-row').nth(1);
    const rowBox = await row.boundingBox();
    const nextBox = await secondRow.boundingBox();
    expect(Math.abs(nextBox.y - rowBox.y - 48)).toBeLessThan(1);
    const firstTouch = await row.locator('label').boundingBox();
    const nextTouch = await secondRow.locator('label').boundingBox();
    expect(nextTouch.y - firstTouch.y - firstTouch.height).toBeGreaterThanOrEqual(4);
    const firstMore = await (await triggerFor(row)).boundingBox();
    const nextMore = await (await triggerFor(secondRow)).boundingBox();
    expect(firstMore.width).toBeGreaterThanOrEqual(44);
    expect(firstMore.height).toBeGreaterThanOrEqual(44);
    expect(nextMore.y - firstMore.y - firstMore.height).toBeGreaterThanOrEqual(4);
    const itemName = row.getByTestId('item-name');
    const addLabel = category.getByTestId('add-item-button').locator(':scope > span').last();
    expect(Math.abs((await textStart(itemName)) - (await textStart(addLabel)))).toBeLessThan(1);
    await expect(itemName).toHaveCSS('font-size', '18px');
    await expect(addLabel).toHaveCSS('font-size', '18px');
    await itemName.tap();
    const nameEditor = row.getByTestId('item-edit-input');
    await expect(nameEditor).toHaveCSS('font-size', '18px');
    await nameEditor.fill('防水保暖外套與登山旅行備用物品 ABCDEFGHIJKLMNOP');
    await nameEditor.press('Enter');
    await expect(itemName).toHaveText('防水保暖外套與登山旅行備用物品 ABCDEFGHIJKLMNOP');
    const trigger = await triggerFor(row);
    await expect(trigger).toHaveCSS('opacity', '1');
    const heading = categories.first().getByTestId('category-name');
    const headingPixelsBefore = await renderedTextPixels(page, heading);
    expect(headingPixelsBefore).toBeGreaterThan(20);
    const nameBefore = await row.getByTestId('item-name').boundingBox();
    await trigger.tap();
    await expect(row.getByTestId('item-inline-actions')).toBeVisible();
    const headingPixelsAfter = await renderedTextPixels(page, heading);
    expect(headingPixelsAfter).toBeGreaterThan(headingPixelsBefore * 0.5);
    const nameAfter = await row.getByTestId('item-name').boundingBox();
    expect(Math.abs(nameAfter.width - nameBefore.width)).toBeLessThan(1);
    expect(Math.abs(nameAfter.height - nameBefore.height)).toBeLessThan(1);
    const checkbox = await row.getByTestId('item-checkbox').boundingBox();
    const addIcon = await category.getByTestId('add-item-button-icon').boundingBox();
    expect(Math.abs(checkbox.x + checkbox.width / 2 - addIcon.x - addIcon.width / 2)).toBeLessThan(
      1
    );
    const actionBoxes = await Promise.all(
      (await row.getByTestId('item-inline-actions').locator('button').all()).map((button) =>
        button.boundingBox()
      )
    );
    for (const box of actionBoxes) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: test.info().outputPath('tablet-open.png') });
    await page.setViewportSize({ width: 690, height: 820 });
    await expect.poll(columnCount).toBe(1);
    await expect(row.getByTestId('item-inline-actions')).toBeVisible();
    const nextTwoRows = category.getByTestId('item-row');
    const followingPitch = async () => {
      const first = await nextTwoRows.nth(1).boundingBox();
      const second = await nextTwoRows.nth(2).boundingBox();
      return second.y - first.y;
    };
    await page.setViewportSize({ width: 767, height: 820 });
    await expect.poll(followingPitch).toBe(52);
    await page.setViewportSize({ width: 768, height: 820 });
    await expect.poll(followingPitch).toBe(48);
    await page.setViewportSize({ width: 1180, height: 820 });
    await expect.poll(columnCount).toBeGreaterThanOrEqual(2);
    await expect(row.getByTestId('item-inline-actions')).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 820 });
    await expect.poll(columnCount).toBe(2);
    await page.getByTestId('sidebar-toggle').tap();
    await expect.poll(columnCount).toBe(3);
    await page.getByTestId('sidebar-toggle').tap();
    await expect.poll(columnCount).toBe(2);
    await expect(trigger).toBeVisible();
    const rightmostIndex = await categories.evaluateAll((cards) =>
      cards.reduce(
        (best, card, index) =>
          card.querySelector('[data-testid="item-row"]') &&
          card.getBoundingClientRect().left > cards[best].getBoundingClientRect().left
            ? index
            : best,
        0
      )
    );
    const rightRow = categories.nth(rightmostIndex).getByTestId('item-row').first();
    await (await triggerFor(rightRow)).tap();
    await rightRow.getByTestId('item-quantity-increment').tap();
    await expect(rightRow.getByTestId('item-quantity-value')).toHaveText('×2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    await expect
      .poll(async () => Math.abs((await textStart(itemName)) - (await textStart(addLabel))))
      .toBeLessThan(1);
    await expect
      .poll(async () => {
        const plus = await category.getByTestId('add-item-button-icon').boundingBox();
        const checkbox = await row.getByTestId('item-checkbox').boundingBox();
        return Math.abs(plus.x + plus.width / 2 - checkbox.x - checkbox.width / 2);
      })
      .toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  });
});

test.describe('mouse desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false, isMobile: false });
  // Test Case 5: Desktop retains hover quick controls and the short management popup.
  test('retains hover quick controls and the desktop command menu', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sidebar-new-checklist').click();
    await selectGeneralRecommendedList(page);
    await page.getByTestId('checklist-name-input').press('Enter');
    const row = page.getByTestId('item-row').first();
    const category = row.locator('xpath=ancestor::*[@data-testid="category-card"]');
    const categoryMenuTrigger = category.locator('[data-testid^="overflow-trigger-category-"]');
    const collapse = category.getByTestId('category-collapse-toggle');
    await page.mouse.move(0, 0);
    await expect(categoryMenuTrigger).toHaveCSS('opacity', '0');
    await expect(collapse).toHaveCSS('opacity', '0');
    await category.hover();
    await expect(categoryMenuTrigger).toHaveCSS('opacity', '1');
    await expect(categoryMenuTrigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await categoryMenuTrigger.hover();
    await expect(categoryMenuTrigger).toHaveCSS('background-color', 'rgb(229, 231, 235)');
    await collapse.hover();
    await expect(collapse).toHaveCSS('background-color', 'rgb(229, 231, 235)');
    await categoryMenuTrigger.click();
    for (const action of await page
      .locator('[data-testid^="overflow-dropdown-category-"] button')
      .all()) {
      expect((await action.boundingBox()).height).toBe(36);
      await expect(action).toHaveCSS('font-size', '14px');
    }
    await categoryMenuTrigger.click();
    await page.mouse.move(0, 0);
    await expect(categoryMenuTrigger).toHaveCSS('opacity', '0');
    await row.hover();
    await expect(row).toHaveCSS('background-color', 'rgb(243, 244, 246)');
    for (const control of [
      row.getByTestId('item-quantity-increment'),
      row.getByTestId('item-pending-toggle'),
      await triggerFor(row),
    ]) {
      await expect(control).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
    const addLabel = category.getByTestId('add-item-button').locator(':scope > span').last();
    expect(
      Math.abs((await textStart(row.getByTestId('item-name'))) - (await textStart(addLabel)))
    ).toBeLessThan(1);
    await expect(row.getByTestId('item-name')).toHaveCSS('font-size', '16px');
    await expect(addLabel).toHaveCSS('font-size', '16px');
    await expect(collapse).toHaveCSS('opacity', '1');
    await page.mouse.move(0, 0);
    await category.getByTestId('category-name').focus();
    await page.keyboard.press('Tab');
    await expect(collapse).toBeFocused();
    await expect(collapse).toHaveCSS('opacity', '1');
    expect(await collapse.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await expect(collapse).not.toHaveCSS('box-shadow', 'none');
    await page.keyboard.press('Tab');
    await expect(categoryMenuTrigger).toBeFocused();
    await expect(categoryMenuTrigger).toHaveCSS('opacity', '1');
    const categoryCheckbox = await category.getByTestId('category-checkbox').boundingBox();
    const itemCheckbox = await row.getByTestId('item-checkbox').boundingBox();
    const addIcon = await category.getByTestId('add-item-button-icon').boundingBox();
    const categoryMenu = await category
      .locator('[data-testid^="overflow-trigger-category-"]')
      .boundingBox();
    const itemMenu = await (await triggerFor(row)).boundingBox();
    expect(itemCheckbox.width).toBe(categoryCheckbox.width);
    expect(itemCheckbox.height).toBe(categoryCheckbox.height);
    expect(itemCheckbox.x).toBe(categoryCheckbox.x);
    expect(itemCheckbox.x + itemCheckbox.width / 2).toBe(addIcon.x + addIcon.width / 2);
    expect(itemMenu.width).toBe(categoryMenu.width);
    expect(itemMenu.height).toBe(categoryMenu.height);
    expect(itemMenu.x).toBe(categoryMenu.x);
    const categoryBox = await category.boundingBox();
    expect(categoryBox.x + categoryBox.width - (itemMenu.x + itemMenu.width)).toBe(16);
    await (
      await triggerFor(row)
    ).evaluate((element) =>
      element.dispatchEvent(new PointerEvent('click', { bubbles: true, pointerType: 'touch' }))
    );
    await expect(row.getByTestId('item-inline-actions')).toBeVisible();
    const hybridCheckbox = await row.getByTestId('item-checkbox').boundingBox();
    expect(hybridCheckbox.x).toBe(categoryCheckbox.x);
    await (
      await triggerFor(row)
    ).evaluate((element) =>
      element.dispatchEvent(new PointerEvent('click', { bubbles: true, pointerType: 'touch' }))
    );
    await expect(row.getByTestId('item-inline-actions')).toHaveCount(0);
    await row.hover();
    await expect(row.getByTestId('item-quantity-increment')).toHaveCSS('opacity', '1');
    const quantity = await row.getByTestId('item-quantity-controls').boundingBox();
    const pending = await row.getByTestId('item-pending-toggle').boundingBox();
    expect(quantity.x + quantity.width).toBeLessThanOrEqual(pending.x);
    const pendingToggle = row.getByTestId('item-pending-toggle');
    await row.getByTestId('item-quantity-increment').hover();
    await expect(row.getByTestId('item-quantity-increment')).toHaveCSS(
      'background-color',
      'rgb(229, 231, 235)'
    );
    await (await triggerFor(row)).hover();
    await expect(await triggerFor(row)).toHaveCSS('background-color', 'rgb(229, 231, 235)');
    expect(
      await (
        await triggerFor(row)
      ).evaluate((element) => getComputedStyle(element).transitionProperty)
    ).not.toContain('opacity');
    await expect(pendingToggle.locator('svg')).toHaveClass(/lucide-clipboard(?!-check)/);
    await pendingToggle.click();
    await expect(pendingToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(pendingToggle).toHaveCSS('color', 'rgb(124, 45, 18)');
    const pendingRow = page.getByTestId('pending-item-row').first();
    await expect(pendingRow.locator('div > span').first()).toHaveCSS('font-size', '16px');
    expect((await pendingRow.getByTestId('pending-item-complete').boundingBox()).width).toBe(20);
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(pendingToggle.locator('svg')).toHaveClass(/lucide-clipboard-check/);
    await page.emulateMedia({ forcedColors: 'none' });
    await pendingToggle.click();
    await expect(pendingToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(pendingToggle.locator('svg')).toHaveClass(/lucide-clipboard(?!-check)/);
    await row.hover();
    await row.getByTestId('item-quantity-increment').click();
    await expect(row.getByTestId('item-quantity-value')).toContainText('2');
    await (await triggerFor(row)).click();
    await expect(page.locator('[data-testid^="overflow-dropdown-item-"]')).toBeVisible();
    await expect(row.getByTestId('item-inline-actions')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('desktop-hover.png') });
    await (await triggerFor(row)).click();
    await expect(page.locator('[data-testid^="overflow-dropdown-item-"]')).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expect(await triggerFor(row)).toHaveCSS('opacity', '0');
    await row.getByTestId('item-name').focus();
    await page.keyboard.press('Tab');
    await expect(row.getByTestId('item-quantity-decrement')).toBeFocused();
    await expect(await triggerFor(row)).toHaveCSS('opacity', '1');
    await category.getByTestId('category-checkbox').click();
    await expect(category).toHaveAttribute('data-completed', 'true');
    await row.hover();
    await expect(row).toHaveCSS('background-color', 'rgb(227, 242, 232)');
    await (await triggerFor(row)).hover();
    await expect(await triggerFor(row)).toHaveCSS('background-color', 'rgb(211, 227, 219)');
    await row.getByTestId('item-quantity-increment').hover();
    await expect(row.getByTestId('item-quantity-increment')).toHaveCSS(
      'background-color',
      'rgb(211, 227, 219)'
    );
    await row.getByTestId('item-pending-toggle').hover();
    await expect(row.getByTestId('item-pending-toggle')).toHaveCSS(
      'background-color',
      'rgb(211, 227, 219)'
    );
    await categoryMenuTrigger.hover();
    await expect(categoryMenuTrigger).toHaveCSS('background-color', 'rgb(211, 227, 219)');
    await collapse.hover();
    await expect(collapse).toHaveCSS('background-color', 'rgb(211, 227, 219)');
    await expect(row.getByTestId('item-name')).toHaveCSS('color', 'rgb(75, 85, 99)');
    await page.mouse.move(0, 0);
    await expect(row).toHaveCSS('background-color', 'rgb(240, 253, 244)');
  });
});

// Test Case 6: Holding a real touch on a control does not drag; the existing name-area long press can still reorder.
test('preserves touch sorting while excluding action buttons', async ({ page, context }) => {
  await createList(page);
  const rows = page.getByTestId('category-card').first().getByTestId('item-row');
  const firstId = await rows.nth(0).getAttribute('data-item-id');
  const client = await context.newCDPSession(page);
  await (await triggerFor(rows.nth(0))).tap();
  const plus = await rows.nth(0).getByTestId('item-quantity-increment').boundingBox();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: plus.x + plus.width / 2, y: plus.y + plus.height / 2 }],
  });
  await page.waitForTimeout(280);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(rows.nth(0).getByTestId('item-quantity-value')).toHaveText('×2');
  expect(await rows.nth(0).getAttribute('data-item-id')).toBe(firstId);
  await (await triggerFor(rows.nth(0))).tap();
  const start = await rows.nth(0).getByTestId('item-name').boundingBox();
  const target = await rows.nth(1).getByTestId('item-name').boundingBox();
  const x = start.x + start.width / 2;
  const y = start.y + start.height / 2;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await page.waitForTimeout(280);
  for (let step = 1; step <= 8; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + ((target.y + target.height - y) * step) / 8 }],
    });
    await page.waitForTimeout(30);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(rows.nth(1)).toHaveAttribute('data-item-id', firstId);
  await page.reload();
  await expect(
    page.getByTestId('category-card').first().getByTestId('item-row').nth(1)
  ).toHaveAttribute('data-item-id', firstId);
});

// Test Case 7: Categories can be touch-dragged between columns and retain their order.
test('persists category sorting across tablet columns', async ({ page, context }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await createList(page);
  for (const button of await page.getByTestId('category-collapse-toggle').all()) {
    if ((await button.getAttribute('aria-expanded')) === 'true') await button.tap();
  }
  const cards = page.getByTestId('category-card');
  const boxes = await Promise.all((await cards.all()).map((card) => card.boundingBox()));
  const targetIndex = boxes.findIndex((box) => box.x > boxes[0].x + 20);
  expect(targetIndex).toBeGreaterThan(0);
  const firstId = await cards.first().getAttribute('data-category-id');
  const source = boxes[0];
  const target = boxes[targetIndex];
  const start = { x: source.x + 5, y: source.y + 5 };
  const end = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  await page.waitForTimeout(300);
  for (let step = 1; step <= 20; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: start.x + ((end.x - start.x) * step) / 20,
          y: start.y + ((end.y - start.y) * step) / 20,
        },
      ],
    });
    await page.waitForTimeout(30);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => cards.first().getAttribute('data-category-id')).not.toBe(firstId);
  const order = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-category-id'))
  );
  await page.reload();
  await expect
    .poll(() =>
      cards.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-category-id'))
      )
    )
    .toEqual(order);
});
