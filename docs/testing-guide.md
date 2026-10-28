# Packing List App - Testing Guide

## 1. Overview

### Purpose

Ensure application correctness and prevent regressions through a comprehensive automated test suite covering models, services, composables, utilities, Vue components, and end-to-end user flows.

### Scope

Applies to this project's stack: Vue 3 + Vite + Vitest + @vue/test-utils + Playwright.

### Results Summary

| Metric             | Value  |
| ------------------ | ------ |
| Total tests        | 629    |
| Unit tests         | 277    |
| Component tests    | 291    |
| E2E tests          | 61     |
| Line coverage      | 95.22% |
| Statement coverage | 94.30% |
| Branch coverage    | 87.02% |
| Pass rate          | 100%   |

## 2. Test Architecture

### Testing Layers

| Layer     | Tool                     | Tests | Purpose                                            |
| --------- | ------------------------ | ----- | -------------------------------------------------- |
| Unit      | Vitest                   | 277   | Pure logic in models, services, composables, utils |
| Component | Vitest + @vue/test-utils | 291   | Vue component rendering, events, state             |
| E2E       | Playwright               | 61    | Full user flows in a real browser                  |

### Toolchain

| Package             | Version | Role                         |
| ------------------- | ------- | ---------------------------- |
| vitest              | 4.1.12  | Test runner and assertion    |
| @vue/test-utils     | 2.4.6   | Vue component test utilities |
| @vitest/coverage-v8 | 4.1.12  | Code coverage (V8 provider)  |
| playwright          | 1.58.2  | Browser-based E2E testing    |
| jsdom               | 28.0.0  | DOM environment for Vitest   |

## 3. Test File Structure

```
tests/
├── test-setup/
│   └── setup.js                         # Global mocks: localStorage, crypto, scrollIntoView
│
├── unit-tests/                          # 277 tests
│   ├── data/                            #  4  tests
│   │   └── recommendedLists.test.js        #  4  tests
│   ├── models/                          # 40  tests
│   │   ├── Item.test.js                 # 17  tests
│   │   ├── Category.test.js             #  9  tests
│   │   └── Checklist.test.js            # 11  tests
│   │   └── Template.test.js             #  3  tests
│   ├── services/                        # 119 tests
│   │   ├── localStorageService.test.js  # 80  tests
│   │   ├── templateService.test.js      # 15  tests
│   │   ├── storageTransaction.test.js  # 20  tests
│   │   └── recommendedListService.test.js  #  4  tests
│   ├── composables/                     # 62  tests
│   │   └── usePackingLists.test.js      # 47  tests
│   │   └── useTemplates.test.js         # 15  tests
│   ├── i18n/                            # 11  tests
│   │   └── index.test.js                # 11  tests
│   ├── utils/                           # 36  tests
│       ├── helpers.test.js              # 21  tests
│       ├── positioning.test.js          #  3  tests
│       ├── order.test.js                #  8  tests
│       ├── dragDrop.test.js             #  2  tests
│       └── focusEditingInput.test.js     #  2  tests
│   └── scripts/                         #  5  tests
│       ├── candidateFingerprint.test.js #  2  tests
│       └── verifyFeature.test.js        #  3  tests
│
├── component-tests/                     # 291 tests
│   ├── App.test.js                      # 66  tests
│   ├── PackingCompletionOverlay.test.js # 10  tests
│   ├── AppIcon.test.js                  #  4  tests
│   ├── Checklist.test.js                # 38  tests
│   ├── Item.test.js                     # 26  tests
│   ├── Sidebar.test.js                  # 33  tests
│   ├── Category.test.js                 # 30  tests
│   ├── OverflowMenu.test.js             # 24  tests
│   ├── ProgressBar.test.js              #  8  tests
│   ├── AddItemButton.test.js            #  8  tests
│   ├── Topbar.test.js                   #  2  tests
│   ├── PendingItemsCategory.test.js     #  5  tests
│   ├── AddCategoryButton.test.js        #  2  tests
│   ├── NewChecklistDialog.test.js       # 12  tests
│   ├── TemplateEditor.test.js           # 13  tests
│   └── SaveTemplateDialog.test.js       # 10  tests
│
└── end2end-tests/                       # 61  tests
    ├── mobile-workflow.spec.js          # 10  tests
    ├── item-packing.spec.js             # 10  tests
    ├── language-switch.spec.js          #  6  tests
    ├── app-loading.spec.js              #  5  tests
    ├── checklist-management.spec.js     #  6  tests
    ├── category-crud.spec.js            #  3  tests
    ├── drag-and-drop.spec.js            #  7  tests
    ├── multi-tab-sync.spec.js           #  6  tests
    ├── template-management.spec.js      #  7  tests
    └── recommended-lists.spec.js           #  1  test
```

### Naming Conventions

- **Unit/Component tests** (`.test.js`): Match production file names exactly
  - `Category.test.js` → tests `Category.vue`
  - `usePackingLists.test.js` → tests `usePackingLists.js`
- **E2E tests** (`.spec.js`): Use kebab-case to describe user workflows
  - `item-packing.spec.js`, `checklist-management.spec.js`

### Test Comment Conventions

Every test file groups related assertions with `Test Group N` dividers and prefixes every `it()` or `test()` case with a sequential `Test Case N` comment. Numbering begins at 1 in each file and must match the executable case count (including expanded parameterized cases). The comment is a concise `Should ...` description of the behavior under test.

Validation: Local `npm run test:inventory` executes Vitest and Playwright, then verifies this convention against their reported test counts and rejects inventory sections that are out of Unit → Component → E2E order. `npm run verify:feature` runs each test runner once, writes their JSON reports to `test-inventory-reports/`, then uses `npm run test:inventory:ci` to audit those reports without rerunning either suite; GitHub Actions calls this same command. Both modes always audit the tracked English and Chinese guides. Use `npm run test:inventory:sync` to update generated guide totals and file-heading counts after the tests pass; it never rewrites test comments.

## 4. Coverage Breakdown

### By Module

