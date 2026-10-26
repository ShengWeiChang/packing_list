# Packing List App - Testing Guide

## 1. Overview 概述

### Purpose 目的

透過涵蓋 models、services、composables、utilities、Vue 組件和端到端使用者流程的全面自動化測試套件，確保應用程式正確性並防止功能退化。

### Scope 適用範圍

適用於本專案技術stack：Vue 3 + Vite + Vitest + @vue/test-utils + Playwright。

### 測試成果摘要

| Metric                        | Value  |
| ----------------------------- | ------ |
| Total tests 總測試數          | 582    |
| Unit tests 單元測試           | 251    |
| Component tests 組件測試      | 276    |
| E2E tests E2E 測試            | 55     |
| Line coverage 行覆蓋率        | 95.75% |
| Statement coverage 語句覆蓋率 | 94.74% |
| Branch coverage 分支覆蓋率    | 86.32% |
| Pass rate 測試通過率          | 100%   |

## 2. Test Architecture 測試架構

### Testing Layers 測試層級

| Layer     | Tool                     | Tests | Purpose                                     |
| --------- | ------------------------ | ----- | ------------------------------------------- |
| Unit      | Vitest                   | 251   | models、services、composables、utils 純邏輯 |
| Component | Vitest + @vue/test-utils | 276   | Vue 組件渲染、事件、狀態                    |
| E2E       | Playwright               | 54    | 真實瀏覽器中的完整使用者流程                |

### Toolchain 測試工具鏈

| Package             | Version | Role                      |
| ------------------- | ------- | ------------------------- |
| vitest              | 4.0.18  | 測試執行器和斷言          |
| @vue/test-utils     | 2.4.6   | Vue 組件測試工具          |
| @vitest/coverage-v8 | 4.0.18  | 程式碼覆蓋率（V8 提供者） |
| playwright          | 1.58.2  | 基於瀏覽器的 E2E 測試     |
| jsdom               | 28.0.0  | Vitest 的 DOM 環境        |

## 3. Test File Structure 測試檔案結構

```
tests/
├── test-setup/
│   └── setup.js                         # Global mocks: localStorage, crypto, scrollIntoView
│
├── unit-tests/                          # 251 tests
│   ├── data/                            #  4  tests
│   │   └── recommendedLists.test.js        #  4  tests
│   ├── models/                          # 40  tests
│   │   ├── Item.test.js                 # 17  tests
│   │   ├── Category.test.js             #  9  tests
│   │   └── Checklist.test.js            # 11  tests
│   │   └── Template.test.js             #  3  tests
│   ├── services/                        # 99  tests
│   │   ├── localStorageService.test.js  # 80  tests
│   │   ├── templateService.test.js      # 15  tests
│   │   └── recommendedListService.test.js  #  4  tests
│   ├── composables/                     # 60  tests
│   │   └── usePackingLists.test.js      # 46  tests
│   │   └── useTemplates.test.js         # 14  tests
│   ├── i18n/                            #  9  tests
│   │   └── index.test.js                #  9  tests
│   ├── utils/                           # 36  tests
│       ├── helpers.test.js              # 21  tests
│       ├── positioning.test.js          #  3  tests
│       ├── order.test.js                #  8  tests
│       ├── dragDrop.test.js             #  2  tests
│       └── focusEditingInput.test.js     #  2  tests
│   └── scripts/                         #  3  tests
│       └── verifyFeature.test.js        #  3  tests
│
├── component-tests/                     # 276 tests
│   ├── App.test.js                      # 61  tests
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
└── end2end-tests/                       # 55  tests
    ├── mobile-workflow.spec.js          # 10  tests
    ├── item-packing.spec.js             #  7  tests
    ├── language-switch.spec.js          #  6  tests
    ├── app-loading.spec.js              #  5  tests
    ├── checklist-management.spec.js     #  6  tests
    ├── category-crud.spec.js            #  3  tests
    ├── drag-and-drop.spec.js            #  6  tests
    ├── multi-tab-sync.spec.js           #  4  tests
    ├── template-management.spec.js      #  7  tests
    └── recommended-lists.spec.js           #  1  test
```

### Naming Conventions 命名慣例

- **Unit/Component tests 單元/組件測試** (`.test.js`): 完全匹配 production 檔案名稱
  - `Category.test.js` → 測試 `Category.vue`
  - `usePackingLists.test.js` → 測試 `usePackingLists.js`
- **E2E tests 端到端測試** (`.spec.js`): 使用 kebab-case 描述使用者流程
  - `item-packing.spec.js`, `checklist-management.spec.js`

### Test Comment Conventions 測試註解慣例

每一個測試檔案都以 `Test Group N` 分隔相關測試，並在每個 `it()` 或 `test()` 前以連續的 `Test Case N` 註解標記。每個檔案皆從 1 開始編號，且必須與可執行案例數一致（包括展開後的 parameterized cases）。註解以簡潔的 `Should ...` 說明所測行為。

驗證：本機的 `npm run test:inventory` 會實際執行 Vitest 與 Playwright，再依其 reported test counts 驗證此慣例，並拒絕不符合 Unit → Component → E2E 順序的 inventory sections。`npm run verify:feature` 會讓每個 test runner 僅執行一次、將 JSON reports 寫入 `test-inventory-reports/`，再以 `npm run test:inventory:ci` 稽核這些 reports，不會重跑任一測試套件；GitHub Actions 也呼叫同一個 command。兩種模式一定稽核受 Git 追蹤的英文與中文 guides。測試通過後使用 `npm run test:inventory:sync` 更新生成的 guide totals 與 file-heading counts；它絕不改寫 test comments。

## 4. Coverage Breakdown 覆蓋率明細

### By Module 各模組覆蓋率

| Module       | Statements | Branch | Lines  |
| ------------ | ---------- | ------ | ------ |
| scripts/     | 42.16%     | 42.22% | 41.46% |
| source/      | 97.96%     | 86.07% | 98.87% |
| components/  | 96.49%     | 88.85% | 98.23% |
| composables/ | 95.72%     | 85.43% | 97.87% |
| models/      | 100%       | 100%   | 100%   |
| services/    | 98.84%     | 86.22% | 98.70% |
| utils/       | 98.90%     | 87.69% | 100%   |

### By Component 各組件覆蓋率

| Component                | Statements | Lines  | Tests |
| ------------------------ | ---------- | ------ | ----- |
| App.vue                  | 97.96%     | 98.87% | 61    |
| AppIcon.vue              | 100%       | 100%   | 4     |
| AddCategoryButton.vue    | 100%       | 100%   | 2     |
| AddItemButton.vue        | 100%       | 100%   | 8     |
| ProgressBar.vue          | 100%       | 100%   | 8     |
| Topbar.vue               | 100%       | 100%   | 2     |
| PendingItemsCategory.vue | 100%       | 100%   | 5     |
| Sidebar.vue              | 100%       | 100%   | 33    |
| OverflowMenu.vue         | 95.00%     | 96.10% | 24    |
| Category.vue             | 97.19%     | 97.91% | 30    |
| Checklist.vue            | 93.38%     | 98.40% | 38    |
| Item.vue                 | 92.20%     | 93.33% | 26    |
| NewChecklistDialog.vue   | 97.36%     | 100%   | 12    |
| SaveTemplateDialog.vue   | 97.95%     | 100%   | 10    |
| TemplateEditor.vue       | 98.73%     | 100%   | 13    |

### Coverage Metrics Explained 覆蓋率指標說明

| Metric          | Definition               |
| --------------- | ------------------------ |
| Statements 語句 | 已執行的可執行語句百分比 |
| Branch 分支     | 已執行的條件分支百分比   |
| Lines 行數      | 已執行的原始碼行數百分比 |

Coverage note: Branch 是最嚴格指標；未覆蓋分支主要落在防禦性 guard 與次要條件路徑。

## 5. Running Tests 執行測試

### Unit and Component Tests 單元和組件測試

```bash
npm test              # Watch 模式（開發時使用）
npm run test:run      # 執行一次
```

