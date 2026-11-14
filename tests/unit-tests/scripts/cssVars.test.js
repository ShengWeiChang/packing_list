import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

import {
  checkThemeCss,
  generateThemeCss,
  normalizeColor,
  parseThemeColors,
} from '../../../scripts/cssVars.js';

const source = readFileSync('source/utils/constants.ts', 'utf8');
const actualStylesheet = readFileSync('source/index.css', 'utf8');
const stylesheet = generateThemeCss(source, actualStylesheet);
const temporaryDirectories = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

// Derive mutations from the current theme, so valid palette changes do not break tests.
const colors = parseThemeColors(source);
const [variable, originalValue] = colors.entries().next().value;
const sourceKey = variable.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const sourceEntry = source.match(new RegExp(`^\\s*${sourceKey}: '[^']+',?`, 'm'))?.[0];
const declaration = `${variable}: ${originalValue};`;
const changedValue = originalValue === '#010203' ? '#040506' : '#010203';

/** Replace a fixture fragment and fail if the intended mutation did not happen.
 * @param {string} text - Original fixture.
 * @param {string} before - Fragment to replace.
 * @param {string} after - Replacement fragment.
 * @returns {string} Modified fixture.
 */
function mutate(text, before, after) {
  expect(before).toBeTruthy();
  expect(text).toContain(before);
  const result = text.replace(before, after);
  expect(result).not.toBe(text);
  return result;
}

