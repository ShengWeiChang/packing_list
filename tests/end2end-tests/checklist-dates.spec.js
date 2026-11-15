// Test Cases 1–16: Date labels, confirmation, responsive layout and focus interactions.
import { expect, test } from '@playwright/test';

const checklists = [
  {
    id: 'date-checklist',
    name: 'Japan trip',
    startDate: '2025-11-26',
    endDate: '2026-01-05',
    order: 0,
  },
];

for (const locale of ['en', 'zh-TW']) {
  for (const width of [320, 390, 820, 1280]) {
    test(`edits labeled dates and confirms changes at ${width}px in ${locale}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        ({ language, initialChecklists }) => {
          localStorage.setItem('user-locale', language);
          localStorage.setItem(
            'packingListApp',
            JSON.stringify({
              checklists: initialChecklists,
              categories: [
                { id: 'date-category', checklistId: 'date-checklist', name: 'Packing', order: 0 },
              ],
              items: [],
            })
          );
          localStorage.setItem('packingListLastOpenedChecklistId', 'date-checklist');
        },
        { language: locale, initialChecklists: checklists }
      );
      await page.goto('/');
      const startLabel = locale === 'en' ? 'Start Date' : '開始日期';
      const endLabel = locale === 'en' ? 'End Date' : '結束日期';
      await expect(page.getByRole('button', { name: 'Nov 26, 2025 - Jan 5, 2026' })).toBeVisible();
      await expect(page.getByText(startLabel, { exact: true })).toHaveCount(0);
      await expect(page.getByText(endLabel, { exact: true })).toHaveCount(0);
      await page.evaluate(async () => {
        await new Promise(requestAnimationFrame);
        await Promise.all(
          document.getAnimations().map((animation) => animation.finished.catch(() => {}))
        );
      });
      const before = await page.getByTestId('checklist-name').boundingBox();
      const nameMetrics = await page.getByTestId('checklist-name').evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const style = getComputedStyle(element);
        return {
          lines: range.getClientRects().length,
          bounds: element.getBoundingClientRect().toJSON(),
          availableWidth: element.parentElement.getBoundingClientRect().width,
          font: style.font,
          viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        };
      });
      expect(nameMetrics.lines, JSON.stringify(nameMetrics)).toBe(1);
      const dateBefore = await page
        .getByRole('button', { name: 'Nov 26, 2025 - Jan 5, 2026' })
        .boundingBox();
      const contentBefore = await page.getByTestId('category-card').boundingBox();
      const trigger = page
        .getByRole('main')
        .getByTestId('overflow-trigger-checklist-date-checklist');
      const triggerBefore = await trigger.boundingBox();
      await page.getByTestId('checklist-name').click();
      const after = await page.getByTestId('checklist-name-input').boundingBox();
      const triggerAfter = await trigger.boundingBox();
      expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(triggerAfter.x - triggerBefore.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(triggerAfter.y - triggerBefore.y)).toBeLessThanOrEqual(1);
      await expect(trigger).toHaveAttribute('aria-label', locale === 'en' ? 'Save' : '儲存');
      const start = page.getByLabel(startLabel, { exact: true });
      const end = page.getByLabel(endLabel, { exact: true });
      const dateAfter = await start.boundingBox();
      const contentAfter = await page.getByTestId('category-card').boundingBox();
      const endBox = await end.boundingBox();
      const dateRows = endBox.y > dateAfter.y ? 2 : 1;
      expect(
        Math.abs(dateAfter.y - dateBefore.y),
        JSON.stringify({ nameMetrics, nameBefore: before, nameAfter: after, dateBefore, dateAfter })
      ).toBeLessThanOrEqual(8);
      expect(Math.abs(contentAfter.y - contentBefore.y)).toBeLessThanOrEqual(
        dateRows === 2 ? dateAfter.height + 10 : 10
      );
      await expect(start).toBeVisible();
      await expect(end).toBeVisible();
      await expect(page.locator(`label[for="checklist-date-checklist-start-date"]`)).toBeVisible();
      await expect(page.locator(`label[for="checklist-date-checklist-end-date"]`)).toBeVisible();
      await expect(page.locator(`label[for="checklist-date-checklist-start-date"]`)).toHaveText(
        locale === 'en' ? 'Start' : '開始'
      );
      await expect(page.locator(`label[for="checklist-date-checklist-end-date"]`)).toHaveText(
        locale === 'en' ? 'End' : '結束'
      );
      for (const label of [
        page.locator('label[for="checklist-date-checklist-start-date"]'),
        page.locator('label[for="checklist-date-checklist-end-date"]'),
      ]) {
        expect(await label.evaluate((element) => element.firstChild.nodeType)).toBe(3);
        expect(await label.evaluate((element) => element.firstChild.textContent.trim())).not.toBe(
          ''
        );
      }
      for (const input of [start, end]) {
        const box = await input.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width
      );
      await start.fill('2026-01-06');
      await start.press('Enter');
      await expect
        .poll(async () =>
          page.evaluate(
            () => JSON.parse(localStorage.getItem('packingListApp')).checklists[0].endDate
          )
        )
        .toBe('2026-01-06');
      await page.getByTestId('checklist-name').click();
      await page.getByLabel(endLabel, { exact: true }).fill('2026-01-08');
      await page.locator('main').click({ position: { x: 5, y: 5 } });
      await expect
        .poll(async () =>
          page.evaluate(
            () => JSON.parse(localStorage.getItem('packingListApp')).checklists[0].endDate
          )
        )
        .toBe('2026-01-08');
      await page.getByTestId('checklist-name').click();
      await page.getByTestId('checklist-name-input').fill('Updated trip');
      await trigger.click();
      await expect(page.getByTestId('checklist-name')).toHaveText('Updated trip');
      await expect(trigger).toHaveAttribute(
        'aria-label',
        locale === 'en' ? 'More options' : '更多選項'
      );
      await page.getByTestId('category-name').click();
      await page.getByTestId('category-name-input').fill('Updated category');
      const categoryTrigger = page.getByTestId('overflow-trigger-category-date-category');
      await expect(categoryTrigger).toHaveAttribute(
        'aria-label',
        locale === 'en' ? 'Save' : '儲存'
      );
      await categoryTrigger.click();
      await expect(page.getByTestId('category-name')).toHaveText('Updated category');
      await expect
        .poll(async () =>
          page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')).categories[0].name)
        )
        .toBe('Updated category');
      await page.getByTestId('checklist-name').click();
      await page.getByTestId('checklist-name-input').fill('Keyboard trip');
      await trigger.focus();
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('checklist-name')).toHaveText('Keyboard trip');
      await page.getByTestId('category-name').click();
      await page.getByTestId('category-name-input').fill('Keyboard category');
      await categoryTrigger.focus();
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('category-name')).toHaveText('Keyboard category');
    });
  }
}

test.describe('touch editing', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('saves checklist and category through their confirm controls', async ({ page }) => {
    await page.addInitScript(
      ({ initialChecklists }) => {
        localStorage.setItem('user-locale', 'en');
        localStorage.setItem(
          'packingListApp',
          JSON.stringify({
            checklists: initialChecklists,
            categories: [
              { id: 'date-category', checklistId: 'date-checklist', name: 'Packing', order: 0 },
            ],
            items: [],
          })
        );
        localStorage.setItem('packingListLastOpenedChecklistId', 'date-checklist');
      },
      { initialChecklists: checklists }
    );
    await page.goto('/');
    await page.getByTestId('checklist-name').tap();
    await page.getByTestId('checklist-name-input').fill('Touch trip');
    await page.getByRole('main').getByTestId('overflow-trigger-checklist-date-checklist').tap();
    await expect(page.getByTestId('checklist-name')).toHaveText('Touch trip');
    await page.getByTestId('category-name').tap();
    await page.getByTestId('category-name-input').fill('Touch category');
    await page.getByTestId('overflow-trigger-category-date-category').tap();
    await expect(page.getByTestId('category-name')).toHaveText('Touch category');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('packingListApp')));
    expect(stored.checklists[0].name).toBe('Touch trip');
    expect(stored.categories[0].name).toBe('Touch category');
  });
});

for (const width of [320, 820, 1280]) {
  for (const name of ['Short trip', 'W'.repeat(100)]) {
    test(`keeps ${name.length}-character name within the main viewport at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        ({ checklistName }) => {
          localStorage.setItem(
            'packingListApp',
            JSON.stringify({
              checklists: [
                {
                  id: 'long-name',
                  name: checklistName,
                  startDate: '2026-01-01',
                  endDate: '2026-01-01',
                  order: 0,
                },
              ],
              categories: [{ id: 'category', checklistId: 'long-name', name: 'Packing', order: 0 }],
              items: [],
            })
          );
          localStorage.setItem('packingListLastOpenedChecklistId', 'long-name');
        },
        { checklistName: name }
      );
      await page.goto('/');
      await page.evaluate(async () => {
        await new Promise(requestAnimationFrame);
        await Promise.all(
          document.getAnimations().map((animation) => animation.finished.catch(() => {}))
        );
      });
      const main = page.locator('main');
      const readName = page.getByTestId('checklist-name');
      const content = page.getByTestId('category-card');
      const before = await content.boundingBox();
      const nameBefore = await readName.boundingBox();
      const dateBefore = await page.getByRole('button', { name: 'Jan 1, 2026' }).boundingBox();
      const nameLines = await readName.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getClientRects().length;
      });
      await expect.poll(async () => main.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
      await readName.click();
      await expect(page.getByTestId('checklist-name-input')).toBeVisible();
      const after = await content.boundingBox();
      if (width === 320 && name.length === 100) {
        const nameAfter = await page.getByTestId('checklist-name-input').boundingBox();
        const dateAfter = await page.getByLabel('Start Date').boundingBox();
        expect(nameLines).toBeGreaterThan(1);
        expect(
          Math.abs(dateAfter.y - dateBefore.y - (nameAfter.height - nameBefore.height))
        ).toBeLessThanOrEqual(8);
      }
      if (name.length < 100 && width >= 820) {
        expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(10);
      }
      expect(await main.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
      expect(await main.evaluate((el) => el.scrollLeft)).toBe(0);
      const input = await page.getByTestId('checklist-name-input').boundingBox();
      expect(input.x).toBeGreaterThanOrEqual(0);
      expect(input.x + input.width).toBeLessThanOrEqual(width);
    });
  }
}

