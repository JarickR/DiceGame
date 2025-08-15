// src/turns/enemyAI.js
// Minimal enemy AI: pick a target by rule, do physical damage (reduced by armor).

// If you already have a data/enemies.js with TARGET_RULE export, keep it.
// Otherwise define a tiny fallback here:
export const TARGET_RULE = {
  RANDOM: "random",
  LOWEST_HP: "lowest_hp",
  HIGHEST_HP: "highest_hp",
  LOWEST_ARMOR: "lowest_armor",
};

function lowestHp(list) {
  return [...list].sort((a, b) => (a.hp ?? 0) - (b.hp ?? 0))[0] || null;
}
function highestHp(list) {
  return [...list].sort((a, b) => (b.hp ?? 0) - (a.hp ?? 0))[0] || null;
}
function lowestArmor(list) {
  return [...list].sort((a, b) => (a.armor ?? 0) - (b.armor ?? 0))[0] || null;
}
function randomOne(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * enemyAct(enemy, players, logFn, burstFn)
 * - enemy: object { name, ai, dmg, ... } and live state in same object/reference
 * - players: array of live player objects
 * - logFn(msg)
 * - burstFn(type, payload)  (optional VFX hook)
 */
export function enemyAct(enemy, players, logFn = () => {}, burstFn = () => {}) {
  const alive = players.filter((p) => (p.hp ?? 1) > 0);
  if (!alive.length) return { targetId: null, dealt: 0 };

  let target = null;
  switch (enemy.ai) {
    case TARGET_RULE.LOWEST_HP: target = lowestHp(alive); break;
    case TARGET_RULE.HIGHEST_HP: target = highestHp(alive); break;
    case TARGET_RULE.LOWEST_ARMOR: target = lowestArmor(alive); break;
    case TARGET_RULE.RANDOM:
    default: target = randomOne(alive); break;
  }

  const base = enemy.dmg ?? 2;                // default 2 dmg
  const armor = Math.max(0, target.armor ?? 0);
  const dealt = Math.max(0, base - armor);

  target.hp = Math.max(0, (target.hp ?? 0) - dealt);

  logFn(
    `${enemy.name} hits ${target.name} for ${dealt} (base ${base} − armor ${armor}).`
  );

  try { burstFn("hit", { enemy, target, amount: dealt }); } catch {}

  return { targetId: target.id ?? target.name, dealt };
}
