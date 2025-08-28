// src/ui/SpellIcon.jsx
import React from "react";
import SpriteThumb from "./SpriteThumb";

// Sheets (each tile 500x500; 1 column, N rows)
const SHEETS = {
  1: "/src/assets/art/Tier1Spells.png",
  2: "/src/assets/art/Tier2Spells.png",
  3: "/src/assets/art/Tier3Spells.png",
};

/**
 * Index maps by tier -> spellName -> row index
 * (rows are 0-based; each tile 500x500; one column)
 *
 * Tier 1: updated to fix fireball/sweep swap.
 * Previously we had: { attack:0, heal:1, armor:2, sweep:3, fireball:4 }
 * Now we flip those two:
 *   fireball -> 3
 *   sweep    -> 4
 */
const SPELL_INDEX = {
  1: {
    attack: 0,
    heal: 1,
    armor: 2,
    fireball: 3,  // <-- fixed
    sweep: 4,     // <-- fixed
  },
  2: {
    // keep your existing Tier 2 order
    attack: 0,
    heal: 1,
    armor: 2,
    concentration: 3,
    sweep: 4,
    fireball: 5,
    poison: 6,
    bomb: 7,
  },
  3: {
    // first 3 used on your T3 sheet
    attack: 0,
    sweep: 1,
    fireball: 2,
  },
};

// Special Upgrade icon (single tile 500x500)
const UPGRADE_SHEET = "/src/assets/art/UpgradeLogo.png";

export default function SpellIcon({
  tier,
  name,
  size = 80,     // final square width for the thumbnail
  radius = 10,
  upgrade = false,
  className = "",
  style = {},
  title = "",
}) {
  if (upgrade) {
    return (
      <SpriteThumb
        src={UPGRADE_SHEET}
        index={0}
        frameW={500}
        frameH={500}
        rows={1}
        cols={1}
        size={size}
        radius={radius}
        className={className}
        style={style}
        title={title || "Upgrade"}
      />
    );
  }

  const src = SHEETS[tier];
  const index = SPELL_INDEX[tier]?.[name] ?? 0;

  return (
    <SpriteThumb
      src={src}
      index={index}
      frameW={500}
      frameH={500}
      rows={8}          // safe upper bound; only used rows will show
      cols={1}
      size={size}
      radius={radius}
      className={className}
      style={style}
      title={title || name}
    />
  );
}
