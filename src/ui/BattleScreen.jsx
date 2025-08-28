// src/ui/BattleScreen.jsx
import React, { useMemo } from "react";
import EnemyCard from "../components/EnemyCard";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";
import { FACE_TYPES, rollFaceForPlayer } from "../combat";
import StatusEffects from "../components/StatusEffects";

export default function BattleScreen({
  state,
  onRoll,
  onUpgradeSlot,
  onEndTurn,
  onPickTarget,
}) {
  const tok = state.turn.order[state.turn.turnIdx];
  const isHeroTurn = tok?.type === "player";

  // convenience lookups
  const players = state.players;
  const enemies = state.enemies;

  return (
    <div style={{ display:"grid", gap:"12px" }}>
      {/* Enemies */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:"12px" }}>
        {enemies.map(e => {
          const active = tok?.type === "enemy" && tok?.id === e.id;
          return (
            <EnemyCard
              key={e.id}
              enemy={e}
              highlight={active}
              onClick={() => onPickTarget?.({ type:"enemy", id:e.id })}
            />
          );
        })}
      </div>

      {/* Log */}
      <div style={{
        maxHeight: 220,
        overflowY: "auto",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10,
        padding: 10
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Battle Log</div>
        {state.turn.log.slice(-100).map(l => (
          <div key={l.id} style={{ opacity: 0.9, marginBottom: 2 }}>{l.text}</div>
        ))}
      </div>

      {/* Players */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:"12px" }}>
        {players.map(p => {
          const active = isHeroTurn && tok.id === p.id;
          return (
            <div
              key={p.id}
              style={{
                border: active ? "2px solid gold":"1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 12,
                background: "rgba(255,255,255,0.05)"
              }}
            >
              {/* Header */}
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
                <ClassIcon name={p.classId} size={42} radius={8}/>
                <div style={{ fontWeight:800, fontSize:18 }}>
                  {p.classLabel || p.classId} <span style={{ opacity:0.6, fontWeight:600 }}>({p.short||"P"})</span>
                </div>
              </div>

              {/* HP bar */}
              <div style={{ fontSize:13, marginBottom:6 }}>
                HP: {p.hp}/20
              </div>
              <div style={{
                height: 10, borderRadius: 999,
                background: "rgba(255,0,0,0.25)",
                marginBottom: 8, overflow:"hidden"
              }}>
                <div style={{
                  width: `${(p.hp/20)*100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #ff4d4d, #ff1f1f)"
                }}/>
              </div>

              {/* Armor & stacks */}
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom: 8 }}>
                <div style={{
                  fontSize:12, padding:"2px 8px",
                  background:"rgba(255,255,255,0.08)", borderRadius: 999
                }}>Armor: <b>{p.armor||0}</b></div>

                <StatusEffects
                  stacks={{ psn: p.stacks?.psn||0, bmb: p.stacks?.bmb||0 }}
                  compact
                />
              </div>

              {/* Faces (6) preview */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:8, marginBottom:10 }}>
                {/* 1: Class */}
                <div style={thumb()}>
                  <ClassIcon name={p.classId} size={40} radius={8}/>
                  <div style={lbl()}>class</div>
                </div>
                {/* 2-5: spells from slots 1-4 */}
                {Array.from({length:4}).map((_,i) => {
                  const face = p.faces?.[i];
                  const nm = face?.kind === "spell" ? face.spell?.name : "blank";
                  const tier = face?.spell?.tier ?? 0;
                  return (
                    <div key={i} style={thumb()}>
                      <SpellIcon tier={tier||1} name={nm} size={40} radius={8}/>
                      <div style={lbl()}>{nm}</div>
                    </div>
                  );
                })}
                {/* 6: Upgrade */}
                <div style={thumb()}>
                  <SpellIcon upgrade size={40} radius={8}/>
                  <div style={lbl()}>upgrade</div>
                </div>
              </div>

              {/* Controls */}
              {active ? (
                <div style={{ display:"flex", gap:10 }}>
                  <button
                    onClick={() => onRoll?.(p)}
                    className="btn btn-primary"
                  >Roll</button>
                  <button
                    onClick={() => onEndTurn?.()}
                    className="btn"
                  >End Turn</button>
                </div>
              ) : (
                <div style={{ opacity:0.6, fontSize:12 }}>Waiting for turn…</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function thumb() {
  return {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: 6,
    display: "grid",
    placeItems: "center",
    gap: 4,
    background: "rgba(255,255,255,0.03)"
  };
}
function lbl() { return { fontSize:10, opacity:0.8, textAlign:"center" }; }
