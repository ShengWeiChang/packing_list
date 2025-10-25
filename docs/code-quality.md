# Packing List App - Code Quality Specification

## 1. Overview

### Purpose

Keep the codebase consistent, readable, and easy to maintain through automated formatting and linting.

### Scope

Applies to this project’s stack: Vue 3 + Vite + Tailwind, ES Modules.

## 2. Toolchain

- ESLint (Flat Config) with eslint-plugin-vue
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

### 3.2 ESLint (Vue)

- Base: plugin-vue recommended rules
- Component attributes order: enforced for consistency
- Unused variables: allow underscore prefix for intentionally unused params (e.g., `_evt`)
- Browser globals allowed: `window`, `document`, `localStorage`, etc.
- Diagnostics: `no-console` and `no-debugger` set to warnings

Validation

- Check: `npm run lint`
- Auto-fix: `npm run lint:fix`

### 3.3 Imports/Exports Ordering

Sorted by simple-import-sort default groups:

1. Node built-ins
2. External packages
3. Internal aliases/relative modules
4. Styles and side-effect imports

Validation

- Auto-fix import order: `npm run lint:fix`

### 3.4 Vue Template Attributes Order

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

### 3.5 Vue Script Section Order (guideline)

Recommended top-to-bottom organization inside `<script setup>` or component scripts:

1. Imports (vue, libs, local) — grouped and sorted; styles/side-effects last
2. Internationalization (i18n) — `useI18n()` setup
3. Constants — non-reactive constants, config
4. Props & Emits — `defineProps`, `defineEmits`
5. Composables — calls like `useXxx()`
6. State — `ref`, `reactive`
7. Computed — `computed`
8. Functions — event handlers, helpers
9. Lifecycle — `onMounted`, `onUnmounted`, etc.
10. Watchers — `watch`, `watchEffect`

This mirrors how readers scan: inputs → setup → state/derivations → behaviors → lifecycle → reactive watchers.

Validation

- Guideline only (not enforced by ESLint). Import sorting is enforced; section order relies on team practice/code review.

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
