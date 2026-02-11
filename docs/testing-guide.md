# Packing List App - Testing Guide

## 1. Overview

### Purpose

Ensure application correctness and prevent regressions through a comprehensive automated test suite covering models, services, composables, utilities, Vue components, and end-to-end user flows.

### Scope

Applies to this project's stack: Vue 3 + Vite + Vitest + @vue/test-utils + Playwright.

### Results Summary

| Metric             | Value  |
| ------------------ | ------ |
| Total tests        | 320    |
| Unit tests         | 137    |
| Component tests    | 165    |
| E2E tests          | 18     |
| Line coverage      | 93.72% |
| Statement coverage | 92.23% |
| Branch coverage    | 82.16% |
| Pass rate          | 100%   |

## 2. Test Architecture

### Testing Layers

| Layer     | Tool                     | Tests | Purpose                                            |
| --------- | ------------------------ | ----- | -------------------------------------------------- |
| Unit      | Vitest                   | 137   | Pure logic in models, services, composables, utils |
| Component | Vitest + @vue/test-utils | 165   | Vue component rendering, events, state             |
| E2E       | Playwright               | 18    | Full user flows in a real browser                  |

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
│   └── setup.js                         # Global mocks: localStorage, crypto.randomUUID
│
├── unit-tests/                          # 137 tests
│   ├── models/                          # 33 tests
│   │   ├── Item.test.js                 # 15 tests
│   │   ├── Category.test.js             #  8 tests
│   │   └── Checklist.test.js            # 10 tests
│   ├── services/                        # 51 tests
│   │   ├── localStorageService.test.js  # 35 tests
│   │   └── dataService.test.js          # 16 tests
│   ├── composables/                     # 34 tests
│   │   └── usePackingLists.test.js      # 34 tests
│   └── utils/                           # 19 tests
│       └── helpers.test.js              # 19 tests
│
├── component-tests/                     # 165 tests
│   ├── Checklist.test.js                # 36 tests
│   ├── Sidebar.test.js                  # 26 tests
│   ├── Item.test.js                     # 26 tests
│   ├── Category.test.js                 # 24 tests
│   ├── OverflowMenu.test.js             # 23 tests
│   ├── ProgressBar.test.js              #  9 tests
│   ├── AddItemButton.test.js            #  8 tests
│   ├── Topbar.test.js                   #  5 tests
│   ├── PendingItemsCategory.test.js     #  5 tests
│   └── AddCategoryButton.test.js        #  3 tests
│
└── e2e-tests/                           # 18 tests
    ├── app-loading.spec.js              #  5 tests
    ├── checklist-management.spec.js     #  5 tests
    └── item-packing.spec.js             #  8 tests
