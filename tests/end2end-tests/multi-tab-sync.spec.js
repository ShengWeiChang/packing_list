/*
================================================================================
File: tests/end2end-tests/multi-tab-sync.spec.js
Description: E2E tests for multi-tab synchronization.
             Tests cross-tab storage event handling and state sync.
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

/**
 * Create a checklist and confirm edit input appears.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 */
async function createChecklist(page) {
  await page.getByTestId('sidebar-new-checklist').click();
  await selectGeneralRecommendedList(page);
  const input = page.getByTestId('checklist-name-input');
  await expect(input).toBeVisible();
  await input.press('Enter');
}

/**
 * Rename currently selected checklist.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 * @param {string} name - New checklist name.
 */
async function renameSelectedChecklist(page, name) {
  await page.getByTestId('checklist-name').click();
  const input = page.getByTestId('checklist-name-input');
  await expect(input).toBeVisible();
  await input.fill(name);
  await input.press('Enter');
}

/**
 * Delete currently selected checklist via overflow menu.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 */
async function deleteSelectedChecklist(page) {
  page.once('dialog', (dialog) => dialog.accept());

  const overflowButton = page.locator('[aria-haspopup="true"]').first();
  await expect(overflowButton).toBeVisible();
  await overflowButton.click();

  const deleteButton = page.locator('[data-testid^="overflow-action-delete-checklist-"]').first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}

/**
 * Pack every category in the currently selected checklist.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 */
async function packEveryCategory(page) {
  const categoryCheckboxes = page.getByTestId('category-checkbox');
  const count = await categoryCheckboxes.count();

  for (let index = 0; index < count; index++) {
    const checkbox = categoryCheckboxes.nth(index);
    if (!(await checkbox.isChecked())) await checkbox.click();
  }
}

// -----------------------------------------------------------------------------
// Multi-tab Sync Tests
// -----------------------------------------------------------------------------

