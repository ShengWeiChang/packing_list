/* A drag must reject stale category membership observed before another tab adds an item. */
import { expect, test } from '@playwright/test';

// Test Case 1: A stale T0 target must not accept M1 after another tab creates N1.
test('refreshes a stale drag instead of persisting duplicate target orders', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    if (localStorage.getItem('packingListApp')) return;
    localStorage.setItem('packingListLastOpenedChecklistId', 'trip');
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [{ id: 'trip', name: 'Trip', order: 0 }],
        categories: ['source', 'target'].map((id, order) => ({
          id,
          name: id,
          order,
          checklistId: 'trip',
        })),
        items: [
          ['M', 'source'],
          ['T', 'target'],
        ].map(([id, categoryId]) => ({
          id,
          name: id,
          categoryId,
          checklistId: 'trip',
          order: 0,
          quantity: 1,
          isPacked: false,
          isPending: false,
        })),
      })
    );
  });
  await page.goto('/');
  const otherTab = await page.context().newPage();
  await otherTab.goto('/');
  const moved = page.locator('[data-testid="item-row"][data-item-id="M"]');
  const target = page.locator('[data-testid="item-row"][data-item-id="T"]');
  await expect(moved).toBeVisible();
  await expect(target).toBeVisible();
  const from = await moved.boundingBox();
  const to = await target.boundingBox();
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 40; step++) {
    await page.mouse.move(
      x + ((to.x + to.width / 2 - x) * step) / 40,
      y + ((to.y + to.height - 3 - y) * step) / 40
    );
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  // The pointer remains down: A owns the original drag baseline while B writes under Web Locks.
  await otherTab.evaluate(async () => {
    const { LocalStorageService } = await import('/source/services/localStorageService.ts');
    await new LocalStorageService().createItem('trip', {
      id: 'N',
      name: 'N',
      categoryId: 'target',
      order: 1,
    });
  });
  await page.mouse.up();
  const sourceList = page.locator(
    '[data-testid="category-items-draggable"][data-category-id="source"]'
  );
  const readRows = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem('packingListApp')).items.map(({ id, categoryId, order }) => ({
        id,
        categoryId,
        order,
      }))
    );
  await expect.poll(readRows).toEqual([
    { id: 'M', categoryId: 'source', order: 0 },
    { id: 'T', categoryId: 'target', order: 0 },
    { id: 'N', categoryId: 'target', order: 1 },
  ]);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(sourceList.getByTestId('item-row')).toHaveCount(1);
  await expect(sourceList.getByTestId('item-row')).toHaveAttribute('data-item-id', 'M');
  await page.reload();
  await expect(sourceList.getByTestId('item-row')).toHaveAttribute('data-item-id', 'M');
  await otherTab.close();
});
