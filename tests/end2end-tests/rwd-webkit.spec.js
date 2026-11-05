/*
================================================================================
File: tests/end2end-tests/rwd-webkit.spec.js
Description: Focused WebKit responsive interaction checks.
License: MIT (SPDX: MIT)
Created: 2026-11-04
================================================================================
*/

import { expect, test } from '@playwright/test';

import { selectGeneralRecommendedList } from './checklistHelpers.js';

// Test Case 1: WebKit touch reachability, persisted quick actions, and drawer Escape.
test('WebKit touch actions persist and drawer dismisses accessibly', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('topbar-new').click();
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
  const row = page.getByTestId('item-row').first();
  const id = await row.getAttribute('data-item-id');
  await row.locator('[data-testid^="overflow-trigger-item-"]').tap();
  await row.getByTestId('item-quantity-increment').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×2');
  await page.reload();
  await expect(
    page.locator(`[data-item-id="${id}"] [data-testid="item-quantity-summary"]`)
  ).toHaveText('×2');
  await page.getByTestId('topbar-toggle').click();
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
  expect(opening.some((x) => x < -1)).toBe(true);
  expect(Math.abs(opening.at(-1))).toBeLessThan(1);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('overlay-sidebar')).toHaveCount(0);
  await expect(page.getByTestId('topbar-toggle')).toBeFocused();
});

// Test Case 2: A short WebKit dialog and native date fields remain reachable without horizontal overflow.
test('WebKit short dialogs and date fields fit the narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 300 });
  await page.goto('/');
  await page.getByTestId('topbar-new').click();
  const dialog = page.getByTestId('new-checklist-dialog');
  const bounds = await dialog.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(300);
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
  await page.getByTestId('checklist-name').click();
  for (const field of await page.locator('input[type="date"]').all()) {
    const box = await field.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Test Case 3: A wide touch viewport has multiple usable category columns in WebKit.
test('WebKit tablet columns retain visible touch actions', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('topbar-new').click();
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
  await page.setViewportSize({ width: 820, height: 1180 });
  const sidebarSamples = await page.evaluate(async () => {
    const samples = [];
    for (let i = 0; i < 2; i++) {
      document.querySelector('aside [data-testid="sidebar-toggle"]').click();
      const start = performance.now();
      await new Promise((resolve) => {
        const sample = () => {
          const list = document.querySelector('aside [data-testid="sidebar-checklists-draggable"]');
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
  expect(sidebarSamples.length).toBeGreaterThan(0);
  expect(Math.max(...sidebarSamples)).toBeLessThanOrEqual(0);
  const cards = page.getByTestId('category-card');
  await expect
    .poll(async () => {
      const boxes = await Promise.all((await cards.all()).map((card) => card.boundingBox()));
      return new Set(boxes.map((box) => Math.round(box.x))).size;
    })
    .toBe(2);
  const row = page.getByTestId('item-row').first();
  const trigger = row.locator('[data-testid^="overflow-trigger-item-"]');
  await page.mouse.move(0, 0);
  const category = cards.first();
  for (const type of ['category', 'checklist']) {
    const menuTrigger = page.locator(`[data-testid^="overflow-trigger-${type}-"]`).last();
    await menuTrigger.tap();
    const menu = page.locator(`[data-testid^="overflow-dropdown-${type}-"]`);
    await expect(menu).toBeVisible();
    for (const action of await menu.locator('button').all()) {
      expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await expect(action).toHaveCSS('font-size', '16px');
    }
    await menuTrigger.tap();
  }
  await expect(category.getByTestId('category-collapse-toggle')).toHaveCSS(
    '-webkit-tap-highlight-color',
    'rgba(0, 0, 0, 0)'
  );
  const name = row.getByTestId('item-name');
  const addLabel = category.getByTestId('add-item-button').locator(':scope > span').last();
  const textPositions = await Promise.all(
    [name, addLabel].map((locator) =>
      locator.evaluate(
        (element) =>
          element.getBoundingClientRect().left + parseFloat(getComputedStyle(element).paddingLeft)
      )
    )
  );
  expect(Math.abs(textPositions[0] - textPositions[1])).toBeLessThan(1);
  await expect(name).toHaveCSS('font-size', '18px');
  await expect(addLabel).toHaveCSS('font-size', '18px');
  const firstBox = await row.boundingBox();
  const nextBox = await category.getByTestId('item-row').nth(1).boundingBox();
  expect(Math.abs(nextBox.y - firstBox.y - 48)).toBeLessThan(1);
  for (const control of [
    category.getByTestId('category-collapse-toggle'),
    category.locator('[data-testid^="overflow-trigger-category-"]'),
    trigger,
  ]) {
    await expect(control).toHaveCSS('opacity', '1');
    await expect(control).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  }
  await expect(trigger).toBeVisible();
  await trigger.tap();
  await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await row.getByTestId('item-quantity-increment').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×2');
  await row.getByTestId('item-pending-toggle').tap();
  const pendingRow = page.getByTestId('pending-item-row').first();
  const complete = pendingRow.getByTestId('pending-item-complete');
  expect((await complete.boundingBox()).width).toBeGreaterThanOrEqual(44);
  expect((await complete.locator('span').boundingBox()).width).toBe(20);
  await expect(pendingRow.locator('div > span').first()).toHaveCSS('font-size', '18px');
  await expect(pendingRow.getByTestId('pending-item-quantity')).toHaveCSS('font-size', '14px');
  const pendingSummary = row.getByTestId('item-pending-summary');
  const pendingAtTwo = await pendingSummary.boundingBox();
  await row.getByTestId('item-quantity-decrement').tap();
  await expect(row.getByTestId('item-quantity-summary')).toHaveAttribute('aria-hidden', 'true');
  const pendingAtOne = await pendingSummary.boundingBox();
  expect(Math.abs(pendingAtOne.x - pendingAtTwo.x)).toBeLessThan(1);
  await row.getByTestId('item-quantity-increment').tap();
  await category.getByTestId('category-checkbox').tap();
  await expect(category).toHaveAttribute('data-completed', 'true');
  await trigger.tap();
  await expect(row).toHaveCSS('background-color', 'rgb(227, 242, 232)');
  await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.screenshot({ path: test.info().outputPath('webkit-tablet-open.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await expect
    .poll(async () => {
      const positions = await Promise.all(
        [name, addLabel].map((locator) =>
          locator.evaluate(
            (element) =>
              element.getBoundingClientRect().left +
              parseFloat(getComputedStyle(element).paddingLeft)
          )
        )
      );
      return Math.abs(positions[0] - positions[1]);
    })
    .toBeLessThan(1);
  await expect
    .poll(async () => {
      const plus = await category.getByTestId('add-item-button-icon').boundingBox();
      const checkbox = await row.getByTestId('item-checkbox').boundingBox();
      return Math.abs(plus.x + plus.width / 2 - checkbox.x - checkbox.width / 2);
    })
    .toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
