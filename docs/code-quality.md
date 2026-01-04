# Packing List App - Code Quality Specification

## 1. Overview

### Purpose

Keep the codebase consistent, readable, and easy to maintain through automated formatting and linting.

### Scope

Applies to this project’s stack: Vue 3 + Vite + Tailwind, ES Modules.

## 2. Toolchain

- ESLint (Flat Config) with eslint-plugin-vue, eslint-plugin-tailwindcss, eslint-plugin-vuejs-accessibility
- Prettier with prettier-plugin-tailwindcss
- simple-import-sort (imports/exports ordering)
- husky + lint-staged (pre-commit automation)

Authoritative configuration files:

- ESLint: `eslint.config.js`
- Prettier: `.prettierrc`, `.prettierignore`
- Editor: `.vscode/settings.json`
- Scripts: `package.json` (lint, format, validate)

## 3. Conventions

### 3.1 Prettier Formatting

- Quotes: single
- Semicolons: enabled
- Trailing commas: ES5 (objects/arrays; not function params)
- Print width: 100
- Vue templates: one attribute per line
- Tailwind classes: auto-sorted by plugin

Validation

- Apply formatting: `npm run format`
- Check only (no write): `npm run format:check`

### 3.2 Tailwind CSS Conventions

- Design system priority: Standard Tailwind classes → Custom config extensions → Arbitrary values (last resort)
- Spacing scale: Use 4px increments; extend `tailwind.config.js` for non-standard values
- Class organization: Group related classes (layout → spacing → colors → states); Prettier auto-sorts
- CSS Modules: Use for complex layouts (masonry, animations); kebab-case naming; prefer CSS variables

Validation

- ESLint rules enforce no contradicting classes and proper shorthand usage
- Custom classes must be defined in `tailwind.config.js`
- Arbitrary values trigger warnings for review
- CSS Modules classes trigger ESLint warnings (expected behavior)

### 3.3 ESLint (Vue)

- Base: plugin-vue recommended rules
- Component attributes order: enforced for consistency
- Unused variables: allow underscore prefix for intentionally unused params (e.g., `_evt`)
- Browser globals allowed: `window`, `document`, `localStorage`, etc.
- Diagnostics: `no-console` and `no-debugger` set to warnings

Validation

- Check: `npm run lint`
- Auto-fix: `npm run lint:fix`

### 3.4 Imports/Exports Ordering

Sorted by simple-import-sort default groups:

1. Node built-ins
2. External packages
3. Internal aliases/relative modules
4. Styles and side-effect imports

Validation

- Auto-fix import order: `npm run lint:fix`

### 3.5 Vue Template Attributes Order

We follow eslint-plugin-vue's default order (vue/attributes-order):

1. DEFINITION — component definition: `is`, `v-is`
2. LIST_RENDERING — list loops: `v-for`
3. CONDITIONALS — conditionals: `v-if`, `v-else-if`, `v-else`, `v-show`, `v-cloak`
4. RENDER_MODIFIERS — render-time hints: `v-once`, `v-pre`
5. GLOBAL — global identifiers: `id`
6. UNIQUE — unique per element: `ref`, `key`
7. SLOT — slots: `v-slot`, `slot`
8. TWO_WAY_BINDING — two-way bindings: `v-model`
9. OTHER_DIRECTIVES — all other directives: custom `v-*`
10. OTHER_ATTR — normal attributes in this order:

- ATTR_DYNAMIC: `:prop="foo"`, `v-bind:prop="foo"`
- ATTR_STATIC: `prop="foo"`, `custom-prop="foo"`
- ATTR_SHORTHAND_BOOL: boolean presence-only attrs (e.g., `disabled`)

11. EVENTS — events: `@click="onClick"`, `v-on="events"`
12. CONTENT — content directives: `v-text`, `v-html`

Notes

- The rule sorts attributes within these groups; many fixes are auto-applicable.
- Keep 1 attribute per line (Prettier) for large elements to improve diffs.

Validation

- Auto-fix most ordering issues: `npm run lint:fix`

### 3.6 Vue Script Section Order

Top-to-bottom organization inside `<script setup>` or component scripts:

1. Imports (vue, libs, local) — Auto-sorted: vue → external packages → local modules
2. Internationalization (i18n) — `useI18n()` setup
3. Constants — non-reactive constants, config
4. Props & Emits — `defineProps`, `defineEmits`
5. Composables — calls like `useXxx()`
6. State — `ref`, `reactive`
7. Computed properties — `computed`
8. Functions — event handlers, helpers
9. Lifecycle hooks — `onMounted`, `onUnmounted`, etc.
10. Watchers — `watch`, `watchEffect`

This mirrors how readers scan: inputs → setup → state/derivations → behaviors → lifecycle → reactive watchers.

Validation

- Guideline only (not enforced by ESLint). Import sorting is automatically handled by `simple-import-sort`; section order relies on team practice/code review.

### 3.7 JavaScript File Section Order

JS files should use appropriate grouping based on file type:

1. Imports (vue, libs, local) — Auto-sorted: side-effects (CSS) → vue → external packages → local modules
2. Constants — module-level constants, config
3. Service initialization — service instantiation (Composables only)
4. State — `ref`, `reactive` (Composables only)
5. Computed — `computed` (Composables only)
6. Functions — all functions, methods
7. Watchers — `watch`, `watchEffect` (Composables only)
8. Class definition — class definition (Class files)