| Module       | Statements | Branch | Lines  |
| ------------ | ---------- | ------ | ------ |
| scripts/     | 57.48%     | 50.00% | 53.04% |
| source/      | 97.59%     | 88.61% | 99.55% |
| components/  | 96.60%     | 92.33% | 98.40% |
| composables/ | 95.47%     | 86.58% | 97.26% |
| models/      | 100%       | 100%   | 100%   |
| services/    | 95.77%     | 82.77% | 95.31% |
| utils/       | 98.92%     | 87.69% | 100%   |

### By Component

| Component                    | Statements | Lines  | Tests |
| ---------------------------- | ---------- | ------ | ----- |
| App.vue                      | 97.59%     | 99.55% | 66    |
| AppIcon.vue                  | 100%       | 100%   | 4     |
| AddCategoryButton.vue        | 100%       | 100%   | 2     |
| AddItemButton.vue            | 100%       | 100%   | 8     |
| ProgressBar.vue              | 100%       | 100%   | 8     |
| Topbar.vue                   | 100%       | 100%   | 2     |
| PendingItemsCategory.vue     | 100%       | 100%   | 5     |
| Sidebar.vue                  | 100%       | 100%   | 33    |
| OverflowMenu.vue             | 95.12%     | 96.20% | 24    |
| Category.vue                 | 97.29%     | 98.00% | 30    |
| Checklist.vue                | 93.52%     | 98.43% | 38    |
| Item.vue                     | 92.40%     | 93.50% | 26    |
| NewChecklistDialog.vue       | 97.36%     | 100%   | 12    |
| PackingCompletionOverlay.vue | 97.18%     | 100%   | 10    |
| SaveTemplateDialog.vue       | 97.95%     | 100%   | 10    |
| TemplateEditor.vue           | 98.73%     | 100%   | 13    |

### Coverage Metrics Explained

| Metric     | Definition                                   |
| ---------- | -------------------------------------------- |
| Statements | Percentage of executable statements executed |
| Branch     | Percentage of conditional branches taken     |
| Lines      | Percentage of source lines executed          |

Coverage note: Branch is the strictest metric. Remaining uncovered branches are mostly defensive guards and secondary conditional paths.

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

### Coverage Report (run last)

```bash
npm run test:coverage # Vitest code coverage only: outputs terminal summary + coverage/index.html; focuses on source line/branch coverage, not Playwright E2E flow coverage（不含 Playwright E2E）
```

### Test Inventory Audit

```bash
npm run test:inventory      # Execute Vitest + Playwright and verify comments plus available guides
npm run test:inventory:sync # After passing, synchronize generated guide counts
npm run verify:feature      # Full feature verification: validate, coverage, E2E, inventory, build
npm run verify:feature -- --docs # Documentation-only validation; reports skipped test and build layers
```

## 6. Testing Layers and Responsibilities

This project uses three layers to balance speed and reliability.

| Layer     | Validation goal                                                                  | Typical scope             | Feedback speed | Why this layer matters                                       |
| --------- | -------------------------------------------------------------------------------- | ------------------------- | -------------- | ------------------------------------------------------------ |
| Unit      | Verify pure logic, validation rules, data transforms, edge/error handling        | models, services, utils   | Fastest        | Catches logic regressions early with the lowest runtime cost |
| Component | Verify render output, props/emits contracts, local interaction/state transitions | Vue component boundaries  | Fast           | Confirms UI behavior without full-browser overhead           |
| E2E       | Verify real user workflows in an actual browser/runtime environment              | cross-feature integration | Slowest        | Detects integration gaps that lower-level tests can miss     |

## 7. CI/CD Execution Stages

| Stage               | Trigger              | Test scope executed                      | Purpose                                                         |
| ------------------- | -------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Development process | Manual               | Manually selected by developer           | Fast local checks during implementation                         |
| Commit              | `git commit`         | Unit + Component                         | Block obvious regressions before push                           |
| CI on push          | `push` event         | Unit + Component + E2E + inventory audit | Run each suite once, then validate generated test metadata      |
| CI on pull request  | `pull_request` event | Unit + Component + E2E + inventory audit | Run each suite once, then validate merge readiness and metadata |

## 8. Complete Test Inventory

### 8.1 Unit Tests (253 tests)

#### 8.1.1 Models (40 tests)

##### 8.1.1.1 Item.test.js (17 tests)

| #   | Test                                             | What it verifies                                              |
| --- | ------------------------------------------------ | ------------------------------------------------------------- |
| 1   | should create an item with default values        | Constructor defaults (`isPacked: false`, `quantity: 1`, etc.) |
| 2   | should accept custom values                      | Constructor with all fields specified                         |
| 3   | should generate a unique ID                      | Each instance gets a different ID                             |
| 4   | should generate ID with correct prefix           | ID starts with the expected prefix string                     |
| 5   | should throw error for empty name                | Validation rejects `name: ""`                                 |
| 6   | should throw error for name exceeding max length | Validation rejects over-length names                          |
| 7   | should accept name at max length                 | Boundary: name exactly at limit passes                        |
| 8   | should throw error for non-string name           | Validation rejects non-string types (number, null, boolean)   |
| 9   | should throw error for quantity less than 1      | Validation rejects `quantity: 0`                              |
| 10  | should throw error for negative quantity         | Validation rejects negative values                            |
| 11  | should accept large quantity                     | Large numbers are valid                                       |
| 12  | should serialize to JSON correctly               | `toJSON()` output matches expected shape                      |
| 13  | should deserialize from JSON correctly           | `fromJSON()` reconstructs the instance                        |
| 14  | should preserve all properties through roundtrip | `fromJSON(toJSON())` is lossless                              |
| 15  | should toggle isPacked from false to true        | `togglePacked()` flips the flag                               |
| 16  | should toggle isPacked from true to false        | `togglePacked()` flips back                                   |
| 17  | should throw error for quantity greater than 999 | Validation rejects `quantity > 999`                           |

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

#### 8.1.2 Services (119 tests)

##### 8.1.2.1 localStorageService.test.js (80 tests)

