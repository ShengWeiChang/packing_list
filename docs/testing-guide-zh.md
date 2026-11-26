# Packing List App - Testing Guide

## 1. Overview 概述

### Purpose 目的

透過涵蓋 models、services、composables、utilities、Vue 組件和端到端使用者流程的全面自動化測試套件，確保應用程式正確性並防止功能退化。

### Scope 適用範圍

適用於本專案技術stack：Vue 3 + Vite + Vitest + @vue/test-utils + Playwright。

### 測試成果摘要

| Metric                        | Value  |
| ----------------------------- | ------ |
| Total tests 總測試數          | 929    |
| Unit tests 單元測試           | 348    |
| Component tests 組件測試      | 338    |
| E2E tests E2E 測試            | 243    |
| Line coverage 行覆蓋率        | 87.75% |
| Statement coverage 語句覆蓋率 | 85.82% |
| Branch coverage 分支覆蓋率    | 76.27% |
| Pass rate 測試通過率          | 100%   |

## 2. Test Architecture 測試架構

### Testing Layers 測試層級

| Layer     | Tool                           | Tests | Purpose                                     |
| --------- | ------------------------------ | ----- | ------------------------------------------- |
| Unit      | Vitest                         | 348   | models、services、composables、utils 純邏輯 |
| Component | Vitest + @vue/test-utils       | 338   | Vue 組件渲染、事件、狀態                    |
| E2E       | Playwright + Chromium / WebKit | 243   | 在瀏覽器中檢查完整使用者流程                |

### Platform Verification Matrix 平台驗證矩陣

| 在哪裡跑              | Unit／Component                                       | E2E                                                               | 怎麼跑                                                                                                   |
| --------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 本機 macOS            | 可在本機跑全部 348 個 Unit 和 338 個 Component 測試。 | 可跑全部 243 次瀏覽器執行，也可只選重點案例。                     | `npm run verify:feature` 在 Mac 跑完整功能 gate；開發時可用 Vitest 或 Playwright 指令跑重點檢查。        |
| 本機 Linux container  | 全部 348 個 Unit 和 338 個 Component 測試。           | 全部 243 次瀏覽器執行。                                           | 使用 Docker 執行 `sh scripts/ci-container.sh full`，包含功能 gate 與另外執行的 Node 容器／報告契約測試。 |
| GitHub Linux CI       | Node 容器／報告契約測試。                             | Chromium 的 6 個共用核心 smoke 案例。                             | 每個 PR 以 Docker 執行 `sh scripts/ci-container.sh smoke`。                                              |
| GitHub Windows runner | 全部 348 個 Unit 和 338 個 Component 測試。           | 全部 243 次瀏覽器執行。                                           | Windows 2025 job 在每個 PR 執行 `npm run verify:feature`。                                               |
| GitHub macOS runner   | 全部 348 個 Unit 和 338 個 Component 測試。           | 全部 243 次瀏覽器執行。                                           | macOS job 在每個 PR 執行 `npm run verify:feature`。                                                      |
| Android 與 iOS 裝置   | 不適用。                                              | 沒有手機實機測試；Chromium 與 WebKit 模擬手機畫面及部分觸控操作。 | 瀏覽器模擬不提供手機作業系統。                                                                           |

PR 的 `macos-full` 和 `windows-full` 執行完整 gate；`linux-smoke` 執行六個共用核心案例。各完整 gate 分別上傳執行時已產生的測試報告、失敗附件、checkout 資訊及 Playwright 瀏覽器版本。Linux smoke 不包含編輯中拖曳另一物品的回歸案例；要在 Linux 檢查此情境，可使用下方 focused 或 full container 指令。獨立的 failure-artifact probe 只在 workflow、Docker、測試腳本、依賴清單、patch 或 Playwright 設定變更時執行。路徑篩選維護於 `.github/workflows/failure-artifact-probe.yml`；該 workflow 存在於預設分支後也可手動執行。probe 檢查受控失敗與附件上傳，不測試產品行為。變更平台 check 名稱時，先確認新 check 能執行，再同步更新 GitHub required status checks；不要將路徑篩選的 probe 設為全域 required。

Linux smoke 以固定清單及執行報告拒絕漏收、多收、skip、flaky 或 runner error。`node scripts/windowsSmoke.js` 可在本機執行相同六個案例，結果屬執行時的作業系統。每個平台 job 將已產生的 checkout 資訊與診斷檔上傳至獨立 artifact。

243 次 E2E 執行包含 Chromium 的 233 次、Playwright WebKit 核心案例（`webkit-core`）6 次，以及 Playwright WebKit 響應式案例（`webkit-rwd`）4 次。同一原始案例在多個 project 執行時，每次執行分別計數。Chromium 執行一般 E2E 基準，包含相同的四個響應式案例；WebKit 額外執行選定的核心與響應式檢查，並非完整 Chromium 套件。Playwright Chromium 和 WebKit 並非 Google Chrome 或原生 Safari。

六個核心案例涵蓋物品建立、編輯、數量、待處理及打包狀態、重載與刪除；兩種視窗寬度的日期編輯；儲存失敗與草稿恢復；鍵盤選單焦點；以及滑鼠排序後重載。五個選自既有案例，另一個串接原先缺少完整重載證據的物品生命週期。四個響應式案例涵蓋觸控模擬操作、短畫面 dialog 與日期、平板版面及短畫面手機導覽。

Unit 與 Component 測試在 Vitest 的 Node／jsdom 環境執行，並非實際瀏覽器或作業系統介面。完整功能 gate 另檢查格式、lint、生成色彩、TypeScript、清冊與 production build。Node 容器／報告契約測試由 Linux container 入口另外執行，不計入 862 個測試總數。總數與平台次數描述目前的測試清冊。

### Toolchain 測試工具鏈

| Package             | Version | Role                      |
| ------------------- | ------- | ------------------------- |
| vitest              | 4.1.12  | 測試執行器和斷言          |
| @vue/test-utils     | 2.4.6   | Vue 組件測試工具          |
| @vitest/coverage-v8 | 4.1.12  | 程式碼覆蓋率（V8 提供者） |
| playwright          | 1.58.2  | 基於瀏覽器的 E2E 測試     |
| jsdom               | 28.0.0  | Vitest 的 DOM 環境        |
| typescript          | 6.0.3   | 靜態 compiler 契約        |
| vue-tsc             | 3.3.13  | TS 與 Vue 模板檢查        |

### Compile-Only Type Contracts 僅編譯的型別契約

`npm run typecheck` 是獨立的靜態 gate，不是第四個 runtime 測試層。它先檢查 source／compiler 範圍，再檢查應用與 `tests/type-tests/` 契約。Vitest 排除此目錄；compile-only assertions 與預期錯誤診斷 probes 不計入 runtime 總數或 runtime coverage。

初始 infrastructure suite 證明數值 ref 推導、null narrowing、indexed-access 安全性與真實 SFC props／emits。兩個隔離 probe 要求刻意無效的 TS 及 Vue template fixture 只產生 TS2322；無關的缺少模組、設定錯誤、crash 或意外成功都會使 probe 失敗。Domain／storage suite 檢查實際 model 正規化、舊資料 unknown 欄位、可攜 snapshot、seed source、mutation baseline、nullable 查詢、lock 結果、JSON clone、debounce 參數與純資料排序與欄位覆寫。

Composable compile-only suites 檢查可寫選取、唯讀集合與巢狀 snapshot、nullable 實體／操作結果、async callbacks、drag baseline／field keys，以及不可變的 packing history。

真實元件的 compile-only suite 檢查 nullable async action、baseline 第二參數、source-specific selection 與 semantic icons。額外的 Vue template fixture 檢查錯誤 props／callback，以及 typed drag slot 的錯誤欄位／方法；IsAny assertions 證明 model、slot、change element 與 forwarding baseline 未被 any 繞過。

Gate 要求全部應用模組與 Vue scripts 為 TypeScript，並核對 compiler roots；新增 JS、非 TS Vue script、allowJs 或漏列 source 都會失敗。`skipLibCheck: true` 是已接受的 Vue／i18n 宣告相容性例外，詳見 Code Quality Guide。

## 3. Test File Structure 測試檔案結構

