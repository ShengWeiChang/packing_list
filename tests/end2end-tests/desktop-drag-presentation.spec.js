/* Desktop drag release, hover, and empty-target presentation. */
import { expect, test } from '@playwright/test';

/**
 * Seed desktop categories without overwriting changes on reload.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {object} options - Fixture options.
 * @param {boolean} [options.packedTarget] - Pack the target items.
 * @param {boolean} [options.emptyTarget] - Create a target without items.
 * @param {boolean} [options.singleSource] - Create only one source item.
 */
async function openFixture(
  page,
  { packedTarget = false, emptyTarget = false, singleSource = false } = {}
) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(
    ({ packed, empty, single }) => {
      if (localStorage.getItem('packingListApp')) return;
      localStorage.setItem('packingListLastOpenedChecklistId', 'trip');
      localStorage.setItem(
        'packingListApp',
        JSON.stringify({
          checklists: [
            { id: 'trip', name: 'Trip', startDate: '', endDate: '', order: 1 },
            { id: 'other', name: 'Other trip', startDate: '', endDate: '', order: 0 },
          ],
          categories: ['a', 'b', 'c', 'd'].map((id, order) => ({
            id,
            name: `Category ${id}`,
            checklistId: 'trip',
            order,
          })),
          items: ['a', 'b'].flatMap((categoryId) =>
            (categoryId === 'b' && empty ? [] : categoryId === 'a' && single ? [0] : [0, 1, 2]).map(
              (order) => ({
                id: `${categoryId}${order}`,
                name: `Item ${categoryId}${order}`,
                quantity: 1,
                categoryId,
                checklistId: 'trip',
                isPacked: categoryId === 'b' && packed,
                isPending: false,
                order,
              })
            )
          ),
        })
      );
    },
    { packed: packedTarget, empty: emptyTarget, single: singleSource }
  );
  await page.goto('/');
  await expect(page.getByTestId('category-card')).toHaveCount(4);
}

/**
 * Hold the real storage lock until the test releases it.
 * @param {import('@playwright/test').Page} page - Browser page.
 */
async function holdStorage(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        void navigator.locks.request('packing-list-storage-write', async () => {
          resolve();
          await new Promise((release) => {
            window.releaseDragStorage = release;
          });
        });
      })
  );
}

/**
 * Move an item to its target while holding the mouse down.
 * @param {import('@playwright/test').Page} page - Browser page.
 * @param {import('@playwright/test').Locator} source - Dragged element.
 * @param {import('@playwright/test').Locator} destination - Drop target.
 */
async function startDrag(page, source, destination) {
  await destination.hover();
  await source.hover();
  const from = await source.boundingBox();
  const to = await destination.boundingBox();
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + to.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 40; step++) {
    await page.mouse.move(x + ((endX - x) * step) / 40, y + ((endY - y) * step) / 40);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
}

/**
 * Record the visible item order in the frames following a drop.
 * @param {import('@playwright/test').Page} page - Browser page.
 */
