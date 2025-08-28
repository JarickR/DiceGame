// src/spells.js

// ───────────────────────────────────────────────────────────────────────────────
// Canonical spell lists per tier (ids must match everywhere else in the app)
// ───────────────────────────────────────────────────────────────────────────────
export const TIER1_POOL = ["attack", "heal", "armor", "sweep", "fireball"]; // 5 used
export const TIER2_POOL = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"]; // 8 used
export const TIER3_POOL = ["attack", "sweep", "fireball"]; // 3 used

export const POOLS = {
  1: TIER1_POOL,
  2: TIER2_POOL,
  3: TIER3_POOL,
};

// Convenience aggregate (some UIs iterate this)
export const SPELLS = {
  1: [...TIER1_POOL],
  2: [...TIER2_POOL],
  3: [...TIER3_POOL],
};

// Classes in display order for the loadout row
export const CLASS_ORDER = [
  "thief",
  "judge",
  "tank",
  "vampire",
  "king",
  "lich",
  "paladin",
  "barbarian",
];


// ───────────────────────────────────────────────────────────────────────────────
// Sprite indices per tier (vertical sheets: 500×3000, 1 col × 8 rows)
// Rows are top→down from 0..7. Only the listed ones are used.
// ───────────────────────────────────────────────────────────────────────────────
export const SPELL_INDEX = {
  1: {
    attack: 0,
    heal: 1,
    armor: 2,
    sweep: 3,
    fireball: 4,
  },
  2: {
    attack: 0,
    heal: 1,
    armor: 2,
    concentration: 3,
    sweep: 4,
    fireball: 5,
    poison: 6,
    bomb: 7,
  },
  3: {
    attack: 0,
    sweep: 1,
    fireball: 2,
  },
};

// ───────────────────────────────────────────────────────────────────────────────
const FRAME_W = 500; // each frame width
const FRAME_H = 375; // 3000 / 8 rows
const COLS = 1;
const ROWS = 8;

const base = (import.meta?.env?.BASE_URL ?? "/").replace(/\/+$/, "");
const SHEETS = {
  1: `${base}/art/Tier1Spells.png`,
  2: `${base}/art/Tier2Spells.png`,
  3: `${base}/art/Tier3Spells.png`,
};
export const UPGRADE_SHEET = `${base}/art/UpgradeLogo.png`;

// Small helper
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Returns sprite slicing info for a given spell.
 * If name is "blank" or unknown, you'll get a neutral object with `isBlank: true`.
 */
export function getSpellSpriteInfo(tier, name) {
  const t = Number(tier) || 1;
  const spell = (name || "").toLowerCase();

  if (!spell || spell === "blank") {
    return {
      isBlank: true,
      tier: t,
      name: "blank",
      src: null,
      index: 0,
      frameW: FRAME_W,
      frameH: FRAME_H,
      cols: COLS,
      rows: ROWS,
    };
  }

  const index = SPELL_INDEX[t]?.[spell];
  const src = SHEETS[t];

  if (index == null || !src) {
    // Unknown: return a neutral placeholder descriptor
    return {
      isBlank: true,
      tier: t,
      name: spell,
      src: null,
      index: 0,
      frameW: FRAME_W,
      frameH: FRAME_H,
      cols: COLS,
      rows: ROWS,
    };
  }

  return {
    isBlank: false,
    tier: t,
    name: spell,
    src,
    index,
    frameW: FRAME_W,
    frameH: FRAME_H,
    cols: COLS,
    rows: ROWS,
  };
}

/**
 * Pick a random spell id from a tier.
 * Returns { tier, id }.
 */
export function randomSpellFromTier(tier) {
  const t = Math.min(3, Math.max(1, Number(tier) || 1));
  const id = pick(POOLS[t]);
  return { tier: t, id };
}

/**
 * Safe initializer the engine can call without worrying about availability.
 * Adds default spell pools onto a hero object if missing (no mutation of global data).
 */
export function attachDefaultPoolsToPlayer(hero) {
  if (!hero) return hero;
  if (!hero.spellPools) {
    hero.spellPools = {
      1: [...TIER1_POOL],
      2: [...TIER2_POOL],
      3: [...TIER3_POOL],
    };
  }
  return hero;
}

// Optional: a normalizer for IDs (kept exported in case you want it elsewhere)
export function normalizeSpellId(id) {
  return String(id || "").trim().toLowerCase();
}
