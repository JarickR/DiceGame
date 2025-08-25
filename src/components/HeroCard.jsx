// src/components/HeroCard.jsx
import React from "react";

// Your existing icon components & status chips
// (paths match the structure you shared)
import ClassIcon from "../ui/ClassIcon.jsx";
import SpellIcon from "../ui/SpellIcon.jsx";
import StatusEffects from "./StatusEffects.jsx"; // uses your Bomb/Poison icons

// Optional: if you want tooltips/descriptions, we’ll try to read from SPELLS
// but everything is defensive so it works even if SPELLS isn’t present.
let SPELLS = null;
try {
  // eslint-disable-next-line import/no-unresolved
  // adjust if your file name differs
  // Example: export const SPELLS = { attack: {...}, heal: {...}, ... }
  ({ SPELLS } = await import("../spells.js"));
} catch {
  // no-op; tooltips will just be the spell key
}

// Small presentational helpers
const Row = ({ style, children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div
    style={{
      fontSize: 12,
      letterSpacing: 0.5,
      opacity: 0.7,
      margin: "2px 0 6px",
    }}
  >
    {children}
  </div>
);

/**
 * Props:
 * - hero: {
 *     id, name, classKey (or classId), hp, maxHp, armor,
 *     status?: { poison?: number, bomb?: number },
 *     tier1?: Array<{ key: string }|string>,
 *     tier2?: Array<{ key: string }|string>,
 *     upgrades?: Array<{ key: string }|string>,
 *   }
 * - onSpellClick?: (payload: { tier: 1|2|3, index: number, key: string, heroId: number|string }) => void
 * - highlight?: { tier: 1|2|3, index: number }   // e.g. the face that just rolled
 * - compact?: boolean                             // slightly smaller layout if true
 */
export default function HeroCard({
  hero,
  onSpellClick,
  highlight = null,
  compact = false,
}) {
  if (!hero) return null;

  const {
    id: heroId,
    name = "Hero",
    classKey = hero.classId || "thief",
    hp = 10,
    maxHp = 10,
    armor = 0,
    status = {},
    tier1 = [],
    tier2 = [],
    upgrades = [],
  } = hero;

  // Normalize spell entries to {key}
  const norm = (arr) =>
    (arr || []).map((s) =>
      typeof s === "string" ? { key: s } : { key: s?.key || "attack" }
    );

  const t1 = norm(tier1);
  const t2 = norm(tier2);
  const ups = norm(upgrades);

  const poison = Math.max(0, Number(status.poison || 0));
  const bomb = Math.max(0, Number(status.bomb || 0));

  const cardPad = compact ? 10 : 12;
  const iconSize = compact ? 28 : 32;
  const spellSize = compact ? 60 : 70;

  const goldGlow = "0 0 0 2px #f2c744, 0 0 14px 0 rgba(242,199,68,.65)";

  const renderSpell = (tier, entry, index) => {
    const key = entry?.key || "attack";

    // highlight if this tile is the “rolled result” (or active)
    const isHot =
      highlight &&
      Number(highlight.tier) === Number(tier) &&
      Number(highlight.index) === Number(index);

    const tooltip =
      (SPELLS && SPELLS[key] && (SPELLS[key].name || SPELLS[key].desc)) ||
      key;

    return (
      <button
        key={`${tier}-${index}-${key}`}
        onClick={() =>
          onSpellClick &&
          onSpellClick({ tier, index, key, heroId })
        }
        title={String(tooltip)}
        style={{
          all: "unset",
          cursor: "pointer",
          borderRadius: 10,
          boxShadow: isHot ? goldGlow : "0 0 0 1px rgba(255,255,255,.08)",
          transition: "box-shadow .12s ease",
          background:
            tier === 1
              ? "#0d5e37" // green tier 1
              : tier === 2
              ? "#0d4275" // blue tier 2
              : "#5a1a74", // purple tier 3 (upgrades bucket)
          padding: 6,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: spellSize,
          height: Math.round(spellSize * 0.75), // maintain 500×375 vibe
        }}
      >
        <SpellIcon tier={tier} name={key} size={spellSize} radius={8} />
      </button>
    );
  };

  return (
    <div
      style={{
        background: "#12161e",
        border: "1px solid #243043",
        borderRadius: 14,
        padding: cardPad,
        color: "#e6edf6",
        minWidth: compact ? 260 : 300,
        boxShadow: "0 10px 30px rgba(0,0,0,.24)",
      }}
    >
      {/* Header */}
      <Row style={{ justifyContent: "space-between" }}>
        <Row style={{ gap: 10 }}>
          <div
            style={{
              width: iconSize + 8,
              height: Math.round((iconSize + 8) * 0.75),
              borderRadius: 8,
              background: "rgba(255,255,255,.03)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ClassIcon name={String(classKey)} size={iconSize} radius={6} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{name}</div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.65,
                textTransform: "capitalize",
              }}
            >
              {String(classKey)}
            </div>
          </div>
        </Row>

        {/* HP / Armor quick stats */}
        <Row style={{ gap: 12 }}>
          <div
            style={{
              background: "#0b1119",
              border: "1px solid #1d2838",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 13,
            }}
          >
            HP <b>{hp}</b> / {maxHp}
          </div>
          <div
            style={{
              background: "#0b1119",
              border: "1px solid #1d2838",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 13,
            }}
          >
            Armor <b>{armor}</b>
          </div>
        </Row>
      </Row>

      {/* Stacks (PSN / BMB) */}
      <div style={{ marginTop: 10, marginBottom: 6 }}>
        <StatusEffects poison={poison} bomb={bomb} />
      </div>

      {/* Tier 1 */}
      <SectionTitle>Tier 1</SectionTitle>
      <Row style={{ flexWrap: "wrap", gap: 8 }}>
        {t1.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 13 }}>— none —</div>
        )}
        {t1.map((s, i) => renderSpell(1, s, i))}
      </Row>

      {/* Tier 2 */}
      <SectionTitle style={{ marginTop: 10 }}>Tier 2</SectionTitle>
      <Row style={{ flexWrap: "wrap", gap: 8 }}>
        {t2.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 13 }}>— none —</div>
        )}
        {t2.map((s, i) => renderSpell(2, s, i))}
      </Row>

      {/* Upgrades (treated as tier 3 visuals) */}
      {ups.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 10 }}>Upgrades</SectionTitle>
          <Row style={{ flexWrap: "wrap", gap: 8 }}>
            {ups.map((s, i) => renderSpell(3, s, i))}
          </Row>
        </>
      )}
    </div>
  );
}
