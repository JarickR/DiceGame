import React from "react";
import "./StatusEffects.css";

// Flat PNGs you provided (500×500), we scale them down in CSS
import PoisonIcon from "../assets/art/PoisonIcon.png";
import BombIcon from "../assets/art/BombIcon.png";

export default function StatusEffects({ poison = 0, bomb = 0 }) {
  return (
    <div className="status-effects">
      <div className="status-icon">
        <img src={PoisonIcon} alt="Poison" />
        <span className="status-count">PSN {poison}</span>
      </div>
      <div className="status-icon">
        <img src={BombIcon} alt="Bomb" />
        <span className="status-count">BMB {bomb}</span>
      </div>
    </div>
  );
}
