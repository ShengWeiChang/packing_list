/* Browser-level storage failure, retry, and raw recovery workflows. */

import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

// Test Case 1: Retain the checklist draft through storage failure and retry.
test('keeps a checklist draft after a real storage failure and saves it on retry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failPackingWrites && key === 'packingListApp') {
        throw new DOMException('Storage full', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('new-checklist-option-empty').click();
  const input = page.getByTestId('checklist-name-input');
  await expect(input).toBeVisible();
  await page.evaluate(() => {
    window.failPackingWrites = true;
  });
  await input.fill('My trip draft');
  await input.press('Enter');
  await expect(input).toHaveValue('My trip draft');
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.evaluate(() => {
    window.failPackingWrites = false;
  });
  await input.press('Enter');
  await expect(page.getByTestId('checklist-name')).toHaveText('My trip draft');
  await page.reload();
  await expect(page.getByTestId('checklist-name')).toHaveText('My trip draft');
});

// Test Case 2: Retain the template name and source through failure and retry.
test('preserves a template name and source after a failed write and retries successfully', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failTemplateWrites && key === 'packingListTemplates') {
        throw new DOMException('Storage full', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('new-checklist-option-empty').click();
  await page.getByTestId('checklist-name-input').press('Enter');
  const checklistId = await page.evaluate(
    () => JSON.parse(localStorage.getItem('packingListApp')).checklists[0].id
  );
  await page.getByTestId(`overflow-trigger-checklist-${checklistId}`).last().click();
  await page.getByTestId(`overflow-action-save-template-checklist-${checklistId}`).last().click();
  const input = page.getByTestId('save-template-name');
  await input.fill('My template draft');
  await page.evaluate(() => {
    window.failTemplateWrites = true;
  });
  await page.getByTestId('save-template-confirm').click();
  await expect(input).toHaveValue('My template draft');
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('storage is full');
  await page.evaluate(() => {
    window.failTemplateWrites = false;
  });
  await page.getByTestId('save-template-confirm').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))?.[0]?.name)
    )
    .toBe('My template draft');
});

// Test Case 3: Retain an edited template draft through failure and retry.
test('retains an edited template draft after a failed save', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([{ id: 'template-1', name: 'Weekend', order: 0, categories: [], items: [] }])
    );
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failTemplateWrites && key === 'packingListTemplates') {
        throw new DOMException('Full', 'QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-template-1').click();
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Edited Weekend');
  await page.getByTestId('checklist-name-input').press('Enter');
  await page.evaluate(() => {
    window.failTemplateWrites = true;
  });
  await page.getByTestId('template-editor-save').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Edited Weekend');
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.evaluate(() => {
    window.failTemplateWrites = false;
  });
  await page.getByTestId('template-editor-save').click();
  await expect(page.getByTestId('template-editor-save')).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('Edited Weekend');
});

// Test Case 4: Reject conflicting edits while preserving the local draft.
test('preserves a stale name draft and rejects a same-field edit from another tab', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('new-checklist-option-empty').click();
  await page.getByTestId('checklist-name-input').press('Enter');
  const other = await context.newPage();
  await other.setViewportSize({ width: 1280, height: 720 });
  await other.goto('/');
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Local draft');
  await other.getByTestId('checklist-name').click();
  await other.getByTestId('checklist-name-input').fill('Remote name');
  await other.getByTestId('checklist-name-input').press('Enter');
  await expect(other.getByTestId('checklist-name')).toHaveText('Remote name');
  await expect(
    page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Remote name' })
  ).toBeVisible();
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect(page.getByTestId('checklist-name-input')).toHaveValue('Local draft');
  await expect(page.getByRole('alert').filter({ hasText: 'changed in another tab' })).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')).checklists[0].name)
  ).toBe('Remote name');
});