```

## 4. Coverage Breakdown

### By Module

| Module       | Statements | Branch | Lines  |
| ------------ | ---------- | ------ | ------ |
| components/  | 93.96%     | 89.40% | 96.15% |
| composables/ | 87.63%     | 78.12% | 90.12% |
| models/      | 93.61%     | 93.02% | 93.61% |
| services/    | 91.79%     | 60.13% | 91.30% |
| utils/       | 94.44%     | 87.50% | 94.11% |

### By Component

| Component                | Statements | Lines  | Tests |
| ------------------------ | ---------- | ------ | ----- |
| AddCategoryButton.vue    | 100%       | 100%   | 3     |
| AddItemButton.vue        | 100%       | 100%   | 8     |
| ProgressBar.vue          | 100%       | 100%   | 9     |
| Topbar.vue               | 100%       | 100%   | 5     |
| PendingItemsCategory.vue | 100%       | 100%   | 5     |
| Sidebar.vue              | 97.46%     | 100%   | 26    |
| OverflowMenu.vue         | 97.43%     | 98.66% | 23    |
| Category.vue             | 92.30%     | 92.94% | 24    |
| Checklist.vue            | 90.90%     | 95.83% | 36    |
| Item.vue                 | 90.66%     | 91.89% | 26    |

### Coverage Metrics Explained

| Metric     | Definition                                   |
| ---------- | -------------------------------------------- |
| Statements | Percentage of executable statements executed |
| Branch     | Percentage of conditional branches taken     |
| Lines      | Percentage of source lines executed          |

Branch coverage is the strictest metric — it requires every `if/else`, `&&/||`, and ternary branch to be exercised. The remaining uncovered branches are primarily:

- `QuotaExceededError` catch blocks (localStorage full)
- Storage event listeners (cross-window communication)
- Defensive null guards in edge cases

These are rare runtime scenarios with high test cost and low bug-catch probability.

### Coverage Targets

| Range   | Rating    | Recommendation      |
| ------- | --------- | ------------------- |
| < 60%   | Poor      | Needs improvement   |
| 60–80%  | Adequate  | Acceptable          |
| 80–95%  | Excellent | Ideal range         |
| 95–100% | Excessive | Diminishing returns |

This project's 92.23% statement coverage is in the excellent range.

## 5. Configuration

### Vitest

File: `vitest.config.js`

```javascript
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/test-setup/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['source/**/*.{js,vue}'],
      exclude: ['**/node_modules/**', '**/tests/**'],
    },
  },
});
```

### Playwright

File: `playwright.config.js`

```javascript
export default defineConfig({
  testDir: './tests/e2e-tests',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
});
```

### Global Test Setup

File: `tests/test-setup/setup.js`

- Mocks `localStorage` (`getItem`, `setItem`, `removeItem`, `clear`) with `vi.fn()`
- Mocks `crypto.randomUUID` for deterministic ID generation

## 6. Running Tests

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

### Coverage Report

```bash
npm run test:coverage
```

Outputs:

- Terminal: text summary table
- HTML report: `coverage/index.html`

### E2E Tests

```bash
npm run test:e2e      # Headless mode
npm run test:e2e:ui   # Interactive UI mode
```

### Specific E2E Tests

```bash
npx playwright test tests/e2e-tests/app-loading.spec.js --headed
```

## 7. Testing Patterns

### Unit Test Pattern

Direct import and test of classes and functions:

```javascript
import { Item } from '@/models/Item';

it('should validate required fields', () => {
  expect(() => new Item({ name: '' })).toThrow();
});
```

### Component Test Pattern

Mount Vue components and assert rendering, events, and state:

```javascript
import { mount } from '@vue/test-utils';
import Item from '@/components/Item.vue';

it('should toggle packed state on checkbox click', async () => {
  const wrapper = mount(Item, { props: { item } });
  await wrapper.find('input[type="checkbox"]').trigger('click');
  expect(wrapper.emitted('update:item')).toBeTruthy();
});
```

### Key Techniques

| Technique             | Purpose                         | Example                                  |
| --------------------- | ------------------------------- | ---------------------------------------- |
| `shallowMount`        | Isolate child components        | Stub Category when testing Checklist     |
| `createI18n` plugin   | Provide i18n context            | Required by Sidebar, Checklist           |
| vuedraggable stub     | Test drag-and-drop logic        | Stub with `emits: ['update:modelValue']` |
| Deferred rAF          | Test DOM after `v-if` toggle    | Push callbacks then flush                |
| Fake timers           | Test `setTimeout`/debounce      | `vi.useFakeTimers()`                     |
| Service prototype spy | Isolate composable from storage | `vi.spyOn(Service.prototype, method)`    |

### E2E Test Pattern

Full user flows against a real dev server:

```javascript
import { test, expect } from '@playwright/test';

