// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  gameState,
  newParty,
  selectClass,
  setChosenT1,
  setChosenT2,
  finalizeLoadouts,
  previewRollForPlayer,
  commitPreviewedRoll,
  spawnEnemy,
  clearEnemies,
  setTargetEnemy,
  chooseUpgradeSlot,
  acceptUpgrade,
} from "./engine.js";

/* ---------------- Small UI helpers ---------------- */
const btn = (v="primary") => ({
  background: v==="primary" ? "#1d3557" : "#12151a",
  border: `1px solid ${v==="primary" ? "#2b4f7c" : "#2b3342"}`,
  color: "#e8f1ff", borderRadius:10, padding:"10px 14px", cursor:"pointer"
});
const Card = ({children, style}) => (
  <div style={{ background:"#0b0e13", border:"1px solid #242a34", borderRadius:12, padding:12, ...style }}>{children}</div>
);
const Bar = ({ value, max=20, color="#38bdf8" }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ background:"#0e1620", border:"1px solid #1f2b3a", borderRadius:8, height:12, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color }} />
    </div>
  );
};

/* ---------------- Error Boundary ---------------- */
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error:null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(err, info){ console.error("[ErrorBoundary]", err, info); }
  render(){
    if(this.state.error){
      return (
        <div style={{minHeight:"100vh",background:"#0e1116",color:"#e8f1ff",padding:16,fontFamily:"system-ui,Segoe UI,Roboto,Arial,sans-serif"}}>
          <div style={{maxWidth:960,margin:"0 auto"}}>
            <h2 style={{margin:"8px 0 6px"}}>Something went wrong</h2>
            <pre style={{whiteSpace:"pre-wrap",background:"#0b0e13",border:"1px solid #242a34",borderRadius:12,padding:12}}>
{String(this.state.error?.stack || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------- Very simple Upgrade Modal (inline) ---------------- */
function UpgradeModal({ open, hero, offer, onChooseSlot, onAccept, onClose }) {
  if (!open || !hero || !offer) return null;
  const slots = hero.spells || [null, null, null, null];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", backdropFilter:"blur(2px)", zIndex:5000,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:560, maxWidth:"95vw", background:"#0e1116", border:"1px solid #242a34",
                    borderRadius:16, padding:16 }}>
        <div style={{ fontWeight:800, marginBottom:8 }}>Upgrade</div>
        <div className="small" style={{ opacity:.8, marginBottom:12 }}>{offer.msg || "Select a slot to upgrade, then accept or keep old."}</div>

        {/* choose a slot */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
          {slots.map((sp, i) => {
            const isChosen = offer.slot === i;
            return (
              <Card key={i} style={{ borderColor: isChosen ? "#2b4f7c" : "#242a34" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width:60, height:46, border:"1px solid #2b3342", borderRadius:10, background:"#0b0e13",
                                 display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, opacity:.9 }}>
                    {sp ? `${sp.name} (T${sp.tier})` : "Blank"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700 }}>Face {i+1}</div>
                    <div className="small" style={{ opacity:.8 }}>{sp ? sp.type : "—"}</div>
                  </div>
                  <button style={btn("secondary")} onClick={()=>onChooseSlot?.(i)}>Select</button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* candidate */}
        {offer.candidate && (
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>Candidate</div>
            <div className="small" style={{ opacity:.85 }}>
              {offer.candidate.name} (Tier {offer.candidate.tier}) — {offer.candidate.type}
            </div>
          </Card>
        )}

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button style={btn("secondary")} onClick={()=>onAccept?.(false)}>Keep Old</button>
          <button style={btn("primary")} onClick={()=>onAccept?.(true)} disabled={!offer.candidate || offer.slot==null}>Accept Upgrade</button>
          <button style={btn("secondary")} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Class & Loadout screen ---------------- */
function ClassAndLoadout({ onFinalize }) {
  const [, setTick] = useState(0);
  const force = () => setTick(t => t + 1);

  useEffect(() => {
    if (!gameState.players.length) newParty(2);
    force();
  }, []);

  const classes = gameState.classes;
  const heroes  = gameState.players;

  const setPartyAndRefresh = (n) => { newParty(n); force(); };

  return (
    <div style={{ display:"grid", gap:16 }}>
      <h2 style={{ margin:"6px 0 6px" }}>Choose Classes & Loadouts</h2>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={()=>setPartyAndRefresh(1)} style={btn("secondary")}>New Party (1)</button>
        <button onClick={()=>setPartyAndRefresh(2)} style={btn("secondary")}>New Party (2)</button>
        <button onClick={()=>setPartyAndRefresh(3)} style={btn("secondary")}>New Party (3)</button>
        <button onClick={()=>setPartyAndRefresh(4)} style={btn("secondary")}>New Party (4)</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10 }}>
        {classes.map((c) => (
          <Card key={c.id} style={{ textAlign:"center" }}>
            <div style={{ marginBottom:8, fontWeight:700 }}>{c.name}</div>
            <div style={{ width:140, height:100, margin:"0 auto", border:"1px dashed #2b3342", borderRadius:10,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, opacity:.8 }}>
              class #{c.frame}
            </div>
            <div style={{ marginTop:8, opacity:.8, fontSize:13 }}>{c.ability}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:12 }}>
        {heroes.map((h, idx) => {
          const selectedId = h.class?.id || null;
          const t1 = h.t1Options || [];
          const t2 = h.t2Options || [];
          const chosenT1 = new Set(h.chosenT1 || []);
          const chosenT2 = h.chosenT2 || null;

          const pickClass = (id) => { selectClass(idx, id); force(); };
          const toggleT1 = (key) => {
            const arr = new Set(h.chosenT1 || []);
            if (arr.has(key)) arr.delete(key);
            else if (arr.size < 2) arr.add(key);
            setChosenT1(idx, Array.from(arr)); force();
          };
          const pickT2 = (key) => { setChosenT2(idx, key); force(); };

          return (
            <Card key={h.id}>
              <div style={{ fontWeight:700, marginBottom:8 }}>{h.name}</div>

              <div style={{ marginBottom:10 }}>
                <div className="small" style={{ opacity:.75, marginBottom:6 }}>Class</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {gameState.classes.map((c) => {
                    const on = selectedId === c.id;
                    return (
                      <button key={c.id} onClick={()=>pickClass(c.id)} type="button"
                        style={{
                          background: on ? "#1d3557" : "#12151a",
                          border: `1px solid ${on ? "#2b4f7c" : "#2b3342"}`,
                          color:"#e8f1ff", borderRadius:10, padding:"8px 10px", cursor:"pointer"
                        }}
                        title={c.ability}
                      >{c.name}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom:10 }}>
                <div className="small" style={{ opacity:.75, marginBottom:6 }}>Tier 1 — choose up to 2</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8 }}>
                  {t1.map(opt => (
                    <Card key={opt.type} style={{ display:"flex", gap:8, alignItems:"center", borderColor: chosenT1.has(opt.type) ? "#2b4f7c" : "#242a34" }}>
                      <div style={{ width:64, height:46, border:"1px solid #2b3342", borderRadius:10,
                                    display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e13" }}>
                        {opt.name}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{opt.name}</div>
                        <div className="small" style={{ opacity:.8 }}>Tier 1</div>
                      </div>
                      <input type="checkbox" checked={chosenT1.has(opt.type)} onChange={()=>toggleT1(opt.type)} />
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <div className="small" style={{ opacity:.75, marginBottom:6 }}>Tier 2 — choose 1 (optional)</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8 }}>
                  {t2.map(opt => (
                    <Card key={opt.type} style={{ display:"flex", gap:8, alignItems:"center", borderColor: chosenT2 === opt.type ? "#2b4f7c" : "#242a34" }}>
                      <div style={{ width:64, height:46, border:"1px solid #2b3342", borderRadius:10,
                                    display:"flex", alignItems:"center", justifyContent:"center", background:"#0b0e13" }}>
                        {opt.name}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{opt.name}</div>
                        <div className="small" style={{ opacity:.8 }}>Tier 2</div>
                      </div>
                      <input type="radio" name={`t2-${h.id}`} checked={chosenT2 === opt.type} onChange={()=>pickT2(opt.type)} />
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={()=>setPartyAndRefresh(1)} style={btn("secondary")}>New Party (1)</button>
        <button onClick={()=>setPartyAndRefresh(2)} style={btn("secondary")}>New Party (2)</button>
        <button onClick={()=>setPartyAndRefresh(3)} style={btn("secondary")}>New Party (3)</button>
        <button onClick={()=>setPartyAndRefresh(4)} style={btn("secondary")}>New Party (4)</button>
        <button onClick={()=>{ finalizeLoadouts(); onFinalize?.(); }} style={btn("primary")}>
          Finalize & Start
        </button>
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  // Stable hook order
  const [, setTick] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [preview, setPreview] = useState(null);

  // Init party
  useEffect(() => {
    if (!gameState.players.length) newParty(2);
    setTimeout(() => setTick(t => t + 1), 0);
  }, []);

  // Derived
  const heroes = useMemo(() => gameState.players, [gameState.players]);
  const enemies = useMemo(() => gameState.enemies, [gameState.enemies]);
  const activeHeroIndex = useMemo(() => gameState.turn?.activeHero ?? 0, [gameState.turn?.activeHero]);
  const activeHero = useMemo(() => heroes[activeHeroIndex] || heroes[0] || null, [heroes, activeHeroIndex]);

  const facesMemo = useMemo(() => {
    const arr = [{ kind: "class" }];
    const p = activeHero || {};
    for (let i = 0; i < 4; i++) arr.push({ kind: "spell", slot: i, spell: p?.spells?.[i] || null });
    arr.push({ kind: "upgrade" });
    return arr;
  }, [activeHero]);

  const force = () => setTick(t => t + 1);

  // Roll flow
  const startRoll = () => {
  if (!activeHero) return;
  const p = previewRollForPlayer(activeHeroIndex);
  setPreview(p);
  setRolling(true);
  // Commit immediately, then clear the visual state shortly after
  commitPreviewedRoll(activeHeroIndex, p);
  setTimeout(() => {
    setRolling(false);
    setPreview(null);
    setTick(t => t + 1);
  }, 800);
};


  const upgradeOpen = !!gameState.upgradeOffer;

  return (
    <ErrorBoundary>
      <div style={{ minHeight:"100vh", background:"#0e1116", color:"#e8f1ff", fontFamily:"system-ui, Segoe UI, Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:16 }}>
          <h1 style={{ margin:"6px 0 12px 0" }}>Dice Arena — Armor System Demo</h1>

          {gameState.phase === "class-select" && (
            <ClassAndLoadout onFinalize={() => setTimeout(()=>setTick(t=>t+1), 0)} />
          )}

          {gameState.phase === "battle" && (
            <>
              {/* Controls */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                <button onClick={()=>{ newParty(2); setTick(t=>t+1); }} style={btn("secondary")}>New Party</button>
                <button onClick={()=>{ spawnEnemy(1); setTick(t=>t+1); }} style={btn("secondary")}>+ T1</button>
                <button onClick={()=>{ spawnEnemy(2); setTick(t=>t+1); }} style={btn("secondary")}>+ T2</button>
                <button onClick={()=>{ spawnEnemy(3); setTick(t=>t+1); }} style={btn("secondary")}>+ Boss</button>
                <button onClick={()=>{ clearEnemies(); setTick(t=>t+1); }} style={{...btn("secondary"), marginLeft:"auto"}}>Clear Enemies</button>
              </div>

              {/* Heroes */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:12 }}>
                {(heroes || []).map((h, i) => {
                  const isActive = i === (gameState.turn?.activeHero ?? 0);
                  return (
                    <Card key={h.id} style={{ boxShadow: isActive ? "0 0 0 2px rgba(110,190,255,.5)" : "none" }}>
                      <div style={{ fontWeight:700, marginBottom:6 }}>
                        {h?.name} — {h?.class?.name || "—"} {isActive && <span style={{ opacity:.7 }}>(active)</span>}
                      </div>
                      <div style={{ display:"grid", gap:6, fontSize:14 }}>
                        <div>HP: {h?.hp ?? 0} / {h?.maxHp ?? 20}</div>
                        <Bar value={h?.hp ?? 0} max={h?.maxHp ?? 20} color="#22c55e" />
                        <div>Armor: <b>{h?.armor ?? 0}</b></div>
                      </div>

                      {/* Faces preview */}
                      <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:10 }}>
                        <div style={{ textAlign:"center" }}>
                          <div className="small" style={{ opacity:.7, marginBottom:6 }}>Class</div>
                          <div style={{ width:90, height:46, border:"1px solid #2b3342", borderRadius:10, background:"#0b0e13",
                                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, opacity:.9 }}>
                            {h?.class?.name || "—"}
                          </div>
                        </div>
                        {(h?.spells || [null,null,null,null]).map((sp, si) => (
                          <div key={si} style={{ textAlign:"center" }}>
                            <div className="small" style={{ opacity:.7, marginBottom:6 }}>Spell {si+1}</div>
                            <div style={{ width:90, height:46, border:"1px solid #2b3342", borderRadius:10, background:"#0b0e13",
                                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, opacity:.9 }}>
                              {sp ? `${sp.name} (T${sp.tier})` : "Blank"}
                            </div>
                          </div>
                        ))}
                        <div style={{ textAlign:"center" }}>
                          <div className="small" style={{ opacity:.7, marginBottom:6 }}>Upgrade</div>
                          <div style={{ width:90, height:46, border:"1px solid #2b3342", borderRadius:10, background:"#0b0e13",
                                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, opacity:.9 }}>
                            Upgrade
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Roll controls */}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button onClick={()=>{ setTargetEnemy(enemies[0]?.id || null); setTick(t=>t+1); }} style={btn("secondary")}>Target First Enemy</button>
                <button onClick={startRoll} style={btn("primary")}>Roll</button>
              </div>

              {/* Enemies */}
              <h3 style={{ margin:"16px 0 8px 0" }}>Enemies</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:12 }}>
                {(enemies || []).map((e) => (
                  <Card key={e.id}>
                    <div style={{ fontWeight:700 }}>{e.name}</div>
                    <div style={{ display:"grid", gap:6, fontSize:14, marginTop:6 }}>
                      <div>Tier: {e.tier}</div>
                      <div>HP: {e.hp} / {e.maxHp}</div>
                      <Bar value={e.hp} max={e.maxHp} color="#ef4444" />
                      <div>Armor: {e.armor ?? 0}</div>
                    </div>
                  </Card>
                ))}
                {(!enemies || enemies.length===0) && <div style={{ opacity:.6 }}>No enemies yet…</div>}
              </div>

              {/* Combat Log */}
              <h3 style={{ margin:"16px 0 8px 0" }}>Combat Log</h3>
              <Card>
                <div style={{ maxHeight:240, overflowY:"auto", display:"grid", gap:6, fontSize:14 }}>
                  {(gameState.log || []).map((line, i) => (
                    <div key={i} style={{ opacity:.95 }}>{line}</div>
                  ))}
                  {(!gameState.log || gameState.log.length === 0) && <div style={{ opacity:.6 }}>No events yet…</div>}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Upgrade modal */}
      <UpgradeModal
        open={gameState.phase === "battle" && !!gameState.upgradeOffer}
        hero={gameState.players.find(h => h.id === gameState.upgradeOffer?.heroId) || null}
        offer={gameState.upgradeOffer || null}
        onChooseSlot={(i) => { chooseUpgradeSlot(i); setTick(t=>t+1); }}
        onAccept={(takeNew) => { acceptUpgrade(takeNew); setTick(t=>t+1); }}
        onClose={() => { /* keep modal until resolved or cancel if you want */ setTick(t=>t+1); }}
      />
    </ErrorBoundary>
  );
}
