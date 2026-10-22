# Packing List App - Code Quality Specification

## 1. Overview 概述

### Purpose 目的

透過自動化的格式化與靜態檢查，保持程式碼一致、可讀、好維護。

### Scope 範圍

適用於本專案技術棧：Vue 3 + Vite + Tailwind（ES Modules）。

## 2. Toolchain 工具鏈

- ESLint（Flat Config）搭配 eslint-plugin-vue、eslint-plugin-tailwindcss、eslint-plugin-vuejs-accessibility
- Prettier 搭配 prettier-plugin-tailwindcss
- simple-import-sort（import/export 排序）
- husky + lint-staged（pre-commit 自動化）

Source of Truth 權威設定來源：

- ESLint：`eslint.config.js`
- Prettier：`.prettierrc`、`.prettierignore`
- 編輯器：`.vscode/settings.json`
- 指令：`package.json`（lint、format、validate）

## 3. Conventions 規範

### 3.1 File Naming Conventions 檔案命名規範

遵循業界標準命名模式，以確保一致性與 IDE 相容性：

**Vue 元件** (source/components/)

- 使用 **PascalCase**：`MyComponent.vue`、`UserProfile.vue`
- Vue.js 官方風格指南建議

**JavaScript 模組**

- **Classes/Models 類別/模型**：PascalCase（例如 `Category.js`、`User.js`）
- **Services/Utils 服務/工具**：camelCase（例如 `dataService.js`、`helpers.js`）
- **Composables 組合式函式**：camelCase 搭配 "use" 前綴（例如 `usePackingLists.js`）
- **Config files 設定檔**：kebab-case（例如 `vite.config.js`、`tailwind.config.js`）

**測試檔案**

- **Unit/Component tests 單元/元件測試**：對應原始檔 + `.test.js`
  - `MyComponent.vue` → `MyComponent.test.js`
  - `helpers.js` → `helpers.test.js`
- **E2E tests 端對端測試**：kebab-case + `.spec.js`
  - `app-loading.spec.js`、`user-login.spec.js`
  - Playwright 官方慣例

**文件檔案** (docs/)

- 使用 **kebab-case**：`code-quality.md`、`user-guide.md`
- 例外：`README.md`、`CONTRIBUTING.md`（大寫慣例）

**資料/語系檔案**

- 語系後綴使用 **camelCase**
- `recommendedListContentEn.js`、`recommendedListContentZhTw.js`
- 避免底線或混合分隔符號

### 3.2 Prettier Formatting 格式化

- 引號：單引號
- 分號：開啟
- 尾隨逗號：ES5（物件/陣列；不含函式參數）
- 單行寬度：100
- Vue 範本：每行一個屬性
- Tailwind 類別：由外掛自動排序

Validation 驗證

- 套用格式化：`npm run format`
- 僅檢查（不寫入）：`npm run format:check`

### 3.3 Tailwind CSS Conventions Tailwind CSS 規範

- 設計系統優先順序：標準 Tailwind classes → 自訂設定擴展 → 任意值（最後手段）
- Spacing 刻度：使用 4px 倍數（0.25rem/1px、0.5rem/2px、0.75rem/3px 等）；非標準值在 `tailwind.config.js` 中擴展
- Class 組織：依功能分組（layout → spacing → colors → states）；Prettier 自動排序
- CSS Modules：用於複雜佈局（masonry、動畫）；kebab-case 命名；優先使用 CSS 變數

Validation 驗證

- ESLint 規則防止衝突的 classes 並強制簡寫使用
- Tailwind 自訂 classes 必須在 `tailwind.config.js` 中定義
- 任意值會觸發審查警告
- CSS Modules classes 會觸發 ESLint 警告（預期行為）

### 3.4 ESLint (Vue)

- 規則基礎：plugin-vue 推薦規則
- 元件屬性順序：啟用規則以維持一致
- 未使用參數：允許底線前綴以表示刻意未用（如 `_evt`）
- 瀏覽器全域：允許 `window`、`document`、`localStorage` 等
- 診斷等級：`no-console` 與 `no-debugger` 設為警告

Validation 驗證

- 檢查：`npm run lint`
- 自動修正：`npm run lint:fix`

### 3.5 Imports/Exports Ordering 匯入/匯出排序

依 simple-import-sort 預設群組排序：

1. Node 內建模組
2. 外部套件
3. 專案內部別名/相對匯入
4. 樣式與副作用匯入

Validation 驗證

- 自動修正匯入順序：`npm run lint:fix`

### 3.6 Vue Template Attributes Order 範本屬性順序

採用 eslint-plugin-vue 預設順序（vue/attributes-order）：

