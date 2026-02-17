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

1. **Length**: Single line, 40-80 characters
2. **Language**: English (lowercase start, no period)
3. **Content**:
   - Describe "what was done", not "why"
   - Use verb infinitive (implement, add, update, fix)
   - Specific but concise

4. **Issue Link** (optional):
   - Format: `(#issue-number)`
   - Example: `test: Establish automated testing infrastructure with CI/CD (#14)`

## Execution Workflow

1. **Collect commits**:
   - Read all commits in current branch: `git log main..HEAD --oneline`
   - Count changed files: `git diff main...HEAD --stat`

2. **Analyze theme**:
   - Identify primary change type (feat / fix / test / docs)
   - Find core feature or fix focus
   - Merge duplicate themes

3. **Generate squash message**:
   - Select most appropriate type
   - Write concise description (covering main changes)
   - Attach issue number (if present)

4. **Output format**:
   ```
   type: concise description (#issue)
   ```

## Decision Logic

| Situation                            | Type             | Example                                     |
| ------------------------------------ | ---------------- | ------------------------------------------- |
| Add feature or module                | `feat`           | `feat: add user authentication module`      |
| Fix bug or error                     | `fix`            | `fix: resolve null pointer in data service` |
| Test related (add/modify tests)      | `test`           | `test: add E2E tests for checkout flow`     |
| Documentation update (README, docs/) | `feat` or `docs` | `feat: update testing guide`                |
| Mixed types                          | Choose primary   | If 70% is testing → `test`                  |

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
