# Packing List App - Product Specification

## 1. Project Overview 專案概述
### Product Description 產品描述
一個幫助用戶管理旅行準備物品的網頁應用程式，支援分類管理、進度追蹤和響應式設計的打包體驗。

## 2. Definitions 定義
- 清單 Checklist: 包含目的地、旅行日期、備註的旅行清單容器
- 分類 Category: 物品的主要分類，如衣物、日用品、電子設備等
- 物品 Item: 要攜帶的具體物品，包含名稱、數量、打包狀態等屬性

## 3. Technology Stack 技術架構
### Frontend 前端
- Framework: Vue.js 3 (Composition API)
- Build Tool: Vite 4.4.9
- CSS Framework: Tailwind CSS 3.4.17
- Additional Tools: PostCSS, Autoprefixer

### Data Storage 資料存儲
- MVP: Browser localStorage
- Future: Cloud database (Firebase/Supabase)

### Build & Development
- Dev Server: Vite dev server with HMR
- CSS Processing: PostCSS with Tailwind CSS
- Module Bundling: Vite with ES modules

## 4. Implemented Features

### Core Functionality
#### 清單管理 (Checklist Management)
- 建立多個旅行清單，每個清單包含：
  - 目的地 (destination)
  - 開始日期與結束日期 (startDate, endDate)
  - 備註 (notes)
- 編輯清單基本資訊
- 刪除清單功能
- 清單間切換選擇

#### 分類管理 (Category Management)
- 新增自定義分類
- 編輯分類名稱
- 刪除分類（同時刪除所屬物品）
- 每個分類顯示獨立的進度條

#### 物品管理 (Item Management)
- 在指定分類下新增物品
- 物品屬性包含：
  - 名稱 (name)
  - 數量 (quantity)
  - 所屬分類 (categoryId)
  - 打包狀態 (isPacked)
- 即時編輯物品名稱和數量
- 勾選切換打包狀態
- 刪除物品功能

#### 進度追蹤 (Progress Tracking)
- 整體清單進度顯示
- 各分類進度計算與顯示
- 視覺化進度條元件
- 即時更新進度狀態

#### 響應式設計 (Responsive Design)
- 桌面版：側邊欄 + 主內容區佈局
- 平板/窄屏：側邊欄自動收合，支持展開覆蓋
- 手機版：頂部工具欄 + 抽屜式側邊欄
- 自適應網格佈局（1-4列）

### Technical Implementation
#### 架構模式 (Architecture Pattern)
- Model-View-ViewModel: 清晰的資料模型層
- Composition API: 邏輯復用與狀態管理
- Service Layer: 抽象資料訪問層
- Component-Based: 模組化UI組件

#### 資料持久化 (Data Persistence)
- LocalStorageService 實現資料本地存儲
- 抽象 DataService 介面支持未來擴展
- JSON序列化與模型實例化

#### 狀態管理 (State Management)
- useCheckList Composable 集中管理業務邏輯
- 響應式資料綁定
- 計算屬性自動更新

## 5. File Structure 檔案結構
```
packing-list/
├── index.html                          # 入口HTML檔案
├── package.json                        # 專案依賴配置
├── vite.config.js                      # Vite建置配置
├── tailwind.config.js                  # Tailwind CSS配置
├── postcss.config.js                   # PostCSS配置
└── source/                             # 原始碼目錄
    ├── main.js                         # 應用程式入口點
    ├── App.vue                         # 根元件
    ├── index.css                       # 全域樣式與Tailwind
    ├── models/                         # 資料模型層
    │   ├── Checklist.js                # 清單模型類別
    │   ├── Category.js                 # 分類模型類別
    │   └── Item.js                     # 物品模型類別
    ├── services/                       # 服務層
    │   ├── dataService.js              # 抽象資料服務介面
    │   └── localStorageService.js      # localStorage實現
    ├── composables/                    # Vue組合式函數
    │   └── usePackingLists.js          # 核心業務邏輯組合函數
    ├── components/                     # UI元件
    │   ├── Sidebar.vue                 # 側邊欄導航
    │   ├── Topbar.vue                  # 手機版頂部工具欄
    │   ├── Checklist.vue               # 清單主內容元件
    │   ├── ChecklistForm.vue           # 清單編輯表單
    │   ├── Category.vue                # 分類卡片元件
    │   ├── Item.vue                    # 物品卡片元件
    │   ├── ProgressBar.vue             # 進度條元件
    │   ├── AddCategoryButton.vue       # 新增分類按鈕
    │   ├── AddItemButton.vue           # 新增物品按鈕
    │   └── OverflowMenu.vue            # 更多選項選單
    ├── utils/                          # 工具函數
    │   ├── constants.js                # 應用常數定義
    │   └── helpers.js                  # 通用工具函數
    └── data/                           # 資料檔案
        └── defaultItems.js             # 預設物品資料
```