async function recordDropFrames(page) {
  await page.evaluate(() => {
    window.dragFrames = [];
    window.dragFrameRects = [];
    document.addEventListener(
      'drop',
      () => {
        let count = 0;
        const sample = () => {
          window.dragFrames.push(
            [...document.querySelectorAll('[data-testid="category-items-draggable"]')].map(
              (list) => ({
                id: list.dataset.categoryId,
                items: [...list.querySelectorAll('[data-testid="item-row"]')].map(
                  (row) => row.dataset.itemId
                ),
              })
            )
          );
          const moved = document.querySelector('[data-testid="item-row"][data-item-id="a0"]');
          const rect = moved?.getBoundingClientRect();
          window.dragFrameRects.push(rect ? { x: rect.x, y: rect.y } : null);
          if (++count < 12) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      },
      { capture: true, once: true }
    );
  });
}

// Test Cases 1-2: Same-category and cross-category drops while storage is delayed.
for (const crossCategory of [false, true]) {
  test(`keeps ${crossCategory ? 'cross-category' : 'same-category'} drop order during delayed storage`, async ({
    page,
  }) => {
    await openFixture(page);
    await holdStorage(page);
    const source = page.locator('[data-testid="item-row"][data-item-id="a0"]');
    const originalRect = await source.boundingBox();
    const target = page.locator(
      `[data-testid="item-row"][data-item-id="${crossCategory ? 'b1' : 'a1'}"]`
    );
    await startDrag(page, source, target);
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          let count = 0;
          const frame = () => (++count === 16 ? resolve() : requestAnimationFrame(frame));
          requestAnimationFrame(frame);
        })
    );
    const previewRect = await source.boundingBox();
    const expected = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="category-items-draggable"]')].map((list) => ({
        id: list.dataset.categoryId,
        items: [...list.querySelectorAll('[data-testid="item-row"]')].map(
          (row) => row.dataset.itemId
        ),
      }))
    );
    expect(expected.find((list) => list.id === 'a').items).not.toEqual(['a0', 'a1', 'a2']);
    await recordDropFrames(page);
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.dragFrames.length)).toBe(12);
    expect(await page.evaluate(() => window.dragFrames)).toEqual(Array(12).fill(expected));
    const positions = await page.evaluate(() => window.dragFrameRects);
    expect(
      Math.hypot(previewRect.x - originalRect.x, previewRect.y - originalRect.y)
    ).toBeGreaterThan(15);
    for (const position of positions) {
      expect(position).not.toBeNull();
      const fromPreview = Math.hypot(position.x - previewRect.x, position.y - previewRect.y);
      const fromOriginal = Math.hypot(position.x - originalRect.x, position.y - originalRect.y);
      expect(fromPreview).toBeLessThan(fromOriginal);
    }
    const oldNeighbor = page.locator('[data-testid="item-row"][data-item-id="a1"]');
    await expect(oldNeighbor).toHaveAttribute('data-drag-hover-suppressed', 'true');
    await expect(oldNeighbor).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.evaluate(() => window.releaseDragStorage());
    await expect(oldNeighbor).toHaveAttribute('data-drag-hover-suppressed', 'true');
    const box = await oldNeighbor.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(oldNeighbor).not.toHaveAttribute('data-drag-hover-suppressed', 'true');
    await expect(oldNeighbor).toHaveCSS('background-color', 'rgb(243, 244, 246)');
    await expect
      .poll(() =>
        page.evaluate(() =>
          navigator.locks
            .query()
            .then(
              (state) =>
                [...state.held, ...state.pending].filter(
                  (lock) => lock.name === 'packing-list-storage-write'
                ).length
            )
        )
      )
      .toBe(0);
    await page.reload();
    await expect(page.getByTestId('category-card')).toHaveCount(4);
    const actual = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="category-items-draggable"]')].map((list) => ({
        id: list.dataset.categoryId,
        items: [...list.querySelectorAll('[data-testid="item-row"]')].map(
          (row) => row.dataset.itemId
        ),
      }))
    );
    expect(actual).toEqual(expected);
  });
}

