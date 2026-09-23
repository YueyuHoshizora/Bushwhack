(() => {
'use strict';
// All gameplay and balance values live here. Rendering-only colors and layout live below.
const CONFIG = Object.freeze({
  // Wooden walls (woodWalls, placed after the stone ones) block like stone but lose HP to bullets from either side and woodBlast to
  // every explosion that reaches them; a destroyed one is removed from the map.
  world: { width: 1800, height: 1200, grid: 30, walls: 11, wallWidth: [72, 128], wallHeight: [48, 88], woodWalls: 5, woodHp: 150, woodBlast: 80, ponds: { clusters: 4, pieces: [2, 4], size: [80, 130] }, bushes: { clusters: 8, pieces: [3, 6], size: [72, 118] }, clusterReach: 0.62, terrainGap: 20, spawnClearance: 200, borderMargin: 16, placementMargin: 42, spawnMargin: 65, terrainSpawnPadding: 12, chestSpacing: 65, placementAttempts: 250, spawnAttempts: 400, burnSeconds: 25 },
  // Environmental fire, enemy crossfire and water interaction; player fire damage remains harsh-only.
  environment: { fireSeconds: 6, fireSpreadInterval: 1.5, fireSpreadRange: 125, fireTick: 0.8, fireDamage: 9, playerFireDamage: 8, enemyBulletDamage: 0.5, enemyBlastDamage: 0.5 },
  // Shield recharges only while hidden in grass (not firing) and unharmed for shieldRegenDelay seconds.
  player: { hp: 100, radius: 15, speed: 245, invulnerability: 0.65, pickupRadius: 40, waterMultiplier: 0.5, revealSeconds: 2.4, shieldRegenDelay: 3, shieldRegenRate: 4.5, switchDelay: 0.25 },
  // Shared weapon upgrades scale every gun: damage/rate/range are fractions of the gun's base value per level.
  gun: { bulletRadius: 4, damageStep: 1 / 3, rateStep: 0.197, rangeStep: 0.1875 },
  // Manual guns. Text lives in i18n.js under guns.<key>.*; color/sound/look are rendering hints.
  // `noise` is the radius (px) in which a shot sends unaware enemies to search the shooter's position.
  weapons: {
    rifle: { icon: '⟋', damage: 18, shotsPerSecond: 3.3, pellets: 1, spreadRadians: 0.14, jitter: 0, range: 480, bulletSpeed: 800, pierce: 0, noise: 430, shake: 2.5, gold: 0, scrap: 0, color: '#fff0af', sound: 'shoot' },
    smg: { icon: '≡', damage: 8, shotsPerSecond: 9, pellets: 1, spreadRadians: 0.1, jitter: 0.09, range: 380, bulletSpeed: 860, pierce: 0, noise: 380, shake: 1.2, gold: 40, scrap: 3, color: '#ffe38a', sound: 'smg' },
    shotgun: { icon: '⋔', damage: 11, shotsPerSecond: 1.25, pellets: 6, spreadRadians: 0.09, jitter: 0.03, range: 300, bulletSpeed: 720, pierce: 0, noise: 470, shake: 5, gold: 45, scrap: 4, color: '#ffc58a', sound: 'shotgun' },
    rail: { icon: '⟶', damage: 70, shotsPerSecond: 0.9, pellets: 1, spreadRadians: 0.05, jitter: 0, range: 820, bulletSpeed: 1500, pierce: 2, noise: 560, shake: 4, gold: 65, scrap: 5, color: '#9fe3ff', sound: 'rail' },
    // Silent: never reveals the player and makes no noise. Each shot spends one of `ammo` bolts (extra Multi-Barrel bolts are free);
    // the bolt drops where it stops and can be picked up again, and clearing a wave refills the quiver.
    crossbow: { icon: '➳', damage: 52, shotsPerSecond: 1.1, pellets: 1, spreadRadians: 0.06, jitter: 0, range: 560, bulletSpeed: 980, pierce: 0, noise: 0, silent: true, ammo: 8, shake: 1.5, gold: 55, scrap: 5, color: '#e8d2a0', sound: 'bow' },
    // Shells explode on impact (or at the end of their range) for the shot's damage to everything within blast px; frontal shields do not help.
    launcher: { icon: '◉', damage: 46, shotsPerSecond: 0.75, pellets: 1, spreadRadians: 0.12, jitter: 0.02, range: 460, bulletSpeed: 560, pierce: 0, blast: 78, noise: 640, shake: 5, gold: 70, scrap: 6, color: '#ffb36b', sound: 'launcher' }
  },
  // Automatic weapons: per-level arrays (index = level - 1). They never reveal the player and hold fire while the player is inside a bush (blades excepted).
  autoWeapons: {
    drone: { icon: '⌬', max: 3, gold: 35, scrap: 3, goldStep: 25, scrapStep: 2, damage: [10, 14, 18], rate: [1.8, 2.4, 3], range: 380, orbit: 34, orbitSpeed: 2.2, bulletSpeed: 700 },
    blades: { icon: '✢', max: 3, gold: 30, scrap: 2, goldStep: 22, scrapStep: 2, damage: [12, 16, 20], count: [2, 3, 4], radius: 62, size: 9, spin: 3.2, hitCooldown: 0.45 },
    missile: { icon: '➹', max: 3, gold: 45, scrap: 4, goldStep: 30, scrapStep: 2, damage: [30, 40, 52], interval: [2.4, 1.9, 1.5], range: 520, blast: 70, speed: 360, turn: 4.5, life: 3 },
    tesla: { icon: 'ϟ', max: 3, gold: 40, scrap: 3, goldStep: 28, scrapStep: 2, damage: [16, 21, 27], interval: [1.5, 1.25, 1], range: 190, chains: [2, 3, 4], chainRange: 130, wetChainRange: 1.5 }
  },
  enemies: {
    melee: { hp: 48, speed: 125, radius: 16, sight: 305, reach: 30, damage: 9, cooldown: 1.05, wanderSpeed: 0.45, bounty: 1, color: '#e99c77' },
    ranged: { hp: 37, speed: 101, radius: 15, sight: 365, reach: 270, damage: 8, cooldown: 1.9, projectileSpeed: 310, projectileRadius: 5, retreatRatio: 0.52, retreatSpeed: 0.65, wanderSpeed: 0.35, bounty: 1.1, color: '#c4a7db' },
    runner: { hp: 28, speed: 237, radius: 12, sight: 340, reach: 26, damage: 6, cooldown: 0.7, wanderSpeed: 0.55, weave: 0.55, weaveSpeed: 7, bounty: 1, color: '#f0d36b' },
    shield: { hp: 74, speed: 88, radius: 18, sight: 300, reach: 32, damage: 13, cooldown: 1.25, wanderSpeed: 0.4, turnRate: 1.7, shieldHp: 90, shieldArc: 1.15, bounty: 1.8, color: '#8fb3c9' },
    // Support units heal nearby wounded allies on a fixed pulse and never attack.
    medic: { hp: 45, speed: 95, radius: 15, sight: 320, reach: 0, damage: 0, cooldown: 0, wanderSpeed: 0.4, healRadius: 160, healEvery: 4, healFraction: 0.18, bounty: 1.3, color: '#83d6a0' },
    // Cloaked beyond revealDistance (and for revealSeconds after hitting or being hit): nearly invisible, ignored by auto-targeting. Senses players hiding in grass within sense px.
    stalker: { hp: 41, speed: 160, radius: 14, sight: 320, reach: 28, damage: 15, cooldown: 1.1, wanderSpeed: 0.5, cloakAlpha: 0.1, revealDistance: 150, revealSeconds: 0.9, sense: 120, bounty: 1.6, color: '#86b8a8' },
    // Lights a fuse within reach, keeps closing at fuseSpeed, then detonates for damage in blast px (hits hidden players too) and dies without loot.
    bomber: { hp: 63, speed: 115, radius: 17, sight: 330, reach: 50, damage: 34, fuse: 0.75, fuseSpeed: 0.45, blast: 88, wanderSpeed: 0.4, bounty: 1.5, color: '#d9745b' },
    // Flamethrower: hurts the player inside ±cone within reach, and burns grass burn px ahead every burnEvery s while hunting or searching.
    flamer: { hp: 72, speed: 96, radius: 17, sight: 300, reach: 105, damage: 10, cooldown: 0.2, cone: 0.45, burn: 36, burnEvery: 1.1, wanderSpeed: 0.4, bounty: 1.7, color: '#e8743b' },
    // Gunner that also fires a flare at the spot it searches (every flareEvery s): the player inside a flare cannot hide for flareSeconds.
    flare: { hp: 44, speed: 100, radius: 15, sight: 360, reach: 290, damage: 7, cooldown: 2.1, projectileSpeed: 300, projectileRadius: 5, retreatRatio: 0.5, retreatSpeed: 0.6, flareEvery: 6, flareRadius: 150, flareSeconds: 6, wanderSpeed: 0.35, bounty: 1.4, color: '#f5e27a' },
    // Flying recon drone: crosses walls and never attacks. A player within scan px (even hidden) is exposed for revealSeconds
    // and every unaware enemy within alarm px starts searching there; then it rescans after scanCooldown s.
    scout: { hp: 26, speed: 120, radius: 12, sight: 0, reach: 0, scan: 95, alarm: 560, revealSeconds: 1.2, scanCooldown: 3, wanderSpeed: 0.85, bounty: 1.2, color: '#9fd0e8', flying: true },
    // Runs for a radio station to raise a map-wide alarm; hounds follow recent scent, not the player's live position.
    radio: { hp: 58, speed: 112, radius: 15, sight: 320, reach: 30, damage: 8, cooldown: 1.05, wanderSpeed: 0.42, bounty: 1.5, color: '#cfaa66' },
    hound: { hp: 46, speed: 186, radius: 14, sight: 335, reach: 25, damage: 10, cooldown: 0.85, wanderSpeed: 0.52, bounty: 1.6, color: '#c6816f' },
    // Bosses (attack patterns under `boss`). They sense hidden players within sense px; loot comes from boss.loot.
    commander: { boss: true, hp: 1100, speed: 72, radius: 30, sight: 520, sense: 160, reach: 56, damage: 18, cooldown: 1.2, wanderSpeed: 0.5, bounty: 0, color: '#c7866f' },
    // Cloaked (bushCloak alpha, skipped by auto-targeting) while inside grass and not aiming.
    sniper: { boss: true, hp: 850, speed: 125, radius: 24, sight: 720, sense: 140, reach: 0, damage: 0, cooldown: 1, wanderSpeed: 0.5, bushCloak: 0.12, revealSeconds: 1.5, bounty: 0, color: '#9aa6b8' },
    hive: { boss: true, hp: 1500, speed: 52, radius: 34, sight: 480, sense: 200, reach: 58, damage: 20, cooldown: 1.4, wanderSpeed: 0.4, bounty: 0, color: '#b58ad6' },
    incinerator: { boss: true, hp: 1300, speed: 66, radius: 32, sight: 520, sense: 170, reach: 55, damage: 16, cooldown: 1.1, wanderSpeed: 0.45, bounty: 0, color: '#eb754c' },
    wanderInterval: [1.8, 3.6], alertSeconds: 0.28, bushRevealDistance: 110, healthPerWave: 0.14, damagePerWave: 0.095, waterMultiplier: 0.6
  },
  // Enemies that lose sight of the player, or hear a noise, walk to that spot and sweep nearby grass until `seconds` run out.
  // A hidden player within probe px of a searcher is found; searching gunners fire recon shots at their sweep point every reconFire s.
  // Explosions make explosionNoise.
  search: { speed: 0.75, seconds: 9, radius: 130, arrive: 24, probe: 62, reconFire: 1.8, explosionNoise: 620 },
  // Player movement, enemy sight, corpse investigation, radio sites, and scent trails.
  stealth: {
    movement: 0.55,
    vision: { cone: 0.96, side: 0.6, rear: 70, suspicion: [0.3, 1.2] },
    water: { radius: 150, every: 0.6 },
    noise: { life: 0.65 },
    corpses: { life: 20, max: 12, investigateRadius: 110, arrive: 26, alertRadius: 32, revealRadius: 65, sightRadius: 250 },
    shout: { delay: 1, radius: 180 },
    radio: { count: 2, radius: 18, hp: 170, spacing: 250, placementAttempts: 250, reinforceCount: 2, reinforceMax: 4, reinforceDistance: 320, hitFlash: 0.15 },
    hound: { trailSeconds: 6, sampleEvery: 0.2, maxSamples: 32, acquireRadius: 220, followRadius: 28, barkRadius: 420, barkEvery: 4 }
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
      { kind: 'medic', from: 6, weight: 0.2, perWave: 0.03, max: 0.5 },
      { kind: 'stalker', from: 6, weight: 0.22, perWave: 0.03, max: 0.6 },
      { kind: 'flamer', from: 7, weight: 0.2, perWave: 0.03, max: 0.5 },
      { kind: 'bomber', from: 8, weight: 0.2, perWave: 0.03, max: 0.55 },
      { kind: 'flare', from: 9, weight: 0.2, perWave: 0.03, max: 0.5 },
      { kind: 'scout', from: 11, weight: 0.15, perWave: 0.02, max: 0.35 },
      { kind: 'radio', from: 10, weight: 0.24, perWave: 0.035, max: 0.65 },
      { kind: 'hound', from: 12, weight: 0.25, perWave: 0.035, max: 0.6 },
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
  // Gun attachments shared by every gun. Values are per level: suppressor cuts noise and reveal time, ricochet bounces off walls, piercing adds pierce.
  mods: {
    suppressor: { icon: '⊘', max: 2, gold: 30, scrap: 3, goldStep: 25, scrapStep: 2, noise: 0.35, reveal: 0.3 },
    ricochet: { icon: '↯', max: 2, gold: 28, scrap: 3, goldStep: 24, scrapStep: 2, bounces: 1 },
    piercing: { icon: '⇶', max: 2, gold: 35, scrap: 4, goldStep: 28, scrapStep: 2, pierce: 1 }
  },
  // Throwables: G throws the selected one toward the cursor (up to range px, stopped by walls), T cycles. Throwing never reveals the player.
  // Each type carries up to `carry`; `start` is the opening stock. Grenade damage scales with the wave like enemy HP.
  throwables: {
    range: 380, flight: 0.45, carry: 3, start: { decoy: 2, smoke: 1, grenade: 1, molotov: 1 },
    items: {
      decoy: { icon: '◌', gold: 12, scrap: 0, seconds: 6, pulse: 1, noise: 520 },
      smoke: { icon: '☁', gold: 15, scrap: 1, radius: 110, seconds: 8 },
      grenade: { icon: '●', gold: 18, scrap: 1, fuse: 0.9, blast: 95, damage: 60 },
      molotov: { icon: '♨', gold: 22, scrap: 2, radius: 74, seconds: 6, damage: 11 }
    }
  },
  // Silent melee kill (F) on a non-boss enemy within range that is unaware (wandering/searching) or facing away (beyond backArc rad).
  takedown: { range: 46, backArc: 1.9, cooldown: 0.5 },
  // Classes picked on the start screen: a passive plus an active skill on Space (cooldown s). Mine damage scales with the wave.
  // `unlock` names the achievement that opens a class (it then stays selectable in every mode).
  classes: {
    ranger: { icon: '➶', speed: 0.1, skill: { cooldown: 4, distance: 170, seconds: 0.18 } },
    engineer: { icon: '⚒', scrap: 0.25, skill: { cooldown: 7, max: 3, arm: 0.6, trigger: 34, blast: 85, damage: 75 } },
    heavy: { icon: '⛨', hp: 30, skill: { cooldown: 12, seconds: 3.5, reduction: 0.6 } },
    // Focus: for `seconds`, gun damage +damage and no random jitter.
    marksman: { icon: '⌖', range: 0.15, unlock: 'hunter', skill: { cooldown: 11, seconds: 4, damage: 0.5 } },
    // Heal packs restore +heal more; the skill heals `heal` HP at once.
    medic: { icon: '✚', heal: 0.5, unlock: 'escapist', skill: { cooldown: 14, heal: 35 } }
  },
  // Between-wave perks: `offer` distinct picks weighted by rarity; each pick adds one stack (up to max). Values are per stack.
  // `unlock` names the achievement that adds a perk to the pool (never offered in daily runs). Evolved perks join the pool once every
  // perk in `needs` is maxed. From wave curseFrom, with curseChance one slot becomes a curse (a trade-off perk; never in daily runs).
  perks: {
    offer: 3, curseFrom: 3, curseChance: 0.3,
    rarity: { common: 6, rare: 3, legendary: 1, evolved: 5 },
    actions: { rerollScrap: 2, rerollStep: 2, banishMax: 2, skipGold: 30 },
    list: {
      ambush: { icon: '◎', rarity: 'rare', max: 2, bonus: 1 },
      vampire: { icon: '♥', rarity: 'common', max: 3, heal: 2 },
      volatile: { icon: '✺', rarity: 'rare', max: 2, chance: 0.2, damage: 24, blast: 70 },
      shadow: { icon: '◐', rarity: 'rare', max: 2, seconds: 1 },
      scavenger: { icon: '⚙', rarity: 'common', max: 2, scrap: 0.5 },
      tough: { icon: '▲', rarity: 'common', max: 3, hp: 20 },
      greed: { icon: '¤', rarity: 'common', max: 2, gold: 0.25 },
      trigger: { icon: '≫', rarity: 'common', max: 3, rate: 0.1 },
      magnet: { icon: '⊕', rarity: 'common', max: 2, pickup: 0.6 },
      mender: { icon: '❀', rarity: 'rare', max: 2, regen: 1 },
      phantom: { icon: '☾', rarity: 'legendary', max: 1, unlock: 'ambushMaster' },
      predator: { icon: '⚔', rarity: 'evolved', max: 1, needs: ['ambush', 'shadow'], bonus: 1, takedown: 0.5 },
      bloodstorm: { icon: '✹', rarity: 'evolved', max: 1, needs: ['vampire', 'volatile'], heal: 3, chance: 0.3 },
      hoarder: { icon: '❖', rarity: 'evolved', max: 1, needs: ['greed', 'scavenger'], gold: 0.25, scrap: 0.5 },
      shadeCircuit: { icon: '⌁', rarity: 'evolved', max: 1, needs: ['shadow', 'scavenger'], takedowns: 3, decoys: 1 },
      hunterFocus: { icon: '⌖', rarity: 'evolved', max: 1, needs: ['trigger', 'ambush'], seconds: 2, damage: 0.5 },
      payback: { icon: '⚔', rarity: 'rare', max: 2, unlock: 'silentKiller', damage: 0.25 },
      secondWind: { icon: '↻', rarity: 'legendary', max: 1, unlock: 'finaleClear', hp: 0.35, seconds: 1.5 },
      glassCannon: { icon: '✧', rarity: 'cursed', max: 1, damage: 0.4, hpCut: 0.25 },
      bloodPrice: { icon: '☍', rarity: 'cursed', max: 1, gold: 0.6, taken: 0.2 },
      frenzy: { icon: 'ϟ', rarity: 'cursed', max: 1, rate: 0.3, reveal: 1 },
      // Gun damage up, but every auto weapon (blades included) stays off.
      purist: { icon: '⊗', rarity: 'cursed', max: 1, damage: 0.35 },
      sprinter: { icon: '➟', rarity: 'cursed', max: 1, speed: 0.25, hpCut: 0.3 },
      // Kills made while standing in grass heal `heal`; outside grass the player loses `drain` HP/s (never below 1 HP).
      thornbound: { icon: '❦', rarity: 'cursed', max: 1, heal: 4, drain: 1.5 }
    }
  },
  // Gun evolution recipes are checked against owned weapons, maxed shared upgrades/attachments and relevant run perks.
  builds: {
    interest: { goldPer: 50, goldAward: 5, maxGold: 25 },
    recipes: {
      rifle: { upgrades: { damage: 5, range: 5 } },
      smg: { upgrades: { rate: 5 }, perks: { trigger: 1 } },
      shotgun: { upgrades: { spread: 5 }, mods: { ricochet: 2 } },
      rail: { upgrades: { damage: 5 }, mods: { piercing: 2 } },
      crossbow: { mods: { piercing: 2 }, perks: { ambush: 1 } },
      launcher: { upgrades: { damage: 5 }, perks: { volatile: 1 } }
    },
    effects: {
      crossbow: { extraPierce: 1, ambushRefund: 1 },
      shotgun: { fragments: 2, fragmentDamage: 0.55, fragmentSpread: 0.34 },
      rail: { shieldBreak: true },
      launcher: { fragments: 3, fragmentDamage: 0.4, fragmentBlast: 0.55, fragmentRange: 170, fragmentSpeed: 390, maxGenerations: 1 },
      smg: { rampWindow: 1.2, rampStep: 0.1, rampMax: 5 },
      rifle: { chargeSeconds: 1.3, chargeDamage: 1.2 }
    }
  },
  // Seeded operation-map nodes attach one route modifier trading risk for reward.
  // gold/scrap/count/hp/elite add to the wave's multipliers; vision limits the view; sight adds to enemy sight; throwables are granted when
  // the wave is cleared; perkCards adds cards to the next perk offer; blitz grants a perk of `rarities` if the wave is cleared within seconds.
  routes: {
    from: 2,
    list: {
      calm: { icon: '○' },
      bounty: { icon: '¤', gold: 0.5, elite: 0.15 },
      swarm: { icon: '⋙', count: 0.4, scrap: 1 },
      blackout: { icon: '◑', vision: 240, gold: 0.3 },
      ironclad: { icon: '▣', hp: 0.3, throwables: 2 },
      exposed: { icon: '◉', sight: 0.3, perkCards: 1 },
      blitz: { icon: '⏱', blitz: { seconds: 60, rarities: ['rare', 'legendary'] } }
    }
  },
  // Threat modifiers retain their original mutator effects and contribute points.
  mutators: {
    brittle: { icon: '✧', enemyHp: 0.35, taken: 3, score: 0.4, points: 10 },
    rifleOnly: { icon: '⟋', score: 0.3, points: 5 },
    sparse: { icon: '⁘', bushes: 0.3, score: 0.4, points: 8 },
    eclipse: { icon: '◑', vision: 230, score: 0.3, points: 6 },
    elites: { icon: '♛', elite: 0.1, score: 0, points: 8 },
    noDecay: { icon: '⌛', score: 0, points: 7 },
    earlyBoss: { icon: '☠', score: 0, points: 8 },
    expensiveMarket: { icon: '¤', price: 0.25, score: 0, points: 6 },
    nightRaid: { icon: '☾', vision: 300, score: 0.2, points: 5, unlock: { threat: 20 } },
    ironSwarm: { icon: '▣', count: 0.15, score: 0.2, points: 10, unlock: { threat: 35 } },
    // Rule modifiers. magazine: each manual gun (crossbow excepted) holds round(base shots/s × seconds) rounds and reloads for `reload` s
    // (R reloads early); scorchedEarth: burned grass never regrows; oneShield: a shield broken to 0 stops recharging until refilled by
    // the armory or the black market; blindSpot: no off-screen pointers and no ! / ? marks above enemies.
    magazine: { icon: '▤', seconds: 3, reload: 1.6, score: 0.25, points: 8 },
    scorchedEarth: { icon: '♨', score: 0.2, points: 6 },
    oneShield: { icon: '◇', score: 0.15, points: 5 },
    blindSpot: { icon: '◌', score: 0.2, points: 6 }
  },
  threat: { initialCap: 20, bossEvery: 4, milestones: [10, 25, 40], cosmetics: { 10: 'shadow', 25: 'gold', 40: 'crimson' } },
  // Class mastery (not in daily runs): XP per wave reached, extraction/clear and challenge; skillLevel adds each class's skill variant; skins name their own levels.
  mastery: { maxLevel: 10, thresholds: [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2950], waveXp: 12, extractionXp: 80, challengeXp: 25, skillLevel: 2, dodgeStealth: 1.25, engineerSmokeRadius: 105, engineerSmokeSeconds: 3, heavyPulseRadius: 150, heavyStunSeconds: .65, marksmanFocusPierce: 1, medicArea: 125, medicFieldSeconds: 4, medicFieldPulse: 1, medicFieldHeal: 5 },
  weekly: { contracts: 3, rewardXp: 75, pool: ['crossbow', 'night', 'silent', 'takedowns', 'bosses'], targets: { crossbow: 10, night: 1, silent: 3, takedowns: 15, bosses: 3 } },
  // Weekly seed challenge: seed `prefix` + ISO week, fixed difficulty and `mutators` threat modifiers drawn (seeded by the week) from pool.
  // The profile keeps the best score of the last `history` weeks.
  seedChallenge: { prefix: 'WEEK-', difficulty: 'hard', mutators: 2, pool: ['brittle', 'sparse', 'eclipse', 'elites', 'noDecay', 'earlyBoss', 'expensiveMarket', 'magazine', 'scorchedEarth', 'oneShield', 'blindSpot'], history: 8 },
  streak: { graceDays: 1 },
  // Wave `wave` is the final operation: an empowered commander (HP × hpScale); defeating it clears the run and raises the threat cap by threatStep.
  finale: { wave: 25, hpScale: 2.5, threatStep: 15 },
  // Points per kill = kill × bounty (× elite bounty; boss-spawned minions × minion) × multiplier, where multiplier =
  // min(comboMax, 1 + combo × comboStep) × difficulty score × (1 + mutator scores). Kills within comboWindow s extend the combo
  // (ambush kills and takedowns count ambushCombo). Bosses pay `boss`; clearing wave N pays waveBonus × N.
  score: { kill: 100, boss: 2500, minion: 0.2, comboWindow: 4, comboStep: 0.1, comboMax: 3, ambushCombo: 2, waveBonus: 250 },
  // Difficulty multipliers on enemy HP / damage / speed, wave size, gold and score; `elite` adds to the elite chance.
  // `harsh` difficulties switch on the punishing systems: auto-weapon heat, wave themes, elite captains, boss counters, reinforcements
  // and the boss-mission failure penalty.
  difficulty: {
    normal: { hp: 1, damage: 1, speed: 1, count: 1, gold: 1, elite: 0, score: 1 },
    hard: { hp: 1.3, damage: 1.25, speed: 1.06, count: 1.2, gold: 1.1, elite: 0.04, score: 1.3, harsh: true },
    hell: { hp: 1.65, damage: 1.5, speed: 1.12, count: 1.4, gold: 1.2, elite: 0.08, score: 1.6, harsh: true, unlock: 'fearless' }
  },
  // Elite affix chance per regular spawn: base + (wave - from) × perWave, capped at max, plus the difficulty's elite. Elites: HP × hp, loot × bounty.
  elites: {
    from: 4, base: 0.05, perWave: 0.012, max: 0.3, hp: 1.5, bounty: 2,
    affixes: { swift: { speed: 1.35, color: '#ffe36e' }, regen: { rate: 0.04, color: '#8ef08a' }, splitter: { count: 2, hp: 0.5, radius: 10, color: '#d59bff' }, armored: { reduction: 0.35, color: '#a9d4ff' } }
  },
  // Every `every` waves a boss joins a wave of regularShare × the normal size, rotating through `order`; below phase2At HP it escalates.
  // Boss bullets fly bulletRange px; minions they spawn drop no loot.
  boss: {
    every: 5, regularShare: 0.5, spawnDistance: 420, order: ['commander', 'sniper', 'hive', 'incinerator'], phase2At: 0.5, bulletRange: 900,
    loot: { gold: 90, scrap: 8, heal: 30 },
    // Aimed volleys, lobbed bombs, minion summons; phase 2 speeds up, shortens cooldowns (× pace), throws more bombs and fires bullet rings.
    commander: {
      volley: { interval: 1.7, count: 3, spread: 0.2, speed: 330, radius: 7, damage: 10 },
      bombs: { interval: 5, count: 1, scatter: 70, fall: 1.1, blast: 85, damage: 24, range: 560 },
      summon: { interval: 9, count: 3, kinds: ['melee', 'runner'], distance: 70 },
      phase2: { speed: 1.35, pace: 0.65, bombs: 3, ring: 12, ringInterval: 3.2, medics: 1 }
    },
    // Aims for `aim` s (laser sight, locked for the last `lock` s), fires, then relocates to grass at least `cover` px from the player.
    // Phase 2 aims faster and fires a burst.
    sniper: { aim: 1.3, lock: 0.3, shot: { speed: 1500, radius: 6, damage: 30 }, cover: 260, relocateSpeed: 1.7, phase2: { aim: 0.8, burst: 3, gap: 0.14 } },
    // Hatches brood (weak runners) and lobs acid that leaves pools hurting the player for `seconds`; phase 2 shortens cooldowns and lobs more.
    hive: {
      brood: { interval: 3.2, count: 2, kind: 'runner', hp: 0.5, radius: 9, distance: 30 },
      acid: { interval: 4.2, count: 1, scatter: 60, fall: 0.9, radius: 55, seconds: 4, damage: 7, range: 560 },
      phase2: { pace: 0.6, acid: 3 }
    },
    // Fire rings telegraph impacts and leave hot ground; the phase-two attack accelerates.
    incinerator: { interval: 7.5, phase2Interval: 4.8, count: 8, ringRadius: 122, fall: 1.1, radius: 43, seconds: 6, damage: 12, phase2Speed: 1.25 }
  },
  // Achievements persist in localStorage; start rewards (startGun, startAuto, startGold, startOwn) apply to later non-daily runs.
  // Cumulative goals compare profile totals (ambushKills, bossKills, extractions, takedowns, challenges, purchases) or distinct boss
  // kinds killed; run goals check the wave reached (on a difficulty or harder), waves survived before the first manual shot, or owning every gun.
  // Classes and skins name the achievement that unlocks them.
  achievements: {
    veteran: { icon: '✪', wave: 15, startGun: 'smg' },
    ambushMaster: { icon: '◎', ambushKills: 100, perk: 'phantom' },
    fearless: { icon: '☠', wave: 10, difficulty: 'hard', unlocks: 'hell' },
    slayer: { icon: '♛', bossKills: 1, startAuto: 'drone' },
    escapist: { icon: '⇱', extractions: 1 },
    hunter: { icon: '♞', bossKinds: 3 },
    silentKiller: { icon: '✠', takedowns: 50 },
    challenger: { icon: '★', challenges: 15 },
    hellWalker: { icon: '♨', wave: 10, difficulty: 'hell' },
    stillness: { icon: '☯', quietWaves: 5 },
    patron: { icon: '¤', purchases: 10, startGold: 40 },
    arsenal: { icon: '⚔', allGuns: true, startOwn: 'crossbow' },
    finaleClear: { icon: '⚑', wave: 25, cleared: true, clears: 1 }
  },
  // Player colors (look in SKIN_LOOK); every skin but the default needs its achievement.
  skins: {
    default: {}, shadow: { unlock: 'silentKiller' }, gold: { unlock: 'challenger' }, crimson: { unlock: 'hellWalker' }, moss: { unlock: 'stillness' },
    rangerMastery: { mastery: { cls: 'ranger', level: 4 } }, engineerMastery: { mastery: { cls: 'engineer', level: 4 } },
    heavyMastery: { mastery: { cls: 'heavy', level: 4 } }, marksmanMastery: { mastery: { cls: 'marksman', level: 4 } },
    medicMastery: { mastery: { cls: 'medic', level: 4 } }, masteryElite: { mastery: { level: 8 } }
  },
  // Map variants, picked per run by weight. bushes/ponds scale cluster counts, sight scales enemy sight, vision limits the player's view.
  variants: {
    standard: { weight: 2, bushes: 1, ponds: 1, barrels: 5, sight: 1 },
    night: { weight: 1, bushes: 1, ponds: 1, barrels: 5, sight: 0.8, vision: 260, searchlights: 3 },
    rain: { weight: 1, bushes: 1.5, ponds: 1.25, barrels: 4, sight: 0.9 },
    scorched: { weight: 1, bushes: 0.5, ponds: 2, barrels: 8, sight: 1 }
  },
  // Explosive barrels: damage × wave HP scale to enemies in blast px, playerDamage to the player; they chain and burn grass.
  barrels: { radius: 14, hp: 20, blast: 95, damage: 55, playerDamage: 22, spacing: 90, chainDelay: 0.12 },
  // Mid-wave events: wave 2 guarantees an intel mission; later non-boss waves roll an event.
  events: {
    from: 3, chance: 0.4, trigger: 0.4,
    types: {
      airdrop: { hp: 30, gold: [30, 45], scrap: [3, 4], heal: 30, distance: 250 },
      hold: { radius: 90, seconds: 8, limit: 40, gold: [40, 60], scrap: 4, heal: 25, distance: 240 },
      stalkers: { from: 5 },
      // A marked armored officer that flees on sight and escapes after `seconds`; killing it pays out.
      assassinate: { from: 4, kinds: ['shield', 'ranged'], seconds: 40, distance: 380, gold: [60, 80], scrap: 6, heal: 20 },
      // Carrying intel prevents hiding; delivery pays more than wiping the wave.
      intel: { from: 2, limit: 50, distance: 320, radius: 60, gold: [60, 85], scrap: 6, heal: 20, elimination: { gold: [30, 45], scrap: 3, heal: 8 } },
      jammer: { from: 12, daily: false, unlock: 'escapist', hp: 70, seconds: 28, radius: 64, distance: 300, reinforcements: 2, alert: 18, gold: [55, 75], scrap: 5, heal: 18 }
    }
  },
  // Loud shots and detection build a bounded alert; quiet clears lower it, while high alert boosts next-wave patrols and recon.
  alert: { max: 100, decayPerSecond: 0.12, waveDecay: 8, silentBonus: 18, manualShot: 4, detection: 6, scan: 9, searchlight: 7, sightBonus: 0.25, patrolBonus: 0.3, reconBonus: 0.35 },
  // Daily challenge: map, variant, one mutator, spawn roster, affixes, events and perk/route offers are seeded by the UTC date.
  daily: { difficulty: 'normal', mutators: ['brittle', 'rifleOnly', 'sparse', 'eclipse'] },
  // Searchlight towers (night map): a beam of `range` px and ±halfAngle sweeps ±sweep rad around the tower's base angle at `speed`.
  // A player in a beam (not behind a wall) cannot hide and raises an alarm of `alarm` px (at most every alarmCooldown s per tower).
  // Towers are shot out by bullets or explosions (hp).
  searchlights: { radius: 13, hp: 40, range: 330, halfAngle: 0.3, sweep: 1.2, speed: 0.55, alarm: 420, alarmCooldown: 2.5, spacing: 320 },
  // After clearing a boss wave the player may extract: the run ends as a success and the score gains scoreBonus.
  extraction: { scoreBonus: 0.25 },
  // From wave `from`, every wave rolls one optional challenge (seeded). ghost: never be seen; untouched: take no hit;
  // takedowns / ambush: reach `count` in the wave. Success pays `reward` next to the player and score × wave.
  challenges: { from: 2, score: 150, reward: { gold: [25, 40], scrap: 3, heal: 10 }, types: { ghost: {}, untouched: {}, takedowns: { count: 3 }, ambush: { count: 5 } } },
  // Black market: from wave `from`, non-boss waves have `chance` (seeded) of a merchant spawning at least `distance` px away for the rest of
  // the wave. Within reach px, E opens `offers` distinct goods (seeded): a rare/legendary perk, a discounted armory level (× cut),
  // a throwable restock to carry, a full heal and shield recharge, or gold for scrap. Each good sells once.
  market: {
    from: 3, chance: 0.35, distance: 260, reach: 48, offers: 3,
    goods: { perk: { gold: 70, scrap: 2, rarities: ['rare', 'legendary'] }, discount: { cut: 0.5 }, restock: { icon: '◌', gold: 30, scrap: 0 }, patch: { icon: '✚', gold: 35, scrap: 0 }, exchange: { icon: '⇄', gold: 45, scrap: 0, give: 6 } }
  },
  // Harsh difficulties only (see difficulty.harsh). Auto weapons build `cost` heat per shot / blade hit and cool by `cool` per second;
  // reaching max overheats every auto weapon (blades included) for `overheat` s.
  autoHeat: { max: 100, cool: 18, overheat: 3.5, cost: { drone: 7, missile: 16, tesla: 14, blades: 3 } },
  // Harsh only: from wave `from`, each non-boss wave rolls (theme stream) a theme open by that wave. A themed wave has count × the size
  // and each spawn has `share` chance to be one of the theme's kinds instead of the usual roster pick.
  themes: {
    from: 6, share: 0.65, count: 0.85,
    list: {
      fieldHospital: { from: 6, kinds: ['medic', 'shield', 'melee'] },
      scorch: { from: 7, kinds: ['flamer', 'stalker'] },
      breach: { from: 8, kinds: ['shield', 'bomber'] },
      flareSnipe: { from: 9, kinds: ['flare', 'ranged'] },
      recon: { from: 11, kinds: ['scout', 'runner'] }
    }
  },
  // Harsh only: from wave `from`, an elite spawn has `chance` (roster stream) to be a captain escorted by `guards` regular enemies of its
  // kind. While the captain lives, guards within radius px take `reduction` less damage and move × speed.
  captains: { from: 6, chance: 0.4, guards: 2, spread: 40, radius: 200, reduction: 0.3, speed: 1.15 },
  // Harsh only: at phase 2 a boss counters the run's habits. Hidden for at least hiddenRatio of the run → flush (a flare of `flare` px for
  // `seconds` plus burned grass of `burn` px on the player every `every` s); otherwise average manual-hit distance ≥ longRange → rush
  // (speed × speed, attack intervals and sniper aim × pace).
  bossCounters: { hiddenRatio: 0.35, longRange: 320, flush: { every: 4.5, flare: 150, seconds: 4, burn: 90 }, rush: { speed: 1.4, pace: 0.8 } },
  // Harsh only, non-boss waves: after base + perEnemy × wave size seconds, every `every` s `count` enemies (kinds, no loot) arrive at least
  // distance px away hunting the player and raise the alert by `alert`, up to `max` per wave. The HUD counts down the last `warn` s.
  reinforcements: { base: 45, perEnemy: 2.2, every: 10, count: 2, max: 8, kinds: ['runner', 'melee'], alert: 5, warn: 20, distance: 330 },
  // Boss-wave missions (all difficulties, not the finale): seeded type, completed before the boss falls pays reward and score × wave.
  // Failure on a harsh difficulty cancels the extraction bonus offered after that wave.
  // uplink: stay within radius for `seconds` in total. escort: an agent with hp walks toward an exit while the player is within follow px;
  // enemy bullets and blasts hurt it. radar: `count` dishes (hp) spaced apart; a standing dish spotting a visible player within scan px
  // raises an alarm of `alarm` px (every cooldown s per dish); destroying them all completes it.
  missions: {
    score: 400, reward: { gold: [50, 70], scrap: 5, heal: 20 },
    types: {
      uplink: { radius: 80, seconds: 20, distance: 260 },
      escort: { hp: 120, speed: 70, follow: 150, radius: 13, reach: 55, distance: 420 },
      radar: { count: 3, hp: 45, radius: 14, spacing: 240, scan: 170, alarm: 480, cooldown: 3 }
    }
  },
  // Every `length` waves close a chapter (up to `count`). Rating = checks met among: time ≤ par (perEnemy × enemies + perWave × waves),
  // detections ≤ detections, damage taken ≤ taken × max HP, and the chapter's boss mission (if any); grades by checks met.
  // Chapter badges: flawless (no damage), silent (never detected), swift (time ≤ swift × par). Not in daily or training runs.
  chapters: { length: 5, count: 5, par: { perEnemy: 3.2, perWave: 15 }, detections: 6, taken: 0.6, swift: 0.7, grades: ['C', 'C', 'B', 'A', 'S'] },
  badges: { flawless: { icon: '✚' }, silent: { icon: '◐' }, swift: { icon: '⏱' } },
  // Training range: fight one boss already met at wave `wave` (no regular enemies) with gold/scrap to spend first. No records; a win pays
  // `xp` mastery, at most dailyXp per UTC day.
  training: { wave: 10, gold: 160, scrap: 14, xp: 30, dailyXp: 90 },
  // After-action report: the damage log keeps the last `window` s before the end and lists up to `entries` hits; preview names `kinds` foes.
  report: { window: 5, entries: 4 },
  preview: { kinds: 3 },
  operations: {
    lanes: 3, weather: ['standard', 'rain', 'night'],
    supplyHeal: 40, alarmReinforcements: 2,
    types: ['eliminate', 'infiltrate', 'elite', 'supply'],
    icons: { eliminate: '◇', infiltrate: '◈', elite: '◆', supply: '+', boss: '♛' }
  },
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
const canvas = $('game'), ctx = canvas.getContext('2d'), arena = $('arena'), arenaBottom = arena.querySelector('.arena-bottom');
// Canvas y of the bottom hint bar's top edge; the kit line is drawn just above it (the bar grows when its text wraps).
let hintTop = 0;
const measureHint = () => { hintTop = arenaBottom.getBoundingClientRect().top - canvas.getBoundingClientRect().top; };
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
// ISO date/week helpers are UTC so records agree across time zones.
const todayUTC = () => new Date().toISOString().slice(0, 10);
function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d - yearStart) / 86400000) + 1) / 7)).padStart(2, '0')}`;
}
const variantFor = seed => pickWeighted(seededRandom(`${seed}:variant`), Object.entries(CONFIG.variants).map(([key, v]) => [key, v.weight]));
const dailyMutator = seed => pickWeighted(seededRandom(`${seed}:mutator`), CONFIG.daily.mutators.map(key => [key, 1]));
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
// Run seeds: normal runs roll a short code (shown on the report, typed into the start screen to replay the same map and rolls).
const randomSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, '0');
const normalizeSeed = text => String(text).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
// Personal records and long-term progression. New objects are normalized without dropping unknown legacy fields.
const PROFILE_KEY = 'bushwhack-profile';
const TOTAL_KEYS = ['ambushKills', 'bossKills', 'extractions', 'takedowns', 'challenges', 'purchases', 'clears'];
const profile = (() => {
  let data; try { data = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch {}
  if (!data || typeof data !== 'object') data = {};
  const mutators = Array.isArray(data.mutators) ? data.mutators.filter(key => CONFIG.mutators[key]) : [];
  const bossKinds = Array.isArray(data.bossKinds) ? data.bossKinds.filter(key => CONFIG.enemies[key]?.boss) : [];
  const week = isoWeek(), weekly = data.weekly?.week === week ? data.weekly : { week, progress: {}, done: [] };
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return { ...data, records: data.records ?? {}, daily: data.daily ?? null, totals: { ...Object.fromEntries(TOTAL_KEYS.map(key => [key, 0])), ...data.totals }, bossKinds, achievements: Array.isArray(data.achievements) ? data.achievements : [], difficulty: data.difficulty ?? 'normal', cls: CONFIG.classes[data.cls] ? data.cls : 'ranger', skin: CONFIG.skins[data.skin] ? data.skin : 'default', mutators, mastery: { ...Object.fromEntries(Object.keys(CONFIG.classes).map(k => [k, 0])), ...data.mastery }, threatRecords: data.threatRecords ?? {}, weekly, streak: { day: '', count: 0, ...data.streak }, intel: { enemies: [], bosses: [...bossKinds], perks: [], variants: [], ...data.intel },
    // Balance data (damage taken and deaths by source), best chapter grades per difficulty, chapter badge counts, training XP today,
    // and weekly seed-challenge bests keyed by ISO week.
    analytics: { runs: 0, deaths: {}, taken: {}, ...object(data.analytics) }, chapters: object(data.chapters), badges: { ...Object.fromEntries(Object.keys(CONFIG.badges).map(k => [k, 0])), ...object(data.badges) }, training: { day: '', xp: 0, ...object(data.training) }, seedRuns: object(data.seedRuns) };
})();
function saveProfile() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}
const markIntel = (group, key) => { if (!profile.intel[group].includes(key)) { profile.intel[group].push(key); saveProfile(); } };
const unlocked = id => profile.achievements.includes(id);
function weeklyContracts() {
  if (profile.weekly.week !== isoWeek()) profile.weekly = { week: isoWeek(), progress: {}, done: [] };
  if (profile.weekly.contracts?.length === CONFIG.weekly.contracts) return profile.weekly.contracts;
  const random = seededRandom(`contract:${profile.weekly.week}`), pool = [...CONFIG.weekly.pool], out = [];
  while (out.length < CONFIG.weekly.contracts && pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  profile.weekly.contracts = out; saveProfile(); return out;
}
function progressContract(kind, amount = 1) {
  const weekly = profile.weekly, contracts = weeklyContracts();
  for (const id of contracts) if (id === kind && !weekly.done.includes(id)) {
    weekly.progress[id] = (weekly.progress[id] ?? 0) + amount;
    const target = CONFIG.weekly.targets[id];
    if (weekly.progress[id] >= target) {
      weekly.done.push(id); profile.mastery[game.cls] += CONFIG.weekly.rewardXp;
      notify(t('contract.done', { name: t(`contract.${id}`, { count: target }) }));
    }
    saveProfile();
  }
}
const threatCap = () => CONFIG.threat.initialCap + profile.totals.clears * CONFIG.finale.threatStep;
const selectedThreat = keys => keys.reduce((n, k) => n + (CONFIG.mutators[k]?.points ?? 0), 0);
const maxThreatRecord = () => Math.max(0, ...Object.values(profile.threatRecords).map(Number));
const masteryLevel = (cls, xp = profile.mastery[cls] ?? 0) => CONFIG.mastery.thresholds.reduce((level, threshold, i) => xp >= threshold ? i + 1 : level, 0);
const threatUnlocked = entry => !entry.unlock || maxThreatRecord() >= entry.unlock.threat;
const isOpen = entry => !entry.unlock || (typeof entry.unlock === 'string' ? unlocked(entry.unlock) : threatUnlocked(entry));
const skinOpen = key => {
  const skin = CONFIG.skins[key], mastery = skin.mastery;
  const mastered = !mastery || (mastery.cls ? masteryLevel(mastery.cls) >= mastery.level : Object.keys(CONFIG.classes).some(cls => masteryLevel(cls) >= mastery.level));
  return mastered && (isOpen(skin) || Object.entries(CONFIG.threat.cosmetics).some(([points, skinKey]) => skinKey === key && maxThreatRecord() >= Number(points)));
};
const difficultyOpen = key => isOpen(CONFIG.difficulty[key]);
if (!CONFIG.difficulty[profile.difficulty] || !difficultyOpen(profile.difficulty)) profile.difficulty = 'normal';
if (!isOpen(CONFIG.classes[profile.cls])) profile.cls = 'ranger';
if (!skinOpen(profile.skin)) profile.skin = 'default';
profile.mutators = profile.mutators.filter(key => isOpen(CONFIG.mutators[key]));
while (selectedThreat(profile.mutators) > threatCap()) profile.mutators.pop();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pointIn = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const circleRect = (x, y, radius, r) => Math.hypot(x - clamp(x, r.x, r.x + r.w), y - clamp(y, r.y, r.y + r.h)) < radius;
const overlap = (a, b, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
const rectCenter = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const worldCenter = { x: CONFIG.world.width / 2, y: CONFIG.world.height / 2 };
const game = { mode: 'menu', wave: 1, walls: [], ponds: [], bushes: [], barrels: [], lights: [], enemies: [], bullets: [], missiles: [], arcs: [], bombs: [], blasts: [], chests: [], loot: [], particles: [], throws: [], gadgets: [], flares: [], pools: [], shopTab: 'guns', keys: new Set(), mouse: { x: 0, y: 0, down: false, active: false }, player: null, kills: 0, earned: 0, score: 0, combo: 0, comboTimer: 0, waveRemaining: 0, waveTotal: 0, spawnTimer: 0, nextWave: 0, chestTimer: 0, time: 0, flash: 0, shake: 0, toastUntil: 0, difficulty: 'normal', cls: 'ranger', mutators: [], variant: 'standard', seed: '', daily: null, rng: null, stats: null, event: null, boss: null, challenge: null, merchant: null, perks: {}, perkOffer: null, route: null, nextRoute: null, routeOffer: null, summary: null, seenAffixes: new Set(), newAchievements: [] };
game.alert = 0; game.waveAlert = 0; game.waveSilent = true;
function raiseAlert(amount) { game.alert = clamp(game.alert + amount, 0, CONFIG.alert.max); }
// Every sighting, scan, searchlight or radar alarm counts as one detection for the after-action report and chapter grade.
function markDetected(amount) { game.waveSilent = false; game.stats.detections++; raiseAlert(amount); operationAlarm(); }
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
    blade: (t, v) => tone(sfxBus, { type: 'triangle', from: 1300, to: 700, at: t, dur: .05, vol: .12 * v }),
    beep: (t, v) => notes(sfxBus, [93, 88], t, .07, .06, .08 * v, pulse12),
    toss: t => hiss(sfxBus, { at: t, dur: .14, vol: .1, filter: 'bandpass', freq: 900 }),
    takedown: (t, v) => { tone(sfxBus, { type: 'triangle', from: 700, to: 90, at: t, dur: .12, vol: .22 * v }); hiss(sfxBus, { at: t, dur: .06, vol: .08 * v, filter: 'lowpass', freq: 1200 }); },
    skill: t => notes(sfxBus, [76, 83], t, .04, .07, .1, pulse25),
    flame: (t, v) => hiss(sfxBus, { at: t, dur: .18, vol: .12 * v, filter: 'bandpass', freq: 700 }),
    laser: (t, v) => tone(sfxBus, { type: 'sine', from: 1900, at: t, dur: .12, vol: .07 * v }),
    bow: (t, v) => { tone(sfxBus, { type: 'triangle', from: 420, to: 170, at: t, dur: .1, vol: .2 * v }); hiss(sfxBus, { at: t, dur: .05, vol: .05 * v, filter: 'lowpass', freq: 1600 }); },
    launcher: (t, v) => { tone(sfxBus, { type: 'triangle', from: 150, to: 50, at: t, dur: .18, vol: .32 * v }); hiss(sfxBus, { at: t, dur: .12, vol: .12 * v, filter: 'bandpass', freq: 600 }); },
    crack: (t, v) => { hiss(sfxBus, { at: t, dur: .22, vol: .22 * v, filter: 'lowpass', freq: 1400 }); tone(sfxBus, { from: 300, to: 90, at: t, dur: .16, vol: .1 * v }); },
    extract: t => notes(sfxBus, [72, 76, 79, 84, 88, 91], t, .08, .16, .11, pulse25)
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
    if (ac) { if (ac.state !== 'running' && !document.hidden) ac.resume(); return; }
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
    // Safari may create the context suspended (or interrupt it later) even inside a click; retry on every user gesture.
    for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, init, true);
    ac.resume();
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
function generateMap(random, variant, bushScale = 1) {
  const w = CONFIG.world, v = CONFIG.variants[variant], r = (a, b) => between(random, a, b);
  game.walls = []; game.ponds = []; game.bushes = []; game.barrels = []; game.lights = [];
  const items = [];
  const fits = (rect, blockers) => rect.x >= w.placementMargin && rect.y >= w.placementMargin && rect.x + rect.w <= w.width - w.placementMargin && rect.y + rect.h <= w.height - w.placementMargin && distance(rectCenter(rect), worldCenter) >= w.spawnClearance && !blockers.some(other => overlap(rect, other, w.terrainGap));
  // Stone walls first, then wooden ones (same placement and connectivity rules).
  function addWalls(count, wood) {
    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < w.placementAttempts; attempt++) {
        const width = r(...w.wallWidth), height = r(...w.wallHeight);
        const rect = { x: r(w.placementMargin, w.width - width - w.placementMargin), y: r(w.placementMargin, w.height - height - w.placementMargin), w: width, h: height };
        if (!fits(rect, items) || !connected([...game.walls, rect])) continue;
        if (wood) Object.assign(rect, { wood: true, hp: w.woodHp, maxHp: w.woodHp, hit: 0 });
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
  // Searchlight towers: open ground, spaced apart, aimed roughly at the map center with a seeded sweep phase.
  function addLights(count) {
    const L = CONFIG.searchlights;
    for (let i = 0; i < count; i++) for (let attempt = 0; attempt < w.placementAttempts; attempt++) {
      const x = r(w.placementMargin, w.width - w.placementMargin), y = r(w.placementMargin, w.height - w.placementMargin);
      if (!passable(x, y, L.radius + 4) || distance({ x, y }, worldCenter) < w.spawnClearance || [...game.ponds, ...game.bushes].some(o => circleRect(x, y, L.radius, o)) || game.lights.some(l => distance(l, { x, y }) < L.spacing)) continue;
      game.lights.push({ x, y, radius: L.radius, hp: L.hp, hit: 0, alarm: 0, base: Math.atan2(worldCenter.y - y, worldCenter.x - x) + r(-.6, .6), phase: r(0, Math.PI * 2), light: true }); break;
    }
  }
  addWalls(w.walls, false);
  addWalls(w.woodWalls, true);
  addClusters('ponds', { ...w.ponds, clusters: Math.round(w.ponds.clusters * v.ponds) });
  addClusters('bushes', { ...w.bushes, clusters: Math.round(w.bushes.clusters * v.bushes * bushScale) });
  addBarrels(v.barrels);
  addLights(v.searchlights ?? 0);
}
function freeSpot(radius, minDistance, avoidTerrain = false, maxDistance = Infinity) {
  for (let attempt = 0; attempt < CONFIG.world.spawnAttempts; attempt++) {
    const margin = CONFIG.world.spawnMargin, x = rand(margin, CONFIG.world.width - margin), y = rand(margin, CONFIG.world.height - margin);
    const d = distance({ x, y }, game.player);
    if (!passable(x, y, radius) || d < minDistance || d > maxDistance) continue;
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
// Roster, elite affix and event rolls use the run's seeded roster stream. A themed wave (harsh only) draws `share` of its spawns from
// the theme's kinds.
function pickEnemyKind() {
  if (game.event?.type === 'stalkers') return 'stalker';
  const theme = CONFIG.themes.list[game.theme];
  if (theme && game.rng.roster() < CONFIG.themes.share) return theme.kinds[Math.floor(game.rng.roster() * theme.kinds.length)];
  return pickWeighted(game.rng.roster, rosterWeights(game.wave));
}
const rosterWeights = wave => CONFIG.waves.roster.filter(r => wave >= r.from).map(r => [r.kind, Math.min(r.max, r.weight + (wave - r.from) * r.perWave)]);
const difficulty = () => CONFIG.difficulty[game.difficulty];
// Punishing systems run only on harsh difficulties (never in daily runs, which are fixed to normal).
const harsh = () => !!difficulty().harsh && !game.daily;
const perk = key => game.perks[key] ?? 0;
const P = CONFIG.perks.list;
const mutator = key => game.mutators.includes(key);
const threatTotal = () => game.daily ? 0 : selectedThreat(game.mutators);
const route = () => CONFIG.routes.list[game.route] ?? {};
const classInfo = () => CONFIG.classes[game.cls];
// Tightest view limit among the map variant, the wave's route and vision mutators (eclipse, night raid); Infinity = unlimited.
const visionLimit = () => Math.min(CONFIG.variants[game.variant].vision ?? Infinity, route().vision ?? Infinity, ...game.mutators.map(key => CONFIG.mutators[key].vision ?? Infinity));
const waveScale = () => 1 + (game.wave - 1) * CONFIG.enemies.healthPerWave;
const enemyDamage = stats => Math.ceil(stats.damage * (1 + (game.wave - 1) * CONFIG.enemies.damagePerWave) * difficulty().damage);
const goldAmount = n => Math.max(1, Math.round(n * difficulty().gold * (1 + perk('greed') * P.greed.gold + perk('hoarder') * P.hoarder.gold + perk('bloodPrice') * P.bloodPrice.gold + (route().gold ?? 0))));
function scrapAmount(n) {
  const v = n * (1 + perk('scavenger') * P.scavenger.scrap + perk('hoarder') * P.hoarder.scrap + (classInfo().scrap ?? 0) + (route().scrap ?? 0));
  return Math.floor(v) + (Math.random() < v % 1 ? 1 : 0);
}
function makeEnemy(kind, pos, { affix = null, noLoot = false, hpScale = 1, radius } = {}) {
  const stats = CONFIG.enemies[kind], E = CONFIG.elites, scale = waveScale() * difficulty().hp * hpScale * (1 + (route().hp ?? 0)) * (mutator('brittle') ? CONFIG.mutators.brittle.enemyHp : 1);
  const hp = Math.max(1, Math.round(stats.hp * scale * (affix ? E.hp : 1))), shieldHp = Math.round((stats.shieldHp || 0) * scale), pressure = clamp(game.waveAlert / CONFIG.alert.max, 0, 1);
  const e = { ...pos, kind, affix, noLoot, radius: radius ?? stats.radius, hp, maxHp: hp, shieldHp, maxShield: shieldHp, speed: difficulty().speed * (affix === 'swift' ? E.affixes.swift.speed : 1), sightScale: (1 + pressure * CONFIG.alert.sightBonus) * (1 + (route().sight ?? 0)), patrolScale: 1 + pressure * CONFIG.alert.patrolBonus, reconScale: 1 + pressure * CONFIG.alert.reconBonus, state: 'wander', direction: rand(-Math.PI, Math.PI), facing: Math.atan2(game.player.y - pos.y, game.player.x - pos.x), seed: rand(0, Math.PI * 2), wanderTime: rand(...CONFIG.enemies.wanderInterval), alertTime: 0, cooldown: rand(0, .6), special: rand(0, 1), hit: 0, blocked: 0, bladeCooldown: 0, reveal: 0, fuse: 0, lastSeen: null, goal: null, sweep: null, searchTime: 0, arrived: false, healTimer: stats.healEvery ?? 0 };
  game.enemies.push(e); return e;
}
function rollAffix() {
  const E = CONFIG.elites;
  if (game.operation?.type === 'elite') return pickWeighted(game.rng.roster, Object.keys(E.affixes).map(key => [key, 1]));
  const chance = Math.min(E.max, E.base + (game.wave - E.from) * E.perWave) + difficulty().elite + (route().elite ?? 0) + (mutator('elites') ? CONFIG.mutators.elites.elite : 0);
  return game.rng.roster() < chance ? pickWeighted(game.rng.roster, Object.keys(E.affixes).map(key => [key, 1])) : null;
}
function spawnEnemy() {
  const guided = game.wave === 1 && game.waveRemaining === game.waveTotal;
  const pos = (guided && freeSpot(18, CONFIG.waves.enemySpawnDistance, false, CONFIG.throwables.items.decoy.noise - 20))
    || freeSpot(18, CONFIG.waves.enemySpawnDistance);
  if (!pos) return false;
  const e = makeEnemy(pickEnemyKind(), pos, { affix: rollAffix() });
  if (e.affix && !game.seenAffixes.has(e.affix)) { game.seenAffixes.add(e.affix); notify(t('toast.elite', { name: t(`affix.${e.affix}`), desc: t(`affix.${e.affix}.desc`) })); }
  if (e.affix && harsh() && game.wave >= CONFIG.captains.from && game.rng.roster() < CONFIG.captains.chance) makeCaptain(e);
  markIntel(CONFIG.enemies[e.kind].boss ? 'bosses' : 'enemies', e.kind);
  return true;
}
// Captain (harsh): an elite escorted by guards of its kind (assault troopers for support kinds) that start at its side.
function makeCaptain(e) {
  const C = CONFIG.captains, kind = CONFIG.enemies[e.kind].damage > 0 ? e.kind : 'melee';
  e.captain = true;
  for (let i = 0; i < C.guards && game.enemies.length < CONFIG.waves.maxAlive; i++) {
    const a = rand(0, Math.PI * 2), pos = { x: e.x + Math.cos(a) * C.spread, y: e.y + Math.sin(a) * C.spread };
    if (passable(pos.x, pos.y, CONFIG.enemies[kind].radius)) makeEnemy(kind, pos).guardOf = e;
  }
  if (!game.seenCaptain) { game.seenCaptain = true; notify(t('toast.captain', { pct: Math.round(C.reduction * 100) })); }
}
// A guard is shielded while its captain lives and stands within radius.
const guarded = e => !!e.guardOf && e.guardOf.hp > 0 && game.enemies.includes(e.guardOf) && distance(e, e.guardOf) < CONFIG.captains.radius;
// Enemies created mid-fight (boss minions, splitter halves) start already hunting the player.
function spawnNear(kind, from, reach, options) {
  const a = rand(0, Math.PI * 2), pos = { x: from.x + Math.cos(a) * reach, y: from.y + Math.sin(a) * reach };
  if (!passable(pos.x, pos.y, options?.radius ?? CONFIG.enemies[kind].radius)) return;
  Object.assign(makeEnemy(kind, pos, options), { state: 'chase', lastSeen: { x: game.player.x, y: game.player.y } });
}
// Boss waves rotate through boss.order; a fresh boss starts searching the player's position. Training fights the chosen boss.
function bossKind(wave) {
  if (game.training) return game.training;
  const interval = mutator('earlyBoss') ? CONFIG.threat.bossEvery : CONFIG.boss.every;
  return wave === CONFIG.finale.wave ? 'commander' : CONFIG.boss.order[(Math.floor(wave / interval) - 1) % CONFIG.boss.order.length];
}
function spawnBoss() {
  const B = CONFIG.boss, kind = bossKind(game.wave), radius = CONFIG.enemies[kind].radius;
  markIntel('bosses', kind);
  const pos = freeSpot(radius, B.spawnDistance) ?? freeSpot(radius, 0);
  if (!pos) return;
  const finalOperation = game.wave === CONFIG.finale.wave;
  const e = game.boss = Object.assign(makeEnemy(kind, pos, { hpScale: finalOperation ? CONFIG.finale.hpScale : 1 }), { phase: 1, finalOperation });
  if (kind === 'commander') { const C = B.commander; Object.assign(e, { volley: C.volley.interval, bombs: C.bombs.interval, summon: C.summon.interval, ring: C.phase2.ringInterval }); }
  else if (kind === 'sniper') Object.assign(e, { aiming: 0, aimAt: null, burstLeft: 0, burstTimer: 0, cover: null });
  else if (kind === 'incinerator') Object.assign(e, { fireTimer: B.incinerator.interval });
  else Object.assign(e, { brood: B.hive.brood.interval, acid: B.hive.acid.interval });
  startSearch(e, game.player.x, game.player.y);
  notify(t('toast.boss', { wave: game.wave, name: t(`enemy.${kind}`) }));
}
function waveSize(wave) {
  const w = CONFIG.waves;
  return Math.min(w.maxCount, w.baseCount + wave * w.growth + Math.max(0, wave - w.lateFrom) * w.lateGrowth);
}
const isBossWave = (wave = game.wave) => !!game.training || wave === CONFIG.finale.wave || wave % (mutator('earlyBoss') ? CONFIG.threat.bossEvery : CONFIG.boss.every) === 0;
// Regular enemies of a wave under a route and theme (boss waves bring a share; training brings none).
function waveCount(wave, routeKey, theme) {
  if (game.training) return 0;
  if ((game.nextOperation?.wave === wave && game.nextOperation.type === 'supply') || (game.operation?.wave === wave && game.operation.type === 'supply')) return 0;
  const count = 1 + (CONFIG.routes.list[routeKey]?.count ?? 0) + (mutator('ironSwarm') && !game.daily ? CONFIG.mutators.ironSwarm.count : 0);
  return Math.round(waveSize(wave) * difficulty().count * count * (isBossWave(wave) ? CONFIG.boss.regularShare : 1) * (theme ? CONFIG.themes.count : 1));
}
// Harsh only: a non-boss wave from themes.from rolls (theme stream) one theme open by that wave.
function rollTheme(wave) {
  const T = CONFIG.themes;
  if (!harsh() || game.training || wave < T.from || isBossWave(wave)) return null;
  const open = Object.keys(T.list).filter(key => wave >= T.list[key].from);
  return open[Math.floor(game.rng.theme() * open.length)];
}
function startWave() {
  changeChapterBattlefield();
  const boss = isBossWave(), R = CONFIG.reinforcements;
  if (game.wave === 2 && !mutator('rifleOnly')) game.player.owned.add('crossbow');
  game.theme = game.nextTheme; game.nextTheme = null;
  game.waveRemaining = game.waveTotal = waveCount(game.wave, game.route, game.theme);
  game.spawnTimer = CONFIG.waves.initialSpawnDelay; game.nextWave = 0; game.merchant = null;
  game.waveAlert = game.alert; game.waveSilent = true; game.waveClock = 0; game.reinforced = 0; game.reinforceTimer = 0;
  game.reinforceAt = harsh() && !boss ? R.base + R.perEnemy * game.waveTotal : Infinity;
  if (!game.chapter || (game.wave - 1) % CONFIG.chapters.length === 0) game.chapter = { index: Math.ceil(game.wave / CONFIG.chapters.length), time: game.time, detections: game.stats.detections, taken: game.stats.taken, enemies: 0, waves: 0, mission: null };
  game.chapter.enemies += game.waveTotal; game.chapter.waves++;
  if (game.event && !(game.event.started && !game.event.done)) game.event = null;
  const fresh = CONFIG.waves.roster.find(r => r.from === game.wave && r.from > 1);
  notify(game.training ? t('toast.training', { name: t(`enemy.${game.training}`) }) : game.theme ? t('toast.theme', { wave: game.wave, name: t(`theme.${game.theme}`) }) : fresh ? t('toast.newEnemy', { wave: game.wave, name: t(`enemy.${fresh.kind}`) }) : t('toast.wave', { wave: game.wave }));
  sound.play('wave');
  if (!game.training) rollChallenge();
  if (boss) { spawnBoss(); startMission(); } else { if (!game.event) rollEvent(); rollMarket(); }
  beginOperation();
}
// Wave 2 stages intel; later non-boss events use the seeded roster stream.
function rollEvent() {
  const E = CONFIG.events, random = game.rng.roster;
  let type;
  if (game.wave === 2) type = 'intel';
  else {
    if (game.wave < E.from || random() >= E.chance) return;
    type = pickWeighted(random, Object.entries(E.types).filter(([, v]) => game.wave >= (v.from ?? 0) && (!game.daily || (v.daily !== false && !v.unlock)) && isOpen(v)).map(([key]) => [key, 1]));
  }
  game.event = { type, started: type === 'stalkers', done: type === 'stalkers' };
  if (type === 'stalkers') notify(t('event.stalkers', { wave: game.wave }));
}
// Event rewards: gold range, scrap (number or range) and a heal pack.
function payout(x, y, cfg) {
  const scrap = Array.isArray(cfg.scrap) ? Math.floor(rand(cfg.scrap[0], cfg.scrap[1] + 1)) : cfg.scrap;
  drop(x, y, 'gold', goldAmount(rand(cfg.gold[0], cfg.gold[1] + 1))); drop(x, y, 'scrap', scrapAmount(scrap)); drop(x, y, 'heal', cfg.heal);
  burst(x, y, '#f2d782', 24); sound.play('chest');
}
// Wave challenge (seeded): count goals complete as soon as they are reached; ghost and untouched complete when the wave is cleared unbroken.
function rollChallenge() {
  const C = CONFIG.challenges;
  game.challenge = game.wave < C.from ? null : { type: pickWeighted(game.rng.challenge, Object.keys(C.types).map(key => [key, 1])), progress: 0, failed: false, done: false };
}
const challengeGoal = () => CONFIG.challenges.types[game.challenge.type].count ?? 0;
const challengeOpen = type => !!game.challenge && game.challenge.type === type && !game.challenge.done && !game.challenge.failed;
function failChallenge(type) {
  if (!challengeOpen(type)) return;
  game.challenge.failed = true; notify(t('toast.challengeFailed', { name: t(`challenge.${type}`) }));
}
function progressChallenge(type) {
  if (challengeOpen(type) && ++game.challenge.progress >= challengeGoal()) completeChallenge();
}
function completeChallenge() {
  const C = CONFIG.challenges, p = game.player;
  game.challenge.done = true; game.stats.challenges++;
  payout(p.x, p.y, C.reward); addScore(C.score * game.wave);
  notify(t('toast.challengeDone', { name: t(`challenge.${game.challenge.type}`) }));
}
// Black market (seeded chance and goods): the merchant waits at a free spot until the next wave starts.
function rollMarket(force = false) {
  const M = CONFIG.market, random = game.rng.market;
  if (!force && (game.wave < M.from || random() >= M.chance)) return;
  const kinds = Object.keys(M.goods), offers = [];
  while (offers.length < M.offers && kinds.length) {
    const offer = marketGood(kinds.splice(Math.floor(random() * kinds.length), 1)[0], random);
    if (offer) offers.push(offer);
  }
  const pos = force ? { x: game.player.x, y: game.player.y } : freeSpot(16, M.distance, true);
  if (!pos || !offers.length) return;
  game.merchant = { ...pos, offers };
  notify(t('event.market'));
}
// A perk good names a rare/legendary perk still open; a discount good names an armory level not yet maxed.
function marketGood(kind, random) {
  const G = CONFIG.market.goods[kind], pickOne = list => list[Math.floor(random() * list.length)];
  if (kind === 'perk') {
    const open = Object.entries(P).filter(([key, v]) => G.rarities.includes(v.rarity) && perkAvailable(key, v));
    return open.length ? { kind, key: pickOne(open)[0] } : null;
  }
  if (kind === 'discount') {
    const open = ['upgrade', 'mods', 'gear'].flatMap(group => Object.entries(SHOP_TABS[group]).filter(([key, item]) => !item.consumable && game.player.levels[key] < item.max).map(([key]) => [group, key]));
    if (!open.length) return null;
    const [group, key] = pickOne(open);
    return { kind, group, key };
  }
  return { kind };
}
// Current price of a good, or null once it can no longer be bought (sold, maxed level, perk no longer open).
function offerCost(offer) {
  const G = CONFIG.market.goods[offer.kind];
  if (offer.sold) return null;
  if (offer.kind === 'perk' && !perkAvailable(offer.key, P[offer.key])) return null;
  const threatPrice = game.daily || !mutator('expensiveMarket') ? 1 : 1 + CONFIG.mutators.expensiveMarket.price;
  if (offer.kind !== 'discount') return { gold: Math.round(G.gold * threatPrice), scrap: G.scrap };
  const item = SHOP_TABS[offer.group][offer.key], level = game.player.levels[offer.key];
  if (level >= item.max) return null;
  const cost = itemCost(item, level);
  return { gold: Math.round(cost.gold * G.cut * threatPrice), scrap: Math.round(cost.scrap * G.cut) };
}
function openMarket() {
  const m = game.merchant;
  if (game.mode === 'playing' && m && distance(game.player, m) < CONFIG.market.reach) openChoice('market');
}
function buyOffer(index) {
  const offer = game.merchant?.offers[index], p = game.player, cost = offer && offerCost(offer);
  if (game.mode !== 'market' || !cost || p.gold < cost.gold || p.scrap < cost.scrap) return;
  p.gold -= cost.gold; p.scrap -= cost.scrap; offer.sold = true; game.stats.purchases++;
  if (offer.kind === 'perk') grantPerk(offer.key);
  else if (offer.kind === 'discount') grantLevel(offer.group, offer.key, SHOP_TABS[offer.group][offer.key]);
  else {
    if (offer.kind === 'restock') { for (const key in p.items) p.items[key] = CONFIG.throwables.carry; p.bolts = CONFIG.weapons.crossbow.ammo; }
    else if (offer.kind === 'patch') { p.hp = p.maxHp; p.shield = gearStats().maxShield; p.shieldBroken = false; }
    else p.scrap += CONFIG.market.goods.exchange.give;
    notify(t(`market.${offer.kind}.done`));
  }
  burst(p.x, p.y, '#e9e597', 17); sound.play('buy'); updateHUD(); renderChoice();
}
function beginEvent(ev) {
  const cfg = CONFIG.events.types[ev.type]; ev.started = true;
  if (ev.type === 'airdrop') {
    const pos = freeSpot(CONFIG.chests.radius + 1, cfg.distance, true);
    if (!pos) { ev.done = true; return; }
    const hp = Math.round(cfg.hp * waveScale());
    game.chests.push({ ...pos, radius: CONFIG.chests.radius, hp, maxHp: hp, hit: 0, airdrop: true }); ev.done = true;
    notify(t('event.airdrop'));
  } else if (ev.type === 'hold') {
    const pos = freeSpot(cfg.radius / 2, cfg.distance);
    if (!pos) { ev.done = true; return; }
    Object.assign(ev, { zone: pos, progress: 0, limit: cfg.limit });
    notify(t('event.hold', { seconds: cfg.seconds }));
  } else if (ev.type === 'assassinate') {
    const pos = freeSpot(18, cfg.distance);
    if (!pos) { ev.done = true; return; }
    const kind = cfg.kinds[Math.floor(Math.random() * cfg.kinds.length)];
    Object.assign(ev, { mark: Object.assign(makeEnemy(kind, pos, { affix: 'armored' }), { mark: true }), limit: cfg.seconds });
    notify(t('event.assassinate', { name: t(`enemy.${kind}`), seconds: cfg.seconds }));
  } else if (ev.type === 'jammer') {
    const pos = freeSpot(CONFIG.chests.radius + 1, cfg.distance, true);
    if (!pos) { ev.done = true; return; }
    const hp = Math.round(cfg.hp * waveScale()), crate = { ...pos, radius: CONFIG.chests.radius, hp, maxHp: hp, hit: 0, jammer: true };
    game.chests.push(crate); Object.assign(ev, { crate, limit: cfg.seconds });
    notify(t('event.jammer'));
  } else {
    const pos = freeSpot(20, cfg.distance, true);
    if (!pos) { ev.done = true; return; }
    Object.assign(ev, { item: pos, exit: null, carrying: false, limit: cfg.limit, deliveryExpired: false });
    notify(t('event.intelChoice'));
  }
  sound.play('wave');
}
function updateEvent(dt) {
  const ev = game.event, p = game.player;
  if (!ev) return;
  if (!ev.started && game.waveTotal && (game.waveTotal - game.waveRemaining) / game.waveTotal >= CONFIG.events.trigger) beginEvent(ev);
  if (!ev.started || ev.done) return;
  if (ev.type === 'jammer') {
    const cfg = CONFIG.events.types.jammer;
    ev.limit -= dt;
    if (ev.limit <= 0) {
      ev.done = true; ev.outcome = 'escaped'; game.chests.splice(game.chests.indexOf(ev.crate), 1);
      for (let i = 0; i < cfg.reinforcements; i++) {
        const pos = freeSpot(CONFIG.enemies.runner.radius, cfg.distance, true);
        if (pos) Object.assign(makeEnemy('runner', pos, { noLoot: true }), { state: 'chase', lastSeen: { x: p.x, y: p.y } });
      }
      notify(t('event.jammerFailed'));
    }
    return;
  }
  if (ev.type === 'intel') {
    if (ev.deliveryExpired) return;
    ev.limit -= dt;
    if (!ev.carrying && distance(p, ev.item) < CONFIG.player.pickupRadius) {
      ev.carrying = true; ev.exit = freeSpot(CONFIG.events.types.intel.radius, CONFIG.events.types.intel.distance) ?? { ...worldCenter };
      sound.play('scrap'); notify(t('event.intelCarry'));
    } else if (ev.carrying && distance(p, ev.exit) < CONFIG.events.types.intel.radius) {
      ev.done = true; ev.outcome = 'delivered'; ev.carrying = false;
      payout(ev.exit.x, ev.exit.y, CONFIG.events.types.intel); stopIntelWave();
      notify(t('event.intelDone'));
    }
    if (!ev.done && ev.limit <= 0) {
      ev.limit = 0; ev.deliveryExpired = true; ev.carrying = false; ev.exit = null;
      notify(t('event.intelFailed'));
    }
    return;
  }
  if (!ev.limit) return;
  const cfg = CONFIG.events.types[ev.type];
  ev.limit -= dt;
  if (ev.type === 'hold') {
    if (distance(p, ev.zone) < cfg.radius) ev.progress += dt;
    if (ev.progress >= cfg.seconds) { ev.done = true; payout(ev.zone.x, ev.zone.y, cfg); notify(t('event.holdDone')); }
  } else if (ev.type === 'assassinate') {
    if (ev.mark.hp <= 0) { ev.done = true; payout(ev.mark.x, ev.mark.y, cfg); notify(t('event.targetDown')); }
  }
  if (ev.done || ev.limit > 0) return;
  ev.done = true; ev.carrying = false;
  if (ev.type === 'assassinate' && game.enemies.includes(ev.mark)) { game.enemies.splice(game.enemies.indexOf(ev.mark), 1); burst(ev.mark.x, ev.mark.y, '#d5ecf5', 14); }
  notify(t(`event.${ev.type}Failed`));
}
function stopIntelWave() {
  game.waveRemaining = 0; game.spawnTimer = 0; game.enemies.length = 0;
  game.bullets = game.bullets.filter(b => b.friendly);
  game.bombs.length = 0; game.flares.length = 0; game.pools.length = 0; game.boss = null;
}
function completeIntelWipe() {
  const ev = game.event;
  if (!ev?.started || ev.done || ev.type !== 'intel' || game.waveRemaining || game.enemies.length) return;
  ev.done = true; ev.outcome = 'eliminated'; ev.carrying = false;
  payout(game.player.x, game.player.y, CONFIG.events.types.intel.elimination);
  notify(t('event.intelEliminateDone'));
}
// Boss-wave mission (seeded type from the mission stream): uplink zone, escorted agent or radar dishes. Not in training or the finale.
function startMission() {
  game.mission = null;
  if (game.training || game.wave === CONFIG.finale.wave) return;
  const M = CONFIG.missions.types, type = pickWeighted(game.rng.mission, Object.keys(M).map(key => [key, 1])), cfg = M[type], p = game.player, m = { type, done: false, failed: false };
  if (type === 'uplink') {
    const zone = freeSpot(cfg.radius / 2, cfg.distance);
    if (!zone) return;
    Object.assign(m, { zone, progress: 0 });
  } else if (type === 'escort') {
    const exit = freeSpot(cfg.reach, cfg.distance), start = [0, 1, 2, 3].map(i => ({ x: p.x + Math.cos(i * Math.PI / 2) * 40, y: p.y + Math.sin(i * Math.PI / 2) * 40 })).find(pt => passable(pt.x, pt.y, cfg.radius));
    if (!exit || !start) return;
    Object.assign(m, { exit, agent: { ...start, radius: cfg.radius, hp: cfg.hp, maxHp: cfg.hp, hit: 0, agent: true } });
  } else {
    const dishes = [];
    for (let attempt = 0; attempt < CONFIG.world.placementAttempts && dishes.length < cfg.count; attempt++) {
      const pos = freeSpot(cfg.radius + 4, CONFIG.waves.enemySpawnDistance, true);
      if (pos && dishes.every(d => distance(d, pos) >= cfg.spacing)) dishes.push({ ...pos, radius: cfg.radius, hp: cfg.hp, maxHp: cfg.hp, hit: 0, alarm: 0, dish: true });
    }
    if (dishes.length < cfg.count) return;
    m.dishes = dishes;
  }
  game.mission = m;
  notify(t(`mission.${type}.start`, { seconds: cfg.seconds, count: cfg.count }));
}
const activeMission = () => game.mission && !game.mission.done && !game.mission.failed ? game.mission : null;
const missionDishes = () => activeMission()?.dishes?.filter(d => d.hp > 0) ?? [];
const escortAgent = () => activeMission()?.agent ?? null;
function hurtAgent(damage) {
  const a = escortAgent();
  if (!a) return;
  a.hp -= damage; a.hit = .15; burst(a.x, a.y, '#9fe3ff', 5);
  if (a.hp <= 0) failMission();
}
function damageDish(d, damage) {
  if (d.hp <= 0) return;
  d.hp -= damage; d.hit = .15;
  if (d.hp > 0) return;
  burst(d.x, d.y, '#dfe9f2', 16); sound.play('shieldBreak', d);
  if (!missionDishes().length) completeMission();
}
function updateMission(dt) {
  const m = activeMission(), p = game.player;
  if (!m) return;
  const cfg = CONFIG.missions.types[m.type];
  if (m.type === 'uplink') {
    if (distance(p, m.zone) < cfg.radius) m.progress += dt;
    if (m.progress >= cfg.seconds) completeMission();
  } else if (m.type === 'escort') {
    const a = m.agent;
    a.hit = Math.max(0, a.hit - dt);
    if (distance(p, a) < cfg.follow) steer(a, angleTo(a, m.exit), cfg.speed, dt);
    if (distance(a, m.exit) < cfg.reach) completeMission();
  } else for (const d of missionDishes()) {
    d.hit = Math.max(0, d.hit - dt); d.alarm -= dt;
    if (d.alarm <= 0 && distance(d, p) < cfg.scan && !isHidden() && clearSight(d, p)) {
      d.alarm = cfg.cooldown; alertNoise(p.x, p.y, cfg.alarm); markDetected(CONFIG.alert.scan); sound.play('beep', d);
    }
  }
}
function completeMission() {
  const m = game.mission, p = game.player, M = CONFIG.missions;
  m.done = true; game.chapter.mission = true;
  payout(p.x, p.y, M.reward); addScore(M.score * game.wave);
  notify(t('mission.done', { name: t(`mission.${m.type}`) }));
}
function failMission() {
  const m = game.mission;
  m.failed = true; game.chapter.mission = false;
  if (harsh()) game.missionPenalty = game.wave;
  notify(t(harsh() ? 'mission.failedPenalty' : 'mission.failed', { name: t(`mission.${m.type}`) }));
}
// The boss fell: an unfinished mission fails.
function resolveMission() { if (activeMission()) failMission(); }
// Chapter close (every chapters.length waves, and the finale): grade the chapter's time, detections, damage and mission, count badges
// and keep the best grade per difficulty. Not in daily or training runs.
function closeChapter() {
  const c = game.chapter, C = CONFIG.chapters, s = game.stats, p = game.player;
  if (!c || c.closed || game.daily || game.training || c.index > C.count) return;
  c.closed = true;
  const time = game.time - c.time, par = C.par.perEnemy * c.enemies + C.par.perWave * c.waves, detections = s.detections - c.detections, taken = s.taken - c.taken;
  const grade = [time <= par, detections <= C.detections, taken <= C.taken * p.maxHp, c.mission !== false].filter(Boolean).length;
  const earned = { flawless: taken <= 0, silent: detections === 0, swift: time <= C.swift * par };
  const badges = Object.keys(CONFIG.badges).filter(key => earned[key]);
  s.chapters.push({ index: c.index, grade, badges });
  const best = profile.chapters[game.difficulty] ?? [];
  best[c.index - 1] = Math.max(best[c.index - 1] ?? -1, grade); profile.chapters[game.difficulty] = best;
  for (const key of badges) profile.badges[key]++;
  saveProfile();
  notify(t('toast.chapter', { index: c.index, grade: C.grades[grade], badges: badges.map(key => `${CONFIG.badges[key].icon} ${t(`badge.${key}`)}`).join(' ') }));
}
// A run is a normal game (random or typed seed, chosen difficulty/mutators, achievement rewards), today's daily challenge (date seed,
// seeded mutator), this week's seed challenge (week seed, fixed difficulty and seeded threat modifiers) or a training fight against one
// boss. The seed drives every seeded stream, so a typed seed replays the same map and rolls.
function startGame(daily, { training = null, seedWeek = null } = {}) {
  sound.init();
  if (!daily && !seedWeek && selectedThreat(profile.mutators) > threatCap()) { notify(t('threat.cap', { cap: threatCap() })); return; }
  const seed = daily ? todayUTC() : seedWeek ? seedChallengeSeed(seedWeek) : training ? randomSeed() : normalizeSeed($('seedInput').value) || randomSeed(), T = CONFIG.throwables;
  $('seedInput').blur(); $('trainingOverlay').hidden = true; $('progressOverlay').hidden = true;
  game.seed = seed; game.daily = daily ? seed : null; game.training = training; game.seedWeek = seedWeek;
  game.difficulty = daily ? CONFIG.daily.difficulty : seedWeek ? CONFIG.seedChallenge.difficulty : profile.difficulty; game.variant = variantFor(seed);
  game.cls = profile.cls; game.mutators = daily ? [dailyMutator(seed)] : seedWeek ? seedChallengeMutators(seedWeek) : training ? [] : [...profile.mutators]; game.threat = daily ? 0 : selectedThreat(game.mutators);
  game.rng = { roster: seededRandom(`${seed}:roster`), perks: seededRandom(`${seed}:perks`), challenge: seededRandom(`${seed}:challenge`), market: seededRandom(`${seed}:market`), contract: seededRandom(`${seed}:contract`), theme: seededRandom(`${seed}:theme`), mission: seededRandom(`${seed}:mission`) };
  game.mode = 'playing'; game.time = 0; game.wave = training ? CONFIG.training.wave : 1; game.kills = 0; game.earned = 0; game.score = 0; game.combo = 0; game.comboTimer = 0; game.alert = 0; game.waveAlert = 0; game.waveSilent = true;
  game.enemies = []; game.bullets = []; game.missiles = []; game.arcs = []; game.bombs = []; game.blasts = []; game.chests = []; game.loot = []; game.particles = [];
  game.throws = []; game.gadgets = []; game.flares = []; game.pools = [];
  game.boss = null; game.event = null; game.challenge = null; game.merchant = null; game.perks = {}; game.perkOffer = null; game.route = null; game.nextRoute = null; game.seenAffixes = new Set(); game.newAchievements = [];
  game.mission = null; game.missionPenalty = 0; game.chapter = null; game.theme = null; game.nextTheme = null; game.seenCaptain = false; game.seenOverheat = false; game.perkBonus = 0;
  game.stats = { damage: {}, crossbowKills: 0, silentWaves: 0, ambushKills: 0, takedowns: 0, taken: 0, bosses: 0, bossKinds: new Set(), challenges: 0, purchases: 0, shotWave: null, extracted: false, perks: [], hurtBy: {}, log: [], lastHit: null, detections: 0, hiddenTime: 0, hitRange: 0, hits: 0, chapters: [] };
  game.keys.clear(); game.mouse.down = false; game.chestTimer = 0; game.flash = 0;
  const levels = Object.fromEntries([...Object.keys(CONFIG.upgrades), ...Object.keys(CONFIG.gear), ...Object.keys(CONFIG.autoWeapons), ...Object.keys(CONFIG.mods)].map(key => [key, 0]));
  const autoCooldowns = Object.fromEntries(Object.keys(CONFIG.autoWeapons).map(key => [key, 0])), hp = CONFIG.player.hp + (classInfo().hp ?? 0);
  const p = game.player = { ...worldCenter, radius: CONFIG.player.radius, hp, maxHp: hp, shield: 0, lastHurt: 0, gold: 0, scrap: 0, levels, weapon: 'rifle', owned: new Set(['rifle']), autoCooldowns, cooldown: 0, invulnerable: 0, revealedUntil: 0, bushTime: -Infinity, facing: 0, items: { ...T.start }, throwKind: Object.keys(T.items)[0], bolts: CONFIG.weapons.crossbow.ammo, skillCooldown: 0, takedownCooldown: 0, dash: null, bulwark: 0, focus: 0, hunterFocusIdle: 0, hunterFocusReady: false, shadeCircuitProgress: 0, heat: 0, overheat: 0, mag: {}, reload: 0, shieldBroken: false };
  if (!daily) for (const [id, a] of Object.entries(CONFIG.achievements)) {
    if (!unlocked(id)) continue;
    if (a.startGun && !mutator('rifleOnly')) { p.owned.add(a.startGun); p.weapon = a.startGun; }
    if (a.startOwn && !mutator('rifleOnly')) p.owned.add(a.startOwn);
    if (a.startAuto) p.levels[a.startAuto] = Math.max(1, p.levels[a.startAuto]);
    if (a.startGold) p.gold += a.startGold;
  }
  if (training) { p.gold += CONFIG.training.gold; p.scrap += CONFIG.training.scrap; if (!mutator('rifleOnly')) p.owned.add('crossbow'); }
  game.operationPlan = null; game.operation = null; game.nextOperation = null; game.operationLane = null; game.supplyReady = true;
  stealthResetRun(); buildReset();
  generateMap(seededRandom(`${seed}:map`), game.variant, mutator('sparse') ? CONFIG.mutators.sparse.bushes : 1);
  stealthResetMap();
  for (let i = 0; i < Math.min(CONFIG.chests.initial, CONFIG.chests.maximum); i++) spawnChest();
  UI.start.hidden = true; UI.end.hidden = true; UI.shop.hidden = true; UI.perk.hidden = true;
  sound.music('play');
  if (training) { startWave(); toggleShop(); } else offerOperation(game.wave);
  updateHUD();
}
// Weekly seed challenge: the week's seed and threat modifiers (seeded by the week, distinct picks from the pool).
const seedChallengeSeed = week => `${CONFIG.seedChallenge.prefix}${week}`;
function seedChallengeMutators(week) {
  const random = seededRandom(`seed-challenge:${week}`), pool = [...CONFIG.seedChallenge.pool], out = [];
  while (out.length < CONFIG.seedChallenge.mutators && pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}
function notify(text) { UI.toast.textContent = text; UI.toast.classList.add('show'); game.toastUntil = performance.now() + 1900; }
// Marksman: class range bonus, and Focus adds damage and removes jitter while it lasts. `mag` is the magazine size under the magazine
// modifier (0 = no magazine).
function gunStats(key = game.player.weapon) {
  const p = game.player, l = p.levels, g = CONFIG.gun, w = CONFIG.weapons[key], M = CONFIG.mods, focus = p.focus > 0 ? CONFIG.classes.marksman.skill.damage : 0;
  return buildGunStats(key, {
    ...w, damage: Math.round(w.damage * (1 + l.damage * g.damageStep) * (1 + perk('glassCannon') * P.glassCannon.damage + perk('purist') * P.purist.damage) * (1 + focus)),
    shotsPerSecond: w.shotsPerSecond * (1 + l.rate * g.rateStep) * (1 + perk('trigger') * P.trigger.rate + perk('frenzy') * P.frenzy.rate),
    pellets: w.pellets + l.spread, range: Math.round(w.range * (1 + l.range * g.rangeStep + (classInfo().range ?? 0))), pierce: w.pierce + l.piercing * M.piercing.pierce + (focus && !game.daily && game.cls === 'marksman' && masteryLevel('marksman') >= CONFIG.mastery.skillLevel ? CONFIG.mastery.marksmanFocusPierce : 0),
    bounces: l.ricochet * M.ricochet.bounces, noise: w.noise * (1 - l.suppressor * M.suppressor.noise), jitter: focus ? 0 : w.jitter,
    mag: mutator('magazine') && !w.ammo ? Math.max(1, Math.round(w.shotsPerSecond * CONFIG.mutators.magazine.seconds)) : 0
  });
}
function gearStats() {
  const l = game.player.levels, g = CONFIG.gear;
  return { reduction: l.helmet * g.helmet.reduction, maxShield: l.shield * g.shield.capacity, speed: 1 + l.boots * g.boots.speed + (classInfo().speed ?? 0) + perk('sprinter') * P.sprinter.speed };
}
function itemCost(item, level) {
  return item.goldStep === undefined ? { gold: item.gold, scrap: item.scrap } : { gold: item.gold + level * item.goldStep, scrap: item.scrap + level * item.scrapStep };
}
// Description variables for each shop entry; auto weapons describe the next level (or the current one at max).
function itemVars(group, key, item, level) {
  const pct = n => Math.round(n * 100);
  if (group === 'upgrade') return { pct: pct(CONFIG.gun[`${key}Step`] ?? 0) };
  if (group === 'gear') return { pct: pct(item.reduction ?? item.speed ?? 0), hp: item.hp, cap: item.capacity, delay: CONFIG.player.shieldRegenDelay, heal: item.heal };
  if (group === 'mods') return { noise: pct(item.noise ?? 0), reveal: pct(item.reveal ?? 0), count: item.bounces ?? item.pierce };
  if (group === 'throw') return { seconds: item.seconds ?? item.fuse, radius: item.radius ?? item.blast, damage: item.damage && Math.round(item.damage * waveScale()), noise: item.noise, carry: CONFIG.throwables.carry };
  if (group === 'auto') {
    const i = Math.min(level, item.max - 1);
    return { damage: item.damage[i], rate: item.rate?.[i], count: item.count?.[i], interval: item.interval?.[i], chains: item.chains?.[i], range: item.range };
  }
  const s = gunStats(key);
  return { damage: s.damage, rate: s.shotsPerSecond.toFixed(1), pellets: s.pellets, range: s.range, ammo: s.ammo, blast: s.blast };
}
const SHOP_TABS = { guns: CONFIG.weapons, upgrade: CONFIG.upgrades, mods: CONFIG.mods, auto: CONFIG.autoWeapons, gear: CONFIG.gear, throw: CONFIG.throwables.items };
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
// Level-less entries (guns, throwables, medkit) price at level 0; `full` = maxed level, full HP (medkit) or full carry (throwables).
function shopState(group, key, item) {
  const p = game.player, level = group === 'guns' || group === 'throw' ? 0 : p.levels[key];
  const full = group === 'throw' ? p.items[key] >= CONFIG.throwables.carry : item.consumable ? p.hp >= p.maxHp : group !== 'guns' && level >= item.max;
  return { level, cost: itemCost(item, level), full, banned: group === 'guns' && key !== 'rifle' && mutator('rifleOnly') };
}
function purchase(group, key, item) {
  const p = game.player;
  if (game.mode !== 'shop') return;
  if (group === 'guns' && p.owned.has(key)) { equip(key); renderShop(); return; }
  const { cost, full, banned } = shopState(group, key, item);
  if (banned || full || p.gold < cost.gold || p.scrap < cost.scrap) return;
  p.gold -= cost.gold; p.scrap -= cost.scrap;
  if (group === 'guns') { p.owned.add(key); equip(key); }
  else if (group === 'throw') { p.items[key]++; p.throwKind = key; notify(t('toast.stocked', { name: t(`throw.${key}.title`), count: p.items[key] })); }
  else if (key === 'medkit') { p.hp = Math.min(p.maxHp, p.hp + item.heal); notify(t('toast.healed', { name: t('gear.medkit.title') })); }
  else grantLevel(group, key, item);
  burst(p.x, p.y, '#e9e597', 17); sound.play('buy');
  updateHUD(); renderShop();
}
// One level of an upgrade, mod or gear (armory purchase or black-market discount).
function grantLevel(group, key, item) {
  const p = game.player;
  p.levels[key]++;
  if (key === 'vest') { p.maxHp += item.hp; p.hp += item.hp; }
  if (key === 'shield') { p.shield = gearStats().maxShield; p.shieldBroken = false; }
  notify(t('toast.upgraded', { name: t(`${group}.${key}.title`), level: p.levels[key] }));
}
function shopRow(group, key, item) {
  const p = game.player, gun = group === 'guns', { level, cost, full, banned } = shopState(group, key, item), owned = gun && p.owned.has(key);
  const row = document.createElement('div'); row.className = 'upgrade';
  const info = document.createElement('div');
  const tag = gun ? (p.weapon === key ? t('shop.equipped') : owned ? t('shop.owned') : t('shop.gun')) : group === 'throw' ? `×${p.items[key]}/${CONFIG.throwables.carry}` : item.consumable ? t('shop.consumable') : `LV. ${level}/${item.max}`;
  const vars = itemVars(group, key, item, level);
  const next = group === 'auto' && level > 0 && level < item.max ? t('shop.nextLevel') : '';
  info.innerHTML = `<div class="upgrade-title"><span class="upgrade-icon">${item.icon}</span>${t(`${group}.${key}.title`)} <small>${tag}</small></div><p>${next}${t(`${group}.${key}.desc`, vars)}${gun ? `<br>${t('shop.gunStats', vars)}` : ''}</p>`;
  const button = document.createElement('button'); button.className = 'buy-btn';
  if (owned) { button.textContent = p.weapon === key ? t('shop.inUse') : t('shop.switch'); button.disabled = p.weapon === key; }
  else {
    button.textContent = banned ? t('shop.banned') : full ? (item.consumable ? t('shop.hpFull') : t('shop.maxed')) : cost.scrap ? t('shop.cost', cost) : t('shop.costGold', cost);
    button.disabled = banned || full || p.gold < cost.gold || p.scrap < cost.scrap;
  }
  button.addEventListener('click', () => purchase(group, key, item));
  row.append(info, button); return row;
}
function renderShop() {
  const p = game.player;
  $('shopGold').textContent = p.gold; $('shopScrap').textContent = p.scrap;
  for (const tab of document.querySelectorAll('[data-shop-tab]')) tab.setAttribute('aria-selected', tab.dataset.shopTab === game.shopTab);
  if (game.shopTab === 'builds') {
    const rule = document.createElement('p'); rule.className = 'build-rule'; rule.textContent = t('builds.unlockRule');
    const recipes = Object.keys(CONFIG.builds.recipes).map(key => {
      const row = document.createElement('div'); row.className = 'upgrade evolution-recipe';
      row.innerHTML = `<div><div class="upgrade-title">${CONFIG.weapons[key].icon} ${t(`guns.${key}.title`)}</div><p>${buildShopText(key)}</p></div>`;
      return row;
    });
    $('shopItems').replaceChildren(rule, ...recipes); return;
  }
  $('shopItems').replaceChildren(...Object.entries(SHOP_TABS[game.shopTab]).map(([key, item]) => shopRow(game.shopTab, key, item)));
}
// Reset per-run evolutions and the one-time wave-interest guard after the player is created.
function buildReset() {
  game.builds = new Set(); game.buildInterestWave = null;
  game.perkRerolls = 0; game.perkBans = new Set(); game.perkBanishing = false; game.perkOfferSize = 0;
  if (game.player) game.player.buildState = { smgShots: 0, smgLastShot: -Infinity, rifleLastShot: game.time };
}
function buildRecipeState(key) {
  const recipe = CONFIG.builds.recipes[key], p = game.player;
  if (!recipe || !p) return { met: 0, total: 0, ready: false };
  let met = Number(p.owned.has(key)), total = 1;
  for (const kind of ['upgrades', 'mods', 'perks']) for (const [name, level] of Object.entries(recipe[kind] ?? {})) {
    const have = kind === 'perks' ? perk(name) : p.levels[name] ?? 0;
    met += Number(have >= level); total++;
  }
  return { met, total, ready: met === total };
}
function buildAvailable(key) { return !game.builds?.has(key) && buildRecipeState(key).ready; }
function buildUnlocked(key) { return !!game.builds?.has(key); }
function buildEquipped(key = game.player?.weapon) { return !!game.player && game.player.weapon === key && buildUnlocked(key); }
function buildGunStats(key, stats) {
  if (!buildUnlocked(key)) return stats;
  const E = CONFIG.builds.effects[key];
  if (key === 'crossbow') stats.pierce += E.extraPierce;
  else if (key === 'rail') { stats.pierce = Infinity; stats.shieldBreak = E.shieldBreak; }
  else if (key === 'smg' && buildEquipped(key)) {
    const state = game.player.buildState ??= { smgShots: 0, smgLastShot: -Infinity, rifleLastShot: game.time };
    if (game.time - state.smgLastShot > E.rampWindow) state.smgShots = 0;
    stats.shotsPerSecond *= 1 + Math.min(state.smgShots, E.rampMax) * E.rampStep;
  }
  return stats;
}
// Called once per accepted trigger pull, after shot construction; SMG ramp is bounded and resets after a pause.
function buildOnShot(key) {
  if (!game.player) return;
  const p = game.player;
  if (key === 'smg' && buildEquipped(key)) {
    const E = CONFIG.builds.effects.smg, state = p.buildState ??= { smgShots: 0, smgLastShot: -Infinity, rifleLastShot: game.time };
    if (game.time - state.smgLastShot > E.rampWindow) state.smgShots = 0;
    state.smgShots = Math.min(E.rampMax, state.smgShots + 1); state.smgLastShot = game.time;
  } else if (key === 'rifle' && buildEquipped(key)) {
    (p.buildState ??= { smgShots: 0, smgLastShot: -Infinity, rifleLastShot: game.time }).rifleLastShot = game.time;
  }
}
// Modify an accepted shot's bullets; rifle charge is based on time since the last rifle shot.
function buildShot(key, bullet) {
  if (!bullet || !buildEquipped(key)) return bullet;
  bullet.buildEvolution = key;
  if (key === 'rail') { bullet.pierce = Infinity; bullet.hits ??= new Set(); bullet.shieldBreak = CONFIG.builds.effects.rail.shieldBreak; }
  else if (key === 'launcher') { bullet.cluster = true; bullet.clusterDepth = 0; }
  else if (key === 'rifle') {
    const E = CONFIG.builds.effects.rifle, state = game.player.buildState ??= { smgShots: 0, smgLastShot: -Infinity, rifleLastShot: game.time };
    const charge = clamp((game.time - state.rifleLastShot) / E.chargeSeconds, 0, 1);
    bullet.damage = Math.round(bullet.damage * (1 + E.chargeDamage * charge));
    if (charge >= 1) bullet.color = '#f2d782';
    bullet.charge = charge;
  }
  return bullet;
}
// Shotgun fragments occur only on its first ricochet; fragments have no evolution marker and cannot recursively split.
function buildBulletBounce(bullet) {
  if (!bullet || bullet.buildEvolution !== 'shotgun' || bullet.buildFragmentsDone) return [];
  bullet.buildFragmentsDone = true;
  const E = CONFIG.builds.effects.shotgun, angle = Math.atan2(bullet.vy, bullet.vx), speed = Math.hypot(bullet.vx, bullet.vy), range = Math.max(0, bullet.range - bullet.traveled), fragments = [];
  for (let i = 0; i < E.fragments; i++) {
    const a = angle + (i - (E.fragments - 1) / 2) * E.fragmentSpread;
    fragments.push({
      x: bullet.x, y: bullet.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, traveled: 0, range,
      damage: Math.round(bullet.damage * E.fragmentDamage), radius: bullet.radius, friendly: true, pierce: 0,
      hits: null, bounces: 0, color: bullet.color, trail: false, source: bullet.source, ambush: bullet.ambush,
      bolt: false, blast: 0
    });
  }
  return fragments;
}
// Launcher cluster children are real projectiles but have a hard generation ceiling from CONFIG.
function buildExplosion(x, y, damage, options = {}) {
  const E = CONFIG.builds.effects.launcher, depth = options.clusterDepth ?? 0;
  if (options.source !== 'launcher' || !options.cluster || depth >= E.maxGenerations) return [];
  const count = E.fragments, angle = options.angle ?? 0, fragmentDamage = Math.round(damage * E.fragmentDamage);
  const blast = Math.round((options.blast ?? CONFIG.weapons.launcher.blast) * E.fragmentBlast), fragments = [];
  for (let i = 0; i < count; i++) {
    const a = angle + i * Math.PI * 2 / count;
    fragments.push({
      x, y, vx: Math.cos(a) * E.fragmentSpeed, vy: Math.sin(a) * E.fragmentSpeed, traveled: 0, range: E.fragmentRange,
      damage: fragmentDamage, radius: CONFIG.gun.bulletRadius, friendly: true, pierce: 0, hits: null, bounces: 0,
      color: CONFIG.weapons.launcher.color, trail: true, source: 'launcher', ambush: !!options.ambush, bolt: false,
      blast, cluster: true, clusterDepth: depth + 1
    });
  }
  return fragments;
}
// Bosses/captains and operation-elite kills unlock exactly one eligible evolution via the seeded perk stream.
function buildOnKill(enemy, ambush, source) {
  if (!enemy || !game.player) return;
  const p = game.player; game.builds ??= new Set();
  if (source === 'crossbow' && ambush && buildUnlocked('crossbow')) p.bolts = Math.min(CONFIG.weapons.crossbow.ammo, p.bolts + CONFIG.builds.effects.crossbow.ambushRefund);
  const eliteReward = game.operation?.type === 'elite' && enemy.affix && !enemy.noLoot;
  if (!CONFIG.enemies[enemy.kind]?.boss && !enemy.captain && !eliteReward) return;
  const eligible = Object.keys(CONFIG.builds.recipes).filter(buildAvailable);
  if (!eligible.length) return;
  const key = eligible[Math.floor(game.rng.perks() * eligible.length)];
  game.builds.add(key);
  if (key === 'rifle') (p.buildState ??= { smgShots: 0, smgLastShot: -Infinity, rifleLastShot: game.time }).rifleLastShot = game.time;
  notify(t('builds.unlocked', { name: t(`builds.${key}.title`) })); updateHUD();
}
// Once per cleared wave, normal runs earn 5 gold per 50 held (up to 25); rerolls never invoke this hook.
function buildWaveClear() {
  const p = game.player;
  if (game.training || !p || game.buildInterestWave === game.wave) return 0;
  game.buildInterestWave = game.wave;
  const I = CONFIG.builds.interest, gold = Math.min(I.maxGold, Math.floor(p.gold / I.goldPer) * I.goldAward);
  if (gold) { p.gold += gold; notify(t('builds.interest', { gold })); updateHUD(); }
  return gold;
}
function buildRecipeVars(key) {
  const R = CONFIG.builds.recipes[key];
  return {
    damage: R.upgrades?.damage, range: R.upgrades?.range, rate: R.upgrades?.rate, spread: R.upgrades?.spread,
    piercing: R.mods?.piercing, ricochet: R.mods?.ricochet,
    trigger: t('perk.trigger.title'), triggerLevel: R.perks?.trigger,
    ambush: t('perk.ambush.title'), ambushLevel: R.perks?.ambush,
    volatile: t('perk.volatile.title'), volatileLevel: R.perks?.volatile
  };
}
function buildEffectVars(key) {
  const E = CONFIG.builds.effects[key];
  return {
    seconds: E.chargeSeconds, damage: Math.round(((E.chargeDamage ?? E.fragmentDamage) ?? 0) * 100),
    window: E.rampWindow, step: Math.round((E.rampStep ?? 0) * 100), cap: Math.round((E.rampStep ?? 0) * (E.rampMax ?? 0) * 100),
    count: E.fragments, blast: Math.round((E.fragmentBlast ?? 0) * 100), generations: E.maxGenerations,
    pierce: E.extraPierce, refund: E.ambushRefund
  };
}
function buildShopText(key) {
  const state = buildRecipeState(key);
  if (!state.total) return '';
  const status = t(buildUnlocked(key) ? (game.player.weapon === key ? 'builds.status.equipped' : 'builds.status.evolved') : state.ready ? 'builds.status.ready' : 'builds.status.locked');
  return `${t('builds.shopLine', { name: t(`builds.${key}.title`), status, progress: `${state.met}/${state.total}` })}<br>${t(`builds.recipe.${key}`, buildRecipeVars(key))}<br>${t(`builds.effect.${key}`, buildEffectVars(key))}`;
}
function buildHudText() {
  const p = game.player;
  if (!p) return '';
  const key = p.weapon, name = t(`builds.${key}.title`);
  if (buildUnlocked(key)) return ` · ${t('builds.hudEquipped', { name })}`;
  const state = buildRecipeState(key);
  return ` · ${t('builds.hudProgress', { name, progress: `${state.met}/${state.total}` })}`;
}
function toggleShop() {
  if (game.mode === 'playing') { game.mode = 'shop'; game.mouse.down = false; renderShop(); UI.shop.hidden = false; sound.music('duck'); }
  else if (game.mode === 'shop') { game.mode = 'playing'; UI.shop.hidden = true; game.keys.clear(); sound.music('play'); }
}
// A perk is available below max stacks, when its unlock is earned and every non-banished prerequisite is maxed.
const perkAvailable = (key, v = P[key]) => !!v && perk(key) < v.max && !game.perkBans?.has(key) &&
  (!v.unlock || (!game.daily && unlocked(v.unlock))) &&
  (!v.needs || v.needs.every(n => !!P[n] && !game.perkBans?.has(n) && perk(n) >= P[n].max));
function drawPerkOffer(size, excluded = null) {
  const C = CONFIG.perks, random = game.rng.perks, open = Object.entries(P).filter(([key, v]) => perkAvailable(key, v) && !excluded?.has(key)), offer = [];
  const pool = open.filter(([, v]) => v.rarity !== 'cursed').map(([key, v]) => [key, C.rarity[v.rarity]]), curses = open.filter(([, v]) => v.rarity === 'cursed');
  while (offer.length < size && pool.length) { const key = pickWeighted(random, pool); offer.push(key); pool.splice(pool.findIndex(([k]) => k === key), 1); }
  if (curses.length && !game.daily && game.wave >= C.curseFrom && random() < C.curseChance) offer[Math.min(offer.length, size - 1)] = curses[Math.floor(random() * curses.length)][0];
  return offer;
}
// Perk offers and rerolls use only the seeded perks stream; a reroll avoids the current cards whenever alternatives exist.
function offerPerks() {
  const C = CONFIG.perks;
  game.perkBans ??= new Set(); game.perkRerolls ??= 0; game.perkBanishing = false;
  game.perkOfferSize = Math.max(1, C.offer + game.perkBonus); game.perkBonus = 0;
  const offer = drawPerkOffer(game.perkOfferSize);
  if (!offer.length) { game.perkOffer = null; return false; }
  game.perkOffer = offer; openChoice('perk'); return true;
}
function perkRerollCost() { return CONFIG.perks.actions.rerollScrap + (game.perkRerolls ?? 0) * CONFIG.perks.actions.rerollStep; }
function canRerollPerks() {
  if (game.mode !== 'perk' || !game.perkOffer?.length || game.player.scrap < perkRerollCost()) return false;
  const current = new Set(game.perkOffer);
  return Object.keys(P).some(key => perkAvailable(key) && !current.has(key));
}
function rerollPerks() {
  if (!canRerollPerks()) return;
  const cost = perkRerollCost(), offer = drawPerkOffer(game.perkOfferSize, new Set(game.perkOffer));
  if (!offer.length) return;
  game.player.scrap -= cost; game.perkRerolls = (game.perkRerolls ?? 0) + 1;
  game.perkOffer = offer; game.perkBanishing = false; sound.play('buy'); updateHUD(); renderChoice();
}
function armPerkBanish() {
  if (game.mode !== 'perk' || (game.perkBans?.size ?? 0) >= CONFIG.perks.actions.banishMax) return;
  game.perkBanishing = !game.perkBanishing; renderChoice();
}
function banishPerk(index) {
  if (game.mode !== 'perk' || !game.perkBanishing || (game.perkBans?.size ?? 0) >= CONFIG.perks.actions.banishMax) return;
  const key = game.perkOffer?.[index];
  if (!key) return;
  game.perkBans ??= new Set(); game.perkBans.add(key); game.perkOffer.splice(index, 1); game.perkBanishing = false;
  sound.play('buy'); notify(t('perk.action.banished', { name: t(`perk.${key}.title`), count: game.perkBans.size, max: CONFIG.perks.actions.banishMax }));
  renderChoice();
}
function renderPerkControls() {
  $('perkActions')?.remove();
  if (game.mode !== 'perk') { game.perkBanishing = false; return; }
  game.perkBans ??= new Set();
  const A = CONFIG.perks.actions, row = document.createElement('div'); row.id = 'perkActions'; row.className = 'menu-pair perk-actions';
  const button = (label, disabled, action) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'secondary-btn';
    el.textContent = label; el.disabled = disabled; el.addEventListener('click', action); row.append(el); return el;
  };
  const reroll = button(t('perk.action.reroll', { cost: perkRerollCost() }), !canRerollPerks(), rerollPerks);
  reroll.setAttribute('aria-keyshortcuts', 'R');
  const banish = button(t(game.perkBanishing ? 'perk.action.cancelBanish' : 'perk.action.banish', { used: game.perkBans.size, max: A.banishMax }), !game.perkBanishing && game.perkBans.size >= A.banishMax, armPerkBanish);
  banish.setAttribute('aria-keyshortcuts', 'X');
  const skip = button(t('perk.action.skip', { gold: A.skipGold }), false, skipPerks);
  skip.setAttribute('aria-keyshortcuts', 'S');
  $('perkChoices').insertAdjacentElement('afterend', row);
  if (game.perkBanishing) $('perkHint').textContent += ` · ${t('perk.action.selectCard')}`;
}
function skipPerks() {
  if (game.mode !== 'perk') return;
  const p = game.player; p.gold += CONFIG.perks.actions.skipGold;
  game.perkOffer = null; game.perkBanishing = false; sound.play('buy'); notify(t('perk.action.skipped', { gold: CONFIG.perks.actions.skipGold })); updateHUD();
  if (!offerRoute()) resume();
}
function openChoice(mode) {
  game.mode = mode; game.mouse.down = false; game.keys.clear();
  renderChoice(); UI.perk.hidden = false; sound.music('duck');
}
function perkVars(key) {
  const v = P[key], pct = n => Math.round((n ?? 0) * 100);
  return { pct: pct(key === 'hunterFocus' ? v.damage : key === 'secondWind' ? v.hp : v.bonus ?? v.chance ?? v.scrap ?? v.gold ?? v.rate ?? v.pickup), heal: v.heal, hp: v.hp, seconds: v.seconds, regen: v.regen, takedown: pct(v.takedown), chance: pct(v.chance), scrap: pct(v.scrap), gold: pct(v.gold), damage: pct(v.damage), hpCut: pct(v.hpCut), taken: pct(v.taken), reveal: pct(v.reveal), count: v.takedowns, speed: pct(v.speed), drain: v.drain };
}
function routeVars(key) {
  const r = CONFIG.routes.list[key], pct = n => Math.round((n ?? 0) * 100);
  return { gold: pct(r.gold), elite: pct(r.elite), count: pct(r.count), scrap: pct(r.scrap), hp: pct(r.hp), vision: r.vision, throwables: r.throwables, sight: pct(r.sight), cards: r.perkCards, seconds: r.blitz?.seconds };
}
// The choice overlay hosts the extraction pick (after a boss wave), the perk pick, the route pick and the black market.
const CHOICE_MODES = ['extract', 'perk', 'route', 'market'];
// Cards for the open choice: icon, optional rarity frame, title, note line, description and whether it can be picked.
function choiceCards() {
  const pct = n => Math.round((n ?? 0) * 100), p = game.player;
  if (game.mode === 'extract') {
    const bonus = extractionBonus();
    return [
      { icon: '⚔', title: t('extract.stay.title'), note: t('route.next', { wave: game.wave + 1 }), text: t('extract.stay.desc') },
      { icon: '⇱', rarity: 'legendary', title: t('extract.leave.title'), note: t('extract.leave.note', { score: Math.round(game.score * (1 + bonus)).toLocaleString(locale) }), text: bonus ? t('extract.leave.desc', { pct: pct(bonus) }) : t('extract.leave.penalty') }
    ];
  }
  if (game.mode === 'perk') return game.perkOffer.map(key => ({ icon: P[key].icon, rarity: P[key].rarity, title: t(`perk.${key}.title`), note: `${t(`rarity.${P[key].rarity}`)} · ${t('perk.stack', { level: perk(key) + 1, max: P[key].max })}`, text: t(`perk.${key}.desc`, perkVars(key)) }));
  if (game.mode === 'route') return operationCards();
  const G = CONFIG.market.goods;
  return game.merchant.offers.map(offer => {
    const cost = offerCost(offer);
    let card;
    if (offer.kind === 'perk') card = { icon: P[offer.key].icon, rarity: P[offer.key].rarity, title: t(`perk.${offer.key}.title`), text: t(`perk.${offer.key}.desc`, perkVars(offer.key)) };
    else if (offer.kind === 'discount') {
      const item = SHOP_TABS[offer.group][offer.key], level = Math.min(p.levels[offer.key], item.max - 1);
      card = { icon: item.icon, title: t(`${offer.group}.${offer.key}.title`), text: `${t('market.discount.desc', { level: level + 1, pct: pct(1 - G.discount.cut) })}${t(`${offer.group}.${offer.key}.desc`, itemVars(offer.group, offer.key, item, level))}` };
    } else card = { icon: G[offer.kind].icon, title: t(`market.${offer.kind}.title`), text: t(`market.${offer.kind}.desc`, { carry: CONFIG.throwables.carry, ammo: CONFIG.weapons.crossbow.ammo, give: G.exchange.give }) };
    const note = offer.sold ? t('market.sold') : !cost ? t('shop.maxed') : cost.scrap ? t('shop.cost', cost) : t('shop.costGold', cost);
    return { ...card, note, disabled: !cost || p.gold < cost.gold || p.scrap < cost.scrap };
  });
}
function renderChoice() {
  const mode = game.mode, cards = choiceCards(), p = game.player;
  $('perkWave').textContent = String(game.wave).padStart(2, '0');
  $('perkLabel').textContent = t(`${mode}.eyebrow`);
  $('perkHeading').textContent = t(`${mode}.heading`);
  const chapter = mode === 'extract' && game.stats.chapters.at(-1), closed = chapter && chapter.index === Math.ceil(game.wave / CONFIG.chapters.length) && game.wave % CONFIG.chapters.length === 0;
  $('perkHint').textContent = t(`${mode}.hint`, { count: cards.length, gold: p.gold, scrap: p.scrap }) + (closed ? ` · ${t('end.chapter', { index: chapter.index })} ${CONFIG.chapters.grades[chapter.grade]}${chapter.badges.map(key => CONFIG.badges[key].icon).join('')}` : '');
  $('perkClose').hidden = mode !== 'market';
  $('perkChoices').replaceChildren(...cards.map((card, i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = card.rarity ? `perk-card rarity-${card.rarity}` : 'perk-card'; button.disabled = !!card.disabled;
    button.innerHTML = `<span class="keycap">${i + 1}</span><span class="perk-icon">${card.icon}</span><b>${card.title}</b><small>${card.note}</small><span>${card.text}</span>`;
    button.addEventListener('click', () => choose(i));
    return button;
  }));
  renderOperationMap();
  renderPerkControls();
}
function choose(index) { ({ extract: chooseExtract, perk: choosePerk, route: chooseRoute, market: buyOffer })[game.mode]?.(index); }
// Card 1 keeps fighting (then the usual perk and route picks); card 2 extracts and ends the run as a success.
function chooseExtract(index) {
  if (game.mode !== 'extract' || index > 1) return;
  if (index === 1) { finishRun(true); return; }
  sound.play('buy');
  if (!offerPerks() && !offerRoute()) resume();
}
// One perk stack (perk pick or black-market purchase), applying its immediate HP effects.
function grantPerk(key) {
  const p = game.player;
  game.perks[key] = perk(key) + 1; game.stats.perks.push(key); markIntel('perks', key);
  if (key === 'tough') { p.maxHp += P.tough.hp; p.hp += P.tough.hp; }
  if (key === 'glassCannon' || key === 'sprinter') { p.maxHp = Math.max(1, Math.round(p.maxHp * (1 - P[key].hpCut))); p.hp = Math.min(p.hp, p.maxHp); }
  if (key === 'shadeCircuit') p.shadeCircuitProgress = 0;
  if (key === 'hunterFocus') { p.hunterFocusIdle = 0; p.hunterFocusReady = false; }
  burst(p.x, p.y, '#e9e597', 17); notify(t('toast.perk', { name: t(`perk.${key}.title`) })); updateHUD();
}
function choosePerk(index) {
  const key = game.perkOffer?.[index];
  if (game.mode !== 'perk' || !key) return;
  if (game.perkBanishing) { banishPerk(index); return; }
  if (!perkAvailable(key)) { game.perkOffer.splice(index, 1); renderChoice(); return; }
  game.perkOffer = null; grantPerk(key); sound.play('buy');
  if (!offerRoute()) resume();
}
// The chapter map replaces isolated next-wave route rolls with visible, connected operation nodes.
function offerRoute() {
  if (game.training || game.wave >= CONFIG.finale.wave) return false;
  return offerOperation(game.wave + 1);
}
function chooseRoute(index) {
  const node = game.operationOffer?.[index];
  if (game.mode !== 'route' || !node) return;
  game.operationPlan.selected[game.operationChoosingWave] = node;
  game.nextOperation = node; game.operationLane = node.lane;
  game.nextRoute = node.route;
  const first = game.operationChoosingWave === game.wave;
  resume();
  if (first) startWave();
}
function operationPlan(wave) {
  const length = CONFIG.chapters.length, chapter = Math.ceil(wave / length);
  if (game.operationPlan?.chapter === chapter) return game.operationPlan;
  const random = seededRandom(`${game.seed}:operations:${chapter}`), start = (chapter - 1) * length + 1;
  const rows = Array.from({ length }, (_, row) => {
    const next = start + row, boss = isBossWave(next);
    return Array.from({ length: boss || next <= CONFIG.routes.from ? 1 : CONFIG.operations.lanes }, (_, lane) => {
      const type = boss ? 'boss' : next === 1 ? 'eliminate' : next === 2 ? 'infiltrate' : CONFIG.operations.types[(Math.floor(random() * CONFIG.operations.types.length) + lane) % CONFIG.operations.types.length];
      const routes = Object.keys(CONFIG.routes.list), route = next > CONFIG.routes.from && type !== 'boss' && type !== 'supply' ? routes[Math.floor(random() * routes.length)] : 'calm';
      return { wave: next, lane, type, route };
    });
  });
  game.operationLane = null;
  return game.operationPlan = { chapter, start, rows, selected: {} };
}
function offerOperation(wave) {
  const plan = operationPlan(wave), row = plan.rows[wave - plan.start];
  game.operationChoosingWave = wave;
  const previous = plan.rows[wave - plan.start - 1];
  game.operationOffer = row.filter(node => row.length === 1 || previous?.length === 1 || game.operationLane === null || Math.abs(node.lane - game.operationLane) <= 1);
  openChoice('route'); return true;
}
function operationCards() {
  return game.operationOffer.map(node => ({
    icon: CONFIG.operations.icons[node.type], title: t(`operation.${node.type}`),
    note: t('route.next', { wave: node.wave }),
    text: t(`operation.${node.type}.desc`, { heal: CONFIG.operations.supplyHeal }) + (node.route && node.route !== 'calm' ? ` · ${t(`route.${node.route}.title`)}: ${t(`route.${node.route}.desc`, routeVars(node.route))}` : '')
  }));
}
function renderOperationMap() {
  let map = $('operationMap');
  if (!map) { map = document.createElement('div'); map.id = 'operationMap'; $('perkChoices').before(map); }
  map.hidden = game.mode !== 'route';
  if (map.hidden) return;
  $('perkHeading').textContent = t('operation.heading', { chapter: game.operationPlan.chapter });
  $('perkHint').textContent = t('operation.hint');
  map.replaceChildren(...game.operationPlan.rows.map(row => {
    const column = document.createElement('div'); column.className = 'operation-column';
    const heading = document.createElement('strong'); heading.textContent = t('route.next', { wave: row[0].wave }); column.append(heading);
    for (const node of row) {
      const item = document.createElement('span');
      item.textContent = `${CONFIG.operations.icons[node.type]} ${t(`operation.${node.type}`)}`;
      item.className = game.operationPlan.selected[node.wave] === node ? 'selected' : node.wave === game.operationChoosingWave && game.operationOffer.includes(node) ? 'available' : '';
      item.title = t(`operation.${node.type}.desc`, { heal: CONFIG.operations.supplyHeal }) + (node.route && node.route !== 'calm' ? ` · ${t(`route.${node.route}.title`)}: ${t(`route.${node.route}.desc`, routeVars(node.route))}` : '');
      column.append(item);
    }
    return column;
  }));
}
function beginOperation() {
  if (game.training) return;
  game.operation = game.nextOperation ?? { type: isBossWave() ? 'boss' : 'eliminate', wave: game.wave };
  game.nextOperation = null;
  game.operationAlarm = false; game.supplyReady = game.operation.type !== 'supply';
  if (game.operation.type === 'supply') {
    game.waveRemaining = game.waveTotal = 0; game.reinforceAt = Infinity;
    game.event = null; game.challenge = null;
    game.bullets = []; game.bombs = []; game.pools = []; game.flares = []; game.missiles = []; game.gadgets = []; game.throws = [];
    for (const bush of game.bushes) { bush.fire = 0; bush.fireSpread = 0; }
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + CONFIG.operations.supplyHeal);
    rollMarket(true);
    if (game.merchant) openChoice('market'); else game.supplyReady = true;
  } else if (game.operation.type === 'infiltrate') {
    game.event = { type: 'intel', started: false, done: false };
  }
}
function operationAlarm() {
  if (!harsh() || game.operation?.type !== 'infiltrate' || game.operationAlarm || game.nextWave) return;
  game.operationAlarm = true;
  game.waveRemaining += CONFIG.operations.alarmReinforcements;
  game.waveTotal += CONFIG.operations.alarmReinforcements;
}
function changeChapterBattlefield() {
  if (game.training || game.wave <= 1 || (game.wave - 1) % CONFIG.chapters.length) return;
  const chapter = Math.ceil(game.wave / CONFIG.chapters.length), random = seededRandom(`${game.seed}:battlefield:${chapter}`);
  const w = CONFIG.world;
  game.variant = CONFIG.operations.weather[(chapter - 1) % CONFIG.operations.weather.length];
  // Preserve stone walls and water: the learned map stays useful; only wooden cover is rebuilt.
  game.walls = game.walls.filter(wall => !wall.wood);
  game.bullets = []; game.bombs = []; game.pools = []; game.flares = []; game.missiles = [];
  game.gadgets = []; game.throws = []; game.event = null; game.loot = []; game.chests = [];
  game.player.x = worldCenter.x; game.player.y = worldCenter.y;
  for (const bush of game.bushes) {
    if (!mutator('scorchedEarth')) bush.burned = 0;
    bush.fire = 0; bush.fireSpread = 0;
  }
  for (let i = 0; i < w.woodWalls; i++) {
    for (let attempt = 0; attempt < w.placementAttempts; attempt++) {
      const width = between(random, ...w.wallWidth), height = between(random, ...w.wallHeight);
      const wall = { x: between(random, w.placementMargin, w.width - width - w.placementMargin), y: between(random, w.placementMargin, w.height - height - w.placementMargin), w: width, h: height, wood: true, hp: w.woodHp, maxHp: w.woodHp, hit: 0 };
      if (distance(rectCenter(wall), worldCenter) < w.spawnClearance || [...game.walls, ...game.ponds, ...game.bushes, ...game.barrels.map(b => ({ x: b.x - b.radius, y: b.y - b.radius, w: b.radius * 2, h: b.radius * 2 }))].some(r => overlap(wall, r, w.terrainGap)) || !connected([...game.walls, wall])) continue;
      game.walls.push(wall); break;
    }
  }
  game.lights = [];
  const L = CONFIG.searchlights;
  for (let i = 0; i < (CONFIG.variants[game.variant].searchlights ?? 0); i++) {
    for (let attempt = 0; attempt < w.placementAttempts; attempt++) {
      const pos = { x: between(random, w.placementMargin, w.width - w.placementMargin), y: between(random, w.placementMargin, w.height - w.placementMargin) };
      if (!passable(pos.x, pos.y, L.radius) || distance(pos, worldCenter) < w.spawnClearance || [...game.bushes, ...game.ponds].some(r => circleRect(pos.x, pos.y, L.radius, r)) || game.lights.some(l => distance(l, pos) < L.spacing)) continue;
      game.lights.push({ ...pos, radius: L.radius, hp: L.hp, hit: 0, alarm: 0, base: Math.atan2(worldCenter.y - pos.y, worldCenter.x - pos.x), phase: random() * Math.PI * 2, light: true }); break;
    }
  }
  for (let i = 0; i < CONFIG.chests.initial; i++) spawnChest();
  stealthResetMap();
}
function resume() {
  if (game.mode === 'market' && game.operation?.type === 'supply') game.supplyReady = true;
  game.mode = 'playing'; UI.perk.hidden = true; sound.music('play'); updateHUD();
}
// Achievement text: goal, cumulative progress (totals or distinct boss kinds), difficulty and start gold.
function achievementVars(a) {
  const metric = TOTAL_KEYS.find(key => a[key]), goal = metric ? a[metric] : a.bossKinds, have = metric ? profile.totals[metric] : profile.bossKinds.length;
  return { wave: a.wave ?? a.quietWaves, count: goal, progress: Math.min(have, goal ?? 0), difficulty: a.difficulty && t(`difficulty.${a.difficulty}`), gold: a.startGold };
}
function classVars(key) {
  const c = CONFIG.classes[key], s = c.skill, pct = n => Math.round((n ?? 0) * 100);
  return { speed: pct(c.speed), scrap: pct(c.scrap), hp: c.hp, range: pct(c.range), healBonus: pct(c.heal), cooldown: s.cooldown, distance: s.distance, max: s.max, seconds: s.seconds, reduction: pct(s.reduction), damage: s.damage, focus: pct(s.damage), heal: s.heal };
}
function mutatorVars(key) {
  const m = CONFIG.mutators[key], pct = n => Math.round((n ?? 0) * 100);
  return { hp: pct(m.enemyHp), taken: m.taken, bushes: pct(m.bushes), vision: m.vision, score: pct(m.score), elite: pct(m.elite), price: pct(m.price), count: pct(m.count), seconds: m.seconds, reload: m.reload };
}
// Picker buttons: aria-pressed marks the selection; `title` carries the description.
function pickerButton(label, pressed, title, onClick, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'tab-btn'; button.textContent = label; button.title = title; button.disabled = disabled;
  button.setAttribute('aria-pressed', pressed); button.addEventListener('click', onClick);
  return button;
}
// Start screen: difficulty, class, skin and mutator pickers (locked entries name their achievement), best record, today's daily and achievements.
function renderMenu() {
  $('progressBtn').textContent = t('menu.progress', { done: profile.achievements.length, total: Object.keys(CONFIG.achievements).length });
  $('progressHeading').textContent = t('menu.progressTitle'); $('achievementsHeading').textContent = t('menu.achievements'); $('codexHeading').textContent = t('menu.codex');
  const today = todayUTC(), record = profile.records[profile.difficulty], daily = profile.daily?.date === today ? profile.daily : null;
  const lockText = entry => t('menu.locked', { name: t(`achievement.${entry.unlock}.title`) });
  $('difficultyPicker').replaceChildren(...Object.entries(CONFIG.difficulty).map(([key, d]) => {
    const open = difficultyOpen(key);
    return pickerButton(t(`difficulty.${key}`), key === profile.difficulty, open ? t(`difficulty.${key}.desc`) : lockText(d), () => { profile.difficulty = key; saveProfile(); renderMenu(); }, !open);
  }));
  const grades = profile.chapters[profile.difficulty] ?? [];
  $('recordLine').textContent = (record ? t('menu.record', { wave: record.wave, kills: record.kills, score: record.score ?? 0 }) + (record.extractWave ? t('menu.recordExtract', { wave: record.extractWave }) : '') : t('menu.noRecord')) + (grades.some(hasGrade) ? t('menu.chapters', { list: chapterGrades(grades) }) : '');
  $('classPicker').replaceChildren(...Object.entries(CONFIG.classes).map(([key, c]) => {
    const open = isOpen(c), level = masteryLevel(key), xp = profile.mastery[key] ?? 0;
    const next = CONFIG.mastery.thresholds[Math.min(level, CONFIG.mastery.maxLevel - 1)], previous = CONFIG.mastery.thresholds[Math.max(0, level - 1)];
    const progress = level >= CONFIG.mastery.maxLevel ? 1 : clamp((xp - previous) / (next - previous), 0, 1);
    const button = pickerButton(`${c.icon} ${t(`class.${key}`)} · LV.${level}`, key === profile.cls, `${t(`class.${key}.desc`, classVars(key))}\n${t('mastery.level', { level, xp, next })}\n${t(`mastery.reward.${key}`, { level: CONFIG.mastery.skillLevel })}`, () => { profile.cls = key; saveProfile(); renderMenu(); }, !open);
    const track = document.createElement('span'), fill = document.createElement('i');
    track.className = 'mastery-track'; track.title = t('mastery.level', { level, xp, next });
    fill.style.width = `${progress * 100}%`; track.append(fill); button.append(track);
    return button;
  }));
  $('classInfo').textContent = t(`class.${profile.cls}.desc`, classVars(profile.cls));
  const skins = Object.keys(CONFIG.skins).filter(skinOpen);
  $('skinBtn').hidden = skins.length < 2; $('skinBtn').textContent = t('menu.skin', { name: t(`skin.${profile.skin}`) });
  $('mutatorPicker').replaceChildren(...Object.entries(CONFIG.mutators).map(([key, m]) => {
    const on = profile.mutators.includes(key), open = isOpen(m), next = on ? profile.mutators.filter(k => k !== key) : [...profile.mutators, key];
    const allowed = open && (on || selectedThreat(next) <= threatCap());
    const desc = !open ? t('threat.locked', { points: m.unlock.threat }) : allowed ? t(`mutator.${key}.desc`, { ...mutatorVars(key), points: m.points, every: CONFIG.threat.bossEvery, pct: mutatorVars(key).price }) : t('threat.cap', { cap: threatCap() });
    return pickerButton(`${m.icon} ${t(`mutator.${key}`)} +${m.points}`, on, desc, () => { if (!allowed) return; profile.mutators = next; saveProfile(); renderMenu(); }, !allowed);
  }));
  const bonus = profile.mutators.reduce((sum, key) => sum + CONFIG.mutators[key].score, 0);
  const saved = profile.threatRecords[`${profile.difficulty}:${profile.cls}`] ?? 0;
  $('mutatorInfo').textContent = `${t('menu.mutatorBonus', { pct: Math.round(bonus * 100) })} · ${t('menu.threat', { points: selectedThreat(profile.mutators), cap: threatCap(), record: saved })}`;
  $('dailyInfo').textContent = t('menu.daily', { date: today, variant: t(`variant.${variantFor(today)}`), mutator: t(`mutator.${dailyMutator(today)}`) }) + (daily ? t('menu.dailyBest', { wave: daily.wave, score: daily.score ?? 0 }) : '') + ` · ${t('menu.streak', { count: profile.streak.count })}`;
  const contracts = weeklyContracts();
  $('weeklyHeading').textContent = t('menu.weekly', { week: profile.weekly.week });
  $('weeklyInfo').replaceChildren(...contracts.map(id => {
    const item = document.createElement('span'), target = CONFIG.weekly.targets[id];
    item.className = profile.weekly.done.includes(id) ? 'contract done' : 'contract';
    item.textContent = `${profile.weekly.done.includes(id) ? '✓' : '○'} ${t(`contract.${id}`, { count: target })} ${Math.min(profile.weekly.progress[id] ?? 0, target)}/${target}`;
    return item;
  }));
  renderCodex(); renderChapters(); renderSeedChallenge();
  $('trainingBtn').textContent = t('menu.training');
  $('trainingHeading').textContent = t('training.heading'); $('trainingInfo').textContent = t('training.info', { xp: CONFIG.training.xp, cap: CONFIG.training.dailyXp, left: Math.max(0, CONFIG.training.dailyXp - (profile.training.day === today ? profile.training.xp : 0)) });
  $('trainingPicker').replaceChildren(...CONFIG.boss.order.map(kind => pickerButton(`${t(`enemy.${kind}`)}`, false, t('training.pick', { name: t(`enemy.${kind}`) }), () => startGame(false, { training: kind }), !profile.intel.bosses.includes(kind))));
  $('achievementList').replaceChildren(...Object.entries(CONFIG.achievements).map(([id, a]) => {
    const chip = document.createElement('span');
    chip.className = unlocked(id) ? 'achievement' : 'achievement locked';
    chip.textContent = `${a.icon} ${t(`achievement.${id}.title`)}`;
    chip.title = `${t(`achievement.${id}.desc`, achievementVars(a))}\n${t(`achievement.${id}.reward`)}`;
    return chip;
  }));
}
function renderCodex() {
  const groups = { enemies: Object.keys(CONFIG.enemies).filter(key => !CONFIG.enemies[key].boss), bosses: Object.keys(CONFIG.enemies).filter(key => CONFIG.enemies[key].boss), perks: Object.keys(CONFIG.perks.list), variants: Object.keys(CONFIG.variants) };
  $('codexInfo').replaceChildren(...Object.entries(groups).flatMap(([group, keys]) => keys.map(key => {
    const entry = document.createElement('span'), seen = profile.intel[group].includes(key);
    entry.className = seen ? 'codex-entry seen' : 'codex-entry';
    const type = group === 'enemies' || group === 'bosses' ? 'enemy' : group === 'perks' ? 'perk' : 'variant';
    entry.textContent = seen ? t(`${type}.${key}${group === 'perks' ? '.title' : ''}`) : t('codex.unknown');
    if (seen && P[key]?.needs) entry.title = P[key].needs.map(need => t(`perk.${need}.title`)).join(' + ');
    return entry;
  })));
}
// Best chapter grades as letters ('–' for chapters never closed; saved arrays hold null in the gaps).
const hasGrade = g => typeof g === 'number' && g >= 0;
const chapterGrades = grades => Array.from({ length: CONFIG.chapters.count }, (_, i) => hasGrade(grades[i]) ? CONFIG.chapters.grades[grades[i]] : '–').join(' ');
function renderChapters() {
  $('chaptersHeading').textContent = t('menu.chaptersTitle');
  const rows = Object.keys(CONFIG.difficulty).map(key => `${t(`difficulty.${key}`)} ${chapterGrades(profile.chapters[key] ?? [])}`);
  const badges = Object.entries(CONFIG.badges).map(([key, b]) => `${b.icon} ${t(`badge.${key}`)} ×${profile.badges[key]}`);
  $('chaptersInfo').replaceChildren(...[...rows, ...badges].map(text => Object.assign(document.createElement('span'), { className: 'contract', textContent: text })));
}
// Weekly seed challenge: this week's seed, difficulty and modifiers, plus the best score of recent weeks.
function renderSeedChallenge() {
  const week = isoWeek(), mutators = seedChallengeMutators(week).map(key => t(`mutator.${key}`)).join('、'), best = profile.seedRuns[week];
  $('seedChallengeBtn').textContent = t('menu.seedChallenge');
  $('seedChallengeBtn').title = t('seed.info', { seed: seedChallengeSeed(week), difficulty: t(`difficulty.${CONFIG.seedChallenge.difficulty}`), list: mutators });
  $('seedHeading').textContent = t('seed.heading', { week });
  const history = Object.entries(profile.seedRuns).sort(([a], [b]) => a.localeCompare(b)).map(([key, r]) => `${key.slice(5)} ${r.score.toLocaleString(locale)}`).join(' · ');
  $('seedInfo').textContent = `${t('seed.info', { seed: seedChallengeSeed(week), difficulty: t(`difficulty.${CONFIG.seedChallenge.difficulty}`), list: mutators })} · ${best ? t('seed.best', { score: best.score.toLocaleString(locale), wave: best.wave, runs: best.runs }) : t('seed.none')}${history ? ` · ${t('seed.history', { list: history })}` : ''}`;
}
function renderNextGoals() {
  const goals = [];
  for (const [id, a] of Object.entries(CONFIG.achievements)) if (!unlocked(id)) {
    const metric = TOTAL_KEYS.find(key => a[key]), target = metric ? a[metric] : a.bossKinds ?? a.wave ?? a.quietWaves ?? 1;
    const bestWave = Math.max(0, ...Object.entries(profile.records).filter(([key]) => key !== 'daily').map(([, r]) => r.wave ?? 0));
    const current = metric ? profile.totals[metric] : a.bossKinds ? profile.bossKinds.length : a.wave && !a.difficulty && !a.cleared ? bestWave : 0;
    goals.push({ label: t(`achievement.${id}.title`), current: Math.min(current, target), target });
  }
  const level = masteryLevel(game.cls), xp = profile.mastery[game.cls], base = CONFIG.mastery.thresholds[level - 1] ?? 0, targetXp = CONFIG.mastery.thresholds[level];
  if (level < CONFIG.mastery.maxLevel) goals.push({ label: t('goal.mastery', { name: t(`class.${game.cls}`), level: level + 1 }), current: xp - base, target: targetXp - base });
  for (const id of weeklyContracts()) if (!profile.weekly.done.includes(id)) goals.push({ label: t(`contract.${id}`, { count: CONFIG.weekly.targets[id] }), current: profile.weekly.progress[id] ?? 0, target: CONFIG.weekly.targets[id] });
  const record = maxThreatRecord(), next = CONFIG.threat.milestones.find(value => value > record) ?? threatCap();
  if (next > record) goals.push({ label: t('goal.threat', { points: next }), current: record, target: next });
  const extracted = profile.records[game.difficulty]?.extractWave ?? 0, extractTarget = extracted + CONFIG.boss.every;
  goals.push({ label: t('goal.extract', { wave: extractTarget }), current: Math.min(game.wave, extractTarget), target: extractTarget });
  $('endGoals').replaceChildren(...goals.filter(goal => goal.current < goal.target).sort((a, b) => b.current / b.target - a.current / a.target).slice(0, 3).map(goal => {
    const row = document.createElement('div'), label = document.createElement('span'), count = document.createElement('span'), bar = document.createElement('i');
    row.className = 'goal'; label.textContent = goal.label; count.textContent = `${goal.current}/${goal.target}`;
    bar.style.width = `${Math.min(100, goal.current / goal.target * 100)}%`; row.append(label, count, bar); return row;
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
  if (CHOICE_MODES.includes(game.mode)) renderChoice();
  if (game.mode === 'ended') renderEnd();
}
// Sidebar objective line for the running event (hold point, marked officer, intel run), else the boss mission, the blitz clock or the
// reinforcement countdown (harsh).
function objectiveText() {
  const ev = game.event;
  if (!ev?.started || ev.done) return missionText();
  if (ev.type === 'intel') return ev.deliveryExpired ? t('hud.intelEliminate') : t('hud.intelChoice', { left: Math.ceil(ev.limit) });
  if (ev.type === 'jammer') return t('hud.jammer', { left: Math.ceil(ev.limit), hp: Math.ceil(100 * ev.crate.hp / ev.crate.maxHp) });
  if (!ev.limit) return '';
  const left = Math.ceil(ev.limit);
  if (ev.type === 'hold') return t('hud.hold', { progress: Math.floor(ev.progress), seconds: CONFIG.events.types.hold.seconds, left });
  if (ev.type === 'assassinate') return t('hud.assassinate', { left });
  return '';
}
function missionText() {
  const m = activeMission(), R = CONFIG.reinforcements, blitz = route().blitz;
  if (m) {
    const cfg = CONFIG.missions.types[m.type];
    if (m.type === 'uplink') return t('hud.uplink', { progress: Math.floor(m.progress), seconds: cfg.seconds });
    if (m.type === 'escort') return t('hud.escort', { hp: Math.ceil(100 * m.agent.hp / m.agent.maxHp) });
    return t('hud.radar', { left: missionDishes().length, count: cfg.count });
  }
  if (game.nextWave) return '';
  if (blitz && game.waveClock <= blitz.seconds) return t('hud.blitz', { left: Math.ceil(blitz.seconds - game.waveClock) });
  const left = game.reinforceAt - game.waveClock;
  if (game.reinforced) return t('hud.reinforcing', { count: game.reinforced, max: R.max });
  return left <= R.warn ? t('hud.reinforce', { left: Math.ceil(left) }) : '';
}
function updateHUD() {
  if (!game.player) return;
  const p = game.player, gun = gunStats(), gear = gearStats(), total = Object.keys(CONFIG.upgrades).reduce((sum, key) => sum + p.levels[key], 0);
  $('hpText').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('hpFill').style.width = `${100 * Math.max(0, p.hp) / p.maxHp}%`;
  $('shieldText').textContent = gear.maxShield ? `${Math.floor(p.shield)} / ${gear.maxShield}` : t('hud.noShield');
  $('shieldFill').style.width = `${gear.maxShield ? 100 * p.shield / gear.maxShield : 0}%`;
  $('waveText').textContent = String(game.wave).padStart(2, '0');
  const tags = [t(game.nextWave ? 'hud.intermission' : 'hud.combat'), !game.daily && threatTotal() > 0 && t('hud.threat', { points: threatTotal() }), game.route && t(`route.${game.route}.title`), game.variant !== 'standard' && t(`variant.${game.variant}`), game.daily ? t('hud.daily') : game.difficulty !== 'normal' && t(`difficulty.${game.difficulty}`)].filter(Boolean);
  if (game.operation) tags.push(t(`operation.${game.operation.type}`));
  $('wavePill').textContent = `WAVE ${String(game.wave).padStart(2, '0')} / ${tags.join(' · ')}`;
  $('killsText').textContent = game.kills; $('goldText').textContent = p.gold; $('scrapText').textContent = p.scrap;
  $('damageStat').textContent = gun.damage; $('rateStat').textContent = `${gun.shotsPerSecond.toFixed(1)}/s`;
  $('spreadStat').textContent = gun.pellets; $('rangeStat').textContent = gun.range;
  $('armorStat').textContent = `${Math.round(gear.reduction * 100)}%`; $('speedStat').textContent = `${Math.round(gear.speed * 100)}%`;
  $('weaponName').textContent = t(`guns.${p.weapon}.title`);
  const mag = gun.mag ? (p.reload > 0 ? t('hud.reloading') : t('hud.mag', { left: p.mag[p.weapon] ?? gun.mag, size: gun.mag })) : '';
  $('weaponTier').textContent = t('hud.weaponTier', { owned: p.owned.size, total: Object.keys(CONFIG.weapons).length, level: total }) + (p.owned.has('crossbow') ? t('hud.bolts', { bolts: p.bolts, max: CONFIG.weapons.crossbow.ammo }) : '') + mag;
  const buildProgress = buildHudText();
  $('weaponTier').textContent += buildProgress;
  $('weaponTier').title = buildProgress;
  const autos = Object.entries(CONFIG.autoWeapons).filter(([key]) => p.levels[key]);
  const heat = perk('purist') ? t('hud.autoOff') : p.overheat > 0 ? t('hud.overheat', { left: p.overheat.toFixed(1) }) : harsh() && autos.length ? t('hud.heat', { pct: Math.round(p.heat / CONFIG.autoHeat.max * 100) }) : '';
  $('autoList').textContent = `${t('hud.auto')}${autos.length ? autos.map(([key, item]) => `${item.icon} ${p.levels[key]}`).join('　') : t('hud.none')}${autos.length ? heat : ''}`;
  $('autoList').title = autos.map(([key]) => `${t(`auto.${key}.title`)} LV. ${p.levels[key]}`).join('\n');
  const perks = Object.entries(P).filter(([key]) => perk(key));
  $('perkList').textContent = `${t('hud.perks')}${perks.length ? perks.map(([key, item]) => `${item.icon} ${perk(key)}${key === 'shadeCircuit' ? ` ${p.shadeCircuitProgress}/${P.shadeCircuit.takedowns}` : ''}${key === 'hunterFocus' && p.hunterFocusReady ? ' ◆' : ''}`).join('　') : t('hud.none')}`;
  $('perkList').title = perks.map(([key]) => `${t(`perk.${key}.title`)} ×${perk(key)}`).join('\n');
  const hidden = isHidden(), inBush = inTerrain(p, game.bushes), holding = inBush && autos.length ? t('hud.autoHold') : '';
  $('stealthText').textContent = (hidden ? t('hud.hidden') : game.event?.carrying ? t('hud.carrying') : litTower(p) ? t('hud.lit') : inBush ? t('hud.revealed') : inTerrain(p, game.ponds) ? t('hud.wading') : t('hud.exposed')) + holding;
  const status = objectiveText() || (hidden ? t('hud.concealed') : `● HOSTILES ${game.enemies.length + game.waveRemaining}`);
  const pressure = Math.round(game.alert / CONFIG.alert.max * CONFIG.alert.patrolBonus * 100);
  const tactic = game.wave === 1 ? 'tutorial.tacticBushDecoy' : game.wave === 2 && p.owned.has('crossbow') ? 'tutorial.tacticCrossbow' : 'tutorial.tacticDecoy';
  $('fieldStatus').textContent = [status, t('hud.alert', { level: Math.round(game.alert), pressure }), game.wave <= 2 && t('hud.stealthTip', { tactic: t(tactic) })].filter(Boolean).join(' · ');
}
// Burned bushes stop concealing anyone until they regrow.
function inTerrain(entity, terrain) { return terrain.some(r => !r.burned && pointIn(entity.x, entity.y, r)); }
const inSmoke = pt => game.gadgets.some(g => g.kind === 'smoke' && distance(g, pt) < g.radius);
// Searchlight beam angle now, and the first live tower whose beam covers a point with nothing solid in between.
const beamAngle = l => l.base + Math.sin(game.time * CONFIG.searchlights.speed + l.phase) * CONFIG.searchlights.sweep;
function litTower(pt) {
  const L = CONFIG.searchlights;
  return game.lights.find(l => distance(l, pt) < L.range && Math.abs(angleDiff(angleTo(l, pt), beamAngle(l))) < L.halfAngle && clearSight(l, pt));
}
// Hidden = in grass or smoke (or within the Shadow Step grace after leaving grass), not revealed by recent fire or a scout,
// not lit by a flare or searchlight and not carrying the intel case.
function isHidden() {
  const p = game.player, stealth = !!p && game.time < (p.masteryStealthUntil ?? 0);
  if (!p || game.event?.carrying || game.flares.some(f => distance(f, p) < f.radius) || litTower(p) || (!stealth && game.time < p.revealedUntil)) return false;
  return stealth || inTerrain(p, game.bushes) || inSmoke(p) || game.time - p.bushTime < perk('shadow') * P.shadow.seconds;
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
// Enemy eyes are also blocked by smoke clouds.
function enemySight(e, p) { return clearSight(e, p) && !game.gadgets.some(g => g.kind === 'smoke' && segmentCircle(e.x, e.y, p.x, p.y, g, g.radius * .8)); }
function startSearch(e, x, y) { Object.assign(e, { state: 'search', goal: { x, y }, sweep: null, arrived: false, searchTime: CONFIG.search.seconds * e.patrolScale }); }
// Noise sends every unaware or searching enemy within radius (scouts excepted) to search its origin.
function alertNoise(x, y, radius) {
  stealthNoise(x, y, radius);
  for (const e of game.enemies) if ((e.state === 'wander' || e.state === 'search') && e.kind !== 'scout' && Math.hypot(e.x - x, e.y - y) < radius) startSearch(e, x, y);
}
function stealthData() {
  return game.stealth ??= { stations: [], corpses: [], noises: [], trail: [], mapIndex: 0, trailTimer: 0, waterTimer: 0, playerPos: null, radioWave: game.wave, radioReinforced: 0 };
}
function stealthResetRun() {
  game.stealth = { stations: [], corpses: [], noises: [], trail: [], mapIndex: 0, trailTimer: 0, waterTimer: 0, playerPos: null, radioWave: game.wave, radioReinforced: 0 };
  game.environmentGrassTick = 0;
}
function stealthStationFits(x, y, stations) {
  const R = CONFIG.stealth.radio, p = game.player, radius = R.radius, w = CONFIG.world;
  if (!p || !passable(x, y, radius) || Math.hypot(x - p.x, y - p.y) < CONFIG.waves.enemySpawnDistance) return false;
  if ([...game.ponds, ...game.bushes].some(r => circleRect(x, y, radius + w.terrainSpawnPadding, r))) return false;
  if ([...game.barrels, ...game.lights, ...game.chests].some(o => Math.hypot(x - o.x, y - o.y) < radius + o.radius + w.terrainGap)) return false;
  return stations.every(s => Math.hypot(x - s.x, y - s.y) >= R.spacing);
}
function stealthResetMap() {
  const S = stealthData(), R = CONFIG.stealth.radio, W = CONFIG.world;
  S.mapIndex++; S.stations.length = 0; S.corpses.length = 0; S.noises.length = 0; S.trail.length = 0;
  S.trailTimer = 0; S.waterTimer = 0; S.playerPos = game.player ? { x: game.player.x, y: game.player.y } : null;
  S.radioWave = game.wave; S.radioReinforced = 0;
  if (!game.player) return;
  const random = seededRandom(`${game.seed}:stealth-map:${S.mapIndex}`);
  const add = (x, y) => S.stations.push({ x, y, radius: R.radius, hp: R.hp, maxHp: R.hp, hit: 0, used: false, station: true });
  for (let i = 0; i < R.count; i++) {
    let pos = null;
    for (let attempt = 0; attempt < R.placementAttempts; attempt++) {
      const x = between(random, W.spawnMargin, W.width - W.spawnMargin), y = between(random, W.spawnMargin, W.height - W.spawnMargin);
      if (stealthStationFits(x, y, S.stations)) { pos = { x, y }; break; }
    }
    if (!pos) {
      const step = W.grid * 2;
      for (let y = W.spawnMargin; y <= W.height - W.spawnMargin && !pos; y += step) {
        for (let x = W.spawnMargin; x <= W.width - W.spawnMargin; x += step) {
          if (stealthStationFits(x, y, S.stations)) { pos = { x, y }; break; }
        }
      }
    }
    if (pos) add(pos.x, pos.y);
  }
}
function stealthMoveFactor() { return game.keys.has('shift') ? CONFIG.stealth.movement : 1; }
function stealthNoise(x, y, radius) {
  if (radius <= 0) return;
  const life = CONFIG.stealth.noise.life;
  stealthData().noises.push({ x, y, radius, life, maxLife: life });
}
function stealthDamageStation(station, damage) {
  if (!station?.station || station.hp <= 0 || damage <= 0) return false;
  station.hp = Math.max(0, station.hp - damage); station.hit = CONFIG.stealth.radio.hitFlash;
  if (!station.hp) { station.used = true; burst(station.x, station.y, '#d6c48b', 14); sound.play('shieldBreak', station); }
  return true;
}
function stealthBlastStations(x, y, radius, damage) {
  if (!damage) return;
  for (const station of stealthData().stations) if (station.hp > 0 && Math.hypot(station.x - x, station.y - y) < radius + station.radius) stealthDamageStation(station, damage);
}
function stealthVisibility(e, p, d, candidate, dt) {
  if (!candidate) { e.stealthSuspicion = 0; return false; }
  if (hunting(e) || e.wasVisible) { e.stealthSuspicion = 0; return true; }
  const V = CONFIG.stealth.vision, stats = CONFIG.enemies[e.kind], range = stats.sight * e.sightScale * CONFIG.variants[game.variant].sight;
  const angle = Math.abs(angleDiff(angleTo(e, p), e.facing));
  const limit = angle <= V.cone ? range : angle <= Math.PI - V.cone ? range * V.side : V.rear;
  if (d > limit) { e.stealthSuspicion = 0; return false; }
  const delay = V.suspicion[0] + (V.suspicion[1] - V.suspicion[0]) * clamp(d / limit, 0, 1);
  e.stealthSuspicion = (e.stealthSuspicion ?? 0) + dt;
  if (e.stealthSuspicion < delay) return false;
  e.stealthSuspicion = 0;
  return true;
}
function stealthDeath(enemy) {
  const S = stealthData(), C = CONFIG.stealth.corpses, stats = CONFIG.enemies[enemy.kind];
  if (enemy.stealthCorpse) { enemy.stealthCorpse.investigator = null; enemy.stealthCorpse.investigated = true; enemy.stealthCorpse = null; }
  if (stats?.boss || enemy.kind === 'scout' || stats?.flying) return;
  if (S.corpses.length >= C.max) {
    const oldest = S.corpses.shift();
    if (oldest.investigator?.stealthCorpse === oldest) oldest.investigator.stealthCorpse = null;
  }
  S.corpses.push({ x: enemy.x, y: enemy.y, kind: enemy.kind, life: C.life, investigator: null, discovered: false, investigated: false, alarmed: false, playerFound: !inTerrain(enemy, game.bushes) });
}
function stealthUpdate(dt) {
  const S = stealthData(), C = CONFIG.stealth.corpses, H = CONFIG.stealth.hound, p = game.player;
  for (let i = S.noises.length - 1; i >= 0; i--) if ((S.noises[i].life -= dt) <= 0) S.noises.splice(i, 1);
  for (const station of S.stations) station.hit = Math.max(0, station.hit - dt);
  if (!p) return;
  const moved = S.playerPos && (p.x !== S.playerPos.x || p.y !== S.playerPos.y);
  S.playerPos ??= { x: p.x, y: p.y }; S.playerPos.x = p.x; S.playerPos.y = p.y;
  if (harsh() && moved && inTerrain(p, game.ponds)) {
    S.waterTimer += dt;
    if (S.waterTimer >= CONFIG.stealth.water.every) { S.waterTimer = 0; alertNoise(p.x, p.y, CONFIG.stealth.water.radius); }
  } else S.waterTimer = 0;
  if (inTerrain(p, game.ponds) || inSmoke(p)) { S.trail.length = 0; S.trailTimer = 0; }
  else {
    S.trailTimer += dt;
    if (S.trailTimer >= H.sampleEvery) {
      S.trailTimer -= H.sampleEvery; S.trail.push({ x: p.x, y: p.y, time: game.time });
      while (S.trail.length && (game.time - S.trail[0].time > H.trailSeconds || S.trail.length > H.maxSamples)) S.trail.shift();
    }
  }
  for (let i = S.corpses.length - 1; i >= 0; i--) {
    const corpse = S.corpses[i];
    if ((corpse.life -= dt) <= 0) {
      if (corpse.investigator?.stealthCorpse === corpse) corpse.investigator.stealthCorpse = null;
      S.corpses.splice(i, 1); continue;
    }
    if (!inTerrain(corpse, game.bushes) || distance(p, corpse) <= C.revealRadius) corpse.playerFound = true;
    const guard = corpse.investigator;
    if (!guard) continue;
    if (!game.enemies.includes(guard)) { corpse.investigator = null; corpse.investigated = true; continue; }
    const d = distance(guard, corpse);
    if (d <= C.alertRadius && !corpse.alarmed && harsh()) {
      corpse.alarmed = true; corpse.discovered = true; markDetected(CONFIG.alert.detection);
      alertNoise(guard.x, guard.y, CONFIG.stealth.shout.radius); notify(t('stealth.corpseFound'));
    }
    if (d <= C.arrive) { corpse.investigated = true; corpse.investigator = null; guard.stealthCorpse = null; }
  }
}
function stealthInvestigateCorpse(e) {
  const C = CONFIG.stealth.corpses, S = stealthData();
  if (e.state !== 'wander' && e.state !== 'search' || e.stealthCorpse || e.stealthCorpseWave === game.wave) return;
  let target = null, best = Infinity;
  for (const corpse of S.corpses) {
    if (corpse.investigated || corpse.investigator) continue;
    const d = distance(e, corpse), hidden = inTerrain(corpse, game.bushes);
    if (d > C.sightRadius || hidden && d > C.investigateRadius || !enemySight(e, corpse)) continue;
    if (!hidden && Math.abs(angleDiff(angleTo(e, corpse), e.facing)) > CONFIG.stealth.vision.cone) continue;
    if (d < best) { target = corpse; best = d; }
  }
  if (!target) return;
  target.investigator = e; target.discovered = true; e.stealthCorpse = target; e.stealthCorpseWave = game.wave;
  startSearch(e, target.x, target.y);
}
function stealthShout(e, visible, dt) {
  if (!harsh()) { e.stealthSightTime = 0; return; }
  if (visible) {
    e.stealthSightTime = (e.stealthSightTime ?? 0) + dt;
    if (e.stealthSightTime >= CONFIG.stealth.shout.delay && !e.stealthShouted) {
      e.stealthShouted = true; alertNoise(e.x, e.y, CONFIG.stealth.shout.radius); sound.play('beep', e);
    }
  } else {
    e.stealthSightTime = 0;
    if (e.state === 'wander') e.stealthShouted = false;
  }
}
function stealthRadioReinforcements() {
  if (!harsh()) return;
  const S = stealthData(), R = CONFIG.stealth.radio, p = game.player;
  if (S.radioWave !== game.wave) { S.radioWave = game.wave; S.radioReinforced = 0; }
  for (let i = 0; i < R.reinforceCount && S.radioReinforced < R.reinforceMax && game.enemies.length < CONFIG.waves.maxAlive; i++) {
    const pos = freeSpot(CONFIG.enemies.runner.radius, R.reinforceDistance, true);
    if (!pos) break;
    const guard = makeEnemy('runner', pos, { noLoot: true });
    startSearch(guard, p.x, p.y); S.radioReinforced++;
  }
}
function stealthActivateStation(e, station) {
  const p = game.player, W = CONFIG.world;
  station.used = true; e.stealthStationDone = true; startSearch(e, p.x, p.y);
  const radius = Math.max(Math.hypot(station.x, station.y), Math.hypot(W.width - station.x, station.y), Math.hypot(station.x, W.height - station.y), Math.hypot(W.width - station.x, W.height - station.y));
  markDetected(CONFIG.alert.detection); alertNoise(station.x, station.y, radius);
  burst(station.x, station.y, '#f3d182', 18); sound.play('beep', station); notify(t('stealth.radioAlarm'));
  stealthRadioReinforcements();
}
function stealthTrailTarget(e) {
  const trail = stealthData().trail, H = CONFIG.stealth.hound;
  if (!trail.length) { e.stealthTrailAt = null; return null; }
  let index = e.stealthTrailAt == null ? -1 : trail.findIndex(point => point.time >= e.stealthTrailAt);
  if (index < 0) {
    let nearest = Infinity;
    for (let i = 0; i < trail.length; i++) {
      const d = distance(e, trail[i]);
      if (d < nearest) { index = i; nearest = d; }
    }
    if (nearest > H.acquireRadius) { e.stealthTrailAt = null; return null; }
  }
  while (index < trail.length - 1 && distance(e, trail[index]) <= H.followRadius) index++;
  e.stealthTrailAt = trail[index].time;
  return trail[index];
}
function stealthDecoyTarget(e) {
  const decoy = e.stealthDecoy;
  if (decoy && game.gadgets.includes(decoy)) return decoy;
  e.stealthDecoy = null;
  const range = CONFIG.throwables.items.decoy.noise;
  e.stealthDecoy = game.gadgets.find(g => g.kind === 'decoy' && distance(e, g) <= range) ?? null;
  return e.stealthDecoy;
}
function stealthUpdateHound(e, dt, d, visible) {
  const H = CONFIG.stealth.hound, stats = CONFIG.enemies.hound, p = game.player, speed = stats.speed * e.speed * (guarded(e) ? CONFIG.captains.speed : 1);
  const target = visible ? p : stealthDecoyTarget(e) ?? stealthTrailTarget(e);
  if (visible) e.stealthTrailAt = null;
  if (target) {
    e.facing = angleTo(e, target);
    if (!visible) { e.state = 'search'; e.goal ??= {}; e.goal.x = target.x; e.goal.y = target.y; }
    if (Math.hypot(e.x - target.x, e.y - target.y) > stats.reach) steer(e, e.facing, speed, dt);
    e.stealthBarkTimer = (e.stealthBarkTimer ?? H.barkEvery) - dt;
    if (e.stealthBarkTimer <= 0) {
      e.stealthBarkTimer = H.barkEvery; alertNoise(e.x, e.y, H.barkRadius); raiseAlert(CONFIG.alert.detection); sound.play('beep', e);
    }
  } else if (e.state === 'search') updateSearch(e, stats, speed, dt);
  else {
    e.wanderTime -= dt;
    if (e.wanderTime <= 0) { e.direction = rand(-Math.PI, Math.PI); e.wanderTime = rand(...CONFIG.enemies.wanderInterval); }
    e.facing = e.direction; steer(e, e.direction, speed * stats.wanderSpeed, dt);
  }
  if (visible && d <= stats.reach + p.radius && e.cooldown <= 0) { hurtPlayer(enemyDamage(stats), e.kind); e.cooldown = stats.cooldown; }
  return true;
}
function stealthUpdateEnemy(e, dt, d, visible) {
  stealthShout(e, visible, dt);
  if (e.kind === 'radio' && !e.stealthStationDone && e.state !== 'wander') {
    const sites = stealthData().stations.filter(station => station.hp > 0 && !station.used);
    if (!sites.length) { e.stealthStationDone = true; return false; }
    const station = sites.reduce((nearest, site) => distance(e, site) < distance(e, nearest) ? site : nearest);
    const speed = CONFIG.enemies.radio.speed * e.speed * (guarded(e) ? CONFIG.captains.speed : 1);
    if (distance(e, station) <= e.radius + station.radius) stealthActivateStation(e, station);
    else { e.facing = angleTo(e, station); steer(e, e.facing, speed, dt); }
    return true;
  }
  if (e.kind === 'hound') return stealthUpdateHound(e, dt, d, visible);
  if (e.kind !== 'scout' && e.kind !== 'medic' && !CONFIG.enemies[e.kind].boss) stealthInvestigateCorpse(e);
  return false;
}
function stealthDraw() {
  const S = stealthData(), p = game.player, C = CONFIG.stealth.corpses;
  if (!mutator('blindSpot')) for (const ring of S.noises) {
    const progress = 1 - ring.life / ring.maxLife;
    ctx.strokeStyle = `rgba(236,219,164,${(1 - progress) * .55})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius * progress, 0, Math.PI * 2); ctx.stroke();
  }
  for (const corpse of S.corpses) {
    const hidden = inTerrain(corpse, game.bushes);
    if (!p || hidden && !corpse.playerFound && distance(p, corpse) > C.revealRadius) continue;
    ctx.save(); ctx.globalAlpha = Math.min(1, corpse.life / C.life); ctx.translate(corpse.x, corpse.y);
    ctx.fillStyle = '#2b2b25'; ctx.beginPath(); ctx.ellipse(0, 3, 13, 6, -.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = CONFIG.enemies[corpse.kind].color; ctx.fillRect(-9, -2, 18, 5);
    ctx.fillStyle = '#d0c6a0'; ctx.beginPath(); ctx.arc(10, -2, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  for (const station of S.stations) {
    const active = station.hp > 0, color = !active ? '#66665c' : station.hit > 0 ? '#fff2bd' : station.used ? '#c8905a' : '#9bb8a5';
    ctx.save(); ctx.globalAlpha = active ? 1 : .58; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(station.x, station.y, station.radius + 5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#27352c'; ctx.fillRect(station.x - 11, station.y - 8, 22, 19);
    ctx.fillStyle = color; ctx.fillRect(station.x - 8, station.y - 5, 16, 12);
    ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(station.x, station.y - 8); ctx.lineTo(station.x, station.y - 19); ctx.moveTo(station.x - 5, station.y - 17); ctx.lineTo(station.x + 5, station.y - 17); ctx.stroke();
    if (active) { ctx.fillStyle = '#18251c'; ctx.fillRect(station.x - 12, station.y + 14, 24, 3); ctx.fillStyle = '#f3d182'; ctx.fillRect(station.x - 12, station.y + 14, 24 * station.hp / station.maxHp, 3); }
    ctx.restore();
  }
}
function stealthDrawEnemy(e) {
  if (e.kind !== 'radio' && e.kind !== 'hound') return;
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.facing);
  if (e.kind === 'radio') {
    ctx.fillStyle = '#403a2b'; ctx.fillRect(-5, -e.radius - 7, 10, 8);
    ctx.strokeStyle = '#e6cf88'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(2, -e.radius - 7); ctx.lineTo(5, -e.radius - 17); ctx.lineTo(8, -e.radius - 19); ctx.stroke();
    ctx.fillStyle = '#f3d182'; ctx.fillRect(-2, -e.radius - 4, 4, 2);
  } else {
    ctx.fillStyle = '#32251f'; ctx.beginPath(); ctx.moveTo(3, -e.radius + 2); ctx.lineTo(7, -e.radius - 7); ctx.lineTo(11, -e.radius + 1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(3, e.radius - 2); ctx.lineTo(7, e.radius + 7); ctx.lineTo(11, e.radius - 1); ctx.fill();
    ctx.strokeStyle = '#efc098'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-e.radius, 0); ctx.lineTo(-e.radius - 6, 3); ctx.stroke();
  }
  ctx.restore();
}
// Magazine modifier: reload the equipped gun (R, or automatically when it runs dry); the magazine refills after `reload` s.
function reload() {
  const p = game.player, gun = gunStats();
  if (!gun.mag || p.reload > 0 || (p.mag[p.weapon] ?? gun.mag) >= gun.mag) return;
  p.reload = CONFIG.mutators.magazine.reload; p.reloadGun = p.weapon; sound.play('toss'); updateHUD();
}
// Shots fired while hidden are ambush shots: they get the Ambush/Predator bonus and count toward ambush kills. Every shot makes noise
// except silent guns (the crossbow), which also keep the player hidden but spend a bolt per shot.
function shoot() {
  const p = game.player, gun = gunStats(), angle = p.facing, ambush = isHidden(), M = CONFIG.mods;
  if (gun.ammo && p.bolts <= 0) { p.cooldown = CONFIG.player.switchDelay * 2; notify(t('toast.noBolts')); return; }
  if (gun.mag && (p.reload > 0 || (p.mag[p.weapon] ??= gun.mag) <= 0)) { reload(); return; }
  const focusShot = perk('hunterFocus') > 0 && p.hunterFocusReady;
  const paybackShots = p.paybackShots ?? 0;
  const damage = Math.round(gun.damage * (ambush ? 1 + perk('ambush') * P.ambush.bonus + perk('predator') * P.predator.bonus : 1) * (focusShot ? 1 + P.hunterFocus.damage : 1) * (1 + paybackShots * P.payback.damage));
  p.paybackShots = 0;
  p.hunterFocusIdle = 0; if (focusShot) p.hunterFocusReady = false;
  p.cooldown = 1 / gun.shotsPerSecond; game.stats.shotWave ??= game.wave;
  if (!gun.silent) p.revealedUntil = game.time + CONFIG.player.revealSeconds * (1 - p.levels.suppressor * M.suppressor.reveal) * (1 + perk('frenzy') * P.frenzy.reveal);
  if (gun.ammo) p.bolts--;
  if (gun.mag && --p.mag[p.weapon] <= 0) reload();
  for (let i = 0; i < gun.pellets; i++) {
    const a = angle + (i - (gun.pellets - 1) / 2) * gun.spreadRadians + rand(-gun.jitter, gun.jitter), x = p.x + Math.cos(a) * 21, y = p.y + Math.sin(a) * 21;
    game.bullets.push(buildShot(p.weapon, { x, y, vx: Math.cos(a) * gun.bulletSpeed, vy: Math.sin(a) * gun.bulletSpeed, traveled: 0, range: gun.range, damage, radius: CONFIG.gun.bulletRadius, friendly: true, pierce: gun.blast ? 0 : gun.pierce, hits: gun.pierce ? new Set() : null, bounces: gun.bounces, color: focusShot ? '#f2d782' : gun.color, trail: p.weapon === 'rail' || p.weapon === 'crossbow', source: p.weapon, ambush, bolt: !!gun.ammo && i === 0, blast: gun.blast }));
  }
  buildOnShot(p.weapon);
  if (gun.noise) {
    game.waveSilent = false;
    raiseAlert(CONFIG.alert.manualShot * clamp(gun.noise / CONFIG.weapons.rifle.noise, 0.25, 1.5));
    alertNoise(p.x, p.y, gun.noise);
  }
  burst(p.x + Math.cos(angle) * 23, p.y + Math.sin(angle) * 23, '#f3e8aa', 5);
  if (focusShot) burst(p.x + Math.cos(angle) * 23, p.y + Math.sin(angle) * 23, '#f2d782', 10);
  sound.play(gun.sound); game.shake = gun.shake; updateHUD();
}
function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) { const a = rand(0, Math.PI * 2), speed = rand(35, 160), life = rand(.2, .7); game.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life, maxLife: life }); }
}
function drop(x, y, kind, amount) { game.loot.push({ x: x + rand(-13, 13), y: y + rand(-13, 13), kind, amount, age: 0, phase: rand(0, 6) }); }
// Score multiplier: combo × difficulty × mutators (see CONFIG.score).
function scoreMultiplier() {
  const S = CONFIG.score;
  return Math.min(S.comboMax, 1 + game.combo * S.comboStep) * difficulty().score * (1 + game.mutators.reduce((sum, key) => sum + CONFIG.mutators[key].score, 0));
}
const addScore = points => { game.score += Math.round(points * scoreMultiplier()); };
function enemyDeath(enemy, ambush, source) {
  game.enemies.splice(game.enemies.indexOf(enemy), 1); game.kills++;
  stealthDeath(enemy);
  buildOnKill(enemy, ambush, source);
  if (source === 'crossbow') game.stats.crossbowKills++;
  const l = CONFIG.loot, stats = CONFIG.enemies[enemy.kind], p = game.player, S = CONFIG.score;
  game.combo = (game.comboTimer > 0 ? game.combo : 0) + (ambush ? S.ambushCombo : 1); game.comboTimer = S.comboWindow;
  const bounty = stats.bounty * (enemy.affix ? CONFIG.elites.bounty : 1);
  if (stats.boss) bossDeath(enemy);
  else {
    addScore(S.kill * bounty * (enemy.noLoot ? S.minion : 1));
    if (!enemy.noLoot) {
      drop(enemy.x, enemy.y, 'gold', goldAmount(rand(l.coinEnemy[0], l.coinEnemy[1] + 1) * bounty));
      if (Math.random() < l.scrapEnemyChance * bounty) drop(enemy.x, enemy.y, 'scrap', scrapAmount(1));
    }
  }
  if (ambush) { game.stats.ambushKills++; progressChallenge('ambush'); if (perk('phantom')) p.revealedUntil = game.time; }
  const heal = perk('vampire') * P.vampire.heal + perk('bloodstorm') * P.bloodstorm.heal + (inTerrain(p, game.bushes) ? perk('thornbound') * P.thornbound.heal : 0);
  if (heal) p.hp = Math.min(p.maxHp, p.hp + heal);
  if (enemy.affix === 'splitter') {
    const s = CONFIG.elites.affixes.splitter;
    for (let i = 0; i < s.count; i++) spawnNear(enemy.kind, enemy, enemy.radius, { hpScale: s.hp, radius: s.radius });
  }
  burst(enemy.x, enemy.y, stats.color, 13); sound.play('kill', enemy);
  if (Math.random() < perk('volatile') * P.volatile.chance + perk('bloodstorm') * P.bloodstorm.chance) explode(enemy.x, enemy.y, Math.round(P.volatile.damage * waveScale()), { blast: P.volatile.blast, source: 'perk' });
  updateHUD();
}
function bossDeath(boss) {
  const L = CONFIG.boss.loot;
  drop(boss.x, boss.y, 'gold', goldAmount(L.gold)); drop(boss.x, boss.y, 'scrap', scrapAmount(L.scrap)); drop(boss.x, boss.y, 'heal', L.heal);
  game.boss = null; game.stats.bosses++; game.stats.bossKinds.add(boss.kind); addScore(CONFIG.score.boss);
  burst(boss.x, boss.y, '#f2d782', 40); game.shake = Math.max(game.shake, 10); sound.play('chest'); notify(t('toast.bossDown', { name: t(`enemy.${boss.kind}`) }));
  if (game.training) { game.stats.trainingWon = true; finishRun(); return; }
  resolveMission();
  if (boss.finalOperation) { finishRun(false, true); return; }
}
function chestDeath(chest) {
  game.chests.splice(game.chests.indexOf(chest), 1); const l = CONFIG.loot;
  if (chest.jammer) {
    const ev = game.event, cfg = CONFIG.events.types.jammer;
    if (ev?.crate === chest && !ev.done) { ev.done = true; ev.outcome = 'disabled'; game.alert = Math.max(0, game.alert - cfg.alert); payout(chest.x, chest.y, cfg); }
  } else if (chest.airdrop) payout(chest.x, chest.y, CONFIG.events.types.airdrop);
  else {
    drop(chest.x, chest.y, 'gold', goldAmount(rand(l.coinChest[0], l.coinChest[1] + 1)));
    drop(chest.x, chest.y, 'scrap', scrapAmount(Math.floor(rand(l.scrapChest[0], l.scrapChest[1] + 1))));
    if (Math.random() < l.healChestChance) drop(chest.x, chest.y, 'heal', l.healAmount);
  }
  burst(chest.x, chest.y, '#f2d782', 20); sound.play('chest'); notify(t(chest.jammer ? 'event.jammerDone' : chest.airdrop ? 'event.airdropOpen' : 'toast.chest'));
}
// Frontal shields absorb friendly bullets that arrive within ±shieldArc of the bearer's facing until depleted.
function damageEnemy(e, b) {
  const stats = CONFIG.enemies[e.kind];
  if (b.shieldBreak && e.shieldHp > 0) { e.shieldHp = 0; sound.play('shieldBreak', e); }
  if (e.shieldHp > 0 && Math.abs(angleDiff(Math.atan2(b.y - e.y, b.x - e.x), e.facing)) < stats.shieldArc) {
    e.shieldHp = Math.max(0, e.shieldHp - b.damage); e.blocked = .12;
    if (e.shieldHp) { burst(b.x, b.y, '#d5ecf5', 4); sound.play('block', e); }
    else { burst(e.x + Math.cos(e.facing) * 20, e.y + Math.sin(e.facing) * 20, '#bfe3f5', 18); sound.play('shieldBreak', e); }
    return;
  }
  if (CONFIG.weapons[b.source]) { game.stats.hitRange += distance(game.player, e); game.stats.hits++; }
  hitEnemyBody(e, b.damage, b.source, b.ambush);
}
// Direct body damage: used by bullets past the shield and by blades, missiles and arcs, which ignore frontal shields.
// `source` feeds the end-of-run damage breakdown; armored elites shrug off part of every hit.
function hitEnemyBody(e, damage, source, ambush = false) {
  if (e.hp <= 0) return;
  if (e.affix === 'armored') damage *= 1 - CONFIG.elites.affixes.armored.reduction;
  if (guarded(e)) damage *= 1 - CONFIG.captains.reduction;
  game.stats.damage[source] = (game.stats.damage[source] ?? 0) + Math.min(e.hp, damage);
  e.hp -= damage; e.hit = .15; e.reveal = CONFIG.enemies[e.kind].revealSeconds ?? 0; burst(e.x, e.y, CONFIG.enemies[e.kind].color, 4);
  if (e.hp <= 0) enemyDeath(e, ambush, source); else sound.play('hit', e);
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
// Wooden walls splinter under fire and are removed at 0 HP (removal only opens the map, so it stays connected).
function damageWood(r, damage) {
  if (r.hp <= 0) return;
  r.hp -= damage; r.hit = .15;
  if (r.hp > 0) return;
  game.walls.splice(game.walls.indexOf(r), 1);
  for (let i = 0; i < 4; i++) burst(r.x + rand(0, r.w), r.y + rand(0, r.h), i % 2 ? '#b58a55' : '#7a5a36', 8);
  sound.play('crack', rectCenter(r)); game.shake = Math.max(game.shake, 3);
}
// Shot-out searchlights go dark for the rest of the run.
function damageLight(l, damage) {
  if (l.hp <= 0) return;
  l.hp -= damage; l.hit = .15;
  if (l.hp > 0) return;
  game.lights.splice(game.lights.indexOf(l), 1); burst(l.x, l.y, '#fff0a0', 18); sound.play('shieldBreak', l);
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
function igniteGrass(r) {
  if (r.burned > 0) return;
  r.burned = CONFIG.world.burnSeconds; r.fire = CONFIG.environment.fireSeconds;
  r.fireSpread = CONFIG.environment.fireSpreadInterval;
  burst(r.x + r.w / 2, r.y + r.h / 2, '#f0a24f', 6);
}
function burnGrass(x, y, radius) {
  for (const r of game.bushes) if (circleRect(x, y, radius, r)) igniteGrass(r);
}
function environmentWaterBetween(x1, y1, x2, y2) {
  return game.ponds.some(pond => lineRect(x1, y1, x2, y2, pond));
}
function environmentCreateFirePool(x, y, radius, seconds, damage, source = 'fire', owner = null, playerDamage = CONFIG.environment.playerFireDamage, enemyScale = 1) {
  if (game.ponds.some(pond => pointIn(x, y, pond))) return false;
  game.pools.push({ kind: 'fire', x, y, radius, life: seconds, damage, source, owner, playerDamage, enemyScale, enemyTick: 0 });
  burnGrass(x, y, radius); burst(x, y, '#ff9a45', 16);
  return true;
}
function environmentLandThrowable(kind, x, y) {
  if (kind !== 'molotov') return false;
  const item = CONFIG.throwables.items.molotov;
  environmentCreateFirePool(x, y, item.radius, item.seconds, Math.round(item.damage * waveScale()), 'fire', game.player);
  return true;
}
function environmentUpdate(dt) {
  const E = CONFIG.environment, p = game.player;
  for (const r of game.bushes) {
    if (!mutator('scorchedEarth')) r.burned = Math.max(0, (r.burned ?? 0) - dt);
    if (!(r.fire > 0)) continue;
    r.fire = Math.max(0, r.fire - dt);
    r.fireSpread = (r.fireSpread ?? E.fireSpreadInterval) - dt;
    if (r.fireSpread > 0) continue;
    r.fireSpread = E.fireSpreadInterval;
    const x = r.x + r.w / 2, y = r.y + r.h / 2;
    for (const other of game.bushes) {
      if (other === r || other.burned > 0) continue;
      const ox = other.x + other.w / 2, oy = other.y + other.h / 2;
      if (Math.hypot(ox - x, oy - y) <= E.fireSpreadRange && !environmentWaterBetween(x, y, ox, oy)) igniteGrass(other);
    }
  }
  game.environmentGrassTick = Math.max(0, (game.environmentGrassTick ?? 0) - dt);
  if (game.environmentGrassTick <= 0) {
    game.environmentGrassTick = E.fireTick;
    if (harsh() && !game.daily && p && !inTerrain(p, game.ponds) && game.bushes.some(r => r.fire > 0 && circleRect(p.x, p.y, p.radius, r))) hurtPlayer(E.playerFireDamage, 'fire');
    for (const e of [...game.enemies]) {
      if (!inTerrain(e, game.ponds) && game.bushes.some(r => r.fire > 0 && circleRect(e.x, e.y, e.radius, r))) hitEnemyBody(e, E.fireDamage, 'fire');
    }
  }
  for (const pool of game.pools) {
    if (pool.life <= 0) continue;
    pool.enemyTick = (pool.enemyTick ?? 0) - dt;
    if (pool.enemyTick > 0) continue;
    pool.enemyTick = E.fireTick;
    const fire = pool.kind === 'fire', damage = pool.damage ?? enemyDamage(CONFIG.boss.hive.acid), source = pool.source ?? (fire ? 'fire' : 'hive');
    for (const e of [...game.enemies]) {
      if ((fire && inTerrain(e, game.ponds)) || e === pool.owner || distance(e, pool) >= pool.radius + e.radius) continue;
      hitEnemyBody(e, damage * (pool.enemyScale ?? E.enemyBlastDamage), source);
    }
  }
}
function environmentDraw() {
  for (const r of game.bushes) if (r.fire > 0) {
    const x = r.x + r.w / 2, y = r.y + r.h / 2, flicker = Math.sin(game.time * 12 + r.x) * 3;
    ctx.fillStyle = 'rgba(255,126,47,.42)'; ctx.beginPath(); ctx.ellipse(x, y, r.w * .24, r.h * .2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8943f'; ctx.beginPath(); ctx.moveTo(x - 8, y + 5); ctx.quadraticCurveTo(x - 12, y - 10 - flicker, x, y - 18 - flicker); ctx.quadraticCurveTo(x + 12, y - 9, x + 8, y + 5); ctx.fill();
  }
  for (const pool of game.pools) if (pool.kind === 'fire') {
    ctx.fillStyle = 'rgba(242,106,39,.25)'; ctx.beginPath(); ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,176,73,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pool.x, pool.y, pool.radius - 2 + Math.sin(game.time * 6) * 2, 0, Math.PI * 2); ctx.stroke();
  }
}
function environmentSegmentEntry(x1, y1, x2, y2, target, radius) {
  const dx = x2 - x1, dy = y2 - y1, fx = x1 - target.x, fy = y1 - target.y;
  const c = fx * fx + fy * fy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (!a) return null;
  const b = 2 * (fx * dx + fy * dy), disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
function environmentBulletTarget(b, x1, y1, x2, y2) {
  let target = null, best = Infinity, t;
  for (const e of game.enemies) {
    if (e === b.owner || e.hp <= 0 || b.hits?.has(e)) continue;
    t = environmentSegmentEntry(x1, y1, x2, y2, e, e.radius + b.radius);
    if (t !== null && t < best) { target = e; best = t; }
  }
  const p = game.player;
  if (p) {
    t = environmentSegmentEntry(x1, y1, x2, y2, p, p.radius + b.radius);
    if (t !== null && t < best) { target = p; best = t; }
  }
  const agent = escortAgent();
  if (agent) {
    t = environmentSegmentEntry(x1, y1, x2, y2, agent, agent.radius + b.radius);
    if (t !== null && t < best) { target = agent; best = t; }
  }
  for (const station of game.stealth?.stations ?? []) {
    if (!station.station || station.hp <= 0) continue;
    t = environmentSegmentEntry(x1, y1, x2, y2, station, station.radius + b.radius);
    if (t !== null && t < best) { target = station; best = t; }
  }
  return target;
}
function environmentDamageEnemy(e, b) {
  if (!e || e === b.owner || e.hp <= 0) return;
  const damage = b.damage;
  b.damage *= CONFIG.environment.enemyBulletDamage;
  damageEnemy(e, b);
  b.damage = damage;
}
function environmentBlastEnemies(x, y, radius, damage, exclude) {
  if (!damage) return;
  for (const e of [...game.enemies]) {
    if (e !== exclude && e.hp > 0 && Math.hypot(e.x - x, e.y - y) < radius + e.radius) hitEnemyBody(e, damage * CONFIG.environment.enemyBlastDamage, 'friendlyFire');
  }
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
// Auto weapons stay off under the purist curse and while overheated (harsh difficulties).
const autosOff = p => perk('purist') > 0 || p.overheat > 0;
function bladePositions(p) {
  const s = CONFIG.autoWeapons.blades, n = p.levels.blades && !autosOff(p) ? s.count[p.levels.blades - 1] : 0;
  return Array.from({ length: n }, (_, i) => { const a = game.time * s.spin + i * Math.PI * 2 / n; return { x: p.x + Math.cos(a) * s.radius, y: p.y + Math.sin(a) * s.radius, a }; });
}
// Harsh only: each auto shot / blade hit adds heat; at max every auto weapon shuts down for autoHeat.overheat s.
function addHeat(key) {
  const p = game.player, H = CONFIG.autoHeat;
  if (!harsh() || (p.heat += H.cost[key]) < H.max) return;
  p.heat = H.max; p.overheat = H.overheat; sound.play('shieldBreak');
  if (!game.seenOverheat) { game.seenOverheat = true; notify(t('toast.overheat', { seconds: H.overheat })); }
}
function updateAutoWeapons(dt) {
  const p = game.player, A = CONFIG.autoWeapons, l = p.levels, cd = p.autoCooldowns;
  for (const key in cd) cd[key] -= dt;
  p.heat = Math.max(0, p.heat - CONFIG.autoHeat.cool * dt); p.overheat = Math.max(0, p.overheat - dt);
  if (autosOff(p)) return;
  if (l.blades) {
    const s = A.blades, damage = s.damage[l.blades - 1];
    for (const blade of bladePositions(p)) for (const e of [...game.enemies]) {
      if (e.bladeCooldown <= 0 && Math.hypot(e.x - blade.x, e.y - blade.y) < e.radius + s.size) { e.bladeCooldown = s.hitCooldown; sound.play('blade', e); hitEnemyBody(e, damage, 'blades'); addHeat('blades'); }
    }
  }
  if (inTerrain(p, game.bushes) || autosOff(p)) return;
  if (l.drone && cd.drone <= 0) {
    const s = A.drone, from = dronePosition(p), target = nearestEnemy(from, s.range);
    if (target) {
      const a = Math.atan2(target.y - from.y, target.x - from.x);
      game.bullets.push({ ...from, vx: Math.cos(a) * s.bulletSpeed, vy: Math.sin(a) * s.bulletSpeed, traveled: 0, range: s.range + 40, damage: s.damage[l.drone - 1], radius: 3, friendly: true, pierce: 0, hits: null, color: '#bfe8ff', source: 'drone' });
      cd.drone = 1 / s.rate[l.drone - 1]; sound.play('drone', from); addHeat('drone');
    }
  }
  if (l.missile && cd.missile <= 0) {
    const s = A.missile, target = nearestEnemy(p, s.range);
    if (target) {
      game.missiles.push({ x: p.x, y: p.y, angle: Math.atan2(target.y - p.y, target.x - p.x) + rand(-.7, .7), target, damage: s.damage[l.missile - 1], life: s.life });
      cd.missile = s.interval[l.missile - 1]; sound.play('missile'); addHeat('missile');
    }
  }
  if (l.tesla && cd.tesla <= 0) {
    const s = A.tesla, first = nearestEnemy(p, s.range);
    if (first) {
      const chain = [first], hit = new Set(chain);
      while (chain.length < s.chains[l.tesla - 1]) {
        const from = chain[chain.length - 1]; let next = null, best = Infinity;
        for (const candidate of game.enemies) {
          if (hit.has(candidate) || isCloaked(candidate) || !clearSight(from, candidate)) continue;
          const reach = s.chainRange * (inTerrain(candidate, game.ponds) ? s.wetChainRange : 1), d = distance(from, candidate);
          if (d < reach && d < best) { best = d; next = candidate; }
        }
        if (!next) break;
        chain.push(next); hit.add(next);
      }
      game.arcs.push({ points: [{ x: p.x, y: p.y }, ...chain.map(e => ({ x: e.x, y: e.y }))], life: .16 });
      for (const e of chain) hitEnemyBody(e, s.damage[l.tesla - 1], 'tesla');
      cd.tesla = s.interval[l.tesla - 1]; sound.play('zap'); addHeat('tesla');
    }
  }
}
// Shared blast: damages enemies and chests, sets off barrels, splinters wooden walls, knocks out searchlights, optionally hurts the
// player (hurtBy names the attacker for the after-action report) and the escorted agent, and burns grass. Every blast makes noise.
function explode(x, y, damage, { blast = CONFIG.autoWeapons.missile.blast, source = 'missile', burn = false, playerDamage = 0, ambush = false, hurtBy = source, enemyDamage = 0, exclude = null, cluster = false, clusterDepth = 0, angle = 0 } = {}) {
  const p = game.player;
  burst(x, y, '#f6b36b', 22); burst(x, y, '#fff0c0', 8); sound.play('explosion', { x, y }); game.shake = Math.max(game.shake, 4 + (burn ? 4 : 0));
  game.blasts.push({ x, y, radius: blast, life: .35 });
  environmentBlastEnemies(x, y, blast, enemyDamage, exclude);
  stealthBlastStations(x, y, blast, damage || enemyDamage);
  if (cluster) game.bullets.push(...buildExplosion(x, y, damage, { blast, source, ambush, cluster, clusterDepth, angle }));
  if (damage) {
    for (const e of [...game.enemies]) if (Math.hypot(e.x - x, e.y - y) < blast + e.radius) hitEnemyBody(e, damage, source, ambush);
    for (const c of [...game.chests]) if (Math.hypot(c.x - x, c.y - y) < blast + c.radius) damageChest(c, damage);
    for (const d of missionDishes()) if (Math.hypot(d.x - x, d.y - y) < blast + d.radius) damageDish(d, damage);
  }
  for (const b of game.barrels) if (Math.hypot(b.x - x, b.y - y) < blast + b.radius) damageBarrel(b, CONFIG.barrels.hp);
  for (const r of game.walls.filter(r => r.wood && circleRect(x, y, blast, r))) damageWood(r, CONFIG.world.woodBlast);
  for (const l of [...game.lights]) if (Math.hypot(l.x - x, l.y - y) < blast + l.radius) damageLight(l, l.hp);
  if (playerDamage && distance(p, { x, y }) < blast + p.radius) hurtPlayer(playerDamage, hurtBy);
  const agent = escortAgent();
  if (playerDamage && agent && distance(agent, { x, y }) < blast + agent.radius) hurtAgent(playerDamage);
  if (burn) burnGrass(x, y, blast);
  alertNoise(x, y, CONFIG.search.explosionNoise);
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
// `source` (enemy kind, barrel…) feeds the after-action report: damage after armor per source and a short log of recent hits.
function hurtPlayer(damage, source = 'unknown') {
  const p = game.player, s = game.stats;
  if (p.invulnerable > 0 || game.mode !== 'playing') return;
  failChallenge('untouched');
  const bulwark = p.bulwark > 0 ? CONFIG.classes.heavy.skill.reduction : 0;
  let amount = damage * (1 - gearStats().reduction) * (1 - bulwark) * (1 + perk('bloodPrice') * P.bloodPrice.taken) * (mutator('brittle') ? CONFIG.mutators.brittle.taken : 1);
  s.taken += amount; s.hurtBy[source] = (s.hurtBy[source] ?? 0) + amount; s.lastHit = source;
  s.log.push({ time: game.time, source, amount });
  while (s.log.length && s.log[0].time < game.time - CONFIG.report.window) s.log.shift();
  p.invulnerable = CONFIG.player.invulnerability; p.lastHurt = game.time;
  const absorbed = Math.min(p.shield, amount); p.shield -= absorbed; amount -= absorbed;
  if (absorbed && p.shield <= 0 && mutator('oneShield')) p.shieldBroken = true;
  if (amount > 0) { p.hp = Math.max(0, p.hp - amount); game.flash = .35; game.shake = 7; burst(p.x, p.y, '#f29785', 9); sound.play('hurt'); }
  else { game.shake = 3; burst(p.x, p.y, '#a9dcee', 9); sound.play('shieldHit'); }
  updateHUD();
  if (!p.hp && perk('secondWind') && !p.secondWindUsed) {
    p.secondWindUsed = true; p.hp = Math.max(1, Math.round(p.maxHp * P.secondWind.hp));
    p.invulnerable = Math.max(p.invulnerable, P.secondWind.seconds); notify(t('toast.secondWind')); updateHUD();
  }
  if (!p.hp) finishRun();
}
// Run end (death or extraction): update personal records and cumulative totals, grant newly earned achievements, show the report.
// Extraction adds the extraction bonus to the score and records the best wave extracted from. Training ends in finishTraining.
function finishRun(extracted = false, cleared = false) {
  game.mode = 'ended'; game.mouse.down = false; game.stats.cleared = cleared;
  const s = game.stats, totals = profile.totals, masteryBefore = profile.mastery[game.cls] ?? 0;
  s.extracted = extracted;
  if (cleared) closeChapter();
  if (game.training) { finishTraining(masteryBefore); return; }
  if (extracted || cleared) game.score += Math.round(game.score * extractionBonus());
  const A = profile.analytics; A.runs++;
  for (const [source, amount] of Object.entries(s.hurtBy)) A.taken[source] = Math.round((A.taken[source] ?? 0) + amount);
  if (!extracted && !cleared && s.lastHit) A.deaths[s.lastHit] = (A.deaths[s.lastHit] ?? 0) + 1;
  if (game.seedWeek) {
    const entry = profile.seedRuns[game.seedWeek] ?? { score: 0, wave: 0, runs: 0 };
    profile.seedRuns[game.seedWeek] = { score: Math.max(entry.score, game.score), wave: Math.max(entry.wave, game.wave), runs: entry.runs + 1 };
    for (const week of Object.keys(profile.seedRuns).sort().slice(0, -CONFIG.seedChallenge.history)) delete profile.seedRuns[week];
  }
  const run = { wave: game.wave, kills: game.kills, time: Math.floor(game.time), score: game.score }, key = game.daily ? 'daily' : game.difficulty;
  const best = { wave: 0, kills: 0, time: 0, score: 0, ...profile.records[key] }, fresh = Object.keys(run).filter(field => run[field] > best[field]);
  for (const field of fresh) best[field] = run[field];
  if (extracted && run.wave > (best.extractWave ?? 0)) best.extractWave = run.wave;
  profile.records[key] = best;
  if (game.daily && (profile.daily?.date !== game.daily || run.score > (profile.daily.score ?? 0))) profile.daily = { date: game.daily, ...run };
  if (game.daily) {
    const day = todayUTC(), previous = profile.streak.day;
    if (previous !== day) {
      const gap = previous ? Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`)) / 86400000) : Infinity;
      profile.streak.count = gap === 1 ? profile.streak.count + 1 : gap <= CONFIG.streak.graceDays + 1 ? profile.streak.count : 1;
      profile.streak.day = day;
    }
  }
  totals.ambushKills += s.ambushKills; totals.bossKills += s.bosses; totals.takedowns += s.takedowns; totals.challenges += s.challenges; totals.purchases += s.purchases; totals.extractions += extracted ? 1 : 0; totals.clears += cleared ? 1 : 0;
  markIntel('variants', game.variant);
  for (const kind of s.bossKinds) if (!profile.bossKinds.includes(kind)) profile.bossKinds.push(kind);
  game.newAchievements = Object.entries(CONFIG.achievements).filter(([id, a]) => !unlocked(id) && achieved(a)).map(([id]) => id);
  const xp = game.daily ? 0 : Math.round((game.wave - 1) * CONFIG.mastery.waveXp + (extracted || cleared ? CONFIG.mastery.extractionXp : 0) + s.challenges * CONFIG.mastery.challengeXp);
  if (xp) profile.mastery[game.cls] += xp;
  if ((extracted || cleared) && !game.daily && game.threat) {
    const recordKey = `${game.difficulty}:${game.cls}`;
    profile.threatRecords[recordKey] = Math.max(profile.threatRecords[recordKey] ?? 0, game.threat);
  }
  if (!game.daily) {
    if (game.variant === 'night' && extracted) progressContract('night');
    progressContract('silent', s.silentWaves);
    progressContract('takedowns', s.takedowns);
    progressContract('bosses', s.bosses);
    progressContract('crossbow', s.crossbowKills);
  }
  profile.achievements.push(...game.newAchievements); saveProfile();
  const masteryXp = game.daily ? 0 : (profile.mastery[game.cls] ?? 0) - masteryBefore;
  const masteryStart = masteryLevel(game.cls, masteryBefore), masteryEnd = masteryLevel(game.cls);
  game.summary = { run, fresh, xp: masteryXp, levelUp: masteryEnd > masteryStart ? { from: masteryStart, to: masteryEnd } : null };
  renderEnd(); renderMenu();
  UI.end.hidden = false; UI.perk.hidden = true; sound.music('stop'); sound.play(extracted || cleared ? 'extract' : 'gameOver');
}
// Training ends without records, totals or achievements; a win pays capped mastery XP (per UTC day).
function finishTraining(masteryBefore) {
  const T = CONFIG.training, day = todayUTC(), won = !!game.stats.trainingWon;
  if (profile.training.day !== day) profile.training = { day, xp: 0 };
  const xp = won ? clamp(T.dailyXp - profile.training.xp, 0, T.xp) : 0;
  profile.training.xp += xp; profile.mastery[game.cls] += xp; saveProfile();
  const masteryStart = masteryLevel(game.cls, masteryBefore), masteryEnd = masteryLevel(game.cls);
  game.newAchievements = [];
  game.summary = { run: { wave: game.wave, kills: game.kills, time: Math.floor(game.time), score: game.score }, fresh: [], xp, levelUp: masteryEnd > masteryStart ? { from: masteryStart, to: masteryEnd } : null };
  renderEnd(); renderMenu();
  UI.end.hidden = false; UI.perk.hidden = true; sound.music('stop'); sound.play(won ? 'extract' : 'gameOver');
}
// A failed boss mission on a harsh difficulty cancels the extraction bonus of that wave.
const extractionBonus = () => game.missionPenalty === game.wave ? 0 : CONFIG.extraction.scoreBonus;
const DIFFICULTY_KEYS = Object.keys(CONFIG.difficulty);
// Run goals (wave on a difficulty or harder, quiet waves before the first manual shot, every gun owned) and cumulative goals.
function achieved(a) {
  if (a.cleared && !game.stats.cleared) return false;
  if (a.wave && game.wave < a.wave) return false;
  if (a.difficulty && (game.daily || DIFFICULTY_KEYS.indexOf(game.difficulty) < DIFFICULTY_KEYS.indexOf(a.difficulty))) return false;
  if (a.quietWaves && (game.wave <= a.quietWaves || (game.stats.shotWave ?? Infinity) <= a.quietWaves)) return false;
  if (a.allGuns && game.player.owned.size < Object.keys(CONFIG.weapons).length) return false;
  if (a.bossKinds && profile.bossKinds.length < a.bossKinds) return false;
  return TOTAL_KEYS.every(key => !a[key] || profile.totals[key] >= a[key]);
}
const sourceName = key => CONFIG.weapons[key] ? t(`guns.${key}.title`) : CONFIG.autoWeapons[key] ? t(`auto.${key}.title`) : t(`source.${key}`);
const hurtName = key => CONFIG.enemies[key] ? t(`enemy.${key}`) : t(`source.${key}`);
// After-action report: top damage source, detections, the last hits before death and a tip for what hurt most (or finished the run).
function analysisLines() {
  const s = game.stats, R = CONFIG.report, fallen = !s.extracted && !s.cleared && !s.trainingWon;
  const total = Object.values(s.hurtBy).reduce((sum, v) => sum + v, 0), [top] = Object.entries(s.hurtBy).sort((a, b) => b[1] - a[1]);
  const facts = [top ? t('end.analysis.top', { name: hurtName(top[0]), pct: Math.round(top[1] / total * 100) }) : t('end.analysis.clean'), t('end.analysis.detected', { count: s.detections })];
  if (fallen && s.log.length) facts.push(t('end.analysis.last', { list: s.log.slice(-R.entries).map(hit => `${hurtName(hit.source)} −${Math.round(hit.amount)}`).join(' · ') }));
  const tipKey = fallen && s.lastHit ? s.lastHit : top?.[0];
  const chapters = s.chapters.map(c => `${t('end.chapter', { index: c.index })} ${CONFIG.chapters.grades[c.grade]}${c.badges.map(key => CONFIG.badges[key].icon).join('')}`).join(' · ');
  return [facts.join(' · '), tipKey && t(STRINGS[`tip.${tipKey}`] ? `tip.${tipKey}` : 'tip.generic'), chapters && t('end.chapters', { list: chapters })].filter(Boolean);
}
function renderEnd() {
  $('endGoalsHeading').textContent = t('end.goals');
  const { run, fresh } = game.summary, s = game.stats, mark = field => fresh.includes(field) ? ` <em>${t('end.best')}</em>` : '';
  $('endWave').innerHTML = String(run.wave).padStart(2, '0') + mark('wave');
  $('endKills').innerHTML = run.kills + mark('kills');
  $('endTime').innerHTML = formatTime(run.time) + mark('time');
  $('endScore').innerHTML = run.score.toLocaleString(locale) + mark('score');
  $('endGold').textContent = game.earned;
  $('endAmbush').textContent = s.ambushKills; $('endTakedowns').textContent = s.takedowns; $('endTaken').textContent = Math.round(s.taken); $('endBosses').textContent = s.bosses; $('endChallenges').textContent = s.challenges;
  $('endTitle').textContent = t(game.training ? (s.trainingWon ? 'end.title.trainingWon' : 'end.title.trainingLost') : s.cleared ? 'end.title.cleared' : s.extracted ? 'end.title.extracted' : 'end.title.fallen');
  $('endAnalysis').replaceChildren(...analysisLines().map(line => Object.assign(document.createElement('span'), { textContent: line })));
  const sources = Object.entries(s.damage).filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]);
  $('endDamage').textContent = sources.length ? sources.map(([source, value]) => `${sourceName(source)} ${Math.round(value)}`).join(' · ') : t('hud.none');
  $('endPerks').textContent = s.perks.length ? s.perks.map(key => P[key].icon).join(' ') : t('hud.none');
  $('endMode').textContent = [game.training ? t('end.training', { name: t(`enemy.${game.training}`) }) : game.daily ? `${t('hud.daily')} ${game.daily}` : t('end.seed', { seed: game.seed }), game.seedWeek && t('end.seedChallenge'), !game.daily && t(`difficulty.${game.difficulty}`), !game.daily && game.threat && t('hud.threat', { points: game.threat }), t(`class.${game.cls}`), t(`variant.${game.variant}`), ...game.mutators.map(key => t(`mutator.${key}`))].filter(Boolean).join(' · ');
  $('endAchievements').hidden = !game.newAchievements.length;
  $('endAchievements').textContent = t('end.unlocked', { list: game.newAchievements.map(id => `${CONFIG.achievements[id].icon} ${t(`achievement.${id}.title`)}`).join('、') });
  $('endXp').textContent = game.daily ? '' : `${t('end.xp', { xp: game.summary.xp })}${game.summary.levelUp ? ` · ${t('end.masteryLevelUp', game.summary.levelUp)}` : ''}`;
  renderNextGoals();
  $('shareBtn').textContent = t('end.share'); $('shareBtn').hidden = !!game.training;
}
// Daily runs share the date; normal runs share the seed and a link that fills it in, so friends can replay the same map.
function shareText() {
  const run = game.summary.run, outcome = game.stats.extracted ? t('share.extracted') : '';
  const vars = { wave: run.wave, kills: run.kills, score: run.score, time: formatTime(run.time), variant: t(`variant.${game.variant}`), outcome, url: game.daily ? SITE_URL : `${SITE_URL}?seed=${encodeURIComponent(game.seed)}` };
  if (game.daily) return t('share.text', { ...vars, date: game.daily, mutator: t(`mutator.${game.mutators[0]}`) });
  return t('share.seedText', { ...vars, seed: game.seed, mode: [t(`difficulty.${game.difficulty}`), t(`variant.${game.variant}`), ...game.mutators.map(key => t(`mutator.${key}`))].join(' · ') });
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
    const a = angle + offset, wet = !CONFIG.enemies[enemy.kind]?.flying && inTerrain(enemy, game.ponds);
    const scaledSpeed = speed * (wet ? CONFIG.enemies.waterMultiplier : 1), dx = Math.cos(a) * scaledSpeed * dt, dy = Math.sin(a) * scaledSpeed * dt;
    if (passable(x + dx * 3, y + dy * 3, enemy.radius)) { move(enemy, dx, dy); return; }
  }
}
// Cloaked enemies are drawn faintly and skipped by auto-targeting: stalkers until close, just hit or just attacking;
// the sniper boss while it sits in grass without aiming.
function isCloaked(e) {
  const stats = CONFIG.enemies[e.kind];
  if (stats.bushCloak) return e.reveal <= 0 && !e.aiming && inTerrain(e, game.bushes);
  return !!stats.cloakAlpha && e.reveal <= 0 && distance(e, game.player) > stats.revealDistance;
}
// Bomber self-destruct: blast damage ignores grass concealment, burns grass and sets off barrels; the bomber dies without loot or a kill.
function detonate(e) {
  const stats = CONFIG.enemies[e.kind];
  game.enemies.splice(game.enemies.indexOf(e), 1);
  burst(e.x, e.y, '#8a5a3c', 10);
  explode(e.x, e.y, 0, { blast: stats.blast, burn: true, playerDamage: enemyDamage(stats), hurtBy: e.kind, enemyDamage: enemyDamage(stats), exclude: e });
}
const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const hunting = e => e.state === 'chase' || e.state === 'attack';
function enemyShot(e, angle, s) {
  game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * s.speed, vy: Math.sin(angle) * s.speed, range: CONFIG.boss.bulletRange, traveled: 0, damage: enemyDamage(s), radius: s.radius, friendly: false, source: e.kind, owner: e });
}
function gunnerShot(e, stats, angle) {
  game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * stats.projectileSpeed, vy: Math.sin(angle) * stats.projectileSpeed, range: stats.sight, traveled: 0, damage: enemyDamage(stats), radius: stats.projectileRadius, friendly: false, source: e.kind, owner: e });
  sound.play('enemyShot', e);
}
const BOSS_BEHAVIOR = { commander: updateCommander, sniper: updateSniper, hive: updateHive, incinerator: updateIncinerator };
function updateBoss(e, dt) {
  if (e.phase === 1 && e.hp < e.maxHp * CONFIG.boss.phase2At) {
    e.phase = 2;
    if (e.kind === 'commander') e.speed *= CONFIG.boss.commander.phase2.speed;
    else if (e.kind === 'incinerator') e.speed *= CONFIG.boss.incinerator.phase2Speed;
    burst(e.x, e.y, '#ff8a6a', 30); sound.play('shieldBreak', e); notify(t('toast.bossPhase', { name: t(`enemy.${e.kind}`) }));
    if (harsh()) counterPlayer(e);
  }
  BOSS_BEHAVIOR[e.kind](e, dt);
  if (e.counter === 'flush' && (e.flush -= dt) <= 0) {
    const F = CONFIG.bossCounters.flush, p = game.player;
    game.flares.push({ x: p.x, y: p.y, radius: F.flare, life: F.seconds }); burnGrass(p.x, p.y, F.burn);
    e.flush = F.every; burst(p.x, p.y, '#fff0a0', 16); sound.play('zap', e);
  }
}
// Harsh only, at phase 2: flush a player who spent the run hidden, or rush one who fights from long range.
function counterPlayer(e) {
  const B = CONFIG.bossCounters, s = game.stats;
  e.counter = s.hiddenTime >= game.time * B.hiddenRatio ? 'flush' : s.hits && s.hitRange / s.hits >= B.longRange ? 'rush' : null;
  if (!e.counter) return;
  if (e.counter === 'rush') e.speed *= B.rush.speed; else e.flush = B.flush.every;
  notify(t(`counter.${e.counter}`, { name: t(`enemy.${e.kind}`) }));
}
// Attack-interval multiplier from the rush counter.
const counterPace = e => e.counter === 'rush' ? CONFIG.bossCounters.rush.pace : 1;
const sniperAim = e => (e.phase === 2 ? CONFIG.boss.sniper.phase2.aim : CONFIG.boss.sniper.aim) * counterPace(e);
// Commander attacks on top of its melee chase: aimed volleys, lobbed bombs, minion summons; phase 2 adds speed, pace and bullet rings.
function updateCommander(e, dt) {
  const C = CONFIG.boss.commander, p = game.player;
  if (!hunting(e)) return;
  const pace = (e.phase === 2 ? C.phase2.pace : 1) * counterPace(e), aim = angleTo(e, p);
  e.volley -= dt; e.bombs -= dt; e.summon -= dt; e.ring -= dt;
  if (e.volley <= 0 && clearSight(e, p)) {
    for (let i = 0; i < C.volley.count; i++) enemyShot(e, aim + (i - (C.volley.count - 1) / 2) * C.volley.spread, C.volley);
    e.volley = C.volley.interval * pace; sound.play('enemyShot', e);
  }
  if (e.bombs <= 0 && distance(e, p) < C.bombs.range) {
    const b = C.bombs;
    for (let i = 0; i < (e.phase === 2 ? C.phase2.bombs : b.count); i++) game.bombs.push({ x: p.x + rand(-b.scatter, b.scatter) * Math.min(i, 1), y: p.y + rand(-b.scatter, b.scatter) * Math.min(i, 1), time: b.fall, fall: b.fall, radius: b.blast, damage: enemyDamage(b), enemyDamage: enemyDamage(b), owner: e, source: e.kind });
    e.bombs = b.interval * pace; sound.play('fuse', e);
  }
  if (e.summon <= 0) {
    for (let i = 0; i < C.summon.count && game.enemies.length < CONFIG.waves.maxAlive; i++) spawnNear(C.summon.kinds[i % C.summon.kinds.length], e, e.radius + C.summon.distance, { noLoot: true });
    if (e.phase === 2) for (let i = 0; i < C.phase2.medics && game.enemies.length < CONFIG.waves.maxAlive; i++) spawnNear('medic', e, e.radius + C.summon.distance, { noLoot: true });
    e.summon = C.summon.interval * pace; burst(e.x, e.y, CONFIG.enemies.commander.color, 16);
  }
  if (e.phase === 2 && e.ring <= 0) {
    for (let i = 0; i < C.phase2.ring; i++) enemyShot(e, aim + i * Math.PI * 2 / C.phase2.ring, C.volley);
    e.ring = C.phase2.ringInterval; sound.play('enemyShot', e);
  }
}
// Sniper: aims with a laser (tracking, then locked), fires (a burst in phase 2), then relocates to distant grass.
function updateSniper(e, dt) {
  const S = CONFIG.boss.sniper, p = game.player;
  if (e.burstLeft > 0) {
    if ((e.burstTimer -= dt) <= 0) { sniperShot(e); e.burstLeft--; e.burstTimer = S.phase2.gap; if (!e.burstLeft) relocate(e); }
    return;
  }
  if (e.cover) {
    steer(e, angleTo(e, e.cover), CONFIG.enemies.sniper.speed * e.speed * S.relocateSpeed, dt);
    if (distance(e, e.cover) < 16) e.cover = null;
    return;
  }
  if (!hunting(e)) { e.aiming = 0; return; }
  const aim = sniperAim(e);
  if (!e.aiming) sound.play('laser', e);
  e.aiming += dt;
  if (e.aiming < aim - S.lock) e.aimAt = { x: p.x, y: p.y };
  if (e.aiming < aim) return;
  e.aiming = 0; sniperShot(e);
  e.burstLeft = e.phase === 2 ? S.phase2.burst - 1 : 0; e.burstTimer = S.phase2.gap;
  if (!e.burstLeft) relocate(e);
}
function sniperShot(e) { enemyShot(e, angleTo(e, e.aimAt), CONFIG.boss.sniper.shot); sound.play('rail', e); }
function relocate(e) {
  const S = CONFIG.boss.sniper, p = game.player;
  const spots = game.bushes.filter(r => !r.burned).map(rectCenter).filter(c => distance(c, p) >= S.cover && passable(c.x, c.y, e.radius));
  e.cover = spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
}
// Hive: hatches brood and lobs acid at the player while hunting.
function updateHive(e, dt) {
  const H = CONFIG.boss.hive, A = H.acid, p = game.player;
  if (!hunting(e)) return;
  const pace = (e.phase === 2 ? H.phase2.pace : 1) * counterPace(e);
  e.brood -= dt; e.acid -= dt;
  if (e.brood <= 0) {
    for (let i = 0; i < H.brood.count && game.enemies.length < CONFIG.waves.maxAlive; i++) spawnNear(H.brood.kind, e, e.radius + H.brood.distance, { noLoot: true, hpScale: H.brood.hp, radius: H.brood.radius });
    e.brood = H.brood.interval * pace; burst(e.x, e.y, CONFIG.enemies.hive.color, 12);
  }
  if (e.acid <= 0 && distance(e, p) < A.range) {
    for (let i = 0; i < (e.phase === 2 ? H.phase2.acid : A.count); i++) game.bombs.push({ x: p.x + rand(-A.scatter, A.scatter) * Math.min(i, 1), y: p.y + rand(-A.scatter, A.scatter) * Math.min(i, 1), time: A.fall, fall: A.fall, radius: A.radius, acid: true, enemyDamage: enemyDamage(A), owner: e, source: e.kind });
    e.acid = A.interval * pace; sound.play('fuse', e);
  }
}
// Lobbed hazards land after `fall`: commander bombs explode and burn grass, hive acid leaves a pool.
// The incinerator lays a telegraphed ring of fire around the player's last position.
function updateIncinerator(e, dt) {
  if (!hunting(e)) return;
  const B = CONFIG.boss.incinerator, p = game.player;
  e.fireTimer -= dt;
  if (e.fireTimer > 0) return;
  const count = B.count, damage = enemyDamage(B);
  for (let i = 0; i < count; i++) {
    const angle = i * Math.PI * 2 / count, x = clamp(p.x + Math.cos(angle) * B.ringRadius, 0, CONFIG.world.width), y = clamp(p.y + Math.sin(angle) * B.ringRadius, 0, CONFIG.world.height);
    game.bombs.push({ x, y, time: B.fall, fall: B.fall, radius: B.radius, damage, enemyDamage: damage, playerDamage: damage, seconds: B.seconds, fire: true, enemyScale: CONFIG.environment.enemyBlastDamage, owner: e, source: e.kind });
  }
  e.fireTimer = (e.phase === 2 ? B.phase2Interval : B.interval) * counterPace(e);
  sound.play('fuse', e);
}
function updateBombs(dt) {
  for (let i = game.bombs.length - 1; i >= 0; i--) {
    const b = game.bombs[i];
    if ((b.time -= dt) > 0) continue;
    game.bombs.splice(i, 1);
    if (b.fire) environmentCreateFirePool(b.x, b.y, b.radius, b.seconds, b.enemyDamage, b.source, b.owner, b.playerDamage, b.enemyScale);
    else if (b.acid) { game.pools.push({ kind: 'acid', x: b.x, y: b.y, radius: b.radius, life: CONFIG.boss.hive.acid.seconds, damage: b.enemyDamage, source: b.source, owner: b.owner, enemyTick: 0 }); burst(b.x, b.y, '#a6e36b', 14); }
    else explode(b.x, b.y, 0, { blast: b.radius, burn: true, playerDamage: b.damage, hurtBy: b.source, enemyDamage: b.enemyDamage, exclude: b.owner });
  }
}
// Recon drone: drifts toward the player over walls; scanning the player exposes them and raises an alarm.
function updateScout(e, dt, d) {
  const s = CONFIG.enemies.scout, p = game.player, W = CONFIG.world, speed = s.speed * e.speed * s.wanderSpeed, edge = W.borderMargin + e.radius;
  e.wanderTime -= dt;
  if (e.wanderTime <= 0) { e.direction = angleTo(e, p) + rand(-1.4, 1.4); e.wanderTime = rand(...CONFIG.enemies.wanderInterval); }
  e.x = clamp(e.x + Math.cos(e.direction) * speed * dt, edge, W.width - edge); e.y = clamp(e.y + Math.sin(e.direction) * speed * dt, edge, W.height - edge);
  e.facing = e.direction; e.state = e.special > s.scanCooldown - .8 ? 'alert' : 'wander';
  if (d < s.scan * e.reconScale && e.special <= 0) {
    p.revealedUntil = Math.max(p.revealedUntil, game.time + s.revealSeconds);
    alertNoise(p.x, p.y, s.alarm * e.reconScale); markDetected(CONFIG.alert.scan); e.special = s.scanCooldown / e.reconScale; sound.play('beep', e); failChallenge('ghost');
  }
}
// Searchers sweep random points inside grass near the search spot (or open ground when none is near).
function sweepPoint(goal) {
  const S = CONFIG.search, near = game.bushes.filter(r => !r.burned && circleRect(goal.x, goal.y, S.radius, r));
  if (near.length) { const r = near[Math.floor(Math.random() * near.length)]; return { x: rand(r.x, r.x + r.w), y: rand(r.y, r.y + r.h) }; }
  const a = rand(0, Math.PI * 2), reach = rand(0, S.radius);
  return { x: goal.x + Math.cos(a) * reach, y: goal.y + Math.sin(a) * reach };
}
function updateSearch(e, stats, speed, dt) {
  const S = CONFIG.search;
  if ((e.searchTime -= dt) <= 0) { e.state = 'wander'; e.wanderTime = 0; return; }
  if (!e.arrived) {
    if (distance(e, e.goal) > S.arrive + e.radius) { steer(e, angleTo(e, e.goal), speed * S.speed * e.patrolScale, dt); return; }
    e.arrived = true; e.sweep = sweepPoint(e.goal);
  }
  if (distance(e, e.sweep) < S.arrive) e.sweep = sweepPoint(e.goal);
  steer(e, angleTo(e, e.sweep), speed * S.speed * .7 * e.patrolScale, dt);
  if (stats.projectileSpeed && e.cooldown <= 0) { gunnerShot(e, stats, angleTo(e, e.sweep)); e.cooldown = S.reconFire / e.reconScale; }
  if (stats.flareEvery && e.special <= 0) {
    game.flares.push({ x: e.goal.x, y: e.goal.y, radius: stats.flareRadius, life: stats.flareSeconds });
    e.special = stats.flareEvery; burst(e.goal.x, e.goal.y, '#fff0a0', 16); sound.play('zap', e);
  }
}
// Flamethrower: closes to 60% of reach and hurts the player inside its cone.
function flame(e, stats, d, speed, dt) {
  const p = game.player;
  if (d > stats.reach * .6) steer(e, angleTo(e, p), speed * .5, dt);
  if (e.cooldown > 0) return;
  e.cooldown = stats.cooldown; sound.play('flame', e);
  for (let i = 0; i < 4; i++) { const a = e.facing + rand(-stats.cone, stats.cone), v = rand(200, 320), life = rand(.25, .4); game.particles.push({ x: e.x + Math.cos(e.facing) * e.radius, y: e.y + Math.sin(e.facing) * e.radius, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color: ['#f6b36b', '#f0a24f', '#ffe08a'][i % 3], life, maxLife: life }); }
  if (Math.abs(angleDiff(angleTo(e, p), e.facing)) < stats.cone && d < stats.reach + p.radius && clearSight(e, p)) hurtPlayer(enemyDamage(stats), e.kind);
}
// States: wander → alert (on sight) → chase/attack; losing sight or hearing noise → search (walk to the spot, sweep grass until
// alert-scaled search time expires).
function updateMedic(e, stats, dt) {
  e.healTimer -= dt;
  if (e.healTimer <= 0) {
    e.healTimer += stats.healEvery;
    for (const ally of game.enemies) {
      if (ally === e || ally.hp <= 0 || ally.hp >= ally.maxHp || distance(e, ally) > stats.healRadius) continue;
      ally.hp += Math.min(ally.maxHp - ally.hp, ally.maxHp * stats.healFraction);
      burst(ally.x, ally.y, '#83e0a3', 7);
    }
  }
  e.wanderTime -= dt;
  if (e.wanderTime <= 0) { e.direction = rand(-Math.PI, Math.PI); e.wanderTime = rand(...CONFIG.enemies.wanderInterval); }
  steer(e, e.direction, stats.speed * e.speed * stats.wanderSpeed, dt);
}
function updateEnemy(e, dt) {
  if (e.hp <= 0) return;
  const p = game.player, stats = CONFIG.enemies[e.kind], d = distance(e, p), speed = stats.speed * e.speed * (guarded(e) ? CONFIG.captains.speed : 1);
  if (e.affix === 'regen') e.hp = Math.min(e.maxHp, e.hp + CONFIG.elites.affixes.regen.rate * e.maxHp * dt);
  e.cooldown -= dt; e.special -= dt; e.hit = Math.max(0, e.hit - dt); e.blocked = Math.max(0, e.blocked - dt); e.bladeCooldown -= dt; e.reveal -= dt;
  if (e.stunnedUntil > game.time) return;
  if (e.kind === 'scout') { updateScout(e, dt, d); return; }
  if (e.kind === 'medic') { updateMedic(e, stats, dt); return; }
  if (e.fuse > 0) {
    e.fuse -= dt; e.facing = angleTo(e, p);
    steer(e, e.facing, speed * stats.fuseSpeed, dt);
    if (e.fuse <= 0) detonate(e);
    return;
  }
  const detect = !isHidden() || d < (stats.sense ?? 0) || (e.state === 'search' && d < CONFIG.search.probe);
  const visible = stealthVisibility(e, p, d, detect && d < stats.sight * e.sightScale * CONFIG.variants[game.variant].sight && enemySight(e, p), dt);
  const melee = !stats.projectileSpeed && !stats.fuse && !stats.cone && stats.damage > 0;
  const look = e.state === 'wander' ? e.direction : e.state === 'search' ? angleTo(e, e.arrived ? e.sweep : e.goal) : angleTo(e, p);
  const maxTurn = (stats.turnRate ?? Infinity) * dt;
  e.facing += clamp(angleDiff(look, e.facing), -maxTurn, maxTurn);
  if (visible) {
    if (!e.wasVisible) markDetected(CONFIG.alert.detection);
    e.wasVisible = true;
    e.lastSeen = { x: p.x, y: p.y }; failChallenge('ghost');
    if (e.state === 'wander') { e.state = 'alert'; e.alertTime = CONFIG.enemies.alertSeconds; }
    if (e.state === 'alert') { e.alertTime -= dt; if (e.alertTime <= 0) e.state = 'chase'; }
    else e.state = d <= stats.reach ? 'attack' : 'chase';
  } else {
    e.wasVisible = false;
    if (e.state === 'alert' || hunting(e)) { const spot = e.lastSeen ?? p; startSearch(e, spot.x, spot.y); }
  }
  if (stealthUpdateEnemy(e, dt, d, visible)) return;
  if (e.cover) { /* sniper relocating: moved by updateSniper */ }
  else if (e.state === 'wander') {
    e.wanderTime -= dt;
    if (e.wanderTime <= 0) { e.direction = rand(-Math.PI, Math.PI); e.wanderTime = rand(...CONFIG.enemies.wanderInterval); }
    steer(e, e.direction, speed * stats.wanderSpeed, dt);
  } else if (e.state === 'search') updateSearch(e, stats, speed, dt);
  else if (e.mark && hunting(e)) {
    steer(e, angleTo(p, e), speed, dt);
    if (stats.projectileSpeed && e.cooldown <= 0 && d <= stats.reach) { gunnerShot(e, stats, angleTo(e, p)); e.cooldown = stats.cooldown; }
  } else if (e.state === 'chase') {
    const weave = stats.weave ? Math.sin(game.time * stats.weaveSpeed + e.seed) * stats.weave : 0;
    if (stats.reach > 0) steer(e, angleTo(e, p) + weave, speed, dt);
  } else if (e.state === 'attack') {
    if (stats.fuse) { e.fuse = stats.fuse; sound.play('fuse', e); }
    else if (stats.cone) flame(e, stats, d, speed, dt);
    else if (melee) {
      if (e.cooldown <= 0 && d < stats.reach + p.radius) { hurtPlayer(enemyDamage(stats), e.kind); e.cooldown = stats.cooldown; e.reveal = stats.revealSeconds ?? 0; }
    } else {
      if (d < stats.reach * stats.retreatRatio) steer(e, angleTo(p, e), speed * stats.retreatSpeed, dt);
      if (e.cooldown <= 0) { gunnerShot(e, stats, angleTo(e, p)); e.cooldown = stats.cooldown; }
    }
  }
  if (stats.burn && e.state !== 'wander' && e.special <= 0) {
    const bx = e.x + Math.cos(e.facing) * (e.radius + stats.burn), by = e.y + Math.sin(e.facing) * (e.radius + stats.burn);
    if (game.bushes.some(r => !r.burned && circleRect(bx, by, stats.burn, r))) { burnGrass(bx, by, stats.burn); e.special = stats.burnEvery; sound.play('flame', e); }
  }
  if (stats.boss) updateBoss(e, dt);
  if (melee && hunting(e) && d < e.radius + p.radius + 2 && e.cooldown <= 0) {
    hurtPlayer(enemyDamage(stats), e.kind); e.cooldown = stats.cooldown; e.reveal = stats.revealSeconds ?? 0;
  }
}
function segmentCircle(x1, y1, x2, y2, target, radius) {
  const dx = x2 - x1, dy = y2 - y1, t = clamp(((target.x - x1) * dx + (target.y - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(x1 + t * dx - target.x, y1 + t * dy - target.y) <= radius;
}
function bulletTargetIn(b, nx, ny, objects) {
  if (objects) for (const o of objects) {
    if ((!o.station || o.hp > 0) && !b.hits?.has(o) && !(o.fuse > 0 && o.barrel) && segmentCircle(b.x, b.y, nx, ny, o, o.radius + b.radius)) return o;
  }
  return null;
}
// Ricochet bullets reflect off the wall face they hit (the axis whose move alone collides) while bounces remain. Any bullet hitting a
// wooden wall damages it. Launcher shells explode where they stop instead of hitting directly; crossbow bolts drop where they stop.
function updateBullets(dt) {
  const W = CONFIG.world;
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i], nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    b.traveled += Math.hypot(nx - b.x, ny - b.y);
    const wall = game.walls.find(r => lineRect(b.x, b.y, nx, ny, r));
    if (wall && b.bounces > 0) {
      if (wall.wood) damageWood(wall, b.damage);
      if (game.walls.some(r => lineRect(b.x, b.y, nx, b.y, r))) b.vx = -b.vx; else b.vy = -b.vy;
      b.bounces--; b.hits?.clear();
      if (b.buildEvolution === 'shotgun' && !b.buildFragmentsDone) game.bullets.push(...buildBulletBounce(b));
      burst(b.x, b.y, '#d9caa7', 3); continue;
    }
    let target = null, spent = false;
    if (!wall) do {
      if (b.friendly) target = bulletTargetIn(b, nx, ny, game.enemies) ?? bulletTargetIn(b, nx, ny, game.chests) ?? bulletTargetIn(b, nx, ny, game.barrels) ?? bulletTargetIn(b, nx, ny, game.lights) ?? bulletTargetIn(b, nx, ny, missionDishes()) ?? bulletTargetIn(b, nx, ny, game.stealth?.stations);
      else target = environmentBulletTarget(b, b.x, b.y, nx, ny);
      spent = !!target;
      if (target && !b.blast) {
        if (target === game.player) hurtPlayer(b.damage, b.source);
        else if (target.agent) hurtAgent(b.damage);
        else if (target.dish) damageDish(target, b.damage);
        else if (target.station) stealthDamageStation(target, b.damage);
        else if (target.kind) { if (b.friendly) damageEnemy(target, b); else environmentDamageEnemy(target, b); if (b.pierce > 0) { b.pierce--; b.hits.add(target); spent = false; } }
        else if (target.barrel) damageBarrel(target, b.damage);
        else if (target.light) damageLight(target, b.damage);
        else damageChest(target, b.damage);
      }
    } while (target && !spent);
    if (spent || wall || b.traveled >= b.range || nx < 0 || ny < 0 || nx > W.width || ny > W.height) {
      game.bullets.splice(i, 1);
      const at = wall ? { x: b.x, y: b.y } : { x: clamp(nx, W.borderMargin, W.width - W.borderMargin), y: clamp(ny, W.borderMargin, W.height - W.borderMargin) };
      if (b.blast) explode(at.x, at.y, b.damage, { blast: b.blast, source: b.source, ambush: b.ambush, cluster: b.cluster, clusterDepth: b.clusterDepth, angle: Math.atan2(b.vy, b.vx) });
      else if (wall) { burst(nx, ny, wall.wood ? '#b58a55' : '#d9caa7', 3); if (wall.wood) damageWood(wall, b.damage); }
      if (b.bolt) game.loot.push({ ...at, kind: 'bolt', amount: 1, age: 0, phase: rand(0, 6) });
    } else { b.x = nx; b.y = ny; }
  }
}
// Silent takedown target: nearest non-boss enemy in reach that is unaware or facing away.
function takedownTarget() {
  const p = game.player, T = CONFIG.takedown, reach = T.range * (1 + perk('predator') * P.predator.takedown);
  let best = null, bestGap = Infinity;
  for (const e of game.enemies) {
    const gap = distance(e, p) - e.radius;
    if (CONFIG.enemies[e.kind].boss || gap > reach || gap >= bestGap) continue;
    if (e.state === 'wander' || e.state === 'search' || Math.abs(angleDiff(angleTo(e, p), e.facing)) > T.backArc) { best = e; bestGap = gap; }
  }
  return best;
}
// Takedowns kill outright (ignoring shields and armor), make no noise and count as ambush kills.
function takedown() {
  const p = game.player, e = takedownTarget();
  if (!e || p.takedownCooldown > 0) return;
  p.takedownCooldown = CONFIG.takedown.cooldown; game.stats.takedowns++; progressChallenge('takedowns');
  if (perk('payback')) p.paybackShots = perk('payback');
  if (perk('shadeCircuit')) {
    const S = P.shadeCircuit;
    if (++p.shadeCircuitProgress >= S.takedowns) {
      p.shadeCircuitProgress = 0;
      if (p.items.decoy < CONFIG.throwables.carry) {
        p.items.decoy = Math.min(CONFIG.throwables.carry, p.items.decoy + S.decoys);
        burst(p.x, p.y, '#9fe3ff', 14); sound.play('scrap');
      }
      updateHUD();
    }
  }
  p.facing = angleTo(p, e); burst(e.x, e.y, '#fff0d1', 10); sound.play('takedown', e);
  hitEnemyBody(e, Infinity, 'takedown', true);
}
// Throws land at the cursor (clamped to range, stopped short of walls) after `flight` seconds.
function throwItem() {
  const p = game.player, T = CONFIG.throwables, kind = p.throwKind;
  if (!p.items[kind]) { notify(t('toast.noThrowable', { name: t(`throw.${kind}.title`) })); return; }
  const camera = getCamera(), target = { x: game.mouse.x + camera.x, y: game.mouse.y + camera.y }, a = angleTo(p, target), reach = Math.min(T.range, distance(p, target));
  let to = { x: p.x, y: p.y };
  for (let s = 8; s <= reach; s += 8) { const x = p.x + Math.cos(a) * s, y = p.y + Math.sin(a) * s; if (!passable(x, y, 4)) break; to = { x, y }; }
  p.items[kind]--; game.throws.push({ kind, from: { x: p.x, y: p.y }, to, time: 0 });
  sound.play('toss'); updateHUD();
}
function cycleThrowable() {
  const keys = Object.keys(CONFIG.throwables.items), p = game.player;
  p.throwKind = keys[(keys.indexOf(p.throwKind) + 1) % keys.length];
  notify(t('toast.throwable', { name: t(`throw.${p.throwKind}.title`), count: p.items[p.throwKind] })); updateHUD();
}
// Class skill on Space: ranger rolls (invulnerable), engineer plants a mine, heavy braces (damage reduction), marksman focuses
// (damage, no jitter), medic patches up (instant heal).
function useSkill() {
  const p = game.player, s = classInfo().skill;
  if (p.skillCooldown > 0) return;
  const level = game.daily ? 0 : masteryLevel(game.cls);
  if (game.cls === 'ranger') {
    let { dx, dy } = moveInput();
    if (!dx && !dy) { dx = Math.cos(p.facing); dy = Math.sin(p.facing); }
    p.dash = { time: s.seconds, vx: dx * s.distance / s.seconds, vy: dy * s.distance / s.seconds }; p.invulnerable = Math.max(p.invulnerable, s.seconds);
    if (level >= CONFIG.mastery.skillLevel) p.masteryStealthUntil = game.time + CONFIG.mastery.dodgeStealth;
  } else if (game.cls === 'engineer') {
    if (game.gadgets.filter(g => g.kind === 'mine').length >= s.max) { notify(t('toast.mineMax', { max: s.max })); return; }
    game.gadgets.push({ kind: 'mine', x: p.x, y: p.y, age: 0, smokeOnDetonate: level >= CONFIG.mastery.skillLevel });
  } else if (game.cls === 'heavy') {
    p.bulwark = s.seconds;
    if (level >= CONFIG.mastery.skillLevel) for (const e of game.enemies) if (!CONFIG.enemies[e.kind].boss && distance(e, p) < CONFIG.mastery.heavyPulseRadius) {
      e.stunnedUntil = Math.max(e.stunnedUntil ?? 0, game.time + CONFIG.mastery.heavyStunSeconds); burst(e.x, e.y, '#9fe3ff', 6);
    }
  } else if (game.cls === 'marksman') p.focus = s.seconds;
  else {
    p.hp = Math.min(p.maxHp, p.hp + s.heal);
    if (level >= CONFIG.mastery.skillLevel) game.gadgets.push({ kind: 'medicField', x: p.x, y: p.y, age: 0, pulse: 0, life: CONFIG.mastery.medicFieldSeconds, radius: CONFIG.mastery.medicArea });
    burst(p.x, p.y, '#e58582', 12); sound.play('heal');
  }
  p.skillCooldown = s.cooldown; burst(p.x, p.y, '#e9e597', 10); sound.play('skill'); updateHUD();
}
function moveInput() {
  let dx = Number(game.keys.has('d') || game.keys.has('arrowright')) - Number(game.keys.has('a') || game.keys.has('arrowleft'));
  let dy = Number(game.keys.has('s') || game.keys.has('arrowdown')) - Number(game.keys.has('w') || game.keys.has('arrowup'));
  const len = Math.hypot(dx, dy);
  if (len) { dx /= len; dy /= len; }
  return { dx, dy };
}
// Thrown items in flight, landed gadgets (decoy pulses, smoke clouds, grenade fuses, engineer mines), flares and acid pools.
function updateGadgets(dt) {
  const T = CONFIG.throwables, I = T.items, mine = CONFIG.classes.engineer.skill, p = game.player;
  for (let i = game.throws.length - 1; i >= 0; i--) {
    const th = game.throws[i];
    if ((th.time += dt) < T.flight) continue;
    game.throws.splice(i, 1);
    const { x, y } = th.to, item = I[th.kind];
    if (environmentLandThrowable(th.kind, x, y)) continue;
    game.gadgets.push({ kind: th.kind, x, y, age: 0, pulse: 0, life: item.seconds, radius: item.radius });
    if (th.kind === 'smoke') burst(x, y, '#d8dccf', 24);
  }
  for (let i = game.gadgets.length - 1; i >= 0; i--) {
    const g = game.gadgets[i]; g.age += dt;
    if (g.kind === 'decoy' && (g.pulse -= dt) <= 0) { g.pulse = I.decoy.pulse; alertNoise(g.x, g.y, I.decoy.noise); sound.play('beep', g); }
    if (g.kind === 'medicField' && (g.pulse -= dt) <= 0) {
      g.pulse = CONFIG.mastery.medicFieldPulse;
      if (distance(p, g) < g.radius) { const hp = p.hp; p.hp = Math.min(p.maxHp, p.hp + CONFIG.mastery.medicFieldHeal); if (p.hp > hp) updateHUD(); }
    }
    const boom = g.kind === 'grenade' ? g.age >= I.grenade.fuse : g.kind === 'mine' && g.age >= mine.arm && game.enemies.some(e => e.kind !== 'scout' && distance(e, g) < mine.trigger + e.radius);
    if (boom) {
      const cfg = g.kind === 'mine' ? mine : I.grenade;
      game.gadgets.splice(i, 1); explode(g.x, g.y, Math.round(cfg.damage * waveScale() * (g.damageScale ?? 1)), { blast: cfg.blast, source: g.kind });
      if (g.kind === 'mine' && g.smokeOnDetonate) game.gadgets.push({ kind: 'smoke', x: g.x, y: g.y, age: 0, life: CONFIG.mastery.engineerSmokeSeconds, radius: CONFIG.mastery.engineerSmokeRadius });
    } else if (g.life !== undefined && g.age >= g.life) game.gadgets.splice(i, 1);
  }
  for (let i = game.flares.length - 1; i >= 0; i--) if ((game.flares[i].life -= dt) <= 0) game.flares.splice(i, 1);
  for (let i = game.pools.length - 1; i >= 0; i--) {
    const pool = game.pools[i];
    if ((pool.life -= dt) <= 0) { game.pools.splice(i, 1); continue; }
    if (pool.kind === 'fire') {
      if (harsh() && !game.daily && !inTerrain(p, game.ponds) && distance(pool, p) < pool.radius + p.radius * .5) hurtPlayer(pool.playerDamage ?? CONFIG.environment.playerFireDamage, 'fire');
    } else if (distance(pool, p) < pool.radius + p.radius * .5) hurtPlayer(enemyDamage(CONFIG.boss.hive.acid), 'hive');
  }
}
function update(dt) {
  if (game.mode !== 'playing') return;
  if (game.daily || !mutator('noDecay')) game.alert = Math.max(0, game.alert - CONFIG.alert.decayPerSecond * dt);
  game.time += dt;
  const p = game.player; p.cooldown -= dt; p.invulnerable = Math.max(0, p.invulnerable - dt); game.flash = Math.max(0, game.flash - dt); game.shake *= .82;
  if (perk('hunterFocus') && !p.hunterFocusReady) {
    p.hunterFocusIdle += dt;
    if (p.hunterFocusIdle >= P.hunterFocus.seconds) p.hunterFocusReady = true;
  }
  p.skillCooldown -= dt; p.takedownCooldown -= dt; p.bulwark -= dt; p.focus -= dt;
  if ((game.comboTimer -= dt) <= 0) game.combo = 0;
  if (p.dash) { move(p, p.dash.vx * dt, p.dash.vy * dt); if ((p.dash.time -= dt) <= 0) p.dash = null; }
  else {
    const { dx, dy } = moveInput(), speed = CONFIG.player.speed * gearStats().speed * stealthMoveFactor() * (inTerrain(p, game.ponds) ? CONFIG.player.waterMultiplier : 1);
    if (dx || dy) move(p, dx * speed * dt, dy * speed * dt);
  }
  if (inTerrain(p, game.bushes)) p.bushTime = game.time;
  stealthUpdate(dt);
  environmentUpdate(dt);
  if (game.mode !== 'playing') return;
  for (const r of game.walls) if (r.hit) r.hit = Math.max(0, r.hit - dt);
  updateLights(dt);
  if (perk('mender')) p.hp = Math.min(p.maxHp, p.hp + perk('mender') * P.mender.regen * dt);
  if (perk('thornbound') && !inTerrain(p, game.bushes) && p.hp > 1) p.hp = Math.max(1, p.hp - P.thornbound.drain * dt);
  if (p.reload > 0 && (p.reload -= dt) <= 0) { p.mag[p.reloadGun] = gunStats(p.reloadGun).mag; updateHUD(); }
  const hidden = isHidden(), maxShield = gearStats().maxShield;
  if (hidden) game.stats.hiddenTime += dt;
  if (p.shield < maxShield && hidden && !p.shieldBroken && game.time - p.lastHurt >= CONFIG.player.shieldRegenDelay) p.shield = Math.min(maxShield, p.shield + CONFIG.player.shieldRegenRate * dt);
  const camera = getCamera();
  if (game.mouse.active) p.facing = Math.atan2(game.mouse.y + camera.y - p.y, game.mouse.x + camera.x - p.x);
  if (game.mouse.down && p.cooldown <= 0) shoot();
  for (const e of [...game.enemies]) updateEnemy(e, dt);
  updateAutoWeapons(dt);
  updateBullets(dt);
  updateMissiles(dt);
  updateGadgets(dt);
  updateBombs(dt);
  updateBarrels(dt);
  updateEvent(dt);
  updateMission(dt);
  completeIntelWipe();
  if (game.mode !== 'playing') return;
  const pickup = CONFIG.player.pickupRadius * (1 + perk('magnet') * P.magnet.pickup);
  for (let i = game.loot.length - 1; i >= 0; i--) {
    const item = game.loot[i]; item.age += dt;
    if (distance(item, p) < pickup && !(item.kind === 'bolt' && p.bolts >= CONFIG.weapons.crossbow.ammo)) {
      if (item.kind === 'gold') { p.gold += item.amount; game.earned += item.amount; }
      else if (item.kind === 'scrap') p.scrap += item.amount;
      else if (item.kind === 'bolt') p.bolts += item.amount;
      else p.hp = Math.min(p.maxHp, p.hp + item.amount * (1 + (classInfo().heal ?? 0)));
      burst(item.x, item.y, item.kind === 'gold' ? '#f2d481' : '#b7e5cb', 5); sound.play(item.kind === 'gold' ? 'coin' : item.kind === 'bolt' ? 'scrap' : item.kind);
      game.loot.splice(i, 1); updateHUD();
    } else if (item.age >= CONFIG.loot.pickupLifetime) game.loot.splice(i, 1);
  }
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const part = game.particles[i]; part.x += part.vx * dt; part.y += part.vy * dt; part.life -= dt;
    if (part.life <= 0) game.particles.splice(i, 1);
  }
  if (!game.nextWave) { game.waveClock += dt; updateReinforcements(dt); }
  if (game.waveRemaining > 0) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      const w = CONFIG.waves, batch = Math.min(game.waveRemaining, w.maxBatch, 1 + Math.floor((game.wave - 1) / w.batchEvery), w.maxAlive - game.enemies.length);
      for (let i = 0; i < batch; i++) if (spawnEnemy()) game.waveRemaining--;
      game.spawnTimer = Math.max(w.minSpawnInterval, w.spawnInterval - (game.wave - 1) * w.spawnIntervalStep);
    }
  } else if (!game.enemies.length && game.supplyReady !== false) {
    if (!game.nextWave) {
      if (game.waveSilent) game.stats.silentWaves++;
      game.alert = Math.max(0, game.alert - CONFIG.alert.waveDecay - (game.waveSilent ? CONFIG.alert.silentBonus : 0));
      game.nextWave = CONFIG.waves.intermission; notify(t('toast.cleared')); addScore(CONFIG.score.waveBonus * game.wave);
      buildWaveClear();
      if (challengeOpen(game.challenge?.type) && !challengeGoal()) completeChallenge();
      p.bolts = CONFIG.weapons.crossbow.ammo;
      const cleared = route();
      if (cleared.throwables) grantThrowables(cleared.throwables);
      if (cleared.perkCards) game.perkBonus = cleared.perkCards;
      if (cleared.blitz) blitzReward(cleared.blitz);
      game.route = null;
      if (game.wave % CONFIG.chapters.length === 0) closeChapter();
      game.nextTheme = rollTheme(game.wave + 1);
      if (offerExtraction() || offerPerks() || offerRoute()) return;
    }
    game.nextWave -= dt;
    if (game.nextWave <= 0) { game.wave++; game.route = game.nextRoute; game.nextRoute = null; startWave(); }
  }
  game.chestTimer -= dt;
  if (game.chests.length < CONFIG.chests.minimum && game.chestTimer <= 0) { spawnChest(); game.chestTimer = CONFIG.chests.replenishSeconds; }
  if (performance.now() > game.toastUntil) UI.toast.classList.remove('show');
  updateHUD();
}
// Harsh only, non-boss waves: once the wave clock passes reinforceAt, reinforcements arrive every `every` s (up to max per wave).
function updateReinforcements(dt) {
  const R = CONFIG.reinforcements, p = game.player;
  if (game.waveClock < game.reinforceAt || game.reinforced >= R.max || (game.reinforceTimer -= dt) > 0) return;
  game.reinforceTimer = R.every;
  for (let i = 0; i < R.count && game.reinforced < R.max && game.enemies.length < CONFIG.waves.maxAlive; i++) {
    const kind = R.kinds[game.reinforced % R.kinds.length], pos = freeSpot(CONFIG.enemies[kind].radius, R.distance);
    if (!pos) continue;
    Object.assign(makeEnemy(kind, pos, { noLoot: true }), { state: 'chase', lastSeen: { x: p.x, y: p.y } }); game.reinforced++;
  }
  raiseAlert(R.alert); sound.play('beep'); notify(t('toast.reinforcements'));
}
// Blitz route: clearing the wave within the time limit grants a perk of the listed rarities (seeded perk stream).
function blitzReward(blitz) {
  if (game.waveClock > blitz.seconds) { notify(t('toast.blitzFailed')); return; }
  const open = Object.entries(P).filter(([key, v]) => blitz.rarities.includes(v.rarity) && perkAvailable(key, v));
  if (open.length) grantPerk(open[Math.floor(game.rng.perks() * open.length)][0]);
}
// A cleared boss wave offers extraction before the perk pick.
function offerExtraction() {
  if (!isBossWave()) return false;
  openChoice('extract'); return true;
}
// Searchlight hit flashes fade; a tower lighting the player raises an alarm at most every alarmCooldown seconds.
function updateLights(dt) {
  const L = CONFIG.searchlights, p = game.player;
  for (const l of game.lights) { l.hit = Math.max(0, l.hit - dt); l.alarm -= dt; }
  const lit = litTower(p);
  if (lit && lit.alarm <= 0) { lit.alarm = L.alarmCooldown; alertNoise(p.x, p.y, L.alarm); markDetected(CONFIG.alert.searchlight); sound.play('beep', lit); }
}
// Route reward: random throwables up to carry.
function grantThrowables(count) {
  const p = game.player, keys = Object.keys(CONFIG.throwables.items);
  for (let i = 0; i < count; i++) {
    const open = keys.filter(key => p.items[key] < CONFIG.throwables.carry);
    if (!open.length) break;
    p.items[open[Math.floor(Math.random() * open.length)]]++;
  }
  notify(t('toast.routeReward', { count }));
}
function resize() {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); measureHint();
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
    if (r.wood) {
      // Planks, with cracks spreading as the wall loses HP.
      roundRect(r.x, r.y, r.w, r.h, 3, r.hit > 0 ? '#e8cfa0' : '#8a6a44');
      ctx.strokeStyle = '#5e4429'; ctx.lineWidth = 2; ctx.beginPath();
      for (let y = r.y + 11; y < r.y + r.h - 4; y += 12) { ctx.moveTo(r.x + 3, y); ctx.lineTo(r.x + r.w - 3, y); }
      ctx.stroke();
      const cracks = Math.floor((1 - r.hp / r.maxHp) * 5);
      ctx.strokeStyle = '#2e2216'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < cracks; i++) { const cx = r.x + r.w * (.2 + .15 * i), cy = r.y + r.h * (.3 + .1 * (i % 3)); ctx.moveTo(cx, cy); ctx.lineTo(cx + 9, cy + 7); ctx.lineTo(cx + 4, cy + 15); }
      ctx.stroke();
      continue;
    }
    roundRect(r.x, r.y, r.w, r.h, 4, '#8c917b');
    ctx.fillStyle = '#adb29a'; ctx.fillRect(r.x + 5, r.y + 4, r.w - 10, 8);
    ctx.strokeStyle = '#596656'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x + r.w * .38, r.y + 12); ctx.lineTo(r.x + r.w * .38, r.y + r.h - 3); ctx.moveTo(r.x + r.w * .7, r.y + 14); ctx.lineTo(r.x + r.w * .7, r.y + r.h - 3); ctx.stroke();
  }
}
function drawHealth(x, y, ratio, width) { ctx.fillStyle = '#1b3029'; ctx.fillRect(x - width / 2, y, width, 4); ctx.fillStyle = '#eab08b'; ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), 4); }
function drawChest(c) {
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(-.08);
  roundRect(-21, -15 + 5, 42, 33, 5, '#1a2920a0');
  roundRect(-21, -19, 42, 33, 4, c.hit > 0 ? '#fff2c3' : c.jammer ? '#8a3d32' : c.airdrop ? '#4f6f8f' : '#9f683d');
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
// Searchlight tower: base with the lamp turned along its beam.
function drawTower(l) {
  const a = beamAngle(l);
  ctx.fillStyle = '#10251ca0'; ctx.beginPath(); ctx.ellipse(l.x + 3, l.y + 13, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  roundRect(l.x - 12, l.y - 12, 24, 24, 4, l.hit > 0 ? '#fff0c0' : '#4b5446');
  ctx.strokeStyle = '#8c917b'; ctx.lineWidth = 2; ctx.strokeRect(l.x - 12, l.y - 12, 24, 24);
  ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(l.x + Math.cos(a) * 7, l.y + Math.sin(a) * 7, 5, 0, Math.PI * 2); ctx.fill();
  if (l.hp < CONFIG.searchlights.hp) drawHealth(l.x, l.y - 24, l.hp / CONFIG.searchlights.hp, 30);
}
// Beams are drawn after the darkness overlay (additively, in world space) so they light up the night.
function drawBeams(camera) {
  const L = CONFIG.searchlights;
  if (!game.lights.length) return;
  ctx.save(); ctx.translate(-camera.x, -camera.y); ctx.globalCompositeOperation = 'lighter';
  for (const l of game.lights) {
    const a = beamAngle(l), g = ctx.createRadialGradient(l.x, l.y, 10, l.x, l.y, L.range);
    g.addColorStop(0, 'rgba(255,240,170,.32)'); g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.arc(l.x, l.y, L.range, a - L.halfAngle, a + L.halfAngle); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// Black-market merchant: pulsing trade ring, and the E prompt while the player is within reach.
function drawMerchant(m) {
  const reach = CONFIG.market.reach, near = distance(game.player, m) < reach;
  ctx.strokeStyle = `rgba(243,209,130,${.25 + .2 * Math.sin(game.time * 4)})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(m.x, m.y, reach, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.translate(m.x, m.y);
  ctx.fillStyle = '#10251ca0'; ctx.beginPath(); ctx.ellipse(3, 11, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6fb3a0'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f3d182'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#2d3a33'; ctx.fillRect(-13, -12, 26, 5); ctx.fillRect(-8, -21, 16, 10);
  ctx.fillStyle = '#f3d182'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('¤', 0, 9);
  ctx.restore();
  const label = near ? t('hud.trade') : '¤';
  ctx.font = "bold 12px 'DM Mono', 'Noto Sans TC', sans-serif"; const tw = ctx.measureText(label).width + 12;
  ctx.fillStyle = '#10251cd0'; ctx.fillRect(m.x - tw / 2, m.y - 46, tw, 18); ctx.strokeStyle = '#f3d182'; ctx.lineWidth = 1.5; ctx.strokeRect(m.x - tw / 2, m.y - 46, tw, 18);
  ctx.fillStyle = '#f3d182'; ctx.fillText(label, m.x, m.y - 33);
}
// Lobbed hazards: shrinking target ring until impact (red bombs, green acid); acid pools and flare light on the ground.
function drawHazards() {
  for (const b of game.bombs) {
    const k = 1 - b.time / b.fall, rgb = b.acid ? '166,227,107' : '255,112,80';
    ctx.strokeStyle = `rgba(${rgb},${.4 + .5 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(${rgb},.18)`; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * k, 0, Math.PI * 2); ctx.fill();
  }
  for (const pool of game.pools) {
    ctx.fillStyle = `rgba(140,214,80,${.22 + .1 * Math.sin(game.time * 6 + pool.x)})`; ctx.beginPath(); ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a6e36b88'; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const f of game.flares) {
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
    g.addColorStop(0, `rgba(255,236,150,${.35 * Math.min(1, f.life)})`); g.addColorStop(1, 'rgba(255,236,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + Math.sin(game.time * 20) * 1.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const b of game.blasts) { ctx.strokeStyle = `rgba(255,214,150,${b.life / .35})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * (1.2 - b.life / .35 * .4), 0, Math.PI * 2); ctx.stroke(); }
}
// Event markers: hold zone, intel case and exit zone.
function drawObjectives() {
  const ev = game.event;
  if (!ev?.started || ev.done) return;
  const zone = (pt, radius, progress) => {
    ctx.fillStyle = 'rgba(243,209,130,.1)'; ctx.beginPath(); ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.setLineDash([10, 8]); ctx.strokeStyle = '#f3d182aa'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    if (progress) { ctx.strokeStyle = '#f3d182'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(pt.x, pt.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke(); }
    ctx.fillStyle = '#f3d182'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${Math.ceil(ev.limit)}s`, pt.x, pt.y + 5);
  };
  if (ev.type === 'hold') zone(ev.zone, CONFIG.events.types.hold.radius, ev.progress / CONFIG.events.types.hold.seconds);
  else if (ev.type === 'intel' && ev.carrying) zone(ev.exit, CONFIG.events.types.intel.radius, 0);
  else if (ev.type === 'intel' && !ev.deliveryExpired) {
    const y = ev.item.y + Math.sin(game.time * 4) * 3;
    ctx.save(); ctx.shadowColor = '#9fe3ff'; ctx.shadowBlur = 16; roundRect(ev.item.x - 13, y - 9, 26, 18, 3, '#3d5566');
    ctx.fillStyle = '#9fe3ff'; ctx.fillRect(ev.item.x - 4, y - 12, 8, 4); ctx.fillRect(ev.item.x - 9, y - 2, 18, 3); ctx.restore();
  }
}
// Landed gadgets (decoy beacon, grenade, mine) and throws in flight (arcing toward the landing point).
function drawGadgets() {
  const T = CONFIG.throwables, blink = Math.floor(game.time * 6) % 2;
  for (const g of game.gadgets) {
    if (g.kind === 'decoy') {
      const k = (game.time % T.items.decoy.pulse) / T.items.decoy.pulse;
      ctx.strokeStyle = `rgba(159,227,255,${.6 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x, g.y, 10 + k * 60, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3d5566'; ctx.beginPath(); ctx.arc(g.x, g.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = blink ? '#9fe3ff' : '#e9f7ff'; ctx.fillRect(g.x - 2, g.y - 2, 4, 4);
    } else if (g.kind === 'grenade') {
      ctx.fillStyle = '#35432f'; ctx.beginPath(); ctx.arc(g.x, g.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = blink ? '#ff8a6a' : '#f3d182'; ctx.fillRect(g.x - 1.5, g.y - 8, 3, 3);
      ctx.strokeStyle = 'rgba(255,112,80,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(g.x, g.y, T.items.grenade.blast, 0, Math.PI * 2); ctx.stroke();
    } else if (g.kind === 'mine') {
      const armed = g.age >= CONFIG.classes.engineer.skill.arm;
      ctx.fillStyle = '#4b4f3c'; ctx.beginPath(); ctx.arc(g.x, g.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8c917b'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = armed ? (blink ? '#ff8a6a' : '#7a3a26') : '#f3d182'; ctx.beginPath(); ctx.arc(g.x, g.y, 3, 0, Math.PI * 2); ctx.fill();
    } else if (g.kind === 'medicField') {
      ctx.strokeStyle = `rgba(131,214,160,${.45 + .15 * Math.sin(game.time * 5)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(131,214,160,.1)'; ctx.fill();
    }
  }
  for (const th of game.throws) {
    const k = th.time / T.flight, x = th.from.x + (th.to.x - th.from.x) * k, y = th.from.y + (th.to.y - th.from.y) * k - Math.sin(Math.PI * k) * 40;
    ctx.fillStyle = '#10251c70'; ctx.beginPath(); ctx.ellipse(x, th.from.y + (th.to.y - th.from.y) * k + 4, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = th.kind === 'smoke' ? '#c9cdc0' : th.kind === 'decoy' ? '#9fe3ff' : '#35432f'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  }
}
// Smoke clouds are drawn over units so they visibly hide what is inside.
function drawSmoke() {
  for (const g of game.gadgets) if (g.kind === 'smoke') {
    const fade = Math.min(1, (g.life - g.age) / 1.2, g.age / .3);
    for (let i = 0; i < 7; i++) {
      const a = i * .9 + game.time * .15, r = g.radius * (i ? .55 : .3);
      ctx.fillStyle = `rgba(206,210,196,${.3 * fade})`; ctx.beginPath(); ctx.arc(g.x + Math.cos(a) * r * .8, g.y + Math.sin(a) * r * .8, g.radius * .55, 0, Math.PI * 2); ctx.fill();
    }
  }
}
// Boss mission markers: uplink zone with progress, escorted agent (HP bar) with its exit, radar dishes with scan rings.
function drawMission() {
  const m = activeMission();
  if (!m) return;
  const cfg = CONFIG.missions.types[m.type];
  const ring = (pt, radius, progress, label) => {
    ctx.fillStyle = 'rgba(159,227,255,.1)'; ctx.beginPath(); ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.setLineDash([10, 8]); ctx.strokeStyle = '#9fe3ffaa'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    if (progress) { ctx.strokeStyle = '#9fe3ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(pt.x, pt.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke(); }
    ctx.fillStyle = '#9fe3ff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, pt.x, pt.y + 5);
  };
  if (m.type === 'uplink') ring(m.zone, cfg.radius, m.progress / cfg.seconds, '⌁');
  else if (m.type === 'escort') {
    const a = m.agent;
    ring(m.exit, cfg.reach, 0, '⇱');
    ctx.strokeStyle = '#9fe3ff44'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a.x, a.y, cfg.follow, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = a.hit > 0 ? '#ffffff' : '#6fa6bf'; ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e9f7ff'; ctx.lineWidth = 2; ctx.stroke();
    drawHealth(a.x, a.y - a.radius - 12, a.hp / a.maxHp, 30);
  } else for (const d of missionDishes()) {
    ctx.strokeStyle = '#9fe3ff33'; ctx.lineWidth = 1; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(d.x, d.y, cfg.scan, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = d.hit > 0 ? '#ffffff' : '#9aa6b8'; ctx.fillRect(d.x - 3, d.y - 2, 6, 14);
    ctx.strokeStyle = '#dfe9f2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(d.x, d.y - 4, d.radius - 2, Math.PI * 1.1 + game.time, Math.PI * 1.9 + game.time); ctx.stroke();
    drawHealth(d.x, d.y - d.radius - 14, d.hp / d.maxHp, 30);
  }
}
// Intermission banner: the next wave's size, theme or boss and its likely enemy kinds (theme kinds, or the top roster weights).
function drawPreview(w) {
  const wave = game.wave + 1, theme = game.nextTheme, boss = isBossWave(wave);
  const kinds = theme ? CONFIG.themes.list[theme].kinds : rosterWeights(wave).sort((a, b) => b[1] - a[1]).slice(0, CONFIG.preview.kinds).map(([kind]) => kind);
  const operation = game.nextOperation?.type;
  const head = [t('preview.wave', { wave: String(wave).padStart(2, '0'), count: operation === 'supply' ? 0 : waveCount(wave, game.nextRoute, theme) }), operation && t(`operation.${operation}`), boss && t('preview.boss', { name: t(`enemy.${bossKind(wave)}`) }), operation !== 'supply' && theme && t('preview.theme', { name: t(`theme.${theme}`) })].filter(Boolean).join(' · ');
  const body = operation === 'supply' ? t('operation.supply.desc', { heal: CONFIG.operations.supplyHeal }) : t('preview.kinds', { list: kinds.map(kind => t(`enemy.${kind}`)).join('、') });
  ctx.font = "bold 13px 'DM Mono', 'Noto Sans TC', sans-serif"; ctx.textAlign = 'center';
  const bw = Math.max(ctx.measureText(head).width, ctx.measureText(body).width) + 28, y = 112; // below the toast
  ctx.fillStyle = '#10251cd8'; ctx.fillRect((w - bw) / 2, y, bw, 46); ctx.strokeStyle = '#9fe3ff88'; ctx.lineWidth = 1.5; ctx.strokeRect((w - bw) / 2, y, bw, 46);
  ctx.fillStyle = '#9fe3ff'; ctx.fillText(head, w / 2, y + 19);
  ctx.fillStyle = '#d7e2c6'; ctx.font = "12px 'DM Mono', 'Noto Sans TC', sans-serif"; ctx.fillText(body, w / 2, y + 37);
}
// Screen-edge arrows toward off-screen objectives (hold zone, marked officer, intel case / exit, boss mission), the black-market merchant
// and the wave's last enemy (once no reinforcements remain). The blind-spot modifier hides them all.
function drawPointers(camera, w, h) {
  const ev = game.event, targets = [], m = activeMission();
  if (mutator('blindSpot')) return;
  if (ev?.started && !ev.done) {
    const target = ev.type === 'hold' ? ev.zone : ev.type === 'assassinate' ? ev.mark : ev.type === 'jammer' ? ev.crate : ev.type === 'intel' ? (ev.deliveryExpired ? null : ev.carrying ? ev.exit : ev.item) : null;
    if (target) targets.push([target, ev.type === 'assassinate' ? '#ff8a6a' : '#f3d182']);
  }
  if (m) {
    const dish = missionDishes().sort((a, b) => distance(a, game.player) - distance(b, game.player))[0];
    targets.push([m.zone ?? (m.agent && distance(m.agent, game.player) < CONFIG.missions.types.escort.follow ? m.exit : m.agent) ?? dish, '#9fe3ff']);
  }
  if (game.merchant) targets.push([game.merchant, '#6fb3a0']);
  if (game.mode === 'playing' && game.waveRemaining <= 0 && game.enemies.length === 1) targets.push([game.enemies[0], '#ff5f4f']);
  for (const [target, color] of targets) {
    const sx = target.x - camera.x, sy = target.y - camera.y, m = 26;
    if (sx > 0 && sy > 0 && sx < w && sy < h) continue;
    const cx = w / 2, cy = h / 2, a = Math.atan2(sy - cy, sx - cx), s = Math.min((w / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (h / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
    ctx.save(); ctx.translate(cx + Math.cos(a) * s, cy + Math.sin(a) * s); ctx.rotate(a);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.fill();
    ctx.restore();
  }
}
function drawEnemy(e) {
  const stats = CONFIG.enemies[e.kind], hidden = inTerrain(e, game.bushes), cloaked = isCloaked(e);
  if (e.kind === 'scout') { drawScout(e, stats); return; }
  if (e.kind === 'medic') {
    const pulse = .05 + .035 * Math.sin(game.time * 4);
    ctx.fillStyle = `rgba(131,214,160,${pulse})`; ctx.beginPath(); ctx.arc(e.x, e.y, stats.healRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#83d6a066'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, stats.healRadius, 0, Math.PI * 2); ctx.stroke();
  }
  if (e.fuse > 0) {
    const pulse = Math.floor(game.time * 12) % 2;
    ctx.strokeStyle = `rgba(255,112,80,${pulse ? .75 : .35})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, stats.blast, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,112,80,.16)'; ctx.beginPath(); ctx.arc(e.x, e.y, stats.blast * (1 - e.fuse / stats.fuse), 0, Math.PI * 2); ctx.fill();
  }
  if (e.aiming > 0 && e.aimAt) {
    const locked = e.aiming >= sniperAim(e) - CONFIG.boss.sniper.lock;
    ctx.strokeStyle = locked ? '#ff5a4acc' : '#ff8a6a66'; ctx.lineWidth = locked ? 2 : 1; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.aimAt.x, e.aimAt.y); ctx.stroke();
  }
  ctx.save(); ctx.globalAlpha = cloaked ? (stats.cloakAlpha ?? stats.bushCloak) * (1 + Math.sin(game.time * 5 + e.seed) * .5) : hidden && distance(e, game.player) > CONFIG.enemies.bushRevealDistance ? .18 : 1;
  ctx.translate(e.x, e.y); ctx.fillStyle = '#10251ca0'; ctx.beginPath(); ctx.ellipse(3, 10, e.radius, e.radius / 2, 0, 0, Math.PI * 2); ctx.fill();
  if (e.affix) { const color = CONFIG.elites.affixes[e.affix].color; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, e.radius + 5 + Math.sin(game.time * 6 + e.seed) * 1.5, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  ctx.rotate(e.facing);
  if (e.kind === 'runner') { ctx.strokeStyle = '#f7e7a680'; ctx.lineWidth = 2; ctx.beginPath(); for (const y of [-6, 0, 6]) { ctx.moveTo(-e.radius - 4, y); ctx.lineTo(-e.radius - 14 - Math.abs(y), y); } ctx.stroke(); }
  if (e.kind === 'bomber') { ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(-e.radius + 2, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = e.fuse > 0 && Math.floor(game.time * 12) % 2 ? '#fff4c0' : '#f59a55'; ctx.beginPath(); ctx.arc(-e.radius - 6, -6, 3, 0, Math.PI * 2); ctx.fill(); }
  else if (e.kind === 'flamer') { ctx.fillStyle = '#7a3a26'; ctx.fillRect(-e.radius - 6, -8, 10, 16); ctx.fillStyle = '#3a2a22'; ctx.fillRect(1, -3, 28, 6); ctx.fillStyle = '#f0a24f'; ctx.fillRect(27, -2, 4, 4); }
  else if (e.kind === 'sniper') { ctx.fillStyle = '#26372e'; ctx.fillRect(1, -3, 44, 6); ctx.fillStyle = '#9fe3ff'; ctx.fillRect(14, -6, 8, 3); }
  else if (e.kind !== 'medic') { ctx.fillStyle = '#26372e'; ctx.fillRect(1, -5 * e.radius / 16, 23 * e.radius / 16, 10 * e.radius / 16); }
  ctx.fillStyle = e.hit > 0 || (e.fuse > 0 && Math.floor(game.time * 12) % 2) ? '#fff0d1' : stats.color; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3b3e37'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#26372e'; ctx.fillRect(6, -6, 6, 4); ctx.fillRect(6, 3, 6, 4);
  if (e.kind === 'ranged') { ctx.strokeStyle = '#ede2b6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-3, 0, 7, -1.1, 1.1); ctx.stroke(); }
  else if (e.kind === 'flare') { ctx.fillStyle = '#b8742e'; ctx.fillRect(-9, -9, 7, 18); ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(-5, -9, 3, 0, Math.PI * 2); ctx.fill(); }
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
  else if (e.kind === 'flamer') { ctx.fillStyle = '#3a2a22'; ctx.fillRect(-4, -e.radius + 4, 5, (e.radius - 4) * 2); }
  else if (e.kind === 'commander') {
    ctx.fillStyle = e.phase === 2 ? '#8e2f22' : '#5a3a2e'; ctx.fillRect(-20, -e.radius + 6, 12, (e.radius - 6) * 2);
    ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-2, -4); ctx.lineTo(4, -10); ctx.lineTo(4, 10); ctx.lineTo(-2, 4); ctx.lineTo(-6, 10); ctx.fill();
  }
  else if (e.kind === 'sniper') { ctx.fillStyle = e.phase === 2 ? '#8e2f22' : '#4d5a52'; ctx.beginPath(); ctx.arc(-3, 0, e.radius - 6, Math.PI * .5, Math.PI * 1.5); ctx.fill(); ctx.fillStyle = '#ff8a6a'; ctx.fillRect(10, -2, 4, 4); }
  else if (e.kind === 'hive') {
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + game.time * .6; ctx.fillStyle = e.phase === 2 ? '#e0634e' : '#7d5a9a'; ctx.beginPath(); ctx.arc(Math.cos(a) * 16, Math.sin(a) * 16, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#a6e36b'; ctx.beginPath(); ctx.arc(8, 0, 6, 0, Math.PI * 2); ctx.fill();
  }
  else if (e.kind === 'medic') {
    ctx.fillStyle = '#f2fff5'; ctx.fillRect(-2.5, -8, 5, 16); ctx.fillRect(-8, -2.5, 16, 5);
    ctx.strokeStyle = '#39845a'; ctx.lineWidth = 1; ctx.strokeRect(-2.5, -8, 5, 16); ctx.strokeRect(-8, -2.5, 16, 5);
  }
  else { ctx.fillStyle = '#f2d4a3'; ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(-16, -20); ctx.lineTo(-2, -14); ctx.fill(); }
  ctx.restore();
  if (cloaked) return;
  if (e.hp < e.maxHp && !stats.boss) drawHealth(e.x, e.y - e.radius - 14, e.hp / e.maxHp, 34);
  if (e.kind === 'medic' && e.healTimer < stats.healEvery) {
    ctx.strokeStyle = `rgba(131,224,163,${1 - e.healTimer / stats.healEvery})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 7 + (1 - e.healTimer / stats.healEvery) * 8, 0, Math.PI * 2); ctx.stroke();
  }
  if (e.mark) { ctx.fillStyle = '#ff8a6a'; ctx.beginPath(); ctx.moveTo(e.x - 8, e.y - e.radius - 26); ctx.lineTo(e.x, e.y - e.radius - 18); ctx.lineTo(e.x + 8, e.y - e.radius - 26); ctx.lineTo(e.x, e.y - e.radius - 34); ctx.fill(); }
  // Captain crown; a buffed guard shows a tether to its captain.
  if (e.captain) { ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.moveTo(e.x - 9, e.y - e.radius - 18); ctx.lineTo(e.x - 9, e.y - e.radius - 27); ctx.lineTo(e.x - 4, e.y - e.radius - 22); ctx.lineTo(e.x, e.y - e.radius - 29); ctx.lineTo(e.x + 4, e.y - e.radius - 22); ctx.lineTo(e.x + 9, e.y - e.radius - 27); ctx.lineTo(e.x + 9, e.y - e.radius - 18); ctx.fill(); }
  if (guarded(e)) { ctx.strokeStyle = '#f2c94c55'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.guardOf.x, e.guardOf.y); ctx.stroke(); ctx.setLineDash([]); }
  if (e.state !== 'wander' && !mutator('blindSpot')) { ctx.fillStyle = e.state === 'search' ? '#b9d4e6' : '#f3d182'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e.state === 'search' ? '?' : '!', e.x, e.y - e.radius - 11); }
}
// Recon drone: rotors plus its scan ring (red while it has just spotted the player).
function drawScout(e, stats) {
  const alarmed = e.special > stats.scanCooldown - .8;
  ctx.strokeStyle = alarmed ? '#ff8a6aaa' : '#9fd0e855'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(e.x, e.y, stats.scan, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = '#0b261960'; ctx.beginPath(); ctx.ellipse(3, 14, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d7eef8'; ctx.lineWidth = 1.5;
  for (const [x, y] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) { ctx.beginPath(); ctx.arc(x, y, 5, game.time * 25, game.time * 25 + 2); ctx.stroke(); }
  ctx.fillStyle = e.hit > 0 ? '#fff0d1' : stats.color; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 0); ctx.lineTo(0, 8); ctx.lineTo(-8, 0); ctx.fill();
  ctx.fillStyle = alarmed ? '#ff5a4a' : '#26372e'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (e.hp < e.maxHp) drawHealth(e.x, e.y - e.radius - 14, e.hp / e.maxHp, 34);
}
// Barrel length, width and muzzle color per gun; body, outline and visor colors per skin (rendering only).
const GUN_LOOK = { rifle: [26, 12, '#e3eabc'], smg: [21, 10, '#f3e39a'], shotgun: [25, 15, '#f1c58f'], rail: [35, 8, '#9fe3ff'], crossbow: [22, 8, '#e8d2a0'], launcher: [27, 16, '#ffb36b'] };
const SKIN_LOOK = { default: ['#d3dd9a', '#f2edc7', '#38563b'], shadow: ['#5d6b78', '#aab7c4', '#dfe9f2'], gold: ['#f2ca69', '#fff0a8', '#7a5a1e'], crimson: ['#d9745b', '#f5c0a8', '#4a1f16'], moss: ['#7fa35f', '#c7e0a6', '#26372e'], rangerMastery: ['#71b9ab', '#d0f2d9', '#184d49'], engineerMastery: ['#dab15e', '#fff0a8', '#67501c'], heavyMastery: ['#af8774', '#ead2c4', '#57392f'], marksmanMastery: ['#9daed7', '#e0e9ff', '#344365'], medicMastery: ['#e08b98', '#ffe0e5', '#653643'], masteryElite: ['#ed6a4d', '#ffd5a0', '#5b271f'] };
function drawPlayer(p) {
  const [length, width, muzzle] = GUN_LOOK[p.weapon], [body, outline, visor] = SKIN_LOOK[profile.skin];
  ctx.save(); ctx.globalAlpha = isHidden() ? .58 : p.invulnerable > 0 && Math.floor(game.time * 18) % 2 ? .55 : 1;
  ctx.translate(p.x, p.y); ctx.fillStyle = '#0b261990'; ctx.beginPath(); ctx.ellipse(3, 12, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(p.facing); ctx.fillStyle = '#1f382c'; ctx.fillRect(3, -width / 2, length + 3, width);
  ctx.fillStyle = muzzle; ctx.fillRect(length - 7, -3, 10, 6);
  if (p.weapon === 'shotgun') { ctx.fillStyle = '#1f382c'; ctx.fillRect(length - 7, -1, 10, 2); }
  if (p.weapon === 'crossbow') { ctx.fillStyle = '#7a5a36'; ctx.fillRect(length - 12, -12, 4, 24); }
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = outline; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = visor; ctx.fillRect(5, -6, 5, 4); ctx.fillRect(5, 3, 5, 4);
  if (p.levels.helmet) { ctx.fillStyle = ['#6f8a58', '#5a7249', '#48603c'][p.levels.helmet - 1]; ctx.beginPath(); ctx.arc(-1, 0, p.radius - 3, Math.PI * .55, Math.PI * 1.45); ctx.lineTo(-1, 0); ctx.fill(); }
  if (p.levels.vest) { ctx.strokeStyle = '#4c6443'; ctx.lineWidth = 2 + p.levels.vest; ctx.beginPath(); ctx.arc(0, 0, p.radius - 1, Math.PI * .6, Math.PI * 1.4); ctx.stroke(); }
  ctx.restore();
  const maxShield = gearStats().maxShield;
  if (p.shield > 0 && maxShield) { ctx.strokeStyle = `rgba(150,215,240,${.2 + .6 * p.shield / maxShield})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2); ctx.stroke(); }
  if (p.bulwark > 0) { ctx.strokeStyle = '#f3d182cc'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 9, 0, Math.PI * 2); ctx.stroke(); }
  if (p.focus > 0) { ctx.strokeStyle = '#9fe3ffcc'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  if (p.hunterFocusReady) { ctx.strokeStyle = '#f2d782'; ctx.lineWidth = 3; ctx.shadowColor = '#f2d782'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 13, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  const target = game.mode === 'playing' && p.takedownCooldown <= 0 ? takedownTarget() : null;
  if (target) {
    ctx.fillStyle = '#10251cd0'; ctx.fillRect(target.x - 9, target.y + target.radius + 6, 18, 17);
    ctx.strokeStyle = '#f3d182'; ctx.lineWidth = 1.5; ctx.strokeRect(target.x - 9, target.y + target.radius + 6, 18, 17);
    ctx.fillStyle = '#f3d182'; ctx.font = "bold 12px 'DM Mono', monospace"; ctx.textAlign = 'center'; ctx.fillText('F', target.x, target.y + target.radius + 19);
  }
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
  else if (item.kind === 'bolt') { ctx.rotate(-Math.PI / 4); ctx.fillStyle = '#e8d2a0'; ctx.fillRect(-9, -1.5, 16, 3); ctx.fillStyle = '#c9d4d9'; ctx.beginPath(); ctx.moveTo(7, -4); ctx.lineTo(12, 0); ctx.lineTo(7, 4); ctx.fill(); }
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
  environmentDraw();
  stealthDraw();
  for (const b of game.barrels) drawBarrel(b);
  for (const c of game.chests) drawChest(c);
  for (const l of game.lights) drawTower(l);
  for (const item of game.loot) drawLoot(item);
  if (game.merchant) drawMerchant(game.merchant);
  drawObjectives();
  drawMission();
  drawGadgets();
  for (const e of game.enemies) { drawEnemy(e); stealthDrawEnemy(e); }
  if (game.player) drawPlayer(game.player);
  drawProjectiles();
  for (const part of game.particles) { ctx.globalAlpha = part.life / part.maxLife; ctx.fillStyle = part.color; ctx.fillRect(part.x, part.y, 3, 3); } ctx.globalAlpha = 1;
  drawSmoke();
  ctx.restore();
  drawWeather(camera, w, h);
  drawBeams(camera);
  drawPointers(camera, w, h);
  if (game.mode === 'playing' && game.nextWave > 0) drawPreview(w);
  if (game.boss) {
    const e = game.boss, bw = Math.min(420, w - 80), x = (w - bw) / 2;
    ctx.fillStyle = '#10251cd0'; ctx.fillRect(x - 4, 14, bw + 8, 16);
    ctx.fillStyle = e.phase === 2 ? '#e0634e' : '#e9a071'; ctx.fillRect(x, 18, bw * Math.max(0, e.hp) / e.maxHp, 8);
    ctx.fillStyle = '#f3ecd0'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${t(`enemy.${e.kind}`)}${e.phase === 2 ? ' · II' : ''}`, w / 2, 46);
  }
  if (game.player) {
    const p = game.player, T = CONFIG.throwables.items;
    ctx.textAlign = 'right'; ctx.fillStyle = '#f3ecd0'; ctx.font = "bold 15px 'DM Mono', monospace"; ctx.fillText(`SCORE ${game.score.toLocaleString('en')}`, w - 14, 26);
    if (game.combo > 1) { ctx.fillStyle = '#f3d182'; ctx.font = "bold 12px 'DM Mono', monospace"; ctx.fillText(`COMBO ${game.combo} · ×${scoreMultiplier().toFixed(1)}`, w - 14, 44); }
    const c = game.challenge;
    if (c) {
      const goal = challengeGoal(), state = c.done ? '✓' : c.failed ? '✗' : goal ? `${c.progress}/${goal}` : '…';
      ctx.fillStyle = c.done ? '#b7e5cb' : c.failed ? '#eb9eae' : '#d7e2c6'; ctx.font = "bold 12px 'DM Mono', 'Noto Sans TC', sans-serif";
      ctx.fillText(t('hud.challenge', { name: t(`challenge.${c.type}`), state }), w - 14, 62);
    }
    // Kit line above the key hints: class skill state and throwables (selected one named).
    const items = Object.keys(T).map(key => key === p.throwKind ? `[${T[key].icon} ${t(`throw.${key}.title`)} ×${p.items[key]}]` : `${T[key].icon}×${p.items[key]}`).join(' ');
    const text = t('hud.kit', { skill: t(`class.${game.cls}.skill`), state: p.skillCooldown > 0 ? `${p.skillCooldown.toFixed(1)}s` : t('hud.ready'), item: items });
    ctx.textAlign = 'left'; ctx.font = "bold 12px 'DM Mono', 'Noto Sans TC', sans-serif";
    const tw = ctx.measureText(text).width;
    // Sit just above the key-hint / status bar, whose height changes when its text wraps (see resize()).
    const top = hintTop - 30;
    ctx.fillStyle = '#11211bd6'; ctx.fillRect(14, top, tw + 20, 24);
    ctx.fillStyle = p.skillCooldown > 0 ? '#d7e2c6' : '#f3d780'; ctx.fillText(text, 24, top + 17);
  }
  if (game.flash > 0) { ctx.fillStyle = `rgba(226,71,62,${game.flash * .48})`; ctx.fillRect(0, 0, w, h); }
  if (game.mode === 'playing' && game.mouse.active) {
    ctx.strokeStyle = '#f1edcaaa'; ctx.lineWidth = 1.5; const x = game.mouse.x, y = game.mouse.y;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.moveTo(x - 16, y); ctx.lineTo(x - 6, y); ctx.moveTo(x + 6, y); ctx.lineTo(x + 16, y); ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 6); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 16); ctx.stroke();
  }
}
// Limited vision (night, blackout route, eclipse mutator) darkens all but a lit circle; rain adds falling streaks (rendering only).
function drawWeather(camera, w, h) {
  const p = game.player, vision = p ? visionLimit() : Infinity;
  if (vision < Infinity) {
    const cx = p.x - camera.x, cy = p.y - camera.y, g = ctx.createRadialGradient(cx, cy, vision * .45, cx, cy, vision);
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
$('restartBtn').addEventListener('click', () => startGame(!!game.daily, { training: game.training, seedWeek: game.seedWeek }));
$('menuBtn').addEventListener('click', () => { game.mode = 'menu'; UI.end.hidden = true; UI.start.hidden = false; renderMenu(); });
$('progressBtn').addEventListener('click', () => { $('progressOverlay').hidden = false; });
$('trainingBtn').addEventListener('click', () => { $('trainingOverlay').hidden = false; });
$('trainingClose').addEventListener('click', () => { $('trainingOverlay').hidden = true; });
$('seedChallengeBtn').addEventListener('click', () => startGame(false, { seedWeek: isoWeek() }));
$('progressClose').addEventListener('click', () => { $('progressOverlay').hidden = true; });
$('shareBtn').addEventListener('click', copyShare);
$('shopBtn').addEventListener('click', () => { if (game.mode === 'playing' || game.mode === 'shop') toggleShop(); });
$('closeShop').addEventListener('click', toggleShop);
$('perkClose').addEventListener('click', () => { if (game.mode === 'market') resume(); });
$('skinBtn').addEventListener('click', () => {
  const skins = Object.keys(CONFIG.skins).filter(skinOpen);
  profile.skin = skins[(skins.indexOf(profile.skin) + 1) % skins.length]; saveProfile(); renderMenu();
});
$('seedInput').addEventListener('keydown', event => { if (event.key === 'Enter') startGame(false); });
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
  else if (key === 'escape' && game.mode === 'market') resume();
  else if ((key === 'm' || key === 'n') && !event.repeat) { sound.toggle(key === 'm' ? 'music' : 'sfx'); renderSettings(); }
  else if (game.mode === 'perk' && !event.repeat && key === 'r') rerollPerks();
  else if (game.mode === 'perk' && !event.repeat && key === 'x') armPerkBanish();
  else if (game.mode === 'perk' && !event.repeat && key === 's') skipPerks();
  else if (CHOICE_MODES.includes(game.mode) && !event.repeat && key >= '1' && key <= '9') choose(Number(key) - 1);
  else if (game.mode !== 'playing' || event.repeat) game.keys.add(key);
  else if (key >= '1' && key <= String(GUN_KEYS.length)) equip(GUN_KEYS[Number(key) - 1]);
  else if (key === 'q') cycleWeapon();
  else if (key === ' ') useSkill();
  else if (key === 'f') takedown();
  else if (key === 'g') throwItem();
  else if (key === 't') cycleThrowable();
  else if (key === 'e') openMarket();
  else if (key === 'r') reload();
  else game.keys.add(key);
});
window.addEventListener('keyup', event => game.keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { game.keys.clear(); game.mouse.down = false; });
canvas.addEventListener('pointermove', event => { const rect = canvas.getBoundingClientRect(); game.mouse.x = event.clientX - rect.left; game.mouse.y = event.clientY - rect.top; game.mouse.active = true; });
canvas.addEventListener('pointerdown', event => { if (event.button === 0 && game.mode === 'playing') { game.mouse.down = true; canvas.setPointerCapture(event.pointerId); } });
canvas.addEventListener('pointerup', () => { game.mouse.down = false; });
canvas.addEventListener('pointercancel', () => { game.mouse.down = false; });
// The browser context menu is disabled everywhere on the page (right click does nothing).
document.addEventListener('contextmenu', event => event.preventDefault());
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
// Shared links carry ?seed=<code>, which prefills the seed field.
$('seedInput').value = normalizeSeed(new URLSearchParams(location.search).get('seed') ?? '');
if (locale === DEFAULT_LOCALE) { renderSettings(); renderMenu(); } else applyLocale(locale);
new ResizeObserver(resize).observe(arena); new ResizeObserver(measureHint).observe(arenaBottom); resize(); requestAnimationFrame(frame);
})();