## 6. UI/UX Design 使用者介面設計

### 視覺設計 (Visual Design)
#### 配色系統 (Color System)
- 主要文字色: `rgba(33, 33, 33, 1)` - 深灰色
- 次要文字色: `rgba(100, 100, 100, 1)` - 中灰色
- 主題色: `rgba(47, 107, 70, 1)` - 森林綠
- 輔助色: `rgba(211, 227, 219, 1)` - 淺綠灰
- 主背景色: `rgba(255, 255, 255, 1)` - 純白
- 次背景色: `rgba(248, 250, 252, 1)` - 淺灰

#### 設計系統 (Design System)
- 字體: 系統字體棧 (system font stack)
- 圓角: 統一使用 Tailwind 的圓角系統
- 陰影: 輕微陰影提供層次感
- 間距: Tailwind 間距系統確保一致性

### 響應式斷點 (Responsive Breakpoints)
- 手機: `< 768px` - 垂直佈局，頂部工具欄
- 平板: `768px - 900px` - 可收合側邊欄
- 桌面: `> 900px` - 固定側邊欄佈局

### 互動設計 (Interaction Design)
#### 側邊欄行為 (Sidebar Behavior)
- 桌面: 固定顯示，可手動收合為圖示模式
- 平板: 自動收合，展開時覆蓋主內容
- 手機: 抽屜式設計，從左側滑出

#### 內容佈局 (Content Layout)
- 網格系統: 響應式網格 (1-4列)
- 卡片設計: 統一的卡片樣式系統
- 表單互動: 即時編輯與驗證

### 元件規格 (Component Specifications)

| 元件名稱 | 功能描述 | 互動行為 |
|---------|---------|---------|
| Sidebar | 清單導航與管理 | 響應式收合/展開，清單選擇 |
| Topbar | 手機版導航欄 | 漢堡選單，新增清單快捷按鈕 |
| Checklist | 主內容區域 | 顯示所選清單的分類與物品 |
| Category | 分類卡片 | 包含物品列表，進度顯示，編輯功能 |
| Item | 物品條目 | 勾選打包狀態，即時編輯，刪除 |
| ProgressBar | 進度條 | 動態顯示完成百分比 |
| ChecklistForm | 清單表單 | 建立/編輯清單資訊 |
| OverflowMenu | 更多選項 | 編輯/刪除等操作選單 |

## 7. Data Models 資料模型

### Checklist 清單模型
```javascript
{
  id: string,           // 唯一識別碼
  destination: string,  // 目的地
  startDate: string,    // 開始日期 (ISO格式)
  endDate: string,      // 結束日期 (ISO格式)
  notes: string,        // 備註
}
```

### Category 分類模型
```javascript
{
  id: string,          // 唯一識別碼
  name: string         // 分類名稱
}
```

### Item 物品模型
```javascript
{
  id: string,          // 唯一識別碼
  name: string,        // 物品名稱
  quantity: number,    // 數量
  categoryId: string,  // 所屬分類ID
  isPacked: boolean,   // 打包狀態
  checklistId: string  // 所屬清單ID
}
```
