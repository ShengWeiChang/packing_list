# Packing List App - Testing Guide

## 1. Overview

### Purpose

Ensure application correctness and prevent regressions through a comprehensive automated test suite covering models, services, composables, utilities, Vue components, and end-to-end user flows.

### Scope

Applies to this project's stack: Vue 3 + Vite + Vitest + @vue/test-utils + Playwright.

### Results Summary

| Metric             | Value  |
| ------------------ | ------ |
| Total tests        | 428    |
| Unit tests         | 190    |
| Component tests    | 199    |
| E2E tests          | 40     |
| Line coverage      | 94.40% |
| Statement coverage | 93.48% |
| Branch coverage    | 86.98% |
| Pass rate          | 100%   |

## 2. Test Architecture

### Testing Layers

| Layer     | Tool                     | Tests | Purpose                                            |
| --------- | ------------------------ | ----- | -------------------------------------------------- |
| Unit      | Vitest                   | 190   | Pure logic in models, services, composables, utils |
| Component | Vitest + @vue/test-utils | 199   | Vue component rendering, events, state             |
| E2E       | Playwright               | 40    | Full user flows in a real browser                  |

### Toolchain

| Package             | Version | Role                         |
| ------------------- | ------- | ---------------------------- |
| vitest              | 4.0.18  | Test runner and assertion    |
| @vue/test-utils     | 2.4.6   | Vue component test utilities |
| @vitest/coverage-v8 | 4.0.18  | Code coverage (V8 provider)  |
| playwright          | 1.58.2  | Browser-based E2E testing    |
| jsdom               | 25.0.1  | DOM environment for Vitest   |

## 3. Test File Structure

```
tests/
├── test-setup/
│   └── setup.js                         # Global mocks: localStorage, crypto, scrollIntoView
│
├── unit-tests/                          # 190 tests
│   ├── models/                          # 34  tests
│   │   ├── Item.test.js                 # 16  tests
│   │   ├── Category.test.js             #  8  tests
│   │   └── Checklist.test.js            # 10  tests
│   ├── services/                        # 78  tests
│   │   └── localStorageService.test.js  # 78  tests
│   ├── composables/                     # 45  tests
│   │   └── usePackingLists.test.js      # 45  tests
│   ├── i18n/                            #  5  tests
│   │   └── index.test.js                #  5  tests
│   └── utils/                           # 28  tests
│       ├── helpers.test.js              # 21  tests
│       ├── positioning.test.js          #  3  tests
│       ├── order.test.js                #  2  tests
│       └── dragDrop.test.js             #  2  tests
│
├── component-tests/                     # 199 tests
│   ├── App.test.js                      # 41  tests
│   ├── Checklist.test.js                # 36  tests
│   ├── Item.test.js                     # 26  tests
│   ├── Sidebar.test.js                  # 23  tests
│   ├── Category.test.js                 # 25  tests
│   ├── OverflowMenu.test.js             # 23  tests
│   ├── ProgressBar.test.js              #  8  tests
│   ├── AddItemButton.test.js            #  8  tests
│   ├── Topbar.test.js                   #  2  tests
│   ├── PendingItemsCategory.test.js     #  5  tests
│   └── AddCategoryButton.test.js        #  2  tests
│
└── end2end-tests/                       # 40  tests
    ├── mobile-workflow.spec.js          #  9  tests
    ├── item-packing.spec.js             #  7  tests
    ├── language-switch.spec.js          #  6  tests
    ├── app-loading.spec.js              #  5  tests
    ├── checklist-management.spec.js     #  5  tests
    ├── category-crud.spec.js            #  3  tests
    ├── drag-and-drop.spec.js            #  1  test
    └── multi-tab-sync.spec.js           #  4  tests
```

### Naming Conventions

- **Unit/Component tests** (`.test.js`): Match production file names exactly
  - `Category.test.js` → tests `Category.vue`
  - `usePackingLists.test.js` → tests `usePackingLists.js`
- **E2E tests** (`.spec.js`): Use kebab-case to describe user workflows
  - `item-packing.spec.js`, `checklist-management.spec.js`

## 4. Coverage Breakdown

### By Module

| Module       | Statements | Branch | Lines  |
| ------------ | ---------- | ------ | ------ |
| source/      | 96.93%     | 80.72% | 96.77% |
| components/  | 95.05%     | 89.40% | 96.73% |
| composables/ | 88.55%     | 78.44% | 90.39% |
| models/      | 93.61%     | 93.02% | 93.61% |
| services/    | 92.18%     | 87.16% | 91.30% |
| utils/       | 100%       | 95.23% | 100%   |

### By Component

