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
- TypeScript 6.0.3 + vue-tsc 3.3.13, typescript-eslint 8.72.1, @vue/tsconfig 0.9.1

Authoritative configuration files:

- ESLint: `eslint.config.js`
- Prettier: `.prettierrc`, `.prettierignore`
- Editor: `.vscode/settings.json`
- Scripts: `package.json` (lint, format, validate)
- Types: `tsconfig.app.json`, `tsconfig.type-tests.json`; `tsconfig.json` is the editor entry point

## 3. Conventions

### 3.1 File Naming Conventions

Follow industry-standard naming patterns for consistency and IDE compatibility:

**Vue Components** (source/components/)

- Use **PascalCase**: `MyComponent.vue`, `UserProfile.vue`
- Official Vue.js Style Guide recommendation

**JavaScript/TypeScript Modules**

- **Classes/Models**: PascalCase (e.g., `Category.ts`, `User.ts`)
- **Services/Utils**: camelCase (e.g., `dataService.ts`, `helpers.ts`)
- **Composables**: camelCase with "use" prefix (e.g., `usePackingLists.ts`)
- **Config files**: kebab-case (e.g., `vite.config.js`, `tailwind.config.js`)

**Test Files**

- **Unit/Component tests**: Match source file + `.test.js`
  - `MyComponent.vue` → `MyComponent.test.js`
  - `helpers.ts` → `helpers.test.js`
- **E2E tests**: kebab-case + `.spec.js`
  - `app-loading.spec.js`, `user-login.spec.js`
  - Playwright official convention

**Documentation** (docs/)

- Use **kebab-case**: `code-quality.md`, `user-guide.md`
- Exception: `README.md`, `CONTRIBUTING.md` (uppercase convention)

**Data/Locale Files**

- Use **camelCase** for locale suffixes
- `recommendedListContentEn.ts`, `recommendedListContentZhTw.ts`
- Avoid underscores or mixed separators

### 3.2 Prettier Formatting

- Quotes: single
- Semicolons: enabled
- Trailing commas: ES5 (objects/arrays; not function params)
- Print width: 100
- Vue templates: one attribute per line
- Tailwind classes: auto-sorted by plugin

Validation

- Apply formatting: `npm run format`
- Check only (no write): `npm run format:check`

### 3.3 Tailwind CSS Conventions

- Design system priority: Standard Tailwind classes → Custom config extensions → Arbitrary values (last resort)
- Spacing scale: Use 4px increments; extend `tailwind.config.js` for non-standard values
- Class organization: Group related classes (layout → spacing → colors → states); Prettier auto-sorts
- CSS Modules: Use for complex layouts (masonry, animations); kebab-case naming; prefer CSS variables

Validation

- ESLint rules enforce no contradicting classes and proper shorthand usage
- Custom classes must be defined in `tailwind.config.js`
- Arbitrary values trigger warnings for review
- CSS Modules classes trigger ESLint warnings (expected behavior)

### 3.4 ESLint (Vue)

- Base: plugin-vue recommended rules
- Component attributes order: enforced for consistency
- Unused variables: allow underscore prefix for intentionally unused params (e.g., `_evt`)
- Browser globals allowed: `window`, `document`, `localStorage`, etc.
- Diagnostics: `no-console` and `no-debugger` set to warnings

Validation

- Check: `npm run lint`
- Auto-fix: `npm run lint:fix`

### 3.5 Imports/Exports Ordering

Sorted by simple-import-sort default groups:

1. Node built-ins
2. External packages
3. Internal aliases/relative modules
4. Styles and side-effect imports

Validation

- Auto-fix import order: `npm run lint:fix`

### 3.6 Vue Template Attributes Order

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

### 3.7 Vue Script Section Order

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

### 3.8 JavaScript/TypeScript File Section Order

JS/TS files should use appropriate grouping based on file type:

1. Imports (vue, libs, local) — Auto-sorted: side-effects (CSS) → vue → external packages → local modules
2. Constants — module-level constants, config
3. Service initialization — service instantiation (Composables only)
4. State — `ref`, `reactive` (Composables only)
5. Computed — `computed` (Composables only)
6. Functions — all functions, methods
7. Watchers — `watch`, `watchEffect` (Composables only)
8. Class definition — class definition (Class files)

**Composables** (e.g., `usePackingLists.ts`): Use 1 → 3 → 4 → 5 → 6 → 7

**Class Files** (e.g., `localStorageService.ts`, Models): Use 1 → 8

**Utility/Configuration Files**: Use 1 → 2 → 6

Validation

- Use `// ---` dividers (80 characters) to mark sections
- Section names use title case (e.g., `Imports`, `State`, `Functions`)
- Guideline only (not enforced by ESLint); maintained via code review

### 3.9 Comment Style

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

Required descriptions for exported functions, methods, and classes. JavaScript modules include:

- Brief description
- `@param {Type} name - description` for each parameter
- `@returns {Type} description` for non-void returns

