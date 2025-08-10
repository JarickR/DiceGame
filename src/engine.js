// src/engine.js
// Lightweight PvE engine: class + draft, 6-face die (Class / 4 spells / Upgrade),
// spell resolution with basic numbers, simple enemy AI, and upgrade flow.

import {
  rollInitialSpellOptions,
  getUpgradeCandidate,
  describeSpellShort,
} from "./spells";

// ----------------- Core state -----------------
export const gameState = {
  classes: [
    { key: "thief",   name: "Thief",    frame: 0, ability: "Invisibility + steal 1 armor" },
    { key: "judge",   name: "Judge",    frame: 1, ability: "Reroll twice, pick best" },
    { key: "tank",    name: "Tank",     frame: 2, ability: "+3 armor, taunt, thorns 2" },
    { key: "vampire", name: "Vampire",  frame: 3, ability: "Drain 2 (ignore armor)" },
    { key: "king",    name: "King",     frame: 4, ability: "Atk 2 + Heal 1 + Armor 2" },
    { key: "lich",    name: "Lich",     frame: 5, ability: "Summon a ghoul (+1 bite)" },
    { key: "paladin", name: "Paladin",  frame: 6, ability: "Heal 2 & no HP loss this turn" },
    { key: "barb",    name: "Barbarian",frame: 7, ability: "Lose 1 HP, next spell +2" },
  ],
  players: [],     // [{ class, spells, hp, armor, stacks, flags, upgradePending }]
  enemies: [],     // [{ name, tier, hp, armor }]
  currentTurn: 0,  // player index (single player = 0)
  log: [],
  phase: "classSelect",
};

// ----------------- Utilities -----------------
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (n) => Math.floor(Math.random() * n);

function log(msg) {
  gameState.log.unshift(msg);
}

// ----------------- Creation / Draft -----------------
export function selectClass(playerIndex, classKey) {
  const cls = gameState.classes.find((c) => c.key === classKey);
  if (!cls) return;

  const { t1Options, t2Options } = rollInitialSpellOptions();

  gameState.players[playerIndex] = {
    class: cls,
    spells: [],
    hp: 20,
    maxHp: 20,
    armor: 0,
    stacks: 0, // concentration stacks
    flags: { taunt: false, thorns: 0, bless: false, invis: false, barbBonus: 0, ghouls: 0 },
    t1Options,
    t2Options,
    upgradePending: null,
  };
  log(`P${playerIndex + 1} chose class ${cls.name}`);
}

export function chooseInitialSpells(playerIndex, chosenT1, chosenT2) {
  const p = gameState.players[playerIndex];
  p.spells = [
    ...chosenT1.map((i) => p.t1Options[i]),
    p.t2Options[chosenT2],
    // 4th slot starts as "blank" slot (upgrade bait) — represented by null
    null,
  ];
  delete p.t1Options;
  delete p.t2Options;

  log(
    `P${playerIndex + 1} chose starting spells: ` +
      p.spells
        .filter(Boolean)
        .map((s) => s.name)
        .join(", ")
  );

  // When all players are ready -> battle
  if (gameState.players.every((pl) => pl.spells.length > 0)) {
    gameState.phase = "battle";
    gameState.currentTurn = 0;
    spawnDemoEnemy(); // simple one-enemy demo
    log("Battle start!");
  }
}

// ----------------- Enemy spawning / AI -----------------
export function spawnDemoEnemy() {
  // Simple T1/T2/Boss demo picks (here just T1 to start)
  if (gameState.enemies.length === 0) {
    gameState.enemies.push({
      id: "e1",
      name: "Goblin Skirmisher",
      tier: 1,
      hp: 14,
      armor: 1,
      poison: 0,
      bomb: 0,
    });
  }
}

function anyAliveEnemy() {
  return gameState.enemies.find((e) => e.hp > 0) || null;
}

// ----------------- Turn rolling -----------------
export function rollDiceForPlayer(playerIndex) {
  const p = gameState.players[playerIndex];
  // 0: class, 1..4: spells slots, 5: upgrade
  const face = randInt(6);

  if (face === 0) {
    triggerClassAbility(p);
  } else if (face >= 1 && face <= 4) {
    const slot = face - 1;
    const spell = p.spells[slot];
    if (!spell) {
      log(`${p.class.name} rolled a blank slot.`);
    } else {
      triggerSpell(p, spell);
    }
  } else {
    triggerUpgrade(p);
  }

  // End player turn -> Enemy acts -> DOT cleanup
  enemyAct();
  cleanupDotsAndFlags(p);
}

