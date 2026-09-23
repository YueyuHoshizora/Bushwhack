# 草叢突擊 Bushwhack

純 HTML5 Canvas + 原生 JavaScript 的俯視生存射擊遊戲。沒有後端、建置程序、帳號或必需的外部素材。每次出擊會產生不同的牆壁、水潭與草叢配置，並檢查可行走區連通。

## 開始遊玩

直接開啟 `index.html`；或在本目錄執行 `python3 -m http.server 8000`，瀏覽 `http://localhost:8000/`。可離線遊玩；字型服務無法連線時會使用系統字型。

| 操作 | 按鍵 |
| --- | --- |
| 移動 | WASD 或方向鍵 |
| 瞄準／連續射擊 | 滑鼠移動／按住左鍵 |
| 強化武器 | B 或右側「強化武器」按鈕；Esc 關閉 |

擊倒敵人或射爆寶箱，走近拾取金幣與零件，在強化選單中購買傷害、射速、散射與射程升級。草叢隱藏玩家，開火後短暫暴露；牆壁擋人擋子彈，水潭移動減速。擊倒當波所有敵人後下一波開始；HP 歸零可重新出擊。

詳細平衡數值與狀態流程見 [DESIGN.md](DESIGN.md)；唯一的實際設定區塊位於 `game.js` 開頭的 `CONFIG`。

## GitHub Pages + Cloudflare

1. 推送本儲存庫至 [`YueyuHoshizora/bushwhack`](https://github.com/YueyuHoshizora/bushwhack)；在 **Settings → Pages → Build and deployment** 選擇 **Deploy from a branch**，分支 `main`、目錄 `/ (root)`。在 Pages 設定確認自訂網域為 `bushwhack.yustellar.dev`，並啟用 HTTPS；儲存庫根目錄已含對應 `CNAME`。
2. 在 Cloudflare 的 `yustellar.dev` DNS 新增 `bushwhack` CNAME，目標為 `yueyuhoshizora.github.io`；先使用 **DNS only**（灰雲）完成 GitHub Pages 的網域驗證及憑證簽發，再改為 **Proxied**（橘雲）提供 CDN 快取。Cloudflare SSL/TLS 模式選 **Full (strict)**，避免 Flexible 引起重導迴圈。
3. 開啟 `https://bushwhack.yustellar.dev/`，確認遊戲與分享圖片可載入。推送程式碼不會自動完成 GitHub Pages 啟用或 Cloudflare DNS 設定。

遊戲檔案使用相對路徑；Cloudflare 僅代理／快取靜態檔案，不需要 Workers、API 或伺服器。更新後若仍顯示舊版，清除 Cloudflare 靜態快取。

## 分享預覽

頁面含 Open Graph／X（Twitter）大型圖片標籤，分享封面為 `assets/og-cover.png`（1200 × 630）；可編輯 `assets/og-cover.svg` 後重新輸出 PNG。`og:url`、canonical 與圖片絕對網址已設定為 `https://bushwhack.yustellar.dev/`。實際對外分享前須先完成上述 DNS 與 Pages 部署。
