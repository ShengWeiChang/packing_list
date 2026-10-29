/*
================================================================================
File: tests/unit-tests/scripts/eslintTypeScript.test.js
Description: Verify JS lint protection and TS parsing coexist during migration.
License: MIT (SPDX: MIT)
================================================================================
*/

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

describe('mixed-language Vue linting', () => {
  // Test Group 1: Script-language safety boundaries
  // Test Case 1: Keep undefined-name checks for an explicitly unmigrated JS SFC
  it('retains no-undef for a JavaScript application component', async () => {
    const [result] = await eslint.lintText(
      '<template><div /></template><script setup>missingFunction();</script>',
      { filePath: 'source/components/Item.vue' }
    );
    expect(result.messages).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'no-undef', severity: 2 })])
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
