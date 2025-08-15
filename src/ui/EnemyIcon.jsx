import React from "react";
import SpriteThumb from "./SpriteThumb";

// Put these in: public/art/Tier1.png, Tier2.png, Boss.png
const ENEMY_SHEETS = {
  1: "/art/Tier1.png", // 10 columns × 2 rows (20)
  2: "/art/Tier2.png", // 4 columns × 5 rows (20)
  3: "/art/Boss.png",  // 4 columns × 5 rows (20)
};

// Grid definitions per sheet
const GRID = {
  1: { cols: 10, rows: 2 },
  2: { cols: 4, rows: 5 },
  3: { cols: 4, rows: 5 },
};

/**
 * EnemyIcon
 * props:
 *  - tier: 1|2|3+  (3+ uses Boss sheet)
 *  - index: 0-based index in that tier sheet
 *  - size: display width in px
 *  - radius: border radius
 */
export default function EnemyIcon({ tier = 1, index = 0, size = 90, radius = 10 }) {
  const t = tier >= 3 ? 3 : tier;
  const src = ENEMY_SHEETS[t];
  const { cols, rows } = GRID[t] || { cols: 10, rows: 2 };

  // These enemy sheets are uniform grid sprites; we can auto-calc frame size.
  // We don’t know exact pixel frameW/H from file, but SpriteThumb can slice by cols/rows.
  return (
    <SpriteThumb
      src={src}
      index={index}
      cols={cols}
      rows={rows}
      // Let SpriteThumb compute frame size from image natural size & cols/rows.
      // Keep enemy cards square-ish in UI.
      viewW={size}
      viewH={size}
      radius={radius}
    />
  );
}
