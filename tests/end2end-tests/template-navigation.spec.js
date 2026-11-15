// Test Cases 1–23: Template draft navigation, persistence, focus and responsive toolbar.
import { expect, test } from '@playwright/test';

const data = {
  checklists: [
    { id: 'a', name: 'Trip A', startDate: '2026-01-01', endDate: '2026-01-02', order: 0 },
    { id: 'b', name: 'Trip B', startDate: '2026-02-01', endDate: '2026-02-02', order: 1 },
  ],
  categories: [],
  items: [],
};
const templates = [
  {
    id: 'tpl-a',
    name: 'Weekend',
    order: 0,
    categories: Array.from({ length: 14 }, (_, index) => ({
      id: `category-${index}`,
      name: `Category ${index}`,
      order: index,
    })),
    items: [{ name: 'Hat', quantity: 1, categoryId: 'category-0', order: 0 }],
  },
  { id: 'tpl-b', name: 'Long trip', order: 1, categories: [], items: [] },
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(
    ({ initialData, initialTemplates }) => {
      localStorage.setItem('user-locale', 'en');
      localStorage.setItem('packingListApp', JSON.stringify(initialData));
      localStorage.setItem('packingListLastOpenedChecklistId', 'a');
      localStorage.setItem('packingListTemplates', JSON.stringify(initialTemplates));
      const originalGet = Storage.prototype.getItem;
      const original = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (key === 'packingListTemplates' && window.failTemplateReads)
          throw new DOMException('Denied', 'SecurityError');
        return originalGet.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (key === 'packingListTemplates' && window.failTemplateWrites)
          throw new DOMException('Full', 'QuotaExceededError');
        const result = original.call(this, key, value);
        if (key === 'packingListTemplates' && window.failTemplateRefresh)
          window.failTemplateReads = true;
        return result;
      };
    },
    { initialData: data, initialTemplates: templates }
  );
  await page.goto('/');
});

/** Open the first template editor.
 * @param {import('@playwright/test').Page} page - Browser page.
 */
async function openTemplate(page) {
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-tpl-a').click();
  await expect(page.getByText('Editing template: Weekend')).toBeVisible();
}
/** Select a checklist from the sidebar.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {string} id - Checklist ID.
 */
async function selectTrip(page, id) {
  await page
    .getByTestId('sidebar-checklist-item')
    .filter({ hasText: id === 'a' ? 'Trip A' : 'Trip B' })
    .click();
}
/** Type a new template name without manually committing it.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {string} name - Draft name.
 */
async function editName(page, name) {
  await page.getByTestId('checklist-name').click();
  await page.getByTestId('checklist-name-input').fill(name);
}

test('switches a clean template to the selected checklist including the current one', async ({
  page,
}) => {
  await openTemplate(page);
  await selectTrip(page, 'a');
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip A');
  await expect(page.getByTestId('unsaved-template-dialog')).toHaveCount(0);
});

test('keeps or discards the draft when switching checklists', async ({ page }) => {
  await openTemplate(page);
  await editName(page, 'Draft');
  await selectTrip(page, 'b');
  await expect(page.getByTestId('unsaved-template-dialog')).toBeVisible();
  await page.getByTestId('template-unsaved-stay').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Draft');
  await selectTrip(page, 'b');
  await page.getByTestId('template-unsaved-discard').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('Weekend');
});

test('saves the last inline edit before navigating, and retains it on failure', async ({
  page,
}) => {
  await openTemplate(page);
  await editName(page, 'Saved draft');
  await selectTrip(page, 'b');
  await page.evaluate(() => {
    window.failTemplateWrites = true;
  });
  await page.getByTestId('template-unsaved-save').click();
  await expect(page.getByRole('alert').filter({ hasText: 'storage is full' })).toBeVisible();
  await expect(page.getByTestId('checklist-name')).toHaveText('Saved draft');
  await page.evaluate(() => {
    window.failTemplateWrites = false;
  });
  await selectTrip(page, 'b');
  await page.getByTestId('template-unsaved-save').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('Saved draft');
});