### Specific Tests 特定測試

```bash
npx vitest run tests/unit-tests/models/Item.test.js
npx vitest run tests/component-tests/
```

### E2E Tests

```bash
npm run test:e2e      # Headless 模式
npm run test:e2e:ui   # 互動式 UI 模式
```

### Specific E2E Tests 特定 E2E 測試

```bash
npx playwright test tests/end2end-tests/app-loading.spec.js --headed
```

### Coverage Report 覆蓋率報告（最後執行）

```bash
npm run test:coverage # Vitest code coverage only: terminal summary + coverage/index.html；聚焦 source line/branch 覆蓋，不含 Playwright E2E 流程覆蓋
```

### Test Inventory Audit 測試清單稽核

```bash
npm run test:inventory      # 執行 Vitest + Playwright 並驗證 comments 與可用的 guides
npm run test:inventory:sync # 通過後同步生成的 guide counts
npm run verify:feature      # 完整功能驗證：validate、coverage、E2E、inventory、build
npm run verify:feature -- --docs # 僅文件驗證；會報告跳過的測試與 build layers
```

## 6. Testing Layers and Responsibilities 測試分層與責任

本專案使用三層測試，平衡回饋速度與可靠性。

| Layer     | Validation goal                                      | Typical scope             | Feedback speed | Why this layer matters                 |
| --------- | ---------------------------------------------------- | ------------------------- | -------------- | -------------------------------------- |
| Unit      | 驗證純邏輯、驗證規則、資料轉換、邊界/錯誤處理        | models、services、utils   | 最快           | 以最低執行成本提早攔截邏輯回歸         |
| Component | 驗證渲染結果、props/emits 契約、組件內互動與狀態轉換 | Vue component boundaries  | 快             | 不需完整瀏覽器即可確認 UI 行為契約     |
| E2E       | 在真實瀏覽器與執行環境驗證完整使用者流程             | cross-feature integration | 最慢           | 可捕捉低層測試難以覆蓋的跨功能整合落差 |

## 7. CI/CD Execution Stages 持續整合執行階段

| Stage               | Trigger              | Test scope                               | Purpose                                          |
| ------------------- | -------------------- | ---------------------------------------- | ------------------------------------------------ |
| Development process | Manual               | 開發者手動決定要跑哪些測試               | 開發過程中快速本機檢查                           |
| Commit              | `git commit`         | Unit + Component                         | push 前先擋掉明顯回歸                            |
| CI on push          | `push` event         | Unit + Component + E2E + inventory audit | 每個測試套件只跑一次，再驗證生成的 test metadata |
| CI on pull request  | `pull_request` event | Unit + Component + E2E + inventory audit | 每個測試套件只跑一次，再驗證可合併性與 metadata  |

## 8. Complete Test Inventory 完整測試案例清單

### 8.1 Unit Tests（251）

#### 8.1.1 Models（40）

##### 8.1.1.1 Item.test.js（17）

| #   | Test                                             | 測試重點                                   |
| --- | ------------------------------------------------ | ------------------------------------------ |
| 1   | should create an item with default values        | 預設值正確（isPacked: false, quantity: 1） |
| 2   | should accept custom values                      | 所有欄位可自訂                             |
| 3   | should generate a unique ID                      | 每個實例 ID 不重複                         |
| 4   | should generate ID with correct prefix           | ID 前綴格式正確                            |
| 5   | should throw error for empty name                | 空名稱驗證                                 |
| 6   | should throw error for name exceeding max length | 超長名稱驗證                               |
| 7   | should accept name at max length                 | 邊界值：最大長度通過                       |
| 8   | should throw error for non-string name           | 非字串型別驗證（number、null、boolean）    |
| 9   | should throw error for quantity less than 1      | 數量最小值驗證                             |
| 10  | should throw error for negative quantity         | 負數驗證                                   |
| 11  | should accept large quantity                     | 大數值有效                                 |
| 12  | should serialize to JSON correctly               | toJSON() 輸出正確                          |
| 13  | should deserialize from JSON correctly           | fromJSON() 還原正確                        |
| 14  | should preserve all properties through roundtrip | 序列化無損                                 |
| 15  | should toggle isPacked from false to true        | togglePacked() 切換                        |
| 16  | should toggle isPacked from true to false        | togglePacked() 切回                        |
| 17  | should throw error for quantity greater than 999 | 邊界：數量上限驗證                         |

##### 8.1.1.2 Category.test.js（9）

| #   | Test                                             | 測試重點       |
| --- | ------------------------------------------------ | -------------- |
| 1   | should create a category with default values     | 預設值         |
| 2   | should accept custom values                      | 自訂欄位       |
| 3   | should generate a unique ID                      | 唯一 ID        |
| 4   | should generate ID with correct prefix           | ID 前綴        |
| 5   | should throw error for name exceeding max length | 超長名稱驗證   |
| 6   | should allow empty name                          | 允許空名稱     |
| 7   | should throw error for non-string name           | 非字串型別驗證 |
| 8   | should serialize to JSON correctly               | toJSON()       |
| 9   | should deserialize from JSON correctly           | fromJSON()     |

##### 8.1.1.3 Checklist.test.js（11）

| #   | Test                                             | 測試重點             |
| --- | ------------------------------------------------ | -------------------- |
| 1   | should create a checklist with default values    | 預設值               |
| 2   | should accept custom values                      | 自訂欄位             |
| 3   | should generate a unique ID                      | 唯一 ID              |
| 4   | should generate ID with correct prefix           | ID 前綴              |
| 5   | should trim whitespace from name                 | 前後空白修剪         |
| 6   | should throw error for name exceeding max length | 超長名稱驗證         |
| 7   | should allow empty name                          | 允許空名稱（未命名） |
| 8   | should throw error for non-string name           | 非字串型別驗證       |
| 9   | should serialize to JSON correctly               | toJSON()             |
| 10  | should deserialize from JSON correctly           | fromJSON()           |
| 11  | should preserve all properties through roundtrip | 序列化無損           |

##### 8.1.1.4 Template.test.js（3）

| #   | Test                                             | 測試重點   |
| --- | ------------------------------------------------ | ---------- |
| 1   | creates a template with generated ID and content | 建構預設值 |
| 2   | trims its name and round-trips snapshot content  | 序列化     |
| 3   | rejects a non-string or too-long name            | 名稱驗證   |

#### 8.1.2 Services（99）

##### 8.1.2.1 localStorageService.test.js（80）

