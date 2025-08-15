// src/turns/initiative.js
// Roll and manage initiative order.

export function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * rollInitiative(players, enemies) -> ordered array
 * Each item: { id, kind: 'player'|'enemy', name, init, tier?, ref }
 * - ref is the original live object (so HP/armor changes reflect in UI).
 */
export function rollInitiative(players = [], enemies = []) {
  const list = [];

  players.forEach((p, i) => {
    const init = rollD20();
    list.push({
      id: `P${i + 1}`,
      kind: "player",
      name: p.name || `Hero ${i + 1}`,
      init,
      ref: p,
    });
  });

  enemies.forEach((e, i) => {
    const init = rollD20();
    list.push({
      id: `E${i + 1}`,
      kind: "enemy",
      name: e.name || `Enemy ${i + 1}`,
      tier: e.tier || 1,
      init,
      ref: e,
    });
  });

  // Highest first. Tie: players before enemies.
  list.sort((a, b) => {
    if (b.init !== a.init) return b.init - a.init;
    if (a.kind !== b.kind) return a.kind === "player" ? -1 : 1;
    return 0;
  });

  return list;
}
