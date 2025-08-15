// src/ui/TurnControls.jsx
import React, { useState } from "react";
import { rollInitiative } from "../turns/initiative";
import { enemyAct } from "../turns/enemyAI";
import InitiativeModal from "./InitiativeModal";

/**
 * Props:
 * - party: hero array (live objects with {id?, name, hp, armor})
 * - enemies: enemy array (live objects with {name, hp, armor, tier, ai, dmg})
 * - setParty: React setter to refresh hero UI after damage
 * - log: array of strings (optional)
 * - setLog: setter for the log (optional)
 * - onShowVfx: (type, payload) => void  (optional)
 */
export default function TurnControls({
  party,
  enemies,
  setParty,
  log,
  setLog,
  onShowVfx,
}) {
  const [order, setOrder] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showInit, setShowInit] = useState(false);

  const pushLog = (msg) => {
    if (!setLog) return;
    setLog((L) => [msg, ...(L || [])].slice(0, 200));
  };

  const rollAll = () => {
    const o = rollInitiative(party || [], enemies || []);
    setOrder(o);
    setIdx(0);
    setShowInit(true);
    // Show summary
    const summary = o
      .map((c, i) => `${i + 1}. ${c.kind.toUpperCase()} ${c.name} (d20=${c.init})`)
      .join(" | ");
    pushLog(`Initiative: ${summary}`);
  };

  const nextTurn = () => {
    if (!order.length) return;

    const actor = order[idx % order.length];
    if (actor.kind === "enemy") {
      // Enemy takes its action
      enemyAct(
        actor.ref,
        party,
        (m) => pushLog(m),
        (type, payload) => onShowVfx?.(type, payload)
      );
      setParty([...(party || [])]); // force refresh
    } else {
      // Player turn hook: you likely already have a "Roll & Resolve" button.
      // Here we just log whose turn it is.
      pushLog(`${actor.name}'s turn (player). Use your roll action.`);
    }

    setIdx((i) => i + 1);
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button className="btn" onClick={rollAll}>
        Roll Initiative
      </button>
      <button className="btn" onClick={nextTurn} disabled={!order.length}>
        Next Turn
      </button>

      {showInit && (
        <InitiativeModal order={order} onClose={() => setShowInit(false)} />
      )}
    </div>
  );
}
