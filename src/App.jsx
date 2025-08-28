// src/App.jsx
import React, { useState } from "react";
import ClassIcon from "./ui/ClassIcon";
import SpellIcon from "./ui/SpellIcon";
import EnemyIcon from "./ui/EnemyIcon";
import RollPopup from "./ui/RollPopup";

const [rollPopupFace, setRollPopupFace] = useState(null);
const [rollPopupVersion, setRollPopupVersion] = useState(0); // <-- new


// ---- Simple pools matching your SpellIcon names ----
const TIER1_POOL = ["attack", "heal", "armor", "sweep", "fireball"];
const TIER2_POOL = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"];
const CLASSES = ["thief","judge","tank","vampire","king","lich","paladin","barbarian"];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function rollFor(heroIdx) {
  const faces = facesForHero(heroIdx);
  const landingIndex = (Math.random() * faces.length) | 0;
  const landedFace = faces[landingIndex];

  resolveFace(heroIdx, landedFace);

  // show popup + restart animation
  setRollPopupFace(landedFace);
  setRollPopupVersion((v) => v + 1); // <-- forces RollPopup to restart every time
}
<RollPopup
  face={rollPopupFace}
  version={rollPopupVersion}     // <-- new
  onClose={() => setRollPopupFace(null)}
/>


