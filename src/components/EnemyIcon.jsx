import React from "react";
import SpriteThumb from "../ui/SpriteThumb";

// Each enemy sheet is 5×4 (cols×rows), 500×500 per frame
import TIER1_ENEMIES from "../assets/art/Tier1Enemies.png";
import TIER2_ENEMIES from "../assets/art/Tier2Enemies.png";
import BOSS_ENEMIES from "../assets/art/BossEnemies.png";

const SHEETS = {
  T1: { src: TIER1_ENEMIES, cols: 5, rows: 4 },
  T2: { src: TIER2_ENEMIES, cols: 5, rows: 4 },
  Boss: { src: BOSS_ENEMIES, cols: 5, rows: 4 },
};

export default function EnemyIcon({
  enemy,
  size = 100,
  radius = 8,
  debug = false,
}) {
  if (!enemy) return null;

  const key = enemy.tier === 2 || enemy.tier === "T2" ? "T2" : enemy.tier === "Boss" ? "Boss" : "T1";
  const { src, cols, rows } = SHEETS[key];
  const index = typeof enemy.index === "number" ? enemy.index : 0;

  return (
    <SpriteThumb
      src={src}
      index={index}
      frameW={500}
      frameH={500}
      rows={rows}
      cols={cols}
      viewW={size}
      viewH={size}
      radius={radius}
      debug={debug}
    />
  );
}
