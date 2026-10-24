# Packing List App - Product Specification

## 1. Project Overview 專案概述

### Product Description 產品描述

一個幫助用戶管理旅行準備物品的網頁應用程式，支援分類管理、進度追蹤和響應式設計的打包體驗。

## 2. Definitions 定義

清單 (Checklist)、分類 (Category) 與物品 (Item) 是應用的三個主要資料實體。下列為簡短定義、常用欄位與範例：

- 清單 Checklist
  - 說明：一個旅行打包清單容器，包含旅程資訊與所屬的分類與物品。
  - 屬性：
    - id: string (唯一識別碼)
    - name: string (清單名稱)
    - startDate: string (開始日期，ISO 格式)
    - endDate: string (結束日期，ISO 格式)
    - order: number (顯示/排序優先順序，預設 0)
  - 範例：{ id: "c1", name: "Tokyo Trip", startDate: "2025-12-01", endDate: "2025-12-07", order: 0 }

- 分類 Category
  - 說明：物品的分組或標籤，用於在清單內組織物品（如衣物、盥洗用品）。
  - 屬性：
    - id: string (唯一識別碼)
    - name: string (分類名稱)
    - checklistId: string (所屬清單 ID)
    - order: number (顯示/排序優先順序，預設 0)
  - 範例：{ id: "cat-travel-clothes", name: "衣物", checklistId: "c1", order: 0 }

- 物品 Item
  - 說明：清單中的單一物品條目，包含數量與打包狀態，並可被拖曳排序或移動到不同分類。
  - 屬性：
    - id: string (唯一識別碼)
    - name: string (物品名稱)
    - quantity: number (數量)
    - categoryId: string (所屬分類 ID)
    - isPacked: boolean (是否已打包)
    - checklistId: string (所屬清單 ID)
    - order: number (顯示/排序優先順序，預設 0)
  - 範例：{ id: "item-01", name: "T-shirt", quantity: 3, categoryId: "cat-travel-clothes", isPacked: false, checklistId: "c1", order: 10 }

## 3. Technology Stack 技術架構

### Frontend 前端

- Framework: Vue.js 3 (Composition API)
- Build Tool: Vite 4.4.9
- CSS Framework: Tailwind CSS 3.4.17
- Drag and Drop: vuedraggable 4.1.0
- Additional Tools: PostCSS, Autoprefixer

### Data Storage 資料存儲

- MVP: Browser localStorage
- Future: Cloud database (Firebase/Supabase)

### Deployment 部署

- Platform: Vercel（推薦用於 Vite 專案）
- Configuration: `vercel.json` 設定 SPA 路由與快取
- Build Command: `npm run build`
- Output Directory: `dist/`
- Auto-deployment: Git push 至 main 分支時自動觸發部署

### Build & Development Tools 建置與開發工具

- Dev Server: Vite dev server with HMR
- CSS Processing: PostCSS with Tailwind CSS
- Module Bundling: Vite with ES modules

## 4. Implemented Features 實做功能

### Core Functionality 核心功能

#### Checklist Management 清單管理

- 目的：讓使用者管理多份清單並為每趟旅程建立新清單。
- 主要功能：
  - 建立清單：一律開啟來源 dialog，提供空白清單、個人範本或推薦清單。
    - 空白來源：只建立清單，不加入分類或物品。
    - 具內容來源：產生新的分類／物品 ID、重新映射物品 `categoryId`，並重設打包／待處理狀態。
    - 來源識別名稱：空白來源預設為 `新清單(空白)`；範本或推薦清單預設為 `新清單({name})`。來源名稱會截短，確保完整名稱不超過 100 個字元。
  - 編輯清單：編輯 `name`。
  - 日期編輯：
    - 使用原生 HTML5 日期輸入元件以確保可靠性。
    - 雙向保護機制：更改開始日期時，若結束日期早於開始日期，則自動更新結束日期。更改結束日期時，若早於開始日期，則自動修正為開始日期。
    - 同年度日期區間只顯示一次年份；跨年度則在兩端都顯示年份（例如 `Nov 26, 2025 - Jan 5, 2026`）。
  - 複製清單：複製現有清單及其所有分類與物品。
  - 刪除清單：同時刪除該清單下的所有分類與物品（級聯刪除）。
  - 清單排序：拖曳更新 `order`（0 起），排序結果持久化並在重載後維持。
  - 切換清單：切換後載入該清單的分類與物品，並依 `order` 排序顯示。
- 使用流程：
  - 建立清單 → 新增分類/物品 → 編輯資訊 → 複製/刪除 → 拖曳排序 → 切換清單。
