/*
================================================================================
File: tests/end2end-tests/rwd-webkit.spec.js
Description: Focused WebKit responsive interaction checks.
License: MIT (SPDX: MIT)
Created: 2026-11-04
================================================================================
*/

import { expect, test } from '@playwright/test';

import { selectGeneralRecommendedList } from './checklistHelpers.js';
import { armDrawerTransition, sampleDrawerTransition } from './drawerMotionHelpers.js';

// Test Case 1: WebKit touch reachability, persisted quick actions, and drawer Escape.
test('WebKit touch actions persist and drawer dismisses accessibly', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('topbar-new').click();
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
  const row = page.getByTestId('item-row').first();
  const id = await row.getAttribute('data-item-id');
  await row.locator('[data-testid^="overflow-trigger-item-"]').tap();
  await row.getByTestId('item-quantity-increment').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×2');
  await page.reload();
  await expect(
    page.locator(`[data-item-id="${id}"] [data-testid="item-quantity-summary"]`)
  ).toHaveText('×2');
  await armDrawerTransition(page);
  await page.getByTestId('topbar-toggle').click();
  const drawer = page.getByTestId('overlay-sidebar');
  await expect(drawer).toBeVisible();
  const opening = await sampleDrawerTransition(page);
  expect(opening.some(({ x, width }) => x < -1 && x > -width + 1)).toBe(true);
  expect(Math.abs(opening.at(-1).x)).toBeLessThan(1);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('overlay-sidebar')).toHaveCount(0);
  await expect(page.getByTestId('topbar-toggle')).toBeFocused();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.getByTestId('sidebar-language-button').tap();
  await expect(page.getByTestId('sidebar-language-dropdown')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('sidebar-language-dropdown')).toHaveCount(0);
  await expect(page.getByTestId('sidebar-language-button')).toBeFocused();

  // Exercise the body-focused fallback without depending on native tap focus behavior.
  await page.getByTestId('sidebar-language-button').evaluate((element) => element.blur());
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  await page.getByTestId('sidebar-language-button').dispatchEvent('click');
  await expect(page.getByTestId('sidebar-language-dropdown')).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('sidebar-language-dropdown')).toHaveCount(0);
  await expect(page.getByTestId('sidebar-language-button')).toBeFocused();
});

