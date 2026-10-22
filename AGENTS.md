# Agent Instructions

## Tailwind CSS Class Order — DO NOT REORDER

This project uses `prettier-plugin-tailwindcss` to enforce a specific
Tailwind CSS class ordering. **Never change the order of CSS classes**
inside `class=""` or `:class=""` attributes when editing Vue files.

When you need to edit a line that contains a `class` attribute:

- Copy the **exact** original class string as-is.
- Only add or remove the specific classes required for the change.
- Do **not** rearrange existing classes.

The correct order is automatically managed by Prettier and may look
counter-intuitive (e.g. `size-6 text-secondary` not
`text-secondary size-6`). Trust the existing order.

## Vue HTML Attribute Order

This project enforces `vue/attributes-order` via ESLint. The order is:
DEFINITION → LIST_RENDERING → CONDITIONALS → RENDER_MODIFIERS → GLOBAL
→ UNIQUE/SLOT → TWO_WAY_BINDING → OTHER_DIRECTIVES → OTHER_ATTR →
EVENTS → CONTENT.

When adding a new attribute (e.g., `data-testid`), insert it in the
correct position among OTHER_ATTR, but do **not** move other attributes.

## File Naming Conventions

When creating new files, follow these naming patterns:

- **Vue components**: PascalCase (e.g., `MyComponent.vue`)
- **Classes/Models**: PascalCase (e.g., `Category.js`)
- **Services/Utils**: camelCase (e.g., `dataService.js`)
- **Composables**: camelCase with "use" prefix (e.g., `useAuth.js`)
- **Config files**: kebab-case (e.g., `vite.config.js`)
- **Test files**:
  - **Unit/Component tests**: Match source file name + `.test.js`
    - `Category.test.js` tests `Category.vue` (PascalCase)
    - `helpers.test.js` tests `helpers.js` (camelCase)
  - **E2E tests**: kebab-case + `.spec.js` (describe workflows)
    - `item-packing.spec.js`, `user-login.spec.js`
- **Documentation**: kebab-case (e.g., `user-guide.md`)

Never use underscores in JavaScript file names.

## Temporary Planning Drafts

When the user asks for a temporary planning document, create it in `plans/`.
This directory is Git-ignored and is for local discussion drafts only; do not
add its contents to commits. Only version-control the approved implementation
artifacts that result from a plan.

## Personal Learning Notes

When the user asks for personal learning material, create it in `learning/`.
This Git-ignored directory is not product documentation and its contents do
not require translation, review, or commits.

## Bilingual Documentation — ALWAYS UPDATE BOTH VERSIONS

**CRITICAL**: This project maintains paired English/Chinese documentation.
When editing ANY document in `docs/`, you MUST update BOTH versions.

### Paired Documents

| English            | Traditional Chinese   |
| ------------------ | --------------------- |
| `product-spec.md`  | `product-spec-zh.md`  |
| `code-quality.md`  | `code-quality-zh.md`  |
| `testing-guide.md` | `testing-guide-zh.md` |

### Rules

1. **Always edit both files together** — never update only one version
2. **Content must match exactly** — they are mutual translations
3. **Structure must be identical** — same sections, headings, code blocks, number of lines, etc.
4. **Track both files in Git** — do not add paired documentation to `.gitignore`

## Project Skill Language

Project skills live in `.agents/skills/` and each has one English canonical
`SKILL.md`. Do not create or maintain a parallel `SKILL-zh.md`; put
human-facing Chinese explanations in the paired documentation when they are
needed. This layout is the portable source for supported agents; do not create
provider-specific copies unless a future host demonstrably requires one.

## Project Skill Routing

- For every feature request, bug fix, or behavior change, use
  `$feature-workflow` from read-only discovery through handoff. Do this even
  when the user gives only a short description.
- For verification of a reviewable implementation milestone or completed
  feature, use `$feature-completion`.
- For an implementation-diff review, use `$code-review`.
- For a test-design, coverage-risk, or test-quality review, use
  `$test-analysis`.
