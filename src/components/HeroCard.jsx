import React from "react";
import ClassIcon from "../ui/ClassIcon.jsx";
import SpellIcon from "../ui/SpellIcon.jsx";
import StatusEffects from "./StatusEffects.jsx";

const titleCase = (s = "") => s.slice(0, 1).toUpperCase() + s.slice(1);

function FaceIcon({ face, heroClass }) {
  if (!face) return null;
  if (face.kind === "class") return <ClassIcon name={heroClass || "thief"} size={36} />;
  if (face.kind === "upgrade") return <SpellIcon upgrade size={40} />;
  if (face.kind === "spell") {
    const s = face.spell || "blank";
    if (s === "blank") return <div style={{ fontSize: 11, opacity: 0.65 }}>Blank</div>;
    const tier = face.tier || 0; // not used; SpellIcon derives by name in your setup
    return <SpellIcon name={s} tier={undefined} size={44} />;
  }
  return null;
}

export default function HeroCard({ hero, isActive, goldSlot, flash }) {
  const pct = (hero.hp / 20) * 100;
  const faces = [
    { kind: "spell", slot: 0, spell: hero.slots[0] },
    { kind: "spell", slot: 1, spell: hero.slots[1] },
    { kind: "spell", slot: 2, spell: hero.slots[2] },
    { kind: "spell", slot: 3, spell: hero.slots[3] },
    { kind: "class" },
    { kind: "upgrade" },
  ];

  return (
    <div
      style={{
        border: `2px solid ${isActive ? "#ffd966" : "rgba(255,255,255,.15)"}`,
        borderRadius: 14,
        padding: 10,
        minHeight: 180,
        display: "grid",
        gap: 8,
        gridTemplateRows: "auto auto auto 1fr",
        background: "rgba(255,255,255,.03)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 52, height: 52 }}>
          <ClassIcon name={hero.class} size={52} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>
          {titleCase(hero.class)} (P{hero.id + 1})
        </div>
      </div>

      {/* HP */}
      <div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>HP {hero.hp}/20</div>
        <div style={{ height: 10, background: "rgba(255,255,255,.08)", borderRadius: 6 }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "#d84d4d",
              borderRadius: 6,
              transition: "width .25s ease",
            }}
          />
        </div>
      </div>

      {/* Armor + Stacks */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 13 }}>Armor: <b>{hero.armor || 0}</b></div>
        <div style={{ marginLeft: "auto" }}>
          <StatusEffects poison={hero.stacks?.poison || 0} bomb={hero.stacks?.bomb || 0} />
        </div>
      </div>

      {/* 6 faces */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 8,
          alignItems: "center",
        }}
      >
        {faces.map((f, i) => (
          <div
            key={i}
            style={{
              height: 64,
              borderRadius: 12,
              border:
                f.kind === "spell" && goldSlot === `p-${hero.id}-s${f.slot}`
                  ? "3px solid #ffd966"
                  : "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.04)",
              display: "grid",
              placeItems: "center",
            }}
            title={f.kind === "spell" ? (f.spell || "Blank") : f.kind}
          >
            <FaceIcon face={f} heroClass={hero.class} />
          </div>
        ))}
      </div>

      {/* red flash when hit */}
      {flash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(220,40,40,.25)",
            animation: "hitflash .35s ease",
            pointerEvents: "none",
          }}
        />
      )}

      {hero.defeated && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          DOWN
        </div>
      )}

      <style>{`
        @keyframes hitflash {
          0% { opacity: .0 }
          20% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
}
