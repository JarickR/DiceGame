import React, { useMemo, useState } from "react";
import EnemyIcon from "./ui/EnemyIcon";
import ClassIcon from "./ui/ClassIcon";
import SpellIcon from "./ui/SpellIcon";
import LoadoutScreen from "./ui/LoadoutScreen";
import RollPopup from "./ui/RollPopup";

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

export default function App() {
  const [phase, setPhase] = useState("loadout");

  // ---- state that lives through phases
  const [players, setPlayers] = useState([]);
  const [enemies, setEnemies] = useState([
    { id: 0, name: "Enemy 1", tier: 1, hp: 10, maxHp: 10, armor: 0, stacks: { poison: 0, bomb: 0 }, spriteIndex: 0 },
  ]);
  const [log, setLog] = useState([]);

  // roll popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupFaces, setPopupFaces] = useState([]);
  const [popupLanding, setPopupLanding] = useState(0);

  const addLog = (line) => setLog((L)=>[...L,line]);

  // Faces for a hero
  const facesForHero = (heroIdx) => {
    const h = players[heroIdx];
    if (!h) return [];
    const faces = [];
    faces.push({ kind: "class", classId: h.className });
    for (let s = 0; s < 4; s++) {
      const slot = h.spells[s];
      if (slot && slot.name) faces.push({ kind: "spell", spell: { tier: slot.tier, name: slot.name } });
      else faces.push({ kind: "blank" });
    }
    faces.push({ kind: "upgrade" });
    return faces;
  };

  function resolveFace(heroIdx, face) {
    if (!face) return;
    const heroTag = `P${heroIdx+1}`;

    if (face.kind === "class") {
      const cls = players[heroIdx]?.className;
      if (cls === "tank" || cls === "king") {
        setPlayers(P=>{
          const n = P.map(h=>({...h}));
          n[heroIdx].armor += 2;
          return n;
        });
        addLog(`${heroTag} (${cls}) gains +2 armor.`);
      } else {
        addLog(`${heroTag} uses ${cls} ability.`);
      }
      return;
    }

    if (face.kind === "spell") {
      const { tier, name } = face.spell;
      const DMG = tier===1?2:tier===2?4:6;
      const HEAL = tier===1?1:3;
      const ARM = tier===1?2:6;
      const ei = enemies.findIndex(e=>e.hp>0);
      if (name==="heal") {
        setPlayers(P=>{
          const n=P.map(h=>({...h}));
          n[heroIdx].hp = clamp(n[heroIdx].hp+HEAL,0,n[heroIdx].maxHp);
          return n;
        });
        addLog(`${heroTag} healed ${HEAL}.`);
        return;
      }
      if (name==="armor") {
        setPlayers(P=>{
          const n=P.map(h=>({...h}));
          n[heroIdx].armor += ARM;
          return n;
        });
        addLog(`${heroTag} gained ${ARM} armor.`);
        return;
      }
      if (ei<0) { addLog(`${heroTag} has no targets.`); return; }

      if (name==="poison") {
        setEnemies(E=>{
          const n=E.map(e=>({...e, stacks:{...e.stacks}}));
          n[ei].stacks.poison = (n[ei].stacks.poison||0)+1;
          return n;
        });
        addLog(`${heroTag} applied poison to E${ei+1}.`);
        return;
      }
      if (name==="bomb") {
        setEnemies(E=>{
          const n=E.map(e=>({...e, stacks:{...e.stacks}}));
          n[ei].stacks.bomb = (n[ei].stacks.bomb||0)+1;
          return n;
        });
        addLog(`${heroTag} planted a bomb on E${ei+1}.`);
        return;
      }
      if (name==="fireball") {
        const dmg = tier===1?1:tier===2?3:5;
        setEnemies(E=>{
          const n=E.map(e=>({...e}));
          n[ei].hp = clamp(n[ei].hp-dmg,0,n[ei].maxHp);
          return n;
        });
        addLog(`${heroTag} cast fireball on E${ei+1}.`);
        return;
      }
      // attack or sweep
      setEnemies(E=>{
        const n=E.map(e=>({...e}));
        const t=n[ei];
        const mitigated = Math.max(0, DMG-(t.armor||0));
        t.hp = clamp(t.hp-mitigated,0,t.maxHp);
        return n;
      });
      addLog(`${heroTag} used ${name} on E${ei+1}.`);
      return;
    }

    if (face.kind === "upgrade") {
      addLog(`${heroTag} rolled Upgrade (placeholder).`);
      return;
    }

    addLog(`${heroTag} rolled Blank.`);
  }

  function rollFor(heroIdx) {
    const faces = facesForHero(heroIdx);
    if (!faces.length) return;
    const landingIndex = (Math.random()*faces.length)|0;

    // show popup spin
    setPopupFaces(faces);
    setPopupLanding(landingIndex);
    setPopupOpen(true);

    // after popup closes, actually apply the face
    // (we apply AFTER animation so it looks responsive)
    const applyAfter = setTimeout(()=>{
      resolveFace(heroIdx, faces[landingIndex]);
    }, 1200); // roughly matches popup slowdown
    // ensure cleanup if user navigates away
    const cleanup = () => clearTimeout(applyAfter);
    // store cleanup on window to avoid React warnings (simple safety)
    window.__roll_cleanup && window.__roll_cleanup();
    window.__roll_cleanup = cleanup;
  }

  // ---- Render phases ----
  if (phase === "loadout") {
    return (
      <LoadoutScreen
        partySize={1}
        onDone={(builtPlayers) => {
          setPlayers(builtPlayers);
          setLog(["Encounter begins."]);
          setPhase("battle");
        }}
      />
    );
  }

  return (
    <div style={{ minHeight:"100vh", color:"#fff", background:"#0e1116", padding:16 }}>
      <h1>Encounter</h1>

      {/* Enemies row */}
      <div style={{ display:"flex", gap:12, marginBottom:12 }}>
        {enemies.map(e=>(
          <div key={e.id} style={{ width:260, border:"1px solid #333", borderRadius:12, padding:12 }}>
            <EnemyIcon tier={e.tier} index={e.spriteIndex||0} size={56}/>
            <div style={{ fontWeight:800, marginTop:6 }}>{e.name}</div>
            <div>HP {e.hp}/{e.maxHp}</div>
            <div>Armor {e.armor}</div>
          </div>
        ))}
      </div>

      {/* Log (scrollable, shows latest at bottom, max height) */}
      <div style={{ border:"1px solid #333", borderRadius:12, padding:12, marginBottom:12, maxHeight:220, overflow:"auto" }}>
        {log.slice(-100).map((line,i)=>(<div key={i}>{line}</div>))}
      </div>

      {/* Players row */}
      <div style={{ display:"flex", gap:12 }}>
        {players.map((h,i)=>(
          <div key={h.id} style={{ width:360, border:"1px solid #333", borderRadius:12, padding:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <ClassIcon name={h.className} size={44} />
              <div style={{ fontWeight:900, fontSize:20, textTransform:"capitalize" }}>
                {h.className} (P{i+1})
              </div>
            </div>
            <div style={{ marginBottom:6 }}>HP {h.hp}/{h.maxHp}</div>
            <div style={{ height:8, background:"#3a1e22", borderRadius:999, overflow:"hidden", marginBottom:10 }}>
              <div style={{ width:`${(h.hp/h.maxHp)*100}%`, height:"100%", background:"#ea4d5a" }} />
            </div>
            <div style={{ marginBottom:8 }}>Armor {h.armor}</div>

            {/* 4 spell slots shown */}
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              {Array.from({length:4}).map((_,s)=>{
                const slot = h.spells[s];
                return (
                  <div key={s} style={{
                    width:70, height:70, borderRadius:12,
                    background:"rgba(255,255,255,0.06)",
                    border:"1px solid rgba(255,255,255,0.12)", display:"grid", placeItems:"center"
                  }}>
                    {slot && slot.name ? (
                      <SpellIcon tier={slot.tier} name={slot.name} size={56}/>
                    ) : (
                      <div style={{ width:56, height:56, borderRadius:10, border:"1px dashed rgba(255,255,255,0.3)" }}/>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={()=>rollFor(i)}
              style={{ padding:"8px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.2)", background:"#1f6feb", color:"#fff", fontWeight:800 }}
            >
              Roll
            </button>
          </div>
        ))}
      </div>

      <RollPopup
        open={popupOpen}
        faces={popupFaces}
        landingIndex={popupLanding}
        onClose={()=>setPopupOpen(false)}
      />
    </div>
  );
}
