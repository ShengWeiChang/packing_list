# Packing List App - Testing Guide

## 1. Overview

### Purpose

Ensure application correctness and prevent regressions through a comprehensive automated test suite covering models, services, composables, utilities, Vue components, and end-to-end user flows.

### Scope

Applies to this project's stack: Vue 3 + Vite + Vitest + @vue/test-utils + Playwright.

### Results Summary

| Metric             | Value  |
| ------------------ | ------ |
| Total tests        | 929    |
| Unit tests         | 348    |
| Component tests    | 338    |
| E2E tests          | 243    |
| Line coverage      | 87.75% |
| Statement coverage | 85.82% |
| Branch coverage    | 76.27% |
| Pass rate          | 100%   |

## 2. Test Architecture

### Testing Layers

| Layer     | Tool                           | Tests | Purpose                                            |
| --------- | ------------------------------ | ----- | -------------------------------------------------- |
| Unit      | Vitest                         | 348   | Pure logic in models, services, composables, utils |
| Component | Vitest + @vue/test-utils       | 338   | Vue component rendering, events, state             |
| E2E       | Playwright + Chromium / WebKit | 243   | Full user flows in browser engines                 |

### Platform Verification Matrix

| Where                   | Unit / Component                                      | E2E                                                                                                   | How                                                                                                                   |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Local macOS             | All 348 Unit and 338 Component tests can run locally. | All 243 browser executions can run, or select focused tests.                                          | `npm run verify:feature` runs the full feature gate on the Mac; use Vitest or Playwright commands for focused checks. |
| Local Linux container   | All 348 Unit and 338 Component tests.                 | All 243 browser executions.                                                                           | `sh scripts/ci-container.sh full` runs the feature gate and separate Node container/report contract tests in Docker.  |
| GitHub Linux CI         | Node container/report contract tests.                 | Six shared Chromium core smoke cases.                                                                 | `sh scripts/ci-container.sh smoke` runs in Docker on each PR.                                                         |
| GitHub Windows runner   | All 348 Unit and 338 Component tests.                 | All 243 browser executions.                                                                           | The Windows 2025 job runs `npm run verify:feature` on each PR.                                                        |
| GitHub macOS runner     | All 348 Unit and 338 Component tests.                 | All 243 browser executions.                                                                           | The macOS job runs `npm run verify:feature` on each PR.                                                               |
| Android and iOS devices | Not applicable.                                       | No tests on mobile devices; Chromium and WebKit emulate mobile viewports and some touch interactions. | Browser emulation does not provide a mobile operating system.                                                         |

The PR checks `macos-full` and `windows-full` run the full gates; `linux-smoke` runs the six shared core cases. Each full gate uploads available test reports, failure attachments, checkout metadata and Playwright browser versions in its own artifact. Linux smoke does not include the edit-while-dragging regression; use the focused or full container command below to check that scenario on Linux. A separate failure-artifact probe runs when workflows, Docker, test scripts, dependency manifests, patches or Playwright configuration change. Its path filters are maintained in `.github/workflows/failure-artifact-probe.yml`; the workflow can also be run manually after it exists on the default branch. The probe checks a controlled failure and attachment upload, not product behavior. When renaming platform checks, verify the new checks run and update GitHub required status checks; do not make the path-filtered probe globally required.

The Linux smoke uses a fixed list and execution report to reject missing, extra, skipped, flaky or runner-error cases. `node scripts/windowsSmoke.js` can exercise the same six cases locally; its result belongs to the host OS. Each platform job uploads available checkout metadata and diagnostics to a separate artifact.

The 243 E2E executions are 233 in Chromium, 6 selected core cases in Playwright WebKit (`webkit-core`), and 4 responsive cases in Playwright WebKit (`webkit-rwd`). A source case executed in multiple projects counts once per execution. Chromium runs the general E2E baseline, including the same four responsive cases; WebKit adds the selected core and responsive checks, not the full Chromium suite. Playwright Chromium and WebKit are not branded Google Chrome or native Safari.

The six core cases cover item creation, editing, quantity, pending and packed status, reload and deletion; two viewport sizes for date editing; storage failure and draft recovery; keyboard menu focus; and mouse sorting with reload. Five are selected existing cases and one joins an item lifecycle that previously lacked complete reload evidence. The four responsive cases cover touch-emulated actions, short dialogs and dates, tablet layout, and short mobile navigation.

Unit and Component tests run in Vitest's Node/jsdom environment, not in the actual browser or operating system UI. The full feature gate also checks formatting, lint, generated colors, TypeScript, inventory and production build. Node container/report contract tests run separately through the Linux container entrypoint and are not included in the 862 test total. The totals and platform counts describe the current test inventory.

### Toolchain

| Package             | Version | Role                         |
| ------------------- | ------- | ---------------------------- |
| vitest              | 4.1.12  | Test runner and assertion    |
| @vue/test-utils     | 2.4.6   | Vue component test utilities |
| @vitest/coverage-v8 | 4.1.12  | Code coverage (V8 provider)  |
| playwright          | 1.58.2  | Browser-based E2E testing    |
| jsdom               | 28.0.0  | DOM environment for Vitest   |
| typescript          | 6.0.3   | Static compiler contracts    |
| vue-tsc             | 3.3.13  | TS and Vue template checks   |

### Compile-Only Type Contracts

`npm run typecheck` is a separate static gate, not a fourth runtime test layer. It checks source/compiler scope, then the application and `tests/type-tests/` contracts. Vitest excludes this directory; compile-only assertions and expected diagnostic probes do not count toward runtime totals or runtime coverage.

The initial infrastructure suite proves numeric ref inference, null narrowing, indexed-access safety, and real SFC props/emits. Two isolated probes require exactly TS2322 in deliberately invalid TS and Vue template fixtures; an unrelated missing module, config error, crash, or unexpected success fails the probe. The domain/storage suite checks real model normalization, legacy unknown fields, portable snapshots, seed sources, mutation baselines, nullable lookups, lock results, JSON cloning, debounce arguments, and plain-data ordering with overwritten fields.

Composable compile-only suites check writable selection, readonly collections and nested snapshots, nullable entities/results, async callbacks, drag baselines/field keys, and immutable packing history.

The real-component compile-only suite checks nullable async actions, second-argument baselines, source-specific selections and semantic icons. An additional Vue template fixture checks invalid props/callbacks and wrong fields/methods in typed drag slots; IsAny assertions prove models, slots, change elements and forwarding baselines do not become any.

The gate requires TypeScript application modules and Vue scripts and checks compiler roots; new JS, non-TS Vue scripts, allowJs or omitted source files fail. `skipLibCheck: true` is the accepted Vue/i18n declaration compatibility exception described in the Code Quality Guide.

## 3. Test File Structure

```
tests/
├── test-setup/
│   └── setup.js                         # Global mocks: localStorage, crypto, scrollIntoView
│
├── type-tests/                          # Compile-only; excluded from runtime counts
│   ├── componentContracts.test.ts    # Real props/emits, async actions and drag slots
│   ├── contracts.test.ts               # Domain/storage, snapshot, and callback contracts
│   ├── usePackingLists.test.ts        # Reactive state, operation, and history contracts
│   ├── useTemplates.test.ts           # Template state, snapshot, and callback contracts
│   ├── typecheckInfrastructure.test.ts   # Strict inference and component contracts
│   └── fixtures/                        # Typed probe and deliberately invalid inputs
│
├── unit-tests/                          # 348 tests
│   ├── data/                            #  4  tests
│   │   └── recommendedLists.test.js        #  4  tests
│   ├── models/                          # 40  tests
│   │   ├── Item.test.js                 # 17  tests
│   │   ├── Category.test.js             #  9  tests
│   │   └── Checklist.test.js            # 11  tests
│   │   └── Template.test.js             #  3  tests
│   ├── services/                        # 133 tests
│   │   ├── localStorageService.test.js  # 87  tests
│   │   ├── templateService.test.js      # 15  tests
│   │   ├── storageTransaction.test.js  # 27  tests
│   │   └── recommendedListService.test.js  #  4  tests
│   ├── composables/                     # 95  tests
│   │   ├── useUndoHistory.test.js       # 6   tests
│   │   ├── usePackingLists.test.js      # 71  tests
│   │   └── useTemplates.test.js         # 16  tests
│   │   └── useTouchLayout.test.js       #  1  test
│   │   └── useVisualViewport.test.js    #  1  test
│   ├── i18n/                            # 12  tests
│   │   └── index.test.js                # 12  tests
│   ├── utils/                           # 41  tests
│       ├── operationErrors.test.js    #  3  tests
│       ├── helpers.test.js              # 21  tests
│       ├── positioning.test.js          #  4  tests
│       ├── order.test.js                #  8  tests
│       ├── dragDrop.test.js             #  2  tests
│       └── focusEditingInput.test.js     #  3  tests
│   └── scripts/                         # 23 tests
│       ├── candidateFingerprint.test.js #  2  tests
│       ├── checkTypeScriptScope.test.js #  8  tests
│       ├── eslintTypeScript.test.js     #  2  tests
│       ├── cssVars.test.js              #  5  tests
│       └── verifyFeature.test.js        #  6  tests
│
├── component-tests/                     # 338 tests
│   ├── App.test.js                      # 81  tests
│   ├── PackingCompletionOverlay.test.js # 10  tests
│   ├── AppIcon.test.js                  #  4  tests
│   ├── Checklist.test.js                # 44  tests
│   ├── Item.test.js                     # 37  tests
│   ├── Sidebar.test.js                  # 36  tests
│   ├── typedDraggable.test.js           #  7  tests
│   ├── Category.test.js                 # 32  tests
│   ├── OverflowMenu.test.js             # 24  tests
│   ├── ProgressBar.test.js              #  8  tests
│   ├── AddItemButton.test.js            #  8  tests
│   ├── Topbar.test.js                   #  2  tests
│   ├── PendingItemsCategory.test.js     #  5  tests
│   ├── AddCategoryButton.test.js        #  2  tests
│   ├── NewChecklistDialog.test.js       # 12  tests
│   ├── TemplateEditor.test.js           # 16  tests
│   └── SaveTemplateDialog.test.js       # 10  tests
│
└── end2end-tests/                       # 243 tests
    ├── touchDragHelpers.js              # Hold-motion and native-scroll gestures
    ├── mobile-workflow.spec.js          # 10  tests
    ├── rwd-phone.spec.js                #  8  tests
    ├── rwd-overlays.spec.js             #  6  tests
    ├── rwd-webkit.spec.js               #  8  tests
    ├── sidebar-presentation.spec.js     #  12  tests
    ├── item-packing.spec.js             # 10  tests
    ├── language-switch.spec.js          #  6  tests
    ├── app-loading.spec.js              #  5  tests
    ├── checklist-management.spec.js     #  6  tests
    ├── category-crud.spec.js            #  3  tests
    ├── drag-and-drop.spec.js            #  8  tests
    ├── desktop-drag-presentation.spec.js # 19  tests
    ├── drag-settlement.spec.js           # 15  tests
    ├── drag-membership-conflict.spec.js  #  1  test
    ├── category-motion.spec.js          #  8  tests
    ├── interaction-feedback.spec.js      #  10  tests
    ├── multi-tab-sync.spec.js           #  10  tests
    ├── core-smoke.spec.js               #  2  tests
    ├── checklist-dates.spec.js          # 18  tests
    ├── template-navigation.spec.js      # 23  tests
    ├── template-management.spec.js      #  8  tests
    ├── recommended-lists.spec.js        #  1  test
    ├── undo-redo-ui.spec.js             # 16  tests
    └── storage-recovery.spec.js         # 30  tests
```

Each per-file E2E count records browser-project executions; `Test Case` comments number distinct source cases, so shared cases appear once in source and once per project here.

### Naming Conventions

- **Unit/Component tests** (`.test.js`): Match production file names exactly
  - `Category.test.js` → tests `Category.vue`
  - `usePackingLists.test.js` → tests `usePackingLists.ts`
- **E2E tests** (`.spec.js`): Use kebab-case to describe user workflows
  - `item-packing.spec.js`, `checklist-management.spec.js`

### Test Comment Conventions

Every test file groups related assertions with `Test Group N` dividers and prefixes every `it()` or `test()` case with a sequential `Test Case N` comment. Numbering begins at 1 in each file and must match the executable case count (including expanded parameterized cases). The comment is a concise `Should ...` description of the behavior under test.

Validation: Local `npm run test:inventory` executes Vitest and Playwright, then verifies this convention against their reported test counts and rejects inventory sections that are out of Unit → Component → E2E order. `npm run verify:feature` runs each test runner once, writes their JSON reports to `test-inventory-reports/`, then uses `npm run test:inventory:ci` to audit those reports without rerunning either suite; GitHub Actions calls this same command. Both modes compare executed case identities with fresh runner lists and reject skipped, todo, flaky, missing, duplicate, or incomplete reports. Both modes always audit the tracked English and Chinese guides. Use `npm run test:inventory:sync` to update generated guide totals and file-heading counts after the tests pass; it never rewrites test comments.

## 4. Coverage Breakdown

### By Module