TypeScript and Vue scripts retain behavioral descriptions without requiring duplicate JSDoc type tags; TypeScript annotations describe the checked contracts.

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

### 3.10 Accessibility (A11y)

Follow WCAG 2.1 Level AA standards to ensure the application is accessible to all users, including keyboard and screen reader users.

- **Keyboard Navigation**:
  - All interactive elements (buttons, links, inputs) must be focusable via the `Tab` key.
  - Non-native buttons must include `role="button"`, `tabindex="0"`, and implement `@keydown.enter` and `@keydown.space`.
- **Focus Management**:
  - Hidden interactive elements (e.g., buttons that appear on hover) must be visible when focused.
  - Closed inline action regions must be unmounted or otherwise removed from keyboard navigation; opacity alone is insufficient. Desktop hover controls remain visible on focus.
- **Semantic HTML & ARIA**:
  - Prioritize native semantic tags.
  - Add `aria-label` to icon buttons without text labels.
  - Use `aria-expanded` and `aria-controls` to indicate collapse/expand states.
- **Focus Indicators**:
  - All focusable elements must have clear visual feedback when focused.

Validation

- Static analysis: `npm run lint` (via `eslint-plugin-vuejs-accessibility`)
- Manual testing: Navigate all features using only the `Tab` key to ensure no focus traps and full operability.

### 3.11 TypeScript Contracts and Checking

- `npm run typecheck` runs the application scope guard, `vue-tsc --noEmit`, compile-only contracts, and deliberate-error diagnostic probes. Vite builds transpile without type checking.
- `strict`, `noUncheckedIndexedAccess`, and `strictTemplates` are enabled. The app project uses browser globals and `vite/client`; Node and Vitest globals are not injected.
- All application modules and 16 SFC scripts use TypeScript with `allowJs: false`; the migration manifest and temporary lint override are removed. The permanent scope guard rejects JS modules, non-TS Vue scripts, and source files missing from compiler roots, including new declarations.
- Runtime JS tests, Node configuration/scripts, locale JSON, and visual assets retain their formats outside the browser application compiler project; they are not an unchecked application migration bridge.
- TS modules retain existing naming stems with `.ts`: classes/models use PascalCase; services, utilities, composables, and type modules use camelCase. Compile-only tests use the owner's stem plus `.test.ts` under `tests/type-tests/`; Vitest excludes that directory.
- Use `import type` for type-only dependencies. Treat external JSON and caught errors as `unknown` until existing runtime checks or normalization justify narrower contracts; TS never replaces storage validation.
- Do not use `any`, `@ts-ignore`, `@ts-nocheck`, blanket module shims, or unsupported assertions to pass the gate. Document narrowly justified third-party boundaries. Described `@ts-expect-error` directives belong only in negative type tests.
- ESLint applies TypeScript recommended rules to all TS/Vue with Vue's outer parser preserved; TypeScript unused-variable rules replace overlapping core rules. lint-staged and VSCode ESLint include TS; application suppression comments and explicit any are rejected.
- Composable collections are exposed deeply readonly; the selected ID remains writable as `string | null`, and the computed selected entity may be `undefined`. Generic loaders preserve `T | null`; committed writes and failed refreshes are reported separately, and packing-only history stores immutable status snapshots.
- `componentContracts.ts` owns shared action/event/draft contracts. Runtime prop constructors, required flags, defaults and validators remain; event tuples retain the optional second baseline. Save callbacks return Promises with nullable failure results; App's generic action runner preserves argument and result types.
- `typedDraggable.ts` describes only the vuedraggable 4.1.0 API actually used, exposing the same runtime component with entity-typed models, item slots and change payloads. This justified third-party assertion adds no wrapper and contains any leakage. `vueAttributes.d.ts` extends only data attributes, with no blanket component shim.
- `useDraggableControls` in the facade owns the vuedraggable 4.1.0 `_sortable` bridge and reapplies the hold threshold through Sortable's `option()` API after construction and before gestures. It normalizes native/fallback DPR differences and removes its listeners on unmount; recheck this version-specific boundary and touch-motion tests on dependency upgrades. It also applies the current reduced-motion sorting preference.
- Legacy dates remain unknown in component props/drafts; narrow assertions at DOM, RegExp and Date/comparison operations preserve native coercion without claiming validation. Readonly template baselines copy their snapshot records and arrays into the existing DTO service contract with the same fields and comparison content.
- Accepted dependency limitation: `skipLibCheck: true` follows the Vue base config because vue-i18n 11.4.16 imports `GenericComponentInstance`, absent from Vue 3.5.44 (TS2724). This skips `.d.ts` internal checking, including local declarations; application/template code and API usage remain checked. Re-evaluate on Vue/i18n upgrades and remove the exception once the declaration mismatch is fixed.

### 3.12 Responsive Interaction Ownership

