// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import GameEngine from "./engine";

// Art & slicer
import { SHEETS, ACCESSORY_BY_D20, ACCESSORY_INFO } from "./art/manifest.js";
import { loadSheet, Portrait } from "./art/slicer.jsx";

// Modals
import UpgradeChooser from "./ui/UpgradeChooser.jsx";
import LootModal from "./ui/LootModal.jsx";

// ===== Simple Toasts =====
function ToastLayer({ toasts }) {
  return (
    <div style={{ position:'fixed', right:12, top:12, display:'grid', gap:8, zIndex:80 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:'#12151a', border:'1px solid #2b3342', color:'#dfe6ef',
          borderRadius:10, padding:'8px 10px', minWidth:200, boxShadow:'0 6px 20px rgba(0,0,0,.35)'
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

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
  const engineRef = useRef(null);

  // Art sheets
  const [art, setArt] = useState({ tier1:null, tier2:null, boss:null, items:null });

  // Game state mirrors
  const [party, setParty] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [log, setLog] = useState([]);
  const [upgradeChoice, setUpgradeChoice] = useState(null);

  // Loot modal
  const [lootOffer, setLootOffer] = useState(null);

  // Settings (persist)
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('diceArenaSettings');
      return raw ? JSON.parse(raw) : { toastsEnabled: true, vfxEnabled: true };
    } catch {
      return { toastsEnabled: true, vfxEnabled: true };
    }
  });

  // Toasts & VFX
  const [toasts, setToasts] = useState([]);
  const [vfx, setVfx] = useState([]); // array of {id,type,target,heroId?,enemyId?}

  const addToast = (msg) => {
    if (!settings.toastsEnabled) return;
    const id = Math.random().toString(36).slice(2,8);
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 1800);
  };

  const pushVfx = (evt) => {
    if (!settings.vfxEnabled) return;
    const id = Math.random().toString(36).slice(2,8);
    const entry = { id, ...evt };
    setVfx(list => [...list, entry]);
    setTimeout(() => setVfx(list => list.filter(x => x.id !== id)), 650);
  };

  // ---------- Boot engine ----------
  useEffect(() => {
    const e = new GameEngine();
    e.init();
    e.push = (msg) => setLog((prev)=>[msg, ...prev].slice(0,200));
    e.toast = addToast;
    e.emitVfx = pushVfx;
    e.settings = { ...settings };            // pass initial settings
    e._triggerLootOffer = (hero, d20) => {
      const idx = ACCESSORY_BY_D20[d20] ?? 0;
      setLootOffer({ heroId: hero.id, heroName: hero.name, d20, itemIndex: idx });
    };
    engineRef.current = e;
  }, []); // eslint-disable-line

  // Keep engine enemies in sync
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current._enemies = enemies;
  }, [enemies]);

  // Keep engine settings synced + persist
  useEffect(() => {
    try { localStorage.setItem('diceArenaSettings', JSON.stringify(settings)); } catch {}
    if (engineRef.current) engineRef.current.settings = { ...settings };
  }, [settings]);

  // ---------- Load art sheets ----------
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

  // ---------- Seed demo ----------
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

  const refreshFromEngine = () => {
    const app = engineRef.current;
    setParty([...(app?.party || [])]);
    setEnemies([...(app?._enemies || [])]);
    setUpgradeChoice(app?._upgradeChoice || null);
  };

  // ---------- Actions ----------
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
    const active = vfx.filter(v => v.target==='enemy' && v.enemyId===e.id).map(v=>v.type);
    const hit = active.includes('hit');
    const burn = active.includes('burn');
    const heal = active.includes('heal');

    return (
      <div style={{ position:'relative', width:size, height:size }}>
        <div style={{
          position:'absolute', inset: -4, borderRadius:12,
          boxShadow: hit ? '0 0 0 2px rgba(255,80,80,.9), inset 0 0 20px rgba(255,80,80,.35)' :
                     heal ? '0 0 0 2px rgba(120,255,160,.9), inset 0 0 20px rgba(120,255,160,.35)' :
                     burn ? '0 0 0 2px rgba(255,150,50,.9), inset 0 0 20px rgba(255,150,50,.35)' :
                            'none',
          transition:'box-shadow 80ms linear', pointerEvents:'none'
        }} />
        {e.tier === 1 && art.tier1 && <Portrait sheet={art.tier1} index={(e.id-1)} size={size} />}
        {e.tier === 2 && art.tier2 && <Portrait sheet={art.tier2} index={(e.id-1)} size={size} />}
        {e.tier >= 3 && art.boss  && <Portrait sheet={art.boss}  index={(e.id-1)} size={size} />}
      </div>
    );
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
  const acceptLoot = (replaceIndexOrNull) => {
    const app = engineRef.current; if (!app || !lootOffer) return;
    app._lootOffer = { heroId: lootOffer.heroId, d20: lootOffer.d20, itemIndex: lootOffer.itemIndex };
    app.commitAccessory?.(true, replaceIndexOrNull);
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

  const itemTitle = (idx) => {
    const info = ACCESSORY_INFO[idx] || {};
    if (!info.name) return `Item #${(idx ?? 0)+1}`;
    return `${info.name}\n${info.desc || ''}`.trim();
  };

  const lootHero = lootOffer
    ? (party.find(h => h.id === lootOffer.heroId) || party[0] || null)
    : null;

  const heroVfx = (hero) => vfx.filter(v => v.target==='hero' && v.heroId===hero.id).map(v=>v.type);

  return (
    <ErrorBoundary>
      <div style={{ minHeight: "100vh", background: "#0e1116", color: "#e8ecf1", fontFamily: "system-ui, Segoe UI, Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: 16 }}>
          <h1 style={{ margin: "6px 0 12px 0" }}>Dice Arena — VFX & Toasts</h1>

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

          {/* Settings Panel */}
          <div style={{ background:"#12151a", border:"1px solid #242a34", borderRadius:12, padding:12, marginBottom:12 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>Settings</div>
            <div style={{ display:'flex', gap:18, alignItems:'center', flexWrap:'wrap' }}>
              <label style={{ display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!settings.toastsEnabled}
                  onChange={(e)=>setSettings(s=>({ ...s, toastsEnabled: e.target.checked }))}
                />
                <span>Enable Toasts</span>
              </label>
              <label style={{ display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!settings.vfxEnabled}
                  onChange={(e)=>setSettings(s=>({ ...s, vfxEnabled: e.target.checked }))}
                />
                <span>Enable VFX (glows, pulses)</span>
              </label>
              <div style={{ opacity:.65, fontSize:13 }}>
                (Saved automatically)
              </div>
            </div>
          </div>

          {/* Party (with inventory) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12, marginBottom: 12 }}>
            {party.map((h) => {
              const active = heroVfx(h);
              const hit = active.includes('hit');
              const heal = active.includes('heal');
              const loot = active.includes('loot');

              return (
                <div key={h.id} style={{ background: "#12151a", border: "1px solid #242a34", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{h.name} <span style={{ opacity: .6 }}>(class: {h.classId})</span></div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ position:'relative', width: 100, height: 100, outline: "1px dashed #333", display: "flex", alignItems: "center", justifyContent: "center", borderRadius:12 }}>
                      <div style={{
                        position:'absolute', inset:-4, borderRadius:12,
                        boxShadow: !settings.vfxEnabled ? 'none' :
                          hit ? '0 0 0 2px rgba(255,80,80,.9), inset 0 0 20px rgba(255,80,80,.35)' :
                          heal ? '0 0 0 2px rgba(120,255,160,.9), inset 0 0 20px rgba(120,255,160,.35)' :
                          loot ? '0 0 0 2px rgba(140,170,255,.9), inset 0 0 20px rgba(140,170,255,.35)' :
                                 'none',
                        transition:'box-shadow 80ms linear', pointerEvents:'none'
                      }} />
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
                          {Array.from({length: Math.max(0, 2 - (h.inventory?.length || 0))}).map((_, i) => (
                            <div key={`empty-${i}`} style={{ width:48, height:48, outline:"1px dashed #444", background:"rgba(255,255,255,.03)" }}/>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

        {/* Loot modal (with replace flow) */}
        <LootModal
          offer={lootOffer}
          heroInventory={lootHero?.inventory || []}
          onAccept={acceptLoot}
          onSkip={skipLoot}
          renderItem={(idx) => <Portrait sheet={art.items} index={idx ?? 0} size={96} />}
          renderItemSmall={(idx) => <Portrait sheet={art.items} index={idx ?? 0} size={48} />}
        />

        {/* Toasts */}
        <ToastLayer toasts={toasts} />

        <footer style={{ textAlign: "center", padding: "12px 0", opacity: .6 }}>
          Dice Arena — VFX (hit/heal/burn/loot) & toasts • Settings persisted.
        </footer>
      </div>
    </ErrorBoundary>
  );
}
