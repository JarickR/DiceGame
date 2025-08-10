// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  gameState,
  newParty,
  selectClass,
  chooseInitialSpells,
  setTargetEnemy,
  setTargetAlly,
  previewRollForPlayer,
  commitPreviewedRoll,
  acceptUpgrade,
  declineUpgrade,
  spawnEnemy,
  clearEnemies,
} from "./engine.js";

// Pull names/descriptions + sprite helper from spells.js
import { SPELLS, getSpellSpriteInfo } from "./spells.js";

/* ============================= Error Boundary ============================= */
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error:null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("[ErrorBoundary]", error, info); }
  render(){
    if(this.state.error){
      return (
        <div style={{minHeight:"100vh",background:"#0e1116",color:"#e8ecf1",padding:16,fontFamily:"system-ui,Segoe UI,Roboto,Arial,sans-serif"}}>
          <div style={{maxWidth:960,margin:"0 auto"}}>
            <h2 style={{margin:"8px 0 6px"}}>Something went wrong</h2>
            <div style={{opacity:.8,marginBottom:8}}>See console for details.</div>
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

/* ============================= Small UI helpers ============================= */
const btn = (variant = "primary") => ({
  background: variant === "primary" ? "#1d3557" : "#12151a",
  border: `1px solid ${variant === "primary" ? "#2b4f7c" : "#2b3342"}`,
  color: "#e8f1ff",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
});
function Card({ children, style }) {
  return <div style={{ background: "#0b0e13", border: "1px solid #242a34", borderRadius: 12, padding: 12, ...style }}>{children}</div>;
}
const Bar = ({ value, max = 20, color = "#38bdf8" }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ background: "#0e1620", border: "1px solid #1f2b3a", borderRadius: 8, height: 12, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color }} />
    </div>
  );
};
const Chip = ({ children, color = "#94a3b8" }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", border: "1px solid #263041", color, borderRadius: 999, fontSize: 12, background: "#0f141d" }}>
    {children}
  </span>
);

/* ============================= Sprite helpers ============================= */
// Each icon on your spell sheets is 500x375 (w x h).
function SpriteStrip({ sheetUrl, frames = 1, frameIndex = 0, width = 96, orientation = "vertical", autoFrames = false }) {
  const [img, setImg] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!sheetUrl) return;
    const el = new Image();
    el.onload = () => setImg({ w: el.width, h: el.height });
    el.onerror = () => { console.warn("[SpriteStrip] failed:", sheetUrl); setImg({ w: 1, h: 1 }); };
    el.src = sheetUrl;
  }, [sheetUrl]);

  // Default to the 500x375 ratio for vertical strips
  const frameW = 500, frameH = 375;
  const height = Math.round((frameH / frameW) * width);

  if (!sheetUrl || !img.w || !img.h) {
    return <div style={{ width, height, borderRadius: 12, background: "#0d1117", border: "1px solid #2b3342" }} />;
  }

  let total = frames;
  if (autoFrames) total = orientation === "vertical" ? Math.max(1, Math.floor(img.h / frameH)) : Math.max(1, Math.floor(img.w / frameW));
  const idx = Math.max(0, Math.min(total - 1, Number.isFinite(frameIndex) ? frameIndex : 0));

  if (orientation === "horizontal") {
    const tileW = Math.floor(img.w / total);
    const scale = width / tileW;
    const h = Math.round(img.h * scale);
    const bgW = img.w * scale;
    const bgH = h;
    const x = -(idx * tileW * scale);
    return (
      <div
        style={{
          width, height: h, borderRadius: 12, backgroundColor: "#0d1117",
          backgroundImage: `url(${sheetUrl})`, backgroundRepeat: "no-repeat",
          backgroundSize: `${bgW}px ${bgH}px`, backgroundPosition: `${x}px 0`,
          imageRendering: "pixelated", border: "1px solid #2b3342"
        }}
      />
    );
  } else {
    const tileH = Math.floor(img.h / total);
    const scale = width / img.w;
    const h = Math.round(tileH * scale);
    const bgH = img.h * scale;
    const y = -(idx * tileH * scale);
    return (
      <div
        style={{
          width, height: h, borderRadius: 12, backgroundColor: "#0d1117",
          backgroundImage: `url(${sheetUrl})`, backgroundRepeat: "no-repeat",
          backgroundSize: `${width}px ${bgH}px`, backgroundPosition: `center ${y}px`,
          imageRendering: "pixelated", border: "1px solid #2b3342"
        }}
      />
    );
  }
}