- 驗證方法：
  - 建立後：
    - 空白清單不含分類或物品；具內容清單包含與來源隔離的快照。
    - 所有新分類／物品皆屬於新清單；物品分類 reference 有效且執行期狀態已重設。
    - 預設名稱會識別選取的來源，誤選後仍能辨認建立依據。
    - localStorage（key: `packingListApp`）有新增資料；重新整理後仍存在。
  - 編輯：更新後 UI 立即反映並持久化；日期為 `YYYY-MM-DD`。
  - 複製：複製的清單緊接在原清單後方，名稱加上「 (複製)」後綴；所有分類與物品都以新 ID 複製。
  - 刪除：該清單及其分類與物品自 localStorage 全數移除；UI 切換至其他清單或空狀態。
  - 排序：在側邊欄拖曳清單重新排序；`order` 連續自 0 起；重載後順序維持。
  - 切換：分類與物品依 `order` 排序載入；進度條以當前清單項目計算。

#### Personal Template Management 個人範本管理

- 目的：讓使用者重複使用自己的分類與物品結構，同時避免範本與使用中的清單混在一起。
- 主要功能：
  - 儲存為範本：從清單 overflow menu 開啟命名 dialog，建立新的範本快照。
  - 建立清單：個人範本來源一律顯示；沒有範本時停用並顯示空狀態訊息。
  - 管理範本：Sidebar 範本選單開啟所選範本的 editor；重新命名與刪除在 editor 內進行。
  - 編輯範本：在獨立的記憶體內 editor 編輯範本名稱、分類、物品、數量與順序。
  - 儲存變更：只有明確按下 `儲存範本變更` 才會更新範本 storage；取消不會修改已儲存範本。
  - 使用時複製：從範本建立清單時產生新的清單、分類與物品 ID，並重設打包／待處理狀態。
- 資料持久化：
  - 範本使用獨立的 localStorage key `packingListTemplates`。
  - 使用中的清單仍儲存在 `packingListApp`；開啟或編輯範本不會新增使用中的清單。
  - 範本快照包含 `name`、`order`、分類與物品，但不包含 `checklistId`、`isPacked`、`isPending` 等清單執行期欄位。
- 互動規則：
  - `儲存為範本` 一律建立新範本；更新既有範本必須透過範本 editor。
  - 範本與語言選單使用相同的 Sidebar dropdown 尺寸及相對位置，點擊外部時關閉。
  - 範本編輯模式隱藏清單日期與清單層級 overflow actions，避免破壞性操作的語意不清。
- 驗證方法：
  - 儲存、重新命名、編輯與刪除在重載後維持。
  - 同一範本可套用多次，每次產生獨立 ID，且不修改來源範本。
  - 開啟、取消或儲存範本編輯都不會修改 `packingListApp`。

#### Recommended Lists 推薦清單

- 目的：為常見旅遊型態提供整理過的唯讀起始清單，且不與個人範本混合。
- 內建推薦清單：一般旅行、商務出差、暖熱地區與寒冷地區。
- 資料設計：
  - 語系無關的 definitions 保存穩定 recommended list／category／item ID 與歸屬關係。
  - 英文與繁體中文 content 檔只保存顯示名稱與說明。
  - 重用 item ID，讓多個推薦清單共用同一翻譯項目，而不必重複維護歸屬規則。
  - 每個推薦清單都涵蓋證件、付款、基本衣物、個人用品、健康、電子與旅行用品，再依旅行目的或氣候加入差異項目，不預設活動型專用裝備。
  - 暖熱地區的說明除了炎熱、潮濕與日照強，也明確涵蓋海島與海灘目的地。
- 互動規則：
  - 推薦清單只出現在新增清單 dialog，不能重新命名、編輯、刪除或排序。
  - 選取推薦清單後建立一般可編輯清單；後續編輯不會改變內建來源。
  - 切換語系會更新 dialog 中的推薦清單選項，但不會翻譯已建立的清單快照。
- 資料持久化：
  - 推薦清單隨應用程式發布，不使用 localStorage key。
  - 只有建立完成的清單快照會寫入 `packingListApp`。
- 驗證方法：
  - 每個推薦清單都能解析出 reference 有效的在地化分類與物品。
  - 重複套用會產生獨立的執行期 ID，並重設打包／待處理狀態。

#### Category Management 分類管理

- 目的：在清單內組織物品，提升瀏覽與管理效率。
- 主要功能：
  - 新增分類：插入末位，`order = 當前最大 order + 1`。
  - 重新命名分類：即時編輯名稱，保存後持久化。
  - 刪除分類：同時刪除該分類下所有物品（級聯刪除）。
  - 分類排序：拖曳更新 `order`（0 起），排序結果持久化並在重載後維持。
  - 進度顯示：依分類內 `isPacked` 狀態即時計算完成百分比。
  - 全部打包／取消：分類標題左側的 checkbox 顯示未勾選、混合與已勾選三種狀態，並透過一次原子性 storage 操作更新所有物品。
  - 收合分類：點擊分類標題旁的箭頭按鈕可收合/展開物品列表，收合時保留標題與進度條，提升長清單的瀏覽效率。
