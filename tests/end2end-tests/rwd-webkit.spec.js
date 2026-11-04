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
  await expect(page.getByTestId('overlay-sidebar')).toBeVisible();
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
