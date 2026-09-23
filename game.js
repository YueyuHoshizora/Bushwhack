(() => {
'use strict';
// All gameplay and balance values live here. Rendering-only colors and layout live below.
const CONFIG = Object.freeze({
  world: { width: 1800, height: 1200, grid: 30, walls: 11, wallWidth: [72, 128], wallHeight: [48, 88], ponds: { clusters: 4, pieces: [2, 4], size: [80, 130] }, bushes: { clusters: 8, pieces: [3, 6], size: [72, 118] }, clusterReach: 0.62, terrainGap: 20, spawnClearance: 200, borderMargin: 16, placementMargin: 42, spawnMargin: 65, terrainSpawnPadding: 12, chestSpacing: 65, placementAttempts: 250, spawnAttempts: 400, burnSeconds: 25 },
  // Shield recharges only while hidden in grass (not firing) and unharmed for shieldRegenDelay seconds.
  player: { hp: 100, radius: 15, speed: 245, invulnerability: 0.65, pickupRadius: 40, waterMultiplier: 0.5, revealSeconds: 2.4, shieldRegenDelay: 3, shieldRegenRate: 4.5, switchDelay: 0.25 },
  // Shared weapon upgrades scale every gun: damage/rate/range are fractions of the gun's base value per level.
  gun: { bulletRadius: 4, damageStep: 1 / 3, rateStep: 0.197, rangeStep: 0.1875 },
  // Manual guns. Text lives in i18n.js under guns.<key>.*; color/sound/look are rendering hints.
  weapons: {
    rifle: { icon: '⟋', damage: 18, shotsPerSecond: 3.3, pellets: 1, spreadRadians: 0.14, jitter: 0, range: 480, bulletSpeed: 800, pierce: 0, shake: 2.5, gold: 0, scrap: 0, color: '#fff0af', sound: 'shoot' },
    smg: { icon: '≡', damage: 8, shotsPerSecond: 9, pellets: 1, spreadRadians: 0.1, jitter: 0.09, range: 380, bulletSpeed: 860, pierce: 0, shake: 1.2, gold: 40, scrap: 3, color: '#ffe38a', sound: 'smg' },
    shotgun: { icon: '⋔', damage: 11, shotsPerSecond: 1.25, pellets: 6, spreadRadians: 0.09, jitter: 0.03, range: 300, bulletSpeed: 720, pierce: 0, shake: 5, gold: 45, scrap: 4, color: '#ffc58a', sound: 'shotgun' },
    rail: { icon: '⟶', damage: 70, shotsPerSecond: 0.9, pellets: 1, spreadRadians: 0.05, jitter: 0, range: 820, bulletSpeed: 1500, pierce: 2, shake: 4, gold: 65, scrap: 5, color: '#9fe3ff', sound: 'rail' }
  },
  // Automatic weapons: per-level arrays (index = level - 1). They never reveal the player and hold fire while the player is inside a bush (blades excepted).
  autoWeapons: {
    drone: { icon: '⌬', max: 3, gold: 35, scrap: 3, goldStep: 25, scrapStep: 2, damage: [10, 14, 18], rate: [1.8, 2.4, 3], range: 380, orbit: 34, orbitSpeed: 2.2, bulletSpeed: 700 },
    blades: { icon: '✢', max: 3, gold: 30, scrap: 2, goldStep: 22, scrapStep: 2, damage: [12, 16, 20], count: [2, 3, 4], radius: 62, size: 9, spin: 3.2, hitCooldown: 0.45 },
    missile: { icon: '➹', max: 3, gold: 45, scrap: 4, goldStep: 30, scrapStep: 2, damage: [30, 40, 52], interval: [2.4, 1.9, 1.5], range: 520, blast: 70, speed: 360, turn: 4.5, life: 3 },
    tesla: { icon: 'ϟ', max: 3, gold: 40, scrap: 3, goldStep: 28, scrapStep: 2, damage: [16, 21, 27], interval: [1.5, 1.25, 1], range: 190, chains: [2, 3, 4], chainRange: 130 }
  },
  enemies: {
    melee: { hp: 48, speed: 125, radius: 16, sight: 305, reach: 30, damage: 9, cooldown: 1.05, wanderSpeed: 0.45, bounty: 1, color: '#e99c77' },
    ranged: { hp: 37, speed: 101, radius: 15, sight: 365, reach: 270, damage: 8, cooldown: 1.9, projectileSpeed: 310, projectileRadius: 5, retreatRatio: 0.52, retreatSpeed: 0.65, wanderSpeed: 0.35, bounty: 1.1, color: '#c4a7db' },
    runner: { hp: 28, speed: 237, radius: 12, sight: 340, reach: 26, damage: 6, cooldown: 0.7, wanderSpeed: 0.55, weave: 0.55, weaveSpeed: 7, bounty: 1, color: '#f0d36b' },
    shield: { hp: 74, speed: 88, radius: 18, sight: 300, reach: 32, damage: 13, cooldown: 1.25, wanderSpeed: 0.4, turnRate: 1.7, shieldHp: 90, shieldArc: 1.15, bounty: 1.8, color: '#8fb3c9' },
    // Cloaked beyond revealDistance (and for revealSeconds after hitting or being hit): nearly invisible, ignored by auto-targeting. Senses players hiding in grass within sense px.
    stalker: { hp: 41, speed: 160, radius: 14, sight: 320, reach: 28, damage: 15, cooldown: 1.1, wanderSpeed: 0.5, cloakAlpha: 0.1, revealDistance: 150, revealSeconds: 0.9, sense: 120, bounty: 1.6, color: '#86b8a8' },
    // Lights a fuse within reach, keeps closing at fuseSpeed, then detonates for damage in blast px (hits hidden players too) and dies without loot.
    bomber: { hp: 63, speed: 115, radius: 17, sight: 330, reach: 50, damage: 34, fuse: 0.75, fuseSpeed: 0.45, blast: 88, wanderSpeed: 0.4, bounty: 1.5, color: '#d9745b' },
    // Boss wave commander (see `boss` for attack patterns). Senses hidden players within sense px; loot comes from boss.loot.
    boss: { hp: 1100, speed: 72, radius: 30, sight: 520, sense: 160, reach: 56, damage: 18, cooldown: 1.2, wanderSpeed: 0.5, bounty: 0, color: '#c7866f' },
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
      { kind: 'shield', from: 4, weight: 0.22, perWave: 0.035, max: 0.7 },
      { kind: 'stalker', from: 6, weight: 0.22, perWave: 0.03, max: 0.6 },
      { kind: 'bomber', from: 8, weight: 0.2, perWave: 0.03, max: 0.55 }
    ]
  },
  chests: { minimum: 2, maximum: 4, initial: 3, radius: 23, hpBase: 23, hpPerWave: 3, replenishSeconds: 5, spawnDistance: 130 },
  loot: { coinEnemy: [3, 6], coinChest: [8, 13], scrapEnemyChance: 0.38, scrapChest: [1, 2], healChestChance: 0.28, healAmount: 18, pickupLifetime: 30 },
  upgrades: {
    damage: { icon: '✦', max: 5, gold: 12, scrap: 1, goldStep: 10, scrapStep: 1 },
    rate: { icon: '≋', max: 5, gold: 14, scrap: 1, goldStep: 11, scrapStep: 1 },
    spread: { icon: '❖', max: 5, gold: 18, scrap: 2, goldStep: 15, scrapStep: 1 },
    range: { icon: '⌖', max: 5, gold: 11, scrap: 1, goldStep: 9, scrapStep: 1 }
  },
  gear: {
    helmet: { icon: '◓', max: 3, gold: 20, scrap: 2, goldStep: 16, scrapStep: 1, reduction: 0.1 },
    vest: { icon: '▣', max: 3, gold: 22, scrap: 2, goldStep: 16, scrapStep: 1, hp: 25 },
    shield: { icon: '◈', max: 3, gold: 26, scrap: 3, goldStep: 18, scrapStep: 2, capacity: 20 },
    boots: { icon: '➶', max: 3, gold: 16, scrap: 1, goldStep: 12, scrapStep: 1, speed: 0.08 },
    medkit: { icon: '✚', consumable: true, gold: 15, scrap: 0, heal: 40 }
  },
  // Between-wave perks: `offer` distinct random picks; each pick adds one stack (up to max). Values are per stack.
  // `unlock` names the achievement that adds a perk to the pool (never offered in daily runs).
  perks: {
    offer: 3,
    list: {
      ambush: { icon: '◎', max: 2, bonus: 1 },
      vampire: { icon: '♥', max: 3, heal: 2 },
      volatile: { icon: '✺', max: 2, chance: 0.2, damage: 24, blast: 70 },
      shadow: { icon: '◐', max: 2, seconds: 1 },
      scavenger: { icon: '⚙', max: 2, scrap: 0.5 },
      tough: { icon: '▲', max: 3, hp: 20 },
      greed: { icon: '¤', max: 2, gold: 0.25 },
      trigger: { icon: '≫', max: 3, rate: 0.1 },
      magnet: { icon: '⊕', max: 2, pickup: 0.6 },
      mender: { icon: '❀', max: 2, regen: 1 },
      phantom: { icon: '☾', max: 1, unlock: 'ambushMaster' }
    }
  },
  // Difficulty multipliers on enemy HP / damage / speed, wave size and gold; `elite` adds to the elite chance.
  difficulty: {
    normal: { hp: 1, damage: 1, speed: 1, count: 1, gold: 1, elite: 0 },
    hard: { hp: 1.3, damage: 1.25, speed: 1.06, count: 1.2, gold: 1.1, elite: 0.04 },
    hell: { hp: 1.65, damage: 1.5, speed: 1.12, count: 1.4, gold: 1.2, elite: 0.08, unlock: 'fearless' }
  },
  // Elite affix chance per regular spawn: base + (wave - from) × perWave, capped at max, plus the difficulty's elite. Elites: HP × hp, loot × bounty.
  elites: {
    from: 4, base: 0.05, perWave: 0.012, max: 0.3, hp: 1.5, bounty: 2,
    affixes: { swift: { speed: 1.35, color: '#ffe36e' }, regen: { rate: 0.04, color: '#8ef08a' }, splitter: { count: 2, hp: 0.5, radius: 10, color: '#d59bff' }, armored: { reduction: 0.35, color: '#a9d4ff' } }
  },
  // Every `every` waves a commander joins a wave of regularShare × the normal size. Below phase2.at HP it speeds up,
  // shortens every cooldown (× pace), throws more bombs and fires bullet rings. Minions it summons drop no loot.
  boss: {
    every: 5, regularShare: 0.5, spawnDistance: 420,
    volley: { interval: 1.7, count: 3, spread: 0.2, speed: 330, radius: 7, damage: 10 },
    bombs: { interval: 5, count: 1, scatter: 70, fall: 1.1, blast: 85, damage: 24, range: 560 },
    summon: { interval: 9, count: 3, kinds: ['melee', 'runner'], distance: 70 },
    phase2: { at: 0.5, speed: 1.35, pace: 0.65, bombs: 3, ring: 12, ringInterval: 3.2 },
    loot: { gold: 90, scrap: 8, heal: 30 }
  },
  // Achievements persist in localStorage; rewards apply to later non-daily runs.
  achievements: {
    veteran: { icon: '✪', wave: 15, startGun: 'smg' },
    ambushMaster: { icon: '◎', ambushKills: 100, perk: 'phantom' },
    fearless: { icon: '☠', wave: 10, difficulty: 'hard', unlocks: 'hell' },
    slayer: { icon: '♛', bossKills: 1, startAuto: 'drone' }
  },
  // Map variants, picked per run by weight. bushes/ponds scale cluster counts, sight scales enemy sight, vision limits the player's view.
  variants: {
    standard: { weight: 2, bushes: 1, ponds: 1, barrels: 5, sight: 1 },
    night: { weight: 1, bushes: 1, ponds: 1, barrels: 5, sight: 0.8, vision: 260 },
    rain: { weight: 1, bushes: 1.5, ponds: 1.25, barrels: 4, sight: 0.9 },
    scorched: { weight: 1, bushes: 0.5, ponds: 2, barrels: 8, sight: 1 }
  },
  // Explosive barrels: damage × wave HP scale to enemies in blast px, playerDamage to the player; they chain and burn grass.
  barrels: { radius: 14, hp: 20, blast: 95, damage: 55, playerDamage: 22, spacing: 90, chainDelay: 0.12 },
  // Mid-wave events: rolled at wave start (not on boss waves); airdrop and hold begin once `trigger` of the wave has spawned.
  events: {
    from: 3, chance: 0.4, trigger: 0.4,
    types: {
      airdrop: { hp: 30, gold: [30, 45], scrap: [3, 4], heal: 30, distance: 250 },
      hold: { radius: 90, seconds: 8, limit: 40, gold: [40, 60], scrap: 4, heal: 25, distance: 240 },
      stalkers: { from: 5 }
    }
  },
  // Daily challenge: map, variant, spawn roster, affixes, events and perk offers are seeded by the UTC date.
  daily: { difficulty: 'normal' },
  audio: { master: 0.5, music: 0.3, sfx: 0.7, duck: 0.35, tempo: 140, falloff: 900 }
});
// UI text comes from i18n.js; ?lang=<code> selects the dictionary and switching rewrites the page in place (no reload).
const LOCALES = globalThis.BUSHWHACK_I18N, DEFAULT_LOCALE = 'zh-Hant';
// Accepts exact codes case-insensitively and language prefixes (zh-TW → zh-Hant, en-US → en).
function resolveLocale(value) {
  const wanted = String(value || '').toLowerCase(), codes = Object.keys(LOCALES);
  return codes.find(code => code.toLowerCase() === wanted) || codes.find(code => wanted.split('-')[0] === code.toLowerCase().split('-')[0]) || DEFAULT_LOCALE;
}
let locale = resolveLocale(new URLSearchParams(location.search).get('lang')), STRINGS = LOCALES[locale].game;
const t = (key, vars = {}) => (STRINGS[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d'), arena = $('arena');
const UI = { start: $('startOverlay'), shop: $('shopOverlay'), end: $('endOverlay'), perk: $('perkOverlay'), toast: $('toast') };
const rand = (a, b) => a + Math.random() * (b - a);
// Seeded PRNG (string hash → mulberry32). Each run has seeded streams for the map, the wave roster and perk offers,
// so a daily challenge is identical for everyone; combat rolls and effects keep using Math.random.
function seededRandom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  let s = h >>> 0;
  return () => { s = s + 0x6D2B79F5 | 0; let x = Math.imul(s ^ s >>> 15, 1 | s); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}
const between = (random, a, b) => a + random() * (b - a);
function pickWeighted(random, entries) {
  let roll = random() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [key, weight] of entries) if ((roll -= weight) < 0) return key;
  return entries[0][0];
}
const todayUTC = () => new Date().toISOString().slice(0, 10);
const variantFor = seed => pickWeighted(seededRandom(`${seed}:variant`), Object.entries(CONFIG.variants).map(([key, v]) => [key, v.weight]));
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
// Personal records, cumulative totals, unlocked achievements and the chosen difficulty, kept in localStorage.
const PROFILE_KEY = 'bushwhack-profile';
const profile = (() => {
  let data; try { data = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch {}
  if (!data || typeof data !== 'object') data = {};
  return { records: data.records ?? {}, daily: data.daily ?? null, totals: { ambushKills: 0, bossKills: 0, ...data.totals }, achievements: Array.isArray(data.achievements) ? data.achievements : [], difficulty: data.difficulty ?? 'normal' };
})();
function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {} }
const unlocked = id => profile.achievements.includes(id);
const difficultyOpen = key => !CONFIG.difficulty[key].unlock || unlocked(CONFIG.difficulty[key].unlock);
if (!CONFIG.difficulty[profile.difficulty] || !difficultyOpen(profile.difficulty)) profile.difficulty = 'normal';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pointIn = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const circleRect = (x, y, radius, r) => Math.hypot(x - clamp(x, r.x, r.x + r.w), y - clamp(y, r.y, r.y + r.h)) < radius;
const overlap = (a, b, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
const rectCenter = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const worldCenter = { x: CONFIG.world.width / 2, y: CONFIG.world.height / 2 };
const game = { mode: 'menu', wave: 1, walls: [], ponds: [], bushes: [], barrels: [], enemies: [], bullets: [], missiles: [], arcs: [], bombs: [], blasts: [], chests: [], loot: [], particles: [], shopTab: 'guns', keys: new Set(), mouse: { x: 0, y: 0, down: false, active: false }, player: null, kills: 0, earned: 0, waveRemaining: 0, waveTotal: 0, spawnTimer: 0, nextWave: 0, chestTimer: 0, time: 0, flash: 0, shake: 0, toastUntil: 0, difficulty: 'normal', variant: 'standard', daily: null, rng: null, stats: null, event: null, boss: null, perks: {}, perkOffer: null, summary: null, seenAffixes: new Set(), newAchievements: [] };
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
    fuse: (t, v) => { for (let i = 0; i < 3; i++) tone(sfxBus, { wave: pulse12, from: 1320, at: t + i * .2, dur: .06, vol: .14 * v }); },
    kill: (t, v) => { tone(sfxBus, { from: 520, to: 70, at: t, dur: .22, vol: .15 * v }); hiss(sfxBus, { at: t, dur: .18, vol: .13 * v, filter: 'lowpass', freq: 1800 }); },
    hurt: t => { tone(sfxBus, { type: 'sawtooth', from: 240, to: 70, at: t, dur: .2, vol: .2 }); hiss(sfxBus, { at: t, dur: .12, vol: .15, filter: 'lowpass', freq: 900 }); },
    shieldHit: t => tone(sfxBus, { type: 'triangle', from: 880, to: 1500, at: t, dur: .1, vol: .22 }),
    coin: t => notes(sfxBus, [83, 88], t, .05, .1, .1, pulse25),
    scrap: t => tone(sfxBus, { type: 'triangle', from: 660, to: 990, at: t, dur: .09, vol: .2 }),
    heal: t => notes(sfxBus, [72, 76, 79, 84], t, .05, .09, .08, pulse25),
    chest: t => notes(sfxBus, [72, 76, 79, 84, 88], t, .045, .08, .09, pulse25),
    buy: t => notes(sfxBus, [79, 83, 86, 91], t, .04, .08, .1, pulse12),
    wave: t => notes(sfxBus, [69, 73, 76, 81], t, .09, .14, .09, pulse25),
    gameOver: t => notes(sfxBus, [67, 64, 60, 55], t, .18, .3, .12, pulse25),
    smg: (t, v) => { tone(sfxBus, { wave: pulse12, from: 1400, to: 500, at: t, dur: .045, vol: .14 * v }); hiss(sfxBus, { at: t, dur: .03, vol: .07 * v, freq: 3500 }); },
    shotgun: (t, v) => { hiss(sfxBus, { at: t, dur: .2, vol: .3 * v, filter: 'lowpass', freq: 2400 }); tone(sfxBus, { from: 220, to: 60, at: t, dur: .16, vol: .2 * v }); },
    rail: (t, v) => { tone(sfxBus, { wave: pulse25, from: 2400, to: 300, at: t, dur: .22, vol: .18 * v }); tone(sfxBus, { type: 'triangle', from: 90, to: 50, at: t, dur: .2, vol: .3 * v }); },
    drone: (t, v) => tone(sfxBus, { wave: pulse12, from: 1800, to: 900, at: t, dur: .04, vol: .07 * v }),
    missile: (t, v) => hiss(sfxBus, { at: t, dur: .25, vol: .12 * v, filter: 'bandpass', freq: 1200 }),
    explosion: (t, v) => { hiss(sfxBus, { at: t, dur: .4, vol: .32 * v, filter: 'lowpass', freq: 900 }); tone(sfxBus, { type: 'triangle', from: 160, to: 40, at: t, dur: .3, vol: .3 * v }); },
    zap: (t, v) => { tone(sfxBus, { type: 'sawtooth', from: 900, to: 2400, at: t, dur: .08, vol: .1 * v }); hiss(sfxBus, { at: t, dur: .1, vol: .1 * v, filter: 'bandpass', freq: 5000 }); },
    blade: (t, v) => tone(sfxBus, { type: 'triangle', from: 1300, to: 700, at: t, dur: .05, vol: .12 * v })
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
// Map layout comes from a seeded stream so a daily challenge produces the same field for everyone.
function generateMap(random, variant) {
  const w = CONFIG.world, v = CONFIG.variants[variant], r = (a, b) => between(random, a, b);
  game.walls = []; game.ponds = []; game.bushes = []; game.barrels = [];
  const items = [];
  const fits = (rect, blockers) => rect.x >= w.placementMargin && rect.y >= w.placementMargin && rect.x + rect.w <= w.width - w.placementMargin && rect.y + rect.h <= w.height - w.placementMargin && distance(rectCenter(rect), worldCenter) >= w.spawnClearance && !blockers.some(other => overlap(rect, other, w.terrainGap));
  function addWalls() {
    for (let i = 0; i < w.walls; i++) {
      for (let attempt = 0; attempt < w.placementAttempts; attempt++) {
        const width = r(...w.wallWidth), height = r(...w.wallHeight);
        const rect = { x: r(w.placementMargin, w.width - width - w.placementMargin), y: r(w.placementMargin, w.height - height - w.placementMargin), w: width, h: height };
        if (!fits(rect, items) || !connected([...game.walls, rect])) continue;
        game.walls.push(rect); items.push(rect); break;
      }
    }
  }
  // Bushes and ponds grow as clusters of overlapping pieces, forming continuous patches and corridors.
  function addClusters(type, { clusters, pieces, size }) {
    for (let c = 0; c < clusters; c++) {
      const cluster = [], target = Math.floor(r(pieces[0], pieces[1] + 1));
      for (let attempt = 0; attempt < w.placementAttempts && cluster.length < target; attempt++) {
        const pw = r(...size), ph = r(...size);
        let rect;
        if (!cluster.length) rect = { x: r(w.placementMargin, w.width - pw - w.placementMargin), y: r(w.placementMargin, w.height - ph - w.placementMargin), w: pw, h: ph };
        else {
          const base = cluster[Math.floor(random() * cluster.length)], center = rectCenter(base), a = Math.floor(r(0, 4)) * Math.PI / 2 + r(-.45, .45);
          const cx = center.x + Math.cos(a) * (base.w + pw) / 2 * w.clusterReach, cy = center.y + Math.sin(a) * (base.h + ph) / 2 * w.clusterReach;
          rect = { x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph };
        }
        if (fits(rect, items)) cluster.push(rect);
      }
      game[type].push(...cluster); items.push(...cluster);
    }
  }
  function addBarrels(count) {
    const B = CONFIG.barrels;
    for (let i = 0; i < count; i++) for (let attempt = 0; attempt < w.placementAttempts; attempt++) {
      const x = r(w.placementMargin, w.width - w.placementMargin), y = r(w.placementMargin, w.height - w.placementMargin);
      if (!passable(x, y, B.radius + 4) || distance({ x, y }, worldCenter) < w.spawnClearance || [...game.ponds, ...game.bushes].some(o => circleRect(x, y, B.radius, o)) || game.barrels.some(b => distance(b, { x, y }) < B.spacing)) continue;
      game.barrels.push({ x, y, radius: B.radius, hp: B.hp, fuse: 0, hit: 0, barrel: true }); break;
    }
  }
  addWalls();
  addClusters('ponds', { ...w.ponds, clusters: Math.round(w.ponds.clusters * v.ponds) });
  addClusters('bushes', { ...w.bushes, clusters: Math.round(w.bushes.clusters * v.bushes) });
  addBarrels(v.barrels);
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
// Roster, elite affix and event rolls use the run's seeded roster stream.
function pickEnemyKind() {
  if (game.event?.type === 'stalkers') return 'stalker';
  return pickWeighted(game.rng.roster, CONFIG.waves.roster.filter(r => game.wave >= r.from).map(r => [r.kind, Math.min(r.max, r.weight + (game.wave - r.from) * r.perWave)]));
}
const difficulty = () => CONFIG.difficulty[game.difficulty];
const perk = key => game.perks[key] ?? 0;
const waveScale = () => 1 + (game.wave - 1) * CONFIG.enemies.healthPerWave;
const enemyDamage = stats => Math.ceil(stats.damage * (1 + (game.wave - 1) * CONFIG.enemies.damagePerWave) * difficulty().damage);
const goldAmount = n => Math.max(1, Math.round(n * difficulty().gold * (1 + perk('greed') * CONFIG.perks.list.greed.gold)));
function scrapAmount(n) { const v = n * (1 + perk('scavenger') * CONFIG.perks.list.scavenger.scrap); return Math.floor(v) + (Math.random() < v % 1 ? 1 : 0); }
function makeEnemy(kind, pos, { affix = null, noLoot = false, hpScale = 1, radius } = {}) {
  const stats = CONFIG.enemies[kind], E = CONFIG.elites, scale = waveScale() * difficulty().hp * hpScale;
  const hp = Math.round(stats.hp * scale * (affix ? E.hp : 1)), shieldHp = Math.round((stats.shieldHp || 0) * scale);
  const e = { ...pos, kind, affix, noLoot, radius: radius ?? stats.radius, hp, maxHp: hp, shieldHp, maxShield: shieldHp, speed: difficulty().speed * (affix === 'swift' ? E.affixes.swift.speed : 1), state: 'wander', direction: rand(-Math.PI, Math.PI), facing: Math.atan2(game.player.y - pos.y, game.player.x - pos.x), seed: rand(0, Math.PI * 2), wanderTime: rand(...CONFIG.enemies.wanderInterval), alertTime: 0, lost: 0, cooldown: rand(0, .6), hit: 0, blocked: 0, bladeCooldown: 0, reveal: 0, fuse: 0 };
  game.enemies.push(e); return e;
}
function rollAffix() {
  const E = CONFIG.elites;
  if (game.wave < E.from) return null;
  const chance = Math.min(E.max, E.base + (game.wave - E.from) * E.perWave) + difficulty().elite;
  return game.rng.roster() < chance ? pickWeighted(game.rng.roster, Object.keys(E.affixes).map(key => [key, 1])) : null;
}
function spawnEnemy() {
  const pos = freeSpot(18, CONFIG.waves.enemySpawnDistance);
  if (!pos) return false;
  const e = makeEnemy(pickEnemyKind(), pos, { affix: rollAffix() });
  if (e.affix && !game.seenAffixes.has(e.affix)) { game.seenAffixes.add(e.affix); notify(t('toast.elite', { name: t(`affix.${e.affix}`), desc: t(`affix.${e.affix}.desc`) })); }
  return true;
}
// Enemies created mid-fight (boss minions, splitter halves) start already hunting the player.
function spawnNear(kind, from, reach, options) {
  const a = rand(0, Math.PI * 2), pos = { x: from.x + Math.cos(a) * reach, y: from.y + Math.sin(a) * reach };
  if (!passable(pos.x, pos.y, options?.radius ?? CONFIG.enemies[kind].radius)) return;
  Object.assign(makeEnemy(kind, pos, options), { state: 'chase', lost: CONFIG.enemies.loseTargetSeconds });
}
function spawnBoss() {
  const B = CONFIG.boss, radius = CONFIG.enemies.boss.radius, pos = freeSpot(radius, B.spawnDistance) ?? freeSpot(radius, 0);
  if (!pos) return;
  game.boss = Object.assign(makeEnemy('boss', pos), { phase: 1, volley: B.volley.interval, bombs: B.bombs.interval, summon: B.summon.interval, ring: B.phase2.ringInterval });
  notify(t('toast.boss', { wave: game.wave, name: t('enemy.boss') }));
}
function waveSize(wave) {
  const w = CONFIG.waves;
  return Math.min(w.maxCount, w.baseCount + wave * w.growth + Math.max(0, wave - w.lateFrom) * w.lateGrowth);
}
const isBossWave = () => game.wave % CONFIG.boss.every === 0;
function startWave() {
  const boss = isBossWave();
  game.waveRemaining = game.waveTotal = Math.round(waveSize(game.wave) * difficulty().count * (boss ? CONFIG.boss.regularShare : 1));
  game.spawnTimer = CONFIG.waves.initialSpawnDelay; game.nextWave = 0;
  if (game.event && !(game.event.zone && !game.event.done)) game.event = null;
  const fresh = CONFIG.waves.roster.find(r => r.from === game.wave && r.from > 1);
  notify(fresh ? t('toast.newEnemy', { wave: game.wave, name: t(`enemy.${fresh.kind}`) }) : t('toast.wave', { wave: game.wave }));
  sound.play('wave');
  if (boss) spawnBoss(); else if (!game.event) rollEvent();
}
// Stalker waves announce at once; airdrops and hold points begin once `trigger` of the wave has spawned.
function rollEvent() {
  const E = CONFIG.events, random = game.rng.roster;
  if (game.wave < E.from || random() >= E.chance) return;
  const type = pickWeighted(random, Object.entries(E.types).filter(([, v]) => game.wave >= (v.from ?? 0)).map(([key]) => [key, 1]));
  game.event = { type, started: type === 'stalkers', done: type === 'stalkers' };
  if (type === 'stalkers') notify(t('event.stalkers', { wave: game.wave }));
}
function beginEvent(ev) {
  const cfg = CONFIG.events.types[ev.type]; ev.started = true;
  if (ev.type === 'airdrop') {
    const pos = freeSpot(CONFIG.chests.radius + 1, cfg.distance, true);
    if (!pos) { ev.done = true; return; }
    const hp = Math.round(cfg.hp * waveScale());
    game.chests.push({ ...pos, radius: CONFIG.chests.radius, hp, maxHp: hp, hit: 0, airdrop: true }); ev.done = true;
    notify(t('event.airdrop')); sound.play('wave');
  } else {
    const pos = freeSpot(cfg.radius / 2, cfg.distance);
    if (!pos) { ev.done = true; return; }
    Object.assign(ev, { zone: pos, progress: 0, limit: cfg.limit });
    notify(t('event.hold', { seconds: cfg.seconds })); sound.play('wave');
  }
}
function updateEvent(dt) {
  const ev = game.event, p = game.player;
  if (!ev) return;
  if (!ev.started && game.waveTotal && (game.waveTotal - game.waveRemaining) / game.waveTotal >= CONFIG.events.trigger) beginEvent(ev);
  if (!ev.zone || ev.done) return;
  const cfg = CONFIG.events.types.hold;
  ev.limit -= dt;
  if (distance(p, ev.zone) < cfg.radius) ev.progress += dt;
  if (ev.progress >= cfg.seconds) {
    ev.done = true; const { x, y } = ev.zone;
    drop(x, y, 'gold', goldAmount(rand(cfg.gold[0], cfg.gold[1] + 1))); drop(x, y, 'scrap', scrapAmount(cfg.scrap)); drop(x, y, 'heal', cfg.heal);
    burst(x, y, '#f2d782', 24); sound.play('chest'); notify(t('event.holdDone'));
  } else if (ev.limit <= 0) { ev.done = true; notify(t('event.holdFailed')); }
}
// A run is either a normal game (random seed, chosen difficulty, achievement rewards) or today's daily challenge.
function startGame(daily) {
  sound.init();
  const seed = daily ? todayUTC() : `${Date.now()}:${Math.random()}`;
  game.daily = daily ? seed : null; game.difficulty = daily ? CONFIG.daily.difficulty : profile.difficulty; game.variant = variantFor(seed);
  game.rng = { roster: seededRandom(`${seed}:roster`), perks: seededRandom(`${seed}:perks`) };
  game.mode = 'playing'; game.time = 0; game.wave = 1; game.kills = 0; game.earned = 0;
  game.enemies = []; game.bullets = []; game.missiles = []; game.arcs = []; game.bombs = []; game.blasts = []; game.chests = []; game.loot = []; game.particles = [];
  game.boss = null; game.event = null; game.perks = {}; game.perkOffer = null; game.seenAffixes = new Set(); game.newAchievements = [];
  game.stats = { damage: {}, ambushKills: 0, taken: 0, bosses: 0, perks: [] };
  game.keys.clear(); game.mouse.down = false; game.chestTimer = 0; game.flash = 0;
  const levels = Object.fromEntries([...Object.keys(CONFIG.upgrades), ...Object.keys(CONFIG.gear), ...Object.keys(CONFIG.autoWeapons)].map(key => [key, 0]));
  const autoCooldowns = Object.fromEntries(Object.keys(CONFIG.autoWeapons).map(key => [key, 0]));
  const p = game.player = { ...worldCenter, radius: CONFIG.player.radius, hp: CONFIG.player.hp, maxHp: CONFIG.player.hp, shield: 0, lastHurt: 0, gold: 0, scrap: 0, levels, weapon: 'rifle', owned: new Set(['rifle']), autoCooldowns, cooldown: 0, invulnerable: 0, revealedUntil: 0, bushTime: -Infinity, facing: 0 };
  if (!daily) for (const [id, a] of Object.entries(CONFIG.achievements)) {
    if (!unlocked(id)) continue;
    if (a.startGun) { p.owned.add(a.startGun); p.weapon = a.startGun; }
    if (a.startAuto) p.levels[a.startAuto] = Math.max(1, p.levels[a.startAuto]);
  }
  generateMap(seededRandom(`${seed}:map`), game.variant);
  for (let i = 0; i < Math.min(CONFIG.chests.initial, CONFIG.chests.maximum); i++) spawnChest();
  UI.start.hidden = true; UI.end.hidden = true; UI.shop.hidden = true; UI.perk.hidden = true;
  sound.music('play'); startWave(); updateHUD();
}
function notify(text) { UI.toast.textContent = text; UI.toast.classList.add('show'); game.toastUntil = performance.now() + 1900; }
function gunStats(key = game.player.weapon) {
  const l = game.player.levels, g = CONFIG.gun, w = CONFIG.weapons[key];
  return { ...w, damage: Math.round(w.damage * (1 + l.damage * g.damageStep)), shotsPerSecond: w.shotsPerSecond * (1 + l.rate * g.rateStep) * (1 + perk('trigger') * CONFIG.perks.list.trigger.rate), pellets: w.pellets + l.spread, range: Math.round(w.range * (1 + l.range * g.rangeStep)) };
}
function gearStats() {
  const l = game.player.levels, g = CONFIG.gear;
  return { reduction: l.helmet * g.helmet.reduction, maxShield: l.shield * g.shield.capacity, speed: 1 + l.boots * g.boots.speed };
}
function itemCost(item, level) {
  return item.goldStep === undefined ? { gold: item.gold, scrap: item.scrap } : { gold: item.gold + level * item.goldStep, scrap: item.scrap + level * item.scrapStep };
}
// Description variables for each shop entry; auto weapons describe the next level (or the current one at max).
function itemVars(group, key, item, level) {
  const pct = n => Math.round(n * 100);
  if (group === 'upgrade') return { pct: pct(CONFIG.gun[`${key}Step`] ?? 0) };
  if (group === 'gear') return { pct: pct(item.reduction ?? item.speed ?? 0), hp: item.hp, cap: item.capacity, delay: CONFIG.player.shieldRegenDelay, heal: item.heal };
  if (group === 'auto') {
    const i = Math.min(level, item.max - 1);
    return { damage: item.damage[i], rate: item.rate?.[i], count: item.count?.[i], interval: item.interval?.[i], chains: item.chains?.[i], range: item.range };
  }
  const s = gunStats(key);
  return { damage: s.damage, rate: s.shotsPerSecond.toFixed(1), pellets: s.pellets, range: s.range };
}
const SHOP_TABS = { guns: 'weapons', upgrade: 'upgrades', auto: 'autoWeapons', gear: 'gear' };
function equip(key) {
  const p = game.player;
  if (!p.owned.has(key) || p.weapon === key) return;
  p.weapon = key; p.cooldown = Math.max(p.cooldown, CONFIG.player.switchDelay);
  notify(t('toast.equip', { name: t(`guns.${key}.title`) })); updateHUD();
}
function cycleWeapon() {
  const owned = Object.keys(CONFIG.weapons).filter(key => game.player.owned.has(key));
  equip(owned[(owned.indexOf(game.player.weapon) + 1) % owned.length]);
}
function purchase(group, key, item) {
  const p = game.player;
  if (game.mode !== 'shop') return;
  if (group === 'guns' && p.owned.has(key)) { equip(key); renderShop(); return; }
  const level = group === 'guns' ? 0 : p.levels[key], cost = itemCost(item, level);
  if (p.gold < cost.gold || p.scrap < cost.scrap) return;
  if (item.consumable ? p.hp >= p.maxHp : group !== 'guns' && level >= item.max) return;
  p.gold -= cost.gold; p.scrap -= cost.scrap;
  if (group === 'guns') { p.owned.add(key); equip(key); }
  else if (key === 'medkit') { p.hp = Math.min(p.maxHp, p.hp + item.heal); notify(t('toast.healed', { name: t('gear.medkit.title') })); }
  else {
    p.levels[key]++;
    if (key === 'vest') { p.maxHp += item.hp; p.hp += item.hp; }
    if (key === 'shield') p.shield = gearStats().maxShield;
    notify(t('toast.upgraded', { name: t(`${group}.${key}.title`), level: p.levels[key] }));
  }
  burst(p.x, p.y, '#e9e597', 17); sound.play('buy');
  updateHUD(); renderShop();
}
function shopRow(group, key, item) {
  const p = game.player, gun = group === 'guns', level = gun ? 0 : p.levels[key], cost = itemCost(item, level);
  const owned = gun && p.owned.has(key), full = item.consumable ? p.hp >= p.maxHp : !gun && level >= item.max;
  const row = document.createElement('div'); row.className = 'upgrade';
  const info = document.createElement('div');
  const tag = gun ? (p.weapon === key ? t('shop.equipped') : owned ? t('shop.owned') : t('shop.gun')) : item.consumable ? t('shop.consumable') : `LV. ${level}/${item.max}`;
  const vars = itemVars(group, key, item, level);
  const next = group === 'auto' && level > 0 && level < item.max ? t('shop.nextLevel') : '';
  info.innerHTML = `<div class="upgrade-title"><span class="upgrade-icon">${item.icon}</span>${t(`${group}.${key}.title`)} <small>${tag}</small></div><p>${next}${t(`${group}.${key}.desc`, vars)}${gun ? `<br>${t('shop.gunStats', vars)}` : ''}</p>`;
  const button = document.createElement('button'); button.className = 'buy-btn';
  if (owned) { button.textContent = p.weapon === key ? t('shop.inUse') : t('shop.switch'); button.disabled = p.weapon === key; }
  else {
    button.textContent = full ? (item.consumable ? t('shop.hpFull') : t('shop.maxed')) : cost.scrap ? t('shop.cost', cost) : t('shop.costGold', cost);
    button.disabled = full || p.gold < cost.gold || p.scrap < cost.scrap;
  }
  button.addEventListener('click', () => purchase(group, key, item));
  row.append(info, button); return row;
}
function renderShop() {
  const p = game.player;
  $('shopGold').textContent = p.gold; $('shopScrap').textContent = p.scrap;
  for (const tab of document.querySelectorAll('[data-shop-tab]')) tab.setAttribute('aria-selected', tab.dataset.shopTab === game.shopTab);
  $('shopItems').replaceChildren(...Object.entries(CONFIG[SHOP_TABS[game.shopTab]]).map(([key, item]) => shopRow(game.shopTab, key, item)));
}
function toggleShop() {
  if (game.mode === 'playing') { game.mode = 'shop'; game.mouse.down = false; renderShop(); UI.shop.hidden = false; sound.music('duck'); }
  else if (game.mode === 'shop') { game.mode = 'playing'; UI.shop.hidden = true; game.keys.clear(); sound.music('play'); }
}
// Perk offers come from the run's seeded perk stream: `offer` distinct perks that are below max stacks and unlocked.
function offerPerks() {
  const pool = Object.entries(CONFIG.perks.list).filter(([key, v]) => perk(key) < v.max && (!v.unlock || (!game.daily && unlocked(v.unlock)))).map(([key]) => key), offer = [];
  while (offer.length < CONFIG.perks.offer && pool.length) offer.push(pool.splice(Math.floor(game.rng.perks() * pool.length), 1)[0]);
  if (!offer.length) return false;
  game.perkOffer = offer; game.mode = 'perk'; game.mouse.down = false; game.keys.clear();
  renderPerks(); UI.perk.hidden = false; sound.music('duck'); return true;
}
function perkVars(key) {
  const v = CONFIG.perks.list[key], pct = n => Math.round(n * 100);
  return { pct: pct(v.bonus ?? v.chance ?? v.scrap ?? v.gold ?? v.rate ?? v.pickup ?? 0), heal: v.heal, hp: v.hp, seconds: v.seconds, regen: v.regen };
}
function renderPerks() {
  $('perkWave').textContent = String(game.wave).padStart(2, '0');
  $('perkChoices').replaceChildren(...game.perkOffer.map((key, i) => {
    const item = CONFIG.perks.list[key], button = document.createElement('button');
    button.type = 'button'; button.className = 'perk-card';
    button.innerHTML = `<span class="keycap">${i + 1}</span><span class="perk-icon">${item.icon}</span><b>${t(`perk.${key}.title`)}</b><small>${t('perk.stack', { level: perk(key) + 1, max: item.max })}</small><span>${t(`perk.${key}.desc`, perkVars(key))}</span>`;
    button.addEventListener('click', () => choosePerk(i));
    return button;
  }));
}
function choosePerk(index) {
  const key = game.perkOffer?.[index], p = game.player;
  if (game.mode !== 'perk' || !key) return;
  game.perks[key] = perk(key) + 1; game.stats.perks.push(key);
  if (key === 'tough') { p.maxHp += CONFIG.perks.list.tough.hp; p.hp += CONFIG.perks.list.tough.hp; }
  game.perkOffer = null; game.mode = 'playing'; UI.perk.hidden = true;
  burst(p.x, p.y, '#e9e597', 17); sound.music('play'); sound.play('buy'); notify(t('toast.perk', { name: t(`perk.${key}.title`) })); updateHUD();
}
function achievementVars(a) {
  return { wave: a.wave, count: a.ambushKills ?? a.bossKills, progress: Math.min(profile.totals.ambushKills, a.ambushKills ?? 0), difficulty: a.difficulty && t(`difficulty.${a.difficulty}`) };
}
// Start screen: difficulty picker (locked tiers name their achievement), best record, today's daily and achievements.
function renderMenu() {
  const today = todayUTC(), record = profile.records[profile.difficulty], daily = profile.daily?.date === today ? profile.daily : null;
  $('difficultyPicker').replaceChildren(...Object.entries(CONFIG.difficulty).map(([key, d]) => {
    const button = document.createElement('button'), open = difficultyOpen(key);
    button.type = 'button'; button.className = 'tab-btn'; button.textContent = t(`difficulty.${key}`);
    button.setAttribute('aria-pressed', key === profile.difficulty); button.disabled = !open;
    button.title = open ? t(`difficulty.${key}.desc`) : t('menu.locked', { name: t(`achievement.${d.unlock}.title`) });
    button.addEventListener('click', () => { profile.difficulty = key; saveProfile(); renderMenu(); });
    return button;
  }));
  $('recordLine').textContent = record ? t('menu.record', { wave: record.wave, kills: record.kills, time: formatTime(record.time) }) : t('menu.noRecord');
  $('dailyInfo').textContent = t('menu.daily', { date: today, variant: t(`variant.${variantFor(today)}`) }) + (daily ? t('menu.dailyBest', { wave: daily.wave, kills: daily.kills }) : '');
  $('achievementList').replaceChildren(...Object.entries(CONFIG.achievements).map(([id, a]) => {
    const chip = document.createElement('span');
    chip.className = unlocked(id) ? 'achievement' : 'achievement locked';
    chip.textContent = `${a.icon} ${t(`achievement.${id}.title`)}`;
    chip.title = `${t(`achievement.${id}.desc`, achievementVars(a))}\n${t(`achievement.${id}.reward`)}`;
    return chip;
  }));
}
function renderSettings() {
  for (const kind of ['music', 'sfx']) {
    const button = $(`${kind}Btn`), slider = $(`${kind}Volume`);
    button.textContent = t(`settings.${kind}.${sound.enabled[kind] ? 'on' : 'off'}`); button.setAttribute('aria-pressed', sound.enabled[kind]);
    slider.value = sound.volume[kind]; slider.disabled = !sound.enabled[kind];
    $(`${kind}VolumeText`).textContent = `${sound.volume[kind]}%`;
  }
}
// Rewrites every marked static string ([data-i18n] text, [data-i18n-attr] "attr:key" pairs) and re-renders dynamic UI.
const SITE_URL = document.querySelector('link[rel=canonical]').href; // build writes the default-locale URL
function applyLocale(lang) {
  locale = lang; STRINGS = LOCALES[lang].game;
  const page = LOCALES[lang].page, query = lang === DEFAULT_LOCALE ? '' : `?lang=${lang}`, url = new URL(location.href);
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = page[el.dataset.i18n];
  for (const el of document.querySelectorAll('[data-i18n-attr]')) for (const pair of el.dataset.i18nAttr.split(',')) { const [attr, key] = pair.split(':'); el.setAttribute(attr, page[key]); }
  for (const link of document.querySelectorAll('[data-lang]')) {
    if (link.dataset.lang === lang) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
  if (query) url.searchParams.set('lang', lang); else url.searchParams.delete('lang');
  history.replaceState(history.state, '', url);
  document.querySelector('link[rel=canonical]').href = document.querySelector('meta[property="og:url"]').content = new URL(query, SITE_URL).href;
  renderSettings(); renderMenu(); updateHUD(); if (game.mode === 'shop') renderShop();
  if (game.mode === 'perk') renderPerks();
  if (game.mode === 'ended') renderEnd();
}
function updateHUD() {
  if (!game.player) return;
  const p = game.player, gun = gunStats(), gear = gearStats(), total = Object.keys(CONFIG.upgrades).reduce((sum, key) => sum + p.levels[key], 0);
  $('hpText').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('hpFill').style.width = `${100 * Math.max(0, p.hp) / p.maxHp}%`;
  $('shieldText').textContent = gear.maxShield ? `${Math.floor(p.shield)} / ${gear.maxShield}` : t('hud.noShield');
  $('shieldFill').style.width = `${gear.maxShield ? 100 * p.shield / gear.maxShield : 0}%`;
  $('waveText').textContent = String(game.wave).padStart(2, '0');
  const tags = [t(game.nextWave ? 'hud.intermission' : 'hud.combat'), game.variant !== 'standard' && t(`variant.${game.variant}`), game.daily ? t('hud.daily') : game.difficulty !== 'normal' && t(`difficulty.${game.difficulty}`)].filter(Boolean);
  $('wavePill').textContent = `WAVE ${String(game.wave).padStart(2, '0')} / ${tags.join(' · ')}`;
  $('killsText').textContent = game.kills; $('goldText').textContent = p.gold; $('scrapText').textContent = p.scrap;
  $('damageStat').textContent = gun.damage; $('rateStat').textContent = `${gun.shotsPerSecond.toFixed(1)}/s`;
  $('spreadStat').textContent = gun.pellets; $('rangeStat').textContent = gun.range;
  $('armorStat').textContent = `${Math.round(gear.reduction * 100)}%`; $('speedStat').textContent = `${Math.round(gear.speed * 100)}%`;
  $('weaponName').textContent = t(`guns.${p.weapon}.title`);
  $('weaponTier').textContent = t('hud.weaponTier', { owned: p.owned.size, total: Object.keys(CONFIG.weapons).length, level: total });
  const autos = Object.entries(CONFIG.autoWeapons).filter(([key]) => p.levels[key]);
  $('autoList').textContent = `${t('hud.auto')}${autos.length ? autos.map(([key, item]) => `${item.icon} ${p.levels[key]}`).join('　') : t('hud.none')}`;
  $('autoList').title = autos.map(([key]) => `${t(`auto.${key}.title`)} LV. ${p.levels[key]}`).join('\n');
  const perks = Object.entries(CONFIG.perks.list).filter(([key]) => perk(key));
  $('perkList').textContent = `${t('hud.perks')}${perks.length ? perks.map(([key, item]) => `${item.icon} ${perk(key)}`).join('　') : t('hud.none')}`;
  $('perkList').title = perks.map(([key]) => `${t(`perk.${key}.title`)} ×${perk(key)}`).join('\n');
  const hidden = isHidden(), inBush = inTerrain(p, game.bushes), holding = inBush && autos.length ? t('hud.autoHold') : '';
  $('stealthText').textContent = (hidden ? t('hud.hidden') : inBush ? t('hud.revealed') : inTerrain(p, game.ponds) ? t('hud.wading') : t('hud.exposed')) + holding;
  const ev = game.event, hold = ev?.zone && !ev.done ? t('hud.hold', { progress: Math.floor(ev.progress), seconds: CONFIG.events.types.hold.seconds, left: Math.ceil(ev.limit) }) : '';
  $('fieldStatus').textContent = hold || (hidden ? t('hud.concealed') : `● HOSTILES ${game.enemies.length + game.waveRemaining}`);
}
// Burned bushes stop concealing anyone until they regrow.
function inTerrain(entity, terrain) { return terrain.some(r => !r.burned && pointIn(entity.x, entity.y, r)); }
// Hidden = in grass (or within the Shadow Step grace after leaving it) and not revealed by recent fire.
function isHidden() {
  const p = game.player;
  if (!p || game.time < p.revealedUntil) return false;
  return inTerrain(p, game.bushes) || game.time - p.bushTime < perk('shadow') * CONFIG.perks.list.shadow.seconds;
}
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
// Shots fired while hidden are ambush shots: they get the Ambush perk bonus and count toward ambush kills.
function shoot() {
  const p = game.player, gun = gunStats(), angle = p.facing, ambush = isHidden();
  const damage = Math.round(gun.damage * (ambush ? 1 + perk('ambush') * CONFIG.perks.list.ambush.bonus : 1));
  p.cooldown = 1 / gun.shotsPerSecond;
  p.revealedUntil = game.time + CONFIG.player.revealSeconds;
  for (let i = 0; i < gun.pellets; i++) {
    const a = angle + (i - (gun.pellets - 1) / 2) * gun.spreadRadians + rand(-gun.jitter, gun.jitter), x = p.x + Math.cos(a) * 21, y = p.y + Math.sin(a) * 21;
    game.bullets.push({ x, y, vx: Math.cos(a) * gun.bulletSpeed, vy: Math.sin(a) * gun.bulletSpeed, traveled: 0, range: gun.range, damage, radius: CONFIG.gun.bulletRadius, friendly: true, pierce: gun.pierce, hits: gun.pierce ? new Set() : null, color: gun.color, trail: p.weapon === 'rail', source: p.weapon, ambush });
  }
  burst(p.x + Math.cos(angle) * 23, p.y + Math.sin(angle) * 23, '#f3e8aa', 5);
  sound.play(gun.sound); game.shake = gun.shake; updateHUD();
}
function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) { const a = rand(0, Math.PI * 2), speed = rand(35, 160), life = rand(.2, .7); game.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life, maxLife: life }); }
}
function drop(x, y, kind, amount) { game.loot.push({ x: x + rand(-13, 13), y: y + rand(-13, 13), kind, amount, age: 0, phase: rand(0, 6) }); }
function enemyDeath(enemy, ambush) {
  game.enemies.splice(game.enemies.indexOf(enemy), 1); game.kills++;
  const l = CONFIG.loot, stats = CONFIG.enemies[enemy.kind], P = CONFIG.perks.list, p = game.player;
  if (enemy.kind === 'boss') bossDeath(enemy);
  else if (!enemy.noLoot) {
    const bounty = stats.bounty * (enemy.affix ? CONFIG.elites.bounty : 1);
    drop(enemy.x, enemy.y, 'gold', goldAmount(rand(l.coinEnemy[0], l.coinEnemy[1] + 1) * bounty));
    if (Math.random() < l.scrapEnemyChance * bounty) drop(enemy.x, enemy.y, 'scrap', scrapAmount(1));
  }
  if (ambush) { game.stats.ambushKills++; if (perk('phantom')) p.revealedUntil = game.time; }
  if (perk('vampire')) p.hp = Math.min(p.maxHp, p.hp + perk('vampire') * P.vampire.heal);
  if (enemy.affix === 'splitter') {
    const s = CONFIG.elites.affixes.splitter;
    for (let i = 0; i < s.count; i++) spawnNear(enemy.kind, enemy, enemy.radius, { hpScale: s.hp, radius: s.radius });
  }
  burst(enemy.x, enemy.y, stats.color, 13); sound.play('kill', enemy);
  if (Math.random() < perk('volatile') * P.volatile.chance) explode(enemy.x, enemy.y, Math.round(P.volatile.damage * waveScale()), { blast: P.volatile.blast, source: 'perk' });
  updateHUD();
}
function bossDeath(boss) {
  const L = CONFIG.boss.loot;
  drop(boss.x, boss.y, 'gold', goldAmount(L.gold)); drop(boss.x, boss.y, 'scrap', scrapAmount(L.scrap)); drop(boss.x, boss.y, 'heal', L.heal);
  game.boss = null; game.stats.bosses++;
  burst(boss.x, boss.y, '#f2d782', 40); game.shake = Math.max(game.shake, 10); sound.play('chest'); notify(t('toast.bossDown', { name: t('enemy.boss') }));
}
function chestDeath(chest) {
  game.chests.splice(game.chests.indexOf(chest), 1); const l = CONFIG.loot;
  if (chest.airdrop) {
    const a = CONFIG.events.types.airdrop;
    drop(chest.x, chest.y, 'gold', goldAmount(rand(a.gold[0], a.gold[1] + 1))); drop(chest.x, chest.y, 'scrap', scrapAmount(Math.floor(rand(a.scrap[0], a.scrap[1] + 1)))); drop(chest.x, chest.y, 'heal', a.heal);
  } else {
    drop(chest.x, chest.y, 'gold', goldAmount(rand(l.coinChest[0], l.coinChest[1] + 1)));
    drop(chest.x, chest.y, 'scrap', scrapAmount(Math.floor(rand(l.scrapChest[0], l.scrapChest[1] + 1))));
    if (Math.random() < l.healChestChance) drop(chest.x, chest.y, 'heal', l.healAmount);
  }
  burst(chest.x, chest.y, '#f2d782', 20); sound.play('chest'); notify(t(chest.airdrop ? 'event.airdropOpen' : 'toast.chest'));
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
  hitEnemyBody(e, b.damage, b.source, b.ambush);
}
// Direct body damage: used by bullets past the shield and by blades, missiles and arcs, which ignore frontal shields.
// `source` feeds the end-of-run damage breakdown; armored elites shrug off part of every hit.
function hitEnemyBody(e, damage, source, ambush = false) {
  if (e.hp <= 0) return;
  if (e.affix === 'armored') damage *= 1 - CONFIG.elites.affixes.armored.reduction;
  game.stats.damage[source] = (game.stats.damage[source] ?? 0) + Math.min(e.hp, damage);
  e.hp -= damage; e.hit = .15; e.reveal = CONFIG.enemies[e.kind].revealSeconds ?? 0; burst(e.x, e.y, CONFIG.enemies[e.kind].color, 4);
  if (e.hp <= 0) enemyDeath(e, ambush); else sound.play('hit', e);
}
function damageChest(c, damage) {
  if (c.hp <= 0) return;
  c.hp -= damage; c.hit = .15; burst(c.x, c.y, '#efd58a', 4);
  if (c.hp <= 0) chestDeath(c); else sound.play('hit', c);
}
// Barrels light a short fuse when destroyed so chained blasts ripple outward.
function damageBarrel(b, damage) {
  if (b.fuse > 0) return;
  b.hp -= damage; b.hit = .15;
  if (b.hp <= 0) b.fuse = CONFIG.barrels.chainDelay;
}
function updateBarrels(dt) {
  const B = CONFIG.barrels;
  for (const b of [...game.barrels]) {
    b.hit = Math.max(0, b.hit - dt);
    if (b.fuse > 0 && (b.fuse -= dt) <= 0) {
      game.barrels.splice(game.barrels.indexOf(b), 1);
      explode(b.x, b.y, Math.round(B.damage * waveScale()), { blast: B.blast, source: 'barrel', burn: true, playerDamage: B.playerDamage });
    }
  }
}
function burnGrass(x, y, radius) {
  for (const r of game.bushes) if (circleRect(x, y, radius, r)) { r.burned = CONFIG.world.burnSeconds; burst(clamp(x, r.x, r.x + r.w), clamp(y, r.y, r.y + r.h), '#f0a24f', 6); }
}
function nearestEnemy(from, range, exclude) {
  let best = null, bestDistance = range;
  for (const e of game.enemies) {
    const d = distance(from, e);
    if (d < bestDistance && !exclude?.has(e) && !isCloaked(e) && clearSight(from, e)) { best = e; bestDistance = d; }
  }
  return best;
}
function dronePosition(p) {
  const s = CONFIG.autoWeapons.drone, a = game.time * s.orbitSpeed;
  return { x: p.x + Math.cos(a) * s.orbit, y: p.y + Math.sin(a) * s.orbit };
}
function bladePositions(p) {
  const s = CONFIG.autoWeapons.blades, n = p.levels.blades ? s.count[p.levels.blades - 1] : 0;
  return Array.from({ length: n }, (_, i) => { const a = game.time * s.spin + i * Math.PI * 2 / n; return { x: p.x + Math.cos(a) * s.radius, y: p.y + Math.sin(a) * s.radius, a }; });
}
function updateAutoWeapons(dt) {
  const p = game.player, A = CONFIG.autoWeapons, l = p.levels, cd = p.autoCooldowns;
  for (const key in cd) cd[key] -= dt;
  if (l.blades) {
    const s = A.blades, damage = s.damage[l.blades - 1];
    for (const blade of bladePositions(p)) for (const e of [...game.enemies]) {
      if (e.bladeCooldown <= 0 && Math.hypot(e.x - blade.x, e.y - blade.y) < e.radius + s.size) { e.bladeCooldown = s.hitCooldown; sound.play('blade', e); hitEnemyBody(e, damage, 'blades'); }
    }
  }
  if (inTerrain(p, game.bushes)) return;
  if (l.drone && cd.drone <= 0) {
    const s = A.drone, from = dronePosition(p), target = nearestEnemy(from, s.range);
    if (target) {
      const a = Math.atan2(target.y - from.y, target.x - from.x);
      game.bullets.push({ ...from, vx: Math.cos(a) * s.bulletSpeed, vy: Math.sin(a) * s.bulletSpeed, traveled: 0, range: s.range + 40, damage: s.damage[l.drone - 1], radius: 3, friendly: true, pierce: 0, hits: null, color: '#bfe8ff', source: 'drone' });
      cd.drone = 1 / s.rate[l.drone - 1]; sound.play('drone', from);
    }
  }
  if (l.missile && cd.missile <= 0) {
    const s = A.missile, target = nearestEnemy(p, s.range);
    if (target) {
      game.missiles.push({ x: p.x, y: p.y, angle: Math.atan2(target.y - p.y, target.x - p.x) + rand(-.7, .7), target, damage: s.damage[l.missile - 1], life: s.life });
      cd.missile = s.interval[l.missile - 1]; sound.play('missile');
    }
  }
  if (l.tesla && cd.tesla <= 0) {
    const s = A.tesla, first = nearestEnemy(p, s.range);
    if (first) {
      const chain = [first], hit = new Set(chain);
      while (chain.length < s.chains[l.tesla - 1]) { const next = nearestEnemy(chain.at(-1), s.chainRange, hit); if (!next) break; chain.push(next); hit.add(next); }
      game.arcs.push({ points: [{ x: p.x, y: p.y }, ...chain.map(e => ({ x: e.x, y: e.y }))], life: .16 });
      for (const e of chain) hitEnemyBody(e, s.damage[l.tesla - 1], 'tesla');
      cd.tesla = s.interval[l.tesla - 1]; sound.play('zap');
    }
  }
}
// Shared blast: damages enemies and chests, sets off barrels, optionally hurts the player and burns grass.
function explode(x, y, damage, { blast = CONFIG.autoWeapons.missile.blast, source = 'missile', burn = false, playerDamage = 0 } = {}) {
  const p = game.player;
  burst(x, y, '#f6b36b', 22); burst(x, y, '#fff0c0', 8); sound.play('explosion', { x, y }); game.shake = Math.max(game.shake, 4 + (burn ? 4 : 0));
  game.blasts.push({ x, y, radius: blast, life: .35 });
  if (damage) {
    for (const e of [...game.enemies]) if (Math.hypot(e.x - x, e.y - y) < blast + e.radius) hitEnemyBody(e, damage, source);
    for (const c of [...game.chests]) if (Math.hypot(c.x - x, c.y - y) < blast + c.radius) damageChest(c, damage);
  }
  for (const b of game.barrels) if (Math.hypot(b.x - x, b.y - y) < blast + b.radius) damageBarrel(b, CONFIG.barrels.hp);
  if (playerDamage && distance(p, { x, y }) < blast + p.radius) hurtPlayer(playerDamage);
  if (burn) burnGrass(x, y, blast);
}
function updateMissiles(dt) {
  const s = CONFIG.autoWeapons.missile;
  for (let i = game.missiles.length - 1; i >= 0; i--) {
    const m = game.missiles[i]; m.life -= dt;
    if (!game.enemies.includes(m.target)) m.target = nearestEnemy(m, s.range);
    if (m.target) m.angle += clamp(angleDiff(Math.atan2(m.target.y - m.y, m.target.x - m.x), m.angle), -s.turn * dt, s.turn * dt);
    const nx = m.x + Math.cos(m.angle) * s.speed * dt, ny = m.y + Math.sin(m.angle) * s.speed * dt;
    const wall = game.walls.some(r => lineRect(m.x, m.y, nx, ny, r)), hit = game.enemies.some(e => segmentCircle(m.x, m.y, nx, ny, e, e.radius + 4));
    if (hit || wall || m.life <= 0 || !passable(nx, ny, 1)) { explode(m.x, m.y, m.damage); game.missiles.splice(i, 1); }
    else { m.x = nx; m.y = ny; if (Math.random() < .5) game.particles.push({ x: m.x, y: m.y, vx: rand(-20, 20), vy: rand(-20, 20), color: '#d9d2c0', life: .35, maxLife: .35 }); }
  }
  for (let i = game.arcs.length - 1; i >= 0; i--) if ((game.arcs[i].life -= dt) <= 0) game.arcs.splice(i, 1);
  for (let i = game.blasts.length - 1; i >= 0; i--) if ((game.blasts[i].life -= dt) <= 0) game.blasts.splice(i, 1);
}
function hurtPlayer(damage) {
  const p = game.player;
  if (p.invulnerable > 0 || game.mode !== 'playing') return;
  let amount = damage * (1 - gearStats().reduction);
  game.stats.taken += amount;
  p.invulnerable = CONFIG.player.invulnerability; p.lastHurt = game.time;
  const absorbed = Math.min(p.shield, amount); p.shield -= absorbed; amount -= absorbed;
  if (amount > 0) { p.hp = Math.max(0, p.hp - amount); game.flash = .35; game.shake = 7; burst(p.x, p.y, '#f29785', 9); sound.play('hurt'); }
  else { game.shake = 3; burst(p.x, p.y, '#a9dcee', 9); sound.play('shieldHit'); }
  updateHUD();
  if (!p.hp) finishRun();
}
// Game over: update personal records and cumulative totals, grant newly earned achievements, show the report.
function finishRun() {
  game.mode = 'ended'; game.mouse.down = false;
  const run = { wave: game.wave, kills: game.kills, time: Math.floor(game.time) }, key = game.daily ? 'daily' : game.difficulty;
  const best = { wave: 0, kills: 0, time: 0, ...profile.records[key] }, fresh = Object.keys(run).filter(field => run[field] > best[field]);
  for (const field of fresh) best[field] = run[field];
  profile.records[key] = best;
  if (game.daily && (profile.daily?.date !== game.daily || run.wave > profile.daily.wave || (run.wave === profile.daily.wave && run.kills > profile.daily.kills))) profile.daily = { date: game.daily, ...run };
  profile.totals.ambushKills += game.stats.ambushKills; profile.totals.bossKills += game.stats.bosses;
  game.newAchievements = Object.entries(CONFIG.achievements).filter(([id, a]) => !unlocked(id) && achieved(a)).map(([id]) => id);
  profile.achievements.push(...game.newAchievements); saveProfile();
  game.summary = { run, fresh };
  renderEnd(); renderMenu();
  UI.end.hidden = false; UI.perk.hidden = true; sound.music('stop'); sound.play('gameOver');
}
const DIFFICULTY_KEYS = Object.keys(CONFIG.difficulty);
function achieved(a) {
  if (a.wave && game.wave < a.wave) return false;
  if (a.difficulty && (game.daily || DIFFICULTY_KEYS.indexOf(game.difficulty) < DIFFICULTY_KEYS.indexOf(a.difficulty))) return false;
  if (a.ambushKills && profile.totals.ambushKills < a.ambushKills) return false;
  return !a.bossKills || profile.totals.bossKills >= a.bossKills;
}
const sourceName = key => CONFIG.weapons[key] ? t(`guns.${key}.title`) : CONFIG.autoWeapons[key] ? t(`auto.${key}.title`) : t(`source.${key}`);
function renderEnd() {
  const { run, fresh } = game.summary, s = game.stats, mark = field => fresh.includes(field) ? ` <em>${t('end.best')}</em>` : '';
  $('endWave').innerHTML = String(run.wave).padStart(2, '0') + mark('wave');
  $('endKills').innerHTML = run.kills + mark('kills');
  $('endTime').innerHTML = formatTime(run.time) + mark('time');
  $('endGold').textContent = game.earned;
  $('endAmbush').textContent = s.ambushKills; $('endTaken').textContent = Math.round(s.taken); $('endBosses').textContent = s.bosses;
  const sources = Object.entries(s.damage).filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]);
  $('endDamage').textContent = sources.length ? sources.map(([key, v]) => `${sourceName(key)} ${Math.round(v)}`).join(' · ') : t('hud.none');
  $('endPerks').textContent = s.perks.length ? s.perks.map(key => CONFIG.perks.list[key].icon).join(' ') : t('hud.none');
  $('endMode').textContent = [game.daily ? `${t('hud.daily')} ${game.daily}` : t(`difficulty.${game.difficulty}`), t(`variant.${game.variant}`)].join(' · ');
  $('endAchievements').hidden = !game.newAchievements.length;
  $('endAchievements').textContent = t('end.unlocked', { list: game.newAchievements.map(id => `${CONFIG.achievements[id].icon} ${t(`achievement.${id}.title`)}`).join('、') });
  $('shareBtn').hidden = !game.daily; $('shareBtn').textContent = t('end.share');
}
function shareText() {
  const run = game.summary.run;
  return t('share.text', { date: game.daily, wave: run.wave, kills: run.kills, time: formatTime(run.time), variant: t(`variant.${game.variant}`), url: SITE_URL });
}
async function copyShare() {
  const text = shareText();
  try { await navigator.clipboard.writeText(text); }
  catch {
    const area = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
  }
  $('shareBtn').textContent = t('end.copied');
}
function steer(enemy, angle, speed, dt) {
  const x = enemy.x, y = enemy.y;
  for (const offset of [0, .65, -.65, 1.3, -1.3, Math.PI]) {
    const a = angle + offset, dx = Math.cos(a) * speed * dt, dy = Math.sin(a) * speed * dt;
    if (passable(x + dx * 3, y + dy * 3, enemy.radius)) { move(enemy, dx, dy); return; }
  }
}
// Cloaked enemies are drawn faintly and skipped by auto-targeting until close, just hit, or just attacked.
function isCloaked(e) {
  const stats = CONFIG.enemies[e.kind];
  return !!stats.cloakAlpha && e.reveal <= 0 && distance(e, game.player) > stats.revealDistance;
}
// Bomber self-destruct: blast damage ignores grass concealment, burns grass and sets off barrels; the bomber dies without loot or a kill.
function detonate(e) {
  const stats = CONFIG.enemies[e.kind];
  game.enemies.splice(game.enemies.indexOf(e), 1);
  burst(e.x, e.y, '#8a5a3c', 10);
  explode(e.x, e.y, 0, { blast: stats.blast, burn: true, playerDamage: enemyDamage(stats) });
}
function enemyShot(e, angle, s) {
  game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * s.speed, vy: Math.sin(angle) * s.speed, range: CONFIG.enemies.boss.sight * 1.4, traveled: 0, damage: enemyDamage(s), radius: s.radius, friendly: false });
}
// Commander attacks on top of its melee chase: aimed volleys, lobbed bombs, minion summons; phase 2 adds speed, pace and bullet rings.
function updateBoss(e, dt) {
  const B = CONFIG.boss, p = game.player;
  if (e.phase === 1 && e.hp < e.maxHp * B.phase2.at) {
    e.phase = 2; e.speed *= B.phase2.speed; burst(e.x, e.y, '#ff8a6a', 30); sound.play('shieldBreak', e); notify(t('toast.bossPhase', { name: t('enemy.boss') }));
  }
  if (e.state === 'wander' || e.state === 'alert') return;
  const pace = e.phase === 2 ? B.phase2.pace : 1, aim = Math.atan2(p.y - e.y, p.x - e.x);
  e.volley -= dt; e.bombs -= dt; e.summon -= dt; e.ring -= dt;
  if (e.volley <= 0 && clearSight(e, p)) {
    for (let i = 0; i < B.volley.count; i++) enemyShot(e, aim + (i - (B.volley.count - 1) / 2) * B.volley.spread, B.volley);
    e.volley = B.volley.interval * pace; sound.play('enemyShot', e);
  }
  if (e.bombs <= 0 && distance(e, p) < B.bombs.range) {
    for (let i = 0; i < (e.phase === 2 ? B.phase2.bombs : B.bombs.count); i++) game.bombs.push({ x: p.x + rand(-B.bombs.scatter, B.bombs.scatter) * Math.min(i, 1), y: p.y + rand(-B.bombs.scatter, B.bombs.scatter) * Math.min(i, 1), time: B.bombs.fall });
    e.bombs = B.bombs.interval * pace; sound.play('fuse', e);
  }
  if (e.summon <= 0) {
    for (let i = 0; i < B.summon.count && game.enemies.length < CONFIG.waves.maxAlive; i++) spawnNear(B.summon.kinds[i % B.summon.kinds.length], e, e.radius + B.summon.distance, { noLoot: true });
    e.summon = B.summon.interval * pace; burst(e.x, e.y, '#c7866f', 16);
  }
  if (e.phase === 2 && e.ring <= 0) {
    for (let i = 0; i < B.phase2.ring; i++) enemyShot(e, aim + i * Math.PI * 2 / B.phase2.ring, B.volley);
    e.ring = B.phase2.ringInterval; sound.play('enemyShot', e);
  }
}
function updateBombs(dt) {
  const s = CONFIG.boss.bombs;
  for (let i = game.bombs.length - 1; i >= 0; i--) {
    const b = game.bombs[i];
    if ((b.time -= dt) > 0) continue;
    game.bombs.splice(i, 1);
    explode(b.x, b.y, 0, { blast: s.blast, burn: true, playerDamage: enemyDamage(s) });
  }
}
function updateEnemy(e, dt) {
  const p = game.player, stats = CONFIG.enemies[e.kind], d = distance(e, p), detect = !isHidden() || d < (stats.sense ?? 0), speed = stats.speed * e.speed;
  const visible = detect && d < stats.sight * CONFIG.variants[game.variant].sight && clearSight(e, p), melee = !stats.projectileSpeed && !stats.fuse;
  if (e.affix === 'regen') e.hp = Math.min(e.maxHp, e.hp + CONFIG.elites.affixes.regen.rate * e.maxHp * dt);
  e.cooldown -= dt; e.hit = Math.max(0, e.hit - dt); e.blocked = Math.max(0, e.blocked - dt); e.bladeCooldown -= dt; e.reveal -= dt;
  if (e.fuse > 0) {
    e.fuse -= dt; e.facing = Math.atan2(p.y - e.y, p.x - e.x);
    steer(e, e.facing, speed * stats.fuseSpeed, dt);
    if (e.fuse <= 0) detonate(e);
    return;
  }
  const turn = angleDiff(e.state === 'wander' ? e.direction : Math.atan2(p.y - e.y, p.x - e.x), e.facing), maxTurn = (stats.turnRate ?? Infinity) * dt;
  e.facing += clamp(turn, -maxTurn, maxTurn);
  if (visible) {
    if (e.state === 'wander') { e.state = 'alert'; e.alertTime = CONFIG.enemies.alertSeconds; }
    e.lost = CONFIG.enemies.loseTargetSeconds;
    if (e.state === 'alert') { e.alertTime -= dt; if (e.alertTime <= 0) e.state = 'chase'; }
    else e.state = d <= stats.reach ? 'attack' : 'chase';
  } else if (e.state !== 'wander') {
    e.lost -= dt;
    if (e.lost <= 0 || !detect) { e.state = 'wander'; e.wanderTime = 0; }
    else e.state = 'chase';
  }
  if (e.state === 'wander') {
    e.wanderTime -= dt;
    if (e.wanderTime <= 0) { e.direction = rand(-Math.PI, Math.PI); e.wanderTime = rand(...CONFIG.enemies.wanderInterval); }
    steer(e, e.direction, speed * stats.wanderSpeed, dt);
  } else if (e.state === 'chase') {
    if (!detect) return;
    const weave = stats.weave ? Math.sin(game.time * stats.weaveSpeed + e.seed) * stats.weave : 0;
    steer(e, Math.atan2(p.y - e.y, p.x - e.x) + weave, speed, dt);
  } else if (e.state === 'attack') {
    if (stats.fuse) { e.fuse = stats.fuse; sound.play('fuse', e); }
    else if (melee) {
      if (e.cooldown <= 0 && d < stats.reach + p.radius) { hurtPlayer(enemyDamage(stats)); e.cooldown = stats.cooldown; e.reveal = stats.revealSeconds ?? 0; }
    } else {
      if (d < stats.reach * stats.retreatRatio) steer(e, Math.atan2(e.y - p.y, e.x - p.x), speed * stats.retreatSpeed, dt);
      if (e.cooldown <= 0) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * stats.projectileSpeed, vy: Math.sin(a) * stats.projectileSpeed, range: stats.sight, traveled: 0, damage: enemyDamage(stats), radius: stats.projectileRadius, friendly: false });
        e.cooldown = stats.cooldown; sound.play('enemyShot', e);
      }
    }
  }
  if (e.kind === 'boss') updateBoss(e, dt);
  if (melee && e.state !== 'wander' && d < e.radius + p.radius + 2 && e.cooldown <= 0 && detect) {
    hurtPlayer(enemyDamage(stats)); e.cooldown = stats.cooldown; e.reveal = stats.revealSeconds ?? 0;
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
      if (b.friendly) target = [...game.enemies, ...game.chests, ...game.barrels].find(o => !b.hits?.has(o) && !(o.fuse > 0 && o.barrel) && segmentCircle(b.x, b.y, nx, ny, o, o.radius + b.radius));
      else if (segmentCircle(b.x, b.y, nx, ny, game.player, game.player.radius + b.radius)) target = game.player;
    }
    let spent = !!target;
    if (target) {
      if (target === game.player) hurtPlayer(b.damage);
      else if (target.kind) { damageEnemy(target, b); if (b.pierce > 0) { b.pierce--; b.hits.add(target); spent = false; } }
      else if (target.barrel) damageBarrel(target, b.damage);
      else damageChest(target, b.damage);
    }
    if (spent || wall || b.traveled >= b.range || nx < 0 || ny < 0 || nx > CONFIG.world.width || ny > CONFIG.world.height) {
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
  if (inTerrain(p, game.bushes)) p.bushTime = game.time;
  for (const r of game.bushes) if (r.burned) r.burned = Math.max(0, r.burned - dt);
  if (perk('mender')) p.hp = Math.min(p.maxHp, p.hp + perk('mender') * CONFIG.perks.list.mender.regen * dt);
  const maxShield = gearStats().maxShield;
  if (p.shield < maxShield && isHidden() && game.time - p.lastHurt >= CONFIG.player.shieldRegenDelay) p.shield = Math.min(maxShield, p.shield + CONFIG.player.shieldRegenRate * dt);
  const camera = getCamera();
  if (game.mouse.active) p.facing = Math.atan2(game.mouse.y + camera.y - p.y, game.mouse.x + camera.x - p.x);
  if (game.mouse.down && p.cooldown <= 0) shoot();
  for (const e of [...game.enemies]) updateEnemy(e, dt);
  updateAutoWeapons(dt);
  updateBullets(dt);
  updateMissiles(dt);
  updateBombs(dt);
  updateBarrels(dt);
  updateEvent(dt);
  if (game.mode !== 'playing') return;
  const pickup = CONFIG.player.pickupRadius * (1 + perk('magnet') * CONFIG.perks.list.magnet.pickup);
  for (let i = game.loot.length - 1; i >= 0; i--) {
    const item = game.loot[i]; item.age += dt;
    if (distance(item, p) < pickup) {
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
    if (!game.nextWave) { game.nextWave = CONFIG.waves.intermission; notify(t('toast.cleared')); if (offerPerks()) return; }
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
// Ground tint per map variant (rendering only).
const GROUND = { standard: '#354c39', night: '#2c4033', rain: '#31493d', scorched: '#4a4a35' };
function drawWorld() {
  const w = CONFIG.world; ctx.fillStyle = GROUND[game.variant]; ctx.fillRect(0, 0, w.width, w.height);
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
  const live = game.bushes.filter(r => !r.burned);
  for (const r of game.bushes) if (r.burned) {
    roundRect(r.x, r.y, r.w, r.h, 22, '#3b3a2c');
    for (let i = 0; i < 6; i++) { const a = i * 1.9, bx = r.x + r.w * (.5 + .35 * Math.cos(a)), by = r.y + r.h * (.5 + .32 * Math.sin(a)); ctx.fillStyle = r.burned > CONFIG.world.burnSeconds - 3 && (i + Math.floor(game.time * 8)) % 3 === 0 ? '#f0a24f' : '#2a2820'; ctx.fillRect(bx - 3, by - 2, 6, 4); }
  }
  for (const r of live) roundRect(r.x - 5, r.y - 2, r.w + 10, r.h + 10, 25, '#253e2c');
  for (const r of live) roundRect(r.x, r.y, r.w, r.h, 22, '#568253');
  for (const r of live) {
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
  roundRect(-21, -19, 42, 33, 4, c.hit > 0 ? '#fff2c3' : c.airdrop ? '#4f6f8f' : '#9f683d');
  ctx.strokeStyle = '#e3b466'; ctx.lineWidth = 3; ctx.strokeRect(-18, -16, 36, 27);
  ctx.fillStyle = '#e8cc7b'; ctx.fillRect(-4, -18, 8, 29); ctx.fillRect(-21, -3, 42, 5);
  ctx.fillStyle = '#5f452c'; ctx.fillRect(-3, -5, 6, 8);
  ctx.restore();
  if (c.airdrop) { ctx.strokeStyle = '#dfe9f2aa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x - 18, c.y - 20); ctx.lineTo(c.x, c.y - 44); ctx.lineTo(c.x + 18, c.y - 20); ctx.stroke(); ctx.fillStyle = '#e7eef4'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 46, 22, 9, 0, Math.PI, 0); ctx.fill(); }
  if (c.hp < c.maxHp) drawHealth(c.x, c.y - 30, c.hp / c.maxHp, 41);
}
function drawBarrel(b) {
  const lit = b.fuse > 0 || b.hit > 0;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = '#10251ca0'; ctx.beginPath(); ctx.ellipse(3, 13, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  roundRect(-11, -14, 22, 28, 5, lit ? '#fff0c0' : '#b5452f');
  ctx.fillStyle = '#e8c35a'; ctx.fillRect(-11, -4, 22, 5); ctx.fillStyle = '#6e2a1d'; ctx.fillRect(-11, -12, 22, 2); ctx.fillRect(-11, 9, 22, 2);
  ctx.restore();
}
// Boss bombs: shrinking target ring on the ground until impact.
function drawHazards() {
  const s = CONFIG.boss.bombs;
  for (const b of game.bombs) {
    const k = 1 - b.time / s.fall;
    ctx.strokeStyle = `rgba(255,112,80,${.4 + .5 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, s.blast, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,112,80,.18)'; ctx.beginPath(); ctx.arc(b.x, b.y, s.blast * k, 0, Math.PI * 2); ctx.fill();
  }
  for (const b of game.blasts) { ctx.strokeStyle = `rgba(255,214,150,${b.life / .35})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * (1.2 - b.life / .35 * .4), 0, Math.PI * 2); ctx.stroke(); }
  const ev = game.event;
  if (ev?.zone && !ev.done) {
    const cfg = CONFIG.events.types.hold, { x, y } = ev.zone;
    ctx.fillStyle = 'rgba(243,209,130,.1)'; ctx.beginPath(); ctx.arc(x, y, cfg.radius, 0, Math.PI * 2); ctx.fill();
    ctx.setLineDash([10, 8]); ctx.strokeStyle = '#f3d182aa'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#f3d182'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, cfg.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ev.progress / cfg.seconds); ctx.stroke();
    ctx.fillStyle = '#f3d182'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${Math.ceil(ev.limit)}s`, x, y + 5);
  }
}
function drawEnemy(e) {
  const stats = CONFIG.enemies[e.kind], hidden = inTerrain(e, game.bushes), cloaked = isCloaked(e);
  if (e.fuse > 0) {
    const pulse = Math.floor(game.time * 12) % 2;
    ctx.strokeStyle = `rgba(255,112,80,${pulse ? .75 : .35})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, stats.blast, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,112,80,.16)'; ctx.beginPath(); ctx.arc(e.x, e.y, stats.blast * (1 - e.fuse / stats.fuse), 0, Math.PI * 2); ctx.fill();
  }
  ctx.save(); ctx.globalAlpha = cloaked ? stats.cloakAlpha * (1 + Math.sin(game.time * 5 + e.seed) * .5) : hidden && distance(e, game.player) > CONFIG.enemies.bushRevealDistance ? .18 : 1;
  ctx.translate(e.x, e.y); ctx.fillStyle = '#10251ca0'; ctx.beginPath(); ctx.ellipse(3, 10, e.radius, e.radius / 2, 0, 0, Math.PI * 2); ctx.fill();
  if (e.affix) { const color = CONFIG.elites.affixes[e.affix].color; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, e.radius + 5 + Math.sin(game.time * 6 + e.seed) * 1.5, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  ctx.rotate(e.facing);
  if (e.kind === 'runner') { ctx.strokeStyle = '#f7e7a680'; ctx.lineWidth = 2; ctx.beginPath(); for (const y of [-6, 0, 6]) { ctx.moveTo(-e.radius - 4, y); ctx.lineTo(-e.radius - 14 - Math.abs(y), y); } ctx.stroke(); }
  if (e.kind === 'bomber') { ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(-e.radius + 2, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = e.fuse > 0 && Math.floor(game.time * 12) % 2 ? '#fff4c0' : '#f59a55'; ctx.beginPath(); ctx.arc(-e.radius - 6, -6, 3, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.fillStyle = '#26372e'; ctx.fillRect(1, -5 * e.radius / 16, 23 * e.radius / 16, 10 * e.radius / 16); }
  ctx.fillStyle = e.hit > 0 || (e.fuse > 0 && Math.floor(game.time * 12) % 2) ? '#fff0d1' : stats.color; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
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
  else if (e.kind === 'stalker') { ctx.fillStyle = '#2f4a42'; ctx.beginPath(); ctx.arc(-2, 0, e.radius - 3, Math.PI * .5, Math.PI * 1.5); ctx.fill(); ctx.fillStyle = '#c9f3e2'; ctx.fillRect(9, -5, 3, 3); ctx.fillRect(9, 2, 3, 3); }
  else if (e.kind === 'bomber') { ctx.strokeStyle = '#7a3a26'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -e.radius + 3); ctx.lineTo(-6, e.radius - 3); ctx.stroke(); }
  else if (e.kind === 'boss') {
    ctx.fillStyle = e.phase === 2 ? '#8e2f22' : '#5a3a2e'; ctx.fillRect(-20, -e.radius + 6, 12, (e.radius - 6) * 2);
    ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-2, -4); ctx.lineTo(4, -10); ctx.lineTo(4, 10); ctx.lineTo(-2, 4); ctx.lineTo(-6, 10); ctx.fill();
  }
  else { ctx.fillStyle = '#f2d4a3'; ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(-16, -20); ctx.lineTo(-2, -14); ctx.fill(); }
  ctx.restore();
  if (cloaked) return;
  if (e.hp < e.maxHp && e.kind !== 'boss') drawHealth(e.x, e.y - e.radius - 14, e.hp / e.maxHp, 34);
  if (e.state !== 'wander') { ctx.fillStyle = '#f3d182'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', e.x, e.y - e.radius - 11); }
}
// Barrel length, width and muzzle color per gun (rendering only).
const GUN_LOOK = { rifle: [26, 12, '#e3eabc'], smg: [21, 10, '#f3e39a'], shotgun: [25, 15, '#f1c58f'], rail: [35, 8, '#9fe3ff'] };
function drawPlayer(p) {
  const [length, width, muzzle] = GUN_LOOK[p.weapon];
  ctx.save(); ctx.globalAlpha = isHidden() ? .58 : p.invulnerable > 0 && Math.floor(game.time * 18) % 2 ? .55 : 1;
  ctx.translate(p.x, p.y); ctx.fillStyle = '#0b261990'; ctx.beginPath(); ctx.ellipse(3, 12, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(p.facing); ctx.fillStyle = '#1f382c'; ctx.fillRect(3, -width / 2, length + 3, width);
  ctx.fillStyle = muzzle; ctx.fillRect(length - 7, -3, 10, 6);
  if (p.weapon === 'shotgun') { ctx.fillStyle = '#1f382c'; ctx.fillRect(length - 7, -1, 10, 2); }
  ctx.fillStyle = '#d3dd9a'; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f2edc7'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#38563b'; ctx.fillRect(5, -6, 5, 4); ctx.fillRect(5, 3, 5, 4);
  if (p.levels.helmet) { ctx.fillStyle = ['#6f8a58', '#5a7249', '#48603c'][p.levels.helmet - 1]; ctx.beginPath(); ctx.arc(-1, 0, p.radius - 3, Math.PI * .55, Math.PI * 1.45); ctx.lineTo(-1, 0); ctx.fill(); }
  if (p.levels.vest) { ctx.strokeStyle = '#4c6443'; ctx.lineWidth = 2 + p.levels.vest; ctx.beginPath(); ctx.arc(0, 0, p.radius - 1, Math.PI * .6, Math.PI * 1.4); ctx.stroke(); }
  ctx.restore();
  const maxShield = gearStats().maxShield;
  if (p.shield > 0 && maxShield) { ctx.strokeStyle = `rgba(150,215,240,${.2 + .6 * p.shield / maxShield})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2); ctx.stroke(); }
  ctx.strokeStyle = isHidden() ? '#cfe9a6a0' : '#f4e5ad87'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 24 + Math.sin(game.time * 3) * 2, 0, Math.PI * 2); ctx.stroke();
  for (const blade of bladePositions(p)) {
    ctx.save(); ctx.translate(blade.x, blade.y); ctx.rotate(blade.a + game.time * 9);
    ctx.fillStyle = '#e8f1d4'; ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.lineTo(Math.cos(a + .78) * 3, Math.sin(a + .78) * 3); } ctx.fill();
    ctx.restore();
  }
  if (p.levels.drone) {
    const d = dronePosition(p);
    ctx.save(); ctx.translate(d.x, d.y); ctx.fillStyle = '#0b261970'; ctx.beginPath(); ctx.ellipse(2, 9, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 9, game.time * 20, game.time * 20 + 1.2); ctx.arc(0, 0, 9, game.time * 20 + Math.PI, game.time * 20 + Math.PI + 1.2); ctx.stroke();
    ctx.fillStyle = '#6fa6bf'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(6, 0); ctx.lineTo(0, 6); ctx.lineTo(-6, 0); ctx.fill();
    ctx.restore();
  }
}
function drawProjectiles() {
  for (const b of game.bullets) {
    const color = b.friendly ? b.color : '#eb9eae';
    if (b.trail) { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x - b.vx * .04, b.y - b.vy * .04); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const m of game.missiles) {
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.angle);
    ctx.fillStyle = '#f6b36b'; ctx.fillRect(-9, -2, 5, 4); ctx.fillStyle = '#dad6c6'; ctx.fillRect(-5, -3, 11, 6); ctx.fillStyle = '#b84d3d'; ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(10, 0); ctx.lineTo(6, 3); ctx.fill();
    ctx.restore();
  }
  for (const arc of game.arcs) {
    ctx.strokeStyle = `rgba(190,230,255,${arc.life / .16})`; ctx.lineWidth = 2.5; ctx.shadowColor = '#9fe3ff'; ctx.shadowBlur = 10; ctx.beginPath();
    arc.points.forEach((pt, i) => {
      if (!i) { ctx.moveTo(pt.x, pt.y); return; }
      const prev = arc.points[i - 1];
      for (let k = 1; k <= 4; k++) { const f = k / 4, j = k < 4 ? 9 : 0; ctx.lineTo(prev.x + (pt.x - prev.x) * f + rand(-j, j), prev.y + (pt.y - prev.y) * f + rand(-j, j)); }
    });
    ctx.stroke(); ctx.shadowBlur = 0;
  }
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
  drawHazards();
  for (const b of game.barrels) drawBarrel(b);
  for (const c of game.chests) drawChest(c);
  for (const item of game.loot) drawLoot(item);
  for (const e of game.enemies) drawEnemy(e);
  if (game.player) drawPlayer(game.player);
  drawProjectiles();
  for (const part of game.particles) { ctx.globalAlpha = part.life / part.maxLife; ctx.fillStyle = part.color; ctx.fillRect(part.x, part.y, 3, 3); } ctx.globalAlpha = 1;
  ctx.restore();
  drawWeather(camera, w, h);
  if (game.boss) {
    const e = game.boss, bw = Math.min(420, w - 80), x = (w - bw) / 2;
    ctx.fillStyle = '#10251cd0'; ctx.fillRect(x - 4, 14, bw + 8, 16);
    ctx.fillStyle = e.phase === 2 ? '#e0634e' : '#e9a071'; ctx.fillRect(x, 18, bw * Math.max(0, e.hp) / e.maxHp, 8);
    ctx.fillStyle = '#f3ecd0'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${t('enemy.boss')}${e.phase === 2 ? ' · II' : ''}`, w / 2, 46);
  }
  if (game.flash > 0) { ctx.fillStyle = `rgba(226,71,62,${game.flash * .48})`; ctx.fillRect(0, 0, w, h); }
  if (game.mode === 'playing' && game.mouse.active) {
    ctx.strokeStyle = '#f1edcaaa'; ctx.lineWidth = 1.5; const x = game.mouse.x, y = game.mouse.y;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.moveTo(x - 16, y); ctx.lineTo(x - 6, y); ctx.moveTo(x + 6, y); ctx.lineTo(x + 16, y); ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 6); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 16); ctx.stroke();
  }
}
// Night limits the view to a lit circle around the player; rain adds falling streaks (rendering only).
function drawWeather(camera, w, h) {
  const v = CONFIG.variants[game.variant], p = game.player;
  if (v.vision && p) {
    const cx = p.x - camera.x, cy = p.y - camera.y, g = ctx.createRadialGradient(cx, cy, v.vision * .45, cx, cy, v.vision);
    g.addColorStop(0, 'rgba(6,12,20,0)'); g.addColorStop(1, 'rgba(6,12,20,.92)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  if (game.variant === 'rain') {
    ctx.strokeStyle = '#c8dcff38'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < 110; i++) { const x = (i * 137.5 + game.time * 90) % (w + 40) - 20, y = (i * 97.3 + game.time * 640) % (h + 40) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); }
    ctx.stroke();
  }
}
let last = performance.now();
function frame(now) { const dt = Math.min((now - last) / 1000, .05); last = now; update(dt); draw(); requestAnimationFrame(frame); }
$('startBtn').addEventListener('click', () => startGame(false));
$('dailyBtn').addEventListener('click', () => startGame(true));
$('restartBtn').addEventListener('click', () => startGame(!!game.daily));
$('menuBtn').addEventListener('click', () => { game.mode = 'menu'; UI.end.hidden = true; UI.start.hidden = false; renderMenu(); });
$('shareBtn').addEventListener('click', copyShare);
$('shopBtn').addEventListener('click', () => { if (game.mode === 'playing' || game.mode === 'shop') toggleShop(); });
$('closeShop').addEventListener('click', toggleShop);
for (const tab of document.querySelectorAll('[data-shop-tab]')) tab.addEventListener('click', () => { game.shopTab = tab.dataset.shopTab; renderShop(); });
const GUN_KEYS = Object.keys(CONFIG.weapons);
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
  else if (game.mode === 'perk' && !event.repeat && key >= '1' && key <= String(CONFIG.perks.offer)) choosePerk(Number(key) - 1);
  else if (game.mode === 'playing' && !event.repeat && key >= '1' && key <= String(GUN_KEYS.length)) equip(GUN_KEYS[Number(key) - 1]);
  else if (game.mode === 'playing' && key === 'q' && !event.repeat) cycleWeapon();
  else game.keys.add(key);
});
window.addEventListener('keyup', event => game.keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { game.keys.clear(); game.mouse.down = false; });
canvas.addEventListener('pointermove', event => { const rect = canvas.getBoundingClientRect(); game.mouse.x = event.clientX - rect.left; game.mouse.y = event.clientY - rect.top; game.mouse.active = true; });
canvas.addEventListener('pointerdown', event => { if (event.button === 0 && game.mode === 'playing') { game.mouse.down = true; canvas.setPointerCapture(event.pointerId); } });
canvas.addEventListener('pointerup', () => { game.mouse.down = false; });
canvas.addEventListener('pointercancel', () => { game.mouse.down = false; });
canvas.addEventListener('contextmenu', event => event.preventDefault());
let lastWheel = 0;
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  if (game.mode !== 'playing' || Math.abs(event.deltaY) < 4 || performance.now() - lastWheel < 250) return;
  lastWheel = performance.now(); cycleWeapon();
}, { passive: false });
for (const link of document.querySelectorAll('[data-lang]')) link.addEventListener('click', event => {
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // keep open-in-new-tab
  event.preventDefault(); link.blur(); if (link.dataset.lang !== locale) applyLocale(link.dataset.lang);
});
if (locale === DEFAULT_LOCALE) { renderSettings(); renderMenu(); } else applyLocale(locale);
new ResizeObserver(resize).observe(arena); resize(); requestAnimationFrame(frame);
})();
