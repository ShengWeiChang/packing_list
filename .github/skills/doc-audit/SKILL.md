---
name: doc-audit
description: Execute test documentation consistency audit by comparing actual test results, testing-guide (EN/ZH), and test comment numbering; fix inconsistencies directly.
argument-hint: '[scope/path/extra constraints]'
---

# Test Documentation Consistency Audit

---

## 0. Role and Mission

You are a senior QA / test documentation reviewer. Your mission is to:

- Analyze and investigate first
- Fix documentation and comments directly
- Output only concise fix results at the end

Audit and fix scope:

- Actual test execution results
- Documentation content (including EN/ZH `testing-guide`)
- Test comment numbering (`Test Group` / `Test Case`)

---

## 1. Audit Objectives

Ensure the following items are consistent, correct, and fixed:

1. Test totals and layer counts (Unit / Component / E2E / Total)
2. Coverage numbers (Line / Statement / Branch)
3. Document section 8 (complete test inventory) - case count and totals per file
4. Each test file's `Test Group` / `Test Case` numbering is sequential, no gaps, matches actual execution count
5. `it.each` / `test.each` expanded cases are correctly reflected in comments and documentation
6. `docs/testing-guide.md` and `docs/testing-guide-zh.md` must match content, be mutual translations (same structure, same statistics, same inventory)

---

## 2. Mandatory Rules (Must Follow)

1. Cannot infer from documentation alone - must actually execute tests to get latest numbers.
2. Required commands:
   - `npm run test:run`
   - `npm run test:coverage`
   - `npx playwright test --list`

3. When any command fails, must preserve:
   - Failed command
   - Error summary
   - Impact scope on conclusions

4. High-confidence conclusions must include evidence (file path + line number + command output summary).
5. When inconsistencies are found, must directly fix documentation and comments (not just suggestions, not just reports).
6. `docs/testing-guide.md` and `docs/testing-guide-zh.md` must be updated synchronously and maintain translation consistency.
7. When fixing comments, cannot change test logic (unless user separately requests).

---

## 3. Recommended Execution Flow (Investigate → Fix)

1. Run tests and coverage first to get latest numbers.
2. Parse Vitest and Playwright:
   - Vitest: Total / Unit / Component
   - Playwright: E2E test total and file count

3. If necessary, write and execute Python verification script, must include at minimum:
   - Scan `tests/**/*.test.js`, `tests/**/*.spec.js`
   - Calculate actual case count (including `it.each` / `test.each` expansion)
   - Check if `Test Group N`, `Test Case N` are sequentially sorted
   - Check if each file's "last `Test Case` index" equals actual case count

4. Compare documentation:
   - `docs/testing-guide.md`
   - `docs/testing-guide-zh.md`

5. Key verification of section 8:
   - Layer totals
   - File case counts
   - Table entry count and numbering

6. Directly fix all inconsistencies (documentation + comments), then re-run necessary commands and scripts to confirm convergence.

---

## 4. Required Scope

- Documentation:
  - `docs/testing-guide.md`
  - `docs/testing-guide-zh.md`

- Tests:
  - `tests/unit-tests/**`
  - `tests/component-tests/**`
  - `tests/end2end-tests/**`

---

## 5. Output Format (Concise)

Only output the following content, no lengthy reports needed:

1. Execution result summary
   - Command success/failure
   - Latest statistics (Unit / Component / E2E / Total)
   - Latest Coverage (Line / Statement / Branch)

2. Actual fix list
   - Modified file paths
   - 1-3 key fixes per file

3. Unresolved items (if any)
   - Blocking reasons
   - Next steps

4. Final conclusion
   - `Document and comment numbering audit: PASSED`
   - or `Document and comment numbering audit: FAILED`

---

## 6. Additional Requirements

1. If `it.each` comment descriptions (e.g., `Tests 28-31, 33`) are inconsistent with actual expansion, must change to sequential and readable ranges.
2. If either `docs/testing-guide.md` or `docs/testing-guide-zh.md` has additions/deletions or rewrites, the other side must synchronously update translations, cannot change only one side.
