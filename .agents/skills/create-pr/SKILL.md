---
name: create-pr
description: Safely prepare and, only after explicit approval, create a GitHub Pull Request using the project's pr-description skill and GitHub Connector.
argument-hint: '[base branch] [draft | ready]'
---

# Pull Request Creator

## Role and Mission

Create a GitHub Pull Request only after a read-only preflight, a complete user-visible draft, and an explicit create-only approval. This skill orchestrates the operation; `$pr-description` remains the sole source of PR title and body content.

## Non-Negotiable Boundaries

- Do not create a PR merely because a branch is committed, pushed, reviewed, or approved for merge.
- Do not push commits, create branches, merge, comment, request reviews, add labels, assign people, change rulesets, or change repository settings.
- Do not use a repository other than the one the user identified and approved in the draft.
- Do not create a duplicate PR. If an open PR already has the same repository, head branch, and base branch, stop and report its URL.
- A changed HEAD SHA, base, head, title, body, draft status, or repository invalidates a prior create approval. Regenerate the draft and obtain fresh approval.

## Read-Only Preflight

1. Resolve and display the exact `owner/repository` from the configured `origin`. Verify it is the repository requested by the user; never broaden scope to another repository.
2. Resolve the target branch from the user's argument. If absent, read repository metadata, state the assumed default branch, and ask for confirmation if the choice is material. Never hard-code `main`.
3. Resolve the local head branch and HEAD SHA. Stop if detached.
4. Verify the branch has an upstream remote branch and that the remote branch SHA equals local HEAD. If not pushed or stale, stop and report that a separate explicit push approval is required; never push automatically.
5. With GitHub Connector read-only calls, verify there is no open PR for the exact repository, head branch, and base branch. If one exists, report it and stop.
6. Apply `$pr-description` using the selected base. Preserve its generated `Title` and `Description` exactly; do not rewrite or duplicate its writing rules.

## Draft and Approval Gate

1. Determine draft status from the user argument. If unspecified, propose `draft: true` as the conservative default; it remains a visible, editable field in the preview.
2. Display exactly one complete PR draft with:
   - Repository
   - Base branch
   - Head branch and HEAD SHA
   - Draft status
   - Title
   - Full Markdown body
3. State plainly that no PR has been created.
4. Stop and wait for explicit approval such as `建立 PR` or `批准建立 PR`. Approval to commit or push is not approval to create a PR.

## Creation

After explicit create approval, re-run the preflight checks that establish repository, branch SHAs, duplicate status, and the displayed draft. If every value is unchanged, invoke GitHub Connector's `create_pull_request` with exactly the displayed:

- `repository_full_name`
- `base`
- `head`
- `title`
- `body`
- `draft`
- `maintainer_can_modify: false`, unless the user explicitly requests otherwise

Then report the PR number and URL. State that CI, human review, and merge remain separate steps requiring their own results and approvals.

## Failure Handling

- If Connector permissions do not allow PR creation, report the exact limitation and do not use browser automation as a fallback without explicit approval.
- If any preflight check fails, report the failed condition and the smallest next user decision; do not guess or work around it.
- Never expose or request secrets, tokens, or credentials.