// Test Cases 3-4: Empty and filtered-empty drop previews, cancellation, and placement.
for (const packedTarget of [false, true]) {
  test(`places the drag placeholder before Add Item in ${packedTarget ? 'filtered' : 'empty'} categories`, async ({
    page,
  }) => {
    await openFixture(page, { packedTarget, emptyTarget: !packedTarget });
    if (packedTarget) await page.getByTestId('unpacked-items-filter-toggle').click();
    const source = page.locator('[data-testid="item-row"][data-item-id="a0"]');
    const target = page.locator('[data-testid="category-items-draggable"][data-category-id="b"]');
    const addButton = target.getByTestId('add-item-button');
    const before = await addButton.boundingBox();
    const beforeTarget = await target.boundingBox();
    await startDrag(page, source, addButton);
    const ghost = target.locator('.ghost-item');
    await expect(ghost).toBeVisible();
    await expect
      .poll(async () => {
        const placeholder = await ghost.boundingBox();
        const button = await addButton.boundingBox();
        const list = await target.boundingBox();
        return (
          placeholder.y + placeholder.height <= button.y + 1 &&
          button.y - list.y >= before.y - beforeTarget.y + 20
        );
      })
      .toBe(true);
    await page.mouse.move(5, 5);
    await page.mouse.up();
    await expect(ghost).toHaveCount(0);
    await expect
      .poll(async () => Math.abs((await addButton.boundingBox()).y - before.y))
      .toBeLessThan(2);
    await startDrag(page, source, addButton);
    await expect(ghost).toBeVisible();
    await page.mouse.up();
    await expect(target.getByTestId('item-row')).toHaveCount(1);
    await expect(target.getByTestId('item-row').first()).toHaveAttribute('data-item-id', 'a0');
    if (packedTarget) {
      await page.getByTestId('unpacked-items-filter-toggle').click();
      await expect(target.getByTestId('item-row')).toHaveCount(4);
      await expect(target.getByTestId('item-row').last()).toHaveAttribute('data-item-id', 'a0');
    }
  });
}

// Test Case 5: Failed storage must restore authoritative ordering.
test('restores the original order when a drop cannot be saved', async ({ page }) => {
  await openFixture(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListApp') {
        Storage.prototype.setItem = original;
        throw new DOMException('Storage unavailable', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
  });
  await startDrag(
    page,
    page.locator('[data-testid="item-row"][data-item-id="a0"]'),
    page.locator('[data-testid="item-row"][data-item-id="b1"]')
  );
  await page.mouse.up();
  await expect(page.getByRole('alert')).toBeVisible();
  const source = page.locator('[data-testid="category-items-draggable"][data-category-id="a"]');
  await expect(source.getByTestId('item-row')).toHaveCount(3);
  await expect(source.getByTestId('item-row').first()).toHaveAttribute('data-item-id', 'a0');
  await page.reload();
  await expect(source.getByTestId('item-row').first()).toHaveAttribute('data-item-id', 'a0');
});