function GridSprite({ sheetUrl, cols, rows, index = 0, width = 120, title }) {
  const [img, setImg] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!sheetUrl) return;
    const el = new Image();
    el.onload = () => setImg({ w: el.width, h: el.height });
    el.onerror = () => { console.warn("[GridSprite] failed:", sheetUrl); setImg({ w: 1, h: 1 }); };
    el.src = sheetUrl;
  }, [sheetUrl]);

  const height = Math.round((375 / 500) * width);
  if (!sheetUrl || !img.w || !img.h) return <div style={{ width, height, border: "1px solid #242a34", borderRadius: 12, background: "#0b0e13" }} title={title} />;

  const total = Math.max(1, cols * rows);
  const safeIndex = Math.max(0, Math.min(total - 1, Number.isFinite(index) ? index : 0));
  const tileW = Math.floor(img.w / cols);
  const tileH = Math.floor(img.h / rows);
  const col = safeIndex % cols;
  const row = Math.floor(safeIndex / cols);
  const scale = width / tileW;
  const h = Math.round(tileH * scale);
  const bgW = img.w * scale;
  const bgH = img.h * scale;
  const x = -(col * tileW * scale);
  const y = -(row * tileH * scale);

  return (
    <div
      title={title}
      style={{
        width, height: h, borderRadius: 12, backgroundColor: "#0d1117",
        backgroundImage: `url(${sheetUrl})`, backgroundRepeat: "no-repeat",
        backgroundSize: `${bgW}px ${bgH}px`, backgroundPosition: `${x}px ${y}px`,
        imageRendering: "pixelated", border: "1px solid #2b3342"
      }}
    />
  );
}

