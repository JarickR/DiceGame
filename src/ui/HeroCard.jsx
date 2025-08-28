import React, { useEffect, useRef, useState } from "react";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";
import StatusEffects from "../components/StatusEffects";

/**
 * props:
 * - hero: { id, name, className, hp, maxHp, armor, spells: [{tier,name}|null x4], stacks: {psn,bmb}}
 * - isActive: bool
 * - wasHitTick: number (increments when this hero takes damage)
 */
export default function HeroCard({ hero, isActive, wasHitTick }) {
  const [flash, setFlash] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!wasHitTick) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 350);
    return () => clearTimeout(t);
  }, [wasHitTick]);

  const hpPct = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));

  return (
    <div className={`combat-card ${flash ? "hitflash" : ""}`} ref={ref}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ClassIcon name={hero.className} size={48} radius={10} />
        <div>
          <div style={{ fontWeight: 800 }}>
            {hero.className.charAt(0).toUpperCase() + hero.className.slice(1)}{" "}
            (P{hero.id + 1})
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            HP {hero.hp}/{hero.maxHp}
          </div>
        </div>
      </div>

      <div className="hpbar" style={{ marginTop: 8 }}>
        <span style={{ width: `${hpPct}%` }} />
      </div>

      <div style={{ marginTop: 6, fontSize: 12 }}>
        Armor: <b>{hero.armor}</b>
      </div>

      {/* Spell slots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 10 }}>
        {hero.spells.map((slot, i) => (
          <div key={i} className="choice-card" style={{ padding: 8 }}>
            {slot ? (
              <SpellIcon tier={slot.tier} name={slot.name} size={64} radius={10} />
            ) : (
              <div
                className="thumb"
                style={{
                  width: 64,
                  height: 64,
                  border: "1px dashed var(--border)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--muted)",
                }}
              >
                Blank
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <StatusEffects psn={hero.stacks?.psn || 0} bmb={hero.stacks?.bmb || 0} />
      </div>

      {isActive && (
        <div style={{ marginTop: 8, color: "var(--accent)", fontWeight: 700 }}>
          Your turn
        </div>
      )}
    </div>
  );
}
