# AGENTS.md — 草叢突擊 Bushwhack

修改本網站前必讀。玩法與數值細節見 [DESIGN.md](DESIGN.md)，部署說明見 [README.md](README.md)。

## 專案概要

- 純前端俯視射擊遊戲：HTML5 Canvas + 原生 JavaScript，無框架、無打包工具、無後端、無 npm 相依。
- 部署：GitHub Pages（`main` 分支根目錄）→ Cloudflare CDN，網址 `https://bushwhack.yustellar.dev`（`CNAME`）。儲存庫 `https://github.com/YueyuHoshizora/bushwhack`。
- 授權 AGPL-3.0-only（`LICENSE`）。
- 只支援桌面鍵盤 + 滑鼠，不做行動裝置設計。
- 回覆使用者時使用繁體中文。

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `game.js` | 全部遊戲邏輯，包在 IIFE 內（無全域變數）。開頭的 `CONFIG` 是**唯一**的數值／平衡設定區塊 |
| `i18n.js` | 全部介面文字（`zh-Hant` 預設、`en`、`ja`），每個語系含 `label`、`ogLocale`、`page`、`game` |
| `style.css` | 樣式；介面必須完整放進視窗，不可出現捲軸 |
| `tools/index.template.html` | 頁面範本 |
| `tools/build-pages.mjs` | 產生 `index.html` 與 `sitemap.xml` |
| `index.html`、`sitemap.xml` | **產生檔，勿手動編輯** |
| `robots.txt`、`CNAME`、`assets/og-cover.{svg,png}` | 靜態檔 |
| `.nojekyll` | 空檔，停用 GitHub Pages 的 Jekyll 處理；**不可刪除**，否則 Markdown 文件中的 `{{…}}` 會被 Liquid 解析而導致建置失敗 |
| `DESIGN.md`、`README.md` | 必須與程式同步更新 |
| `ACCEPTANCE.md` | 驗收紀錄：對應企劃 Q1–Q14 與後續需求的實測結果，必須與目前版本相符 |

## 必要規則

1. **建置**：修改 `tools/index.template.html`、`i18n.js`、`game.js` 或 `style.css` 後、提交前執行：

   ```sh
   node tools/build-pages.mjs
   ```

   它會重新產生 `index.html`（資源帶內容雜湊 `?v=…` 以破除 CDN 快取）與 `sitemap.xml`，並檢查各語系鍵值是否齊全，缺漏時中止。
2. **數值**只放在 `game.js` 的 `CONFIG`；敘述文字中的數字執行時由 `CONFIG` 帶入（`{name}` 插值），不要寫死在 `i18n.js`。
3. **文字**只放在 `i18n.js`，三個語系必須同時新增／修改。範本語法：
   - `{{t.key}}`：可切換語系的內文（產生 `<x-i18n data-i18n>`）
   - `attr="{{a.key}}"`：可切換語系的屬性（產生 `data-i18n-attr`）
   - `{{s.key}}`：只輸出預設語系的靜態文字
   - `{{asset:檔名}}`：資源路徑加雜湊
4. **語系**以 `?lang=` 在執行期切換，不重新載入頁面（`applyLocale`）；只有一個 `index.html`。新增語系：在 `i18n.js` 加項目後重新建置即可。
5. **不得在正式程式碼加入測試掛勾**（例如把內部狀態掛到 `window`）。
6. **文件**：玩法、數值、兵種、武器、裝備、流程有變動時，同步更新 `DESIGN.md`；使用方式或部署有變動時更新 `README.md`；功能、數值或驗收結果有變動時更新 `ACCEPTANCE.md`（見下節）。
7. **Git**：每完成一個里程碑自動提交（訊息用英文、祈使句）。**只有使用者要求時才 `git push`**。
8. **隨機性**：影響「每日挑戰是否對所有人相同」的抽選（地圖、變體、突變、兵種、精英詞綴、事件、天賦與路線選項）必須使用 run 的 seeded 串流（`seededRandom` / `game.rng`），不可用 `Math.random`；戰鬥與特效隨機才用 `rand`。改變這些抽選的呼叫順序會改變每日挑戰內容。
9. **本機儲存**：`localStorage` 鍵為 `bushwhack-profile`（紀錄、累計、成就、難度、兵種、突變）、`bushwhack-music`／`bushwhack-sfx` 與其 `-volume`。修改 `profile` 結構時要相容舊資料（缺欄位補預設值）。

## 驗證

- 本機伺服器：`python3 -m http.server 8765`（在儲存庫根目錄），開 `http://localhost:8765/`、`/?lang=en`、`/?lang=ja`。
- 語法檢查：`node --check game.js`。
- 瀏覽器測試（無頭 Chromium）：
  - 先 `page.setCacheEnabled(false)`。
  - `game.js` 是 IIFE，內部狀態無法從頁面存取。測試時以請求攔截改寫回應，只在測試中暴露內部物件，例如把結尾 `})();` 換成 `Object.assign(window,{game,CONFIG});})();`。
  - `tab.run` 的 `page.evaluate` 在隔離環境執行，看不到頁面的 `window` 屬性；需插入 `<script>` 在主環境執行，再把結果寫到 DOM（如 `document.documentElement.dataset`）讀回。
  - 版面檢查：`document.documentElement.scrollHeight` 不得大於 `innerHeight`（常用 1440×900、1280×720 驗證）；確認無 `pageerror`、無未翻譯鍵值外露。

## ACCEPTANCE.md（驗收紀錄）

- 來源：企劃書〈網頁射擊小遊戲企劃-v1.0〉的 Gate A–D 與驗收題 Q1–Q14，以及後續使用者需求（隨機地圖、OG／分享圖、授權、音效、兵種、商店、介面不捲動、音量、地形群聚、資源雜湊、多語系、sitemap、難度調整等）。
- 內容必須反映**目前版本**的實測結果：每項寫明驗證方式（真實輸入或記憶體內場景設定）、觀察到的數值（例如第 10 波近戰 HP 應為 `round(48 × (1 + 0.14 × 9)) = 108`）與結論。數值變更後舊的觀察值即失效，要重新實測並改寫，不可沿用。
- 只記錄實際執行過的驗證；未驗證或無法驗證的項目（例如分享平台抓取預覽、Cloudflare 設定、實機 60fps、長時間實玩手感）明確標註「未驗證」與原因，不得宣稱通過。
- 新增功能或需求時，在「額外需求」加入對應驗收項；外網部署狀態（GitHub Pages、`https://bushwhack.yustellar.dev`）要寫明查詢時間點與結果。
- 提交前確認 `ACCEPTANCE.md`、`DESIGN.md` 與 `CONFIG` 的數值一致。

## 部署注意

- 推送 `main` 後 GitHub Pages 直接發布靜態檔（`.nojekyll` 停用 Jekyll）；推送後以 `gh api repos/YueyuHoshizora/bushwhack/pages/builds/latest` 確認 `status: built`。Cloudflare 若仍快取舊的 `index.html`，清除 `/` 的快取。
- 社群分享預覽爬蟲不執行 JavaScript，任何語系網址的 OG／Twitter 文字皆為預設語系（繁體中文）。