- 使用流程：
  - 新增 → 重新命名 → 刪除 → 拖曳排序 → 收合/展開。
- 驗證方法：
  - 新增後分類 `order` 為末位；localStorage 更新，重載後位置一致。
  - 刪除分類後，其物品自 UI 與 localStorage 一併移除。
  - 拖曳排序後，各分類 `order` 連續自 0 起；重載後順序一致。
  - 進度（完成數/總數）與物品勾選同步更新。
  - 全部打包／取消：空分類停用 checkbox；混合狀態下再次勾選會全部打包；復原一次即可還原每個物品先前的打包／待處理狀態。
  - 收合功能：點擊後物品列表平滑收起/展開；收合狀態下標題與進度條仍正確顯示。

#### Item Management 物品管理

- 目的：在清單內管理單一物品條目，支援新增、編輯、刪除、勾選打包狀態與拖曳排序/跨分類移動，並即時影響分類與清單進度。
- 主要功能：
  - 新增物品：在指定分類中建立，`isPacked=false`，`order = 該分類最大 order + 1`。
  - 編輯物品：即時編輯名稱與數量（數量下限 1）；刪除物品。
  - 編輯模式 (Edit Mode)：
    - 採用 `box-shadow` 代替 `border-bottom`，以避免版面位移 (Layout Shift)。
    - 輸入框樣式與顯示文字完全一致（字體大小、行高、內距），確保切換過程平滑（Seamless Toggle）。
    - 進入編輯模式時以防止捲動的方式聚焦並全選名稱；新物品建立後會自動進入此狀態。只有輸入框位於可視範圍外時才以最近位置、無動畫方式捲動。
  - UI 改進：
    - 互動元件（按鈕、選單）在行動版統一為 `size-9`，桌面版統一為 `size-6`，確保視覺一致性。
  - 勾選狀態：切換 `isPacked` 即時更新分類與清單進度，並保留原 `order`。
  - 拖曳排序：
    - 同分類：重排後依序重寫 `order`（0 起）。
    - 跨分類：更新目標物品 `categoryId` 與 `order`，並調整新舊兩側分類的其他項目 `order` 以保持連續。
- 使用流程：
  - 新增 → 編輯 → 勾選 → 刪除/拖曳排序或移動。
- 驗證方法：
  - 新增後物品 `order` 為末位，`isPacked=false`；localStorage 更新，重載後仍在。
  - 編輯後資料即時反映並持久化；刪除後從 UI 與 localStorage 移除。
  - 同分類重排：各物品 `order` 連續自 0 起；重載後順序一致。
  - 跨分類移動：目標物品 `categoryId`、`order` 正確；來源/目標分類其餘物品 `order` 連續；兩側進度正確更新。

#### Unpacked Items Filter 未攜帶物品篩選

- 目的：在長打包清單中暫時只顯示仍需攜帶的物品以減少捲動，同時保留分類層級的操作。
- 主要功能：
  - 所有支援的 viewport 寬度都在清單標題區的 overflow menu 正前方顯示純圖示「只顯示未攜帶物品」切換按鈕。按鈕提供本地化 tooltip 與可存取名稱，以 `aria-pressed` 暴露啟用狀態，並使用品牌綠選取樣式而不縮短清單進度條。
  - 篩選只存在記憶體中的檢視狀態；不修改清單資料或 localStorage，重新整理後回到完整檢視。
  - 所有分類卡都保留。全數打包的分類仍顯示已勾選的分類頭、完整進度、選單、新增物品操作與放置區，但隱藏已打包物品列。
  - 篩選啟用時，新分類與未打包的新物品仍會顯示且可編輯；範本 editor 不顯示執行期打包篩選。
  - 進度與分類完成狀態一律使用完整物品集，而非篩選後的顯示資料集。
  - 同分類拖曳只在原本的可見槽位間重排可見物品，隱藏的已打包物品保留在其槽位。
  - 跨分類拖曳會把可見放置位置映射至完整目標順序：插在下一個可見物品之前；若放在可見末端或沒有可見物品，則加到完整分類末端。
  - 來源與目標順序會重新編號，並以一次 `updateMultipleItems` 操作共同儲存。
- 使用流程：
  - 開啟篩選 → 檢視或編輯未攜帶物品 → 視需要新增／排序／移動物品 → 關閉篩選以還原完整檢視。
- 驗證方法：
  - 已打包物品列會隱藏並可還原，打包狀態不變；所有分類卡與建立操作都保持可用。
  - 篩選中的同分類與跨分類拖曳會產生連續且可持久化的 `order`，隱藏物品位置遵循上述規則。
  - 重新整理後恢復完整檢視，同時保留物品資料與重新整理前明確執行的拖曳排序。

