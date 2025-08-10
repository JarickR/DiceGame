// src/spells.js

// ---------------------------------------------------------------------------
// Sprite sheet locations (public/art) and frame meta
// Each spell art tile is 500x375 in a VERTICAL strip.
// Tier 1: first 5 frames are populated (0..4), rest blank
// Tier 3: first 3 frames are populated (0..2), rest blank
// Tier 2: we’ll assume at least 8 frames populated (0..7). Adjust if needed.
// ---------------------------------------------------------------------------
const TIER1_SHEET = "/art/Tier1Spells.png";
const TIER2_SHEET = "/art/Tier2Spells.png";
const TIER3_SHEET = "/art/Tier3Spells.png";

// If your Tier 2 has a different count, tweak this (it’s only used for comments/UI;
// we address frames directly by index you define below).
const TIER2_FRAMES_POPULATED = 8;

// ---------------------------------------------------------------------------
// Spell pools
//  - name: UI label
//  - type: one of: attack, heal, armor, sweep, fireball, poison, bomb, concentration
//  - tier: 1|2|3
//  - frame: index within its tier’s vertical sheet (0-based)
// ---------------------------------------------------------------------------

// Tier 1: 5 populated slots (0..4)
const T1_POOL = [
  { id: "t1_attack",     name: "Attack",     type: "attack",     tier: 1, frame: 0 }, // 2 dmg
  { id: "t1_heal",       name: "Heal",       type: "heal",       tier: 1, frame: 1 }, // 1 hp
  { id: "t1_armor",      name: "Armor",      type: "armor",      tier: 1, frame: 2 }, // 2 armor
  { id: "t1_sweep",      name: "Sweep",      type: "sweep",      tier: 1, frame: 3 }, // 1 dmg all
  { id: "t1_fireball",   name: "Fireball",   type: "fireball",   tier: 1, frame: 4 }, // 1 true dmg
  // frames 5+ are blank by your sheet design
];

// Tier 2: adjust frames/entries to match your art order.
// The comments reflect default rule values; engine applies actual effects.
const T2_POOL = [
  { id: "t2_attack",       name: "Attack+",       type: "attack",       tier: 2, frame: 0 }, // 4 dmg
  { id: "t2_heal",         name: "Heal+",         type: "heal",         tier: 2, frame: 1 }, // 3 hp
  { id: "t2_armor",        name: "Armor+",        type: "armor",        tier: 2, frame: 2 }, // 6 armor
  { id: "t2_sweep",        name: "Sweep+",        type: "sweep",        tier: 2, frame: 3 }, // 2 dmg all
  { id: "t2_fireball",     name: "Fireball+",     type: "fireball",     tier: 2, frame: 4 }, // 3 true dmg
  { id: "t2_poison",       name: "Poison",        type: "poison",       tier: 2, frame: 5 }, // add poison die
  { id: "t2_bomb",         name: "Bomb",          type: "bomb",         tier: 2, frame: 6 }, // give bomb die
  { id: "t2_concentration",name: "Concentration", type: "concentration",tier: 2, frame: 7 }, // ×2 next (stacks)
  // If you have more Tier 2 art slots, add them below with increasing frame indices.
];

// Tier 3: first 3 slots populated (0..2)
const T3_POOL = [
  { id: "t3_attack",     name: "Attack++",     type: "attack",     tier: 3, frame: 0 }, // 6 dmg
  { id: "t3_sweep",      name: "Sweep++",      type: "sweep",      tier: 3, frame: 1 }, // 4 dmg all
  { id: "t3_fireball",   name: "Fireball++",   type: "fireball",   tier: 3, frame: 2 }, // 5 true dmg
  // frames 3+ blank on your sheet
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function sampleMany(arr, count) {
  const n = Math.min(count, arr.length);
  const pool = arr.slice();
  const out = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/**
 * Attach default spell pools & initial selection options to a player object.
 * - Adds t1Pool/t2Pool/t3Pool (full pools, used by Upgrade)
 * - Adds t1Options (3 random T1) and t2Options (2 random T2) for initial selection
 *   The UI will let players pick 2 from t1Options and 1 from t2Options.
 */
export function attachDefaultPoolsToPlayer(player) {
  // Attach full pools (used later for Upgrades)
  player.t1Pool = T1_POOL.slice();
  player.t2Pool = T2_POOL.slice();
  player.t3Pool = T3_POOL.slice();

  // Initial random options
  player.t1Options = sampleMany(player.t1Pool, 3);
  player.t2Options = sampleMany(player.t2Pool, 2);

  // (Player will choose 2 × T1 and 1 × T2; engine handles storing in player.spells)
}

// ---------------------------------------------------------------------------
// Rendering helper for App.jsx to pick the correct sprite sheet & frame.
// Returns: { sheetUrl, frame }
// ---------------------------------------------------------------------------
export function getSpellSpriteInfo(spell) {
  if (!spell) return { sheetUrl: TIER1_SHEET, frame: 0 };
  switch (spell.tier) {
    case 1:
      return { sheetUrl: TIER1_SHEET, frame: spell.frame || 0 };
    case 2:
      return { sheetUrl: TIER2_SHEET, frame: spell.frame || 0 };
    case 3:
      return { sheetUrl: TIER3_SHEET, frame: spell.frame || 0 };
    default:
      return { sheetUrl: TIER1_SHEET, frame: 0 };
  }
}

// (Optional) export the pools if you want to build custom UIs elsewhere.
export const POOLS = {
  tier1: T1_POOL,
  tier2: T2_POOL,
  tier3: T3_POOL,
};
