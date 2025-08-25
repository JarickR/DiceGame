import React from "react";
import SpriteThumb from "./SpriteThumb";

// Each tier sheet is now 1×6 vertical, 500×500 per frame
import TIER1 from "../assets/art/Tier1Spells.png";
import TIER2 from "../assets/art/Tier2Spells.png";
import TIER3 from "../assets/art/Tier3Spells.png";

/**
 * Expected spell shape (flexible):
 * - { tier: 'T1'|'T2'|'T3', index: number }
 * or legacy:
 * - { name: 'attack'|'heal'|..., tier: 1|2|3 }  -> we map to index via INDEX_MAP below
 */

const SHEETS = {
  T1: { src: TIER1, rows: 6 },
  T2: { src: TIER2, rows: 6 },
  T3: { src: TIER3, rows: 6 },
};

// If your engine uses name-based spells, adjust these maps:
const INDEX_MAP = {
  T1: { attack: 0, heal: 1, armor: 2, sweep: 3, fireball: 4, blank: 5 },
  T2: {
    attack: 0,
    heal: 1,
    armor: 2,
    concentration: 3,
    sweep: 4,
    fireball: 5, // use 5 if your T2 has bomb/poison elsewhere; edit if needed
  },
  T3: { attack: 0, sweep: 1, fireball: 2, blank: 5 },
};

function toTierKey(t) {
  if (t === 1 || t === "1") return "T1";
  if (t === 2 || t === "2") return "T2";
  if (t === 3 || t === "3") return "T3";
  return typeof t === "string" && /^T[123]$/.test(t) ? t : "T1";
}

export default function SpellIcon({
  spell,
  size = 80,
  radius = 10,
  debug = false,
}) {
  if (!spell) return null;

  const tierKey =
    spell.tier && typeof spell.tier !== "undefined"
      ? toTierKey(spell.tier)
      : "T1";

  const { src, rows } = SHEETS[tierKey];

  let index = 0;
  if (typeof spell.index === "number") {
    index = spell.index;
  } else if (spell.name) {
    const map = INDEX_MAP[tierKey] || {};
    index = map[spell.name] ?? 0;
  }

  return (
    <SpriteThumb
      src={src}
      index={index}
      frameW={500}
      frameH={500}
      rows={rows}
      cols={1}
      viewW={size}
      viewH={size}
      radius={radius}
      debug={debug}
    />
  );
}