// Test Case 5: Merge changes to different fields across tabs.
test('merges a local name draft with a different field changed in another tab', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('new-checklist-option-empty').click();
  await page.getByTestId('checklist-name-input').press('Enter');
  const other = await context.newPage();
  await other.setViewportSize({ width: 1280, height: 720 });
  await other.goto('/');
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Local name');
  await other.getByTestId('checklist-name').click();
  const dateInput = other.locator('input[type="date"]').first();
  await dateInput.fill('2030-06-01');
  await dateInput.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('packingListApp')).checklists[0].startDate
      )
    )
    .toBe('2030-06-01');
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect(page.getByTestId('checklist-name')).toHaveText('Local name');
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('packingListApp')).checklists[0]
  );
  expect(stored).toMatchObject({ name: 'Local name', startDate: '2030-06-01' });
});

// Test Case 6: Report unavailable domains when browser storage is denied.
test('shows unavailable domains instead of crashing when browser storage is denied', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Denied', 'SecurityError');
    };
    Storage.prototype.setItem = () => {
      throw new DOMException('Denied', 'SecurityError');
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Checklist storage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Template storage' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download original data' })).toHaveCount(0);
  await expect(page.getByTestId('empty-state')).toHaveCount(0);
});

// Test Case 7: Do not report packing success when the write fails.
test('does not show packing success or undo when a category write fails', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'cl-1', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [{ id: 'cat-1', name: 'Clothes', checklistId: 'cl-1', order: 0 }],
        items: [
          {
            id: 'item-1',
            name: 'Hat',
            quantity: 1,
            categoryId: 'cat-1',
            checklistId: 'cl-1',
            order: 0,
            isPacked: false,
            isPending: false,
          },
        ],
      })
    );
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListApp') throw new DOMException('Full', 'QuotaExceededError');
      return originalSetItem.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const checkbox = page.getByTestId('category-checkbox');
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await expect(page.getByTestId('packing-undo-toast')).toHaveCount(0);
  await expect(page.getByTestId('packing-completion-overlay')).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')).items[0].isPacked)
  ).toBe(false);
});

// Test Case 8: Keep healthy checklist data available when templates are unsupported.
test('keeps checklist operations available when only template data is unsupported', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('packingListTemplates', '{"schemaVersion":99}');
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Template storage' })).toBeVisible();
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('new-checklist-option-empty').click();
  await page.getByTestId('checklist-name-input').fill('Still usable');
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect(page.getByTestId('checklist-name')).toHaveText('Still usable');
  expect(await page.evaluate(() => localStorage.getItem('packingListTemplates'))).toBe(
    '{"schemaVersion":99}'
  );
});

// Test Case 9: Refuse writes and explain unavailable Web Locks.
test('explains when safe browser locking is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('new-checklist-option-empty').click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Safe writing is unavailable'
  );
  expect(await page.evaluate(() => localStorage.getItem('packingListApp'))).toBeNull();
});

// Test Case 10: Keep a failed draft attached to its original checklist.
test('preserves a failed draft separately when switching checklists', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'a', name: 'List A', startDate: '2026-01-01', endDate: '2026-01-01', order: 1 },
          { id: 'b', name: 'List B', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [],
        items: [],
      })
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failPackingWrites && key === 'packingListApp')
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Unsaved A draft');
  await page.evaluate(() => {
    window.failPackingWrites = true;
  });
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.getByTestId('sidebar-checklist-item').filter({ hasText: 'List B' }).click();
  await expect(page.getByTestId('checklist-name')).toHaveText('List B');
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved A draft' })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('packingListApp')).checklists.find(
          (entry) => entry.id === 'a'
        ).name
    )
  ).toBe('List A');
});