// Test Case 2: A short WebKit dialog and native date fields remain reachable without horizontal overflow.
test('WebKit short dialogs and date fields fit the narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 300 });
  await page.goto('/');
  await page.getByTestId('topbar-new').click();
  const dialog = page.getByTestId('new-checklist-dialog');
  const bounds = await dialog.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(300);
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
  await page.setViewportSize({ width: 320, height: 200 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '300%'));
  const oversizedActions = await page.addStyleTag({
    content: '[data-testid^="overflow-dropdown-checklist-"] > button { min-height: 120px; }',
  });
  const trigger = page.locator('[data-testid^="overflow-trigger-checklist-"]').last();
  await trigger.tap();
  const menu = page.locator('[data-testid^="overflow-dropdown-checklist-"]');
  await expect(menu).toBeVisible();
  await expect.poll(async () => (await menu.boundingBox()).y).toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => {
      const box = await menu.boundingBox();
      return box.y + box.height;
    })
    .toBeLessThanOrEqual(200);
  const saveTemplate = page.locator('[data-testid^="overflow-action-save-template-checklist-"]');
  await saveTemplate.scrollIntoViewIfNeeded();
  await saveTemplate.tap();
  await expect(page.getByTestId('save-template-name')).toBeVisible();
  await page.keyboard.press('Escape');
  await oversizedActions.evaluate((element) => element.remove());
  await page.evaluate(() => (document.documentElement.style.fontSize = ''));
  await page.setViewportSize({ width: 320, height: 300 });
  await page.getByTestId('checklist-name').click();
  for (const field of await page.locator('input[type="date"]').all()) {
    const box = await field.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Test Case 3: A wide touch viewport has multiple usable category columns in WebKit.
test('WebKit tablet columns retain visible touch actions', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('topbar-new').click();
  await selectGeneralRecommendedList(page);
  await page.getByTestId('checklist-name-input').press('Enter');
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('packingListApp'));
    const original = data.checklists[0];
    for (let index = 0; index < 25; index++) {
      data.checklists.push({
        ...original,
        id: `webkit-list-${index}`,
        name: `清單 ${index}`,
        order: index + 2,
      });
    }
    localStorage.setItem('packingListApp', JSON.stringify(data));
  });
  await page.reload();
  const animationControl = await page.addStyleTag({
    content: '[data-sidebar-delayed-menu] { animation-play-state: paused !important; }',
  });
  const sidebarSamples = await page.evaluate(async () => {
    const samples = [];
    const textOffsets = [];
    const menuFrames = [];
    for (let i = 0; i < 2; i++) {
      document.querySelector('aside [data-testid="sidebar-toggle"]').click();
      await Promise.resolve();
      if (i === 0) {
        const menu = document.querySelector('[data-sidebar-delayed-menu]');
        menu.getBoundingClientRect();
        const animation = menu
          .getAnimations()
          .find((entry) => entry.animationName?.startsWith('sidebar-overflow-reveal'));
        if (!animation)
          throw new Error(
            `Sidebar reveal animation was not created: ${JSON.stringify({ css: getComputedStyle(menu).animationName, animations: menu.getAnimations().map((entry) => ({ name: entry.animationName, timing: entry.effect?.getTiming() })) })}`
          );
        await animation.ready;
        for (const time of [0, 200, 450]) {
          animation.currentTime = time;
          const style = getComputedStyle(menu);
          menuFrames.push({ time, opacity: Number(style.opacity), visibility: style.visibility });
        }
      }
      const start = performance.now();
      await new Promise((resolve) => {
        const sample = () => {
          const list = document.querySelector('aside [data-testid="sidebar-checklists-draggable"]');
          const scrollport = list?.closest('.overflow-y-auto');
          if (scrollport) {
            samples.push(scrollport.scrollWidth - scrollport.clientWidth);
            const label = list.querySelector('[data-sidebar-checklist-label]');
            if (label)
              textOffsets.push(
                label.getBoundingClientRect().left - list.getBoundingClientRect().left
              );
          }
          if (performance.now() - start < 400) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
    }
    return { samples, textOffsets, menuFrames };
  });
  const earlyFrames = sidebarSamples.menuFrames.filter((frame) => frame.time < 300);
  expect(earlyFrames).toHaveLength(2);
  expect(earlyFrames.every((frame) => frame.opacity === 0 && frame.visibility === 'hidden')).toBe(
    true
  );
  expect(
    sidebarSamples.menuFrames.some(
      (frame) => frame.time === 450 && frame.opacity === 1 && frame.visibility === 'visible'
    )
  ).toBe(true);
  await animationControl.evaluate((element) => element.remove());
  expect(sidebarSamples.samples.length).toBeGreaterThan(0);
  expect(Math.max(...sidebarSamples.samples)).toBeLessThanOrEqual(0);
  expect(
    Math.max(...sidebarSamples.textOffsets) - Math.min(...sidebarSamples.textOffsets)
  ).toBeLessThan(1);
  const tile = page.getByTestId('sidebar-checklist-item').first();
  const tileBounds = await tile.boundingBox();
  const initialBounds = await tile.locator('[data-sidebar-initial]').boundingBox();
  expect(
    Math.abs(initialBounds.x + initialBounds.width / 2 - tileBounds.x - tileBounds.width / 2)
  ).toBeLessThan(1);
  const scrollport = page.getByTestId('sidebar-checklists-scrollport');
  await expect(scrollport).toHaveCSS('overflow-y', 'clip');
  await expect(page.getByTestId('sidebar-checklist-item').last()).toBeHidden();
  await scrollport.evaluate((element) => {
    element.scrollTop = 200;
  });
  expect(await scrollport.evaluate((element) => element.scrollTop)).toBe(0);
  await page.getByTestId('sidebar-toggle').tap();
  await expect(scrollport).toHaveCSS('overflow-y', 'auto');
  await scrollport.evaluate((element) => {
    element.scrollTop = 200;
  });
  expect(await scrollport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.getByTestId('sidebar-toggle').tap();
  await expect(scrollport).toHaveCSS('overflow-y', 'clip');
  expect(await scrollport.evaluate((element) => element.scrollTop)).toBe(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('aside')).toHaveCSS('transition-duration', '0s');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.getByTestId('sidebar-toggle').tap();
  const drawer = page.getByTestId('overlay-sidebar');
  await drawer.focus();
  await page.getByTestId('sidebar-language-button').tap();
  await expect(page.getByTestId('sidebar-language-dropdown')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeVisible();
  await expect(page.getByTestId('sidebar-language-dropdown')).toHaveCount(0);
  await expect(page.getByTestId('sidebar-language-button')).toBeFocused();

  // Exercise the drawer-focused fallback independently of native tap focus behavior.
  await drawer.focus();
  await page.getByTestId('sidebar-language-button').dispatchEvent('click');
  await expect(drawer).toBeFocused();
  await expect(page.getByTestId('sidebar-language-dropdown')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeVisible();
  await expect(page.getByTestId('sidebar-language-dropdown')).toHaveCount(0);
  await expect(page.getByTestId('sidebar-language-button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);

  await page.getByTestId('sidebar-toggle').tap();
  await drawer.focus();
  await page.getByTestId('sidebar-language-button').tap();
  const sidebarOverflow = drawer.locator('[data-testid^="overflow-trigger-checklist-"]').first();
  await sidebarOverflow.tap();
  const overflowMenu = drawer.locator('[data-testid^="overflow-dropdown-checklist-"]').first();
  await expect(page.getByTestId('sidebar-language-dropdown')).toHaveCount(0);
  await expect(overflowMenu).toBeVisible();
  await page.getByTestId('sidebar-language-button').tap();
  await expect(overflowMenu).toHaveCount(0);
  await expect(page.getByTestId('sidebar-language-dropdown')).toBeVisible();
  await sidebarOverflow.tap();
  await expect(page.getByTestId('sidebar-language-dropdown')).toHaveCount(0);
  await expect(overflowMenu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(overflowMenu).toHaveCount(0);
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);

  const cards = page.getByTestId('category-card');
  await expect
    .poll(async () => {
      const boxes = await Promise.all((await cards.all()).map((card) => card.boundingBox()));
      return new Set(boxes.map((box) => Math.round(box.x))).size;
    })
    .toBe(2);
  const row = page.getByTestId('item-row').first();
  const trigger = row.locator('[data-testid^="overflow-trigger-item-"]');
  await page.mouse.move(0, 0);
  const category = cards.first();
  for (const type of ['category', 'checklist']) {
    const menuTrigger = page.locator(`[data-testid^="overflow-trigger-${type}-"]`).last();
    await menuTrigger.tap();
    const menu = page.locator(`[data-testid^="overflow-dropdown-${type}-"]`);
    await expect(menu).toBeVisible();
    for (const action of await menu.locator('button').all()) {
      expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await expect(action).toHaveCSS('font-size', '16px');
    }
    await menuTrigger.tap();
  }
  await expect(category.getByTestId('category-collapse-toggle')).toHaveCSS(
    '-webkit-tap-highlight-color',
    'rgba(0, 0, 0, 0)'
  );
  const name = row.getByTestId('item-name');
  const addLabel = category.getByTestId('add-item-button').locator(':scope > span').last();
  const textPositions = await Promise.all(
    [name, addLabel].map((locator) =>
      locator.evaluate(
        (element) =>
          element.getBoundingClientRect().left + parseFloat(getComputedStyle(element).paddingLeft)
      )
    )
  );
  expect(Math.abs(textPositions[0] - textPositions[1])).toBeLessThan(1);
  await expect(name).toHaveCSS('font-size', '18px');
  await expect(addLabel).toHaveCSS('font-size', '18px');
  const firstBox = await row.boundingBox();
  const nextBox = await category.getByTestId('item-row').nth(1).boundingBox();
  expect(Math.abs(nextBox.y - firstBox.y - 48)).toBeLessThan(1);
  for (const control of [
    category.getByTestId('category-collapse-toggle'),
    category.locator('[data-testid^="overflow-trigger-category-"]'),
    trigger,
  ]) {
    await expect(control).toHaveCSS('opacity', '1');
    await expect(control).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  }
  await expect(trigger).toBeVisible();
  await trigger.tap();
  await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await row.getByTestId('item-quantity-increment').tap();
  await expect(row.getByTestId('item-quantity-value')).toHaveText('×2');
  await row.getByTestId('item-pending-toggle').tap();
  const pendingRow = page.getByTestId('pending-item-row').first();
  const complete = pendingRow.getByTestId('pending-item-complete');
  expect((await complete.boundingBox()).width).toBeGreaterThanOrEqual(44);
  expect((await complete.locator('span').boundingBox()).width).toBe(20);
  await expect(pendingRow.locator('div > span').first()).toHaveCSS('font-size', '18px');
  const itemTextInset = await name.evaluate((element) => {
    const card = element.closest('[data-testid="category-card"]');
    return (
      element.getBoundingClientRect().left +
      parseFloat(getComputedStyle(element).paddingLeft) -
      card.getBoundingClientRect().left
    );
  });
  const pendingTextInset = await pendingRow
    .locator('div > span')
    .first()
    .evaluate((element) => {
      const card = element.closest('[data-testid="pending-items-category"]');
      return (
        element.getBoundingClientRect().left +
        parseFloat(getComputedStyle(element).paddingLeft) -
        card.getBoundingClientRect().left
      );
    });
  expect(Math.abs(itemTextInset - pendingTextInset)).toBeLessThan(1);
  await expect(pendingRow.getByTestId('pending-item-quantity')).toHaveCSS('font-size', '14px');
  const pendingSummary = row.getByTestId('item-pending-summary');
  const pendingAtTwo = await pendingSummary.boundingBox();
  await row.getByTestId('item-quantity-decrement').tap();
  await expect(row.getByTestId('item-quantity-summary')).toHaveAttribute('aria-hidden', 'true');
  const pendingAtOne = await pendingSummary.boundingBox();
  expect(Math.abs(pendingAtOne.x - pendingAtTwo.x)).toBeLessThan(1);
  await row.getByTestId('item-quantity-increment').tap();
  await category.getByTestId('category-checkbox').tap();
  await expect(category).toHaveAttribute('data-completed', 'true');
  await trigger.tap();
  await expect(row).toHaveCSS('background-color', 'rgb(227, 242, 232)');
  await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.screenshot({ path: test.info().outputPath('webkit-tablet-open.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await expect
    .poll(async () => {
      const positions = await Promise.all(
        [name, addLabel].map((locator) =>
          locator.evaluate(
            (element) =>
              element.getBoundingClientRect().left +
              parseFloat(getComputedStyle(element).paddingLeft)
          )
        )
      );
      return Math.abs(positions[0] - positions[1]);
    })
    .toBeLessThan(1);
  await expect
    .poll(async () => {
      const plus = await category.getByTestId('add-item-button-icon').boundingBox();
      const checkbox = await row.getByTestId('item-checkbox').boundingBox();
      return Math.abs(plus.x + plus.width / 2 - checkbox.x - checkbox.width / 2);
    })
    .toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Test Case 4: Short mobile drawer supports checklist and language navigation in WebKit.
test('WebKit short mobile sidebar keeps navigation reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 200 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'packingListApp',
      JSON.stringify({
        checklists: Array.from({ length: 5 }, (_, index) => ({
          id: `short-${index}`,
          name: `Trip ${index}`,
          order: 5 - index,
        })),
        categories: [],
        items: [],
        selectedChecklistId: 'short-0',
      })
    );
  });
  await page.goto('/');
  await page.getByTestId('topbar-toggle').tap();
  const drawer = page.getByTestId('overlay-sidebar');
  const item = drawer.getByTestId('sidebar-checklist-item').filter({ hasText: 'Trip 3' });
  await item.scrollIntoViewIfNeeded();
  await item.tap();
  await expect(drawer).toHaveCount(0);
  await page.getByTestId('topbar-toggle').tap();
  const language = drawer.getByTestId('sidebar-language-button');
  await language.scrollIntoViewIfNeeded();
  await language.tap();
  const option = drawer.getByTestId('sidebar-language-option-zh-TW');
  await option.scrollIntoViewIfNeeded();
  await option.tap();
  await expect(language).toHaveAttribute('aria-expanded', 'false');
});