// Test Case 6: Sorting must not restart the sidebar expansion animation.
test('does not replay the sidebar label reveal after sorting', async ({ page }) => {
  await openFixture(page);
  const tiles = page.getByTestId('sidebar-checklist-item');
  await expect(tiles.first().locator('[data-sidebar-checklist-label]')).toHaveCSS('opacity', '1');
  await page.evaluate(() => {
    window.dragAnimations = [];
    window.sidebarOpacityFrames = [];
    document.addEventListener('animationstart', (event) => {
      if (event.animationName.includes('sidebar-label-reveal')) {
        window.dragAnimations.push(event.animationName);
      }
    });
    document.addEventListener(
      'dragend',
      () => {
        let count = 0;
        const sample = () => {
          const label = [...document.querySelectorAll('[data-sidebar-checklist-label]')].find(
            (element) => element.textContent.trim() === 'Other trip'
          );
          window.sidebarOpacityFrames.push(label ? Number(getComputedStyle(label).opacity) : 0);
          if (++count < 24) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      },
      { capture: true, once: true }
    );
  });
  await startDrag(page, tiles.nth(1), tiles.nth(0));
  await page.mouse.up();
  await expect(tiles.first()).toContainText('Other trip');
  await expect(tiles.first().locator('[data-sidebar-checklist-label]')).toHaveCSS('opacity', '1');
  await expect.poll(() => page.evaluate(() => window.sidebarOpacityFrames.length)).toBe(24);
  expect(
    await page.evaluate(() => Math.min(...window.sidebarOpacityFrames))
  ).toBeGreaterThanOrEqual(0.99);
  expect(await page.evaluate(() => window.dragAnimations)).toEqual([]);
});

// Test Case 7: Consecutive drops preserve their projected order through queued writes.
test('preserves consecutive cross-category drops while storage is delayed', async ({ page }) => {
  await openFixture(page);
  await holdStorage(page);
  await startDrag(
    page,
    page.locator('[data-testid="item-row"][data-item-id="a0"]'),
    page.locator('[data-testid="item-row"][data-item-id="b1"]')
  );
  await page.mouse.up();
  const target = page.locator('[data-testid="category-items-draggable"][data-category-id="b"]');
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  await startDrag(
    page,
    page.locator('[data-testid="item-row"][data-item-id="b0"]'),
    page.locator('[data-testid="item-row"][data-item-id="a1"]')
  );
  await page.mouse.up();
  const source = page.locator('[data-testid="category-items-draggable"][data-category-id="a"]');
  await expect(source.getByTestId('item-row').first()).toHaveAttribute('data-item-id', 'b0');
  const expected = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="category-items-draggable"]')].map((list) => ({
      id: list.dataset.categoryId,
      items: [...list.querySelectorAll('[data-testid="item-row"]')].map(
        (row) => row.dataset.itemId
      ),
    }))
  );
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.locks
          .query()
          .then(
            (state) =>
              [...state.held, ...state.pending].filter(
                (lock) => lock.name === 'packing-list-storage-write'
              ).length
          )
      )
    )
    .toBe(0);
  await page.reload();
  await expect(page.getByTestId('category-card')).toHaveCount(4);
  const actual = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="category-items-draggable"]')].map((list) => ({
      id: list.dataset.categoryId,
      items: [...list.querySelectorAll('[data-testid="item-row"]')].map(
        (row) => row.dataset.itemId
      ),
    }))
  );
  expect(actual).toEqual(expected);
});

// Test Case 8: Category cards keep their drop order while storage is delayed.
test('keeps category drop order during delayed storage', async ({ page }) => {
  await openFixture(page);
  const collapseButtons = page.getByTestId('category-collapse-toggle');
  for (const button of await collapseButtons.all()) {
    if ((await button.getAttribute('aria-expanded')) === 'true') await button.click();
  }
  await holdStorage(page);
  const cards = page.getByTestId('category-card');
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  const x = first.x + first.width / 2;
  const y = first.y + 12;
  const endX = second.x + second.width / 2;
  const endY = second.y + second.height * 0.65;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 40; step++) {
    await page.mouse.move(x + ((endX - x) * step) / 40, y + ((endY - y) * step) / 40);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  const expected = await cards.evaluateAll((elements) =>
    elements.map((card) => card.dataset.categoryId)
  );
  expect(expected).not.toEqual(['a', 'b', 'c', 'd']);
  await page.evaluate(() => {
    window.categoryDropFrames = [];
    document.addEventListener(
      'dragend',
      () => {
        let count = 0;
        const sample = () => {
          window.categoryDropFrames.push(
            [...document.querySelectorAll('[data-testid="category-card"]')].map(
              (card) => card.dataset.categoryId
            )
          );
          if (++count < 12) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      },
      { capture: true, once: true }
    );
  });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.categoryDropFrames.length)).toBe(12);
  expect(await page.evaluate(() => window.categoryDropFrames)).toEqual(Array(12).fill(expected));
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.locks
          .query()
          .then(
            (state) =>
              [...state.held, ...state.pending].filter(
                (lock) => lock.name === 'packing-list-storage-write'
              ).length
          )
      )
    )
    .toBe(0);
  await page.reload();
  await expect(page.getByTestId('category-card')).toHaveCount(4);
  expect(
    await cards.evaluateAll((elements) => elements.map((card) => card.dataset.categoryId))
  ).toEqual(expected);
});

