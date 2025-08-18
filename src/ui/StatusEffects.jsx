// src/ui/StatusEffects.jsx
import React from "react";
import "./StatusEffects.css";

// Flat PNG icons you added (transparent BG)
import PoisonIcon from "../assets/art/PoisonIcon.png";
import BombIcon from "../assets/art/BombIcon.png";

/**
 * Reusable status effects display (works for heroes & enemies)
 *
 * props:
 * - effects: { poison?: number, bomb?: number }
 * - size: icon size in px (default 28)
 * - showZero: show icons even if 0 (default true)
 * - className: extra class on root container
 * - labelColor: CSS color for numbers under icons (default "#000")
 */
export default function StatusEffects({
  effects = {},
  size = 28,
  showZero = true,
  className = "",
  labelColor = "#000",
}) {
  const poison = Number(effects.poison || 0);
  const bomb   = Number(effects.bomb || 0);

  const items = [
    { key: "poison", icon: PoisonIcon, count: poison, alt: "Poison" },
    { key: "bomb",   icon: BombIcon,   count: bomb,   alt: "Bomb" },
  ];

  return (
    <div className={`status-stacks ${className}`}>
      {items.map(({ key, icon, count, alt }) => {
        if (!showZero && count <= 0) return null;
        return (
          <div className="stack" key={key}>
            <img
              src={icon}
              alt={alt}
              className="stack-icon"
              style={{ width: size, height: size }}
              draggable={false}
            />
            <div className="stack-count" style={{ color: labelColor }}>
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}