export default function App() {
  // Phase
  const [phase, setPhase] = useState("battle"); // jump straight to battle for testing popup

  // One hero with 4 slots (slot can be null => blank)
  const [players, setPlayers] = useState([
    {
      id: 0,
      className: "thief",
      hp: 20, maxHp: 20,
      armor: 0,
      stacks: { poison: 0, bomb: 0 },
      spells: [
        { tier: 1, name: "attack" },
        { tier: 1, name: "heal" },
        { tier: 2, name: "poison" },
        null, // blank
      ],
    },
  ]);

  // One enemy, tier 1, index 0
  const [enemies, setEnemies] = useState([
    {
      id: 0,
      name: "Enemy 1",
      tier: 1,
      hp: 10, maxHp: 10,
      armor: 0,
      stacks: { poison: 0, bomb: 0 },
      spriteIndex: 0,
    },
  ]);

  // Log
  const [log, setLog] = useState(["Encounter begins."]);

  // ----- ROLL POPUP STATE (IMPORTANT) -----
  // This is what your RollPopup.jsx needs: a single `face` object or null
  const [rollPopupFace, setRollPopupFace] = useState(null);

  const addLog = (line) => setLog((L) => [...L, line]);

  // Build the 6 die faces for a hero
  function facesForHero(heroIdx) {
    const h = players[heroIdx];
    if (!h) return [];
    const faces = [];

    // 1) class ability
    faces.push({ kind: "class", classId: h.className });

    // 2–5) four spell slots (or blank)
    for (let s = 0; s < 4; s++) {
      const slot = h.spells[s];
      if (slot && slot.name) faces.push({ kind: "spell", spell: { tier: slot.tier, name: slot.name } });
      else faces.push({ kind: "blank" });
    }

    // 6) upgrade
    faces.push({ kind: "upgrade" });

    return faces;
  }

  // Apply effects (stubbed)
  function resolveFace(heroIdx, face) {
    if (!face) return;

    if (face.kind === "class") {
      const heroName = players[heroIdx]?.className || `P${heroIdx + 1}`;
      if (heroName === "tank" || heroName === "king") {
        setPlayers((P) => {
          const n = P.map((h) => ({ ...h }));
          n[heroIdx].armor += 2;
          return n;
        });
        addLog(`P${heroIdx + 1} (${heroName}) gains +2 armor.`);
      } else {
        addLog(`P${heroIdx + 1} uses ${heroName} ability.`);
      }
      return;
    }

    if (face.kind === "spell") {
      const { tier, name } = face.spell;
      const DMG = tier === 1 ? 2 : tier === 2 ? 4 : 6;
      const HEAL = tier === 1 ? 1 : 3;
      const ARMOR = tier === 1 ? 2 : 6;

      if (name === "heal") {
        setPlayers((P) => {
          const n = P.map((h) => ({ ...h }));
          n[heroIdx].hp = clamp(n[heroIdx].hp + HEAL, 0, n[heroIdx].maxHp);
          return n;
        });
        addLog(`P${heroIdx + 1} healed ${HEAL}.`);
        return;
      }

      if (name === "armor") {
        setPlayers((P) => {
          const n = P.map((h) => ({ ...h }));
          n[heroIdx].armor += ARMOR;
          return n;
        });
        addLog(`P${heroIdx + 1} gained ${ARMOR} armor.`);
        return;
      }

      // First alive enemy
      const ei = enemies.findIndex((e) => e.hp > 0);
      if (ei < 0) { addLog(`No enemies alive.`); return; }

      if (name === "fireball") {
        setEnemies((E) => {
          const n = E.map((e) => ({ ...e }));
          n[ei].hp = clamp(n[ei].hp - (tier === 1 ? 1 : tier === 2 ? 3 : 5), 0, n[ei].maxHp);
          return n;
        });
        addLog(`P${heroIdx + 1} cast fireball on E${ei + 1}.`);
        return;
      }

      if (name === "poison") {
        setEnemies((E) => {
          const n = E.map((e) => ({ ...e, stacks: { ...e.stacks } }));
          n[ei].stacks.poison = (n[ei].stacks.poison || 0) + 1;
          return n;
        });
        addLog(`P${heroIdx + 1} applied poison to E${ei + 1}.`);
        return;
      }

      if (name === "bomb") {
        setEnemies((E) => {
          const n = E.map((e) => ({ ...e, stacks: { ...e.stacks } }));
          n[ei].stacks.bomb = (n[ei].stacks.bomb || 0) + 1;
          return n;
        });
        addLog(`P${heroIdx + 1} planted a bomb on E${ei + 1}.`);
        return;
      }

      // Physical (armor mitigates)
      if (name === "attack" || name === "sweep") {
        setEnemies((E) => {
          const n = E.map((e) => ({ ...e }));
          const t = n[ei];
          const mitigated = Math.max(0, DMG - (t.armor || 0));
          t.hp = clamp(t.hp - mitigated, 0, t.maxHp);
          return n;
        });
        addLog(`P${heroIdx + 1} used ${name} on E${ei + 1}.`);
        return;
      }

      addLog(`P${heroIdx + 1} cast ${name} (T${tier}).`);
      return;
    }

    if (face.kind === "upgrade") {
      addLog(`P${heroIdx + 1} rolled Upgrade (UI placeholder).`);
      return;
    }

    if (face.kind === "blank") {
      addLog(`P${heroIdx + 1} rolled Blank.`);
      return;
    }
  }

  // Roll button -> compute faces, pick random, set popup FACE (IMPORTANT)
  function rollFor(heroIdx) {
    const faces = facesForHero(heroIdx);
    if (faces.length !== 6) {
      console.warn("Die faces should be 6; got", faces);
    }
    const landingIndex = (Math.random() * faces.length) | 0;
    const landedFace = faces[landingIndex];

    // Apply immediately, then show popup as visual confirmation
    resolveFace(heroIdx, landedFace);

    // >>> THIS IS WHAT YOUR ROLLPOPUP EXPECTS <<<
    setRollPopupFace(landedFace);
  }

  if (phase === "battle") {
    return (
      <div style={{ minHeight: "100vh", background: "#0e1116", color: "#fff", padding: 16 }}>
        <h1 style={{ marginBottom: 12 }}>Encounter</h1>

        {/* Enemies row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          {enemies.map((e) => {
            const hpPct = Math.max(0, Math.min(1, e.hp / Math.max(1, e.maxHp)));
            return (
              <div key={e.id} style={{
                width: 260,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.04)",
                padding: 12,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <EnemyIcon tier={e.tier} index={e.spriteIndex || 0} size={64} radius={10} />
                  <div>
                    <div style={{ fontWeight: 800 }}>{e.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Tier {e.tier}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
                    <div style={{ width: `${hpPct * 100}%`, height: "100%", background: "#ff6060" }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12 }}>
                    <span>HP {e.hp}/{e.maxHp}</span>
                    <span>Armor {e.armor}</span>
                    <span>PSN {e.stacks.poison || 0}</span>
                    <span>BMB {e.stacks.bomb || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Log */}
        <div style={{
          border: "1px solid rgba(255,255,255,.12)",
          background: "rgba(255,255,255,.04)",
          borderRadius: 12, padding: 12, marginBottom: 12,
          maxHeight: 160, overflowY: "auto"
        }}>
          {log.slice(-50).map((line, i) => (
            <div key={i} style={{ opacity: 0.95 }}>{line}</div>
          ))}
        </div>

        {/* Players row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {players.map((h, i) => {
            const hpPct = Math.max(0, Math.min(1, h.hp / Math.max(1, h.maxHp)));
            return (
              <div key={h.id} style={{
                width: 320,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.04)",
                padding: 12,
                display: "grid",
                gap: 8,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <ClassIcon name={h.className} size={56} radius={10} />
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {h.className} <span style={{ opacity: 0.7 }}>(P{i + 1})</span>
                    </div>
                    <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
                      <div style={{ width: `${hpPct * 100}%`, height: "100%", background: "#ff6060" }} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, display: "flex", gap: 12 }}>
                      <span>HP {h.hp}/{h.maxHp}</span>
                      <span>Armor {h.armor}</span>
                      <span>PSN {h.stacks.poison || 0}</span>
                      <span>BMB {h.stacks.bomb || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Spell slots */}
                <div style={{ display: "flex", gap: 8 }}>
                  {h.spells.map((slot, si) => (
                    <div key={si} style={{
                      width: 64, height: 64, borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.12)",
                      background: "rgba(255,255,255,.06)",
                      display: "grid", placeItems: "center",
                    }}>
                      {slot ? (
                        <SpellIcon tier={slot.tier} name={slot.name} size={56} radius={8} />
                      ) : (
                        <div style={{
                          width: 56, height: 56, borderRadius: 8,
                          border: "2px dashed rgba(255,255,255,.18)",
                          display: "grid", placeItems: "center",
                          fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 700
                        }}>Blank</div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => rollFor(i)}
                    style={{
                      borderRadius: 10,
                      padding: "8px 14px",
                      background: "#2563eb",
                      color: "#fff",
                      fontWeight: 800,
                      border: "1px solid rgba(255,255,255,.2)",
                    }}
                  >
                    Roll
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ROLL POPUP — IMPORTANT: passes a single `face` */}
        <RollPopup
          face={rollPopupFace}
          onClose={() => setRollPopupFace(null)}
        />
      </div>
    );
  }

  // (Optional) loadout placeholder
  return (
    <div style={{ minHeight: "100vh", background: "#0e1116", color: "#fff", padding: 16 }}>
      <h1>Loadout</h1>
      <button onClick={() => setPhase("battle")}>Start</button>
    </div>
  );
}
