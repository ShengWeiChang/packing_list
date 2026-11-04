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

// Test Case 1: A real touch context reaches all quick actions and persists successive changes.
test('touch actions remain open and persist quantity and pending state', async ({ page }) => {
  await createList(page);
  const row = page.getByTestId('item-row').first();
  const id = await row.getAttribute('data-item-id');
  const initialName = await row.getByTestId('item-name').textContent();
  await expect(row.getByTestId('item-inline-actions')).toHaveCount(0);
  await (await triggerFor(row)).tap();
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
  for (let n = 0; n < 3; n++) await row.getByTestId('item-quantity-increment').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×4');
  await row.getByTestId('item-quantity-decrement').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×3');
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
  await restored.locator('label').tap();
  await expect(restored.getByTestId('item-checkbox')).toBeChecked();
  await expect(restored.getByTestId('item-pending-summary')).toHaveCount(0);
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
  await (await triggerFor(rows.nth(0))).tap();
  await rows.nth(1).getByTestId('item-name').tap();
  await expect(rows.nth(1).getByTestId('item-edit-input')).toBeFocused();
});

test.describe('touch tablet', () => {
  test.use({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
  // Test Case 4: Tablet width retains discoverable controls and a single column after rotation.
  test('keeps tablet controls visible and categories in one column', async ({ page }) => {
    await createList(page);
    const row = page.getByTestId('item-row').first();
    const trigger = await triggerFor(row);
    await expect(trigger).toHaveCSS('opacity', '1');
    await trigger.tap();
    await expect(row.getByTestId('item-inline-actions')).toBeVisible();
    const category = row.locator('xpath=ancestor::*[@data-testid="category-card"]');
    const checkbox = await row.getByTestId('item-checkbox').boundingBox();
    const addIcon = await category.getByTestId('add-item-button-icon').boundingBox();
    expect(Math.abs(checkbox.x + checkbox.width / 2 - addIcon.x - addIcon.width / 2)).toBeLessThan(
      1
    );
    await expect(page.locator('.categories-masonry')).toHaveCSS('column-count', '1');
    await page.screenshot({ path: test.info().outputPath('tablet-open.png') });
    await page.setViewportSize({ width: 1180, height: 820 });
    await expect(page.locator('.categories-masonry')).toHaveCSS('column-count', '1');
    await expect(row.getByTestId('item-inline-actions')).toBeVisible();
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
    await row.getByTestId('item-quantity-increment').click();
    await expect(row.getByTestId('item-quantity-value')).toContainText('2');
    await (await triggerFor(row)).click();
    await expect(row.locator('[data-testid^="overflow-dropdown-item-"]')).toBeVisible();
    await expect(row.getByTestId('item-inline-actions')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath('desktop-hover.png') });
    await (await triggerFor(row)).click();
    await expect(row.locator('[data-testid^="overflow-dropdown-item-"]')).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expect(await triggerFor(row)).toHaveCSS('opacity', '0');
    await row.getByTestId('item-name').focus();
    await page.keyboard.press('Tab');
    await expect(row.getByTestId('item-quantity-decrement')).toBeFocused();
    await expect(await triggerFor(row)).toHaveCSS('opacity', '1');
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
