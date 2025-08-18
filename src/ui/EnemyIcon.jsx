import React from "react";
import "./EnemyIcon.css";

import Tier1Enemies from "../assets/art/Tier1Enemies.png";
import Tier2Enemies from "../assets/art/Tier2Enemies.png";
import BossEnemies from "../assets/art/BossEnemies.png";

const SPRITE_SIZE = 500; // each tile in your sprite sheet is 500x500
const SHEET_COLS = 5;   // 5 across per row

const EnemyIcon = ({ tier, index, size = 64 }) => {
  let sheet;
  if (tier === 1) sheet = Tier1Enemies;
  else if (tier === 2) sheet = Tier2Enemies;
  else if (tier === "boss") sheet = BossEnemies;

  // Figure out row/column from index
  const col = index % SHEET_COLS;
  const row = Math.floor(index / SHEET_COLS);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundImage: `url(${sheet})`,
    backgroundPosition: `-${col * SPRITE_SIZE}px -${row * SPRITE_SIZE}px`,
    backgroundSize: `${SHEET_COLS * 100}% auto`,
    imageRendering: "pixelated",
  };

  return <div className="enemy-icon" style={style}></div>;
};

export default EnemyIcon;
