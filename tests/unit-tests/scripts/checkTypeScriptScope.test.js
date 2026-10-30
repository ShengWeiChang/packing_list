/*
================================================================================
File: tests/unit-tests/scripts/checkTypeScriptScope.test.js
Description: Behavior tests for TypeScript-only application compiler scope.
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
    compilerOptions: { strict: true, noUncheckedIndexedAccess: true, noEmit: true, allowJs: false },
    include: ['source/**/*'],
    vueCompilerOptions: { strictTemplates: true },
  };
  saveConfig();
  writeFileSync(join(root, 'source/typed.ts'), 'export const value: number = 1;');
  writeFileSync(
    join(root, 'source/Typed.vue'),
    '<script setup lang="ts">const value = 1;</script>'
  );
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('TypeScript application scope', () => {
  // Test Group 1: Permanent source boundaries and compiler coverage
  // Test Case 1: Accept every typed source module in compiler roots
  it('accepts an all-TypeScript application', () => {
    expect(checkTypeScriptScope(root)).toEqual({
      modules: 2,
      uncheckedJavaScript: 0,
      uncheckedVueScripts: 0,
    });
  });

  // Test Case 2: Reject JavaScript even when the compiler would omit it
  it('rejects a new JavaScript module', () => {
    writeFileSync(join(root, 'source/newModule.js'), 'export const value = 1;');
    expect(() => checkTypeScriptScope(root)).toThrow(
      'JavaScript application module is not supported'
    );
  });

  // Test Case 3: Reject typed files excluded from the compiler
  it('rejects an excluded application module', () => {
    config.exclude = ['source/typed.ts'];
    saveConfig();
    expect(() => checkTypeScriptScope(root)).toThrow(
      'Source module missing from compiler roots: source/typed.ts'
    );
  });

  // Test Case 4: Reject Vue scripts without TypeScript
  it('rejects a JavaScript Vue script', () => {
    writeFileSync(join(root, 'source/NewComponent.vue'), '<script setup>const value = 1;</script>');
    expect(() => checkTypeScriptScope(root)).toThrow(
      'Unsupported Vue script boundary: source/NewComponent.vue'
    );
  });

  // Test Case 5: Prevent the migration compiler bridge from returning
  it('rejects allowJs being enabled', () => {
    config.compilerOptions.allowJs = true;
    saveConfig();
    expect(() => checkTypeScriptScope(root)).toThrow('must disable allowJs');
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

  // Test Case 8: Check future source files, including declarations, without an inventory allowlist
  it('checks newly added source files for compiler inclusion', () => {
    writeFileSync(join(root, 'source/newContract.d.ts'), 'export type Id = string;');
    config.exclude = ['source/newContract.d.ts'];
    saveConfig();
    expect(() => checkTypeScriptScope(root)).toThrow(
      'Source module missing from compiler roots: source/newContract.d.ts'
    );
  });
});
