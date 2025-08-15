// src/data/enemies.js
// Enemy DB + helpers for grid-based sprite sheets.
// Sheet grids (confirmed by your images):
// - Tier 1: 10 columns x 2 rows  (index 0..19 left->right, top->bottom)
// - Tier 2: 5 columns  x 4 rows  (index 0..19)
// - Boss  : 4 columns  x 5 rows  (index 0..19)

export const SHEET_META = {
  T1: { src: "/art/Tier1.png", cols: 10, rows: 2 },
  T2: { src: "/art/Tier2.png", cols: 5, rows: 4 },
  BOSS: { src: "/art/Boss.png", cols: 4, rows: 5 },
};

// A few lightweight target rules the engine can use.
export const TARGET_RULE = {
  LOWEST_ARMOR: "lowestArmor",
  HIGHEST_HP: "highestHp",
  LOWEST_HP: "lowestHp",
  RANDOM: "random",
  NEAREST: "nearest",     // (if you later add positions)
};

// ---- Tier 1 (id 1..20) ----
export const TIER1_ENEMIES = [
  { id: 1,  name: "Cowardly Goblin",    tier: 1, spriteIndex: 0,  ai: TARGET_RULE.LOWEST_ARMOR, hp: 6,  armor: 1, dmg: 2 },
  { id: 2,  name: "Pack Hunter Rat",    tier: 1, spriteIndex: 1,  ai: TARGET_RULE.NEAREST,      hp: 5,  armor: 0, dmg: 2 },
  { id: 3,  name: "Thick-Hide Beetle",  tier: 1, spriteIndex: 2,  ai: TARGET_RULE.HIGHEST_HP,   hp: 7,  armor: 2, dmg: 2 },
  { id: 4,  name: "Unstable Slime",     tier: 1, spriteIndex: 3,  ai: TARGET_RULE.RANDOM,       hp: 4,  armor: 0, dmg: 1 },
  { id: 5,  name: "Distracting Imp",    tier: 1, spriteIndex: 4,  ai: TARGET_RULE.RANDOM,       hp: 6,  armor: 1, dmg: 2 },
  { id: 6,  name: "Quickstep Gremlin",  tier: 1, spriteIndex: 5,  ai: TARGET_RULE.NEAREST,      hp: 5,  armor: 1, dmg: 2 },
  { id: 7,  name: "Torchling",          tier: 1, spriteIndex: 6,  ai: TARGET_RULE.HIGHEST_HP,   hp: 5,  armor: 0, dmg: 2 },
  { id: 8,  name: "Rust Rat",           tier: 1, spriteIndex: 7,  ai: TARGET_RULE.RANDOM,       hp: 4,  armor: 0, dmg: 2 },
  { id: 9,  name: "Cave Flea",          tier: 1, spriteIndex: 8,  ai: TARGET_RULE.RANDOM,       hp: 3,  armor: 1, dmg: 2 },
  { id: 10, name: "Lantern Ghoul",      tier: 1, spriteIndex: 9,  ai: TARGET_RULE.LOWEST_HP,    hp: 6,  armor: 0, dmg: 2 },
  { id: 11, name: "Thorn Crawler",      tier: 1, spriteIndex: 10, ai: TARGET_RULE.RANDOM,       hp: 5,  armor: 2, dmg: 2 },
  { id: 12, name: "Dust Imp",           tier: 1, spriteIndex: 11, ai: TARGET_RULE.RANDOM,       hp: 4,  armor: 0, dmg: 1 },
  { id: 13, name: "Moss Goblin",        tier: 1, spriteIndex: 12, ai: TARGET_RULE.NEAREST,      hp: 7,  armor: 1, dmg: 2 },
  { id: 14, name: "Bone Pecker",        tier: 1, spriteIndex: 13, ai: TARGET_RULE.HIGHEST_HP,   hp: 5,  armor: 1, dmg: 2 },
  { id: 15, name: "Grime Slug",         tier: 1, spriteIndex: 14, ai: TARGET_RULE.RANDOM,       hp: 6,  armor: 0, dmg: 1 },
  { id: 16, name: "Tunnel Snapper",     tier: 1, spriteIndex: 15, ai: TARGET_RULE.NEAREST,      hp: 6,  armor: 2, dmg: 2 },
  { id: 17, name: "Scorch Bug",         tier: 1, spriteIndex: 16, ai: TARGET_RULE.RANDOM,       hp: 3,  armor: 0, dmg: 2 },
  { id: 18, name: "Cinder Rat",         tier: 1, spriteIndex: 17, ai: TARGET_RULE.LOWEST_ARMOR, hp: 4,  armor: 0, dmg: 2 },
  { id: 19, name: "Drip Slime",         tier: 1, spriteIndex: 18, ai: TARGET_RULE.NEAREST,      hp: 4,  armor: 0, dmg: 1 },
  { id: 20, name: "Stone Beetle",       tier: 1, spriteIndex: 19, ai: TARGET_RULE.HIGHEST_HP,   hp: 6,  armor: 2, dmg: 2 },
];

