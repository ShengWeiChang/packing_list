---
name: squash-commit
description: Generate squash commit messages following project conventions (Conventional Commits, concise description) by analyzing all commits in current branch and composing a style-matching squash message.
argument-hint: '[target branch/merge context]'
---

# Squash Commit Message Writer

## Role and Mission

You are the project's commit message specialist, responsible for composing multiple commits into a single squash commit message that matches team conventions.

## Known Conventions (From Historical Commit Analysis)

### Commit Format (Conventional Commits)

```
type: description
```

### Type Categories (Priority Order)

1. **feat**: New features
   - Example: `feat: implement Level 1 code quality management toolchain`
   - Example: `feat: add E2E test for checklist deletion and update i18n tests`

2. **fix**: Bug fixes
   - Example: `fix: update date formatting test to account for timezone variations`
   - Example: `fix: address comments`

3. **test**: Testing related
   - Example: `test: Establish automated testing infrastructure with CI/CD (#14)`

4. **docs**: Documentation updates
   - Example: `feat: update document` (Note: project convention uses feat instead of docs)

5. **refactor**: Refactoring (no bug fix or feature addition)

6. **chore**: Miscellaneous (build, dependency updates, etc.)

### Description Standards

1. **Title line**: 50-80 characters, concise summary
2. **Summary paragraph**: 1-2 sentences describing scope and impact (starts with "This commit...")
3. **Bullet points**: Grouped by theme with `-` prefix, technical details
4. **Language**: English (sentence case for title, lowercase start for bullets)
5. **Issue Link** (optional):
   - Format: `(#issue-number)` at end of title
   - Example: `test: Establish automated testing infrastructure with CI/CD (#14)`

## Execution Workflow

1. **Collect commits**:
   - Read all commits in current branch: `git log main..HEAD --oneline`
   - Count changed files: `git diff main...HEAD --stat`

2. **Analyze theme**:
   - Identify primary change type (feat / fix / test / docs)
   - Find core feature or fix focus
   - Merge duplicate themes

3. **Classify file changes**:
   - Group by purpose: Test Infrastructure, Components, Configuration, Documentation, etc.
   - Extract key metrics (file counts, line changes, new features)

4. **Generate squash message**:
   - **Title**: `type: concise description (#issue)`
   - **Blank line**
   - **Summary**: 1-2 sentences starting with "This commit..." (include key metrics)
   - **Blank line**
   - **Grouped bullet points**: Organized by theme (Test Infrastructure, Key changes, Configuration, Documentation)
   - Use present tense verbs (Add, Update, Implement, Refactor)
   - Include file paths and specific details

5. **Output format**:

   ```
   type: concise description (#issue)

   This commit [summary with metrics].

   [Theme heading]
   - [Specific change with file path]
   - [Another change]

   [Another theme heading]
   - [Change]
   ```

## Decision Logic

| Situation                            | Type             | Example                                     |
| ------------------------------------ | ---------------- | ------------------------------------------- |
| Add feature or module                | `feat`           | `feat: add user authentication module`      |
| Fix bug or error                     | `fix`            | `fix: resolve null pointer in data service` |
| Test related (add/modify tests)      | `test`           | `test: add E2E tests for checkout flow`     |
| Documentation update (README, docs/) | `feat` or `docs` | `feat: update testing guide`                |
| Mixed types                          | Choose primary   | If 70% is testing → `test`                  |

## Example Output (Based on Historical Commits)

```
test: Establish automated testing infrastructure with CI/CD (#14)

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

# Specify comparison branch
/squash-commit main

# Attach issue number
/squash-commit #42
```

## Notes

- If branch contains multiple unrelated changes, will suggest splitting PR (not mandatory)
- If all commits already follow conventions and theme is consistent, will suggest keeping as multiple commits
- Will not fabricate non-existent changes
