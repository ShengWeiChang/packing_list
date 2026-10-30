/*
================================================================================
File: scripts/checkTypeScriptContracts.js
Description: Prove that intentional TS and Vue template errors fail the checker.
License: MIT (SPDX: MIT)
================================================================================
*/

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const CHECKER = resolve(PROJECT_ROOT, 'node_modules/vue-tsc/bin/vue-tsc.js');
const directory = mkdtempSync(join(tmpdir(), 'packing-list-type-diagnostics-'));

try {
  for (const fixture of ['InvalidTypeScript.ts', 'InvalidTemplate.vue']) {
    const path = resolve(PROJECT_ROOT, 'tests/type-tests/fixtures', fixture);
    const config = join(directory, 'tsconfig.json');
    writeFileSync(
      config,
      JSON.stringify({
        extends: resolve(PROJECT_ROOT, 'tsconfig.app.json'),
        compilerOptions: {
          allowJs: false,
          rootDir: PROJECT_ROOT,
          typeRoots: [
            resolve(PROJECT_ROOT, 'node_modules/@types'),
            resolve(PROJECT_ROOT, 'node_modules'),
          ],
        },
        files: [path],
        include: [],
        exclude: [],
      })
    );
    const result = spawnSync(
      process.execPath,
      [CHECKER, '--noEmit', '--pretty', 'false', '-p', config],
      { cwd: PROJECT_ROOT, encoding: 'utf8' }
    );
    const output = `${result.stdout || ''}${result.stderr || ''}`;
    const diagnostics = [...output.matchAll(/^(.+)\(\d+,\d+\): error TS(\d+):/gm)];
    if (
      result.error ||
      result.signal ||
      result.status !== 2 ||
      diagnostics.length !== 1 ||
      !diagnostics.every(([, file, code]) => file.endsWith(fixture) && code === '2322')
    ) {
      throw new Error(
        `Expected only TS2322 in ${fixture}; checker returned ${result.status}.\n${output}${result.error || ''}`
      );
    }
    process.stdout.write(
      `Expected diagnostic verified: ${fixture} rejects an incorrect numeric value (TS2322).\n`
    );
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
