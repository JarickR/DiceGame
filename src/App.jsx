// src/App.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  gameState,
  selectClass,
  chooseInitialSpells,
  rollDiceForPlayer,
  acceptUpgrade,
  declineUpgrade,
} from "./engine";
import { getSpellSpriteInfo } from "./spells";

/* -------------------------------------------------------
   SpriteStrip — supports horizontal or vertical 1×N strips
   NEW: autoFrames=true deduces total frames from image size
   using frameSize (defaults to your 500×375 per-frame assets)
--------------------------------------------------------*/
function SpriteStrip({
  sheetUrl,
  frames = 1,              // ignored if autoFrames=true
  frameIndex = 0,
  width = 96,
  orientation = "vertical", // "horizontal" | "vertical"
  title,
  border = true,
  autoFrames = false,       // NEW
  frameSize = { w: 500, h: 375 }, // NEW (native per-frame size)
}) {
  const [img, setImg] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = new Image();
    el.onload = () => setImg({ w: el.width, h: el.height });
    el.src = sheetUrl;
  }, [sheetUrl]);

  const aspectHeight = Math.round((frameSize.h / frameSize.w) * width);

  if (!img.w || !img.h) {
    return (
      <div
        style={{
          width,
          height: aspectHeight,
          borderRadius: 12,
          background: "#0b0e13",
          border: "1px solid #242a34",
        }}
      />
    );
  }

  let total = frames;
  if (autoFrames) {
    total =
      orientation === "horizontal"
        ? Math.max(1, Math.floor(img.w / frameSize.w))
        : Math.max(1, Math.floor(img.h / frameSize.h));
  }

  const idx = Math.max(0, Math.min(total - 1, frameIndex));

  if (orientation === "horizontal") {
    const frameW = Math.floor(img.w / total);
    const frameH = img.h;
    const scale = width / frameW;
    const height = Math.round(frameH * scale);
    const bgW = img.w * scale;
    const bgH = height;
    const offsetX = -(idx * frameW * scale);
    return (
      <div
        title={title}
        style={{
          width,
          height,
          borderRadius: 12,
          backgroundColor: "#0d1117",
          backgroundImage: `url(${sheetUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${bgW}px ${bgH}px`,
          backgroundPosition: `${offsetX}px 0`,
          imageRendering: "pixelated",
          border: border ? "1px solid #2b3342" : "none",
          overflow: "hidden",
        }}
      />
    );
  } else {
    const frameW = img.w;
    const frameH = Math.floor(img.h / total);
    const scale = width / frameW;
    const height = Math.round(frameH * scale);
    const bgH = img.h * scale;
    const offsetY = -(idx * frameH * scale);
    return (
      <div
        title={title}
        style={{
          width,
          height,
          borderRadius: 12,
          backgroundColor: "#0d1117",
          backgroundImage: `url(${sheetUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${width}px ${bgH}px`,
          backgroundPosition: `center ${offsetY}px`,
          imageRendering: "pixelated",
          border: border ? "1px solid #2b3342" : "none",
          overflow: "hidden",
        }}
      />
    );
  }
}

