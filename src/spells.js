// src/spells.js

// ---------- Spell catalog (names & short descriptions) ----------
export const SPELLS = {
  attack: {
    key: "attack",
    name: "Attack",
    desc: "Deal physical damage to the target (blocked by armor).",
  },
  heal: {
    key: "heal",
    name: "Heal",
    desc: "Restore HP to a target (can target self).",
  },
  armor: {
    key: "armor",
    name: "Armor",
    desc: "Gain temporary armor that blocks incoming damage while active.",
  },
  sweep: {
    key: "sweep",
    name: "Sweep",
    desc: "Deal light damage to multiple enemies.",
  },
  fireball: {
    key: "fireball",
    name: "Fireball",
    desc: "Deal damage that ignores armor.",
  },
  concentration: {
    key: "concentration",
    name: "Concentration",
    desc: "Next rolled spell has its effect doubled (can stack).",
  },
  poison: {
    key: "poison",
    name: "Poison",
    desc: "Apply a poison die to the target (ticks at turn start; one face cures).",
  },
  bomb: {
    key: "bomb",
    name: "Bomb",
    desc: "Give the target a bomb die that may explode or pass to adjacent players.",
  },
};

// ---------- Sprite frame maps per tier ----------
// Your sheets are vertical sprite strips with frames of 500x375.
// Tier 1 sheet: first 5 slots used (in this order)
export const TIER1_POOL = ["attack", "heal", "armor", "sweep", "fireball"];
// Tier 2 sheet: all 8 slots used (in this order)
export const TIER2_POOL = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"];
// Tier 3 sheet: first 3 slots used (in this order)
export const TIER3_POOL = ["attack", "sweep", "fireball"];

// For convenience, index lookups:
const FRAME_INDEX = {
  1: Object.fromEntries(TIER1_POOL.map((k, i) => [k, i])),
  2: Object.fromEntries(TIER2_POOL.map((k, i) => [k, i])),
  3: Object.fromEntries(TIER3_POOL.map((k, i) => [k, i])),
};

// ---------- Sheet URLs (public/art) ----------
const SHEET_URL = {
  1: "/art/Tier1Spells.png",
  2: "/art/Tier2Spells.png",
  3: "/art/Tier3Spells.png",
};

// ---------- Helper: get sheet + frame for a spell object ----------
// Expects a spell object like { type: 'attack', tier: 1 }.
// Returns { sheetUrl, frame } or null if unknown.
export function getSpellSpriteInfo(spell) {
  if (!spell || !spell.type) return null;
  const tier = clampTier(spell.tier ?? 1);
  const key = String(spell.type).toLowerCase();

  const frame =
    (FRAME_INDEX[tier] && FRAME_INDEX[tier][key] !== undefined)
      ? FRAME_INDEX[tier][key]
      : 0;

  const sheetUrl = SHEET_URL[tier] || SHEET_URL[1];
  return { sheetUrl, frame };
}

function clampTier(t) {
  if (t <= 1) return 1;
  if (t === 2) return 2;
  return 3;
}