| Component                | Statements | Lines  | Tests |
| ------------------------ | ---------- | ------ | ----- |
| App.vue                  | 96.93%     | 96.77% | 38    |
| AddCategoryButton.vue    | 100%       | 100%   | 2     |
| AddItemButton.vue        | 100%       | 100%   | 8     |
| ProgressBar.vue          | 100%       | 100%   | 8     |
| Topbar.vue               | 100%       | 100%   | 2     |
| PendingItemsCategory.vue | 100%       | 100%   | 5     |
| Sidebar.vue              | 92.85%     | 92.64% | 23    |
| OverflowMenu.vue         | 97.43%     | 98.66% | 23    |
| Category.vue             | 96.66%     | 97.61% | 25    |
| Checklist.vue            | 94.61%     | 99.15% | 36    |
| Item.vue                 | 90.66%     | 91.89% | 26    |

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

## 6. Testing Layers and Responsibilities

This project uses three layers to balance speed and reliability.

| Layer     | Validation goal                                                                  | Typical scope             | Feedback speed | Why this layer matters                                       |
| --------- | -------------------------------------------------------------------------------- | ------------------------- | -------------- | ------------------------------------------------------------ |
| Unit      | Verify pure logic, validation rules, data transforms, edge/error handling        | models, services, utils   | Fastest        | Catches logic regressions early with the lowest runtime cost |
| Component | Verify render output, props/emits contracts, local interaction/state transitions | Vue component boundaries  | Fast           | Confirms UI behavior without full-browser overhead           |
| E2E       | Verify real user workflows in an actual browser/runtime environment              | cross-feature integration | Slowest        | Detects integration gaps that lower-level tests can miss     |

## 7. CI/CD Execution Stages

| Stage               | Trigger              | Test scope executed            | Purpose                                  |
| ------------------- | -------------------- | ------------------------------ | ---------------------------------------- |
| Development process | Manual               | Manually selected by developer | Fast local checks during implementation  |
| Commit              | `git commit`         | Unit + Component               | Block obvious regressions before push    |
| CI on push          | `push` event         | Unit + Component + E2E         | Validate full suite after push to remote |
| CI on pull request  | `pull_request` event | Unit + Component + E2E         | Validate merge readiness with full suite |

## 8. Complete Test Inventory

### 8.1 Unit Tests (190 tests)

#### 8.1.1 Models (34 tests)

##### 8.1.1.1 Item.test.js (16 tests)

| #   | Test                                             | What it verifies                                              |
| --- | ------------------------------------------------ | ------------------------------------------------------------- |
| 1   | should create an item with default values        | Constructor defaults (`isPacked: false`, `quantity: 1`, etc.) |
| 2   | should accept custom values                      | Constructor with all fields specified                         |
| 3   | should generate a unique ID                      | Each instance gets a different ID                             |
| 4   | should generate ID with correct prefix           | ID starts with the expected prefix string                     |
| 5   | should throw error for empty name                | Validation rejects `name: ""`                                 |
| 6   | should throw error for name exceeding max length | Validation rejects over-length names                          |
| 7   | should accept name at max length                 | Boundary: name exactly at limit passes                        |
| 8   | should throw error for quantity less than 1      | Validation rejects `quantity: 0`                              |
| 9   | should throw error for negative quantity         | Validation rejects negative values                            |
| 10  | should accept large quantity                     | Large numbers are valid                                       |
| 11  | should serialize to JSON correctly               | `toJSON()` output matches expected shape                      |
| 12  | should deserialize from JSON correctly           | `fromJSON()` reconstructs the instance                        |
| 13  | should preserve all properties through roundtrip | `fromJSON(toJSON())` is lossless                              |
| 14  | should toggle isPacked from false to true        | `togglePacked()` flips the flag                               |
| 15  | should toggle isPacked from true to false        | `togglePacked()` flips back                                   |
| 16  | should throw error for quantity greater than 999 | Validation rejects `quantity > 999`                           |

##### 8.1.1.2 Category.test.js (8 tests)

| #   | Test                                             | What it verifies            |
| --- | ------------------------------------------------ | --------------------------- |
| 1   | should create a category with default values     | Constructor defaults        |
| 2   | should accept custom values                      | All fields specified        |
| 3   | should generate a unique ID                      | Unique IDs                  |
| 4   | should generate ID with correct prefix           | Prefix format               |
| 5   | should throw error for name exceeding max length | Over-length validation      |
| 6   | should allow empty name                          | Empty name is permitted     |
| 7   | should serialize to JSON correctly               | `toJSON()` shape            |
| 8   | should deserialize from JSON correctly           | `fromJSON()` reconstruction |

##### 8.1.1.3 Checklist.test.js (10 tests)

