---
name: create-pr
description: Push the current committed branch if necessary and create a GitHub pull request when explicitly requested.
argument-hint: '[base branch] [draft | ready]'
---

# Pull Request Creator

An explicit request to create a PR authorizes the ordinary push needed for that
PR and its creation. A commit, standalone push, review, or implementation
approval alone does not authorize a PR. Do not commit, force-push, merge, switch
branches, request reviews, comment, or change repository settings under this
skill. Use `$pr-description` as the source of the PR title and body.

## Preflight

1. Identify `origin`, repository owner/name, current branch and HEAD. Stop on a
   detached HEAD or an ambiguous repository. Use the requested base, otherwise
   the repository's default branch. Preserve unrelated uncommitted work; the PR
   contains committed changes only.
2. Check GitHub for an existing open PR with the same repository, head and base.
   If one exists, report its URL and stop; never create a duplicate.
3. Query the exact remote head with `git ls-remote --heads origin <branch>` and
   distinguish a missing branch from a failed query. Do not infer remote state
   from upstream configuration or a possibly stale remote-tracking ref.
4. If the remote SHA equals HEAD, skip push even without an upstream. If the
   remote branch is absent, create it using the scoped push below. If it differs,
   fetch the exact remote branch and verify that its current commit is an
   ancestor of local HEAD before the same ordinary fast-forward push. Use
   `git push --no-follow-tags origin HEAD:refs/heads/<branch>` for either case;
   never force-push or push unrelated refs. Stop on divergence, a remote change,
   an unverifiable ancestry, or any failure. Verify the remote head equals the
   intended HEAD after a push.
5. Generate the title and body from the final diff using `$pr-description`.
   Default to a ready PR; use draft only when requested. Surface the intended
   repository, base, head, SHA, title, body and status before creation without
   adding another approval prompt to the explicit PR request.

## Create and report

Recheck the intended HEAD, remote head and duplicate PR before creation. Use
GitHub Connector to create the PR with the prepared fields and
`maintainer_can_modify: false` unless requested otherwise. If the connector
cannot create it, report the limitation. Report the PR URL, head SHA, push
result, and available CI and review status; pending or unavailable is not a
pass. Merge requires separate authorization.

Let an already-enabled Codex GitHub auto-review integration run; do not send a
duplicate review request. If its status is unknown or it is not enabled, report
that uncertainty and mention `@codex review` as an option. Do not change GitHub
settings or post a comment without the user's instruction.
