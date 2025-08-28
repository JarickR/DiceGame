// src/logic/constants.js

// Spell pools (keep aligned with your SpellIcon sprite indices)
export const TIER1 = ["attack", "heal", "armor", "sweep", "fireball"];
export const TIER2 = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"];
export const TIER3 = ["attack", "sweep", "fireball"];

export function tierFor(spell) {
  if (TIER1.includes(spell)) return 1;
  if (TIER2.includes(spell)) return 2;
  if (TIER3.includes(spell)) return 3;
  return 0;
}

export const isPhysical = (spell) => spell === "attack" || spell === "sweep" || spell === "bomb";
export const isMagic = (spell) => spell === "fireball" || spell === "poison";

// Small utils
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const randi = (n) => Math.floor(Math.random() * n);
export const d20 = () => 1 + randi(20);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
