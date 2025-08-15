// src/ui/GridThumb.jsx
import React from "react";

/**
 * GridThumb: shows a frame from a rows×cols sprite sheet.
 * Works entirely in CSS (background-position with background-size %).
 *
 * Props:
 *  - src:   string (/art/Tier1.png)
 *  - index: number (0..rows*cols-1)
 *  - cols, rows: numbers
 *  - viewW, viewH: rendered size in px
 *  - radius: border-radius (px)
 *  - bg: optional fallback background color
 */
export default function GridThumb({
  src,
  index = 0,
  cols = 1,
  rows = 1,
  viewW = 96,
  viewH = 96,
  radius = 10,
  bg = "#0b0f14",
  alt = ""
}) {
  // Convert linear index to grid coords
  const col = index % cols;
  const row = Math.floor(index / cols);

  // Position in percentages (avoid needing the image's natural size)
  const posX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const posY = rows > 1 ? (row / (rows - 1)) * 100 : 0;

  const style = {
    width: viewW,
    height: viewH,
    borderRadius: radius,
    overflow: "hidden",
    backgroundColor: bg,
    backgroundImage: `url(${src})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${posX}% ${posY}%`,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)"
  };

  return <div style={style} aria-label={alt} title={alt} />;
}
