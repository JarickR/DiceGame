// src/engine.js
import { attachDefaultPoolsToPlayer } from "./spells";

// Your exact logo -> frame mapping for /public/art/class-logos.png (vertical 1x8)
const CLASS_FRAME_MAP = {
  thief: 0,
  judge: 1,
  tank: 2,
  vampire: 3,
  king: 4,
  lich: 5,
  paladin: 6,
  barbarian: 7,
};

export const gameState = {
  phase: "classSelect", // "classSelect" | "spellSelect" | "battle"
  classes: [
    { key: "thief",     name: "Thief",     ability: "Steal/swaps a rolled removable face", frame: CLASS_FRAME_MAP.thief },
    { key: "judge",     name: "Judge",     ability: "Reroll twice; choose result",         frame: CLASS_FRAME_MAP.judge },
    { key: "tank",      name: "Tank",      ability: "Taunt, Armor 3, Thorns 2 while face shown", frame: CLASS_FRAME_MAP.tank },
    { key: "vampire",   name: "Vampire",   ability: "Steal 2 HP (ignore armor); heal same",     frame: CLASS_FRAME_MAP.vampire },
    { key: "king",      name: "King",      ability: "Attack 2 + Heal 1 + Armor 2",              frame: CLASS_FRAME_MAP.king },
    { key: "lich",      name: "Lich",      ability: "Summon Ghoul die",                          frame: CLASS_FRAME_MAP.lich },
    { key: "paladin",   name: "Paladin",   ability: "Heal 2; target immune while face shown",    frame: CLASS_FRAME_MAP.paladin },
    { key: "barbarian", name: "Barbarian", ability: "Sac 1 HP: next spell +2; no Concentrate",   frame: CLASS_FRAME_MAP.barbarian },
  ],
  players: [],
  enemies: [],
  turn: { activeHero: 0 },
  targets: { enemyId: null, allyId: null },
  log: [],
};

function uid() { return Math.random().toString(36).slice(2, 8); }

function makeEmptyHero(i) {
  return {
    id: uid(),
    name: `Hero ${i + 1}`,
    class: null,
    hp: 20,
    maxHp: 20,
    armor: 0,
    conc: 1,
    status: {},
    t1Options: [],
    t2Options: [],
    spells: [null, null, null, null],
    ready: false,
    upgradePending: null,
  };
}

export function newParty(count = 2) {
  gameState.players = Array.from({ length: count }, (_, i) => makeEmptyHero(i));
  gameState.enemies = [];
  gameState.turn.activeHero = 0;
  gameState.targets = { enemyId: null, allyId: null };
  gameState.phase = "classSelect";
  gameState.log = [];
}

export function selectClass(heroIndex, classKey) {
  const hero = gameState.players[heroIndex];
  if (!hero) throw new Error("selectClass: hero not found");
  const cls = gameState.classes.find((c) => c.key === classKey);
  if (!cls) throw new Error("selectClass: class not found");

  hero.class = { ...cls };
  attachDefaultPoolsToPlayer(hero);

  const allHaveClass = gameState.players.every((p) => !!p.class);
  if (allHaveClass) gameState.phase = "spellSelect";
}

export function chooseInitialSpells(heroIndex, t1Indices, t2Index) {
  const hero = gameState.players[heroIndex];
  if (!hero) throw new Error("chooseInitialSpells: hero not found");
  const t1Opts = Array.isArray(hero.t1Options) ? hero.t1Options : [];
  const t2Opts = Array.isArray(hero.t2Options) ? hero.t2Options : [];

  const t1A = t1Opts[t1Indices?.[0] ?? -1] || null;
  const t1B = t1Opts[t1Indices?.[1] ?? -1] || null;
  const t2A = t2Opts[t2Index ?? -1] || null;
  if (!t1A || !t1B || !t2A) throw new Error("chooseInitialSpells: need 2×T1 and 1×T2");

  hero.spells = [t1A, t1B, t2A, null];
  hero.ready = true;

  finalizeSetupIfReady();
}