```
tests/
├── test-setup/
│   └── setup.js                         # Global mocks: localStorage, crypto, scrollIntoView
│
├── type-tests/                          # Compile-only; excluded from runtime counts
│   ├── componentContracts.test.ts    # 真實元件 props／emits、async action 與 drag slot 契約
│   ├── contracts.test.ts               # Domain／storage、snapshot、callback 契約
│   ├── usePackingLists.test.ts        # Reactive state／操作／history 契約
│   ├── useTemplates.test.ts           # 範本 state／snapshot／callback 契約
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
    ├── touchDragHelpers.js              # 長按微動與原生捲動手勢
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

各 E2E 檔案數量統計瀏覽器 project 執行次數；`Test Case` 註解編號代表不同原始案例，共用案例在原始檔只編一次，此處則每個 project 列一次。

### Naming Conventions 命名慣例

- **Unit/Component tests 單元/組件測試** (`.test.js`): 完全匹配 production 檔案名稱
  - `Category.test.js` → 測試 `Category.vue`
  - `usePackingLists.test.js` → 測試 `usePackingLists.ts`
- **E2E tests 端到端測試** (`.spec.js`): 使用 kebab-case 描述使用者流程
  - `item-packing.spec.js`, `checklist-management.spec.js`

### Test Comment Conventions 測試註解慣例

每一個測試檔案都以 `Test Group N` 分隔相關測試，並在每個 `it()` 或 `test()` 前以連續的 `Test Case N` 註解標記。每個檔案皆從 1 開始編號，且必須與可執行案例數一致（包括展開後的 parameterized cases）。註解以簡潔的 `Should ...` 說明所測行為。

驗證：本機的 `npm run test:inventory` 會實際執行 Vitest 與 Playwright，再依其 reported test counts 驗證此慣例，並拒絕不符合 Unit → Component → E2E 順序的 inventory sections。`npm run verify:feature` 會讓每個 test runner 僅執行一次、將 JSON reports 寫入 `test-inventory-reports/`，再以 `npm run test:inventory:ci` 稽核這些 reports，不會重跑任一測試套件；GitHub Actions 也呼叫同一個 command。兩種模式會將已執行案例識別與測試工具重新列出的清單比對，並拒絕 skipped、todo、flaky、漏收、重複或不完整的報告。兩種模式一定稽核受 Git 追蹤的英文與中文 guides。測試通過後使用 `npm run test:inventory:sync` 更新生成的 guide totals 與 file-heading counts；它絕不改寫 test comments。

## 4. Coverage Breakdown 覆蓋率明細

### By Module 各模組覆蓋率

| Module       | Statements | Branch | Lines  |
| ------------ | ---------- | ------ | ------ |
| scripts/     | 83.16%     | 73.33% | 82.59% |
| source/      | 75.57%     | 65.51% | 79.32% |
| components/  | 81.2%      | 73.48% | 83.97% |
| composables/ | 96.29%     | 88.56% | 97.28% |
| models/      | 100%       | 100%   | 100%   |
| services/    | 95.04%     | 84.98% | 95.41% |
| utils/       | 96.96%     | 87.4%  | 96.62% |

### By Component 各組件覆蓋率

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

### Coverage Metrics Explained 覆蓋率指標說明

| Metric          | Definition               |
| --------------- | ------------------------ |
| Statements 語句 | 已執行的可執行語句百分比 |
| Branch 分支     | 已執行的條件分支百分比   |
| Lines 行數      | 已執行的原始碼行數百分比 |

Coverage note: Branch 是最嚴格指標；未覆蓋分支主要落在防禦性 guard 與次要條件路徑。容器與報告 contract tests 由 Node 另外執行，不包含在這些 Vitest coverage 數字內。

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

### Linux Container Tests Linux 容器測試

啟動 Docker 後，`sh scripts/ci-container.sh smoke` 執行六個共用核心案例，`sh scripts/ci-container.sh focused` 執行選定的高風險案例，`sh scripts/ci-container.sh full` 執行完整功能 gate。使用 `sh scripts/ci-container.sh case <Playwright arguments>` 執行個別案例。每次執行會在獨立暫存 volume 安裝 Linux 依賴，並把報告寫入新的 `.container-test-artifacts/` 目錄；不共用 Mac 的 `node_modules`。首次下載 image 與每次安裝依賴都需要時間和磁碟空間。本機 ARM64 容器與 CI amd64 runner 使用同一份 image 定義，但不是完全相同的機器。升級時依變動一併維護 `.nvmrc`、`docker/Dockerfile` 固定的 image digest、`scripts/ci-container.sh` 與 `docker/test-entrypoint.sh` 對應的 image／架構 digest 紀錄、entrypoint 的版本檢查，以及 Playwright lockfile。重新執行 Linux smoke 及 macOS／Windows 完整 gate，並驗證兩種 image 架構及實際 PR jobs。變更固定 runner 版本時重新評估；image 標籤不會凍結所有已安裝更新。

### Coverage Report 覆蓋率報告（最後執行）

```bash
npm run test:coverage # Vitest code coverage only: terminal summary + coverage/index.html；聚焦 source line/branch 覆蓋，不含 Playwright E2E 流程覆蓋
```

### Test Inventory Audit 測試清單稽核

```bash
npm run test:inventory      # 執行 Vitest + Playwright 並驗證 comments 與可用的 guides
npm run test:inventory:sync # 通過後同步生成的 guide counts
npm run check:css-vars      # 不修改 CSS，檢查生成的主題色彩
npm run typecheck           # Source 範圍、應用型別、compile-only contracts、診斷 probes
npm run verify:feature      # 完整功能驗證：validate、typecheck、coverage、E2E、inventory、build
npm run verify:feature -- --docs # 僅文件驗證；會報告跳過的測試與 build layers
```

## 6. Testing Layers and Responsibilities 測試分層與責任

本專案使用三層測試，平衡回饋速度與可靠性。

| Layer     | Validation goal                                      | Typical scope             | Feedback speed | Why this layer matters                 |
| --------- | ---------------------------------------------------- | ------------------------- | -------------- | -------------------------------------- |
| Unit      | 驗證純邏輯、驗證規則、資料轉換、邊界/錯誤處理        | models、services、utils   | 最快           | 以最低執行成本提早攔截邏輯回歸         |
| Component | 驗證渲染結果、props/emits 契約、組件內互動與狀態轉換 | Vue component boundaries  | 快             | 不需完整瀏覽器即可確認 UI 行為契約     |
| E2E       | 在真實瀏覽器與執行環境驗證完整使用者流程             | cross-feature integration | 最慢           | 可捕捉低層測試難以覆蓋的跨功能整合落差 |

### Responsive Interaction Evidence 響應式互動證據

`rwd-phone.spec.js` 明確設定 touch context，驗證 phone／tablet 操作、真實命中區、名稱幾何、一次一件展開、reload 與長按排序，並包含桌面滑鼠回歸。`rwd-overlays.spec.js` 涵蓋抽屜焦點、巢狀 dialog、短畫面、原生日期與模擬鍵盤幾何／錯誤恢復。`rwd-webkit.spec.js` 在 Chromium 和 `webkit-rwd` 使用相同觸控模擬設定執行；`webkit-core` 另外執行選定的桌面核心案例。CI 安裝兩個引擎。Emulation 及合成 viewport／IME 事件不證明原生鍵盤或實機舒適度；實機結果另行記錄。

`drag-settlement.spec.js` 涵蓋各版面側欄待儲存順序、儲存失敗、七種接收／排序路徑在佔位移動後的 `touchcancel`，以及正常觸控放手。取消手勢使用 Chromium CDP 模擬，不證明實體 iOS／Safari 的中斷行為。`typedDraggable.test.js` 驗證真實 vuedraggable 的 model／change 邊界。`drag-membership-conflict.spec.js` 以兩個真實頁面驗證過期成員拒絕與重載；service／composable cases 涵蓋完整成員、隱藏列與相容欄位編輯。

#### Responsive Manual Acceptance 響應式人工驗收

- 使用隔離的測試清單，記錄 build 或 commit、日期、裝置、系統、瀏覽器、方向、輸入方式、步驟、預期與實際結果，以及 pass／fail／not run。需要時保留截圖或錄影；未測的裝置維持 not run。
- 桌面滑鼠與鍵盤：檢查直接改名、hover 操作及其消失、Tab 與 Escape、靠近視窗邊緣的選單、抽屜／dialog 焦點順序、長名稱與 200% 縮放。
- 手機觸控：不提示操作方式，找出三點；展開後調整數量與待買、切換物品、點外及捲動。數量為 1 時確認減量使用既有刪除流程。操作區開啟時編輯，再執行其他操作並確認名稱已儲存；重新整理檢查資料持久化。
- 原生鍵盤：在底部新增物品、編輯長名稱、使用 IME 與候選字選擇、收起並重開鍵盤、旋轉及手動捲動。檢查可見性、舒適間距、草稿保留及非預期捲動。
- 平板與手機浮層：檢查直向、橫向、平板分割畫面、空間足夠時的多欄、觸控入口可見性、跨分類拖曳、側欄轉場及減少動態效果。有外接鍵盤或滑鼠時檢查焦點與 Escape。請初次使用者在不提示下找數量、待買與改名，將觀察作為可用性線索。
- 平板側欄回歸：有清單時反覆開合側欄，留意清單捲動區底部附近是否短暫出現水平捲動條或黑線。先前觸控模擬曾出現水平溢出，但回報黑線的確切來源尚未在實機直接證實。

## 7. CI/CD Execution Stages 持續整合執行階段

| Stage               | Trigger              | Test scope                                           | Purpose                                                  |
| ------------------- | -------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Development process | Manual               | 開發者手動決定要跑哪些測試                           | 開發過程中快速本機檢查                                   |
| Commit              | `git commit`         | Unit + Component                                     | push 前先擋掉明顯回歸                                    |
| CI on push          | `push` to `main`     | Typecheck + Unit + Component + E2E + inventory audit | 拒絕型別錯誤，再執行一次各 runtime suite 並稽核 metadata |
| CI on pull request  | `pull_request` event | Typecheck + Unit + Component + E2E + inventory audit | 拒絕型別錯誤，再驗證 runtime 行為與 metadata             |

## 8. Complete Test Inventory 完整測試案例清單

### 8.1 Unit Tests（348）

#### 8.1.1 Models（40）

##### 8.1.1.1 Item.test.js（17）

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

#### 8.1.2 Services（133）

##### 8.1.2.1 localStorageService.test.js（87）

| #   | Test                                                                                    | 測試重點                       |
| --- | --------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | should initialize with empty data when localStorage is empty                            | 空狀態初始化                   |
| 2   | should not overwrite data on repeated initialization                                    | 冪等初始化                     |
| 3   | should not overwrite when app data key already exists                                   | initializeStorage 提前返回     |
| 4   | should preserve corrupted localStorage data and report an error                         | 損壞資料保留                   |
| 5   | should reject invalid collection types without replacing stored data                    | 無效資料保留                   |
| 6   | should create a new checklist                                                           | 建立 + 存儲                    |
| 7   | should create general recommended list data for a new checklist by default              | 一般推薦清單後備               |
| 8   | should persist supplied seed data when creating a checklist                             | 通用來源資料建立               |
| 9   | should get checklist by ID                                                              | 單一查詢                       |
| 10  | should return null for non-existent checklist                                           | 不存在回傳 null                |
| 11  | should update an existing checklist                                                     | 更新 + 存儲                    |
| 12  | should throw error when updating non-existent checklist                                 | 更新不存在拋錯                 |
| 13  | should delete a checklist and its associated data                                       | 級聯刪除                       |
| 14  | should create a new category                                                            | 建立分類                       |
| 15  | should get categories for a checklist                                                   | 篩選查詢                       |
| 16  | should update a category                                                                | 更新分類                       |
| 17  | should delete a category and its items                                                  | 級聯刪除                       |
| 18  | should get a category by ID                                                             | 依 ID 查詢分類                 |
| 19  | should return null for non-existent category by ID                                      | 不存在回傳 null                |
| 20  | should create a new item                                                                | 建立物品                       |
| 21  | should update an item                                                                   | 更新物品                       |
| 22  | should throw error when updating non-existent item in checklist                         | 更新不存在拋錯                 |
| 23  | should delete an item                                                                   | 刪除物品                       |
| 24  | should get item by ID within a checklist                                                | 依 ID 查詢物品                 |
| 25  | should return null when item is not found within a checklist                            | 不存在回傳 null                |
| 26  | should toggle item packed status                                                        | 切換打包狀態                   |
| 27  | should use cache on subsequent getData calls                                            | 快取命中                       |
| 28  | should update cache after save operation                                                | 快取失效                       |
| 29  | should duplicate a checklist with all categories and items                              | 深層複製                       |
| 30  | should reorder other checklists when duplicating in the middle                          | 中間插入 + 後續順序遞增        |
| 31  | should throw error when duplicating non-existent checklist                              | 複製不存在拋錯                 |
| 32  | should duplicate a category with all its items                                          | 分類層級複製                   |
| 33  | should throw error when duplicating non-existent category                               | 複製不存在拋錯                 |
| 34  | should duplicate an item within the same category                                       | 單項複製                       |
| 35  | should throw error when duplicating non-existent item                                   | 複製不存在拋錯                 |
| 36  | should update multiple checklists at once                                               | 批量更新                       |
| 37  | should return English copy suffix by default                                            | 英文後綴                       |
| 38  | should return Chinese copy suffix for zh-TW locale                                      | 中文後綴                       |
| 39  | should return fallback copy suffix for unknown locale                                   | 未知語系後備                   |
| 40  | should dispose resources and clear cache                                                | 資源清理                       |
| 41  | should handle deleting non-existent category gracefully                                 | 刪除不存在無錯                 |
| 42  | should handle deleting non-existent item gracefully                                     | 刪除不存在無錯                 |
| 43  | should propagate errors when storage save fails                                         | 錯誤傳播                       |
| 44  | should truncate duplicate name when original name is at max length                      | 邊界：名稱截斷                 |
| 45  | should invalidate cache when storage event fires with matching key                      | 跨分頁快取失效                 |
| 46  | should reset \_initialized when storage key is removed in another tab                   | 跨分頁移除處理                 |
| 47  | should ignore storage events for unrelated keys                                         | 事件 key 過濾                  |
| 48  | should throw Storage operation failed when setItem throws                               | QuotaExceeded 錯誤路徑         |
| 49  | should throw when updating non-existent category                                        | 更新不存在分類拋錯             |
| 50  | should truncate duplicate category name when at max length                              | 分類名稱截斷                   |
| 51  | should truncate duplicate item name when at max length                                  | 物品名稱截斷                   |
| 52  | should read user-locale from localStorage when no locale provided                       | 從 storage 讀取語系            |
| 53  | should default to English suffix when no locale in storage                              | 語系後備                       |
| 54  | should handle multiple dispose calls gracefully                                         | dispose 冪等                   |
| 55  | should store and retrieve emoji in checklist name                                       | Unicode emoji 支援             |
| 56  | should store and retrieve CJK characters in category name                               | CJK 字元支援                   |
| 57  | should store HTML-like strings as plain text                                            | XSS 安全存儲                   |
| 58  | should handle special characters in item names                                          | 特殊字元編碼                   |
| 59  | should handle gracefully when getItem throws on getData                                 | localStorage 停用              |
| 60  | should normalize missing arrays from storage payload                                    | 稀疏 payload 後備              |
| 61  | should handle missing checklists array in cache                                         | 快取形狀後備                   |
| 62  | should handle missing categories array in cache                                         | 快取形狀後備                   |
| 63  | should handle missing items array in cache                                              | 快取形狀後備                   |
| 64  | should allow create operations with sparse cache shape                                  | 稀疏快取建立路徑               |
| 65  | should reject the whole batch when a checklist does not exist                           | 原子批次失敗                   |
| 66  | should return all categories across all checklists                                      | 不帶 filter 的分類查詢         |
| 67  | should use original categoryId for items whose category was not found                   | orphan item 後備               |
| 68  | should duplicate checklist when stored categories and items are absent                  | 舊版預設值                     |
| 69  | should duplicate category when stored items are absent                                  | 舊版預設值                     |
| 70  | should duplicate item when stored data has no reorder targets                           | 複製後備路徑                   |
| 71  | should reject stale concurrent checklist updates                                        | 同欄位衝突                     |
| 72  | should invalidate cache after storage event from another tab                            | 跨分頁快取失效                 |
| 73  | should handle high data volume (50+) without losing correctness                         | 高資料量正確性                 |
| 74  | should cascade delete categories and items when deleting checklist                      | 級聯完整性                     |
| 75  | should cascade delete all items in a deleted category                                   | 級聯完整性                     |
| 76  | should preserve relative order semantics after duplicate and delete                     | 順序一致性                     |
| 77  | should keep general recommended list shape stable across en and zh-TW locales           | 語系資料形狀穩定               |
| 78  | should reject a stale item update without overwriting newer fields                      | 同欄位衝突                     |
| 79  | rejects a stale move after an addition in source without writing duplicate orders       | 來源新增成員時拒絕整次拖曳     |
| 80  | rejects a stale move after an addition in target without writing duplicate orders       | 目標新增成員時拒絕整次拖曳     |
| 81  | rejects a stale move after an addition in empty target without writing duplicate orders | 空目標成員檢查                 |
| 82  | preserves unrelated concurrent fields and hidden slots when membership is unchanged     | 相容欄位與隱藏槽位保留         |
| 83  | allows ordinary packing batches after an unrelated membership change                    | 打包批次不套用拖曳成員前提     |
| 84  | requires both source and empty target membership baselines for moves                    | 拒絕不完整的受影響分類baseline |
| 85  | rejects a same-category reorder after an untouched hidden row is removed                | 隱藏成員移除時原子拒絕排序     |
| 86  | should update multiple items atomically with one storage write                          | 原子性批次持久化               |
| 87  | should not persist a partial batch when an item does not exist                          | 批次失敗完整性                 |

##### 8.1.2.2 templateService.test.js（15）

| #   | Test                                                           | 測試重點      |
| --- | -------------------------------------------------------------- | ------------- |
| 1   | creates a storage-safe checklist snapshot                      | template 建立 |
| 2   | applies a template with fresh IDs and reset state              | template 套用 |
| 3   | updates only the template storage key                          | 儲存隔離      |
| 4   | preserves malformed template storage without changing app data | 損壞資料保留  |
| 5   | propagates localStorage write failures                         | 錯誤傳遞      |
| 6   | returns templates in ascending persisted order                 | 讀取排序      |
| 7   | updates and deletes an existing template                       | CRUD 成功路徑 |
| 8   | rejects updates and deletes for missing templates              | CRUD 錯誤路徑 |
| 9   | reorders requested templates and appends unspecified templates | 重排完整性    |
| 10  | snapshots persisted checklist data when UI data is partial     | storage 後備  |
| 11  | preserves malformed application data and rejects snapshots     | app 資料保留  |
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

##### 8.1.2.4 storageTransaction.test.js（27）

| #   | Test                                                                          | 測試重點                     |
| --- | ----------------------------------------------------------------------------- | ---------------------------- |
| 1   | keeps durable and readable data unchanged after a failed write                | 寫入失敗隔離                 |
| 2   | preserves app and template data when any supported mutation cannot be saved   | 各種修改失敗覆蓋             |
| 3   | does not expose mutable references to committed data                          | 獨立快照                     |
| 4   | preserves corrupted application data and rejects writes                       | 損壞資料保留                 |
| 5   | rejects an unsupported application schema without replacing it                | 版本防護                     |
| 6   | rejects records without identity instead of generating a new id               | 身分防護                     |
| 7   | preserves malformed template snapshots and refuses to overwrite them          | 模板資料保留                 |
| 8   | rejects wrong-typed persisted fields without normalizing them into new values | 型別防護                     |
| 9   | refuses writes when safe cross-tab locking is unavailable                     | 唯讀後備                     |
| 10  | normalizes legacy defaults in memory without rewriting the stored bytes       | 非破壞性讀取                 |
| 11  | keeps both templates when an earlier reader creates after another writer      | 最新模板寫入                 |
| 12  | serializes simultaneous checklist creation across service instances           | 併發寫入                     |
| 13  | merges unrelated field changes and rejects stale edits to the same field      | 欄位意圖與衝突               |
| 14  | does not create a category or item after its owner was deleted                | 所屬對象防護                 |
| 15  | rejects an entire batch when one item conflicts                               | 原子物品批次                 |
| 16  | does not partially reorder categories if a category was deleted               | 原子類別批次                 |
| 17  | rejects a template draft if another tab changed its original snapshot         | 模板衝突                     |
| 18  | rejects a queued item move after another writer deletes its destination       | 目的地衝突                   |
| 19  | rejects queued checklist creation after the selected template is deleted      | 已刪除模板防護               |
| 20  | preserves corrupted template data and refuses queued checklist creation       | 損壞模板防護                 |
| 21  | 任一順序都拒絕過期打包與待處理變更                                            | 關聯狀態衝突                 |
| 22  | 關聯狀態衝突時拒絕整個批次                                                    | 原子批次狀態                 |
| 23  | 兩種順序都可合併狀態與無關編輯                                                | 無關欄位合併                 |
| 24  | 拒絕矛盾狀態寫入並保留舊資料值                                                | 舊資料相容                   |
| 25  | 讀寫保留舊日期、數量字串、truthiness 與額外欄位                               | 原始／model 邊界與讀取不寫回 |
| 26  | 保留範本巢狀欄位並隔離新建立的 runtime 狀態                                   | Snapshot 保留與全新狀態      |
| 27  | 複製原始資料時不偷偷修復缺漏的舊名稱                                          | 既有失敗行為與原文保留       |

#### 8.1.3 Composables（95）

##### 8.1.3.1 usePackingLists.test.js（71）

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

##### 8.1.3.2 useTemplates.test.js（16）

| #   | Test                                                        | 測試重點           |
| --- | ----------------------------------------------------------- | ------------------ |
| 1   | should load template state                                  | 初始載入           |
| 2   | should expose a load error                                  | 錯誤狀態           |
| 3   | should save a template and refresh state                    | 儲存 + refresh     |
| 4   | should expose an apply error                                | 套用失敗           |
| 5   | should rename a template and refresh state                  | 更新 + refresh     |
| 6   | should expose a delete error                                | 刪除失敗           |
| 7   | should delete a template and refresh state                  | 刪除 + refresh     |
| 8   | should expose a save error                                  | 儲存失敗           |
| 9   | should reject renaming a missing template                   | 缺少項目 guard     |
| 10  | should expose a rename error                                | 重命名失敗         |
| 11  | should return applied template data                         | 套用成功           |
| 12  | should update a template and refresh state                  | 更新 + refresh     |
| 13  | should expose an update error                               | 更新失敗           |
| 14  | should expose its service instance                          | Service 存取       |
| 15  | refreshes for template and clear events only while mounted  | 跨分頁生命週期     |
| 16  | 已提交範本在refresh失敗時仍回傳成功，重讀可恢復且不重複寫入 | 提交確認與唯讀重試 |

##### 8.1.3.3 useTouchLayout.test.js (1 tests)

| #   | Test                                                                   | 驗證內容           |
| --- | ---------------------------------------------------------------------- | ------------------ |
| 1   | tracks capabilities independently of width and cleans up subscriptions | 輸入能力與訂閱清理 |

##### 8.1.3.4 useVisualViewport.test.js（1）

| #   | Test                                                                 | 測試重點               |
| --- | -------------------------------------------------------------------- | ---------------------- |
| 1   | updates fixed modal bounds and removes viewport listeners on unmount | 鍵盤可見視窗範圍與清理 |

##### 8.1.3.5 useUndoHistory.test.js（6）

| #   | Test                                                                                 |
| --- | ------------------------------------------------------------------------------------ |
| 1   | moves committed actions in order and drops redo only for a new action                |
| 2   | keeps the action available when persistence fails                                    |
| 3   | prevents double execution and discards stale stacks after a concurrent change        |
| 4   | retains a newer action committed while an earlier undo refreshes                     |
| 5   | does not commit queued undo when an editor begins saving before the lock is acquired |
| 6   | retains only the most recent actions within the limit                                |

#### 8.1.4 i18n（12）

##### 8.1.4.1 index.test.js（12）

| #   | Test                                                                    | 測試重點           |
| --- | ----------------------------------------------------------------------- | ------------------ |
| 1   | should use saved locale when it is supported                            | 儲存語系還原       |
| 2   | should map zh-HK browser language to zh-TW and persist                  | 瀏覽器語系正規化   |
| 3   | should fallback to en for unsupported browser language                  | 不支援語系後備     |
| 4   | should ignore invalid saved locale and detect from browser              | 無效儲存語系防禦   |
| 5   | should use navigator.language when navigator.languages is empty         | 空 languages 後備  |
| 6   | should map bare "zh" browser language to zh-TW                          | 裸 zh 對應         |
| 7   | should persist locale when setLocale receives a supported value         | 語系持久化         |
| 8   | should ignore unsupported setLocale values and keep current locale      | setter 防禦        |
| 9   | should keep English and Traditional Chinese translation keys aligned    | 翻譯 key 一致性    |
| 10  | should render real interpolated and pluralized messages in both locales | 實際插值與複數形式 |
| 11  | should render the English fallback when a Chinese message is missing    | 執行時英文後備顯示 |
| 12  | storage 拒絕存取時維持 session 語言                                     | 偏好後備           |

#### 8.1.5 Utils（41）

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

##### 8.1.5.4 positioning.test.js（4）

| #   | Test                                                                  | 測試重點               |
| --- | --------------------------------------------------------------------- | ---------------------- |
| 1   | should clamp dropdown left within viewport padding                    | 左側最小 padding 夾取  |
| 2   | should clamp dropdown left to max when near right edge                | 右側最大邊界 夾取      |
| 3   | should position dropdown above anchor with gap and zIndex             | 固定定位計算（含 gap） |
| 4   | fits bottom-edge and oversized menus inside an offset visual viewport | Popup 可見範圍與捲動   |

##### 8.1.5.5 focusEditingInput.test.js（3）

| #   | Test                                                                       | 測試重點                            |
| --- | -------------------------------------------------------------------------- | ----------------------------------- |
| 1   | keeps a visible input in place and restores temporary space                | 穩定聚焦與 padding 清理             |
| 2   | scrolls by the minimum delta after keyboard resize and stops after cleanup | Scrollport 幾何與 viewport 生命週期 |
| 3   | transfers temporary space ownership between editors                        | 舊清理不得移除啟用中的空間          |

##### 8.1.5.6 operationErrors.test.js（3）

| #   | Test                                                    | 測試重點    |
| --- | ------------------------------------------------------- | ----------- |
| 1   | 保留一般錯誤訊息並使用unavailable後備                   | 一般失敗    |
| 2   | Service errors與error-like records保留支援的storage類別 | 穩定錯誤碼  |
| 3   | 不信任未知失敗的任意code值                              | Unknown縮窄 |

#### 8.1.6 Data（4）

##### 8.1.6.1 recommendedLists.test.js（4）

| #   | Test                                                                         | 測試重點                     |
| --- | ---------------------------------------------------------------------------- | ---------------------------- |
| 1   | resolves complete localized recommended lists with valid category references | 在地化資料與炎熱防曬物品歸屬 |
| 2   | includes core clothing in every recommended list                             | 基本衣物涵蓋                 |
| 3   | falls back to English for unsupported locales                                | 語系後備                     |
| 4   | returns isolated resolved data                                               | 解析結果隔離                 |

#### 8.1.7 Scripts（23）

##### 8.1.7.1 candidateFingerprint.test.js（2）

| #   | Test                                                                          | 測試重點                          |
| --- | ----------------------------------------------------------------------------- | --------------------------------- |
| 1   | allows a staged binary diff larger than the completion asset collection       | Binary candidate fingerprint 預算 |
| 2   | fingerprints a staged binary candidate larger than the default process buffer | 大型 binary Git diff 端到端支援   |

##### 8.1.7.2 verifyFeature.test.js（6）

| #   | Test                                                                    | 測試重點                 |
| --- | ----------------------------------------------------------------------- | ------------------------ |
| 1   | should summarize Playwright failures without ANSI formatting            | 精簡、去重的失敗診斷摘要 |
| 2   | should report missing individual errors                                 | reporter 後備訊息        |
| 3   | should summarize top-level Playwright runner failures                   | 測試前 runner 診斷       |
| 4   | checks types before tests and includes the layer in its success summary | 型別檢查順序及結果列示   |
| 5   | stops before runtime tests when type checking fails                     | CI 失敗即停止邊界        |
| 6   | stops before type checking when theme colors differ                     | 主題色不一致即停止       |

##### 8.1.7.3 checkTypeScriptScope.test.js（8）

| #   | Test                                                   | 測試重點                             |
| --- | ------------------------------------------------------ | ------------------------------------ |
| 1   | accepts an all-TypeScript application                  | 驗證 TS 應用的 compiler roots        |
| 2   | rejects a new JavaScript module                        | 防止新增未檢查 JS                    |
| 3   | rejects an excluded application module                 | 防止 compiler 範圍漏檔               |
| 4   | rejects a JavaScript Vue script                        | 要求 SFC scripts 使用 TS             |
| 5   | rejects allowJs being enabled                          | 防止重新引入 JS 過渡設定             |
| 6   | rejects strictNullChecks being disabled                | 保留 strict null 檢查                |
| 7   | rejects disabling template checks                      | 保留明確的模板檢查                   |
| 8   | checks newly added source files for compiler inclusion | 檢查新增 declarations 與 source 檔案 |

##### 8.1.7.4 eslintTypeScript.test.js（2）

| #   | Test                                                                    | 測試重點                               |
| --- | ----------------------------------------------------------------------- | -------------------------------------- |
| 1   | rejects explicit any in a TypeScript application component              | 防止 TS 應用 scripts 使用 explicit any |
| 2   | parses typed Vue props without applying JavaScript undefined-name rules | 允許 TS 型別且不誤報 JS 診斷           |

##### 8.1.7.5 cssVars.test.js (5 tests)

| #   | Test                                                                                       | 測試重點                       |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------ |
| 1   | normalizes opaque and translucent values independently of the generator                    | 色值正規化與無效數值           |
| 2   | validates current declarations and catches missing, extra, duplicate and drifted variables | CSS 變數缺漏、多出、重複與變更 |
| 3   | rejects unsupported, duplicate, missing, and ungrouped source entries                      | 不支援或不一致的來源項目       |
| 4   | protects manual CSS outside the marked region and fails for missing markers                | 保留 CSS 區域與標記            |
| 5   | CLI check is read-only and returns a useful failure for a drifted fixture                  | 唯讀檢查與命令列重新生成       |

### 8.2 Component Tests（338）

#### 8.2.1 App.test.js（81）

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

#### 8.2.7 Item.test.js（37）

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

#### 8.2.9 Category.test.js（32）

| #   | Test                                                                                | 測試重點                     |
| --- | ----------------------------------------------------------------------------------- | ---------------------------- |
| 1   | confirms once after composition and keeps a failed category draft for retry         | 組字完成與儲存失敗後重試     |
| 2   | keeps a category name draft on failed save and retries it                           | 儲存失敗時保留分類草稿並重試 |
| 3   | should display the category name                                                    | 名稱渲染                     |
| 4   | should pass correct item counts to ProgressBar                                      | 進度資料綁定                 |
| 5   | should filter items by categoryId                                                   | 物品篩選                     |
| 6   | should not apply completed styling when some items are unpacked                     | 未完成樣式                   |
| 7   | should apply completed styling when all items are packed                            | 完成樣式                     |
| 8   | should start with items visible (not collapsed)                                     | 預設展開                     |
| 9   | should collapse items when toggle button is clicked                                 | 收合切換                     |
| 10  | should show input when category name is clicked                                     | 點擊編輯                     |
| 11  | should emit "update:category" with new name on Enter                                | Enter 確認                   |
| 12  | should cancel edit mode on Escape key                                               | Escape 取消                  |
| 13  | should emit "create:item" when AddItemButton triggers click                         | 新增物品事件                 |
| 14  | should emit "delete:category" when delete is triggered                              | 刪除事件                     |
| 15  | should emit "copy:category" when copy is triggered                                  | 複製事件                     |
| 16  | should emit "update:category" on blur with changed name                             | blur 儲存                    |
| 17  | should not emit "update:category" on blur when name is unchanged                    | 無變更不發送                 |
| 18  | should not emit "update:category" when name is empty                                | 空名稱檢查                   |
| 19  | should not emit "update:category" when name is whitespace only                      | 空白檢查                     |
| 20  | should set dragging item ID on drag start                                           | 拖曳開始                     |
| 21  | should clear dragging item ID on drag end                                           | 拖曳結束                     |
| 22  | should emit "move:item" with type "move" when item is added from another category   | 跨分類移動                   |
| 23  | should emit "move:item" with type "reorder" when item is moved within same category | 同分類排序                   |
| 24  | should preserve packed slots when reordering filtered items                         | 篩選槽位重排                 |
| 25  | should insert before the next visible target item while filtered                    | 篩選跨分類移動               |
| 26  | should display only unpacked items while retaining full category progress           | 篩選顯示                     |
| 27  | should forward Item events from child Item component                                | 子元件事件轉送               |
| 28  | should enter edit mode when newlyCreatedCategoryId matches                          | 新建自動編輯                 |
| 29  | should not enter edit mode when newlyCreatedCategoryId does not match               | 無誤觸發                     |
| 30  | should not save during IME composition                                              | IME 檢查                     |
| 31  | should expose a mixed category checkbox and request packing all items               | 三態批次意圖                 |
| 32  | should expose checked, unchecked, and disabled category checkbox states             | 狀態渲染                     |

#### 8.2.10 Checklist.test.js（44）

| #   | Test                                                                           | 測試重點                 |
| --- | ------------------------------------------------------------------------------ | ------------------------ |
| 1   | should display the checklist name                                              | 名稱渲染                 |
| 2   | should display the formatted date range                                        | 同年度日期格式           |
| 3   | should pass correct item counts to ProgressBar                                 | 進度綁定                 |
| 4   | should render Category components for each category                            | 分類渲染                 |
| 5   | should show PendingItemsCategory when pending items exist                      | 條件顯示                 |
| 6   | should hide PendingItemsCategory when no pending items                         | 條件隱藏                 |
| 7   | should hide dates and checklist overflow when configured for template editing  | Template editor 顯示     |
| 8   | should toggle unpacked-only display without hiding categories                  | 篩選狀態與分類保留       |
| 9   | confirms once after composition and keeps a failed checklist draft for retry   | 組字完成與儲存失敗後重試 |
| 10  | retains checklist name and dates after a failed save until retry succeeds      | 草稿保留與重試           |
| 11  | should show input when checklist name is clicked                               | 點擊編輯                 |
| 12  | should emit "update:checklist" with new name on Enter                          | Enter 確認               |
| 13  | should cancel edit mode on Escape key                                          | Escape 取消              |
| 14  | should emit "copy:checklist" from OverflowMenu                                 | 複製轉發                 |
| 15  | should emit "delete:checklist" from OverflowMenu                               | 刪除轉發                 |
| 16  | should emit "create:category" from AddCategoryButton                           | 新增分類事件             |
| 17  | should forward "update:item" from Category component                           | 物品更新轉發             |
| 18  | should forward "copy:category" from Category component                         | 分類複製事件轉發         |
| 19  | should forward "delete:category" from Category component                       | 分類刪除事件轉發         |
| 20  | should display untitled placeholder for empty name                             | 未命名顯示               |
| 21  | should adjust end date when start date moves past it                           | 日期約束                 |
| 22  | should not change end date when start date is still before it                  | 日期無變更               |
| 23  | should auto-correct end date set earlier than start date                       | 日期自動修正             |
| 24  | should not save on Enter during IME composition                                | IME 檢查                 |
| 25  | should not emit update when name has not changed                               | 無變更檢查               |
| 26  | should use untitled placeholder when saving empty name                         | 空名稱後備               |
| 27  | should enter edit mode when OverflowMenu triggers edit                         | 編輯模式觸發             |
| 28  | should enter edit mode when newlyCreatedChecklistId matches                    | 新建自動編輯             |
| 29  | should forward "copy:item" from Category component                             | 物品複製轉發             |
| 30  | should forward "delete:item" from Category component                           | 物品刪除轉發             |
| 31  | should forward "create:item" from Category component                           | 物品新增轉發             |
| 32  | should forward "update:category" from Category component                       | 分類更新轉發             |
| 33  | should forward "move:item" from Category component                             | 物品移動轉發             |
| 34  | should format single-date and cross-year ranges                                | 單日／跨年顯示           |
| 35  | should handle empty dates gracefully                                           | 無日期顯示               |
| 36  | associates visible start and end labels with their date inputs                 | 日期標籤與輸入欄位關聯   |
| 37  | should forward "update:item" from PendingItemsCategory                         | pending 更新轉發         |
| 38  | should set isDraggingCategory on drag start                                    | 拖曳狀態                 |
| 39  | should clear drag state on category drag end                                   | 拖曳清理                 |
| 40  | should emit "reorder:categories" with renumbered order when v-model changes    | 分類重排事件             |
| 41  | should save when focus leaves all editing inputs                               | 全域 blur 儲存           |
| 42  | switches across categories with one click and does not swallow outside actions | 共用展開與外部操作       |
| 43  | uses the same rename flow and restores the trigger only for Escape             | 改名與焦點責任           |
| 44  | clears invalid actions on collapse, removal and checklist switch               | 失效展開清理             |

#### 8.2.11 Sidebar.test.js（36）

| #   | Test                                                                                 | 測試重點                          |
| --- | ------------------------------------------------------------------------------------ | --------------------------------- |
| 1   | should display checklist names when expanded                                         | 名稱渲染                          |
| 2   | should show the new checklist button                                                 | 按鈕存在                          |
| 3   | should display the sidebar title                                                     | 標題渲染                          |
| 4   | should render checklist item buttons                                                 | 按鈕渲染                          |
| 5   | should emit toggle-sidebar on hamburger click                                        | 切換事件                          |
| 6   | should emit create-checklist on new button click                                     | 新增事件                          |
| 7   | should emit select-checklist with ID on item click                                   | 選取事件                          |
| 8   | should emit copy-checklist from OverflowMenu                                         | 複製事件                          |
| 9   | should emit delete-checklist from OverflowMenu                                       | 刪除事件                          |
| 10  | should emit edit-checklist from OverflowMenu                                         | 編輯事件                          |
| 11  | should highlight the selected checklist                                              | 選中樣式                          |
| 12  | should not highlight non-selected checklists                                         | 未選樣式                          |
| 13  | should show first character when collapsed on desktop                                | 字首與可見範圍                    |
| 14  | should show language dropdown on button click                                        | 語言選單開啟                      |
| 15  | should change locale and close menu                                                  | 語言切換                          |
| 16  | should close language menu when focus leaves                                         | 焦點離開關閉                      |
| 17  | should close language menu on scroll                                                 | 捲動關閉                          |
| 18  | should close language menu on outside click                                          | 外部點擊關閉                      |
| 19  | should set dragging state on drag start                                              | 拖曳開始                          |
| 20  | should clear dragging state on drag end                                              | 拖曳結束                          |
| 21  | should display checklists sorted by order                                            | 排序顯示                          |
| 22  | should emit "move:checklists" when checklists are reordered                          | 重排事件                          |
| 23  | should display untitled placeholder                                                  | 未命名顯示                        |
| 24  | should apply positioning styles when language menu opens                             | 下拉選單定位                      |
| 25  | should clean up document and window listeners on unmount                             | 生命週期清理                      |
| 26  | should use matching language and template dropdown layouts                           | 選單版面一致                      |
| 27  | should close the template menu after an outside click                                | 外部點擊關閉                      |
| 28  | should emit edit-template when a template is selected                                | Template 選擇                     |
| 29  | should hide template overflow menus on narrow screens                                | 窄版排版                          |
| 30  | should sort templates and highlight the active template                              | 排序與選取                        |
| 31  | should display an empty template state                                               | 空狀態                            |
| 32  | should close the template menu with Escape                                           | 鍵盤關閉                          |
| 33  | should forward save-as-template from checklist overflow                              | 事件轉送                          |
| 34  | keeps the dropped order while preserving refreshed checklist fields                  | 僅排序projection與已儲存props接續 |
| 35  | keeps the latest drop until all saves settle and restores persisted order on failure | 連續放置與儲存失敗復原            |
| 36  | retains committed order when refresh fails and releases it on a later read           | 刷新失敗時保留已儲存預覽          |

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

#### 8.2.13 TemplateEditor.test.js（16）

| #   | Test                                                                     | 測試重點                     |
| --- | ------------------------------------------------------------------------ | ---------------------------- |
| 1   | detects structural draft changes and returns clean after they are undone | 偵測草稿變更與還原           |
| 2   | detects reordered categories and item moves in the snapshot              | 草稿分類排序與物品移動       |
| 3   | configures Checklist without dates or checklist overflow menu            | editor 渲染                  |
| 4   | emits an edited template snapshot without runtime checklist fields       | 編輯後範本快照不含執行期欄位 |
| 5   | emits delete without saving the draft                                    | 刪除操作                     |
| 6   | discards the draft when cancel is selected                               | 取消操作                     |
| 7   | creates draft items and categories without persisting them               | 僅草稿建立                   |
| 8   | copies and deletes categories with their draft items                     | 分類草稿生命週期             |
| 9   | updates, copies, moves and deletes draft items in memory                 | 物品草稿生命週期             |
| 10  | resets the in-memory draft when the selected template changes            | 切換 template 重設           |
| 11  | finishes auto-edit state after updating newly created entries            | 自動編輯清理                 |
| 12  | applies same-category item reorder payloads                              | 物品重排                     |
| 13  | ignores copy requests for missing draft entries                          | 缺少項目 guard               |
| 14  | applies a cross-category batch payload                                   | 套用跨分類物品批次資料       |
| 15  | assigns zero order when creating the first category and item             | 空草稿排序                   |
| 16  | keeps touch changes isolated until saving the template snapshot          | 獨立草稿操作與最後名稱       |

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

#### 8.2.16 PackingCompletionOverlay.test.js（10）

| #   | Test                                                                   | 測試重點               |
| --- | ---------------------------------------------------------------------- | ---------------------- |
| 1   | shows the trip dates, checklist name, and departure message            | 貼紙資訊層級           |
| 2   | uses the four independent travel-illustration image layers             | 功能插畫匯入契約       |
| 3   | focuses and contains keyboard navigation on the skip control           | 初始焦點與鍵盤焦點限制 |
| 4   | emits close once when the user skips the animation                     | 冪等略過行為           |
| 5   | emits close from Escape and a backdrop click                           | 鍵盤與指標關閉         |
| 6   | emits close after the journey animation duration                       | 精確自動關閉邊界       |
| 7   | waits for every illustration before starting the synchronized timeline | load/error 就緒同步    |
| 8   | handles single, missing, and invalid trip dates                        | 安全與跨年日期格式     |
| 9   | renders localized Traditional Chinese sticker copy                     | 語系文字與緊湊日期範圍 |
| 10  | exposes one synchronized timeline to JavaScript and CSS                | 共用時間軸契約         |

#### 8.2.17 typedDraggable.test.js（7）

| #   | Test                                                                          | 驗證內容                              |
| --- | ----------------------------------------------------------------------------- | ------------------------------------- |
| 1   | restores a reordered placeholder before vuedraggable can emit model or change | 同清單取消：DOM／model還原與end清理   |
| 2   | restores cross-list cancellation into a receiver containing []                | 空接收區取消且不發送model／change     |
| 3   | restores cross-list cancellation into a receiver containing [ 'c' ]           | 有成員接收區取消且不發送model／change |
| 4   | still commits a subsequent completed touchend drop                            | 取消後正常觸控放手                    |
| 5   | still commits a subsequent completed drop drop                                | 取消後正常滑鼠放置                    |
| 6   | preserves vuedraggable add/remove semantics for touchend                      | 觸控跨清單正常新增／移除              |
| 7   | preserves vuedraggable add/remove semantics for drop                          | 滑鼠跨清單正常新增／移除              |

### 8.3 E2E Tests（243）

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
| 5   | should delete checklist without confirmation                                            | 刪除流程        |
| 6   | should restore the last opened checklist and fallback to sidebar top after invalidation | 重載恢復 + 回退 |

#### 8.3.3 category-crud.spec.js（3）

| #   | Test                                                | 測試重點 |
| --- | --------------------------------------------------- | -------- |
| 1   | should delete a category via overflow menu          | 分類刪除 |
| 2   | should copy a category via overflow menu            | 分類複製 |
| 3   | should show copy suffix in duplicated category name | 複製後綴 |

#### 8.3.4 drag-and-drop.spec.js（8）

| #   | Test                                                                  | 測試重點                   |
| --- | --------------------------------------------------------------------- | -------------------------- |
| 1   | should reorder checklists in sidebar by drag-and-drop                 | Sidebar 清單拖放重排序     |
| 2   | should reorder categories by drag-and-drop                            | 分類卡片拖放重排序         |
| 3   | should reorder items within a category by drag-and-drop               | 分類內物品拖放重排序       |
| 4   | should preserve packed item slots when filtered items are reordered   | 篩選物品重排               |
| 5   | should persist a filtered move into a partially visible category      | 篩選跨分類插入             |
| 6   | should persist a filtered move into an all-hidden category            | 空目標追加與持久化         |
| 7   | preserves a remote item rename made while another tab is dragging it  | 併發拖曳與重新命名         |
| 8   | should reorder items within a category by drag-and-drop [webkit-core] | 相同核心行為，另一引擎執行 |

#### 8.3.5 item-packing.spec.js（10）

| #   | Test                                                                              | 測試重點                   |
| --- | --------------------------------------------------------------------------------- | -------------------------- |
| 1   | should create a new category via add button                                       | 分類建立                   |
| 2   | should create a new item via add button                                           | 立即聚焦輸入               |
| 3   | should edit an item name                                                          | 穩定無跳動編輯             |
| 4   | should toggle item packed status via checkbox                                     | checkbox 切換              |
| 5   | should update progress when items are packed                                      | 進度更新                   |
| 6   | should show 100% when all items packed                                            | 完全完成                   |
| 7   | should show and dismiss the completion journey after the final category is packed | 完成覆蓋層與延後 Undo      |
| 8   | should contain focus and dismiss completion with Escape or the backdrop           | Modal 鍵盤、指標與焦點返回 |
| 9   | should fit localized sticker copy in a narrow reduced-motion scene                | 窄版、i18n、資產與減少動態 |
| 10  | should persist data after page reload                                             | localStorage 持久化        |

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

#### 8.3.8 multi-tab-sync.spec.js（10）

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

#### 8.3.9 template-management.spec.js（8）

| #   | Test                                                                                  | 測試重點                   |
| --- | ------------------------------------------------------------------------------------- | -------------------------- |
| 1   | closes the templates menu after an outside click                                      | 點擊外部後關閉             |
| 2   | distinguishes Back from canceling checklist creation                                  | Dialog 步驟語意            |
| 3   | edits a template without creating a checklist                                         | 獨立 template 編輯         |
| 4   | confirms inline template edits without saving the template until explicitly requested | 行內編輯保留於草稿直到儲存 |
| 5   | deletes the active template from the editor                                           | template 刪除              |
| 6   | keeps narrow template rows free of overflow menus                                     | 窄版響應式排版             |
| 7   | saves a checklist as a named template without changing checklist data                 | 快照隔離                   |
| 8   | creates an isolated checklist from a selected template                                | 新 ID 與 storage 隔離      |

#### 8.3.10 recommended-lists.spec.js（1）

| #   | Test                                                          | 測試重點               |
| --- | ------------------------------------------------------------- | ---------------------- |
| 1   | should create and persist a checklist from a recommended list | 來源識別名稱與重新載入 |

#### 8.3.11 storage-recovery.spec.js（30）

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

| #   | Test                                                                  | 驗證內容                                                    |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | touch actions remain open and persist quantity and pending state      | 手機命中區、選單、待買字級與持久化操作                      |
| 2   | keeps name geometry stable and makes checkbox edges actionable        | 名稱幾何與真實命中                                          |
| 3   | switches one open item and shares the direct rename flow              | 一次一件展開與改名                                          |
| 4   | fits tablet categories to available width while keeping touch actions | 平板欄數、收合側欄裁切、觸控選單與密度                      |
| 5   | retains hover quick controls and the desktop command menu             | 桌面整列回饋、選單關閉、focus 與文字對齊                    |
| 6   | preserves touch sorting while excluding action buttons                | 手機／平板長按微動、DPR、原生捲動完成、抓取位置、清理與排序 |
| 7   | persists category sorting across tablet columns                       | 長按微動、跨欄抓取位置與排序保存                            |
| 8   | moves an unpacked item into an all-hidden category by touch           | 觸控拖放至已篩選分類與重載                                  |

#### 8.3.13 rwd-overlays.spec.js（6）

| #   | Test                                                                                 | 測試重點                                 |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1   | drawer isolates background, traps keyboard and restores focus through nested dialogs | 抽屜動畫、減少動態、焦點與 resize 穩定性 |
| 2   | drawer popup traps focus and edit actions unlock their destination                   | 抽屜指令歸屬與清單／範本編輯             |
| 3   | short dialogs and narrow date editing fit without horizontal overflow                | 短 viewport、原生日期與觸控選單捲動      |
| 4   | bottom item input keeps a buffer above a simulated keyboard                          | Scrollport 留白、錯誤與清理              |
| 5   | bottom popup fits and keyboard can activate and dismiss it                           | Popup 範圍、初始焦點與 Escape            |
| 6   | bottom popup fits and keyboard can activate and dismiss it [webkit-core]             | 相同核心行為，另一引擎執行               |

#### 8.3.14 rwd-webkit.spec.js（8）

| #   | Test                                                                    | 測試重點                                      |
| --- | ----------------------------------------------------------------------- | --------------------------------------------- |
| 1   | WebKit touch actions persist and drawer dismisses accessibly            | WebKit 觸控狀態、抽屜動畫與回焦               |
| 2   | WebKit short dialogs and date fields fit the narrow viewport            | WebKit 短 viewport 與日期幾何                 |
| 3   | WebKit tablet columns retain visible touch actions                      | WebKit 平板欄數、收合禁止捲動、觸控選單與密度 |
| 4   | WebKit short mobile sidebar keeps navigation reachable                  | 極短側欄清單與語言控制                        |
| 5   | WebKit touch actions persist and drawer dismisses accessibly [chromium] | 相同核心行為，另一引擎執行                    |
| 6   | WebKit short dialogs and date fields fit the narrow viewport [chromium] | 相同核心行為，另一引擎執行                    |
| 7   | WebKit tablet columns retain visible touch actions [chromium]           | 相同核心行為，另一引擎執行                    |
| 8   | WebKit short mobile sidebar keeps navigation reachable [chromium]       | 相同核心行為，另一引擎執行                    |

#### 8.3.15 sidebar-presentation.spec.js（12）

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

#### 8.3.16 desktop-drag-presentation.spec.js（19）

| #   | Test                                                                   | 測試重點                                   |
| --- | ---------------------------------------------------------------------- | ------------------------------------------ |
| 1   | keeps same-category drop order during delayed storage                  | 同分類逐幀排序及指標移動後 hover 控制項    |
| 2   | keeps cross-category drop order during delayed storage                 | 跨分類逐幀排序及指標移動後 hover 控制項    |
| 3   | places the drag placeholder before Add Item in empty categories        | 空分類佔位、取消與 footer 順序下的穩定落點 |
| 4   | places the drag placeholder before Add Item in filtered categories     | 篩選空分類佔位、取消與穩定落點             |
| 5   | restores the original order when a drop cannot be saved                | 寫入失敗後復原                             |
| 6   | does not replay the sidebar label reveal after sorting                 | 側欄排序不重播展開動畫                     |
| 7   | preserves consecutive cross-category drops while storage is delayed    | 延遲儲存時連續跨分類拖曳                   |
| 8   | keeps category drop order during delayed storage                       | 分類延遲儲存逐幀排序                       |
| 9   | does not highlight Add Item after moving the last item from a category | 最後物品移走後按鈕 hover                   |
| 10  | keeps the saved drop visible when the follow-up read fails             | 成功儲存但讀取失敗時保留畫面               |
| 11  | keeps a new drag intact when the previous write completes              | 前次儲存完成時後次拖曳保持                 |
| 12  | packs the displayed destination after its pending move saves           | 分類打包等待移動成功                       |
| 13  | cancels pending category packing when the move fails                   | 移動失敗時取消打包                         |
| 14  | keeps unequal category cards at the cross-column drop position         | 不同高度跨欄分類幾何                       |
| 15  | does not apply queued packing after leaving the checklist              | 切換清單時取消排隊打包                     |
| 16  | cancels queued packing when the saved move cannot be refreshed         | 重新讀取失敗時取消打包                     |
| 17  | shows projected progress when moving into a fully packed category      | 已打包分類的預覽進度                       |
| 18  | packs only remaining source items after the pending move saves         | 來源分類打包不含移走物品                   |
| 19  | keeps the pending drop correct while the packed filter changes         | 儲存期間切換過濾保留預覽                   |

#### 8.3.17 category-motion.spec.js（8）

| #   | Test                                                             | 驗證內容                       |
| --- | ---------------------------------------------------------------- | ------------------------------ |
| 1   | desktop: animates category reflow when a tall category collapses | 桌面換欄重排                   |
| 2   | desktop: animates category siblings before releasing a drag      | 桌面放手前讓位與排序保存       |
| 3   | tablet: animates category reflow when a tall category collapses  | 平板換欄重排                   |
| 4   | tablet: animates category siblings before releasing a drag       | 觸控啟動、放手前位移與排序保存 |
| 5   | phone: animates category reflow when a tall category collapses   | 單欄重排與展開時避免重疊       |
| 6   | phone: animates category siblings before releasing a drag        | 觸控啟動、放手前位移與排序保存 |
| 7   | settles rapid collapse reversals and viewport changes            | 反向操作、清理與無水平溢位     |
| 8   | honors reduced motion and cancels active reflow                  | 即時動態偏好與直接完成版面     |

#### 8.3.18 interaction-feedback.spec.js（10）

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

#### 8.3.19 drag-settlement.spec.js（15）

| #   | Test                                                                         | 驗證內容                                |
| --- | ---------------------------------------------------------------------------- | --------------------------------------- |
| 1   | keeps sidebar mouse drop visible through delayed storage on desktop          | 待儲存順序、保存及重載                  |
| 2   | keeps sidebar mouse drop visible through delayed storage on phone            | 待儲存順序、保存及重載                  |
| 3   | keeps sidebar mouse drop visible through delayed storage on tablet           | 待儲存順序、保存及重載                  |
| 4   | restores sidebar order when a pending mouse drop fails to save               | 儲存失敗還原持久順序                    |
| 5   | touch drag completion leaves the next action tap usable across drag surfaces | 觸控取消及正常放手後第一次點擊仍可操作  |
| 6   | touchcancel restores same drag after its placeholder moves                   | 取消同分類拖曳還原畫面／storage／重載   |
| 7   | touchcancel restores cross drag after its placeholder moves                  | 取消跨分類拖曳還原畫面／storage／重載   |
| 8   | touchcancel restores empty drag after its placeholder moves                  | 取消空目標拖曳還原畫面／storage／重載   |
| 9   | touchcancel restores collapsed drag after its placeholder moves              | 取消收合目標拖曳還原畫面／storage／重載 |
| 10  | touchcancel restores filtered drag after its placeholder moves               | 取消篩選目標拖曳還原畫面／storage／重載 |
| 11  | touchcancel restores category drag after its placeholder moves               | 取消分類拖曳還原畫面／storage／重載     |
| 12  | touchcancel restores sidebar drag after its placeholder moves                | 取消側邊欄拖曳還原畫面／storage／重載   |
| 13  | normal touchend saves item order                                             | 正常觸控放手保存物品順序且可重載        |
| 14  | normal touchend saves category order                                         | 正常觸控放手保存分類順序且可重載        |
| 15  | normal touchend saves sidebar order                                          | 正常觸控放手保存側邊欄順序且可重載      |

#### 8.3.20 drag-membership-conflict.spec.js（1）

| #   | Test                                                                 | 驗證內容                              |
| --- | -------------------------------------------------------------------- | ------------------------------------- |
| 1   | refreshes a stale drag instead of persisting duplicate target orders | 真實雙分頁拖曳衝突、原子storage與重載 |

#### 8.3.21 checklist-dates.spec.js (18 tests)

| #   | Test                                                                        | 測試重點                     |
| --- | --------------------------------------------------------------------------- | ---------------------------- |
| 1   | edits labeled dates and confirms changes at 320px in en                     | 日期編輯與確認               |
| 2   | edits labeled dates and confirms changes at 390px in en                     | 日期編輯與確認               |
| 3   | edits labeled dates and confirms changes at 820px in en                     | 日期編輯與確認               |
| 4   | edits labeled dates and confirms changes at 1280px in en                    | 日期編輯與確認               |
| 5   | edits labeled dates and confirms changes at 320px in zh-TW                  | 日期編輯與確認               |
| 6   | edits labeled dates and confirms changes at 390px in zh-TW                  | 日期編輯與確認               |
| 7   | edits labeled dates and confirms changes at 820px in zh-TW                  | 日期編輯與確認               |
| 8   | edits labeled dates and confirms changes at 1280px in zh-TW                 | 日期編輯與確認               |
| 9   | touch editing › saves checklist and category through their confirm controls | 觸控確認清單與分類           |
| 10  | keeps 10-character name within the main viewport at 320px                   | 不同寬度的清單名稱版面       |
| 11  | keeps 100-character name within the main viewport at 320px                  | 不同寬度的清單名稱版面       |
| 12  | keeps 10-character name within the main viewport at 820px                   | 不同寬度的清單名稱版面       |
| 13  | keeps 100-character name within the main viewport at 820px                  | 不同寬度的清單名稱版面       |
| 14  | keeps 10-character name within the main viewport at 1280px                  | 不同寬度的清單名稱版面       |
| 15  | keeps 100-character name within the main viewport at 1280px                 | 不同寬度的清單名稱版面       |
| 16  | saves another category when its focus moves to a failed draft confirmation  | 儲存失敗草稿與跨分類焦點切換 |
| 17  | edits labeled dates and confirms changes at 320px in en [webkit-core]       | 相同核心行為，另一引擎執行   |
| 18  | edits labeled dates and confirms changes at 1280px in en [webkit-core]      | 相同核心行為，另一引擎執行   |

#### 8.3.22 template-navigation.spec.js (23 tests)

| #   | Test                                                                           | 測試重點           |
| --- | ------------------------------------------------------------------------------ | ------------------ |
| 1   | switches a clean template to the selected checklist including the current one  | 範本導覽與草稿保護 |
| 2   | keeps or discards the draft when switching checklists                          | 範本導覽與草稿保護 |
| 3   | saves the last inline edit before navigating, and retains it on failure        | 範本導覽與草稿保護 |
| 4   | warns before replacing a dirty template with another                           | 範本導覽與草稿保護 |
| 5   | keeps template toolbar visible when scrolling at 390px                         | 範本導覽與草稿保護 |
| 6   | keeps template toolbar visible when scrolling at 820px                         | 範本導覽與草稿保護 |
| 7   | keeps template toolbar visible when scrolling at 1280px                        | 範本導覽與草稿保護 |
| 8   | a reverted name navigates without a discard prompt                             | 範本導覽與草稿保護 |
| 9   | retains the draft on cross-tab conflict when saving before navigation          | 範本導覽與草稿保護 |
| 10  | Escape keeps the draft and restores the navigation focus                       | 範本導覽與草稿保護 |
| 11  | mobile drawer prompts before switching and closes after discard                | 範本導覽與草稿保護 |
| 12  | keeps the requested destination while template save waits for the lock         | 範本導覽與草稿保護 |
| 13  | keeps the toolbar usable in a short narrow viewport                            | 範本導覽與草稿保護 |
| 14  | saves an active category draft before switching                                | 範本導覽與草稿保護 |
| 15  | saves an active item draft before switching                                    | 範本導覽與草稿保護 |
| 16  | resumes the same navigation after an inline IME composition finishes           | 範本導覽與草稿保護 |
| 17  | keeps a dirty draft and explains when the destination disappears               | 範本導覽與草稿保護 |
| 18  | keeps the short-screen confirmation scrollable and traps focus                 | 範本導覽與草稿保護 |
| 19  | navigates after a committed save even if the template refresh fails            | 範本導覽與草稿保護 |
| 20  | saves the template once before creating a checklist                            | 範本導覽與草稿保護 |
| 21  | discards the template once before copying a checklist                          | 範本導覽與草稿保護 |
| 22  | keeps long template toolbar and focused content usable after rotation in en    | 範本導覽與草稿保護 |
| 23  | keeps long template toolbar and focused content usable after rotation in zh-TW | 範本導覽與草稿保護 |

#### 8.3.23 core-smoke.spec.js (2 tests)

| #   | Test                                                             | 驗證內容                         |
| --- | ---------------------------------------------------------------- | -------------------------------- |
| 1   | creates, edits, packs and deletes a persisted item [chromium]    | 建立、編輯、打包、保存重載與刪除 |
| 2   | creates, edits, packs and deletes a persisted item [webkit-core] | 建立、編輯、打包、保存重載與刪除 |

#### 8.3.24 undo-redo-ui.spec.js（16）

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
