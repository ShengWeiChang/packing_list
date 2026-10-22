---
name: test-analysis
description: Independently review whether a scoped change has proportionate, behavior-focused test evidence. Use for meaningful test-design or coverage risk, not for routine edits or implementation code review.
argument-hint: '[scope/path/acceptance criteria]'
---

# Independent Test Analysis

Review whether the tests and executed evidence support the stated finish
condition. This is a read-only advisory review: it neither edits tests nor
declares a feature complete.

## 1. Establish the Test Oracle

1. Read `AGENTS.md`, the user-visible finish condition, applicable specification,
   scoped diff, and relevant tests.
2. State the behavior that must be proven and the most meaningful failure that
   could still reach a user. Existing tests, coverage percentage, and a passing
   build are evidence, not proof by themselves.
3. Review only the risks introduced or materially affected by the change. Do
   not require a full test-architecture audit for a focused fix.

## 2. Inspect Evidence and Layering

1. Read the result of `npm run verify:feature` when it is available. Request a
   missing relevant layer rather than rerunning every command without reason.
   Preserve failed or skipped commands and their effect on confidence.
2. Match evidence to the changed boundary:
   - **Unit**: models, transformations, ordering, persistence contracts, and
     failure paths.
   - **Component**: Vue state, props/emits, rendering, keyboard/focus behavior,
     and locale-dependent UI.
   - **E2E**: browser-only flows, integration boundaries, and interactions whose
     correctness depends on a running application.
3. For PackingList, investigate only relevant risks among reactive-state
   ownership, localStorage compatibility or corrupted data, drag/drop ordering,
   destructive actions, cross-tab updates, i18n, narrow layouts, and
   accessibility.
4. Prefer stable, behavior-oriented assertions. Flag tests coupled to private
   implementation, brittle selectors, shared-state pollution, redundant layers,
   or missing failure paths only when the diff provides evidence.

## 3. Finding Standard

Each finding must include a file and line, the unproven or unreliable behavior,
its user impact, and a proportionate correction direction. Do not use arbitrary
letter grades, coverage thresholds, estimated hours, or speculative blockers.

## 4. Output

Return, in order:

1. **Verdict**: `sufficient evidence`, `changes requested`, or `insufficient evidence`.
2. **Finish condition and evidence**: what behavior was checked and which test
   layers or runtime proof support it.
3. **Findings**: only evidenced items, ordered by impact.
4. **Validation gaps**: the smallest missing proof and why it matters.
5. **Scope note**: assumptions, skipped checks, or reasons this review was not
   needed.

Pass the result to `feature-completion`, which returns it to `feature-workflow`
for the next human decision. A reviewer must not claim the feature is complete
on this analysis alone.
