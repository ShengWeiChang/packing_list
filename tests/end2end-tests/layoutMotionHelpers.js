/** Wait for active layout motion before measuring a real drag gesture.
 * @param {import('@playwright/test').Page} page - Active test page.
 * @returns {Promise<void>}
 */
export async function waitForLayoutMotion(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
        .map((animation) => animation.finished.catch(() => {}))
    );
  });
}
