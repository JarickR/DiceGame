// src/ui/SpriteThumb.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Generic sprite thumbnail renderer using CSS background-position.
 * Works perfectly for vertical strips (1xN) and grids (CxR).
 *
 * Props:
 *  - src:           string | imported URL (Vite import recommended)
 *  - index:         integer frame index (0-based)
 *  - frameW:        width of a single frame in the sheet (px)
 *  - frameH:        height of a single frame in the sheet (px)
 *  - cols:          number of columns in the sheet (default 1)
 *  - rows:          number of rows in the sheet (default 1)
 *  - viewW, viewH:  rendered size of the thumb (px)
 *  - radius:        border-radius (px)
 *  - debug:         boolean – prints diagnostics to the console
 */
export default function SpriteThumb({
  src,
  index = 0,
  frameW,
  frameH,
  cols = 1,
  rows = 1,
  viewW = 80,
  viewH = 80,
  radius = 8,
  debug = false,
  title,
  style,
  className,
}) {
  const [sheetSize, setSheetSize] = useState({ w: 0, h: 0, ok: false });
  const containerRef = useRef(null);

  // Preload image to discover real dimensions and catch 404s.
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      setSheetSize({ w: img.naturalWidth, h: img.naturalHeight, ok: true });
      if (debug) {
        console.log("[SpriteThumb] Image loaded:", {
          src,
          sheetW: img.naturalWidth,
          sheetH: img.naturalHeight,
          expectedW: frameW * cols,
          expectedH: frameH * rows,
        });
      }
    };
    img.onerror = (e) => {
      setSheetSize({ w: 0, h: 0, ok: false });
      console.warn("[SpriteThumb] FAILED to load image:", src, e);
    };
    img.src = src;
  }, [src, cols, rows, frameW, frameH, debug]);

  // Compute background-size and background-position.
  const { bgSize, bgPos } = useMemo(() => {
    // Defensive: avoid division by zero.
    const safeCols = Math.max(1, cols);
    const safeRows = Math.max(1, rows);

    // Find frame’s row/col in the grid
    const col = index % safeCols;
    const row = Math.floor(index / safeCols);

    // We scale the background so that the whole sheet fits into a grid where
    // each frame maps to the thumb area. That means:
    //   background-size-x = 100% * cols
    //   background-size-y = 100% * rows
    //
    // Then background-position is expressed in percentages of that scaled sheet:
    //   posX% = (col / (cols-1)) * 100  (0 when cols=1)
    //   posY% = (row / (rows-1)) * 100  (0 when rows=1)
    const sizeX = `${safeCols * 100}%`;
    const sizeY = `${safeRows * 100}%`;

    let posX = "0%";
    let posY = "0%";
    if (safeCols > 1) posX = `${(col / (safeCols - 1)) * 100}%`;
    if (safeRows > 1) posY = `${(row / (safeRows - 1)) * 100}%`;

    return { bgSize: `${sizeX} ${sizeY}`, bgPos: `${posX} ${posY}` };
  }, [index, cols, rows]);

  // Extra debug dump once everything is known.
  useEffect(() => {
    if (!debug || !sheetSize.ok) return;
    const col = index % Math.max(1, cols);
    const row = Math.floor(index / Math.max(1, cols));

    console.log("[SpriteThumb] DEBUG dump", {
      src,
      index,
      cols,
      rows,
      col,
      row,
      frameW,
      frameH,
      sheetW: sheetSize.w,
      sheetH: sheetSize.h,
      calculated: {
        bgSize,
        bgPos,
        viewW,
        viewH,
      },
    });
  }, [debug, sheetSize, src, index, cols, rows, frameW, frameH, bgSize, bgPos, viewW, viewH]);

  // Fallback if image didn’t load
  if (!src || (sheetSize.ok === false && sheetSize.w === 0)) {
    return (
      <div
        ref={containerRef}
        title={title}
        className={className}
        style={{
          width: viewW,
          height: viewH,
          borderRadius: radius,
          background:
            "repeating-linear-gradient(45deg, #222 0, #222 8px, #111 8px, #111 16px)",
          outline: "1px solid #333",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      title={title}
      className={className}
      style={{
        width: viewW,
        height: viewH,
        borderRadius: radius,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        // Scale so the sheet is cols × rows tiles inside this box:
        backgroundSize: bgSize,
        // Move to the right tile:
        backgroundPosition: bgPos,
        imageRendering: "pixelated", // crisp pixel sprites
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
