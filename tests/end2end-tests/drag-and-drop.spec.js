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

import { selectGeneralRecommendedList } from './checklistHelpers.js';

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
 * Perform a slow drag from `source` to `target` by holding the mouse for a
 * given duration. vuedraggable may ignore fast synthetic drags; a longer
 * hold ensures the sortable library registers the operation.
 *
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @param {import('@playwright/test').Locator} source - Locator for the item to drag.
 * @param {import('@playwright/test').Locator} target - Locator for the destination item.
 * @param {{ settleInTarget?: boolean }} [options] - Whether to move within the target before release.
 */
async function slowDragTo(page, source, target, { settleInTarget = false } = {}) {
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

  if (settleInTarget) {
    await page.mouse.move(tgtCenter.x, tgtCenter.y + Math.min(8, tgtBox.height / 4));
    await waitForNextAnimationFrame(page);
    await page.mouse.move(tgtCenter.x, tgtCenter.y);
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

      // Newer checklists appear first in the sidebar.
      await expect(items.nth(0)).toContainText('List B');
      await expect(items.nth(1)).toContainText('List A');

      // Drag the older checklist above the newer checklist.
      await items.nth(1).dragTo(items.nth(0));

      // Verify order swapped
      await expect(items.nth(0)).toContainText('List A');
      await expect(items.nth(1)).toContainText('List B');
    });
  });

  // ---------------------------------------------------------------------------
  // Test Group 2: Category Reorder within Checklist
  // ---------------------------------------------------------------------------

  test.describe('category reorder within checklist', () => {
    // Test Case 2: Should reorder categories by drag-and-drop
    test('should reorder categories by drag-and-drop', async ({ page }) => {
      // Create a checklist from the general recommended list.
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
      // Create a checklist from the general recommended list.
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

    // Test Case 4: Should reorder visible items without moving packed slots
    test('should preserve packed item slots when filtered items are reordered', async ({
      page,
    }) => {
      await createAndConfirmChecklist(page);

      const categoryCards = page.getByTestId('category-card');
      const categoryCount = await categoryCards.count();
      expect(categoryCount).toBeGreaterThanOrEqual(2);

      const firstCategory = categoryCards.nth(0);
      const fullItemNames = firstCategory.getByTestId('item-name');
      const fullItemCount = await fullItemNames.count();
      expect(fullItemCount).toBeGreaterThanOrEqual(4);
      const originalFirstFour = await fullItemNames.evaluateAll((elements) =>
        elements.slice(0, 4).map((element) => element.textContent.trim())
      );

      await firstCategory.getByTestId('item-checkbox').nth(0).click();
      await firstCategory.getByTestId('item-checkbox').nth(2).click();
      await categoryCards.nth(1).getByTestId('category-checkbox').click();

      const filterToggle = page.getByTestId('unpacked-items-filter-toggle');
      await filterToggle.click();
      await expect(filterToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(categoryCards).toHaveCount(categoryCount);
      await expect(categoryCards.nth(1).getByTestId('item-row')).toHaveCount(0);
      await expect(categoryCards.nth(1).getByTestId('add-item-button')).toBeVisible();

      const visibleRows = firstCategory.getByTestId('item-row');
      await slowDragTo(page, visibleRows.nth(1), visibleRows.nth(0));

      await filterToggle.click();
      await expect(filterToggle).toHaveAttribute('aria-pressed', 'false');
      await expect(fullItemNames.nth(0)).toHaveText(originalFirstFour[0]);
      await expect(fullItemNames.nth(1)).toHaveText(originalFirstFour[3]);
      await expect(fullItemNames.nth(2)).toHaveText(originalFirstFour[2]);
      await expect(fullItemNames.nth(3)).toHaveText(originalFirstFour[1]);

      await page.reload();
      await expect(page.getByTestId('unpacked-items-filter-toggle')).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      const persistedNames = page.getByTestId('category-card').first().getByTestId('item-name');
      await expect(persistedNames.nth(0)).toHaveText(originalFirstFour[0]);
      await expect(persistedNames.nth(1)).toHaveText(originalFirstFour[3]);
      await expect(persistedNames.nth(2)).toHaveText(originalFirstFour[2]);
      await expect(persistedNames.nth(3)).toHaveText(originalFirstFour[1]);
    });

    // Test Case 5: Should map a filtered cross-category drop before a visible target
    test('should persist a filtered move into a partially visible category', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1800 });
      await createAndConfirmChecklist(page);

      const categoryCards = page.getByTestId('category-card');
      const sourceCategory = categoryCards.nth(0);
      const targetCategory = categoryCards.nth(1);
      const sourceNames = sourceCategory.getByTestId('item-name');
      const targetNames = targetCategory.getByTestId('item-name');
      const movedItemName = (await sourceNames.nth(0).textContent()).trim();
      const originalTargetNames = await targetNames.evaluateAll((elements) =>
        elements.map((element) => element.textContent.trim())
      );
      expect(originalTargetNames).toHaveLength(4);

      await targetCategory.getByTestId('item-checkbox').nth(0).click();
      await targetCategory.getByTestId('item-checkbox').nth(2).click();

      const filterToggle = page.getByTestId('unpacked-items-filter-toggle');
      await filterToggle.click();
      await expect(targetCategory.getByTestId('item-row')).toHaveCount(2);

      await slowDragTo(
        page,
        sourceCategory.getByTestId('item-row').first(),
        targetCategory.getByTestId('item-row').first()
      );
      await expect(
        targetCategory.getByTestId('item-name').filter({ hasText: movedItemName })
      ).toHaveCount(1);

      await filterToggle.click();
      const expectedTargetNames = [
        originalTargetNames[0],
        movedItemName,
        ...originalTargetNames.slice(1),
      ];
      await expect(targetCategory.getByTestId('item-name')).toHaveText(expectedTargetNames);
      await expect(
        sourceCategory.getByTestId('item-name').filter({ hasText: movedItemName })
      ).toHaveCount(0);

      await page.reload();
      const persistedCategories = page.getByTestId('category-card');
      await expect(persistedCategories.nth(1).getByTestId('item-name')).toHaveText(
        expectedTargetNames
      );
      await expect(
        persistedCategories.nth(0).getByTestId('item-name').filter({ hasText: movedItemName })
      ).toHaveCount(0);
    });

    // Test Case 6: Should append a filtered cross-category drop to an all-hidden target
    test('should persist a filtered move into an all-hidden category', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1800 });
      await createAndConfirmChecklist(page);

      const categoryCards = page.getByTestId('category-card');
      const sourceCategory = categoryCards.nth(0);
      const targetCategory = categoryCards.nth(1);
      const sourceNames = sourceCategory.getByTestId('item-name');
      const targetNames = targetCategory.getByTestId('item-name');
      const movedItemName = (await sourceNames.nth(0).textContent()).trim();
      const originalTargetNames = await targetNames.evaluateAll((elements) =>
        elements.map((element) => element.textContent.trim())
      );

      await targetCategory.getByTestId('category-checkbox').click();

      const filterToggle = page.getByTestId('unpacked-items-filter-toggle');
      await filterToggle.click();
      await expect(targetCategory.getByTestId('item-row')).toHaveCount(0);

      await slowDragTo(
        page,
        sourceCategory.getByTestId('item-row').first(),
        targetCategory.getByTestId('category-items-draggable'),
        { settleInTarget: true }
      );
      await expect(targetCategory.getByTestId('item-name')).toHaveText([movedItemName]);

      await filterToggle.click();
      const expectedTargetNames = [...originalTargetNames, movedItemName];
      await expect(targetCategory.getByTestId('item-name')).toHaveText(expectedTargetNames);
      await expect(
        sourceCategory.getByTestId('item-name').filter({ hasText: movedItemName })
      ).toHaveCount(0);

      await page.reload();
      const persistedCategories = page.getByTestId('category-card');
      await expect(persistedCategories.nth(1).getByTestId('item-name')).toHaveText(
        expectedTargetNames
      );
      await expect(
        persistedCategories.nth(0).getByTestId('item-name').filter({ hasText: movedItemName })
      ).toHaveCount(0);
    });

    // Test Case 7: A remote rename during a drag must survive the eventual drop
    test('preserves a remote item rename made while another tab is dragging it', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 1800 });
      await createAndConfirmChecklist(page);
      const other = await page.context().newPage();
      await other.setViewportSize({ width: 1280, height: 1800 });
      await other.goto('/');

      const source = page.getByTestId('category-card').nth(0).getByTestId('item-row').first();
      const targetCategory = page.getByTestId('category-card').nth(1);
      const target = targetCategory.getByTestId('item-row').first();
      const targetId = await targetCategory.getAttribute('data-category-id');
      const itemId = await source.evaluate(
        (element) => element.closest('[data-item-id]').dataset.itemId
      );
      const sourceBox = await source.boundingBox();
      const origin = {
        x: sourceBox.x + sourceBox.width / 2,
        y: sourceBox.y + sourceBox.height / 2,
      };

      await page.mouse.move(origin.x, origin.y);
      await page.mouse.down();
      await page.mouse.move(origin.x + 12, origin.y + 12, { steps: 4 });
      await waitForNextAnimationFrame(page);
      await other.getByTestId('category-card').nth(0).getByTestId('item-name').first().click();
      await other.getByTestId('item-edit-input').fill('Renamed in second tab');
      await other.getByTestId('item-edit-input').press('Enter');
      await expect(
        page.getByTestId('item-name').filter({ hasText: 'Renamed in second tab' })
      ).toBeVisible();

      const targetBox = await target.boundingBox();
      const destination = {
        x: targetBox.x + targetBox.width / 2,
        y: targetBox.y + targetBox.height / 2,
      };

      for (let index = 1; index <= 40; index++) {
        await page.mouse.move(
          origin.x + ((destination.x - origin.x) * index) / 40,
          origin.y + ((destination.y - origin.y) * index) / 40
        );
        await waitForNextAnimationFrame(page);
      }
      await page.mouse.up();
      await expect
        .poll(() =>
          page.evaluate(
            ({ id }) => {
              const data = JSON.parse(localStorage.getItem('packingListApp'));
              const item = data.items.find((entry) => entry.id === id);
              return { name: item.name, categoryId: item.categoryId };
            },
            { id: itemId }
          )
        )
        .toEqual({ name: 'Renamed in second tab', categoryId: targetId });
      await other.close();
    });
  });
});
