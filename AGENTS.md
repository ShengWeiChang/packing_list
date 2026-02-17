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