- `useDraggableControls` guards Sortable `onAdd`/`onRemove`/`onUpdate` before vuedraggable mutates models on `touchcancel`, restoring the DOM to the original parent/index while letting end cleanup run. All draggable surfaces, including the empty collapsed receiver, use the guard; normal `touchend` and mouse drops retain the original callbacks. Restore callbacks and listeners on cleanup, and recheck callback order/DOM rollback on dependency upgrades.
- Sidebar owns an order-only pending checklist projection and a count of unsettled saves; App acknowledges settlement after saving or failure recovery. Keep fresh prop fields and membership, retain a committed preview while refresh is unavailable, and release it after a later read. An earlier settlement must not clear a newer pending move or active gesture.
- Drag item batches derive `expectedCategoryMembership` from complete source/target baselines, including hidden items and empty receivers. `LocalStorageService.updateMultipleItems` validates affected category coverage and exact item-ID sets inside the write lock before any write; mismatch rejects the batch atomically with `conflict`. Ordinary name/packing batches omit this drag-only option and retain field-intent merging.
- `useMasonryMotion` observes category sizes and child-list changes only; it delegates reflow to the same Sortable animation state manager and yields to native drag-over animation during category dragging. Category contents and item action regions mark their height-transition owner with `data-height-motion`. During that transition, same-column cards follow the changing layout directly; column changes still animate. Do not add a competing wrapper transform transition. Resize, reduced motion and unmount clear owned timers/transforms; floating previews remain separate.
- `useTouchLayout` owns Checklist capability subscriptions and cleanup; Sidebar width thresholds remain separate. Checklist owns one open item ID, Category forwards it, and Item keeps editing/draft state. Do not persist expansion or duplicate mutation handlers. Item dragging blurs the old name editor through its existing save/failure path. Category owns a separate empty receiver for collapsed drops, forwards additions to the existing move handler, and disables that Sortable whenever hidden or outside an item drag. Its MutationObserver maps the native placeholder to a transient visual snapshot below progress; the native ghost is hidden, the observer is disconnected on unmount, and the snapshot stays until retraction finishes without entering persisted data.
- Preserve the product distinction between available layout space and input capability: a wide touch view can have multiple columns, and a hybrid device must still be able to open item actions by touch. Do not use a device name or viewport width alone as a proxy for hover capability.
- Both rename entry points share the editor. When an action follows an active edit, preserve the save-before-action ordering and failed draft; opening the action region alone must not focus the input or reflow the item name. Outside activation closes the region without consuming the destination click; scrolling alone must not activate it.
- `touch-target` in `source/index.css` enlarges real controls on narrow/coarse/no-hover views; scoped `inline-action` styles belong to Item. The pending completion target contains a smaller visual icon; touch overflow commands retain 44px minimum height. Keep approved scoped class names in the ESLint whitelist.
- `OverflowMenu` renders touch item/category triggers without individual backgrounds and uses a category-aware desktop hover background; Category supplies touch visibility and Item owns the row-wide hover/open feedback for incomplete and complete categories. Name hover uses the same state-aware control colors under mouse-capable input. Preserve 44px touch targets and keyboard focus visibility.
- `Category` owns the wider-touch item spacing; `Item` and `AddItemButton` keep display/editor typography and text alignment consistent without shifting the plus or reducing touch targets. The item container uses flex gap rather than DOM-sibling margins, so an empty-list placeholder appended after the footer has the same visual spacing as the committed row.
- The touch multi-column container uses `contain: layout` to address Chromium repaint behavior when its width changes. When changing that containment, check dynamic column resizing and popup positioning together.
- Inline action regions are non-modal button groups with labelled triggers and expanded/control relationships. Close by reason: Escape returns focus, outside clicks retain their destination, and rename focuses its input.
- `focusEditingInput` owns editor scrollport geometry, temporary bottom space and cleanup; one active editor owns each scrollport. `useVisualViewport` owns modal viewport subscriptions. App owns modal background isolation and body scroll restoration; a higher dialog takes precedence over the drawer. A visually departing mobile drawer is inert and hidden from assistive technology while focus returns to the appropriate active surface. Popup positioning is shared through `positionDropdownWithinViewport`; popups portal into their nearest modal ancestor, falling back to `body`, to preserve focus and inert ownership.

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
- Check application types and checker contracts: `npm run typecheck`
- Pre-commit: lint-staged runs automatically on staged files
- GitHub Actions runs `npm run verify:feature` on pull requests and pushes to `main`; see `.github/workflows/test.yml`.

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

## 9. Future Considerations

- Evaluate optional tools against demonstrated gaps, maintenance cost, and compatibility rather than fixed size thresholds:
  - `eslint-plugin-unicorn`: select rules that prevent recurring issues without excessive noise.
  - `stylelint`: consider it when CSS or Vue style defects warrant dedicated checks.
  - `eslint-plugin-i18n-json`: consider it for uncovered localization risks; existing tests already check locale key parity.
