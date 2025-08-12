// src/App.jsx
import React, { useRef, useState } from "react";
import LoadoutScreen from "./ui/LoadoutScreen.jsx";
import ClassIcon from "./ui/ClassIcon.jsx";
import SpellIcon from "./ui/SpellIcon.jsx";
import GameEngine from "./engine.js";

// Upgrade pools for random pick (no rerolls)
const T1_POOL = ["attack","heal","armor","sweep","fireball"];
const T2_POOL = ["attack","heal","armor","concentration","sweep","fireball","poison","bomb"];
const T3_POOL = ["attack","sweep","fireball"];
const POOLS = { 1: T1_POOL, 2: T2_POOL, 3: T3_POOL };

function randomSpellFromTier(tier) {
  const pool = POOLS[tier] || T1_POOL;
  const id = pool[Math.floor(Math.random() * pool.length)];
  return { tier, id };
}

export default function App() {
  const [phase, setPhase] = useState("loadout"); // 'loadout' | 'battle'
  const engineRef = useRef(new GameEngine());
  const [state, setState] = useState(engineRef.current.getState());

  // Upgrade modal state
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeForHero, setUpgradeForHero] = useState(-1);
  const [upgradeSlot, setUpgradeSlot] = useState(null); // null until player picks
  const [proposed, setProposed] = useState(null);

  // Roll animation (single-face)
  const [rollOpen, setRollOpen] = useState(false);
  const [rollHeroIdx, setRollHeroIdx] = useState(-1);
  const [rollFaces, setRollFaces] = useState([]);
  const [rollLandingIndex, setRollLandingIndex] = useState(0);
  const [rollAnimIndex, setRollAnimIndex] = useState(0);
  const [rollFinalFace, setRollFinalFace] = useState(null);

  const refresh = () => setState(engineRef.current.getState());

  const beginEncounter = () => {
    engineRef.current.startEncounter();
    refresh();
  };

  const onFinalizeLoadout = (payload) => {
    engineRef.current.initFromLoadout(payload);
    setPhase("battle");
    refresh();
  };

  // ----- Upgrade flow -----
  const requestUpgrade = (heroIndex) => {
    setUpgradeForHero(heroIndex);
    setUpgradeSlot(null);
    setProposed(null);
    setUpgradeOpen(true);
  };

  const pickUpgradeSlot = (slot) => {
    setUpgradeSlot(slot);

    const h = engineRef.current.players[upgradeForHero];
    const face = h?.dieFaces?.[slot];

    let nextTier = 2;
    if (face?.kind === "spell") {
      nextTier = Math.min(3, (face.tier || 1) + 1);
    }
    setProposed(randomSpellFromTier(nextTier));
  };

  const acceptUpgrade = (acceptNew) => {
    if (upgradeSlot == null) return;
    engineRef.current.commitUpgrade(upgradeForHero, upgradeSlot, acceptNew, proposed);
    setUpgradeOpen(false);
    setProposed(null);
    setUpgradeSlot(null);
    refresh();
  };

  // ----- Single-face roll animation -----
  const startRollAnimation = (heroIndex) => {
    const res = engineRef.current.rollFace(heroIndex);
    if (!res) return;
    const h = engineRef.current.players[heroIndex];
    const faces = h?.dieFaces || [];

    setRollFaces(faces);
    setRollLandingIndex(res.d6);
    setRollAnimIndex(0);
    setRollFinalFace(res.face);
    setRollHeroIdx(heroIndex);
    setRollOpen(true);

    const flips = 14;
    const base = 48;
    const grow = 22;
    let i = 0;

    const tick = () => {
      if (i < flips) {
        setRollAnimIndex((prev) => (prev + 1) % 6);
        i++;
        setTimeout(tick, base + i * grow);
      } else {
        setRollAnimIndex(res.d6);

        // resolve (upgrade may open a modal)
        setTimeout(() => {
          engineRef.current.resolveRoll(heroIndex, res, requestUpgrade);
          refresh();
        }, 60);

        // auto-fade dialog
        setTimeout(() => {
          setRollOpen(false);
          setRollFinalFace(null);
        }, 900);
      }
    };

    setTimeout(tick, base);
  };

  const players = state.players || [];
  const enemies = state.enemies || [];
  const log = state.log || [];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0f14", color: "#e8ecf1" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: 16 }}>
        <h1 style={{ margin: "8px 0 12px" }}>Dice Arena</h1>

        {/* LOADOUT */}
        {phase === "loadout" && (
          <LoadoutScreen playerCount={2} onFinalize={onFinalizeLoadout} />
        )}

        {/* BATTLE */}
        {phase === "battle" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={beginEncounter}>Start Encounter</button>
              <button className="btn secondary" style={{ marginLeft: "auto" }} onClick={() => setPhase("loadout")}>
                ← Rebuild Party
              </button>
            </div>

            {/* Party */}
            <div style={{ display: "grid", gap: 12 }}>
              {players.map((h, idx) => (
                <div key={h.id} style={{ border: "1px solid #243041", borderRadius: 12, padding: 12, background: "#11161e" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ClassIcon name={h.classId} size={64} />
                    <div style={{ fontWeight: 700 }}>
                      Hero {h.id} — {h.classId}
                      <div className="small" style={{ opacity: .8 }}>
                        HP {h.hp}/{h.maxHp} • Armor {h.armor}
                      </div>
                    </div>
                    <button className="btn" style={{ marginLeft: "auto" }} onClick={() => startRollAnimation(idx)}>
                      Roll for Hero {h.id}
                    </button>
                  </div>

                  {/* Faces */}
                  <div className="small" style={{ opacity: .8, marginTop: 8 }}>Die Faces (L→R):</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                    {h.dieFaces.map((f, i) => {
                      if (f.kind === "class") {
                        return (
                          <div key={i} style={{ textAlign: "center" }}>
                            <ClassIcon name={h.classId} size={96} />
                            <div className="small" style={{ opacity: .7 }}>Class</div>
                          </div>
                        );
                      }
                      if (f.kind === "upgrade") {
                        return (
                          <div key={i} style={{ textAlign: "center" }}>
                            <SpellIcon upgrade size={96} />
                            <div className="small" style={{ opacity: .7 }}>Upgrade</div>
                          </div>
                        );
                      }
                      return (
                        <div key={i} style={{ textAlign: "center" }}>
                          {f.id === "blank" ? (
                            <div style={{
                              width: 96, height: Math.round(96 * 375 / 500),
                              borderRadius: 10, background: "rgba(255,255,255,.04)",
                              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)"
                            }} />
                          ) : (
                            <SpellIcon tier={f.tier} name={f.id} size={96} />
                          )}
                          <div className="small" style={{ opacity: .7 }}>
                            {f.id === "blank" ? "—" : `${f.id} (T${f.tier})`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Last roll */}
                  {h.lastRoll && (
                    <div style={{ marginTop: 8, fontSize: 14 }}>
                      Last roll: face {h.lastRoll.d6} —{" "}
                      {h.lastRoll.face?.kind === "class" ? "Class ability" :
                       h.lastRoll.face?.kind === "upgrade" ? "Upgrade" :
                       h.lastRoll.face?.id === "blank" ? "Blank" :
                       `${h.lastRoll.face?.id} (T${h.lastRoll.face?.tier})`}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Enemies */}
            <div style={{ border: "1px solid #243041", borderRadius: 12, padding: 12, background: "#0f1520" }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Enemies</div>
              {enemies.length === 0 ? (
                <div className="small" style={{ opacity: .7 }}>None.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {enemies.map(e => (
                    <div key={e.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{
                        width: 80, height: Math.round(80*375/500),
                        borderRadius: 8, background: "rgba(255,255,255,.04)",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)"
                      }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{e.name}</div>
                        <div className="small" style={{ opacity: .8 }}>
                          HP {e.hp}/{e.maxHp} • Armor {e.armor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Log */}
            <div>
              <div className="small" style={{ opacity: .8, marginBottom: 6 }}>Log</div>
              <div style={{ border: "1px solid #243041", borderRadius: 12, padding: 12, background: "#0d131b", minHeight: 120 }}>
                {log.length === 0 ? (
                  <div style={{ opacity: .6 }}>No actions yet…</div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {log.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ROLL POPUP (single face) */}
      {rollOpen && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 60
        }}>
          <div style={{
            width: 420, background: "#11151d", border: "1px solid #243041", borderRadius: 14, padding: 14,
            boxShadow: "0 24px 60px rgba(0,0,0,.45)", textAlign: "center"
          }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Rolling…</div>
            <div style={{
              display:"inline-block", padding:10, borderRadius:12, background:"#0b1118",
              boxShadow:"inset 0 0 0 1px rgba(255,255,255,.06)"
            }}>
              {(() => {
                const face = rollFaces[rollAnimIndex] || null;
                if (!face) return null;

                if (face.kind === "class") {
                  const cid = engineRef.current.players[rollHeroIdx]?.classId;
                  return <ClassIcon name={cid} size={120} />;
                }
                if (face.kind === "upgrade") {
                  return <SpellIcon upgrade size={120} />;
                }
                if (face.kind === "spell") {
                  return face.id === "blank"
                    ? <div style={{
                        width: 120, height: Math.round(120*375/500),
                        borderRadius: 10, background: "rgba(255,255,255,.05)"
                      }}/>
                    : <SpellIcon tier={face.tier} name={face.id} size={120} />;
                }
                return null;
              })()}
            </div>

            <div style={{ marginTop: 10, minHeight: 22 }}>
              {rollFinalFace ? (
                <div style={{ fontWeight: 700 }}>
                  {rollFinalFace.kind === "class" ? "Class ability" :
                   rollFinalFace.kind === "upgrade" ? "Upgrade" :
                   rollFinalFace.id === "blank" ? "Blank" :
                   `${rollFinalFace.id} (T${rollFinalFace.tier})`}
                </div>
              ) : (
                <div style={{ opacity: .7 }}>Spinning…</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE POPUP — slot first, then propose */}
      {upgradeOpen && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 70
        }}>
          <div style={{ width: 560, background: "#11151d", border: "1px solid #243041", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Upgrade</div>
              <button className="btn secondary" style={{ marginLeft: "auto" }} onClick={() => setUpgradeOpen(false)}>Close</button>
            </div>

            <div className="small" style={{ opacity: .75, marginTop: 6 }}>
              Select a spell slot (1–4) to upgrade. Once selected, a random spell from the next tier will be offered. No rerolls.
            </div>

            {/* Slot picker */}
            <div style={{ marginTop: 10 }}>
              <div className="small" style={{ opacity: .8, marginBottom: 6 }}>Choose Slot</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1,2,3,4].map(s => (
                  <button
                    key={s}
                    className="btn"
                    style={s === upgradeSlot ? { boxShadow: "0 0 0 2px rgba(120,170,255,.35) inset" } : {}}
                    onClick={() => pickUpgradeSlot(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Offered result */}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
              <div>
                <div className="small" style={{ opacity: .8, marginBottom: 6 }}>Offered</div>
                {proposed ? (
                  <div style={{ textAlign: "center" }}>
                    <SpellIcon tier={proposed.tier} name={proposed.id} size={120} />
                    <div className="small" style={{ opacity: .85, marginTop: 6, textTransform:"capitalize" }}>
                      {proposed.id} (T{proposed.tier})
                    </div>
                  </div>
                ) : (
                  <div style={{ width: 120, height: Math.round(120*375/500), borderRadius: 10, background: "rgba(255,255,255,.05)" }} />
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                <button className="btn" disabled={upgradeSlot == null || !proposed} onClick={() => acceptUpgrade(true)}>
                  Take Upgrade
                </button>
                <button className="btn secondary" disabled={upgradeSlot == null} onClick={() => acceptUpgrade(false)}>
                  Keep Old
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ textAlign: "center", padding: "10px 0", opacity: .6 }}>
        Dice Arena — ClassIcon in use everywhere, single-face roll animation & slot-first upgrades
      </footer>
    </div>
  );
}
