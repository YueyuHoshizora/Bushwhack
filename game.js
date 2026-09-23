(() => {
'use strict';
// All gameplay and balance values live here. Rendering-only colors and layout live below.
const CONFIG = Object.freeze({
  world: { width: 1800, height: 1200, grid: 30, walls: 11, wallWidth: [72, 128], wallHeight: [48, 88], ponds: { clusters: 4, pieces: [2, 4], size: [80, 130] }, bushes: { clusters: 8, pieces: [3, 6], size: [72, 118] }, clusterReach: 0.62, terrainGap: 20, spawnClearance: 200, borderMargin: 16, placementMargin: 42, spawnMargin: 65, terrainSpawnPadding: 12, chestSpacing: 65, placementAttempts: 250, spawnAttempts: 400 },
  player: { hp: 100, radius: 15, speed: 245, invulnerability: 0.65, pickupRadius: 40, waterMultiplier: 0.5, revealSeconds: 2.4, shieldRegenDelay: 3, shieldRegenRate: 9 },
  gun: { damage: 18, shotsPerSecond: 3.3, pellets: 1, spreadRadians: 0.14, range: 480, bulletSpeed: 800, bulletRadius: 4, damageStep: 6, rateStep: 0.65, rangeStep: 90 },
  enemies: {
    melee: { title: '突擊兵', hp: 42, speed: 94, radius: 16, sight: 305, reach: 30, damage: 9, cooldown: 1.05, wanderSpeed: 0.45, bounty: 1, color: '#e99c77' },
    ranged: { title: '射手', hp: 32, speed: 76, radius: 15, sight: 365, reach: 270, damage: 8, cooldown: 1.9, projectileSpeed: 310, projectileRadius: 5, retreatRatio: 0.52, retreatSpeed: 0.65, wanderSpeed: 0.35, bounty: 1.1, color: '#c4a7db' },
    runner: { title: '高速兵', hp: 24, speed: 178, radius: 12, sight: 340, reach: 26, damage: 6, cooldown: 0.7, wanderSpeed: 0.55, weave: 0.55, weaveSpeed: 7, bounty: 1, color: '#f0d36b' },
    shield: { title: '護盾兵', hp: 64, speed: 66, radius: 18, sight: 300, reach: 32, damage: 13, cooldown: 1.25, wanderSpeed: 0.4, turnRate: 1.7, shieldHp: 90, shieldArc: 1.15, bounty: 1.8, color: '#8fb3c9' },
    wanderInterval: [1.8, 3.6], alertSeconds: 0.28, loseTargetSeconds: 2.5, bushRevealDistance: 110, healthPerWave: 0.14, damagePerWave: 0.095
  },
  waves: {
    baseCount: 2, growth: 2, lateFrom: 5, lateGrowth: 2, maxCount: 64, maxAlive: 34,
    spawnInterval: 0.72, spawnIntervalStep: 0.035, minSpawnInterval: 0.3, batchEvery: 4, maxBatch: 3,
    intermission: 3.5, initialSpawnDelay: 0.5, enemySpawnDistance: 330,
    // Relative spawn weight per kind: weight + (wave - from) × perWave, capped at max.
    roster: [
      { kind: 'melee', from: 1, weight: 1, perWave: 0, max: 1 },
      { kind: 'ranged', from: 2, weight: 0.35, perWave: 0.04, max: 0.9 },
      { kind: 'runner', from: 3, weight: 0.3, perWave: 0.04, max: 0.8 },
      { kind: 'shield', from: 4, weight: 0.22, perWave: 0.035, max: 0.7 }
    ]
  },
  chests: { minimum: 2, maximum: 4, initial: 3, radius: 23, hpBase: 23, hpPerWave: 3, replenishSeconds: 5, spawnDistance: 130 },
  loot: { coinEnemy: [3, 6], coinChest: [8, 13], scrapEnemyChance: 0.38, scrapChest: [1, 2], healChestChance: 0.28, healAmount: 18, pickupLifetime: 30 },
  upgrades: {
    damage: { title: '高能彈頭', icon: '✦', description: '每發傷害 +6', max: 5, gold: 12, scrap: 1, goldStep: 10, scrapStep: 1 },
    rate: { title: '急速槍機', icon: '≋', description: '每秒射擊 +0.65 發', max: 5, gold: 14, scrap: 1, goldStep: 11, scrapStep: 1 },
    spread: { title: '多重槍管', icon: '❖', description: '每次射擊 +1 發散射彈', max: 5, gold: 18, scrap: 2, goldStep: 15, scrapStep: 1 },
    range: { title: '長程瞄具', icon: '⌖', description: '射程 +90', max: 5, gold: 11, scrap: 1, goldStep: 9, scrapStep: 1 }
  },
  gear: {
    helmet: { title: '戰術頭盔', icon: '◓', description: '受到傷害 -10%', max: 3, gold: 20, scrap: 2, goldStep: 16, scrapStep: 1, reduction: 0.1 },
    vest: { title: '防彈背心', icon: '▣', description: '最大生命 +25，並補上增加量', max: 3, gold: 22, scrap: 2, goldStep: 16, scrapStep: 1, hp: 25 },
    shield: { title: '能量護盾', icon: '◈', description: '護盾容量 +20，先於生命承受傷害；3 秒未受傷自動充能', max: 3, gold: 26, scrap: 3, goldStep: 18, scrapStep: 2, capacity: 20 },
    boots: { title: '輕量戰靴', icon: '➶', description: '移動速度 +8%', max: 3, gold: 16, scrap: 1, goldStep: 12, scrapStep: 1, speed: 0.08 },
    medkit: { title: '急救包', icon: '✚', description: '立即恢復 40 生命（可重複購買）', consumable: true, gold: 15, scrap: 0, heal: 40 }
  },
  audio: { master: 0.5, music: 0.3, sfx: 0.7, duck: 0.35, tempo: 140, falloff: 900 }
});
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d'), arena = $('arena');
const UI = { start: $('startOverlay'), shop: $('shopOverlay'), end: $('endOverlay'), toast: $('toast') };
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pointIn = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const circleRect = (x, y, radius, r) => Math.hypot(x - clamp(x, r.x, r.x + r.w), y - clamp(y, r.y, r.y + r.h)) < radius;
const overlap = (a, b, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
const rectCenter = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const worldCenter = { x: CONFIG.world.width / 2, y: CONFIG.world.height / 2 };
const game = { mode: 'menu', wave: 1, walls: [], ponds: [], bushes: [], enemies: [], bullets: [], chests: [], loot: [], particles: [], keys: new Set(), mouse: { x: 0, y: 0, down: false, active: false }, player: null, kills: 0, earned: 0, waveRemaining: 0, spawnTimer: 0, nextWave: 0, chestTimer: 0, time: 0, flash: 0, shake: 0, toastUntil: 0 };
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
// Chiptune synth: every sound is generated with WebAudio oscillators and a noise buffer; no audio files.
const sound = (() => {
  const A = CONFIG.audio, keys = { music: 'bushwhack-music', sfx: 'bushwhack-sfx' };
  const load = key => { try { return localStorage.getItem(key) !== 'off'; } catch { return true; } };
  const loadVolume = key => { try { const v = Number(localStorage.getItem(`${key}-volume`) ?? 100); return Number.isFinite(v) ? clamp(v, 0, 100) : 100; } catch { return 100; } };
  const enabled = { music: load(keys.music), sfx: load(keys.sfx) };
  const volume = { music: loadVolume(keys.music), sfx: loadVolume(keys.sfx) };
  let ac = null, master, musicBus, sfxBus, noise, pulse25, pulse12, timer = 0, step = 0, nextTime = 0, mode = 'stop';
  const lastPlayed = {};
  const midi = n => 440 * 2 ** ((n - 69) / 12);
  // A minor loop, 8 bars of 16ths: i–VI–III–VII. Chord = [bass root, arpeggio notes…]; lead = [step, midi note, length in 16ths].
  const chords = [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]];
  const lead = [
    [[0, 69, 2], [2, 72, 2], [4, 76, 3], [8, 74, 2], [10, 72, 2], [12, 69, 4]],
    [[0, 65, 2], [2, 69, 2], [4, 72, 3], [8, 74, 2], [10, 72, 2], [12, 77, 4]],
    [[0, 76, 2], [2, 79, 2], [4, 76, 2], [6, 72, 2], [8, 74, 4], [12, 72, 2], [14, 74, 2]],
    [[0, 71, 3], [4, 74, 3], [8, 79, 4], [12, 74, 2], [14, 71, 2]],
    [[0, 81, 1], [1, 79, 1], [2, 76, 2], [4, 81, 2], [6, 79, 2], [8, 76, 2], [10, 74, 2], [12, 76, 4]],
    [[0, 77, 1], [1, 76, 1], [2, 72, 2], [4, 77, 2], [6, 76, 2], [8, 72, 2], [10, 69, 2], [12, 72, 4]],
    [[0, 72, 2], [2, 74, 2], [4, 76, 2], [6, 79, 2], [8, 84, 4], [12, 79, 4]],
    [[0, 83, 2], [2, 81, 2], [4, 79, 2], [6, 74, 2], [8, 71, 4], [12, 76, 2], [14, 80, 2]]
  ];
  const leadSteps = new Array(lead.length * 16).fill(null);
  lead.forEach((bar, i) => { for (const [at, note, len] of bar) leadSteps[i * 16 + at] = [note, len]; });
  function pulseWave(duty) {
    const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) real[i] = 2 * Math.sin(Math.PI * i * duty) / (Math.PI * i);
    return ac.createPeriodicWave(real, imag);
  }
  function tone(bus, { type = 'square', wave, from, to = from, at, dur, vol }) {
    const osc = ac.createOscillator(), gain = ac.createGain();
    if (wave) osc.setPeriodicWave(wave); else osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + dur);
    gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(vol, at + .005); gain.gain.exponentialRampToValueAtTime(.0001, at + dur);
    osc.connect(gain).connect(bus); osc.start(at); osc.stop(at + dur + .02);
  }
  function hiss(bus, { at, dur, vol, filter = 'highpass', freq = 1000 }) {
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), gain = ac.createGain();
    src.buffer = noise; f.type = filter; f.frequency.value = freq;
    gain.gain.setValueAtTime(vol, at); gain.gain.exponentialRampToValueAtTime(.0001, at + dur);
    src.connect(f).connect(gain).connect(bus); src.start(at, Math.random() * .5); src.stop(at + dur + .02);
  }
  const notes = (bus, list, at, gap, dur, vol, wave) => list.forEach((n, i) => tone(bus, { wave, type: 'square', from: midi(n), at: at + i * gap, dur, vol }));
  const SFX = {
    shoot: (t, v) => { tone(sfxBus, { wave: pulse25, from: 1100, to: 240, at: t, dur: .08, vol: .22 * v }); hiss(sfxBus, { at: t, dur: .05, vol: .1 * v, freq: 2500 }); },
    enemyShot: (t, v) => tone(sfxBus, { wave: pulse12, from: 640, to: 300, at: t, dur: .1, vol: .13 * v }),
    hit: (t, v) => tone(sfxBus, { from: 330, to: 140, at: t, dur: .05, vol: .1 * v }),
    block: (t, v) => { tone(sfxBus, { from: 1800, to: 1450, at: t, dur: .05, vol: .08 * v }); hiss(sfxBus, { at: t, dur: .04, vol: .07 * v, freq: 5000 }); },
    shieldBreak: (t, v) => { hiss(sfxBus, { at: t, dur: .3, vol: .2 * v, freq: 2600 }); tone(sfxBus, { from: 1500, to: 200, at: t, dur: .28, vol: .12 * v }); },
    kill: (t, v) => { tone(sfxBus, { from: 520, to: 70, at: t, dur: .22, vol: .15 * v }); hiss(sfxBus, { at: t, dur: .18, vol: .13 * v, filter: 'lowpass', freq: 1800 }); },
    hurt: t => { tone(sfxBus, { type: 'sawtooth', from: 240, to: 70, at: t, dur: .2, vol: .2 }); hiss(sfxBus, { at: t, dur: .12, vol: .15, filter: 'lowpass', freq: 900 }); },
    shieldHit: t => tone(sfxBus, { type: 'triangle', from: 880, to: 1500, at: t, dur: .1, vol: .22 }),
    coin: t => notes(sfxBus, [83, 88], t, .05, .1, .1, pulse25),
    scrap: t => tone(sfxBus, { type: 'triangle', from: 660, to: 990, at: t, dur: .09, vol: .2 }),
    heal: t => notes(sfxBus, [72, 76, 79, 84], t, .05, .09, .08, pulse25),
    chest: t => notes(sfxBus, [72, 76, 79, 84, 88], t, .045, .08, .09, pulse25),
    buy: t => notes(sfxBus, [79, 83, 86, 91], t, .04, .08, .1, pulse12),
    wave: t => notes(sfxBus, [69, 73, 76, 81], t, .09, .14, .09, pulse25),
    gameOver: t => notes(sfxBus, [67, 64, 60, 55], t, .18, .3, .12, pulse25)
  };
  function playStep(s, t, len) {
    const bar = s >> 4, beat = s & 15, chord = chords[bar % 4], note = leadSteps[s];
    if (beat % 2 === 0) tone(musicBus, { type: 'triangle', from: midi(chord[0] + (beat % 4 ? 12 : 0)), at: t, dur: len * 1.8, vol: .42 });
    tone(musicBus, { wave: pulse12, from: midi(chord[1 + beat % 3] + (bar >= 4 ? 12 : 0)), at: t, dur: len * .8, vol: .035 });
    if (note) tone(musicBus, { wave: pulse25, from: midi(note[0]), at: t, dur: len * note[1] * .95, vol: .12 });
    if (beat === 0 || beat === 8 || (bar % 2 && beat === 10)) tone(musicBus, { type: 'sine', from: 150, to: 45, at: t, dur: .13, vol: .55 });
    if (beat === 4 || beat === 12) hiss(musicBus, { at: t, dur: .12, vol: .2, filter: 'bandpass', freq: 1800 });
    if (beat % 2 === 0) hiss(musicBus, { at: t, dur: .03, vol: .06, freq: 7000 });
  }
  function schedule() {
    const len = 15 / A.tempo;
    if (nextTime < ac.currentTime - .2) nextTime = ac.currentTime + .05;
    while (nextTime < ac.currentTime + .15) { playStep(step, nextTime, len); step = (step + 1) % leadSteps.length; nextTime += len; }
  }
  function applyMusic() {
    if (!ac) return;
    const active = enabled.music && volume.music > 0 && mode !== 'stop';
    musicBus.gain.cancelScheduledValues(ac.currentTime);
    musicBus.gain.setTargetAtTime(active ? A.music * volume.music / 100 * (mode === 'duck' ? A.duck : 1) : 0, ac.currentTime, .08);
    sfxBus.gain.setTargetAtTime(A.sfx * volume.sfx / 100, ac.currentTime, .02);
    if (active && !timer) { step = 0; nextTime = ac.currentTime + .06; timer = setInterval(schedule, 25); }
    else if (!active && timer) { clearInterval(timer); timer = 0; }
  }
  function init() {
    if (ac) { if (ac.state === 'suspended' && !document.hidden) ac.resume(); return; }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    ac = new Context();
    master = ac.createGain(); master.gain.value = A.master; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = A.sfx * volume.sfx / 100; sfxBus.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    pulse25 = pulseWave(.25); pulse12 = pulseWave(.125);
    document.addEventListener('visibilitychange', () => { if (document.hidden) ac.suspend(); else ac.resume(); });
  }
  function play(name, source) {
    if (!ac || !enabled.sfx || !volume.sfx || ac.state !== 'running') return;
    const now = ac.currentTime;
    if (now - (lastPlayed[name] ?? -1) < .03) return;
    let level = 1;
    if (source && game.player) { level = 1 - distance(source, game.player) / A.falloff; if (level <= .05) return; }
    lastPlayed[name] = now; SFX[name](now, level);
  }
  function music(next) { mode = next; applyMusic(); }
  function toggle(kind) {
    init(); enabled[kind] = !enabled[kind];
    try { localStorage.setItem(keys[kind], enabled[kind] ? 'on' : 'off'); } catch {}
    applyMusic(); return enabled[kind];
  }
  function setVolume(kind, percent) {
    volume[kind] = clamp(Math.round(percent), 0, 100);
    try { localStorage.setItem(`${keys[kind]}-volume`, volume[kind]); } catch {}
    applyMusic();
  }
  return { init, play, music, toggle, setVolume, enabled, volume };
})();
function passable(x, y, radius) {
  const margin = CONFIG.world.borderMargin;
  return x >= radius + margin && y >= radius + margin && x <= CONFIG.world.width - radius - margin && y <= CONFIG.world.height - radius - margin && !game.walls.some(r => circleRect(x, y, radius, r));
}
function connected(walls) {
  const step = CONFIG.world.grid, cols = Math.floor(CONFIG.world.width / step), rows = Math.floor(CONFIG.world.height / step);
  const blocked = new Uint8Array(cols * rows), visited = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const px = (x + .5) * step, py = (y + .5) * step, edge = CONFIG.player.radius + CONFIG.world.borderMargin;
    if (px < edge || py < edge || px > CONFIG.world.width - edge || py > CONFIG.world.height - edge || walls.some(r => circleRect(px, py, CONFIG.player.radius + 2, r))) blocked[y * cols + x] = 1;
  }
  let start = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
  if (blocked[start]) return false;
  const queue = new Int32Array(cols * rows); let head = 0, tail = 0;
  queue[tail++] = start; visited[start] = 1;
  while (head < tail) {
    const cell = queue[head++], x = cell % cols, y = (cell / cols) | 0;
    for (const n of [x > 0 ? cell - 1 : -1, x < cols - 1 ? cell + 1 : -1, y > 0 ? cell - cols : -1, y < rows - 1 ? cell + cols : -1]) {
      if (n >= 0 && !blocked[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
    }
  }
  return tail === blocked.length - blocked.reduce((sum, value) => sum + value, 0);
}
function generateMap() {
  const w = CONFIG.world;
  game.walls = []; game.ponds = []; game.bushes = [];
  const items = [];
  const fits = (rect, blockers) => rect.x >= w.placementMargin && rect.y >= w.placementMargin && rect.x + rect.w <= w.width - w.placementMargin && rect.y + rect.h <= w.height - w.placementMargin && distance(rectCenter(rect), worldCenter) >= w.spawnClearance && !blockers.some(other => overlap(rect, other, w.terrainGap));
  function addWalls() {
    for (let i = 0; i < w.walls; i++) {
      for (let attempt = 0; attempt < w.placementAttempts; attempt++) {
        const width = rand(...w.wallWidth), height = rand(...w.wallHeight);
        const rect = { x: rand(w.placementMargin, w.width - width - w.placementMargin), y: rand(w.placementMargin, w.height - height - w.placementMargin), w: width, h: height };
        if (!fits(rect, items) || !connected([...game.walls, rect])) continue;
        game.walls.push(rect); items.push(rect); break;
      }
    }
  }
  // Bushes and ponds grow as clusters of overlapping pieces, forming continuous patches and corridors.
  function addClusters(type, { clusters, pieces, size }) {
    for (let c = 0; c < clusters; c++) {
      const cluster = [], target = Math.floor(rand(pieces[0], pieces[1] + 1));
      for (let attempt = 0; attempt < w.placementAttempts && cluster.length < target; attempt++) {
        const pw = rand(...size), ph = rand(...size);
        let rect;
        if (!cluster.length) rect = { x: rand(w.placementMargin, w.width - pw - w.placementMargin), y: rand(w.placementMargin, w.height - ph - w.placementMargin), w: pw, h: ph };
        else {
          const base = cluster[Math.floor(Math.random() * cluster.length)], center = rectCenter(base), a = Math.floor(rand(0, 4)) * Math.PI / 2 + rand(-.45, .45);
          const cx = center.x + Math.cos(a) * (base.w + pw) / 2 * w.clusterReach, cy = center.y + Math.sin(a) * (base.h + ph) / 2 * w.clusterReach;
          rect = { x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph };
        }
        if (fits(rect, items)) cluster.push(rect);
      }
      game[type].push(...cluster); items.push(...cluster);
    }
  }
  addWalls();
  addClusters('ponds', w.ponds);
  addClusters('bushes', w.bushes);
}
function freeSpot(radius, minDistance, avoidTerrain = false) {
  for (let attempt = 0; attempt < CONFIG.world.spawnAttempts; attempt++) {
    const margin = CONFIG.world.spawnMargin, x = rand(margin, CONFIG.world.width - margin), y = rand(margin, CONFIG.world.height - margin);
    if (!passable(x, y, radius) || distance({ x, y }, game.player) < minDistance) continue;
    if (avoidTerrain && [...game.ponds, ...game.bushes].some(r => circleRect(x, y, radius + CONFIG.world.terrainSpawnPadding, r))) continue;
    if (game.chests.some(c => distance(c, { x, y }) < radius + c.radius + CONFIG.world.chestSpacing)) continue;
    return { x, y };
  }
  return null;
}
function spawnChest() {
  const pos = freeSpot(CONFIG.chests.radius + 1, CONFIG.chests.spawnDistance, true);
  if (pos) game.chests.push({ ...pos, radius: CONFIG.chests.radius, hp: CONFIG.chests.hpBase + CONFIG.chests.hpPerWave * (game.wave - 1), maxHp: CONFIG.chests.hpBase + CONFIG.chests.hpPerWave * (game.wave - 1), hit: 0 });
}
function pickEnemyKind() {
  const pool = CONFIG.waves.roster.filter(r => game.wave >= r.from).map(r => [r.kind, Math.min(r.max, r.weight + (game.wave - r.from) * r.perWave)]);
  let roll = Math.random() * pool.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [kind, weight] of pool) if ((roll -= weight) < 0) return kind;
  return pool[0][0];
}
const waveScale = () => 1 + (game.wave - 1) * CONFIG.enemies.healthPerWave;
const enemyDamage = stats => Math.ceil(stats.damage * (1 + (game.wave - 1) * CONFIG.enemies.damagePerWave));
function spawnEnemy() {
  const pos = freeSpot(18, CONFIG.waves.enemySpawnDistance);
  if (!pos) return false;
  const kind = pickEnemyKind(), stats = CONFIG.enemies[kind];
  const hp = Math.round(stats.hp * waveScale()), shieldHp = Math.round((stats.shieldHp || 0) * waveScale());
  game.enemies.push({ ...pos, kind, radius: stats.radius, hp, maxHp: hp, shieldHp, maxShield: shieldHp, state: 'wander', direction: rand(-Math.PI, Math.PI), facing: Math.atan2(game.player.y - pos.y, game.player.x - pos.x), seed: rand(0, Math.PI * 2), wanderTime: rand(...CONFIG.enemies.wanderInterval), alertTime: 0, lost: 0, cooldown: rand(0, .6), hit: 0, blocked: 0 });
  return true;
}
function waveSize(wave) {
  const w = CONFIG.waves;
  return Math.min(w.maxCount, w.baseCount + wave * w.growth + Math.max(0, wave - w.lateFrom) * w.lateGrowth);
}
function startWave() {
  game.waveRemaining = waveSize(game.wave);
  game.spawnTimer = CONFIG.waves.initialSpawnDelay; game.nextWave = 0;
  const fresh = CONFIG.waves.roster.find(r => r.from === game.wave && r.from > 1);
  notify(fresh ? `第 ${game.wave} 波 · 新敵情：${CONFIG.enemies[fresh.kind].title}` : `第 ${game.wave} 波敵人來襲`);
  sound.play('wave');
}
function startGame() {
  sound.init();
  game.mode = 'playing'; game.time = 0; game.wave = 1; game.kills = 0; game.earned = 0;
  game.enemies = []; game.bullets = []; game.chests = []; game.loot = []; game.particles = [];
  game.keys.clear(); game.mouse.down = false; game.chestTimer = 0; game.flash = 0;
  const levels = Object.fromEntries([...Object.keys(CONFIG.upgrades), ...Object.keys(CONFIG.gear)].map(key => [key, 0]));
  game.player = { ...worldCenter, radius: CONFIG.player.radius, hp: CONFIG.player.hp, maxHp: CONFIG.player.hp, shield: 0, lastHurt: 0, gold: 0, scrap: 0, levels, cooldown: 0, invulnerable: 0, revealedUntil: 0, facing: 0 };
  generateMap();
  for (let i = 0; i < Math.min(CONFIG.chests.initial, CONFIG.chests.maximum); i++) spawnChest();
  UI.start.hidden = true; UI.end.hidden = true; UI.shop.hidden = true;
  sound.music('play'); startWave(); updateHUD();
}
function notify(text) { UI.toast.textContent = text; UI.toast.classList.add('show'); game.toastUntil = performance.now() + 1900; }
function gunStats() {
  const l = game.player.levels, g = CONFIG.gun;
  return { damage: g.damage + l.damage * g.damageStep, shotsPerSecond: g.shotsPerSecond + l.rate * g.rateStep, pellets: g.pellets + l.spread, range: g.range + l.range * g.rangeStep };
}
function gearStats() {
  const l = game.player.levels, g = CONFIG.gear;
  return { reduction: l.helmet * g.helmet.reduction, maxShield: l.shield * g.shield.capacity, speed: 1 + l.boots * g.boots.speed };
}
function itemCost(item, level) {
  return item.consumable ? { gold: item.gold, scrap: item.scrap } : { gold: item.gold + level * item.goldStep, scrap: item.scrap + level * item.scrapStep };
}
function purchase(key, item) {
  const p = game.player, level = p.levels[key], cost = itemCost(item, level);
  if (game.mode !== 'shop' || p.gold < cost.gold || p.scrap < cost.scrap) return;
  if (item.consumable ? p.hp >= p.maxHp : level >= item.max) return;
  p.gold -= cost.gold; p.scrap -= cost.scrap;
  if (key === 'medkit') { p.hp = Math.min(p.maxHp, p.hp + item.heal); notify(`${item.title}：生命恢復`); }
  else {
    p.levels[key]++;
    if (key === 'vest') { p.maxHp += item.hp; p.hp += item.hp; }
    if (key === 'shield') p.shield = gearStats().maxShield;
    notify(`${item.title}升級至 LV. ${p.levels[key]}`);
  }
  burst(p.x, p.y, '#e9e597', 17); sound.play('buy');
  updateHUD(); renderShop();
}
function shopRow(key, item) {
  const p = game.player, level = p.levels[key], cost = itemCost(item, level);
  const full = item.consumable ? p.hp >= p.maxHp : level >= item.max;
  const row = document.createElement('div'); row.className = 'upgrade';
  const info = document.createElement('div');
  info.innerHTML = `<div class="upgrade-title"><span class="upgrade-icon">${item.icon}</span>${item.title} <small>${item.consumable ? '消耗品' : `LV. ${level}/${item.max}`}</small></div><p>${item.description}</p>`;
  const button = document.createElement('button'); button.className = 'buy-btn';
  button.textContent = full ? (item.consumable ? '生命已滿' : '已達上限') : cost.scrap ? `${cost.gold} 金 / ${cost.scrap} 零件` : `${cost.gold} 金`;
  button.disabled = full || p.gold < cost.gold || p.scrap < cost.scrap;
  button.addEventListener('click', () => purchase(key, item));
  row.append(info, button); return row;
}
function renderShop() {
  const p = game.player;
  $('shopGold').textContent = p.gold; $('shopScrap').textContent = p.scrap;
  $('upgradeList').replaceChildren(...Object.entries(CONFIG.upgrades).map(([key, item]) => shopRow(key, item)));
  $('gearList').replaceChildren(...Object.entries(CONFIG.gear).map(([key, item]) => shopRow(key, item)));
}
function toggleShop() {
  if (game.mode === 'playing') { game.mode = 'shop'; game.mouse.down = false; renderShop(); UI.shop.hidden = false; sound.music('duck'); }
  else if (game.mode === 'shop') { game.mode = 'playing'; UI.shop.hidden = true; game.keys.clear(); sound.music('play'); }
}
const AUDIO_LABELS = { music: '♪ 音樂', sfx: '◉ 音效' };
function renderSettings() {
  for (const kind of ['music', 'sfx']) {
    const button = $(`${kind}Btn`), slider = $(`${kind}Volume`);
    button.textContent = `${AUDIO_LABELS[kind]} ${sound.enabled[kind] ? '開' : '關'}`; button.setAttribute('aria-pressed', sound.enabled[kind]);
    slider.value = sound.volume[kind]; slider.disabled = !sound.enabled[kind];
    $(`${kind}VolumeText`).textContent = `${sound.volume[kind]}%`;
  }
}
function updateHUD() {
  if (!game.player) return;
  const p = game.player, gun = gunStats(), gear = gearStats(), total = Object.keys(CONFIG.upgrades).reduce((sum, key) => sum + p.levels[key], 0);
  $('hpText').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('hpFill').style.width = `${100 * Math.max(0, p.hp) / p.maxHp}%`;
  $('shieldText').textContent = gear.maxShield ? `${Math.floor(p.shield)} / ${gear.maxShield}` : '未配備';
  $('shieldFill').style.width = `${gear.maxShield ? 100 * p.shield / gear.maxShield : 0}%`;
  $('waveText').textContent = String(game.wave).padStart(2, '0');
  $('wavePill').textContent = `WAVE ${String(game.wave).padStart(2, '0')} / ${game.nextWave ? '整備中' : '作戰中'}`;
  $('killsText').textContent = game.kills; $('goldText').textContent = p.gold; $('scrapText').textContent = p.scrap;
  $('damageStat').textContent = gun.damage; $('rateStat').textContent = `${gun.shotsPerSecond.toFixed(1)}/s`;
  $('spreadStat').textContent = gun.pellets; $('rangeStat').textContent = gun.range;
  $('armorStat').textContent = `${Math.round(gear.reduction * 100)}%`; $('speedStat').textContent = `${Math.round(gear.speed * 100)}%`;
  $('weaponTier').textContent = `FIELD STANDARD / LV. ${total}`;
  const hidden = isHidden();
  $('stealthText').textContent = hidden ? '狀態：草叢隱匿 · 敵人無法偵測' : inTerrain(p, game.bushes) ? '狀態：已暴露 · 停火後重新隱匿' : inTerrain(p, game.ponds) ? '狀態：涉水中 · 移動速度降低' : '狀態：暴露於戰場';
  $('fieldStatus').textContent = hidden ? '● CONCEALED / 隱匿' : `● HOSTILES ${game.enemies.length + game.waveRemaining}`;
}
function inTerrain(entity, terrain) { return terrain.some(r => pointIn(entity.x, entity.y, r)); }
function isHidden() { return !!game.player && inTerrain(game.player, game.bushes) && game.time >= game.player.revealedUntil; }
function move(entity, dx, dy) {
  if (passable(entity.x + dx, entity.y, entity.radius)) entity.x += dx;
  if (passable(entity.x, entity.y + dy, entity.radius)) entity.y += dy;
}
function lineRect(x1, y1, x2, y2, r) {
  let lo = 0, hi = 1, dx = x2 - x1, dy = y2 - y1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) { if (q < 0) return false; }
    else { const t = q / p; if (p < 0) lo = Math.max(lo, t); else hi = Math.min(hi, t); if (lo > hi) return false; }
  }
  return true;
}
function clearSight(a, b) { return !game.walls.some(r => lineRect(a.x, a.y, b.x, b.y, r)); }
function shoot() {
  const p = game.player, gun = gunStats(), angle = p.facing;
  p.cooldown = 1 / gun.shotsPerSecond;
  p.revealedUntil = game.time + CONFIG.player.revealSeconds;
  for (let i = 0; i < gun.pellets; i++) {
    const spread = (i - (gun.pellets - 1) / 2) * CONFIG.gun.spreadRadians;
    const a = angle + spread, x = p.x + Math.cos(a) * 21, y = p.y + Math.sin(a) * 21;
    game.bullets.push({ x, y, vx: Math.cos(a) * CONFIG.gun.bulletSpeed, vy: Math.sin(a) * CONFIG.gun.bulletSpeed, traveled: 0, range: gun.range, damage: gun.damage, radius: CONFIG.gun.bulletRadius, friendly: true });
  }
  burst(p.x + Math.cos(angle) * 23, p.y + Math.sin(angle) * 23, '#f3e8aa', 5);
  sound.play('shoot'); game.shake = 2.5; updateHUD();
}
function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) { const a = rand(0, Math.PI * 2), speed = rand(35, 160), life = rand(.2, .7); game.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life, maxLife: life }); }
}
function drop(x, y, kind, amount) { game.loot.push({ x: x + rand(-13, 13), y: y + rand(-13, 13), kind, amount, age: 0, phase: rand(0, 6) }); }
function enemyDeath(enemy) {
  game.enemies.splice(game.enemies.indexOf(enemy), 1); game.kills++;
  const l = CONFIG.loot, stats = CONFIG.enemies[enemy.kind];
  drop(enemy.x, enemy.y, 'gold', Math.round(rand(l.coinEnemy[0], l.coinEnemy[1] + 1) * stats.bounty));
  if (Math.random() < l.scrapEnemyChance * stats.bounty) drop(enemy.x, enemy.y, 'scrap', 1);
  burst(enemy.x, enemy.y, stats.color, 13); sound.play('kill', enemy); updateHUD();
}
function chestDeath(chest) {
  game.chests.splice(game.chests.indexOf(chest), 1); const l = CONFIG.loot;
  drop(chest.x, chest.y, 'gold', Math.floor(rand(l.coinChest[0], l.coinChest[1] + 1)));
  drop(chest.x, chest.y, 'scrap', Math.floor(rand(l.scrapChest[0], l.scrapChest[1] + 1)));
  if (Math.random() < l.healChestChance) drop(chest.x, chest.y, 'heal', l.healAmount);
  burst(chest.x, chest.y, '#f2d782', 20); sound.play('chest'); notify('補給箱已開啟！拾取戰利品');
}
// Frontal shields absorb friendly bullets that arrive within ±shieldArc of the bearer's facing until depleted.
function damageEnemy(e, b) {
  const stats = CONFIG.enemies[e.kind];
  if (e.shieldHp > 0 && Math.abs(angleDiff(Math.atan2(b.y - e.y, b.x - e.x), e.facing)) < stats.shieldArc) {
    e.shieldHp = Math.max(0, e.shieldHp - b.damage); e.blocked = .12;
    if (e.shieldHp) { burst(b.x, b.y, '#d5ecf5', 4); sound.play('block', e); }
    else { burst(e.x + Math.cos(e.facing) * 20, e.y + Math.sin(e.facing) * 20, '#bfe3f5', 18); sound.play('shieldBreak', e); }
    return;
  }
  e.hp -= b.damage; e.hit = .15; burst(e.x, e.y, stats.color, 4);
  if (e.hp <= 0) enemyDeath(e); else sound.play('hit', e);
}
function hurtPlayer(damage) {
  const p = game.player;
  if (p.invulnerable > 0 || game.mode !== 'playing') return;
  let amount = damage * (1 - gearStats().reduction);
  p.invulnerable = CONFIG.player.invulnerability; p.lastHurt = game.time;
  const absorbed = Math.min(p.shield, amount); p.shield -= absorbed; amount -= absorbed;
  if (amount > 0) { p.hp = Math.max(0, p.hp - amount); game.flash = .35; game.shake = 7; burst(p.x, p.y, '#f29785', 9); sound.play('hurt'); }
  else { game.shake = 3; burst(p.x, p.y, '#a9dcee', 9); sound.play('shieldHit'); }
  updateHUD();
  if (!p.hp) {
    game.mode = 'ended'; game.mouse.down = false;
    $('endWave').textContent = String(game.wave).padStart(2, '0');
    $('endKills').textContent = game.kills; $('endGold').textContent = game.earned;
    UI.end.hidden = false; sound.music('stop'); sound.play('gameOver');
  }
}
function steer(enemy, angle, speed, dt) {
  const x = enemy.x, y = enemy.y;
  for (const offset of [0, .65, -.65, 1.3, -1.3, Math.PI]) {
    const a = angle + offset, dx = Math.cos(a) * speed * dt, dy = Math.sin(a) * speed * dt;
    if (passable(x + dx * 3, y + dy * 3, enemy.radius)) { move(enemy, dx, dy); return; }
  }
}
function updateEnemy(e, dt) {
  const p = game.player, stats = CONFIG.enemies[e.kind], d = distance(e, p), visible = !isHidden() && d < stats.sight && clearSight(e, p), melee = !stats.projectileSpeed;
  e.cooldown -= dt; e.hit = Math.max(0, e.hit - dt); e.blocked = Math.max(0, e.blocked - dt);
  const turn = angleDiff(e.state === 'wander' ? e.direction : Math.atan2(p.y - e.y, p.x - e.x), e.facing), maxTurn = (stats.turnRate ?? Infinity) * dt;
  e.facing += clamp(turn, -maxTurn, maxTurn);
  if (visible) {
    if (e.state === 'wander') { e.state = 'alert'; e.alertTime = CONFIG.enemies.alertSeconds; }
    e.lost = CONFIG.enemies.loseTargetSeconds;
    if (e.state === 'alert') { e.alertTime -= dt; if (e.alertTime <= 0) e.state = 'chase'; }
    else e.state = d <= stats.reach ? 'attack' : 'chase';
  } else if (e.state !== 'wander') {
    e.lost -= dt;
    if (e.lost <= 0 || isHidden()) { e.state = 'wander'; e.wanderTime = 0; }
    else e.state = 'chase';
  }
  if (e.state === 'wander') {
    e.wanderTime -= dt;
    if (e.wanderTime <= 0) { e.direction = rand(-Math.PI, Math.PI); e.wanderTime = rand(...CONFIG.enemies.wanderInterval); }
    steer(e, e.direction, stats.speed * stats.wanderSpeed, dt);
  } else if (e.state === 'chase') {
    if (isHidden()) return;
    const weave = stats.weave ? Math.sin(game.time * stats.weaveSpeed + e.seed) * stats.weave : 0;
    steer(e, Math.atan2(p.y - e.y, p.x - e.x) + weave, stats.speed, dt);
  } else if (e.state === 'attack') {
    if (melee) {
      if (e.cooldown <= 0 && d < stats.reach + p.radius) { hurtPlayer(enemyDamage(stats)); e.cooldown = stats.cooldown; }
    } else {
      if (d < stats.reach * stats.retreatRatio) steer(e, Math.atan2(e.y - p.y, e.x - p.x), stats.speed * stats.retreatSpeed, dt);
      if (e.cooldown <= 0) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * stats.projectileSpeed, vy: Math.sin(a) * stats.projectileSpeed, range: stats.sight, traveled: 0, damage: enemyDamage(stats), radius: stats.projectileRadius, friendly: false });
        e.cooldown = stats.cooldown; sound.play('enemyShot', e);
      }
    }
  }
  if (melee && e.state !== 'wander' && d < e.radius + p.radius + 2 && e.cooldown <= 0 && !isHidden()) {
    hurtPlayer(enemyDamage(stats)); e.cooldown = stats.cooldown;
  }
}
function segmentCircle(x1, y1, x2, y2, target, radius) {
  const dx = x2 - x1, dy = y2 - y1, t = clamp(((target.x - x1) * dx + (target.y - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(x1 + t * dx - target.x, y1 + t * dy - target.y) <= radius;
}
function updateBullets(dt) {
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i], nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    b.traveled += Math.hypot(nx - b.x, ny - b.y);
    const wall = game.walls.some(r => lineRect(b.x, b.y, nx, ny, r));
    let target = null;
    if (!wall) {
      if (b.friendly) target = [...game.enemies, ...game.chests].find(t => segmentCircle(b.x, b.y, nx, ny, t, t.radius + b.radius));
      else if (segmentCircle(b.x, b.y, nx, ny, game.player, game.player.radius + b.radius)) target = game.player;
    }
    if (target) {
      if (target === game.player) hurtPlayer(b.damage);
      else if (target.kind) damageEnemy(target, b);
      else { target.hp -= b.damage; target.hit = .15; burst(target.x, target.y, '#efd58a', 4); if (target.hp <= 0) chestDeath(target); else sound.play('hit', target); }
    }
    if (target || wall || b.traveled >= b.range || nx < 0 || ny < 0 || nx > CONFIG.world.width || ny > CONFIG.world.height) {
      game.bullets.splice(i, 1); if (wall) burst(nx, ny, '#d9caa7', 3);
    } else { b.x = nx; b.y = ny; }
  }
}
function update(dt) {
  if (game.mode !== 'playing') return;
  game.time += dt;
  const p = game.player; p.cooldown -= dt; p.invulnerable = Math.max(0, p.invulnerable - dt); game.flash = Math.max(0, game.flash - dt); game.shake *= .82;
  let dx = Number(game.keys.has('d') || game.keys.has('arrowright')) - Number(game.keys.has('a') || game.keys.has('arrowleft'));
  let dy = Number(game.keys.has('s') || game.keys.has('arrowdown')) - Number(game.keys.has('w') || game.keys.has('arrowup'));
  const len = Math.hypot(dx, dy);
  if (len) { dx /= len; dy /= len; const speed = CONFIG.player.speed * gearStats().speed * (inTerrain(p, game.ponds) ? CONFIG.player.waterMultiplier : 1); move(p, dx * speed * dt, dy * speed * dt); }
  const maxShield = gearStats().maxShield;
  if (p.shield < maxShield && game.time - p.lastHurt >= CONFIG.player.shieldRegenDelay) p.shield = Math.min(maxShield, p.shield + CONFIG.player.shieldRegenRate * dt);
  const camera = getCamera();
  if (game.mouse.active) p.facing = Math.atan2(game.mouse.y + camera.y - p.y, game.mouse.x + camera.x - p.x);
  if (game.mouse.down && p.cooldown <= 0) shoot();
  for (const e of [...game.enemies]) updateEnemy(e, dt);
  updateBullets(dt);
  for (let i = game.loot.length - 1; i >= 0; i--) {
    const item = game.loot[i]; item.age += dt;
    if (distance(item, p) < CONFIG.player.pickupRadius) {
      if (item.kind === 'gold') { p.gold += item.amount; game.earned += item.amount; }
      else if (item.kind === 'scrap') p.scrap += item.amount;
      else p.hp = Math.min(p.maxHp, p.hp + item.amount);
      burst(item.x, item.y, item.kind === 'gold' ? '#f2d481' : '#b7e5cb', 5); sound.play(item.kind === 'gold' ? 'coin' : item.kind);
      game.loot.splice(i, 1); updateHUD();
    } else if (item.age >= CONFIG.loot.pickupLifetime) game.loot.splice(i, 1);
  }
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const part = game.particles[i]; part.x += part.vx * dt; part.y += part.vy * dt; part.life -= dt;
    if (part.life <= 0) game.particles.splice(i, 1);
  }
  if (game.waveRemaining > 0) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      const w = CONFIG.waves, batch = Math.min(game.waveRemaining, w.maxBatch, 1 + Math.floor((game.wave - 1) / w.batchEvery), w.maxAlive - game.enemies.length);
      for (let i = 0; i < batch; i++) if (spawnEnemy()) game.waveRemaining--;
      game.spawnTimer = Math.max(w.minSpawnInterval, w.spawnInterval - (game.wave - 1) * w.spawnIntervalStep);
    }
  } else if (!game.enemies.length) {
    if (!game.nextWave) { game.nextWave = CONFIG.waves.intermission; notify('區域已清空，準備迎接下一波'); }
    game.nextWave -= dt;
    if (game.nextWave <= 0) { game.wave++; startWave(); }
  }
  game.chestTimer -= dt;
  if (game.chests.length < CONFIG.chests.minimum && game.chestTimer <= 0) { spawnChest(); game.chestTimer = CONFIG.chests.replenishSeconds; }
  if (performance.now() > game.toastUntil) UI.toast.classList.remove('show');
  updateHUD();
}
function resize() {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function size() { return { w: canvas.clientWidth, h: canvas.clientHeight }; }
function getCamera() {
  const { w, h } = size(), p = game.player || worldCenter;
  return { x: clamp(p.x - w / 2, 0, Math.max(0, CONFIG.world.width - w)), y: clamp(p.y - h / 2, 0, Math.max(0, CONFIG.world.height - h)) };
}
function roundRect(x, y, w, h, radius, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); }
function drawWorld() {
  const w = CONFIG.world; ctx.fillStyle = '#354c39'; ctx.fillRect(0, 0, w.width, w.height);
  ctx.strokeStyle = '#d3dfb008'; ctx.lineWidth = 1;
  for (let x = 0; x < w.width; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, w.height); ctx.stroke(); }
  for (let y = 0; y < w.height; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w.width, y); ctx.stroke(); }
  for (let x = 22; x < w.width; x += 42) for (let y = 18; y < w.height; y += 43) {
    const noise = Math.sin(x * 42.37 + y * 9.19) * 319.13;
    if (noise - Math.floor(noise) > .44) { ctx.fillStyle = '#87a27132'; ctx.fillRect(x + noise % 8, y + noise % 7, 2, 5); }
  }
  ctx.strokeStyle = '#9eb58255'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, w.width - 8, w.height - 8);
  // Draw each terrain type in layered passes so overlapping cluster pieces merge into one patch.
  for (const r of game.ponds) roundRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 28, '#5f7d63');
  for (const r of game.ponds) roundRect(r.x, r.y, r.w, r.h, 26, '#578c96');
  for (const r of game.ponds) {
    ctx.strokeStyle = '#afd2ba7a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x + r.w * .52, r.y + r.h * .52, r.w * .38, r.h * .27, -.2, 0, Math.PI * 1.25); ctx.stroke();
    ctx.strokeStyle = '#afd2ba3a'; ctx.beginPath(); ctx.ellipse(r.x + r.w * .52, r.y + r.h * .52, r.w * .28, r.h * .16, -.2, 0, Math.PI * 1.25); ctx.stroke();
  }
  for (const r of game.bushes) roundRect(r.x - 5, r.y - 2, r.w + 10, r.h + 10, 25, '#253e2c');
  for (const r of game.bushes) roundRect(r.x, r.y, r.w, r.h, 22, '#568253');
  for (const r of game.bushes) {
    for (let i = 0; i < 10; i++) {
      const a = (i * 2.4) % (Math.PI * 2), bx = r.x + r.w * (.5 + .42 * Math.cos(a)), by = r.y + r.h * (.5 + .39 * Math.sin(a));
      ctx.fillStyle = i % 3 ? '#6e9d60' : '#87ac67'; ctx.beginPath(); ctx.ellipse(bx, by, 13, 7, a, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const r of game.walls) {
    roundRect(r.x + 5, r.y + 8, r.w, r.h, 5, '#1a302a93');
    roundRect(r.x, r.y, r.w, r.h, 4, '#8c917b');
    ctx.fillStyle = '#adb29a'; ctx.fillRect(r.x + 5, r.y + 4, r.w - 10, 8);
    ctx.strokeStyle = '#596656'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x + r.w * .38, r.y + 12); ctx.lineTo(r.x + r.w * .38, r.y + r.h - 3); ctx.moveTo(r.x + r.w * .7, r.y + 14); ctx.lineTo(r.x + r.w * .7, r.y + r.h - 3); ctx.stroke();
  }
}
function drawHealth(x, y, ratio, width) { ctx.fillStyle = '#1b3029'; ctx.fillRect(x - width / 2, y, width, 4); ctx.fillStyle = '#eab08b'; ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), 4); }
function drawChest(c) {
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(-.08);
  roundRect(-21, -15 + 5, 42, 33, 5, '#1a2920a0');
  roundRect(-21, -19, 42, 33, 4, c.hit > 0 ? '#fff2c3' : '#9f683d');
  ctx.strokeStyle = '#e3b466'; ctx.lineWidth = 3; ctx.strokeRect(-18, -16, 36, 27);
  ctx.fillStyle = '#e8cc7b'; ctx.fillRect(-4, -18, 8, 29); ctx.fillRect(-21, -3, 42, 5);
  ctx.fillStyle = '#5f452c'; ctx.fillRect(-3, -5, 6, 8);
  ctx.restore();
  if (c.hp < c.maxHp) drawHealth(c.x, c.y - 30, c.hp / c.maxHp, 41);
}
function drawEnemy(e) {
  const stats = CONFIG.enemies[e.kind], hidden = inTerrain(e, game.bushes);
  ctx.save(); ctx.globalAlpha = hidden && distance(e, game.player) > CONFIG.enemies.bushRevealDistance ? .18 : 1;
  ctx.translate(e.x, e.y); ctx.fillStyle = '#10251ca0'; ctx.beginPath(); ctx.ellipse(3, 10, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(e.facing);
  if (e.kind === 'runner') { ctx.strokeStyle = '#f7e7a680'; ctx.lineWidth = 2; ctx.beginPath(); for (const y of [-6, 0, 6]) { ctx.moveTo(-e.radius - 4, y); ctx.lineTo(-e.radius - 14 - Math.abs(y), y); } ctx.stroke(); }
  ctx.fillStyle = '#26372e'; ctx.fillRect(1, -5, 23, 10);
  ctx.fillStyle = e.hit > 0 ? '#fff0d1' : stats.color; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3b3e37'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#26372e'; ctx.fillRect(6, -6, 6, 4); ctx.fillRect(6, 3, 6, 4);
  if (e.kind === 'ranged') { ctx.strokeStyle = '#ede2b6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-3, 0, 7, -1.1, 1.1); ctx.stroke(); }
  else if (e.kind === 'runner') { ctx.fillStyle = '#5b4a1f'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-1, 0); ctx.lineTo(-8, 6); ctx.fill(); }
  else if (e.kind === 'shield') {
    ctx.fillStyle = '#4f6470'; ctx.fillRect(-10, -4, 8, 8);
    if (e.shieldHp > 0) {
      ctx.strokeStyle = e.blocked > 0 ? '#ffffff' : `rgba(190,226,240,${.45 + .55 * e.shieldHp / e.maxShield})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(0, 0, e.radius + 6, -stats.shieldArc, stats.shieldArc); ctx.stroke();
      ctx.strokeStyle = '#2d4452'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, e.radius + 9, -stats.shieldArc, stats.shieldArc); ctx.stroke();
    }
  }
  else { ctx.fillStyle = '#f2d4a3'; ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(-16, -20); ctx.lineTo(-2, -14); ctx.fill(); }
  ctx.restore();
  if (e.hp < e.maxHp) drawHealth(e.x, e.y - e.radius - 14, e.hp / e.maxHp, 34);
  if (e.state !== 'wander') { ctx.fillStyle = '#f3d182'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', e.x, e.y - 27); }
}
function drawPlayer(p) {
  ctx.save(); ctx.globalAlpha = isHidden() ? .58 : p.invulnerable > 0 && Math.floor(game.time * 18) % 2 ? .55 : 1;
  ctx.translate(p.x, p.y); ctx.fillStyle = '#0b261990'; ctx.beginPath(); ctx.ellipse(3, 12, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(p.facing); ctx.fillStyle = '#1f382c'; ctx.fillRect(3, -6, 26, 12);
  ctx.fillStyle = '#e3eabc'; ctx.fillRect(19, -3, 10, 6);
  ctx.fillStyle = '#d3dd9a'; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f2edc7'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#38563b'; ctx.fillRect(5, -6, 5, 4); ctx.fillRect(5, 3, 5, 4);
  if (p.levels.helmet) { ctx.fillStyle = ['#6f8a58', '#5a7249', '#48603c'][p.levels.helmet - 1]; ctx.beginPath(); ctx.arc(-1, 0, p.radius - 3, Math.PI * .55, Math.PI * 1.45); ctx.lineTo(-1, 0); ctx.fill(); }
  if (p.levels.vest) { ctx.strokeStyle = '#4c6443'; ctx.lineWidth = 2 + p.levels.vest; ctx.beginPath(); ctx.arc(0, 0, p.radius - 1, Math.PI * .6, Math.PI * 1.4); ctx.stroke(); }
  ctx.restore();
  const maxShield = gearStats().maxShield;
  if (p.shield > 0 && maxShield) { ctx.strokeStyle = `rgba(150,215,240,${.2 + .6 * p.shield / maxShield})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2); ctx.stroke(); }
  ctx.strokeStyle = isHidden() ? '#cfe9a6a0' : '#f4e5ad87'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 24 + Math.sin(game.time * 3) * 2, 0, Math.PI * 2); ctx.stroke();
}
function drawLoot(item) {
  const y = item.y + Math.sin(game.time * 4 + item.phase) * 3;
  ctx.save(); ctx.translate(item.x, y); ctx.shadowColor = item.kind === 'gold' ? '#f9da82' : '#c0f7d0'; ctx.shadowBlur = 15;
  if (item.kind === 'gold') { ctx.fillStyle = '#f2ca69'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff0a8'; ctx.lineWidth = 2; ctx.stroke(); }
  else if (item.kind === 'scrap') { ctx.fillStyle = '#c4ead9'; ctx.rotate(Math.PI / 4); ctx.fillRect(-7, -7, 14, 14); }
  else { ctx.fillStyle = '#e58582'; ctx.fillRect(-3, -8, 6, 16); ctx.fillRect(-8, -3, 16, 6); }
  ctx.restore();
}
function draw() {
  const { w, h } = size(); if (!w || !h) return;
  ctx.clearRect(0, 0, w, h);
  const camera = getCamera(); ctx.save();
  ctx.translate(-camera.x + (game.shake ? rand(-game.shake, game.shake) : 0), -camera.y + (game.shake ? rand(-game.shake, game.shake) : 0));
  drawWorld();
  for (const c of game.chests) drawChest(c);
  for (const item of game.loot) drawLoot(item);
  for (const e of game.enemies) drawEnemy(e);
  if (game.player) drawPlayer(game.player);
  for (const b of game.bullets) { ctx.fillStyle = b.friendly ? '#fff0af' : '#eb9eae'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
  for (const part of game.particles) { ctx.globalAlpha = part.life / part.maxLife; ctx.fillStyle = part.color; ctx.fillRect(part.x, part.y, 3, 3); } ctx.globalAlpha = 1;
  ctx.restore();
  if (game.flash > 0) { ctx.fillStyle = `rgba(226,71,62,${game.flash * .48})`; ctx.fillRect(0, 0, w, h); }
  if (game.mode === 'playing' && game.mouse.active) {
    ctx.strokeStyle = '#f1edcaaa'; ctx.lineWidth = 1.5; const x = game.mouse.x, y = game.mouse.y;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.moveTo(x - 16, y); ctx.lineTo(x - 6, y); ctx.moveTo(x + 6, y); ctx.lineTo(x + 16, y); ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 6); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 16); ctx.stroke();
  }
}
let last = performance.now();
function frame(now) { const dt = Math.min((now - last) / 1000, .05); last = now; update(dt); draw(); requestAnimationFrame(frame); }
$('startBtn').addEventListener('click', startGame);
$('restartBtn').addEventListener('click', startGame);
$('shopBtn').addEventListener('click', () => { if (game.mode === 'playing' || game.mode === 'shop') toggleShop(); });
$('closeShop').addEventListener('click', toggleShop);
for (const kind of ['music', 'sfx']) {
  $(`${kind}Btn`).addEventListener('click', () => { sound.toggle(kind); renderSettings(); });
  $(`${kind}Volume`).addEventListener('input', event => { sound.init(); sound.setVolume(kind, Number(event.target.value)); renderSettings(); });
  $(`${kind}Volume`).addEventListener('change', event => { event.target.blur(); if (kind === 'sfx') sound.play('coin'); });
}
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLInputElement) return;
  const key = event.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' ','b','escape'].includes(key)) event.preventDefault();
  if (key === 'b' && !event.repeat) toggleShop();
  else if (key === 'escape' && game.mode === 'shop') toggleShop();
  else if ((key === 'm' || key === 'n') && !event.repeat) { sound.toggle(key === 'm' ? 'music' : 'sfx'); renderSettings(); }
  else game.keys.add(key);
});
window.addEventListener('keyup', event => game.keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { game.keys.clear(); game.mouse.down = false; });
canvas.addEventListener('pointermove', event => { const rect = canvas.getBoundingClientRect(); game.mouse.x = event.clientX - rect.left; game.mouse.y = event.clientY - rect.top; game.mouse.active = true; });
canvas.addEventListener('pointerdown', event => { if (event.button === 0 && game.mode === 'playing') { game.mouse.down = true; canvas.setPointerCapture(event.pointerId); } });
canvas.addEventListener('pointerup', () => { game.mouse.down = false; });
canvas.addEventListener('pointercancel', () => { game.mouse.down = false; });
canvas.addEventListener('contextmenu', event => event.preventDefault());
renderSettings(); new ResizeObserver(resize).observe(arena); resize(); requestAnimationFrame(frame);
})();