1. Definition — 元件定義：`is`, `v-is`
2. List Rendering — 列表：`v-for`
3. Conditionals — 條件：`v-if`, `v-else-if`, `v-else`, `v-show`, `v-cloak`
4. Render Modifiers — 渲染修飾：`v-once`, `v-pre`
5. Global — 全域識別：`id`
6. Unique — 單一屬性：`ref`, `key`
7. Slot — 插槽：`v-slot`, `slot`
8. Two-Way Binding — 雙向綁定：`v-model`
9. Other Directives — 其他指令：自訂 `v-*`
10. Other Attributes — 一般屬性，順序為：

- Dynamic Attributes — 動態屬性：`:prop="foo"`, `v-bind:prop="foo"`
- Static Attributes — 靜態屬性：`prop="foo"`, `custom-prop="foo"`
- Shorthand Boolean Attributes — 簡寫布林屬性（如 `disabled`）

11. Events — 事件：`@click="onClick"`, `v-on="events"`
12. Content — 內容：`v-text`, `v-html`

Notes 說明

- 規則會在群組內排序；多數情況可自動修正。
- 大型元素建議「每行一屬性」（Prettier）以提升可讀性與 diff 品質。

Validation 驗證

- 多數排序問題可自動修正：`npm run lint:fix`

### 3.7 Vue Script Section Order 元件腳本區段順序

在 `<script setup>`（或元件腳本）採以下由上而下順序：

1. Imports（vue、外部庫、本地模組）— 自動排序：vue → 外部套件 → 本地模組
2. Internationalization (i18n) — `useI18n()` 等初始化
3. Constants — 非響應式常數、配置
4. Props & Emits — `defineProps`、`defineEmits`
5. Composables — `useXxx()` 等組合式函數呼叫
6. State — `ref`、`reactive`
7. Computed — `computed`
8. Functions — 事件處理、輔助函式
9. Lifecycle hooks — `onMounted`、`onUnmounted` 等
10. Watchers — `watch`、`watchEffect`

此順序貼近讀者心智：輸入 → 設定 → 狀態/推導 → 行為 → 生命週期 → 反應式監聽。

Validation 驗證

- 風格建議，非 ESLint 強制；匯入排序由 `simple-import-sort` 自動處理，區塊順序依團隊習慣/Code Review 維持。

### 3.8 JavaScript File Section Order JS 檔案區段順序

JS 檔案應根據類型採用適當的分組：

1. Imports（vue、外部庫、本地模組）— 自動排序：side-effects (CSS) → vue → 外部套件 → 本地模組
2. Constants — 模組層級常數、配置
3. Service initialization — 服務實例化（僅 Composables）
4. State — `ref`、`reactive`（僅 Composables）
5. Computed properties — `computed`（僅 Composables）
6. Functions — 所有函式、方法
7. Watchers — `watch`、`watchEffect`（僅 Composables）
8. Class definition — 類別定義（Class 檔案）

**Composables** (如 `usePackingLists.js`)：採用 1 → 3 → 4 → 5 → 6 → 7

**Class 檔案** (如 `localStorageService.js`, Models)：採用 1 → 8

**Utility/Configuration 檔案**：採用 1 → 2 → 6

Validation 驗證

- 使用 `// ---` 分隔線（80 字元）標示各區段
- 區塊名稱首字母大寫（如 `Imports`, `State`, `Functions`）
- 風格建議，非 ESLint 強制；透過 Code Review 維持

### 3.9 Comment Style 註解風格

專案使用 4 種註解類別，各有特定用途與格式：

**File Headers 檔案標頭**

每個檔案開頭的區塊註解，包含必要的元資料欄位。

**JavaScript 檔案** (`.js`)：

```javascript
/*
================================================================================
File: source/path/fileName.js
Description: 檔案功能的簡要說明
Author: 你的名字
License: MIT (SPDX: MIT)
Created: YYYY-MM-DD
================================================================================
*/
```

**Vue 檔案** (`.vue`)：

```vue
<!--
================================================================================
File: source/components/ComponentName.vue
Description: 元件功能的簡要說明
Author: 你的名字
License: MIT (SPDX: MIT)
Created: YYYY-MM-DD
================================================================================
-->
```

**Section Dividers 區段分隔線**

用於區分檔案內的邏輯區塊，總長度固定 **80 字元**（包含 `//` 和空格）：

```javascript
// -----------------------------------------------------------------------------
// Section Name
// -----------------------------------------------------------------------------
```

**巢狀區段**：在函式或類別內部的分隔線，同樣保持總長度 80 字元（含縮排）：

```javascript
export function useExample() {
  // -----------------------------------------------------------------------------
  // Service initialization
  // -----------------------------------------------------------------------------

  const service = new Service();
}
```

**區段名稱規則：**

- 使用標題大小寫（Title Case）：`Imports`、`State`、`Functions`
- 主要區段（Imports、Class definition、Functions、Watchers）和類別內部區段（Checklist CRUD、Item CRUD）都使用相同格式

