---
name: code-review
description: Review a scoped source-code diff for correctness, maintainability, state/data-flow risks, accessibility, and internationalization. Use for implementation review; do not use it to replace executed tests or test-architecture review.
argument-hint: '[base branch/diff scope/acceptance criteria]'
---

# Code Review

Review the implementation diff, not an imagined rewrite. This is an AI-assisted advisory review: it identifies evidenced risks, while test results remain the source of truth for automated verification.

## Scope and Boundaries

- `code-review`: implementation correctness and maintainability in the changed code.
- `test-analysis`: independent evaluation of test design, risk coverage, and test quality.
- `feature-workflow`: owns requirements, planning, human approval gates, and delivery state.
- `feature-completion`: owns verification evidence and the completion-review handoff.
- `doc-audit-*`: audits the named bilingual documentation pair only.

Do not repeat another Skill's full workflow. Refer to it when the review reveals that it is needed.

## Review Workflow

1. Read `AGENTS.md`, the relevant specification or acceptance criteria, and the complete scoped diff.
2. Trace changed user-visible behavior through component events, composables, services, models, persistence, and rendering where applicable.
3. Check only risks supported by the diff and repository conventions:
   - incorrect state ownership, stale reactive state, event/payload mismatch, or lifecycle cleanup
   - localStorage schema compatibility, parsing failures, cache invalidation, and mutation of persisted data
   - invalid inputs, empty states, error paths, ordering, identity, and destructive actions
   - Vue props/emits contracts, list keys, and component boundaries
   - changed interactive controls: semantics, labels, focus, keyboard behavior, narrow layouts, and translated UI text
   - unnecessary coupling, duplicated logic, or changes outside the requested scope
4. Inspect related tests, but do not infer correctness merely because they pass. Send broad test-design concerns to `test-analysis`.
5. Do not run formatting commands, alter files, or change Git state unless separately authorized.

## Finding Standard

Report a finding only when it has all of the following:

1. File path and line number.
2. Concrete condition or reproduction path.
3. Actual versus expected behavior.
4. Impact and severity (`blocking`, `important`, or `minor`).
5. A narrowly scoped correction direction.

Do not report style preferences already enforced by ESLint, Prettier, or `AGENTS.md` unless the current diff violates them. Do not manufacture blockers from speculative edge cases.

## Output

Return, in order:

1. **Verdict**: ready / changes requested / insufficient evidence.
2. **Findings**: only evidenced items, sorted by severity.
3. **Validation gaps**: commands or test layers that should still be executed, if any.
4. **Scope note**: unrelated changes or assumptions that need user confirmation.

For a feature handoff, pass this result to `feature-completion`, which returns
it to `feature-workflow`; do not claim the feature is complete on this review
alone.