| #   | Test                                                                          | 測試重點                   |
| --- | ----------------------------------------------------------------------------- | -------------------------- |
| 1   | should initialize with empty data when localStorage is empty                  | 空狀態初始化               |
| 2   | should not overwrite data on repeated initialization                          | 冪等初始化                 |
| 3   | should not overwrite when app data key already exists                         | initializeStorage 提前返回 |
| 4   | should handle corrupted localStorage data gracefully                          | 損壞 JSON 容錯             |
| 5   | should normalize data shape when stored JSON has invalid types                | 型別防禦 + 後備預設        |
| 6   | should create a new checklist                                                 | 建立 + 存儲                |
| 7   | should create general recommended list data for a new checklist by default    | 一般推薦清單後備           |
| 8   | should persist supplied seed data when creating a checklist                   | 通用來源資料建立           |
| 9   | should get checklist by ID                                                    | 單一查詢                   |
| 10  | should return null for non-existent checklist                                 | 不存在回傳 null            |
| 11  | should update an existing checklist                                           | 更新 + 存儲                |
| 12  | should throw error when updating non-existent checklist                       | 更新不存在拋錯             |
| 13  | should delete a checklist and its associated data                             | 級聯刪除                   |
| 14  | should create a new category                                                  | 建立分類                   |
| 15  | should get categories for a checklist                                         | 篩選查詢                   |
| 16  | should update a category                                                      | 更新分類                   |
| 17  | should delete a category and its items                                        | 級聯刪除                   |
| 18  | should get a category by ID                                                   | 依 ID 查詢分類             |
| 19  | should return null for non-existent category by ID                            | 不存在回傳 null            |
| 20  | should create a new item                                                      | 建立物品                   |
| 21  | should update an item                                                         | 更新物品                   |
| 22  | should throw error when updating non-existent item in checklist               | 更新不存在拋錯             |
| 23  | should delete an item                                                         | 刪除物品                   |
| 24  | should get item by ID within a checklist                                      | 依 ID 查詢物品             |
| 25  | should return null when item is not found within a checklist                  | 不存在回傳 null            |
| 26  | should toggle item packed status                                              | 切換打包狀態               |
| 27  | should use cache on subsequent getData calls                                  | 快取命中                   |
| 28  | should update cache after save operation                                      | 快取失效                   |
| 29  | should duplicate a checklist with all categories and items                    | 深層複製                   |
| 30  | should reorder other checklists when duplicating in the middle                | 中間插入 + 後續順序遞增    |
| 31  | should throw error when duplicating non-existent checklist                    | 複製不存在拋錯             |
| 32  | should duplicate a category with all its items                                | 分類層級複製               |
| 33  | should throw error when duplicating non-existent category                     | 複製不存在拋錯             |
| 34  | should duplicate an item within the same category                             | 單項複製                   |
| 35  | should throw error when duplicating non-existent item                         | 複製不存在拋錯             |
| 36  | should update multiple checklists at once                                     | 批量更新                   |
| 37  | should return English copy suffix by default                                  | 英文後綴                   |
| 38  | should return Chinese copy suffix for zh-TW locale                            | 中文後綴                   |
| 39  | should return fallback copy suffix for unknown locale                         | 未知語系後備               |
| 40  | should dispose resources and clear cache                                      | 資源清理                   |
| 41  | should handle deleting non-existent category gracefully                       | 刪除不存在無錯             |
| 42  | should handle deleting non-existent item gracefully                           | 刪除不存在無錯             |
| 43  | should propagate errors when storage save fails                               | 錯誤傳播                   |
| 44  | should truncate duplicate name when original name is at max length            | 邊界：名稱截斷             |
| 45  | should invalidate cache when storage event fires with matching key            | 跨分頁快取失效             |
| 46  | should reset \_initialized when storage key is removed in another tab         | 跨分頁移除處理             |
| 47  | should ignore storage events for unrelated keys                               | 事件 key 過濾              |
| 48  | should throw Storage operation failed when setItem throws                     | QuotaExceeded 錯誤路徑     |
| 49  | should throw when updating non-existent category                              | 更新不存在分類拋錯         |
| 50  | should truncate duplicate category name when at max length                    | 分類名稱截斷               |
| 51  | should truncate duplicate item name when at max length                        | 物品名稱截斷               |
| 52  | should read user-locale from localStorage when no locale provided             | 從 storage 讀取語系        |
| 53  | should default to English suffix when no locale in storage                    | 語系後備                   |
| 54  | should handle multiple dispose calls gracefully                               | dispose 冪等               |
| 55  | should store and retrieve emoji in checklist name                             | Unicode emoji 支援         |
| 56  | should store and retrieve CJK characters in category name                     | CJK 字元支援               |
| 57  | should store HTML-like strings as plain text                                  | XSS 安全存儲               |
| 58  | should handle special characters in item names                                | 特殊字元編碼               |
| 59  | should handle gracefully when getItem throws on getData                       | localStorage 停用          |
| 60  | should normalize missing arrays from storage payload                          | 稀疏 payload 後備          |
| 61  | should handle missing checklists array in cache                               | 快取形狀後備               |
| 62  | should handle missing categories array in cache                               | 快取形狀後備               |
| 63  | should handle missing items array in cache                                    | 快取形狀後備               |
| 64  | should allow create operations with sparse cache shape                        | 稀疏快取建立路徑           |
| 65  | should skip checklists that do not exist in storage                           | 批次更新跳過路徑           |
| 66  | should return all categories across all checklists                            | 不帶 filter 的分類查詢     |
| 67  | should use original categoryId for items whose category was not found         | orphan item 後備           |
| 68  | should duplicate checklist when cache categories and items are undefined      | duplicate 後備路徑         |
| 69  | should duplicate category when cache items is undefined                       | duplicate 後備路徑         |
| 70  | should duplicate item when cache data has items but no reorder targets        | duplicate 後備路徑         |
| 71  | should apply last-write-wins semantics for concurrent checklist updates       | 併發一致性                 |
| 72  | should invalidate cache after storage event from another tab                  | 跨分頁快取失效             |
| 73  | should handle high data volume (50+) without losing correctness               | 高資料量正確性             |
| 74  | should cascade delete categories and items when deleting checklist            | 級聯完整性                 |
| 75  | should cascade delete all items in a deleted category                         | 級聯完整性                 |
| 76  | should preserve relative order semantics after duplicate and delete           | 順序一致性                 |
| 77  | should keep general recommended list shape stable across en and zh-TW locales | 語系資料形狀穩定           |
| 78  | should persist final state after rapid sequential stale item updates          | 最終寫入一致性             |
| 79  | should update multiple items atomically with one storage write                | 原子性批次持久化           |
| 80  | should not persist a partial batch when an item does not exist                | 批次失敗完整性             |

##### 8.1.2.2 templateService.test.js（15）

| #   | Test                                                           | 測試重點      |
| --- | -------------------------------------------------------------- | ------------- |
| 1   | creates a storage-safe checklist snapshot                      | template 建立 |
| 2   | applies a template with fresh IDs and reset state              | template 套用 |
| 3   | updates only the template storage key                          | 儲存隔離      |
| 4   | recovers from malformed template storage                       | 壞資料復原    |
| 5   | propagates localStorage write failures                         | 錯誤傳遞      |
| 6   | returns templates in ascending persisted order                 | 讀取排序      |
| 7   | updates and deletes an existing template                       | CRUD 成功路徑 |
| 8   | rejects updates and deletes for missing templates              | CRUD 錯誤路徑 |
| 9   | reorders requested templates and appends unspecified templates | 重排完整性    |
| 10  | snapshots persisted checklist data when UI data is partial     | storage 後備  |
| 11  | recovers from malformed persisted application data             | app data 復原 |
| 12  | rejects applying a missing template                            | 套用錯誤路徑  |
| 13  | appends snapshots after existing templates                     | 快照排序      |
| 14  | reloads external storage after cache invalidation              | Cache refresh |
| 15  | preserves orphan references and applies item defaults          | 防禦性套用    |

##### 8.1.2.3 recommendedListService.test.js（4）

| #   | Test                                                                 | 測試重點               |
| --- | -------------------------------------------------------------------- | ---------------------- |
| 1   | materializes every recommended list with fresh runtime relationships | 有效 ID 與關聯         |
| 2   | isolates repeated applications from each other and the source        | 獨立可變副本           |
| 3   | rejects missing recommended lists                                    | 缺少推薦清單防護       |
| 4   | applies the localized general recommended list                       | 一般推薦清單與語系選擇 |

#### 8.1.3 Composables（60）

##### 8.1.3.1 usePackingLists.test.js（46）

