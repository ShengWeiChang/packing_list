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

- Before handing off a meaningful user-visible behavior change, use
  `$feature-completion`.
- For an implementation-diff review, use `$code-review`.
- For a test-design, coverage-risk, or test-quality review, use
  `$test-analysis`.
- When modifying a paired document, use its matching `$doc-audit-*` skill.

## Independent Feature Verification

For a meaningful user-visible behavior change, the implementation agent must
not be the final reviewer. When the host supports delegation, request a fresh,
read-only `$code-review` reviewer after `npm run verify:feature`; request a
fresh, read-only `$test-analysis` reviewer when the change creates meaningful
test-design or coverage risk. Reviewers must not edit implementation files.

After fixing a finding, obtain a new fresh reviewer verdict before handoff. If
the host cannot delegate, perform the reviews sequentially and report the
result as `degraded: no independent delegation`; never represent it as an
independent review. Do not let multiple agents edit the same file concurrently.

## Evidence-Based Feature Handoff

For a meaningful behavior change, define the observable finish condition before
implementation and decide what evidence can prove it. At handoff, report the
user flow checked, exact commands and results, intentionally skipped layers and
why, runtime or manual evidence when interaction behavior matters, remaining
risks, and the independent-review verdict. Passing compilation or test totals
alone are not a claim that a feature works for users.
