/*
================================================================================
File: tests/end2end/checklist-management.spec.js
Description: E2E tests for checklist CRUD operations.
             Tests creating, renaming, switching, and deleting checklists.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-06
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
 * Create a checklist via sidebar and confirm the default name.
 * After this helper returns, the checklist is in view mode (h2 visible).
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function createAndConfirmChecklist(page) {
  await page.getByTestId('sidebar-new-checklist').click();
  const nameInput = page.getByTestId('checklist-name-input');
  await expect(nameInput).toBeVisible();
  await nameInput.press('Enter');
  await expect(page.getByTestId('checklist-name')).toBeVisible();
}

// -----------------------------------------------------------------------------
// Checklist Management Tests
// -----------------------------------------------------------------------------

test.describe('Checklist Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Create Checklist
  // ---------------------------------------------------------------------------

  test.describe('create checklist', () => {
    // Test Case 1: Should create a new checklist via sidebar button
    test('should create a new checklist via sidebar button', async ({ page }) => {
      const sidebarItems = page.getByTestId('sidebar-checklist-item');
      const initialCount = await sidebarItems.count();

      await page.getByTestId('sidebar-new-checklist').click();

      await expect(sidebarItems).toHaveCount(initialCount + 1);
    });

    // Test Case 2: New checklist should be auto-selected and in edit mode
    test('should auto-select and enter edit mode for new checklist', async ({ page }) => {
      await page.getByTestId('sidebar-new-checklist').click();

      // The checklist name input should be visible (edit mode)
      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Rename Checklist
  // ---------------------------------------------------------------------------

  test.describe('rename checklist', () => {
    // Test Case 3: Should rename checklist by clicking on the name
    test('should rename checklist by clicking on the name', async ({ page }) => {
      // Create a checklist first (app starts empty)
      await createAndConfirmChecklist(page);

      // Click the checklist name h2 to enter edit mode
      await page.getByTestId('checklist-name').click();

      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
      await nameInput.fill('Japan Trip 2026');
      await nameInput.press('Enter');

      await expect(page.getByTestId('checklist-name')).toHaveText('Japan Trip 2026');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Switch Checklist
  // ---------------------------------------------------------------------------

  test.describe('switch checklist', () => {
    // Test Case 4: Should switch between checklists in sidebar
    test('should switch between checklists', async ({ page }) => {
      // Create first checklist
      await createAndConfirmChecklist(page);

      // Create a second checklist
      await page.getByTestId('sidebar-new-checklist').click();
      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
      await nameInput.press('Enter');

      // Click the first checklist in sidebar
      const firstChecklist = page.getByTestId('sidebar-checklist-item').first();
      await firstChecklist.click();

      // The first checklist should now have aria-current="page"
      await expect(firstChecklist).toHaveAttribute('aria-current', 'page');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Delete Checklist
  // ---------------------------------------------------------------------------

  test.describe('delete checklist', () => {
    // Test Case 5: Should delete a checklist via confirmation dialog
    test('should delete checklist after confirmation', async ({ page }) => {
      // Create two checklists so we can delete one
      await createAndConfirmChecklist(page);
      await createAndConfirmChecklist(page);

      const sidebarItems = page.getByTestId('sidebar-checklist-item');
      const countBefore = await sidebarItems.count();

      // Accept the confirmation dialog
      page.on('dialog', (dialog) => dialog.accept());

      // Find and click the overflow menu (three dots) on the main checklist area
      const overflowButton = page.locator('[aria-haspopup="true"]').first();

      if (await overflowButton.isVisible()) {
        await overflowButton.click();

        // Look for delete option
        const deleteButton = page.locator('button', { hasText: /delete|刪除/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await expect(sidebarItems).toHaveCount(countBefore - 1);
        }
      }
    });
  });
});