| Module       | Statements | Branch | Lines  |
| ------------ | ---------- | ------ | ------ |
| scripts/     | 83.16%     | 73.33% | 82.59% |
| source/      | 75.57%     | 65.51% | 79.32% |
| components/  | 81.2%      | 73.48% | 83.97% |
| composables/ | 96.29%     | 88.56% | 97.28% |
| models/      | 100%       | 100%   | 100%   |
| services/    | 95.04%     | 84.98% | 95.41% |
| utils/       | 96.96%     | 87.4%  | 96.62% |

### By Component

| Component                    | Statements | Lines  | Tests |
| ---------------------------- | ---------- | ------ | ----- |
| App.vue                      | 75.57%     | 79.32% | 81    |
| AppIcon.vue                  | 100%       | 100%   | 4     |
| AddCategoryButton.vue        | 100%       | 100%   | 2     |
| AddItemButton.vue            | 100%       | 100%   | 8     |
| ProgressBar.vue              | 100%       | 100%   | 8     |
| Topbar.vue                   | 57.14%     | 57.14% | 2     |
| PendingItemsCategory.vue     | 100%       | 100%   | 5     |
| Sidebar.vue                  | 82.58%     | 84.23% | 36    |
| OverflowMenu.vue             | 87.5%      | 89.81% | 24    |
| Category.vue                 | 80%        | 83.48% | 32    |
| Checklist.vue                | 71.54%     | 75.47% | 44    |
| Item.vue                     | 88.43%     | 92.46% | 37    |
| NewChecklistDialog.vue       | 95%        | 95.94% | 12    |
| PackingCompletionOverlay.vue | 97.14%     | 100%   | 10    |
| SaveTemplateDialog.vue       | 92.72%     | 93.87% | 10    |
| TemplateEditor.vue           | 93.68%     | 95%    | 16    |

### Coverage Metrics Explained

| Metric     | Definition                                   |
| ---------- | -------------------------------------------- |
| Statements | Percentage of executable statements executed |
| Branch     | Percentage of conditional branches taken     |
| Lines      | Percentage of source lines executed          |

Coverage note: Branch is the strictest metric. Remaining uncovered branches are mostly defensive guards and secondary conditional paths. The container and report contract tests run separately with Node and are not included in these Vitest coverage figures.

## 5. Running Tests

### Unit and Component Tests

```bash
npm test              # Watch mode (development)
npm run test:run      # Single run
```

### Specific Tests

```bash
npx vitest run tests/unit-tests/models/Item.test.js
npx vitest run tests/component-tests/
```

### E2E Tests

```bash
npm run test:e2e      # Headless mode
npm run test:e2e:ui   # Interactive UI mode
```

### Specific E2E Tests

```bash
npx playwright test tests/end2end-tests/app-loading.spec.js --headed
```

### Linux Container Tests

With Docker running, `sh scripts/ci-container.sh smoke` runs the six shared core cases, `sh scripts/ci-container.sh focused` runs the selected high-risk cases, and `sh scripts/ci-container.sh full` runs the complete feature gate. Use `sh scripts/ci-container.sh case <Playwright arguments>` for an individual case. Each run installs Linux dependencies in a separate temporary volume and writes reports to a new `.container-test-artifacts/` directory; the Mac `node_modules` is not shared. The first image download and each dependency installation take time and disk space. A local ARM64 container and the CI amd64 runner use the same image definition but are not identical machines. When upgrading, maintain `.nvmrc`, the pinned image digest in `docker/Dockerfile`, the matching image and architecture digest metadata in `scripts/ci-container.sh` and `docker/test-entrypoint.sh`, the entrypoint version check, and the Playwright lockfile together as applicable. Re-run the Linux smoke and the macOS and Windows full gates, and verify both image architectures and the actual PR jobs. Reassess pinned runner versions when changing them; an image label does not freeze every installed update.

### Coverage Report (run last)

```bash
npm run test:coverage # Vitest code coverage only: outputs terminal summary + coverage/index.html; focuses on source line/branch coverage, not Playwright E2E flow coverage（不含 Playwright E2E）
```

### Test Inventory Audit

```bash
npm run test:inventory      # Execute Vitest + Playwright and verify comments plus available guides
npm run test:inventory:sync # After passing, synchronize generated guide counts
npm run check:css-vars      # Check generated theme colors without modifying CSS
npm run typecheck           # Source scope, application types, compile-only contracts, diagnostic probes
npm run verify:feature      # Full feature verification: validate, typecheck, coverage, E2E, inventory, build
npm run verify:feature -- --docs # Documentation-only validation; reports skipped test and build layers
```

## 6. Testing Layers and Responsibilities

This project uses three layers to balance speed and reliability.

| Layer     | Validation goal                                                                  | Typical scope             | Feedback speed | Why this layer matters                                       |
| --------- | -------------------------------------------------------------------------------- | ------------------------- | -------------- | ------------------------------------------------------------ |
| Unit      | Verify pure logic, validation rules, data transforms, edge/error handling        | models, services, utils   | Fastest        | Catches logic regressions early with the lowest runtime cost |
| Component | Verify render output, props/emits contracts, local interaction/state transitions | Vue component boundaries  | Fast           | Confirms UI behavior without full-browser overhead           |
| E2E       | Verify real user workflows in an actual browser/runtime environment              | cross-feature integration | Slowest        | Detects integration gaps that lower-level tests can miss     |

### Responsive Interaction Evidence

`rwd-phone.spec.js` explicitly sets touch contexts and verifies phone/tablet actions, real hit areas, name geometry, once-one expansion, reload and long-press sorting, plus desktop mouse regression. `rwd-overlays.spec.js` covers drawer focus, nested dialogs, short screens, native dates and simulated keyboard geometry/error recovery. `rwd-webkit.spec.js` runs under both Chromium and `webkit-rwd` with the same touch-emulated settings; `webkit-core` additionally runs the selected desktop core cases. CI installs both engines. Emulation and synthetic viewport/IME events do not prove native keyboard or physical-device comfort; record physical-device results separately.

`drag-settlement.spec.js` covers pending sidebar order across layouts, failed saves, moved-placeholder `touchcancel` for seven receiving/reordering paths, and normal touch release. Its cancellation gestures use Chromium CDP emulation; they do not prove physical iOS/Safari interruption behavior. `typedDraggable.test.js` exercises the real vuedraggable model/change boundary. `drag-membership-conflict.spec.js` uses two real pages to verify stale membership rejection and reload; service/composable cases cover exact membership, hidden rows and compatible field edits.

#### Responsive Manual Acceptance

- Use an isolated test checklist and record the build or commit, date, device, OS, browser, orientation, input method, steps, expected and actual results, and pass/fail/not run. Save screenshots or recordings when useful. An untested device remains not run.
- Desktop mouse and keyboard: Check direct renaming, hover actions and their dismissal, Tab and Escape, menus near viewport edges, drawer/dialog focus order, long names and 200% zoom.
- Phone touch: Find the ellipsis without a hint; open, adjust quantity and pending, switch items, tap outside and scroll. At quantity 1, verify decrement uses the existing delete flow. Edit with the actions open, then perform another action and check the saved name. Reload to check persisted changes.
- Native keyboard: Add items at the bottom, edit a long name, use an IME and its candidate selection, hide and reopen the keyboard, rotate, and scroll manually. Check visibility, comfortable spacing, draft preservation and unwanted scrolling.
- Tablet and phone overlays: Check portrait, landscape and tablet split view, multiple columns where space allows, visible touch actions, cross-category drag, sidebar transitions and reduced motion. With an external keyboard or mouse, when available, check focus and Escape. Ask a first-time user to find quantity, pending and rename without prompting; treat observations as usability clues.
- Tablet sidebar regression: Open and close it repeatedly with checklists present; look for a brief horizontal scrollbar or dark line near the bottom of the checklist scroll area. A prior simulated touch layout showed horizontal overflow, but the reported line's exact source was not directly confirmed on hardware.

## 7. CI/CD Execution Stages

| Stage               | Trigger              | Test scope executed                                  | Purpose                                                                 |
| ------------------- | -------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| Development process | Manual               | Manually selected by developer                       | Fast local checks during implementation                                 |
| Commit              | `git commit`         | Unit + Component                                     | Block obvious regressions before push                                   |
| CI on push          | `push` to `main`     | Typecheck + Unit + Component + E2E + inventory audit | Reject type errors, then run each runtime suite once and audit metadata |
| CI on pull request  | `pull_request` event | Typecheck + Unit + Component + E2E + inventory audit | Reject type errors, then verify runtime behavior and metadata           |

## 8. Complete Test Inventory

### 8.1 Unit Tests (348 tests)

#### 8.1.1 Models (40 tests)

##### 8.1.1.1 Item.test.js (17 tests)

| #   | Test                                             |
| --- | ------------------------------------------------ |
| 1   | should create an item with default values        |
| 2   | should accept custom values                      |
| 3   | should generate a unique ID                      |
| 4   | should generate ID with correct prefix           |
| 5   | should throw error for empty name                |
| 6   | should throw error for name exceeding max length |
| 7   | should accept name at max length                 |
| 8   | should throw error for non-string name           |
| 9   | should throw error for quantity less than 1      |
| 10  | should throw error for negative quantity         |
| 11  | should accept large quantity                     |
| 12  | should throw error for quantity greater than 999 |
| 13  | should serialize to JSON correctly               |
| 14  | should deserialize from JSON correctly           |
| 15  | should preserve all properties through roundtrip |
| 16  | should toggle isPacked from false to true        |
| 17  | should toggle isPacked from true to false        |

##### 8.1.1.2 Category.test.js (9 tests)

| #   | Test                                             | What it verifies            |
| --- | ------------------------------------------------ | --------------------------- |
| 1   | should create a category with default values     | Constructor defaults        |
| 2   | should accept custom values                      | All fields specified        |
| 3   | should generate a unique ID                      | Unique IDs                  |
| 4   | should generate ID with correct prefix           | Prefix format               |
| 5   | should throw error for name exceeding max length | Over-length validation      |
| 6   | should allow empty name                          | Empty name is permitted     |
| 7   | should throw error for non-string name           | Rejects non-string types    |
| 8   | should serialize to JSON correctly               | `toJSON()` shape            |
| 9   | should deserialize from JSON correctly           | `fromJSON()` reconstruction |

##### 8.1.1.3 Checklist.test.js (11 tests)

| #   | Test                                             | What it verifies                   |
| --- | ------------------------------------------------ | ---------------------------------- |
| 1   | should create a checklist with default values    | Constructor defaults               |
| 2   | should accept custom values                      | All fields specified               |
| 3   | should generate a unique ID                      | Unique IDs                         |
| 4   | should generate ID with correct prefix           | Prefix format                      |
| 5   | should trim whitespace from name                 | `"  Trip  "` → `"Trip"`            |
| 6   | should throw error for name exceeding max length | Over-length validation             |
| 7   | should allow empty name                          | Empty name is permitted (untitled) |
| 8   | should throw error for non-string name           | Rejects non-string types           |
| 9   | should serialize to JSON correctly               | `toJSON()` shape                   |
| 10  | should deserialize from JSON correctly           | `fromJSON()` reconstruction        |
| 11  | should preserve all properties through roundtrip | Lossless serialization             |

##### 8.1.1.4 Template.test.js (3 tests)

| #   | Test                                             | What it verifies     |
| --- | ------------------------------------------------ | -------------------- |
| 1   | creates a template with generated ID and content | Constructor defaults |
| 2   | trims its name and round-trips snapshot content  | Serialization        |
| 3   | rejects a non-string or too-long name            | Name validation      |

#### 8.1.2 Services (133 tests)

##### 8.1.2.1 localStorageService.test.js (87 tests)

