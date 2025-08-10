// src/art/classLogos.js
// Point this at your 1×8 sprite sheet in /public/art
export const CLASS_LOGO_SHEET = {
  url: "/art/class-logos.png", // put the file at: public/art/class-logos.png
  cols: 8,                     // 8 logos in a single row
  rows: 1,                     // 1 row
};

// helper: map classId -> index in the sprite
export const classIndexFor = (classId) => {
  const map = {
    thief: 0,
    judge: 1,
    tank: 2,
    vampire: 3,
    king: 4,
    lich: 5,
    paladin: 6,
    barbarian: 7,
  };
  return map[classId] ?? 0;
};
