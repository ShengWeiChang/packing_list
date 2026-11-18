/* Failure-only evidence for short responsive menus. */
import os from 'node:os';
import process from 'node:process';

/**
 * Attach viewport, geometry, scrolling, and font metrics from the live page.
 * @param {import('@playwright/test').Page} page - Current test page.
 * @param {import('@playwright/test').TestInfo} testInfo - Current test.
 * @returns {Promise<void>}
 */
export async function attachShortMenuDiagnostics(page, testInfo) {
  const diagnostics = await page.evaluate(() => {
    const measure = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        testId: element.getAttribute('data-testid'),
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        availableWidth: element.parentElement?.clientWidth ?? null,
        scroll: {
          top: element.scrollTop,
          height: element.scrollHeight,
          clientHeight: element.clientHeight,
        },
        font: { family: style.fontFamily, size: style.fontSize, lineHeight: style.lineHeight },
        lineRects: range.getClientRects().length,
      };
    };
    const triggers = document.querySelectorAll('[data-testid^="overflow-trigger-checklist-"]');
    const trigger = triggers[triggers.length - 1];
    const menu = document.querySelector('[data-testid^="overflow-dropdown-checklist-"]');
    return {
      time: performance.now(),
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      userAgent: navigator.userAgent,
      trigger: measure(trigger),
      menu: measure(menu),
      actions: menu ? [...menu.querySelectorAll('button')].map(measure) : [],
      animations: document.getAnimations().map((animation) => ({
        playState: animation.playState,
        currentTime: animation.currentTime,
      })),
    };
  });
  await testInfo.attach('short-menu-diagnostics', {
    body: JSON.stringify(
      {
        environment: {
          platform: os.platform(),
          release: os.release(),
          architecture: os.arch(),
          node: process.version,
          browser: page.context().browser()?.version(),
          project: testInfo.project.name,
        },
        ...diagnostics,
      },
      null,
      2
    ),
    contentType: 'application/json',
  });
}

const dateLayoutBefore = new WeakMap();

/**
 * Collect date editing geometry without including field values or text.
 * @param {import('@playwright/test').Page} page - Current test page.
 * @returns {Promise<object>} Measured geometry.
 */
async function dateLayout(page) {
  return page.evaluate(() => {
    const measure = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        availableWidth: element.parentElement?.getBoundingClientRect().width ?? null,
        scroll: {
          top: element.scrollTop,
          height: element.scrollHeight,
          clientHeight: element.clientHeight,
        },
        font: { family: style.fontFamily, size: style.fontSize, lineHeight: style.lineHeight },
        box: {
          boxSizing: style.boxSizing,
          display: style.display,
          appearance: style.appearance,
          padding: style.padding,
          border: style.borderWidth,
        },
        lineRects: range.getClientRects().length,
      };
    };
    const main = document.querySelector('main');
    const name = main?.querySelector('[data-testid="checklist-name"]');
    const nameInput = main?.querySelector('[data-testid="checklist-name-input"]');
    return {
      time: performance.now(),
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      main: measure(main),
      name: measure(name),
      nameInput: measure(nameInput),
      nameContainer: measure((name ?? nameInput)?.parentElement),
      activeElement: document.activeElement?.getAttribute('data-testid') ?? null,
      dateDisplay: measure(main?.querySelector('span[role="button"]')),
      dates: [...(main?.querySelectorAll('input[type="date"]') ?? [])].map(measure),
      dateLabels: [...(main?.querySelectorAll('label:has(input[type="date"])') ?? [])].map(measure),
      trigger: measure(main?.querySelector('[data-testid^="overflow-trigger-checklist-"]')),
      content: measure(main?.querySelector('[data-testid="category-card"]')),
      animations: document.getAnimations().map((animation) => ({
        playState: animation.playState,
        currentTime: animation.currentTime,
      })),
    };
  });
}

/**
 * Save the display-mode geometry before the editing gesture.
 * @param {import('@playwright/test').Page} page - Current test page.
 * @returns {Promise<void>}
 */
export async function rememberDateLayout(page) {
  dateLayoutBefore.set(page, await dateLayout(page));
}

/**
 * Attach both date-editing snapshots after a failure.
 * @param {import('@playwright/test').Page} page - Current test page.
 * @param {import('@playwright/test').TestInfo} testInfo - Current test.
 * @returns {Promise<void>}
 */
export async function attachDateLayoutDiagnostics(page, testInfo) {
  const before = dateLayoutBefore.get(page) ?? null;
  const after = await dateLayout(page);
  await testInfo.attach('date-layout-diagnostics', {
    body: JSON.stringify(
      {
        environment: {
          platform: os.platform(),
          release: os.release(),
          architecture: os.arch(),
          node: process.version,
          browser: page.context().browser()?.version(),
          project: testInfo.project.name,
        },
        before,
        after,
      },
      null,
      2
    ),
    contentType: 'application/json',
  });
  dateLayoutBefore.delete(page);
}
