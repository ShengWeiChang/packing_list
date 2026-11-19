---
name: feature-workflow
description: Plan and deliver every feature, bug fix, or behavior change through read-only investigation, human-approved milestones, plan updates, and explicit Git controls. Use at the start of such a request, even when the user provides only a short description.
argument-hint: '[feature or bug request]'
---

# Feature Workflow

Coordinate the delivery lifecycle for every feature, bug fix, or behavior
change. `$feature-completion` owns verification and independent review; this
skill owns planning, implementation milestones, progress reporting, and human
approval boundaries. Use `$feature-learning` when the user requests learning or
when a substantive conceptual explanation materially helps the user evaluate
the milestone; ordinary handoff still explains behavior and evidence. Do not
require users to remember workflow prompt keywords.

## 1. Read-Only Discovery and Plan

1. Begin with read-only investigation of the relevant source, tests,
   specifications, and existing behavior. Do not change tracked files, create a
   commit, or make external Git changes in this stage. Creating or updating the
   ignored plan below is the sole permitted write, except user-requested
   project-related discussion previews or prototypes in a dedicated ignored
   directory under `plans/`. Keep them isolated from real user data and clearly
   distinguish previews from implementation. When no longer needed for the
   approved discussion or handoff, stop any preview server and clean up only
   temporary artifacts created for the task. Retain plans and evidence still
   needed for handoff; do not require the user to remember routine cleanup.
2. Select the smallest justified planning tier using requirement clarity,
   existing patterns, blast radius, data or side effects, interaction
   complexity, evidence difficulty, and user impact. Persistence, sensitive
   data, access control, external boundaries, irreversible actions, or high
   user impact are a floor of T3. Do not infer a tier from diff size alone.
   Re-evaluate the tier when new evidence changes the risk: escalate immediately
   and record why; after plan approval, lower it only with documented new
   evidence and the user's explicit agreement because lowering reduces the
   approved validation and independent-review budget.
3. For T1/T2/T3, create `plans/<feature>-plan-zh.md` with status, request,
   observable finish conditions, affected areas and risks, options and decision,
   implementation checklist, validation and reviewer plan, approval/evidence
   log, selected tier, and feature base HEAD SHA. Keep T1 compact: record affected
   documentation and the README decision with reasons; omit an exhaustive matrix
   and decision ledger. For T2/T3, assess README, product-spec, code-quality and
   testing-guide as affected or not affected, with reasons, and record confirmed
   facts, conflicts and unresolved decisions. Name the applicable doc-audit skill
   for any paired document update. Reconcile this assessment with the final diff.
   Use the states in the delivery steps below, recording milestone numbers where
   relevant. Include a clearly visible progress section with numbered milestones
   (`M1`, `M2`, ...) and Markdown checkboxes (`[ ]` / `[x]`) for meaningful
   work, applicable evidence, and user acceptance. Mark a milestone complete
   only when its required work, verification, and acceptance are complete;
   distinguish planning progress from implementation not yet started. Update
   the checkboxes after each meaningful milestone.

   For potential T0, read-only discovery comes first. The user may explicitly
   agree that the scope is trivial and approve its implementation in the same
   decision. Then create a reduced record with scope, base HEAD, that agreement,
   minimum validation and Git decision; omit normal plan headings and matrix.

4. Apply the tier actions below. T0 is available only after read-only discovery
   and the user's explicit agreement that the scope is trivial. Every tier
   retains explicit implementation, commit, PR, and merge approvals; a PR request
   also authorizes the ordinary push needed for that PR. T0
   reduces planning and independent-review work only.

   | Tier         | Required planning actions                                                                                              | Milestone evidence and independent review                                                                       | Final local gate                                                       |
   | ------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
   | T0: trivial  | Reduced record and relevant minimal validation; explicit implementation and Git approvals                              | Only the explicitly agreed reduced path; no council or independent reviewer                                     | Reduced path only                                                      |
   | T1: small    | Compact plan, assumptions, observable finish condition, targeted validation; at most one material question             | Focused proof for each changed boundary; no intermediate independent review                                     | Focused final evidence + one fresh code review                         |
   | T2: standard | Normal plan; select planning specialists for concrete unresolved risks; one bounded decision round                     | Focused proof for each changed boundary; add a fresh review only at a meaningful non-final integration boundary | `verify:feature` once + one fresh code review; triggered test analysis |
   | T3: complex  | Full plan and decision ledger; select complementary specialists for distinct risks; resolve blocking decision frontier | Focused proof for each changed boundary; fresh review at each meaningful non-final integration boundary         | `verify:feature` once + fresh code review + fresh test analysis        |

   A milestone is a user-observable behavior or integration boundary, not an
   arbitrary file slice. Do not repeat a full final gate at every milestone.
   T1 uses focused local final evidence; T2/T3 run the full
   `$feature-completion` gate once after the feature's last implementation
   milestone; for documentation-only or agent-instruction-only candidates use
   its `--docs` gate and any separate evidence required by the changed content.
   For T2/T3, source, test, execution-script or configuration changes require
   the full gate; T1 uses the focused final evidence specified in the table.
   Repository CI remains the full merge safeguard for every pull
   request. Tiering reduces planning and independent-review cost without
   removing the user's implementation, commit, PR, or merge approvals.