// Test Case 9: The Add Item button must not retain hover when the last item moves out.
test('does not highlight Add Item after moving the last item from a category', async ({ page }) => {
  await openFixture(page, { singleSource: true });
  await startDrag(
    page,
    page.locator('[data-testid="item-row"][data-item-id="a0"]'),
    page.locator('[data-testid="item-row"][data-item-id="b1"]')
  );
  await page.mouse.up();
  const source = page.locator('[data-testid="category-items-draggable"][data-category-id="a"]');
  const button = source.getByTestId('add-item-button');
  await expect(source.getByTestId('item-row')).toHaveCount(0);
  await expect.poll(() => button.evaluate((element) => element.matches(':hover'))).toBe(true);
  await expect(button).toHaveAttribute('data-drag-hover-suppressed', 'true');
  await expect(button).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(button.getByTestId('add-item-button-icon')).toHaveClass(/text-secondary/);
  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(button).not.toHaveAttribute('data-drag-hover-suppressed', 'true');
  await expect(button).toHaveCSS('background-color', 'rgb(243, 244, 246)');
});

// Test Case 10: Keep a committed drop visible when its follow-up read fails.
test('keeps the saved drop visible when the follow-up read fails', async ({ page }) => {
  await openFixture(page);
  await page.evaluate(() => {
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    let failRead = false;
    Storage.prototype.setItem = function (key, value) {
      const result = originalSet.call(this, key, value);
      if (key === 'packingListApp') {
        failRead = true;
        Storage.prototype.setItem = originalSet;
      }
      return result;
    };
    Storage.prototype.getItem = function (key) {
      if (key === 'packingListApp' && failRead) {
        Storage.prototype.getItem = originalGet;
        throw new DOMException('Storage read unavailable', 'SecurityError');
      }
      return originalGet.call(this, key);
    };
  });
  await startDrag(
    page,
    page.locator('[data-testid="item-row"][data-item-id="a0"]'),
    page.locator('[data-testid="item-row"][data-item-id="b1"]')
  );
  await page.mouse.up();
  await expect(
    page.getByText(/Your change was saved, but the display could not be refreshed/)
  ).toBeVisible();
  const source = page.locator('[data-testid="category-items-draggable"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-items-draggable"][data-category-id="b"]');
  await expect(source.locator('[data-item-id="a0"]')).toHaveCount(0);
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  await page.reload();
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  await expect(target.locator('[data-testid="item-row"][data-item-id="a0"]')).toBeVisible();
});

// Test Case 11: A previous write completing must not disturb a drag already in progress.
test('keeps a new drag intact when the previous write completes', async ({ page }) => {
  await openFixture(page);
  await holdStorage(page);
  await startDrag(
    page,
    page.locator('[data-testid="item-row"][data-item-id="a0"]'),
    page.locator('[data-testid="item-row"][data-item-id="b1"]')
  );
  await page.mouse.up();
  const target = page.locator('[data-testid="category-items-draggable"][data-category-id="b"]');
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  await startDrag(
    page,
    page.locator('[data-testid="item-row"][data-item-id="b0"]'),
    page.locator('[data-testid="item-row"][data-item-id="a1"]')
  );
  const source = page.locator('[data-testid="category-items-draggable"][data-category-id="a"]');
  const ghost = source.locator('.ghost-item');
  await expect(ghost).toBeVisible();
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('packingListApp')).items.find((item) => item.id === 'a0')
            .categoryId
      )
    )
    .toBe('b');
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  await expect(ghost).toBeVisible();
  await page.mouse.up();
  await expect(source.getByTestId('item-row').first()).toHaveAttribute('data-item-id', 'b0');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('packingListApp')).items.find((item) => item.id === 'b0')
            .categoryId
      )
    )
    .toBe('a');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.reload();
  await expect(source.getByTestId('item-row').first()).toHaveAttribute('data-item-id', 'b0');
});

