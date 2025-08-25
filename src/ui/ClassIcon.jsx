import React from "react";
import SpriteThumb from "./SpriteThumb";

// 1×8 vertical; each frame is 500×500
import CLASS_SHEET from "../assets/art/class-logos.png";

const CLASS_INDEX = {
  thief: 0,
  judge: 1,
  tank: 2,
  vampire: 3,
  king: 4,
  lich: 5,
  paladin: 6,
  barbarian: 7,
};

export default function ClassIcon({ name, size = 80, radius = 10, style }) {
  const index = CLASS_INDEX[name] ?? 0;
  return (
    <SpriteThumb
      src={CLASS_SHEET}
      index={index}
      frameW={500}
      frameH={500}
      rows={8}
      cols={1}
      size={size}
      radius={radius}
      style={style}
      title={name}
    />
  );
}
