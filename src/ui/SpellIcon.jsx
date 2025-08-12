import React from "react";

// All spell sheets are 500×3000 (8 rows x 1 col)
const SPRITE_W = 500;
const SPRITE_H = 3000;
const ROWS = 8;
const ROW_H = SPRITE_H / ROWS;

// Indices per tier (rows, top→down)
const SPELL_INDEX = {
  1: { attack: 0, heal: 1, armor: 2, sweep: 3, fireball: 4 }, // first 5 used
  2: { attack: 0, heal: 1, armor: 2, concentration: 3, sweep: 4, fireball: 5, poison: 6, bomb: 7 },
  3: { attack: 0, sweep: 1, fireball: 2 },                     // first 3 used
};

export default function SpellIcon({
  tier,
  name,
  size = 100,
  radius = 10,
  upgrade = false,
  style,
}) {
  const base = (import.meta?.env?.BASE_URL ?? "/").replace(/\/+$/, "");
  const upgradeSrc = `${base}/art/UpgradeLogo.png`;

  // Blank / placeholder tile
  if (!name || name === "blank") {
    return (
      <div
        style={{
          width: size,
          height: Math.round(size * (ROW_H / SPRITE_W)),
          borderRadius: radius,
          background: "rgba(255,255,255,.05)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
          ...style,
        }}
        title="Blank"
      />
    );
  }

  // Upgrade tile
  if (upgrade) {
    return (
      <div
        style={{
          width: size,
          height: Math.round(size * (ROW_H / SPRITE_W)),
          borderRadius: radius,
          backgroundImage: `url("${upgradeSrc}")`,
          backgroundSize: `${SPRITE_W}px ${SPRITE_H}px`,
          backgroundPosition: `0px 0px`,
          backgroundRepeat: "no-repeat",
          backgroundColor: "rgba(255,255,255,.06)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
          ...style,
        }}
        title="Upgrade"
      />
    );
  }

  const index = SPELL_INDEX[tier]?.[name];
  const sheetPath =
    tier === 1 ? `${base}/art/Tier1Spells.png` :
    tier === 2 ? `${base}/art/Tier2Spells.png` :
    `${base}/art/Tier3Spells.png`;

  // Fallback if index unknown or sheet missing
  if (index == null) {
    return (
      <div
        style={{
          width: size,
          height: Math.round(size * (ROW_H / SPRITE_W)),
          borderRadius: radius,
          background: "rgba(255,255,255,.05)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
          ...style,
        }}
        title={`${name || "?"} (T${tier})`}
      />
    );
  }

  const bgY = -index * ROW_H;

  return (
    <div
      style={{
        width: size,
        height: Math.round(size * (ROW_H / SPRITE_W)), // 4:3
        borderRadius: radius,
        backgroundImage: `url("${sheetPath}")`,
        backgroundSize: `${SPRITE_W}px ${SPRITE_H}px`,
        backgroundPosition: `0px ${bgY}px`,
        backgroundRepeat: "no-repeat",
        backgroundColor: "rgba(255,255,255,.06)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
        ...style,
      }}
      title={`${name} (T${tier})`}
    />
  );
}