**Composables** (e.g., `usePackingLists.js`): Use 1 → 3 → 4 → 5 → 6 → 7

**Class Files** (e.g., `localStorageService.js`, Models): Use 1 → 8

**Utility/Configuration Files**: Use 1 → 2 → 6

Validation

- Use `// ---` dividers (80 characters) to mark sections
- Section names use title case (e.g., `Imports`, `State`, `Functions`)
- Guideline only (not enforced by ESLint); maintained via code review

### 3.8 Comment Style

We use 4 categories of comments, each with specific purpose and format:

**File Headers**

Block comment with required metadata fields at the start of every file.

For **JavaScript files** (`.js`):

```javascript
/*
================================================================================
File: source/path/fileName.js
Description: Brief description of the file's purpose
Author: Your Name
License: MIT (SPDX: MIT)
Created: YYYY-MM-DD
================================================================================
*/
```

For **Vue files** (`.vue`):

```vue
<!--
================================================================================
File: source/components/ComponentName.vue
Description: Brief description of the component's purpose
Author: Your Name
License: MIT (SPDX: MIT)
Created: YYYY-MM-DD
================================================================================
-->
```

**Section Dividers**

Separate logical sections within a file with a fixed total length of **80 characters** (including `//` and space):

```javascript
// -----------------------------------------------------------------------------
// Section Name
// -----------------------------------------------------------------------------
```

**Nested Sections**: For dividers inside functions or classes, maintain the same 80-character total length (including indentation):

```javascript
export function useExample() {
  // ---------------------------------------------------------------------------
  // Service initialization
  // ---------------------------------------------------------------------------

  const service = new Service();
}
```

**Section Name Rules:**

- Use title case: `Imports`, `State`, `Functions`
- Use for both major sections (Imports, Class definition, Functions, Watchers) and class internal sections (Checklist CRUD, Item CRUD)

**JSDoc Comments**

Required for all exported functions, methods, and classes. Must include:

- Brief description
- `@param {Type} name - description` for each parameter
- `@returns {Type} description` for non-void returns

```javascript
/**
 * Calculate the total number of packed items
 * @param {Array<Item>} items - Array of items to count
 * @returns {number} Total count of packed items
 */
function countPackedItems(items) {
  return items.filter((item) => item.packed).length;
}
```

**Inline Comments**

Use sparingly for complex logic, workarounds, or TODOs:

```javascript
// Calculate exponential moving average (α = 0.3)
const ema = currentValue * 0.3 + previousEma * 0.7;

// WORKAROUND: Safari requires explicit focus after 300ms delay
setTimeout(() => input.focus(), 300);

// TODO: Implement pagination when list exceeds 100 items
```

Avoid comments that merely restate the code.

Validation

- JSDoc: Enforced by ESLint (`eslint-plugin-jsdoc`)
- Section dividers: Manually maintained at 80 characters
- File headers and inline comments: Code review

### 3.9 Accessibility (A11y)

Follow WCAG 2.1 Level AA standards to ensure the application is accessible to all users, including keyboard and screen reader users.

- **Keyboard Navigation**:
  - All interactive elements (buttons, links, inputs) must be focusable via the `Tab` key.
  - Non-native buttons must include `role="button"`, `tabindex="0"`, and implement `@keydown.enter` and `@keydown.space`.
- **Focus Management**:
  - Hidden interactive elements (e.g., buttons that appear on hover) must be visible when focused.
  - Use `opacity-0` + `pointer-events-none` instead of `display: none`, paired with `focus:opacity-100`.
- **Semantic HTML & ARIA**:
  - Prioritize native semantic tags.
  - Add `aria-label` to icon buttons without text labels.
  - Use `aria-expanded` and `aria-controls` to indicate collapse/expand states.
- **Focus Indicators**:
  - All focusable elements must have clear visual feedback when focused.

Validation

- Static analysis: `npm run lint` (via `eslint-plugin-vuejs-accessibility`)
- Manual testing: Navigate all features using only the `Tab` key to ensure no focus traps and full operability.

## 4. Git Hooks (Husky)

- Purpose: Enforce quality checks before commit.
- How: A pre-commit hook runs lint-staged to lint/format staged files only.
- Where: `.husky/pre-commit`, `.lintstagedrc.json`, `package.json` ("prepare": "husky").
- Test: Stage a file and run `npx lint-staged`, or make a commit.

## 5. Development Workflow

- Format all files: `npm run format`
- Lint check: `npm run lint`
- Lint with fixes: `npm run lint:fix`
- Validate (lint + format check): `npm run validate`
- Pre-commit: lint-staged runs automatically on staged files

## 6. Editor Integration (VS Code)

- Format on Save with Prettier as the default formatter
- ESLint code actions on save (explicit)
- Tailwind class regex support for better IntelliSense
- Source: `.vscode/settings.json`

## 7. Exceptions and Overrides

- Prefer adjusting configuration over inline disables
- If a one-off exception is necessary, keep scope minimal and include rationale, e.g.:
  `// eslint-disable-next-line <rule> -- reason`

## 8. Maintenance

- Update this document’s summaries when configuration changes
- Configuration files are the source of truth; this document emphasizes principles and usage