// ---- Tier 2 (id 1..20) ----
export const TIER2_ENEMIES = [
  { id: 1,  name: "Savage Orc",         tier: 2, spriteIndex: 0,  ai: TARGET_RULE.HIGHEST_HP,   hp: 10, armor: 2, dmg: 4 },
  { id: 2,  name: "Vampire Acolyte",    tier: 2, spriteIndex: 1,  ai: TARGET_RULE.LOWEST_HP,    hp: 9,  armor: 1, dmg: 4 },
  { id: 3,  name: "Dark Warden",        tier: 2, spriteIndex: 2,  ai: TARGET_RULE.LOWEST_HP,    hp: 12, armor: 3, dmg: 4 },
  { id: 4,  name: "Blight Spitter",     tier: 2, spriteIndex: 3,  ai: TARGET_RULE.LOWEST_ARMOR, hp: 8,  armor: 1, dmg: 4 },
  { id: 5,  name: "Ghost Knight",       tier: 2, spriteIndex: 4,  ai: TARGET_RULE.RANDOM,       hp: 11, armor: 0, dmg: 4 },
  { id: 6,  name: "Storm Caller",       tier: 2, spriteIndex: 5,  ai: TARGET_RULE.RANDOM,       hp: 9,  armor: 1, dmg: 4 },
  { id: 7,  name: "Flame Revenant",     tier: 2, spriteIndex: 6,  ai: TARGET_RULE.HIGHEST_HP,   hp: 12, armor: 1, dmg: 4 },
  { id: 8,  name: "Abyss Crawler",      tier: 2, spriteIndex: 7,  ai: TARGET_RULE.LOWEST_HP,    hp: 14, armor: 2, dmg: 4 },
  { id: 9,  name: "Rotting Brute",      tier: 2, spriteIndex: 8,  ai: TARGET_RULE.LOWEST_HP,    hp: 16, armor: 1, dmg: 4 },
  { id: 10, name: "Crystal Knight",     tier: 2, spriteIndex: 9,  ai: TARGET_RULE.MOST_UPGRADED, hp: 15, armor: 3, dmg: 4 }, // if you add later
  { id: 11, name: "Frost Warg",         tier: 2, spriteIndex: 10, ai: TARGET_RULE.NEAREST,      hp: 12, armor: 2, dmg: 4 },
  { id: 12, name: "Vile Totem",         tier: 2, spriteIndex: 11, ai: TARGET_RULE.SUPPORT,      hp: 10, armor: 0, dmg: 0 },
  { id: 13, name: "Iron Husk",          tier: 2, spriteIndex: 12, ai: TARGET_RULE.TAUNT,        hp: 18, armor: 4, dmg: 4 },
  { id: 14, name: "Blood Spider",       tier: 2, spriteIndex: 13, ai: TARGET_RULE.LOWEST_HP,    hp: 12, armor: 2, dmg: 4 },
  { id: 15, name: "Sand Revenant",      tier: 2, spriteIndex: 14, ai: TARGET_RULE.RANDOM,       hp: 13, armor: 1, dmg: 4 },
  { id: 16, name: "Cursed Archer",      tier: 2, spriteIndex: 15, ai: TARGET_RULE.FARTHEST,     hp: 11, armor: 1, dmg: 4 },
  { id: 17, name: "Runed Bear",         tier: 2, spriteIndex: 16, ai: TARGET_RULE.TANK,         hp: 17, armor: 3, dmg: 4 },
  { id: 18, name: "Blistering Myconid", tier: 2, spriteIndex: 17, ai: TARGET_RULE.HIGHEST_HP,   hp: 10, armor: 0, dmg: 4 },
  { id: 19, name: "Marrow Fiend",       tier: 2, spriteIndex: 18, ai: TARGET_RULE.LOWEST_ARMOR, hp: 15, armor: 2, dmg: 4 },
  { id: 20, name: "Wicked Collector",   tier: 2, spriteIndex: 19, ai: TARGET_RULE.MOST_UPGRADED, hp: 12, armor: 2, dmg: 4 },
];

