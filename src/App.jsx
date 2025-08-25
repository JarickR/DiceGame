// src/App.jsx
import React, { useMemo, useState } from "react";
import ClassIcon from "./ui/ClassIcon";
import SpellIcon from "./ui/SpellIcon";
import EnemyIcon from "./ui/EnemyIcon";

// ------------------------------
// Spell pools by tier (names must match SpellIcon indices)
// ------------------------------
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

// ------------------------------
// Small helpers
// ------------------------------
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

function pickRandomDistinct(arr, n) {
  const out = [];
  const bag = [...arr];
  while (out.length < Math.min(n, bag.length)) {
    const i = Math.floor(Math.random() * bag.length);
    out.push(bag.splice(i, 1)[0]);
  }
  return out;
}

function PlayerPanel({
  idx,
  player,
  setPlayer,
  t1Max,
  t2Max,
  classSelectedGlow = true,
}) {
  // random options are generated once per player-panel mount
  const tier1Options = useMemo(() => pickRandomDistinct(TIER1_POOL, 3), []);
  const tier2Options = useMemo(() => pickRandomDistinct(TIER2_POOL, 2), []);

  const classNames = [
    "thief",
    "judge",
    "tank",
    "vampire",
    "king",
    "lich",
    "paladin",
    "barbarian",
  ];

  const toggleT1 = (name) => {
    let next = [...player.tier1];
    const i = next.indexOf(name);
    if (i >= 0) {
      next.splice(i, 1);
    } else if (next.length < t1Max) {
      next.push(name);
    }
    setPlayer({ ...player, tier1: next });
  };

  const toggleT2 = (name) => {
    let next = [...player.tier2];
    const i = next.indexOf(name);
    if (i >= 0) {
      next.splice(i, 1);
    } else if (next.length < t2Max) {
      next.push(name);
    }
    setPlayer({ ...player, tier2: next });
  };

  const onClass = (name) => setPlayer({ ...player, cls: name });

  const pickedOK =
    player.cls &&
    player.tier1.length <= t1Max &&
    player.tier2.length <= t2Max;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 10, color: "#fff" }}>
        Player {idx + 1}
      </div>

      {/* Classes */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {classNames.map((name) => {
          const selected = player.cls === name;
          return (
            <button
              key={name}
              onClick={() => onClass(name)}
              title={name}
              style={{
                background: selected ? "rgba(46, 142, 255, 0.12)" : "transparent",
                border: selected
                  ? "2px solid rgba(46,142,255, 0.9)"
                  : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 8,
                cursor: "pointer",
                display: "grid",
                gap: 6,
                placeItems: "center",
                color: "#bbb",
                width: 100,
              }}
            >
              <ClassIcon
                name={name}
                size={64}
                radius={10}
                style={{
                  boxShadow:
                    selected && classSelectedGlow ? "0 0 0 3px rgba(255,215,0,0.65)" : "none",
                }}
              />
              <div style={{ fontSize: 12, color: selected ? "#fff" : "#bbb" }}>{name}</div>
            </button>
          );
        })}
      </div>

      {/* Tier 1 */}
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#fff" }}>
        Tier 1 — choose up to {t1Max}
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 16 }}>
        {tier1Options.map((name) => {
          const selected = player.tier1.includes(name);
          return (
            <button
              key={name}
              onClick={() => toggleT1(name)}
              style={{
                background: selected ? "rgba(255,215,0,0.10)" : "transparent",
                border: selected
                  ? "2px solid rgba(255,215,0,0.9)"
                  : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 12,
                width: 180,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                gap: 8,
              }}
            >
              <SpellIcon tier={1} name={name} size={96} radius={10} />
              <div style={{ color: "#ddd", fontSize: 13 }}>{name}</div>
            </button>
          );
        })}
      </div>

      {/* Tier 2 */}
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#fff" }}>
        Tier 2 — choose {t2Max}
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {tier2Options.map((name) => {
          const selected = player.tier2.includes(name);
          return (
            <button
              key={name}
              onClick={() => toggleT2(name)}
              style={{
                background: selected ? "rgba(255,215,0,0.10)" : "transparent",
                border: selected
                  ? "2px solid rgba(255,215,0,0.9)"
                  : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 12,
                width: 180,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                gap: 8,
              }}
            >
              <SpellIcon tier={2} name={name} size={96} radius={10} />
              <div style={{ color: "#ddd", fontSize: 13 }}>{name}</div>
            </button>
          );
        })}
      </div>

      {!pickedOK && (
        <div style={{ marginTop: 10, color: "#f66", fontSize: 13 }}>
          Pick a class and up to {t1Max} Tier-1 and {t2Max} Tier-2 spells.
        </div>
      )}
    </div>
  );
}

