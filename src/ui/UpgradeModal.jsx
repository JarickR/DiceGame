// src/ui/UpgradeModal.jsx
import React, { useMemo, useState } from "react";
import SpellIcon from "../ui/SpellIcon";

const TIER2_POOL = ["attack","heal","armor","concentration","sweep","fireball","poison","bomb"];
const TIER3_POOL = ["attack","sweep","fireball"]; // extend as you like

function randomPick(a){ return a[(Math.random()*a.length)|0]; }

export default function UpgradeModal({ open, hero, onClose, onApply }) {
  const [slotIndex, setSlotIndex] = useState(null);
  const [candidate, setCandidate] = useState(null);

  const slots = hero?.spells ?? [];

  function chooseSlot(i){
    setSlotIndex(i);
    const slot = slots[i];
    if (!slot || !slot.name) {
      setCandidate(randomPick(TIER2_POOL));
      return;
    }
    const nextPool = slot.tier === 1 ? TIER2_POOL : TIER3_POOL;
    setCandidate(randomPick(nextPool));
  }

  function doUpgrade(){
    if (slotIndex==null || !candidate) return;
    const prev = slots[slotIndex];
    const newSpell = prev && prev.tier >= 2
      ? { tier: 3, name: candidate }
      : { tier: 2, name: candidate };
    onApply(slotIndex, newSpell);
  }

  if (!open) return null;

  return (
    <div className="upg-backdrop">
      <div className="upg-modal">
        <div className="upg-title">Upgrade — P{(hero?.id ?? 0)+1}</div>

        <div className="upg-grid">
          {slots.map((s, i)=>(
            <button
              key={i}
              onClick={()=>chooseSlot(i)}
              className={`upg-slot ${slotIndex===i?"active":""}`}
            >
              {s?.name
                ? <SpellIcon tier={s.tier} name={s.name} size={72}/>
                : <div className="upg-blank"/>}
              <div className="upg-slotLabel">Slot {i+1}</div>
            </button>
          ))}
        </div>

        <div className="upg-preview">
          {slotIndex==null ? (
            <div>Select a slot to see your random upgrade.</div>
          ) : (
            <>
              <div style={{opacity:.75, marginBottom:6}}>Random result:</div>
              <SpellIcon tier={(slots[slotIndex]?.tier ?? 1)+1} name={candidate} size={88}/>
              <div style={{marginTop:6, textTransform:"capitalize"}}>{candidate}</div>
            </>
          )}
        </div>

        <div className="upg-actions">
          <button className="upg-btn ghost" onClick={onClose}>Cancel</button>
          <button className="upg-btn" disabled={slotIndex==null} onClick={doUpgrade}>
            Upgrade
          </button>
        </div>
      </div>

      <style>{`
        .upg-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:2100;color:#fff}
        .upg-modal{width:min(740px,94vw);background:#0f141a;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:16px}
        .upg-title{font-size:22px;font-weight:900;margin-bottom:10px}
        .upg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
        .upg-slot{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px;display:grid;place-items:center;gap:6px;cursor:pointer}
        .upg-slot.active{outline:2px solid #d4a11d}
        .upg-blank{width:72px;height:72px;border-radius:10px;border:1px dashed rgba(255,255,255,.3)}
        .upg-slotLabel{opacity:.9}
        .upg-preview{display:grid;place-items:center;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px;min-height:140px}
        .upg-actions{margin-top:12px;display:flex;gap:10px;justify-content:flex-end}
        .upg-btn{padding:8px 14px;border-radius:10px;background:#1f6feb;border:1px solid rgba(255,255,255,.16);font-weight:800;color:#fff}
        .upg-btn.ghost{background:transparent}
        .upg-btn:disabled{opacity:.5}
      `}</style>
    </div>
  );
}