test('saves another category when its focus moves to a failed draft confirmation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [
          { id: 'trip', name: 'Trip', startDate: '2026-01-01', endDate: '2026-01-02', order: 0 },
        ],
        categories: [
          { id: 'alpha', checklistId: 'trip', name: 'Alpha', order: 0 },
          { id: 'beta', checklistId: 'trip', name: 'Beta', order: 1 },
        ],
        items: [],
      })
    );
    localStorage.setItem('packingListLastOpenedChecklistId', 'trip');
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListApp' && window.failPackingWrites) {
        throw new DOMException('Storage full', 'QuotaExceededError');
      }
      return originalSet.call(this, key, value);
    };
  });
  await page.goto('/');
  const alpha = page.locator('[data-category-id="alpha"]');
  const beta = page.locator('[data-category-id="beta"]');
  await alpha.getByTestId('category-name').click();
  await alpha.getByTestId('category-name-input').fill('Alpha draft');
  await page.evaluate(() => {
    window.failPackingWrites = true;
  });
  await alpha.getByTestId('category-name-input').press('Enter');
  await expect(alpha.getByRole('alert')).toBeVisible();
  await page.evaluate(() => {
    window.failPackingWrites = false;
  });
  await beta.getByTestId('category-name').click();
  await beta.getByTestId('category-name-input').fill('Beta draft');
  await alpha.getByTestId('overflow-trigger-category-alpha').click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('packingListApp')).categories.find(
            ({ id }) => id === 'beta'
          ).name
      )
    )
    .toBe('Beta draft');
  await expect(beta.getByTestId('category-name')).toHaveText('Beta draft');
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('packingListApp')).categories.find(
            ({ id }) => id === 'alpha'
          ).name
      )
    )
    .toBe('Alpha draft');
});
