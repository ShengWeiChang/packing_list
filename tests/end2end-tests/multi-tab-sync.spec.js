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
    // Should sync checklist create and rename across tabs
    // Test Case 1: should sync checklist create and rename across tabs.
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

    // Should converge when the second tab edits after receiving the first change
    // Test Case 2: should converge when tabs rename sequentially after synchronization.
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

    // Should still converge after rapid alternating edits across tabs
    // Test Case 3: should converge after rapid alternating cross-tab edits.
    test('should converge after rapid alternating cross-tab edits', async ({ browser }) => {
      const context = await browser.newContext();
      const pageA = await context.newPage();
      const pageB = await context.newPage();

      await pageA.goto('/');
      await pageB.goto('/');

      await createChecklist(pageA);
      await expect(pageB.getByTestId('sidebar-checklist-item').first()).toBeVisible();

      await renameSelectedChecklist(pageA, 'A1');
      await expect(pageB.getByTestId('checklist-name')).toHaveText('A1');
      await renameSelectedChecklist(pageB, 'B1');
      await expect(pageA.getByTestId('checklist-name')).toHaveText('B1');
      await renameSelectedChecklist(pageA, 'A2');

      // Final writer is tab A; both tabs should match
      await expect(pageA.getByTestId('checklist-name')).toHaveText('A2');
      await expect(pageB.getByTestId('checklist-name')).toHaveText('A2');

      await context.close();
    });

    // Rename in one tab and delete in another should converge to deletion
    // Test Case 4: should converge to deletion when one tab renames and another tab deletes.
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

    // Remote completion should sync without opening the local completion journey
    // Test Case 5: should keep remote completion synchronization silent.
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

    // Test Case 6: restores the last deleted checklist with its contents through keyboard undo and redo.
    test('restores the last deleted checklist with its contents through keyboard undo and redo', async ({
      page,
    }) => {
      await page.goto('/');
      await createChecklist(page);
      await renameSelectedChecklist(page, 'Restorable trip');
      await expect
        .poll(() =>
          page.evaluate(() =>
            JSON.parse(localStorage.getItem('packingListApp')).checklists.some(
              (entry) => entry.name === 'Restorable trip'
            )
          )
        )
        .toBe(true);
      const before = await page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')));
      const checklist = before.checklists.find((entry) => entry.name === 'Restorable trip');
      expect(
        before.items.filter((entry) => entry.checklistId === checklist.id).length
      ).toBeGreaterThan(0);
      await deleteSelectedChecklist(page);
      await expect(
        page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Restorable trip' })
      ).toHaveCount(0);
      await page.keyboard.press('Control+z');
      await expect(
        page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Restorable trip' })
      ).toBeVisible();
      const restored = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('packingListApp'))
      );
      expect(restored.items.filter((entry) => entry.checklistId === checklist.id)).toEqual(
        before.items.filter((entry) => entry.checklistId === checklist.id)
      );
      await page.keyboard.press('Control+Shift+z');
      await expect(
        page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Restorable trip' })
      ).toHaveCount(0);
    });

    // Test Case 7: identifies the affected checklist after cross-checklist undo and redo.
    test('identifies the affected checklist after cross-checklist undo and redo', async ({
      page,
    }) => {
      await page.goto('/');
      await createChecklist(page);
      await renameSelectedChecklist(page, 'First trip');
      await createChecklist(page);
      await renameSelectedChecklist(page, 'Second trip');
      await page.getByTestId('sidebar-checklist-item').filter({ hasText: 'First trip' }).click();
      await page.getByTestId('category-checkbox').first().click();
      await expect(page.getByTestId('category-checkbox').first()).toBeChecked();
      await page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Second trip' }).click();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.locator('main').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect
        .poll(() =>
          page.evaluate(() => Math.max(window.scrollY, document.querySelector('main').scrollTop))
        )
        .toBeGreaterThan(0);
      await page.keyboard.press('Control+z');
      await expect(page.getByTestId('cross-checklist-history-feedback')).toBeInViewport();
      await expect(
        page.getByRole('status').filter({ hasText: 'Undid a change in First trip' })
      ).toBeVisible();
      await page.keyboard.press('Control+Shift+z');
      await expect(
        page.getByRole('status').filter({ hasText: 'Redid a change in First trip' })
      ).toBeVisible();
      await expect(page.getByTestId('checklist-name')).toHaveText('Second trip');
      await page.getByTestId('sidebar-language-button').click();
      await page.getByTestId('sidebar-language-option-zh-TW').click();
      await expect(page.getByTestId('cross-checklist-history-feedback')).toContainText(
        '已重做 First trip 的變更'
      );
      await page.getByTestId('category-checkbox').first().click();
      await expect(page.getByTestId('cross-checklist-history-feedback')).toBeHidden();
      await expect(page.getByTestId('packing-undo-toast')).toHaveCount(0);
    });

    // Test Case 8: keeps long Chinese cross-checklist feedback operable at 320px.
    test('keeps long Chinese cross-checklist feedback operable at 320px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      const longName = '旅'.repeat(100);
      await page.addInitScript((name) => {
        localStorage.setItem('user-locale', 'zh-TW');
        localStorage.setItem('packingListLastOpenedChecklistId', 'list-a');
        localStorage.setItem(
          'packingListApp',
          JSON.stringify({
            checklists: [
              { id: 'list-a', name, order: 0 },
              { id: 'list-b', name: '第二份清單', order: 1 },
            ],
            categories: [
              { id: 'cat-a', checklistId: 'list-a', name: '第一類', order: 0 },
              { id: 'cat-a2', checklistId: 'list-a', name: '另一類', order: 1 },
              { id: 'cat-b', checklistId: 'list-b', name: '用品', order: 0 },
            ],
            items: [
              {
                id: 'item-a',
                checklistId: 'list-a',
                categoryId: 'cat-a',
                name: '護照',
                quantity: 1,
                isPacked: false,
                isPending: false,
                order: 0,
              },
              {
                id: 'item-a2',
                checklistId: 'list-a',
                categoryId: 'cat-a2',
                name: '衣服',
                quantity: 1,
                isPacked: false,
                isPending: false,
                order: 0,
              },
              ...Array.from({ length: 25 }, (_, index) => ({
                id: `item-b-${index}`,
                checklistId: 'list-b',
                categoryId: 'cat-b',
                name: `物品 ${index}`,
                quantity: 1,
                isPacked: false,
                isPending: false,
                order: index,
              })),
            ],
          })
        );
      }, longName);
      await page.goto('/');
      await page.getByTestId('category-checkbox').first().click();
      await page.getByTestId('topbar-toggle').click();
      await page.getByTestId('sidebar-checklist-item').filter({ hasText: '第二份清單' }).click();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.locator('main').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await page.keyboard.press('Control+z');
      const notice = page.getByTestId('cross-checklist-history-feedback');
      await expect(notice).toBeInViewport();
      await expect(notice).toContainText(longName);
      const box = await notice.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      expect(box.width).toBeGreaterThan(275);
      await expect(notice.getByRole('button')).toHaveCount(0);
      const text = notice.locator('span');
      const geometry = await text.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        lineHeight: parseFloat(getComputedStyle(element).lineHeight),
        overflow: getComputedStyle(element).textOverflow,
      }));
      expect(geometry.height).toBeLessThanOrEqual(geometry.lineHeight + 1);
      expect(geometry.overflow).toBe('ellipsis');
      await expect(notice).toBeHidden();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByTestId('topbar-toggle').click();
      const drawer = page.getByTestId('overlay-sidebar');
      await drawer.getByTestId('history-redo').click();
      const drawerNotice = drawer.getByTestId('sidebar-history-feedback');
      await expect(drawerNotice).toContainText(longName);
      await expect(drawerNotice.getByRole('button')).toHaveCount(0);
      const drawerBox = await drawerNotice.boundingBox();
      expect(drawerBox.width).toBeGreaterThan(300);
      expect(drawerBox.x + drawerBox.width).toBeLessThanOrEqual(320);
      await expect(drawerNotice).toBeHidden();
    });

    // Test Case 9: does not undo a later packing change from another tab.
    test('does not undo a later packing change from another tab', async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const pageA = await context.newPage();
      const pageB = await context.newPage();
      await pageA.goto('/');
      await pageB.goto('/');
      await createChecklist(pageA);
      const synced = pageB.getByTestId('sidebar-checklist-item').first();
      await expect(synced).toBeVisible();
      await synced.click();
      const categoryA = pageA.getByTestId('category-card').first();
      const categoryB = pageB.getByTestId('category-card').first();
      await categoryA.getByTestId('category-checkbox').click();
      const itemB = categoryB.getByTestId('item-checkbox').first();
      await expect(itemB).toBeChecked();
      await itemB.click();
      await expect(itemB).not.toBeChecked();
      const itemA = categoryA.getByTestId('item-checkbox').first();
      await expect(itemA).not.toBeChecked();
      await pageA.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await pageA.locator('main').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect(pageA.getByTestId('history-barrier-feedback')).toBeInViewport();
      await expect(
        pageA.getByRole('status').filter({ hasText: 'Undo and redo history was cleared' })
      ).toBeVisible();
      await pageA.locator('main').click({ position: { x: 2, y: 2 } });
      await pageA.keyboard.press('Control+z');
      await expect(itemA).not.toBeChecked();
      await expect(itemB).not.toBeChecked();
      await context.close();
    });

    // Should serialize concurrent template saves across real browser tabs
    // Test Case 10: keeps both templates when two tabs save behind the same lock barrier.
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