#### Pending Items (To Buy / To Do) 待處理物品（待買/待辦）

- 目的：提供一個虛擬且跨分類的檢視，用於顯示使用者標記為「待處理」的物品 — 此功能涵蓋「待購買」與「待辦」語義。
- 主要功能：
  - 標記待處理：每個物品新增布林欄位 `isPending`。將物品標記為待處理時，系統會自動清除 `isPacked`（避免狀態衝突）。
  - 虛擬分類：所有 `isPending === true` 的項目會顯示在一個虛擬的待處理分類（`PendingItemsCategory.vue`），該區塊會置於一般分類之上，並採用淺橘色主題及多欄緊湊格局（與分類欄位數一致）。
  - 完成（清除待處理）：在虛擬分類中可對項目執行完成（勾選）操作以清除 `isPending`，該項目隨即移出虛擬分類。
  - 數量顯示：在虛擬分類中，僅當 `quantity > 1` 時才於名稱後顯示數量標籤。
- 使用流程
  - 將物品標記為待處理 → 該物品顯示於待處理虛擬分類 → 可選擇標記為完成（取消 isPending）→ 物品移出虛擬分類。
- 驗證：
  - 標記待處理會設定 `isPending` 並持久化。
  - 標記待處理會同時清除 `isPacked`（設為 false）。
  - 當沒有任何待處理項目時，虛擬分類自動隱藏。

#### Progress Tracking 進度追蹤

- 目的：即時、可視化呈現清單與分類的完成度，讓使用者清楚掌握打包進度。
- 主要功能：
  - 清單進度：以當前清單的 `items.length` 為總數、`items.filter(isPacked).length` 為完成數，顯示於清單標題下方進度條（`ProgressBar.vue`）。
  - 分類進度：以該分類下的 `sortedItems.length` 與 `isPacked` 計算完成數，顯示於分類卡片內（`Category.vue`）。
  - 百分比演算法：`Math.round(completed / total * 100)`；當 `total = 0` 時回傳 `0`（`ProgressBar.vue`）。
  - 完成狀態樣式：分類內所有項目 `isPacked=true` 且非空時，分類卡片套用完成樣式（`bg-green-50`）。
- 使用流程：
  - 勾選/取消勾選物品 → 即時更新分類進度與清單進度。
  - 新增/刪除/拖曳物品 → 自動觸發重新計算並更新進度條。
  - 切換清單 → 以目標清單的項目重新計算並顯示進度。
- 驗證方法：
  - 空集合：`total=0` 顯示 `0%`；無除零或 NaN 情況。
  - 四捨五入：例如 1/3 → `33%`，2/3 → `67%`。
  - 完成樣式：分類全數勾選時卡片背景轉綠；空分類不會被視為已完成。
  - 持久化：勾選狀態儲存於 localStorage；重新整理後進度值與 UI 一致。
  - 跨分類移動：來源/目標分類的完成數即時正確更新，清單總進度同步正確。

#### Packing Undo and Redo 打包狀態復原與重做

- 目的：復原分類整批打包的誤操作，同時不回復無關的內容編輯。
- 主要功能：
  - 每次分類整批打包／取消，都建立一筆只包含 `isPacked` 與 `isPending` 變更的歷史紀錄。
  - 單一物品的打包／待處理變更不會被記錄；若在復原後變更單一物品，會清除重做紀錄，避免覆蓋較新的選擇。
  - 焦點不在可編輯控制項時，`Ctrl+Z` / `Cmd+Z` 執行復原，`Ctrl+Shift+Z` / `Cmd+Shift+Z` 執行重做；文字輸入框保留瀏覽器原生復原。
  - 分類整批變更後顯示五秒狀態提示與「復原」按鈕。`Escape` 仍會取消名稱即時編輯且不儲存。
  - 歷史紀錄上限為 50 筆，只存在目前分頁的記憶體中，切換清單、刪除物品／分類或收到外部 storage 變更時清除。
- 驗證方法：
  - 復原分類整批變更時，一次操作即還原先前混合的打包／待處理狀態；重做會再次套用變更。
  - 復原只變更打包欄位，仍存在的物品其後續名稱、數量、順序與分類編輯都會保留。

#### Responsive Design 響應式設計

