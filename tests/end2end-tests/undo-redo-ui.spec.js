import { expect, test } from '@playwright/test';

/** Seed a long checklist for responsive history tests.
 * @param {import('@playwright/test').Page} page - Browser page.
 */
async function seed(page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [{ id: 'trip', name: 'Trip', order: 0 }],
        categories: [{ id: 'clothes', checklistId: 'trip', name: 'Clothes', order: 0 }],
        items: Array.from({ length: 30 }, (_, order) => ({
          id: `item-${order}`,
          checklistId: 'trip',
          categoryId: 'clothes',
          name: `Item ${order}`,
          quantity: 1,
          order,
          isPacked: false,
          isPending: false,
        })),
      })
    );
  });
}

test('desktop history controls undo and redo a status change and protect an active draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const undo = page.getByTestId('history-undo');
  const redo = page.getByTestId('history-redo');
  await expect(undo).toBeDisabled();
  const checkbox = page.getByTestId('item-checkbox').first();
  await checkbox.click();
  await expect(undo).toBeEnabled();
  await undo.click();
  await expect(checkbox).not.toBeChecked();
  await expect(redo).toBeEnabled();
  await redo.click();
  await expect(checkbox).toBeChecked();
  await page.getByTestId('item-name').first().click();
  const input = page.getByTestId('item-edit-input').first();
  await input.fill('Unsaved draft');
  await expect(undo).toBeDisabled();
  await undo.click({ force: true });
  await expect(input).toHaveValue('Unsaved draft');
});

test('mobile topbar hides on downward scroll and returns on upward scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/');
  const bar = page.getByTestId('mobile-topbar');
  await expect(bar).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(bar).toHaveAttribute('inert', '');
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect(bar).not.toHaveAttribute('inert', '');
  await expect(page.getByTestId('history-undo')).toBeVisible();
});

test('mobile controls restore the last deleted checklist and reset after reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await seed(page);
  await page.goto('/');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByTestId('overflow-trigger-checklist-trip').last().click();
  await page.getByTestId('overflow-action-delete-checklist-trip').last().click();
  await expect(page.getByTestId('history-undo')).toBeEnabled();
  await page.getByTestId('history-undo').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip');
  await expect(page.getByTestId('history-redo')).toBeEnabled();
  await page.reload();
  await expect(page.getByTestId('history-undo')).toBeDisabled();
  await expect(page.getByTestId('history-redo')).toBeDisabled();
});

test('category packing has no toast and undo shows a brief result', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.addInitScript(() => {
    const data = JSON.parse(localStorage.getItem('packingListApp'));
    data.categories.push({ id: 'other', checklistId: 'trip', name: 'Other', order: 1 });
    data.items.push({
      id: 'other-item',
      checklistId: 'trip',
      categoryId: 'other',
      name: 'Other item',
      quantity: 1,
      order: 0,
      isPacked: false,
      isPending: false,
    });
    localStorage.setItem('packingListApp', JSON.stringify(data));
  });
  await page.goto('/');
  await page.getByTestId('category-checkbox').first().click();
  await expect(page.getByTestId('category-checkbox').first()).toBeChecked();
  await expect(page.getByTestId('packing-undo-toast')).toHaveCount(0);
  await expect(page.getByTestId('history-result')).toHaveCount(0);
  await page.getByTestId('history-undo').click();
  await expect(page.getByTestId('history-result')).toContainText('Undone');
  await expect(page.getByTestId('category-checkbox').first()).not.toBeChecked();
});

test('keyboard history works immediately after packing and quantity controls retain checkbox focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const checkbox = page.getByTestId('item-checkbox').first();
  await checkbox.click();
  await page.keyboard.press('Control+z');
  await expect(checkbox).not.toBeChecked();
  await page.keyboard.press('Control+Shift+z');
  await expect(checkbox).toBeChecked();
  await checkbox.click();
  await page.keyboard.press('Control+z');
  await expect(checkbox).toBeChecked();
  await page.getByTestId('item-row').first().hover();
  const quantity = page.getByTestId('item-quantity-value').first();
  await page.getByTestId('item-quantity-increment').first().click();
  await page.keyboard.press('Control+z');
  await expect(quantity).toContainText('1');
  await page.keyboard.press('Control+y');
  await expect(quantity).toContainText('2');
});

test('desktop history controls share the menu row and mobile controls stay beside the menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const menu = await page.getByTestId('sidebar-toggle').boundingBox();
  const undo = await page.getByTestId('history-undo').boundingBox();
  const redo = await page.getByTestId('history-redo').boundingBox();
  const add = await page.getByTestId('sidebar-new-checklist').boundingBox();
  expect(Math.abs(menu.y + menu.height / 2 - (undo.y + undo.height / 2))).toBeLessThanOrEqual(1);
  expect(undo.x).toBeGreaterThanOrEqual(menu.x + menu.width);
  expect(redo.x).toBeGreaterThanOrEqual(undo.x + undo.width);
  expect(add.y).toBeGreaterThanOrEqual(menu.y + menu.height);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileMenu = await page.getByTestId('topbar-toggle').boundingBox();
  const mobileUndo = await page.getByTestId('history-undo').boundingBox();
  const mobileRedo = await page.getByTestId('history-redo').boundingBox();
  const mobileAdd = await page.getByTestId('topbar-new').boundingBox();
  expect(mobileUndo.x - (mobileMenu.x + mobileMenu.width)).toBeLessThanOrEqual(8);
  expect(mobileRedo.x + mobileRedo.width).toBeLessThan(mobileAdd.x);
});

