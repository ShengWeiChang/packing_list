#!/usr/bin/env node
/* Generate or check CSS variables from the theme constants. */
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { checkThemeCss, generateThemeCss } from './scripts/cssVars.js';

const constantsPath = fileURLToPath(new URL('./source/utils/constants.ts', import.meta.url));
const cssPath = fileURLToPath(new URL('./source/index.css', import.meta.url));

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check'))
    throw new Error('Usage: node build-css-vars.js [--check]');
  const source = readFileSync(constantsPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  if (args[0] === '--check') {
    const count = checkThemeCss(source, css);
    console.log(`Theme CSS variables are consistent (${count} variables).`);
  } else {
    const updated = generateThemeCss(source, css);
    writeFileSync(cssPath, updated, 'utf8');
    console.log('CSS variables generated successfully!');
  }
} catch (error) {
  console.error(`Theme CSS validation failed: ${error.message}`);
  console.error(
    'Update theme definitions/groups or run npm run build:css-vars to regenerate the CSS.'
  );
  process.exitCode = 1;
}
