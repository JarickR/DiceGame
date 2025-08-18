import React from "react";
import { getSpriteStyle } from "../utils/getSpriteStyle";
import Tier1Enemies from "../assets/art/Tier1Enemies.png";
import Tier2Enemies from "../assets/art/Tier2Enemies.png";
import BossEnemies from "../assets/art/BossEnemies.png";
import StatusEffects from "./StatusEffects";
import "./EnemyIcon.css";

/**
 * Props:
 * - enemy: { key, name?, hp, armor, tier, spriteIndex? }  // key maps to index automatically
 * - size?: number (display size, default 80)
 * - status?: { poison?: number, bomb?: number, ... }
 * - onAttack?: () => void
 */
const SHEETS = {
  1: Tier1Enemies,
  2: Tier2Enemies,
  3: BossEnemies,
};

const EnemyCard = ({ enemy, size = 80, status = {}, onAttack }) => {
  const { tier = 1, key, name, hp, armor, spriteIndex } = enemy;

  const sheet = SHEETS[tier] || Tier1Enemies;
  const index = typeof spriteIndex === "number" ? spriteIndex : enemy.index; // allow override

  const spriteStyle = getSpriteStyle({
    sheet,
    index,
    tileSize: 500,
    columns: 5,
    view: size,
  });

  return (
    <div className="enemy-card">
      <div className="enemy-thumb" style={spriteStyle} />
      <div className="enemy-meta">
        <div className="enemy-title">{name}</div>
        <div className="enemy-stats">Tier: {tier} • HP: {hp} • Armor: {armor}</div>
        <StatusEffects effects={status} compact />
      </div>
      {onAttack && (
        <button className="btn btn-attack" onClick={onAttack}>Attack</button>
      )}
    </div>
  );
};

export default EnemyCard;