5. For a non-trivial user-visible UI or interaction change, invoke
   `$ui-ux-design`: T1 uses its compact applicable checklist, while T2/T3 use
   a fresh read-only design specialist as part of their selected planning
   roles; count this specialist among the roles selected for the relevant risk.
   Do not invoke it for a pure data, tooling, documentation, or tiny
   established-pattern change. The planning specialist returns a concise memo,
   never a product redesign or open-ended debate. Record the resulting T1
   checklist or T2/T3 memo as the approved UI/UX artifact in the plan.
6. Describe feasible options and recommend one, rather than silently choosing
   a product-affecting tradeoff. Make every finish condition observable from a
   user's perspective. Investigate facts available from the repository,
   documentation, or focused tools rather than asking the user to rediscover
   them. For material architecture or dependency decisions, inspect the
   repository and current official guidance; consider ownership, compatibility,
   testing and migration, and record applicable tradeoffs.
7. Ask the user only about the current material decision frontier: choices whose
   answer affects behavior, scope, evidence, risk, or an irreversible decision
   and whose prerequisites are known. Each question gives two or three viable
   options, a recommendation, and user and engineering consequences. T1 asks at
   most one question; T2 uses one bounded round by default. If no material
   decision remains, record the reversible low-risk assumption and reason.
8. For T2/T3, select specialists only for concrete unresolved risks and record
   why a role is needed or omitted. Have selected specialists investigate
   independently before root synthesizes conclusions. Use targeted cross-review
   only for a material
   conflict; do not use unbounded agent discussion. Present unresolved material
   product decisions and wait for answers before finalizing the implementation
   plan. A UI/UX heuristic review is not user research or usability proof.
9. Present the plan and wait for the user's explicit approval to implement,
   such as `開始實作`. That approval covers only the approved scope; it does not
   authorize a commit, push, pull request, merge, dependency installation, or
   unrelated cleanup.

## 2. Approved Milestones

1. Before changing tracked files, inspect the current branch and worktree. For a
   new feature branch, follow `AGENTS.md`: switch to `main`, fast-forward pull
   `origin/main`, then create the branch from updated `main`; use another base
   only if explicitly requested. Preserve unrelated work and stop if the switch
   or update is unsafe or fails. Record starting branch, feature branch, and
   branch-point HEAD in the plan. Obtain authorization for branch creation or
   switching unless already provided by the user's request.
2. Implement only an approved checklist milestone. One implementation agent
   owns any given file at a time.
3. After each meaningful milestone, update the plan with completed checklist
   items, changed scope, commands or manual evidence, unresolved questions,
   reviewed scope or revision, reviewer role and verdict, and user decision.
4. Select and run the targeted validation required by `$feature-completion` for
   the changed boundary. Apply the tier table to each meaningful non-final
   integration boundary: T1 does not require an intermediate independent review;
   T2 and T3 do. Also review when the user explicitly requests it. Otherwise,
   record the review as not required. The final-gate review satisfies the review
   requirement for the last integration-boundary milestone.
5. Stage exactly the candidate scope when it will be reviewed independently or
   presented as a commit candidate, then run
   `npm run fingerprint:candidate -- <scoped files>`. The helper reports renames
   as their deleted and added paths,
   so include both paths in the scope. The reviewer inspects `git diff --cached`
   and the exact index content a commit would use. Staging does not authorize a
   commit.
6. When an intermediate independent review is required, invoke
   `$feature-completion`; it is the sole coordinator for `$code-review`,
   triggered `$test-analysis`, and applicable UI/UX conformance evidence. Do
   not start a duplicate review cycle for the same candidate without a new
   reason. Freeze the candidate after focused checks and known repairs before
   dispatching final reviews when practical; do not wait to investigate an
   issue that requires an independent perspective.
7. Explain the milestone's behavior, evidence and risks concisely. Invoke
   `$feature-learning` in conversational mode when the user requests learning or
   a substantive conceptual explanation materially helps their decision; ground
   it in the reviewed implementation and tests. Do not duplicate the handoff or
   create a learning document or exercises unless requested. Record the scope
   when learning is used.