| #   | Test                                             | What it verifies                   |
| --- | ------------------------------------------------ | ---------------------------------- |
| 1   | should create a checklist with default values    | Constructor defaults               |
| 2   | should accept custom values                      | All fields specified               |
| 3   | should generate a unique ID                      | Unique IDs                         |
| 4   | should generate ID with correct prefix           | Prefix format                      |
| 5   | should trim whitespace from name                 | `"  Trip  "` → `"Trip"`            |
| 6   | should throw error for name exceeding max length | Over-length validation             |
| 7   | should allow empty name                          | Empty name is permitted (untitled) |
| 8   | should serialize to JSON correctly               | `toJSON()` shape                   |
| 9   | should deserialize from JSON correctly           | `fromJSON()` reconstruction        |
| 10  | should preserve all properties through roundtrip | Lossless serialization             |

#### 8.1.2 Services (78 tests)

##### 8.1.2.1 localStorageService.test.js (78 tests)

| #   | Test                                                                         | What it verifies                  |
| --- | ---------------------------------------------------------------------------- | --------------------------------- |
| 1   | should initialize with empty data when localStorage is empty                 | Fresh start state                 |
| 2   | should not overwrite data on repeated initialization                         | Idempotent init                   |
| 3   | should not overwrite when app data key already exists                        | initializeStorage early return    |
| 4   | should handle corrupted localStorage data gracefully                         | Malformed JSON recovery           |
| 5   | should normalize data shape when stored JSON has invalid types               | Type defense + fallback           |
| 6   | should create a new checklist                                                | Create + persist                  |
| 7   | should create default categories and items for new checklist                 | Seeding from default data         |
| 8   | should map default items into generated categories when creating a checklist | Default seed mapping              |
| 9   | should get checklist by ID                                                   | Single-entity retrieval           |
| 10  | should return null for non-existent checklist                                | Missing entity returns null       |
| 11  | should update an existing checklist                                          | Mutation + persist                |
| 12  | should throw error when updating non-existent checklist                      | Update guard                      |
| 13  | should delete a checklist and its associated data                            | Cascade delete                    |
| 14  | should create a new category                                                 | Create + persist                  |
| 15  | should get categories for a checklist                                        | Filtered retrieval                |
| 16  | should update a category                                                     | Mutation + persist                |
| 17  | should delete a category and its items                                       | Cascade delete                    |
| 18  | should get a category by ID                                                  | Get category by ID                |
| 19  | should return null for non-existent category by ID                           | Missing category returns null     |
| 20  | should create a new item                                                     | Create + persist                  |
| 21  | should update an item                                                        | Mutation + persist                |
| 22  | should throw error when updating non-existent item in checklist              | Update non-existent throws        |
| 23  | should delete an item                                                        | Remove + persist                  |
| 24  | should get item by ID within a checklist                                     | Get item by ID                    |
| 25  | should return null when item is not found within a checklist                 | Missing item returns null         |
| 26  | should toggle item packed status                                             | Toggle + persist                  |
| 27  | should use cache on subsequent getData calls                                 | Cache hit                         |
| 28  | should update cache after save operation                                     | Cache invalidation                |
| 29  | should duplicate a checklist with all categories and items                   | Deep copy with new IDs            |
| 30  | should reorder other checklists when duplicating in the middle               | Insert duplicate + reorder        |
| 31  | should throw error when duplicating non-existent checklist                   | Duplicate guard                   |
| 32  | should duplicate a category with all its items                               | Category-level copy               |
| 33  | should throw error when duplicating non-existent category                    | Duplicate guard                   |
| 34  | should duplicate an item within the same category                            | Single item copy                  |
| 35  | should throw error when duplicating non-existent item                        | Duplicate guard                   |
| 36  | should update multiple checklists at once                                    | Batch update                      |
| 37  | should return English copy suffix by default                                 | Locale-aware suffix               |
| 38  | should return Chinese copy suffix for zh-TW locale                           | zh-TW suffix                      |
| 39  | should return fallback copy suffix for unknown locale                        | Unknown locale fallback           |
| 40  | should dispose resources and clear cache                                     | Cleanup                           |
| 41  | should handle deleting non-existent category gracefully                      | No-op delete                      |
| 42  | should handle deleting non-existent item gracefully                          | No-op delete                      |
| 43  | should propagate errors when storage save fails                              | Error propagation                 |
| 44  | should truncate duplicate name when original name is at max length           | Boundary: name truncation         |
| 45  | should invalidate cache when storage event fires with matching key           | Cross-tab cache invalidation      |
| 46  | should reset \_initialized when storage key is removed in another tab        | Cross-tab removal handling        |
| 47  | should ignore storage events for unrelated keys                              | Event key filtering               |
| 48  | should throw Storage operation failed when setItem throws                    | QuotaExceeded error path          |
| 49  | should throw when updating non-existent category                             | Non-existent update guard         |
| 50  | should truncate duplicate category name when at max length                   | Category name truncation          |
| 51  | should truncate duplicate item name when at max length                       | Item name truncation              |
| 52  | should read user-locale from localStorage when no locale provided            | Read locale from storage          |
| 53  | should default to English suffix when no locale in storage                   | Locale fallback                   |
| 54  | should handle multiple dispose calls gracefully                              | dispose idempotency               |
| 55  | should store and retrieve emoji in checklist name                            | Unicode emoji support             |
| 56  | should store and retrieve CJK characters in category name                    | CJK character support             |
| 57  | should store HTML-like strings as plain text                                 | XSS-safe storage                  |
| 58  | should handle special characters in item names                               | Special character encoding        |
| 59  | should handle gracefully when getItem throws on getData                      | localStorage disabled/unavailable |
| 60  | should normalize missing arrays from storage payload                         | Sparse payload fallback           |
| 61  | should handle missing checklists array in cache                              | Cache shape fallback              |
| 62  | should handle missing categories array in cache                              | Cache shape fallback              |
| 63  | should handle missing items array in cache                                   | Cache shape fallback              |
| 64  | should allow create operations with sparse cache shape                       | Sparse cache create path          |
| 65  | should skip checklists that do not exist in storage                          | Batch skip path                   |
| 66  | should return all categories across all checklists                           | Unfiltered categories path        |
| 67  | should use original categoryId for items whose category was not found        | Orphan item fallback              |
| 68  | should duplicate checklist when cache categories and items are undefined     | Duplicate fallback path           |
| 69  | should duplicate category when cache items is undefined                      | Duplicate fallback path           |
| 70  | should duplicate item when cache data has items but no reorder targets       | Duplicate fallback path           |
| 71  | should apply last-write-wins semantics for concurrent checklist updates      | Concurrency consistency           |
| 72  | should invalidate cache after storage event from another tab                 | Cross-tab invalidation            |
| 73  | should handle high data volume (50+) without losing correctness              | Scale correctness                 |
| 74  | should cascade delete categories and items when deleting checklist           | Cascade integrity                 |
| 75  | should cascade delete all items in a deleted category                        | Cascade integrity                 |
| 76  | should preserve relative order semantics after duplicate and delete          | Order consistency                 |
| 77  | should keep default data shape stable across en and zh-TW locales            | Locale stability                  |
| 78  | should persist final state after rapid sequential stale item updates         | Final-write consistency           |

