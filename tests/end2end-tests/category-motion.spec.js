/* Category layout motion while collapsing and before a drag is released. */
import { expect, test } from '@playwright/test';

const runtimeErrors = new WeakMap();
test.beforeEach(({ page }) => {
  const errors = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});

/** @param {import('@playwright/test').Page} page - Browser page. */
async function openMotionFixture(page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('packingListApp')) return;
    localStorage.setItem('packingListLastOpenedChecklistId', 'motion');
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: [{ id: 'motion', name: 'Motion', order: 0 }],
        categories: ['a', 'b', 'c', 'd', 'e', 'f'].map((id, order) => ({
          id,
          name: `Category ${id}`,
          checklistId: 'motion',
          order,
        })),
        items: [12, 0, 0, 0, 0, 0].flatMap((count, index) =>
          Array.from({ length: count }, (_, order) => ({
            id: `${index}-${order}`,
            name: `Item ${order}`,
            quantity: 1,
            categoryId: ['a', 'b', 'c', 'd', 'e', 'f'][index],
            checklistId: 'motion',
            isPacked: false,
            isPending: false,
            order,
          }))
        ),
      })
    );
  });
  await page.goto('/');
  await expect(page.getByTestId('category-card')).toHaveCount(6);
}

/**
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {boolean} [duringGesture] - Keep recording through the complete input sequence.
 */
async function recordMotion(page, duringGesture = false) {
  await page.evaluate((gesture) => {
    window.motionFrames = [];
    window.stopMotionRecording = false;
    const sample = () => {
      window.motionFrames.push(
        [...document.querySelectorAll('.categories-masonry > .category-item')].map((element) => {
          const box = element.getBoundingClientRect();
          return {
            id: element.querySelector('[data-category-id]').dataset.categoryId,
            x: box.x,
            y: box.y,
            height: box.height,
          };
        })
      );
      if (!window.stopMotionRecording && window.motionFrames.length < (gesture ? 600 : 70))
        requestAnimationFrame(sample);
    };
    sample();
  }, duringGesture);
}

/**
 * A displaced sibling must visit intermediate horizontal positions rather than teleport.
 * @param {object[][]} frames - Consecutive rendered frame positions.
 * @param {string} dragged - Excluded source category.
 */
function expectCrossColumnMotion(frames, dragged) {
  const first = frames[0];
  const last = frames.at(-1);
  const crossed = first.filter(
    (before) =>
      before.id !== dragged && Math.abs(last.find((x) => x.id === before.id).x - before.x) > 80
  );
  expect(crossed.length).toBeGreaterThan(0);
  for (const before of crossed) {
    const after = last.find((x) => x.id === before.id);
    const intermediate = frames
      .map((frame) => frame.find((x) => x.id === before.id))
      .filter((point) => Math.abs(point.x - before.x) > 4 && Math.abs(point.x - after.x) > 4);
    expect(
      intermediate.length,
      `${before.id} must move through intermediate column positions`
    ).toBeGreaterThan(1);
  }
}

