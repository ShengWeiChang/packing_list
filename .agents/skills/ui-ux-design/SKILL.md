---
name: ui-ux-design
description: Prepare an evidence-informed UI/UX planning memo for a non-trivial user-visible flow or interaction change. Use during approved feature planning; do not use for pure data, tooling, documentation, or tiny established-pattern edits.
argument-hint: '[feature scope or user flow]'
---

# UI/UX Design Planning

Provide a compact, evidence-informed design perspective before implementation.
This skill supports `$feature-workflow`; it does not implement the UI, decide
product preferences on the user's behalf, replace usability research, or
authorize Git actions.

## Scope and Cost

Start with read-only discovery of the user request, affected flow, existing
components, nearby interaction patterns, and applicable product documentation.
Preserve the existing product's visual language and operational efficiency over
novel visual treatment.

Use the planning depth selected by `$feature-workflow`:

- **T1**: produce only a short checklist for the changed, applicable states.
  Use the root agent's one permitted material question; do not request a
  specialist. If specialist expertise is necessary, escalate to T2 and record
  the evidence that justifies the higher tier.
- **T2/T3**: a fresh, read-only UI/UX specialist must prepare the memo. It must
  return bounded conclusions, not redesign the product or hold an open-ended
  agent debate.

The applicable T1 checklist or T2/T3 memo is the approved **UI/UX artifact**.
Record it in the feature plan so final verification can compare the delivered
experience with the accepted design intent.

Do not apply this skill to a pure data, tooling, documentation, or tiny
established-pattern change. A changed label alone does not require a design
memo unless it alters a user decision, information hierarchy, or interaction.

## Evidence-Informed Memo

State only items that apply to the proposed change. Distinguish observed
repository evidence from recommendations and unresolved product choices.

1. **User task and primary flow** — the actor, goal, normal path, and relevant
   success, failure, or recovery paths.
2. **Existing product evidence** — affected components, nearby patterns,
   terminology, tokens, assets, and constraints to preserve.
3. **Hierarchy and controls** — what users must notice or act on first,
   grouping/order, and why each control suits the action.
4. **Changed state matrix** — applicable default, hover, focus, active,
   selected, disabled, loading, empty, error, success, and destructive states.
   Do not invent irrelevant states.
5. **Inclusive and contextual behavior** — relevant narrow/wide viewport,
   touch, keyboard, focus lifecycle, screen-reader semantics, text expansion,
   and locale-independent data behavior.
6. **Alternatives and recommendation** — genuine choices only; explain the
   tradeoff in terms of the user task and local constraints, never mere taste.
7. **User decisions required** — material preferences or scope choices the
   repository cannot answer.
8. **Implementation and evidence plan** — changed states and viewport(s) to
   render or inspect, with the smallest relevant component, E2E, or manual
   proof after implementation.

## Decision Frontier

Investigate facts available from code, documentation, and focused tools rather
than asking the user to rediscover them. Ask a question only when its answer
materially affects product behavior, scope, evidence, risk, or an irreversible
decision.

For each such question, provide a short title, two or three viable options, a
recommendation, the user and engineering consequences, and a clear way to
accept the recommendation. Ask only decisions whose prerequisites are known;
defer dependent questions. If no material decision remains, record the
reversible low-risk assumption and why it fits the existing product.

## Handoff

Add the UI/UX artifact's conclusions, open decisions, and planned evidence to
the feature plan. Wait for the user's implementation approval before changing
tracked implementation files. After implementation, `$feature-completion`
compares the approved task flow and applicable state matrix with the
rendered/runtime evidence; a heuristic review must never be presented as user
research or proof of usability.
