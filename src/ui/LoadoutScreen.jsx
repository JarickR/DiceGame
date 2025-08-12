// src/ui/LoadoutScreen.jsx
import React, { useMemo, useState } from "react";
import ClassIcon from "./ClassIcon.jsx";
import SpellIcon from "./SpellIcon.jsx";

// knobs
const MAX_PLAYERS = 4;
const T1_CHOICES = 3;   // offer 3, pick up to 2
const T1_PICK_MAX = 2;
const T2_CHOICES = 2;   // offer 2, pick 1 (optional)
const T2_PICK_MAX = 1;

const CLASS_IDS = ["thief","judge","tank","vampire","king","lich","paladin","barbarian"];
const CLASS_LABEL = {
  thief:"Thief", judge:"Judge", tank:"Tank", vampire:"Vampire",
  king:"King", lich:"Lich", paladin:"Paladin", barbarian:"Barbarian"
};

// spell pools (names match SpellIcon mapping)
const TIER1_POOL = ["attack","heal","armor","sweep","fireball"];
const TIER2_POOL = ["attack","heal","armor","concentration","sweep","fireball","poison","bomb"];

function randPick(array, count){
  const src = [...array];
  const out = [];
  while (src.length && out.length < count){
    const i = Math.floor(Math.random() * src.length);
    out.push(src.splice(i,1)[0]);
  }
  return out;
}

function makeEmpty(i){
  return {
    id: i+1,
    classId: null,
    t1Offers: randPick(TIER1_POOL, T1_CHOICES),
    t2Offers: randPick(TIER2_POOL, T2_CHOICES),
    t1Picks: [],
    t2Picks: [],
  };
}

export default function LoadoutScreen({ playerCount = 2, onFinalize }){
  const N = Math.max(1, Math.min(MAX_PLAYERS, playerCount));
  const [parties, setParties] = useState(Array.from({length:N}, (_,i)=>makeEmpty(i)));

  const allReady = useMemo(()=>{
    return parties.every(p => p.classId && p.t1Picks.length <= T1_PICK_MAX && p.t2Picks.length <= T2_PICK_MAX);
  }, [parties]);

  const toggleT1 = (i,spell)=>{
    setParties(ps=>{
      const copy = ps.map(p=>({...p}));
      const p = copy[i];
      const has = p.t1Picks.includes(spell);
      let next = has ? p.t1Picks.filter(s=>s!==spell) : [...p.t1Picks, spell];
      if (next.length > T1_PICK_MAX) next = next.slice(0,T1_PICK_MAX);
      p.t1Picks = next;
      return copy;
    });
  };

  const toggleT2 = (i,spell)=>{
    setParties(ps=>{
      const copy = ps.map(p=>({...p}));
      const p = copy[i];
      const has = p.t2Picks.includes(spell);
      p.t2Picks = has ? [] : [spell];
      return copy;
    });
  };

  const chooseClass = (i,classId)=>{
    setParties(ps=>{
      const copy = ps.map(p=>({...p}));
      copy[i].classId = classId;
      return copy;
    });
  };

  const finalize = ()=>{
    const payload = parties.map(p=>{
      const t1 = p.t1Picks.slice();
      while (t1.length < T1_PICK_MAX) t1.push(null);
      const t2 = p.t2Picks.length ? p.t2Picks.slice(0,1) : [null];

      return { id: p.id, classId: p.classId || "thief", tier1: t1, tier2: t2 };
    });
    onFinalize?.(payload);
  };

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex", gap:12, flexWrap:"wrap", marginBottom:12}}>
        {Array.from({length:MAX_PLAYERS}, (_,i)=>(
          <button
            key={i}
            className="btn tertiary"
            onClick={()=>{
              setParties(ps=>{
                const want = i+1;
                if (ps.length === want) return ps;
                if (ps.length < want){
                  const add = Array.from({length:want-ps.length}, (_,k)=>makeEmpty(ps.length+k));
                  return [...ps, ...add];
                }else{
                  return ps.slice(0, want);
                }
              });
            }}
          >
            New Party ({i+1})
          </button>
        ))}
        <div style={{marginLeft:"auto"}} />
        <button className="btn" disabled={!allReady} onClick={finalize}>
          Finalize &amp; Start
        </button>
      </div>

      <div style={{display:"grid", gap:16}}>
        {parties.map((p, idx)=>(
          <div key={p.id} style={{
            border:"1px solid #243041", borderRadius:12, padding:12, background:"#11161e"
          }}>
            <div style={{fontWeight:700, marginBottom:8}}>Hero {p.id}</div>

            {/* Class picker */}
            <div className="small" style={{opacity:.8, marginBottom:6}}>Class</div>
            <div style={{display:"flex", gap:10, flexWrap:"wrap", marginBottom:10}}>
              {CLASS_IDS.map(cid=>{
                const selected = p.classId === cid;
                return (
                  <button
                    key={cid}
                    onClick={()=>chooseClass(idx, cid)}
                    style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:8, borderRadius:10, border:"1px solid #2a3547",
                      background: selected ? "linear-gradient(180deg,#1a2742,#121a29)" : "#0e141d",
                      boxShadow: selected ? "0 0 0 2px rgba(120,170,255,.35) inset" : "none"
                    }}
                    title={CLASS_LABEL[cid]}
                  >
                    <ClassIcon name={cid} size={56} radius={8}/>
                    <div style={{color:"#dfe6ef"}}>{CLASS_LABEL[cid]}</div>
                  </button>
                );
              })}
            </div>

            {/* Tier 1 */}
            <div className="small" style={{opacity:.8, margin:"6px 0"}}>Tier 1 — choose up to 2</div>
            <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}}>
              {p.t1Offers.map(spell=>{
                const checked = p.t1Picks.includes(spell);
                return (
                  <label key={spell} style={{
                    display:"grid", gridTemplateColumns:"auto 1fr auto", alignItems:"center",
                    gap:12, border:"1px solid #223142", borderRadius:12, padding:10,
                    background: checked ? "linear-gradient(180deg,#0f2c1a,#0c1a13)" : "#0b1118"
                  }}>
                    <SpellIcon tier={1} name={spell} size={120} radius={10}/>
                    <div>
                      <div style={{fontWeight:700, marginBottom:4, color:"#e8edf6", textTransform:"capitalize"}}>{spell}</div>
                      <div className="small" style={{opacity:.7}}>Tier 1</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=>toggleT1(idx, spell)}
                      disabled={!checked && p.t1Picks.length >= 2}
                    />
                  </label>
                );
              })}
            </div>

            {/* Tier 2 */}
            <div className="small" style={{opacity:.8, margin:"10px 0 6px"}}>Tier 2 — choose 1 (optional)</div>
            <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}}>
              {p.t2Offers.map(spell=>{
                const checked = p.t2Picks.includes(spell);
                return (
                  <label key={spell} style={{
                    display:"grid", gridTemplateColumns:"auto 1fr auto", alignItems:"center",
                    gap:12, border:"1px solid #223142", borderRadius:12, padding:10,
                    background: checked ? "linear-gradient(180deg,#0e2741,#0b1625)" : "#0b1118"
                  }}>
                    <SpellIcon tier={2} name={spell} size={120} radius={10}/>
                    <div>
                      <div style={{fontWeight:700, marginBottom:4, color:"#e8edf6", textTransform:"capitalize"}}>{spell}</div>
                      <div className="small" style={{opacity:.7}}>Tier 2</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={()=>toggleT2(idx, spell)}
                      disabled={!checked && p.t2Picks.length >= 1}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