function SpellIcon({ spell, width = 90 }) {
  if (!spell) return <div style={{ width, height: Math.round((375 / 500) * width), borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px dashed #2b3342" }} />;
  const { sheetUrl, frame } = getSpellSpriteInfo(spell) || {};
  return <SpriteStrip sheetUrl={sheetUrl} frameIndex={frame ?? 0} width={width} orientation="vertical" autoFrames />;
}

/* ============================= Descriptions ============================= */
function describeSpell(spell) {
  if (!spell) return "Empty slot.";
  const type = String(spell.type || "").toLowerCase();
  const tier = spell.tier ?? "?";
  const meta = SPELLS[type];
  if (meta) {
    const title = meta.name || (spell.name || type);
    const body = meta.desc || "";
    return `${title} (Tier ${tier}) — ${body}`;
  }
  const title = spell.name || type || "Spell";
  return `${title} (Tier ${tier})`;
}
function describeFace(face, hero) {
  if (!face) return "";
  if (face.kind === "class") return `${hero?.class?.name || "Class"}: ${hero?.class?.ability || "Class ability"}.`;
  if (face.kind === "upgrade") return "Upgrade: replace one of your spells with a random higher-tier option (keep or swap).";
  if (face.kind === "spell") return describeSpell(face.spell);
  return "";
}

/* ============================= One-Face Roll Overlay ============================= */
function OneFaceRollOverlay({ open, faces, classFrame, finalIndex = 0, hero, onCancel, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("spin"); // "spin" | "hold"
  const raf = useRef(null);
  const start = useRef(0);

  const faceAt = (i) => {
    if (!faces?.length) return null;
    return faces[Math.max(0, Math.min(faces.length - 1, i))];
  };

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setPhase("spin");
    start.current = 0;

    const spinDuration = 950;
    const step = (ts) => {
      if (!start.current) start.current = ts;
      const t = Math.min(1, (ts - start.current) / spinDuration);
      // ease-in-out quad
      const ease = t < 0.5 ? (t * 2) ** 2 / 2 : 1 - ((1 - t) * 2) ** 2 / 2;
      const totalCycles = 20;
      const current = Math.floor(ease * totalCycles) % 6;
      setIdx(current);

      if (t < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setIdx(finalIndex);
        setPhase("hold");
        setTimeout(() => onFinish?.(finalIndex), 900);
      }
    };

    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [open, finalIndex, onFinish]);

  if (!open) return null;

  const face = faceAt(idx) || { kind: "class" };
  const label = ["Class", "Spell 1", "Spell 2", "Spell 3", "Spell 4", "Upgrade"][idx] || "Result";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0e1116", border: "1px solid #242a34", borderRadius: 16, width: 560, maxWidth: "95vw", padding: 16, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
          <div className="small" style={{ opacity: .75 }}>{label}</div>

          <div style={{ padding: 12, border: "1px solid #2b3342", background: "#0b0e13", borderRadius: 14, boxShadow: phase === "spin" ? "0 0 0 2px rgba(110,190,255,.4)" : "0 0 0 2px rgba(255,213,128,.5)" }}>
            {face.kind === "class" && <SpriteStrip sheetUrl="/art/class-logos.png" frames={8} frameIndex={classFrame ?? 0} width={220} orientation="vertical" />}
            {face.kind === "spell"  && <SpellIcon spell={face.spell} width={220} />}
            {face.kind === "upgrade"&& <SpriteStrip sheetUrl="/art/UpgradeLogo.png" width={220} orientation="vertical" autoFrames />}
          </div>

          <div style={{ textAlign: "center", background: "#0b0e13", border: "1px solid #242a34", borderRadius: 12, padding: "10px 12px", width: "100%" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {face.kind === "class" ? (hero?.class?.name || "Class") :
               face.kind === "spell"  ? (SPELLS[String(face.spell?.type || "").toLowerCase()]?.name || face.spell?.name || "Spell") :
               "Upgrade"}
            </div>
            <div style={{ opacity: .85, fontSize: 14 }}>
              {describeFace(face, hero)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={btn("secondary")}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= Main App ============================= */
export default function App() {
  const [tick, setTick] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [preview, setPreview] = useState(null);
  const force = () => setTick((t) => t + 1);

  // Boot
  useEffect(() => {
    try {
      if (!gameState.players.length) newParty(2);
      if (!gameState.enemies.length) { spawnEnemy(1); spawnEnemy(2); }
      if (!gameState.targets.enemyId && gameState.enemies[0]) gameState.targets.enemyId = gameState.enemies[0].id;
      if (!gameState.targets.allyId && gameState.players[0]) gameState.targets.allyId = gameState.players[0].id;
      force();
    } catch (err) { console.error("[App boot] failed:", err); }
  }, []);

  const phase = gameState.phase;
  const classes = gameState.classes || [];
  const heroes = gameState.players || [];
  const enemies = gameState.enemies || [];
  const activeHeroIndex = gameState.turn?.activeHero ?? 0;
  const activeHero = heroes[activeHeroIndex] || heroes[0];

  /* ---------- Class pick ---------- */
  const onPickClass = (heroIdx, key) => {
    try {
      selectClass(heroIdx, key);
      force();
      // reset selections for that hero
      setSelState(prev => {
        const next = prev.map(s => ({ t1: new Set(s.t1), t2: s.t2 }));
        if (!next[heroIdx]) next[heroIdx] = { t1: new Set(), t2: null };
        next[heroIdx].t1 = new Set();
        next[heroIdx].t2 = null;
        return next;
      });
    } catch (err) {
      console.error("[Class] select failed:", err);
      alert("Class selection failed. See console for details.");
    }
  };

  /* ---------- Spell selection state (React) ---------- */
  const makeSel = () => (gameState.players || []).map(() => ({ t1: new Set(), t2: null }));
  const [selState, setSelState] = useState(makeSel());
  useEffect(() => { setSelState(makeSel()); }, [heroes.length]);

  const toggleT1 = (heroIdx, i) => {
    setSelState(prev => {
      const next = prev.map(s => ({ t1: new Set(s.t1), t2: s.t2 }));
      const bag = next[heroIdx]?.t1 || new Set();
      if (bag.has(i)) bag.delete(i);
      else { if (bag.size >= 2) return prev; bag.add(i); }
      next[heroIdx] = { ...next[heroIdx], t1: bag };
      return next;
    });
  };
  const chooseT2 = (heroIdx, i) => {
    setSelState(prev => {
      const next = prev.map(s => ({ t1: new Set(s.t1), t2: s.t2 }));
      next[heroIdx] = { ...next[heroIdx], t2: i };
      return next;
    });
  };

  const canFinalizeAll = heroes.length > 0 && heroes.every((h, idx) =>
    h?.class &&
    Array.isArray(h.t1Options) && h.t1Options.length >= 2 &&
    Array.isArray(h.t2Options) && h.t2Options.length >= 1 &&
    selState[idx]?.t1?.size === 2 &&
    typeof selState[idx]?.t2 === "number"
  );

  const finalizeAll = () => {
    try {
      heroes.forEach((h, idx) => {
        const t1 = Array.from(selState[idx]?.t1 || []);
        if (t1.length !== 2) throw new Error(`Hero ${idx + 1}: pick exactly two Tier-1 spells.`);
        const t2 = selState[idx]?.t2 ?? 0;
        chooseInitialSpells(idx, t1, t2);
      });
      force();
    } catch (err) {
      console.error("[SpellSelect] finalize failed:", err);
      alert(err.message || "Finalizing spells failed. See console for details.");
    }
  };

  /* ---------- Faces for roll overlay ---------- */
  const facesForOverlay = useMemo(() => {
    const arr = [{ kind:"class" }];
    const p = activeHero || {};
    for (let i = 0; i < 4; i++) arr.push({ kind:"spell", spellIndex:i, spell:p?.spells?.[i] || null });
    arr.push({ kind:"upgrade" });
    return arr;
  }, [activeHero, tick]);

  const previewToIndex = (p) => {
    if (!p) return 0;
    if (p.kind === "class") return 0;
    if (p.kind === "spell") return (p.slot ?? 0) + 1;
    return 5;
  };

  const startRoll = () => {
    try {
      if (!activeHero) return;
      const p = previewRollForPlayer(activeHeroIndex);
      setPreview(p);
      setRolling(true);
    } catch (err) {
      console.error("[Roll] preview failed]:", err);
      alert("Roll failed. See console for details.");
    }
  };

  const finishRoll = () => {
    try {
      setRolling(false);

      // Log a descriptive line using SPELLS metadata
      if (preview) {
        if (!Array.isArray(gameState.log)) gameState.log = [];
        const heroName = activeHero?.name || "Hero";

        if (preview.kind === "spell") {
          const s = preview.spell || {};
          const typeKey = String(s.type || "").toLowerCase();
          const meta = SPELLS[typeKey] || {};
          const title = meta.name || s.name || "Spell";
          const body  = meta.desc || "";
          gameState.log.unshift(`${heroName} casts ${title} (Tier ${s.tier ?? "?"}) — ${body}`);
        } else if (preview.kind === "class") {
          const cname = activeHero?.class?.name || "Class";
          const cab   = activeHero?.class?.ability || "Class ability";
          gameState.log.unshift(`${heroName} activates ${cname} — ${cab}`);
        } else if (preview.kind === "upgrade") {
          gameState.log.unshift(`${heroName} triggers Upgrade — choose a spell to improve.`);
        }
      }

      if (preview) {
        commitPreviewedRoll(activeHeroIndex, preview);
        setPreview(null);
        setTick(t => t + 1);
      }
    } catch (err) {
      console.error("[Roll] commit failed:", err);
      alert("Resolving roll failed. See console for details.");
    }
  };

  const StatusChips = ({ entity, isHero }) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {entity?.armor > 0 && <Chip color="#93c5fd">Armor {entity.armor}</Chip>}
      {isHero && entity?.conc > 1 && <Chip color="#a7f3d0">Conc ×{entity.conc}</Chip>}
      {entity?.status?.poisonDie > 0 && <Chip color="#fca5a5">Poison {entity.status.poisonDie}</Chip>}
      {entity?.status?.bombDie > 0 && <Chip color="#fdba74">Bomb {entity.status.bombDie}</Chip>}
      {entity?.status?.thorns > 0 && <Chip color="#fcd34d">Thorns {entity.status.thorns}</Chip>}
      {entity?.status?.taunt > 0 && <Chip color="#fde68a">Taunt</Chip>}
      {entity?.status?.immune > 0 && <Chip color="#c7d2fe">Immune</Chip>}
      {isHero && entity?.status?.invisible > 0 && <Chip color="#e9d5ff">Invisible</Chip>}
    </div>
  );

  return (
    <ErrorBoundary>
      <div style={{ minHeight: "100vh", background: "#0e1116", color: "#e8ecf1", fontFamily: "system-ui, Segoe UI, Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
          <h1 style={{ margin: "6px 0 12px 0" }}>Dice Arena — PvE Prototype</h1>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button onClick={() => { try { newParty(2); } catch(e){console.error(e);} finally { setSelState((gameState.players || []).map(() => ({ t1: new Set(), t2: null }))); } }} style={btn("secondary")}>New Party (2)</button>
            <button onClick={() => { try { spawnEnemy(1); } catch(e){console.error(e);} finally { setTick(t=>t+1); } }} style={btn("secondary")}>+ T1</button>
            <button onClick={() => { try { spawnEnemy(2); } catch(e){console.error(e);} finally { setTick(t=>t+1); } }} style={btn("secondary")}>+ T2</button>
            <button onClick={() => { try { spawnEnemy(3); } catch(e){console.error(e);} finally { setTick(t=>t+1); } }} style={btn("secondary")}>+ Boss</button>
            <button onClick={() => { try { clearEnemies(); } catch(e){console.error(e);} finally { setTick(t=>t+1); } }} style={{ ...btn("secondary"), marginLeft: "auto" }}>Clear Enemies</button>
          </div>

          {/* PHASE: Class Select */}
          {phase === "classSelect" && (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Pick a class for each hero</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
                {(heroes || []).map((h, idx) => (
                  <Card key={h?.id || idx}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{h?.name || `Hero ${idx+1}`}</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {(gameState.classes || []).map((cls) => {
                        const selected = h?.class?.key === cls.key;
                        return (
                          <button
                            key={cls.key}
                            onClick={() => onPickClass(idx, cls.key)}
                            style={{
                              ...btn("secondary"),
                              textAlign: "left",
                              borderColor: selected ? "#7dd3fc" : "#2b3342",
                              boxShadow: selected ? "0 0 0 3px rgba(125,211,252,.35), inset 0 0 20px rgba(125,211,252,.10)" : "none",
                              transition: "box-shadow 80ms linear, border-color 80ms linear"
                            }}
                          >
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <SpriteStrip sheetUrl="/art/class-logos.png" frames={8} frameIndex={cls.frame ?? 0} width={80} orientation="vertical" />
                              <div>
                                <div style={{ fontWeight: 700 }}>{cls.name}</div>
                                <div style={{ opacity: .8, fontSize: 13 }}>{cls.ability}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* PHASE: Spell Select */}
          {phase === "spellSelect" && (
            <div style={{ display: "grid", gap: 12 }}>
              {(heroes || []).map((h, idx) => (
                <Card key={h?.id || idx}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <SpriteStrip sheetUrl="/art/class-logos.png" frames={8} frameIndex={h?.class?.frame ?? 0} width={80} orientation="vertical" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{h?.name} — {h?.class?.name || "Pick a class"}</div>
                      <div style={{ opacity: .8, fontSize: 13 }}>{h?.class?.ability || ""}</div>
                    </div>
                  </div>

                  <div className="small" style={{ opacity: .8, margin: "6px 0" }}>Pick two Tier-1 spells</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
                    {(h?.t1Options || []).map((s, i) => {
                      const on = selState[idx]?.t1?.has(i);
                      return (
                        <button key={`t1-${h?.id || idx}-${i}`} onClick={() => toggleT1(idx, i)} style={{ ...btn(on ? "primary" : "secondary"), textAlign: "left" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <SpellIcon spell={s} width={96} />
                            <div>
                              <div style={{ fontWeight: 700 }}>{SPELLS[String(s?.type||"").toLowerCase()]?.name || s?.name || "Unknown"}</div>
                              <div style={{ opacity: .7, fontSize: 13 }}>Tier {s?.tier ?? "?"} — {s?.type || "?"}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {(h?.t1Options || []).length === 0 && <div style={{ opacity:.7 }}>No Tier-1 options available.</div>}
                  </div>

                  <div className="small" style={{ opacity: .8, margin: "10px 0 6px" }}>Pick one Tier-2 spell</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
                    {(h?.t2Options || []).map((s, i) => {
                      const on = selState[idx]?.t2 === i;
                      return (
                        <button key={`t2-${h?.id || idx}-${i}`} onClick={() => chooseT2(idx, i)} style={{ ...btn(on ? "primary" : "secondary"), textAlign: "left" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <SpellIcon spell={s} width={96} />
                            <div>
                              <div style={{ fontWeight: 700 }}>{SPELLS[String(s?.type||"").toLowerCase()]?.name || s?.name || "Unknown"}</div>
                              <div style={{ opacity: .7, fontSize: 13 }}>Tier {s?.tier ?? "?"} — {s?.type || "?"}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {(h?.t2Options || []).length === 0 && <div style={{ opacity:.7 }}>No Tier-2 options available.</div>}
                  </div>
                </Card>
              ))}
              <div>
                <button onClick={finalizeAll} disabled={!canFinalizeAll} style={{ ...btn("primary"), opacity: canFinalizeAll ? 1 : .6 }}>Finalize & Start</button>
              </div>
            </div>
          )}

          {/* PHASE: Battle */}
          {phase === "battle" && (
            <>
              {/* Party */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
                {(heroes || []).map((h, i) => {
                  const isActive = i === activeHeroIndex;
                  return (
                    <Card key={h?.id || i} style={{ boxShadow: isActive ? "0 0 0 2px rgba(110,190,255,.5)" : "none" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <SpriteStrip sheetUrl="/art/class-logos.png" frames={8} frameIndex={h?.class?.frame ?? 0} width={96} orientation="vertical" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>
                            {h?.name} — {h?.class?.name || "—"} {isActive && <span style={{ opacity: .7 }}>(active)</span>}
                          </div>
                          <div style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 6 }}>
                            <div>HP: {h?.hp ?? 0} / {h?.maxHp ?? 20}</div>
                            <Bar value={h?.hp ?? 0} max={h?.maxHp ?? 20} color="#22c55e" />
                            <StatusChips entity={h} isHero />
                          </div>
                        </div>
                      </div>

                      {/* Die faces */}
                      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                        <div style={{ textAlign: "center" }}>
                          <div className="small" style={{ opacity: .7, marginBottom: 6 }}>Class</div>
                          <SpriteStrip sheetUrl="/art/class-logos.png" frames={8} frameIndex={h?.class?.frame ?? 0} width={90} orientation="vertical" />
                        </div>
                        {(h?.spells || [null,null,null,null]).map((sp, si) => (
                          <div key={si} style={{ textAlign: "center" }}>
                            <div className="small" style={{ opacity: .7, marginBottom: 6 }}>Spell {si + 1}</div>
                            <SpellIcon spell={sp} width={90} />
                          </div>
                        ))}
                        <div style={{ textAlign: "center" }}>
                          <div className="small" style={{ opacity: .7, marginBottom: 6 }}>Upgrade</div>
                          <SpriteStrip sheetUrl="/art/UpgradeLogo.png" width={90} orientation="vertical" autoFrames />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Enemies */}
              <h3 style={{ margin: "16px 0 8px 0" }}>Enemies</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
                {(enemies || []).map((e, idx) => {
                  const selected = gameState.targets?.enemyId === e?.id;
                  const sheet = e?.tier === 1 ? "/art/Tier1.png" : e?.tier === 2 ? "/art/Tier2.png" : "/art/Boss.png";
                  const cols = e?.tier === 1 ? 10 : 5;
                  const rows = e?.tier === 1 ? 2 : 4;
                  return (
                    <Card key={e?.id || idx} style={{ boxShadow: selected ? "0 0 0 2px rgba(255,213,128,.5)" : "none" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <GridSprite sheetUrl={sheet} cols={cols} rows={rows} index={idx % Math.max(1, cols*rows)} width={120} title={e?.name} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>{e?.name || "Enemy"}</div>
                          <div style={{ display: "grid", gap: 6, fontSize: 14, marginTop: 6 }}>
                            <div>HP: {e?.hp ?? 0} / {e?.maxHp ?? (e?.hp ?? 0)}</div>
                            <Bar value={e?.hp ?? 0} max={e?.maxHp ?? (e?.hp ?? 0)} color="#ef4444" />
                            <StatusChips entity={e} />
                          </div>
                          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button onClick={() => { try { setTargetEnemy(e?.id); setTick(t=>t+1); } catch(err){console.error(err);} }} style={btn("secondary")}>Target</button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {(enemies || []).length === 0 && <div style={{ opacity: .7 }}>No enemies…</div>}
              </div>

              {/* Ally target picker */}
              <h3 style={{ margin: "16px 0 8px 0" }}>Ally Target</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(heroes || []).map(h => {
                  const selected = gameState.targets?.allyId === h?.id;
                  return (
                    <button key={h?.id} onClick={() => { try { setTargetAlly(h?.id); setTick(t=>t+1); } catch(err){console.error(err);} }} style={{ ...btn("secondary"), boxShadow: selected ? "0 0 0 2px rgba(255,213,128,.5)" : "none" }}>
                      {h?.name}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={startRoll} style={btn("primary")}>Roll</button>
              </div>

              {/* Log */}
              <Card style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Log</div>
                <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
                  {(gameState.log || []).map((line, i) => <div key={i} style={{ opacity: 0.92 }}>{line}</div>)}
                  {(gameState.log || []).length === 0 && <div style={{ opacity: .6 }}>No actions yet…</div>}
                </div>
              </Card>
            </>
          )}

          {/* Upgrade modal */}
          {phase === "battle" && (heroes || []).find(h => h?.upgradePending) && (() => {
            const heroWithUpgrade = (heroes || []).find(h => h?.upgradePending);
            if (!heroWithUpgrade) return null;
            const idx = heroes.indexOf(heroWithUpgrade);
            return (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
                <div style={{ background: "#0e1116", border: "1px solid #242a34", borderRadius: 12, width: 760, maxWidth: "95vw" }}>
                  <div style={{ padding: 12, borderBottom: "1px solid #242a34", fontWeight: 700 }}>Upgrade</div>
                  <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Card>
                      <div className="small" style={{ opacity: .7, marginBottom: 4 }}>Old</div>
                      {heroWithUpgrade?.upgradePending?.old ? (
                        <>
                          <SpellIcon spell={heroWithUpgrade.upgradePending.old} width={120} />
                          <div style={{ marginTop: 8, fontWeight: 700 }}>{SPELLS[String(heroWithUpgrade.upgradePending.old?.type||"").toLowerCase()]?.name || heroWithUpgrade.upgradePending.old.name}</div>
                          <div className="small" style={{ opacity: .7 }}>Tier {heroWithUpgrade.upgradePending.old.tier} — {heroWithUpgrade.upgradePending.old.type}</div>
                        </>
                      ) : <div>(Blank)</div>}
                    </Card>
                    <Card>
                      <div className="small" style={{ opacity: .7, marginBottom: 4 }}>New</div>
                      <SpellIcon spell={heroWithUpgrade?.upgradePending?.candidate} width={120} />
                      <div style={{ marginTop: 8, fontWeight: 700 }}>{SPELLS[String(heroWithUpgrade?.upgradePending?.candidate?.type||"").toLowerCase()]?.name || heroWithUpgrade?.upgradePending?.candidate?.name || "Unknown"}</div>
                      <div className="small" style={{ opacity: .7 }}>Tier {heroWithUpgrade?.upgradePending?.candidate?.tier ?? "?"} — {heroWithUpgrade?.upgradePending?.candidate?.type || "?"}</div>
                    </Card>
                  </div>
                  <div style={{ padding: "0 16px 16px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => { try { acceptUpgrade(idx); } catch(e){console.error(e);} finally { setTick(t=>t+1); } }} style={btn("primary")}>Take New</button>
                    <button onClick={() => { try { declineUpgrade(idx); } catch(e){console.error(e);} finally { setTick(t=>t+1); } }} style={btn("secondary")}>Keep Old</button>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* One-face roll overlay */}
          <OneFaceRollOverlay
            open={phase === "battle" && rolling}
            faces={useMemo(() => {
              const arr = [{ kind:"class" }];
              const p = activeHero || {};
              for (let i = 0; i < 4; i++) arr.push({ kind:"spell", spellIndex:i, spell:p?.spells?.[i] || null });
              arr.push({ kind:"upgrade" });
              return arr;
            }, [activeHero, tick])}
            classFrame={activeHero?.class?.frame || 0}
            finalIndex={(() => {
              if (!preview) return 0;
              if (preview.kind === "class") return 0;
              if (preview.kind === "spell") return (preview.slot ?? 0) + 1;
              return 5;
            })()}
            hero={activeHero}
            onCancel={() => { setRolling(false); setPreview(null); }}
            onFinish={() => finishRoll()}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
