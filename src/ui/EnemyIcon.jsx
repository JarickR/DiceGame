import React from "react";
import SpriteThumb from "./SpriteThumb";

// 5×4 grids; each frame 500×500 (row-major: left→right, top→bottom)
import T1 from "../assets/art/Tier1Enemies.png";
import T2 from "../assets/art/Tier2Enemies.png";
import BOSS from "../assets/art/BossEnemies.png";

function sheetForTier(tier) {
  if (tier === 1 || tier === "1") return T1;
  if (tier === 2 || tier === "2") return T2;
  return BOSS; // "boss"
}

/**
 * index: 0..19 (row-major) for tier sheets, 0..19 for boss too.
 * If you prefer (row, col) you can pass them and we'll derive index.
 */
export default function EnemyIcon({
  tier = 1,
  index = 0,
  row,
  col,
  size = 72,
  radius = 8,
  style,
  title,
}) {
  const rows = 4;
  const cols = 5;

  let idx = index;
  if (row !== undefined && col !== undefined) {
    idx = row * cols + col;
  }

  return (
    <SpriteThumb
      src={sheetForTier(tier)}
      index={idx}
      frameW={500}
      frameH={500}
      rows={rows}
      cols={cols}
      size={size}
      radius={radius}
      style={style}
      title={title}
    />
  );
}
