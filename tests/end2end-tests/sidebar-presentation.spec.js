/*
================================================================================
File: tests/end2end-tests/sidebar-presentation.spec.js
Description: Sidebar typography, collapsed navigation and settings presentation.
License: MIT (SPDX: MIT)
================================================================================
*/

import { expect, test } from '@playwright/test';

const scenarios = [
  { name: 'phone', viewport: { width: 390, height: 844 }, hasTouch: true },
  { name: 'tablet', viewport: { width: 820, height: 1180 }, hasTouch: true },
  { name: 'desktop', viewport: { width: 1280, height: 800 }, hasTouch: false },
];

/**
 * Read the visible row geometry and typography rather than its CSS class names.
 * @param {import('@playwright/test').Locator} locator - Visible menu option.
 * @returns {Promise<object>} Computed row presentation.
 */
async function rowStyle(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
    };
  });
}

// Test Cases 1-6: English and Traditional Chinese presentation on phone, tablet, and desktop.
for (const scenario of scenarios) {
  test.describe(scenario.name, () => {
    test.use({ viewport: scenario.viewport, hasTouch: scenario.hasTouch });

    for (const locale of ['en', 'zh-TW']) {
      test(`sidebar presentation stays consistent in ${locale}`, async ({ page }) => {
        await page.addInitScript((language) => {
          localStorage.setItem('user-locale', language);
          localStorage.setItem(
            'packingListApp',
            JSON.stringify({
              checklists: [
                { id: 'trip-1', name: '新清單：日本與加拿大旅行', order: 1 },
                { id: 'trip-2', name: 'Travel checklist with a longer name', order: 0 },
              ],
              categories: [],
              items: [],
              selectedChecklistId: 'trip-1',
            })
          );
          localStorage.setItem(
            'packingListTemplates',
            JSON.stringify(
              Array.from({ length: 20 }, (_, index) => ({
                id: `template-${index}`,
                name: `範本 Template ${index}`,
                order: index,
                categories: [],
                items: [],
              }))
            )
          );
        }, locale);
        await page.goto('/');
        if (scenario.name === 'phone') await page.getByTestId('topbar-toggle').click();
        if (scenario.name === 'tablet') {
          const frames = await page.evaluate(async () => {
            document.querySelector('[data-testid="sidebar-toggle"]').click();
            const started = performance.now();
            const samples = [];
            await new Promise((resolve) => {
              const sample = () => {
                const menu = document.querySelector('[data-sidebar-delayed-menu]');
                if (menu) {
                  const style = getComputedStyle(menu);
                  samples.push({
                    elapsed: performance.now() - started,
                    opacity: Number(style.opacity),
                    visibility: style.visibility,
                  });
                }
                if (performance.now() - started < 550) requestAnimationFrame(sample);
                else resolve();
              };
              requestAnimationFrame(sample);
            });
            return samples;
          });
          const earlyFrames = frames.filter((frame) => frame.elapsed < 200);
          expect(earlyFrames.length).toBeGreaterThan(0);
          expect(
            earlyFrames.every((frame) => frame.opacity === 0 && frame.visibility === 'hidden')
          ).toBe(true);
          expect(frames.at(-1).opacity).toBe(1);
          expect(frames.at(-1).visibility).toBe('visible');
        }
        const sidebar = page.locator('aside');
        await expect(sidebar).toHaveAttribute('data-expanded', 'true');
        const labels = sidebar.locator('[data-sidebar-label]');
        await expect(labels).toHaveCount(3);
        for (const label of await labels.all()) await expect(label).toHaveCSS('opacity', '1');
        const labelStyles = await labels.evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return {
              x: element.getBoundingClientRect().x,
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
            };
          })
        );
        expect(new Set(labelStyles.map((style) => style.x)).size).toBe(1);
        expect(new Set(labelStyles.map((style) => style.fontSize)).size).toBe(1);
        expect(new Set(labelStyles.map((style) => style.lineHeight)).size).toBe(1);

        await page.getByTestId('sidebar-templates-button').click();
        const templateMenu = page.getByTestId('sidebar-templates-dropdown');
        const templateStyle = await rowStyle(page.getByTestId('sidebar-template-use-template-0'));
        await page.screenshot({ path: test.info().outputPath('sidebar-templates-menu.png') });
        await page.getByTestId('sidebar-template-use-template-19').scrollIntoViewIfNeeded();
        await expect(templateMenu).toBeVisible();
        expect(await templateMenu.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('sidebar-templates-button')).toBeFocused();
        await page.getByTestId('sidebar-language-button').click();
        const languageStyle = await rowStyle(
          page.getByTestId(`sidebar-language-option-${locale === 'en' ? 'zh-TW' : 'en'}`)
        );
        expect(languageStyle).toEqual(templateStyle);
        await page.screenshot({ path: test.info().outputPath('sidebar-language-menu.png') });
        await page.getByTestId('sidebar-language-button').click();
        const overflow = sidebar.locator('[data-testid^="overflow-trigger-checklist-"]').first();
        if (scenario.hasTouch) {
          const name = sidebar.locator('[data-sidebar-checklist-label]').first();
          const [nameBounds, menuBounds] = await Promise.all([
            name.boundingBox(),
            overflow.boundingBox(),
          ]);
          expect(nameBounds.x + nameBounds.width).toBeLessThanOrEqual(menuBounds.x);
        }
        await overflow.click();
        const overflowStyle = await rowStyle(
          page.locator('[data-testid^="overflow-action-edit-checklist-"]').first()
        );
        expect(templateStyle).toEqual(overflowStyle);
        await page.keyboard.press('Escape');

        if (scenario.name !== 'phone') {
          await page.getByTestId('sidebar-toggle').click();
          await expect(sidebar).toHaveAttribute('data-expanded', 'false');
          await expect(page.locator('main')).toHaveCSS('filter', 'none');
          const tiles = sidebar.getByTestId('sidebar-checklist-item');
          for (const tile of await tiles.all()) {
            const initial = tile.locator('[data-sidebar-initial]');
            await expect(initial).toHaveCSS('opacity', '1');
            const geometry = await initial.evaluate((element) => {
              const text = document.createRange();
              text.selectNodeContents(element);
              const glyph = text.getBoundingClientRect();
              const tile = element.closest('button').getBoundingClientRect();
              const rail = element.closest('aside').getBoundingClientRect();
              return {
                left: glyph.left - tile.left,
                right: tile.right - glyph.right,
                center: glyph.left + glyph.width / 2 - tile.left - tile.width / 2,
                railCenter: glyph.left + glyph.width / 2 - rail.left - rail.width / 2,
              };
            });
            expect(geometry.left).toBeGreaterThan(0);
            expect(geometry.right).toBeGreaterThan(0);
            expect(Math.abs(geometry.center)).toBeLessThan(1);
            expect(Math.abs(geometry.railCenter)).toBeLessThan(1);
          }
          await page.screenshot({ path: test.info().outputPath('sidebar-collapsed.png') });
          await page.getByTestId('sidebar-language-button').click();
          expect(
            (await page.getByTestId('sidebar-language-dropdown').boundingBox()).width
          ).toBeGreaterThanOrEqual(200);
          await expect(page.getByTestId('sidebar-language-option-en')).toBeVisible();
          await page.keyboard.press('Escape');
          await page.getByTestId('sidebar-toggle').click();
          await expect(sidebar).toHaveAttribute('data-expanded', 'true');
          const animation = await labels.evaluateAll((elements) =>
            elements.map((element) => {
              const style = getComputedStyle(element);
              return [style.animationName, style.animationDuration, style.animationDelay];
            })
          );
          expect(new Set(animation.map((entry) => JSON.stringify(entry))).size).toBe(1);
          for (const label of await labels.all()) await expect(label).toHaveCSS('opacity', '1');
          if (scenario.name === 'tablet') {
            await page.getByTestId('sidebar-toggle').click();
            await page.getByTestId('sidebar-toggle').click();
            await expect(sidebar.locator('[data-sidebar-delayed-menu]').first()).toHaveCSS(
              'opacity',
              '1'
            );
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.getByTestId('sidebar-toggle').click();
            await page.getByTestId('sidebar-toggle').click();
            const menu = sidebar.locator('[data-sidebar-delayed-menu]').first();
            await expect(menu).toHaveCSS('animation-name', 'none');
            await expect(menu).toHaveCSS('visibility', 'visible');
            await expect(menu).toHaveCSS('opacity', '1');
          }
        }
        await page.screenshot({ path: test.info().outputPath('sidebar-expanded.png') });
      });
    }
  });
}