#### 8.1.3 Composables (45 tests)

##### 8.1.3.1 usePackingLists.test.js (45 tests)

| #   | Test                                                                          | What it verifies              |
| --- | ----------------------------------------------------------------------------- | ----------------------------- |
| 1   | should return initial empty state                                             | Default refs are empty        |
| 2   | should have computed properties                                               | Computed refs exist           |
| 3   | should load data from storage on initialize                                   | Init reads from service       |
| 4   | should manage loading state during initialization                             | `isLoading` toggles correctly |
| 5   | should repair missing checklist order and persist it                          | Legacy order repair           |
| 6   | should fallback selected checklist and reload scoped categories/items         | Selection fallback            |
| 7   | should set error and clear state when initialize fails unexpectedly           | Init failure recovery         |
| 8   | should create a new checklist                                                 | Creates and refreshes state   |
| 9   | should select the first checklist after creation                              | Auto-selection logic          |
| 10  | should update an existing checklist                                           | Update + refresh              |
| 11  | should delete a checklist                                                     | Delete + refresh              |
| 12  | should create a category in the selected checklist                            | Category creation             |
| 13  | should return null if no checklist is selected                                | Null guard                    |
| 14  | should create an item in the selected checklist                               | Item creation                 |
| 15  | should toggle item packed status                                              | Toggle + refresh              |
| 16  | should calculate progress correctly                                           | Progress computation          |
| 17  | should return 0 progress for empty checklist                                  | Zero-item edge case           |
| 18  | should handle storage errors gracefully during initialization                 | Error recovery                |
| 19  | should duplicate a checklist and refresh state                                | Checklist duplication         |
| 20  | should duplicate a category and refresh state                                 | Category duplication          |
| 21  | should duplicate an item and refresh state                                    | Item duplication              |
| 22  | should delete a category and refresh both categories and items                | Category delete cascade       |
| 23  | should delete an item and refresh items                                       | Item delete                   |
| 24  | should update multiple checklists and refresh state                           | Batch update                  |
| 25  | should return null when creating item without selected checklist              | Null guard                    |
| 26  | should return null when duplicating item without selected checklist           | Null guard                    |
| 27  | should return null when updating item without selected checklist              | Null guard                    |
| 28  | should return empty array when getting categories without selected checklist  | Null guard                    |
| 29  | should return empty array when getting items without selected checklist       | Null guard                    |
| 30  | should return early when deleting item without selected checklist             | Null guard                    |
| 31  | should return null when duplicateChecklist service call fails                 | Service failure path          |
| 32  | should return null when updateCategory service call fails                     | Service failure path          |
| 33  | should return null when updateCategory throws (real service)                  | Throw fallback                |
| 34  | should refresh categories and return updated category on success              | Success path + refresh        |
| 35  | should return null when updateMultipleChecklists service returns undefined    | Falsy result guard            |
| 36  | should refresh state when storage event updates app data key                  | Cross-tab sync refresh        |
| 37  | should return null when createItem service call fails (with checklist)        | Service failure path          |
| 38  | should return null when duplicateCategory service call fails (with checklist) | Service failure path          |
| 39  | should return null when updateItem service call fails (with checklist)        | Service failure path          |
| 40  | should return null when duplicateItem service call fails (with checklist)     | Service failure path          |
| 41  | should return null when createCategory service call fails (with checklist)    | Service failure path          |
| 42  | should return null when duplicateChecklist service call fails (no checklist)  | Service failure path          |
| 43  | should return null when updateCategory service call fails (no checklist)      | Service failure path          |
| 44  | should return null when updateCategory service returns undefined              | Falsy result guard            |
| 45  | should return null when updateMultipleChecklists returns undefined            | Falsy result guard            |