describe('theme CSS consistency', () => {
  // Test Group 1: Theme generation and consistency
  // Test Case 1: Normalize and validate supported color values
  it('normalizes opaque and translucent values independently of the generator', () => {
    expect(normalizeColor('rgba(33, 33, 33, 1)')).toBe('#212121');
    expect(normalizeColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)');
    expect(() => normalizeColor('rgba(256, 0, 0, 1)')).toThrow('Invalid color');
    expect(() => normalizeColor('rgba(0, 0, 0, 2)')).toThrow('Invalid color');
  });

  // Test Case 2: Detect missing, extra, duplicate and changed CSS variables
  it('validates current declarations and catches missing, extra, duplicate and drifted variables', () => {
    expect(checkThemeCss(source, actualStylesheet)).toBe(colors.size);
    expect(() => checkThemeCss(source, mutate(stylesheet, declaration, ''))).toThrow(
      `missing ${variable}`
    );
    expect(() =>
      checkThemeCss(source, mutate(stylesheet, declaration, `${variable}: ${changedValue};`))
    ).toThrow(`changed ${variable}`);
    expect(() =>
      checkThemeCss(source, mutate(stylesheet, declaration, `${declaration}\n  ${declaration}`))
    ).toThrow('Duplicate CSS variable');
    // Place the extra declaration before the end marker.
    const endMarker = '  /* END GENERATED THEME COLORS */';
    expect(() =>
      checkThemeCss(
        source,
        mutate(stylesheet, endMarker, `  --test-unexpected: #123456;\n${endMarker}`)
      )
    ).toThrow('extra --test-unexpected');
    expect(() =>
      checkThemeCss(source, `${stylesheet}\n:root { ${variable}: ${changedValue}; }`)
    ).toThrow('outside the generated region');
    expect(() =>
      checkThemeCss(source, `${stylesheet}\n:root, body { ${variable}: ${changedValue}; }`)
    ).toThrow('outside the generated region');
    expect(() =>
      checkThemeCss(source, `${stylesheet}\n:root { & { ${variable}: ${changedValue}; } }`)
    ).toThrow('outside the generated region');
  });

  // Test Case 3: Reject incomplete or unsupported source entries
  it('rejects unsupported, duplicate, missing, and ungrouped source entries', () => {
    expect(() =>
      parseThemeColors(mutate(source, sourceEntry, `  ${sourceKey}: '#123456',`))
    ).toThrow('Unsupported THEME_COLORS entry');
    expect(() =>
      parseThemeColors(
        mutate(source, sourceEntry, `  testExtraColor: 'rgba(1, 2, 3, 1)',\n${sourceEntry}`)
      )
    ).toThrow('ungrouped --test-extra-color');
    expect(() =>
      parseThemeColors(mutate(source, sourceEntry, `${sourceEntry}\n${sourceEntry}`))
    ).toThrow('Duplicate theme variable');
    expect(() => parseThemeColors(mutate(source, sourceEntry, ''))).toThrow(
      `missing constants ${variable}`
    );
  });

  // Test Case 4: Preserve manual CSS and validate ownership markers
  it('protects manual CSS outside the marked region and fails for missing markers', () => {
    const manual = stylesheet.replace(
      '  /* END GENERATED THEME COLORS */',
      '  /* END GENERATED THEME COLORS */\n  --manual-color: #123456;'
    );
    const replacementColor = originalValue === '#010203' ? 'rgba(4, 5, 6, 1)' : 'rgba(1, 2, 3, 1)';
    const changed = mutate(
      source,
      sourceEntry,
      sourceEntry.replace(/'[^']+'/, `'${replacementColor}'`)
    );
    expect(generateThemeCss(source, stylesheet)).toBe(stylesheet);
    expect(checkThemeCss(source, mutate(stylesheet, declaration, `${declaration} `))).toBe(
      colors.size
    );
    const shortSource = mutate(
      source,
      sourceEntry,
      sourceEntry.replace(/'[^']+'/, "'rgba(17, 34, 51, 1)'")
    );
    const shortCss = generateThemeCss(shortSource, stylesheet);
    expect(
      checkThemeCss(shortSource, mutate(shortCss, `${variable}: #112233;`, `${variable} : #123;`))
    ).toBe(colors.size);
    expect(
      checkThemeCss(
        shortSource,
        mutate(shortCss, `${variable}: #112233;`, `${variable} : rgb(17, 34, 51);`)
      )
    ).toBe(colors.size);
    const generated = generateThemeCss(changed, manual);
    expect(generated).toContain(`${variable}: ${changedValue};`);
    expect(generated).toContain('  --manual-color: #123456;');
    expect(generated.slice(generated.indexOf('\n}\n'))).toBe(manual.slice(manual.indexOf('\n}\n')));
    expect(generateThemeCss(changed, generated)).toBe(generated);
    expect(() =>
      checkThemeCss(source, stylesheet.replace('  /* END GENERATED THEME COLORS */', ''))
    ).toThrow(/markers/);
    expect(() =>
      generateThemeCss(source, mutate(manual, '--manual-color: #123456;', `${variable}: #000000;`))
    ).toThrow(/outside the generated region/);
  });

  // Test Case 5: Check and regenerate a drifted fixture through the CLI
  it('CLI check is read-only and returns a useful failure for a drifted fixture', () => {
    const directory = mkdtempSync(join(tmpdir(), 'packing-theme-check-'));
    temporaryDirectories.push(directory);
    mkdirSync(join(directory, 'source', 'utils'), { recursive: true });
    mkdirSync(join(directory, 'scripts'));
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
    writeFileSync(join(directory, 'build-css-vars.js'), readFileSync('build-css-vars.js'));
    writeFileSync(join(directory, 'scripts', 'cssVars.js'), readFileSync('scripts/cssVars.js'));
    writeFileSync(join(directory, 'source', 'utils', 'constants.ts'), source);
    const cssFile = join(directory, 'source', 'index.css');
    const drifted = mutate(stylesheet, declaration, `${variable}: ${changedValue};`);
    writeFileSync(cssFile, drifted);
    const result = spawnSync(process.execPath, [join(directory, 'build-css-vars.js'), '--check'], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`changed ${variable}`);
    expect(result.stderr).toContain('npm run build:css-vars');
    expect(readFileSync(cssFile, 'utf8')).toBe(drifted);
    execFileSync(process.execPath, [join(directory, 'build-css-vars.js')]);
    expect(checkThemeCss(source, readFileSync(cssFile, 'utf8'))).toBe(colors.size);
    expect(
      spawnSync(process.execPath, [join(directory, 'build-css-vars.js'), '--check']).status
    ).toBe(0);
  });
});
