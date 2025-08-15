// src/ui/LoadoutScreen.jsx
import React, { useMemo, useState } from "react";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";

// Spells available by tier for the loadout picker (matches engine pools)
const T1_POOL = ["attack", "heal", "armor", "sweep", "fireball"];
const T2_POOL = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"];

// Class tooltips (keep short; shows in native "title" tooltip)
const CLASS_INFO = {
  thief:     "Steal turn face & become Invisible this turn.",
  judge:     "Reroll your die twice, keep any effect.",
  tank:      "+3 Armor while visible. Taunt. 2 Thorn.",
  vampire:   "Permanently steal 2 HP, ignoring armor.",
  king:      "Deal 2 dmg, heal 1, gain 2 armor.",
  lich:      "Summon a Ghoul die; re-rolls on attack.",
  paladin:   "Restore 2 HP; while visible you can't lose HP.",
  barbarian: "Lose 1 HP; reroll and your result gets +2.",
};

// util
function sampleDistinct(arr, n, rand) {
  const out = [];
  const used = new Set();
  while (out.length < n && used.size < arr.length) {
    const i = (rand() * arr.length) | 0;
    if (!used.has(i)) { used.add(i); out.push(arr[i]); }
  }
  return out;
}

export default function LoadoutScreen({
  rng = Math.random,
  maxPlayers = 8,
  onFinalize, // (listOfHeroesSpec) => void
}) {
  // party size
  const [partySize, setPartySize] = useState(2);

  // each "draft" hero stores selections before we build real engine heroes
  const emptyHero = () => ({
    classId: null,
    t1Options: sampleDistinct(T1_POOL, 3, rng),
    t2Options: sampleDistinct(T2_POOL, 2, rng),
    pickT1: [], // up to 2 names
    pickT2: null, // single name
  });

  const [drafts, setDrafts] = useState(() =>
    Array.from({ length: partySize }, emptyHero)
  );

  // when party size changes, regenerate drafts (fresh random options)
  function applyPartySize(n) {
    const size = Math.max(1, Math.min(maxPlayers, n | 0));
    setPartySize(size);
    setDrafts(Array.from({ length: size }, emptyHero));
  }

  function setClass(i, classId) {
    setDrafts(d =>
      d.map((h, idx) => idx !== i ? h : { ...h, classId })
    );
  }

  function toggleT1(i, name) {
    setDrafts(d =>
      d.map((h, idx) => {
        if (idx !== i) return h;
        const picks = h.pickT1.includes(name)
          ? h.pickT1.filter(x => x !== name)
          : (h.pickT1.length < 2 ? [...h.pickT1, name] : h.pickT1);
        return { ...h, pickT1: picks };
      })
    );
  }
  function setT2(i, name) {
    setDrafts(d => d.map((h, idx) => idx !== i ? h : { ...h, pickT2: name }));
  }

  const canFinalize = useMemo(() => {
    // class is required; spells can be blank (we'll fill with blanks)
    return drafts.every(h => !!h.classId);
  }, [drafts]);

  function finalize() {
    if (!canFinalize) return;

    // Convert drafts into engine-ready hero specs
    // We'll produce slots: [T1, T1, T2, T3(blank)]
    const specs = drafts.map((h, i) => {
      const t1a = h.pickT1[0] || null;
      const t1b = h.pickT1[1] || null;
      const t2  = h.pickT2     || null;

      return {
        name: `Hero ${i+1}`,
        classId: h.classId,
        slots: [
          { tier:1, spell: t1a ? { id:t1a, tier:1 } : null },
          { tier:1, spell: t1b ? { id:t1b, tier:1 } : null },
          { tier:2, spell: t2  ? { id:t2,  tier:2 } : null },
          { tier:3, spell: null }, // reserved; blank is allowed
        ],
      };
    });

    onFinalize?.(specs);
  }

  // UI
  return (
    <div style={{ color:"#fff" }}>
      <h1 style={{ marginBottom:8 }}>Select Class</h1>

      {/* Party size */}
      <div style={{ margin:"10px 0 18px 0", display:"flex", alignItems:"center", gap:10 }}>
        <label>Party size:</label>
        <select
          value={partySize}
          onChange={e => applyPartySize(parseInt(e.target.value,10))}
          style={{ background:"#0f141b", color:"#fff", border:"1px solid #344", borderRadius:8, padding:"6px 8px" }}
        >
          {Array.from({length:maxPlayers}, (_,i)=>i+1).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{ opacity:.8, fontSize:13 }}>(random spell options refresh when you change size)</div>
      </div>

      {/* Grid of players */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(520px,1fr))", gap:14 }}>
        {drafts.map((h, idx) => (
          <div key={idx} style={{ background:"#0f141b", border:"1px solid #243040", borderRadius:12, padding:12 }}>
            <div style={{ fontWeight:800, marginBottom:8 }}>Player {idx+1}</div>

            {/* class row */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
              {Object.keys(CLASS_INFO).map(cls => (
                <button
                  key={cls}
                  title={CLASS_INFO[cls]}
                  onClick={() => setClass(idx, cls)}
                  style={{
                    borderRadius:12,
                    border: h.classId===cls ? "2px solid #71a4ff" : "1px solid #2a3444",
                    padding:6,
                    background: h.classId===cls ? "rgba(80,140,255,.15)" : "#121a24"
                  }}
                >
                  <ClassIcon name={cls} size={60} radius={10} />
                </button>
              ))}
            </div>

            {/* T1 options */}
            <div style={{ marginTop:8 }}>
              <div style={{ fontWeight:700, marginBottom:8 }}>Tier 1 — choose up to 2</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
                {h.t1Options.map(name => {
                  const checked = h.pickT1.includes(name);
                  return (
                    <label key={name} style={{
                      display:"flex", alignItems:"center", gap:10,
                      background:"#10202a", border:"1px solid #2e4359",
                      borderRadius:12, padding:10
                    }}>
                      <SpellIcon tier={1} name={name} size={64} radius={10} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, textTransform:"capitalize" }}>{name}</div>
                        <div style={{ fontSize:12, opacity:.75 }}>Tier 1</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleT1(idx, name)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* T2 options */}
            <div style={{ marginTop:12 }}>
              <div style={{ fontWeight:700, marginBottom:8 }}>Tier 2 — choose 1 (optional)</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
                {h.t2Options.map(name => {
                  const checked = h.pickT2 === name;
                  return (
                    <label key={name} style={{
                      display:"flex", alignItems:"center", gap:10,
                      background:"#0f2138", border:"1px solid #2e4359",
                      borderRadius:12, padding:10
                    }}>
                      <SpellIcon tier={2} name={name} size={64} radius={10} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, textTransform:"capitalize" }}>{name}</div>
                        <div style={{ fontSize:12, opacity:.75 }}>Tier 2</div>
                      </div>
                      <input
                        type="radio"
                        name={`t2-${idx}`}
                        checked={checked}
                        onChange={() => setT2(idx, name)}
                      />
                    </label>
                  );
                })}
              </div>
              <div className="small" style={{ opacity:.8, marginTop:6 }}>
                Not picking a Tier 2 is fine — the slot will be blank and can be upgraded later.
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Finalize */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
        <button
          className="btn primary"
          disabled={!canFinalize}
          onClick={finalize}
          title={!canFinalize ? "Every player must pick a class" : ""}
        >
          Finalize & Start
        </button>
      </div>
    </div>
  );
}
