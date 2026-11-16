import { writeFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test('intentional failure exercises artifact upload', async ({ page }, testInfo) => {
  await page.goto('about:blank');
  const attachmentPath = testInfo.outputPath('intentional-failure.json');
  await writeFile(attachmentPath, JSON.stringify({ probe: 'intentional failure' }));
  await testInfo.attach('intentional-failure', {
    path: attachmentPath,
    contentType: 'application/json',
  });
  expect('intentional failure').toBe('intentional success');
});