// Test Case 11: A queued stale save cannot resurrect an item deleted in another tab.
test('preserves the draft when a queued edit follows a remote deletion', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'cl', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [{ id: 'cat', name: 'Clothes', checklistId: 'cl', order: 0 }],
        items: [
          {
            id: 'item',
            name: 'Hat',
            quantity: 1,
            categoryId: 'cat',
            checklistId: 'cl',
            order: 0,
            isPacked: false,
            isPending: false,
          },
        ],
      })
    );
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const other = await context.newPage();
  await other.setViewportSize({ width: 1280, height: 720 });
  await other.goto('/');
  await page.getByTestId('item-name').click();
  await page.getByTestId('item-edit-input').fill('Unsaved hat');
  await other.evaluate(() => {
    window.lockReady = false;
    void navigator.locks.request('packing-list-storage-write', async () => {
      window.lockReady = true;
      await new Promise((resolve) => {
        window.releaseTestLock = resolve;
      });
    });
  });
  await expect.poll(() => other.evaluate(() => window.lockReady)).toBe(true);
  await other.getByTestId('item-row').hover();
  await other.getByTestId('item-quantity-decrement').click();
  await page.getByTestId('item-edit-input').press('Enter');
  await expect
    .poll(() => page.evaluate(async () => (await navigator.locks.query()).pending.length))
    .toBeGreaterThanOrEqual(2);
  await other.evaluate(() => window.releaseTestLock());
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved hat' })).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')).items)
  ).toEqual([]);
});

// Test Case 12: A committed write with failed refresh is not reported as a failed save.
test('reports a saved checklist when only the following refresh fails', async ({ page }) => {
  await page.addInitScript(() => {
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'packingListApp' && window.failAppReads)
        throw new DOMException('Denied', 'SecurityError');
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      originalSet.call(this, key, value);
      if (key === 'packingListApp' && window.failReadAfterSave) window.failAppReads = true;
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-new-checklist').click();
  await page.evaluate(() => {
    window.failReadAfterSave = true;
  });
  await page.getByTestId('new-checklist-option-empty').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Your change was saved' })).toBeVisible();
  await page.evaluate(() => {
    window.failAppReads = false;
    window.failReadAfterSave = false;
  });
  await page.getByRole('button', { name: 'Retry reading' }).click();
  await expect(page.getByTestId('sidebar-checklist-item')).toHaveCount(1);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')).checklists.length)
  ).toBe(1);
});

// Test Case 13: Cancelling a failed draft must not hide a later unrelated failure.
test('shows a later template deletion error after cancelling a failed checklist edit', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'cl', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [],
        items: [],
      })
    );
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([{ id: 'tpl', name: 'Weekend', order: 0, categories: [], items: [] }])
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failWrites && (key === 'packingListApp' || key === 'packingListTemplates'))
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Draft');
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.getByTestId('checklist-name-input').press('Escape');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-tpl').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId('template-editor-delete').click();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates')).length)
  ).toBe(1);
});

// Test Case 14: Keep the original selection when copying succeeds but refresh fails.
test('keeps the original checklist selected after copy succeeds and refresh fails', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          {
            id: 'cl',
            name: 'Original trip',
            startDate: '2026-01-01',
            endDate: '2026-01-01',
            order: 0,
          },
        ],
        categories: [],
        items: [],
      })
    );
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'packingListApp' && window.failAppReads)
        throw new DOMException('Denied', 'SecurityError');
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      originalSet.call(this, key, value);
      if (key === 'packingListApp' && window.failReadAfterSave) window.failAppReads = true;
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.evaluate(() => {
    window.failReadAfterSave = true;
  });
  await page.getByRole('main').getByTestId('overflow-trigger-checklist-cl').click();
  await page.getByRole('main').getByTestId('overflow-action-copy-checklist-cl').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Original trip');
  await expect(page.getByRole('status').filter({ hasText: 'Your change was saved' })).toBeVisible();
  await page.evaluate(() => {
    window.failAppReads = false;
    window.failReadAfterSave = false;
  });
  await page.getByRole('button', { name: 'Retry reading' }).click();
  await expect(page.getByTestId('sidebar-checklist-item')).toHaveCount(2);
  await expect(page.getByTestId('checklist-name')).toHaveText('Original trip');
});

// Test Case 15: Cancelling an old draft cannot dismiss a newer failure.
test('retains a newer operation error when an older failed draft is cancelled', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'cl', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [{ id: 'cat', name: 'Clothes', checklistId: 'cl', order: 0 }],
        items: [
          {
            id: 'item',
            name: 'Hat',
            quantity: 1,
            categoryId: 'cat',
            checklistId: 'cl',
            order: 0,
            isPacked: false,
            isPending: false,
          },
        ],
      })
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failWrites && key === 'packingListApp')
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Draft');
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.getByTestId('item-row').hover();
  await page.getByTestId('item-quantity-decrement').click();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toHaveCount(2);
  await page.getByTestId('checklist-name-input').press('Escape');
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toHaveCount(1);
  await expect(page.getByTestId('item-name')).toHaveText('Hat');
});