| #   | Test                                                                              | 測試重點                |
| --- | --------------------------------------------------------------------------------- | ----------------------- |
| 1   | should return initial empty state                                                 | 預設空狀態              |
| 2   | should have computed properties                                                   | computed refs 存在      |
| 3   | should load data from storage on initialize                                       | 初始化讀取 service      |
| 4   | should manage loading state during initialization                                 | isLoading 切換          |
| 5   | should repair missing checklist order and restore the saved checklist             | 舊資料修復與已儲存選取  |
| 6   | should fallback selected checklist and reload scoped categories/items             | 側欄頂端回退            |
| 7   | should set error and clear state when initialize fails unexpectedly               | 初始化失敗復原          |
| 8   | should create a new checklist                                                     | 建立 + 刷新             |
| 9   | should select the first checklist after creation                                  | 自動選取                |
| 10  | should update an existing checklist                                               | 更新 + 刷新             |
| 11  | should delete a checklist                                                         | 刪除 + 刷新             |
| 12  | should return null when createChecklist service call fails                        | Service 失敗路徑        |
| 13  | should return null when updateChecklist service call fails                        | Service 失敗路徑        |
| 14  | should create a category in the selected checklist                                | 建立分類                |
| 15  | should return null if no checklist is selected                                    | 空選取檢查              |
| 16  | should create an item in the selected checklist                                   | 建立物品                |
| 17  | should toggle item packed status                                                  | 切換 + 刷新；不建立復原 |
| 18  | should calculate progress correctly                                               | 進度計算                |
| 19  | should return 0 progress for empty checklist                                      | 零物品邊界              |
| 20  | should handle storage errors gracefully during initialization                     | 錯誤容錯                |
| 21  | should duplicate a checklist and refresh state                                    | 複製清單                |
| 22  | should duplicate a category and refresh state                                     | 複製分類                |
| 23  | should duplicate an item and refresh state                                        | 複製物品                |
| 24  | should delete a category and refresh both categories and items                    | 分類級聯刪除            |
| 25  | should delete an item and refresh items                                           | 物品刪除                |
| 26  | should update multiple checklists and refresh state                               | 批量更新                |
| 27  | should return null when creating item without selected checklist                  | 空選取檢查              |
| 28  | should return null when duplicating item without selected checklist               | 空選取檢查              |
| 29  | should return null when updating item without selected checklist                  | 空選取檢查              |
| 30  | should return empty array when getting categories without selected checklist      | 空選取檢查              |
| 31  | should return empty array when getting items without selected checklist           | 空選取檢查              |
| 32  | should return early when deleting item without selected checklist                 | 空選取檢查              |
| 33  | should return null when createItem service call fails (with checklist)            | Service 失敗路徑        |
| 34  | should return null when duplicateCategory service call fails (with checklist)     | Service 失敗路徑        |
| 35  | should return null when updateItem service call fails (with checklist)            | Service 失敗路徑        |
| 36  | should return null when duplicateItem service call fails (with checklist)         | Service 失敗路徑        |
| 37  | should return null when createCategory service call fails (with checklist)        | Service 失敗路徑        |
| 38  | should return null when duplicateChecklist service call fails (no checklist)      | Service 失敗路徑        |
| 39  | should return null when updateCategory service call fails (no checklist)          | Service 失敗路徑        |
| 40  | should return null when updateCategory service returns undefined                  | falsy 結果防禦          |
| 41  | should return null when updateMultipleChecklists service returns undefined        | falsy 結果防禦          |
| 42  | should return null when updateCategory throws (real service)                      | throw → null 後備       |
| 43  | should refresh categories and return updated category on success                  | 成功路徑 + refresh      |
| 44  | should preserve valid selection and recover deleted selection on app data refresh | 跨分頁選取復原          |
| 45  | should treat a category pack-all as one undoable action and restore mixed state   | 群組歷史與重做安全      |
| 46  | should clear packing history when switching checklists                            | 歷史範圍隔離            |

##### 8.1.3.2 useTemplates.test.js（14）

| #   | Test                                       | 測試重點       |
| --- | ------------------------------------------ | -------------- |
| 1   | should load template state                 | 初始載入       |
| 2   | should expose a load error                 | 錯誤狀態       |
| 3   | should save a template and refresh state   | 儲存 + refresh |
| 4   | should expose an apply error               | 套用失敗       |
| 5   | should rename a template and refresh state | 更新 + refresh |
| 6   | should expose a delete error               | 刪除失敗       |
| 7   | should delete a template and refresh state | 刪除 + refresh |
| 8   | should expose a save error                 | 儲存失敗       |
| 9   | should reject renaming a missing template  | 缺少項目 guard |
| 10  | should expose a rename error               | 重命名失敗     |
| 11  | should return applied template data        | 套用成功       |
| 12  | should update a template and refresh state | 更新 + refresh |
| 13  | should expose an update error              | 更新失敗       |
| 14  | should expose its service instance         | Service 存取   |

#### 8.1.4 i18n（9）

##### 8.1.4.1 index.test.js（9）

| #   | Test                                                                 | 測試重點          |
| --- | -------------------------------------------------------------------- | ----------------- |
| 1   | should use saved locale when it is supported                         | 儲存語系還原      |
| 2   | should map zh-HK browser language to zh-TW and persist               | 瀏覽器語系正規化  |
| 3   | should fallback to en for unsupported browser language               | 不支援語系後備    |
| 4   | should ignore invalid saved locale and detect from browser           | 無效儲存語系防禦  |
| 5   | should use navigator.language when navigator.languages is empty      | 空 languages 後備 |
| 6   | should map bare "zh" browser language to zh-TW                       | 裸 zh 對應        |
| 7   | should persist locale when setLocale receives a supported value      | 語系持久化        |
| 8   | should ignore unsupported setLocale values and keep current locale   | setter 防禦       |
| 9   | should keep English and Traditional Chinese translation keys aligned | 翻譯 key 一致性   |

#### 8.1.5 Utils（36）

##### 8.1.5.1 helpers.test.js（21）

| #   | Test                                                               | 測試重點              |
| --- | ------------------------------------------------------------------ | --------------------- |
| 1   | should generate ID with empty prefix when called without args      | 預設前綴              |
| 2   | should generate ID with custom prefix                              | 自訂前綴              |
| 3   | should generate unique IDs                                         | 無碰撞                |
| 4   | should generate IDs of consistent length                           | 固定格式              |
| 5   | should format date string correctly                                | 日期格式化            |
| 6   | should handle null date                                            | null 輸入             |
| 7   | should handle undefined date                                       | undefined 輸入        |
| 8   | should handle empty string                                         | 空字串輸入            |
| 9   | should calculate percentage correctly                              | 一般計算              |
| 10  | should return 0 when total is 0                                    | 除零檢查              |
| 11  | should handle 100%                                                 | 完全完成              |
| 12  | should round percentage to nearest integer                         | 四捨五入              |
| 13  | should clone primitive values                                      | 基本型別              |
| 14  | should deep clone objects                                          | 深層物件              |
| 15  | should deep clone arrays                                           | 深層陣列              |
| 16  | should not affect original when modifying clone                    | 隔離驗證              |
| 17  | should delay function execution                                    | debounce 延遲         |
| 18  | should only execute once for rapid calls                           | debounce 去重         |
| 19  | should pass arguments to debounced function                        | 參數轉發              |
| 20  | should fallback to Date.now/Math.random when crypto is unavailable | generateSecureId 後備 |
| 21  | should fallback when crypto.randomUUID throws                      | generateSecureId 後備 |

##### 8.1.5.2 dragDrop.test.js（2）

| #   | Test                                                  | 測試重點                    |
| --- | ----------------------------------------------------- | --------------------------- |
| 1   | should allow drops only from the specified group name | vuedraggable put guard 正確 |
| 2   | should return false when from group is missing        | DnD 異常輸入的防禦行為      |

##### 8.1.5.3 order.test.js（8）

| #   | Test                                                                     | 測試重點                |
| --- | ------------------------------------------------------------------------ | ----------------------- |
| 1   | should renumber order based on array index                               | 依陣列順序重編 order    |
| 2   | should support custom start offset                                       | 支援插入情境的起始偏移  |
| 3   | should return empty array for null or undefined input                    | null/undefined 輸入後備 |
| 4   | should reorder visible entries without moving hidden slots               | 保留已打包物品槽位      |
| 5   | should keep complete order when visible entries do not match             | 無效可見集合後備        |
| 6   | should insert at a visible position in the complete order                | 可見索引映射完整順序    |
| 7   | should append at the complete end when dropped after all visible entries | 可見末端插入            |
| 8   | should append when every target entry is hidden                          | 全隱藏目標插入          |

##### 8.1.5.4 positioning.test.js（3）

