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
- **Classes/Models**: PascalCase (e.g., `Category.ts`)
- **Services/Utils**: camelCase (e.g., `dataService.ts`)
- **Composables**: camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Config files**: kebab-case (e.g., `vite.config.js`)
- **Test files**:
  - **Unit/Component tests**: Match source file name + `.test.js`
    - `Category.test.js` tests `Category.vue` (PascalCase)
    - `helpers.test.js` tests `helpers.ts` (camelCase)
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

When the user asks for a personal learning document, create it in `learning/`.
Conversational explanations do not need a file unless the user requests one.
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
| `assets.md`        | `assets-zh.md`        |

### Rules

1. **Always edit both files together** — never update only one version
2. **Content must match exactly** — they are mutual translations
3. **Structure must be identical** — same sections, headings, code blocks, number of lines, etc.
4. **Track both files in Git** — do not add paired documentation to `.gitignore`

## README Maintenance

For every change, assess whether `README.md` remains an accurate, concise project entry point. Update it only when the project purpose, principal supported capabilities, setup or run path, public interface, contribution entry point, or top-level navigation changes. Keep detailed specifications, internal workflows, implementation details, and change history outside the README; record a concrete reason when it is not affected.

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
- Within `$feature-workflow`, `$feature-completion` coordinates `$code-review`
  and any triggered `$test-analysis` review. Use either directly only for a
  separately requested, scoped review outside that lifecycle.
- When modifying a paired document, use its matching `$doc-audit-*` skill.

## Feature Delivery Controls

`$feature-workflow` owns planning tiers, implementation milestones, and the
approval sequence. `$feature-completion` owns verification, independent review,
evidence reuse, and bounded repair cycles. Use the smallest justified tier;
persistence, sensitive data, access control, external boundaries, irreversible
actions, or high user impact remain a floor of T3. Apply `$ui-ux-design` to
non-trivial user-visible interaction changes as directed by the workflow.

Begin feature, bug, and behavior changes with read-only discovery and an ignored
plan in `plans/`; present the plan and obtain explicit implementation approval
before tracked edits. For a trivial wording, formatting, or documentation-only
change, the user may explicitly approve the reduced T0 record and implementation
together after discovery. Preserve separate approvals for commit, push, PR, and
merge; an explicit PR request also authorizes its ordinary necessary push.

For a new feature branch, inspect the worktree and branch, switch to `main`,
fast-forward pull from `origin/main`, and create the branch from updated `main`.
Preserve existing work and stop if switching or updating is unsafe or fails.
Use another base only when explicitly requested.

Before commit approval, present the scoped candidate and validation; bind the
staged index to its base and scope with `npm run fingerprint:candidate --
<scoped files>`, and recompute it immediately before committing. Do not present
a candidate as ready while required validation fails, evidence is insufficient,
or a blocking or important finding remains unresolved. Explicitly record user
acceptance of any remaining non-blocking risk. CI must pass before merge.

## Evidence-Based Feature Handoff

For every feature, bug, or behavior change that has not been explicitly reduced
to trivial after discovery, define the observable finish condition before
implementation and decide what evidence can prove it. At handoff, report the
user flow checked, exact commands and results, intentionally skipped layers and
why, runtime or manual evidence when interaction behavior matters, remaining
risks, and the independent-review verdict. Passing compilation or test totals
alone are not a claim that a feature works for users.