| #   | Test                                                                          | What it verifies                  |
| --- | ----------------------------------------------------------------------------- | --------------------------------- |
| 1   | should initialize with empty data when localStorage is empty                  | Fresh start state                 |
| 2   | should not overwrite data on repeated initialization                          | Idempotent init                   |
| 3   | should not overwrite when app data key already exists                         | initializeStorage early return    |
| 4   | should preserve corrupted localStorage data and report an error               | Corrupt-data preservation         |
| 5   | should reject invalid collection types without replacing stored data          | Invalid data preservation         |
| 6   | should create a new checklist                                                 | Create + persist                  |
| 7   | should create general recommended list data for a new checklist by default    | General recommended list fallback |
| 8   | should persist supplied seed data when creating a checklist                   | Generic seeded creation           |
| 9   | should get checklist by ID                                                    | Single-entity retrieval           |
| 10  | should return null for non-existent checklist                                 | Missing entity returns null       |
| 11  | should update an existing checklist                                           | Mutation + persist                |
| 12  | should throw error when updating non-existent checklist                       | Update guard                      |
| 13  | should delete a checklist and its associated data                             | Cascade delete                    |
| 14  | should create a new category                                                  | Create + persist                  |
| 15  | should get categories for a checklist                                         | Filtered retrieval                |
| 16  | should update a category                                                      | Mutation + persist                |
| 17  | should delete a category and its items                                        | Cascade delete                    |
| 18  | should get a category by ID                                                   | Get category by ID                |
| 19  | should return null for non-existent category by ID                            | Missing category returns null     |
| 20  | should create a new item                                                      | Create + persist                  |
| 21  | should update an item                                                         | Mutation + persist                |
| 22  | should throw error when updating non-existent item in checklist               | Update non-existent throws        |
| 23  | should delete an item                                                         | Remove + persist                  |
| 24  | should get item by ID within a checklist                                      | Get item by ID                    |
| 25  | should return null when item is not found within a checklist                  | Missing item returns null         |
| 26  | should toggle item packed status                                              | Toggle + persist                  |
| 27  | should use cache on subsequent getData calls                                  | Cache hit                         |
| 28  | should update cache after save operation                                      | Cache invalidation                |
| 29  | should duplicate a checklist with all categories and items                    | Deep copy with new IDs            |
| 30  | should reorder other checklists when duplicating in the middle                | Insert duplicate + reorder        |
| 31  | should throw error when duplicating non-existent checklist                    | Duplicate guard                   |
| 32  | should duplicate a category with all its items                                | Category-level copy               |
| 33  | should throw error when duplicating non-existent category                     | Duplicate guard                   |
| 34  | should duplicate an item within the same category                             | Single item copy                  |
| 35  | should throw error when duplicating non-existent item                         | Duplicate guard                   |
| 36  | should update multiple checklists at once                                     | Batch update                      |
| 37  | should return English copy suffix by default                                  | Locale-aware suffix               |
| 38  | should return Chinese copy suffix for zh-TW locale                            | zh-TW suffix                      |
| 39  | should return fallback copy suffix for unknown locale                         | Unknown locale fallback           |
| 40  | should dispose resources and clear cache                                      | Cleanup                           |
| 41  | should handle deleting non-existent category gracefully                       | No-op delete                      |
| 42  | should handle deleting non-existent item gracefully                           | No-op delete                      |
| 43  | should propagate errors when storage save fails                               | Error propagation                 |
| 44  | should truncate duplicate name when original name is at max length            | Boundary: name truncation         |
| 45  | should invalidate cache when storage event fires with matching key            | Cross-tab cache invalidation      |
| 46  | should reset \_initialized when storage key is removed in another tab         | Cross-tab removal handling        |
| 47  | should ignore storage events for unrelated keys                               | Event key filtering               |
| 48  | should throw Storage operation failed when setItem throws                     | QuotaExceeded error path          |
| 49  | should throw when updating non-existent category                              | Non-existent update guard         |
| 50  | should truncate duplicate category name when at max length                    | Category name truncation          |
| 51  | should truncate duplicate item name when at max length                        | Item name truncation              |
| 52  | should read user-locale from localStorage when no locale provided             | Read locale from storage          |
| 53  | should default to English suffix when no locale in storage                    | Locale fallback                   |
| 54  | should handle multiple dispose calls gracefully                               | dispose idempotency               |
| 55  | should store and retrieve emoji in checklist name                             | Unicode emoji support             |
| 56  | should store and retrieve CJK characters in category name                     | CJK character support             |
| 57  | should store HTML-like strings as plain text                                  | XSS-safe storage                  |
| 58  | should handle special characters in item names                                | Special character encoding        |
| 59  | should handle gracefully when getItem throws on getData                       | localStorage disabled/unavailable |
| 60  | should normalize missing arrays from storage payload                          | Sparse payload fallback           |
| 61  | should handle missing checklists array in cache                               | Cache shape fallback              |
| 62  | should handle missing categories array in cache                               | Cache shape fallback              |
| 63  | should handle missing items array in cache                                    | Cache shape fallback              |
| 64  | should allow create operations with sparse cache shape                        | Sparse cache create path          |
| 65  | should reject the whole batch when a checklist does not exist                 | Atomic batch failure              |
| 66  | should return all categories across all checklists                            | Unfiltered categories path        |
| 67  | should use original categoryId for items whose category was not found         | Orphan item fallback              |
| 68  | should duplicate checklist when stored categories and items are absent        | Legacy defaults                   |
| 69  | should duplicate category when stored items are absent                        | Legacy defaults                   |
| 70  | should duplicate item when stored data has no reorder targets                 | Duplicate fallback path           |
| 71  | should reject stale concurrent checklist updates                              | Same-field conflict               |
| 72  | should invalidate cache after storage event from another tab                  | Cross-tab invalidation            |
| 73  | should handle high data volume (50+) without losing correctness               | Scale correctness                 |
| 74  | should cascade delete categories and items when deleting checklist            | Cascade integrity                 |
| 75  | should cascade delete all items in a deleted category                         | Cascade integrity                 |
| 76  | should preserve relative order semantics after duplicate and delete           | Order consistency                 |
| 77  | should keep general recommended list shape stable across en and zh-TW locales | Locale stability                  |
| 78  | should reject a stale item update without overwriting newer fields            | Same-field conflict               |
| 79  | should update multiple items atomically with one storage write                | Atomic batch persistence          |
| 80  | should not persist a partial batch when an item does not exist                | Batch failure integrity           |

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

