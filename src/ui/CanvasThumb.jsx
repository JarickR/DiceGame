// src/ui/CanvasThumb.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * CanvasThumb draws one frame from a sprite sheet onto a canvas.
 * - rows × cols layout
 * - each frame is frameW × frameH in the source image
 * - we scale to viewW × viewH on screen (defaults respect 500×375 aspect)
 */
export default function CanvasThumb({
  src,            // image url (from import or /public)
  index = 0,      // frame index (0-based)
  rows = 8,
  cols = 1,
  frameW = 500,
  frameH = 375,
  viewW = 80,
  viewH,          // if omitted -> (viewW * frameH / frameW) (500×375 = 3/5)
  radius = 10,
  style,
  debug = false,
}) {
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);

  const _viewH = viewH ?? Math.round(viewW * (frameH / frameW)); // keep 500×375 aspect by default

  // Load image once (or when src changes)
  useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = (e) => console.error("[CanvasThumb] image load error", e, src);
    image.src = src;
  }, [src]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = _viewH ? _viewH * (frameW / frameH) : viewW; // just ensure canvas pixels ≈ css size
    c.height = _viewH || viewH || Math.round(viewW * (frameH / frameW));
  }, [_viewH, viewW, viewH, frameW, frameH]);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !img) return;

    // compute source rect (which frame to draw)
    const r = Math.floor(index / cols);
    const cidx = index % cols;

    const sx = cidx * frameW;
    const sy = r * frameH;
    const sw = frameW;
    const sh = frameH;

    // compute dest rect (fit exactly to canvas)
    const dw = c.width;
    const dh = c.height;

    ctx.clearRect(0, 0, dw, dh);

    // draw with crisp quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

    if (debug) {
      console.log("[CanvasThumb] draw", { src, index, rows, cols, frameW, frameH, sx, sy, sw, sh, dw, dh });
    }
  }, [img, index, rows, cols, frameW, frameH]);

  return (
    <div
      style={{
        width: viewW,
        height: _viewH,
        borderRadius: radius,
        overflow: "hidden",
        background: "transparent",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
