/*
================================================================================
File: tests/end2end-tests/mobile-workflow.spec.js
Description: E2E tests for complete mobile workflow at 375px viewport.
             Tests sidebar access via topbar hamburger, checklist CRUD,
             category and item management on mobile.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-11
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { expect, test } from '@playwright/test';

import { selectGeneralRecommendedList } from './checklistHelpers.js';

// -----------------------------------------------------------------------------
// Mobile Workflow Tests
// -----------------------------------------------------------------------------

test.describe('Mobile Workflow (375px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });

  // ---------------------------------------------------------------------------
  // Test Group 1: Sidebar Access
  // ---------------------------------------------------------------------------

  test.describe('sidebar access via topbar', () => {
    // Test Case 1: Should show topbar with hamburger on mobile
    test('should display topbar with hamburger button on mobile', async ({ page }) => {
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    // Test Case 2: Should open sidebar when hamburger is clicked
    test('should open sidebar overlay when hamburger is clicked', async ({ page }) => {
      // Click the hamburger button (first button in header)
      const hamburger = page.locator('header button').first();
      await hamburger.click();

      // Sidebar should be visible
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();
    });

    // Test Case 3: Should close sidebar when overlay backdrop is clicked
    test('should close sidebar when overlay backdrop is tapped', async ({ page }) => {
      // Open sidebar
      const hamburger = page.locator('header button').first();
      await hamburger.click();
      await expect(page.locator('aside')).toBeVisible();

      // Click the backdrop overlay on the right edge (away from the sidebar panel)
      // The sidebar panel (z-50) covers the left side, so we click at x=350 (near right edge of 375px viewport)
      const backdrop = page.locator('[role="button"][aria-label="Close sidebar"]');
      await expect(backdrop).toBeVisible();
      await backdrop.click({ position: { x: 350, y: 300 } });

      // Sidebar should be hidden
      await expect(page.locator('aside')).not.toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Create Checklist on Mobile
  // ---------------------------------------------------------------------------

  test.describe('create checklist on mobile', () => {
    // Test Case 4: Should create checklist via topbar plus button
    test('should create a new checklist via topbar plus button', async ({ page }) => {
      // Click the plus/new button (second button in header)
      const newBtn = page.locator('header button').last();
      await newBtn.click();
      await selectGeneralRecommendedList(page);

      // The checklist name input should appear
      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
      await nameInput.press('Enter');

      // Checklist content should be visible
      await expect(page.getByTestId('checklist-name')).toBeVisible();
    });

    // Test Case 5: Should create checklist via sidebar on mobile
    test('should create a new checklist via sidebar on mobile', async ({ page }) => {
      // Open sidebar
      const hamburger = page.locator('header button').first();
      await hamburger.click();
      await expect(page.locator('aside')).toBeVisible();

      // Click new checklist button in sidebar
      await page.getByTestId('sidebar-new-checklist').click();
      await selectGeneralRecommendedList(page);

      // Confirm the name
      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
      await nameInput.press('Enter');

      await expect(page.getByTestId('checklist-name')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Item Operations on Mobile
  // ---------------------------------------------------------------------------

  test.describe('item operations on mobile', () => {
    test.beforeEach(async ({ page }) => {
      // Create a checklist first via topbar
      const newBtn = page.locator('header button').last();
      await newBtn.click();
      await selectGeneralRecommendedList(page);
      const nameInput = page.getByTestId('checklist-name-input');
      await expect(nameInput).toBeVisible();
      await nameInput.press('Enter');
      await expect(page.getByTestId('checklist-name')).toBeVisible();
    });

    // Test Case 6: Should add a new item on mobile
    test('should add a new item via add item button', async ({ page }) => {
      const addItemBtn = page.getByTestId('add-item-button').first();
      await addItemBtn.click();

      const itemInput = page.getByTestId('item-edit-input').first();
      await expect(itemInput).toBeFocused();
      await expect
        .poll(() => itemInput.evaluate((input) => [input.selectionStart, input.selectionEnd]))
        .toEqual([0, 'New Item'.length]);
      await page.keyboard.type('Beach Towel');
      await itemInput.press('Enter');
      await expect(page.getByTestId('item-name').filter({ hasText: 'Beach Towel' })).toBeVisible();
    });

    // Test Case 7: Should edit an item name on mobile
    test('should edit an item name on mobile', async ({ page }) => {
      // Add a new item
      await page.getByTestId('add-item-button').first().click();

      const itemInput = page.getByTestId('item-edit-input').first();
      await expect(itemInput).toBeVisible();
      await itemInput.fill('Mobile Item');
      await itemInput.press('Enter');

      await expect(page.locator('text=Mobile Item')).toBeVisible();
    });

    // Test Case 8: Should toggle item packed status on mobile
    test('should toggle item packed status on mobile', async ({ page }) => {
      const checkbox = page.getByTestId('item-checkbox').first();
      await expect(checkbox).toBeVisible();

      const wasChecked = await checkbox.isChecked();
      await checkbox.click();

      await expect(checkbox).toBeChecked({ checked: !wasChecked });
    });

    // Test Case 9: Should update progress bar on mobile
    test('should update progress when items are packed on mobile', async ({ page }) => {
      const progressBar = page.getByTestId('progress-bar').first();
      await expect(progressBar).toBeVisible();
      const initialText = await progressBar.textContent();

      // Pack first unchecked item
      const checkboxes = page.getByTestId('item-checkbox');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        const cb = checkboxes.nth(i);
        if (!(await cb.isChecked())) {
          await cb.click();
          break;
        }
      }

      await expect.poll(() => progressBar.textContent()).not.toBe(initialText);
    });

    // Test Case 10: Should filter packed items with the icon-only toolbar button
    test('should filter packed items with an accessible icon button on mobile', async ({
      page,
    }) => {
      const firstCategory = page.getByTestId('category-card').first();
      const itemRows = firstCategory.getByTestId('item-row');
      const initialItemCount = await itemRows.count();
      expect(initialItemCount).toBeGreaterThan(0);

      await firstCategory.getByTestId('item-checkbox').first().click();

      const filterToggle = page.getByTestId('unpacked-items-filter-toggle');
      await expect(filterToggle).toBeVisible();
      await expect(filterToggle).toHaveText('');
      await expect(filterToggle).toHaveAttribute('title', 'Show unpacked only');
      await expect(filterToggle).toHaveAttribute('aria-label', 'Show unpacked only');
      await expect(filterToggle).toHaveAttribute('aria-pressed', 'false');

      const bounds = await filterToggle.boundingBox();
      expect(bounds?.width).toBe(36);
      expect(bounds?.height).toBe(36);

      const overflowToggle = page.locator('[data-testid^="overflow-trigger-checklist-"]').first();
      const overflowBounds = await overflowToggle.boundingBox();
      expect(overflowBounds?.width).toBe(36);
      expect(overflowBounds?.height).toBe(36);
      expect(bounds?.x).toBeLessThan(overflowBounds?.x ?? 0);
      expect(bounds?.y).toBe(overflowBounds?.y);

      await filterToggle.click();

      await expect(filterToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(itemRows).toHaveCount(initialItemCount - 1);
    });
  });
});