#### 8.1.4 i18n (5 tests)

##### 8.1.4.1 index.test.js (5 tests)

| #   | Test                                                               | What it verifies             |
| --- | ------------------------------------------------------------------ | ---------------------------- |
| 1   | should use saved locale when it is supported                       | Saved locale restore         |
| 2   | should map zh-HK browser language to zh-TW and persist             | Browser locale normalization |
| 3   | should fallback to en for unsupported browser language             | Unsupported locale fallback  |
| 4   | should persist locale when setLocale receives a supported value    | Locale persistence           |
| 5   | should ignore unsupported setLocale values and keep current locale | Setter guard                 |

#### 8.1.5 Utils (28 tests)

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

##### 8.1.5.3 order.test.js (2 tests)

| #   | Test                                       | What it verifies                     |
| --- | ------------------------------------------ | ------------------------------------ |
| 1   | should renumber order based on array index | Reorder based on array index         |
| 2   | should support custom start offset         | Support insert scenario start offset |

##### 8.1.5.4 positioning.test.js (3 tests)

| #   | Test                                                      | What it verifies               |
| --- | --------------------------------------------------------- | ------------------------------ |
| 1   | should clamp dropdown left within viewport padding        | Left min padding clamp         |
| 2   | should clamp dropdown left to max when near right edge    | Right max boundary clamp       |
| 3   | should position dropdown above anchor with gap and zIndex | Fixed position calc (with gap) |

### 8.2 Component Tests (199 tests)

#### 8.2.1 App.test.js (41 tests)

