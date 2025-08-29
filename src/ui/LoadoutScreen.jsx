import React, { useMemo, useState } from "react";
import ClassIcon from "../ui/ClassIcon";
import SpellIcon from "../ui/SpellIcon";

// your pools must line up with the sprite names in SpellIcon
const T1_POOL = ["attack", "heal", "armor", "sweep", "fireball"];
const T2_POOL = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"];
const CLASSES = ["thief","judge","tank","vampire","king","lich","paladin","barbarian"];

function pickNFrom(array, n) {
  const pool = [...array];
  const out = [];
  while (out.length < n && pool.length) {
    const i = (Math.random() * pool.length) | 0;
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export default function LoadoutScreen({
  partySize = 1,
  onDone
}) {
  const [classes, setClasses] = useState(Array.from({ length: partySize }, () => "thief"));

  // random 3 tier1 / 2 tier2 options for each player
  const [t1Options] = useState(() => Array.from({ length: partySize }, () => pickNFrom(T1_POOL, 3)));
  const [t2Options] = useState(() => Array.from({ length: partySize }, () => pickNFrom(T2_POOL, 2)));

  // selections per player
  const [t1Selected, setT1Selected] = useState(() => Array.from({ length: partySize }, () => []));
  const [t2Selected, setT2Selected] = useState(() => Array.from({ length: partySize }, () => []));

  const canFinish = useMemo(() => true, []);

  function toggleT1(pIdx, name) {
    setT1Selected((S) => {
      const n = S.map((row) => [...row]);
      const row = n[pIdx];
      const i = row.indexOf(name);
      if (i >= 0) row.splice(i, 1);
      else if (row.length < 2) row.push(name);
      return n;
    });
  }

  function toggleT2(pIdx, name) {
    setT2Selected((S) => {
      const n = S.map((row) => [...row]);
      const row = n[pIdx];
      const i = row.indexOf(name);
      if (i >= 0) row.splice(i, 1);
      else if (row.length < 1) row.push(name);
      return n;
    });
  }

  function finalize() {
    // Build player objects. Fill to 4 spell slots. Unpicked become blanks.
    const players = classes.map((cls, idx) => {
      const s1 = t1Selected[idx];               // 0..2 picks
      const s2 = t2Selected[idx];               // 0..1 pick

      const slotNames = [
        ...(s1[0] ? [{ tier: 1, name: s1[0] }] : [null]),
        ...(s1[1] ? [{ tier: 1, name: s1[1] }] : [null]),
        ...(s2[0] ? [{ tier: 2, name: s2[0] }] : [null]),
        null, // 4th slot always blank to start (fits your rules: 4 total slots)
      ].slice(0,4);

      return {
        id: idx,
        className: cls,
        hp: 20, maxHp: 20,
        armor: 0,
        stacks: { poison: 0, bomb: 0 },
        spells: slotNames
      };
    });

    if (onDone) onDone(players);
  }

  return (
    <div style={{ color: "#fff", padding: 16 }}>
      <h1>Choose Classes & Loadouts</h1>

      {classes.map((cls, pIdx) => (
        <div key={pIdx} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <ClassIcon name={cls} size={40} />
            <strong>Player {pIdx + 1}</strong>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => setClasses((C) => C.map((x, i) => (i === pIdx ? c : x)))}
                style={{
                  width: 88, height: 88, borderRadius: 12,
                  border: c === cls ? "2px solid #d4a11d" : "1px solid rgba(255,255,255,0.18)",
                  background: "transparent", display: "grid", placeItems: "center", cursor: "pointer"
                }}
              >
                <ClassIcon name={c} size={44} />
              </button>
            ))}
          </div>

          <div style={{ fontWeight: 700, marginBottom: 6 }}>Tier 1 — pick up to 2 (shown 3)</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            {t1Options[pIdx].map((name) => {
              const active = t1Selected[pIdx].includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleT1(pIdx, name)}
                  style={{
                    width: 120, height: 120, borderRadius: 14,
                    background: active ? "rgba(212,161,29,0.12)" : "rgba(255,255,255,0.06)",
                    border: active ? "2px solid #d4a11d" : "1px solid rgba(255,255,255,0.12)",
                    display:"grid", placeItems:"center", cursor:"pointer"
                  }}
                >
                  <SpellIcon tier={1} name={name} size={72} />
                  <div style={{ marginTop: 6 }}>{name}</div>
                </button>
              );
            })}
          </div>

          <div style={{ fontWeight: 700, marginBottom: 6 }}>Tier 2 — pick 1 (shown 2)</div>
          <div style={{ display: "flex", gap: 12 }}>
            {t2Options[pIdx].map((name) => {
              const active = t2Selected[pIdx].includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleT2(pIdx, name)}
                  style={{
                    width: 120, height: 120, borderRadius: 14,
                    background: active ? "rgba(212,161,29,0.12)" : "rgba(255,255,255,0.06)",
                    border: active ? "2px solid #d4a11d" : "1px solid rgba(255,255,255,0.12)",
                    display:"grid", placeItems:"center", cursor:"pointer"
                  }}
                >
                  <SpellIcon tier={2} name={name} size={72} />
                  <div style={{ marginTop: 6 }}>{name}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button
          onClick={finalize}
          style={{ padding:"10px 16px", borderRadius:10, border:"1px solid rgba(255,255,255,0.18)", background:"#1f6feb", color:"#fff", fontWeight:800 }}
          disabled={!canFinish}
        >
          Finalize & Start
        </button>
      </div>
    </div>
  );
}
