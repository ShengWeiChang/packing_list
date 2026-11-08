/* Hover feedback, drag/edit handoff, collapsed drops and inline action motion. */
import { expect, test } from '@playwright/test';

/** @param {import('@playwright/test').Page} page - Browser page. */
async function openFixture(page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('packingListApp')) return;
    localStorage.setItem('packingListLastOpenedChecklistId', 'feedback');
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [{ id: 'feedback', name: 'Feedback', order: 0 }],
        categories: ['a', 'b'].map((id, order) => ({
          id,
          name: `Category ${id}`,
          checklistId: 'feedback',
          order,
        })),
        items: [3, 2].flatMap((count, category) =>
          Array.from({ length: count }, (_, order) => ({
            id: `${category ? 'b' : 'a'}${order}`,
            name: `Item ${category ? 'b' : 'a'}${order}`,
            categoryId: category ? 'b' : 'a',
            checklistId: 'feedback',
            order,
            quantity: 1,
            isPacked: category === 1,
            isPending: false,
          }))
        ),
      })
    );
  });
  await page.goto('/');
  await expect(page.getByTestId('category-card')).toHaveCount(2);
}

/** @param {import('@playwright/test').Page} page - Browser page. */
async function settleLayout(page) {
  await page.evaluate(async () => {
    for (let frame = 0; frame < 3; frame++) await new Promise(requestAnimationFrame);
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {}))
    );
  });
}

/**
 * Record the row and its next sibling through an opening or closing action.
 * @returns {Promise<object[]>} Rendered positions throughout the transition.
 * @param {import('@playwright/test').Page} page - Browser page.
 */