// Test Case 16: Closing a failed template editor cannot hide later failures.
test('shows a later checklist error after cancelling a failed template save', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'cl', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [],
        items: [],
      })
    );
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([{ id: 'tpl', name: 'Weekend', order: 0, categories: [], items: [] }])
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failWrites && (key === 'packingListApp' || key === 'packingListTemplates'))
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-tpl').click();
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.getByTestId('template-editor-save').click();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('main').getByTestId('overflow-trigger-checklist-cl').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('main').getByTestId('overflow-action-delete-checklist-cl').click();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip');
});

// Test Case 17: Do not switch editors while a template save waits for a lock.
test('does not switch template editors while a save is pending', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([
        { id: 'a', name: 'Template A', order: 0, categories: [], items: [] },
        { id: 'b', name: 'Template B', order: 1, categories: [], items: [] },
      ])
    );
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-a').click();
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Updated A');
  await page.getByTestId('checklist-name-input').press('Enter');
  await page.evaluate(() => {
    window.lockReady = false;
    void navigator.locks.request('packing-list-storage-write', async () => {
      window.lockReady = true;
      await new Promise((resolve) => {
        window.releaseTestLock = resolve;
      });
    });
  });
  await expect.poll(() => page.evaluate(() => window.lockReady)).toBe(true);
  await page.getByTestId('template-editor-save').click();
  await expect(page.getByTestId('template-editor-save')).toBeDisabled();
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-b').click();
  await expect(page.getByText('Editing template: Template A')).toBeVisible();
  await expect(page.getByTestId('checklist-name')).toHaveText('Updated A');
  await page.evaluate(() => window.releaseTestLock());
  await expect(page.getByTestId('template-editor-save')).toHaveCount(0);
  const templates = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('packingListTemplates'))
  );
  expect(templates.find((template) => template.id === 'a').name).toBe('Updated A');
  expect(templates.find((template) => template.id === 'b').name).toBe('Template B');
});

// Test Case 18: Require consent before discarding a failed template draft.
test('keeps a failed template draft when switching is declined', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([
        { id: 'a', name: 'Template A', order: 0, categories: [], items: [] },
        { id: 'b', name: 'Template B', order: 1, categories: [], items: [] },
      ])
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failWrites && key === 'packingListTemplates')
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-a').click();
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('My unsaved draft');
  await page.getByTestId('checklist-name-input').press('Enter');
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.getByTestId('template-editor-save').click();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('new-checklist-option-empty').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-a').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('My unsaved draft');
  await page.getByTestId('sidebar-templates-button').click();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByTestId('sidebar-template-use-b').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('My unsaved draft');
  await expect(page.getByText('Editing template: Template A')).toBeVisible();
  await page.getByTestId('sidebar-templates-button').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId('sidebar-template-use-b').click();
  await expect(page.getByText('Editing template: Template B')).toBeVisible();
});

// Test Case 19: Exiting an unchanged failed edit must release its own error.
test('shows later errors after restoring the original item name', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'cl', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [{ id: 'cat', name: 'Clothes', checklistId: 'cl', order: 0 }],
        items: [
          {
            id: 'item',
            name: 'Hat',
            quantity: 1,
            categoryId: 'cat',
            checklistId: 'cl',
            order: 0,
            isPacked: false,
            isPending: false,
          },
        ],
      })
    );
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([{ id: 'tpl', name: 'Weekend', order: 0, categories: [], items: [] }])
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failWrites && (key === 'packingListApp' || key === 'packingListTemplates'))
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('item-name').click();
  await page.getByTestId('item-edit-input').fill('Unsaved');
  await page.evaluate(() => {
    window.failWrites = true;
  });
  await page.getByTestId('item-edit-input').press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await page.getByTestId('item-edit-input').fill('Hat');
  await page.getByTestId('item-edit-input').press('Enter');
  await expect(page.getByTestId('item-name')).toHaveText('Hat');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-tpl').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId('template-editor-delete').click();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
});

