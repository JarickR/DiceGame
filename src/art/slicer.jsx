// src/art/slicer.jsx
import React from "react";

/** Harmless 1x1 transparent sheet so UI never crashes if art is missing. */
function makeFallbackSheet(cols, rows) {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 1;
  const img = new Image();
  img.src = c.toDataURL();
  return {
    img, cols, rows,
    _w: 1, _h: 1,
    cellW: 1, cellH: 1,
    gapX: 0, gapY: 0,
    offX: 0, offY: 0,
    _fallback: true
  };
}

/**
 * Load a sprite sheet laid out in a grid.
 * Supports optional per-sheet metrics for gutters/offsets:
 *   { url, cols, rows, cellW?, cellH?, gapX?, gapY?, offX?, offY? }
 * If cellW/H not provided, they are derived from image size / cols/rows.
 */
export async function loadSheet(cfg) {
  const { url, cols, rows } = cfg;
  const img = new Image();
  img.src = url;

  try {
    await img.decode(); // throws if missing/invalid
  } catch {
    return makeFallbackSheet(cols, rows);
  }

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // Allow explicit metrics; otherwise derive evenly
  const cellW = Number.isFinite(cfg.cellW) ? cfg.cellW : Math.floor(w / cols);
  const cellH = Number.isFinite(cfg.cellH) ? cfg.cellH : Math.floor(h / rows);

  const gapX = Number.isFinite(cfg.gapX) ? cfg.gapX : 0;
  const gapY = Number.isFinite(cfg.gapY) ? cfg.gapY : 0;
  const offX = Number.isFinite(cfg.offX) ? cfg.offX : 0; // left padding of the sheet
  const offY = Number.isFinite(cfg.offY) ? cfg.offY : 0; // top padding of the sheet

  return { img, cols, rows, _w: w, _h: h, cellW, cellH, gapX, gapY, offX, offY, _fallback: false };
}

function totalFrames(sheet) {
  return Math.max(1, (sheet.cols | 0) * (sheet.rows | 0));
}
function wrapIndex(sheet, idx) {
  const n = totalFrames(sheet);
  if (idx == null) return 0;
  return ((idx % n) + n) % n;
}

export function frameRect(sheet, idx) {
  const i = wrapIndex(sheet, idx);
  const col = i % sheet.cols;
  const row = Math.floor(i / sheet.cols);

  const { cellW, cellH, gapX, gapY, offX, offY } = sheet;

  const sx = offX + col * (cellW + gapX);
  const sy = offY + row * (cellH + gapY);
  const sw = cellW;
  const sh = cellH;

  return { img: sheet.img, sx, sy, sw, sh };
}

/**
 * Portrait
 * Renders a single frame so that the *entire* sprite cell is visible.
 * We scale the whole background image so one cell maps exactly to the portrait box.
 * - size: target "long edge" (in css px). The short edge is computed from cell aspect.
 * - If your sheet uses gutters or padding, set gapX/gapY/offX/offY in manifest.
 */
export function Portrait({ sheet, index, size = 128, style }) {
  if (!sheet || index == null) return null;

  const r = frameRect(sheet, index);
  const isFallback = !!sheet._fallback;

  // Scale factor so ONE cell fits the portrait box.
  // We’ll use the cell’s aspect to compute width/height precisely.
  const cellAspect = r.sw / r.sh || 1;
  const longEdge = size;
  const isCellWider = cellAspect >= 1;

  const targetW = isCellWider ? longEdge : Math.round(longEdge * cellAspect);
  const targetH = isCellWider ? Math.round(longEdge / cellAspect) : longEdge;

  // Scale background to match that mapping:
  // kx = targetW / cellW, ky = targetH / cellH (usually equal unless you pass non-square size)
  const kx = targetW / (r.sw || 1);
  const ky = targetH / (r.sh || 1);

  const bgW = Math.max(1, Math.round((sheet._w || 1) * kx));
  const bgH = Math.max(1, Math.round((sheet._h || 1) * ky));

  // IMPORTANT: backgroundPosition must be scaled by the same factor
  const posX = -Math.round(r.sx * kx);
  const posY = -Math.round(r.sy * ky);

  return (
    <div
      style={{
        width: targetW,
        height: targetH,
        backgroundImage: `url(${sheet.img.src})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${posX}px ${posY}px`,
        backgroundSize: `${bgW}px ${bgH}px`,
        imageRendering: "pixelated",
        outline: isFallback ? "1px dashed rgba(255,255,255,.25)" : undefined,
        backgroundColor: isFallback ? "rgba(255,255,255,.03)" : undefined,
        ...style,
      }}
      aria-hidden="true"
      title={isFallback ? "Art missing — using placeholder" : undefined}
    />
  );
}
