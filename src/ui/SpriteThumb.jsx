import React from "react";

/**
 * Generic vertical spritesheet viewer.
 * - Sheets are 1 column x N rows (your art is 1×8).
 * - Each frame is 500×375 (4:3).
 * - You pass the display width (viewW). This component computes the exact height and pixel-perfect offsets.
 */
export default function SpriteThumb({
  src,
  index = 0,
  frameW = 500,
  frameH = 375,
  rows = 8,   // vertical rows
  cols = 1,   // always 1 column for your sheets
  viewW = 120,
  radius = 10,
  alt = "",
  style = {},
}) {
  // scale the whole sheet so that one frame width == viewW
  const scale = viewW / frameW;
  const viewH = Math.round(frameH * scale); // 4:3 derived height

  // Compute pixel-exact offsets/sizes on the *scaled* sheet
  const sheetW = Math.round(cols * frameW * scale); // = viewW
  const sheetH = Math.round(rows * frameH * scale);
  const row = Math.max(0, Math.min(rows - 1, index));
  const y = Math.round(row * frameH * scale);
  const x = 0;

  return (
    <div
      aria-label={alt}
      style={{
        width: viewW,
        height: viewH,
        borderRadius: radius,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheetW}px ${sheetH}px`,
        backgroundPosition: `-${x}px -${y}px`,
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}
