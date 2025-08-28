// src/logic/combat.js
import { useEffect, useMemo, useState } from "react";
import { TIER1, TIER2, TIER3, tierFor, isMagic, isPhysical, clamp, d20, pick, wait } from "./constants";

// Basic enemy stat templates
function baseEnemy(tierKey) {
  if (tierKey === "t1") return { hp: 8, armor: 0, base: 2 };
  if (tierKey === "t2") return { hp: 12, armor: 1, base: 3 };
  return { hp: 30, armor: 2, base: 5 }; // boss
}

export function makeEnemy(tierKey, idx) {
  const base = baseEnemy(tierKey);
  return {
    id: idx,
    tier: tierKey,                          // 't1' | 't2' | 'boss'
    name: (tierKey === "t1" && `Enemy ${idx + 1}`) || (tierKey === "t2" && `Elite ${idx + 1}`) || `Boss ${idx + 1}`,
    hp: base.hp,
    armor: base.armor,
    stacks: { poison: 0, bomb: 0 },
    defeated: false,
    spriteIndex: idx % 20,                  // you have 5×4 = 20 frames per sheet
    base: base.base,                         // damage base
    attackType: tierKey === "t2" ? (Math.random() < 0.25 ? "fireball" : "attack") : "attack",
  };
}

function facesForHero(hero) {
  return [
    { kind: "spell", slot: 0, spell: hero.slots[0] },
    { kind: "spell", slot: 1, spell: hero.slots[1] },
    { kind: "spell", slot: 2, spell: hero.slots[2] },
    { kind: "spell", slot: 3, spell: hero.slots[3] },
    { kind: "class" },
    { kind: "upgrade" },
  ];
}

function baseDamage(spell, t = 1) {
  if (spell === "attack") return [2, 4, 6][t - 1] ?? 2;
  if (spell === "sweep")  return [1, 2, 4][t - 1] ?? 1;
  if (spell === "fireball") return [1, 3, 5][t - 1] ?? 1;
  if (spell === "bomb") return 6;
  return 0;
}

