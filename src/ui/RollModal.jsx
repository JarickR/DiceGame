// src/ui/RollModal.jsx
import React, { useEffect, useState } from "react";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";

function FaceView({ face, size=90 }) {
  if (!face) return <div style={{width:size, height:size*0.6, borderRadius:12, background:"#1b2430"}} />;
  if (face.kind === "class") return <ClassIcon name="king" size={size} radius={12} />; // real class name is on hero, this view is cosmetic
  if (face.kind === "upgrade") return <SpellIcon upgrade size={size} radius={12} />;
  if (face.kind === "spell")  return <SpellIcon tier={face.spell.tier} name={face.spell.id} size={size} radius={12} />;
  return <div style={{width:size, height:size*0.6, borderRadius:12, background:"#1b2430"}} />;
}

export default function RollModal({
  faces,          // array of 6 face objects (as engine expects)
  landingIndex,   // 0..5
  onDone,         // (resultFace) => void
  open,
}) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!open) return;
    setI(0); setHeld(false);
    // spin: one face at a time, accelerate → decelerate
    const seq = [];
    const cycles = 12 + Math.floor(Math.random()*6);
    for (let c=0;c<cycles;c++){
      seq.push( (c<cycles-3) ? 60 : (c<cycles-1 ? 140 : 280) );
    }
    let cur = 0;
    function step(){
      setI(v => (v+1)%6);
      cur++;
      if (cur < seq.length) timer = setTimeout(step, seq[cur]);
      else {
        // force land
        setI(landingIndex);
        setHeld(true);
        // show result for a sec then close
        setTimeout(() => onDone?.(faces[landingIndex]), 850);
      }
    }
    let timer = setTimeout(step, seq[0]);
    return () => clearTimeout(timer);
  }, [open, landingIndex]);

  if (!open) return null;

  const face = faces[i];

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.45)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200
    }}>
      <div style={{
        width:420, background:"#0f141b", border:"1px solid #243040", borderRadius:16,
        boxShadow:"0 12px 40px rgba(0,0,0,.5)", padding:18, color:"#e9eef6", textAlign:"center"
      }}>
        <div style={{fontSize:18, fontWeight:700, marginBottom:10}}>Rolling…</div>
        <FaceView face={face} size={120} />
        <div style={{marginTop:10, opacity:.85, minHeight:22}}>
          {held ? labelFor(face) : "…"}
        </div>
      </div>
    </div>
  );
}

function labelFor(face){
  if (!face) return "—";
  if (face.kind === "class") return "Class ability";
  if (face.kind === "upgrade") return "Upgrade";
  if (face.kind === "spell")  return `${face.spell.id} (T${face.spell.tier})`;
  return "—";
}