##### 8.1.2.4 storageTransaction.test.js (20 tests)

| #   | Test                                                                          | What it verifies           |
| --- | ----------------------------------------------------------------------------- | -------------------------- |
| 1   | keeps durable and readable data unchanged after a failed write                | Failed-write isolation     |
| 2   | preserves app and template data when any supported mutation cannot be saved   | Mutation failure coverage  |
| 3   | does not expose mutable references to committed data                          | Detached snapshots         |
| 4   | preserves corrupted application data and rejects writes                       | Corrupt-data preservation  |
| 5   | rejects an unsupported application schema without replacing it                | Version guard              |
| 6   | rejects records without identity instead of generating a new id               | Identity guard             |
| 7   | preserves malformed template snapshots and refuses to overwrite them          | Template-data preservation |
| 8   | rejects wrong-typed persisted fields without normalizing them into new values | Type guard                 |
| 9   | refuses writes when safe cross-tab locking is unavailable                     | Read-only fallback         |
| 10  | normalizes legacy defaults in memory without rewriting the stored bytes       | Non-destructive reads      |
| 11  | keeps both templates when an earlier reader creates after another writer      | Fresh template writes      |
| 12  | serializes simultaneous checklist creation across service instances           | Concurrent writes          |
| 13  | merges unrelated field changes and rejects stale edits to the same field      | Field intent and conflicts |
| 14  | does not create a category or item after its owner was deleted                | Owner guard                |
| 15  | rejects an entire batch when one item conflicts                               | Atomic item batch          |
| 16  | does not partially reorder categories if a category was deleted               | Atomic category batch      |
| 17  | rejects a template draft if another tab changed its original snapshot         | Template conflict          |
| 18  | rejects a queued item move after another writer deletes its destination       | Destination conflict       |
| 19  | rejects queued checklist creation after the selected template is deleted      | Deleted template guard     |
| 20  | preserves corrupted template data and refuses queued checklist creation       | Corrupt template guard     |

#### 8.1.3 Composables (62 tests)

##### 8.1.3.1 usePackingLists.test.js (47 tests)

| #   | Test                                                                               | What it verifies                |
| --- | ---------------------------------------------------------------------------------- | ------------------------------- |
| 1   | should return initial empty state                                                  | Default refs are empty          |
| 2   | should have computed properties                                                    | Computed refs exist             |
| 3   | should load data from storage on initialize                                        | Init reads from service         |
| 4   | should manage loading state during initialization                                  | `isLoading` toggles correctly   |
| 5   | should normalize missing checklist order in memory and restore the saved checklist | Legacy defaults + saved restore |
| 6   | should fallback selected checklist and reload scoped categories/items              | Sidebar-top fallback            |
| 7   | should set error and clear state when initialize fails unexpectedly                | Init failure recovery           |
| 8   | should create a new checklist                                                      | Creates and refreshes state     |
| 9   | should select the first checklist after creation                                   | Auto-selection logic            |
| 10  | should update an existing checklist                                                | Update + refresh                |
| 11  | should delete a checklist                                                          | Delete + refresh                |
| 12  | should return null when createChecklist service call fails                         | Service failure path            |
| 13  | should return null when updateChecklist service call fails                         | Service failure path            |
| 14  | should create a category in the selected checklist                                 | Category creation               |
| 15  | should return null if no checklist is selected                                     | Null guard                      |
| 16  | should create an item in the selected checklist                                    | Item creation                   |
| 17  | should toggle item packed status                                                   | Toggle + refresh; no undo       |
| 18  | should calculate progress correctly                                                | Progress computation            |
| 19  | should return 0 progress for empty checklist                                       | Zero-item edge case             |
| 20  | should handle storage errors gracefully during initialization                      | Error recovery                  |
| 21  | should duplicate a checklist and refresh state                                     | Checklist duplication           |
| 22  | should duplicate a category and refresh state                                      | Category duplication            |
| 23  | should duplicate an item and refresh state                                         | Item duplication                |
| 24  | should delete a category and refresh both categories and items                     | Category delete cascade         |
| 25  | should delete an item and refresh items                                            | Item delete                     |
| 26  | should update multiple checklists and refresh state                                | Batch update                    |
| 27  | should return null when creating item without selected checklist                   | Null guard                      |
| 28  | should return null when duplicating item without selected checklist                | Null guard                      |
| 29  | should return null when updating item without selected checklist                   | Null guard                      |
| 30  | should return empty array when getting categories without selected checklist       | Null guard                      |
| 31  | should return empty array when getting items without selected checklist            | Null guard                      |
| 32  | should return early when deleting item without selected checklist                  | Null guard                      |
| 33  | should return null when createItem service call fails (with checklist)             | Service failure path            |
| 34  | should return null when duplicateCategory service call fails (with checklist)      | Service failure path            |
| 35  | should return null when updateItem service call fails (with checklist)             | Service failure path            |
| 36  | should return null when duplicateItem service call fails (with checklist)          | Service failure path            |
| 37  | should return null when createCategory service call fails (with checklist)         | Service failure path            |
| 38  | should return null when duplicateChecklist service call fails (no checklist)       | Service failure path            |
| 39  | should return null when updateCategory service call fails (no checklist)           | Service failure path            |
| 40  | should return null when updateCategory service returns undefined                   | Falsy result guard              |
| 41  | should return null when updateMultipleChecklists service returns undefined         | Falsy result guard              |
| 42  | should return null when updateCategory throws (real service)                       | Throw fallback                  |
| 43  | should refresh categories and return updated category on success                   | Success path + refresh          |
| 44  | should preserve valid selection and recover deleted selection on app data refresh  | Cross-tab selection recovery    |
| 45  | should treat a category pack-all as one undoable action and restore mixed state    | Grouped history; redo safety    |
| 46  | should clear packing history when switching checklists                             | History scope isolation         |
| 47  | preserves remote item edits when committing a stale drag payload                   | Explicit drag intent            |

