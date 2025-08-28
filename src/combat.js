// src/combat.js
// Self-contained combat core for Dice Arena (PvE).
// - Initiative (d20)
// - Turn loop (players then enemies based on initiative order)
// - Roll resolution for players (6 faces)
// - Enemy AI placeholder (simple target + basic damage)
// - Poison/Bomb stacks processing at start of each hero turn
// - Armor rules: physical spells reduced by armor; fireball/poison bypass armor

export const FACE_TYPES = {
  CLASS: "class",        // class ability (face 1 of 6)
  SPELL: "spell",        // faces 2-5 (spells from loadout slots 1-4)
  UPGRADE: "upgrade",    // face 6
};

// convenience: what counts as "physical" (reduced by armor)
export function isPhysical(spellName) {
  return spellName === "attack" || spellName === "sweep" || spellName === "bomb";
}

// ===== Helpers =====
export const d = (n) => Math.floor(Math.random() * n) + 1;
export const d20 = () => d(20);
export const d6 = () => d(6);

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ===== Combat state factory =====
export function createCombatState(players, enemies) {
  // Players: [{ id, name, classId, hp, armor, faces:[{kind,slot,spell?}], stacks:{psn,bmb}, ... }]
  // Enemies:  [{ id, tier, name, hp, armor, ai:{...}, stacks:{psn,bmb}, ... }]
  const turn = {
    round: 1,
    order: [],        // list of tokens {type:'player'|'enemy', id}
    turnIdx: 0,
    phase: "init",    // 'init'|'play'|'victory'|'defeat'
    log: [],
    initiativeRolls: [],
  };

  // deep ensure stacks
  players.forEach(p => { p.stacks = p.stacks || { psn: 0, bmb: 0 }; });
  enemies.forEach(e => { e.stacks = e.stacks || { psn: 0, bmb: 0 }; });

  return { players, enemies, turn };
}

// ===== Initiative =====
export function rollInitiative(state) {
  const { players, enemies, turn } = state;
  turn.initiativeRolls = [];

  players.forEach(p => {
    const r = d20();
    turn.initiativeRolls.push({ type: "player", id: p.id, name: p.name || p.classId, roll: r });
  });
  enemies.forEach(e => {
    const r = d20();
    turn.initiativeRolls.push({ type: "enemy", id: e.id, name: e.name, roll: r });
  });

  // sort high to low
  turn.order = [...turn.initiativeRolls]
    .sort((a,b) => b.roll - a.roll)
    .map(x => ({ type: x.type, id: x.id }));

  turn.turnIdx = 0;
  turn.phase = "play";
  logLine(state, `Initiative: ` + turn.initiativeRolls
    .map(r => `${r.name} ${r.roll}`)
    .sort((a,b)=>Number(b.split(" ").at(-1))-Number(a.split(" ").at(-1)))
    .join(" | "));
}

export function currentToken(state) {
  const { turn } = state;
  return turn.order[turn.turnIdx];
}

export function advanceTurn(state) {
  const { turn } = state;
  turn.turnIdx += 1;
  if (turn.turnIdx >= turn.order.length) {
    turn.turnIdx = 0;
    turn.round += 1;
    logLine(state, `— Round ${turn.round} —`);
  }
}

export function isTeamDefeated(state, team) {
  if (team === "players") return state.players.every(p => p.hp <= 0);
  if (team === "enemies") return state.enemies.every(e => e.hp <= 0);
  return false;
}

export function checkVictory(state) {
  if (isTeamDefeated(state, "enemies")) {
    state.turn.phase = "victory";
    logLine(state, `Victory!`);
    return true;
  }
  if (isTeamDefeated(state, "players")) {
    state.turn.phase = "defeat";
    logLine(state, `Defeat...`);
    return true;
  }
  return false;
}

function logLine(state, text) {
  state.turn.log.push({ id: cryptoRandom(), text, ts: Date.now() });
}

function cryptoRandom() {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return String(a[0]);
  } catch {
    return String(Math.random());
  }
}

