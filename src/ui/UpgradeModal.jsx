// src/ui/UpgradeModal.jsx
import React, { useState } from "react";
import SpellIcon from "./SpellIcon";

function BlankThumb({ size=64, radius=12 }) {
  return (
    <div
      style={{
        width: size,
        height: (size * 3) / 5,
        borderRadius: radius,
        background: "rgba(255,255,255,.035)",
        outline: "1px dashed #344",
      }}
    />
  );
}

export default function UpgradeModal({
  open,
  heroName,
  slots,            // [{tier, spell:{id,tier}|null}, ...]
  onPickSlot,       // (slotIndex:1..4) => candidate {id,tier} | null
  onCommit,         // (slotIndex, takeNew:boolean, candidate) => void
  onClose,
}) {
  const [sel, setSel] = useState(null);
  const [candidate, setCandidate] = useState(null);

  if (!open) return null;

  const chooseSlot = (idx) => {
    const cand = onPickSlot?.(idx);
    setSel(idx);
    setCandidate(cand || null);
  };

  const keep = () => { onCommit?.(sel, false, candidate); cleanup(); };
  const take = () => { onCommit?.(sel, true,  candidate); cleanup(); };
  const cleanup = () => { setSel(null); setCandidate(null); onClose?.(); };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:220 }}>
      <div style={{ width:640, background:"#0f141b", border:"1px solid #243040", color:"#e9eef6", borderRadius:16, boxShadow:"0 12px 40px rgba(0,0,0,.5)" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e2633", fontWeight:700 }}>
          {candidate ? `${heroName}: Take upgrade or keep old?` : `${heroName}: Choose a spell slot to upgrade`}
        </div>

        <div style={{ padding:16 }}>
          {!candidate && (
            <>
              <div className="small" style={{ opacity:.8, marginBottom:8 }}>Pick a slot (no preview; result is rolled from next tier — blanks start at Tier 1):</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
                {[1,2,3,4].map(idx => {
                  const s = slots[idx-1];
                  const has = !!s.spell;
                  const name = has ? `${s.spell.id} (T${s.spell.tier})` : "(blank)";
                  return (
                    <button key={idx} className="btn secondary" onClick={() => chooseSlot(idx)} style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"flex-start" }}>
                      {has
                        ? <SpellIcon tier={s.spell.tier} name={s.spell.id} size={44} radius={10} />
                        : <BlankThumb size={44} radius={10} />
                      }
                      <div style={{ textAlign:"left" }}>
                        <div style={{ fontWeight:700 }}>Slot {idx}</div>
                        <div className="small" style={{ opacity:.8 }}>{name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {candidate && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {/* OLD */}
              <div style={{ background:"#121922", border:"1px solid #233044", borderRadius:12, padding:12 }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>Old</div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  {slots[sel-1].spell
                    ? <SpellIcon tier={slots[sel-1].spell.tier} name={slots[sel-1].spell.id} size={64} radius={12} />
                    : <BlankThumb size={64} radius={12} />
                  }
                  <div>
                    <div style={{ fontWeight:700 }}>
                      {slots[sel-1].spell ? `${slots[sel-1].spell.id} (T${slots[sel-1].spell.tier})` : "(blank)"}
                    </div>
                    {!slots[sel-1].spell && <div className="small" style={{ opacity:.75 }}>Blank upgrades begin at Tier 1.</div>}
                  </div>
                </div>
                <button className="btn" style={{ marginTop:10 }} onClick={keep}>Keep old</button>
              </div>

              {/* NEW (candidate) */}
              <div style={{ background:"#121922", border:"1px solid #233044", borderRadius:12, padding:12 }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>New (random)</div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <SpellIcon tier={candidate.tier} name={candidate.id} size={64} radius={12} />
                  <div>
                    <div style={{ fontWeight:700 }}>{candidate.id} (T{candidate.tier})</div>
                    <div className="small" style={{ opacity:.75 }}>No reroll.</div>
                  </div>
                </div>
                <button className="btn primary" style={{ marginTop:10 }} onClick={take}>Take upgrade</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:"10px 16px", borderTop:"1px solid #1e2633", display:"flex", justifyContent:"flex-end" }}>
          <button className="btn" onClick={cleanup}>Close</button>
        </div>
      </div>
    </div>
  );
}
