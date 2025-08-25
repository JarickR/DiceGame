// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// Modular icon components you already have in your repo
import ClassIcon from "./ui/ClassIcon";
import SpellIcon from "./ui/SpellIcon";
import EnemyIcon from "./ui/EnemyIcon";

// Status stacks (BMB/PSN) and enemy card wrapper
import StatusEffects from "./components/StatusEffects";
import EnemyCard from "./components/EnemyCard.jsx";

// -------------------------------
// CONFIG / CONSTANTS
// -------------------------------
const PARTY_MIN = 1;
const PARTY_MAX = 8;

const CLASSES = [
  "thief",
  "judge",
  "tank",
  "vampire",
  "king",
  "lich",
  "paladin",
  "barbarian",
];

// What each tier pool contains by key name
const TIER1_POOL = ["attack", "heal", "armor", "sweep", "fireball"];
const TIER2_POOL = [
  "attack",
  "heal",
  "armor",
  "concentration",
  "sweep",
  "fireball",
  "poison",
  "bomb",
];
const TIER3_POOL = ["attack", "sweep", "fireball"];

// “Blank” spell
const BLANK = { name: "blank", tier: 0 };

// Quick helper to deep-clone JSONish data
const clone = (v) => JSON.parse(JSON.stringify(v));

const rand = (n) => Math.floor(Math.random() * n);
const choice = (arr) => arr[rand(arr.length)];

// physical vs. unblockable
const isPhysical = (spellName) =>
  ["attack", "sweep", "bomb"].includes(spellName);
const isUnblockable = (spellName) =>
  ["fireball", "poison"].includes(spellName);

// -------------------------------
// ENEMIES (auto-indexed off your 5×4 sheets)
// -------------------------------
const ENEMY_SHEETS = {
  1: { rows: 4, cols: 5, frame: 500, src: "/assets/art/Tier1Enemies.png" },
  2: { rows: 4, cols: 5, frame: 500, src: "/assets/art/Tier2Enemies.png" },
  3: { rows: 4, cols: 5, frame: 500, src: "/assets/art/BossEnemies.png" },
};

// Build a small catalog just to give them HP/Armor and names.
// Index maps frame index (0..19) -> info
function buildEnemyCatalog(tier) {
  const count = ENEMY_SHEETS[tier].rows * ENEMY_SHEETS[tier].cols;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `T${tier}-${i + 1}`,
      tier,
      name:
        tier === 3
          ? `Boss ${i + 1}`
          : tier === 2
          ? `Elite ${i + 1}`
          : `Mob ${i + 1}`,
      hp: tier === 3 ? 30 : tier === 2 ? 16 : 10,
      armor: tier === 3 ? 2 : tier === 2 ? 1 : 0,
      frameIndex: i, // for EnemyIcon
      psn: 0,
      bmb: 0,
      alive: true,
    });
  }
  return out;
}

const ENEMY_CATALOG = {
  1: buildEnemyCatalog(1),
  2: buildEnemyCatalog(2),
  3: buildEnemyCatalog(3),
};

