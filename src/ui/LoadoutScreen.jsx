import React, { useMemo, useState } from "react";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";
import { TIER1_POOL, TIER2_POOL } from "../spells";

/**
 * Props:
 * - partySize: number
 * - t1Max: 2 | 3
 * - t2Max: 1 | 2
 * - onFinalize(loadouts): (loadoutsPerPlayer) => void
 * - classList: string[]
 */
export default function LoadoutScreen({
  partySize,
  t1Max,
  t2Max,
  onFinalize,
  classList,
}) {
  // Selected class per player
  const [classes, setClasses] = useState(
    Array.from({ length: partySize }, () => classList[0] || "thief")
  );

  // Randomized choices per player (3 from T1, 2 from T2)
  const randomChoices = useMemo(() => {
    return Array.from({ length: partySize }, () => ({
      t1: sampleUniqueByName(TIER1_POOL, 3),
      t2: sampleUniqueByName(TIER2_POOL, 2),
    }));
  }, [partySize]);

  // Player selections (what they’ve picked so far)
  const [selections, setSelections] = useState(
    Array.from({ length: partySize }, () => ({ t1: [], t2: [] }))
  );

  const togglePick = (playerIdx, tier, spell) => {
    setSelections((prev) => {
      const next = prev.map((p) => ({ t1: [...p.t1], t2: [...p.t2] }));
      const bag = next[playerIdx][tier];
      const max = tier === "t1" ? t1Max : t2Max;
      const exists = bag.find((s) => s.name === spell.name);

      if (exists) {
        // Deselect
        next[playerIdx][tier] = bag.filter((s) => s.name !== spell.name);
      } else {
        if (bag.length >= max) {
          // Replace oldest (acts like a capped radio-group)
          bag.shift();
        }
        bag.push(spell);
      }
      return next;
    });
  };

  const finalize = () => {
    // Build 4 slots per player: [T1, T1, T2, (T1/T2 optional based on caps)]
    const loadouts = classes.map((cls, idx) => {
      const chosenT1 = selections[idx].t1.slice(0, t1Max);
      const chosenT2 = selections[idx].t2.slice(0, t2Max);

      const slots = [null, null, null, null];

      // Up to 2 Tier1 go into slots 0 and 1
      for (let i = 0; i < Math.min(2, chosenT1.length); i++) {
        slots[i] = { tier: 1, name: chosenT1[i].name };
      }
      // One Tier2 goes into slot 2 (if chosen)
      if (chosenT2[0]) slots[2] = { tier: 2, name: chosenT2[0].name };

      // Fourth slot rules:
      // - If t1Max === 3 and we took 3 T1 and did not take T2, drop T1 #3 here
      if (t1Max === 3 && chosenT1.length === 3 && !chosenT2.length) {
        slots[3] = { tier: 1, name: chosenT1[2].name };
      }
      // - If t2Max === 2 and we took 2 T2, place the second T2 here
      if (t2Max === 2 && chosenT2.length === 2) {
        slots[3] = { tier: 2, name: chosenT2[1].name };
      }

      return { className: cls, spells: slots };
    });

    onFinalize(loadouts);
  };

  return (
    <div className="loadout-wrap" style={{ color: "white" }}>
      {Array.from({ length: partySize }).map((_, i) => {
        const t1opts = randomChoices[i].t1;
        const t2opts = randomChoices[i].t2;
        const sel = selections[i];

        return (
          <div key={i} className="panel" style={{ marginBottom: 24 }}>
            {/* Header: player + current class */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <ClassIcon name={classes[i]} size={48} radius={10} />
              <div style={{ fontWeight: 800 }}>{`Player ${i + 1}`}</div>
            </div>

            {/* Class selector row */}
            <div
              className="class-row"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {classList.map((name) => {
                const active = classes[i] === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`choice-card ${active ? "selected" : ""}`}
                    onClick={() =>
                      setClasses((prev) => {
                        const next = [...prev];
                        next[i] = name;
                        return next;
                      })
                    }
                  >
                    <ClassIcon name={name} size={64} radius={12} />
                    <div className="choice-title">{name}</div>
                  </button>
                );
              })}
            </div>

            {/* Tier 1 choices */}
            <div
              style={{ fontWeight: 800, marginBottom: 6 }}
            >{`Tier 1 — pick ${t1Max === 3 ? "2 or 3" : "up to 2"}`}{" "}
              <span style={{ color: "var(--muted)" }}>
                (picked {sel.t1.length})
              </span>
            </div>
            <div
              className="choice-row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
                gap: 14,
                marginBottom: 14,
              }}
            >
              {t1opts.map((spell) => {
                const selected = !!sel.t1.find((s) => s.name === spell.name);
                return (
                  <button
                    key={spell.name}
                    type="button"
                    className={`choice-card ${selected ? "selected" : ""}`}
                    onClick={() => togglePick(i, "t1", spell)}
                  >
                    <SpellIcon tier={1} name={spell.name} size={72} radius={12} />
                    <div className="choice-title">{spell.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Tier 2 choices */}
            <div
              style={{ fontWeight: 800, marginBottom: 6 }}
            >{`Tier 2 — pick ${t2Max === 2 ? "1 or 2" : "1"}`}{" "}
              <span style={{ color: "var(--muted)" }}>
                (picked {sel.t2.length})
              </span>
            </div>
            <div
              className="choice-row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(160px, 1fr))",
                gap: 14,
              }}
            >
              {t2opts.map((spell) => {
                const selected = !!sel.t2.find((s) => s.name === spell.name);
                return (
                  <button
                    key={spell.name}
                    type="button"
                    className={`choice-card ${selected ? "selected" : ""}`}
                    onClick={() => togglePick(i, "t2", spell)}
                  >
                    <SpellIcon tier={2} name={spell.name} size={72} radius={12} />
                    <div className="choice-title">{spell.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={finalize} style={{ fontWeight: 800 }}>
          Finalize & Continue
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- */
/* Helpers */
/* ------------------------------------------------------- */

function normalizeSpell(v) {
  // Accept "attack" OR { name: "attack" }
  return typeof v === "string" ? { name: v } : { name: v.name };
}

function sampleUniqueByName(pool, n) {
  // Normalize and shuffle, then keep by name uniqueness
  const normalized = pool.map(normalizeSpell);
  const arr = shuffle([...normalized]);

  const seen = new Set();
  const result = [];
  for (const item of arr) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      result.push(item);
      if (result.length === n) break;
    }
  }
  // If pool was small, result might be < n — that’s OK
  return result;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