| #   | Test                                                      | 測試重點               |
| --- | --------------------------------------------------------- | ---------------------- |
| 1   | should clamp dropdown left within viewport padding        | 左側最小 padding 夾取  |
| 2   | should clamp dropdown left to max when near right edge    | 右側最大邊界 夾取      |
| 3   | should position dropdown above anchor with gap and zIndex | 固定定位計算（含 gap） |

##### 8.1.5.5 focusEditingInput.test.js（2）

| #   | Test                                                                                  | 測試重點             |
| --- | ------------------------------------------------------------------------------------- | -------------------- |
| 1   | should focus without scrolling, select the name, and keep a visible input in place    | 穩定聚焦與全選       |
| 2   | should use nearest non-animated scrolling only when the input is outside the viewport | 條件式 viewport 捲動 |

#### 8.1.6 Data（4）

##### 8.1.6.1 recommendedLists.test.js（4）

| #   | Test                                                                         | 測試重點         |
| --- | ---------------------------------------------------------------------------- | ---------------- |
| 1   | resolves complete localized recommended lists with valid category references | 在地化資料完整性 |
| 2   | includes core clothing in every recommended list                             | 基本衣物涵蓋     |
| 3   | falls back to English for unsupported locales                                | 語系後備         |
| 4   | returns isolated resolved data                                               | 解析結果隔離     |

#### 8.1.7 Scripts（3）

##### 8.1.7.1 verifyFeature.test.js（3）

| #   | Test                                                         | 測試重點                 |
| --- | ------------------------------------------------------------ | ------------------------ |
| 1   | should summarize Playwright failures without ANSI formatting | 精簡、去重的失敗診斷摘要 |
| 2   | should report missing individual errors                      | reporter 後備訊息        |
| 3   | should summarize top-level Playwright runner failures        | 測試前 runner 診斷       |

### 8.2 Component Tests（276）

#### 8.2.1 App.test.js（61）

| #   | Test                                                                    | 測試重點               |
| --- | ----------------------------------------------------------------------- | ---------------------- |
| 1   | should render the main layout with sidebar and content                  | 主佈局渲染             |
| 2   | should show empty state when no checklist is selected                   | 空狀態顯示             |
| 3   | should show ChecklistComponent when a checklist is selected             | 清單可見性             |
| 4   | should set isMobileViewport to true for narrow screens                  | 行動版視窗偵測         |
| 5   | should auto-collapse sidebar on mobile viewport                         | 行動版自動收合         |
| 6   | should auto-expand sidebar on wide desktop when not manually collapsed  | 桌面版自動展開         |
| 7   | should not auto-expand sidebar when manually collapsed key exists       | 收合持久化             |
| 8   | should detect small desktop viewport as overlay zone                    | 覆蓋區域偵測           |
| 9   | should toggle sidebar when sidebar emits toggle-sidebar                 | 側邊欄切換事件         |
| 10  | should persist sidebar collapse to localStorage on desktop              | 收合持久化             |
| 11  | should remove collapsed key from localStorage when sidebar re-opened    | 展開清除               |
| 12  | should toggle sidebar from Topbar on mobile                             | Topbar 切換事件        |
| 13  | should open source selection from Sidebar without creating immediately  | 側邊欄來源 dialog      |
| 14  | should open source selection from Topbar on mobile                      | Topbar 來源 dialog     |
| 15  | should select and mark checklist for editing on handleChecklistEdit     | 編輯模式觸發           |
| 16  | should duplicate checklist and select the copy on handleChecklistCopy   | 清單複製               |
| 17  | should delete checklist after user confirms the dialog                  | 確認刪除               |
| 18  | should not delete checklist when user cancels the dialog                | 取消刪除               |
| 19  | should delegate selected checklist deletion to the composable           | 刪除委派               |
| 20  | should update checklist via ChecklistComponent emit                     | 清單更新               |
| 21  | should call updateMultipleChecklists on handleChecklistMove             | 清單移動               |
| 22  | should update selectedChecklistId from overlay sidebar select-checklist | overlay 側欄選取同步   |
| 23  | should update selectedChecklistId from inline sidebar select-checklist  | inline 側欄選取同步    |
| 24  | should create item with maxOrder + 1 in the target category             | 物品建立順序           |
| 25  | should create item with order 0 in an empty category                    | 空分類物品             |
| 26  | should update item and clear newlyCreatedItemId if matching             | 物品更新 + 旗標清除    |
| 27  | should call duplicateItem on copy:item emit                             | 物品複製               |
| 28  | should call deleteItem on delete:item emit                              | 物品刪除               |
| 29  | should update item categoryId and reordered items on move type          | 跨分類移動             |
| 30  | should update all items with new order on reorder type                  | 同分類重排             |
| 31  | should handle move with empty reorderedItems gracefully                 | 空重排邊界             |
| 32  | should create category with correct order                               | 分類建立順序           |
| 33  | should update category and clear newlyCreatedCategoryId if matching     | 分類更新 + 旗標清除    |
| 34  | should call duplicateCategory on copy:category emit                     | 分類複製               |
| 35  | should call deleteCategory on delete:category emit                      | 分類刪除               |
| 36  | should update each category and call getCategories                      | 分類重排               |
| 37  | should display overlay backdrop when sidebar is open on mobile          | 覆蓋層渲染             |
| 38  | should close sidebar when overlay backdrop is clicked                   | 覆蓋層關閉             |
| 39  | should set body overflow hidden when overlay is active                  | Body 捲動鎖定          |
| 40  | should set body overflow hidden when sidebar opens on small desktop     | 小型桌面捲動鎖定       |
| 41  | should call initialize on mount                                         | 生命週期：掛載初始化   |
| 42  | should clean up resize event listener on unmount                        | 生命週期：卸載清理     |
| 43  | should open an isolated editor without creating a checklist             | Template editor 隔離   |
| 44  | should save only through the templates composable                       | Template 儲存路由      |
| 45  | should open the named template dialog and save its selected checklist   | 命名 template 儲存流程 |
| 46  | should create a checklist from a selected personal template             | Template 套用流程      |
| 47  | should delete the active template and leave the editor                  | Template 刪除流程      |
| 48  | should create an explicitly empty checklist                             | 空白來源流程           |
| 49  | should stop creation when applying a template fails                     | 套用失敗 guard         |
| 50  | should ignore requests to edit a missing template                       | 缺少 template guard    |
| 51  | should keep the editor open when saving fails                           | 儲存失敗狀態           |
| 52  | should discard a template draft when canceled                           | 草稿取消               |
| 53  | should preserve a template when deletion is canceled                    | 刪除取消               |
| 54  | should close both template dialogs without operations                   | Dialog 取消            |
| 55  | should leave state unchanged when empty creation fails                  | 空白建立失敗           |
| 56  | should keep the editor open when template deletion fails                | 刪除失敗狀態           |
| 57  | should use an empty initial name for an unknown checklist               | 缺少 checklist 後備    |
| 58  | should ignore duplicate save events after source state clears           | 重複儲存 guard         |
| 59  | should create a checklist from a selected recommended list              | 推薦清單流程           |
| 60  | should apply a category packing change and offer one-click undo         | 批次打包復原操作       |
| 61  | should use Ctrl+Z for packing undo but preserve input-native undo       | 鍵盤快捷鍵隔離         |

#### 8.2.2 Topbar.test.js（2）

| #   | Test                                    | 測試重點 |
| --- | --------------------------------------- | -------- |
| 1   | should emit "toggle" on hamburger click | 事件發送 |
| 2   | should emit "new" on plus button click  | 事件發送 |

#### 8.2.3 AddCategoryButton.test.js（2）

| #   | Test                                  | 測試重點  |
| --- | ------------------------------------- | --------- |
| 1   | should display the new category label | i18n 標籤 |
| 2   | should emit "click" when clicked      | 事件發送  |

#### 8.2.4 AddItemButton.test.js（8）

