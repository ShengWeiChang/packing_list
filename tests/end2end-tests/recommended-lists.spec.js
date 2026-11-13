/*
================================================================================
File: tests/end2end-tests/recommended-lists.spec.js
Description: E2E coverage for creating a checklist from a built-in recommended list.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-15
================================================================================
*/

import { expect, test } from '@playwright/test';

import { selectGeneralRecommendedList } from './checklistHelpers.js';

test.describe('Recommended Lists', () => {
  // Test Case 1: Should create and persist a checklist from a recommended list
  test('should create and persist a checklist from a recommended list', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await page.getByTestId('sidebar-new-checklist').click();
    await expect(page.getByTestId('new-checklist-option-empty')).toBeVisible();
    await expect(page.getByTestId('new-checklist-option-template')).toBeDisabled();
    await expect(page.getByTestId('new-checklist-option-recommended')).toBeEnabled();
    await selectGeneralRecommendedList(page);

    const nameInput = page.getByTestId('checklist-name-input');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('New Checklist (General Travel)');
    await nameInput.press('Enter');
    await expect(page.getByTestId('category-name').first()).toBeVisible();
    await expect(page.getByTestId('item-row').first()).toBeVisible();

    const storedBeforeReload = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('packingListApp'))
    );
    expect(storedBeforeReload.checklists).toHaveLength(1);
    expect(storedBeforeReload.checklists[0].name).toBe('New Checklist (General Travel)');
    expect(storedBeforeReload.categories.length).toBeGreaterThan(0);
    expect(storedBeforeReload.items.length).toBeGreaterThan(0);

    await page.reload();
    await expect(page.getByTestId('checklist-name')).toHaveText('New Checklist (General Travel)');
    await expect(page.getByTestId('category-name').first()).toBeVisible();

    await page.getByTestId('sidebar-new-checklist').click();
    await page.getByTestId('new-checklist-option-recommended').click();
    const dialog = page.getByTestId('new-checklist-dialog');
    expect(await dialog.evaluate((element) => element.scrollHeight - element.clientHeight)).toBe(0);
    await page.getByTestId('new-checklist-recommended-warm').click();
    await page.getByTestId('checklist-name-input').press('Enter');
    await expect(page.getByTestId('checklist-name')).toHaveText(
      'New Checklist (Hot-Weather Travel)'
    );
    const personalCare = page.getByTestId('category-card').filter({ hasText: 'Personal Care' });
    await expect(
      personalCare.getByTestId('item-name').filter({ hasText: 'Sunscreen' })
    ).toBeVisible();
    await expect(
      page.getByTestId('category-name').filter({ hasText: 'Sun Protection' })
    ).toHaveCount(0);
  });
});