test('collapsed desktop sidebar hides history controls while shortcuts still work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  const checkbox = page.getByTestId('item-checkbox').first();
  await checkbox.click();
  await expect(page.getByTestId('history-undo')).toBeEnabled();
  const group = page.locator('[data-sidebar-history-reveal]');
  await page.getByTestId('sidebar-toggle').click();
  await expect(group).toHaveAttribute('inert', '');
  await expect(group).toHaveCSS('opacity', '0');
  await page.keyboard.press('Control+z');
  await expect(checkbox).not.toBeChecked();
  await page.keyboard.press('Control+Shift+z');
  await expect(checkbox).toBeChecked();
  await page.getByTestId('sidebar-toggle').click();
  await expect(group).not.toHaveAttribute('inert', '');
  await page.getByTestId('history-undo').focus();
  await page.getByTestId('sidebar-toggle').evaluate((button) => button.click());
  await expect(page.getByTestId('sidebar-toggle')).toBeFocused();
});

test('sidebar heading and checklist names fade with New Checklist without horizontal motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.addInitScript(() => {
    const data = JSON.parse(localStorage.getItem('packingListApp'));
    data.checklists.push(
      { id: 'second', name: '新清單', order: 1 },
      { id: 'third', name: 'Travel', order: 2 }
    );
    localStorage.setItem('packingListApp', JSON.stringify(data));
  });
  await page.goto('/');
  await expect(page.getByTestId('sidebar-checklist-item')).toHaveCount(3);
  const samples = await page.evaluate(async () => {
    const toggle = document.querySelector('[data-testid="sidebar-toggle"]');
    const label = document.querySelector(
      '[data-testid="sidebar-new-checklist"] [data-sidebar-label]'
    );
    const heading = document.querySelector('[data-sidebar-heading]');
    const history = document.querySelector('[data-sidebar-history-reveal]');
    const names = [...document.querySelectorAll('[data-sidebar-checklist-label]')];
    const runs = [];
    for (let i = 0; i < 2; i++) {
      toggle.click();
      await Promise.resolve();
      const frames = [];
      const start = performance.now();
      while (performance.now() - start < 500) {
        await new Promise(requestAnimationFrame);
        frames.push({
          label: Number(getComputedStyle(label).opacity),
          heading: Number(getComputedStyle(heading).opacity),
          headingX: heading.getBoundingClientRect().x,
          history: Number(getComputedStyle(history).opacity),
          names: names.map((name) => Number(getComputedStyle(name).opacity)),
        });
      }
      runs.push(frames);
    }
    return runs;
  });
  for (const frames of samples) {
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(Math.abs(frame.label - frame.heading)).toBeLessThan(0.03);
      expect(Math.abs(frame.label - frame.history)).toBeLessThan(0.03);
      for (const opacity of frame.names) expect(Math.abs(frame.label - opacity)).toBeLessThan(0.03);
      expect(Math.abs(frame.headingX - frames[0].headingX)).toBeLessThan(1);
    }
  }
  expect(samples[0].at(-1).heading).toBe(0);
  expect(samples[1].at(-1).heading).toBe(1);
});

test('sidebar history respects reduced motion and rapid open-close', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page);
  await page.goto('/');
  const toggle = page.getByTestId('sidebar-toggle');
  const group = page.locator('[data-sidebar-history-reveal]');
  await toggle.click();
  await expect(group).toHaveAttribute('inert', '');
  await toggle.click();
  await expect(group).not.toHaveAttribute('inert', '');
  await toggle.click();
  await expect(group).toHaveAttribute('inert', '');
  await toggle.click();
  await expect(group).not.toHaveAttribute('inert', '');
});

test('history controls remain inert until their shared fade completes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page);
  await page.goto('/');
  await page.getByTestId('item-checkbox').first().click();
  const toggle = page.getByTestId('sidebar-toggle');
  const group = page.locator('[data-sidebar-history-reveal]');
  await toggle.click();
  await expect(group).toHaveCSS('opacity', '0');
  const style = await page.addStyleTag({
    content: '[data-sidebar-history-reveal] { transition-duration: 1s !important; }',
  });
  await toggle.click();
  await expect(group).toHaveAttribute('inert', '');
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('history-undo')).not.toBeFocused();
  await expect(group).not.toHaveAttribute('inert', '', { timeout: 3000 });
  await style.evaluate((element) => element.remove());
  await expect(page.getByTestId('history-undo')).toBeEnabled();
});