##### 8.1.3.2 useTemplates.test.js (15 tests)

| #   | Test                                                       | What it verifies    |
| --- | ---------------------------------------------------------- | ------------------- |
| 1   | should load template state                                 | Initial loading     |
| 2   | should expose a load error                                 | Error state         |
| 3   | should save a template and refresh state                   | Save + refresh      |
| 4   | should expose an apply error                               | Apply failure       |
| 5   | should rename a template and refresh state                 | Update + refresh    |
| 6   | should expose a delete error                               | Delete failure      |
| 7   | should delete a template and refresh state                 | Delete + refresh    |
| 8   | should expose a save error                                 | Save failure        |
| 9   | should reject renaming a missing template                  | Missing guard       |
| 10  | should expose a rename error                               | Rename failure      |
| 11  | should return applied template data                        | Apply success       |
| 12  | should update a template and refresh state                 | Update + refresh    |
| 13  | should expose an update error                              | Update failure      |
| 14  | should expose its service instance                         | Service access      |
| 15  | refreshes for template and clear events only while mounted | Cross-tab lifecycle |

#### 8.1.4 i18n (11 tests)

##### 8.1.4.1 index.test.js (11 tests)

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

#### 8.1.5 Utils (36 tests)

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

##### 8.1.5.4 positioning.test.js (3 tests)

| #   | Test                                                      | What it verifies               |
| --- | --------------------------------------------------------- | ------------------------------ |
| 1   | should clamp dropdown left within viewport padding        | Left min padding clamp         |
| 2   | should clamp dropdown left to max when near right edge    | Right max boundary clamp       |
| 3   | should position dropdown above anchor with gap and zIndex | Fixed position calc (with gap) |

##### 8.1.5.5 focusEditingInput.test.js (2 tests)

| #   | Test                                                                                  | What it verifies            |
| --- | ------------------------------------------------------------------------------------- | --------------------------- |
| 1   | should focus without scrolling, select the name, and keep a visible input in place    | Stable focus and selection  |
| 2   | should use nearest non-animated scrolling only when the input is outside the viewport | Conditional viewport scroll |

#### 8.1.6 Data (4 tests)

##### 8.1.6.1 recommendedLists.test.js (4 tests)

| #   | Test                                                                         | What it verifies          |
| --- | ---------------------------------------------------------------------------- | ------------------------- |
| 1   | resolves complete localized recommended lists with valid category references | Localized data integrity  |
| 2   | includes core clothing in every recommended list                             | Core wardrobe coverage    |
| 3   | falls back to English for unsupported locales                                | Locale fallback           |
| 4   | returns isolated resolved data                                               | Resolver output isolation |

#### 8.1.7 Scripts (5 tests)

##### 8.1.7.1 candidateFingerprint.test.js (2 tests)

| #   | Test                                                                          | What it verifies                         |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | allows a staged binary diff larger than the completion asset collection       | Binary candidate fingerprint budget      |
| 2   | fingerprints a staged binary candidate larger than the default process buffer | End-to-end large binary Git diff support |

##### 8.1.7.2 verifyFeature.test.js (3 tests)

| #   | Test                                                         | What it verifies                           |
| --- | ------------------------------------------------------------ | ------------------------------------------ |
| 1   | should summarize Playwright failures without ANSI formatting | Concise, de-duplicated failure diagnostics |
| 2   | should report missing individual errors                      | Reporter fallback message                  |
| 3   | should summarize top-level Playwright runner failures        | Pre-test runner diagnostic                 |

### 8.2 Component Tests (291 tests)

#### 8.2.1 App.test.js (66 tests)

