---
name: feature-completion
description: Review and verify a completed user-facing feature across implementation, tests, accessibility, internationalization, documentation, and scoped validation. Use before handoff for meaningful behavior changes, not routine formatting or documentation-only edits.
argument-hint: '[feature scope/path/acceptance criteria]'
---

# Feature Completion Review

Use this skill to establish evidence that a feature is ready for manual review or handoff. It is a risk-based completion workflow, not a template for a particular product feature.

## 1. Establish Scope and Oracle

1. Read the applicable product specification, changed source files, and user-provided acceptance criteria.
2. Inspect the diff before judging completeness. Keep unrelated existing changes intact.
3. State the observable user behavior being verified. Do not treat an existing test as proof that the behavior is correct.

## 2. Coordinate Specialized Reviews

Use the smallest applicable set of reviews; do not repeat their work here.

| Need                                                                      | Skill                        |
| ------------------------------------------------------------------------- | ---------------------------- |
| Source-code correctness, state/data flow, and scoped implementation risks | `code-review`                |
| Independent test architecture, effectiveness, and missing-risk review     | `test-analysis`              |
| Bilingual product, code-quality, or test-documentation parity             | Relevant `doc-audit-*` Skill |

For source behavior changes, run `npm run test:coverage` and compare with a baseline only when it used the same configuration and comparable source scope. Coverage movement is a signal to investigate changed modules, never a standalone pass/fail condition.

## 3. Accessibility and Internationalization

For new or changed interactive UI, verify as applicable:

- Native semantics, text alternatives for icon-only controls, visible focus, and keyboard operation.
- Dialog/menu lifecycle: initial focus, `Escape`, pointer dismissal where supported, `Tab` behavior, and focus return.
- Desktop and narrow viewport behavior when layout or controls differ.
- Both supported locales, translated labels/messages, and locale-independent data behavior.

`npm run lint` provides static accessibility checks only. Runtime keyboard/focus behavior needs component or E2E coverage and, where appropriate, manual verification. The existing i18n parity tests check locale key structure; they do not replace behavior checks for changed UI text.

## 4. Documentation and Repository Hygiene

1. Update `docs/product-spec*.md`, `docs/code-quality*.md`, or `docs/testing-guide*.md` only when the feature changes the contract, convention, or documented inventory.
2. Keep paired English and Traditional Chinese documents structurally aligned. Some `*-zh.md` files are intentionally ignored by Git in this repository; still update and verify them in the working tree, and explicitly report that they will not appear in `git status`.
3. Follow `AGENTS.md` for Vue attribute order, Tailwind class order, naming, and paired documentation rules.
4. Do not broaden the diff with unrelated cleanup or create feature-specific Skills unless the workflow is genuinely reusable across the project.

## 5. Validation and Handoff

Run only the checks relevant to the scope, normally choosing from:

```bash
npm run validate
npm run test:run
npm run test:coverage
npm run test:inventory
npx playwright test
```

Run `npm run test:inventory` after changing test files or `testing-guide*.md`; use `npm run test:inventory:sync` only when executed results should update generated guide counts. Report commands run, outcomes, intentional omissions, coverage comparison (if available), manual test steps, and remaining risks. Do not install dependencies, alter Git state, or create commits unless the user explicitly authorizes it.
