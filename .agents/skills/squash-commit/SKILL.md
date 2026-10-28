---
name: squash-commit
description: Generate the body for a GitHub UI squash merge commit from the current branch diff, using the project's concise technical-summary conventions.
argument-hint: '[target branch/merge context]'
---

# GitHub Squash Commit Body Writer

## Role and Mission

You are the project's GitHub squash commit body specialist. Compose the summary and themed bullets for the body field of a GitHub UI squash merge commit.

GitHub UI supplies the commit title from the Pull Request title and appends the PR number (for example, `feat: Add templates (#16)`). Do not generate, repeat, suggest changes to, or include that title in this skill's output.

## Project Format

1. **Opening**: Start with `This commit ...` and summarize the main outcome in
   one or two English sentences.
2. **Statistics**: When available and relevant, include verified file counts,
   additions/deletions, test totals, or coverage. Distinguish a tracked inventory
   from an executed result; never invent figures or imply tests were run.
3. **Sections**: After a blank line, group actual changes under applicable
   plain-text themes such as `Components / UI`, `Logic & persistence`, `Tests`,
   `Documentation`, or relevant workflow and configuration themes. Separate
   groups with a blank line; omit sections that do not apply. A `Key changes`
   theme is optional, not a required heading.
4. **Details**: Under each theme use `-` bullets beginning with an English
   present-tense verb. Cover meaningful changes with actual paths, components,
   functions, behavior, or test scope when useful. Use multiple bullets when
   supported by the diff; one is appropriate for a single meaningful change.
   Keep the body a concise history summary without inventing detail.
5. **Output boundary**: Return exactly one fenced `text` block containing the
   body only, without a title, PR number, leading blank line, or outside prose.
   GitHub owns the title. Start the first line with the opening paragraph.

## Execution Workflow

1. **Determine the comparison base and collect commits**:
   - Use the merge target when supplied; otherwise inspect repository metadata and state the assumed base branch rather than hard-coding `main`.
   - Inspect the final merge-base diff: `git diff <base>...HEAD` and its stat.
   - Use branch commits only as context; omit intermediate changes absent from the final diff.

2. **Analyze theme**:
   - Identify the primary change theme
   - Find the core feature, fix, testing, configuration, or documentation focus
   - Merge duplicate themes

3. **Classify file changes**:
   - Group by purpose: Test Infrastructure, Components, Configuration, Documentation, etc.
   - Extract key metrics (file counts, line changes, new features)

4. **Generate squash commit body**:
   - Apply the project format to the actual final diff and verified evidence.

5. **Output format**:

   Return exactly one fenced `text` code block and no prose outside it, so the
   body can be copied directly into GitHub UI's squash commit message field.
   Inside that block, output only the commit body. The first line must be the
   summary paragraph, never a title:

   ```text
   This commit [main outcome]. [Relevant, verified change or test statistics.]

   Components / UI
   - Add [component path] to [specific behavior]
   - Update [component path] to [another relevant behavior]

   Logic & persistence
   - Update [file path or function] to [specific data or state change]

   Tests
   - Extend [test path] to cover [behavior and failure cases]
   ```

## Scope Guidance

Use the primary change theme only to organize the body. GitHub UI already owns the title, so do not choose or emit a Conventional Commit type.

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