| #   | Test                                                                    | What it verifies             |
| --- | ----------------------------------------------------------------------- | ---------------------------- |
| 1   | should render the main layout with sidebar and content                  | Main layout rendering        |
| 2   | should show empty state when no checklist is selected                   | Empty state display          |
| 3   | should show ChecklistComponent when a checklist is selected             | Checklist visibility         |
| 4   | should set isMobileViewport to true for narrow screens                  | Mobile viewport detection    |
| 5   | should auto-collapse sidebar on mobile viewport                         | Auto-collapse on mobile      |
| 6   | should auto-expand sidebar on wide desktop when not manually collapsed  | Auto-expand on desktop       |
| 7   | should not auto-expand sidebar when manually collapsed key exists       | Collapse persistence         |
| 8   | should detect small desktop viewport as overlay zone                    | Overlay zone detection       |
| 9   | should toggle sidebar when sidebar emits toggle-sidebar                 | Sidebar toggle event         |
| 10  | should persist sidebar collapse to localStorage on desktop              | Collapse persistence         |
| 11  | should remove collapsed key from localStorage when sidebar re-opened    | Expand cleanup               |
| 12  | should toggle sidebar from Topbar on mobile                             | Topbar toggle event          |
| 13  | should create a new checklist and set newlyCreatedChecklistId           | Checklist creation           |
| 14  | should create checklist from Topbar on mobile                           | Topbar creation event        |
| 15  | should select and mark checklist for editing on handleChecklistEdit     | Edit mode trigger            |
| 16  | should duplicate checklist and select the copy on handleChecklistCopy   | Checklist duplication        |
| 17  | should delete checklist after user confirms the dialog                  | Confirmed deletion           |
| 18  | should not delete checklist when user cancels the dialog                | Cancelled deletion           |
| 19  | should select first remaining checklist after deleting the selected one | Post-delete selection        |
| 20  | should update checklist via ChecklistComponent emit                     | Checklist update             |
| 21  | should call updateMultipleChecklists on handleChecklistMove             | Checklist move               |
| 22  | should update selectedChecklistId from overlay sidebar select-checklist | Overlay sidebar selection    |
| 23  | should update selectedChecklistId from inline sidebar select-checklist  | Inline sidebar selection     |
| 24  | should create item with maxOrder + 1 in the target category             | Item order calculation       |
| 25  | should create item with order 0 in an empty category                    | Empty category item creation |
| 26  | should update item and clear newlyCreatedItemId if matching             | Item update + flag clear     |
| 27  | should call duplicateItem on copy:item emit                             | Item duplication             |
| 28  | should call deleteItem on delete:item emit                              | Item deletion                |
| 29  | should update item categoryId and reordered items on move type          | Cross-category move          |
| 30  | should update all items with new order on reorder type                  | Same-category reorder        |
| 31  | should handle move with empty reorderedItems gracefully                 | Empty reorder boundary       |
| 32  | should create category with correct order                               | Category order calculation   |
| 33  | should update category and clear newlyCreatedCategoryId if matching     | Category update + flag clear |
| 34  | should call duplicateCategory on copy:category emit                     | Category duplication         |
| 35  | should call deleteCategory on delete:category emit                      | Category deletion            |
| 36  | should update each category and call getCategories                      | Category reorder             |
| 37  | should display overlay backdrop when sidebar is open on mobile          | Overlay rendering            |
| 38  | should close sidebar when overlay backdrop is clicked                   | Overlay close                |
| 39  | should set body overflow hidden when overlay is active                  | Body scroll lock             |
| 40  | should call initialize on mount                                         | Lifecycle: mount init        |
| 41  | should clean up resize event listener on unmount                        | Lifecycle: unmount cleanup   |

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
| 8   | should enter edit mode when item name is clicked                          | Click-to-edit            |
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
| 23  | should enter edit mode when newlyCreatedItemId matches                    | Auto-edit on create      |
| 24  | should not enter edit mode when newlyCreatedItemId does not match         | No false trigger         |
| 25  | should not decrement quantity below 1                                     | Minimum quantity guard   |
| 26  | should apply cursor-grabbing when isDragging is true                      | Drag visual state        |

#### 8.2.8 OverflowMenu.test.js (23 tests)

| #   | Test                                                                | What it verifies        |
| --- | ------------------------------------------------------------------- | ----------------------- |
| 1   | should render the menu trigger button                               | Button exists           |
| 2   | should show three-dot icon when not editing                         | Default icon            |
| 3   | should show checkmark icon when isEditing is true                   | Edit-mode icon          |
| 4   | should not show dropdown menu initially                             | Menu starts closed      |
| 5   | should show dropdown menu when trigger button is clicked            | Open on click           |
| 6   | should hide dropdown menu when trigger button is clicked again      | Toggle close            |
| 7   | should emit "edit" when edit option is clicked                      | Edit action             |
| 8   | should emit "copy" when copy option is clicked                      | Copy action             |
| 9   | should emit "delete" when delete option is clicked                  | Delete action           |
| 10  | should close dropdown after an action is performed                  | Auto-close on action    |
| 11  | should emit "confirm-edit" when checkmark is clicked in edit mode   | Confirm edit            |
| 12  | should not open dropdown menu when in edit mode                     | Edit-mode blocks menu   |
| 13  | should close menu when clicking outside the component               | Click-outside handler   |
| 14  | should close menu on window scroll                                  | Scroll handler          |
| 15  | should close menu when focus leaves the component                   | Focus-out handler       |
| 16  | should close when another overflow menu opens                       | Multi-menu coordination |
| 17  | should not close when the same menu dispatches its own open event   | Self-event ignore       |
| 18  | should use size-4 class for item menu type                          | Item icon sizing        |
| 19  | should use size-5 class for category menu type                      | Category icon sizing    |
| 20  | should apply fixed positioning styles to dropdown                   | Position strategy       |
| 21  | should dispatch overflow-menu-open CustomEvent when opened          | CustomEvent dispatch    |
| 22  | should clamp dropdown position within viewport bounds               | Viewport clamping       |
| 23  | should fall back to createEvent when CustomEvent constructor throws | Legacy browser fallback |