// ---- Bosses (id 1..20) ----
export const BOSS_ENEMIES = [
  { id: 1,  name: "Lich King Var’Zhul",     tier: 3, spriteIndex: 0,  ai: TARGET_RULE.LOWEST_ARMOR, hp: 25, armor: 3, dmg: 6 },
  { id: 2,  name: "Infernal Bombardier",    tier: 3, spriteIndex: 1,  ai: TARGET_RULE.MIDDLE,       hp: 30, armor: 2, dmg: 5 },
  { id: 3,  name: "Titan Stonefist",        tier: 3, spriteIndex: 2,  ai: TARGET_RULE.HIGHEST_ARMOR, hp: 40, armor: 5, dmg: 6 },
  { id: 4,  name: "Queen of Shadows",       tier: 3, spriteIndex: 3,  ai: TARGET_RULE.LOWEST_HP,    hp: 28, armor: 1, dmg: 3 },
  { id: 5,  name: "The Maw",                tier: 3, spriteIndex: 4,  ai: TARGET_RULE.LOWEST_HP,    hp: 35, armor: 2, dmg: 6 },
  { id: 6,  name: "Arcane Reactor",         tier: 3, spriteIndex: 5,  ai: TARGET_RULE.SPLIT,        hp: 20, armor: 0, dmg: 8 },
  { id: 7,  name: "Eclipse Warden",         tier: 3, spriteIndex: 6,  ai: TARGET_RULE.MOST_ACTIVE,  hp: 36, armor: 3, dmg: 7 },
  { id: 8,  name: "Blightroot",             tier: 3, spriteIndex: 7,  ai: TARGET_RULE.MULTI,        hp: 26, armor: 2, dmg: 6 },
  { id: 9,  name: "Gravelord Varn",         tier: 3, spriteIndex: 8,  ai: TARGET_RULE.LOWEST_HP,    hp: 42, armor: 4, dmg: 6 },
  { id: 10, name: "The Hungering Rift",     tier: 3, spriteIndex: 9,  ai: TARGET_RULE.RANDOM,       hp: 30, armor: 0, dmg: 6 },
  { id: 11, name: "Ashen Titan",            tier: 3, spriteIndex: 10, ai: TARGET_RULE.HIGHEST_ARMOR, hp: 45, armor: 5, dmg: 6 },
  { id: 12, name: "Mirror Shade",           tier: 3, spriteIndex: 11, ai: TARGET_RULE.MIMIC,        hp: 33, armor: 1, dmg: 4 },
  { id: 13, name: "Serpent Queen Xiilix",   tier: 3, spriteIndex: 12, ai: TARGET_RULE.HIGHEST_HP,   hp: 38, armor: 2, dmg: 5 },
  { id: 14, name: "Clockwork Anomaly",      tier: 3, spriteIndex: 13, ai: TARGET_RULE.PATTERN,      hp: 35, armor: 3, dmg: 6 },
  { id: 15, name: "Storm Herald",           tier: 3, spriteIndex: 14, ai: TARGET_RULE.FARTHEST,     hp: 39, armor: 2, dmg: 7 },
  { id: 16, name: "Iron Widow",             tier: 3, spriteIndex: 15, ai: TARGET_RULE.BIND,         hp: 34, armor: 3, dmg: 6 },
  { id: 17, name: "Dread Siren",            tier: 3, spriteIndex: 16, ai: TARGET_RULE.CHARM,        hp: 32, armor: 2, dmg: 6 },
  { id: 18, name: "Ember King",             tier: 3, spriteIndex: 17, ai: TARGET_RULE.BURN,         hp: 44, armor: 2, dmg: 8 },
  { id: 19, name: "Vault Guardian",         tier: 3, spriteIndex: 18, ai: TARGET_RULE.TANK,         hp: 46, armor: 5, dmg: 6 },
  { id: 20, name: "Oracle of Rust",         tier: 3, spriteIndex: 19, ai: TARGET_RULE.DECAY,        hp: 36, armor: 3, dmg: 5 },
];

// Convenience getters

export function getEnemyByTierAndId(tier, id) {
  if (tier === 1) return TIER1_ENEMIES.find(e => e.id === id) || null;
  if (tier === 2) return TIER2_ENEMIES.find(e => e.id === id) || null;
  return BOSS_ENEMIES.find(e => e.id === id) || null;
}

export function getSpriteSheetMetaForTier(tier) {
  if (tier === 1) return SHEET_META.T1;
  if (tier === 2) return SHEET_META.T2;
  return SHEET_META.BOSS;
}

// Returns { src, cols, rows, index } for rendering
export function getEnemySpriteInfo(tier, id) {
  const e = getEnemyByTierAndId(tier, id);
  if (!e) return null;
  const meta = getSpriteSheetMetaForTier(tier);
  return { src: meta.src, cols: meta.cols, rows: meta.rows, index: e.spriteIndex };
}
