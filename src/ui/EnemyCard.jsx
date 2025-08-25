// src/ui/EnemyCard.jsx
import React from "react";
import EnemyIcon from "./EnemyIcon";                 // kept separate
import StatusEffects from "../components/StatusEffects"; // stacks UI (PSN/BMB)

/**
 * Props
 *  enemy: {
 *    id, name, hp, armor,
 *    tier: 'tier1' | 'tier2' | 'boss',
 *    sprite?: { index: number },   // from ENEMY_SHEETS in App.jsx
 *    status?: { poison?: number, bomb?: number }
 *  }
 *  size?: number  // thumbnail render size (default 96)
 *  onAttack?: () => void
 */
export default function EnemyCard({ enemy, size = 96, onAttack }) {
  if (!enemy) return null;

  // Map your encounter tier to EnemyIcon’s expected prop
  const tierProp =
    enemy.tier === "boss" ? "boss" : enemy.tier === "tier2" ? 2 : 1;

  // Prefer the new sprite index, fallback to enemy.index or 0
  const index = (() => {
    if (enemy.sprite && typeof enemy.sprite.index === "number") return enemy.sprite.index;
    if (typeof enemy.index === "number") return enemy.index;
    return 0;
  })();

  const status = {
    poison: enemy.status?.poison || 0,
    bomb:   enemy.status?.bomb   || 0,
  };

  return (
    <div
      style={{
        background: "#12151a",
        border: "1px solid #263243",
        borderRadius: 12,
        padding: 10,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gridTemplateRows: "auto auto",
        gridTemplateAreas: `"thumb meta" "thumb btn"`,
        gap: 10,
        width: 260,
      }}
    >
      <div style={{ gridArea: "thumb" }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            overflow: "hidden",
            background: "#0b0f15",
            display: "grid",
            placeItems: "center",
            border: "1px solid #1f2a3a",
          }}
        >
          <EnemyIcon tier={tierProp} index={index} size={size} />
        </div>
      </div>

      <div style={{ gridArea: "meta" }}>
        <div style={{ fontWeight: 700 }}>{enemy.name}</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
          Tier: {enemy.tier === "boss" ? "Boss" : enemy.tier === "tier2" ? "2" : "1"} •{" "}
          HP: <b>{enemy.hp}</b> • Armor: <b>{enemy.armor}</b>
        </div>

        {/* Status stacks (PSN/BMB) */}
        <div style={{ marginTop: 6 }}>
          <StatusEffects effects={status} compact />
        </div>
      </div>

      {onAttack && (
        <div style={{ gridArea: "btn", alignSelf: "end" }}>
          <button
            onClick={onAttack}
            style={{
              background: "#1d3b8f",
              border: "1px solid #2a4db5",
              color: "#e8ecf1",
              padding: "6px 10px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Attack
          </button>
        </div>
      )}
    </div>
  );
}
