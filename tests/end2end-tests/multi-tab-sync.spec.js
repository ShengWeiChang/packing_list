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

/**
 * Create a checklist and confirm edit input appears.
 * @param {import('@playwright/test').Page} page - Active Playwright page.
 */
async function createChecklist(page) {
  await page.getByTestId('sidebar-new-checklist').click();
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

    // Test Case 2: Should converge to latest rename when two tabs edit same checklist
    test('should converge to the latest rename when two tabs edit concurrently', async ({
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

      // Tab B commits later; both tabs should converge to B's value (last-write-wins)
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
  });
});