| #   | Test                                                                                    | What it verifies                                   |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | should initialize with empty data when localStorage is empty                            | Fresh start state                                  |
| 2   | should not overwrite data on repeated initialization                                    | Idempotent init                                    |
| 3   | should not overwrite when app data key already exists                                   | initializeStorage early return                     |
| 4   | should preserve corrupted localStorage data and report an error                         | Corrupt-data preservation                          |
| 5   | should reject invalid collection types without replacing stored data                    | Invalid data preservation                          |
| 6   | should create a new checklist                                                           | Create + persist                                   |
| 7   | should create general recommended list data for a new checklist by default              | General recommended list fallback                  |
| 8   | should persist supplied seed data when creating a checklist                             | Generic seeded creation                            |
| 9   | should get checklist by ID                                                              | Single-entity retrieval                            |
| 10  | should return null for non-existent checklist                                           | Missing entity returns null                        |
| 11  | should update an existing checklist                                                     | Mutation + persist                                 |
| 12  | should throw error when updating non-existent checklist                                 | Update guard                                       |
| 13  | should delete a checklist and its associated data                                       | Cascade delete                                     |
| 14  | should create a new category                                                            | Create + persist                                   |
| 15  | should get categories for a checklist                                                   | Filtered retrieval                                 |
| 16  | should update a category                                                                | Mutation + persist                                 |
| 17  | should delete a category and its items                                                  | Cascade delete                                     |
| 18  | should get a category by ID                                                             | Get category by ID                                 |
| 19  | should return null for non-existent category by ID                                      | Missing category returns null                      |
| 20  | should create a new item                                                                | Create + persist                                   |
| 21  | should update an item                                                                   | Mutation + persist                                 |
| 22  | should throw error when updating non-existent item in checklist                         | Update non-existent throws                         |
| 23  | should delete an item                                                                   | Remove + persist                                   |
| 24  | should get item by ID within a checklist                                                | Get item by ID                                     |
| 25  | should return null when item is not found within a checklist                            | Missing item returns null                          |
| 26  | should toggle item packed status                                                        | Toggle + persist                                   |
| 27  | should use cache on subsequent getData calls                                            | Cache hit                                          |
| 28  | should update cache after save operation                                                | Cache invalidation                                 |
| 29  | should duplicate a checklist with all categories and items                              | Deep copy with new IDs                             |
| 30  | should reorder other checklists when duplicating in the middle                          | Insert duplicate + reorder                         |
| 31  | should throw error when duplicating non-existent checklist                              | Duplicate guard                                    |
| 32  | should duplicate a category with all its items                                          | Category-level copy                                |
| 33  | should throw error when duplicating non-existent category                               | Duplicate guard                                    |
| 34  | should duplicate an item within the same category                                       | Single item copy                                   |
| 35  | should throw error when duplicating non-existent item                                   | Duplicate guard                                    |
| 36  | should update multiple checklists at once                                               | Batch update                                       |
| 37  | should return English copy suffix by default                                            | Locale-aware suffix                                |
| 38  | should return Chinese copy suffix for zh-TW locale                                      | zh-TW suffix                                       |
| 39  | should return fallback copy suffix for unknown locale                                   | Unknown locale fallback                            |
| 40  | should dispose resources and clear cache                                                | Cleanup                                            |
| 41  | should handle deleting non-existent category gracefully                                 | No-op delete                                       |
| 42  | should handle deleting non-existent item gracefully                                     | No-op delete                                       |
| 43  | should propagate errors when storage save fails                                         | Error propagation                                  |
| 44  | should truncate duplicate name when original name is at max length                      | Boundary: name truncation                          |
| 45  | should invalidate cache when storage event fires with matching key                      | Cross-tab cache invalidation                       |
| 46  | should reset \_initialized when storage key is removed in another tab                   | Cross-tab removal handling                         |
| 47  | should ignore storage events for unrelated keys                                         | Event key filtering                                |
| 48  | should throw Storage operation failed when setItem throws                               | QuotaExceeded error path                           |
| 49  | should throw when updating non-existent category                                        | Non-existent update guard                          |
| 50  | should truncate duplicate category name when at max length                              | Category name truncation                           |
| 51  | should truncate duplicate item name when at max length                                  | Item name truncation                               |
| 52  | should read user-locale from localStorage when no locale provided                       | Read locale from storage                           |
| 53  | should default to English suffix when no locale in storage                              | Locale fallback                                    |
| 54  | should handle multiple dispose calls gracefully                                         | dispose idempotency                                |
| 55  | should store and retrieve emoji in checklist name                                       | Unicode emoji support                              |
| 56  | should store and retrieve CJK characters in category name                               | CJK character support                              |
| 57  | should store HTML-like strings as plain text                                            | XSS-safe storage                                   |
| 58  | should handle special characters in item names                                          | Special character encoding                         |
| 59  | should handle gracefully when getItem throws on getData                                 | localStorage disabled/unavailable                  |
| 60  | should normalize missing arrays from storage payload                                    | Sparse payload fallback                            |
| 61  | should handle missing checklists array in cache                                         | Cache shape fallback                               |
| 62  | should handle missing categories array in cache                                         | Cache shape fallback                               |
| 63  | should handle missing items array in cache                                              | Cache shape fallback                               |
| 64  | should allow create operations with sparse cache shape                                  | Sparse cache create path                           |
| 65  | should reject the whole batch when a checklist does not exist                           | Atomic batch failure                               |
| 66  | should return all categories across all checklists                                      | Unfiltered categories path                         |
| 67  | should use original categoryId for items whose category was not found                   | Orphan item fallback                               |
| 68  | should duplicate checklist when stored categories and items are absent                  | Legacy defaults                                    |
| 69  | should duplicate category when stored items are absent                                  | Legacy defaults                                    |
| 70  | should duplicate item when stored data has no reorder targets                           | Duplicate fallback path                            |
| 71  | should reject stale concurrent checklist updates                                        | Same-field conflict                                |
| 72  | should invalidate cache after storage event from another tab                            | Cross-tab invalidation                             |
| 73  | should handle high data volume (50+) without losing correctness                         | Scale correctness                                  |
| 74  | should cascade delete categories and items when deleting checklist                      | Cascade integrity                                  |
| 75  | should cascade delete all items in a deleted category                                   | Cascade integrity                                  |
| 76  | should preserve relative order semantics after duplicate and delete                     | Order consistency                                  |
| 77  | should keep general recommended list shape stable across en and zh-TW locales           | Locale stability                                   |
| 78  | should reject a stale item update without overwriting newer fields                      | Same-field conflict                                |
| 79  | rejects a stale move after an addition in source without writing duplicate orders       | Source membership addition rejects the whole drag  |
| 80  | rejects a stale move after an addition in target without writing duplicate orders       | Target membership addition rejects the whole drag  |
| 81  | rejects a stale move after an addition in empty target without writing duplicate orders | Empty target membership guard                      |
| 82  | preserves unrelated concurrent fields and hidden slots when membership is unchanged     | Compatible fields and hidden-slot preservation     |
| 83  | allows ordinary packing batches after an unrelated membership change                    | Packing batches omit drag membership preconditions |
| 84  | requires both source and empty target membership baselines for moves                    | Reject incomplete affected-category baselines      |
| 85  | rejects a same-category reorder after an untouched hidden row is removed                | Removed hidden member rejects reorder atomically   |
| 86  | should update multiple items atomically with one storage write                          | Atomic batch persistence                           |
| 87  | should not persist a partial batch when an item does not exist                          | Batch failure integrity                            |

##### 8.1.2.2 templateService.test.js (15 tests)

| #   | Test                                                           | What it verifies          |
| --- | -------------------------------------------------------------- | ------------------------- |
| 1   | creates a storage-safe checklist snapshot                      | Template creation         |
| 2   | applies a template with fresh IDs and reset state              | Template application      |
| 3   | updates only the template storage key                          | Storage isolation         |
| 4   | preserves malformed template storage without changing app data | Corrupt-data preservation |
| 5   | propagates localStorage write failures                         | Error propagation         |
| 6   | returns templates in ascending persisted order                 | Read sorting              |
| 7   | updates and deletes an existing template                       | CRUD success paths        |
| 8   | rejects updates and deletes for missing templates              | CRUD error paths          |
| 9   | reorders requested templates and appends unspecified templates | Reorder integrity         |
| 10  | snapshots persisted checklist data when UI data is partial     | Storage fallback          |
| 11  | preserves malformed application data and rejects snapshots     | App-data preservation     |
| 12  | rejects applying a missing template                            | Apply error path          |
| 13  | appends snapshots after existing templates                     | Snapshot ordering         |
| 14  | reloads external storage after cache invalidation              | Cache refresh             |
| 15  | preserves orphan references and applies item defaults          | Defensive application     |

##### 8.1.2.3 recommendedListService.test.js (4 tests)

| #   | Test                                                                 | What it verifies                  |
| --- | -------------------------------------------------------------------- | --------------------------------- |
| 1   | materializes every recommended list with fresh runtime relationships | Valid IDs and references          |
| 2   | isolates repeated applications from each other and the source        | Independent mutable copies        |
| 3   | rejects missing recommended lists                                    | Missing recommended-list guard    |
| 4   | applies the localized general recommended list                       | General list and locale selection |

##### 8.1.2.4 storageTransaction.test.js (27 tests)

| #   | Test                                                                                        | What it verifies                             |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | keeps durable and readable data unchanged after a failed write                              | Failed-write isolation                       |
| 2   | preserves app and template data when any supported mutation cannot be saved                 | Mutation failure coverage                    |
| 3   | does not expose mutable references to committed data                                        | Detached snapshots                           |
| 4   | preserves corrupted application data and rejects writes                                     | Corrupt-data preservation                    |
| 5   | rejects an unsupported application schema without replacing it                              | Version guard                                |
| 6   | rejects records without identity instead of generating a new id                             | Identity guard                               |
| 7   | preserves malformed template snapshots and refuses to overwrite them                        | Template-data preservation                   |
| 8   | rejects wrong-typed persisted fields without normalizing them into new values               | Type guard                                   |
| 9   | refuses writes when safe cross-tab locking is unavailable                                   | Read-only fallback                           |
| 10  | normalizes legacy defaults in memory without rewriting the stored bytes                     | Non-destructive reads                        |
| 11  | keeps both templates when an earlier reader creates after another writer                    | Fresh template writes                        |
| 12  | serializes simultaneous checklist creation across service instances                         | Concurrent writes                            |
| 13  | merges unrelated field changes and rejects stale edits to the same field                    | Field intent and conflicts                   |
| 14  | does not create a category or item after its owner was deleted                              | Owner guard                                  |
| 15  | rejects an entire batch when one item conflicts                                             | Atomic item batch                            |
| 16  | does not partially reorder categories if a category was deleted                             | Atomic category batch                        |
| 17  | rejects a template draft if another tab changed its original snapshot                       | Template conflict                            |
| 18  | rejects a queued item move after another writer deletes its destination                     | Destination conflict                         |
| 19  | rejects queued checklist creation after the selected template is deleted                    | Deleted template guard                       |
| 20  | preserves corrupted template data and refuses queued checklist creation                     | Corrupt template guard                       |
| 21  | Reject stale packed and pending changes in either order                                     | Coupled status conflict                      |
| 22  | Reject a whole batch on coupled status conflict                                             | Atomic batch status                          |
| 23  | Merge status and unrelated edits in both orders                                             | Unrelated field merge                        |
| 24  | Reject contradictory status writes and preserve legacy values                               | Legacy compatibility                         |
| 25  | preserves legacy dates, numeric strings, truthiness, and extensions across reads and writes | Raw/model boundaries and no read-time writes |
| 26  | preserves nested template fields and isolates newly materialized runtime state              | Snapshot preservation and fresh state        |
| 27  | does not silently repair missing legacy names when duplicating raw records                  | Existing failure and byte preservation       |

#### 8.1.3 Composables (95 tests)

##### 8.1.3.1 usePackingLists.test.js (71 tests)

| #   | Test                                                                                      |
| --- | ----------------------------------------------------------------------------------------- |
| 1   | should return initial empty state                                                         |
| 2   | should have computed properties                                                           |
| 3   | should load data from storage on initialize                                               |
| 4   | should manage loading state during initialization                                         |
| 5   | should normalize missing checklist order in memory and restore the saved checklist        |
| 6   | should fallback selected checklist and reload scoped categories/items                     |
| 7   | should set error and clear state when initialize fails unexpectedly                       |
| 8   | should create a new checklist                                                             |
| 9   | should select the first checklist after creation                                          |
| 10  | should update an existing checklist                                                       |
| 11  | should delete a checklist                                                                 |
| 12  | should return null when createChecklist service call fails                                |
| 13  | should return null when updateChecklist service call fails                                |
| 14  | should create a category in the selected checklist                                        |
| 15  | should return null if no checklist is selected                                            |
| 16  | should create an item in the selected checklist                                           |
| 17  | should toggle item packed status                                                          |
| 18  | should calculate progress correctly                                                       |
| 19  | should return 0 progress for empty checklist                                              |
| 20  | should handle storage errors gracefully during initialization                             |
| 21  | should duplicate a checklist and refresh state                                            |
| 22  | should duplicate a category and refresh state                                             |
| 23  | should duplicate an item and refresh state                                                |
| 24  | should delete a category and refresh both categories and items                            |
| 25  | should delete an item and refresh items                                                   |
| 26  | should update multiple checklists and refresh state                                       |
| 27  | should return null when creating item without selected checklist                          |
| 28  | should return null when duplicating item without selected checklist                       |
| 29  | should return null when updating item without selected checklist                          |
| 30  | should return empty array when getting categories without selected checklist              |
| 31  | should return empty array when getting items without selected checklist                   |
| 32  | should return early when deleting item without selected checklist                         |
| 33  | should return null when createItem service call fails (with checklist)                    |
| 34  | should return null when duplicateCategory service call fails (with checklist)             |
| 35  | should return null when updateItem service call fails (with checklist)                    |
| 36  | should return null when duplicateItem service call fails (with checklist)                 |
| 37  | should return null when createCategory service call fails (with checklist)                |
| 38  | should return null when duplicateChecklist service call fails (no checklist)              |
| 39  | should return null when updateCategory service call fails (no checklist)                  |
| 40  | should return null when updateCategory service returns undefined                          |
| 41  | should return null when updateMultipleChecklists service returns undefined                |
| 42  | should return null when updateCategory throws (real service)                              |
| 43  | should refresh categories and return updated category on success                          |
| 44  | should preserve valid selection and recover deleted selection on app data refresh         |
| 45  | restores a deleted checklist subtree with the same IDs and values, then redoes deletion   |
| 46  | undoes and redoes item edits, pending status, duplication and deletion as separate steps  |
| 47  | restores a category deletion with its items and reverses a cross-category move            |
| 48  | rejects undoing a cross-category move when the destination membership changed             |
| 49  | undoes and redoes category duplication with its complete item subtree                     |
| 50  | rejects undoing a created checklist if another tab added a descendant before its event    |
| 51  | undoes and redoes checklist, category and item reorder as separate steps                  |
| 52  | rejects undo of a reorder after another tab changes membership, preserving the other edit |
| 53  | reverses an edit without overwriting an unrelated external field change                   |
| 54  | rejects undo if a different tab changed the saved status before its event arrives         |
| 55  | keeps history for a no-op and undoes a later edit before the packing change               |
| 56  | preserves a committed batch in history if the following refresh fails                     |
| 57  | does not redirect an in-flight undo when the selected checklist changes                   |
| 58  | preserves newer redo when an older item update refresh finishes later                     |
| 59  | keeps the committed batch version even when its refresh finishes after undo               |
| 60  | retains a newer action committed while an undo refresh is pending                         |
| 61  | prevents an older undo from committing after a newer packing action                       |
| 62  | clears history only when a template change actually commits                               |
| 63  | does not clear history when a stale delete changes no data                                |
| 64  | keeps history and visible data when item or category deletion fails                       |
| 65  | retains visible categories and items if a later refresh fails                             |
| 66  | reports a committed change separately when the subsequent refresh fails                   |
| 67  | clears the previous checklist data when switching and the new read fails                  |
| 68  | should treat a category pack-all as one undoable action and restore mixed state           |
| 69  | undoes and redoes a batch on its owning checklist after switching                         |
| 70  | preserves remote item edits when committing a stale drag payload                          |
| 71  | rejects stale drag membership without overwriting a remotely added item                   |

