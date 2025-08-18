// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import GameEngine, { FACE_TYPES, isPhysical, rollD20 } from "./engine";

import ClassIcon from "./ui/ClassIcon";
import SpellIcon from "./ui/SpellIcon";
import EnemyIcon from "./ui/EnemyIcon";
import UpgradeIcon from "./ui/UpgradeIcon";
import RollPopup from "./ui/RollPopup";
import StatusEffects from "./ui/StatusEffects"; // stacks (poison/bomb)

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const randInt = (n) => Math.floor(Math.random() * n);
const pickN = (arr, n) => {
  const bag = [...arr];
  const out = [];
  while (bag.length && out.length < n) out.push(bag.splice(randInt(bag.length), 1)[0]);
  return out;
};

const CLASS_DEF = [
  { id: "thief",     label: "Thief",     tip: "Steal/invisibility turn." },
  { id: "judge",     label: "Judge",     tip: "Reroll & choose this turn." },
  { id: "tank",      label: "Tank",      tip: "Taunt & +Armor this turn." },
  { id: "vampire",   label: "Vampire",   tip: "Lifedrain burst." },
  { id: "king",      label: "King",      tip: "Rally allies: +Armor/boon." },
  { id: "lich",      label: "Lich",      tip: "PSN/BMB synergy." },
  { id: "paladin",   label: "Paladin",   tip: "Heal/cleanse turn." },
  { id: "barbarian", label: "Barbarian", tip: "Rage + Sweep power." },
];

const T1_POOL = ["attack", "heal", "armor", "sweep", "fireball"];
const T2_POOL = ["attack", "heal", "armor", "concentration", "sweep", "fireball", "poison", "bomb"];
const T3_POOL = ["attack", "sweep", "fireball"];

// Blank sprite slot visual
const BlankSlot = ({ size = 64 }) => (
  <div
    style={{
      width: size,
      height: Math.round((size * 3) / 5),
      borderRadius: 10,
      outline: "1px dashed #3a4150",
      background: "rgba(255,255,255,.04)",
    }}
  />
);

const Card = ({ children, style }) => (
  <div style={{ background: "#0e151f", border: "1px solid #1f2a3b", borderRadius: 12, padding: 12, ...style }}>
    {children}
  </div>
);

const Tile = ({ selected = false, onClick, children, title }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 108,
      borderRadius: 12,
      background: "rgba(255,255,255,.04)",
      border: "1px solid #2a3140",
      cursor: "pointer",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        boxShadow: selected ? "0 0 0 2px rgba(140,170,255,.95)" : "none",
        pointerEvents: "none",
      }}
    />
    {children}
  </button>
);

