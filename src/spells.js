// src/spells.js

// ===== Spell Frame Mapping =====
// Each icon on your sheets is 500x375 (w x h).
export const SPELL_FRAMES = {
  1: {
    // Tier 1 — first 5 slots used
    attack: 0,
    heal: 1,
    armor: 2,
    sweep: 3,
    fireball: 4,
  },
  2: {
    // Tier 2 — full row
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
    // Tier 3 — first 3 slots used
    attack: 0,
    sweep: 1,
    fireball: 2,
  },
};

// Public art paths (make sure these files exist in /public/art)
const SHEETS = {
  1: "/art/Tier1Spells.png",
  2: "/art/Tier2Spells.png",
  3: "/art/Tier3Spells.png",
};

// ===== Names/Descriptions (EXPORTED) =====
export const SPELLS = {
  attack: {
    name: "Attack",
    desc: "Deal direct damage to an enemy.",
    tier: 1,
  },
  heal: {
    name: "Heal",
    desc: "Restore health to an ally.",
    tier: 1,
  },
  armor: {
    name: "Armor",
    desc: "Gain temporary protection that blocks damage.",
    tier: 1,
  },
  sweep: {
    name: "Sweep",
    desc: "Damage multiple foes at once.",
    tier: 1,
  },
  fireball: {
    name: "Fireball",
    desc: "Ignites a target with burning damage (ignores armor at higher tiers).",
    tier: 1,
  },
  concentration: {
    name: "Concentration",
    desc: "Double the next spell’s effect; can stack if rolled multiple times before casting.",
    tier: 2,
  },
  poison: {
    name: "Poison",
    desc: "Afflict a target with a poison die that deals damage over time.",
    tier: 2,
  },
  bomb: {
    name: "Bomb",
    desc: "Give a target a bomb die that may explode for heavy damage or pass to another.",
    tier: 2,
  },
};

// ===== Flexible Sprite Info Helper (EXPORTED) =====
// Works with either:
//   getSpellSpriteInfo(2, "fireball")
//   getSpellSpriteInfo({ tier: 2, type: "fireball" })
export function getSpellSpriteInfo(spellOrTier, maybeKey) {
  let tier, key;
  if (typeof spellOrTier === "object" && spellOrTier) {
    tier = spellOrTier.tier;
    key = String(spellOrTier.type || "").toLowerCase();
  } else {
    tier = spellOrTier;
    key = String(maybeKey || "").toLowerCase();
  }

  const t = Number(tier) || 1;
  const k = key || "attack";

  const frame =
    SPELL_FRAMES[t] && Number.isFinite(SPELL_FRAMES[t][k])
      ? SPELL_FRAMES[t][k]
      : 0;

  const sheetUrl = SHEETS[t] || SHEETS[1];
  return { sheetUrl, frame };
}

// ===== Attach Default Spell Pools to Player (EXPORTED) =====
export function attachDefaultPoolsToPlayer(player) {
  const t1 = Object.keys(SPELL_FRAMES[1]);
  const t2 = Object.keys(SPELL_FRAMES[2]);

  // Randomly pick 3 T1 (player will choose 2)
  player.t1Options = shuffle(t1)
    .slice(0, 3)
    .map((k) => ({ type: k, tier: 1, name: SPELLS[k]?.name || k }));

  // Randomly pick 2 T2 (player will choose 1)
  player.t2Options = shuffle(t2)
    .slice(0, 2)
    .map((k) => ({ type: k, tier: 2, name: SPELLS[k]?.name || k }));

  if (!Array.isArray(player.spells)) player.spells = [null, null, null, null];
}

// ===== Utility =====
function shuffle(arr) {
  return arr
    .map((v) => ({ sort: Math.random(), value: v }))
    .sort((a, b) => a.sort - b.sort)
    .map((o) => o.value);
}