#### 8.2.9 Category.test.js (25 tests)

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
| 22  | should forward Item events from child Item component                                | Child event forwarding |
| 23  | should enter edit mode when newlyCreatedCategoryId matches                          | Auto-edit on create    |
| 24  | should not enter edit mode when newlyCreatedCategoryId does not match               | No false trigger       |
| 25  | should not save during IME composition                                              | IME guard              |

#### 8.2.10 Checklist.test.js (36 tests)

| #   | Test                                                          | What it verifies             |
| --- | ------------------------------------------------------------- | ---------------------------- |
| 1   | should display the checklist name                             | Name rendering               |
| 2   | should display the formatted date range                       | Date format                  |
| 3   | should pass correct item counts to ProgressBar                | Progress binding             |
| 4   | should render Category components for each category           | Category rendering           |
| 5   | should show PendingItemsCategory when pending items exist     | Conditional display          |
| 6   | should hide PendingItemsCategory when no pending items        | Conditional hide             |
| 7   | should show input when checklist name is clicked              | Click-to-edit                |
| 8   | should emit "update:checklist" with new name on Enter         | Enter confirms edit          |
| 9   | should cancel edit mode on Escape key                         | Escape cancels               |
| 10  | should emit "copy:checklist" from OverflowMenu                | Copy event forward           |
| 11  | should emit "delete:checklist" from OverflowMenu              | Delete event forward         |
| 12  | should emit "create:category" from AddCategoryButton          | Category creation event      |
| 13  | should forward "update:item" from Category component          | Item update forward          |
| 14  | should forward "copy:category" from Category                  | Category copy forward        |
| 15  | should forward "delete:category" from Category                | Category delete forward      |
| 16  | should display untitled placeholder for empty name            | Untitled fallback            |
| 17  | should adjust end date when start date moves past it          | Date constraint: start > end |
| 18  | should not change end date when start date is still before it | Date constraint: no-op       |
| 19  | should auto-correct end date set earlier than start date      | Date constraint: end < start |
| 20  | should not save on Enter during IME composition               | IME guard                    |
| 21  | should not emit update when name has not changed              | No-op save                   |
| 22  | should use untitled placeholder when saving empty name        | Empty name fallback          |
| 23  | should enter edit mode when OverflowMenu triggers edit        | Edit-mode trigger            |
| 24  | should enter edit mode when newlyCreatedChecklistId matches   | Auto-edit on create          |
| 25  | should forward "copy:item" from Category component            | Item copy forward            |
| 26  | should forward "delete:item" from Category component          | Item delete forward          |
| 27  | should forward "create:item" from Category component          | Item creation forward        |
| 28  | should forward "update:category" from Category component      | Category update forward      |
| 29  | should forward "move:item" from Category component            | Item move forward            |
| 30  | should display single date when start and end dates are equal | Same-date display            |
| 31  | should handle empty dates gracefully                          | No-date display              |
| 32  | should forward "update:item" from PendingItemsCategory        | Pending item update forward  |
| 33  | should set isDraggingCategory on drag start                   | Drag state                   |
| 34  | should clear drag state on category drag end                  | Drag cleanup                 |
| 35  | should emit "reorder:categories" with renumbered order        | Category reorder event       |
| 36  | should save when focus leaves all editing inputs              | Global blur-save             |

#### 8.2.11 Sidebar.test.js (23 tests)

| #   | Test                                                            | What it verifies    |
| --- | --------------------------------------------------------------- | ------------------- |
| 1   | should display checklist names when expanded                    | Name rendering      |
| 2   | should show the new checklist button                            | Button exists       |
| 3   | should display the sidebar title                                | Title rendering     |
| 4   | should render checklist item buttons                            | Button rendering    |
| 5   | should emit "toggle-sidebar" on hamburger click                 | Toggle event        |
| 6   | should emit "create-checklist" on new checklist button click    | Create event        |
| 7   | should emit "select-checklist" with checklist ID on item click  | Select event        |
| 8   | should emit "copy-checklist" from OverflowMenu                  | Copy event          |
| 9   | should emit "delete-checklist" from OverflowMenu                | Delete event        |
| 10  | should emit "edit-checklist" from OverflowMenu                  | Edit event          |
| 11  | should highlight the selected checklist                         | Active style        |
| 12  | should not highlight non-selected checklists                    | Inactive style      |
| 13  | should show first character when collapsed on desktop           | Collapsed display   |
| 14  | should show language dropdown on language button click          | Menu open           |
| 15  | should change locale and close menu when a language is selected | Locale change       |
| 16  | should close language menu when focus leaves                    | Focus-out close     |
| 17  | should close language menu on window scroll                     | Scroll close        |
| 18  | should close language menu on outside click                     | Click-outside close |
| 19  | should set dragging state on drag start                         | Drag state          |
| 20  | should clear dragging state on drag end                         | Drag cleanup        |
| 21  | should display checklists sorted by order property              | Sort order          |
| 22  | should emit "move:checklists" when checklists are reordered     | Reorder event       |
| 23  | should display untitled placeholder for empty checklist name    | Untitled fallback   |

