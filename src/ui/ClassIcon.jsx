import React from "react";

// class-logos.png is 500×3000 (8 rows x 1 col)
const SPRITE_W = 500;
const SPRITE_H = 3000;
const ROWS = 8;
const ROW_H = SPRITE_H / ROWS;

// Map class -> row index
const CLASS_INDEX = {
  thief: 0, judge: 1, tank: 2, vampire: 3,
  king: 4, lich: 5, paladin: 6, barbarian: 7,
};

export default function ClassIcon({
  classId,
  name,
  size = 100,
  radius = 8,
  style,
}) {
  const key = (classId || name || "thief").toLowerCase();
  const idx = CLASS_INDEX[key] ?? 0;
  const bgY = -idx * ROW_H;

  // Use Vite base for correct path even when served from subfolder
  const base = (import.meta?.env?.BASE_URL ?? "/").replace(/\/+$/, "");
  const src = `${base}/art/class-logos.png`;

  return (
    <div
      style={{
        width: size,
        height: Math.round(size * (ROW_H / SPRITE_W)), // keep 4:3 aspect (500:375)
        borderRadius: radius,
        backgroundImage: `url("${src}")`,
        backgroundSize: `${SPRITE_W}px ${SPRITE_H}px`,
        backgroundPosition: `0px ${bgY}px`,
        backgroundRepeat: "no-repeat",
        backgroundColor: "rgba(255,255,255,.06)", // visible even if image missing
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
        ...style,
      }}
      title={key}
    />
  );
}
