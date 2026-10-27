/*
================================================================================
File: tests/end2end-tests/item-packing.spec.js
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

import { selectGeneralRecommendedList } from './checklistHelpers.js';

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
  await selectGeneralRecommendedList(page);
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
 * Pack every category so the active checklist reaches its local completion transition.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @returns {Promise<import('@playwright/test').Locator>} Category checkbox collection.
 */
async function completeChecklistByCategory(page) {
  const categoryCheckboxes = page.getByTestId('category-checkbox');
  const count = await categoryCheckboxes.count();

  for (let index = 0; index < count; index++) {
    const checkbox = categoryCheckboxes.nth(index);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
      await expect(checkbox).toBeChecked();
    }
  }

  return categoryCheckboxes;
}

// -----------------------------------------------------------------------------
// Item Packing Workflow Tests
// -----------------------------------------------------------------------------

test.describe('Item Packing Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Create a checklist from the general recommended list.
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
      const categoryInput = page.getByTestId('category-name-input').first();
      await expect(categoryInput).toBeVisible();

      // Commit the new category and verify concrete result
      await categoryInput.fill('New Category');
      await categoryInput.press('Enter');
      await expect(page.getByTestId('category-name')).toHaveCount(categoryCountBefore + 1);
      await expect(
        page.getByTestId('category-name').filter({ hasText: 'New Category' })
      ).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Item Operations
  // ---------------------------------------------------------------------------

  test.describe('item operations', () => {
    // Test Case 2: Should create a new item in a category
    test('should create a new item via add button', async ({ page }) => {
      const addItemBtn = page.getByTestId('add-item-button').first();
      await addItemBtn.click();

      // The new item should be ready for immediate typing without another click.
      const itemInput = page.getByTestId('item-edit-input').first();
      await expect(itemInput).toBeFocused();
      await expect
        .poll(() => itemInput.evaluate((input) => [input.selectionStart, input.selectionEnd]))
        .toEqual([0, 'New Item'.length]);
      await page.keyboard.type('Beach Towel');
      await itemInput.press('Enter');
      await expect(page.getByTestId('item-name').filter({ hasText: 'Beach Towel' })).toBeVisible();
    });

    // Test Case 3: Should edit an item name
    test('should edit an item name', async ({ page }) => {
      // Add a new item
      await page.getByTestId('add-item-button').first().click();

      const itemInput = page.getByTestId('item-edit-input').first();
      await expect(itemInput).toBeVisible();
      await itemInput.fill('Sunscreen SPF 50');
      await itemInput.press('Enter');

      // Verify the item name is displayed
      const itemName = page.getByTestId('item-name').filter({ hasText: 'Sunscreen SPF 50' });
      await expect(itemName).toBeVisible();

      // Entering edit mode must not trigger the former delayed center-scroll jump.
      const itemNames = page.getByTestId('item-name');
      const scrollTarget = itemNames.nth(Math.floor((await itemNames.count()) / 2));
      await scrollTarget.evaluate((element) => {
        const targetTop = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, targetTop - 100);
      });
      const scrollMetricsBeforeEdit = await page.evaluate(() => ({
        top: window.scrollY,
        max: document.documentElement.scrollHeight - window.innerHeight,
      }));
      expect(scrollMetricsBeforeEdit.top).toBeGreaterThan(0);
      expect(scrollMetricsBeforeEdit.top).toBeLessThan(scrollMetricsBeforeEdit.max);
      await expect(scrollTarget).toBeInViewport();
      await scrollTarget.click();
      await expect(page.getByTestId('item-edit-input').first()).toBeFocused();
      await page.waitForTimeout(400);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBe(scrollMetricsBeforeEdit.top);
    });

    // Test Case 4: Should toggle item packed status via checkbox
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
    // Test Case 5: Progress bar should update when items are packed
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

    // Test Case 6: Progress should show 100% when all items packed
    test('should show 100% when all items in a category are packed', async ({ page }) => {
      // Pack all checkboxes
      const checkboxes = page.getByTestId('item-checkbox');
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        const cb = checkboxes.nth(i);
        if (!(await cb.isChecked())) {
          await cb.click();
          // Wait for the checkbox state to update before clicking the next one
          await expect(cb).toBeChecked();
        }
      }

      // The main progress bar should show 100%
      const progressBar = page.getByTestId('progress-bar').first();
      await expect(progressBar).toContainText('100%');
    });

    // Test Case 7: Should celebrate once when local packing completes the entire checklist
    test('should show and dismiss the completion journey after the final category is packed', async ({
      page,
    }) => {
      await completeChecklistByCategory(page);

      const completionOverlay = page.getByTestId('packing-completion-overlay');
      await expect(completionOverlay).toBeVisible();
      await expect(completionOverlay).toContainText('Ready to go');
      await expect(page.getByTestId('packing-completion-skip')).toBeFocused();
      await expect(page.getByTestId('packing-undo-toast')).toBeHidden();
      await expect
        .poll(() =>
          completionOverlay
            .locator('img')
            .evaluateAll((images) =>
              images.every((image) => image.complete && image.naturalWidth > 0)
            )
        )
        .toBe(true);

      await page.getByTestId('packing-completion-skip').click();
      await expect(completionOverlay).toBeHidden();
      await expect(page.getByTestId('packing-undo-toast')).toBeVisible();
    });

    // Test Case 8: Should contain keyboard focus and support Escape and backdrop dismissal
    test('should contain focus and dismiss completion with Escape or the backdrop', async ({
      page,
    }) => {
      const categoryCheckboxes = await completeChecklistByCategory(page);
      const completionOverlay = page.getByTestId('packing-completion-overlay');
      const skipButton = page.getByTestId('packing-completion-skip');

      await expect(skipButton).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(skipButton).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(skipButton).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(completionOverlay).toBeHidden();
      await expect(categoryCheckboxes.last()).toBeFocused();

      await categoryCheckboxes.last().click();
      await expect(categoryCheckboxes.last()).not.toBeChecked();
      await categoryCheckboxes.last().click();
      await expect(completionOverlay).toBeVisible();
      await page.mouse.click(12, 708);
      await expect(completionOverlay).toBeHidden();
    });

    // Test Case 9: Should keep localized sticker copy inside the narrow reduced-motion scene
    test('should fit localized sticker copy in a narrow reduced-motion scene', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/*.png', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.continue();
      });
      await page.evaluate(() => localStorage.setItem('user-locale', 'zh-TW'));
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await completeChecklistByCategory(page);

      const completionOverlay = page.getByTestId('packing-completion-overlay');
      await expect(completionOverlay).toBeVisible();
      await expect(completionOverlay).toHaveAttribute('data-assets-ready', 'false');
      await expect(completionOverlay).toHaveAttribute('data-assets-ready', 'true');
      await expect(completionOverlay).toContainText('準備出發！');
      await expect(completionOverlay).toHaveCSS('animation-name', 'none');
      await expect(completionOverlay.locator('.packing-completion-overlay__suitcase')).toHaveCSS(
        'animation-name',
        'none'
      );
      await expect
        .poll(() =>
          completionOverlay
            .locator('.packing-completion-overlay__sticker-copy')
            .evaluate((element) => element.scrollWidth <= element.clientWidth)
        )
        .toBe(true);

      const overlayBox = await completionOverlay.boundingBox();
      expect(overlayBox).toMatchObject({ width: 375, height: 667 });
      const sceneBox = await completionOverlay
        .locator('.packing-completion-overlay__scene')
        .boundingBox();
      expect(sceneBox).toMatchObject({ width: 375, height: 667 });
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 4: Data Persistence
  // ---------------------------------------------------------------------------

  test.describe('data persistence', () => {
    // Test Case 10: Changes should persist after page reload
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