| #   | Test                                                                             | What it verifies                                     |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | should render the main layout with sidebar and content                           | Main layout rendering                                |
| 2   | should show empty state when no checklist is selected                            | Empty state display                                  |
| 3   | should show ChecklistComponent when a checklist is selected                      | Checklist visibility                                 |
| 4   | should set isMobileViewport to true for narrow screens                           | Mobile viewport detection                            |
| 5   | should auto-collapse sidebar on mobile viewport                                  | Auto-collapse on mobile                              |
| 6   | should auto-expand sidebar on wide desktop when not manually collapsed           | Auto-expand on desktop                               |
| 7   | should not auto-expand sidebar when manually collapsed key exists                | Collapse persistence                                 |
| 8   | should detect small desktop viewport as overlay zone                             | Overlay zone detection                               |
| 9   | should toggle sidebar when sidebar emits toggle-sidebar                          | Sidebar toggle event                                 |
| 10  | should persist sidebar collapse to localStorage on desktop                       | Collapse persistence                                 |
| 11  | should remove collapsed key from localStorage when sidebar re-opened             | Expand cleanup                                       |
| 12  | should toggle sidebar from Topbar on mobile                                      | Topbar toggle event                                  |
| 13  | should open source selection from Sidebar without creating immediately           | Sidebar source dialog                                |
| 14  | should open source selection from Topbar on mobile                               | Topbar source dialog                                 |
| 15  | should select and mark checklist for editing on handleChecklistEdit              | Edit mode trigger                                    |
| 16  | should duplicate checklist and select the copy on handleChecklistCopy            | Checklist duplication                                |
| 17  | should delete checklist after user confirms the dialog                           | Confirmed deletion                                   |
| 18  | should not delete checklist when user cancels the dialog                         | Cancelled deletion                                   |
| 19  | should delegate selected checklist deletion to the composable                    | Delete delegation                                    |
| 20  | should update checklist via ChecklistComponent emit                              | Checklist update                                     |
| 21  | should call updateMultipleChecklists on handleChecklistMove                      | Checklist move                                       |
| 22  | should update selectedChecklistId from overlay sidebar select-checklist          | Overlay sidebar selection                            |
| 23  | should update selectedChecklistId from inline sidebar select-checklist           | Inline sidebar selection                             |
| 24  | should create item with maxOrder + 1 in the target category                      | Item order calculation                               |
| 25  | should create item with order 0 in an empty category                             | Empty category item creation                         |
| 26  | should update item and clear newlyCreatedItemId if matching                      | Item update + flag clear                             |
| 27  | should call duplicateItem on copy:item emit                                      | Item duplication                                     |
| 28  | should call deleteItem on delete:item emit                                       | Item deletion                                        |
| 29  | should update item categoryId and reordered items on move type                   | Cross-category move                                  |
| 30  | should update all items with new order on reorder type                           | Same-category reorder                                |
| 31  | should handle move with empty reorderedItems gracefully                          | Empty reorder boundary                               |
| 32  | should create category with correct order                                        | Category order calculation                           |
| 33  | should update category and clear newlyCreatedCategoryId if matching              | Category update + flag clear                         |
| 34  | should call duplicateCategory on copy:category emit                              | Category duplication                                 |
| 35  | should call deleteCategory on delete:category emit                               | Category deletion                                    |
| 36  | should update each category and call getCategories                               | Category reorder                                     |
| 37  | should display overlay backdrop when sidebar is open on mobile                   | Overlay rendering                                    |
| 38  | should close sidebar when overlay backdrop is clicked                            | Overlay close                                        |
| 39  | should set body overflow hidden when overlay is active                           | Body scroll lock                                     |
| 40  | should set body overflow hidden when sidebar opens on small desktop              | Small desktop scroll lock                            |
| 41  | should call initialize on mount                                                  | Lifecycle: mount init                                |
| 42  | should clean up resize event listener on unmount                                 | Lifecycle: unmount cleanup                           |
| 43  | should open an isolated editor without creating a checklist                      | Template editor isolation                            |
| 44  | should save only through the templates composable                                | Template persistence routing                         |
| 45  | should open the named template dialog and save its selected checklist            | Named template save flow                             |
| 46  | should create a checklist from a selected personal template                      | Template application flow                            |
| 47  | should delete the active template and leave the editor                           | Template delete flow                                 |
| 48  | should create an explicitly empty checklist                                      | Empty source flow                                    |
| 49  | handles failed template creation and ignores missing sources                     | Creation failure and missing-source guard            |
| 50  | should ignore requests to edit a missing template                                | Missing template guard                               |
| 51  | should keep the editor open when saving fails                                    | Save failure state                                   |
| 52  | should discard a template draft when canceled                                    | Draft cancellation                                   |
| 53  | should preserve a template when deletion is canceled                             | Delete cancellation                                  |
| 54  | should close both template dialogs without operations                            | Dialog cancellation                                  |
| 55  | should leave state unchanged when empty creation fails                           | Empty creation failure                               |
| 56  | should keep the editor open when template deletion fails                         | Delete failure state                                 |
| 57  | should use an empty initial name for an unknown checklist                        | Missing checklist fallback                           |
| 58  | should ignore duplicate save events after source state clears                    | Duplicate save guard                                 |
| 59  | should create a checklist from a selected recommended list                       | recommended list flow                                |
| 60  | should apply a category packing change and offer one-click undo                  | Batch packing undo action                            |
| 61  | should use Ctrl+Z for packing undo but preserve input-native undo                | Keyboard shortcut isolation                          |
| 62  | shows the completion overlay after the final local item is packed                | Local completion transition                          |
| 63  | should defer the complete undo window until the completion overlay closes        | Inert background, focus return, and full Undo window |
| 64  | shows the completion overlay only when redo completes the checklist              | Redo transition, sidebar isolation, and guard        |
| 65  | keeps completed initialization and checklist switching silent                    | Passive transition exclusions                        |
| 66  | should defer an existing category undo window when a final item opens completion | Cross-path full Undo window                          |

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

#### 8.2.7 Item.test.js (26 tests)

| #   | Test                                                                      | What it verifies         |
| --- | ------------------------------------------------------------------------- | ------------------------ |
| 1   | should display the item name                                              | Name rendering           |
| 2   | should render a checkbox input                                            | Checkbox exists          |
| 3   | should check the checkbox when item is packed                             | Checked state binding    |
| 4   | should apply line-through styling when item is packed                     | Packed visual style      |
| 5   | should display quantity value                                             | Quantity label           |
| 6   | should emit "update:item" with toggled isPacked when checkbox is clicked  | Checkbox toggle event    |
| 7   | should clear isPending when item becomes packed                           | Packed clears pending    |
| 8   | should enter edit mode when item name is clicked                          | Focus + select on edit   |
| 9   | should save edited name on Enter key                                      | Enter confirms edit      |
| 10  | should cancel edit mode on Escape key                                     | Escape cancels edit      |
| 11  | should emit "update:item" with incremented quantity                       | Quantity increment       |
| 12  | should emit "update:item" with decremented quantity                       | Quantity decrement       |
| 13  | should emit "delete:item" when quantity is 1 and delete button is clicked | Delete at quantity 1     |
| 14  | should emit "update:item" with toggled isPending                          | Toggle pending           |
| 15  | should clear isPacked when item is marked as pending                      | Pending clears packed    |
| 16  | should emit "copy:item" when OverflowMenu triggers copy                   | Copy event forward       |
| 17  | should emit "update:item" on blur with changed name                       | Blur-save                |
| 18  | should not emit "update:item" on blur with empty name                     | Empty name guard         |
| 19  | should emit "delete:item" when OverflowMenu triggers delete               | Delete event forward     |
| 20  | should show action buttons on mouseenter                                  | Hover-in shows controls  |
| 21  | should hide action buttons on mouseleave                                  | Hover-out hides controls |
| 22  | should not save during IME composition                                    | IME guard                |
| 23  | should enter edit mode when newlyCreatedItemId matches                    | Auto-focus + select      |
| 24  | should not enter edit mode when newlyCreatedItemId does not match         | No false trigger         |
| 25  | should not decrement quantity below 1                                     | Minimum quantity guard   |
| 26  | should apply cursor-grabbing when isDragging is true                      | Drag visual state        |

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

#### 8.2.9 Category.test.js (30 tests)

