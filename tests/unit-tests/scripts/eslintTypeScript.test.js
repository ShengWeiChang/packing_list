/*
================================================================================
File: tests/unit-tests/scripts/eslintTypeScript.test.js
Description: Verify typed Vue lint protection and TypeScript parsing.
License: MIT (SPDX: MIT)
================================================================================
*/

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

describe('TypeScript Vue linting', () => {
  // Test Group 1: Script-language safety boundaries
  // Test Case 1: Reject explicit any in application Vue scripts
  it('rejects explicit any in a TypeScript application component', async () => {
    const [result] = await eslint.lintText(
      '<template><div>{{ value }}</div></template><script setup lang="ts">const value: any = 1;</script>',
      { filePath: 'source/components/Item.vue' }
    );
    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: '@typescript-eslint/no-explicit-any', severity: 2 }),
      ])
    );
  });

  // Test Case 2: Use TS scope analysis without false undefined-name reports on types
  it('parses typed Vue props without applying JavaScript undefined-name rules', async () => {
    const [result] = await eslint.lintText(
      '<template><div>{{ quantity }}</div></template>\n' +
        '<script setup lang="ts">\n' +
        'defineProps<Readonly<{ quantity: number }>>();\n' +
        '</script>',
      { filePath: 'tests/type-tests/fixtures/TypecheckProbe.vue' }
    );
    expect(result.messages).toEqual([]);
  });
});
