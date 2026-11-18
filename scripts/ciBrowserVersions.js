/* Record versions from the browsers actually launched by Playwright. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { chromium, webkit } from 'playwright';

const require = createRequire(import.meta.url);
const output = resolve('.container-test-artifacts', 'native-metadata');
mkdirSync(output, { recursive: true });
const versions = { playwright: require('@playwright/test/package.json').version, browsers: {} };

for (const [name, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    versions.browsers[name] = { version: browser.version() };
  } finally {
    await browser.close();
  }
}
writeFileSync(resolve(output, 'browser-versions.json'), JSON.stringify(versions, null, 2));
