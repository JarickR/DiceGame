// src/artThumbs.jsx
import React from "react";

/** Compute dimensions that respect a desired aspect (w/h). */
function fitDims({ width, height, aspect }) {
  let w = width, h = height;
  if (!aspect || aspect <= 0) {
    return { width: w ?? 120, height: h ?? 120 };
  }
  if (w && !h) h = Math.round(w / aspect);
  else if (!w && h) w = Math.round(h * aspect);
  else if (w && h) h = Math.round(w / aspect); // prefer width; override height to keep aspect
  else { w = 120; h = Math.round(120 / aspect); }
  return { width: w, height: h };
}

/** Generic sheet sprite (percent-based positioning; no distortion). */
function SheetSprite({ src, cols, rows, index = 0, width, height, aspect }) {
  const { width: w, height: h } = fitDims({ width, height, aspect });

  const col = ((index % cols) + cols) % cols;
  const row = (Math.floor(index / cols) + rows) % rows;

  const x = cols === 1 ? "50%" : `${(col / (cols - 1)) * 100}%`;
  const y = rows === 1 ? "50%" : `${(row / (rows - 1)) * 100}%`;

  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${src})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${x} ${y}`,
        backgroundRepeat: "no-repeat",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
      }}
    />
  );
}

/* ---------- CLASS LOGOS (class-logos.png is 1x8; each frame 500x375 => aspect 4:3) ---------- */
const CLASS_INDEX = {
  thief: 0,
  judge: 1,
  tank: 2,
  vampire: 3,
  king: 4,
  lich: 5,
  paladin: 6,
  barbarian: 7,
};

export function ClassThumb({ classId, width = 120, height, aspect = 500 / 375 }) {
  const idx = CLASS_INDEX[classId] ?? 0;
  return (
    <SheetSprite
      src="/art/class-logos.png"
      cols={8}
      rows={1}
      index={idx}
      width={width}
      height={height}
      aspect={aspect} // 4:3
    />
  );
}

/* ---------- SPELLS (Tier1/2/3 sheets use same 500x375 frame => 4:3). Upgrade assumed square. ---------- */
const SPELL_INDEX_BY_TIER = {
  1: { attack: 0, heal: 1, armor: 2, sweep: 3, fireball: 4 },
  2: { attack: 0, heal: 1, armor: 2, concentration: 3, sweep: 4, fireball: 5, poison: 6, bomb: 7 },
  3: { attack: 0, sweep: 1, fireball: 2 },
};

const TIER_SRC = {
  1: "/art/Tier1Spells.png",
  2: "/art/Tier2Spells.png",
  3: "/art/Tier3Spells.png",
};

const placeholderBox = {
  border: "1px dashed #3a4457",
  background: "rgba(255,255,255,.03)",
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#8fa3bf",
  fontWeight: 700,
};

export function SpellThumb({ spell, tier = 1, width = 120, height, upgradeSquare = true }) {
  if (!spell) {
    const { width: w, height: h } = fitDims({ width, height, aspect: 500 / 375 });
    return <div style={{ ...placeholderBox, width: w, height: h }}>Blank</div>;
  }

  const type = (spell.type || spell.name || "").toLowerCase();

  // Upgrade logo (assume square art)
  if (type === "upgrade") {
    const { width: w, height: h } = fitDims({ width, height, aspect: upgradeSquare ? 1 : 500 / 375 });
    return <SheetSprite src="/art/UpgradeLogo.png" cols={1} rows={1} index={0} width={w} height={h} aspect={upgradeSquare ? 1 : 500 / 375} />;
  }

  // Normal spells (4:3)
  const src = TIER_SRC[tier] || TIER_SRC[1];
  const map = SPELL_INDEX_BY_TIER[tier] || SPELL_INDEX_BY_TIER[1];
  const idx = map[type];

  if (typeof idx !== "number") {
    const { width: w, height: h } = fitDims({ width, height, aspect: 500 / 375 });
    return <div style={{ ...placeholderBox, width: w, height: h }}>?</div>;
  }

  return (
    <SheetSprite
      src={src}
      cols={8}
      rows={1}
      index={idx}
      width={width}
      height={height}
      aspect={500 / 375} // 4:3
    />
  );
}

/* ---------- ENEMIES (Tier1/Tier2/Boss sheets are square frames => aspect 1:1) ---------- */
function EnemySprite({ tier = 1, index = 0, size = 120 }) {
  const src = tier >= 3 ? "/art/Boss.png" : tier === 2 ? "/art/Tier2.png" : "/art/Tier1.png";
  return <SheetSprite src={src} cols={10} rows={2} index={index} width={size} height={size} aspect={1} />;
}

export function EnemyThumb({ enemy, size = 120 }) {
  const idx = typeof enemy?.spriteIndex === "number" ? enemy.spriteIndex : (enemy?.id || 1) - 1;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <EnemySprite tier={enemy?.tier || 1} index={idx} size={size} />
      <div
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          fontSize: 12,
          color: "#e8f1ff",
          textShadow: "0 2px 6px rgba(0,0,0,.6)",
          opacity: 0.9,
        }}
      >
        T{enemy?.tier || 1}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 8,
          fontWeight: 800,
          fontSize: 16,
          color: "#e8f1ff",
          textShadow: "0 2px 6px rgba(0,0,0,.6)",
          opacity: 0.9,
        }}
      >
        #{idx}
      </div>
    </div>
  );
}