test('should create and rename checklist', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('new-checklist-btn').click();
  await page.getByTestId('checklist-name-input').fill('My Trip');
  await expect(page.locator('text=My Trip')).toBeVisible();
});
```

Key practices:

- Use `data-testid` attributes for element selection (decoupled from CSS)
- Each test gets an isolated browser context (automatic localStorage isolation)
- Playwright auto-starts the Vite dev server via `webServer` config

## 8. Complete Test Inventory

### 8.1 Unit Tests — Models (33 tests)

#### Item.test.js (15 tests)

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

#### Category.test.js (8 tests)

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

#### Checklist.test.js (10 tests)

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

### 8.2 Unit Tests — Services (51 tests)

#### dataService.test.js (16 tests)

| #   | Test                                              | What it verifies      |
| --- | ------------------------------------------------- | --------------------- |
| 1   | should throw not implemented for getData          | Abstract method guard |
| 2   | should throw not implemented for createChecklist  | Abstract method guard |
| 3   | should throw not implemented for getChecklists    | Abstract method guard |
| 4   | should throw not implemented for updateChecklist  | Abstract method guard |
| 5   | should throw not implemented for deleteChecklist  | Abstract method guard |
| 6   | should throw not implemented for createCategory   | Abstract method guard |
| 7   | should throw not implemented for getCategories    | Abstract method guard |
| 8   | should throw not implemented for updateCategory   | Abstract method guard |
| 9   | should throw not implemented for deleteCategory   | Abstract method guard |
| 10  | should throw not implemented for createItem       | Abstract method guard |
| 11  | should throw not implemented for getItems         | Abstract method guard |
| 12  | should throw not implemented for updateItem       | Abstract method guard |
| 13  | should throw not implemented for deleteItem       | Abstract method guard |
| 14  | should throw not implemented for getChecklistById | Abstract method guard |
| 15  | should throw not implemented for getCategoryById  | Abstract method guard |
| 16  | should throw not implemented for getItemById      | Abstract method guard |

#### localStorageService.test.js (35 tests)

| #   | Test                                                               | What it verifies            |
| --- | ------------------------------------------------------------------ | --------------------------- |
| 1   | should initialize with empty data when localStorage is empty       | Fresh start state           |
| 2   | should not overwrite data on repeated initialization               | Idempotent init             |
| 3   | should handle corrupted localStorage data gracefully               | Malformed JSON recovery     |
| 4   | should create a new checklist                                      | Create + persist            |
| 5   | should create default categories and items for new checklist       | Seeding from default data   |
| 6   | should get checklist by ID                                         | Single-entity retrieval     |
| 7   | should return null for non-existent checklist                      | Missing entity returns null |
| 8   | should update an existing checklist                                | Mutation + persist          |
| 9   | should throw error when updating non-existent checklist            | Update guard                |
| 10  | should delete a checklist and its associated data                  | Cascade delete              |
| 11  | should create a new category                                       | Create + persist            |
| 12  | should get categories for a checklist                              | Filtered retrieval          |
| 13  | should update a category                                           | Mutation + persist          |
| 14  | should delete a category and its items                             | Cascade delete              |
| 15  | should create a new item                                           | Create + persist            |
| 16  | should update an item                                              | Mutation + persist          |
| 17  | should delete an item                                              | Remove + persist            |
| 18  | should toggle item packed status                                   | Toggle + persist            |
| 19  | should use cache on subsequent getData calls                       | Cache hit                   |
| 20  | should update cache after save operation                           | Cache invalidation          |
| 21  | should duplicate a checklist with all categories and items         | Deep copy with new IDs      |
| 22  | should throw error when duplicating non-existent checklist         | Duplicate guard             |
| 23  | should duplicate a category with all its items                     | Category-level copy         |
| 24  | should throw error when duplicating non-existent category          | Duplicate guard             |
| 25  | should duplicate an item within the same category                  | Single item copy            |
| 26  | should throw error when duplicating non-existent item              | Duplicate guard             |
| 27  | should update multiple checklists at once                          | Batch update                |
| 28  | should return English copy suffix by default                       | Locale-aware suffix         |
| 29  | should return Chinese copy suffix for zh-TW locale                 | zh-TW suffix                |
| 30  | should return fallback copy suffix for unknown locale              | Unknown locale fallback     |
| 31  | should dispose resources and clear cache                           | Cleanup                     |
| 32  | should handle deleting non-existent category gracefully            | No-op delete                |
| 33  | should handle deleting non-existent item gracefully                | No-op delete                |
| 34  | should propagate errors when storage save fails                    | Error propagation           |
| 35  | should truncate duplicate name when original name is at max length | Boundary: name truncation   |

### 8.3 Unit Tests — Composables (34 tests)

#### usePackingLists.test.js (34 tests)

| #   | Test                                                                         | What it verifies              |
| --- | ---------------------------------------------------------------------------- | ----------------------------- |
| 1   | should return initial empty state                                            | Default refs are empty        |
| 2   | should have computed properties                                              | Computed refs exist           |
| 3   | should load data from storage on initialize                                  | Init reads from service       |
| 4   | should manage loading state during initialization                            | `isLoading` toggles correctly |
| 5   | should create a new checklist                                                | Creates and refreshes state   |
| 6   | should select the first checklist after creation                             | Auto-selection logic          |
| 7   | should update an existing checklist                                          | Update + refresh              |
| 8   | should delete a checklist                                                    | Delete + refresh              |
| 9   | should create a category in the selected checklist                           | Category creation             |
| 10  | should return null if no checklist is selected                               | Null guard                    |
| 11  | should create an item in the selected checklist                              | Item creation                 |
| 12  | should toggle item packed status                                             | Toggle + refresh              |
| 13  | should calculate progress correctly                                          | Progress computation          |
| 14  | should return 0 progress for empty checklist                                 | Zero-item edge case           |
| 15  | should handle storage errors gracefully during initialization                | Error recovery                |
| 16  | should duplicate a checklist and refresh state                               | Checklist duplication         |
| 17  | should duplicate a category and refresh state                                | Category duplication          |
| 18  | should duplicate an item and refresh state                                   | Item duplication              |
| 19  | should delete a category and refresh both categories and items               | Category delete cascade       |
| 20  | should delete an item and refresh items                                      | Item delete                   |
| 21  | should update multiple checklists and refresh state                          | Batch update                  |
| 22  | should return null when creating item without selected checklist             | Null guard                    |
| 23  | should return null when duplicating item without selected checklist          | Null guard                    |
| 24  | should return null when updating item without selected checklist             | Null guard                    |
| 25  | should return empty array when getting categories without selected checklist | Null guard                    |
| 26  | should return empty array when getting items without selected checklist      | Null guard                    |
| 27  | should return early when deleting item without selected checklist            | Null guard                    |
| 28  | should return null when createItem service call fails                        | Service failure path          |
| 29  | should return null when duplicateCategory service call fails                 | Service failure path          |
| 30  | should return null when updateItem service call fails                        | Service failure path          |
| 31  | should return null when duplicateItem service call fails                     | Service failure path          |
| 32  | should return null when duplicateChecklist service call fails                | Service failure path          |
| 33  | should return null when createCategory service call fails                    | Service failure path          |
| 34  | should return null when updateCategory service call fails                    | Service failure path          |

### 8.4 Unit Tests — Utils (19 tests)

#### helpers.test.js (19 tests)

| #   | Test                                                          | What it verifies               |
| --- | ------------------------------------------------------------- | ------------------------------ |
| 1   | should generate ID with empty prefix when called without args | Default prefix behavior        |
| 2   | should generate ID with custom prefix                         | Custom prefix prepended        |
| 3   | should generate unique IDs                                    | No collisions                  |
| 4   | should generate IDs of consistent length                      | Stable format                  |
| 5   | should format date string correctly                           | Date → localized string        |
| 6   | should handle null date (returns epoch date)                  | Null input                     |
| 7   | should handle undefined date (returns Invalid Date)           | Undefined input                |
| 8   | should handle empty string (returns Invalid Date)             | Empty string input             |
| 9   | should calculate percentage correctly                         | Normal calculation             |
| 10  | should return 0 when total is 0                               | Division by zero guard         |
| 11  | should handle 100%                                            | Full completion                |
| 12  | should round percentage to nearest integer                    | Rounding behavior              |
| 13  | should clone primitive values                                 | Primitives pass through        |
| 14  | should deep clone objects                                     | Nested objects are independent |
| 15  | should deep clone arrays                                      | Nested arrays are independent  |
| 16  | should not affect original when modifying clone               | Mutation isolation             |
| 17  | should delay function execution                               | Debounce delay works           |
| 18  | should only execute once for rapid calls                      | Debounce dedup                 |
| 19  | should pass arguments to debounced function                   | Args forwarded correctly       |

### 8.5 Component Tests (165 tests)

#### Topbar.test.js (5 tests)

| #   | Test                                                   | What it verifies       |
| --- | ------------------------------------------------------ | ---------------------- |
| 1   | should render a header element                         | Semantic HTML          |
| 2   | should have md:hidden class for mobile-only visibility | Responsive behavior    |
| 3   | should render two action buttons                       | Hamburger + new button |
| 4   | should emit "toggle" when hamburger button is clicked  | Event emission         |
| 5   | should emit "new" when plus button is clicked          | Event emission         |

#### AddCategoryButton.test.js (3 tests)

| #   | Test                                       | What it verifies  |
| --- | ------------------------------------------ | ----------------- |
| 1   | should render a button element             | Renders correctly |
| 2   | should display the new category label      | i18n label text   |
| 3   | should emit "click" when button is clicked | Event emission    |

#### AddItemButton.test.js (8 tests)

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

#### ProgressBar.test.js (9 tests)

| #   | Test                                                                | What it verifies    |
| --- | ------------------------------------------------------------------- | ------------------- |
| 1   | should display progress text as "completed / total"                 | Label format        |
| 2   | should display the correct percentage                               | Percentage text     |
| 3   | should set progress bar fill width based on percentage              | CSS width binding   |
| 4   | should show 0% when total is 0                                      | Zero-item edge case |
| 5   | should show 100% when all items are completed                       | Full completion     |
| 6   | should round percentage to nearest integer                          | Rounding            |
| 7   | should have progressbar role                                        | ARIA role           |
| 8   | should have correct aria-valuenow, aria-valuemin, and aria-valuemax | ARIA values         |
| 9   | should have an aria-label describing progress                       | ARIA label          |

#### PendingItemsCategory.test.js (5 tests)

| #   | Test                                                                          | What it verifies             |
| --- | ----------------------------------------------------------------------------- | ---------------------------- |
| 1   | should display only pending items                                             | Filters `isPending === true` |
| 2   | should not render when there are no pending items                             | Conditional rendering        |
| 3   | should display the pending items count                                        | Count label                  |
| 4   | should show quantity badge when quantity is greater than 1                    | Quantity display             |
| 5   | should emit "update:item" with isPending=false when completion button clicked | Clear pending                |

#### Item.test.js (26 tests)

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

#### OverflowMenu.test.js (23 tests)

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

#### Category.test.js (24 tests)

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
| 22  | should enter edit mode when newlyCreatedCategoryId matches                          | Auto-edit on create    |
| 23  | should not enter edit mode when newlyCreatedCategoryId does not match               | No false trigger       |
| 24  | should not save during IME composition                                              | IME guard              |

#### Checklist.test.js (36 tests)

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
| 35  | should handle category update event                           | Category reorder event       |
| 36  | should save when focus leaves all editing inputs              | Global blur-save             |

#### Sidebar.test.js (26 tests)

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
| 24  | should apply fixed positioning to language dropdown             | Position strategy   |
| 25  | should add event listeners on mount                             | Lifecycle: mount    |
| 26  | should remove event listeners on unmount                        | Lifecycle: unmount  |

### 8.6 E2E Tests (18 tests)

#### app-loading.spec.js (5 tests)

| #   | Test                                                     | What it verifies  |
| --- | -------------------------------------------------------- | ----------------- |
| 1   | should load the app with correct title                   | Page title        |
| 2   | should show sidebar on desktop viewport                  | Desktop layout    |
| 3   | should show empty state when no checklists exist         | Empty state       |
| 4   | should show checklist content after creating a checklist | Post-create state |
| 5   | should show topbar on mobile viewport                    | Mobile layout     |

#### checklist-management.spec.js (5 tests)

| #   | Test                                                     | What it verifies |
| --- | -------------------------------------------------------- | ---------------- |
| 1   | should create a new checklist via sidebar button         | Create flow      |
| 2   | should auto-select and enter edit mode for new checklist | Auto-edit UX     |
| 3   | should rename checklist by clicking on the name          | Rename flow      |
| 4   | should switch between checklists                         | Navigation flow  |
| 5   | should delete checklist after confirmation               | Delete flow      |

#### item-packing.spec.js (8 tests)

| #   | Test                                                     | What it verifies         |
| --- | -------------------------------------------------------- | ------------------------ |
| 1   | should create a new category via add button              | Category creation        |
| 2   | should rename a category by clicking its name            | Category rename          |
| 3   | should create a new item via add button                  | Item creation            |
| 4   | should edit an item name                                 | Item editing             |
| 5   | should toggle item packed status via checkbox            | Checkbox toggle          |
| 6   | should update progress when items are packed             | Progress update          |
| 7   | should show 100% when all items in a category are packed | Full completion          |
| 8   | should persist data after page reload                    | localStorage persistence |

## 9. CI/CD Integration

### GitHub Actions

File: `.github/workflows/test.yml`

```yaml
name: Automated Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

Triggers:

- Every push to any branch
- Every pull request
- Runs the full unit + component + E2E suite

## 10. References

### Testing Frameworks

- [Vitest](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright](https://playwright.dev/)

### Project Files

- `vitest.config.js` — Vitest configuration
- `playwright.config.js` — Playwright configuration
- `tests/test-setup/setup.js` — Global test mocks
- `package.json` — Test script definitions
