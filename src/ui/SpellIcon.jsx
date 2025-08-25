import React from "react";
import SpriteThumb from "./SpriteThumb";

// All are 1×8 vertical sheets; each frame 500×500
import T1 from "../assets/art/Tier1Spells.png";
import T2 from "../assets/art/Tier2Spells.png";
import T3 from "../assets/art/Tier3Spells.png";

const SHEET_BY_TIER = { 1: T1, 2: T2, 3: T3 };

// Indices per your sheets (top → bottom = 0..7)
const INDEX = {
  1: {
    attack: 0,
    heal: 1,
    armor: 2,
    sweep: 3,
    fireball: 4,
    // 5–7 unused/blank
  },
  2: {
    attack: 0,
    heal: 1,
    armor: 2,
    concentration: 3,
    sweep: 4,
    fireball: 5,
    poison: 6,
    bomb: 7,
  },
  3: {
    attack: 0,
    sweep: 1,
    fireball: 2,
    // 3–7 blank
  },
};

export default function SpellIcon({
  tier = 1,
  name = "attack",
  size = 96,
  radius = 10,
  style,
}) {
  const sheet = SHEET_BY_TIER[tier];
  const index = (INDEX[tier] && INDEX[tier][name] !== undefined)
    ? INDEX[tier][name]
    : 0;

  return (
    <SpriteThumb
      src={sheet}
      index={index}
      frameW={500}
      frameH={500}
      rows={8}
      cols={1}
      size={size}
      radius={radius}
      style={style}
      title={`${name} (T${tier})`}
    />
  );
}
