/*
================================================================================
File: tests/end2end/item-packing.spec.js
Description: E2E tests for the complete item packing workflow.
             Tests adding categories, adding items, editing names, toggling
             packed status, and verifying progress updates.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-10
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
 * The newly created checklist comes with default categories and items.
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
// Item Packing Workflow Tests
// -----------------------------------------------------------------------------

test.describe('Item Packing Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Create a checklist with default categories and items
    await createAndConfirmChecklist(page);
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Category Operations
  // ---------------------------------------------------------------------------

  test.describe('category operations', () => {
    // Test Case 1: Should create a new category
    test('should create a new category via add button', async ({ page }) => {
      const categoryCountBefore = await page.getByTestId('category-name').count();

      await page.getByTestId('add-category-button').click();

      // A new category input should appear (edit mode)
      const categoryInput = page.getByTestId('category-name-input');
      const hasInput = await categoryInput.first().isVisible();

      const categoryCountAfter = await page.getByTestId('category-name').count();

      // Either a new category-name appeared or an edit input is showing
      expect(categoryCountAfter > categoryCountBefore || hasInput).toBeTruthy();
    });

    // Test Case 2: Should rename a category
    test('should rename a category by clicking its name', async ({ page }) => {
      const firstCategory = page.getByTestId('category-name').first();
      const originalName = await firstCategory.textContent();

      // Click to enter edit mode
      await firstCategory.click();

      const categoryInput = page.getByTestId('category-name-input').first();
      await expect(categoryInput).toBeVisible();
      await categoryInput.fill('Beach Essentials');
      await categoryInput.press('Enter');

      // Verify the name changed
      const updatedCategory = page.getByTestId('category-name').first();
      await expect(updatedCategory).toHaveText('Beach Essentials');
      expect(originalName).not.toBe('Beach Essentials');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Item Operations
  // ---------------------------------------------------------------------------

  test.describe('item operations', () => {
    // Test Case 3: Should create a new item in a category
    test('should create a new item via add button', async ({ page }) => {
      const addItemBtn = page.getByTestId('add-item-button').first();
      await addItemBtn.click();

      // The new item should be in edit mode (input visible)
      const itemInput = page.getByTestId('item-edit-input');
      await expect(itemInput.first()).toBeVisible();
    });

    // Test Case 4: Should edit an item name
    test('should edit an item name', async ({ page }) => {
      // Add a new item
      await page.getByTestId('add-item-button').first().click();

      const itemInput = page.getByTestId('item-edit-input').first();
      await expect(itemInput).toBeVisible();
      await itemInput.fill('Sunscreen SPF 50');
      await itemInput.press('Enter');

      // Verify the item name is displayed
      await expect(page.locator('text=Sunscreen SPF 50')).toBeVisible();
    });

    // Test Case 5: Should toggle item packed status via checkbox
    test('should toggle item packed status via checkbox', async ({ page }) => {
      const checkbox = page.getByTestId('item-checkbox').first();
      await expect(checkbox).toBeVisible();

      // Get initial state
      const wasChecked = await checkbox.isChecked();

      // Toggle
      await checkbox.click();

      // Verify state changed
      await expect(checkbox).toBeChecked({ checked: !wasChecked });
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Progress Tracking
  // ---------------------------------------------------------------------------

  test.describe('progress tracking', () => {
    // Test Case 6: Progress bar should update when items are packed
    test('should update progress when items are packed', async ({ page }) => {
      const progressBar = page.getByTestId('progress-bar').first();
      await expect(progressBar).toBeVisible();

      // Get initial progress text
      const initialText = await progressBar.textContent();

      // Check the first unpacked checkbox
      const checkboxes = page.getByTestId('item-checkbox');
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);

      // Find an unchecked checkbox and click it
      for (let i = 0; i < count; i++) {
        const cb = checkboxes.nth(i);
        if (!(await cb.isChecked())) {
          await cb.click();
          break;
        }
      }

      // Progress text should have changed
      const updatedText = await progressBar.textContent();
      expect(updatedText).not.toBe(initialText);
    });

    // Test Case 7: Progress should show 100% when all items packed
    test('should show 100% when all items in a category are packed', async ({ page }) => {
      // Pack all checkboxes
      const checkboxes = page.getByTestId('item-checkbox');
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        const cb = checkboxes.nth(i);
        if (!(await cb.isChecked())) {
          await cb.click();
          // Small wait between clicks to avoid race conditions
          await page.waitForTimeout(50);
        }
      }

      // The main progress bar should show 100%
      const progressBar = page.getByTestId('progress-bar').first();
      await expect(progressBar).toContainText('100%');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Data Persistence
  // ---------------------------------------------------------------------------

  test.describe('data persistence', () => {
    // Test Case 8: Changes should persist after page reload
    test('should persist data after page reload', async ({ page }) => {
      // Rename the checklist
      await page.getByTestId('checklist-name').click();

      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
      await nameInput.fill('Persistence Test');
      await nameInput.press('Enter');

      await expect(page.getByTestId('checklist-name')).toHaveText('Persistence Test');

      // Reload
      await page.reload();

      // Verify the name persisted
      await expect(page.getByTestId('checklist-name')).toHaveText('Persistence Test');
    });
  });
});
