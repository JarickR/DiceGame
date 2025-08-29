// src/engine/combatRunner.js
// Small utilities the battle screen can call to keep App.jsx lean.

export const d = (sides) => 1 + Math.floor(Math.random() * sides);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// --- Initiative --------------------------------------------------------------

export function rollInitiative(players, enemies) {
  // Returns array of tokens like: {type:'player'|'enemy', i:number, roll:number}
  const toks = [];
  players.forEach((_, i) => toks.push({ type: "player", i, roll: d(20) }));
  enemies.forEach((_, i) => toks.push({ type: "enemy", i, roll: d(20) }));
  toks.sort((a, b) => b.roll - a.roll);
  return toks;
}

// --- Status ticks ------------------------------------------------------------

export function applyPoisonTick(unit, logLine) {
  const stacks = unit.stacks?.poison || 0;
  if (!stacks) return { dmg: 0, cured: 0, line: null };
  // Poison: deals damage equal to stacks (ignores armor), then 1/6 cures 1 stack
  const dmg = stacks;
  unit.hp = clamp(unit.hp - dmg, 0, unit.maxHp);
  let cured = 0;
  if (d(6) === 6) {
    unit.stacks.poison = Math.max(0, stacks - 1);
    cured = 1;
  }
  const line =
    `${logLine} took ${dmg} poison damage${cured ? " (cured 1)" : ""}.`;
  return { dmg, cured, line };
}

export function resolveBombsAtStart(unit, passTo, logPrefix = "Unit") {
  let events = [];
  const stacks = unit.stacks?.bomb || 0;
  if (!stacks) return events;

  // For each bomb stack: 1/3 explode for 6 (ignores armor). Else pass to "passTo".
  for (let s = 0; s < stacks; s++) {
    const roll = d(3);
    if (roll === 1) {
      // explode
      unit.hp = clamp(unit.hp - 6, 0, unit.maxHp);
      events.push(`${logPrefix} bomb exploded for 6!`);
    } else if (passTo) {
      // pass
      unit.stacks.bomb = Math.max(0, (unit.stacks.bomb || 0) - 1);
      passTo.stacks = passTo.stacks || {};
      passTo.stacks.bomb = (passTo.stacks.bomb || 0) + 1;
      events.push(`${logPrefix} passed a bomb.`);
    }
  }
  return events;
}

// --- Enemy AI ---------------------------------------------------------------
// Very light placeholder AI so the step runner can act.

export function enemyChooseAction(enemy) {
  // prefer attack; if has poison or bomb stacks on someone else this will be handled in ticks
  return { kind: "attack", name: "attack" };
}

export function enemyResolveAction(action, enemy, players) {
  // Attack lowest HP player alive
  const alive = players
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.hp > 0);
  if (!alive.length) return { log: "Enemy has no targets." };

  alive.sort((a, b) => a.hp - b.hp);
  const target = alive[0];
  const DMG = 2; // baseline
  const mitigated = Math.max(0, DMG - (target.armor || 0));
  target.hp = clamp(target.hp - mitigated, 0, target.maxHp);
  return {
    log: `E${enemy.id + 1} used attack on P${target.i + 1}.`,
    targetIndex: target.i,
    dmg: mitigated,
  };
}