- 目的：在不同裝置與視窗寬度下提供自然且順暢的導覽與操作體驗，特別針對手機觸控操作進行優化。
- 主要功能：
  - 斷點與行為：
    - 手機（<600px）：顯示 `Topbar`（`md:hidden`），`Sidebar` 以抽屜覆蓋（teleport 至 `body`，有半透明遮罩，點擊遮罩關閉），主內容加上模糊與互動鎖定。
    - 窄桌面（<1000px）：`Sidebar` 同樣以覆蓋抽屜呈現。
    - 桌面（≥1000px）：`Sidebar` 採固定佈局（`sticky top-0`），可展開 `w-52`/收合 `w-16`，桌面手動收合狀態記錄於 `localStorage('sidebar-manually-collapsed')`。
  - 手機版優化 (Mobile Optimization)：
    - 互動優化：
      - 長按拖曳：為防止誤觸，手機版拖曳需長按 200ms 觸發（`vuedraggable` 設定）。
      - 觸控區域：按鈕與互動元件最小尺寸為 44x44px，符合無障礙標準。
      - 鍵盤避讓：以防止捲動的方式聚焦編輯輸入框；行動版 viewport 穩定後，只有被遮擋的輸入框才以最近可視位置、無動畫方式捲動。
      - Hover 處理：使用 `matchMedia('(hover: hover)')` 區分觸控與滑鼠裝置，手機版不顯示 Hover 樣式。
    - 視覺優化：
      - 介面簡化：手機版隱藏部分編輯按鈕，改以點擊文字進入編輯模式；Overflow Menu (`...`) 常駐顯示。
      - 側邊欄調整：手機版 Sidebar 寬度加寬至 `w-72`，字體與間距放大，提升閱讀與點擊體驗。
  - 內容佈局：
    - 類別瀑布流：使用 CSS columns 實作 `categories-masonry`，`column-count` 在寬度門檻下調整為 1（<600）、2（≥600）、3（≥840）、4（≥1280）。
    - 卡片不斷行：分類外層設 `break-inside: avoid`，並有平滑 transition 以降低重排抖動。
  - 可用性：
    - 抽屜開啟時鎖定 `document.body.style.overflow='hidden'`，避免背景滾動；轉場約 200–300ms。
- 使用流程：
  - 依視窗寬度自動切換佈局；手機透過漢堡按鈕開關 `Sidebar`；桌面可手動切換收合並被記憶。
  - 手機操作時，長按項目進行拖曳排序；點擊文字進行編輯。
- 驗證方法：
  - 尺寸在 <600、600–999、≥1000 間切換，`Topbar` 顯示、`Sidebar` 抽屜/固定模式與主內容模糊行為正確。
  - 手機版驗證：
    - 拖曳需長按才觸發，短按不觸發。
    - 輸入框編輯時不會被鍵盤遮擋。
    - 選單按鈕常駐顯示，且易於點擊。
    - Sidebar 寬度足夠且字體清晰。
  - 抽屜開啟時：主內容加上 `blur + pointer-events-none`；點擊遮罩可關閉抽屜；關閉後恢復 body 滾動。
  - 桌面刷新後：`Sidebar` 收合狀態依 `localStorage` 記憶值呈現。
  - 瀑布流各斷點欄數正確，分類卡片不被切割斷行。

#### Internationalization (i18n) 語言支援

- 目的：提供多語系介面，讓使用者可在多語言之間切換，並在全站即時生效且可持久化偏好。
- 主要功能：
  - 語言切換器：位於 Sidebar，以地球圖示和可見文字按鈕搭配下拉選單呈現。
  - 支援語言：英文（`en`）、繁體中文（`zh-TW`）。
  - 初始偵測與回退：優先使用 localStorage 偏好，其次依瀏覽器語言推論，預設回退英文（`en`）。
  - 繁中變體映射：常見變體（`zh`、`zh-Hant`、`zh-TW`、`zh-HK`、`zh-MO`）統一映射為 `zh-TW`。
  - 無障礙文案：按鈕 `aria-label/title` 等輔助文字也會隨語系切換。
  - 字串回退：缺漏字串時以 `fallbackLocale: 'en'` 使用英文。
- 使用流程：
  - 使用者於 Sidebar 點擊語言按鈕 → 從下拉選單選擇語言（EN / 繁中）→ 介面字串與輔助屬性（`aria-label` / `title`）立即更新。
- 驗證方法：
  - 互動測試：在 Sidebar 切換語言後，按鈕、標題、選單與 `aria-label/title` 皆立即更新。
  - 持久化測試：重新整理後仍維持先前選擇（檢查 localStorage `user-locale`）。
  - 偵測測試：在沒有偏好時，依瀏覽器語言推論；非 `zh` 系列預設為英文；`zh/zh-Hant/zh-TW/zh-HK/zh-MO` 皆映射為 `zh-TW`。
  - 回退測試：暫時移除某翻譯鍵，確認會回退顯示英文（`fallbackLocale` 生效）。

#### Accessibility 無障礙性

