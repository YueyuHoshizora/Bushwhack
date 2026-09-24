# 草叢突擊 Bushwhack

[繁體中文](#繁體中文) · [English](#english) · [日本語](#日本語) · 線上遊玩／Play online／オンラインで遊ぶ：<https://bushwhack.yustellar.dev>

## 繁體中文

純 HTML5 Canvas + 原生 JavaScript 的俯視生存射擊遊戲，支援繁體中文、English、日本語。躲進草叢隱匿、繞到敵人背後暗殺，或用六把可進化的槍械、自動武器與投擲物正面突破；每清空一波選一個天賦，每 5 波一章並迎戰首領，第 25 波是最終行動。沒有後端、帳號或必需的外部素材；執行時不需建置，只有修改頁面文字或資源時需執行一支 Node 腳本產生各語系頁面。每次出擊會產生不同的牆壁、水潭與草叢配置，並檢查可行走區連通。以桌面瀏覽器（鍵盤＋滑鼠）遊玩，不支援手機。

### 特殊地圖

在開始畫面的種子欄輸入代碼（不分大小寫）後按 Enter 或「開始行動」，或開啟 `https://bushwhack.yustellar.dev/?seed=<代碼>`。輸入代碼時，威脅條件列會改為顯示地圖名稱與難度，滑鼠停在種子欄可看完整規則。

- 所有特殊地圖都從**第 6 波**開始。開局先連續選 3–4 次天賦，並額外獲得金幣、零件與十字弩，之後照常走章節作戰地圖直到第 25 波。
- 難度、天氣與威脅條件由地圖固定，不套用自選的難度與威脅條件；換章時保留地圖天氣，只重建木牆。
- 地圖與使用種子亂數的抽選（兵種、天賦、事件、黑市等）都固定，同一代碼的內容相同，可與朋友比較分數；戰鬥與特效的隨機結果仍會不同。
- 特殊地圖不更新各難度紀錄、章節評價、威脅紀錄與通關次數，也無法達成波次、無聲波次與通關類成就；熟練度只計實際打過的波次。

| 種子代碼 | 地圖 | 難度・天氣 | 特色 |
| --- | --- | --- | --- |
| `SP-FORTRESS` | ▣ 鐵壁要塞 | 困難・標準 | 出生點被一圈留有四個缺口的石牆包圍，另有 9 個爆炸桶。敵人只有護盾兵、重裝兵、鏡盾兵、擲彈兵、醫護支援兵與突擊兵：生命 ×1.6、移速 ×0.85、數量 ×0.8。精英率 +10%，而且全部是裝甲詞綴。 |
| `SP-SWARM` | ⋙ 蟲潮 | 普通・暴雨 | 只有 4 面石牆、2 面木牆、草叢 ×0.6 的開闊地。敵人只有蜂群、高速兵、追獵犬、自爆無人機與突擊兵：生命 ×0.55、移速 ×1.15、數量 ×2.4、補兵間隔 ×0.45。 |
| `SP-NIGHT` | ☾ 永夜 | 困難・夜戰 | 6 座探照燈塔、草叢 ×1.3，視野只有 190 px，並套用「盲區」。敵人只有隱匿兵、追獵犬、偵察機、精準射手、照明兵與自爆無人機：傷害 ×1.3、視距 ×1.15。 |
| `SP-INFERNO` | ♨ 焦土煉獄 | 困難・焦土 | 16 個爆炸桶、9 面木牆、草叢 ×0.5，並套用「永久焦土」。敵人只有火焰兵、爆破兵、擲彈兵、自爆無人機與高速兵：傷害 ×1.4、數量 ×1.1。 |
| `SP-ALLEY` | ⟶ 狙擊長廊 | 困難・標準 | 上下兩道各分兩段的長牆隔出三條射擊走廊，草叢 ×0.55。敵人只有精準射手、射手、照明兵、鏡盾兵與擲彈兵：生命 ×0.85、傷害 ×1.5、視距 ×1.35。 |
| `SP-TITANS` | ♛ 巨頭會戰 | 困難・暴雨 | 十字石牆分隔戰場。每 2 波出現一名首領，從第 6 波的蟲巢母體開始輪替；一般敵人數量 ×0.6。 |
| `SP-ELITE` | ♔ 精英獵場 | 困難・標準 | 14 根石柱排成網格。精英率 +70%（第 6 波約 81%），敵人數量 ×0.75，困難的精英隊長因此大量出現。 |
| `SP-GLASS` | ✧ 玻璃砲台 | 普通・標準 | 套用「脆弱戰場」（敵人生命 ×0.35、你承受的傷害 ×3）與「彈匣制」。你的生命上限 ×0.5；敵人移速 ×1.1、數量 ×1.5。 |
| `SP-MAZE` | ⌗ 綠野迷宮 | 困難・暴雨 | 24 面石牆、10 面木牆、草叢 ×1.4，視野 300 px，並套用「盲區」。敵人只有隱匿兵、追獵犬、陷阱兵、突擊兵、高速兵與爆破兵：移速 ×1.1。 |
| `SP-HELLGATE` | ☠ 地獄之門 | 地獄・焦土 | 16 面石牆、8 面木牆。敵人生命 ×1.3、傷害 ×1.25、數量 ×1.3，精英率 +15%，每 4 波出現首領，並套用「永不鬆懈」「黑市溢價」。 |

## English

Bushwhack is a top-down survival shooter built with plain HTML5 Canvas and JavaScript, playable in Traditional Chinese, English and Japanese. Hide in the grass, sneak up for silent takedowns, or break through with six evolving guns, auto weapons and throwables. Pick a perk after every cleared wave; every 5 waves close a chapter with a boss, and wave 25 is the final operation. There is no backend, no account and no download. Each run generates a new, fully connected layout of walls, ponds and grass. It is made for desktop browsers with a keyboard and mouse; phones are not supported.

To play locally, run `python3 -m http.server 8000` in this folder and open `http://localhost:8000/` (English is the default language). Move with WASD, aim with the mouse and hold the left button to fire. `V` toggles auto-fire, `Space` uses your class skill, `F` performs a takedown and `B` opens the armory.

### Special maps

Type a code into the seed field on the start screen (case does not matter) and press Enter or Deploy, or open `https://bushwhack.yustellar.dev/?seed=<code>&lang=en`. While a code is typed, the threat line shows the map name and difficulty, and hovering over the seed field shows the full rules.

- Every special map starts at **wave 6**. You first make 3–4 perk picks and get extra gold, scrap and the crossbow, then follow the chapter operation map as usual up to wave 25.
- Each map fixes its own difficulty, weather and threat modifiers; your selected difficulty and threat modifiers are not used. The map keeps its weather through chapter changes; only the wooden walls are rebuilt.
- The map and every seeded roll (enemies, perks, events, the black market and so on) are fixed, so the same code gives the same content and scores can be compared with friends; combat and visual-effect randomness still varies.
- Special runs do not update difficulty records, chapter grades, threat records or clear counts, and cannot earn the wave, quiet-wave or clear achievements. Mastery XP counts only the waves you actually fought.

| Seed code | Map | Difficulty · weather | Features |
| --- | --- | --- | --- |
| `SP-FORTRESS` | ▣ Iron Fortress | Hard · Standard | Your spawn sits inside a stone ring with four gaps, and the field has 9 barrels. Only Shield Troopers, Juggernauts, Mirror Shields, Grenadiers, Field Medics and Assault troops appear: HP ×1.6, speed ×0.85, count ×0.8. Elite chance +10%, and every elite is Armored. |
| `SP-SWARM` | ⋙ Swarm Tide | Normal · Downpour | Open ground with only 4 stone walls, 2 wooden walls and grass ×0.6. Only Swarms, Runners, Tracker hounds, Kamikaze Drones and Assault troops appear: HP ×0.55, speed ×1.15, count ×2.4, spawn interval ×0.45. |
| `SP-NIGHT` | ☾ Endless Night | Hard · Night | 6 searchlight towers and grass ×1.3; your view is only 190 px, and Blind spot applies. Only Stalkers, Tracker hounds, Scout Drones, Sharpshooters, Flare Gunners and Kamikaze Drones appear: damage ×1.3, sight ×1.15. |
| `SP-INFERNO` | ♨ Inferno | Hard · Scorched | 16 barrels, 9 wooden walls and grass ×0.5, and Scorched earth applies. Only Flamers, Bombers, Grenadiers, Kamikaze Drones and Runners appear: damage ×1.4, count ×1.1. |
| `SP-ALLEY` | ⟶ Sniper Alley | Hard · Standard | Two long walls, each split in two, cut the field into three firing lanes; grass ×0.55. Only Sharpshooters, Gunners, Flare Gunners, Mirror Shields and Grenadiers appear: HP ×0.85, damage ×1.5, sight ×1.35. |
| `SP-TITANS` | ♛ Clash of Titans | Hard · Downpour | A stone cross divides the field. A boss arrives every 2 waves, rotating from the Hive Mother at wave 6; regular enemies ×0.6. |
| `SP-ELITE` | ♔ Elite Hunt | Hard · Standard | 14 stone pillars in a grid. Elite chance +70% (about 81% at wave 6) and enemy count ×0.75, so Hard's elite captains show up in numbers. |
| `SP-GLASS` | ✧ Glass Cannon | Normal · Standard | Brittle (enemy HP ×0.35, damage you take ×3) and Magazines apply. Your max HP ×0.5; enemy speed ×1.1, count ×1.5. |
| `SP-MAZE` | ⌗ Green Labyrinth | Hard · Downpour | 24 stone walls, 10 wooden walls and grass ×1.4; your view is 300 px, and Blind spot applies. Only Stalkers, Tracker hounds, Trappers, Assault troops, Runners and Bombers appear: speed ×1.1. |
| `SP-HELLGATE` | ☠ Gates of Hell | Hell · Scorched | 16 stone walls and 8 wooden walls. Enemy HP ×1.3, damage ×1.25, count ×1.3, elite chance +15%, and a boss every 4 waves. Never Relax and Markup apply. |

## 日本語

草叢突撃（Bushwhack）は、HTML5 Canvas と素の JavaScript で作られた見下ろし型のサバイバルシューティングです。繁体字中国語・英語・日本語で遊べます。草むらに潜んで背後から暗殺するか、進化する 6 丁の銃、自動兵器、投擲物で正面から突破しましょう。ウェーブを制圧するたびにパークを 1 つ選び、5 ウェーブごとの章末にはボスが待ち、ウェーブ 25 が最終作戦です。サーバー、アカウント、ダウンロードは不要です。出撃のたびに壁・池・草むらの配置が新しく生成され、歩ける範囲がつながっていることも確認されます。キーボードとマウスを使うデスクトップブラウザ向けで、スマートフォンには対応していません。

ローカルで遊ぶには、このフォルダで `python3 -m http.server 8000` を実行し、`http://localhost:8000/?lang=ja` を開きます。WASD で移動、マウスで照準、左ボタン長押しで射撃します。`V` でオート射撃の切り替え、`Space` で兵種スキル、`F` で暗殺、`B` で武器庫を開きます。

### 特殊マップ

スタート画面のシード欄にコードを入力し（大文字・小文字は区別しません）、Enter か「出撃」を押します。`https://bushwhack.yustellar.dev/?seed=<コード>&lang=ja` を開いても始められます。コードを入力すると脅威条件の行にマップ名と難易度が表示され、シード欄にマウスを乗せると詳しいルールが見られます。

- 特殊マップはすべて**ウェーブ 6** から始まります。最初にパークを 3～4 回続けて選び、追加のゴールド・スクラップとクロスボウを受け取ります。その後は通常どおり章の作戦マップを進み、ウェーブ 25 まで戦います。
- 難易度・天候・脅威条件はマップごとに固定され、自分で選んだ難易度と脅威条件は使われません。章が変わっても天候は変わらず、木の壁だけが作り直されます。
- マップとシード乱数を使う抽選（敵、パーク、イベント、闇市など）は固定なので、同じコードなら同じ内容になり、友達とスコアを比べられます。戦闘や演出のランダム結果は毎回変わります。
- 特殊マップでは難易度別の記録、章の評価、脅威記録、クリア回数は更新されず、ウェーブ・無音ウェーブ・クリア系の実績も達成できません。熟練度は実際に戦ったウェーブ分だけ加算されます。

| シードコード | マップ | 難易度・天候 | 特徴 |
| --- | --- | --- | --- |
| `SP-FORTRESS` | ▣ 鉄壁要塞 | ハード・標準 | 出撃地点は四つの切れ目がある石壁の輪の中にあり、爆発樽が 9 個あります。敵はシールド兵、重装兵、鏡盾兵、擲弾兵、衛生支援兵、突撃兵のみ：体力 ×1.6、移動速度 ×0.85、数 ×0.8。エリート率 +10% で、エリートはすべて装甲持ちです。 |
| `SP-SWARM` | ⋙ 蟲の大群 | ノーマル・豪雨 | 石壁 4 枚、木の壁 2 枚、草むら ×0.6 の開けた戦場です。敵は群体、高速兵、追跡犬、自爆ドローン、突撃兵のみ：体力 ×0.55、移動速度 ×1.15、数 ×2.4、出現間隔 ×0.45。 |
| `SP-NIGHT` | ☾ 永夜 | ハード・夜戦 | サーチライト塔 6 基、草むら ×1.3。視界はわずか 190 px で、「死角」が適用されます。敵は隠密兵、追跡犬、偵察機、精密射手、照明兵、自爆ドローンのみ：ダメージ ×1.3、視界 ×1.15。 |
| `SP-INFERNO` | ♨ 焦土煉獄 | ハード・焦土 | 爆発樽 16 個、木の壁 9 枚、草むら ×0.5 で、「永久焦土」が適用されます。敵は火炎兵、爆破兵、擲弾兵、自爆ドローン、高速兵のみ：ダメージ ×1.4、数 ×1.1。 |
| `SP-ALLEY` | ⟶ 狙撃回廊 | ハード・標準 | 二つに分かれた長い壁が上下に 2 本あり、戦場を 3 本の射撃レーンに分けます。草むら ×0.55。敵は精密射手、射手、照明兵、鏡盾兵、擲弾兵のみ：体力 ×0.85、ダメージ ×1.5、視界 ×1.35。 |
| `SP-TITANS` | ♛ 巨頭決戦 | ハード・豪雨 | 石の十字が戦場を仕切ります。2 ウェーブごとにボスが現れ、ウェーブ 6 のハイヴマザーから順に交代します。通常の敵は ×0.6。 |
| `SP-ELITE` | ♔ 精鋭狩り | ハード・標準 | 石柱 14 本が格子状に並びます。エリート率 +70%（ウェーブ 6 で約 81%）、敵の数 ×0.75 のため、ハードのエリート隊長が大量に現れます。 |
| `SP-GLASS` | ✧ ガラスの砲台 | ノーマル・標準 | 「脆い戦場」（敵の体力 ×0.35、被ダメージ ×3）と「弾倉制」が適用されます。自分の最大体力 ×0.5、敵の移動速度 ×1.1、数 ×1.5。 |
| `SP-MAZE` | ⌗ 緑の迷宮 | ハード・豪雨 | 石壁 24 枚、木の壁 10 枚、草むら ×1.4。視界 300 px で、「死角」が適用されます。敵は隠密兵、追跡犬、罠師、突撃兵、高速兵、爆破兵のみ：移動速度 ×1.1。 |
| `SP-HELLGATE` | ☠ 地獄の門 | ヘル・焦土 | 石壁 16 枚、木の壁 8 枚。敵の体力 ×1.3、ダメージ ×1.25、数 ×1.3、エリート率 +15%、4 ウェーブごとにボス。「油断なし」「闇市の値上げ」が適用されます。 |

---

以下的開發、部署與版本說明以繁體中文撰寫。

## 開始遊玩

在本目錄執行 `python3 -m http.server 8000`，瀏覽 `http://localhost:8000/`（英文，預設語系）、`/?lang=zh-Hant`（中文）、`/?lang=ja`；也可直接開啟 `index.html`。右上角切換語系不會重新載入頁面，進行中的遊戲會保留。可離線遊玩；字型服務無法連線時會使用系統字型。

| 操作 | 按鍵 |
| --- | --- |
| 移動 | WASD 或方向鍵 |
| 潛行步（55% 移速） | 按住 Shift |
| 瞄準／連續射擊 | 滑鼠移動／按住左鍵 |
| 切換槍械 | 1–6、Q 或滑鼠滾輪 |
| 兵種技能（翻滾／地雷／鐵壁／專注／急救） | Space |
| 暗殺（背後或未察覺的敵人） | F |
| 自動開火（開關；開啟時不必按住左鍵，槍會持續朝準星射擊） | V |
| 投擲／切換投擲物（誘餌、煙霧彈、手榴彈、燃燒瓶） | G／T |
| 軍械庫（槍械／強化／配件／自動武器／裝備／投擲物／進化） | B 或右側「軍械庫」按鈕；Esc 關閉 |
| 與黑市商人交易（靠近時） | E；Esc 離開 |
| 音樂／音效開關 | M／N，或側欄「設定」（可調音量） |
| 撤離或繼續、選擇天賦 | 數字鍵或點擊 |
| 章節作戰地圖 | J／K／L 或點擊 |
| 換彈（威脅條件「彈匣制」） | R |
| 天賦重抽／放逐／跳過（天賦視窗） | R／X／C |

頁面停用瀏覽器的右鍵選單；滑鼠右鍵在遊戲中沒有功能。

擊倒敵人或射爆寶箱，走近拾取金幣與零件，在軍械庫購買槍械（衝鋒槍、霰彈槍、可貫穿的電磁步槍）、共用武器強化、自動武器（護衛無人機、環繞刃、追蹤飛彈、電弧線圈）與戰術裝備（頭盔、防彈背心、能量護盾、戰靴、急救包）。自動武器不會暴露位置，但身處草叢時會停火（環繞刃除外）。能量護盾只在躲進草叢且未開火時緩慢充能。敵人有突擊兵、射手、高速兵、正面持盾的護盾兵、遠處隱形且能察覺近處草叢的隱匿兵，以及點燃引信後自爆的高傷害爆破兵，後期波次數量與補兵速度持續增加。連貫的草叢群隱藏玩家，開火後短暫暴露；牆壁擋人擋子彈，水潭移動減速。音效與 8-bit 背景音樂皆由 WebAudio 即時合成。擊倒當波所有敵人後下一波開始；HP 歸零可重新出擊。

每清空一波可從 3 個天賦中選 1（可疊層），也可花零件重抽、每局放逐兩項，或跳過取得 30 金幣；清波另依持有金幣發放利息。每 5 波一章，作戰地圖以相鄰分支串起殲滅、滲透、精英、補給與首領行動。每章換場時草叢恢復（永久焦土除外）、木牆重建並輪替天氣，石牆與水潭保留。第 4 波起有帶詞綴的精英敵人。開始畫面可選普通／困難／地獄難度或每日挑戰；紀錄只存在本機瀏覽器的 `localStorage`。

潛行：噪音圈顯示槍聲、爆炸與誘餌的影響範圍；敵人有方向視野與懷疑值，失去視線後搜索最後目擊點。屍體留存 20 秒，草叢可以遮藏；追蹤犬會沿最近足跡追查，水潭、煙霧與誘餌可用來擺脫牠。通訊兵會奔向可破壞的通訊站發出警報。首領依序為重裝指揮官、幽靈狙擊手、蟲巢母體與焚化官，第 25 波仍是最終指揮官。敵方子彈、爆炸與酸液會誤傷同伴；草火可蔓延但無法越過水潭，燃燒瓶可製造火區，水中敵人更慢且會承受更強的電弧連鎖。六把槍各有進化配方：達標後擊倒首領、隊長或精英行動中的精英即可解鎖，條件與效果可在軍械庫「進化」查閱。

結算畫面可「複製戰績」文字，或「下載戰績卡」取得 1200×630 PNG 圖片（本機產生，不上傳）。

後期兵種：第 13–22 波加入干擾兵（EMP 停擺自動武器與護盾回充）、擲彈兵、精準射手、掠奪者、戰旗兵、鏡盾兵、蜂群、陷阱兵、自爆無人機與重裝兵，所有難度都會出現；第 15 波起敵人 HP 成長加速、早期兵種比例下降、精英機率上限提高。

v1.3：軍械庫新增無聲、可撿回箭矢的十字弩與範圍爆炸的榴彈發射器（共 6 把槍）。地圖多了可被子彈與爆炸打穿的木牆，夜戰地圖有會掃射的探照燈塔（照到時無法隱匿並會引來敵人，可射滅）。每擊倒一名首領可選擇撤離（分數 +25%、記錄最佳撤離波次）或繼續；每波有一個可選的挑戰（不被發現、毫髮無傷、暗殺、伏擊擊殺），達成可得獎勵與分數；部分波次會出現黑市商人，販售稀有天賦、半價強化與補給。新增 8 項成就，可解鎖神射手、醫護兵兩個兵種、角色外觀與開局獎勵。一般出擊的結算會顯示地圖種子碼，在開始畫面輸入同一組種子即可重玩同一張地圖與同樣的抽選；「複製戰績」在一般出擊也可使用（附種子碼）。

v1.4：第 2 波的情報任務可選「送達撤離點」或「殲滅全部敵人」兩種通關方式；槍聲與被發現會累積跨波的警戒值，警戒越高，下一波敵人的視野、巡邏與偵察越強，無聲清波可降低警戒。前兩波有潛行教學提示，第 2 波起送十字弩。之後新增兩種進化天賦（暗影回收、獵手蓄勢），以及第 6 波起會治療周圍友軍的醫護支援兵（指揮官第二階段也會召喚）。

長期目標：突變改為有點數、可自由組合的「威脅等級」（新增精英部署、永不鬆懈、首領前線、黑市溢價，以及靠威脅紀錄解鎖的夜襲、鋼鐵蜂群），並記錄每個難度與兵種的最高撤離威脅。每個兵種有 1–10 級熟練度，LV.2 起技能產生新變化、LV.4／8 解鎖外觀。開始畫面的「進度」面板列出每週 3 個合約、成就，以及記錄見過內容的情報檔案；每日挑戰按鈕顯示連續出擊天數。第 25 波是最終行動，擊倒強化指揮官即通關並提高威脅上限；里程碑另解鎖新天賦「以牙還牙」「再起」與事件「訊號干擾器」。結算畫面會列出最接近完成的 3 個目標。

挑戰與成就感：困難與地獄會啟用嚴苛機制——自動武器過熱、按主題編組的敵軍、帶護衛的精英隊長、第二階段針對你打法反制的首領，以及拖太久就會來的增援；普通與每日挑戰不受影響。每場首領戰附帶一個任務（守住通訊站、護送情報員、摧毀雷達），完成有獎勵，困難以上失敗會取消該波撤離加成。每 5 波一章，章末依時間、被發現次數、受傷量與任務給 S–C 評價並頒發無傷／無聲／速攻徽章。結算畫面顯示戰後分析（最大傷害來源、被發現次數、最後幾擊與建議），整備倒數時預告下一波敵情。另新增三種詛咒天賦、「暴露」「閃擊」兩條路線、四項規則類威脅條件（彈匣制、永久焦土、單命護盾、盲區），以及進度面板中的首領訓練場與每週種子挑戰；分享戰績附帶可直接填入種子的連結。

新增嚴苛懲罰同樣只限困難／地獄：涉水噪音、敵人延遲呼喊、發現屍體加警戒、通訊站增援、滲透警報增援，以及草火／燃燒瓶對玩家的傷害；普通與每日挑戰不啟用這些懲罰。

詳細平衡數值與狀態流程見 [DESIGN.md](DESIGN.md)；唯一的實際設定區塊位於 `game.js` 開頭的 `CONFIG`，介面文字位於 `i18n.js`。

## 多語系、Sitemap 與快取版本

`index.html` 與 `sitemap.xml` 由 `tools/index.template.html` 與 `i18n.js` 產生，請勿手動編輯。頁面預填英文（預設語系），其他語系由 `game.js` 依 `?lang=` 在執行期替換；`sitemap.xml` 列出 `/`、`/?lang=zh-Hant`、`/?lang=ja` 並附 `hreflang` 對應，`robots.txt` 指向該 sitemap。頁面內所有連結與資源引用（圖示、樣式、腳本、canonical、`hreflang`、`og:url`、分享圖）都是相對路徑，可部署在任何網域或子路徑；只有 `sitemap.xml` 與 `robots.txt` 依規範使用 `https://bushwhack.yustellar.dev/` 絕對網址。頁面以內容雜湊引用 `style.css?v=…`、`i18n.js?v=…`、`game.js?v=…` 與瀏覽器圖示，瀏覽器與 CDN 在檔案變更後會取得新版。修改範本、`i18n.js`、`game.js`、`style.css` 或圖示後、提交前執行：

```sh
node tools/build-pages.mjs
```

新增語系：在 `i18n.js` 加入含 `label`、`ogLocale`、`page`、`game` 的項目後重新建置（sitemap 與切換連結會自動加入）；缺少任何鍵值時腳本會中止並列出。新增其他 HTML 頁面時，也要將其加入建置腳本的 sitemap 輸出。

## GitHub Pages + Cloudflare

1. 推送本儲存庫至 [`YueyuHoshizora/bushwhack`](https://github.com/YueyuHoshizora/bushwhack)；在 **Settings → Pages → Build and deployment** 選擇 **Deploy from a branch**，分支 `main`、目錄 `/ (root)`。在 Pages 設定確認自訂網域為 `bushwhack.yustellar.dev`，並啟用 HTTPS；儲存庫根目錄已含對應 `CNAME`。
2. 在 Cloudflare 的 `yustellar.dev` DNS 新增 `bushwhack` CNAME，目標為 `yueyuhoshizora.github.io`；先使用 **DNS only**（灰雲）完成 GitHub Pages 的網域驗證及憑證簽發，再改為 **Proxied**（橘雲）提供 CDN 快取。Cloudflare SSL/TLS 模式選 **Full (strict)**，避免 Flexible 引起重導迴圈。
3. 開啟 `https://bushwhack.yustellar.dev/`，確認遊戲與分享圖片可載入。推送程式碼不會自動完成 GitHub Pages 啟用或 Cloudflare DNS 設定。

遊戲檔案使用相對路徑；Cloudflare 僅代理／快取靜態檔案，不需要 Workers、API 或伺服器。根目錄的空檔 `.nojekyll` 讓 GitHub Pages 跳過 Jekyll、直接發布檔案（Markdown 文件含 `{{…}}` 範本語法，交給 Jekyll 會建置失敗），請勿刪除。`index.html` 本身若仍被快取成舊版，清除 Cloudflare 對 `/` 的快取。Cloudflare 快取規則需將查詢字串納入快取鍵（預設即是），或忽略 `lang` 參數皆可，因為三個語系回傳相同 HTML。

## 分享預覽

頁面含 Open Graph／X（Twitter）大型圖片標籤，分享封面為 `assets/og-cover.png`（1200 × 630）；可編輯 `assets/og-cover.svg` 後重新輸出 PNG。`og:url`、canonical 與 `og:image`／`twitter:image` 皆為相對路徑。Open Graph 規範要求絕對網址，部分社群平台的爬蟲可能因此無法顯示預覽圖或正確網址。遊戲內「複製戰績」的連結以目前頁面網址產生。

瀏覽器圖示原稿為 `assets/favicon.svg`，另輸出 `favicon.ico`（16／32／48 px）與 `assets/apple-touch-icon.png`（180 × 180）；修改圖示後重新執行 `node tools/build-pages.mjs` 更新引用雜湊。

## 授權

Copyright © 2026 YueyuHoshizora。採用 [GNU AGPL 第三版](LICENSE)（SPDX：`AGPL-3.0-only`），不含「或任何更新版本」授權。程式不提供任何擔保；使用、修改及再散布須遵守授權全文。網站頁尾提供授權與公開原始碼連結。
