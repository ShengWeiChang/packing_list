/*
================================================================================
File: tests/end2end-tests/category-crud.spec.js
Description: E2E tests for category CRUD operations.
             Tests deleting and copying categories via the overflow menu.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { expect, test } from '@playwright/test';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Create a checklist and confirm it appears in view mode.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @param {string} [name] - Optional checklist name
 */
async function createAndConfirmChecklist(page, name) {
  await page.getByTestId('sidebar-new-checklist').click();
  const nameInput = page.getByTestId('checklist-name-input');
  await expect(nameInput).toBeVisible();
  if (name) {
    await nameInput.fill(name);
  }
  await nameInput.press('Enter');
  if (name) {
    await expect(page.getByTestId('checklist-name')).toHaveText(name);
  } else {
    await expect(page.getByTestId('checklist-name')).toBeVisible();
  }
}

/**
 * Open the overflow menu on the first category.
 * Clicks the first category overflow trigger using semantic data-testid.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 */
async function openFirstCategoryOverflow(page) {
  const overflowBtn = page.locator('[data-testid^="overflow-trigger-category-"]').first();
  await expect(overflowBtn).toBeVisible();
  await overflowBtn.click();
}

// -----------------------------------------------------------------------------
// Category CRUD Tests
// -----------------------------------------------------------------------------

test.describe('Category CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await createAndConfirmChecklist(page);
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Delete Category
  // ---------------------------------------------------------------------------

  test.describe('delete category', () => {
    // Test Case 1: Should delete a category via overflow menu
    test('should delete a category via overflow menu', async ({ page }) => {
      const categoriesBefore = await page.getByTestId('category-name').count();
      expect(categoriesBefore).toBeGreaterThan(0);

      // Open the overflow menu on the first category
      await openFirstCategoryOverflow(page);

      // Click delete — button appears in the dropdown that just opened
      const deleteButton = page.locator('button', { hasText: /delete|刪除/i });
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Verify category count decreased
      await expect(page.getByTestId('category-name')).toHaveCount(categoriesBefore - 1);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Copy Category
  // ---------------------------------------------------------------------------

  test.describe('copy category', () => {
    // Test Case 2: Should copy a category via overflow menu
    test('should copy a category via overflow menu', async ({ page }) => {
      const categoriesBefore = await page.getByTestId('category-name').count();
      expect(categoriesBefore).toBeGreaterThan(0);

      // Open the overflow menu on the first category
      await openFirstCategoryOverflow(page);

      // Click copy — button appears in the dropdown that just opened
      const copyButton = page.locator('button', { hasText: /copy|複製/i });
      await expect(copyButton).toBeVisible();
      await copyButton.click();

      // Verify category count increased
      await expect(page.getByTestId('category-name')).toHaveCount(categoriesBefore + 1);
    });

    // Test Case 3: Copied category should have "(Copy)" suffix
    test('should show copy suffix in duplicated category name', async ({ page }) => {
      // Copy it
      await openFirstCategoryOverflow(page);
      const copyButton = page.locator('button', { hasText: /copy|複製/i });
      await copyButton.click();

      // Verify the copy exists with suffix — wait for the new category to appear
      const copyPattern = /\(Copy\)|\(複製\)/;
      await expect(
        page.getByTestId('category-name').filter({ hasText: copyPattern })
      ).toBeVisible();
    });
  });
});
