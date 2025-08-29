// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// Cards & UI
import EnemyCard from "./components/EnemyCard";
import HeroCard from "./components/HeroCard";
import LoadoutScreen from "./ui/LoadoutScreen";
import RollPopup from "./ui/RollPopup";
import UpgradeModal from "./ui/UpgradeModal";
import "./ui/HitFlash.css";

// Battle helpers
import {
  d,
  clamp,
  rollInitiative,
  applyPoisonTick,
  resolveBombsAtStart,
  enemyChooseAction,
  enemyResolveAction,
} from "./engine/combatRunner";

// ---------------------------------------------------------------------------
// Debug toggle (kept lightweight & modular)
function DebugPanel({ open, onClose, state }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", right: 12, bottom: 12, zIndex: 3000,
      width: 360, maxHeight: "70vh", overflow: "auto",
      background: "#0e1116", color: "#fff", border: "1px solid #273142",
      borderRadius: 12, boxShadow: "0 16px 36px rgba(0,0,0,.5)", padding: 10
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <div style={{fontWeight:900}}>Debug</div>
        <button onClick={onClose} style={{background:"transparent", color:"#fff", border:"1px solid #3b4656", borderRadius:8, padding:"4px 8px"}}>Close</button>
      </div>
      <pre style={{fontSize:12, whiteSpace:"pre-wrap"}}>
{JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function App() {
  // ---------- App Phases ----------
  const [phase, setPhase] = useState("loadout"); // 'loadout' | 'battle'

  // ---------- Core State ----------
  const [players, setPlayers] = useState([]); // [{id,className,spells:[{tier,name}|null x4], hp,maxHp,armor,stacks:{poison,bomb}}]
  const [enemies, setEnemies] = useState([]); // [{id,name,tier,hp,maxHp,armor,stacks:{...},spriteIndex}]
  const [order, setOrder] = useState([]);     // initiative tokens: [{type:'player'|'enemy', i, roll}]
  const [turnPtr, setTurnPtr] = useState(0);
  const [log, setLog] = useState([]);

  // ---------- UI: Roll Popup ----------
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupFaces, setPopupFaces] = useState([]);     // 6 faces
  const [popupLanding, setPopupLanding] = useState(0);  // index in faces

  // ---------- UI: Upgrade ----------
  const [upgOpen, setUpgOpen] = useState(false);
  const [upgHeroIndex, setUpgHeroIndex] = useState(null);

  // ---------- Debug ----------
  const [debugOpen, setDebugOpen] = useState(false);

  const addLog = (line) => setLog(L => [...L, line]);

  // ---------- Refs for hit flash ----------
  const playerRefs = useRef([]);
  const enemyRefs = useRef([]);

  const flashCard = (refEl) => {
    if (!refEl || !refEl.current) return;
    const node = refEl.current;
    node.classList.remove("hitFlash");
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    node.offsetHeight;
    node.classList.add("hitFlash");
  };

  // ---------- Faces builder for the spinner ----------
  function facesForHero(heroIdx) {
    const h = players[heroIdx];
    if (!h) return [];
    // 6 faces: [class, spell/blank x4, upgrade]
    const faces = [];
    faces.push({ kind: "class", classId: h.className });
    for (let s = 0; s < 4; s++) {
      const slot = h.spells[s];
      faces.push(
        slot && slot.name
          ? { kind: "spell", spell: { tier: slot.tier, name: slot.name } }
          : { kind: "blank" }
      );
    }
    faces.push({ kind: "upgrade" });
    return faces;
  }

  // ---------- Encounter boot ----------
  function startEncounter(builtPlayers, encounter = { tier: 1 }) {
    // players come from LoadoutScreen with spells set & blanks filled
    setPlayers(builtPlayers);

    // seed enemies: for now spawn number = players (tier 1/2), bosses=1
    const enemyCount =
      encounter.tier >= 3 ? 1 : Math.max(1, builtPlayers.length);

    const seeded = Array.from({ length: enemyCount }, (_, i) => ({
      id: i,
      name: encounter.tier >= 3 ? `Boss ${i + 1}` : `Enemy ${i + 1}`,
      tier: encounter.tier,
      maxHp: encounter.tier >= 3 ? 20 : 12,
      hp: encounter.tier >= 3 ? 20 : 12,
      armor: encounter.tier >= 2 ? 1 : 0,
      stacks: { poison: 0, bomb: 0 },
      spriteIndex: i % 20,
    }));
    setEnemies(seeded);

    const init = rollInitiative(builtPlayers, seeded);
    setOrder(init);
    setTurnPtr(0);
    setLog([
      "Encounter begins.",
      ...init.map(tok =>
        `${tok.type === "player" ? "P" + (tok.i + 1) : "E" + (tok.i + 1)} rolled ${tok.roll}`
      ),
    ]);
    setPhase("battle");
  }

  // ---------- Turn helpers ----------
  const currentTok = order[turnPtr];

  function nextTurn() {
    if (!order.length) return;
    setTurnPtr(t => (t + 1) % order.length);
  }

  function doStartTicks(tok) {
    if (tok.type === "player") {
      setPlayers(P => {
        const n = P.map(h => ({ ...h, stacks: { ...(h.stacks || {}) } }));
        const me = n[tok.i];
        if (!me || me.hp <= 0) return n;

        // Bomb: resolve explosions/passes to first alive enemy
        const enemyAlive = enemies.find(e => e.hp > 0);
        resolveBombsAtStart(me, enemyAlive, `P${tok.i + 1}`).forEach(addLog);

        // Poison: tick and maybe cure
        const { line } = applyPoisonTick(me, `P${tok.i + 1}`);
        if (line) addLog(line);

        return n;
      });
    } else {
      setEnemies(E => {
        const n = E.map(e => ({ ...e, stacks: { ...(e.stacks || {}) } }));
        const me = n[tok.i];
        if (!me || me.hp <= 0) return n;

        const playerAlive = players.find(p => p.hp > 0);
        resolveBombsAtStart(me, playerAlive, `E${tok.i + 1}`).forEach(addLog);

        const { line } = applyPoisonTick(me, `E${tok.i + 1}`);
        if (line) addLog(line);

        return n;
      });
    }
  }

  // Auto-run enemy turns and handle skips for dead units
  useEffect(() => {
    if (phase !== "battle" || !order.length) return;
    const tok = order[turnPtr];

    // Skip dead token
    if (tok?.type === "player") {
      const h = players[tok.i];
      if (!h || h.hp <= 0) {
        nextTurn();
        return;
      }
    } else if (tok?.type === "enemy") {
      const e = enemies[tok.i];
      if (!e || e.hp <= 0) {
        nextTurn();
        return;
      }
    }

    // Start-of-turn ticks
    doStartTicks(tok);

    // Enemy acts automatically after a short delay
    if (tok.type === "enemy") {
      const timer = setTimeout(() => {
        const e = enemies[tok.i];
        if (!e) return;

        const action = enemyChooseAction(e);
        const res = enemyResolveAction(action, e, players.map(p => ({ ...p })));

        if (typeof res?.targetIndex === "number") {
          // flash victim
          if (!playerRefs.current[res.targetIndex]) {
            playerRefs.current[res.targetIndex] = React.createRef();
          }
          flashCard(playerRefs.current[res.targetIndex]);

          // Apply damage already computed in resolver (we just update HP if needed)
          setPlayers(P => {
            const n = P.map(h => ({ ...h }));
            const t = n[res.targetIndex];
            if (t) t.hp = clamp(t.hp, 0, t.maxHp);
            return n;
          });
        }
        if (res?.log) addLog(res.log);
        nextTurn();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [turnPtr, phase, order, players, enemies]); // eslint-disable-line

  // ---------- Player roll / resolution ----------
  function resolveFace(heroIdx, face) {
    const tag = `P${heroIdx + 1}`;

    // Class ability
    if (face.kind === "class") {
      const cls = players[heroIdx]?.className;
      if (cls === "tank" || cls === "king") {
        setPlayers(P => {
          const n = P.map(h => ({ ...h }));
          n[heroIdx].armor += 2;
          return n;
        });
        addLog(`${tag} (${cls}) gains +2 armor.`);
      } else {
        addLog(`${tag} uses ${cls} ability.`);
      }
      nextTurn();
      return;
    }

    // Upgrade
    if (face.kind === "upgrade") {
      setUpgHeroIndex(heroIdx);
      setUpgOpen(true);
      return;
    }

    // Spell
    if (face.kind === "spell") {
      const { tier, name } = face.spell;

      // Heal
      if (name === "heal") {
        const healAmt = tier === 1 ? 1 : tier === 2 ? 3 : 5;
        setPlayers(P => {
          const n = P.map(h => ({ ...h }));
          n[heroIdx].hp = clamp(n[heroIdx].hp + healAmt, 0, n[heroIdx].maxHp);
          return n;
        });
        addLog(`${tag} healed ${healAmt}.`);
        nextTurn();
        return;
      }

      // Armor
      if (name === "armor") {
        const val = tier === 1 ? 2 : tier === 2 ? 6 : 8;
        setPlayers(P => {
          const n = P.map(h => ({ ...h }));
          n[heroIdx].armor += val;
          return n;
        });
        addLog(`${tag} gained ${val} armor.`);
        nextTurn();
        return;
      }

      // Find a live target
      const tIndex = enemies.findIndex(e => e.hp > 0);
      if (tIndex < 0) {
        addLog(`${tag} has no targets.`);
        nextTurn();
        return;
      }

      // Poison (stacks)
      if (name === "poison") {
        setEnemies(E => {
          const n = E.map(e => ({ ...e, stacks: { ...(e.stacks || {}) } }));
          n[tIndex].stacks.poison = (n[tIndex].stacks.poison || 0) + 1;
          return n;
        });
        addLog(`${tag} applied poison to E${tIndex + 1}.`);
        nextTurn();
        return;
      }

      // Bomb (stacks)
      if (name === "bomb") {
        setEnemies(E => {
          const n = E.map(e => ({ ...e, stacks: { ...(e.stacks || {}) } }));
          n[tIndex].stacks.bomb = (n[tIndex].stacks.bomb || 0) + 1;
          return n;
        });
        addLog(`${tag} planted a bomb on E${tIndex + 1}.`);
        nextTurn();
        return;
      }

      // Direct damage spells: attack/sweep/fireball
      // fireball bypasses armor (per earlier rule), attack/sweep reduced by armor
      const base = name === "fireball"
        ? (tier === 1 ? 1 : tier === 2 ? 3 : 5)
        : (tier === 1 ? 2 : tier === 2 ? 4 : 6);

      // flash target
      if (!enemyRefs.current[tIndex]) enemyRefs.current[tIndex] = React.createRef();
      flashCard(enemyRefs.current[tIndex]);

      setEnemies(E => {
        const n = E.map(e => ({ ...e }));
        const t = n[tIndex];
        if (name === "fireball") {
          t.hp = clamp(t.hp - base, 0, t.maxHp);
        } else {
          const mitigated = Math.max(0, base - (t.armor || 0));
          t.hp = clamp(t.hp - mitigated, 0, t.maxHp);
        }
        return n;
      });
      addLog(`${tag} used ${name} on E${tIndex + 1}.`);
      nextTurn();
      return;
    }

    // Blank
    addLog(`${tag} rolled blank.`);
    nextTurn();
  }

  // Clicking Roll on the hero card
  function rollFor(heroIdx) {
    const faces = facesForHero(heroIdx);
    if (!faces.length) return;
    const landingIndex = (Math.random() * faces.length) | 0;

    // open spinner popup (auto-closes internally after result is shown)
    setPopupFaces(faces);
    setPopupLanding(landingIndex);
    setPopupOpen(true);

    // resolve after a bit longer than the popup's spin (RollPopup closes itself)
    const tid = setTimeout(() => {
      resolveFace(heroIdx, faces[landingIndex]);
    }, 1200);
    return () => clearTimeout(tid);
  }

  // ---------- Upgrade modal handlers ----------
  function applyUpgrade(slotIndex, newSpell) {
    const heroIdx = upgHeroIndex;
    setPlayers(P => {
      const n = P.map(h => ({ ...h, spells: h.spells.slice() }));
      n[heroIdx].spells[slotIndex] = newSpell; // newSpell already has correct tier (blank->T1, T1->T2, T2+->T3)
      return n;
    });
    addLog(`P${(upgHeroIndex ?? 0) + 1} upgraded slot ${slotIndex + 1} to ${newSpell.name} (T${newSpell.tier}).`);
    setUpgOpen(false);
    setUpgHeroIndex(null);
    nextTurn();
  }

  // ---------- Layout ----------

  if (phase === "loadout") {
    return (
      <div style={{ minHeight: "100vh", background: "#0e1116", color: "#fff", padding: 16 }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <h1>Party Loadout</h1>
          <button
            onClick={() => setDebugOpen(v=>!v)}
            style={{border:"1px solid #2b3342", background:"transparent", color:"#fff", borderRadius:8, padding:"6px 10px"}}
          >
            {debugOpen ? "Hide Debug" : "Show Debug"}
          </button>
        </div>
        <LoadoutScreen
          // LoadoutScreen should enforce: T1 show 3, pick up to 2; T2 show 2, pick 1; blanks auto-fill
          onDone={(builtPlayers, chosenTier = 1) => startEncounter(builtPlayers, { tier: chosenTier })}
        />
        <DebugPanel
          open={debugOpen}
          onClose={() => setDebugOpen(false)}
          state={{ phase, players, enemies, order, turnPtr, logTail: log.slice(-8) }}
        />
      </div>
    );
  }

  // BATTLE PHASE
  const tok = order[turnPtr];

  return (
    <div style={{ minHeight: "100vh", background: "#0e1116", color: "#fff", padding: 16 }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
        <h1>Battle</h1>
        <button
          onClick={() => setDebugOpen(v=>!v)}
          style={{border:"1px solid #2b3342", background:"transparent", color:"#fff", borderRadius:8, padding:"6px 10px"}}
        >
          {debugOpen ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {/* ENEMIES (top row) */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {enemies.map((e, i) => (
          <div key={e.id} ref={(el)=> (enemyRefs.current[i] = { current: el })}>
            <EnemyCard enemy={e} />
          </div>
        ))}
      </div>

      {/* LOG (center) */}
      <div
        style={{
          border: "1px solid #273142",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          maxHeight: 120,
          overflow: "auto",
          background: "#0b0e13",
        }}
      >
        {log.slice(-5).map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>

      {/* TURN HUD */}
      <div style={{ marginBottom: 10, fontWeight: 800 }}>
        Turn:{" "}
        {tok
          ? tok.type === "player"
            ? `Player ${tok.i + 1}`
            : `Enemy ${tok.i + 1}`
          : "-"}
      </div>

      {/* PLAYERS (bottom row) */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {players.map((h, i) => {
          const myTurn = tok?.type === "player" && tok.i === i;
          return (
            <div key={h.id} ref={(el)=> (playerRefs.current[i] = { current: el })}>
              <HeroCard
                hero={h}
                isActive={!!myTurn}
                onRoll={() => rollFor(i)}
              />
            </div>
          );
        })}
      </div>

      {/* Spinner popup (auto-closes inside the component after result) */}
      <RollPopup
        open={popupOpen}
        faces={popupFaces}
        landingIndex={popupLanding}
        onClose={() => setPopupOpen(false)}
      />

      {/* Upgrade modal (blank -> T1 pool) */}
      <UpgradeModal
        open={upgOpen}
        hero={upgHeroIndex != null ? players[upgHeroIndex] : null}
        onClose={() => { setUpgOpen(false); setUpgHeroIndex(null); nextTurn(); }}
        onApply={applyUpgrade}
      />

      {/* Debug */}
      <DebugPanel
        open={debugOpen}
        onClose={() => setDebugOpen(false)}
        state={{ phase, tok, order, turnPtr, players, enemies, logTail: log.slice(-8) }}
      />
    </div>
  );
}