const scenarios = [
  { name: 'desktop', viewport: { width: 1280, height: 900 }, hasTouch: false, isMobile: false },
  { name: 'tablet', viewport: { width: 1024, height: 1000 }, hasTouch: true, isMobile: true },
  { name: 'phone', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
];

/** @param {object[][]} frames - Consecutive rendered positions. */
function expectVerticalMotion(frames) {
  const start = frames[0].find((point) => point.id === 'b');
  const finish = frames.at(-1).find((point) => point.id === 'b');
  expect(Math.abs(finish.y - start.y)).toBeGreaterThan(80);
  expect(
    frames.filter((frame) => {
      const point = frame.find((entry) => entry.id === 'b');
      return Math.abs(point.y - start.y) > 4 && Math.abs(point.y - finish.y) > 4;
    }).length
  ).toBeGreaterThan(1);
}

/**
 * Check whichever layout axis the balanced columns actually displaced.
 * @param {object[][]} frames - Rendered positions.
 */
function expectSiblingMotion(frames) {
  const first = frames[0];
  const last = frames.at(-1);
  const moved = first.filter((before) => {
    const after = last.find((point) => point.id === before.id);
    return before.id !== 'a' && Math.hypot(after.x - before.x, after.y - before.y) > 80;
  });
  expect(moved.length).toBeGreaterThan(0);
  for (const before of moved) {
    const after = last.find((point) => point.id === before.id);
    const axis = Math.abs(after.x - before.x) > Math.abs(after.y - before.y) ? 'x' : 'y';
    expect(
      frames.filter((frame) => {
        const point = frame.find((entry) => entry.id === before.id);
        return Math.abs(point[axis] - before[axis]) > 4 && Math.abs(point[axis] - after[axis]) > 4;
      }).length
    ).toBeGreaterThan(1);
  }
}

// Test Cases 1-6: Collapse reflow and drag-over motion on desktop, tablet and phone.
for (const scenario of scenarios) {
  test.describe(scenario.name, () => {
    test.use({
      viewport: scenario.viewport,
      hasTouch: scenario.hasTouch,
      isMobile: scenario.isMobile,
    });
    test('animates category reflow when a tall category collapses', async ({ page }) => {
      await openMotionFixture(page);
      await recordMotion(page);
      await page
        .locator('[data-category-id="a"][data-testid="category-card"]')
        .getByTestId('category-collapse-toggle')
        .click();
      await expect.poll(() => page.evaluate(() => window.motionFrames.length)).toBe(70);
      const frames = await page.evaluate(() => window.motionFrames);
      if (scenario.name === 'phone') expectVerticalMotion(frames);
      else expectCrossColumnMotion(frames, 'a');
      if (scenario.name === 'phone') {
        const collapseGaps = frames.map((frame) => {
          const a = frame.find((point) => point.id === 'a');
          const b = frame.find((point) => point.id === 'b');
          return b.y - a.y - a.height;
        });
        expect(Math.max(...collapseGaps) - Math.min(...collapseGaps)).toBeLessThan(2);
        const gaps = await page.evaluate(async () => {
          const a = document.querySelector('[data-category-id="a"][data-testid="category-card"]');
          const b = document.querySelector('[data-category-id="b"][data-testid="category-card"]');
          const values = [];
          a.querySelector('[data-testid="category-collapse-toggle"]').click();
          await new Promise((resolve) => {
            const sample = () => {
              values.push(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom);
              if (values.length < 50) requestAnimationFrame(sample);
              else resolve();
            };
            requestAnimationFrame(sample);
          });
          return values;
        });
        expect(Math.min(...gaps)).toBeGreaterThanOrEqual(-1);
        expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(2);
      }
    });

    test('animates category siblings before releasing a drag', async ({ page, context }) => {
      await openMotionFixture(page);
      if (scenario.name === 'phone') {
        await page
          .locator('[data-category-id="a"][data-testid="category-card"]')
          .getByTestId('category-collapse-toggle')
          .click();
        await expect(
          page.locator('[data-category-id="a"][data-testid="category-card"]')
        ).toHaveAttribute('data-collapsed', 'true');
        await expect
          .poll(async () => (await page.getByTestId('category-card').first().boundingBox()).height)
          .toBeLessThan(140);
      }
      await page.evaluate(async () => {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await Promise.all(
          document.getAnimations().map((animation) => animation.finished.catch(() => {}))
        );
      });
      const cards = page.getByTestId('category-card');
      const boxes = await Promise.all((await cards.all()).map((card) => card.boundingBox()));
      const rightColumn = boxes.filter((box) => box.x > boxes[0].x + 80);
      const target =
        scenario.name === 'phone'
          ? boxes[1]
          : scenario.name === 'tablet'
            ? rightColumn.at(-1)
            : rightColumn[0];
      expect(target).toBeTruthy();
      const title = await cards.first().getByTestId('category-name').boundingBox();
      const start = scenario.hasTouch
        ? { x: title.x + title.width / 2, y: title.y + title.height / 2 }
        : { x: boxes[0].x + boxes[0].width - 5, y: boxes[0].y + 10 };
      const end = { x: target.x + target.width - 5, y: target.y + target.height * 0.8 };
      const client = scenario.hasTouch ? await context.newCDPSession(page) : null;
      await recordMotion(page, true);
      if (client) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        await page.waitForTimeout(60);
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: start.x + 2, y: start.y + 2 }],
        });
        await page.waitForTimeout(220);
        await expect(page.locator('.chosen-category')).toHaveCount(1);
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
      }
      for (let step = 1; step <= 28; step++) {
        const point = {
          x: start.x + ((end.x - start.x) * step) / 28,
          y: start.y + ((end.y - start.y) * step) / 28,
        };
        if (client)
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [point],
          });
        else await page.mouse.move(point.x, point.y);
        await page.evaluate(() => new Promise(requestAnimationFrame));
      }
      const frames = await page.evaluate(async () => {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await Promise.all(
          document.getAnimations().map((animation) => animation.finished.catch(() => {}))
        );
        window.stopMotionRecording = true;
        return window.motionFrames;
      });
      if (scenario.name === 'phone') expectVerticalMotion(frames);
      else if (scenario.name === 'tablet') expectSiblingMotion(frames);
      else expectCrossColumnMotion(frames, 'a');
      const expected = await page
        .locator('.categories-masonry > .category-item')
        .evaluateAll((elements) =>
          elements.map((element) => element.querySelector('[data-category-id]').dataset.categoryId)
        );
      expect(expected).not.toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
      if (client)
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
      await expect(page.locator('.sortable-fallback')).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(() =>
            JSON.parse(localStorage.getItem('packingListApp'))
              .categories.slice()
              .sort((a, b) => a.order - b.order)
              .map((category) => category.id)
          )
        )
        .toEqual(expected);
      await page.reload();
      await expect(page.getByTestId('category-card')).toHaveCount(6);
      expect(
        await page
          .getByTestId('category-card')
          .evaluateAll((elements) => elements.map((element) => element.dataset.categoryId))
      ).toEqual(expected);
    });
  });
}