test.describe('Multi-tab sync', () => {
  // ---------------------------------------------------------------------------
  // Test Group 1: Cross-tab Storage Event Sync
  // ---------------------------------------------------------------------------

  test.describe('cross-tab storage event sync', () => {
    // Test Case 1: Should sync checklist create and rename across tabs
    test('should sync checklist create and rename across tabs', async ({ browser }) => {
      const context = await browser.newContext();

      const pageA = await context.newPage();
      const pageB = await context.newPage();

      await pageA.goto('/');
      await pageB.goto('/');

      // Create a new checklist in tab A
      await pageA.getByTestId('sidebar-new-checklist').click();
      await selectGeneralRecommendedList(pageA);

      // The new checklist should appear in tab B without reload
      await expect(pageB.getByTestId('sidebar-checklist-item').first()).toBeVisible();

      // Rename in tab B
      await pageB.getByTestId('sidebar-checklist-item').first().click();
      await pageB.getByTestId('checklist-name').click();
      await pageB.getByTestId('checklist-name-input').fill('Shared Trip');
      await pageB.getByTestId('checklist-name-input').press('Enter');

      // Tab A should reflect the rename
      await expect(pageA.locator('text=Shared Trip')).toBeVisible();

      await context.close();
    });

    // Test Case 2: Should converge when the second tab edits after receiving the first change
    test('should converge when tabs rename sequentially after synchronization', async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const pageA = await context.newPage();
      const pageB = await context.newPage();

      await pageA.goto('/');
      await pageB.goto('/');

      await createChecklist(pageA);
      await expect(pageB.getByTestId('sidebar-checklist-item').first()).toBeVisible();

      // Tab A commits first
      await renameSelectedChecklist(pageA, 'Trip from A');
      await expect(pageB.getByTestId('checklist-name')).toHaveText('Trip from A');

      // Tab B starts editing after receiving A's update; both tabs converge to B's value.
      await renameSelectedChecklist(pageB, 'Trip from B');
      await expect(pageA.getByTestId('checklist-name')).toHaveText('Trip from B');
      await expect(pageB.getByTestId('checklist-name')).toHaveText('Trip from B');

      await context.close();
    });

    // Test Case 3: Should still converge after rapid alternating edits across tabs
    test('should converge after rapid alternating cross-tab edits', async ({ browser }) => {
      const context = await browser.newContext();
      const pageA = await context.newPage();
      const pageB = await context.newPage();

      await pageA.goto('/');
      await pageB.goto('/');

      await createChecklist(pageA);
      await expect(pageB.getByTestId('sidebar-checklist-item').first()).toBeVisible();

      await renameSelectedChecklist(pageA, 'A1');
      await renameSelectedChecklist(pageB, 'B1');
      await renameSelectedChecklist(pageA, 'A2');

      // Final writer is tab A; both tabs should match
      await expect(pageA.getByTestId('checklist-name')).toHaveText('A2');
      await expect(pageB.getByTestId('checklist-name')).toHaveText('A2');

      await context.close();
    });

    // Test Case 4: Rename in one tab and delete in another should converge to deletion
    test('should converge to deletion when one tab renames and another tab deletes', async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const pageA = await context.newPage();
      const pageB = await context.newPage();

      await pageA.goto('/');
      await pageB.goto('/');

      await createChecklist(pageA);
      await expect(pageB.getByTestId('sidebar-checklist-item').first()).toBeVisible();

      // Tab A updates name first
      await renameSelectedChecklist(pageA, 'To Be Deleted');
      await expect(pageB.getByTestId('checklist-name')).toHaveText('To Be Deleted');

      // Tab B deletes the same checklist later
      await deleteSelectedChecklist(pageB);

      // Both tabs should converge to empty state (deletion wins as final write)
      await expect(pageA.getByTestId('sidebar-checklist-item')).toHaveCount(0);
      await expect(pageB.getByTestId('sidebar-checklist-item')).toHaveCount(0);
      await expect(pageA.getByTestId('empty-state')).toBeVisible();
      await expect(pageB.getByTestId('empty-state')).toBeVisible();

      await context.close();
    });

    // Test Case 5: Remote completion should sync without opening the local completion journey
    test('should keep remote completion synchronization silent', async ({ browser }) => {
      const context = await browser.newContext();
      const pageA = await context.newPage();
      const pageB = await context.newPage();

      await pageA.goto('/');
      await pageB.goto('/');
      await createChecklist(pageA);
      const syncedChecklist = pageB.getByTestId('sidebar-checklist-item').first();
      await expect(syncedChecklist).toBeVisible();
      await syncedChecklist.click();
      await expect(pageB.getByTestId('category-checkbox').first()).toBeVisible();

      await packEveryCategory(pageA);
      await expect(pageA.getByTestId('packing-completion-overlay')).toBeVisible();
      await expect
        .poll(() =>
          pageB
            .getByTestId('category-checkbox')
            .evaluateAll(
              (checkboxes) =>
                checkboxes.length > 0 && checkboxes.every((checkbox) => checkbox.checked)
            )
        )
        .toBe(true);

      await expect(pageB.getByTestId('packing-completion-overlay')).toHaveCount(0);
      await context.close();
    });

    // Test Case 6: Should serialize concurrent template saves across real browser tabs
    test('keeps both templates when two tabs save behind the same lock barrier', async ({
      browser,
    }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pageA = await context.newPage();
      const pageB = await context.newPage();
      await pageA.goto('/');
      await pageB.goto('/');
      await createChecklist(pageA);
      await expect(pageB.getByTestId('sidebar-checklist-item').first()).toBeVisible();
      await pageB.getByTestId('sidebar-checklist-item').first().click();

      for (const [page, name] of [
        [pageA, 'From A'],
        [pageB, 'From B'],
      ]) {
        await page.locator('[data-testid^="overflow-trigger-checklist-"]').first().click();
        await page
          .locator('[data-testid^="overflow-action-save-template-checklist-"]')
          .first()
          .click();
        await page.getByTestId('save-template-name').fill(name);
      }

      await pageA.evaluate(
        () =>
          new Promise((acquired) => {
            void navigator.locks.request('packing-list-storage-write', async () => {
              await new Promise((release) => {
                window.releaseStorageTestLock = release;
                acquired();
              });
            });
          })
      );
      await Promise.all([
        pageA.getByTestId('save-template-confirm').click(),
        pageB.getByTestId('save-template-confirm').click(),
      ]);
      await expect
        .poll(() =>
          pageA.evaluate(async () => {
            const locks = await navigator.locks.query();
            return locks.pending.filter((lock) => lock.name === 'packing-list-storage-write')
              .length;
          })
        )
        .toBeGreaterThanOrEqual(2);
      await pageA.evaluate(() => window.releaseStorageTestLock());
      await expect(pageA.getByRole('dialog')).toHaveCount(0);
      await expect(pageB.getByRole('dialog')).toHaveCount(0);
      const names = await pageA.evaluate(() =>
        JSON.parse(localStorage.getItem('packingListTemplates')).map((template) => template.name)
      );
      expect(names.sort()).toEqual(['From A', 'From B']);
      await pageB.getByTestId('sidebar-templates-button').click();
      await expect(
        pageB.getByTestId('sidebar-templates-dropdown').getByText('From A')
      ).toBeVisible();
      await expect(
        pageB.getByTestId('sidebar-templates-dropdown').getByText('From B')
      ).toBeVisible();
      await context.close();
    });
  });
});