// Test Case 12: Packing waits for a pending move and uses the displayed membership.
test('packs the displayed destination after its pending move saves', async ({ page }) => {
  await openFixture(page, { singleSource: true, emptyTarget: true });
  await holdStorage(page);
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
  await startDrag(page, source.getByTestId('item-row'), target.getByTestId('add-item-button'));
  await page.mouse.up();
  await expect(source.getByTestId('item-row')).toHaveCount(0);
  await expect(source.getByTestId('category-checkbox')).toBeDisabled();
  await expect(target.getByTestId('item-row')).toHaveCount(1);
  const targetCheckbox = target.getByTestId('category-checkbox');
  await expect(targetCheckbox).toBeEnabled();
  await expect(targetCheckbox).not.toBeChecked();
  await targetCheckbox.click();
  await expect(targetCheckbox).not.toBeChecked();
  await page.evaluate(() => window.releaseDragStorage());
  await expect(targetCheckbox).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const item = JSON.parse(localStorage.getItem('packingListApp')).items.find(
          (entry) => entry.id === 'a0'
        );
        return { categoryId: item.categoryId, isPacked: item.isPacked };
      })
    )
    .toEqual({ categoryId: 'b', isPacked: true });
  await page.reload();
  await expect(targetCheckbox).toBeChecked();
});

// Test Case 13: A failed move cancels a waiting category packing action.
test('cancels pending category packing when the move fails', async ({ page }) => {
  await openFixture(page, { singleSource: true, emptyTarget: true });
  await holdStorage(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'packingListApp') {
        Storage.prototype.setItem = original;
        throw new DOMException('Storage unavailable', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
  });
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
  await startDrag(page, source.getByTestId('item-row'), target.getByTestId('add-item-button'));
  await page.mouse.up();
  await expect(target.getByTestId('category-checkbox')).toBeEnabled();
  await target.getByTestId('category-checkbox').click();
  await page.evaluate(() => window.releaseDragStorage());
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(source.getByTestId('item-row')).toHaveCount(1);
  await expect(target.getByTestId('item-row')).toHaveCount(0);
  const item = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('packingListApp')).items.find((entry) => entry.id === 'a0')
  );
  expect({ categoryId: item.categoryId, isPacked: item.isPacked }).toEqual({
    categoryId: 'a',
    isPacked: false,
  });
});

// Test Case 14: A cross-column drop keeps its visible geometry with unequal card heights.
test('keeps unequal category cards at the cross-column drop position', async ({ page }) => {
  await openFixture(page);
  await holdStorage(page);
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="c"]');
  const original = await source.boundingBox();
  const destination = await target.boundingBox();
  expect(Math.abs(original.height - destination.height)).toBeGreaterThan(50);
  expect(Math.abs(original.x - destination.x)).toBeGreaterThan(100);
  const x = original.x + original.width - 5;
  const y = original.y + 12;
  const endX = destination.x + destination.width - 5;
  const endY = destination.y + destination.height * 0.7;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 50; step++) {
    await page.mouse.move(x + ((endX - x) * step) / 50, y + ((endY - y) * step) / 50);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let count = 0;
        const frame = () => (++count === 20 ? resolve() : requestAnimationFrame(frame));
        requestAnimationFrame(frame);
      })
  );
  const preview = await source.boundingBox();
  const targetPreview = await target.boundingBox();
  expect(Math.abs(preview.x - original.x)).toBeGreaterThan(100);
  expect(Math.abs(targetPreview.x - destination.x)).toBeGreaterThan(100);
  const cards = page.getByTestId('category-card');
  const expected = await cards.evaluateAll((elements) =>
    elements.map((card) => card.dataset.categoryId)
  );
  expect(expected).not.toEqual(['a', 'b', 'c', 'd']);
  await page.evaluate(() => {
    window.categoryPositions = [];
    document.addEventListener(
      'dragend',
      () => {
        let count = 0;
        const frame = () => {
          const positions = ['a', 'c'].map((id) => {
            const card = document.querySelector(
              `[data-testid="category-card"][data-category-id="${id}"]`
            );
            const rect = card?.getBoundingClientRect();
            return rect ? { x: rect.x, y: rect.y } : null;
          });
          window.categoryPositions.push(positions);
          if (++count < 24) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      },
      { capture: true, once: true }
    );
  });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.categoryPositions.length)).toBe(24);
  for (const positions of await page.evaluate(() => window.categoryPositions)) {
    for (const [index, position] of positions.entries()) {
      expect(position).not.toBeNull();
      const before = index === 0 ? original : destination;
      const dropped = index === 0 ? preview : targetPreview;
      expect(Math.hypot(position.x - dropped.x, position.y - dropped.y)).toBeLessThan(
        Math.hypot(position.x - before.x, position.y - before.y)
      );
    }
  }
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.locks
          .query()
          .then(
            (state) =>
              [...state.held, ...state.pending].filter(
                (lock) => lock.name === 'packing-list-storage-write'
              ).length
          )
      )
    )
    .toBe(0);
  await page.reload();
  await expect(cards).toHaveCount(4);
  expect(
    await cards.evaluateAll((elements) => elements.map((card) => card.dataset.categoryId))
  ).toEqual(expected);
});

