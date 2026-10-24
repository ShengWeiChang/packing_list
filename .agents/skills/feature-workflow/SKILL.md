---
name: feature-workflow
description: Plan and deliver every feature, bug fix, or behavior change through read-only investigation, human-approved milestones, plan updates, and explicit Git controls. Use at the start of such a request, even when the user provides only a short description.
argument-hint: '[feature or bug request]'
---

# Feature Workflow

Coordinate the delivery lifecycle for every feature, bug fix, or behavior
change. `$feature-completion` owns verification and independent review; this
skill owns planning, implementation milestones, progress reporting, and human
approval boundaries. Do not require users to remember workflow prompt keywords.

## 1. Read-Only Discovery and Plan

1. Begin with read-only investigation of the relevant source, tests,
   specifications, and existing behavior. Do not change tracked files, create a
   commit, or make external Git changes in this stage. Creating or updating the
   ignored plan below is the sole permitted write.
2. Create `plans/<feature>-plan-zh.md`. Include these headings: **Status**,
   **Request**, **Observable finish conditions**, **Affected areas and risks**,
   **Options and decision**, **Implementation checklist**, **Validation and
   reviewer plan**, and **Approval/evidence log**. `Status` must be one of:
   `draft`, `awaiting implementation approval`, `implementing milestone N`,
   `awaiting milestone review`, `awaiting commit approval`, `final
verification`, `awaiting final decision`, `awaiting final commit approval`,
   `awaiting push approval`, `awaiting PR approval`, `awaiting merge approval`, or
   `complete`.
   Record the feature base HEAD SHA before the first implementation change.
3. Describe feasible options and recommend one, rather than silently choosing
   a product-affecting tradeoff. Make every finish condition observable from a
   user's perspective.
4. Present the plan and wait for the user's explicit approval to implement,
   such as `開始實作`. That approval covers only the approved scope; it does not
   authorize a commit, push, pull request, merge, dependency installation, or
   unrelated cleanup.

## 2. Approved Milestones

1. Before changing tracked files, inspect the current branch and worktree. If
   the work is not already on a suitable feature branch, propose a scoped
   branch name and obtain explicit approval to create or switch branches unless
   the user's implementation approval already included that instruction. Record
   the starting branch, feature branch, and branch-point HEAD in the plan. Never
   move unrelated working-tree changes while creating or switching branches.
2. Implement only an approved checklist milestone. One implementation agent
   owns any given file at a time.
3. After each meaningful milestone, update the plan with completed checklist
   items, changed scope, commands or manual evidence, unresolved questions,
   reviewed scope or revision, reviewer role and verdict, and user decision.
4. Select and run the targeted validation required by `$feature-completion` for
   the changed boundary. Use the full final gate early only when the milestone
   crosses an integration boundary that needs it.
5. Stage exactly the candidate scope as reversible candidate preparation, then
   run `npm run fingerprint:candidate -- <scoped files>`. Do this before the
   fresh reviewer. The helper reports renames as their deleted and added paths,
   so include both paths in the scope. The reviewer inspects `git diff --cached`
   and the exact index content a commit would use. Staging does not authorize a
   commit.
6. Invoke `$feature-completion` for the fresh review and evidence verdict, then
   set status to `awaiting milestone review` and present the staged milestone
   diff, updated plan status, validation evidence, fingerprint, and reviewer
   verdict. Begin every status update by naming the current state and the one
   user decision needed. If this completes the implementation checklist and its
   targeted gate is ready, automatically set status to `final verification` and
   run the full final gate; do not present a normal milestone commit candidate.
   Otherwise, wait for that response before continuing to a dependent milestone
   or commit.

## 3. Feedback and Commit Control

If the user raises an objection, record the decision in the plan, revise the
affected implementation, run the applicable validation again, and obtain a new
fresh reviewer verdict before presenting the revised milestone. Do not reuse a
prior reviewer verdict after a fix.

Only after required validation passes and the fresh reviewer verdict is `ready`
may a user accept a milestone's content. If validation fails, evidence is
insufficient, or review requests changes, return to the approved repair loop;
do not present a commit candidate. A non-blocking remaining risk requires the
user's explicit recorded acceptance. Then set status to `awaiting commit
approval` and present its commit candidate. When the user approves that
candidate, first recompute its recorded fingerprint. The approval/evidence log
must include the review's base HEAD SHA, scoped file list, `git status --short`,
and the output of `npm run fingerprint:candidate -- <scoped files>`, which
binds the staged index candidate. If its fingerprint differs, return to the
review gate. Create only the approved files in that commit and record its SHA,
candidate revision, and approval in the plan. Set status to `implementing
milestone N+1` when checklist work remains. A commit approval does not authorize
push, pull request, merge, or other Git state changes.

The last implementation milestone automatically enters `final verification`
after its targeted gate is ready. Run the full `$feature-completion` handoff
before presenting a final decision. Do not require the user to restate each
validation or review instruction. The full gate is required unless the user
explicitly agreed the change was trivial after discovery.

## 4. Release Controls and Exceptions

Push, pull-request creation, and merge each require separate explicit user
approval after the relevant result is shown. Report the CI result after a pull
request is opened; do not treat CI configuration alone as proof that a feature
is ready. If CI or external review produces a finding, record it in the plan,
present its impact and a repair proposal, and wait for user approval before
fixing it. After a fix, use a new fresh reviewer and repeat the applicable gate;
failed CI or unresolved blocking findings never authorize merge.

After a successful final gate, set status to `awaiting final decision` and
present the final evidence report. If the user accepts it and a final candidate
has uncommitted files, set status to `awaiting final commit approval`, present
its revision and validation summary, then require an explicit commit-only
approval and unchanged-fingerprint check before committing. Record the resulting
SHA. The log must include the final candidate's base HEAD SHA, scoped file list,
`git status --short`, and the output of `npm run fingerprint:candidate --
<scoped files>`. If no final commit is needed, record that decision instead.
Then set status to `awaiting push approval`. After an approved push, set status
to `awaiting PR approval`; after an approved pull request with passing CI and
resolved review, set status to `awaiting merge approval`. Record each external
URL or commit SHA and user decision. Set status to `complete` only after the
approved merge, or after the user explicitly ends the workflow without a push or
pull request.

For a trivial wording, formatting, or documentation-only change, first conduct
read-only investigation. Planning mode can be skipped only when the user then
explicitly agrees it is trivial. Record the reduced scope and validation
performed; never infer that a feature request permits skipping these controls.