// Test Case 7: Rapidly reversing a collapse finishes without leftover transforms or layout overflow.
test('settles rapid collapse reversals and viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openMotionFixture(page);
  const toggle = page
    .locator('[data-category-id="a"][data-testid="category-card"]')
    .getByTestId('category-collapse-toggle');
  await toggle.evaluate((button) => button.click());
  await page.waitForTimeout(80);
  await toggle.evaluate((button) => button.click());
  await page.setViewportSize({ width: 820, height: 900 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect
    .poll(() =>
      page
        .locator('.categories-masonry > .category-item')
        .evaluateAll((elements) =>
          elements.every((element) => !element.style.transform && !element.style.transition)
        )
    )
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.sortable-fallback')).toHaveCount(0);
});

// Test Case 8: Reduced motion disables reflow and collapse animation, including a live preference change.
test('honors reduced motion and cancels active reflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openMotionFixture(page);
  const toggle = page
    .locator('[data-category-id="a"][data-testid="category-card"]')
    .getByTestId('category-collapse-toggle');
  await toggle.click();
  await page.waitForTimeout(80);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() =>
      page
        .locator('.categories-masonry > .category-item')
        .evaluateAll((elements) =>
          elements.every((element) => !element.style.transform && !element.style.transition)
        )
    )
    .toBe(true);
  await expect(page.getByTestId('category-items-container').first()).toHaveCSS(
    'transition-duration',
    '0s'
  );
  await recordMotion(page);
  await toggle.click();
  await expect.poll(() => page.evaluate(() => window.motionFrames.length)).toBe(70);
  const frames = await page.evaluate(() => window.motionFrames);
  for (const final of frames.at(-1)) {
    expect(
      frames.filter((frame) => {
        const point = frame.find((entry) => entry.id === final.id);
        return (
          Math.abs(point.x - final.x) > 4 &&
          Math.abs(point.x - frames[0].find((entry) => entry.id === final.id).x) > 4
        );
      }).length
    ).toBe(0);
  }
});
