import React from "react";
import T1 from "../assets/art/Tier1Spells.png";
import T2 from "../assets/art/Tier2Spells.png";
import T3 from "../assets/art/Tier3Spells.png";
import UPG from "../assets/art/UpgradeLogo.png";

// Sprite indices (1×8 vertical, first N used per your notes)
const SPELL_INDEX = {
  1: { attack: 0, heal: 1, armor: 2, sweep: 3, fireball: 4 },
  2: { attack: 0, heal: 1, armor: 2, concentration: 3, sweep: 4, fireball: 5, poison: 6, bomb: 7 },
  3: { attack: 0, sweep: 1, fireball: 2 },
};

const SHEET_BY_TIER = { 1: T1, 2: T2, 3: T3 };

export default function SpellIcon({
  tier,
  name,
  size = 100,       // width in px
  radius = 10,
  upgrade = false,  // if true, show the upgrade wrench (1×1)
  debug = false,
}) {
  const viewW = Math.round(size);
  const viewH = Math.round(size * 0.75);

  const styleBase = {
    width: `${viewW}px`,
    height: `${viewH}px`,
    borderRadius: `${radius}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  };

  if (upgrade) {
    return (
      <div
        style={{
          ...styleBase,
          backgroundImage: `url(${UPG})`,
          backgroundSize: `${viewW}px ${viewH}px`,
          backgroundPosition: `0 0`,
        }}
        aria-label="upgrade"
      />
    );
  }

  const src = SHEET_BY_TIER[tier];
  const idx = SPELL_INDEX[tier]?.[name] ?? 0;
  const rows = 8;

  const bgW = viewW;
  const bgH = viewH * rows;
  const offsetY = -idx * viewH;

  if (debug) {
    console.log("[SpellIcon]", { tier, name, idx, viewW, viewH, bgW, bgH, offsetY });
  }

  return (
    <div
      style={{
        ...styleBase,
        backgroundImage: `url(${src})`,
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `0px ${offsetY}px`,
      }}
      aria-label={`${name}-t${tier}`}
    />
  );
}
