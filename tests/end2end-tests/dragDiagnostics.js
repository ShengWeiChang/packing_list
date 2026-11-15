/* Failure-only evidence for the edit-to-drag interaction. */
import os from 'node:os';
import process from 'node:process';

/**
 * Observe mouse/drag events and frame geometry without changing the gesture.
 * @param {import('@playwright/test').Page} page - Fixture page.
 * @returns {Promise<void>}
 */
export async function startDragDiagnostics(page) {
  await page.evaluate(() => {
    const events = [];
    const gestures = [];
    const selectors = {
      edited: '[data-testid="item-row"][data-item-id="a0"]',
      source: '[data-testid="item-row"][data-item-id="a1"]',
      input: '[data-testid="item-row"][data-item-id="a0"] [data-testid="item-edit-input"]',
      ghost: '.ghost-item',
      chosen: '.chosen-item',
    };
    const describe = (element) => {
      if (!(element instanceof Element)) return null;
      const box = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        testId: element.getAttribute('data-testid'),
        itemId: element.closest('[data-item-id]')?.getAttribute('data-item-id') ?? null,
        className: typeof element.className === 'string' ? element.className : '',
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
      };
    };
    let pointer = null;
    const savedNameState = () => {
      try {
        const data = JSON.parse(localStorage.getItem('packingListApp'));
        const name = data.items.find((item) => item.id === 'a0')?.name;
        if (name === 'Item a0') return 'original';
        if (name === 'Renamed before drag') return 'renamed';
        return 'other-or-missing';
      } catch {
        return 'unavailable';
      }
    };
    const sample = (kind, includeStorage = true) => ({
      kind,
      ...(includeStorage ? { savedNameState: savedNameState() } : {}),
      time: performance.now(),
      pointer,
      hit: pointer ? describe(document.elementFromPoint(pointer.x, pointer.y)) : null,
      active: describe(document.activeElement),
      elements: Object.fromEntries(
        Object.entries(selectors).map(([key, selector]) => [
          key,
          describe(document.querySelector(selector)),
        ])
      ),
    });
    for (const type of [
      'pointerdown',
      'pointermove',
      'mousedown',
      'mousemove',
      'dragstart',
      'dragend',
      'blur',
    ]) {
      document.addEventListener(
        type,
        (event) => {
          if ('clientX' in event) pointer = { x: event.clientX, y: event.clientY };
          if (events.length < 200) events.push({ ...sample(type), target: describe(event.target) });
        },
        true
      );
    }
    const markGesture = (label) => {
      const gesture = { label, startedAt: performance.now(), frames: [], truncated: false };
      gestures.push(gesture);
      const tick = () => {
        gesture.frames.push(sample('frame', false));
        if (gesture.frames.length < 120) requestAnimationFrame(tick);
        else gesture.truncated = true;
      };
      requestAnimationFrame(tick);
    };
    window.__packingListDragDiagnostics = { events, gestures, markGesture, sample };
  });
}

/**
 * Start a bounded frame window for one drag gesture.
 * @param {import('@playwright/test').Page} page - Fixture page.
 * @param {string} label - Synthetic fixture gesture label.
 * @returns {Promise<void>}
 */
export async function markDragGesture(page, label) {
  await page.evaluate((gestureLabel) => {
    window.__packingListDragDiagnostics.markGesture(gestureLabel);
  }, label);
}

/**
 * Attach the observation to a failed Playwright test without replacing its error.
 * @param {import('@playwright/test').Page} page - Fixture page.
 * @param {import('@playwright/test').TestInfo} testInfo - Current test.
 * @returns {Promise<void>}
 */
export async function attachDragDiagnostics(page, testInfo) {
  const observations = await page.evaluate(() => {
    const diagnostics = window.__packingListDragDiagnostics;
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      userAgent: navigator.userAgent,
      final: diagnostics.sample('failure'),
      events: diagnostics.events,
      gestures: diagnostics.gestures,
    };
  });
  await testInfo.attach('drag-edit-diagnostics', {
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
        ...observations,
      },
      null,
      2
    ),
    contentType: 'application/json',
  });
}
