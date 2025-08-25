import React from "react";

/**
 * Generic sprite-sheet thumbnail.
 * Works with *any* sheet; you just say how many rows/cols and the frame size.
 *
 * We draw the whole sheet as a background-image and then move/scale it so
 * the requested frame is visible inside a small square <div>.
 */
export default function SpriteThumb({
  src,
  index = 0,          // 0-based frame index
  frameW = 500,       // width of a single frame in the sheet (px)
  frameH = 500,       // height of a single frame in the sheet (px)
  rows = 1,           // number of rows in the sheet
  cols = 1,           // number of cols in the sheet
  size = 80,          // rendered square size (width=height)
  radius = 10,        // border radius on the thumb
  style = {},         // extra style
  title,
  alt,                // kept for API parity; not used (div background)
}) {
  // Guard
  const totalFrames = rows * cols;
  const safeIndex = Math.max(0, Math.min(index, totalFrames - 1));

  // Compute row/col in the sheet
  const col = safeIndex % cols;
  const row = Math.floor(safeIndex / cols);

  // We scale the entire sheet so a 500×500 frame becomes "size×size".
  const scale = size / frameW;

  // Scaled sheet full dimensions
  const sheetWScaled = frameW * cols * scale;
  const sheetHScaled = frameH * rows * scale;

  // Scaled offsets to bring the (row,col) frame into view
  const offsetX = -(col * frameW * scale);
  const offsetY = -(row * frameH * scale);

  return (
    <div
      title={title}
      aria-label={alt || title}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheetWScaled}px ${sheetHScaled}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        // nice safe default so the image isn't hidden by a container color
        backgroundColor: "transparent",
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