// ===== Roll faces for a player =====
export function rollFaceForPlayer(player) {
  const r = d6();
  if (r === 1) return { kind: FACE_TYPES.CLASS, roll: r };            // class ability
  if (r === 6) return { kind: FACE_TYPES.UPGRADE, roll: r };
  // 2..5 map to slots 1..4
  const slot = r - 1;
  const chosen = player.faces?.[slot - 1]; // slots 1..4 -> index 0..3
  if (!chosen || chosen.kind !== "spell") {
    return { kind: FACE_TYPES.SPELL, roll: r, slot, spell: { name: "blank", tier: 0 } };
  }
  return { kind: FACE_TYPES.SPELL, roll: r, slot, spell: chosen.spell };
}

// ===== Poison/Bomb start-of-turn processing (heroes & enemies) =====
export function processStartOfTurnStacks(state, token) {
  if (token.type === "player") {
    const p = state.players.find(x => x.id === token.id);
    if (!p || p.hp <= 0) return;
    // Poison: 5 faces deal 1 dmg (true dmg); 1 face cures 1 stack.
    if (p.stacks.psn > 0) {
      if (d6() === 6) {
        p.stacks.psn = Math.max(0, p.stacks.psn - 1);
        logLine(state, `${p.name || p.classId} cured 1 Poison stack.`);
      } else {
        const dmg = p.stacks.psn; // 1 per stack
        p.hp = clamp(p.hp - dmg, 0, 20);
        logLine(state, `${p.name || p.classId} takes ${dmg} poison damage.`);
      }
    }
    // Bomb: 2/3 pass; 1/3 explode (6 dmg physical, takes armor)
    if (p.stacks.bmb > 0) {
      const roll = d6();
      if (roll <= 4) {
        // pass to any enemy (choose highest hp enemy)
        const tgt = state.enemies.filter(e=>e.hp>0).sort((a,b)=>b.hp-a.hp)[0];
        if (tgt) {
          p.stacks.bmb -= 1;
          tgt.stacks.bmb += 1;
          logLine(state, `${p.name || p.classId} passes a Bomb stack to ${tgt.name}.`);
        }
      } else {
        p.stacks.bmb -= 1;
        const raw = 6;
        const taken = Math.max(0, raw - (p.armor || 0));
        p.hp = clamp(p.hp - taken, 0, 20);
        logLine(state, `Bomb explodes on ${p.name || p.classId} for ${taken} damage.`);
      }
    }
  } else {
    const e = state.enemies.find(x => x.id === token.id);
    if (!e || e.hp <= 0) return;
    // Enemies: similar logic
    if (e.stacks.psn > 0) {
      if (d6() === 6) {
        e.stacks.psn = Math.max(0, e.stacks.psn - 1);
        logLine(state, `${e.name} cured 1 Poison stack.`);
      } else {
        const dmg = e.stacks.psn;
        e.hp = Math.max(0, e.hp - dmg);
        logLine(state, `${e.name} takes ${dmg} poison damage.`);
      }
    }
    if (e.stacks.bmb > 0) {
      const roll = d6();
      if (roll <= 4) {
        const tgt = state.players.filter(p=>p.hp>0).sort((a,b)=>b.hp-a.hp)[0];
        if (tgt) {
          e.stacks.bmb -= 1;
          tgt.stacks.bmb += 1;
          logLine(state, `${e.name} passes a Bomb stack to ${tgt.name || tgt.classId}.`);
        }
      } else {
        e.stacks.bmb -= 1;
        const raw = 6;
        const taken = Math.max(0, raw - (e.armor || 0));
        e.hp = Math.max(0, e.hp - taken);
        logLine(state, `Bomb explodes on ${e.name} for ${taken} damage.`);
      }
    }
  }
}

