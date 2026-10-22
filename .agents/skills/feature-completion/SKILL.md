---
name: feature-completion
description: Review and verify a completed user-facing feature across implementation, tests, accessibility, internationalization, documentation, repository hygiene, and scoped validation. Use before handoff for meaningful behavior changes, not routine formatting or documentation-only edits.
argument-hint: '[feature scope/path/acceptance criteria]'
---

# Feature Completion Review

Use this skill to establish evidence that a feature is ready for manual review or handoff. It is a risk-based completion workflow, not a template for a particular product feature.

## 1. Establish Scope and Oracle

1. Read the applicable product specification, changed source files, and user-provided acceptance criteria.
2. Inspect the diff before judging completeness. Keep unrelated existing changes intact.
3. State the observable user behavior being verified. Do not treat an existing test as proof that the behavior is correct.
4. Define a finish condition and the evidence that can prove it before declaring handoff. For a meaningful UI interaction, include a real user-flow check; command results alone do not prove an interaction is usable.

## 2. Coordinate Specialized Reviews

Use the smallest applicable set of reviews; do not repeat their work here.

| Need                                                                      | Skill                        |
| ------------------------------------------------------------------------- | ---------------------------- |
| Source-code correctness, state/data flow, and scoped implementation risks | `code-review`                |
| Independent test architecture, effectiveness, and missing-risk review     | `test-analysis`              |
| Bilingual product, code-quality, or test-documentation parity             | Relevant `doc-audit-*` Skill |
| Separate concept-learning guide after successful validation               | `feature-learning`           |

For a meaningful user-visible behavior change, run `npm run verify:feature`
before review. When delegation is available, assign applicable review skills to
a fresh, read-only reviewer context that did not implement the change. The
reviewer may inspect the diff and evidence, but must not edit implementation
files. After implementation fixes a finding, use a new fresh reviewer context
for the follow-up verdict.

When delegation is unavailable, perform the applicable reviews sequentially,
but label the handoff `degraded: no independent delegation`. Do not call this
an independent review. Follow the repository's constraints on concurrent file
edits.

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
2. Keep paired English and Traditional Chinese documents structurally aligned, with equivalent content and the same line count. Both files must be included in the Git diff.
3. Follow `AGENTS.md` for Vue attribute order, Tailwind class order, naming, and paired documentation rules.
4. Do not broaden the diff with unrelated cleanup or create feature-specific Skills unless the workflow is genuinely reusable across the project.

### Final Residue Audit

Before declaring the feature ready, perform a final pass specifically for traces left by implementation churn:

- Review tracked changes, untracked files, deletions, and relevant ignored files; identify scratch data, generated output, screenshots, review matrices, temporary migrations, or duplicate files that are not intended deliverables.
- When a concept was renamed, search for both the old and new terms across source, tests, selectors/test IDs, fixtures, comments, documentation, and filenames. Treat inconsistent terminology or identifiers as incomplete migration, even when runtime behavior still works.
- Verify that code and filenames cited in translated documentation exactly match the repository. Translate prose, but never translate or independently rename code identifiers, test names, paths, storage keys, or selectors.
- Trace new production files and exported symbols to real callers, and confirm deleted modules have no remaining imports. Distinguish dead code from intentional compatibility paths before reporting or removing it.
- Check test fixtures, mock IDs, fallback values, and internal option names for obsolete domain terminology; these commonly preserve discarded designs and later cause test or maintenance failures.
- Report every unresolved untracked or ignored in-scope artifact in the handoff. If its purpose is unclear, request confirmation instead of silently including or deleting it.

Use targeted repository searches rather than broad cleanup. A clean lint result is not evidence that this residue audit passed because linters usually do not detect stale selectors, unreferenced artifacts, cross-file terminology drift, or translated filenames.

## 5. Validation and Handoff

Run `npm run verify:feature` for a meaningful user-visible behavior change. For a documentation-only change, run `npm run verify:feature -- --docs`; report every skipped layer and its reason. When the command does not fit the scope, run only the relevant checks and report the same evidence explicitly. The mechanical command does not replace runtime proof of a changed interaction; report the user flow exercised, manual observation or automated E2E evidence, and any limitation. The available layers are:

```bash
npm run validate
npm run test:run
npm run test:coverage
npm run test:inventory
npx playwright test
npm run build
```

Run `npm run test:inventory` after changing test files or `testing-guide*.md`; use `npm run test:inventory:sync` only when executed results should update generated guide counts. Run the final residue audit after implementation and documentation have reached their intended names, then report its outcome alongside commands run, validation results, intentional omissions, coverage comparison (if available), manual test steps, remaining risks, and unresolved artifacts. Do not install dependencies, alter Git state, or create commits unless the user explicitly authorizes it.

If Playwright's web server fails with `listen EPERM` inside a restricted execution sandbox, rerun the same test command with the narrow approval needed to bind its localhost port. Treat a repeated test assertion failure outside the sandbox as a product/test failure; do not report the initial port restriction as evidence that validation is unavailable.

## 6. Learning Handoff

After a meaningful feature receives a `ready` verdict, invoke `feature-learning` as a separate learning handoff. Pass it the verified feature scope, then let it teach the architecture and software-engineering concepts through repository examples and progressive exercises. Keep readiness evidence in this Skill's handoff; the learning guide must not become a second completion review or a line-by-line walkthrough.