export default function App() {
  const [engine] = useState(() => new GameEngine());
  const [phase, setPhase] = useState("loadout");

  const [partySize, setPartySize] = useState(4);
  const emptyProto = () => ({ classId: null, t1: [], t2: [], armor: 0, hp: 20, maxHp: 20, status: { poison: [], bomb: [] } });
  const [proto, setProto] = useState(Array(8).fill(null).map(emptyProto));
  const [deals, setDeals] = useState(Array(8).fill(null));

  const [initiative, setInitiative] = useState([]);
  const [log, setLog] = useState([]);
  const pushLog = (m) => setLog((L) => [m, ...L].slice(0, 250));

  const [hitFlash, setHitFlash] = useState({});
  useEffect(() => {
    engine.push = (m) => pushLog(m);
    engine.onHeroHit = (id) => {
      setHitFlash((h) => ({ ...h, [id]: true }));
      setTimeout(
        () =>
          setHitFlash((h) => {
            const c = { ...h };
            delete c[id];
            return c;
          }),
        280
      );
    };
  }, [engine]);

  const [rollModal, setRollModal] = useState(null);

  // Loadout picking
  const onPickClass = (idx, classId) => {
    const next = [...proto];
    next[idx] = { ...next[idx], classId };
    setProto(next);
    const t1 = pickN(T1_POOL, 3);
    const t2 = pickN(T2_POOL, 2);
    setDeals((D) => {
      const c = [...D];
      c[idx] = { t1, t2 };
      return c;
    });
  };
  const togglePick = (idx, tier, name) => {
    const cap = tier === 1 ? 2 : 1;
    const next = [...proto];
    const arr = new Set(next[idx][tier === 1 ? "t1" : "t2"] || []);
    if (arr.has(name)) arr.delete(name);
    else if (arr.size < cap) arr.add(name);
    next[idx] = { ...next[idx], [tier === 1 ? "t1" : "t2"]: Array.from(arr) };
    setProto(next);
  };

  const finalizeAndStart = () => {
    const team = proto.slice(0, partySize).map((p, i) => {
      const h = engine.buildHero(`Hero ${i + 1}`, p.classId || "thief");
      const t1 = [...(p.t1 || [])].slice(0, 2);
      while (t1.length < 2) t1.push(null);
      const t2 = [...(p.t2 || [])].slice(0, 1);
      while (t2.length < 1) t2.push(null);
      h.loadout = { t1, t2 };
      h.hp = 20;
      h.maxHp = 20;
      h.armor = p.armor || 0;
      h.status = { poison: [], bomb: [] };
      return h;
    });
    engine.party = team;

    // Seed enemies if none
    if (!engine._enemies || engine._enemies.length === 0) {
      engine.spawnEnemy({ id: "E1", name: "Goblin", tier: 1, hp: 12, armor: 0, ai: "melee", spriteId: 1 });
      engine.spawnEnemy({ id: "E2", name: "Gremlin", tier: 1, hp: 10, armor: 0, ai: "melee", spriteId: 5 });
      engine.spawnEnemy({ id: "E3", name: "Imp Caster", tier: 2, hp: 14, armor: 1, ai: "caster", spriteId: 7 });
      engine.spawnEnemy({ id: "E4", name: "Savage Orc", tier: 2, hp: 18, armor: 1, ai: "melee", spriteId: 1 });
    }

    // Initiative
    const rolls = [
      ...engine.party.map((h) => ({ type: "hero", id: h.id, name: h.name, roll: rollD20() })),
      ...engine._enemies.map((e) => ({ type: "enemy", id: e.id, name: e.name, roll: rollD20() })),
    ].sort((a, b) => b.roll - a.roll);
    setInitiative(rolls);
    engine.push("Initiative: " + rolls.map((r) => `${r.name}(${r.roll})`).join(", "));

    setPhase("combat");
    pushLog("Encounter started.");
  };

  // Upgrade flow
  const [chooseSlotUI, setChooseSlotUI] = useState(null);
  const [upgradeUI, setUpgradeUI] = useState(null);

  const onChooseUpgradeSlot = (slotStr) => {
    const heroIdx = chooseSlotUI?.heroIdx ?? 0;
    const hero = engine.party[heroIdx];
    const [tierStr, posStr] = slotStr.split("-");
    const pos = parseInt(posStr, 10) || 0;
    const fromTier = tierStr === "t1" ? 1 : 2;
    const current = fromTier === 1 ? hero.loadout.t1[pos] : hero.loadout.t2[pos];

    let targetTier, pool;
    if (!current) {
      targetTier = 1;
      pool = T1_POOL;
    } else {
      targetTier = fromTier + 1;
      pool = targetTier === 2 ? T2_POOL : T3_POOL;
    }

    const rolledSpell = pool[randInt(pool.length)];
    setChooseSlotUI(null);
    setUpgradeUI({ heroIdx, fromSlot: slotStr, toTier: targetTier, rolledSpell });
  };

  const commitUpgrade = (accept) => {
    const U = upgradeUI;
    if (!U) return;
    const hero = engine.party[U.heroIdx];
    const [tierStr, posStr] = U.fromSlot.split("-");
    const pos = parseInt(posStr, 10) || 0;

    if (accept) {
      if (tierStr === "t1") hero.loadout.t1[pos] = U.rolledSpell;
      else hero.loadout.t2[pos] = U.rolledSpell;
      engine.push(`${hero.name} upgraded ${U.fromSlot.toUpperCase()} → ${U.rolledSpell.toUpperCase()} (T${U.toTier}).`);
    } else {
      engine.push(`${hero.name} kept ${U.fromSlot.toUpperCase()}.`);
    }
    setUpgradeUI(null);
    setInitiative((I) => [...I]);
  };

  // Roll (single pass animation)
  const doRoll = async (heroIdx) => {
    const hero = engine.party[heroIdx];
    if (!hero) return;

    const faces = [
      { kind: "class", className: hero.classId || hero.class || "thief" },
      { kind: "spell", tier: 1, name: hero.loadout?.t1?.[0] || null, slot: "t1-0" },
      { kind: "spell", tier: 1, name: hero.loadout?.t1?.[1] || null, slot: "t1-1" },
      { kind: "spell", tier: 2, name: hero.loadout?.t2?.[0] || null, slot: "t2-0" },
      { kind: "upgrade" },
      { kind: "spell", tier: 1, name: hero.loadout?.t1?.[0] || null, slot: "t1-0" },
    ];
    const land = randInt(faces.length);

    const landedFace = await new Promise((resolve) => {
      setRollModal({
        faces,
        landingIndex: land,
        onDone: (finalFace) => resolve(finalFace),
      });
    });
    setRollModal(null);

    await resolveLanding(hero, landedFace);

    await engine.enemyTurn();
    setInitiative((I) => [...I]); // trigger re-render
  };

  const resolveLanding = async (hero, face) => {
    if (!face) return;

    if (face.kind === "class" || face.type === FACE_TYPES.CLASS) {
      const cid = hero.classId || hero.class || "thief";
      if (cid === "tank" || cid === "king") {
        hero.armor = (hero.armor || 0) + 1;
        pushLog(`${hero.name} gains +1 Armor from ${cid.toUpperCase()}.`);
      } else {
        pushLog(`${hero.name} activates ${cid.toUpperCase()} ability.`);
      }
      return;
    }

    if (face.kind === "upgrade" || face.type === FACE_TYPES.UPGRADE) {
      setChooseSlotUI({ heroIdx: engine.party.indexOf(hero), slots: ["t1-0", "t1-1", "t2-0"] });
      return;
    }

    const slot = face.slot || null;
    const [tierStr, posStr] = (slot || "t1-0").split("-");
    const pos = parseInt(posStr, 10) || 0;
    const spell = face.name ?? (tierStr === "t1" ? hero.loadout.t1[pos] : hero.loadout.t2[pos]);
    const tier = face.tier || (tierStr === "t1" ? 1 : 2);

    if (!spell) {
      pushLog(`${hero.name} rolled a blank.`);
      return;
    }

    const foe = engine._enemies.find((e) => e.hp > 0) || engine._enemies[0];

    if (spell === "armor") {
      hero.armor = (hero.armor || 0) + 1;
      pushLog(`${hero.name} gains +1 Armor.`);
      return;
    }
    if (spell === "heal") {
      const amt = tier === 1 ? 1 : tier === 2 ? 2 : 3;
      hero.hp = Math.min(hero.maxHp || 20, (hero.hp || 0) + amt);
      pushLog(`${hero.name} heals ${amt}.`);
      return;
    }
    if (spell === "poison" && foe) {
      foe.status = foe.status || {};
      foe.status.poison = foe.status.poison || [];
      foe.status.poison.push({ stacks: 1 });
      pushLog(`${hero.name} applies PSN to ${foe.name}.`);
      return;
    }
    if (spell === "bomb" && foe) {
      foe.status = foe.status || {};
      foe.status.bomb = foe.status.bomb || [];
      foe.status.bomb.push({ stacks: 1 });
      pushLog(`${hero.name} attaches BMB to ${foe.name}.`);
      return;
    }
    if (spell === "fireball" && foe) {
      const dmg = tier === 1 ? 2 : tier === 2 ? 3 : 4;
      foe.hp = Math.max(0, (foe.hp || 0) - dmg);
      pushLog(`${hero.name} casts Fireball for ${dmg} (ignores armor) on ${foe.name}.`);
      return;
    }

    if (foe && isPhysical(spell)) {
      const base = spell === "sweep" ? (tier === 1 ? 2 : tier === 2 ? 3 : 4) : (tier === 1 ? 2 : tier === 2 ? 3 : 4);
      const dealt = Math.max(0, base - (foe.armor || 0));
      foe.hp = Math.max(0, (foe.hp || 0) - dealt);
      pushLog(`${hero.name} hits ${foe.name} for ${dealt} (base ${base} − armor ${foe.armor || 0}).`);
      return;
    }

    pushLog(`${hero.name} uses ${spell}.`);
  };

  // ===== Render =====
  if (phase === "loadout") {
    return (
      <div style={{ minHeight: "100vh", background: "#0b1118", color: "#e8eef7" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: 16 }}>
          <h1>Party Loadout</h1>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div>Party size:</div>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className="btn"
                onClick={() => setPartySize(n)}
                style={{
                  background: partySize === n ? "#23406e" : "#172234",
                  border: "1px solid #2a3850",
                  color: "#dbe9ff",
                  marginRight: 6,
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
            {Array.from({ length: partySize }, (_, i) => i).map((i) => (
              <div key={i} style={{ background: "#0e151f", border: "1px solid #1f2a3b", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 8, color: "#fff" }}>
                  {`Player ${i + 1} — ${
                    proto[i].classId ? proto[i].classId[0].toUpperCase() + proto[i].classId.slice(1) : "Pick a class"
                  }`}
                </div>

                {/* Class grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {CLASS_DEF.map((c) => (
                    <Tile key={c.id} selected={proto[i].classId === c.id} onClick={() => onPickClass(i, c.id)} title={c.tip}>
                      <div style={{ display: "grid", gridTemplateRows: "auto 18px", placeItems: "center", gap: 6, width: "100%" }}>
                        <ClassIcon name={c.id} size={72} />
                        <div style={{ fontSize: 12, color: "#fff" }}>{c.label}</div>
                      </div>
                    </Tile>
                  ))}
                </div>

                {/* Deals */}
                {deals[i] && (
                  <div style={{ marginTop: 10, color: "#fff" }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Tier 1 — choose 2 (random 3 shown)</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {deals[i].t1.map((name) => {
                        const active = (proto[i].t1 || []).includes(name);
                        return (
                          <button
                            key={name}
                            onClick={() => togglePick(i, 1, name)}
                            style={{
                              position: "relative",
                              borderRadius: 10,
                              border: "1px solid #2a3140",
                              background: "rgba(255,255,255,.04)",
                              padding: 6,
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 10,
                                boxShadow: active ? "0 0 0 2px rgba(140,170,255,.95)" : "none",
                                pointerEvents: "none",
                              }}
                            />
                            <SpellIcon tier={1} name={name} size={84} />
                            <div style={{ fontSize: 12, marginTop: 4, textTransform: "capitalize", color: "#fff" }}>{name}</div>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ fontWeight: 700, margin: "10px 0 6px" }}>Tier 2 — choose 1 (random 2 shown)</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {deals[i].t2.map((name) => {
                        const active = (proto[i].t2 || [])[0] === name;
                        return (
                          <button
                            key={name}
                            onClick={() => togglePick(i, 2, name)}
                            style={{
                              position: "relative",
                              borderRadius: 10,
                              border: "1px solid #2a3140",
                              background: "rgba(255,255,255,.04)",
                              padding: 6,
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 10,
                                boxShadow: active ? "0 0 0 2px rgba(140,170,255,.95)" : "none",
                                pointerEvents: "none",
                              }}
                            />
                            <SpellIcon tier={2} name={name} size={84} />
                            <div style={{ fontSize: 12, marginTop: 4, textTransform: "capitalize", color: "#fff" }}>{name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={finalizeAndStart} style={{ background: "#26563a", border: "1px solid #2a6e44" }}>
              Finalize & Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======== COMBAT ========
  return (
    <div style={{ minHeight: "100vh", background: "#0b1118", color: "#e8eef7" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 16 }}>
        <h1>Dice Arena — Battle</h1>

        {initiative.length > 0 && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Initiative</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {initiative.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid #2a3140",
                  }}
                >
                  {r.name} <span style={{ opacity: 0.75 }}>({r.roll})</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <h3>Party</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {engine.party.map((h, idx) => (
            <div
              key={h.id}
              style={{
                position: "relative",
                background: "#0e151f",
                border: "1px solid #1f2a3b",
                borderRadius: 12,
                padding: 12,
                overflow: "hidden",
              }}
            >
              {hitFlash[h.id] && <div style={{ position: "absolute", inset: 0, background: "rgba(255,0,0,.35)", animation: "hitFlash .38s ease" }} />}
              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    width: 110,
                    height: 82,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid #2a3140",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ClassIcon name={h.classId || "thief"} size={100} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {h.name} <span style={{ opacity: 0.7 }}>(class: {h.classId})</span>
                  </div>
                  <div>
                    HP: <b>{h.hp}</b> / {h.maxHp}
                  </div>
                  <div>
                    Armor: <b>{h.armor || 0}</b>
                  </div>

                  {/* Status stacks (flat icons, number centered below; black font) */}
                  <div style={{ marginTop: 6 }}>
                    <StatusEffects
                      effects={{
                        poison: h.status?.poison?.length || 0,
                        bomb: h.status?.bomb?.length || 0,
                      }}
                      size={24}
                      labelColor="#000"
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div className="small" style={{ opacity: 0.8, marginBottom: 4 }}>
                  Loadout
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {(h.loadout?.t1 || [null, null]).map((sp, i) => (
                    <span key={`t1-${i}`} title={`T1 ${sp || "(blank)"}`}>
                      {sp ? <SpellIcon tier={1} name={sp} size={64} /> : <BlankSlot size={64} />}
                    </span>
                  ))}
                  <span title={`T2 ${h.loadout?.t2?.[0] || "(blank)"}`}>
                    {h.loadout?.t2?.[0] ? <SpellIcon tier={2} name={h.loadout.t2[0]} size={64} /> : <BlankSlot size={64} />}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => doRoll(idx)}>
                  Roll
                </button>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 16 }}>Enemies</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {engine._enemies.map((e, i) => (
            <div
              key={e.id || i}
              style={{
                background: "#12151a",
                border: "1px solid #242a34",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                gap: 12,
              }}
            >
              {/* Use 0-based index for the sheet */}
              <EnemyIcon tier={e.tier} index={(e.spriteId ?? i + 1) - 1} size={96} />
              <div>
                <div style={{ fontWeight: 700 }}>{e.name}</div>
                <div>
                  Tier: <b>{e.tier}</b>
                </div>
                <div>
                  HP: <b>{e.hp}</b>
                </div>
                <div>
                  Armor: <b>{e.armor || 0}</b>
                </div>

                {/* Status stacks (flat icons, number centered below; black font) */}
                <div style={{ marginTop: 6 }}>
                  <StatusEffects
                    effects={{
                      poison: e.status?.poison?.length || 0,
                      bomb: e.status?.bomb?.length || 0,
                    }}
                    size={24}
                    labelColor="#000"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 16 }}>Log</h3>
        <Card>
          {log.length === 0 ? (
            <div style={{ opacity: 0.6 }}>Nothing yet…</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {log.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      {rollModal && (
        <RollPopup
          faces={rollModal.faces}
          landingIndex={rollModal.landingIndex}
          onDone={(finalFace) => {
            // resolve promise pattern created in doRoll
            rollModal.onDone?.(finalFace);
          }}
        />
      )}
      {chooseSlotUI && (
        <ChooseSlotModal
          hero={engine.party[chooseSlotUI.heroIdx]}
          slots={chooseSlotUI.slots}
          onCancel={() => setChooseSlotUI(null)}
          onSelect={(slot) => onChooseUpgradeSlot(slot)}
        />
      )}
      {upgradeUI && (
        <UpgradeConfirmModal
          hero={engine.party[upgradeUI.heroIdx]}
          fromSlot={upgradeUI.fromSlot}
          rolledSpell={upgradeUI.rolledSpell}
          toTier={upgradeUI.toTier}
          onKeepOld={() => commitUpgrade(false)}
          onAccept={() => commitUpgrade(true)}
        />
      )}
    </div>
  );
}

// ------- Modals -------
function ChooseSlotModal({ hero, slots, onCancel, onSelect }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 105,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ minWidth: 360, background: "#0f141b", border: "1px solid #223", borderRadius: 12, padding: 16, color: "#e8ecf1" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Choose a slot to upgrade</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 10, marginBottom: 12 }}>
          {slots.map((slotStr) => {
            const [tierStr, posStr] = slotStr.split("-");
            const pos = parseInt(posStr, 10) || 0;
            const tier = tierStr === "t1" ? 1 : 2;
            const spell = tier === 1 ? hero?.loadout?.t1?.[pos] || null : hero?.loadout?.t2?.[pos] || null;
            return (
              <button
                key={slotStr}
                onClick={() => onSelect?.(slotStr)}
                style={{ padding: 8, borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid #2a3140" }}
              >
                <div style={{ display: "grid", placeItems: "center", marginBottom: 6 }}>
                  {spell ? <SpellIcon tier={tier} name={spell} size={72} /> : <BlankSlot size={72} />}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, textAlign: "center" }}>{slotStr.toUpperCase()}</div>
              </button>
            );
          })}
        </div>
        <div style={{ textAlign: "right" }}>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function UpgradeConfirmModal({ hero, fromSlot, rolledSpell, toTier, onKeepOld, onAccept }) {
  const [tierStr, posStr] = (fromSlot || "t1-0").split("-");
  const pos = parseInt(posStr, 10) || 0;
  const oldTier = tierStr === "t1" ? 1 : 2;
  const oldSpell = oldTier === 1 ? hero?.loadout?.t1?.[pos] || null : hero?.loadout?.t2?.[pos] || null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 105,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ minWidth: 380, background: "#0f141b", border: "1px solid #223", borderRadius: 12, padding: 16, color: "#e8ecf1" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Upgrade</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "10px 0" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>OLD</div>
            {oldSpell ? <SpellIcon tier={oldTier} name={oldSpell} size={84} /> : <BlankSlot size={84} />}
          </div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>→</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>NEW (T{toTier})</div>
            {rolledSpell ? <SpellIcon tier={toTier} name={rolledSpell} size={84} /> : <BlankSlot size={84} />}
          </div>
        </div>
        <div style={{ marginTop: 6, textAlign: "center" }}>
          Upgrading <b>{fromSlot?.toUpperCase()}</b> → <b>{(rolledSpell || "(blank)").toUpperCase()}</b>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn secondary" onClick={onKeepOld}>
            Keep Old
          </button>
          <button className="btn" onClick={onAccept}>
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

// Keyframes for hit flash (enemy striking heroes)
const styleElId = "da-hitflash-keyframes";
if (!document.getElementById(styleElId)) {
  const el = document.createElement("style");
  el.id = styleElId;
  el.textContent = `@keyframes hitFlash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}`;
  document.head.appendChild(el);
}