// Test Case 15: Leaving the checklist cancels a waiting category packing action.
test('does not apply queued packing after leaving the checklist', async ({ page }) => {
  await openFixture(page, { singleSource: true, emptyTarget: true });
  await holdStorage(page);
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
  await startDrag(page, source.getByTestId('item-row'), target.getByTestId('add-item-button'));
  await page.mouse.up();
  await expect(target.getByTestId('category-checkbox')).toBeEnabled();
  await target.getByTestId('category-checkbox').click();
  await page.getByTestId('sidebar-checklist-item').filter({ hasText: 'Other trip' }).click();
  await expect(page.getByTestId('checklist-name')).toHaveText('Other trip');
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(() => {
        const item = JSON.parse(localStorage.getItem('packingListApp')).items.find(
          (entry) => entry.id === 'a0'
        );
        return { categoryId: item.categoryId, isPacked: item.isPacked };
      })
    )
    .toEqual({ categoryId: 'b', isPacked: false });
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.locks
          .query()
          .then(
            (state) =>
              [...state.held, ...state.pending].filter(
                (lock) => lock.name === 'packing-list-storage-write'
              ).length
          )
      )
    )
    .toBe(0);
  const item = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('packingListApp')).items.find((entry) => entry.id === 'a0')
  );
  expect(item.isPacked).toBe(false);
});

// Test Case 16: A saved move with a failed follow-up read cancels waiting packing.
test('cancels queued packing when the saved move cannot be refreshed', async ({ page }) => {
  await openFixture(page, { singleSource: true, emptyTarget: true });
  await holdStorage(page);
  await page.evaluate(() => {
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    let failRead = false;
    Storage.prototype.setItem = function (key, value) {
      const result = originalSet.call(this, key, value);
      if (key === 'packingListApp') {
        failRead = true;
        Storage.prototype.setItem = originalSet;
      }
      return result;
    };
    Storage.prototype.getItem = function (key) {
      if (key === 'packingListApp' && failRead) {
        Storage.prototype.getItem = originalGet;
        throw new DOMException('Storage read unavailable', 'SecurityError');
      }
      return originalGet.call(this, key);
    };
  });
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
  await startDrag(page, source.getByTestId('item-row'), target.getByTestId('add-item-button'));
  await page.mouse.up();
  await expect(target.getByTestId('category-checkbox')).toBeEnabled();
  await target.getByTestId('category-checkbox').click();
  await page.evaluate(() => window.releaseDragStorage());
  await expect(
    page.getByText(/Your change was saved, but the display could not be refreshed/)
  ).toBeVisible();
  await expect(target.getByTestId('item-row')).toHaveCount(1);
  await expect(target.getByTestId('category-checkbox')).not.toBeChecked();
  const item = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('packingListApp')).items.find((entry) => entry.id === 'a0')
  );
  expect({ categoryId: item.categoryId, isPacked: item.isPacked }).toEqual({
    categoryId: 'b',
    isPacked: false,
  });
});