- 目的：確保應用程式對所有使用者（包括鍵盤使用者與螢幕閱讀器使用者）皆可訪問，符合 WCAG 2.1 Level AA 標準。
- 主要功能：
  - 鍵盤導航：所有互動元素（按鈕、連結、輸入框）皆可透過 `Tab` 鍵聚焦與操作；非原生按鈕實作 `Enter`/`Space` 觸發。
  - 焦點管理：
    - 隱藏元素（如 Hover 按鈕）在聚焦時自動顯示（`opacity-0` -> `opacity-100`）。
    - 手機版隱藏元素使用 `absolute` 移出文檔流，聚焦時切換回 `static`，避免佔用空間。
    - 確保無焦點陷阱，且焦點指示清晰可見。
  - 語意化與 ARIA：
    - 優先使用原生語意標籤（`<button>`, `<nav>`, `<main>`）。
    - 為圖示按鈕添加 `aria-label`；使用 `aria-expanded` 標示折疊狀態。
- 驗證方法：
  - 靜態檢查：通過 `eslint-plugin-vuejs-accessibility` 檢查無錯誤。
  - 鍵盤測試：僅使用鍵盤即可完成建立清單、新增物品、編輯、刪除等所有核心流程。
  - 螢幕閱讀器：確認所有按鈕與狀態皆有正確的朗讀標籤。

#### Drag and Drop 拖曳功能

- 目的：透過拖曳快速排序與重組清單/分類/物品，降低編輯成本並保持順序一致性。
- 技術實作與取捨 (Trade-offs)：
  - Checklist & Item：
    - 實作方式：採用 **Flexbox (Column)** 佈局。
    - 特性：標準的垂直條列，拖曳時其他項目會平滑滑動 (Sliding) 讓出空間，符合物理直覺，UX 體驗極佳。
  - Category：
    - 實作方式：採用 **CSS Columns (Masonry/瀑布流)** 佈局。
    - 特性：
      - 優點：空間利用率高，不同高度的分類卡片能像磚塊般緊密堆疊，無垂直縫隙。
      - 缺點：拖曳時無滑動擠開動畫（因瀏覽器重算欄位導致瞬間跳動）；排列順序為「由上往下、再由左至右」（N字型），而非橫向 Grid 的 Z 字型；新增項目可能出現在第一欄下方而非最右側。
    - 取捨決策：為了在寬螢幕上達成最佳的空間利用與視覺美感，選擇保留瀑布流佈局，接受其拖曳手感較為生硬的限制。
- 主要功能：
  - 清單拖曳（`Sidebar.vue` 中 `vuedraggable` group: `'checklists'`）：
    - 側邊欄拖曳清單以重排，結束後將所有清單 `order = 0..n`。
    - 放置限制：僅允許在清單容器內放置。
  - 分類拖曳（`Checklist.vue` 中 `vuedraggable` group: `'categories'`）：
    - 清單內拖曳分類以重排，結束後將所有分類 `order = 0..n`。
    - 放置限制：僅允許在分類容器內放置。
  - 物品拖曳（`Category.vue` 中 `vuedraggable` group: `'items'`）：
    - 同分類排序：一般模式依視覺順序排列；只顯示未攜帶物品時，於原本的可見槽位間重排可見物品，使隱藏的已打包物品保留其槽位。接著將完整分類重寫為 `order = 0..n`；不更動 `isPacked`。
    - 跨分類移動：更新目標物品的 `categoryId`；插在下一個可見目標物品之前，若放在所有可見物品之後或沒有可見物品則放在完整目標分類末端；來源與目標分類皆重新編號為 `order = 0..n`。
    - 放置限制：僅允許在物品容器間放置（`group.put` 檢查）。
  - 視覺與動效：
    - 使用 `ghost/chosen/drag` class 提供半透明、抓取與放大效果，動畫約 `200ms`；拖曳中維持瀑布流穩定。
  - 持久化：
    - 物品拖曳事件會將來源／目標所有受影響項目交由一次 `updateMultipleItems` 操作寫入，並重新載入資料以確保一致；重新整理後順序維持。
- 使用流程：
  - 按住清單、項目或分類 → 拖至目標位置或分類 → 放開 → 觸發重排與保存。
- 驗證方法：
  - 清單拖曳：所有 `checklists.order` 連續自 0 起；重載後順序一致。
  - 分類拖曳：所有 `categories.order` 連續自 0 起；重載後順序一致。
  - 同分類拖曳：該分類內 `items.order` 連續自 0 起；重載後順序一致。
  - 跨分類移動：目標物品 `categoryId` 與 `order` 正確；來源/目標分類其餘項目 `order` 皆連續；兩側分類與清單進度即時更新。
  - 互動體驗：拖曳時有半透明/指示樣式，動效平滑無明顯抖動或閃爍。

### Technical Implementation 技術實作

#### Architecture Pattern 架構模式

- Model-View-ViewModel: 清晰的資料模型層
- Composition API: 邏輯復用與狀態管理
- Service Layer: 抽象資料訪問層
- Component-Based: 模組化UI組件

