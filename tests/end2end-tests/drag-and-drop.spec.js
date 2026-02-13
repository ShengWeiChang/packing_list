/*
================================================================================
File: tests/end2end-tests/drag-and-drop.spec.js
Description: E2E tests for drag-and-drop reorder behaviors.
             Focuses on checklist reordering in sidebar.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-12
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

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

test.describe('Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Sidebar Checklist Reorder
  // ---------------------------------------------------------------------------

  test.describe('sidebar checklist reorder', () => {
    // Test Case 1: Should reorder checklists in sidebar by drag-and-drop
    test('should reorder checklists in sidebar by drag-and-drop', async ({ page }) => {
      await createAndConfirmChecklist(page, 'List A');
      await createAndConfirmChecklist(page, 'List B');

      const items = page.getByTestId('sidebar-checklist-item');
      await expect(items).toHaveCount(2);

      // Ensure initial order is A then B
      await expect(items.nth(0)).toContainText('List A');
      await expect(items.nth(1)).toContainText('List B');

      // Drag B above A
      await items.nth(1).dragTo(items.nth(0));

      // Verify order swapped
      await expect(items.nth(0)).toContainText('List B');
      await expect(items.nth(1)).toContainText('List A');
    });
  });
});