| #   | Test                                                | 測試重點  |
| --- | --------------------------------------------------- | --------- |
| 1   | should render the add item button with label        | 渲染正確  |
| 2   | should apply success background when completed      | 完成樣式  |
| 3   | should apply default background when not completed  | 預設樣式  |
| 4   | should emit "click" when clicked                    | 事件發送  |
| 5   | should apply primary text color on mouseenter       | hover-in  |
| 6   | should revert to secondary text color on mouseleave | hover-out |
| 7   | should apply primary text color on focus            | focus     |
| 8   | should revert to secondary text color on blur       | blur      |

#### 8.2.5 ProgressBar.test.js（8）

| #   | Test                                                | 測試重點     |
| --- | --------------------------------------------------- | ------------ |
| 1   | should display progress text as "completed / total" | 標籤格式     |
| 2   | should display the correct percentage               | 百分比       |
| 3   | should set progress bar fill width                  | CSS 寬度綁定 |
| 4   | should show 0% when total is 0                      | 零物品邊界   |
| 5   | should show 100% when all completed                 | 完全完成     |
| 6   | should round percentage                             | 四捨五入     |
| 7   | should have correct aria-valuenow/min/max           | ARIA 值      |
| 8   | should have an aria-label                           | ARIA 標籤    |

#### 8.2.6 PendingItemsCategory.test.js（5）

| #   | Test                                                         | 測試重點       |
| --- | ------------------------------------------------------------ | -------------- |
| 1   | should display only pending items                            | 篩選 isPending |
| 2   | should not render when no pending items                      | 條件渲染       |
| 3   | should display the pending items count                       | 計數標籤       |
| 4   | should show quantity badge when quantity > 1                 | 數量顯示       |
| 5   | should emit "update:item" with isPending=false on completion | 清除 pending   |

#### 8.2.7 Item.test.js（26）

| #   | Test                                                   | 測試重點            |
| --- | ------------------------------------------------------ | ------------------- |
| 1   | should display the item name                           | 名稱渲染            |
| 2   | should render a checkbox input                         | checkbox 存在       |
| 3   | should check checkbox when packed                      | checked 綁定        |
| 4   | should apply line-through when packed                  | 打包樣式            |
| 5   | should display quantity value                          | 數量標籤            |
| 6   | should emit toggled isPacked on checkbox click         | checkbox 切換事件   |
| 7   | should clear isPending when packed                     | 打包清除 pending    |
| 8   | should enter edit mode on name click                   | 編輯時聚焦全選      |
| 9   | should save on Enter                                   | Enter 確認          |
| 10  | should cancel on Escape                                | Escape 取消         |
| 11  | should emit incremented quantity                       | 數量 +1             |
| 12  | should emit decremented quantity                       | 數量 -1             |
| 13  | should emit delete when quantity=1 and delete clicked  | 刪除（數量1）       |
| 14  | should emit toggled isPending                          | 切換 pending        |
| 15  | should clear isPacked when marked pending              | pending 清除 packed |
| 16  | should emit copy:item from OverflowMenu                | 複製轉發            |
| 17  | should emit update on blur with changed name           | blur 儲存           |
| 18  | should not emit on blur with empty name                | 空名稱檢查          |
| 19  | should emit delete from OverflowMenu                   | 刪除轉發            |
| 20  | should show action buttons on mouseenter               | hover 顯示          |
| 21  | should hide action buttons on mouseleave               | hover 隱藏          |
| 22  | should not save during IME composition                 | IME 檢查            |
| 23  | should enter edit mode when newlyCreatedItemId matches | 新建自動聚焦全選    |
| 24  | should not enter edit mode when ID doesn't match       | 無誤觸發            |
| 25  | should not decrement quantity below 1                  | 最小數量檢查        |
| 26  | should apply cursor-grabbing when isDragging           | 拖曳視覺狀態        |

#### 8.2.8 OverflowMenu.test.js（24）

| #   | Test                                                              | 測試重點                  |
| --- | ----------------------------------------------------------------- | ------------------------- |
| 1   | should render a spacious transparent menu trigger when configured | Trigger 表面 + frame 變體 |
| 2   | should show three-dot icon when not editing                       | 預設圖示                  |
| 3   | should show checkmark icon when isEditing                         | 編輯圖示                  |
| 4   | should not show dropdown initially                                | 選單預設關閉              |
| 5   | should show dropdown on click                                     | 點擊開啟                  |
| 6   | should hide dropdown on second click                              | 切換關閉                  |
| 7   | should emit "edit" on edit click                                  | 編輯動作                  |
| 8   | should emit "copy" on copy click                                  | 複製動作                  |
| 9   | should emit "delete" on delete click                              | 刪除動作                  |
| 10  | should close dropdown after action                                | 動作後關閉                |
| 11  | should emit "confirm-edit" on checkmark click                     | 確認編輯                  |
| 12  | should not open dropdown in edit mode                             | 編輯模式阻擋              |
| 13  | should close on outside click                                     | 外部點擊關閉              |
| 14  | should close on window scroll                                     | 捲動關閉                  |
| 15  | should close when focus leaves                                    | 焦點離開關閉              |
| 16  | should close when another menu opens                              | 多選單協調                |
| 17  | should not close on own open event                                | 自身事件忽略              |
| 18  | should use inline size for item menu                              | Item 圖示尺寸             |
| 19  | should use control size for category menu                         | Category 圖示尺寸         |
| 20  | should use an explicit trigger size when supplied                 | 明確圖示尺寸              |
| 21  | should apply fixed positioning                                    | 定位策略                  |
| 22  | should dispatch CustomEvent when opened                           | CustomEvent 發送          |
| 23  | should clamp position within viewport                             | 視窗邊界限制              |
| 24  | should fall back to createEvent                                   | 舊瀏覽器相容              |

#### 8.2.9 Category.test.js（30）

| #   | Test                                                                                | 測試重點       |
| --- | ----------------------------------------------------------------------------------- | -------------- |
| 1   | should display the category name                                                    | 名稱渲染       |
| 2   | should pass correct item counts to ProgressBar                                      | 進度資料綁定   |
| 3   | should filter items by categoryId                                                   | 物品篩選       |
| 4   | should not apply completed styling when some items are unpacked                     | 未完成樣式     |
| 5   | should apply completed styling when all items are packed                            | 完成樣式       |
| 6   | should start with items visible (not collapsed)                                     | 預設展開       |
| 7   | should collapse items when toggle button is clicked                                 | 收合切換       |
| 8   | should show input when category name is clicked                                     | 點擊編輯       |
| 9   | should emit "update:category" with new name on Enter                                | Enter 確認     |
| 10  | should cancel edit mode on Escape key                                               | Escape 取消    |
| 11  | should emit "create:item" when AddItemButton triggers click                         | 新增物品事件   |
| 12  | should emit "delete:category" when delete is triggered                              | 刪除事件       |
| 13  | should emit "copy:category" when copy is triggered                                  | 複製事件       |
| 14  | should emit "update:category" on blur with changed name                             | blur 儲存      |
| 15  | should not emit "update:category" on blur when name is unchanged                    | 無變更不發送   |
| 16  | should not emit "update:category" when name is empty                                | 空名稱檢查     |
| 17  | should not emit "update:category" when name is whitespace only                      | 空白檢查       |
| 18  | should set dragging item ID on drag start                                           | 拖曳開始       |
| 19  | should clear dragging item ID on drag end                                           | 拖曳結束       |
| 20  | should emit "move:item" with type "move" when item is added from another category   | 跨分類移動     |
| 21  | should emit "move:item" with type "reorder" when item is moved within same category | 同分類排序     |
| 22  | should preserve packed slots when reordering filtered items                         | 篩選槽位重排   |
| 23  | should insert before the next visible target item while filtered                    | 篩選跨分類移動 |
| 24  | should display only unpacked items while retaining full category progress           | 篩選顯示       |
| 25  | should forward Item events from child Item component                                | 子元件事件轉送 |
| 26  | should enter edit mode when newlyCreatedCategoryId matches                          | 新建自動編輯   |
| 27  | should not enter edit mode when newlyCreatedCategoryId does not match               | 無誤觸發       |
| 28  | should not save during IME composition                                              | IME 檢查       |
| 29  | should expose a mixed category checkbox and request packing all items               | 三態批次意圖   |
| 30  | should expose checked, unchecked, and disabled category checkbox states             | 狀態渲染       |

