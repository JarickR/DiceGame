// src/components/EnemyCard.jsx
import React from "react";
import EnemyIcon from "../ui/EnemyIcon";
import StatusEffects from "./StatusEffects";

/**
 * Props:
 *  - enemy: {
 *      id?: string|number,
 *      name?: string,
 *      tier?: 1|2|"boss",
 *      hp?: number,
 *      maxHp?: number,
 *      armor?: number,
 *      stacks?: { poison?: number, bomb?: number }
 *    }
 *  - highlight?: boolean
 *  - onAttack?: (enemyId) => void
 */
export default function EnemyCard({
  enemy = {},
  highlight = false,
  onAttack,
}) {
  // SAFE defaults so missing enemy never crashes
  const {
    id = "E?",
    name = "Enemy",
    tier = 1,
    hp = 8,
    maxHp = 8,
    armor = 0,
    stacks = {},
  } = enemy || {};

  // Minimal “is this object usable?” check
  const isValid =
    enemy &&
    (tier === 1 || tier === 2 || tier === "boss") &&
    typeof hp === "number" &&
    typeof maxHp === "number";

  if (!isValid) {
    // Render a small, non-crashing placeholder so you can keep playing
    return (
      <div
        className="enemy-card"
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,.12)",
          padding: 12,
          background: "rgba(255,255,255,.04)",
          color: "white",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Invalid Enemy</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Missing or malformed enemy data.
        </div>
      </div>
    );
  }

  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));

  return (
    <div
      className={`enemy-card ${highlight ? "hl" : ""}`}
      style={{
        borderRadius: 12,
        border: highlight
          ? "2px solid #d4af37"
          : "1px solid rgba(255,255,255,.12)",
        padding: 12,
        background: "rgba(255,255,255,.04)",
        color: "white",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <EnemyIcon
          tier={tier}
          index={safeIndex(enemy)}
          size={42}
          radius={8}
        />
        <div style={{ display: "grid" }}>
          <div style={{ fontWeight: 800 }}>{name}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {typeof id === "string" ? id : `ID ${id}`} • Tier {String(tier)}
          </div>
        </div>
      </div>

      {/* HP bar */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,.1)",
            overflow: "hidden",
          }}
          aria-label="hp-bar"
        >
          <div
            style={{
              width: `${hpPct * 100}%`,
              height: "100%",
              background: "#ff6060",
            }}
          />
        </div>
        <div
          style={{ marginTop: 6, fontSize: 12, display: "flex", gap: 16 }}
          aria-label="stats-line"
        >
          <span>HP {hp}/{maxHp}</span>
          <span>Armor: {armor}</span>
        </div>
      </div>

      {/* Status stacks */}
      <div style={{ marginTop: 8 }}>
        <StatusEffects
          poison={stacks?.poison ?? 0}
          bomb={stacks?.bomb ?? 0}
          compact={false}
        />
      </div>

      {/* Quick action */}
      {onAttack && (
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={() => onAttack(id)}>
            Attack
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Some sheets use automatic index; if your enemy has a stable "spriteIndex"
 * we prefer it, otherwise default to 0.
 */
function safeIndex(enemy) {
  // prefer explicit spriteIndex if present and numeric
  if (enemy && typeof enemy.spriteIndex === "number") return enemy.spriteIndex;
  // fallback if your enemy list is small and you want index from id
  if (typeof enemy?.id === "number") return Math.max(0, enemy.id % 20);
  return 0;
}