// ----------------- Class abilities -----------------
function triggerClassAbility(p) {
  switch (p.class.key) {
    case "thief": {
      p.flags.invis = true;
      const e = anyAliveEnemy();
      if (e && e.armor > 0) {
        e.armor -= 1;
        p.armor += 1;
        log(`Thief: Invisibility & stole 1 armor (you +1, enemy -1).`);
      } else {
        log(`Thief: Invisibility this turn.`);
      }
      break;
    }
    case "judge": {
      // Roll two random spell slots and pick the one with higher heuristic value
      const pickSlot = () => {
        let tries = 10;
        while (tries--) {
          const s = randInt(4);
          if (p.spells[s]) return s;
        }
        return 0;
      };
      const a = pickSlot();
      const b = pickSlot();
      const score = (sp) => {
        if (!sp) return 0;
        if (sp.type === "attack") return sp.dmg ?? 0;
        if (sp.type === "fire") return (sp.dmg ?? 0) + 1;
        if (sp.type === "sweep") return sp.dmg ?? 0;
        if (sp.type === "heal") return (sp.heal ?? 0) * 0.8;
        if (sp.type === "armor") return (sp.block ?? 0) * 0.6;
        if (sp.type === "conc") return 1.5;
        return 1;
      };
      const best = score(p.spells[a]) >= score(p.spells[b]) ? a : b;
      const sp = p.spells[best];
      log(`Judge: reroll twice & choose → ${sp?.name || "Blank"}`);
      if (sp) triggerSpell(p, sp);
      break;
    }
    case "tank": {
      p.armor += 3;
      p.flags.taunt = true;
      p.flags.thorns = 2;
      log("Tank: +3 armor, taunt, thorns 2 this round.");
      break;
    }
    case "vampire": {
      const e = anyAliveEnemy();
      if (!e) return log("Vampire: no target.");
      const dmg = 2;
      applyDamage(p, e, dmg, { pierce: true, label: "drain" });
      p.hp = clamp(p.hp + dmg, 0, p.maxHp);
      log("Vampire: drain 2 (ignore armor).");
      break;
    }
    case "king": {
      const e = anyAliveEnemy();
      if (e) applyDamage(p, e, 2, { label: "attack" });
      p.hp = clamp(p.hp + 1, 0, p.maxHp);
      p.armor += 2;
      log("King: Attack 2, Heal 1, +2 armor.");
      break;
    }
    case "lich": {
      p.flags.ghouls += 1;
      log("Lich: Summoned a ghoul (adds 1 bite in cleanup).");
      break;
    }
    case "paladin": {
      p.hp = clamp(p.hp + 2, 0, p.maxHp);
      p.flags.bless = true; // no HP loss this enemy turn
      log("Paladin: Heal 2 & blessed (no HP loss this turn).");
      break;
    }
    case "barb": {
      p.hp = Math.max(1, p.hp - 1);
      p.flags.barbBonus = 2;
      log("Barbarian: -1 HP, next spell +2. (Extra roll baked into your next spell only).");
      break;
    }
    default:
      log(`${p.class.name}: (no special ability wired)`);
  }
}

// ----------------- Spell resolution -----------------
function triggerSpell(p, spell) {
  const e = anyAliveEnemy();
  const mult = p.stacks > 0 ? Math.pow(2, p.stacks) : 1;
  const bonus = p.flags.barbBonus || 0;

  // consuming stacks / barb bonus after use
  const consumeStacks = () => (p.stacks = 0);
  const consumeBarb = () => (p.flags.barbBonus = 0);

  switch (spell.type) {
    case "conc": {
      p.stacks += 1;
      log(`Concentration stacked → x${Math.pow(2, p.stacks)}`);
      return;
    }
    case "attack": {
      if (!e) return log("No target.");
      const dmg = (spell.dmg || 0) * mult + bonus;
      applyDamage(p, e, dmg, { label: "attack" });
      consumeStacks(); consumeBarb();
      return;
    }
    case "sweep": {
      const dmg = (spell.dmg || 0) * mult + bonus;
      let hits = 0;
      gameState.enemies.forEach((en) => {
        if (en.hp > 0) {
          applyDamage(p, en, dmg, { label: "sweep", silent: true });
          hits++;
        }
      });
      log(hits ? `Sweep hits ${hits} enemies for ${dmg}.` : "No enemies to sweep.");
      consumeStacks(); consumeBarb();
      return;
    }
    case "fire": {
      if (!e) return log("No target.");
      const dmg = (spell.dmg || 0) * mult + bonus;
      applyDamage(p, e, dmg, { pierce: true, label: "fire" });
      consumeStacks(); consumeBarb();
      return;
    }
    case "heal": {
      const heal = (spell.heal || 0) * mult + bonus;
      p.hp = clamp(p.hp + heal, 0, p.maxHp);
      log(`Heal ${heal}.`);
      consumeStacks(); consumeBarb();
      return;
    }
    case "armor": {
      const block = (spell.block || 0) * mult + bonus;
      p.armor += block;
      log(`Gain ${block} armor.`);
      consumeStacks(); consumeBarb();
      return;
    }
    case "poison": {
      if (!e) return log("No target.");
      e.poison = (e.poison || 0) + 1;
      log(`Poisoned ${e.name} (stacks: ${e.poison}).`);
      consumeStacks(); consumeBarb();
      return;
    }
    case "bomb": {
      if (!e) return log("No target.");
      e.bomb = (e.bomb || 0) + 6; // Tier-2 bomb die simplified to 6 dmg next cleanup
      log(`Bomb set on ${e.name}.`);
      consumeStacks(); consumeBarb();
      return;
    }
    default:
      log(describeSpellShort(spell));
      consumeStacks(); consumeBarb();
  }
}