#### 8.2.10 Checklist.test.js（38）

| #   | Test                                                                        | 測試重點             |
| --- | --------------------------------------------------------------------------- | -------------------- |
| 1   | should display the checklist name                                           | 名稱渲染             |
| 2   | should display the formatted date range                                     | 同年度日期格式       |
| 3   | should pass correct item counts to ProgressBar                              | 進度綁定             |
| 4   | should render Category components                                           | 分類渲染             |
| 5   | should show PendingItemsCategory when pending items exist                   | 條件顯示             |
| 6   | should hide PendingItemsCategory when no pending items                      | 條件隱藏             |
| 7   | should hide dates and checklist overflow for template editing               | Template editor 顯示 |
| 8   | should toggle unpacked-only display without hiding categories               | 篩選狀態與分類保留   |
| 9   | should show input on name click                                             | 點擊編輯             |
| 10  | should emit update on Enter                                                 | Enter 確認           |
| 11  | should cancel on Escape                                                     | Escape 取消          |
| 12  | should emit copy:checklist from OverflowMenu                                | 複製轉發             |
| 13  | should emit delete:checklist from OverflowMenu                              | 刪除轉發             |
| 14  | should emit create:category from AddCategoryButton                          | 新增分類事件         |
| 15  | should forward update:item from Category                                    | 物品更新轉發         |
| 16  | should forward copy:category from Category                                  | 分類複製轉發         |
| 17  | should forward delete:category from Category                                | 分類刪除轉發         |
| 18  | should display untitled placeholder for empty name                          | 未命名顯示           |
| 19  | should adjust end date when start date moves past it                        | 日期約束             |
| 20  | should not change end date when start before it                             | 日期無變更           |
| 21  | should auto-correct end date earlier than start                             | 日期自動修正         |
| 22  | should not save on Enter during IME                                         | IME 檢查             |
| 23  | should not emit when name unchanged                                         | 無變更檢查           |
| 24  | should use untitled placeholder when saving empty name                      | 空名稱後備           |
| 25  | should enter edit mode from OverflowMenu                                    | 編輯模式觸發         |
| 26  | should enter edit mode when newlyCreatedChecklistId matches                 | 新建自動編輯         |
| 27  | should forward copy:item from Category component                            | 物品複製轉發         |
| 28  | should forward delete:item from Category component                          | 物品刪除轉發         |
| 29  | should forward create:item from Category component                          | 物品新增轉發         |
| 30  | should forward update:category from Category component                      | 分類更新轉發         |
| 31  | should forward move:item from Category component                            | 物品移動轉發         |
| 32  | should format single-date and cross-year ranges                             | 單日／跨年顯示       |
| 33  | should handle empty dates gracefully                                        | 無日期顯示           |
| 34  | should forward update:item from PendingItemsCategory                        | pending 更新轉發     |
| 35  | should set isDraggingCategory on drag start                                 | 拖曳狀態             |
| 36  | should clear drag state on drag end                                         | 拖曳清理             |
| 37  | should emit "reorder:categories" with renumbered order when v-model changes | 分類重排事件         |
| 38  | should save when focus leaves all editing inputs                            | 全域 blur 儲存       |

#### 8.2.11 Sidebar.test.js（33）

| #   | Test                                                        | 測試重點      |
| --- | ----------------------------------------------------------- | ------------- |
| 1   | should display checklist names when expanded                | 名稱渲染      |
| 2   | should show the new checklist button                        | 按鈕存在      |
| 3   | should display the sidebar title                            | 標題渲染      |
| 4   | should render checklist item buttons                        | 按鈕渲染      |
| 5   | should emit toggle-sidebar on hamburger click               | 切換事件      |
| 6   | should emit create-checklist on new button click            | 新增事件      |
| 7   | should emit select-checklist with ID on item click          | 選取事件      |
| 8   | should emit copy-checklist from OverflowMenu                | 複製事件      |
| 9   | should emit delete-checklist from OverflowMenu              | 刪除事件      |
| 10  | should emit edit-checklist from OverflowMenu                | 編輯事件      |
| 11  | should highlight the selected checklist                     | 選中樣式      |
| 12  | should not highlight non-selected checklists                | 未選樣式      |
| 13  | should show first character when collapsed                  | 收合顯示      |
| 14  | should show language dropdown on button click               | 語言選單開啟  |
| 15  | should change locale and close menu                         | 語言切換      |
| 16  | should close language menu when focus leaves                | 焦點離開關閉  |
| 17  | should close language menu on scroll                        | 捲動關閉      |
| 18  | should close language menu on outside click                 | 外部點擊關閉  |
| 19  | should set dragging state on drag start                     | 拖曳開始      |
| 20  | should clear dragging state on drag end                     | 拖曳結束      |
| 21  | should display checklists sorted by order                   | 排序顯示      |
| 22  | should emit "move:checklists" when checklists are reordered | 重排事件      |
| 23  | should display untitled placeholder                         | 未命名顯示    |
| 24  | should apply positioning styles when language menu opens    | 下拉選單定位  |
| 25  | should clean up document and window listeners on unmount    | 生命週期清理  |
| 26  | should use matching language and template dropdown layouts  | 選單版面一致  |
| 27  | should close the template menu after an outside click       | 外部點擊關閉  |
| 28  | should emit edit-template when a template is selected       | Template 選擇 |
| 29  | should hide template overflow menus on narrow screens       | 窄版排版      |
| 30  | should sort templates and highlight the active template     | 排序與選取    |
| 31  | should display an empty template state                      | 空狀態        |
| 32  | should close the template menu with Escape                  | 鍵盤關閉      |
| 33  | should forward save-as-template from checklist overflow     | 事件轉送      |

#### 8.2.12 NewChecklistDialog.test.js（12）

| #   | Test                                                                           | 測試重點           |
| --- | ------------------------------------------------------------------------------ | ------------------ |
| 1   | emits the selected empty source                                                | 空白來源選取       |
| 2   | selects a personal template from its source list                               | 個人 template 選取 |
| 3   | selects a recommended list from its source list                                | 推薦清單選取       |
| 4   | keeps all sources visible and only disables personal templates when none exist | 來源可用狀態       |
| 5   | restores focus to the personal-template source after Back                      | 個人清單焦點返回   |
| 6   | restores focus to the recommended-list source after Back                       | 推薦清單焦點返回   |
| 7   | closes the dialog when Escape is pressed                                       | 鍵盤關閉           |
| 8   | closes from the backdrop and Cancel button                                     | 指標操作關閉       |
| 9   | focuses the first source and restores prior focus after closing                | 焦點生命週期       |
| 10  | traps forward and reverse Tab navigation inside the dialog                     | 鍵盤焦點圈限       |
| 11  | resets the nested source step whenever the dialog reopens                      | Dialog 狀態重設    |
| 12  | ignores keyboard dismissal while hidden and unrelated keys while visible       | 鍵盤防護           |

#### 8.2.13 TemplateEditor.test.js（13）

| #   | Test                                                          | 測試重點           |
| --- | ------------------------------------------------------------- | ------------------ |
| 1   | configures Checklist without dates or overflow menu           | editor 渲染        |
| 2   | emits a storage-safe edited template snapshot                 | 儲存 payload       |
| 3   | emits delete without saving the draft                         | 刪除操作           |
| 4   | discards the draft when cancel is selected                    | 取消操作           |
| 5   | creates draft items and categories without persisting them    | 僅草稿建立         |
| 6   | copies and deletes categories with their draft items          | 分類草稿生命週期   |
| 7   | updates, copies, moves and deletes draft items in memory      | 物品草稿生命週期   |
| 8   | resets the in-memory draft when the selected template changes | 切換 template 重設 |
| 9   | finishes auto-edit state after updating new entries           | 自動編輯清理       |
| 10  | applies same-category item reorder payloads                   | 物品重排           |
| 11  | ignores copy requests for missing draft entries               | 缺少項目 guard     |
| 12  | moves an item without optional reordered items                | 選用移動 payload   |
| 13  | assigns zero order to the first category and item             | 空草稿排序         |