/* -------------------------------------------------------
   GridSprite — for multi-row sheets (enemies/accessories)
--------------------------------------------------------*/
function GridSprite({
  sheetUrl,
  cols,
  rows,
  index = 0,
  width = 120,
  title,
  border = true,
}) {
  const [img, setImg] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = new Image();
    el.onload = () => setImg({ w: el.width, h: el.height });
    el.src = sheetUrl;
  }, [sheetUrl]);

  if (!img.w || !img.h || cols <= 0 || rows <= 0) {
    return (
      <div
        style={{
          width,
          height: Math.round((375 / 500) * width),
          borderRadius: 12,
          background: "#0b0e13",
          border: "1px solid #242a34",
        }}
      />
    );
  }

  const frameW = Math.floor(img.w / cols);
  const frameH = Math.floor(img.h / rows);
  const scale = width / frameW;
  const height = Math.round(frameH * scale);

  const col = index % cols;
  const row = Math.floor(index / cols);

  const bgW = img.w * scale;
  const bgH = img.h * scale;
  const offsetX = -(col * frameW * scale);
  const offsetY = -(row * frameH * scale);

  return (
    <div
      title={title}
      style={{
        width,
        height,
        borderRadius: 12,
        backgroundColor: "#0d1117",
        backgroundImage: `url(${sheetUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        imageRendering: "pixelated",
        border: border ? "1px solid #2b3342" : "none",
        overflow: "hidden",
      }}
    />
  );
}

/* ------------------------------ UI atoms ------------------------------ */
function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#0b0e13",
        border: "1px solid #242a34",
        borderRadius: 12,
        padding: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
const btn = (variant = "primary") => ({
  background:
    variant === "primary"
      ? "#1d3557"
      : variant === "ghost"
      ? "transparent"
      : "#12151a",
  border:
    variant === "primary"
      ? "1px solid #2b4f7c"
      : variant === "ghost"
      ? "1px solid transparent"
      : "1px solid #2b3342",
  color: variant === "primary" ? "#e8f1ff" : "#dfe6ef",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
});

/* ------------------------------ App ------------------------------ */
export default function App() {
  const [tick, setTick] = useState(0);
  const force = () => setTick((t) => t + 1);

  const phase = gameState.phase;

  // ====== Class Select ======
  const onPickClass = (classKey) => {
    selectClass(0, classKey);
    gameState.phase = "spellSelect";
    force();
  };

  // ====== Spell Select ======
  const t1Opts = gameState.players[0]?.t1Options || [];
  const t2Opts = gameState.players[0]?.t2Options || [];
  const [t1Pick, setT1Pick] = useState(new Set());
  const [t2Pick, setT2Pick] = useState(null);

  const toggleT1 = (i) => {
    const cp = new Set(t1Pick);
    if (cp.has(i)) cp.delete(i);
    else {
      if (cp.size >= 2) return;
      cp.add(i);
    }
    setT1Pick(cp);
  };
  const chooseT2 = (i) => setT2Pick(i);

  const canFinalize =
    phase === "spellSelect" && t1Pick.size === 2 && t2Pick !== null;

  const finalizeBuild = () => {
    if (!canFinalize) return;
    chooseInitialSpells(0, [...t1Pick], t2Pick);
    force();
  };

  // ====== Battle ======
  const player = gameState.players[0];
  const enemy =
    gameState.enemies.find((e) => e.hp > 0) || gameState.enemies[0] || null;

  const rollTurn = () => {
    rollDiceForPlayer(0);
    force();
  };

  const pending = player?.upgradePending || null;
  const lastLine = useMemo(() => gameState.log[0] || "—", [tick]);

  // HP bar
  const Bar = ({ value, max = 20, color = "#38bdf8" }) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div
        style={{
          background: "#0e1620",
          border: "1px solid #1f2b3a",
          borderRadius: 8,
          height: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
    );
  };

  // Spell icon — ALL TIERS vertical + autoFrames (handles blanks)
  const SpellIcon = ({ spell, width = 90 }) => {
    if (!spell) {
      return (
        <div
          style={{
            width,
            height: Math.round((375 / 500) * width),
            borderRadius: 12,
            background: "rgba(255,255,255,.03)",
            border: "1px dashed #2b3342",
          }}
        />
      );
    }
    const { sheetUrl, frame } = getSpellSpriteInfo(spell);
    return (
      <SpriteStrip
        sheetUrl={sheetUrl}
        frameIndex={frame}
        width={width}
        orientation="vertical"
        autoFrames
      />
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e1116",
        color: "#e8ecf1",
        fontFamily: "system-ui, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: 16 }}>
        <h1 style={{ margin: "4px 0 12px 0" }}>Dice Arena — PvE Battle Loop</h1>

        {/* PHASE: Class Select */}
        {phase === "classSelect" && (
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>
              Choose your class
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 10,
              }}
            >
              {gameState.classes.map((cls) => (
                <button
                  key={cls.key}
                  onClick={() => onPickClass(cls.key)}
                  style={{ ...btn("secondary"), textAlign: "left" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* class-logos.png is a 1×8 vertical strip */}
                    <SpriteStrip
                      sheetUrl="/art/class-logos.png"
                      frames={8}
                      frameIndex={cls.frame}
                      width={96}
                      orientation="vertical"
                      title={cls.name}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{cls.name}</div>
                      <div style={{ opacity: 0.8, fontSize: 13 }}>{cls.ability}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* PHASE: Spell Select */}
        {phase === "spellSelect" && (
          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Pick two Tier-1 spells
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 10,
                }}
              >
                {t1Opts.map((s, i) => {
                  const on = t1Pick.has(i);
                  return (
                    <button
                      key={`t1-${i}`}
                      onClick={() => toggleT1(i)}
                      style={{ ...btn(on ? "primary" : "secondary"), textAlign: "left" }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <SpellIcon spell={s} width={96} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          <div style={{ opacity: 0.7, fontSize: 13 }}>
                            Tier {s.tier} — {s.type}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
                Selected: {t1Pick.size} / 2
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Pick one Tier-2 spell
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 10,
                }}
              >
                {t2Opts.map((s, i) => {
                  const on = t2Pick === i;
                  return (
                    <button
                      key={`t2-${i}`}
                      onClick={() => chooseT2(i)}
                      style={{ ...btn(on ? "primary" : "secondary"), textAlign: "left" }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <SpellIcon spell={s} width={96} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          <div style={{ opacity: 0.7, fontSize: 13 }}>
                            Tier {s.tier} — {s.type}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
                Selected: {t2Pick !== null ? 1 : 0} / 1
              </div>
            </Card>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={finalizeBuild}
                disabled={!canFinalize}
                style={{ ...btn("primary"), opacity: canFinalize ? 1 : 0.6 }}
              >
                Finalize & Start
              </button>
            </div>
          </div>
        )}

        {/* PHASE: Battle */}
        {phase === "battle" && player && (
          <>
            <Card>
              {/* Top: player & enemy */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Player */}
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <SpriteStrip
                      sheetUrl="/art/class-logos.png"
                      frames={8}
                      frameIndex={player.class.frame}
                      width={120}
                      orientation="vertical"
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {player.class.name}
                      </div>
                      <div style={{ display: "grid", gap: 6, marginTop: 6, fontSize: 14 }}>
                        <div>
                          HP: {player.hp} / {player.maxHp}
                        </div>
                        <Bar value={player.hp} max={player.maxHp} color="#22c55e" />
                        <div style={{ marginTop: 6 }}>Armor: {player.armor}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enemy */}
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {enemy ? (
                      <GridSprite
                        sheetUrl={
                          enemy.tier === 1
                            ? "/art/Tier1.png"
                            : enemy.tier === 2
                            ? "/art/Tier2.png"
                            : "/art/Boss.png"
                        }
                        cols={enemy.tier === 1 ? 10 : 5}
                        rows={enemy.tier === 1 ? 2 : 4}
                        index={0}
                        width={120}
                        title={enemy.name}
                      />
                    ) : (
                      <div
                        style={{ width: 120, height: Math.round((375 / 500) * 120) }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {enemy?.name || "—"}
                      </div>
                      {enemy && (
                        <div style={{ display: "grid", gap: 6, marginTop: 6, fontSize: 14 }}>
                          <div>HP: {enemy.hp}</div>
                          <Bar
                            value={enemy.hp}
                            max={enemy.tier === 1 ? 14 : enemy.tier === 2 ? 20 : 30}
                            color="#ef4444"
                          />
                          <div style={{ marginTop: 6 }}>Armor: {enemy.armor}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Die faces: [Class][Spell1][Spell2][Spell3][Spell4][Upgrade] */}
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 10,
                }}
              >
                {/* Class */}
                <div style={{ textAlign: "center" }}>
                  <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                    Class
                  </div>
                  <SpriteStrip
                    sheetUrl="/art/class-logos.png"
                    frames={8}
                    frameIndex={player.class.frame}
                    width={90}
                    orientation="vertical"
                  />
                </div>
                {/* 4 spells — vertical with autoFrames */}
                {player.spells.map((sp, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                      Spell {i + 1}
                    </div>
                    <SpellIcon spell={sp} width={90} />
                  </div>
                ))}
                {/* Upgrade (single) — vertical safe with autoFrames (even if 1 frame) */}
                <div style={{ textAlign: "center" }}>
                  <div className="small" style={{ opacity: 0.7, marginBottom: 6 }}>
                    Upgrade
                  </div>
                  <SpriteStrip
                    sheetUrl="/art/UpgradeLogo.png"
                    frameIndex={0}
                    width={90}
                    orientation="vertical"
                    autoFrames
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={rollTurn} style={btn("primary")}>
                  Roll
                </button>
              </div>

              <div style={{ marginTop: 8, opacity: 0.9 }}>
                <b>Last:</b> {lastLine}
              </div>
            </Card>

            {/* Log */}
            <Card style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Log</div>
              <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
                {gameState.log.map((line, i) => (
                  <div key={i} style={{ opacity: 0.92 }}>
                    {line}
                  </div>
                ))}
                {gameState.log.length === 0 && (
                  <div style={{ opacity: 0.6 }}>No actions yet…</div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* Upgrade modal */}
        {pending && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 40,
            }}
          >
            <div
              style={{
                background: "#0e1116",
                color: "#e8ecf1",
                border: "1px solid #242a34",
                borderRadius: 12,
                width: 760,
                maxWidth: "95vw",
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderBottom: "1px solid #242a34",
                  fontWeight: 700,
                }}
              >
                Upgrade
              </div>
              <div
                style={{
                  padding: 16,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {/* Old */}
                <Card>
                  <div className="small" style={{ opacity: 0.7, marginBottom: 4 }}>
                    Old
                  </div>
                  {pending.old ? (
                    <>
                      <SpriteStrip
                        sheetUrl={getSpellSpriteInfo(pending.old).sheetUrl}
                        frameIndex={getSpellSpriteInfo(pending.old).frame}
                        width={120}
                        orientation="vertical"
                        autoFrames
                      />
                      <div style={{ marginTop: 8, fontWeight: 700 }}>
                        {pending.old.name}
                      </div>
                      <div className="small" style={{ opacity: 0.7 }}>
                        Tier {pending.old.tier} — {pending.old.type}
                      </div>
                    </>
                  ) : (
                    <div style={{ opacity: 0.8 }}>(Blank)</div>
                  )}
                </Card>

                {/* New */}
                <Card>
                  <div className="small" style={{ opacity: 0.7, marginBottom: 4 }}>
                    New
                  </div>
                  <SpriteStrip
                    sheetUrl={getSpellSpriteInfo(pending.candidate).sheetUrl}
                    frameIndex={getSpellSpriteInfo(pending.candidate).frame}
                    width={120}
                    orientation="vertical"
                    autoFrames
                  />
                  <div style={{ marginTop: 8, fontWeight: 700 }}>
                    {pending.candidate.name}
                  </div>
                  <div className="small" style={{ opacity: 0.7 }}>
                    Tier {pending.candidate.tier} — {pending.candidate.type}
                  </div>
                </Card>
              </div>
              <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    acceptUpgrade(0);
                    setTick((t) => t + 1);
                  }}
                  style={btn("primary")}
                >
                  Take New
                </button>
                <button
                  onClick={() => {
                    declineUpgrade(0);
                    setTick((t) => t + 1);
                  }}
                  style={btn("secondary")}
                >
                  Keep Old
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
