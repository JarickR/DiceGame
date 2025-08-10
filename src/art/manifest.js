// src/art/manifest.js

// Existing sheets (keep yours as-is if different paths/sizes)
export const SHEETS = {
  tier1:  { url: "/art/Tier1.png",  cols: 10, rows: 2 },   // 10x2
  tier2:  { url: "/art/Tier2.png",  cols: 5,  rows: 4 },   // 5x4
  boss:   { url: "/art/Boss.png",   cols: 5,  rows: 4 },   // 5x4
  items:  { url: "/art/Accessories.png", cols: 5, rows: 4 }, // 5x4

  // NEW: class logos (1 column x 8 rows)
  classLogos: { url: "/art/class-logos.png", cols: 1, rows: 8 },
};

// If you already had these, keep them. Shown here for completeness.
export const ACCESSORY_BY_D20 = {
  1: 0,  2: 1,  3: 2,  4: 3,  5: 4,
  6: 5,  7: 6,  8: 7,  9: 8, 10: 9,
  11:10, 12:11, 13:12, 14:13, 15:14,
  16:15, 17:16, 18:17, 19:18, 20:19,
};

// Minimal info mapping; keep your existing one if fuller
export const ACCESSORY_INFO = Array.from({length:20}).map((_,i)=>({
  name:`Accessory ${i+1}`,
  desc:`Effect text for accessory ${i+1}.`,
}));
