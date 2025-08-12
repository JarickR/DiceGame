// src/spells.js

// ---- Basic pools by tier (types only). Names are display labels. ----
export const TIER_POOLS = {
  1: [
    { type: "attack",       name: "Attack",       tier: 1 },
    { type: "heal",         name: "Heal",         tier: 1 },
    { type: "armor",        name: "Armor",        tier: 1 },
    { type: "sweep",        name: "Sweep",        tier: 1 },
    { type: "fireball",     name: "Fireball",     tier: 1 },
    // (you have spare frames on your T1 sheet; leave them unused)
  ],
  2: [
    { type: "attack",       name: "Attack",       tier: 2 },
    { type: "heal",         name: "Heal",         tier: 2 },
    { type: "armor",        name: "Armor",        tier: 2 },
    { type: "concentration",name: "Concentration",tier: 2 },
    { type: "sweep",        name: "Sweep",        tier: 2 },
    { type: "fireball",     name: "Fireball",     tier: 2 },
    { type: "poison",       name: "Poison",       tier: 2 },
    { type: "bomb",         name: "Bomb",         tier: 2 },
  ],
  3: [
    { type: "attack",       name: "Attack",       tier: 3 },
    { type: "sweep",        name: "Sweep",        tier: 3 },
    { type: "fireball",     name: "Fireball",     tier: 3 },
    // (rest of T3 frames are blank by design)
  ],
};

export function randomFromTier(tier) {
  const pool = TIER_POOLS[tier] || [];
  if (!pool.length) return null;
  return JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
}

export function nextTierFor(tier) {
  if (tier === 1) return 2;
  if (tier === 2) return 3;
  return null;
}

/** Return a random candidate from the next tier, given a current spell (or a tier). */
export function randomUpgradeCandidate(current) {
  const curTier = typeof current === "number" ? current : (current?.tier || 1);
  const nt = nextTierFor(curTier);
  if (!nt) return null;
  return randomFromTier(nt);
}

// ---- Optional: tiny helpers for type checks used by App bursts/rules ----
export const IGNORES_ARMOR = new Set(["fireball", "poison"]);
export const PHYSICAL = new Set(["attack", "sweep", "bomb"]);
