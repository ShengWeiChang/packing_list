---
name: pr-description
description: Generate a pull request title and description from the current branch diff using project conventions.
argument-hint: '[PR context/branch/issue number]'
---

# PR Description Writer

Generate text only; `$create-pr` owns PR creation. Identify the target base from
the user or repository metadata and analyze the complete merge-base diff, not
just commit messages. Describe the final change and its user or engineering
impact, using only evidence from the diff and verified validation results.
Include an issue number only when its relationship to this PR is confirmed.
Do not invent test counts, coverage, versions, file names, or results; include
metrics only when relevant and supported by evidence.

## Project Format

1. **Title**: Use an English Conventional Commit title, e.g.
   `feat: Add checklist templates`. Choose the type that best describes the
   change and capitalize the first word after the colon.
2. **Opening**: Start with `This PR ...` and summarize the main outcome in
   one or two sentences. When available and relevant, include verified change
   statistics (files and additions/deletions) or actual test totals and
   coverage. Distinguish a tracked inventory from an executed test result.
3. **Heading**: Follow the opening with the exact heading `Key changes:`.
4. **Sections**: Group the changes by applicable themes, such as
   `Components / UI:`, `Logic & persistence:`, `Component Test Suite:`,
   `Unit Test Suite:`, `E2E Test Suite:`, `Documentation:`, `Configuration:`,
   or `Validation:`. Use relevant custom themes for workflow or tooling
   changes. Do not include a section that does not apply.
5. **Details**: Use specific, present-tense, verb-led bullets under each
   section. Cover the meaningful changes rather than collapsing an entire
   section into one generic sentence: include actual file paths, component or
   function names, user-facing behavior, and test scope when they clarify the
   change. Use multiple bullets when the diff supports them; a single bullet
   is appropriate for a section with only one meaningful change. Include
   per-layer or per-file test counts only when verified and useful.

When validation evidence is available, report the commands and outcomes that
matter, including failures or meaningful limitations. Do not imply that tests
ran merely because the diff contains tests. Keep the detail proportionate to
the change and avoid inventing figures to fill the format.

Return exactly one fenced `text` block, with `Title` on its own line, the title
on the next line, a blank line, then `Description` and the complete Markdown
body. Do not add prose outside the block:

```text
Title
feat: Describe the change

Description
This PR [main outcome]. [Relevant, verified change or validation statistics.]

Key changes:

Components / UI:
- Add [component path] to [specific user-facing behavior]
- Update [component path] to [another relevant behavior]

Logic & persistence:
- Update [file path or function] to [specific data or state change]

Tests:
- Extend [test path] to cover [behavior and failure cases]

Documentation:
- Update [document path] to describe [changed contract]

Validation:
- Run [verified command] with [actual outcome]
```
