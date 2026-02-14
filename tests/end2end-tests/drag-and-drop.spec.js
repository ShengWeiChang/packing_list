/*
================================================================================
File: tests/end2end-tests/drag-and-drop.spec.js
Description: E2E tests for drag-and-drop reorder behaviors.
             Covers sidebar checklist reorder, category reorder within
             a checklist, and item reorder within a category.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-02-12
================================================================================
*/

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

import { expect, test } from '@playwright/test';

/**
 * Yield until the next browser paint.
 * Keeps drag steps paced without fixed millisecond sleeps.
 *
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 */
async function waitForNextAnimationFrame(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
      })
  );
}

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
 * Perform a slow drag from `source` to `target` by holding the mouse for a
 * given duration. vuedraggable may ignore fast synthetic drags; a longer
 * hold ensures the sortable library registers the operation.
 *
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @param {import('@playwright/test').Locator} source - Locator for the item to drag.
 * @param {import('@playwright/test').Locator} target - Locator for the destination item.
 */
async function slowDragTo(page, source, target) {
  const srcBox = await source.boundingBox();
  const tgtBox = await target.boundingBox();
  const srcCenter = { x: srcBox.x + srcBox.width / 2, y: srcBox.y + srcBox.height / 2 };
  const tgtCenter = { x: tgtBox.x + tgtBox.width / 2, y: tgtBox.y + tgtBox.height / 2 };

  await page.mouse.move(srcCenter.x, srcCenter.y);
  await page.mouse.down();

  // Move in small steps so the sortable library picks up the drag
  const steps = 40;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      srcCenter.x + ((tgtCenter.x - srcCenter.x) * i) / steps,
      srcCenter.y + ((tgtCenter.y - srcCenter.y) * i) / steps
    );
    await waitForNextAnimationFrame(page);
  }
  await page.mouse.up();
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

  // ---------------------------------------------------------------------------
  // Test Group 2: Category Reorder within Checklist
  // ---------------------------------------------------------------------------

  test.describe('category reorder within checklist', () => {
    // Test Case 2: Should reorder categories by drag-and-drop
    test('should reorder categories by drag-and-drop', async ({ page }) => {
      // Create a checklist (comes with default categories)
      await createAndConfirmChecklist(page);

      // Collapse all categories so each card is short and both are
      // visible in the viewport for reliable drag coordinates.
      const collapseButtons = page.getByTestId('category-collapse-toggle');
      const collapseCount = await collapseButtons.count();
      for (let i = 0; i < collapseCount; i++) {
        const btn = collapseButtons.nth(i);
        // Only collapse expanded categories
        if ((await btn.getAttribute('aria-expanded')) === 'true') {
          await btn.click();
        }
      }

      // Read the first two category names
      const categoryNames = page.getByTestId('category-name');
      const count = await categoryNames.count();
      expect(count).toBeGreaterThanOrEqual(2);

      const firstName = await categoryNames.nth(0).textContent();
      const secondName = await categoryNames.nth(1).textContent();

      // Use the category-card wrapper for dragging.
      // Drag the first category card down past the second one.
      const cards = page.getByTestId('category-card');
      const firstBox = await cards.nth(0).boundingBox();
      const secondBox = await cards.nth(1).boundingBox();
      const startX = firstBox.x + firstBox.width / 2;
      const startY = firstBox.y + firstBox.height / 2;
      // Aim just past the midpoint of the second card
      const endY = secondBox.y + secondBox.height * 0.6;

      await page.mouse.move(startX, startY);
      await page.mouse.down();

      const steps = 60;
      for (let i = 1; i <= steps; i++) {
        await page.mouse.move(startX, startY + ((endY - startY) * i) / steps);
        await waitForNextAnimationFrame(page);
      }
      await page.mouse.up();

      // Verify the first and second categories have swapped positions
      await expect(categoryNames.nth(0)).toHaveText(secondName);
      await expect(categoryNames.nth(1)).toHaveText(firstName);
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 3: Item Reorder within Category
  // ---------------------------------------------------------------------------

  test.describe('item reorder within category', () => {
    // Test Case 3: Should reorder items within a category by drag-and-drop
    test('should reorder items within a category by drag-and-drop', async ({ page }) => {
      // Create a checklist with default items
      await createAndConfirmChecklist(page);

      // Work with items inside the first category
      const firstCategory = page.getByTestId('category-card').first();
      const itemNames = firstCategory.getByTestId('item-name');
      const itemCount = await itemNames.count();
      expect(itemCount).toBeGreaterThanOrEqual(2);

      const firstItemName = await itemNames.nth(0).textContent();
      const secondItemName = await itemNames.nth(1).textContent();

      // Drag the second item onto the first within the same category
      const itemRows = firstCategory.getByTestId('item-row');
      await slowDragTo(page, itemRows.nth(1), itemRows.nth(0));

      // Verify items swapped
      await expect(itemNames.nth(0)).toHaveText(secondItemName);
      await expect(itemNames.nth(1)).toHaveText(firstItemName);
    });
  });
});