### 8.3 E2E Tests (40 tests)

#### 8.3.1 app-loading.spec.js (5 tests)

| #   | Test                                                     | What it verifies  |
| --- | -------------------------------------------------------- | ----------------- |
| 1   | should load the app with correct title                   | Page title        |
| 2   | should show sidebar on desktop viewport                  | Desktop layout    |
| 3   | should show empty state when no checklists exist         | Empty state       |
| 4   | should show checklist content after creating a checklist | Post-create state |
| 5   | should show topbar on mobile viewport                    | Mobile layout     |

#### 8.3.2 checklist-management.spec.js (5 tests)

| #   | Test                                                     | What it verifies |
| --- | -------------------------------------------------------- | ---------------- |
| 1   | should create a new checklist via sidebar button         | Create flow      |
| 2   | should auto-select and enter edit mode for new checklist | Auto-edit UX     |
| 3   | should rename checklist by clicking on the name          | Rename flow      |
| 4   | should switch between checklists                         | Navigation flow  |
| 5   | should delete checklist after confirmation               | Delete flow      |

#### 8.3.3 category-crud.spec.js (3 tests)

| #   | Test                                                | What it verifies         |
| --- | --------------------------------------------------- | ------------------------ |
| 1   | should delete a category via overflow menu          | Category deletion        |
| 2   | should copy a category via overflow menu            | Category duplication     |
| 3   | should show copy suffix in duplicated category name | Copy suffix localization |

#### 8.3.4 drag-and-drop.spec.js (1 test)

| #   | Test                                                  | What it verifies             |
| --- | ----------------------------------------------------- | ---------------------------- |
| 1   | should reorder checklists in sidebar by drag-and-drop | Sidebar checklist reordering |

#### 8.3.5 item-packing.spec.js (7 tests)

| #   | Test                                                     | What it verifies         |
| --- | -------------------------------------------------------- | ------------------------ |
| 1   | should create a new category via add button              | Category creation        |
| 2   | should create a new item via add button                  | Item creation            |
| 3   | should edit an item name                                 | Item editing             |
| 4   | should toggle item packed status via checkbox            | Checkbox toggle          |
| 5   | should update progress when items are packed             | Progress update          |
| 6   | should show 100% when all items in a category are packed | Full completion          |
| 7   | should persist data after page reload                    | localStorage persistence |

#### 8.3.6 language-switch.spec.js (6 tests)

| #   | Test                                                           | What it verifies              |
| --- | -------------------------------------------------------------- | ----------------------------- |
| 1   | should update sidebar title after switching to zh-TW           | Chinese sidebar title         |
| 2   | should update new checklist button text after language switch  | Chinese button labels         |
| 3   | should update empty state text after language switch           | Chinese empty state           |
| 4   | should show Chinese labels in categories after language switch | Chinese category labels       |
| 5   | should revert all labels to English after switching back       | Language revert               |
| 6   | should persist language selection after page reload            | Language preference persisted |

#### 8.3.7 mobile-workflow.spec.js (9 tests)

| #   | Test                                                   | What it verifies          |
| --- | ------------------------------------------------------ | ------------------------- |
| 1   | should display topbar with hamburger button on mobile  | Mobile topbar             |
| 2   | should open sidebar overlay when hamburger is clicked  | Sidebar overlay open      |
| 3   | should close sidebar when overlay backdrop is tapped   | Backdrop closes           |
| 4   | should create a new checklist via topbar plus button   | Mobile checklist creation |
| 5   | should create a new checklist via sidebar on mobile    | Sidebar creation flow     |
| 6   | should add a new item via add item button              | Mobile item creation      |
| 7   | should edit an item name on mobile                     | Mobile item editing       |
| 8   | should toggle item packed status on mobile             | Mobile packing toggle     |
| 9   | should update progress when items are packed on mobile | Mobile progress update    |

#### 8.3.8 multi-tab-sync.spec.js (4 tests)

| #   | Test                                                                     | What it verifies                   |
| --- | ------------------------------------------------------------------------ | ---------------------------------- |
| 1   | should sync checklist create and rename across tabs                      | Cross-tab storage sync             |
| 2   | should converge to the latest rename when two tabs edit concurrently     | Concurrency convergence            |
| 3   | should converge after rapid alternating cross-tab edits                  | Rapid alternating edit safety      |
| 4   | should converge to deletion when one tab renames and another tab deletes | Rename+delete conflict convergence |