// ===== Player action: resolve roll =====
export function applyPlayerRoll(state, playerId, face, targetId) {
  const p = state.players.find(x => x.id === playerId);
  if (!p || p.hp <= 0) return;

  if (face.kind === FACE_TYPES.CLASS) {
    // Class ability hook — feel free to expand per class
    logLine(state, `${p.name || p.classId} activates class ability (placeholder).`);
    return;
  }
  if (face.kind === FACE_TYPES.UPGRADE) {
    // handled by UI to open upgrade modal
    logLine(state, `${p.name || p.classId} may upgrade a spell.`);
    return;
  }
  if (face.kind === FACE_TYPES.SPELL) {
    const s = face.spell?.name || "blank";
    if (s === "blank") {
      logLine(state, `${p.name || p.classId} rolled a blank.`);
      return;
    }
    // target default: first alive enemy
    let enemy = state.enemies.find(e => e.id === targetId && e.hp > 0);
    if (!enemy) enemy = state.enemies.find(e => e.hp > 0);

    switch (s) {
      case "attack": {
        if (!enemy) { logLine(state, `No enemy to attack.`); return; }
        const base = face.spell.tier === 3 ? 6 : face.spell.tier === 2 ? 4 : 2;
        const dmg = Math.max(0, base - (enemy.armor || 0));
        enemy.hp = Math.max(0, enemy.hp - dmg);
        logLine(state, `${p.name || p.classId} attacks ${enemy.name} for ${dmg}.`);
        break;
      }
      case "sweep": {
        const base = face.spell.tier === 3 ? 4 : face.spell.tier === 2 ? 2 : 1;
        const victims = state.enemies.filter(e => e.hp > 0);
        victims.forEach(v => {
          const dmg = Math.max(0, base - (v.armor || 0));
          v.hp = Math.max(0, v.hp - dmg);
        });
        logLine(state, `${p.name || p.classId} sweeps all enemies for up to ${base} each.`);
        break;
      }
      case "heal": {
        const amt = face.spell.tier === 3 ? 3 : face.spell.tier === 2 ? 2 : 1;
        p.hp = clamp(p.hp + amt, 0, 20);
        logLine(state, `${p.name || p.classId} heals ${amt}.`);
        break;
      }
      case "armor": {
        const amt = face.spell.tier === 2 ? 6 : 2; // spec: T2=6, T1=2
        p.armor = (p.armor || 0) + amt;
        logLine(state, `${p.name || p.classId} gains ${amt} armor.`);
        break;
      }
      case "concentration": {
        // UI already handles doubling effects by queuing — here just log it
        logLine(state, `${p.name || p.classId} concentrates — next effect doubled (UI handles).`);
        break;
      }
      case "fireball": {
        if (!enemy) { logLine(state, `No enemy to target.`); return; }
        const dmg = face.spell.tier === 3 ? 5 : face.spell.tier === 2 ? 3 : 1; // Ignores armor
        enemy.hp = Math.max(0, enemy.hp - dmg);
        logLine(state, `${p.name || p.classId} casts Fireball on ${enemy.name} for ${dmg} (ignores armor).`);
        break;
      }
      case "poison": {
        if (!enemy) { logLine(state, `No enemy to target.`); return; }
        enemy.stacks.bmb = enemy.stacks.bmb || 0; // keep parity
        enemy.stacks.psn = (enemy.stacks.psn || 0) + 1;
        logLine(state, `${p.name || p.classId} applies 1 Poison stack to ${enemy.name}.`);
        break;
      }
      case "bomb": {
        if (!enemy) { logLine(state, `No enemy to target.`); return; }
        enemy.stacks.bmb = (enemy.stacks.bmb || 0) + 1;
        logLine(state, `${p.name || p.classId} gives a Bomb stack to ${enemy.name}.`);
        break;
      }
      default:
        logLine(state, `${p.name || p.classId} did something (spell=${s}).`);
    }
  }
}

// ===== Enemy action =====
// Super simple AI: attack lowest-armor player with physical attack 2
export function enemyTakeTurn(state, enemyId) {
  const e = state.enemies.find(x => x.id === enemyId);
  if (!e || e.hp <= 0) return;

  // choose target: player with lowest armor > then lowest hp as tie-break
  const tgt = state.players
    .filter(p => p.hp > 0)
    .sort((a,b) => (a.armor||0) - (b.armor||0) || a.hp - b.hp)[0];

  if (!tgt) return;

  // simple physical hit = 2
  const base = 2;
  const taken = Math.max(0, base - (tgt.armor || 0));
  tgt.hp = clamp(tgt.hp - taken, 0, 20);
  logLine(state, `${e.name} attacks ${tgt.name || tgt.classId} for ${taken}.`);
}

// ===== Turn driver =====
export function startNextTurn(state) {
  if (checkVictory(state)) return;

  const tok = currentToken(state);
  processStartOfTurnStacks(state, tok);
}

export function endTurn(state) {
  advanceTurn(state);
  startNextTurn(state);
}
