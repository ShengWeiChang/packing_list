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

- Run `npm run format` to apply and verify formatting.

### 3.2 ESLint (Vue)

- Base: plugin-vue recommended rules
- Component attributes order: enforced for consistency
- Unused variables: allow underscore prefix for intentionally unused params (e.g., `_evt`)
- Browser globals allowed: `window`, `document`, `localStorage`, etc.
- Diagnostics: `no-console` and `no-debugger` set to warnings

Validation

- Run `npm run lint` (check) or `npm run lint:fix` (auto-fix) to ensure compliance.

### 3.3 Imports/Exports Ordering

Sorted by simple-import-sort default groups:

1. Node built-ins
2. External packages
3. Internal aliases/relative modules
4. Styles and side-effect imports

Validation

- Import order is auto-fixable via ESLint with `npm run lint:fix`.

### 3.4 Vue Template Attributes Order

- High-level principle: definition > list rendering > conditionals > bindings > events > content
- See `eslint.config.js` for the exact sequence used by the rule.

Validation

- Violations are reported by ESLint; most are auto-fixable.

## 4. Development Workflow

- Format all files: `npm run format`
- Lint check: `npm run lint`
- Lint with fixes: `npm run lint:fix`
- Validate (lint + format check): `npm run validate`
- Pre-commit: lint-staged runs automatically on staged files

## 5. Editor Integration (VS Code)

- Format on Save with Prettier as the default formatter
- ESLint code actions on save (explicit)
- Tailwind class regex support for better IntelliSense
- Source: `.vscode/settings.json`

## 6. Exceptions and Overrides

- Prefer adjusting configuration over inline disables
- If a one-off exception is necessary, keep scope minimal and include rationale, e.g.:
  `// eslint-disable-next-line <rule> -- reason`

## 7. Maintenance

- Update this document’s summaries when configuration changes
- Configuration files are the source of truth; this document emphasizes principles and usage
