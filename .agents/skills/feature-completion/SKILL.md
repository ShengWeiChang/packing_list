---
name: feature-completion
description: Verify a reviewable implementation milestone or completed user-facing feature with evidence and independent review. Use after an approved implementation milestone, not for planning or routine formatting; trivial documentation-only edits normally do not need it.
argument-hint: '[feature scope/path/acceptance criteria]'
---

# Feature Completion Review

Use this skill for the verification stage of `$feature-workflow`. It examines a
reviewable implementation milestone or completed feature; it does not decide
product scope, create the delivery plan, implement changes, or authorize Git
actions.

## Entry and Exit

Enter only after `$feature-workflow` has an approved plan and the implementation
has reached a reviewable milestone. Read the relevant plan's observable finish
conditions, state, reviewed scope or revision, and prior evidence before
validating. Return an evidence-backed verdict so the workflow can update the
plan and wait for the user's decision.

For a milestone review, inspect the staged candidate with `git diff --cached`.
For a final review, inspect the aggregate feature range from the plan's feature
base HEAD SHA through current `HEAD`, plus any staged final candidate. Do not
review only the most recent milestone when earlier feature milestones have
already been committed.

Do not alter product scope or implementation files. This skill never authorizes
a commit, push, pull request, merge, dependency installation, or unrelated
cleanup.

Do not invoke this skill for a documentation-only change that the user has
explicitly agreed is trivial after discovery. A non-trivial documentation change
that remains in `$feature-workflow` may use the documentation-only final gate.

## 1. Establish Scope and Oracle

1. Read the applicable product specification, changed source files, and user-provided acceptance criteria.
2. Inspect the diff before judging completeness. Keep unrelated existing changes intact.
3. State the observable user behavior being verified. Do not treat an existing test as proof that the behavior is correct.
4. Define a finish condition and the evidence that can prove it before declaring handoff. For a meaningful UI interaction, include a real user-flow check; command results alone do not prove an interaction is usable.

## 2. Select the Verification Gate and Specialized Reviews

Use the smallest applicable set of reviews; do not repeat their work here.

| Need                                                                      | Skill                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------- |
| Source-code correctness, state/data flow, and scoped implementation risks | `code-review`                                      |
| Independent test architecture, effectiveness, and missing-risk review     | `test-analysis`                                    |
| Bilingual product, code-quality, or test-documentation parity             | Relevant `doc-audit-*` Skill during implementation |

For a milestone gate, run the smallest relevant validation and obtain a fresh,
read-only `$code-review` verdict. A fresh reviewer did not implement the
reviewed scope and has not issued a verdict during its current repair cycle.
After a blocking or important finding is fixed, use a different read-only
context that did not review the earlier repair-cycle revision. Record reviewer
identity or context and the reviewed fingerprint. Escalate to the final gate
when the milestone crosses an integration boundary or the plan requires it.

Select milestone evidence from the changed boundary; do not replace relevant
runtime proof with a cheaper unrelated command:

| Changed boundary                                                                 | Minimum milestone evidence                                                  |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Wording or formal documentation                                                  | `npm run validate`; `npm run docs:check-pairs` for paired docs              |
| Pure model, transformation, ordering, or persistence logic                       | Relevant unit tests; coverage when the risk plan selects it                 |
| Vue state, props/emits, rendering, or keyboard behavior                          | Relevant component tests                                                    |
| Browser-only flow, focus lifecycle, drag/drop, responsive layout, or integration | Relevant targeted Playwright scenario plus any affected unit/component test |

Run a targeted test file or scenario where it proves the changed behavior. Do
not run the whole Playwright suite, full coverage suite, inventory audit, or
production build at every milestone unless the boundary or plan requires it.

For a final gate of every feature, bug, or behavior change that has not been
explicitly reduced to trivial after discovery, run `npm run verify:feature`
before review. Obtain a fresh, read-only `$code-review` verdict and a fresh
`$test-analysis` verdict when the change affects persistence, state/data
transformations, browser-only or cross-boundary behavior, complex interaction,
or lacks direct behavior proof. The reviewer may inspect the diff and evidence,
but must not edit implementation files. After implementation fixes a finding,
use a new fresh reviewer context for the follow-up verdict.

When delegation is unavailable, perform the applicable reviews sequentially,
but label the handoff `degraded: no independent delegation`. Do not call this
an independent review. Follow the repository's constraints on concurrent file
edits.

For every reported verification result, retain terminal command evidence rather
than inferring success from partial output. A full feature gate passes only when
the command has completed with exit code 0 and `npm run verify:feature` prints
its terminal `Feature verification passed.` marker. Record the Playwright pass
or failure total when browser tests run. If a host yields output early, truncates
it, or leaves a command running, report that layer as `unknown` and wait for its
terminal result before staging a final candidate or declaring a verdict.

For source behavior changes, run `npm run test:coverage` when the milestone's
risk plan selects coverage, or at the final gate. Compare with a baseline only
when it used the same configuration and comparable source scope. Coverage
movement is a signal to investigate changed modules, never a standalone
pass/fail condition.

If required validation fails, a reviewer requests changes, or available evidence
is insufficient, return that verdict to `$feature-workflow`; it must not present
a commit candidate or final handoff. A remaining non-blocking risk is reportable
only when the user explicitly accepts it in the plan.

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

At a milestone, run the smallest relevant commands and report every skipped
layer and its reason. At a final gate that was not explicitly reduced to trivial
after discovery, run `npm run verify:feature`. For a non-trivial
documentation-only final gate, run `npm run verify:feature -- --docs`. The
mechanical command does not replace runtime proof of a changed interaction;
report the user flow exercised, manual observation or automated E2E evidence,
and any limitation. The available layers are:

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

## 6. Completion Verdict

Record the reviewed scope or revision, validation evidence, reviewer identity or
the `degraded: no independent delegation` status, remaining risks, and whether
the result is ready for the workflow's next human decision. Do not provide a
learning handoff unless the user separately asks for `$feature-learning`.
