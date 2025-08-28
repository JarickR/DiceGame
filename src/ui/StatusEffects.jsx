import React from "react";
import "./StatusEffects.css";
import StatusIcon from "../ui/StatusIcon";

// single 500×500 tiles you added
import PoisonIcon from "../assets/art/PoisonIcon.png";
import BombIcon from "../assets/art/BombIcon.png";

/**
 * StatusEffects
 * Renders small poison/bomb icons with the stack count BELOW the icon.
 * - Flat style
 * - Black count text (as requested)
 *
 * Props:
 *  - poison: number (>=0)
 *  - bomb: number (>=0)
 *  - size: px for icon (default 28)
 *  - gap: spacing between icons (default 10)
 */
export default function StatusEffects({
  poison = 0,
  bomb = 0,
  size = 28,
  gap = 10,
  className = "",
  style = {},
}) {
  const showPoison = Number(poison) > 0;
  const showBomb = Number(bomb) > 0;

  if (!showPoison && !showBomb) {
    return null;
  }

  return (
    <div
      className={`status-effects ${className}`}
      style={{ display: "flex", alignItems: "flex-start", gap, ...style }}
    >
      {showPoison && (
        <div className="status-item">
          <StatusIcon src={PoisonIcon} size={size} title="Poison" />
          <div className="status-count status-poison">{poison}</div>
        </div>
      )}
      {showBomb && (
        <div className="status-item">
          <StatusIcon src={BombIcon} size={size} title="Bomb" />
          <div className="status-count status-bomb">{bomb}</div>
        </div>
      )}
    </div>
  );
}