##### 8.1.3.2 useTemplates.test.js (16 tests)

| #   | Test                                                                         | What it verifies                           |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | should load template state                                                   | Initial loading                            |
| 2   | should expose a load error                                                   | Error state                                |
| 3   | should save a template and refresh state                                     | Save + refresh                             |
| 4   | should expose an apply error                                                 | Apply failure                              |
| 5   | should rename a template and refresh state                                   | Update + refresh                           |
| 6   | should expose a delete error                                                 | Delete failure                             |
| 7   | should delete a template and refresh state                                   | Delete + refresh                           |
| 8   | should expose a save error                                                   | Save failure                               |
| 9   | should reject renaming a missing template                                    | Missing guard                              |
| 10  | should expose a rename error                                                 | Rename failure                             |
| 11  | should return applied template data                                          | Apply success                              |
| 12  | should update a template and refresh state                                   | Update + refresh                           |
| 13  | should expose an update error                                                | Update failure                             |
| 14  | should expose its service instance                                           | Service access                             |
| 15  | refreshes for template and clear events only while mounted                   | Cross-tab lifecycle                        |
| 16  | returns the committed template when refresh fails and allows read-only retry | Commit acknowledgement and read-only retry |

##### 8.1.3.3 useTouchLayout.test.js (1 tests)

| #   | Test                                                                   | What it verifies                      |
| --- | ---------------------------------------------------------------------- | ------------------------------------- |
| 1   | tracks capabilities independently of width and cleans up subscriptions | Capabilities and subscription cleanup |

##### 8.1.3.4 useVisualViewport.test.js (1 tests)

| #   | Test                                                                 | What it verifies                     |
| --- | -------------------------------------------------------------------- | ------------------------------------ |
| 1   | updates fixed modal bounds and removes viewport listeners on unmount | Keyboard viewport bounds and cleanup |

##### 8.1.3.5 useUndoHistory.test.js (6 tests)

| #   | Test                                                                                 |
| --- | ------------------------------------------------------------------------------------ |
| 1   | moves committed actions in order and drops redo only for a new action                |
| 2   | keeps the action available when persistence fails                                    |
| 3   | prevents double execution and discards stale stacks after a concurrent change        |
| 4   | retains a newer action committed while an earlier undo refreshes                     |
| 5   | does not commit queued undo when an editor begins saving before the lock is acquired |
| 6   | retains only the most recent actions within the limit                                |

#### 8.1.4 i18n (12 tests)

##### 8.1.4.1 index.test.js (12 tests)

| #   | Test                                                                    | What it verifies                     |
| --- | ----------------------------------------------------------------------- | ------------------------------------ |
| 1   | should use saved locale when it is supported                            | Saved locale restore                 |
| 2   | should map zh-HK browser language to zh-TW and persist                  | Browser locale normalization         |
| 3   | should fallback to en for unsupported browser language                  | Unsupported locale fallback          |
| 4   | should ignore invalid saved locale and detect from browser              | Invalid saved locale defense         |
| 5   | should use navigator.language when navigator.languages is empty         | Empty languages fallback             |
| 6   | should map bare "zh" browser language to zh-TW                          | Bare zh mapping                      |
| 7   | should persist locale when setLocale receives a supported value         | Locale persistence                   |
| 8   | should ignore unsupported setLocale values and keep current locale      | Setter guard                         |
| 9   | should keep English and Traditional Chinese translation keys aligned    | Translation key parity               |
| 10  | should render real interpolated and pluralized messages in both locales | Real interpolation and pluralization |
| 11  | should render the English fallback when a Chinese message is missing    | Runtime fallback rendering           |
| 12  | continues with a session locale when storage is denied                  | Preference fallback                  |

#### 8.1.5 Utils (41 tests)

##### 8.1.5.1 helpers.test.js (21 tests)

| #   | Test                                                               | What it verifies               |
| --- | ------------------------------------------------------------------ | ------------------------------ |
| 1   | should generate ID with empty prefix when called without args      | Default prefix behavior        |
| 2   | should generate ID with custom prefix                              | Custom prefix prepended        |
| 3   | should generate unique IDs                                         | No collisions                  |
| 4   | should generate IDs of consistent length                           | Stable format                  |
| 5   | should format date string correctly                                | Date → localized string        |
| 6   | should handle null date (returns epoch date)                       | Null input                     |
| 7   | should handle undefined date (returns Invalid Date)                | Undefined input                |
| 8   | should handle empty string (returns Invalid Date)                  | Empty string input             |
| 9   | should calculate percentage correctly                              | Normal calculation             |
| 10  | should return 0 when total is 0                                    | Division by zero guard         |
| 11  | should handle 100%                                                 | Full completion                |
| 12  | should round percentage to nearest integer                         | Rounding behavior              |
| 13  | should clone primitive values                                      | Primitives pass through        |
| 14  | should deep clone objects                                          | Nested objects are independent |
| 15  | should deep clone arrays                                           | Nested arrays are independent  |
| 16  | should not affect original when modifying clone                    | Mutation isolation             |
| 17  | should delay function execution                                    | Debounce delay works           |
| 18  | should only execute once for rapid calls                           | Debounce dedup                 |
| 19  | should pass arguments to debounced function                        | Args forwarded correctly       |
| 20  | should fallback to Date.now/Math.random when crypto is unavailable | generateSecureId fallback      |
| 21  | should fallback when crypto.randomUUID throws                      | generateSecureId fallback      |

##### 8.1.5.2 dragDrop.test.js (2 tests)

| #   | Test                                                  | What it verifies               |
| --- | ----------------------------------------------------- | ------------------------------ |
| 1   | should allow drops only from the specified group name | vuedraggable put guard correct |
| 2   | should return false when from group is missing        | DnD defensive error handling   |

##### 8.1.5.3 order.test.js (8 tests)

| #   | Test                                                                     | What it verifies                     |
| --- | ------------------------------------------------------------------------ | ------------------------------------ |
| 1   | should renumber order based on array index                               | Reorder based on array index         |
| 2   | should support custom start offset                                       | Support insert scenario start offset |
| 3   | should return empty array for null or undefined input                    | Null/undefined input fallback        |
| 4   | should reorder visible entries without moving hidden slots               | Preserve packed-item slots           |
| 5   | should keep complete order when visible entries do not match             | Invalid visible-set fallback         |
| 6   | should insert at a visible position in the complete order                | Visible-to-complete index mapping    |
| 7   | should append at the complete end when dropped after all visible entries | Visible-end insertion                |
| 8   | should append when every target entry is hidden                          | Fully hidden target insertion        |

##### 8.1.5.4 positioning.test.js (4 tests)

| #   | Test                                                                  | What it verifies                   |
| --- | --------------------------------------------------------------------- | ---------------------------------- |
| 1   | should clamp dropdown left within viewport padding                    | Left min padding clamp             |
| 2   | should clamp dropdown left to max when near right edge                | Right max boundary clamp           |
| 3   | should position dropdown above anchor with gap and zIndex             | Fixed position calc (with gap)     |
| 4   | fits bottom-edge and oversized menus inside an offset visual viewport | Visible popup bounds and scrolling |

##### 8.1.5.5 focusEditingInput.test.js (3 tests)

| #   | Test                                                                       | What it verifies                           |
| --- | -------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | keeps a visible input in place and restores temporary space                | Stable focus and padding cleanup           |
| 2   | scrolls by the minimum delta after keyboard resize and stops after cleanup | Scrollport geometry and viewport lifecycle |
| 3   | transfers temporary space ownership between editors                        | Stale cleanup cannot erase active space    |

##### 8.1.5.6 operationErrors.test.js (3 tests)

| #   | Test                                                                  | What it verifies   |
| --- | --------------------------------------------------------------------- | ------------------ |
| 1   | preserves ordinary error messages and uses the unavailable fallback   | Ordinary failure   |
| 2   | preserves storage categories on service errors and error-like records | Stable error codes |
| 3   | handles unknown failures without trusting arbitrary codes             | Unknown narrowing  |

#### 8.1.6 Data (4 tests)

##### 8.1.6.1 recommendedLists.test.js (4 tests)

| #   | Test                                                                         | What it verifies                                   |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | resolves complete localized recommended lists with valid category references | Localized data and hot-weather sun care membership |
| 2   | includes core clothing in every recommended list                             | Core wardrobe coverage                             |
| 3   | falls back to English for unsupported locales                                | Locale fallback                                    |
| 4   | returns isolated resolved data                                               | Resolver output isolation                          |

#### 8.1.7 Scripts (23 tests)

##### 8.1.7.1 candidateFingerprint.test.js (2 tests)

| #   | Test                                                                          | What it verifies                         |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | allows a staged binary diff larger than the completion asset collection       | Binary candidate fingerprint budget      |
| 2   | fingerprints a staged binary candidate larger than the default process buffer | End-to-end large binary Git diff support |

##### 8.1.7.2 verifyFeature.test.js (6 tests)

| #   | Test                                                                    | What it verifies                           |
| --- | ----------------------------------------------------------------------- | ------------------------------------------ |
| 1   | should summarize Playwright failures without ANSI formatting            | Concise, de-duplicated failure diagnostics |
| 2   | should report missing individual errors                                 | Reporter fallback message                  |
| 3   | should summarize top-level Playwright runner failures                   | Pre-test runner diagnostic                 |
| 4   | checks types before tests and includes the layer in its success summary | Type-check ordering and reporting          |
| 5   | stops before runtime tests when type checking fails                     | Fail-fast CI boundary                      |
| 6   | stops before type checking when theme colors differ                     | Fail-fast theme consistency                |

##### 8.1.7.3 checkTypeScriptScope.test.js (8 tests)

| #   | Test                                                   | What it verifies                                |
| --- | ------------------------------------------------------ | ----------------------------------------------- |
| 1   | accepts an all-TypeScript application                  | Verify compiler roots for the typed application |
| 2   | rejects a new JavaScript module                        | Prevent new unchecked JS                        |
| 3   | rejects an excluded application module                 | Prevent compiler-scope omissions                |
| 4   | rejects a JavaScript Vue script                        | Require TS scripts in SFCs                      |
| 5   | rejects allowJs being enabled                          | Prevent reintroducing the JS bridge             |
| 6   | rejects strictNullChecks being disabled                | Preserve strict null checking                   |
| 7   | rejects disabling template checks                      | Preserve explicit template checking             |
| 8   | checks newly added source files for compiler inclusion | Check future declarations and source files      |

##### 8.1.7.4 eslintTypeScript.test.js (2 tests)

| #   | Test                                                                    | What it verifies                                  |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | rejects explicit any in a TypeScript application component              | Prevent explicit any in typed application scripts |
| 2   | parses typed Vue props without applying JavaScript undefined-name rules | Allow TS types without false JS diagnostics       |

##### 8.1.7.5 cssVars.test.js (5 tests)

| #   | Test                                                                                       | What it verifies                            |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 1   | normalizes opaque and translucent values independently of the generator                    | Color normalization and invalid values      |
| 2   | validates current declarations and catches missing, extra, duplicate and drifted variables | Missing, extra, duplicate and changed CSS   |
| 3   | rejects unsupported, duplicate, missing, and ungrouped source entries                      | Unsupported and inconsistent source entries |
| 4   | protects manual CSS outside the marked region and fails for missing markers                | CSS region preservation and markers         |
| 5   | CLI check is read-only and returns a useful failure for a drifted fixture                  | Read-only check and CLI regeneration        |

### 8.2 Component Tests (338 tests)

#### 8.2.1 App.test.js (81 tests)