async function toggleAndMeasure(page) {
  return page.evaluate(async () => {
    const rows = [
      ...document.querySelectorAll(
        '[data-category-id="a"][data-testid="category-card"] [data-testid="item-row"]'
      ),
    ];
    const row = rows.find((element) => element.dataset.itemId === 'a0');
    const next = rows[rows.indexOf(row) + 1];
    const values = [];
    row.querySelector('[data-testid="overflow-trigger-item-a0"]').click();
    await new Promise((resolve) => {
      const sample = () => {
        const a = row.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        values.push({ height: a.height, y: b.y, gap: b.y - a.bottom });
        if (values.length < 40) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return values;
  });
}

/**
 * Measure checkbox and rendered text starts relative to their own category.
 * @param {import('@playwright/test').Locator} row - Real item or insertion preview.
 * @returns {Promise<{ checkbox: number, text: number }>} Horizontal positions.
 */
async function itemAlignment(row) {
  return row.evaluate((element) => {
    const origin = element.closest('[data-testid="category-card"]').getBoundingClientRect().x;
    const checkbox = element.querySelector('input[type="checkbox"]');
    const name = element.querySelector(
      '[data-testid="item-name"], [data-testid="collapsed-preview-name"]'
    );
    const range = document.createRange();
    range.selectNodeContents(name);
    return {
      checkbox: checkbox.getBoundingClientRect().x - origin,
      text: range.getBoundingClientRect().x - origin,
    };
  });
}

const scenarios = [
  { name: 'desktop', viewport: { width: 1280, height: 900 }, hasTouch: false, isMobile: false },
  { name: 'tablet', viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true },
  { name: 'phone', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
];

// Test Cases 1-6: Feedback and collapsed-category drops on each input/layout combination.
for (const scenario of scenarios) {
  test.describe(scenario.name, () => {
    test.use({
      viewport: scenario.viewport,
      hasTouch: scenario.hasTouch,
      isMobile: scenario.isMobile,
    });
    test('keeps normal and completed feedback consistent and animates inline actions', async ({
      page,
      context,
    }) => {
      await openFixture(page);
      const card = page.locator('[data-testid="category-card"][data-category-id="a"]');
      const row = card.locator('[data-testid="item-row"][data-item-id="a0"]');
      for (const complete of [false, true]) {
        if (complete) await card.getByTestId('category-checkbox').click();
        await expect(card).toHaveAttribute('data-completed', String(complete));
        if (!scenario.hasTouch) {
          const color = complete ? 'rgb(211, 227, 219)' : 'rgb(229, 231, 235)';
          for (const control of [
            card.getByTestId('category-name'),
            card.getByTestId('category-collapse-toggle'),
            card.getByTestId('overflow-trigger-category-a'),
            row.getByTestId('item-name'),
            row.getByTestId('overflow-trigger-item-a0'),
          ]) {
            await control.hover();
            await expect(control).toHaveCSS('background-color', color);
          }
        } else {
          const trigger = row.getByTestId('overflow-trigger-item-a0');
          await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
          const initial = (await row.boundingBox()).height;
          const frames = await toggleAndMeasure(page);
          expect(frames.at(-1).height - initial).toBeGreaterThan(35);
          expect(
            frames.filter(
              (frame) => frame.height > initial + 2 && frame.height < frames.at(-1).height - 2
            ).length
          ).toBeGreaterThan(2);
          expect(
            Math.max(...frames.map((frame) => frame.gap)) -
              Math.min(...frames.map((frame) => frame.gap))
          ).toBeLessThan(2);
          await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
          await expect(row).toHaveCSS(
            'background-color',
            complete ? 'rgb(227, 242, 232)' : 'rgb(243, 244, 246)'
          );
          const closing = await toggleAndMeasure(page);
          expect(closing[0].height - closing.at(-1).height).toBeGreaterThan(35);
          expect(
            Math.max(...closing.map((frame) => frame.gap)) -
              Math.min(...closing.map((frame) => frame.gap))
          ).toBeLessThan(2);
          await expect(row.getByTestId('item-inline-actions')).toHaveCount(0);
        }
        await settleLayout(page);
        const reference = await itemAlignment(
          card.locator('[data-testid="item-row"][data-item-id="a1"]')
        );
        const nameBox = await row.getByTestId('item-name').boundingBox();
        const from = { x: nameBox.x + nameBox.width / 3, y: nameBox.y + nameBox.height / 2 };
        const client = scenario.hasTouch ? await context.newCDPSession(page) : null;
        if (client) {
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [from],
          });
          await page.waitForTimeout(280);
          for (let step = 1; step <= 8; step++) {
            await client.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [{ x: from.x + (12 * step) / 8, y: from.y + (64 * step) / 8 }],
            });
            await page.evaluate(() => new Promise(requestAnimationFrame));
          }
        } else {
          await page.mouse.move(from.x, from.y);
          await page.mouse.down();
          await page.mouse.move(from.x + 12, from.y + 12, { steps: 4 });
        }
        const ghost = card.locator('.ghost-item');
        await expect(ghost).toBeVisible();
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        );
        await settleLayout(page);
        const actual = await itemAlignment(ghost);
        expect(Math.abs(actual.checkbox - reference.checkbox)).toBeLessThan(1);
        expect(Math.abs(actual.text - reference.text)).toBeLessThan(1);
        await expect(ghost).toHaveCSS('outline-style', 'dashed');
        if (client)
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        else await page.mouse.up();
        await expect(card.locator('.ghost-item')).toHaveCount(0);
      }
    });

    test('accepts items into a collapsed category and retains counts and order', async ({
      page,
      context,
    }) => {
      await openFixture(page);
      const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
      await settleLayout(page);
      const referenceAlignment = await itemAlignment(target.getByTestId('item-row').first());
      await target.getByTestId('category-collapse-toggle').click();
      const client = scenario.hasTouch ? await context.newCDPSession(page) : null;
      for (const [index, id] of ['a0', 'a1'].entries()) {
        await settleLayout(page);
        const source = page
          .locator(`[data-testid="item-row"][data-item-id="${id}"]`)
          .getByTestId('item-name');
        const a = await source.boundingBox();
        const b = await target.boundingBox();
        const from = { x: a.x + a.width / 3, y: a.y + a.height / 2 };
        const to = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        if (client) {
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [from],
          });
          await page.waitForTimeout(280);
        } else {
          await page.mouse.move(from.x, from.y);
          await page.mouse.down();
        }
        for (let step = 1; step <= 30; step++) {
          const point = {
            x: from.x + ((to.x - from.x) * step) / 30,
            y: from.y + ((to.y - from.y) * step) / 30,
          };
          if (client)
            await client.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [point],
            });
          else await page.mouse.move(point.x, point.y);
          await page.evaluate(() => new Promise(requestAnimationFrame));
        }
        await expect(target.getByTestId('collapsed-category-drop')).toBeVisible();
        const preview = target.getByTestId('collapsed-drop-preview');
        await expect(preview).toBeVisible();
        await expect(preview).toContainText(`Item ${id}`);
        await expect
          .poll(async () => (await target.boundingBox()).height - b.height)
          .toBeGreaterThan(30);
        const previewBox = await preview.boundingBox();
        const progressBox = await target.getByRole('progressbar').boundingBox();
        expect(previewBox.y).toBeGreaterThanOrEqual(progressBox.y + progressBox.height);
        expect(previewBox.y + previewBox.height).toBeLessThanOrEqual(
          (await target.boundingBox()).y + (await target.boundingBox()).height
        );
        await expect(target.locator('.collapsed-item-ghost')).toBeHidden();
        const actualAlignment = await itemAlignment(preview);
        expect(Math.abs(actualAlignment.checkbox - referenceAlignment.checkbox)).toBeLessThan(1);
        expect(Math.abs(actualAlignment.text - referenceAlignment.text)).toBeLessThan(1);
        await expect(preview).toHaveCSS('outline-style', 'dashed');
        await expect(target.getByTestId('collapsed-category-drop')).toHaveCSS(
          'outline-style',
          'none'
        );
        await expect(target).toHaveCSS('outline-style', 'none');
        if (index === 0)
          await page.screenshot({
            path: test.info().outputPath(`collapsed-preview-${scenario.name}.png`),
          });
        const openHeight = (await target.boundingBox()).height;
        await page.evaluate(() => {
          window.collapsedCloseFrames = [];
          const card = document.querySelector(
            '[data-testid="category-card"][data-category-id="b"]'
          );
          const sample = () => {
            window.collapsedCloseFrames.push(card.getBoundingClientRect().height);
            if (window.collapsedCloseFrames.length < 40) requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        if (client)
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        else await page.mouse.up();
        await expect(target).toHaveAttribute('data-collapsed', 'true');
        await expect(target.getByRole('progressbar')).toHaveAttribute(
          'aria-label',
          `2 / ${index + 3}`
        );
        await expect
          .poll(() =>
            page.evaluate((itemId) => {
              const item = JSON.parse(localStorage.getItem('packingListApp')).items.find(
                (entry) => entry.id === itemId
              );
              return { categoryId: item.categoryId, order: item.order, isPacked: item.isPacked };
            }, id)
          )
          .toEqual({ categoryId: 'b', order: index + 2, isPacked: false });
        await expect(preview).toHaveCount(0);
        await expect
          .poll(async () => Math.abs((await target.boundingBox()).height - b.height))
          .toBeLessThan(2);
        await expect.poll(() => page.evaluate(() => window.collapsedCloseFrames.length)).toBe(40);
        const closing = await page.evaluate(() => window.collapsedCloseFrames);
        expect(
          closing.filter((height) => height > b.height + 2 && height < openHeight - 2).length
        ).toBeGreaterThan(2);
      }
      // Leaving the receiver retracts the preview while the drag is still held.
      await settleLayout(page);
      const remaining = await page
        .locator('[data-testid="item-row"][data-item-id="a2"]')
        .getByTestId('item-name')
        .boundingBox();
      const targetBeforeCancel = await target.boundingBox();
      const from = { x: remaining.x + remaining.width / 3, y: remaining.y + remaining.height / 2 };
      const to = {
        x: targetBeforeCancel.x + targetBeforeCancel.width / 2,
        y: targetBeforeCancel.y + targetBeforeCancel.height / 2,
      };
      if (client) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
        await page.waitForTimeout(280);
      } else {
        await page.mouse.move(from.x, from.y);
        await page.mouse.down();
      }
      for (const [start, end] of [
        [from, to],
        [to, from],
      ]) {
        for (let step = 1; step <= 30; step++) {
          const point = {
            x: start.x + ((end.x - start.x) * step) / 30,
            y: start.y + ((end.y - start.y) * step) / 30,
          };
          if (client)
            await client.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [point],
            });
          else await page.mouse.move(point.x, point.y);
          await page.evaluate(() => new Promise(requestAnimationFrame));
        }
        if (end === to) await expect(target.getByTestId('collapsed-drop-preview')).toBeVisible();
      }
      await expect(target.getByTestId('collapsed-drop-preview')).toHaveCount(0);
      if (client)
        await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      else await page.mouse.up();
      await expect(page.locator('.sortable-fallback')).toHaveCount(0);
      await expect(target.getByRole('progressbar')).toHaveAttribute('aria-label', '2 / 4');
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem('packingListApp')).items.find(
                (item) => item.id === 'a2'
              ).categoryId
          )
        )
        .toBe('a');
      await page.reload();
      await expect(target.getByTestId('item-name')).toHaveText([
        'Item b0',
        'Item b1',
        'Item a0',
        'Item a1',
      ]);
    });
  });
}

