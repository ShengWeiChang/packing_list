# Asset Governance 資產治理

## 1. Purpose 目的

本文件定義視覺資產如何選擇、存放、替換與驗證。它以同一份政策管理 UI icon、功能插畫與公開品牌檔案，但不強迫它們使用同一套 runtime 系統。

## 2. Asset Categories and Ownership 資產分類與責任歸屬

| 分類         | runtime 責任者                         | 標準來源                               | Repository 規則                                                                            |
| ------------ | -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| UI icon      | `source/components/AppIcon.vue`        | `@lucide/vue` 與專案自有的語意 mapping | 將專案語意對應至適合的 Lucide icon；只有 library 不足且例外經審查時，才使用自訂匯出 icon。 |
| 功能插畫     | 匯入它的功能元件                       | Figma frame 或已核准的來源插畫         | 將 bundled export 存於 `source/assets/<feature>/`；動態文字保留在 HTML/CSS。               |
| 公開品牌資產 | `index.html` 或其他 public entry point | 已核准的品牌來源或專案自有來源檔案     | 僅讓必須保留穩定公開 URL 的檔案使用 `public/`，例如目前的 favicon 或社群 metadata 圖片。   |

`AppIcon` 與功能插畫同屬設計系統資產，但不共用 registry：icon 是語意 Vue component，插畫則是功能擁有的視覺圖層。

## 3. Source Layout 原始碼結構

```text
source/assets/
└─ completion/
   ├─ airport-terminal.png
   ├─ baggage-label.png
   ├─ packing-suitcase.png
   └─ takeoff-plane.png

public/
└─ favicon.svg
```

在只有一種視覺媒體類型時，使用一個以功能命名的目錄。實際出現第二個功能時，再新增如 `onboarding/` 或 `empty-states/` 的目錄。在有真實 consumer 需要該區分前，不建立 `illustrations/`、`brand/` 或 global asset manifest。

## 4. Asset Replacement Contracts 資產替換契約

| 檔案                   | 角色           | 替換契約                                                                                      |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `packing-suitcase.png` | 前景動畫行李箱 | 透明背景；正面、直式箱體；把手在上、輪子在下；主體置於穩定畫布中央。                          |
| `baggage-label.png`    | 貼紙基底       | 透明背景；橫向標籤；左側保留文字安全區；不含固定 itinerary、日期、checklist name 或出發文字。 |
| `airport-terminal.png` | 背景航廈       | 透明背景；橫向構圖與穩定地面基準線；採低細節背景處理。                                        |
| `takeoff-plane.png`    | 起飛圖層       | 透明背景；機頭朝向右上方；維持視覺中心，讓 CSS translate 與 scale 保留航線。                  |

替換插畫可以改變顏色、質感與細節，但必須維持指定方向、透明畫布、視覺錨點與文字安全區。若替換素材改變任何契約，必須在同一變更中更新元件 CSS 與本文件。

`public/favicon.svg` 必須維持穩定的 `/favicon.svg` URL、正方形 `viewBox`、在 favicon 尺寸仍可辨識的主要圖樣，以及有效的獨立 SVG markup。替換檔可以改變圖樣或色盤，但若路徑或 MIME type 改變，必須同步更新 `index.html`。

## 5. Current Asset Inventory and Provenance 目前資產清冊與來源

| 檔案                   | 尺寸                  | Bytes     | 透明度證據                            |
| ---------------------- | --------------------- | --------- | ------------------------------------- |
| `airport-terminal.png` | 1902 × 827 px         | 519,583   | 8-bit RGBA；alpha 值範圍為 0–255      |
| `baggage-label.png`    | 1912 × 823 px         | 1,628,497 | 8-bit RGBA；alpha 值範圍為 0–255      |
| `packing-suitcase.png` | 1024 × 1536 px        | 1,939,607 | 8-bit RGBA；alpha 值範圍為 0–254      |
| `takeoff-plane.png`    | 1536 × 1024 px        | 819,737   | 8-bit RGBA；alpha 值範圍為 0–254      |
| `public/favicon.svg`   | `viewBox 0 0 100 100` | 385       | SVG shapes；沒有 raster alpha channel |

四張 committed PNG 合計 4,907,424 bytes（十進位 4.91 MB，約 4.68 MiB）。它們是此場景已核准的暫行 raster master 與 deployable export。385-byte favicon 是目前專案自有的公開品牌來源與可部署資產。目前 repository 未保存 completion 插畫可長期使用的 editable Figma／vector master、生成紀錄或獨立授權紀錄；在宣稱具備可重現的可編輯插畫工作流前，必須先建立並連結該來源。

## 6. Design and Export Rules 設計與匯出規則

- 建立視覺系統後，Figma 是建議的可編輯來源；committed PNG 或 WebP 是可部署 export，不是可編輯母檔。
- 將使用者可見的動態文字保留為 HTML/CSS。完成貼紙的日期、checklist name 與出發訊息不放入 bitmap。
- 具有紋理或紙張感的插畫使用 PNG 或 WebP。只有需要 runtime 控制顏色、stroke 或 path animation 的簡單可縮放素材才使用 SVG。
- 對獨立動畫圖層保留透明背景。
- 替換既有檔案前，在最大渲染尺寸與窄螢幕檢查候選 export。
- 目前 completion 檔案個別不得超過 2,000,000 bytes、總計不得超過 5,000,000 bytes，除非經明確的效能審查。視覺結果仍獲核准時，優先採用最佳化 WebP 替換。

## 7. Change and Verification Workflow 變更與驗證流程

1. 更新 Figma 或已核准的來源插畫。
2. 依既有檔名與替換契約匯出，或有意識地同時變更契約與 consuming CSS。
3. 記錄 editable source 或 interim-master provenance、export 尺寸、格式、alpha 結果與 byte size。
4. 執行 `npm run build` 驗證 bundled import，並執行 `npm run test:run -- tests/component-tests/PackingCompletionOverlay.test.js` 驗證圖層契約。
5. 本資產治理文件變更時，執行 `npm run docs:check-pairs`。
6. 當視覺回歸風險、穩定渲染能力與預期維護成本足以支持時，新增 deterministic visual snapshot；第二組插畫或重複發生的 responsive regression 是有用訊號，不是硬性門檻。不為單一完成場景單獨導入 Storybook。
