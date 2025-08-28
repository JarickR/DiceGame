// src/ui/EncounterScreen.jsx
import React from "react";
import { useCombat } from "../logic/combat.js";
import HeroCard from "../components/HeroCard.jsx";
import EnemyCard from "../components/EnemyCard.jsx";
import LogPanel from "../components/LogPanel.jsx";
import RollPopup from "../components/RollPopup.jsx";
import UpgradeModal from "../components/UpgradeModal.jsx";

export default function EncounterScreen({ initialPlayers, tierChoice }) {
  const {
    players, enemies, initiative, turnPtr, log,
    rollPopup, goldSlot, flashHits, upgradeUi,
    onRoll, onUpgradePick, onUpgradeClose,
  } = useCombat(initialPlayers, tierChoice);

  const active = initiative[turnPtr] || null;

  return (
    <div style={{ color: "#fff" }}>
      <h1>Encounter</h1>

      {/* Top row: enemies */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, enemies.length)}`, gap: 12 }}>
        {enemies.map((e, i) => (
          <EnemyCard key={i} e={e} flash={!!flashHits[`e-${i}`]} />
        ))}
      </div>

      {/* Middle: log + turn */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12, margin: "12px 0" }}>
        <LogPanel log={log} />
        <div
          style={{
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 12,
            padding: 10,
            minHeight: 160,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Turn</div>
          <div>Active: {active ? `${active.type === "player" ? "Player" : "Enemy"} ${active.idx + 1}` : "-"}</div>
          <div style={{ marginTop: 12 }}>
            <button onClick={onRoll} disabled={!active || active.type !== "player" || players[active.idx]?.defeated}>
              Roll
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: players */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, players.length)}`, gap: 12 }}>
        {players.map((p, i) => {
          const isActive = active?.type === "player" && active.idx === i;
          return <HeroCard key={i} hero={p} isActive={isActive} goldSlot={goldSlot} flash={!!flashHits[`p-${i}`]} />;
        })}
      </div>

      {/* Roll popup */}
      {rollPopup && <RollPopup rollPopup={rollPopup} />}

      {/* Upgrade */}
      {upgradeUi && (
        <UpgradeModal
          onClose={onUpgradeClose}
          onPick={(slot) => onUpgradePick(upgradeUi.heroId, slot)}
        />
      )}
    </div>
  );
}