| #   | Test                                                                                | What it verifies       |
| --- | ----------------------------------------------------------------------------------- | ---------------------- |
| 1   | should display the category name                                                    | Name rendering         |
| 2   | should pass correct item counts to ProgressBar                                      | Progress data binding  |
| 3   | should filter items by categoryId                                                   | Item filtering         |
| 4   | should not apply completed styling when some items are unpacked                     | Incomplete style       |
| 5   | should apply completed styling when all items are packed                            | Completed style        |
| 6   | should start with items visible (not collapsed)                                     | Default expanded state |
| 7   | should collapse items when toggle button is clicked                                 | Collapse toggle        |
| 8   | should show input when category name is clicked                                     | Click-to-edit          |
| 9   | should emit "update:category" with new name on Enter                                | Enter confirms edit    |
| 10  | should cancel edit mode on Escape key                                               | Escape cancels edit    |
| 11  | should emit "create:item" when AddItemButton triggers click                         | Item creation event    |
| 12  | should emit "delete:category" when delete is triggered                              | Delete event           |
| 13  | should emit "copy:category" when copy is triggered                                  | Copy event             |
| 14  | should emit "update:category" on blur with changed name                             | Blur-save              |
| 15  | should not emit "update:category" on blur when name is unchanged                    | No-op blur             |
| 16  | should not emit "update:category" when name is empty                                | Empty name guard       |
| 17  | should not emit "update:category" when name is whitespace only                      | Whitespace guard       |
| 18  | should set dragging item ID on drag start                                           | Drag start state       |
| 19  | should clear dragging item ID on drag end                                           | Drag end cleanup       |
| 20  | should emit "move:item" with type "move" when item is added from another category   | Cross-category move    |
| 21  | should emit "move:item" with type "reorder" when item is moved within same category | Same-category reorder  |
| 22  | should preserve packed slots when reordering filtered items                         | Filtered slot reorder  |
| 23  | should insert before the next visible target item while filtered                    | Filtered cross-move    |
| 24  | should display only unpacked items while retaining full category progress           | Filtered rendering     |
| 25  | should forward Item events from child Item component                                | Child event forwarding |
| 26  | should enter edit mode when newlyCreatedCategoryId matches                          | Auto-edit on create    |
| 27  | should not enter edit mode when newlyCreatedCategoryId does not match               | No false trigger       |
| 28  | should not save during IME composition                                              | IME guard              |
| 29  | should expose a mixed category checkbox and request packing all items               | Tri-state batch intent |
| 30  | should expose checked, unchecked, and disabled category checkbox states             | State rendering        |

#### 8.2.10 Checklist.test.js (38 tests)

| #   | Test                                                          | What it verifies             |
| --- | ------------------------------------------------------------- | ---------------------------- |
| 1   | should display the checklist name                             | Name rendering               |
| 2   | should display the formatted date range                       | Same-year date format        |
| 3   | should pass correct item counts to ProgressBar                | Progress binding             |
| 4   | should render Category components for each category           | Category rendering           |
| 5   | should show PendingItemsCategory when pending items exist     | Conditional display          |
| 6   | should hide PendingItemsCategory when no pending items        | Conditional hide             |
| 7   | should hide dates and checklist overflow for template editing | Template editor display      |
| 8   | should toggle unpacked-only display without hiding categories | Filter state and categories  |
| 9   | should show input when checklist name is clicked              | Click-to-edit                |
| 10  | should emit "update:checklist" with new name on Enter         | Enter confirms edit          |
| 11  | should cancel edit mode on Escape key                         | Escape cancels               |
| 12  | should emit "copy:checklist" from OverflowMenu                | Copy event forward           |
| 13  | should emit "delete:checklist" from OverflowMenu              | Delete event forward         |
| 14  | should emit "create:category" from AddCategoryButton          | Category creation event      |
| 15  | should forward "update:item" from Category component          | Item update forward          |
| 16  | should forward "copy:category" from Category                  | Category copy forward        |
| 17  | should forward "delete:category" from Category                | Category delete forward      |
| 18  | should display untitled placeholder for empty name            | Untitled fallback            |
| 19  | should adjust end date when start date moves past it          | Date constraint: start > end |
| 20  | should not change end date when start date is still before it | Date constraint: no-op       |
| 21  | should auto-correct end date set earlier than start date      | Date constraint: end < start |
| 22  | should not save on Enter during IME composition               | IME guard                    |
| 23  | should not emit update when name has not changed              | No-op save                   |
| 24  | should use untitled placeholder when saving empty name        | Empty name fallback          |
| 25  | should enter edit mode when OverflowMenu triggers edit        | Edit-mode trigger            |
| 26  | should enter edit mode when newlyCreatedChecklistId matches   | Auto-edit on create          |
| 27  | should forward "copy:item" from Category component            | Item copy forward            |
| 28  | should forward "delete:item" from Category component          | Item delete forward          |
| 29  | should forward "create:item" from Category component          | Item creation forward        |
| 30  | should forward "update:category" from Category component      | Category update forward      |
| 31  | should forward "move:item" from Category component            | Item move forward            |
| 32  | should format single-date and cross-year ranges               | Single/cross-year display    |
| 33  | should handle empty dates gracefully                          | No-date display              |
| 34  | should forward "update:item" from PendingItemsCategory        | Pending item update forward  |
| 35  | should set isDraggingCategory on drag start                   | Drag state                   |
| 36  | should clear drag state on category drag end                  | Drag cleanup                 |
| 37  | should emit "reorder:categories" with renumbered order        | Category reorder event       |
| 38  | should save when focus leaves all editing inputs              | Global blur-save             |

#### 8.2.11 Sidebar.test.js (33 tests)