#### 8.2.14 SaveTemplateDialog.test.js（10）

| #   | Test                                            | 測試重點        |
| --- | ----------------------------------------------- | --------------- |
| 1   | renders an accessible dialog with its name      | Dialog 語意     |
| 2   | focuses the template name input                 | 初始焦點        |
| 3   | emits a trimmed template name                   | 有效送出        |
| 4   | rejects an empty template name                  | 必填名稱驗證    |
| 5   | closes with Escape                              | 鍵盤關閉        |
| 6   | closes from the backdrop and Cancel button      | 指標操作關閉    |
| 7   | resets validation and name whenever it reopens  | Dialog 狀態重設 |
| 8   | restores focus to the previously active element | 焦點還原        |
| 9   | traps forward and reverse Tab navigation        | 鍵盤焦點圈限    |
| 10  | ignores keyboard handling while hidden          | 隱藏狀態 guard  |

#### 8.2.15 AppIcon.test.js（4）

| #   | Test                                                                               | 測試重點              |
| --- | ---------------------------------------------------------------------------------- | --------------------- |
| 1   | renders the mapped template-library icon at the navigation size                    | 語意映射與尺寸 slot   |
| 2   | renders a labelled non-decorative icon without hiding it from assistive technology | 可存取圖示契約        |
| 3   | keeps an unlabelled non-decorative icon hidden from assistive technology           | 空 label 可存取性防護 |
| 4   | uses the compact size token for dense controls                                     | 緊密控制項尺寸 slot   |

### 8.3 E2E Tests（54）

#### 8.3.1 app-loading.spec.js（5）

| #   | Test                                             | 測試重點   |
| --- | ------------------------------------------------ | ---------- |
| 1   | should load the app with correct title           | 頁面標題   |
| 2   | should show sidebar on desktop viewport          | 桌面版佈局 |
| 3   | should show empty state when no checklists exist | 空狀態     |
| 4   | should show checklist content after creating     | 建立後顯示 |
| 5   | should show topbar on mobile viewport            | 行動版佈局 |

#### 8.3.2 checklist-management.spec.js（6）

| #   | Test                                                                                    | 測試重點        |
| --- | --------------------------------------------------------------------------------------- | --------------- |
| 1   | should create a new checklist via sidebar button                                        | 建立流程        |
| 2   | should auto-select and enter edit mode                                                  | 自動編輯 UX     |
| 3   | should rename checklist by clicking on the name                                         | 重命名流程      |
| 4   | should switch between checklists                                                        | 導航流程        |
| 5   | should delete checklist after confirmation                                              | 刪除流程        |
| 6   | should restore the last opened checklist and fallback to sidebar top after invalidation | 重載恢復 + 回退 |

#### 8.3.3 category-crud.spec.js（3）

| #   | Test                                                | 測試重點 |
| --- | --------------------------------------------------- | -------- |
| 1   | should delete a category via overflow menu          | 分類刪除 |
| 2   | should copy a category via overflow menu            | 分類複製 |
| 3   | should show copy suffix in duplicated category name | 複製後綴 |

#### 8.3.4 drag-and-drop.spec.js（6）

| #   | Test                                                                | 測試重點               |
| --- | ------------------------------------------------------------------- | ---------------------- |
| 1   | should reorder checklists in sidebar by drag-and-drop               | Sidebar 清單拖放重排序 |
| 2   | should reorder categories by drag-and-drop                          | 分類卡片拖放重排序     |
| 3   | should reorder items within a category by drag-and-drop             | 分類內物品拖放重排序   |
| 4   | should preserve packed item slots when filtered items are reordered | 篩選物品重排           |
| 5   | should persist a filtered move into a partially visible category    | 篩選跨分類插入         |
| 6   | should persist a filtered move into an all-hidden category          | 空目標追加與持久化     |

#### 8.3.5 item-packing.spec.js（7）

| #   | Test                                          | 測試重點            |
| --- | --------------------------------------------- | ------------------- |
| 1   | should create a new category via add button   | 分類建立            |
| 2   | should create a new item via add button       | 立即聚焦輸入        |
| 3   | should edit an item name                      | 穩定無跳動編輯      |
| 4   | should toggle item packed status via checkbox | checkbox 切換       |
| 5   | should update progress when items are packed  | 進度更新            |
| 6   | should show 100% when all items packed        | 完全完成            |
| 7   | should persist data after page reload         | localStorage 持久化 |

#### 8.3.6 language-switch.spec.js（6）

| #   | Test                                                           | 測試重點     |
| --- | -------------------------------------------------------------- | ------------ |
| 1   | should update sidebar title after switching to zh-TW           | 中文側邊欄   |
| 2   | should update new checklist button text after language switch  | 中文按鈕標籤 |
| 3   | should update empty state text after language switch           | 中文空狀態   |
| 4   | should show Chinese labels in categories after language switch | 中文分類標籤 |
| 5   | should revert all labels to English after switching back       | 語言復原     |
| 6   | should persist language selection after page reload            | 語言持久化   |

#### 8.3.7 mobile-workflow.spec.js（10）

| #   | Test                                                                | 測試重點         |
| --- | ------------------------------------------------------------------- | ---------------- |
| 1   | should display topbar with hamburger button on mobile               | 行動版頂欄       |
| 2   | should open sidebar overlay when hamburger is clicked               | 側邊欄開啟       |
| 3   | should close sidebar when overlay backdrop is tapped                | 背景關閉         |
| 4   | should create a new checklist via topbar plus button                | 行動版建立       |
| 5   | should create a new checklist via sidebar on mobile                 | 側邊欄建立       |
| 6   | should add a new item via add item button                           | 行動版立即輸入   |
| 7   | should edit an item name on mobile                                  | 行動版編輯物品   |
| 8   | should toggle item packed status on mobile                          | 行動版打包切換   |
| 9   | should update progress when items are packed on mobile              | 行動版進度       |
| 10  | should filter packed items with an accessible icon button on mobile | 可存取行動版篩選 |

#### 8.3.8 multi-tab-sync.spec.js（4）

| #   | Test                                                                     | 測試重點                     |
| --- | ------------------------------------------------------------------------ | ---------------------------- |
| 1   | should sync checklist create and rename across tabs                      | 跨頁籤同步（storage event）  |
| 2   | should converge to the latest rename when two tabs edit concurrently     | 併發編輯一致性               |
| 3   | should converge after rapid alternating cross-tab edits                  | 快速交替編輯一致性           |
| 4   | should converge to deletion when one tab renames and another tab deletes | rename+delete 衝突收斂一致性 |

#### 8.3.9 template-management.spec.js（7）

| #   | Test                                                                  | 測試重點              |
| --- | --------------------------------------------------------------------- | --------------------- |
| 1   | closes the templates menu after an outside click                      | 點擊外部後關閉        |
| 2   | distinguishes Back from canceling checklist creation                  | Dialog 步驟語意       |
| 3   | edits a template without creating a checklist                         | 獨立 template 編輯    |
| 4   | deletes the active template from the editor                           | template 刪除         |
| 5   | keeps narrow template rows free of overflow menus                     | 窄版響應式排版        |
| 6   | saves a checklist as a named template without changing checklist data | 快照隔離              |
| 7   | creates an isolated checklist from a selected template                | 新 ID 與 storage 隔離 |

#### 8.3.10 recommended-lists.spec.js（1）

| #   | Test                                                          | 測試重點               |
| --- | ------------------------------------------------------------- | ---------------------- |
| 1   | should create and persist a checklist from a recommended list | 來源識別名稱與重新載入 |