| #   | Test                                                                                       |
| --- | ------------------------------------------------------------------------------------------ |
| 1   | should render the main layout with sidebar and content                                     |
| 2   | should show empty state when no checklist is selected                                      |
| 3   | should show ChecklistComponent when a checklist is selected                                |
| 4   | shows the completion overlay after the final local item is packed                          |
| 5   | shows the completion overlay only when redo completes the checklist                        |
| 6   | does not celebrate another checklist completing while redo is pending                      |
| 7   | keeps completed initialization and checklist switching silent                              |
| 8   | should set isMobileViewport to true for narrow screens                                     |
| 9   | should auto-collapse sidebar on mobile viewport                                            |
| 10  | should auto-expand sidebar on wide desktop when not manually collapsed                     |
| 11  | should not auto-expand sidebar when manually collapsed key exists after resize from mobile |
| 12  | should detect small desktop viewport as overlay zone                                       |
| 13  | should toggle sidebar when sidebar emits toggle-sidebar                                    |
| 14  | should persist sidebar collapse to localStorage on desktop                                 |
| 15  | should remove collapsed key from localStorage when sidebar re-opened                       |
| 16  | should toggle sidebar from Topbar on mobile                                                |
| 17  | should open source selection from Sidebar without creating immediately                     |
| 18  | should open source selection from Topbar on mobile                                         |
| 19  | should select and mark checklist for editing on handleChecklistEdit                        |
| 20  | should duplicate checklist and select the copy on handleChecklistCopy                      |
| 21  | deletes a checklist without a confirmation dialog                                          |
| 22  | delegates a failed checklist deletion without confirmation                                 |
| 23  | should delegate selected checklist deletion to the composable                              |
| 24  | should update checklist via ChecklistComponent emit                                        |
| 25  | should call updateMultipleChecklists on handleChecklistMove                                |
| 26  | should update selectedChecklistId from overlay sidebar select-checklist event              |
| 27  | should update selectedChecklistId from inline sidebar select-checklist event               |
| 28  | should create item with maxOrder + 1 in the target category                                |
| 29  | should create item with order 0 in an empty category                                       |
| 30  | should update item and clear newlyCreatedItemId if matching                                |
| 31  | should call duplicateItem on copy:item emit                                                |
| 32  | should call deleteItem on delete:item emit                                                 |
| 33  | should batch all source and target item updates on move type                               |
| 34  | should update all items with new order on reorder type                                     |
| 35  | should ignore a move payload without item updates                                          |
| 36  | should create category with correct order                                                  |
| 37  | should update category and clear newlyCreatedCategoryId if matching                        |
| 38  | should call duplicateCategory on copy:category emit                                        |
| 39  | should call deleteCategory on delete:category emit                                         |
| 40  | should submit all categories in one operation                                              |
| 41  | should display overlay backdrop when sidebar is open on mobile                             |
| 42  | should close sidebar when overlay backdrop is clicked                                      |
| 43  | should set body overflow hidden when overlay is active                                     |
| 44  | should preserve the existing right padding while compensating for a hidden scrollbar       |
| 45  | should set body overflow hidden when sidebar opens on small desktop                        |
| 46  | should call initialize on mount                                                            |
| 47  | should clean up resize event listener on unmount                                           |
| 48  | should open an isolated editor without creating a checklist                                |
| 49  | should save only through the templates composable                                          |
| 50  | opens the named template dialog and saves its selected checklist                           |
| 51  | keeps the template dialog open after failure and closes after retry succeeds               |
| 52  | creates a checklist from a selected personal template                                      |
| 53  | deletes the active template and leaves the editor                                          |
| 54  | creates an explicitly empty checklist                                                      |
| 55  | handles failed template creation and ignores missing sources                               |
| 56  | keeps checklist source selection open after a failed creation and closes on retry          |
| 57  | ignores requests to edit a missing template                                                |
| 58  | keeps the editor open when saving a template fails                                         |
| 59  | discards a template draft when editing is canceled                                         |
| 60  | preserves a template when deletion is canceled                                             |
| 61  | closes both template dialogs without performing an operation                               |
| 62  | leaves checklist state unchanged when empty creation fails                                 |
| 63  | keeps the editor open when template deletion fails                                         |
| 64  | uses an empty initial name for an unknown checklist                                        |
| 65  | ignores duplicate template save events after source state is cleared                       |
| 66  | creates a checklist from a selected recommended list                                       |
| 67  | does not replace a newer barrier with an earlier delayed undo result                       |
| 68  | does not show an outdated batch toast after that batch was undone                          |
| 69  | does not route global undo into the checklist while a template editor is open              |
| 70  | does not undo the underlying item when its inline edit failed to save                      |
| 71  | keeps draft owners independent when another editor is displaced during a save              |
| 72  | keeps history blocked after a save until the editor actually closes                        |
| 73  | does not dismiss a newer barrier after a delayed redo finishes                             |
| 74  | replaces the success notice with a subsequent external history barrier                     |
| 75  | replaces an older history barrier when a later undo succeeds                               |
| 76  | waits for a button history action before running the next keyboard shortcut                |
| 77  | waits for a pending item update before a toolbar undo                                      |
| 78  | explains when a newer action interrupts a queued shortcut                                  |
| 79  | announces and dismisses a history barrier                                                  |
| 80  | applies a category packing change without a contextual undo notice                         |
| 81  | should use Ctrl+Z for packing undo but preserve input-native undo                          |

#### 8.2.2 Topbar.test.js (2 tests)

| #   | Test                                                  | What it verifies |
| --- | ----------------------------------------------------- | ---------------- |
| 1   | should emit "toggle" when hamburger button is clicked | Event emission   |
| 2   | should emit "new" when plus button is clicked         | Event emission   |

#### 8.2.3 AddCategoryButton.test.js (2 tests)

| #   | Test                                       | What it verifies |
| --- | ------------------------------------------ | ---------------- |
| 1   | should display the new category label      | i18n label text  |
| 2   | should emit "click" when button is clicked | Event emission   |

#### 8.2.4 AddItemButton.test.js (8 tests)

| #   | Test                                                           | What it verifies  |
| --- | -------------------------------------------------------------- | ----------------- |
| 1   | should render the add item button with label                   | Renders correctly |
| 2   | should apply success background when category is completed     | Completed style   |
| 3   | should apply default background when category is not completed | Default style     |
| 4   | should emit "click" when button is clicked                     | Event emission    |
| 5   | should apply primary text color on mouseenter                  | Hover-in style    |
| 6   | should revert to secondary text color on mouseleave            | Hover-out style   |
| 7   | should apply primary text color on focus                       | Focus style       |
| 8   | should revert to secondary text color on blur                  | Blur style        |

#### 8.2.5 ProgressBar.test.js (8 tests)

| #   | Test                                                                | What it verifies    |
| --- | ------------------------------------------------------------------- | ------------------- |
| 1   | should display progress text as "completed / total"                 | Label format        |
| 2   | should display the correct percentage                               | Percentage text     |
| 3   | should set progress bar fill width based on percentage              | CSS width binding   |
| 4   | should show 0% when total is 0                                      | Zero-item edge case |
| 5   | should show 100% when all items are completed                       | Full completion     |
| 6   | should round percentage to nearest integer                          | Rounding            |
| 7   | should have correct aria-valuenow, aria-valuemin, and aria-valuemax | ARIA values         |
| 8   | should have an aria-label describing progress                       | ARIA label          |

#### 8.2.6 PendingItemsCategory.test.js (5 tests)

| #   | Test                                                                          | What it verifies             |
| --- | ----------------------------------------------------------------------------- | ---------------------------- |
| 1   | should display only pending items                                             | Filters `isPending === true` |
| 2   | should not render when there are no pending items                             | Conditional rendering        |
| 3   | should display the pending items count                                        | Count label                  |
| 4   | should show quantity badge when quantity is greater than 1                    | Quantity display             |
| 5   | should emit "update:item" with isPending=false when completion button clicked | Clear pending                |

#### 8.2.7 Item.test.js (37 tests)

| #   | Test                                                                                  |
| --- | ------------------------------------------------------------------------------------- |
| 1   | keeps an item name draft on failed save and closes only after a successful retry      |
| 2   | releases its draft owner on unmount while a failed edit retry is pending              |
| 3   | preserves a failed draft during another item pointer gesture                          |
| 4   | releases a held edit after pointerup                                                  |
| 5   | releases a held edit after pointercancel                                              |
| 6   | should display the item name                                                          |
| 7   | should render a checkbox input                                                        |
| 8   | should check the checkbox when item is packed                                         |
| 9   | should apply line-through styling when item is packed                                 |
| 10  | should display quantity value                                                         |
| 11  | should emit "update:item" with toggled isPacked when checkbox is clicked              |
| 12  | should clear isPending when item becomes packed                                       |
| 13  | should enter edit mode when item name is clicked                                      |
| 14  | should save edited name on Enter key                                                  |
| 15  | should cancel edit mode on Escape key                                                 |
| 16  | should emit "update:item" with incremented quantity                                   |
| 17  | should emit "update:item" with decremented quantity                                   |
| 18  | should emit "delete:item" when quantity is 1 and delete button is clicked             |
| 19  | should emit "update:item" with toggled isPending                                      |
| 20  | should clear isPacked when item is marked as pending                                  |
| 21  | should emit "copy:item" when OverflowMenu triggers copy                               |
| 22  | should emit "update:item" on blur with changed name                                   |
| 23  | should not emit "update:item" on blur with empty name                                 |
| 24  | should emit "delete:item" when OverflowMenu triggers delete                           |
| 25  | should show action buttons on mouseenter                                              |
| 26  | keeps hover controls when focus leaves an editor while the pointer remains on the row |
| 27  | does not restore mouse hover on touch-only devices or during drag suppression         |
| 28  | should hide action buttons on mouseleave                                              |
| 29  | should not save during IME composition                                                |
| 30  | should enter edit mode when newlyCreatedItemId matches                                |
| 31  | should not enter edit mode when newlyCreatedItemId does not match                     |
| 32  | should not decrement quantity below 1                                                 |
| 33  | should apply cursor-grabbing when isDragging is true                                  |
| 34  | defers an inline action until composition ends and the name is saved                  |
| 35  | waits for the name save before an inline action and retains a failed draft            |
| 36  | preserves a failed name draft when another edit entry is activated                    |
| 37  | keeps the quantity-one delete action in the expanded touch region                     |

#### 8.2.8 OverflowMenu.test.js (24 tests)

| #   | Test                                                                | What it verifies                |
| --- | ------------------------------------------------------------------- | ------------------------------- |
| 1   | should render a spacious transparent menu trigger when configured   | Trigger surface + frame variant |
| 2   | should show three-dot icon when not editing                         | Default icon                    |
| 3   | should show checkmark icon when isEditing is true                   | Edit-mode icon                  |
| 4   | should not show dropdown menu initially                             | Menu starts closed              |
| 5   | should show dropdown menu when trigger button is clicked            | Open on click                   |
| 6   | should hide dropdown menu when trigger button is clicked again      | Toggle close                    |
| 7   | should emit "edit" when edit option is clicked                      | Edit action                     |
| 8   | should emit "copy" when copy option is clicked                      | Copy action                     |
| 9   | should emit "delete" when delete option is clicked                  | Delete action                   |
| 10  | should close dropdown after an action is performed                  | Auto-close on action            |
| 11  | should emit "confirm-edit" when checkmark is clicked in edit mode   | Confirm edit                    |
| 12  | should not open dropdown menu when in edit mode                     | Edit-mode blocks menu           |
| 13  | should close menu when clicking outside the component               | Click-outside handler           |
| 14  | should close menu on window scroll                                  | Scroll handler                  |
| 15  | should close menu when focus leaves the component                   | Focus-out handler               |
| 16  | should close when another overflow menu opens                       | Multi-menu coordination         |
| 17  | should not close when the same menu dispatches its own open event   | Self-event ignore               |
| 18  | should use inline size for item menu type                           | Item icon sizing                |
| 19  | should use control size for category menu type                      | Category icon sizing            |
| 20  | should use an explicit trigger size when one is supplied            | Explicit icon sizing            |
| 21  | should apply fixed positioning styles to dropdown                   | Position strategy               |
| 22  | should dispatch overflow-menu-open CustomEvent when opened          | CustomEvent dispatch            |
| 23  | should clamp dropdown position within viewport bounds               | Viewport clamping               |
| 24  | should fall back to createEvent when CustomEvent constructor throws | Legacy browser fallback         |

#### 8.2.9 Category.test.js (32 tests)