// Test Case 7: Dragging a different item finishes unchanged and changed edits.
test('ends an old name edit when dragging a different item', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFixture(page);
  const edited = page.locator('[data-testid="item-row"][data-item-id="a0"]');
  for (const name of [null, 'Renamed before drag']) {
    await edited.getByTestId('item-name').click();
    const input = edited.getByTestId('item-edit-input');
    await expect(input).toBeFocused();
    if (name) await input.fill(name);
    const source = await page
      .locator('[data-testid="item-row"][data-item-id="a1"]')
      .getByTestId('item-name')
      .boundingBox();
    const from = { x: source.x + source.width / 3, y: source.y + source.height / 2 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 12, from.y + 12, { steps: 4 });
    await expect(page.locator('.ghost-item')).toHaveCount(1);
    await expect(input).toHaveCount(0);
    await page.mouse.up();
    await expect(edited.getByTestId('item-name')).toHaveText(name ?? 'Item a0');
    if (name)
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem('packingListApp')).items.find(
                (item) => item.id === 'a0'
              ).name
          )
        )
        .toBe(name);
  }
});

// Test Case 8: Reduced motion keeps inline actions immediately usable and closing controls inert.
test('honors reduced motion for inline action expansion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page);
  const trigger = page.getByTestId('overflow-trigger-item-a0');
  await trigger.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await trigger.click();
  const actions = page.getByTestId('item-inline-actions');
  await expect(actions).toBeVisible();
  await expect(actions.locator('../..')).toHaveCSS('transition-duration', '0s');
  await expect(actions.getByTestId('item-action-copy')).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(actions).toHaveCount(0);
});
