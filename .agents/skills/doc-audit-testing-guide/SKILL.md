---
name: doc-audit-testing-guide
description: Audit test documentation and numbering against executed results; repair inconsistencies when authorized.
argument-hint: '[scope/path/extra constraints]'
---

# Test Documentation Consistency Audit

---

## 0. Role and Mission

You are a senior QA / test documentation reviewer. Your mission is to:

- Analyze and investigate first
- Fix documentation and comments only when the active workflow authorizes edits; otherwise report inconsistencies
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
6. `docs/testing-guide.md` and `docs/testing-guide-zh.md` must be mutual translations with the same structure, statistics, inventory, and line count
7. Test-inventory sections must follow the documented layer order: Unit, Component, then E2E. Do not append a new layer subsection after a later layer merely to minimize an edit.

---

## 2. Mandatory Rules (Must Follow)

1. Do not infer execution results from documentation or test collection alone.
2. Reuse a completed full gate's actual Vitest coverage and Playwright reports
   when the evidence satisfies `$feature-completion`'s candidate, scope,
   configuration, environment, provenance and result requirements. The full gate
   already executes the runners and `test:inventory:ci`; do not rerun them solely
   for this audit. A `--docs` gate does not supply test evidence. If suitable
   evidence is unavailable, execute the necessary runners and inventory audit;
   distinguish collected tests from successfully executed tests.

3. When any command fails, must preserve:
   - Failed command
   - Error summary
   - Impact scope on conclusions

4. High-confidence conclusions must include evidence (file path + line number + command output summary).
5. Report-only requests do not authorize edits. Fix documentation and comments only when the active workflow authorizes the repair.
6. `docs/testing-guide.md` and `docs/testing-guide-zh.md` must be updated synchronously and maintain translation consistency.
7. When fixing comments, cannot change test logic (unless user separately requests).
8. Keep both paired documents tracked in Git; their changes must appear together in the review diff.

---

## 3. Recommended Execution Flow (Investigate → Fix)

1. Locate matching completed execution and coverage evidence, or run the missing
   checks. Treat coverage as a recorded run snapshot; investigate meaningful
   changes rather than repeatedly rerunning to chase incidental variance.
2. Parse Vitest and Playwright:
   - Vitest: Total / Unit / Component
   - Playwright: E2E test total and file count

3. Use the successful final gate's `npm run test:inventory:ci` result, or audit
   verified matching reports with that command. If no reusable reports exist,
   `npm run test:inventory` executes both suites and audits their results. Both
   check counts, parameterized expansion, comments and available guides; confirm
   both paired guides exist before claiming bilingual audit completion.
4. Only after successful, matching complete executions, use
   `npm run test:inventory:ci -- --write` to sync counts from retained reports;
   follow with the read-only audit. `npm run test:inventory:sync` instead executes
   the suites again. Neither command renumbers test comments.

5. Compare documentation:
   - `docs/testing-guide.md`
   - `docs/testing-guide-zh.md`

6. Key verification of section 8:
   - Layer totals
   - File case counts
   - Table entry count and numbering
   - Unit → Component → E2E heading and subsection order

7. When edits are authorized, fix inconsistencies (documentation + comments), then re-run necessary commands and scripts to confirm convergence. Otherwise report them.

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
   - Coverage snapshot (Line / Statement / Branch, run and relevant variance)

2. Actual fix list
   - Modified file paths
   - 1-3 key fixes per file
   - For report-only audits, state that no fixes were applied and list each
     evidenced inconsistency with its location and required correction.

3. Unresolved items (if any)
   - Blocking reasons
   - Next steps

4. Final conclusion
   - `Document and comment numbering audit: PASSED`
   - or `Document and comment numbering audit: FAILED`

---

## 6. Additional Requirements

1. If `it.each` comment descriptions (e.g., `Tests 28-31, 33`) are inconsistent with actual expansion, report the mismatch; when repair is authorized, change them to sequential and readable ranges.
2. If either `docs/testing-guide.md` or `docs/testing-guide-zh.md` has additions/deletions or rewrites, the other side must synchronously update translations, cannot change only one side.
3. `scripts/test-inventory.js` is the authoritative automated check for test-count and inventory drift. Do not manually adjust generated totals or heading counts without following it.