#### Data Persistence 資料持久化

- LocalStorageService 實現資料本地存儲
- 抽象 DataService 介面支持未來擴展
- JSON序列化與模型實例化

#### State Management 狀態管理

- usePackingLists Composable 集中管理業務邏輯
- 響應式資料綁定
- 計算屬性自動更新

## 5. File Structure 檔案結構

```
packing-list/
├── index.html                        # 入口HTML檔案
├── LICENSE                           # 授權條款
├── package.json                      # 專案依賴配置
├── package-lock.json                 # 鎖定檔
├── vercel.json                       # Vercel 部署配置（SPA 路由、快取設定）
├── build-css-vars.js                 # CLI 腳本：從 source/utils/constants.js 生成 CSS 變數
├── postcss.config.js                 # PostCSS配置
├── tailwind.config.js                # Tailwind CSS配置
├── vite.config.js                    # Vite建置配置
├── public/                           # 靜態資源
│   └── favicon.svg                   # 網站圖示（主題綠底白勾）
├── docs/                             # 專案文件目錄
│   ├── product-spec.md               # 產品規格
│   └── code-quality.md               # 程式碼品質與規範
└── source/                           # 原始碼目錄
    ├── App.vue                       # 根元件
    ├── index.css                     # 全域樣式與Tailwind
    ├── main.js                       # 應用程式入口點
    ├── components/                   # UI元件
    │   ├── AddCategoryButton.vue     # 新增分類按鈕
    │   ├── AddItemButton.vue         # 新增物品按鈕
    │   ├── Category.vue              # 分類卡片元件
    │   ├── Checklist.vue             # 清單主內容元件
    │   ├── Item.vue                  # 物品卡片元件
    │   ├── OverflowMenu.vue          # 更多選項選單
    │   ├── NewChecklistDialog.vue    # 清單來源選擇 dialog
    │   ├── ProgressBar.vue           # 進度條元件
    │   ├── SaveTemplateDialog.vue    # 新範本命名 dialog
    │   ├── Sidebar.vue               # 側邊欄導航
    │   ├── TemplateEditor.vue        # 獨立個人範本 editor
    │   └── Topbar.vue                # 手機版頂部工具欄
    ├── composables/                  # Vue組合式函數
    │   ├── usePackingLists.js        # 核心業務邏輯組合函數
    │   └── useTemplates.js           # 範本 state 與 CRUD 邏輯
    ├── i18n/                         # i18n 初始化與語系偵測/持久化
    │   └── index.js                  # 建立 vue-i18n、語言映射與讀寫 localStorage
    ├── locales/                      # 語系翻譯檔
    │   ├── en.json                   # 英文翻譯字串
    │   └── zh-TW.json                # 繁體中文翻譯字串
    ├── data/                         # 資料檔案
    │   ├── recommendedListContentEn.js  # 英文推薦清單內容
    │   ├── recommendedListContentZhTw.js # 繁體中文推薦清單內容
    │   ├── recommendedListDefinitions.js # 語系無關的推薦清單歸屬規則
    │   └── recommendedLists.js          # 依語系解析推薦清單
    ├── models/                       # 資料模型層
    │   ├── Category.js               # 分類模型類別
    │   ├── Checklist.js              # 清單模型類別
    │   ├── Item.js                   # 物品模型類別
    │   └── Template.js               # 個人範本模型
    ├── services/                     # 服務層
    │   ├── dataService.js            # 抽象資料服務介面
    │   ├── localStorageService.js    # 清單 localStorage 實現
    │   ├── recommendedListService.js # 內建推薦清單套用邏輯
    │   └── templateService.js        # 個人範本 localStorage 實現
    └── utils/                        # 工具函數
        ├── constants.js              # 應用常數定義（顏色定義在 THEME_COLORS）
        ├── instantiateTemplate.js    # 共用 template-shaped 資料實體化
        └── helpers.js                # 通用工具函數
```

備註：

- `source/utils/constants.js` 中的 `THEME_COLORS` 顏色定義會透過執行 `npm run build:css-vars` 自動生成至 `source/index.css` 的 CSS 變數。
- 工作流程：編輯 `constants.js` → 執行 `npm run build:css-vars` → 提交更新後的 `index.css`。

## 6. UI/UX Design 使用者介面設計

### Visual Design 視覺設計

#### Color System 配色系統

應用程式使用集中式顏色管理系統，採用語義化命名：

**文字色：**

- `text-primary` (`#212121`) — 深灰色，用於主要文字（標題、內文）
- `text-secondary` (`#646464`) — 中灰色，用於次要文字（時間戳記、輔助說明）

**背景色：**

- `bg-primary` (`#ffffff`) — 白色，用於卡片和側邊欄
- `bg-secondary` (`#f8fafc`) — 淺灰色，用於頁面背景

