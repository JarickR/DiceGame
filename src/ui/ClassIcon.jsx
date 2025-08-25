import React from "react";
import SpriteThumb from "./SpriteThumb";

// 1×8 vertical sheet, each frame 500×500
import CLASS_LOGOS from "../assets/art/class-logos.png";

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

export default function ClassIcon({
  name,
  size = 80,
  radius = 10,
  debug = false,
}) {
  const index = CLASS_INDEX[name] ?? 0;
  return (
    <SpriteThumb
      src={CLASS_LOGOS}
      index={index}
      frameW={500}
      frameH={500}
      rows={8}
      cols={1}
      viewW={size}
      viewH={size}
      radius={radius}
      debug={debug}
    />
  );
}
