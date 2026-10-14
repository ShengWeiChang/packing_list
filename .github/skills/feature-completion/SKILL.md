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

## 2. Choose Test Layers by Risk

Select the smallest set of layers that protects the changed behavior; every feature does not need a test at every layer.

| Changed risk                                                          | Expected coverage when applicable                           |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Data model, localStorage, parsing, transformation, or error recovery  | Unit tests, including meaningful failure and boundary paths |
| Composable state, service orchestration, or emitted state             | Unit or component tests for observable state and errors     |
| Dialog, menu, responsive interaction, or focus behavior               | Component tests for the user-visible interaction            |
| A primary end-user workflow or integration between UI and persistence | Playwright E2E test for the critical path                   |

For an omitted layer, record why it would add no meaningful protection. Prefer behavior-oriented assertions and stable semantic queries; use `data-testid` only when a semantic query is not a stable representation of the interaction.

## 3. Review Coverage as a Signal

1. Run `npm run test:coverage` when source behavior changed.
2. Compare with a baseline only when it was produced with the same configuration and comparable source scope; record both values and affected modules.
3. Investigate uncovered changed branches and lines, then add tests only for meaningful risks. Do not add superficial assertions merely to raise a percentage.
4. A lower aggregate percentage is a review signal, not an automatic failure. A feature is incomplete when a material behavior or failure path lacks protection.

## 4. Accessibility and Internationalization

For new or changed interactive UI, verify as applicable:

- Native semantics, text alternatives for icon-only controls, visible focus, and keyboard operation.
- Dialog/menu lifecycle: initial focus, `Escape`, pointer dismissal where supported, `Tab` behavior, and focus return.
- Desktop and narrow viewport behavior when layout or controls differ.
- Both supported locales, translated labels/messages, and locale-independent data behavior.

`npm run lint` provides static accessibility checks only. Runtime keyboard/focus behavior needs component or E2E coverage and, where appropriate, manual verification. The existing i18n parity tests check locale key structure; they do not replace behavior checks for changed UI text.

## 5. Documentation and Repository Hygiene

1. Update `docs/product-spec*.md`, `docs/code-quality*.md`, or `docs/testing-guide*.md` only when the feature changes the contract, convention, or documented inventory.
2. Keep paired English and Traditional Chinese documents structurally aligned. Some `*-zh.md` files are intentionally ignored by Git in this repository; still update and verify them in the working tree, and explicitly report that they will not appear in `git status`.
3. Follow `AGENTS.md` for Vue attribute order, Tailwind class order, naming, and paired documentation rules.
4. Do not broaden the diff with unrelated cleanup or create feature-specific Skills unless the workflow is genuinely reusable across the project.

## 6. Validation and Handoff

Run only the checks relevant to the scope, normally choosing from:

```bash
npm run validate
npm run test:run
npm run test:coverage
npx playwright test
```

Report commands run, outcomes, intentional omissions, coverage comparison (if available), manual test steps, and remaining risks. Do not install dependencies, alter Git state, or create commits unless the user explicitly authorizes it.