test('warns before replacing a dirty template with another', async ({ page }) => {
  await openTemplate(page);
  await editName(page, 'Draft');
  await page.getByTestId('sidebar-templates-button').click();
  await page.getByTestId('sidebar-template-use-tpl-b').click();
  await expect(page.getByTestId('unsaved-template-dialog')).toBeVisible();
  await page.getByTestId('template-unsaved-discard').click();
  await expect(page.getByText('Editing template: Long trip')).toBeVisible();
});

for (const width of [390, 820, 1280]) {
  test(`keeps template toolbar visible when scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    if (width < 1000)
      await page.getByTestId(width < 600 ? 'topbar-toggle' : 'sidebar-toggle').click();
    await openTemplate(page);
    const toolbar = page.getByTestId('template-editor-toolbar');
    await expect(toolbar).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    const rect = await toolbar.boundingBox();
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeLessThanOrEqual(2);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(width);
    await expect(page.getByTestId('template-editor-save')).toBeVisible();
    await expect(page.getByTestId('template-editor-delete')).toBeVisible();
  });
}

test('a reverted name navigates without a discard prompt', async ({ page }) => {
  await openTemplate(page);
  await editName(page, 'Temporary');
  await page.getByTestId('checklist-name-input').press('Enter');
  await editName(page, 'Weekend');
  await selectTrip(page, 'b');
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
  await expect(page.getByTestId('unsaved-template-dialog')).toHaveCount(0);
});

test('retains the draft on cross-tab conflict when saving before navigation', async ({
  page,
  context,
}) => {
  await openTemplate(page);
  await editName(page, 'Local draft');
  await page.getByTestId('checklist-name-input').press('Enter');
  const other = await context.newPage();
  await other.goto('/');
  await openTemplate(other);
  await editName(other, 'Remote version');
  await other.getByTestId('template-editor-save').click();
  await expect(other.getByTestId('template-editor-save')).toHaveCount(0);
  await selectTrip(page, 'b');
  await page.getByTestId('template-unsaved-save').click();
  await expect(page.getByRole('alert').filter({ hasText: 'changed in another tab' })).toBeVisible();
  await expect(page.getByTestId('checklist-name')).toHaveText('Local draft');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('Remote version');
  await other.close();
});

test('Escape keeps the draft and restores the navigation focus', async ({ page }) => {
  await openTemplate(page);
  await editName(page, 'Draft');
  await selectTrip(page, 'b');
  await expect(page.getByTestId('template-unsaved-stay')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('unsaved-template-dialog')).toHaveCount(0);
  await expect(page.getByTestId('checklist-name')).toHaveText('Draft');
  await expect(
    page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Trip B' })
  ).toBeFocused();
});

test('mobile drawer prompts before switching and closes after discard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('topbar-toggle').click();
  await openTemplate(page);
  await editName(page, 'Mobile draft');
  await page.getByTestId('topbar-toggle').click();
  await selectTrip(page, 'b');
  await expect(page.getByTestId('unsaved-template-dialog')).toBeVisible();
  await page.getByTestId('template-unsaved-discard').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
  await expect(page.getByTestId('overlay-sidebar')).toHaveCount(0);
});

test('keeps the requested destination while template save waits for the lock', async ({
  page,
  context,
}) => {
  await openTemplate(page);
  await editName(page, 'Queued draft');
  const other = await context.newPage();
  await other.goto('/');
  await other.evaluate(() => {
    window.lockReady = false;
    void navigator.locks.request('packing-list-storage-write', async () => {
      window.lockReady = true;
      await new Promise((resolve) => {
        window.releaseLock = resolve;
      });
    });
  });
  await expect.poll(() => other.evaluate(() => window.lockReady)).toBe(true);
  await selectTrip(page, 'b');
  await page.getByTestId('template-unsaved-save').click();
  await expect(page.getByTestId('template-editor-save')).toBeDisabled();
  await selectTrip(page, 'a');
  await expect(page.getByText('Editing template: Weekend')).toBeVisible();
  await other.evaluate(() => window.releaseLock());
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
  await other.close();
});

test('keeps the toolbar usable in a short narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 200 });
  await page.getByTestId('topbar-toggle').click();
  await openTemplate(page);
  await page.evaluate(() => window.scrollTo(0, 700));
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  const toolbar = await page.getByTestId('template-editor-toolbar').boundingBox();
  expect(toolbar.y).toBeGreaterThanOrEqual(0);
  expect(toolbar.y + toolbar.height).toBeLessThan(200);
  expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(320);
  for (const id of ['template-editor-save', 'template-editor-delete']) {
    const button = await page.getByTestId(id).boundingBox();
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(button.x).toBeGreaterThanOrEqual(0);
    expect(button.x + button.width).toBeLessThanOrEqual(320);
  }
});

for (const field of ['category', 'item']) {
  test(`saves an active ${field} draft before switching`, async ({ page }) => {
    await openTemplate(page);
    const category = page.locator('[data-category-id="category-0"]').first();
    const label =
      field === 'category'
        ? category.getByTestId('category-name')
        : category.getByTestId('item-name');
    const input =
      field === 'category'
        ? category.getByTestId('category-name-input')
        : category.getByTestId('item-edit-input');
    await label.click();
    await input.fill(field === 'category' ? 'Documents' : 'Passport');
    await selectTrip(page, 'b');
    await expect(page.getByTestId('unsaved-template-dialog')).toBeVisible();
    await page.getByTestId('template-unsaved-save').click();
    await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem('packingListTemplates'))[0]
    );
    expect(field === 'category' ? saved.categories[0].name : saved.items[0].name).toBe(
      field === 'category' ? 'Documents' : 'Passport'
    );
  });
}

test('resumes the same navigation after an inline IME composition finishes', async ({ page }) => {
  await openTemplate(page);
  await page.getByTestId('checklist-name').click();
  const input = page.getByTestId('checklist-name-input');
  await input.dispatchEvent('compositionstart');
  await input.evaluate((element) => {
    element.value = '旅行清單';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await selectTrip(page, 'b');
  await expect(page.getByTestId('unsaved-template-dialog')).toHaveCount(0);
  await input.dispatchEvent('compositionend');
  await expect(page.getByTestId('unsaved-template-dialog')).toBeVisible();
  await page.getByTestId('template-unsaved-save').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('旅行清單');
});

test('keeps a dirty draft and explains when the destination disappears', async ({
  page,
  context,
}) => {
  await openTemplate(page);
  await editName(page, 'Draft');
  await selectTrip(page, 'b');
  const other = await context.newPage();
  await other.goto('/');
  await other.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('packingListApp'));
    stored.checklists = stored.checklists.filter(({ id }) => id !== 'b');
    localStorage.setItem('packingListApp', JSON.stringify(stored));
  });
  await expect
    .poll(async () =>
      page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Trip B' }).count()
    )
    .toBe(0);
  await page.getByTestId('template-unsaved-discard').click();
  await expect(page.getByTestId('template-navigation-missing')).toBeVisible();
  await expect(page.getByTestId('checklist-name')).toHaveText('Draft');
  await other.close();
});

test('keeps the short-screen confirmation scrollable and traps focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 600 });
  await page.getByTestId('topbar-toggle').click();
  await openTemplate(page);
  await editName(page, 'Draft');
  await page.getByTestId('topbar-toggle').click();
  await selectTrip(page, 'b');
  await page.setViewportSize({ width: 320, height: 200 });
  const dialog = page.getByTestId('unsaved-template-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('template-unsaved-stay')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('template-unsaved-save')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('template-unsaved-stay')).toBeFocused();
  await expect(page.getByTestId('overlay-sidebar')).toHaveAttribute('inert', '');
  for (const id of ['template-unsaved-stay', 'template-unsaved-save', 'template-unsaved-discard']) {
    const button = page.getByTestId(id);
    await button.scrollIntoViewIfNeeded();
    const rect = await button.boundingBox();
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.y + rect.height).toBeLessThanOrEqual(200);
  }
  await page.getByTestId('template-unsaved-discard').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
});

test('navigates after a committed save even if the template refresh fails', async ({ page }) => {
  await openTemplate(page);
  await editName(page, 'Saved before read failure');
  await selectTrip(page, 'b');
  await page.evaluate(() => {
    window.failTemplateRefresh = true;
  });
  await page.getByTestId('template-unsaved-save').click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Trip B');
  await expect(page.getByRole('status').filter({ hasText: 'Your change was saved' })).toBeVisible();
  await page.evaluate(() => {
    window.failTemplateReads = false;
    window.failTemplateRefresh = false;
  });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('Saved before read failure');
});

test('saves the template once before creating a checklist', async ({ page }) => {
  await openTemplate(page);
  await editName(page, 'Saved before creation');
  await page.getByTestId('sidebar-new-checklist').click();
  await page.getByTestId('template-unsaved-save').click();
  await expect(page.getByTestId('new-checklist-dialog')).toBeVisible();
  await page.getByTestId('new-checklist-option-empty').click();
  await expect(page.getByTestId('checklist-name-input')).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')).checklists.length)
    )
    .toBe(3);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('Saved before creation');
});

test('discards the template once before copying a checklist', async ({ page }) => {
  await openTemplate(page);
  await editName(page, 'Discard before copy');
  const row = page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Trip B' });
  await row.hover();
  await page.getByTestId('overflow-trigger-checklist-b').click();
  await page.getByTestId('overflow-action-copy-checklist-b').click();
  await expect(page.getByTestId('unsaved-template-dialog')).toBeVisible();
  await page.getByTestId('template-unsaved-discard').click();
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')).checklists.length)
    )
    .toBe(3);
  await expect(page.getByTestId('checklist-name')).toContainText('Trip B');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('packingListTemplates'))[0].name)
  ).toBe('Weekend');
});

for (const locale of ['en', 'zh-TW']) {
  test(`keeps long template toolbar and focused content usable after rotation in ${locale}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    const longName = 'Long template name '.repeat(5).trim();
    const longTemplates = [{ ...templates[0], name: longName }];
    await page.addInitScript(
      ({ initialData, initialTemplates, language }) => {
        localStorage.setItem('user-locale', language);
        localStorage.setItem('packingListApp', JSON.stringify(initialData));
        localStorage.setItem('packingListLastOpenedChecklistId', 'a');
        localStorage.setItem('packingListTemplates', JSON.stringify(initialTemplates));
      },
      { initialData: data, initialTemplates: longTemplates, language: locale }
    );
    await page.goto('/');
    await page.getByTestId('topbar-toggle').tap();
    await page.getByTestId('sidebar-templates-button').tap();
    await page.getByTestId('sidebar-template-use-tpl-a').tap();
    const toolbar = page.getByTestId('template-editor-toolbar');
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
      const rect = await toolbar.boundingBox();
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeLessThanOrEqual(2);
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
      await expect(page.getByTestId('template-editor-save')).toBeVisible();
      const lastCategory = page.getByTestId('category-name').last();
      await lastCategory.tap();
      const editor = page.getByTestId('category-name-input');
      await expect(editor).toBeFocused();
      const editorRect = await editor.boundingBox();
      const toolbarRect = await toolbar.boundingBox();
      expect(editorRect.y).toBeGreaterThanOrEqual(toolbarRect.y + toolbarRect.height);
      await editor.press('Enter');
    }
    await context.close();
  });
}
