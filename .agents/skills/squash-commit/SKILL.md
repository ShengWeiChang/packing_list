---
name: squash-commit
description: Generate the body for a GitHub UI squash merge commit from the current branch diff, using the project's concise technical-summary conventions.
argument-hint: '[target branch/merge context]'
---

# GitHub Squash Commit Body Writer

## Role and Mission

You are the project's GitHub squash commit body specialist. Compose the summary and themed bullets for the body field of a GitHub UI squash merge commit.

GitHub UI supplies the commit title from the Pull Request title and appends the PR number (for example, `feat: Add templates (#16)`). Do not generate, repeat, suggest changes to, or include that title in this skill's output.

## Body Standards

1. **Summary paragraph**: 1-2 sentences describing scope and impact (starts with "This commit...")
2. **Bullet points**: Grouped by theme with `-` prefix, technical details
3. **Language**: English; use present tense verbs for bullets
4. **Title ownership**: GitHub UI owns the squash commit title from the PR title. Never output a Conventional Commit title or issue/PR number.

## Execution Workflow

1. **Determine the comparison base and collect commits**:
   - Use the merge target when supplied; otherwise inspect repository metadata and state the assumed base branch rather than hard-coding `main`.
   - Read branch commits: `git log <base>..HEAD --oneline`
   - Count changed files from the merge-base diff: `git diff <base>...HEAD --stat`

2. **Analyze theme**:
   - Identify the primary change theme
   - Find the core feature, fix, testing, configuration, or documentation focus
   - Merge duplicate themes

3. **Classify file changes**:
   - Group by purpose: Test Infrastructure, Components, Configuration, Documentation, etc.
   - Extract key metrics (file counts, line changes, new features)

4. **Generate squash commit body**:
   - **Summary**: 1-2 sentences starting with "This commit..." (include key metrics)
   - **Blank line**
   - **Grouped bullet points**: Organized by theme (Test Infrastructure, Key changes, Configuration, Documentation)
   - Use present tense verbs (Add, Update, Implement, Refactor)
   - Include file paths and specific details
   - Do not generate a title, PR number, or a leading blank line.

5. **Output format**:

   Return exactly one fenced `text` code block and no prose outside it, so the
   body can be copied directly into GitHub UI's squash commit message field.
   Inside that block, output only the commit body. The first line must be the
   summary paragraph, never a title:

   ```text
   This commit [summary with metrics].

   [Theme heading]
   - [Specific change with file path]
   - [Another change]

   [Another theme heading]
   - [Change]
   ```

## Scope Guidance

Use the primary change theme only to organize the body. GitHub UI already owns the title, so do not choose or emit a Conventional Commit type.

## Example Output (Based on Historical Commits)

```text
This commit implements 440 tests (196 unit, 202 component, 42 E2E), achieving 97.52% statement coverage with GitHub Actions pipeline.

Test Infrastructure
- Add Vitest 4.0.18 + @vue/test-utils 2.4.6 for unit/component testing
- Add Playwright 1.58.2 for E2E browser automation with Chromium
- Add test-setup/setup.js: global mocks (localStorage, crypto, scrollIntoView)

Component Tests (202 tests)
- Add App.test.js (42): initialization, state management, event coordination
- Add Checklist.test.js (36): CRUD, date validation, overflow menu

CI/CD Pipeline
- Add .github/workflows/test.yml: lint → unit test → E2E test → build
- Add Husky pre-commit hook with lint-staged

Documentation
- Add docs/testing-guide.md: complete test inventory, architecture
```

## Quick Usage

```bash
# Basic usage (analyze current branch)
/squash-commit

# Use the PR's target branch as comparison base
/squash-commit main
```

## Notes

- Use this skill only for the GitHub UI squash merge body field. For a local CLI squash commit that needs a title, write that title separately.
- If branch contains multiple unrelated changes, suggest splitting the PR (not mandatory).
- Will not fabricate non-existent changes.
