import React from "react";
import SpriteThumb from "./SpriteThumb";

export default function StatusIcon({
  src,          // imported image module (e.g., PoisonIcon, BombIcon)
  size = 28,    // rendered square size
  radius = 6,   // not super visible at small sizes, but kept for consistency
  title = "",
  style = {},
  className = "",
}) {
  return (
    <SpriteThumb
      src={src}
      index={0}       // single-tile sheet
      frameW={500}
      frameH={500}
      rows={1}
      cols={1}
      size={size}
      radius={radius}
      style={style}
      title={title}
      className={className}
    />
  );
}
