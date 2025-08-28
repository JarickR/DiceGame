import React from "react";
import PoisonIcon from "../assets/art/PoisonIcon.png";
import BombIcon from "../assets/art/BombIcon.png";

export default function StatusEffects({ psn = 0, bmb = 0 }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <Stack icon={PoisonIcon} label="PSN" value={psn} />
      <Stack icon={BombIcon} label="BMB" value={bmb} />
    </div>
  );
}

function Stack({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <img
        src={icon}
        alt={label}
        width={22}
        height={22}
        style={{ imageRendering: "pixelated" }}
      />
      <div style={{ fontSize: 12 }}>
        {label} <b>{value}</b>
      </div>
    </div>
  );
}