| #   | Test                                                            | What it verifies     |
| --- | --------------------------------------------------------------- | -------------------- |
| 1   | should display checklist names when expanded                    | Name rendering       |
| 2   | should show the new checklist button                            | Button exists        |
| 3   | should display the sidebar title                                | Title rendering      |
| 4   | should render checklist item buttons                            | Button rendering     |
| 5   | should emit "toggle-sidebar" on hamburger click                 | Toggle event         |
| 6   | should emit "create-checklist" on new checklist button click    | Create event         |
| 7   | should emit "select-checklist" with checklist ID on item click  | Select event         |
| 8   | should emit "copy-checklist" from OverflowMenu                  | Copy event           |
| 9   | should emit "delete-checklist" from OverflowMenu                | Delete event         |
| 10  | should emit "edit-checklist" from OverflowMenu                  | Edit event           |
| 11  | should highlight the selected checklist                         | Active style         |
| 12  | should not highlight non-selected checklists                    | Inactive style       |
| 13  | should show first character when collapsed on desktop           | Collapsed display    |
| 14  | should show language dropdown on language button click          | Menu open            |
| 15  | should change locale and close menu when a language is selected | Locale change        |
| 16  | should close language menu when focus leaves                    | Focus-out close      |
| 17  | should close language menu on window scroll                     | Scroll close         |
| 18  | should close language menu on outside click                     | Click-outside close  |
| 19  | should set dragging state on drag start                         | Drag state           |
| 20  | should clear dragging state on drag end                         | Drag cleanup         |
| 21  | should display checklists sorted by order property              | Sort order           |
| 22  | should emit "move:checklists" when checklists are reordered     | Reorder event        |
| 23  | should display untitled placeholder for empty checklist name    | Untitled fallback    |
| 24  | should apply positioning styles when language menu opens        | Dropdown positioning |
| 25  | should clean up document and window listeners on unmount        | Lifecycle cleanup    |
| 26  | should use matching language and template dropdown layouts      | Menu layout parity   |
| 27  | should close the template menu after an outside click           | Outside click        |
| 28  | should emit edit-template when a template is selected           | Template selection   |
| 29  | should hide template overflow menus on narrow screens           | Narrow layout        |
| 30  | should sort templates and highlight the active template         | Order and selection  |
| 31  | should display an empty template state                          | Empty state          |
| 32  | should close the template menu with Escape                      | Keyboard dismissal   |
| 33  | should forward save-as-template from checklist overflow         | Event forwarding     |

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

#### 8.2.13 TemplateEditor.test.js (13 tests)

| #   | Test                                                          | What it verifies         |
| --- | ------------------------------------------------------------- | ------------------------ |
| 1   | configures Checklist without dates or overflow menu           | Editor rendering         |
| 2   | emits a storage-safe edited template snapshot                 | Persistence payload      |
| 3   | emits delete without saving the draft                         | Delete action            |
| 4   | discards the draft when cancel is selected                    | Cancel action            |
| 5   | creates draft items and categories without persisting them    | Draft-only creation      |
| 6   | copies and deletes categories with their draft items          | Category draft lifecycle |
| 7   | updates, copies, moves and deletes draft items in memory      | Item draft lifecycle     |
| 8   | resets the in-memory draft when the selected template changes | Template switch reset    |
| 9   | finishes auto-edit state after updating new entries           | Auto-edit cleanup        |
| 10  | applies same-category item reorder payloads                   | Item reorder             |
| 11  | ignores copy requests for missing draft entries               | Missing-entry guards     |
| 12  | moves an item without optional reordered items                | Optional move payload    |
| 13  | assigns zero order to the first category and item             | Empty draft ordering     |

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

### 8.3 E2E Tests (59 tests)

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
| 5   | should delete checklist after confirmation                                              | Delete flow               |
| 6   | should restore the last opened checklist and fallback to sidebar top after invalidation | Reload restore + fallback |

#### 8.3.3 category-crud.spec.js (3 tests)

| #   | Test                                                | What it verifies         |
| --- | --------------------------------------------------- | ------------------------ |
| 1   | should delete a category via overflow menu          | Category deletion        |
| 2   | should copy a category via overflow menu            | Category duplication     |
| 3   | should show copy suffix in duplicated category name | Copy suffix localization |

#### 8.3.4 drag-and-drop.spec.js (7 tests)

| #   | Test                                                                 | What it verifies                |
| --- | -------------------------------------------------------------------- | ------------------------------- |
| 1   | should reorder checklists in sidebar by drag-and-drop                | Sidebar checklist reordering    |
| 2   | should reorder categories by drag-and-drop                           | Category card reordering        |
| 3   | should reorder items within a category by drag-and-drop              | Item reordering within category |
| 4   | should preserve packed item slots when filtered items are reordered  | Filtered item reordering        |
| 5   | should persist a filtered move into a partially visible category     | Filtered cross-category insert  |
| 6   | should persist a filtered move into an all-hidden category           | Empty-target append and persist |
| 7   | preserves a remote item rename made while another tab is dragging it | Concurrent drag and rename      |

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

#### 8.3.8 multi-tab-sync.spec.js (6 tests)

| #   | Test                                                                     | What it verifies                   |
| --- | ------------------------------------------------------------------------ | ---------------------------------- |
| 1   | should sync checklist create and rename across tabs                      | Cross-tab storage sync             |
| 2   | should converge when tabs rename sequentially after synchronization      | Sequential synchronization         |
| 3   | should converge after rapid alternating cross-tab edits                  | Rapid alternating edit safety      |
| 4   | should converge to deletion when one tab renames and another tab deletes | Rename+delete conflict convergence |
| 5   | should keep remote completion synchronization silent                     | No celebration from storage sync   |
| 6   | keeps both templates when two tabs save behind the same lock barrier     | Concurrent template writes         |

#### 8.3.9 template-management.spec.js (7 tests)

| #   | Test                                                                  | What it verifies         |
| --- | --------------------------------------------------------------------- | ------------------------ |
| 1   | closes the templates menu after an outside click                      | Outside-click dismissal  |
| 2   | distinguishes Back from canceling checklist creation                  | Dialog-step semantics    |
| 3   | edits a template without creating a checklist                         | Isolated editing         |
| 4   | deletes the active template from the editor                           | Template deletion        |
| 5   | keeps narrow template rows free of overflow menus                     | Narrow responsive layout |
| 6   | saves a checklist as a named template without changing checklist data | Snapshot isolation       |
| 7   | creates an isolated checklist from a selected template                | Fresh IDs and storage    |

#### 8.3.10 recommended-lists.spec.js (1 tests)

| #   | Test                                                          | What it verifies             |
| --- | ------------------------------------------------------------- | ---------------------------- |
| 1   | should create and persist a checklist from a recommended list | Source-aware name and reload |
