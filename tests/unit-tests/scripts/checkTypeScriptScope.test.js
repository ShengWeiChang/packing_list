/*
================================================================================
File: tests/unit-tests/scripts/checkTypeScriptScope.test.js
Description: Behavior tests for migration allowances and compiler scope coverage.
License: MIT (SPDX: MIT)
================================================================================
*/

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkTypeScriptScope } from '../../../scripts/checkTypeScriptScope.js';

let root;
let config;

/** Save the isolated test compiler configuration. */
function saveConfig() {
  writeFileSync(join(root, 'tsconfig.app.json'), JSON.stringify(config));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'packing-list-type-scope-'));
  mkdirSync(join(root, 'source'));
  config = {
    compilerOptions: { strict: true, noUncheckedIndexedAccess: true, noEmit: true, allowJs: true },
    include: ['source/**/*'],
    vueCompilerOptions: { strictTemplates: true },
  };
  saveConfig();
  writeFileSync(join(root, 'source/legacy.js'), 'export const value = 1;');
  writeFileSync(join(root, 'source/typed.ts'), 'export const value: number = 1;');
  writeFileSync(
    join(root, 'source/Legacy.vue'),
    '<template><div /></template><script setup>const value = 1;</script>'
  );
  writeFileSync(
    join(root, 'typescript-migration.json'),
    JSON.stringify({
      uncheckedJavaScript: ['source/legacy.js'],
      uncheckedVueScripts: ['source/Legacy.vue'],
    })
  );
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('TypeScript application scope', () => {
  // Test Group 1: Migration boundaries and compiler coverage
  // Test Case 1: Report compiler roots separately from unchecked migration files
  it('reports the exact remaining unchecked scope', () => {
    expect(checkTypeScriptScope(root)).toEqual({
      modules: 3,
      uncheckedJavaScript: 1,
      uncheckedVueScripts: 1,
    });
  });

  // Test Case 2: Reject new JavaScript outside the reviewed migration allowance
  it('rejects an unlisted JavaScript module', () => {
    writeFileSync(join(root, 'source/newModule.js'), 'export const value = 1;');
    expect(() => checkTypeScriptScope(root)).toThrow('Unlisted: source/newModule.js');
  });

  // Test Case 3: Reject typed files excluded from the compiler even if still imported
  it('rejects an excluded application module', () => {
    config.exclude = ['source/typed.ts'];
    saveConfig();
    expect(() => checkTypeScriptScope(root)).toThrow(
      'Source module missing from compiler roots: source/typed.ts'
    );
  });

  // Test Case 4: Detect JavaScript in a newly added Vue script
  it('rejects a new unchecked Vue component', () => {
    writeFileSync(join(root, 'source/NewComponent.vue'), '<script setup>const value = 1;</script>');
    expect(() => checkTypeScriptScope(root)).toThrow('Unlisted: source/NewComponent.vue');
  });

  // Test Case 5: Require allowances to shrink when a component is migrated
  it('rejects stale allowances after a Vue migration', () => {
    writeFileSync(
      join(root, 'source/Legacy.vue'),
      '<script setup lang="ts">const value: number = 1;</script>'
    );
    expect(() => checkTypeScriptScope(root)).toThrow('Stale: source/Legacy.vue');
  });

  // Test Case 6: Reject weakening a strict sub-option while keeping strict=true
  it('rejects strictNullChecks being disabled', () => {
    config.compilerOptions.strictNullChecks = false;
    saveConfig();
    expect(() => checkTypeScriptScope(root)).toThrow('must not disable strict sub-options');
  });

  // Test Case 7: Require explicit strict template checking
  it('rejects disabling template checks', () => {
    config.vueCompilerOptions.strictTemplates = false;
    saveConfig();
    expect(() => checkTypeScriptScope(root)).toThrow('must enable strictTemplates');
  });

  // Test Case 8: Allow the completed migration only without temporary bridges
  it('accepts an all-TypeScript source with no migration manifest', () => {
    rmSync(join(root, 'source/legacy.js'));
    writeFileSync(
      join(root, 'source/Legacy.vue'),
      '<script setup lang="ts">const value: number = 1;</script>'
    );
    rmSync(join(root, 'typescript-migration.json'));
    config.compilerOptions.allowJs = false;
    saveConfig();
    expect(checkTypeScriptScope(root)).toEqual({
      modules: 2,
      uncheckedJavaScript: 0,
      uncheckedVueScripts: 0,
    });
  });
});
