import React from "react";
import CLASS_LOGOS from "../assets/art/class-logos.png";

/**
 * Renders a single frame from a 1×8 vertical sprite (each frame 500×375).
 * Uses inline width/height so parents can’t shrink it.
 */
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
  size = 80,         // width in px
  radius = 10,
  debug = false,
}) {
  const index = CLASS_INDEX[name] ?? 0;

  // Maintain 500×375 aspect → 4:3
  const viewW = Math.round(size);
  const viewH = Math.round(size * 0.75);

  // Background sheet scaled to our view width; total height = 8 rows
  const bgW = viewW;
  const bgH = viewH * 8;
  const offsetY = -index * viewH;

  const style = {
    width: `${viewW}px`,
    height: `${viewH}px`,
    borderRadius: `${radius}px`,
    backgroundImage: `url(${CLASS_LOGOS})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `0px ${offsetY}px`,
    imageRendering: "pixelated",
  };

  if (debug) {
    console.log("[ClassIcon]", { name, index, viewW, viewH, bgW, bgH, offsetY });
  }

  return <div style={style} aria-label={name} />;
}
