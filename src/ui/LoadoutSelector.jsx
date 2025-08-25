// src/ui/LoadoutSelector.jsx
import React, { useMemo, useState } from "react";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";

// ---------- small helpers ----------
function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
function sampleN(arr, n) {
  const s = shuffle(arr);
  return s.slice(0, Math.min(n, s.length));
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Build a default spell list if caller doesn’t pass one.
// (No "blank" in these pools – blanks are only auto-filled later.)
const DEFAULT_SPELLS = {
  t1: ["attack", "heal", "armor", "sweep", "fireball"],
  t2: ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"],
};
// 8 classes in same order as your sprite sheet
const DEFAULT_CLASSES = [
  "thief", "judge", "tank", "vampire", "king", "lich", "paladin", "barbarian",
];

// ---------- UI CHIP ----------
function Chip({ active, children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`chip ${active ? "chip--active" : ""}`}
      style={{
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        color: "#ddd",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ---------- PLAYER LOCAL STATE SHAPE ----------
function makePlayerState(spells, t1Choices = 3, t2Choices = 2) {
  return {
    classKey: null,
    // random choice sets per player (fresh per mount or when “New Party” style changes)
    t1Pool: sampleN(spells.t1, t1Choices),
    t2Pool: sampleN(spells.t2, t2Choices),
    t1Picks: [], // array of strings
    t2Picks: [], // array of strings
  };
}

// ---------- MAIN SELECTOR ----------
export default function LoadoutSelector({
  partyDefault = 2,
  maxT1 = 2, // selectable T1 picks (2 or 3)
  maxT2 = 1, // selectable T2 picks (1 or 2)
  spells = DEFAULT_SPELLS,
  classList = DEFAULT_CLASSES,
  onFinalize, // (playersPayload, settings) => void
  debugDefault = false,
}) {
  const [partySize, setPartySize] = useState(partyDefault);
  const [t1Cap, setT1Cap] = useState(maxT1);
  const [t2Cap, setT2Cap] = useState(maxT2);
  const [debug, setDebug] = useState(debugDefault);

  // We keep each player’s choice state isolated
  const [players, setPlayers] = useState(() =>
    Array.from({ length: partyDefault }, () => makePlayerState(spells))
  );

  // If party size changes, rebuild players (fresh random choice pools)
  const changeParty = (n) => {
    const size = clamp(Number(n), 1, 8);
    setPartySize(size);
    setPlayers(Array.from({ length: size }, () => makePlayerState(spells)));
  };

  // Helper: toggle class selection for a player
  const pickClass = (pIdx, k) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[pIdx] = { ...next[pIdx], classKey: k };
      return next;
    });
  };

  // Helper: (un)pick a T1 / T2 spell
  const togglePick = (pIdx, tier, spell, cap) => {
    setPlayers((prev) => {
      const next = [...prev];
      const p = { ...next[pIdx] };
      const key = tier === 1 ? "t1Picks" : "t2Picks";
      const arr = [...p[key]];
      const i = arr.indexOf(spell);
      if (i >= 0) {
        arr.splice(i, 1); // deselect
      } else {
        if (arr.length < cap) arr.push(spell);
      }
      p[key] = arr;
      next[pIdx] = p;
      return next;
    });
  };

  // Build minimal card UI for each player
  const playerCards = useMemo(
    () =>
      players.map((pl, i) => {
        const t1Chosen = new Set(pl.t1Picks);
        const t2Chosen = new Set(pl.t2Picks);
        const t1Full = pl.t1Picks.length >= t1Cap;
        const t2Full = pl.t2Picks.length >= t2Cap;
        return (
          <div key={i} className="player-select" style={{ marginBottom: 28 }}>
            <h3 style={{ margin: "8px 0 12px 0" }}>Player {i + 1}</h3>

            {/* Class row */}
            <div className="class-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {classList.map((k) => (
                <button
                  key={k}
                  onClick={() => pickClass(i, k)}
                  className={`class-btn ${pl.classKey === k ? "class-btn--active" : ""}`}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 14,
                    border: pl.classKey === k ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    color: "#bbb",
                  }}
                  title={k}
                >
                  <ClassIcon name={k} size={56} />
                  <div style={{ fontSize: 12 }}>{k}</div>
                </button>
              ))}
            </div>

            {/* T1 picks */}
            <div style={{ marginTop: 18, fontWeight: 600, color: "#e5e7eb" }}>
              Tier 1 — choose up to {t1Cap}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
              {pl.t1Pool.map((sp) => (
                <button
                  key={sp}
                  onClick={() => togglePick(i, 1, sp, t1Cap)}
                  disabled={t1Full && !t1Chosen.has(sp)}
                  className={`spell-card ${t1Chosen.has(sp) ? "spell-card--active" : ""}`}
                  style={{
                    width: 180,
                    height: 130,
                    borderRadius: 16,
                    border: t1Chosen.has(sp)
                      ? "2px solid #10b981"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: "#cfd3d6",
                    cursor: t1Full && !t1Chosen.has(sp) ? "not-allowed" : "pointer",
                  }}
                >
                  <SpellIcon name={sp} tier={1} size={92} />
                  <div style={{ fontSize: 13 }}>{sp}</div>
                </button>
              ))}
            </div>

            {/* T2 picks */}
            <div style={{ marginTop: 18, fontWeight: 600, color: "#e5e7eb" }}>
              Tier 2 — choose {t2Cap === 1 ? "1" : `up to ${t2Cap}`}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
              {pl.t2Pool.map((sp) => (
                <button
                  key={sp}
                  onClick={() => togglePick(i, 2, sp, t2Cap)}
                  disabled={t2Full && !t2Chosen.has(sp)}
                  className={`spell-card ${t2Chosen.has(sp) ? "spell-card--active" : ""}`}
                  style={{
                    width: 180,
                    height: 130,
                    borderRadius: 16,
                    border: t2Chosen.has(sp)
                      ? "2px solid #10b981"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: "#cfd3d6",
                    cursor: t2Full && !t2Chosen.has(sp) ? "not-allowed" : "pointer",
                  }}
                >
                  <SpellIcon name={sp} tier={2} size={92} />
                  <div style={{ fontSize: 13 }}>{sp}</div>
                </button>
              ))}
            </div>

            {/* debug */}
            {debug && (
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
                <div>t1Pool: {pl.t1Pool.join(", ")}</div>
                <div>t2Pool: {pl.t2Pool.join(", ")}</div>
                <div>t1Picks: {pl.t1Picks.join(", ")}</div>
                <div>t2Picks: {pl.t2Picks.join(", ")}</div>
                <div>class: {pl.classKey || "(none)"}</div>
              </div>
            )}
          </div>
        );
      }),
    [players, classList, t1Cap, t2Cap, debug]
  );

  // Build finalized payload (fill blanks, ensure 4 slots)
  const handleFinalize = () => {
    const payload = players.map((pl, i) => {
      const loadout = [];
      // Priority: T1 picks first, then T2 picks (any order you prefer)
      for (const s of pl.t1Picks) loadout.push({ tier: 1, name: s });
      for (const s of pl.t2Picks) loadout.push({ tier: 2, name: s });
      // Fill blanks to 4
      while (loadout.length < 4) loadout.push({ tier: 0, name: "blank" });

      return {
        id: i,
        classKey: pl.classKey || randChoice(classList),
        loadout, // exactly 4 entries
      };
    });

    const settings = {
      partySize,
      t1Cap,
      t2Cap,
    };

    onFinalize && onFinalize(payload, settings);
  };

  // Header controls
  return (
    <div style={{ padding: "18px 18px 32px 18px" }}>
      <h1 style={{ marginBottom: 14 }}>Choose Classes & Loadouts</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Party:</span>
          <select value={partySize} onChange={(e) => changeParty(e.target.value)}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>T1 picks:</span>
          <select value={t1Cap} onChange={(e) => setT1Cap(Number(e.target.value))}>
            {[2, 3].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>T2 picks:</span>
          <select value={t2Cap} onChange={(e) => setT2Cap(Number(e.target.value))}>
            {[1, 2].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <Chip active={debug} onClick={() => setDebug((v) => !v)}>
          {debug ? "Hide Debug" : "Show Debug"}
        </Chip>
        <button
          onClick={handleFinalize}
          style={{
            marginLeft: "auto",
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: "#3b82f6",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Finalize & Continue
        </button>
      </div>

      {/* Players list */}
      <div>{playerCards}</div>
    </div>
  );
}