// ----------------- Upgrade flow -----------------
function triggerUpgrade(p) {
  // For now: randomly pick a slot that isn't null; if all null, pick 0
  let slot = 0;
  const filled = [0, 1, 2, 3].filter((i) => p.spells[i] !== undefined);
  if (filled.length) slot = filled[randInt(filled.length)];
  const info = getUpgradeCandidate(p.spells[slot] ?? { tier: 1, type: "attack", name: "Attack" });
  p.upgradePending = { slot, old: info.old, candidate: info.candidate };
  log(`${p.class.name} can upgrade ${info.old?.name || "Blank"} → ${info.candidate.name}`);
}

export function acceptUpgrade(playerIndex) {
  const p = gameState.players[playerIndex];
  if (!p.upgradePending) return;
  p.spells[p.upgradePending.slot] = p.upgradePending.candidate;
  log(`${p.class.name} upgraded to ${p.upgradePending.candidate.name}`);
  p.upgradePending = null;
}

export function declineUpgrade(playerIndex) {
  const p = gameState.players[playerIndex];
  if (!p.upgradePending) return;
  log(`${p.class.name} kept ${p.upgradePending.old?.name || "Blank"}`);
  p.upgradePending = null;
}

// ----------------- Damage / Enemy turn / Cleanup -----------------
function applyDamage(attacker, target, raw, { pierce = false, silent = false, label = "dmg" } = {}) {
  if (!target || raw <= 0) return;

  // Paladin bless: no HP loss this enemy turn (applies to player only)
  if (target._isPlayer && target.flags.bless) {
    log("Blessed: no HP loss.");
    target.flags.bless = false;
    return;
  }

  let dmg = raw;
  if (!pierce) {
    const block = Math.min(target.armor || 0, dmg);
    if (block > 0) {
      target.armor -= block;
      dmg -= block;
      if (!silent) log(`Armor blocked ${block}.`);
    }
  }
  target.hp = Math.max(0, target.hp - dmg);
  if (!silent) log(`${label}: ${dmg} to ${target.name || "enemy"}.`);
}

function enemyAct() {
  const e = anyAliveEnemy();
  if (!e) return;
  const p = gameState.players[0];
  if (!p) return;

  // Invisibility (Thief): skip targeting this turn
  if (p.flags.invis) {
    log(`${e.name} swings blindly (you are invisible).`);
    return;
  }

  // Simple AI: 70% attack, 30% fire (pierce) if tier >= 2
  const roll = Math.random();
  if (e.tier >= 2 && roll < 0.3) {
    applyDamage(e, asPlayer(p), 3, { pierce: true, label: "enemy fire" });
  } else {
    applyDamage(e, asPlayer(p), e.tier === 1 ? 2 : e.tier === 2 ? 4 : 6, { label: "enemy attack" });
  }

  // Thorns retaliation if Tank flagged this round
  if (p.flags.thorns && e.hp > 0) {
    e.hp = Math.max(0, e.hp - p.flags.thorns);
    log(`Thorns: ${p.flags.thorns} back to ${e.name}.`);
  }
}

function cleanupDotsAndFlags(p) {
  // Lich ghouls bite (1 per ghoul)
  if (p.flags.ghouls > 0) {
    const e = anyAliveEnemy();
    if (e) {
      e.hp = Math.max(0, e.hp - p.flags.ghouls);
      log(`Ghoul swarm bites for ${p.flags.ghouls}.`);
    }
  }

  // Enemy DOTs
  gameState.enemies.forEach((en) => {
    if (en.hp <= 0) return;
    if (en.poison > 0) {
      en.hp = Math.max(0, en.hp - en.poison);
      log(`Poison ticks ${en.poison} on ${en.name}.`);
    }
    if (en.bomb > 0) {
      const x = en.bomb;
      en.bomb = 0;
      en.hp = Math.max(0, en.hp - x);
      log(`Bomb explodes on ${en.name} for ${x}.`);
    }
  });

  // Clear one-turn flags
  p.flags.taunt = false;
  p.flags.thorns = 0;
  p.flags.bless = false;
  p.flags.invis = false;

  // Victory/Defeat checks
  if (gameState.enemies.every((en) => en.hp <= 0)) {
    log("Victory!");
  } else if (gameState.players.every((pl) => pl.hp <= 0)) {
    log("Defeat…");
  }
}

// Helper to mark object as "player" for bless logic
function asPlayer(p) {
  return Object.assign({ _isPlayer: true, name: "you" }, p);
}
