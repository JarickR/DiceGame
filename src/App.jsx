// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import GameEngine from "./engine";

// Art & slicer
import { SHEETS, ACCESSORY_BY_D20, ACCESSORY_INFO } from "./art/manifest.js";
import { loadSheet, Portrait } from "./art/slicer.jsx";

// Modals
import UpgradeChooser from "./ui/UpgradeChooser.jsx";
import LootModal from "./ui/LootModal.jsx";

// ===== Error Boundary =====
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error:null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("ErrorBoundary:", error, info); }
  render(){
    if(this.state.error){
      return (
        <div style={{ padding:16, background:"#1a1f29", color:"#fff", fontFamily:"monospace" }}>
          <h2>Runtime error</h2>
          <pre>{String(this.state.error?.stack || this.state.error)}</pre>
          <div>Check the browser console for details.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App(){
  const [engine, setEngine] = useState(null);
  const engineRef = useRef(null);

  // Art sheets
  const [art, setArt] = useState({ tier1:null, tier2:null, boss:null, items:null });

  // Game state mirrors
  const [party, setParty] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [log, setLog] = useState([]);
  const [upgradeChoice, setUpgradeChoice] = useState(null);

  // Loot modal state
  const [lootOffer, setLootOffer] = useState(null);

  // ---------- Boot engine ----------
  useEffect(() => {
    const e = new GameEngine();
    e.init();
    e.push = (msg) => setLog((prev)=>[msg, ...prev].slice(0,200));
    // UI bridge: when enemy dies and tier==2, engine calls this to build an offer
    e._triggerLootOffer = (hero, d20) => {
      const idx = ACCESSORY_BY_D20[d20] ?? 0;
      setLootOffer({ heroId: hero.id, heroName: hero.name, d20, itemIndex: idx });
    };
    engineRef.current = e;
    setEngine(e);
  }, []);

  // Keep engine enemies in sync
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current._enemies = enemies;
  }, [enemies]);

  // ---------- Load art sheets once ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      const [tier1, tier2, boss, items] = await Promise.all([
        loadSheet(SHEETS.tier1),
        loadSheet(SHEETS.tier2),
        loadSheet(SHEETS.boss),
        loadSheet(SHEETS.items),
      ]);
      if (!alive) return;
      setArt({ tier1, tier2, boss, items });
    })();
    return () => { alive = false; };
  }, []);

  // ---------- Seed demo hero/enemy ----------
  useEffect(() => {
    const app = engineRef.current; if (!app) return;
    if (party.length === 0) {
      const hero = app.buildHero?.("Hero", "king");
      app.party = [hero];
      setParty([hero]);
    }
    if (enemies.length === 0) {
      setEnemies([{ id: 1, name: "T1 Enemy", hp: 12, armor: 1, tier: 1 }]);
    }
  }, [party.length, enemies.length]);

  // Helpers
  const refreshFromEngine = () => {
    const app = engineRef.current;
    setParty([...(app?.party || [])]);
    setEnemies([...(app?._enemies || [])]);
    setUpgradeChoice(app?._upgradeChoice || null);
  };

  // ---------- UI actions ----------
  const startEncounter = () => {
    const app = engineRef.current; if (!app) return;
    app.startEncounter?.();
    refreshFromEngine();
  };

  const doTurn = () => {
    const app = engineRef.current; if (!app || party.length === 0) return;
    const hero = party[0];
    const face = app.rollFace?.(hero);
    if (face) {
      app.push?.(`Rolled: ${face.name} (T${face.tier || 0})`);
      app.resolveFace?.(hero, face);
      app.endHeroTurn?.(hero);
    }
    refreshFromEngine();
  };

  const addEnemy = (tier = 1) => {
    const app = engineRef.current; if (!app) return;
    const nextId = ((enemies.length % 20) + 1);
    app.spawnEnemy?.({
      id: nextId,
      name: `T${tier} Enemy #${enemies.length + 1}`,
      hp: 12 + tier * 4,
      armor: Math.max(0, tier - 1),
      tier,
    });
    app.push?.(`Spawned Tier ${tier} enemy.`);
    refreshFromEngine();
  };

  const clearEnemies = () => {
    engineRef.current?.clearEnemies?.();
    engineRef.current?.push?.("Cleared all enemies.");
    refreshFromEngine();
  };

  // Demo helper: simulate a Tier-2 drop immediately (for testing UI)
  const testLoot = () => {
    const app = engineRef.current; if (!app || party.length===0) return;
    const hero = party[0];
    const d20 = app.rollD20?.() || 1;
    const idx = ACCESSORY_BY_D20[d20] ?? 0;
    setLootOffer({ heroId: hero.id, heroName: hero.name, d20, itemIndex: idx });
    app.push?.(`(Test) Loot offer created for ${hero.name} (d20=${d20}).`);
  };

  // ---------- Portrait helpers ----------
  const EnemyPortrait = ({ e, size=120 }) => {
    if (!e) return null;
    const idx = ((e.id || 1) - 1); // slicer wraps internally
    if (e.tier === 1 && art.tier1) return <Portrait sheet={art.tier1} index={idx} size={size} />;
    if (e.tier === 2 && art.tier2) return <Portrait sheet={art.tier2} index={idx} size={size} />;
    if (e.tier >= 3 && art.boss)  return <Portrait sheet={art.boss}  index={idx} size={size} />;
    return <div style={{ width:size, height:size, outline:"1px dashed #444", background:"rgba(255,255,255,.03)" }} />;
  };

  const ItemPortrait = ({ index, size=64, title }) => {
    if (!art.items) return <div style={{ width:size, height:size, outline:"1px dashed #444" }} title={title}/>;
    return (
      <div title={title} style={{ display:'inline-block', lineHeight:0 }}>
        <Portrait sheet={art.items} index={index} size={size} />
      </div>
    );
  };

  // ---------- Loot modal handlers ----------
  const acceptLoot = () => {
    const app = engineRef.current; if (!app || !lootOffer) return;
    app._lootOffer = { heroId: lootOffer.heroId, d20: lootOffer.d20, itemIndex: lootOffer.itemIndex };
    app.commitAccessory?.(true);
    setLootOffer(null);
    refreshFromEngine();
  };

  const skipLoot = () => {
    const app = engineRef.current; if (!app || !lootOffer) return;
    app._lootOffer = { heroId: lootOffer.heroId, d20: lootOffer.d20, itemIndex: lootOffer.itemIndex };
    app.commitAccessory?.(false);
    setLootOffer(null);
    refreshFromEngine();
  };

  // Tooltip helper for items
  const itemTitle = (idx) => {
    const info = ACCESSORY_INFO[idx] || {};
    if (!info.name) return `Item #${(idx ?? 0)+1}`;
    return `${info.name}\n${info.desc || ''}`.trim();
  };

  return (
    <ErrorBoundary>
      <div style={{ minHeight: "100vh", background: "#0e1116", color: "#e8ecf1", fontFamily: "system-ui, Segoe UI, Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: 16 }}>
          <h1 style={{ margin: "6px 0 12px 0" }}>Dice Arena — Accessories, Passives & Encounter Start</h1>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button onClick={startEncounter} className="btn">Start Encounter</button>
            <button onClick={doTurn} className="btn">Roll & Resolve</button>
            <button onClick={() => addEnemy(1)} className="btn secondary">+ Tier 1</button>
            <button onClick={() => addEnemy(2)} className="btn secondary">+ Tier 2</button>
            <button onClick={() => addEnemy(3)} className="btn secondary">+ Boss</button>
            <button onClick={clearEnemies} className="btn" style={{ marginLeft: "auto" }}>Clear Enemies</button>
            <button onClick={testLoot} className="btn tertiary">Test Tier-2 Loot</button>
          </div>

          {/* Party (with inventory) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12, marginBottom: 12 }}>
            {party.map((h) => (
              <div key={h.id} style={{ background: "#12151a", border: "1px solid #242a34", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{h.name} <span style={{ opacity: .6 }}>(class: {h.classId})</span></div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 100, height: 100, outline: "1px dashed #333", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 12, opacity: .6 }}>Hero Art</div>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, flex: 1 }}>
                    <div>HP: <b>{h.hp}</b> / {h.maxHp}</div>
                    <div>Armor: <b>{h.armor || 0}</b></div>
                    <div>Last Face: <b>{h._lastFace?.name || "—"}</b></div>

                    {/* Inventory */}
                    <div style={{ marginTop: 8 }}>
                      <div className="small" style={{ opacity: .8, marginBottom: 4 }}>Accessories (max 2):</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(h.inventory || []).map((idx, i) => (
                          <ItemPortrait
                            key={i}
                            index={idx ?? 0}
                            size={48}
                            title={itemTitle(idx ?? 0)}
                          />
                        ))}
                        {/* Empty slots visual */}
                        {Array.from({length: Math.max(0, 2 - (h.inventory?.length || 0))}).map((_, i) => (
                          <div key={`empty-${i}`} style={{ width:48, height:48, outline:"1px dashed #444", background:"rgba(255,255,255,.03)" }}/>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enemies */}
          <h3 style={{ margin: "16px 0 8px 0" }}>Enemies</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {enemies.map((e, i) => (
              <div key={i} style={{ background: "#12151a", border: "1px solid #242a34", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
                <EnemyPortrait e={e} size={120} />
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700 }}>{e.name}</div>
                  <div>Tier: <b>{e.tier}</b></div>
                  <div>HP: <b>{e.hp}</b></div>
                  <div>Armor: <b>{e.armor || 0}</b></div>
                  {/* Simple damage button to test defeat → loot */}
                  {e.tier === 2 && (
                    <button
                      style={{ marginTop: 8 }}
                      className="btn tertiary"
                      onClick={() => {
                        const app = engineRef.current;
                        app.applyDamage?.(party[0], e, 999, { type: 'attack' });
                        refreshFromEngine();
                      }}
                    >
                      Defeat (test drop)
                    </button>
                  )}
                </div>
              </div>
            ))}
            {enemies.length === 0 && <div style={{ opacity: .6 }}>No enemies yet…</div>}
          </div>

          {/* Log */}
          <h3 style={{ margin: "16px 0 8px 0" }}>Log</h3>
          <div style={{ background: "#0b0e13", border: "1px solid #242a34", borderRadius: 12, padding: 12, minHeight: 120 }}>
            {log.length === 0 && <div style={{ opacity: .5 }}>No actions yet… click “Start Encounter”, then “Roll & Resolve”.</div>}
            <div style={{ display: "grid", gap: 6 }}>
              {log.map((line, idx) => <div key={idx} style={{ opacity: .9 }}>{line}</div>)}
            </div>
          </div>
        </div>

        {/* Upgrade modal */}
        <UpgradeChooser
          choice={upgradeChoice}
          onKeepNew={() => { engineRef.current?.commitUpgrade?.(true);  refreshFromEngine(); }}
          onKeepOld={() => { engineRef.current?.commitUpgrade?.(false); refreshFromEngine(); }}
          renderSprite={(info) => {
            if (!info) return null;
            const { tier, index } = info;
            if (tier === 1 && art.tier1) return <Portrait sheet={art.tier1} index={index} size={96} />;
            if (tier === 2 && art.tier2) return <Portrait sheet={art.tier2} index={index} size={96} />;
            if (tier >= 3 && art.boss)  return <Portrait sheet={art.boss}  index={index} size={96} />;
            return null;
          }}
        />

        {/* Loot modal */}
        <LootModal
          offer={lootOffer}
          onAccept={acceptLoot}
          onSkip={skipLoot}
          renderItem={(idx) => {
            const info = ACCESSORY_INFO[idx] || {};
            return (
              <div style={{ textAlign:'center' }}>
                <Portrait sheet={art.items} index={idx ?? 0} size={96} />
                <div className="small" style={{ marginTop: 6, opacity:.85 }}>
                  <div style={{ fontWeight:600 }}>{info.name || `Item #${(idx ?? 0)+1}`}</div>
                  <div>{info.desc || ''}</div>
                </div>
              </div>
            );
          }}
        />

        <footer style={{ textAlign: "center", padding: "12px 0", opacity: .6 }}>
          Dice Arena — Tooltips enabled. Use “Start Encounter” to apply passives (armor, Concentration, etc.).
        </footer>
      </div>
    </ErrorBoundary>
  );
}