// -------------------------------
/** LOADOUT HELPERS */
// -------------------------------
function uniqueTake(arr, n) {
  const pool = [...arr];
  const picks = [];
  while (picks.length < n && pool.length > 0) {
    const i = rand(pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}

function seedCandidates() {
  // default wants (2×T1 + 1×T2) – you can adjust on the first screen
  return { t1: uniqueTake(TIER1_POOL, 3), t2: uniqueTake(TIER2_POOL, 2) };
}

function padToFourSlots(slots) {
  const padded = [...slots];
  while (padded.length < 4) padded.push(clone(BLANK));
  return padded;
}

// Convert spell name -> spell object
function makeSpell(name) {
  if (name === "blank") return clone(BLANK);
  let tier = 1;
  if (TIER2_POOL.includes(name)) tier = 2;
  if (TIER3_POOL.includes(name)) tier = 3;
  return { name, tier };
}

// -------------------------------
// MAIN APP
// -------------------------------
export default function App() {
  // Phase: "loadout" -> "choose-encounter" -> "battle"
  const [phase, setPhase] = useState("loadout");

  // Party size + per-player wants & picks
  const [partySize, setPartySize] = useState(2);
  const [wantT1, setWantT1] = useState(2); // can be 2 or 3
  const [wantT2, setWantT2] = useState(1); // can be 1 or 2

  const [players, setPlayers] = useState(() =>
    Array.from({ length: partySize }).map((_, i) => ({
      id: `P${i + 1}`,
      name: `P${i + 1}`,
      className: CLASSES[i % CLASSES.length],
      hp: 20,
      armor: 0,
      psn: 0,
      bmb: 0,
      // offerings
      cand: seedCandidates(),
      // picks
      pickT1: [],
      pickT2: [],
      // final 4 slots (filled on finalize)
      slots: [clone(BLANK), clone(BLANK), clone(BLANK), clone(BLANK)],
    }))
  );

  // re-seed when party size changes
  useEffect(() => {
    setPlayers(
      Array.from({ length: partySize }).map((_, i) => ({
        id: `P${i + 1}`,
        name: `P${i + 1}`,
        className: CLASSES[i % CLASSES.length],
        hp: 20,
        armor: 0,
        psn: 0,
        bmb: 0,
        cand: seedCandidates(),
        pickT1: [],
        pickT2: [],
        slots: [clone(BLANK), clone(BLANK), clone(BLANK), clone(BLANK)],
      }))
    );
  }, [partySize]);

  // Encounter & combat state
  const [encounterTier, setEncounterTier] = useState(null); // 1 / 2 / 3
  const [enemies, setEnemies] = useState([]);
  const [log, setLog] = useState([]);

  // Dice animation popup
  const [rollUI, setRollUI] = useState(null);
  // Upgrade flow popup
  const [upgradeUI, setUpgradeUI] = useState(null);

  // Initiative order
  const [turnOrder, setTurnOrder] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // ------------------------------------
  // LOADOUT screen operations
  // ------------------------------------
  const togglePick = (pIdx, tier, name) => {
    setPlayers((prev) => {
      const cp = clone(prev);
      const p = cp[pIdx];
      const arr = tier === 1 ? p.pickT1 : p.pickT2;
      const limit = tier === 1 ? wantT1 : wantT2;

      // cannot pick blanks and cannot exceed limit
      if (name === "blank") return prev;
      if (arr.includes(name)) {
        // unpick
        p[tier === 1 ? "pickT1" : "pickT2"] = arr.filter((n) => n !== name);
      } else {
        if (arr.length >= limit) return prev;
        arr.push(name);
      }
      return cp;
    });
  };

  const finalizeAndStart = () => {
    // lock in four slots per player
    const committed = players.map((p) => {
      const s = [...p.pickT1.map(makeSpell), ...p.pickT2.map(makeSpell)];
      const slots = padToFourSlots(s);
      return { ...p, slots };
    });
    setPlayers(committed);
    setPhase("choose-encounter");
  };

  // ------------------------------------
  // ENCOUNTER SELECTION
  // ------------------------------------
  const startEncounter = (tier) => {
    const count = tier === 3 ? 1 : players.length;
    // pick the first N enemies from the catalog (or randomize)
    const pool = clone(ENEMY_CATALOG[tier]);
    const pulled = uniqueTake(pool, count).map((e, n) => ({
      ...e,
      id: `E${n + 1}`,
      alive: true,
    }));

    setEnemies(pulled);
    setEncounterTier(tier);
    // roll initiative
    const actors = [
      ...players.map((p) => ({ type: "player", id: p.id })),
      ...pulled.map((e) => ({ type: "enemy", id: e.id })),
    ].map((a) => ({ ...a, roll: 1 + rand(20) }));

    actors.sort((a, b) => b.roll - a.roll);
    setTurnOrder(actors);
    setActiveIndex(0);

    setLog((L) => [
      `Initiative: ${actors
        .map((a) => `${a.type === "player" ? a.id : a.id}(${a.roll})`)
        .join(" ▸ ")}`,
      ...L,
    ]);

    setPhase("battle");
  };

  // ------------------------------------
  // UTILS: accessors
  // ------------------------------------
  const getPlayer = (id) => players.find((p) => p.id === id);
  const getEnemy = (id) => enemies.find((e) => e.id === id);

  const mutatePlayer = (id, fn) =>
    setPlayers((prev) => prev.map((p) => (p.id === id ? fn(clone(p)) : p)));
  const mutateEnemy = (id, fn) =>
    setEnemies((prev) => prev.map((e) => (e.id === id ? fn(clone(e)) : e)));

  // ------------------------------------
  // DAMAGE / HEAL rules (armor, unblockable)
  // ------------------------------------
  function applyDamage(target, amount, { spellName }) {
    if (amount <= 0) return;

    const reduceArmor = isPhysical(spellName);
    if (target.type === "player") {
      mutatePlayer(target.id, (p) => {
        let dmg = amount;
        if (reduceArmor && p.armor > 0) {
          const soak = Math.min(p.armor, dmg);
          p.armor -= soak;
          dmg -= soak;
        }
        p.hp = Math.max(0, p.hp - dmg);
        return p;
      });
    } else {
      mutateEnemy(target.id, (e) => {
        let dmg = amount;
        if (reduceArmor && e.armor > 0) {
          const soak = Math.min(e.armor, dmg);
          e.armor -= soak;
          dmg -= soak;
        }
        e.hp = Math.max(0, e.hp - dmg);
        e.alive = e.hp > 0;
        return e;
      });
    }
  }

  function applyHeal(target, amount) {
    if (target.type === "player") {
      mutatePlayer(target.id, (p) => {
        p.hp = Math.min(20, p.hp + amount);
        return p;
      });
    } else {
      mutateEnemy(target.id, (e) => {
        // enemies can heal too if you want
        e.hp = Math.min(e.tier === 3 ? 30 : e.tier === 2 ? 16 : 10, e.hp + amount);
        return e;
      });
    }
  }

  function addArmor(target, amount) {
    if (target.type === "player") {
      mutatePlayer(target.id, (p) => {
        p.armor += amount;
        return p;
      });
    } else {
      mutateEnemy(target.id, (e) => {
        e.armor += amount;
        return e;
      });
    }
  }

  // ------------------------------------
  // TURN / ROLL
  // ------------------------------------
  function nextTurn() {
    setActiveIndex((i) => (i + 1) % turnOrder.length);
  }

  function activeActor() {
    const a = turnOrder[activeIndex];
    if (!a) return null;
    if (a.type === "player") return { ...getPlayer(a.id), type: "player" };
    return { ...getEnemy(a.id), type: "enemy" };
  }

  function playerFaces(p) {
    // six faces: [class, ...4 spell slots, upgrade]
    return [
      { kind: "class", className: p.className },
      ...p.slots.map((s, idx) => ({ kind: "spell", slot: idx, spell: s })),
      { kind: "upgrade" },
    ];
  }

  async function rollForPlayer(p) {
    const faces = playerFaces(p);
    // animation UI
    setRollUI({
      spinning: true,
      face: faces[0],
      landing: null,
    });

    // cycle a few times then land
    const cycles = 16; // feels quick
    for (let i = 0; i < cycles; i++) {
      await new Promise((r) => setTimeout(r, 45));
      setRollUI((u) => ({ ...u, face: faces[i % faces.length] }));
    }
    const landing = faces[rand(faces.length)];
    setRollUI((u) => ({ ...u, landing, spinning: false }));

    // resolve with a small delay to let the user see result
    setTimeout(() => {
      resolveFace(p, landing);
      // auto-hide popup after a brief display
      setTimeout(() => setRollUI(null), 700);
    }, 300);
  }

  function resolveFace(p, face) {
    if (face.kind === "class") {
      // (You can wire class passives here)
      setLog((L) => [`${p.id} activated class ability (${p.className}).`, ...L]);
      nextTurn();
      return;
    }
    if (face.kind === "upgrade") {
      // Step 1: choose slot to upgrade — responsive modal
      setUpgradeUI({
        heroId: p.id,
        step: 1,
        offer: null,
      });
      return;
    }
    // spell face
    const { name, tier } = face.spell;
    if (name === "blank") {
      setLog((L) => [`${p.id} rolled a blank.`, ...L]);
      nextTurn();
      return;
    }

    // very simple targeting: pick first alive enemy; fallback to self for heals
    const targetEnemy = enemies.find((e) => e.alive);
    if (!targetEnemy) {
      setLog((L) => [`No enemies remain.`, ...L]);
      nextTurn();
      return;
    }

    if (name === "attack") {
      const amount = tier * 2; // per your sheet (2 / 4 / 6)
      applyDamage({ type: "enemy", id: targetEnemy.id }, amount, {
        spellName: name,
      });
      setLog((L) => [`${p.id} dealt ${amount} dmg to ${targetEnemy.id}.`, ...L]);
    } else if (name === "heal") {
      const amount = tier === 1 ? 1 : 3;
      applyHeal({ type: "player", id: p.id }, amount);
      setLog((L) => [`${p.id} healed ${amount} HP.`, ...L]);
    } else if (name === "armor") {
      const blocks = tier === 1 ? 2 : 6;
      addArmor({ type: "player", id: p.id }, blocks);
      setLog((L) => [`${p.id} gained ${blocks} armor.`, ...L]);
    } else if (name === "sweep") {
      // damage all enemies (armor-reducible)
      const amount = tier === 1 ? 1 : 2;
      enemies.forEach((e) =>
        applyDamage({ type: "enemy", id: e.id }, amount, { spellName: name })
      );
      setLog((L) => [`${p.id} swept all enemies for ${amount}.`, ...L]);
    } else if (name === "fireball") {
      const amount = tier === 1 ? 1 : tier === 2 ? 3 : 5;
      // ignore armor
      mutateEnemy(targetEnemy.id, (e) => {
        e.hp = Math.max(0, e.hp - amount);
        e.alive = e.hp > 0;
        return e;
      });
      setLog((L) => [
        `${p.id} blasted ${targetEnemy.id} for ${amount} (ignores armor).`,
        ...L,
      ]);
    } else if (name === "poison") {
      // add PSN stack to target (ticks each of their turns)
      mutateEnemy(targetEnemy.id, (e) => {
        e.psn += 1;
        return e;
      });
      setLog((L) => [`${p.id} poisoned ${targetEnemy.id} (+1 PSN).`, ...L]);
    } else if (name === "bomb") {
      mutateEnemy(targetEnemy.id, (e) => {
        e.bmb += 1;
        return e;
      });
      setLog((L) => [`${p.id} bomb-tagged ${targetEnemy.id} (+1 BMB).`, ...L]);
    } else if (name === "concentration") {
      // demo: buff next spell – left as future extension
      setLog((L) => [`${p.id} rolled Concentration (not implemented).`, ...L]);
    }

    nextTurn();
  }

  // Called from Upgrade modal step 1 (choose slot)
  function pickUpgradeSlot(heroId, slotIdx) {
    const hero = getPlayer(heroId);
    const cur = hero.slots[slotIdx];

    // Decide next-tier pool
    let pool = [];
    if (cur.name === "blank") {
      pool = TIER1_POOL;
    } else if (cur.tier === 1) {
      pool = TIER2_POOL;
    } else if (cur.tier === 2) {
      pool = TIER3_POOL;
    } else {
      // tier 3 cannot upgrade further
      pool = [];
    }

    if (pool.length === 0) {
      // nothing to offer
      setUpgradeUI(null);
      return;
    }

    const rolled = choice(pool);
    setUpgradeUI({
      heroId,
      step: 2,
      slotIdx,
      offer: makeSpell(rolled),
    });
  }

  // Accept or keep old
  function commitUpgrade(accept) {
    const u = upgradeUI;
    if (!u) return;
    const hero = getPlayer(u.heroId);
    if (!hero) return;

    mutatePlayer(hero.id, (p) => {
      if (accept) {
        p.slots[u.slotIdx] = u.offer;
      }
      return p;
    });
    setUpgradeUI(null);
    // consume player’s turn after deciding
    nextTurn();
  }

  // ------------------------------------
  // ENEMY “AI” simple turn
  // ------------------------------------
  function enemyAct(e) {
    if (!e.alive) {
      nextTurn();
      return;
    }

    // Tick PSN / BMB at start of enemy turn
    if (e.psn > 0) {
      // 1-in-6 chance to cure 1 stack, else take 1 dmg ignoring armor
      if (rand(6) === 0) {
        mutateEnemy(e.id, (x) => {
          x.psn = Math.max(0, x.psn - 1);
          return x;
        });
        setLog((L) => [`${e.id} shakes off 1 PSN.`, ...L]);
      } else {
        mutateEnemy(e.id, (x) => {
          x.hp = Math.max(0, x.hp - 1);
          x.alive = x.hp > 0;
          return x;
        });
        setLog((L) => [`${e.id} takes 1 PSN dmg.`, ...L]);
      }
    }

    if (e.bmb > 0) {
      // 2-in-3 pass to a random player; 1-in-3 explode for 6
      if (rand(3) < 2) {
        const target = choice(players);
        mutateEnemy(e.id, (x) => {
          x.bmb = Math.max(0, x.bmb - 1);
          return x;
        });
        mutatePlayer(target.id, (p) => {
          p.bmb += 1;
          return p;
        });
        setLog((L) => [`${e.id} passed a bomb to ${target.id}.`, ...L]);
      } else {
        mutateEnemy(e.id, (x) => {
          x.bmb = Math.max(0, x.bmb - 1);
          return x;
        });
        applyDamage({ type: "player", id: choice(players).id }, 6, {
          spellName: "bomb",
        });
        setLog((L) => [`${e.id}'s bomb exploded for 6!`, ...L]);
      }
    }

    // Basic attack: target lowest-HP player
    const alivePlayers = players.filter((p) => p.hp > 0);
    if (alivePlayers.length === 0) {
      setLog((L) => [`All players down.`, ...L]);
      nextTurn();
      return;
    }

    let target = alivePlayers[0];
    for (const p of alivePlayers) if (p.hp < target.hp) target = p;

    const base = e.tier === 3 ? 6 : e.tier === 2 ? 4 : 2;
    applyDamage({ type: "player", id: target.id }, base, {
      spellName: "attack",
    });
    setLog((L) => [`${e.id} hit ${target.id} for ${base}.`, ...L]);

    nextTurn();
  }

  // Advance when activeIndex changes
  useEffect(() => {
    if (phase !== "battle") return;
    const a = turnOrder[activeIndex];
    if (!a) return;
    if (a.type === "enemy") {
      const e = getEnemy(a.id);
      if (!e) return;
      // enemy “thinks” for a moment
      const t = setTimeout(() => enemyAct(e), 500);
      return () => clearTimeout(t);
    }
  }, [activeIndex, phase]); // eslint-disable-line

  // ------------------------------------
  // RENDER — LOADOUT
  // ------------------------------------
  if (phase === "loadout") {
    return (
      <div style={styles.page}>
        <div style={styles.headerRow}>
          <h1 style={{ margin: 0 }}>Choose Classes & Loadouts</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>Party size:</span>
            <select
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              style={styles.select}
            >
              {Array.from({ length: PARTY_MAX }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span style={{ marginLeft: 12 }}>T1 picks:</span>
            <select
              value={wantT1}
              onChange={(e) => setWantT1(Number(e.target.value))}
              style={styles.select}
            >
              {[2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span style={{ marginLeft: 12 }}>T2 picks:</span>
            <select
              value={wantT2}
              onChange={(e) => setWantT2(Number(e.target.value))}
              style={styles.select}
            >
              {[1, 2].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <button style={styles.primary} onClick={finalizeAndStart}>
              Finalize & Continue
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {players.map((p, idx) => (
            <div key={p.id} style={styles.card}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
                  {CLASSES.map((c) => {
                    const selected = p.className === c;
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          setPlayers((prev) =>
                            prev.map((pp, ii) =>
                              ii === idx ? { ...pp, className: c } : pp
                            )
                          )
                        }
                        title={c}
                        style={{
                          ...styles.classButton,
                          outline: selected ? "2px solid rgba(88,168,255,.9)" : "1px solid #2b3240",
                          background: selected ? "rgba(88,168,255,.08)" : "#0e141c",
                        }}
                      >
                        <ClassIcon name={c} size={48} />
                        <div className="tiny" style={{ marginTop: 4, opacity: 0.8 }}>
                          {c}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* T1 pick row */}
              <div style={{ marginTop: 12 }}>
                <div style={styles.rowTitle}>
                  Tier 1 — choose up to {wantT1}
                </div>
                <div style={styles.pickRow}>
                  {p.cand.t1.map((name) => {
                    const picked = p.pickT1.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => togglePick(idx, 1, name)}
                        style={{
                          ...styles.pickTile,
                          outline: picked ? "3px solid rgba(88,168,255,.9)" : "2px solid #223041",
                          background: "#0e141c",
                        }}
                      >
                        <SpellIcon tier={1} name={name} size={96} />
                        <div style={{ marginTop: 6 }}>{name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* T2 pick row */}
              <div style={{ marginTop: 12 }}>
                <div style={styles.rowTitle}>
                  Tier 2 — choose {wantT2}
                </div>
                <div style={styles.pickRow}>
                  {p.cand.t2.map((name) => {
                    const picked = p.pickT2.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => togglePick(idx, 2, name)}
                        style={{
                          ...styles.pickTile,
                          outline: picked ? "3px solid rgba(88,168,255,.9)" : "2px solid #223041",
                          background: "#0e141c",
                        }}
                      >
                        <SpellIcon tier={2} name={name} size={96} />
                        <div style={{ marginTop: 6 }}>{name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------------------------
  // RENDER — ENCOUNTER SELECT
  // ------------------------------------
  if (phase === "choose-encounter") {
    return (
      <div style={styles.page}>
        <div style={styles.headerRow}>
          <h1 style={{ margin: 0 }}>Choose Encounter</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.secondary} onClick={() => startEncounter(1)}>
              Start Tier 1
            </button>
            <button style={styles.secondary} onClick={() => startEncounter(2)}>
              Start Tier 2
            </button>
            <button style={styles.secondary} onClick={() => startEncounter(3)}>
              Start Boss
            </button>
          </div>
        </div>

        <div className="small" style={{ opacity: 0.7 }}>
          Enemy count: Tier 1/2 = party size, Boss = 1. Initiative will be rolled automatically.
        </div>
      </div>
    );
  }

  // ------------------------------------
  // RENDER — BATTLE
  // ------------------------------------
  if (phase === "battle") {
    const active = activeActor();

    return (
      <div style={styles.page}>
        {/* Enemies top */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {enemies.map((e) => (
            <EnemyCard
              key={e.id}
              enemy={e}
              highlight={active && active.type === "enemy" && active.id === e.id}
            >
              <EnemyIcon
                tier={e.tier}
                frameIndex={e.frameIndex}
                size={72}
                rows={ENEMY_SHEETS[e.tier].rows}
                cols={ENEMY_SHEETS[e.tier].cols}
                frame={ENEMY_SHEETS[e.tier].frame}
                src={ENEMY_SHEETS[e.tier].src}
              />
              <StatusEffects psn={e.psn} bmb={e.bmb} />
            </EnemyCard>
          ))}
        </div>

        {/* Center log */}
        <div style={styles.centerLog}>
          <div style={styles.logBox}>
            <div className="small" style={{ opacity: 0.65 }}>
              Turn order:&nbsp;
              {turnOrder.map((a, i) => (
                <span key={i} style={{ marginRight: 8, opacity: i === activeIndex ? 1 : 0.6 }}>
                  {a.id}
                  {i < turnOrder.length - 1 ? " ▸" : ""}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              {log.map((line, i) => (
                <div key={i} style={{ opacity: 0.9 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Players bottom */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {players.map((p) => {
            const faces = playerFaces(p);
            const myTurn = active && active.type === "player" && active.id === p.id;
            const hpPct = `${(100 * p.hp) / 20}%`;
            return (
              <div
                key={p.id}
                style={{
                  ...styles.heroCard,
                  outline: myTurn ? "2px solid rgba(255,186,74,.9)" : "1px solid #223041",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <ClassIcon name={p.className} size={38} />
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {p.className} <span style={{ opacity: 0.6 }}>( {p.id} )</span>
                    </div>
                    <div style={{ position: "relative", height: 10, background: "#1a212c", borderRadius: 6, overflow: "hidden", marginTop: 6 }}>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: hpPct,
                          background: "linear-gradient(90deg,#d84545,#ff5c5c)",
                        }}
                      />
                    </div>
                    <div className="small" style={{ marginTop: 4 }}>
                      HP: {p.hp}/20 · Armor: {p.armor}
                    </div>
                  </div>
                </div>

                {/* six faces row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginTop: 12 }}>
                  {/* class */}
                  <div style={styles.faceCell}>
                    <div style={styles.faceWrap}>
                      <ClassIcon name={p.className} size={36} />
                    </div>
                    <div className="tiny" style={{ marginTop: 4, opacity: 0.8 }}>
                      Class
                    </div>
                  </div>

                  {/* four spells */}
                  {p.slots.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.faceCell,
                        boxShadow:
                          rollUI?.landing?.kind === "spell" &&
                          rollUI.landing.slot === i
                            ? "0 0 0 2px rgba(255,186,74,.95), inset 0 0 0 2px rgba(255,186,74,.85)"
                            : "none",
                        borderRadius: 10,
                      }}
                    >
                      <div style={styles.faceWrap}>
                        {s.name === "blank" ? (
                          <div style={styles.blankFace}>Blank</div>
                        ) : (
                          <SpellIcon tier={s.tier} name={s.name} size={50} />
                        )}
                      </div>
                      <div className="tiny" style={{ marginTop: 4, opacity: 0.8 }}>
                        Slot {i + 1}
                      </div>
                    </div>
                  ))}

                  {/* upgrade */}
                  <div
                    style={{
                      ...styles.faceCell,
                      boxShadow:
                        rollUI?.landing?.kind === "upgrade"
                          ? "0 0 0 2px rgba(255,186,74,.95), inset 0 0 0 2px rgba(255,186,74,.85)"
                          : "none",
                      borderRadius: 10,
                    }}
                  >
                    <div style={styles.faceWrap}>
                      <SpellIcon upgrade size={42} />
                    </div>
                    <div className="tiny" style={{ marginTop: 4, opacity: 0.8 }}>
                      Upgrade
                    </div>
                  </div>
                </div>

                {/* stacks */}
                <div style={{ marginTop: 8 }}>
                  <StatusEffects psn={p.psn} bmb={p.bmb} small />
                </div>

                {/* roll button if my turn */}
                {myTurn && (
                  <div style={{ marginTop: 8 }}>
                    <button style={styles.primary} onClick={() => rollForPlayer(p)}>
                      Roll
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Roll popup */}
        {rollUI && (
          <div style={styles.modalOverlay}>
            <div
              style={{
                width: "100%",
                maxWidth: 360,
                borderRadius: 14,
                border: "1px solid #1f2630",
                background: "#0c1016",
                padding: 16,
                color: "#e8eefc",
                boxShadow: "0 20px 90px rgba(0,0,0,.6)",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Rolling…</div>
              <div style={{ display: "grid", placeItems: "center", padding: 10 }}>
                <div
                  style={{
                    width: 120,
                    height: 78,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 12,
                    background: "#0f1622",
                    outline:
                      !rollUI.spinning && rollUI.landing
                        ? "2px solid rgba(255,186,74,.9)"
                        : "1px solid #1f2835",
                    overflow: "hidden",
                  }}
                >
                  {rollUI.face?.kind === "class" && (
                    <ClassIcon
                      name={getPlayer(turnOrder[activeIndex].id).className}
                      size={60}
                    />
                  )}
                  {rollUI.face?.kind === "spell" && (
                    rollUI.face.spell.name === "blank" ? (
                      <div style={styles.blankFaceBig}>Blank</div>
                    ) : (
                      <SpellIcon
                        tier={rollUI.face.spell.tier}
                        name={rollUI.face.spell.name}
                        size={84}
                      />
                    )
                  )}
                  {rollUI.face?.kind === "upgrade" && <SpellIcon upgrade size={72} />}
                </div>
              </div>
              <div className="small" style={{ textAlign: "center", opacity: 0.8 }}>
                {rollUI.spinning ? "Spinning…" : "Result"}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade modal (Responsive) */}
        {upgradeUI && (
          <div style={styles.modalOverlay}>
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                borderRadius: 14,
                border: "1px solid #1f2630",
                background: "#0c1016",
                padding: 16,
                color: "#e8eefc",
                boxShadow: "0 20px 90px rgba(0,0,0,.6)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800 }}>
                  Upgrade — {upgradeUI.heroId}
                </div>
                <button style={styles.tertiary} onClick={() => setUpgradeUI(null)}>
                  Close
                </button>
              </div>

              {upgradeUI.step === 1 && (
                <>
                  <div style={{ marginTop: 8, opacity: 0.8 }}>
                    Select a spell slot to upgrade:
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    {getPlayer(upgradeUI.heroId).slots.map((s, i) => {
                      const isBlank = s.name === "blank";
                      return (
                        <button
                          key={i}
                          onClick={() => pickUpgradeSlot(upgradeUI.heroId, i)}
                          style={{
                            ...styles.upgradeTile,
                            background: "#0f1622",
                            outline: "1px solid #1f2835",
                          }}
                        >
                          <div style={{ display: "grid", placeItems: "center", padding: 10 }}>
                            {isBlank ? (
                              <div style={styles.blankFaceBig}>Blank</div>
                            ) : (
                              <SpellIcon tier={s.tier} name={s.name} size={90} />
                            )}
                          </div>
                          <div className="small" style={{ opacity: 0.8, marginTop: 6 }}>
                            Slot {i + 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {upgradeUI.step === 2 && (
                <>
                  <div style={{ marginTop: 8, opacity: 0.8 }}>
                    You rolled:
                  </div>
                  <div style={{ display: "grid", placeItems: "center", padding: 12 }}>
                    <SpellIcon
                      tier={upgradeUI.offer.tier}
                      name={upgradeUI.offer.name}
                      size={110}
                    />
                    <div style={{ marginTop: 8, fontWeight: 700 }}>
                      {upgradeUI.offer.name} (T{upgradeUI.offer.tier})
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button style={styles.primary} onClick={() => commitUpgrade(true)}>
                      Take Upgrade
                    </button>
                    <button style={styles.secondary} onClick={() => commitUpgrade(false)}>
                      Keep Old
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return <div style={styles.page}>Loading…</div>;
}

// -------------------------------
// STYLES
// -------------------------------
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0f15",
    color: "#e8eefc",
    fontFamily:
      "ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
    padding: 16,
    display: "grid",
    gap: 16,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  select: {
    background: "#0f1622",
    border: "1px solid #2b3240",
    color: "#cfe2ff",
    borderRadius: 8,
    padding: "6px 8px",
  },
  primary: {
    background: "linear-gradient(180deg,#4ea1ff,#3b84d9)",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },
  secondary: {
    background: "#0f1622",
    color: "#cfe2ff",
    border: "1px solid #2b3240",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },
  tertiary: {
    background: "#0f1622",
    color: "#bfcde4",
    border: "1px solid #2b3240",
    padding: "6px 10px",
    borderRadius: 10,
    cursor: "pointer",
  },
  card: {
    background: "#0e141c",
    border: "1px solid #2b3240",
    borderRadius: 12,
    padding: 12,
  },
  rowTitle: { fontWeight: 700, marginBottom: 8 },
  pickRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  pickTile: {
    width: 150,
    borderRadius: 12,
    padding: 10,
    color: "#dfe9ff",
    cursor: "pointer",
  },
  classButton: {
    display: "grid",
    placeItems: "center",
    padding: 8,
    borderRadius: 10,
    cursor: "pointer",
    width: 76,
    background: "#0e141c",
  },
  centerLog: {
    display: "grid",
    placeItems: "center",
  },
  logBox: {
    width: "100%",
    maxWidth: 920,
    minHeight: 120,
    background: "#0e141c",
    border: "1px solid #2b3240",
    borderRadius: 12,
    padding: 12,
  },
  heroCard: {
    background: "#0e141c",
    borderRadius: 12,
    padding: 12,
    height: 190, // lock height so grid stays even
  },
  faceCell: {
    display: "grid",
    placeItems: "center",
    padding: 6,
    background: "#0f1622",
    border: "1px solid #1f2835",
    borderRadius: 10,
    minHeight: 86,
  },
  faceWrap: {
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: 60,
  },
  blankFace: {
    display: "grid",
    placeItems: "center",
    width: 54,
    height: 36,
    borderRadius: 8,
    border: "1px dashed #3a455a",
    color: "#9fb4d9",
    fontSize: 12,
  },
  blankFaceBig: {
    display: "grid",
    placeItems: "center",
    width: 120,
    height: 78,
    borderRadius: 12,
    border: "1px dashed #3a455a",
    color: "#b8c8e6",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 999,
    padding: 16,
  },
  upgradeTile: {
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    padding: 8,
    color: "#dfe9ff",
    cursor: "pointer",
  },
};
