// src/engine.js
import { SPELLS, TIER1_POOL, TIER2_POOL, TIER3_POOL } from "./spells.js";

export const gameState = {
  phase: "class-select", // "class-select" | "battle"
  classes: [
    { id: "thief",    name: "Thief",    frame: 0, ability: "Steal/swap a face; can go invisible." },
    { id: "judge",    name: "Judge",    frame: 1, ability: "Roll twice, take preferred effect." },
    { id: "tank",     name: "Tank",     frame: 2, ability: "Taunt; +armor; thorns." },
    { id: "vampire",  name: "Vampire",  frame: 3, ability: "Lifesteal, ignore armor." },
    { id: "king",     name: "King",     frame: 4, ability: "Attack+Heal+Armor package." },
    { id: "lich",     name: "Lich",     frame: 5, ability: "Summon ghouls." },
    { id: "paladin",  name: "Paladin",  frame: 6, ability: "Heal+temporary immunity target." },
    { id: "barbarian",name: "Barbarian",frame: 7, ability: "Sacrifice HP to supercharge next roll." },
  ],
  players: [],
  enemies: [],
  turn: { activeHero: 0 },

  upgradeOffer: null, // { heroId, slot, oldSpell, newSpell, locked }
  log: [],
  targetEnemyId: null,
};

const pushLog = (s) => gameState.log.unshift(s);

// -------- utilities --------
function sampleUnique(arr, n) {
  const out = [];
  const pool = arr.slice();
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i,1)[0]);
  }
  return out;
}

// ----- Party creation / loadout -----
export function newParty(n = 2) {
  gameState.phase = "class-select";
  gameState.players = Array.from({ length: Math.max(1, Math.min(4, n)) }).map((_, i) => {
    // randomize the *options* shown on picker: 3 from T1, 2 from T2
    const t1Keys = sampleUnique(TIER1_POOL, 3);
    const t2Keys = sampleUnique(TIER2_POOL, 2);
    return {
      id: i + 1,
      name: `Hero ${i + 1}`,
      class: null,
      hp: 20, maxHp: 20,
      armor: 0,
      spells: [null, null, null, null],
      t1Options: t1Keys.map(k => ({ ...SPELLS[k], tier: 1, type: k })),
      t2Options: t2Keys.map(k => ({ ...SPELLS[k], tier: 2, type: k })),
      chosenT1: [],
      chosenT2: null,
    };
  });
  gameState.enemies = [];
  gameState.turn.activeHero = 0;
  gameState.upgradeOffer = null;
  gameState.log = [];
}

export function selectClass(heroIndex, classId) {
  const h = gameState.players[heroIndex];
  if (!h) return;
  const cls = gameState.classes.find(c => c.id === classId) || null;
  h.class = cls;
}

export function setChosenT1(heroIndex, typesArray) {
  const h = gameState.players[heroIndex];
  if (!h) return;
  h.chosenT1 = typesArray.slice(0, 2);
}

export function setChosenT2(heroIndex, typeOrNull) {
  const h = gameState.players[heroIndex];
  if (!h) return;
  h.chosenT2 = typeOrNull || null;
}

export function finalizeLoadouts() {
  gameState.players.forEach((h) => {
    const spells = [];
    // T1 picks (2) — fill with blanks if fewer than 2 chosen
    const t1 = Array.from(h.chosenT1 || []);
    while (t1.length < 2) t1.push(null);
    t1.slice(0, 2).forEach(k => {
      spells.push(k ? { ...SPELLS[k], tier: 1, type: k } : null);
    });
    // T2 pick (1)
    if (h.chosenT2) spells.push({ ...SPELLS[h.chosenT2], tier: 2, type: h.chosenT2 });
    else spells.push(null);
    // Fourth slot blank (expand later if desired)
    while (spells.length < 4) spells.push(null);
    h.spells = spells;
  });
  gameState.phase = "battle";
  gameState.turn.activeHero = 0;
  pushLog("Battle started.");
}

// ----- Dice roll preview/commit (simplified) -----
export function rollD6() { return 1 + Math.floor(Math.random() * 6); }
export function rollD20() { return 1 + Math.floor(Math.random() * 20); }