// Main hook that owns combat state
export function useCombat(initialPlayers, tierChoice /* 1 | 2 | 'boss' */) {
  const [players, setPlayers] = useState(() => initialPlayers.map((h, i) => ({ ...h, id: i })));
  const [enemies, setEnemies] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [turnPtr, setTurnPtr] = useState(0);
  const [log, setLog] = useState([]);

  // UI helpers
  const [rollPopup, setRollPopup] = useState(null); // { heroId, spinning, face, cycle }
  const [goldSlot, setGoldSlot] = useState(null);
  const [flashHits, setFlashHits] = useState({}); // { 'p-0': ts, 'e-1': ts }
  const [upgradeUi, setUpgradeUi] = useState(null); // { heroId }

  const pushLog = (msg) => setLog((L) => [...L, msg].slice(-200));
  const nextTurn = () => setTurnPtr((p) => (initiative.length ? (p + 1) % initiative.length : 0));
  const allEnemiesDown = () => enemies.every((e) => e.defeated);
  const allPlayersDown = () => players.every((p) => p.defeated);

  // Build enemies + initiative on mount
  useEffect(() => {
    const partySize = players.length;
    const tierKey = tierChoice === "boss" ? "boss" : tierChoice === 1 ? "t1" : "t2";
    const enemyCount = tierKey === "boss" ? 1 : partySize;

    const startEnemies = Array.from({ length: enemyCount }, (_, i) => makeEnemy(tierKey, i));
    const order = [];
    players.forEach((_, i) => order.push({ type: "player", idx: i, roll: d20() }));
    startEnemies.forEach((_, i) => order.push({ type: "enemy", idx: i, roll: d20() }));
    order.sort((a, b) => b.roll - a.roll);

    setEnemies(startEnemies);
    setInitiative(order);
    setTurnPtr(0);
    setLog([]);
    pushLog("Initiative:");
    order.forEach((s) => pushLog(`${s.type === "player" ? "P" : "E"}${s.idx + 1}: ${s.roll}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  // ---------- Rolls ----------
  async function onRoll() {
    const slot = initiative[turnPtr];
    if (!slot || slot.type !== "player") return;
    const hero = players[slot.idx];
    if (!hero || hero.defeated) return;

    const faces = facesForHero(hero);
    const cycles = 10 + Math.floor(Math.random() * 6);
    setRollPopup({ heroId: hero.id, spinning: true, face: null, cycle: 0 });

    for (let i = 0; i < cycles; i++) {
      setRollPopup({ heroId: hero.id, spinning: true, face: faces[i % 6], cycle: i });
      await wait(70);
    }
    const landing = pick(faces);
    setRollPopup({ heroId: hero.id, spinning: false, face: landing, cycle: cycles });

    if (landing.kind === "spell") {
      setGoldSlot(`p-${hero.id}-s${landing.slot}`);
      setTimeout(() => setGoldSlot(null), 900);
    }

    await wait(450);
    setRollPopup(null);

    await resolvePlayerResult(hero, landing);
    if (allEnemiesDown()) { pushLog("Victory!"); return; }
    nextTurn();
  }

  async function resolvePlayerResult(hero, face) {
    if (face.kind === "upgrade") {
      setUpgradeUi({ heroId: hero.id });
      pushLog(`P${hero.id + 1} rolled Upgrade.`);
      return;
    }
    if (face.kind === "class") {
      // Simple class ability: +armor (tank/king +2) else +1
      const inc = hero.class === "tank" || hero.class === "king" ? 2 : 1;
      setPlayers((list) => {
        const next = list.map((h) => ({ ...h, stacks: { ...h.stacks } }));
        next[hero.id].armor = (next[hero.id].armor || 0) + inc;
        return next;
      });
      pushLog(`P${hero.id + 1} used class ability (+${inc} armor).`);
      return;
    }
    if (face.kind === "spell") {
      const s = face.spell || "blank";
      if (s === "blank") { pushLog(`P${hero.id + 1} rolled a blank.`); return; }
      const ei = enemies.findIndex((e) => !e.defeated);
      if (ei === -1) return;
      await applySpellToEnemy(hero.id, ei, s);
    }
  }

  function applyPoisonBombTicks() {
    // Simple example end-of-turn tick (optional extension)
    // currently not invoked automatically; you can call at round end.
  }

  async function applySpellToEnemy(heroId, enemyIdx, spell) {
    const tier = tierFor(spell);
    const dmg = baseDamage(spell, tier);

    setEnemies((list) => {
      const next = list.map((e) => ({ ...e, stacks: { ...e.stacks } }));
      const e = next[enemyIdx];
      if (!e || e.defeated) return next;

      if (isMagic(spell)) {
        if (spell === "poison") {
          e.stacks.poison = (e.stacks.poison || 0) + 1;
        } else {
          e.hp = Math.max(0, e.hp - dmg); // fireball ignores armor
        }
      } else {
        let hit = dmg;
        const a = e.armor || 0;
        const use = Math.min(a, hit);
        e.armor = a - use;
        hit -= use;
        if (hit > 0) e.hp = Math.max(0, e.hp - hit);
        if (spell === "bomb") e.stacks.bomb = (e.stacks.bomb || 0) + 1;
      }

      if (e.hp === 0) e.defeated = true;
      return next;
    });

    pushLog(
      `P${heroId + 1} used ${spell} on E${enemyIdx + 1}${isMagic(spell) ? " (ignores armor)" : ""}.`
    );
  }

  // ---------- Upgrades ----------
  function onUpgradeClose() { setUpgradeUi(null); }

  function onUpgradePick(heroId, slot) {
    setPlayers((list) => {
      const next = list.map((h) => ({ ...h }));
      const h = next[heroId];
      const cur = h.slots[slot];

      let up = cur;
      if (cur === "blank")       up = pick(TIER1);
      else if (TIER1.includes(cur)) up = pick(TIER2);
      else if (TIER2.includes(cur)) up = pick(TIER3);

      h.slots = h.slots.slice();
      h.slots[slot] = up;
      return next;
    });
    pushLog(`P${heroId + 1} upgraded slot ${slot + 1}.`);
    setUpgradeUi(null);
  }

  // ---------- Enemy turns (step-based, with simple hit flash) ----------
  useEffect(() => {
    const slot = initiative[turnPtr];
    if (!slot || slot.type !== "enemy") return;

    (async () => {
      const ei = slot.idx;
      const e = enemies[ei];
      if (!e || e.defeated) { nextTurn(); return; }

      const alive = players.map((p, i) => ({ p, i })).filter((x) => !x.p.defeated);
      if (!alive.length) return;
      const tgt = pick(alive).i;

      // visual hit flash on player
      setFlashHits((f) => ({ ...f, [`p-${tgt}`]: Date.now() }));
      await wait(220);

      const spell = e.attackType || "attack";
      const dmg = e.base || 2;

      setPlayers((list) => {
        const next = list.map((h) => ({ ...h, stacks: { ...h.stacks } }));
        const h = next[tgt];
        if (isMagic(spell)) {
          h.hp = Math.max(0, h.hp - dmg);
        } else {
          const a = h.armor || 0;
          const use = Math.min(a, dmg);
          h.armor = a - use;
          const rest = dmg - use;
          if (rest > 0) h.hp = Math.max(0, h.hp - rest);
        }
        if (h.hp === 0) h.defeated = true;
        return next;
      });

      pushLog(`E${ei + 1} used ${spell} on P${tgt + 1}.`);
      await wait(350);
      if (allPlayersDown()) { pushLog("Defeat…"); return; }
      nextTurn();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnPtr, initiative, enemies]);

  // Public API for the screen
  return {
    // state
    players, setPlayers,
    enemies, setEnemies,
    initiative, turnPtr,
    log,

    // UI helpers
    rollPopup, goldSlot, flashHits,
    upgradeUi,

    // actions
    onRoll,
    onUpgradePick,
    onUpgradeClose,
  };
}
