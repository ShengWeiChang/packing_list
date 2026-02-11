# Copilot Instructions

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
- **Test files**: Match source + `.test.js` or kebab-case + `.spec.js`
- **Documentation**: kebab-case (e.g., `user-guide.md`)

Never use underscores in JavaScript file names.