8. Set status to `awaiting milestone review` and present the changed scope,
   validation evidence, fingerprint when staged, reviewer verdict or explicit
   reason it was not required, and any requested conceptual explanation. Begin every
   status update by naming the current state and the one user decision needed.
   Wait for the user's response before continuing to a dependent milestone or
   commit. If this is the final milestone, a user acceptance moves it to
   `final verification` and runs the tier's final gate; do not present a normal
   milestone commit candidate first.
9. Treat partial, truncated, or still-running command output as **unknown**, not
   as a pass. Record a completed command's exit result and its applicable
   success marker before reporting validation as passed. For
   `npm run verify:feature`, the evidence must include exit code 0 and the
   terminal `Feature verification passed.` marker; record the Playwright pass
   summary when browser tests run.

## 3. Feedback and Commit Control

If the user raises an objection, record the decision, revise the affected scope,
and validate its changed boundary. Defer a new review to the final gate unless
an intermediate gate or a prior blocking or important finding requires it.
`$feature-completion` owns follow-up review, evidence reuse, and bounded repair
escalation; record its verdict and the candidate revision in the plan.

Only after required validation passes and any tier-required reviewer verdict is
`ready` may a user accept a milestone's content. If validation fails, evidence
is insufficient, or a required review requests changes, return to the approved
repair loop; do not present a commit candidate. A non-blocking remaining risk
requires the user's explicit recorded acceptance. For a non-final milestone,
then set status to `awaiting commit approval` and present its commit candidate.
When the user approves that candidate, first recompute its recorded fingerprint.
The approval/evidence log must include the review's base HEAD SHA when review
was required, scoped file list, `git status --short`, and the output of `npm run
fingerprint:candidate -- <scoped files>`, which binds the staged index candidate.
If its fingerprint differs, return to the applicable review gate. Create only
the approved files in that commit and record its SHA, candidate revision, and
approval in the plan. Set status to `implementing milestone N+1` when checklist
work remains. A commit approval does not authorize push, pull request, merge,
or other Git state changes. For a final milestone, acceptance transitions to the
final-verification flow instead of a normal milestone commit.

After the user accepts the final milestone in `awaiting milestone review`, enter
`final verification` and run the tier-selected `$feature-completion` handoff
before presenting a final decision. Do not require the user to restate each
validation or review instruction. T1 uses focused final evidence; T2/T3 run the
full feature gate, or its `--docs` variant for documentation-only or
agent-instruction-only candidates, with any separately required evidence.

## 4. Release Controls and Exceptions

An explicit request to create a PR authorizes its necessary ordinary push and
PR creation together; a commit or standalone push approval does not authorize a
PR, and merge remains separately authorized. Report the CI result after a pull
request is opened; do not treat CI configuration alone as proof that a feature
is ready. If CI or external review produces a finding, record it in the plan,
present its impact and a repair proposal, and wait for user approval before
fixing it. After a fix, apply `$feature-completion` repair and evidence-reuse
policy. The applicable PR CI must pass on the current revision; failed CI or
unresolved blocking findings never authorize merge.

When a CI-only platform failure requires repeated experiments, consider a temporary
debug branch based on the affected PR and a narrowly triggered workflow on the
matching hosted runner. Run the failing cases with retries disabled, retain
reports and traces, and verify test selection. Keep the debug workflow out of
the product PR; carry back only the validated repair. A focused pass aids
diagnosis but does not replace the PR's complete required checks. Confirm the
workflow trigger actually covers the debug branch and preserve Git approvals.

After a successful final gate, set status to `awaiting final decision` and
present the final evidence report. If the user accepts it and a final candidate
has uncommitted files, set status to `awaiting final commit approval`, present
its revision and validation summary, then require an explicit commit-only
approval and unchanged-fingerprint check before committing. Record the resulting
SHA. The log must include the final candidate's base HEAD SHA, scoped file list,
`git status --short`, and the output of `npm run fingerprint:candidate --
<scoped files>`. If no final commit is needed, record that decision instead.
Then set status to `awaiting PR approval`, or `awaiting push approval` if the
user requests only a push. A PR request authorizes the necessary push and PR
creation without an additional approval between them. Locate the newest CI run
for the pushed commit and record its URL and state. A pending run is not a pass;
a failed run must be diagnosed from that newest run rather than a prior failure.
After an approved pull request with passing CI and resolved review, set status to
`awaiting merge approval`. Record each external URL or commit SHA and user
decision. Set status to `complete` only after the approved merge, or after the
user explicitly ends the workflow without a push or pull request.

For a trivial wording, formatting, or documentation-only change, first conduct
read-only investigation. Planning mode can be skipped only when the user then
explicitly agrees it is trivial and approves implementation; those approvals
may be combined in one decision. Record the reduced scope and validation
performed; never infer that a feature request permits skipping these controls.
