import { expect } from '@playwright/test';

/** Arm observation before the real click or keyboard event starts a drawer transition.
 * @param {import('@playwright/test').Page} page - Current test page.
 * @returns {Promise<void>}
 */
export async function armDrawerTransition(page) {
  await page.evaluate(() => {
    window.__drawerTransition = null;
    window.__drawerTransitionEvidence = [];
    // Keep the real transition pending until its event is observed, even if the
    // browser delivers transitionrun late. Its original duration stays unchanged.
    const delayStyle = document.createElement('style');
    delayStyle.textContent = '[data-testid=overlay-sidebar] { transition-delay: 10s !important; }';
    document.head.append(delayStyle);
    const onTransition = (event) => {
      const drawer = event.target;
      if (
        !(drawer instanceof HTMLElement) ||
        drawer.dataset.testid !== 'overlay-sidebar' ||
        event.propertyName !== 'transform'
      )
        return;
      document.removeEventListener('transitionrun', onTransition, true);
      const animations = drawer.getAnimations();
      window.__drawerTransitionEvidence.push({
        property: event.propertyName,
        animations: animations.map((entry) => ({
          property: entry.transitionProperty,
          state: entry.playState,
          time: entry.currentTime,
        })),
      });
      const animation = animations.find((entry) => entry.transitionProperty === 'transform');
      if (animation) {
        animation.pause();
        // Read the product's timing without our temporary delay. Changing a
        // transition timing declaration does not change an already-created transition.
        delayStyle.media = 'not all';
        const css = getComputedStyle(drawer);
        const properties = css.transitionProperty.split(',').map((value) => value.trim());
        const delays = css.transitionDelay.split(',').map((value) => value.trim());
        const index = properties.reduce(
          (last, value, position) => (value === 'transform' || value === 'all' ? position : last),
          -1
        );
        const originalDelay = delays[(index < 0 ? 0 : index) % delays.length];
        delayStyle.media = '';
        window.__drawerTransition = { animation, drawer, originalDelay };
      }
    };
    window.__drawerTransitionCleanup = () => {
      document.removeEventListener('transitionrun', onTransition, true);
      delayStyle.remove();
    };
    document.addEventListener('transitionrun', onTransition, true);
  });
}

/** Sample the actual transition at controlled times, then let it finish normally.
 * @param {import('@playwright/test').Page} page - Current test page.
 * @returns {Promise<Array<{x: number, width: number, inert: boolean}>>} Measured states.
 */
export async function sampleDrawerTransition(page) {
  try {
    await expect.poll(() => page.evaluate(() => Boolean(window.__drawerTransition))).toBe(true);
  } catch (error) {
    const evidence = await page.evaluate(() => {
      const recorded = window.__drawerTransitionEvidence;
      window.__drawerTransitionCleanup?.();
      return recorded;
    });
    throw new Error(`Drawer transition not captured: ${JSON.stringify(evidence)}`, {
      cause: error,
    });
  }
  return page.evaluate(async () => {
    const { animation, drawer, originalDelay } = window.__drawerTransition;
    try {
      await animation.ready;
      const { delay, duration } = animation.effect.getComputedTiming();
      if (typeof duration !== 'number' || duration <= 0)
        throw new Error('Drawer transition has no duration');
      const productDelay = parseFloat(originalDelay) * (originalDelay.endsWith('ms') ? 1 : 1000);
      if (!Number.isFinite(productDelay) || Math.max(0, productDelay) + duration > 350)
        throw new Error(
          `Drawer transition is too slow: delay=${originalDelay}, duration=${duration}ms`
        );
      return [0, duration / 2, duration].map((time) => {
        animation.currentTime = delay + time;
        const box = drawer.getBoundingClientRect();
        return { x: box.x, width: box.width, inert: drawer.inert };
      });
    } finally {
      animation.finish();
      window.__drawerTransitionCleanup?.();
      window.__drawerTransition = null;
    }
  });
}