function finalizeSetupIfReady() {
  if (!gameState.players.length) return;
  const allReady = gameState.players.every((p) => p.ready);
  if (allReady) {
    gameState.phase = "battle";
    gameState.log.push("All heroes ready. Entering battle phase.");
    if (gameState.enemies[0] && !gameState.targets.enemyId) gameState.targets.enemyId = gameState.enemies[0].id;
    if (gameState.players[0] && !gameState.targets.allyId) gameState.targets.allyId = gameState.players[0].id;
  }
}

export function spawnEnemy(tier = 1) {
  const n = gameState.enemies.length + 1;
  const e = {
    id: uid(),
    name: tier >= 3 ? `Boss #${n}` : `T${tier} Enemy #${n}`,
    tier,
    hp: tier >= 3 ? 28 : 10 + tier * 4,
    maxHp: tier >= 3 ? 28 : 10 + tier * 4,
    armor: Math.max(0, tier - 1),
    status: {},
  };
  gameState.enemies.push(e);
  if (!gameState.targets.enemyId) gameState.targets.enemyId = e.id;
}

export function clearEnemies() { gameState.enemies = []; gameState.targets.enemyId = null; }
export function setTargetEnemy(id) { gameState.targets.enemyId = id || null; }
export function setTargetAlly(id) { gameState.targets.allyId = id || null; }

function rollD6() { return Math.floor(Math.random() * 6) + 1; }

export function previewRollForPlayer(heroIndex) {
  const hero = gameState.players[heroIndex];
  if (!hero) throw new Error("previewRollForPlayer: hero not found");
  const r = rollD6() - 1; // 0..5
  if (r === 0) return { faceIndex: r, kind: "class" };
  if (r === 5) return { faceIndex: r, kind: "upgrade" };
  const slot = r - 1;
  return { faceIndex: r, kind: "spell", slot };
}

export function commitPreviewedRoll(heroIndex, preview) {
  const hero = gameState.players[heroIndex];
  if (!hero || !preview) return;

  if (preview.kind === "class") {
    gameState.log.push(`${hero.name} activates class: ${hero.class?.name || "?"}`);
  } else if (preview.kind === "spell") {
    const s = hero.spells[preview.slot] || null;
    if (!s) gameState.log.push(`${hero.name} rolled an empty spell slot.`);
    else gameState.log.push(`${hero.name} casts ${s.name} (Tier ${s.tier}, ${s.type}).`);
  } else if (preview.kind === "upgrade") {
    const candidates = hero.spells.map((sp, i) => (sp ? i : -1)).filter((i) => i >= 0);
    const slot = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : 0;
    const oldSpell = hero.spells[slot] || null;

    let pool = null;
    if (!oldSpell || oldSpell.tier === 1) pool = hero.t2Pool || [];
    else if (oldSpell.tier === 2) pool = hero.t3Pool || [];
    else pool = hero.t3Pool || [];

    const candidate = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    hero.upgradePending = { slotIndex: slot, old: oldSpell, candidate };
    gameState.log.push(`${hero.name} rolled Upgrade${candidate ? ` → preview: ${candidate.name}` : ""}`);
  }

  gameState.turn.activeHero = (gameState.turn.activeHero + 1) % gameState.players.length;
}

export function acceptUpgrade(heroIndex) {
  const hero = gameState.players[heroIndex];
  if (!hero || !hero.upgradePending) return;
  const { slotIndex, candidate } = hero.upgradePending;
  if (candidate) {
    hero.spells[slotIndex] = candidate;
    gameState.log.push(`${hero.name} takes new spell: ${candidate.name}`);
  }
  hero.upgradePending = null;
}

export function declineUpgrade(heroIndex) {
  const hero = gameState.players[heroIndex];
  if (!hero || !hero.upgradePending) return;
  const { old } = hero.upgradePending;
  if (old) gameState.log.push(`${hero.name} keeps old spell: ${old.name}`);
  else gameState.log.push(`${hero.name} declines upgrade.`);
  hero.upgradePending = null;
}