- When modifying a paired document, use its matching `$doc-audit-*` skill.

## Feature Delivery Control Points

For every feature request, bug fix, or behavior change, begin in planning mode.
Read the relevant implementation and create `plans/<feature>-plan-zh.md` before
changing tracked files. During discovery, only this ignored plan may be written.
The plan must record its state, request, observable finish conditions, affected
areas and risks, feasible options and their decision, validation/reviewer plan,
implementation milestones, approval/evidence log, and the feature base HEAD
SHA. Use `$feature-workflow` to coordinate this lifecycle.

Present the plan and wait for explicit approval before implementation. `Start
implementation` authorizes only the approved scope; it does not authorize a
commit, push, PR, merge, or unrelated cleanup. Update the plan after each
meaningful implementation milestone with completed work, changed scope,
evidence, reviewed scope or revision, reviewer verdict, and user decision.
Before committing, present the scoped diff and validation status for review and
confirm it has not changed since review. The approval/evidence log must record
the base HEAD SHA, scoped file list, `git status --short`, and a reproducible
candidate-diff fingerprint covering tracked and candidate untracked files.
Use `npm run fingerprint:candidate -- <scoped files>` to produce this canonical
record at review and immediately before commit; it requires the complete
candidate to be staged, rejects extra staged changes and scoped unstaged or
untracked changes, and fingerprints the index content that Git will commit.
Recompute it before committing. A `commit` approval applies only to that reviewed
candidate; push, PR, and merge each require separate explicit approval.

Only after read-only investigation may a user explicitly agree to treat a
wording, formatting, or documentation-only change as trivial and skip planning
mode. Otherwise do not infer that a feature request authorizes tracked-file
edits before the plan is approved.

Use a targeted, risk-proportionate verification gate at each meaningful
milestone. Reserve `npm run verify:feature`, runtime evidence, and final-only
specialist reviews, such as triggered `$test-analysis`, for the final gate,
unless a milestone crosses an integration boundary that requires the full gate.
Every feature, bug, or behavior change that the user has not explicitly agreed
is trivial after discovery must pass the full final gate. Report the current plan
state and the one user decision needed before proceeding.

Do not present a commit candidate or final handoff when required validation
fails, evidence is insufficient, or a reviewer requests changes. Return to the
approved repair loop instead. A remaining non-blocking risk requires explicit
user acceptance recorded in the plan before it can proceed.

## Independent Feature Verification

For every feature, bug, or behavior change that has not been explicitly reduced
to trivial after discovery, the implementation agent must not be the final
reviewer. A fresh reviewer is a read-only context that did not implement the
reviewed scope and has not issued a verdict in the current repair cycle. After a
blocking or important finding is fixed, the follow-up reviewer must be a
different read-only context that did not review the earlier repair-cycle
revision. Record its identity or context and reviewed fingerprint. When the host
supports delegation, request a fresh `$code-review` reviewer at each meaningful
milestone and final gate. Request fresh `$test-analysis` when the change affects
persistence, state/data transformations, browser-only or cross-boundary
behavior, complex interaction, or lacks direct behavior proof. Reviewers must
not edit implementation files.

After fixing a finding, obtain a new fresh reviewer verdict before handoff. If
the host cannot delegate, perform the reviews sequentially and report the
result as `degraded: no independent delegation`; never represent it as an
independent review. Do not let multiple agents edit the same file concurrently.

If PR CI or an external review raises a finding, update the plan, present the
impact and repair proposal, and wait for implementation approval. After a fix,
return through the same applicable milestone or final verification gate; never
merge with failed CI or an unresolved blocking finding.

## Evidence-Based Feature Handoff

For every feature, bug, or behavior change that has not been explicitly reduced
to trivial after discovery, define the observable finish condition before
implementation and decide what evidence can prove it. At handoff, report the
user flow checked, exact commands and results, intentionally skipped layers and
why, runtime or manual evidence when interaction behavior matters, remaining
risks, and the independent-review verdict. Passing compilation or test totals
alone are not a claim that a feature works for users.