for (const { locale, width, heading, exportLabel, retryLabel } of [
  {
    locale: 'en',
    width: 1280,
    heading: 'Checklist storage',
    exportLabel: 'Download original data',
    retryLabel: 'Retry reading',
  },
  {
    locale: 'zh-TW',
    width: 390,
    heading: '清單儲存空間',
    exportLabel: '下載原始資料',
    retryLabel: '重新讀取',
  },
]) {
  // Test Cases 20–21: Export original data and retry in each locale and viewport.
  test(`preserves and exports corrupt data, then retries in ${locale} at ${width}px`, async ({
    page,
  }) => {
    const raw = '{broken data';
    await page.addInitScript(
      ({ locale, raw }) => {
        localStorage.setItem('user-locale', locale);
        localStorage.setItem('packingListApp', raw);
      },
      { locale, raw }
    );
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('packingListApp'))).toBe(raw);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: exportLabel }).click();
    const download = await downloadPromise;
    expect(await readFile(await download.path(), 'utf8')).toBe(raw);
    await page.evaluate(() =>
      localStorage.setItem(
        'packingListApp',
        JSON.stringify({ checklists: [], categories: [], items: [] })
      )
    );
    const retry = page.getByRole('button', { name: retryLabel });
    await retry.focus();
    await retry.press('Enter');
    await expect(page.getByRole('heading', { name: heading })).toHaveCount(0);
    await expect(page.locator('main h1')).toBeFocused();
  });
}

// Test Case 22: A queued failure remains visible after its editor is removed.
test('shows a queued save failure after switching checklists', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'a', name: 'List A', startDate: '2026-01-01', endDate: '2026-01-01', order: 1 },
          { id: 'b', name: 'List B', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
        ],
        categories: [],
        items: [],
      })
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.failPackingWrites && key === 'packingListApp')
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill('Queued draft');
  await page.evaluate(() => {
    window.lockReady = false;
    void navigator.locks.request('packing-list-storage-write', async () => {
      window.lockReady = true;
      await new Promise((resolve) => {
        window.releaseTestLock = resolve;
      });
    });
  });
  await expect.poll(() => page.evaluate(() => window.lockReady)).toBe(true);
  await page.evaluate(() => {
    window.failPackingWrites = true;
  });
  await page.getByTestId('checklist-name-input').press('Enter');
  await expect
    .poll(() => page.evaluate(async () => (await navigator.locks.query()).pending.length))
    .toBeGreaterThanOrEqual(1);
  await page.getByTestId('sidebar-checklist-item').filter({ hasText: 'List B' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Queued draft' })).toBeVisible();
  await page.evaluate(() => window.releaseTestLock());
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await expect(page.getByTestId('checklist-name')).toHaveText('List B');
});

for (const { field, label, input, expected } of [
  { field: 'name', label: 'checklist-name', input: 'checklist-name-input', expected: 'New title' },
  {
    field: 'category',
    label: 'category-name',
    input: 'category-name-input',
    expected: 'New category',
  },
  { field: 'item', label: 'item-name', input: 'item-edit-input', expected: 'New item' },
]) {
  // Test Cases 23–25: Save active inline edits without requiring Enter first.
  test(`saves an active template ${field} when Save is clicked`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'packingListTemplates',
        JSON.stringify([
          {
            id: 'template-1',
            name: 'Weekend',
            order: 0,
            categories: [{ id: 'category-1', name: 'Clothes', order: 0 }],
            items: [{ name: 'Hat', quantity: 1, categoryId: 'category-1', order: 0 }],
          },
        ])
      );
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.getByTestId('sidebar-templates-button').click();
    await page.getByTestId('sidebar-template-use-template-1').click();
    await page.getByTestId(label).click();
    await page.getByTestId(input).fill(expected);
    await page.getByTestId('template-editor-save').click();
    await expect(page.getByTestId('template-editor-save')).toHaveCount(0);
    const template = await page.evaluate(
      () => JSON.parse(localStorage.getItem('packingListTemplates'))[0]
    );
    const actual =
      field === 'name'
        ? template.name
        : field === 'category'
          ? template.categories[0].name
          : template.items[0].name;
    expect(actual).toBe(expected);
  });
}