| #   | Test                                                                                | What it verifies                               |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | confirms once after composition and keeps a failed category draft for retry         | IME composition and failed-save retry          |
| 2   | keeps a category name draft on failed save and retries it                           | Retain the category draft until retry succeeds |
| 3   | should display the category name                                                    | Name rendering                                 |
| 4   | should pass correct item counts to ProgressBar                                      | Progress data binding                          |
| 5   | should filter items by categoryId                                                   | Item filtering                                 |
| 6   | should not apply completed styling when some items are unpacked                     | Incomplete style                               |
| 7   | should apply completed styling when all items are packed                            | Completed style                                |
| 8   | should start with items visible (not collapsed)                                     | Default expanded state                         |
| 9   | should collapse items when toggle button is clicked                                 | Collapse toggle                                |
| 10  | should show input when category name is clicked                                     | Click-to-edit                                  |
| 11  | should emit "update:category" with new name on Enter                                | Enter confirms edit                            |
| 12  | should cancel edit mode on Escape key                                               | Escape cancels edit                            |
| 13  | should emit "create:item" when AddItemButton triggers click                         | Item creation event                            |
| 14  | should emit "delete:category" when delete is triggered                              | Delete event                                   |
| 15  | should emit "copy:category" when copy is triggered                                  | Copy event                                     |
| 16  | should emit "update:category" on blur with changed name                             | Blur-save                                      |
| 17  | should not emit "update:category" on blur when name is unchanged                    | No-op blur                                     |
| 18  | should not emit "update:category" when name is empty                                | Empty name guard                               |
| 19  | should not emit "update:category" when name is whitespace only                      | Whitespace guard                               |
| 20  | should set dragging item ID on drag start                                           | Drag start state                               |
| 21  | should clear dragging item ID on drag end                                           | Drag end cleanup                               |
| 22  | should emit "move:item" with type "move" when item is added from another category   | Cross-category move                            |
| 23  | should emit "move:item" with type "reorder" when item is moved within same category | Same-category reorder                          |
| 24  | should preserve packed slots when reordering filtered items                         | Filtered slot reorder                          |
| 25  | should insert before the next visible target item while filtered                    | Filtered cross-move                            |
| 26  | should display only unpacked items while retaining full category progress           | Filtered rendering                             |
| 27  | should forward Item events from child Item component                                | Child event forwarding                         |
| 28  | should enter edit mode when newlyCreatedCategoryId matches                          | Auto-edit on create                            |
| 29  | should not enter edit mode when newlyCreatedCategoryId does not match               | No false trigger                               |
| 30  | should not save during IME composition                                              | IME guard                                      |
| 31  | should expose a mixed category checkbox and request packing all items               | Tri-state batch intent                         |
| 32  | should expose checked, unchecked, and disabled category checkbox states             | State rendering                                |

#### 8.2.10 Checklist.test.js (44 tests)

| #   | Test                                                                           | What it verifies                        |
| --- | ------------------------------------------------------------------------------ | --------------------------------------- |
| 1   | should display the checklist name                                              | Name rendering                          |
| 2   | should display the formatted date range                                        | Same-year date format                   |
| 3   | should pass correct item counts to ProgressBar                                 | Progress binding                        |
| 4   | should render Category components for each category                            | Category rendering                      |
| 5   | should show PendingItemsCategory when pending items exist                      | Conditional display                     |
| 6   | should hide PendingItemsCategory when no pending items                         | Conditional hide                        |
| 7   | should hide dates and checklist overflow when configured for template editing  | Template editor display                 |
| 8   | should toggle unpacked-only display without hiding categories                  | Filter state and categories             |
| 9   | confirms once after composition and keeps a failed checklist draft for retry   | IME composition and failed-save retry   |
| 10  | retains checklist name and dates after a failed save until retry succeeds      | Retain draft and retry                  |
| 11  | should show input when checklist name is clicked                               | Click-to-edit                           |
| 12  | should emit "update:checklist" with new name on Enter                          | Enter confirms edit                     |
| 13  | should cancel edit mode on Escape key                                          | Escape cancels                          |
| 14  | should emit "copy:checklist" from OverflowMenu                                 | Copy event forward                      |
| 15  | should emit "delete:checklist" from OverflowMenu                               | Delete event forward                    |
| 16  | should emit "create:category" from AddCategoryButton                           | Category creation event                 |
| 17  | should forward "update:item" from Category component                           | Item update forward                     |
| 18  | should forward "copy:category" from Category component                         | Forward category copy event             |
| 19  | should forward "delete:category" from Category component                       | Forward category delete event           |
| 20  | should display untitled placeholder for empty name                             | Untitled fallback                       |
| 21  | should adjust end date when start date moves past it                           | Date constraint: start > end            |
| 22  | should not change end date when start date is still before it                  | Date constraint: no-op                  |
| 23  | should auto-correct end date set earlier than start date                       | Date constraint: end < start            |
| 24  | should not save on Enter during IME composition                                | IME guard                               |
| 25  | should not emit update when name has not changed                               | No-op save                              |
| 26  | should use untitled placeholder when saving empty name                         | Empty name fallback                     |
| 27  | should enter edit mode when OverflowMenu triggers edit                         | Edit-mode trigger                       |
| 28  | should enter edit mode when newlyCreatedChecklistId matches                    | Auto-edit on create                     |
| 29  | should forward "copy:item" from Category component                             | Item copy forward                       |
| 30  | should forward "delete:item" from Category component                           | Item delete forward                     |
| 31  | should forward "create:item" from Category component                           | Item creation forward                   |
| 32  | should forward "update:category" from Category component                       | Category update forward                 |
| 33  | should forward "move:item" from Category component                             | Item move forward                       |
| 34  | should format single-date and cross-year ranges                                | Single/cross-year display               |
| 35  | should handle empty dates gracefully                                           | No-date display                         |
| 36  | associates visible start and end labels with their date inputs                 | Date labels and input associations      |
| 37  | should forward "update:item" from PendingItemsCategory                         | Pending item update forward             |
| 38  | should set isDraggingCategory on drag start                                    | Drag state                              |
| 39  | should clear drag state on category drag end                                   | Drag cleanup                            |
| 40  | should emit "reorder:categories" with renumbered order when v-model changes    | Category reorder event                  |
| 41  | should save when focus leaves all editing inputs                               | Global blur-save                        |
| 42  | switches across categories with one click and does not swallow outside actions | Shared expansion and outside activation |
| 43  | uses the same rename flow and restores the trigger only for Escape             | Rename and focus ownership              |
| 44  | clears invalid actions on collapse, removal and checklist switch               | Invalid expansion cleanup               |

#### 8.2.11 Sidebar.test.js (36 tests)

| #   | Test                                                                                 | What it verifies                             |
| --- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| 1   | should display checklist names when expanded                                         | Name rendering                               |
| 2   | should show the new checklist button                                                 | Button exists                                |
| 3   | should display the sidebar title                                                     | Title rendering                              |
| 4   | should render checklist item buttons                                                 | Button rendering                             |
| 5   | should emit "toggle-sidebar" on hamburger click                                      | Toggle event                                 |
| 6   | should emit "create-checklist" on new checklist button click                         | Create event                                 |
| 7   | should emit "select-checklist" with checklist ID on item click                       | Select event                                 |
| 8   | should emit "copy-checklist" from OverflowMenu                                       | Copy event                                   |
| 9   | should emit "delete-checklist" from OverflowMenu                                     | Delete event                                 |
| 10  | should emit "edit-checklist" from OverflowMenu                                       | Edit event                                   |
| 11  | should highlight the selected checklist                                              | Active style                                 |
| 12  | should not highlight non-selected checklists                                         | Inactive style                               |
| 13  | should show first character when collapsed on desktop                                | Initials and bounds                          |
| 14  | should show language dropdown on language button click                               | Menu open                                    |
| 15  | should change locale and close menu when a language is selected                      | Locale change                                |
| 16  | should close language menu when focus leaves                                         | Focus-out close                              |
| 17  | should close language menu on window scroll                                          | Scroll close                                 |
| 18  | should close language menu on outside click                                          | Click-outside close                          |
| 19  | should set dragging state on drag start                                              | Drag state                                   |
| 20  | should clear dragging state on drag end                                              | Drag cleanup                                 |
| 21  | should display checklists sorted by order property                                   | Sort order                                   |
| 22  | should emit "move:checklists" when checklists are reordered                          | Reorder event                                |
| 23  | should display untitled placeholder for empty checklist name                         | Untitled fallback                            |
| 24  | should apply positioning styles when language menu opens                             | Dropdown positioning                         |
| 25  | should clean up document and window listeners on unmount                             | Lifecycle cleanup                            |
| 26  | should use matching language and template dropdown layouts                           | Menu layout parity                           |
| 27  | should close the template menu after an outside click                                | Outside click                                |
| 28  | should emit edit-template when a template is selected                                | Template selection                           |
| 29  | should hide template overflow menus on narrow screens                                | Narrow layout                                |
| 30  | should sort templates and highlight the active template                              | Order and selection                          |
| 31  | should display an empty template state                                               | Empty state                                  |
| 32  | should close the template menu with Escape                                           | Keyboard dismissal                           |
| 33  | should forward save-as-template from checklist overflow                              | Event forwarding                             |
| 34  | keeps the dropped order while preserving refreshed checklist fields                  | Order-only projection and saved-prop handoff |
| 35  | keeps the latest drop until all saves settle and restores persisted order on failure | Consecutive drops and failed-save recovery   |
| 36  | retains committed order when refresh fails and releases it on a later read           | Committed preview survives failed refresh    |

#### 8.2.12 NewChecklistDialog.test.js (12 tests)

| #   | Test                                                                           | What it verifies              |
| --- | ------------------------------------------------------------------------------ | ----------------------------- |
| 1   | emits the selected empty source                                                | Empty source selection        |
| 2   | selects a personal template from its source list                               | Personal template selection   |
| 3   | selects a recommended list from its source list                                | recommended list selection    |
| 4   | keeps all sources visible and only disables personal templates when none exist | Source availability           |
| 5   | restores focus to the personal-template source after Back                      | Personal-list focus return    |
| 6   | restores focus to the recommended-list source after Back                       | Recommended-list focus return |
| 7   | closes the dialog when Escape is pressed                                       | Keyboard dismissal            |
| 8   | closes from the backdrop and Cancel button                                     | Pointer dismissal             |
| 9   | focuses the first source and restores prior focus after closing                | Focus lifecycle               |
| 10  | traps forward and reverse Tab navigation inside the dialog                     | Keyboard focus trap           |
| 11  | resets the nested source step whenever the dialog reopens                      | Dialog state reset            |
| 12  | ignores keyboard dismissal while hidden and unrelated keys while visible       | Keyboard guard                |

#### 8.2.13 TemplateEditor.test.js (16 tests)

| #   | Test                                                                     | What it verifies                                |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | detects structural draft changes and returns clean after they are undone | Draft change detection and undo                 |
| 2   | detects reordered categories and item moves in the snapshot              | Draft ordering and item moves                   |
| 3   | configures Checklist without dates or checklist overflow menu            | Editor rendering                                |
| 4   | emits an edited template snapshot without runtime checklist fields       | Edited template snapshot without runtime fields |
| 5   | emits delete without saving the draft                                    | Delete action                                   |
| 6   | discards the draft when cancel is selected                               | Cancel action                                   |
| 7   | creates draft items and categories without persisting them               | Draft-only creation                             |
| 8   | copies and deletes categories with their draft items                     | Category draft lifecycle                        |
| 9   | updates, copies, moves and deletes draft items in memory                 | Item draft lifecycle                            |
| 10  | resets the in-memory draft when the selected template changes            | Template switch reset                           |
| 11  | finishes auto-edit state after updating newly created entries            | Auto-edit cleanup                               |
| 12  | applies same-category item reorder payloads                              | Item reorder                                    |
| 13  | ignores copy requests for missing draft entries                          | Missing-entry guards                            |
| 14  | applies a cross-category batch payload                                   | Apply cross-category item batch payload         |
| 15  | assigns zero order when creating the first category and item             | Empty draft ordering                            |
| 16  | keeps touch changes isolated until saving the template snapshot          | Isolated draft actions and last name            |

#### 8.2.14 SaveTemplateDialog.test.js (10 tests)

| #   | Test                                            | What it verifies         |
| --- | ----------------------------------------------- | ------------------------ |
| 1   | renders an accessible dialog with its name      | Dialog semantics         |
| 2   | focuses the template name input                 | Initial focus            |
| 3   | emits a trimmed template name                   | Valid submission         |
| 4   | rejects an empty template name                  | Required-name validation |
| 5   | closes with Escape                              | Keyboard dismissal       |
| 6   | closes from the backdrop and Cancel button      | Pointer dismissal        |
| 7   | resets validation and name whenever it reopens  | Dialog state reset       |
| 8   | restores focus to the previously active element | Focus restoration        |
| 9   | traps forward and reverse Tab navigation        | Keyboard focus trap      |
| 10  | ignores keyboard handling while hidden          | Hidden-state guard       |

#### 8.2.15 AppIcon.test.js (4 tests)

| #   | Test                                                                               | What it verifies                |
| --- | ---------------------------------------------------------------------------------- | ------------------------------- |
| 1   | renders the mapped template-library icon at the navigation size                    | Semantic mapping and size slot  |
| 2   | renders a labelled non-decorative icon without hiding it from assistive technology | Accessible icon contract        |
| 3   | keeps an unlabelled non-decorative icon hidden from assistive technology           | Empty-label accessibility guard |
| 4   | uses the compact size token for dense controls                                     | Compact size slot               |

#### 8.2.16 PackingCompletionOverlay.test.js (10 tests)

