// src/components/HeroCard.jsx
import React, { useMemo } from "react";
import ClassIcon from "../ui/ClassIcon";
import SpellIcon from "../ui/SpellIcon";

export default function HeroCard({
  hero = {},
  isActive = false,
  onRoll = () => {},
}) {
  // Defensive normalization
  const id = Number.isFinite(hero.id) ? hero.id : 0;
  const className = hero.className || "thief";
  const maxHp = Number.isFinite(hero.maxHp) ? hero.maxHp : 20;
  const hp = Math.min(Math.max(Number(hero.hp ?? maxHp), 0), maxHp);
  const armor = Number(hero.armor ?? 0);
  const stacks = {
    poison: Number(hero?.stacks?.poison ?? 0),
    bomb: Number(hero?.stacks?.bomb ?? 0),
  };

  const spells = useMemo(() => {
    const raw = Array.isArray(hero.spells) ? hero.spells.slice(0, 4) : [];
    while (raw.length < 4) raw.push(null);
    return raw.map((s) =>
      s && s.name ? { tier: Number(s.tier ?? 1), name: String(s.name) } : null
    );
  }, [hero.spells]);

  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div
      style={{
        width: 360,
        border: "1px solid #333",
        borderRadius: 12,
        padding: 12,
        outline: isActive ? "2px solid #d4a11d" : "none",
        background: "#12161a",
        color: "#fff",
        transition: "outline-color 120ms linear",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <ClassIcon name={className} size={44} />
        <div style={{ fontWeight: 900, fontSize: 20, textTransform: "capitalize" }}>
          {className} <span style={{ opacity: 0.8 }}>(P{id + 1})</span>
        </div>
      </div>

      {/* HP */}
      <div style={{ marginBottom: 6 }}>
        HP {hp}/{maxHp}
      </div>
      <div
        style={{
          height: 8,
          background: "#30161a",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: `${hpPct}%`,
            height: "100%",
            background: "#ea4d5a",
            transition: "width 180ms linear",
          }}
        />
      </div>

      {/* Armor + stacks */}
      <div style={{ marginBottom: 8 }}>Armor {armor}</div>
      <div style={{ marginBottom: 10, display: "flex", gap: 12, fontSize: 12 }}>
        <div>PSN {stacks.poison}</div>
        <div>BMB {stacks.bomb}</div>
      </div>

      {/* Spell slots */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {spells.map((slot, idx) => (
          <div
            key={idx}
            title={slot?.name ? `${slot.name} (T${slot.tier})` : "Blank"}
            style={{
              width: 70,
              height: 70,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "grid",
              placeItems: "center",
            }}
          >
            {slot?.name ? (
              <SpellIcon tier={slot.tier} name={slot.name} size={56} />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  border: "1px dashed rgba(255,255,255,0.3)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Roll button — ALWAYS clickable (we guard in App.jsx) */}
      <button
        onClick={onRoll}
        title={isActive ? "Roll your die" : "Not your turn"}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          background: isActive ? "#1f6feb" : "rgba(255,255,255,0.12)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
          opacity: hp <= 0 ? 0.5 : 1,
        }}
      >
        Roll
      </button>
    </div>
  );
}