// Test Case 26: Composition must finish before a template draft is saved.
test('waits for composition to finish before saving a template title', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListTemplates',
      JSON.stringify([{ id: 'template-1', name: 'Weekend', order: 0, categories: [], items: [] }])
    );
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListTemplates')
        window.templateWriteCount = (window.templateWriteCount || 0) + 1;
      return original.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-template-1').click();
  await page.getByTestId('checklist-name').click();
  const input = page.getByTestId('checklist-name-input');
  await input.dispatchEvent('compositionstart');
  await input.evaluate((element) => {
    element.value = '旅行清單';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await page.getByTestId('template-editor-save').click();
  await expect(page.getByTestId('template-editor-save')).toBeVisible();
  expect(await page.evaluate(() => window.templateWriteCount || 0)).toBe(0);
  await input.dispatchEvent('compositionend');
  await page.getByTestId('template-editor-save').click();
  await expect(page.getByTestId('template-editor-save')).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('旅行清單');
  expect(await page.evaluate(() => window.templateWriteCount)).toBe(1);
});

for (const { firstAction, secondAction } of [
  { firstAction: 'item-pack', secondAction: 'pending' },
  { firstAction: 'pending', secondAction: 'category-pack' },
]) {
  // Test Cases 27–28: Conflicting item and category status changes cannot merge.
  test(`rejects queued ${secondAction} after another tab commits ${firstAction}`, async ({
    page,
    context,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'packingListApp',
        JSON.stringify({
          checklists: [
            { id: 'cl', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-01', order: 0 },
          ],
          categories: [{ id: 'cat', name: 'Clothes', checklistId: 'cl', order: 0 }],
          items: [
            {
              id: 'item',
              name: 'Hat',
              quantity: 1,
              categoryId: 'cat',
              checklistId: 'cl',
              order: 0,
              isPacked: false,
              isPending: false,
            },
            {
              id: 'other',
              name: 'Gloves',
              quantity: 1,
              categoryId: 'cat',
              checklistId: 'cl',
              order: 1,
              isPacked: false,
              isPending: false,
            },
          ],
        })
      );
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const other = await context.newPage();
    await other.setViewportSize({ width: 1280, height: 720 });
    await other.goto('/');
    const holder = await context.newPage();
    await holder.goto('/');
    await holder.evaluate(() => {
      window.lockReady = false;
      void navigator.locks.request('packing-list-storage-write', async () => {
        window.lockReady = true;
        await new Promise((resolve) => {
          window.releaseTestLock = resolve;
        });
      });
    });
    await expect.poll(() => holder.evaluate(() => window.lockReady)).toBe(true);
    const act = async (target, action) => {
      if (action === 'category-pack') {
        await target.getByTestId('category-checkbox').click();
      } else if (action === 'item-pack') {
        await target.getByTestId('item-checkbox').first().click();
      } else {
        await target.getByTestId('item-row').first().hover();
        await target.getByTestId('item-pending-toggle').first().click();
      }
    };
    await act(page, firstAction);
    await expect
      .poll(() => page.evaluate(async () => (await navigator.locks.query()).pending.length))
      .toBeGreaterThanOrEqual(1);
    await act(other, secondAction);
    await expect
      .poll(() => page.evaluate(async () => (await navigator.locks.query()).pending.length))
      .toBeGreaterThanOrEqual(2);
    await holder.evaluate(() => window.releaseTestLock());
    await expect(other.getByRole('alert')).toContainText('changed in another tab');
    const items = await page.evaluate(
      () => JSON.parse(localStorage.getItem('packingListApp')).items
    );
    expect(items.find((item) => item.id === 'item')).toMatchObject(
      firstAction === 'item-pack'
        ? { isPacked: true, isPending: false }
        : { isPacked: false, isPending: true }
    );
    expect(items.find((item) => item.id === 'other')).toMatchObject({
      isPacked: false,
      isPending: false,
    });
  });
}