| #   | Test                                                                   | What it verifies                         |
| --- | ---------------------------------------------------------------------- | ---------------------------------------- |
| 1   | shows the trip dates, checklist name, and departure message            | Sticker information hierarchy            |
| 2   | uses the four independent travel-illustration image layers             | Feature illustration import contract     |
| 3   | focuses and contains keyboard navigation on the skip control           | Initial focus and keyboard containment   |
| 4   | emits close once when the user skips the animation                     | Idempotent skip behavior                 |
| 5   | emits close from Escape and a backdrop click                           | Keyboard and pointer dismissal           |
| 6   | emits close after the journey animation duration                       | Exact automatic-close boundary           |
| 7   | waits for every illustration before starting the synchronized timeline | Load/error readiness synchronization     |
| 8   | handles single, missing, and invalid trip dates                        | Safe and cross-year date formatting      |
| 9   | renders localized Traditional Chinese sticker copy                     | Locale-aware copy and compact date range |
| 10  | exposes one synchronized timeline to JavaScript and CSS                | Shared timing contract                   |

#### 8.2.17 typedDraggable.test.js (7 tests)

| #   | Test                                                                          | What it verifies                                              |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | restores a reordered placeholder before vuedraggable can emit model or change | Cancelled same-list drop: DOM/model rollback and end cleanup  |
| 2   | restores cross-list cancellation into a receiver containing []                | Empty receiver cancellation without model/change emission     |
| 3   | restores cross-list cancellation into a receiver containing [ 'c' ]           | Populated receiver cancellation without model/change emission |
| 4   | still commits a subsequent completed touchend drop                            | Normal touch release after cancellation                       |
| 5   | still commits a subsequent completed drop drop                                | Normal mouse drop after cancellation                          |
| 6   | preserves vuedraggable add/remove semantics for touchend                      | Completed touch cross-list add/remove                         |
| 7   | preserves vuedraggable add/remove semantics for drop                          | Completed mouse cross-list add/remove                         |

### 8.3 E2E Tests (243 tests)

#### 8.3.1 app-loading.spec.js (5 tests)

| #   | Test                                                     | What it verifies  |
| --- | -------------------------------------------------------- | ----------------- |
| 1   | should load the app with correct title                   | Page title        |
| 2   | should show sidebar on desktop viewport                  | Desktop layout    |
| 3   | should show empty state when no checklists exist         | Empty state       |
| 4   | should show checklist content after creating a checklist | Post-create state |
| 5   | should show topbar on mobile viewport                    | Mobile layout     |

#### 8.3.2 checklist-management.spec.js (6 tests)

| #   | Test                                                                                    | What it verifies          |
| --- | --------------------------------------------------------------------------------------- | ------------------------- |
| 1   | should create a new checklist via sidebar button                                        | Create flow               |
| 2   | should auto-select and enter edit mode for new checklist                                | Auto-edit UX              |
| 3   | should rename checklist by clicking on the name                                         | Rename flow               |
| 4   | should switch between checklists                                                        | Navigation flow           |
| 5   | should delete checklist without confirmation                                            | Delete flow               |
| 6   | should restore the last opened checklist and fallback to sidebar top after invalidation | Reload restore + fallback |

#### 8.3.3 category-crud.spec.js (3 tests)

| #   | Test                                                | What it verifies         |
| --- | --------------------------------------------------- | ------------------------ |
| 1   | should delete a category via overflow menu          | Category deletion        |
| 2   | should copy a category via overflow menu            | Category duplication     |
| 3   | should show copy suffix in duplicated category name | Copy suffix localization |

#### 8.3.4 drag-and-drop.spec.js (8 tests)

| #   | Test                                                                  | What it verifies                                |
| --- | --------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | should reorder checklists in sidebar by drag-and-drop                 | Sidebar checklist reordering                    |
| 2   | should reorder categories by drag-and-drop                            | Category card reordering                        |
| 3   | should reorder items within a category by drag-and-drop               | Item reordering within category                 |
| 4   | should preserve packed item slots when filtered items are reordered   | Filtered item reordering                        |
| 5   | should persist a filtered move into a partially visible category      | Filtered cross-category insert                  |
| 6   | should persist a filtered move into an all-hidden category            | Empty-target append and persist                 |
| 7   | preserves a remote item rename made while another tab is dragging it  | Concurrent drag and rename                      |
| 8   | should reorder items within a category by drag-and-drop [webkit-core] | Same core behavior executed in the other engine |

#### 8.3.5 item-packing.spec.js (10 tests)

| #   | Test                                                                              | What it verifies                            |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | should create a new category via add button                                       | Category creation                           |
| 2   | should create a new item via add button                                           | Immediate focused typing                    |
| 3   | should edit an item name                                                          | Stable no-jump editing                      |
| 4   | should toggle item packed status via checkbox                                     | Checkbox toggle                             |
| 5   | should update progress when items are packed                                      | Progress update                             |
| 6   | should show 100% when all items in a category are packed                          | Full completion                             |
| 7   | should show and dismiss the completion journey after the final category is packed | Completion overlay and deferred Undo        |
| 8   | should contain focus and dismiss completion with Escape or the backdrop           | Modal keyboard, pointer, and focus return   |
| 9   | should fit localized sticker copy in a narrow reduced-motion scene                | Narrow layout, i18n, assets, reduced motion |
| 10  | should persist data after page reload                                             | localStorage persistence                    |

#### 8.3.6 language-switch.spec.js (6 tests)

| #   | Test                                                           | What it verifies              |
| --- | -------------------------------------------------------------- | ----------------------------- |
| 1   | should update sidebar title after switching to zh-TW           | Chinese sidebar title         |
| 2   | should update new checklist button text after language switch  | Chinese button labels         |
| 3   | should update empty state text after language switch           | Chinese empty state           |
| 4   | should show Chinese labels in categories after language switch | Chinese category labels       |
| 5   | should revert all labels to English after switching back       | Language revert               |
| 6   | should persist language selection after page reload            | Language preference persisted |

#### 8.3.7 mobile-workflow.spec.js (10 tests)

| #   | Test                                                                | What it verifies          |
| --- | ------------------------------------------------------------------- | ------------------------- |
| 1   | should display topbar with hamburger button on mobile               | Mobile topbar             |
| 2   | should open sidebar overlay when hamburger is clicked               | Sidebar overlay open      |
| 3   | should close sidebar when overlay backdrop is tapped                | Backdrop closes           |
| 4   | should create a new checklist via topbar plus button                | Mobile checklist creation |
| 5   | should create a new checklist via sidebar on mobile                 | Sidebar creation flow     |
| 6   | should add a new item via add item button                           | Mobile immediate typing   |
| 7   | should edit an item name on mobile                                  | Mobile item editing       |
| 8   | should toggle item packed status on mobile                          | Mobile packing toggle     |
| 9   | should update progress when items are packed on mobile              | Mobile progress update    |
| 10  | should filter packed items with an accessible icon button on mobile | Accessible mobile filter  |

#### 8.3.8 multi-tab-sync.spec.js (10 tests)

| #   | Test                                                                                 |
| --- | ------------------------------------------------------------------------------------ |
| 1   | should sync checklist create and rename across tabs                                  |
| 2   | should converge when tabs rename sequentially after synchronization                  |
| 3   | should converge after rapid alternating cross-tab edits                              |
| 4   | should converge to deletion when one tab renames and another tab deletes             |
| 5   | should keep remote completion synchronization silent                                 |
| 6   | restores the last deleted checklist with its contents through keyboard undo and redo |
| 7   | identifies the affected checklist after cross-checklist undo and redo                |
| 8   | keeps long Chinese cross-checklist feedback operable at 320px                        |
| 9   | does not undo a later packing change from another tab                                |
| 10  | keeps both templates when two tabs save behind the same lock barrier                 |

#### 8.3.9 template-management.spec.js (8 tests)

| #   | Test                                                                                  | What it verifies                         |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | closes the templates menu after an outside click                                      | Outside-click dismissal                  |
| 2   | distinguishes Back from canceling checklist creation                                  | Dialog-step semantics                    |
| 3   | edits a template without creating a checklist                                         | Isolated editing                         |
| 4   | confirms inline template edits without saving the template until explicitly requested | Inline editing stays in draft until save |
| 5   | deletes the active template from the editor                                           | Template deletion                        |
| 6   | keeps narrow template rows free of overflow menus                                     | Narrow responsive layout                 |
| 7   | saves a checklist as a named template without changing checklist data                 | Snapshot isolation                       |
| 8   | creates an isolated checklist from a selected template                                | Fresh IDs and storage                    |

#### 8.3.10 recommended-lists.spec.js (1 tests)

| #   | Test                                                          | What it verifies             |
| --- | ------------------------------------------------------------- | ---------------------------- |
| 1   | should create and persist a checklist from a recommended list | Source-aware name and reload |

#### 8.3.11 storage-recovery.spec.js (30 tests)

| #   | Test                                                                               |
| --- | ---------------------------------------------------------------------------------- |
| 1   | keeps a checklist draft after a real storage failure and saves it on retry         |
| 2   | keeps a failed item draft when undo is pressed after focus leaves the editor       |
| 3   | preserves a template name and source after a failed write and retries successfully |
| 4   | retains an edited template draft after a failed save                               |
| 5   | preserves a stale name draft and rejects a same-field edit from another tab        |
| 6   | merges a local name draft with a different field changed in another tab            |
| 7   | shows unavailable domains instead of crashing when browser storage is denied       |
| 8   | does not show packing success or undo when a category write fails                  |
| 9   | keeps checklist operations available when only template data is unsupported        |
| 10  | explains when safe browser locking is unavailable                                  |
| 11  | preserves a failed draft separately when switching checklists                      |
| 12  | preserves the draft when a queued edit follows a remote deletion                   |
| 13  | reports a saved checklist when only the following refresh fails                    |
| 14  | shows a later template deletion error after cancelling a failed checklist edit     |
| 15  | keeps the original checklist selected after copy succeeds and refresh fails        |
| 16  | retains a newer operation error when an older failed draft is cancelled            |
| 17  | shows a later checklist error after cancelling a failed template save              |
| 18  | does not switch template editors while a save is pending                           |
| 19  | keeps a failed template draft when switching is declined                           |
| 20  | shows later errors after restoring the original item name                          |
| 21  | preserves and exports corrupt data, then retries in en at 1280px                   |
| 22  | preserves and exports corrupt data, then retries in zh-TW at 390px                 |
| 23  | shows a queued save failure after switching checklists                             |
| 24  | saves an active template name when Save is clicked                                 |
| 25  | saves an active template category when Save is clicked                             |
| 26  | saves an active template item when Save is clicked                                 |
| 27  | waits for composition to finish before saving a template title                     |
| 28  | rejects queued pending after another tab commits item-pack                         |
| 29  | rejects queued category-pack after another tab commits pending                     |
| 30  | keeps a checklist draft after a real storage failure and saves it on retry         |

#### 8.3.12 rwd-phone.spec.js (8 tests)

| #   | Test                                                                  | What it verifies                                                                            |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | touch actions remain open and persist quantity and pending state      | Phone targets, menus, to-buy typography and persisted actions                               |
| 2   | keeps name geometry stable and makes checkbox edges actionable        | Name geometry and real hit areas                                                            |
| 3   | switches one open item and shares the direct rename flow              | Once-one expansion and rename                                                               |
| 4   | fits tablet categories to available width while keeping touch actions | Tablet columns, sidebar clipping, touch menus and density                                   |
| 5   | retains hover quick controls and the desktop command menu             | Desktop row feedback, menu dismissal, focus and text alignment                              |
| 6   | preserves touch sorting while excluding action buttons                | Phone/tablet hold jitter, DPR, native scroll completion, grab position, cleanup and reorder |
| 7   | persists category sorting across tablet columns                       | Hold jitter, cross-column grab position and persistence                                     |
| 8   | moves an unpacked item into an all-hidden category by touch           | Touch drop into filtered footer and reload                                                  |

#### 8.3.13 rwd-overlays.spec.js (6 tests)

| #   | Test                                                                                 | What it verifies                                             |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | drawer isolates background, traps keyboard and restores focus through nested dialogs | Drawer animation, reduced motion, focus and resize stability |
| 2   | drawer popup traps focus and edit actions unlock their destination                   | Drawer command ownership and checklist/template editing      |
| 3   | short dialogs and narrow date editing fit without horizontal overflow                | Short viewport, native dates and scrollable touch menu       |
| 4   | bottom item input keeps a buffer above a simulated keyboard                          | Scrollport buffer, error and cleanup                         |
| 5   | bottom popup fits and keyboard can activate and dismiss it                           | Popup bounds, initial focus and Escape                       |
| 6   | bottom popup fits and keyboard can activate and dismiss it [webkit-core]             | Same core behavior executed in the other engine              |

#### 8.3.14 rwd-webkit.spec.js (8 tests)

| #   | Test                                                                    | What it verifies                                                      |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | WebKit touch actions persist and drawer dismisses accessibly            | WebKit touch state, drawer motion and focus return                    |
| 2   | WebKit short dialogs and date fields fit the narrow viewport            | WebKit short viewport and date geometry                               |
| 3   | WebKit tablet columns retain visible touch actions                      | WebKit tablet columns, collapsed scroll lock, touch menus and density |
| 4   | WebKit short mobile sidebar keeps navigation reachable                  | Short drawer checklist and language controls                          |
| 5   | WebKit touch actions persist and drawer dismisses accessibly [chromium] | Same core behavior executed in the other engine                       |
| 6   | WebKit short dialogs and date fields fit the narrow viewport [chromium] | Same core behavior executed in the other engine                       |
| 7   | WebKit tablet columns retain visible touch actions [chromium]           | Same core behavior executed in the other engine                       |
| 8   | WebKit short mobile sidebar keeps navigation reachable [chromium]       | Same core behavior executed in the other engine                       |