// Test Case 17: Progress and packing include an unpacked item entering a packed category.
test('shows projected progress when moving into a fully packed category', async ({ page }) => {
  await openFixture(page, { singleSource: true, packedTarget: true });
  await holdStorage(page);
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
  const checkbox = target.getByTestId('category-checkbox');
  await expect(checkbox).toBeChecked();
  await startDrag(page, source.getByTestId('item-row'), target.getByTestId('item-row').first());
  await page.mouse.up();
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
  await expect(target).toContainText('3 / 4');
  await checkbox.click();
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('packingListApp')).items.filter(
            (entry) => entry.categoryId === 'b' && entry.isPacked
          ).length
      )
    )
    .toBe(4);
  await expect(checkbox).toBeChecked();
});

// Test Case 18: Source packing after a move excludes the item now displayed elsewhere.
test('packs only remaining source items after the pending move saves', async ({ page }) => {
  await openFixture(page);
  await holdStorage(page);
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
  await startDrag(
    page,
    source.getByTestId('item-row').first(),
    target.getByTestId('item-row').nth(1)
  );
  await page.mouse.up();
  await expect(source.getByTestId('item-row')).toHaveCount(2);
  await expect(source).toContainText('0 / 2');
  await source.getByTestId('category-checkbox').click();
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(() => {
        const items = JSON.parse(localStorage.getItem('packingListApp')).items;
        return ['a0', 'a1', 'a2'].map((id) => {
          const item = items.find((entry) => entry.id === id);
          return { categoryId: item.categoryId, isPacked: item.isPacked };
        });
      })
    )
    .toEqual([
      { categoryId: 'b', isPacked: false },
      { categoryId: 'a', isPacked: true },
      { categoryId: 'a', isPacked: true },
    ]);
  await page.reload();
  await expect(source.getByTestId('category-checkbox')).toBeChecked();
  await expect(target.locator('[data-testid="item-row"][data-item-id="a0"]')).toBeVisible();
});

// Test Case 19: Switching the filter during a pending move keeps the projected items accurate.
test('keeps the pending drop correct while the packed filter changes', async ({ page }) => {
  await openFixture(page, { packedTarget: true });
  await holdStorage(page);
  const source = page.locator('[data-testid="category-card"][data-category-id="a"]');
  const target = page.locator('[data-testid="category-card"][data-category-id="b"]');
  await startDrag(
    page,
    source.getByTestId('item-row').first(),
    target.getByTestId('item-row').first()
  );
  await page.mouse.up();
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  const filter = page.getByTestId('unpacked-items-filter-toggle');
  await filter.click();
  await expect(target.getByTestId('item-row')).toHaveCount(1);
  await expect(target.getByTestId('item-row').first()).toHaveAttribute('data-item-id', 'a0');
  await filter.click();
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  const beforeSave = await target
    .getByTestId('item-row')
    .evaluateAll((rows) => rows.map((row) => row.dataset.itemId));
  await page.evaluate(() => window.releaseDragStorage());
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.locks
          .query()
          .then(
            (state) =>
              [...state.held, ...state.pending].filter(
                (lock) => lock.name === 'packing-list-storage-write'
              ).length
          )
      )
    )
    .toBe(0);
  await page.reload();
  await expect(target.getByTestId('item-row')).toHaveCount(4);
  expect(
    await target
      .getByTestId('item-row')
      .evaluateAll((rows) => rows.map((row) => row.dataset.itemId))
  ).toEqual(beforeSave);
});