**JSDoc Comments JSDoc 註解**

所有匯出的函式、方法與類別都必須包含 JSDoc，需包括：

- 簡要說明
- `@param {Type} name - 說明` 各參數說明
- `@returns {Type} 說明` 非 void 回傳值說明

```javascript
/**
 * 計算已打包項目的總數
 * @param {Array<Item>} items - 待計算的項目陣列
 * @returns {number} 已打包項目總數
 */
function countPackedItems(items) {
  return items.filter((item) => item.packed).length;
}
```

**Inline Comments 行內註解**

僅用於複雜邏輯、臨時解法或待辦事項：

```javascript
// 計算指數移動平均（α = 0.3）
const ema = currentValue * 0.3 + previousEma * 0.7;

// WORKAROUND: Safari 需要在 300ms 延遲後明確設定 focus
setTimeout(() => input.focus(), 300);

// TODO: 待辦事項
```

避免僅重述程式碼的註解。

Validation 驗證

- JSDoc：由 ESLint 強制執行（`eslint-plugin-jsdoc`）
- 區段分隔線：手動維持在 80 字元
- 檔案標頭與行內註解：Code Review

### 3.10 Accessibility (A11y) 無障礙設計

遵循 WCAG 2.1 Level AA 標準，確保應用程式對所有使用者（包括鍵盤使用者與螢幕閱讀器使用者）皆可訪問。

- **Keyboard Navigation 鍵盤導航**：
  - 所有互動元素（按鈕、連結、輸入框）必須可透過 `Tab` 鍵聚焦。
  - 非原生按鈕必須添加 `role="button"`、`tabindex="0"`，並實作 `@keydown.enter` 與 `@keydown.space`。
- **Focus Management 焦點管理**：
  - 隱藏的互動元素（如 Hover 才會出現的按鈕）在聚焦時必須顯示。
  - 使用 `opacity-0` + `pointer-events-none` 代替 `display: none`，並搭配 `focus:opacity-100`。
- **Semantic HTML & ARIA**：
  - 優先使用原生語意標籤。
  - 為沒有文字標籤的圖示按鈕添加 `aria-label`。
  - 使用 `aria-expanded` 與 `aria-controls` 標示折疊/展開狀態。
- **Focus Indicators 焦點指示**：
  - 所有可聚焦元素在聚焦狀態下必須有清晰的視覺回饋。

Validation 驗證

- 靜態檢查：`npm run lint` (透過 `eslint-plugin-vuejs-accessibility`)
- 手動測試：使用鍵盤 `Tab` 鍵遍歷所有功能，確認無焦點陷阱且所有功能皆可操作。

## 4. Git Hooks (Husky) Git 勾子

- Purpose 目的：在提交前強制執行品質檢查。
- How 做法：pre-commit 透過 lint-staged 只檢查與格式化「已暫存」的檔案。
- Where 位置：`.husky/pre-commit`、`.lintstagedrc.json`、`package.json`（"prepare": "husky"）。
- Test 測試：先暫存檔案後執行 `npx lint-staged`，或直接嘗試 `git commit`。

## 5. Development Workflow 開發流程

- 全域格式化：`npm run format`
- 稽核檢查：`npm run lint`
- 自動修正：`npm run lint:fix`
- 驗證（lint + format 檢查）：`npm run validate`
- Pre-commit：對已暫存檔案自動執行 lint-staged

## 6. Editor Integration (VS Code) 編輯器整合

- 儲存時格式化（Prettier 為預設格式器）
- 儲存時啟用 ESLint 修正（explicit）
- Tailwind 類別 Regex 支援以改善 IntelliSense
- 設定來源：`.vscode/settings.json`

## 7. Exceptions & Overrides 例外與覆寫

- 優先調整設定檔以反映期望行為
- 若需個案例外，請縮小影響範圍並附上理由，例如：
  `// eslint-disable-next-line <rule> -- 說明原因`

## 8. Maintenance 維護

- 當設定變更時，請同步更新本文件之摘要
- 以設定檔為最終準則；本文著重原則與使用方式

## 9. Future Considerations 未來考量

- 視需要加入（可選）
  - `eslint-plugin-unicorn`（挑選精選規則）程式風格想進一步提升時加入
  - GitHub Actions：輕量 Quality Gate（`eslint --quiet`、`prettier --check`）當你希望 PR/Push 有自動 Quality Gate 時加入（多人協作或公開專案時）
  - `stylelint`（目前 CSS 少且以 Tailwind 為主）當自訂 CSS 明顯增加（> 500 行）或多人管理 CSS 時加入
  - `eslint-plugin-i18n-json`（目前只有中/英兩個檔案，手動維護即可）當語言數量 > 2 或 i18n key > 100 時加入