#### 8.3.15 sidebar-presentation.spec.js (12 tests)

| #   | Test                                                                         |
| --- | ---------------------------------------------------------------------------- |
| 1   | sidebar presentation stays consistent in en [phone]                          |
| 2   | sidebar presentation stays consistent in zh-TW [phone]                       |
| 3   | sidebar presentation stays consistent in en [tablet]                         |
| 4   | sidebar presentation stays consistent in zh-TW [tablet]                      |
| 5   | sidebar presentation stays consistent in en [desktop]                        |
| 6   | sidebar presentation stays consistent in zh-TW [desktop]                     |
| 7   | short mobile sidebar remains operable in en                                  |
| 8   | short mobile sidebar remains operable in zh-TW                               |
| 9   | collapsed initials and expanded names keep the same first-character position |
| 10  | sidebar heading aligns with checklist names at 1280px                        |
| 11  | sidebar heading aligns with checklist names at 820px                         |
| 12  | sidebar heading aligns with checklist names at 390px                         |

#### 8.3.16 desktop-drag-presentation.spec.js (19 tests)

| #   | Test                                                                   | What it verifies                                                  |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | keeps same-category drop order during delayed storage                  | Same-category frames and hover controls after pointer movement    |
| 2   | keeps cross-category drop order during delayed storage                 | Cross-category frames and hover controls after pointer movement   |
| 3   | places the drag placeholder before Add Item in empty categories        | Empty target, cancellation and stable drop with footer reordering |
| 4   | places the drag placeholder before Add Item in filtered categories     | Filtered-empty target, cancellation and stable drop               |
| 5   | restores the original order when a drop cannot be saved                | Restore order after a failed write                                |
| 6   | does not replay the sidebar label reveal after sorting                 | Sidebar sorting does not replay reveal                            |
| 7   | preserves consecutive cross-category drops while storage is delayed    | Consecutive cross-category drops during a delayed save            |
| 8   | keeps category drop order during delayed storage                       | Category frames during delayed save                               |
| 9   | does not highlight Add Item after moving the last item from a category | Add Item hover after the last item moves                          |
| 10  | keeps the saved drop visible when the follow-up read fails             | Preserve display after a committed write and failed read          |
| 11  | keeps a new drag intact when the previous write completes              | A prior write finishing during a new drag                         |
| 12  | packs the displayed destination after its pending move saves           | Packing waits for a successful move                               |
| 13  | cancels pending category packing when the move fails                   | Cancel packing when the move fails                                |
| 14  | keeps unequal category cards at the cross-column drop position         | Unequal cross-column card geometry                                |
| 15  | does not apply queued packing after leaving the checklist              | Cancel queued packing on navigation                               |
| 16  | cancels queued packing when the saved move cannot be refreshed         | Cancel packing if refresh fails                                   |
| 17  | shows projected progress when moving into a fully packed category      | Projected progress in a packed category                           |
| 18  | packs only remaining source items after the pending move saves         | Source packing excludes the moved item                            |
| 19  | keeps the pending drop correct while the packed filter changes         | Preserve pending placement when the filter changes                |

#### 8.3.17 category-motion.spec.js (8 tests)

| #   | Test                                                             | What it verifies                                      |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | desktop: animates category reflow when a tall category collapses | Desktop cross-column reflow                           |
| 2   | desktop: animates category siblings before releasing a drag      | Desktop drag-over animation and persisted order       |
| 3   | tablet: animates category reflow when a tall category collapses  | Tablet cross-column reflow                            |
| 4   | tablet: animates category siblings before releasing a drag       | Touch activation, pre-drop motion and persisted order |
| 5   | phone: animates category reflow when a tall category collapses   | Single-column reflow and overlap-free expansion       |
| 6   | phone: animates category siblings before releasing a drag        | Touch activation, pre-drop motion and persisted order |
| 7   | settles rapid collapse reversals and viewport changes            | Interruption, cleanup and no horizontal overflow      |
| 8   | honors reduced motion and cancels active reflow                  | Live motion preference and immediate layout           |

#### 8.3.18 interaction-feedback.spec.js (10 tests)

| #   | Test                                                                                 |
| --- | ------------------------------------------------------------------------------------ |
| 1   | keeps normal and completed feedback consistent and animates inline actions [desktop] |
| 2   | accepts items into a collapsed category and retains counts and order [desktop]       |
| 3   | keeps normal and completed feedback consistent and animates inline actions [tablet]  |
| 4   | accepts items into a collapsed category and retains counts and order [tablet]        |
| 5   | keeps normal and completed feedback consistent and animates inline actions [phone]   |
| 6   | accepts items into a collapsed category and retains counts and order [phone]         |
| 7   | ends an old name edit when dragging a different item                                 |
| 8   | saves a name when clicking another item without dragging                             |
| 9   | honors reduced motion for inline action expansion                                    |
| 10  | keeps item hover controls available after confirming an inline name edit             |

#### 8.3.19 drag-settlement.spec.js (15 tests)

| #   | Test                                                                         | What it verifies                                                  |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | keeps sidebar mouse drop visible through delayed storage on desktop          | Pending order, committed storage and reload                       |
| 2   | keeps sidebar mouse drop visible through delayed storage on phone            | Pending order, committed storage and reload                       |
| 3   | keeps sidebar mouse drop visible through delayed storage on tablet           | Pending order, committed storage and reload                       |
| 4   | restores sidebar order when a pending mouse drop fails to save               | Failed save restores storage order                                |
| 5   | touch drag completion leaves the next action tap usable across drag surfaces | Cancelled and completed touch drags preserve the first action tap |
| 6   | touchcancel restores same drag after its placeholder moves                   | Cancelled same-category drag restores UI/storage/reload           |
| 7   | touchcancel restores cross drag after its placeholder moves                  | Cancelled cross-category drag restores UI/storage/reload          |
| 8   | touchcancel restores empty drag after its placeholder moves                  | Cancelled empty target drag restores UI/storage/reload            |
| 9   | touchcancel restores collapsed drag after its placeholder moves              | Cancelled collapsed target drag restores UI/storage/reload        |
| 10  | touchcancel restores filtered drag after its placeholder moves               | Cancelled filtered target drag restores UI/storage/reload         |
| 11  | touchcancel restores category drag after its placeholder moves               | Cancelled category drag restores UI/storage/reload                |
| 12  | touchcancel restores sidebar drag after its placeholder moves                | Cancelled sidebar drag restores UI/storage/reload                 |
| 13  | normal touchend saves item order                                             | Normal touch release persists across reload                       |
| 14  | normal touchend saves category order                                         | Normal touch release persists across reload                       |
| 15  | normal touchend saves sidebar order                                          | Normal touch release persists across reload                       |

#### 8.3.20 drag-membership-conflict.spec.js (1 tests)

| #   | Test                                                                 | What it verifies                                      |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | refreshes a stale drag instead of persisting duplicate target orders | Real two-tab drag conflict, atomic storage and reload |

#### 8.3.21 checklist-dates.spec.js (18 tests)

| #   | Test                                                                        | What it verifies                                 |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | edits labeled dates and confirms changes at 320px in en                     | Date editing and confirmation                    |
| 2   | edits labeled dates and confirms changes at 390px in en                     | Date editing and confirmation                    |
| 3   | edits labeled dates and confirms changes at 820px in en                     | Date editing and confirmation                    |
| 4   | edits labeled dates and confirms changes at 1280px in en                    | Date editing and confirmation                    |
| 5   | edits labeled dates and confirms changes at 320px in zh-TW                  | Date editing and confirmation                    |
| 6   | edits labeled dates and confirms changes at 390px in zh-TW                  | Date editing and confirmation                    |
| 7   | edits labeled dates and confirms changes at 820px in zh-TW                  | Date editing and confirmation                    |
| 8   | edits labeled dates and confirms changes at 1280px in zh-TW                 | Date editing and confirmation                    |
| 9   | touch editing › saves checklist and category through their confirm controls | Touch confirmation for checklist and category    |
| 10  | keeps 10-character name within the main viewport at 320px                   | Checklist name layout across viewport widths     |
| 11  | keeps 100-character name within the main viewport at 320px                  | Checklist name layout across viewport widths     |
| 12  | keeps 10-character name within the main viewport at 820px                   | Checklist name layout across viewport widths     |
| 13  | keeps 100-character name within the main viewport at 820px                  | Checklist name layout across viewport widths     |
| 14  | keeps 10-character name within the main viewport at 1280px                  | Checklist name layout across viewport widths     |
| 15  | keeps 100-character name within the main viewport at 1280px                 | Checklist name layout across viewport widths     |
| 16  | saves another category when its focus moves to a failed draft confirmation  | Failed draft and cross-category focus transition |
| 17  | edits labeled dates and confirms changes at 320px in en [webkit-core]       | Same core behavior executed in the other engine  |
| 18  | edits labeled dates and confirms changes at 1280px in en [webkit-core]      | Same core behavior executed in the other engine  |

#### 8.3.22 template-navigation.spec.js (23 tests)

| #   | Test                                                                           | What it verifies                         |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| 1   | switches a clean template to the selected checklist including the current one  | Template navigation and draft protection |
| 2   | keeps or discards the draft when switching checklists                          | Template navigation and draft protection |
| 3   | saves the last inline edit before navigating, and retains it on failure        | Template navigation and draft protection |
| 4   | warns before replacing a dirty template with another                           | Template navigation and draft protection |
| 5   | keeps template toolbar visible when scrolling at 390px                         | Template navigation and draft protection |
| 6   | keeps template toolbar visible when scrolling at 820px                         | Template navigation and draft protection |
| 7   | keeps template toolbar visible when scrolling at 1280px                        | Template navigation and draft protection |
| 8   | a reverted name navigates without a discard prompt                             | Template navigation and draft protection |
| 9   | retains the draft on cross-tab conflict when saving before navigation          | Template navigation and draft protection |
| 10  | Escape keeps the draft and restores the navigation focus                       | Template navigation and draft protection |
| 11  | mobile drawer prompts before switching and closes after discard                | Template navigation and draft protection |
| 12  | keeps the requested destination while template save waits for the lock         | Template navigation and draft protection |
| 13  | keeps the toolbar usable in a short narrow viewport                            | Template navigation and draft protection |
| 14  | saves an active category draft before switching                                | Template navigation and draft protection |
| 15  | saves an active item draft before switching                                    | Template navigation and draft protection |
| 16  | resumes the same navigation after an inline IME composition finishes           | Template navigation and draft protection |
| 17  | keeps a dirty draft and explains when the destination disappears               | Template navigation and draft protection |
| 18  | keeps the short-screen confirmation scrollable and traps focus                 | Template navigation and draft protection |
| 19  | navigates after a committed save even if the template refresh fails            | Template navigation and draft protection |
| 20  | saves the template once before creating a checklist                            | Template navigation and draft protection |
| 21  | discards the template once before copying a checklist                          | Template navigation and draft protection |
| 22  | keeps long template toolbar and focused content usable after rotation in en    | Template navigation and draft protection |
| 23  | keeps long template toolbar and focused content usable after rotation in zh-TW | Template navigation and draft protection |

#### 8.3.23 core-smoke.spec.js (2 tests)

| #   | Test                                                             | What it verifies                                      |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | creates, edits, packs and deletes a persisted item [chromium]    | Create, edit, pack, reload persisted state and delete |
| 2   | creates, edits, packs and deletes a persisted item [webkit-core] | Create, edit, pack, reload persisted state and delete |

#### 8.3.24 undo-redo-ui.spec.js (16 tests)

| #   | Test                                                                                         |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | desktop history controls undo and redo a status change and protect an active draft           |
| 2   | mobile topbar hides on downward scroll and returns on upward scroll                          |
| 3   | mobile controls restore the last deleted checklist and reset after reload                    |
| 4   | category packing has no toast and undo shows a brief result                                  |
| 5   | keyboard history works immediately after packing and quantity controls retain checkbox focus |
| 6   | desktop history controls share the menu row and mobile controls stay beside the menu         |
| 7   | collapsed desktop sidebar hides history controls while shortcuts still work                  |
| 8   | sidebar heading and checklist names fade with New Checklist without horizontal motion        |
| 9   | sidebar history respects reduced motion and rapid open-close                                 |
| 10  | history controls remain inert until their shared fade completes                              |
| 11  | toolbar undo waits for a pending locked status update                                        |
| 12  | dragging a checklist creates one reversible history step                                     |
| 13  | mobile sidebar controls undo and redo a checklist deletion                                   |
| 14  | keyboard focus keeps the mobile topbar visible while scrolling                               |
| 15  | failed checklist deletion is visible and dismissible inside mobile sidebar                   |
| 16  | touch scrolling hides and reveals the topbar after closing the drawer                        |