**品牌主題色：**

- `theme-primary` (`#2f6b46`) — 森林綠，用於進度條和品牌元素
- `theme-secondary` (`#d3e3db`) — 淺綠灰，用於進度條背景

**待處理物品（待買/待辦）：**

- 背景: `#fff7ed` (orange-50)
- 文字: `#7c2d12` (orange-900)
- 強調: `#ea580c` (orange-600)
- 按鈕: `#f97316` (orange-500)

**實作方式：**

- 單一資料來源：所有顏色定義於 `source/utils/constants.js`（`THEME_COLORS` 物件）
- 建置流程：執行 `npm run build:css-vars` 會在 `source/index.css` 生成 CSS 變數
- 使用方式：
  - CSS: `var(--text-primary)`、`var(--bg-primary)`、`var(--theme-primary)`
  - Tailwind: `text-primary`、`bg-bg-primary`、`bg-theme-primary`
  - JavaScript: `THEME_COLORS.textPrimary`、`THEME_COLORS.bgPrimary`

#### Design System 設計系統

- 字體: 系統字體棧 (system font stack)
- 圓角: 統一使用 Tailwind 的圓角系統
- 陰影: 輕微陰影提供層次感
- 間距: Tailwind 間距系統確保一致性

### Responsive Breakpoints 響應式斷點

- 手機: `< 600px` - 垂直佈局，顯示 Topbar（`md:hidden`）
- 窄桌面: `600px - 999px` - Sidebar 以抽屜覆蓋主內容
- 桌面: `≥ 1000px` - Sidebar 固定佈局，可展開/收合（狀態將被記憶）

### Interaction Design 互動設計

#### Sidebar Behavior 側邊欄行為

- 手機與窄桌面: 抽屜式設計，teleport 至 `body` 並覆蓋主內容，搭配半透明遮罩；點擊遮罩關閉
- 桌面: 固定顯示，可手動收合為圖示模式；收合狀態會寫入 localStorage 以便記憶

#### Content Layout 內容佈局

- 類別瀑布流: CSS columns 實作 1→4 欄，依寬度門檻自動調整
- 卡片設計: 統一的卡片樣式系統、`break-inside: avoid` 避免斷行
- 表單互動: 即時編輯與驗證

### Component Specifications 元件規格

| 元件名稱             | 功能描述           | 互動行為                                                 |
| -------------------- | ------------------ | -------------------------------------------------------- |
| Sidebar              | 清單與範本導航     | 響應式收合/展開、清單選擇與排序、範本選單開啟範本 editor |
| Topbar               | 手機版導航欄       | 漢堡選單，新增清單快捷按鈕                               |
| Checklist            | 主內容區域         | 顯示分類／物品、分類排序、瀑布流與只顯示未攜帶物品切換   |
| PendingItemsCategory | 待處理物品虛擬分類 | 橘色主題；多欄格局；顯示標記為待處理（待買/待辦）的物品  |
| Category             | 分類卡片           | 包含物品列表，進度顯示，編輯功能，拖曳物品重新排序或移動 |
| Item                 | 物品條目           | 勾選打包/待處理，即時編輯，刪除，支援拖曳移動            |
| ProgressBar          | 進度條             | 動態顯示完成百分比                                       |
| OverflowMenu         | 更多選項           | 編輯/複製/刪除等操作選單                                 |
| NewChecklistDialog   | 清單來源選擇       | 選擇空白清單、個人範本或唯讀推薦清單                     |
| SaveTemplateDialog   | 新範本命名         | 儲存新範本快照前驗證名稱                                 |
| TemplateEditor       | 獨立範本編輯       | 編輯範本內容；明確儲存、取消或刪除且不建立清單           |

## 7. Data Models 資料模型

### Checklist 清單模型

```javascript
{
  id: string,           // 唯一識別碼
  name: string,         // 清單名稱（可為空字串 - UI 層提供預設值）
  startDate: string,    // 開始日期 (ISO格式)
  endDate: string,      // 結束日期 (ISO格式)
  order: number         // 顯示順序 (預設: 0)
}
```

### Category 分類模型

```javascript
{
  id: string,          // 唯一識別碼
  name: string,        // 分類名稱
  checklistId: string, // 所屬清單 ID
  order: number        // 顯示順序 (預設: 0)
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
  isPending: boolean,  // 待處理（待買 / 待辦）狀態
  checklistId: string, // 所屬清單ID
  order: number        // 顯示順序 (預設: 0)
}
```

### Template 範本模型

```javascript
{
  id: string,           // 唯一識別碼
  name: string,         // 範本名稱
  order: number,        // 顯示順序
  categories: Array,    // 分類快照：id、name、order
  items: Array          // 物品快照：name、quantity、categoryId、order
}
```