export default function App() {
  // basic knobs
  const [partySize, setPartySize] = useState(2);
  const [t1Picks, setT1Picks] = useState(2);
  const [t2Picks, setT2Picks] = useState(1);
  const [debug, setDebug] = useState(false);

  // players state
  const [players, setPlayers] = useState(() =>
    Array.from({ length: 2 }, () => ({ cls: "", tier1: [], tier2: [] }))
  );

  // Resize players if party size changes
  const ensurePlayers = (n) => {
    setPlayers((prev) => {
      const out = [...prev];
      if (out.length < n) {
        while (out.length < n) out.push({ cls: "", tier1: [], tier2: [] });
      } else if (out.length > n) {
        out.length = n;
      }
      return out;
    });
  };

  // handlers
  const onPartyChange = (n) => {
    const v = clamp(parseInt(n || 2, 10), 1, 8);
    setPartySize(v);
    ensurePlayers(v);
  };

  const ready =
    players.length === partySize &&
    players.every((p) => p.cls && p.tier1.length <= t1Picks && p.tier2.length <= t2Picks);

  return (
    <div style={{ padding: 16, color: "#fff" }}>
      <h1 style={{ marginBottom: 12 }}>Choose Classes & Loadouts</h1>

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
        <label>
          Party:&nbsp;
          <select value={partySize} onChange={(e) => onPartyChange(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label>
          T1 picks:&nbsp;
          <select value={t1Picks} onChange={(e) => setT1Picks(parseInt(e.target.value, 10))}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label>
          T2 picks:&nbsp;
          <select value={t2Picks} onChange={(e) => setT2Picks(parseInt(e.target.value, 10))}>
            {[1, 2].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setDebug((d) => !d)}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.2)",
            background: debug ? "rgba(46,142,255,0.15)" : "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {debug ? "Hide Debug" : "Show Debug"}
        </button>

        <button
          disabled={!ready}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: ready ? "rgb(59,130,246)" : "rgba(255,255,255,0.2)",
            color: "#fff",
            fontWeight: 700,
            cursor: ready ? "pointer" : "not-allowed",
          }}
          onClick={() => {
            // Hand off to your engine / next screen
            console.log("Finalize", { players, partySize, t1Picks, t2Picks });
            alert("Loadouts finalized (check console). Wire this to your engine's start.");
          }}
        >
          Finalize & Continue
        </button>
      </div>

      {/* Players */}
      {players.map((p, i) => (
        <PlayerPanel
          key={i}
          idx={i}
          player={p}
          t1Max={t1Picks}
          t2Max={t2Picks}
          setPlayer={(np) =>
            setPlayers((prev) => {
              const out = [...prev];
              out[i] = np;
              return out;
            })
          }
        />
      ))}

      {/* Tiny enemy sprite proof row */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Enemy sprite quick-check</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <EnemyIcon tier={1} index={0} size={72} />
          <EnemyIcon tier={1} index={6} size={72} />
          <EnemyIcon tier={2} index={3} size={72} />
          <EnemyIcon tier="boss" index={0} size={72} />
        </div>
      </div>

      {/* Debug dump */}
      {debug && (
        <pre
          style={{
            marginTop: 24,
            padding: 12,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify({ partySize, t1Picks, t2Picks, players }, null, 2)}
        </pre>
      )}
    </div>
  );
}
