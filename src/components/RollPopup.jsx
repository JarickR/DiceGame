import React from "react";
import ClassIcon from "../ui/ClassIcon.jsx";
import SpellIcon from "../ui/SpellIcon.jsx";

const T1 = ["attack", "heal", "armor", "sweep", "fireball"];
const T2 = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"];
const T3 = ["attack", "sweep", "fireball"];
const tierFor = (s) => (T1.includes(s) ? 1 : T2.includes(s) ? 2 : 3);

function FaceIcon({ face }) {
  if (!face) return null;
  if (face.kind === "class") return <ClassIcon name={"thief"} size={40} />;
  if (face.kind === "upgrade") return <SpellIcon upgrade size={44} />;
  if (face.kind === "spell") {
    const s = face.spell || "blank";
    if (s === "blank") return <div style={{ fontSize: 12, opacity: 0.7 }}>Blank</div>;
    return <SpellIcon tier={tierFor(s)} name={s} size={48} />;
  }
  return null;
}

export default function RollPopup({ rollPopup }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        width: 220,
        padding: 12,
        background: "rgba(10,12,16,.92)",
        border: "1px solid rgba(255,255,255,.2)",
        borderRadius: 12,
        boxShadow: "0 12px 24px rgba(0,0,0,.35)",
        zIndex: 50,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        {rollPopup.spinning ? "Rolling…" : "Result"}
      </div>
      <div style={{ display: "grid", placeItems: "center" }}>
        <div
          style={{
            width: 120,
            height: 84,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.15)",
            background: "rgba(255,255,255,.04)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <FaceIcon face={rollPopup.face} />
        </div>
      </div>
    </div>
  );
}
