# 草叢突擊 Bushwhack

純 HTML5 Canvas + 原生 JavaScript 的俯視生存射擊遊戲，支援繁體中文、English、日本語。沒有後端、帳號或必需的外部素材；執行時不需建置，只有修改頁面文字或資源時需執行一支 Node 腳本產生各語系頁面。每次出擊會產生不同的牆壁、水潭與草叢配置，並檢查可行走區連通。以桌面瀏覽器（鍵盤＋滑鼠）遊玩，不支援手機。

## 開始遊玩

在本目錄執行 `python3 -m http.server 8000`，瀏覽 `http://localhost:8000/`（中文）、`/?lang=en`、`/?lang=ja`；也可直接開啟 `index.html`。右上角切換語系不會重新載入頁面，進行中的遊戲會保留。可離線遊玩；字型服務無法連線時會使用系統字型。

| 操作 | 按鍵 |
| --- | --- |
| 移動 | WASD 或方向鍵 |
| 瞄準／連續射擊 | 滑鼠移動／按住左鍵 |
| 切換槍械 | 1–4、Q 或滑鼠滾輪 |
| 軍械庫（槍械／強化／自動武器／裝備） | B 或右側「軍械庫」按鈕；Esc 關閉 |
| 音樂／音效開關 | M／N，或側欄「設定」（可調音量） |

擊倒敵人或射爆寶箱，走近拾取金幣與零件，在軍械庫購買槍械（衝鋒槍、霰彈槍、可貫穿的電磁步槍）、共用武器強化、自動武器（護衛無人機、環繞刃、追蹤飛彈、電弧線圈）與戰術裝備（頭盔、防彈背心、能量護盾、戰靴、急救包）。自動武器不會暴露位置，但身處草叢時會停火（環繞刃除外）。敵人有突擊兵、射手、高速兵與正面持盾的護盾兵，後期波次數量與補兵速度持續增加。連貫的草叢群隱藏玩家，開火後短暫暴露；牆壁擋人擋子彈，水潭移動減速。音效與 8-bit 背景音樂皆由 WebAudio 即時合成。擊倒當波所有敵人後下一波開始；HP 歸零可重新出擊。

詳細平衡數值與狀態流程見 [DESIGN.md](DESIGN.md)；唯一的實際設定區塊位於 `game.js` 開頭的 `CONFIG`，介面文字位於 `i18n.js`。

## 多語系、Sitemap 與快取版本

`index.html` 與 `sitemap.xml` 由 `tools/index.template.html` 與 `i18n.js` 產生，請勿手動編輯。頁面預填繁體中文，其他語系由 `game.js` 依 `?lang=` 在執行期替換；`sitemap.xml` 列出 `/`、`/?lang=en`、`/?lang=ja` 並附 `hreflang` 對應，`robots.txt` 指向該 sitemap。頁面以內容雜湊引用 `style.css?v=…`、`i18n.js?v=…` 與 `game.js?v=…`，瀏覽器與 CDN 在檔案變更後會取得新版。修改範本、`i18n.js`、`game.js` 或 `style.css` 後、提交前執行：

```sh
node tools/build-pages.mjs
```

新增語系：在 `i18n.js` 加入含 `label`、`ogLocale`、`page`、`game` 的項目後重新建置（sitemap 與切換連結會自動加入）；缺少任何鍵值時腳本會中止並列出。新增其他 HTML 頁面時，也要將其加入建置腳本的 sitemap 輸出。

## GitHub Pages + Cloudflare

1. 推送本儲存庫至 [`YueyuHoshizora/bushwhack`](https://github.com/YueyuHoshizora/bushwhack)；在 **Settings → Pages → Build and deployment** 選擇 **Deploy from a branch**，分支 `main`、目錄 `/ (root)`。在 Pages 設定確認自訂網域為 `bushwhack.yustellar.dev`，並啟用 HTTPS；儲存庫根目錄已含對應 `CNAME`。
2. 在 Cloudflare 的 `yustellar.dev` DNS 新增 `bushwhack` CNAME，目標為 `yueyuhoshizora.github.io`；先使用 **DNS only**（灰雲）完成 GitHub Pages 的網域驗證及憑證簽發，再改為 **Proxied**（橘雲）提供 CDN 快取。Cloudflare SSL/TLS 模式選 **Full (strict)**，避免 Flexible 引起重導迴圈。
3. 開啟 `https://bushwhack.yustellar.dev/`，確認遊戲與分享圖片可載入。推送程式碼不會自動完成 GitHub Pages 啟用或 Cloudflare DNS 設定。

遊戲檔案使用相對路徑；Cloudflare 僅代理／快取靜態檔案，不需要 Workers、API 或伺服器。`index.html` 本身若仍被快取成舊版，清除 Cloudflare 對 `/` 的快取。Cloudflare 快取規則需將查詢字串納入快取鍵（預設即是），或忽略 `lang` 參數皆可，因為三個語系回傳相同 HTML。

## 分享預覽

頁面含 Open Graph／X（Twitter）大型圖片標籤，分享封面為 `assets/og-cover.png`（1200 × 630）；可編輯 `assets/og-cover.svg` 後重新輸出 PNG。`og:url`、canonical 與圖片絕對網址已設定為 `https://bushwhack.yustellar.dev/`。實際對外分享前須先完成上述 DNS 與 Pages 部署。

## 授權

Copyright © 2026 YueyuHoshizora。採用 [GNU AGPL 第三版](LICENSE)（SPDX：`AGPL-3.0-only`），不含「或任何更新版本」授權。程式不提供任何擔保；使用、修改及再散布須遵守授權全文。網站頁尾提供授權與公開原始碼連結。
