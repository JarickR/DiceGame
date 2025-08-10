// src/spells.js

// ---------- Tier 1 ----------
export const TIER1 = [
  { key: 'attack_t1', name: 'Attack', type: 'attack', tier: 1, dmg: 2, frame: 0 },
  { key: 'heal_t1',   name: 'Heal',   type: 'heal',   tier: 1, heal: 1, frame: 1 },
  { key: 'armor_t1',  name: 'Armor',  type: 'armor',  tier: 1, block: 2, frame: 2 },
  { key: 'sweep_t1',  name: 'Sweep',  type: 'sweep',  tier: 1, dmg: 1, frame: 3 },
  { key: 'fire_t1',   name: 'Fireball', type: 'fire', tier: 1, dmg: 1, pierce: true, frame: 4 },
];

// ---------- Tier 2 ----------
export const TIER2 = [
  { key: 'attack_t2', name: 'Attack',        type: 'attack', tier: 2, dmg: 4, frame: 0 },
  { key: 'heal_t2',   name: 'Heal',          type: 'heal',   tier: 2, heal: 3, frame: 1 },
  { key: 'armor_t2',  name: 'Armor',         type: 'armor',  tier: 2, block: 6, frame: 2 },
  { key: 'conc_t2',   name: 'Concentration', type: 'conc',   tier: 2, mult: 2, stackable: true, frame: 3 },
  { key: 'sweep_t2',  name: 'Sweep',         type: 'sweep',  tier: 2, dmg: 2, frame: 4 },
  { key: 'fire_t2',   name: 'Fireball',      type: 'fire',   tier: 2, dmg: 3, pierce: true, frame: 5 },
  { key: 'poison_t2', name: 'Poison',        type: 'poison', tier: 2, frame: 6 },
  { key: 'bomb_t2',   name: 'Bomb',          type: 'bomb',   tier: 2, frame: 7 },
];

// ---------- Tier 3 ----------
export const TIER3 = [
  { key: 'attack_t3', name: 'Attack',   type: 'attack', tier: 3, dmg: 6, frame: 0 },
  { key: 'sweep_t3',  name: 'Sweep',    type: 'sweep',  tier: 3, dmg: 4, frame: 1 },
  { key: 'fire_t3',   name: 'Fireball', type: 'fire',   tier: 3, dmg: 5, pierce: true, frame: 2 },
];

// Quick lookup by tier
export const BY_TIER = {
  1: TIER1,
  2: TIER2,
  3: TIER3,
};

// Sprite sheet frame maps (so UI knows which sheet + index to draw)
export const SPRITE_SOURCE = {
  // which public sheet to use for a given tier
  sheetForTier(tier) {
    if (tier === 1) return '/art/Tier1Spells.png';
    if (tier === 2) return '/art/Tier2Spells.png';
    return '/art/Tier3Spells.png';
  }
};

// Utility: deep-ish clone
const clone = (o) => JSON.parse(JSON.stringify(o));

// Random helper
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- Public helpers ----------

// Get a fresh random spell from a tier
export function getRandomSpellFromTier(tier) {
  const pool = BY_TIER[tier] || TIER1;
  return clone(pick(pool));
}

// Upgrade a spell: T1 -> random T2, T2 -> random T3, T3 -> random T3 (swap)
// Returns { old: <oldSpell>, candidate: <newSpell> }
export function getUpgradeCandidate(spell) {
  if (!spell || !spell.tier) {
    // fallback: pretend it was T1
    return { old: spell || null, candidate: getRandomSpellFromTier(2) };
  }
  const nextTier = Math.min(3, spell.tier + 1);
  return { old: clone(spell), candidate: getRandomSpellFromTier(nextTier) };
}

// For dice face art usage in UI:
// Given a spell object -> { sheetUrl, frame }
export function getSpellSpriteInfo(spell) {
  if (!spell) return null;
  return {
    sheetUrl: SPRITE_SOURCE.sheetForTier(spell.tier),
    frame: spell.frame ?? 0,
    tier: spell.tier,
  };
}

// Compute base numeric effect for rendering (not strict rules; engine does the real work)
export function describeSpellShort(spell) {
  if (!spell) return '';
  switch (spell.type) {
    case 'attack': return `Attack ${spell.dmg}`;
    case 'heal':   return `Heal ${spell.heal}`;
    case 'armor':  return `Armor ${spell.block}`;
    case 'sweep':  return `Sweep ${spell.dmg} all`;
    case 'fire':   return `Fire ${spell.dmg} (pierce)`;
    case 'conc':   return `Concentration x${spell.mult}`;
    case 'poison': return `Poison die`;
    case 'bomb':   return `Bomb die`;
    default:       return spell.name || 'Spell';
  }
}

// Build initial face options for character creation:
// returns { t1Options:[...3], t2Options:[...2] }
export function rollInitialSpellOptions() {
  // 3 T1 options, player will keep 2
  const t1Pool = [...TIER1];
  const t1Options = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * t1Pool.length);
    t1Options.push(clone(t1Pool.splice(idx, 1)[0]));
  }
  // 2 T2 options, player will keep 1
  const t2Pool = [...TIER2];
  const t2Options = [];
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(Math.random() * t2Pool.length);
    t2Options.push(clone(t2Pool.splice(idx, 1)[0]));
  }
  return { t1Options, t2Options };
}

// A small rules helper for Concentration stacking (engine can call this)
export function applyConcentrationMultiplier(baseValue, stacks = 0, mult = 2) {
  let v = baseValue;
  for (let i = 0; i < stacks; i++) v *= mult;
  return v;
}