export function previewRollForPlayer(heroIndex) {
  const h = gameState.players[heroIndex];
  if (!h) return null;
  const r = rollD6(); // 1..6
  if (r === 1) return { kind: "class" };
  if (r === 6) return { kind: "upgrade" };
  const slot = r - 2; // 0..3
  return { kind: "spell", slot, spell: h.spells[slot] || null };
}

export function commitPreviewedRoll(heroIndex, preview) {
  const h = gameState.players[heroIndex];
  if (!h || !preview) return;

  if (preview.kind === "class") {
    pushLog(`${h.name} activates ${h.class?.name || "Class"} ability.`);
    endTurnAdvance();
    return;
  }

  if (preview.kind === "spell") {
    const s = h.spells[preview.slot] || null;
    pushLog(`${h.name} casts ${s?.name || "Blank"}.`);
    endTurnAdvance();
    return;
  }

  if (preview.kind === "upgrade") {
    beginUpgradeFlow(h.id);
    return;
  }
}

// ----- Enemies (stub) -----
export function spawnEnemy(tier = 1) {
  const id = (gameState.enemies.at(-1)?.id || 0) + 1;
  const hp = 10 + 6 * tier;
  gameState.enemies.push({ id, tier, name: `T${tier} Enemy #${id}`, hp, maxHp: hp, armor: Math.max(0, tier - 1) });
  pushLog(`Spawned T${tier} enemy #${id}.`);
}
export function clearEnemies() { gameState.enemies = []; }
export function setTargetEnemy(id) { gameState.targetEnemyId = id; }

function endTurnAdvance() {
  const n = gameState.players.length || 1;
  gameState.turn.activeHero = (gameState.turn.activeHero + 1) % n;
}

// =================== UPGRADE FLOW ===================
export function beginUpgradeFlow(heroId) {
  const h = getHeroById(heroId);
  if (!h) return;
  gameState.upgradeOffer = {
    heroId,
    slot: null,
    oldSpell: null,
    newSpell: null,
    locked: false,
  };
  pushLog(`${h.name} can upgrade a spell: choose a slot.`);
}

export function chooseUpgradeSlot(slot) {
  const of = gameState.upgradeOffer;
  if (!of || of.locked) return;
  const h = getHeroById(of.heroId);
  if (!h) return;

  const oldSpell = h.spells[slot] || null;
  const targetTier = computeNextTier(oldSpell);
  const newSpell = rollRandomSpellFromTier(targetTier, oldSpell?.type, oldSpell?.tier);

  gameState.upgradeOffer = {
    heroId: h.id,
    slot,
    oldSpell,
    newSpell,
    locked: true,
  };
  pushLog(`Upgrade candidate ready (slot ${slot + 1}): ${newSpell?.name || "—"}.`);
}

export function acceptUpgrade(takeNew) {
  const of = gameState.upgradeOffer;
  if (!of || !of.locked) return;
  const h = getHeroById(of.heroId);
  if (!h) { gameState.upgradeOffer = null; return; }

  if (takeNew && of.newSpell) {
    h.spells[of.slot] = of.newSpell;
    pushLog(`${h.name} took upgrade: ${of.newSpell.name}.`);
  } else {
    pushLog(`${h.name} kept their original spell.`);
  }

  gameState.upgradeOffer = null;
  endTurnAdvance();
}

export function applyUpgradeFromUI(heroId, slot, candidateSpell) {
  const h = getHeroById(heroId);
  if (!h) return;
  h.spells[slot] = candidateSpell;
  gameState.upgradeOffer = null;
  endTurnAdvance();
}

// ---------- internal helpers ----------
function getHeroById(id) {
  return gameState.players.find(p => p.id === id) || null;
}

function computeNextTier(oldSpell) {
  if (!oldSpell) return 1;
  if ((oldSpell.tier || 1) === 1) return 2;
  if ((oldSpell.tier || 2) === 2) return 3;
  return 3;
}

function rollRandomSpellFromTier(tier, excludeType = null, oldTier = null) {
  const pool = tier === 1 ? TIER1_POOL : tier === 2 ? TIER2_POOL : TIER3_POOL;
  let options = pool.slice();
  if (tier === 3 && excludeType) {
    const alt = options.filter(k => k !== excludeType);
    if (alt.length) options = alt;
  }
  const pickKey = options[Math.floor(Math.random() * options.length)];
  const spec = SPELLS[pickKey] || { name: "Unknown", type: pickKey };
  return { ...spec, type: pickKey, tier };
}
