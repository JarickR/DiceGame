// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import GameEngine, {
  rollD20,
  FACE_TYPES,
  isPhysical,
} from "./engine";

// Icons / thumbs
import ClassIcon from "./ui/ClassIcon";
import SpellIcon from "./ui/SpellIcon";
import EnemyIcon from "./ui/EnemyIcon";
import UpgradeIcon from "./ui/UpgradeIcon";

// ---------- Small helpers ----------
const Tile = ({ selected=false, onClick, children, title }) => (
  <button
    title={title}
    onClick={onClick}
    className="tile"
    style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:92, height:74, borderRadius:12,
      background:"#1a2431", border:"1px solid #2a3647",
      padding:0, margin:0, cursor:"pointer", position:"relative",
      outline:selected ? "2px solid #3b82f6" : "2px solid transparent",
      outlineOffset:0,
    }}
  >
    {children}
  </button>
);

const Pill = ({ color="#374151", children }) => (
  <span style={{
    background: color, color:"#fff", borderRadius:999, padding:"2px 8px",
    fontSize:12, fontWeight:600
  }}>{children}</span>
);

// Roll modal
const RollModal = ({ open, face, onClose, children }) => {
  if (!open) return null;
  // we don’t block clicks; it will auto-close by caller
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.45)",
      display:"grid", placeItems:"center", zIndex:90
    }}>
      <div style={{
        minWidth:280, maxWidth:520, padding:14, borderRadius:12,
        background:"#0f141b", border:"1px solid #273243",
        color:"#e8eef7", boxShadow:"0 20px 60px rgba(0,0,0,.45)"
      }}>
        {children}
      </div>
    </div>
  );
};

// ---------- App ----------
export default function App(){
  const [engine] = useState(() => new GameEngine());
  const [phase, setPhase] = useState("loadout"); // 'loadout' | 'battle'
  const [players, setPlayers] = useState(() =>
    Array.from({length:4}, (_,i)=>({ id:i+1, class:null, t1:[], t2:[], armor:0 }))
  );
  const [partySize, setPartySize] = useState(2);

  const [enemies, setEnemies] = useState([]); // {id,tier,index,hp,armor}
  const [log, setLog] = useState([]);

  // Roll preview modal
  const [rollVis, setRollVis] = useState(false);
  const [rollFace, setRollFace] = useState(null);
  const rollAnimRef = useRef(null);

  // ------------ EFFECT: init basic enemies (demo) ------------
  useEffect(() => {
    // Seed a few Tier 1 enemies so thumbs show up
    if (enemies.length === 0) {
      setEnemies([
        { id:1, tier:1, index:0, name:"Goblin", hp:10, armor:0 },
        { id:2, tier:1, index:5, name:"Gremlin", hp:10, armor:0 },
      ]);
    }
  }, [enemies.length]);

  // ------------ Selection helpers ------------
  const classList = ["thief","judge","tank","vampire","king","lich","paladin","barbarian"];

  const t1Pool = ["attack","heal","armor","sweep","fireball"];
  const t2Pool = ["attack","heal","armor","concentration","sweep","fireball","poison","bomb"];
  const t3Pool = ["attack","sweep","fireball"]; // your sheet uses first 3

  // ------------ Logging ------------
  const pushLog = (line) => setLog((prev)=>[line, ...prev].slice(0,200));

  // ------------ ROLL ANIMATION (one face at a time) ------------
  const spinFaces = (faces, landIndex, duration=850) => {
    setRollVis(true);
    let i = 0;
    const start = performance.now();
    const step = (now) => {
      const t = now - start;
      const speed = Math.max(45, 180 - (t*0.15)); // slow slightly
      if (t >= duration) {
        setRollFace(faces[landIndex]);
        // hold result a bit longer then close
        rollAnimRef.current = setTimeout(()=> setRollVis(false), 600);
        return;
      }
      setRollFace(faces[i % faces.length]);
      i++;
      rollAnimRef.current = setTimeout(()=> requestAnimationFrame(step), speed);
    };
    requestAnimationFrame(step);
  };

  // cleanup timers
  useEffect(() => () => clearTimeout(rollAnimRef.current), []);

  // ------------ ACTIONS ------------
  const startBattle = () => {
    // Trim party by partySize & validate loadouts
    const party = players.slice(0, partySize).map((p,i)=>({
      ...p,
      id: i+1,
      t1: (p.t1||[]).slice(0,2),
      t2: (p.t2||[]).slice(0,1),
      armor: p.armor || 0,
      poison: 0,
      bombs: 0,
      hp: 20,
      maxHp: 20,
      class: p.class || "thief",
    }));
    setPlayers(party);
    setPhase("battle");

    pushLog(`Party ready (${party.length}): ` + party.map(p=>p.class).join(", "));
    pushLog(`Enemies: ` + enemies.map(e=>e.name||`T${e.tier}#${e.index+1}`).join(", "));
  };

  const doRoll = (heroIndex=0) => {
    const h = players[heroIndex];
    if (!h) return;
    // 1/6 class, 4/6 spells (we’ll cycle between the hero’s slots),
    // 1/6 upgrade
    const faces = [
      { kind:"class" },
      { kind:"spell", slot:0 },
      { kind:"spell", slot:1 },
      { kind:"spell", slot:2 }, // safe (may be blank)
      { kind:"spell", slot:3 }, // safe (may be blank)
      { kind:"upgrade" },
    ];
    const landIndex = Math.floor(Math.random()*faces.length);
    spinFaces(faces, landIndex);

    // Apply after the modal ends
    setTimeout(() => {
      const face = faces[landIndex];
      setRollVis(false);
      setRollFace(face);

      // Gold border highlight could be done via CSS on the card; here we just log + handle effect:
      if (face.kind === "class") {
        pushLog(`${h.class} ability triggers this turn.`);
        engine.triggerClass(h, players, enemies, setPlayers, setEnemies, pushLog);
      } else if (face.kind === "upgrade") {
        pushLog(`Upgrade: choose a slot to upgrade.`);
        engine.beginUpgrade(h, setPlayers, pushLog);
      } else if (face.kind === "spell") {
        const spell = engine.getSpellAtSlot(h, face.slot);
        if (!spell) { pushLog(`Blank spell—nothing happens.`); return; }
        pushLog(`${h.class} casts ${spell.name} (T${spell.tier}).`);
        engine.resolveSpell(h, spell, players, enemies, setPlayers, setEnemies, pushLog);
      }
    }, 950);
  };

  // ------------ RENDERERS ------------
  const renderClassRow = (pIdx) => {
    const p = players[pIdx];
    return (
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        {classList.map((c) => (
          <Tile
            key={c}
            title={c}
            selected={p.class===c}
            onClick={()=>{
              const next = [...players];
              next[pIdx] = { ...next[pIdx], class:c };
              setPlayers(next);
            }}
          >
            <ClassIcon name={c} size={64} />
          </Tile>
        ))}
      </div>
    );
  };

  const renderSpellPickers = (pIdx) => {
    const p = players[pIdx];
    const toggle = (tier, name) => {
      const cap = tier===1 ? 2 : 1;
      const key = tier===1 ? "t1" : "t2";
      const arr = new Set(p[key] || []);
      if (arr.has(name)) arr.delete(name);
      else if (arr.size < cap) arr.add(name);
      const next = [...players];
      next[pIdx] = { ...p, [key] : Array.from(arr) };
      setPlayers(next);
    };

    // simple tiles with SpellIcon (the sheet mapping is in SpellIcon)
    const group = (label, pool, tier, limit) => (
      <div style={{ marginTop:12 }}>
        <div style={{ marginBottom:6, color:"#fff" }}>
          <b>{`Tier ${tier} — choose ${limit}`}</b>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {pool.map(name=>(
            <button key={name}
              className="tile"
              onClick={()=> toggle(tier,name)}
              style={{
                width:190, height:120, borderRadius:14,
                background: tier===1 ? "#0f3c28" : "#0e3456",
                border: (p[tier===1?"t1":"t2"]||[]).includes(name)
                  ? "2px solid #3b82f6" : "1px solid #243142",
                display:"flex", gap:10, alignItems:"center", padding:"8px 10px",
                color:"#eaf2ff"
              }}
            >
              <SpellIcon tier={tier} name={name} size={86} />
              <div>
                <div style={{ fontWeight:700 }}>{name[0].toUpperCase()+name.slice(1)}</div>
                <div className="small" style={{ opacity:.8 }}>Tier {tier}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <>
        {group("Tier 1", t1Pool, 1, 2)}
        {group("Tier 2", t2Pool, 2, 1)}
      </>
    );
  };

  const renderEnemyCard = (e) => (
    <div key={e.id} style={{
      background:"#111923", border:"1px solid #223044",
      borderRadius:12, padding:10, display:"flex", gap:12, alignItems:"center"
    }}>
      <EnemyIcon tier={e.tier} index={e.index} size={84} />
      <div style={{ color:"#d9e7ff", fontSize:14 }}>
        <div style={{ fontWeight:700 }}>{e.name || `T${e.tier} #${e.index+1}`}</div>
        <div>HP: <b>{e.hp}</b> &nbsp; Armor: <b>{e.armor||0}</b></div>
        <div style={{ marginTop:6 }}>
          <button className="btn"
            onClick={()=>{
              // Enemy swings at player 1 as demo
              const target = players[0];
              if (!target) return;
              const dmg = 2 + (e.tier-1); // little scaling
              engine.enemyAttack(e, target, dmg, setPlayers, pushLog);
            }}
          >Attack</button>
        </div>
      </div>
    </div>
  );

  // ------------ UI ------------
  if (phase === "loadout") {
    return (
      <div style={{ minHeight:"100vh", background:"#0b1118", color:"#e8eef7" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:16 }}>
          <h1 style={{ margin:"8px 0 12px" }}>Select Class</h1>

          <div style={{ marginBottom:14 }}>
            <span style={{ marginRight:8 }}>Party size:</span>
            {[1,2,3,4,5,6,7,8].map(n=>(
              <button key={n}
                onClick={()=> setPartySize(n)}
                className="btn"
                style={{
                  marginRight:6,
                  background: partySize===n ? "#23406e" : "#172234",
                  border:"1px solid #2a3850", color:"#dbe9ff"
                }}
              >{n}</button>
            ))}
          </div>

          {players.slice(0, partySize).map((p, i) => (
            <div key={p.id} style={{
              background:"#0e151f", border:"1px solid #1f2a3b", borderRadius:12,
              padding:12, marginBottom:12
            }}>
              <div style={{ fontWeight:800, marginBottom:8, color:"#fff" }}>
                {`Player ${i+1} — ${p.class ? (p.class[0].toUpperCase()+p.class.slice(1)) : "Pick a class"}`}
              </div>
              {renderClassRow(i)}
              {renderSpellPickers(i)}
            </div>
          ))}

          <div style={{ display:"flex", gap:10 }}>
            <button className="btn" onClick={startBattle}
              style={{ background:"#26563a", border:"1px solid #2a6e44" }}
            >Finalize & Start</button>
          </div>
        </div>
      </div>
    );
  }

  // battle
  return (
    <div style={{ minHeight:"100vh", background:"#0b1118", color:"#e8eef7" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:16 }}>
        <h1>Dice Arena — Battle</h1>

        {/* Party */}
        <h3 style={{ margin:"12px 0 6px" }}>Party</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
          {players.map((p, idx)=>(
            <div key={p.id} style={{
              background:"#0e151f", border:"1px solid #1f2a3b", borderRadius:12, padding:12
            }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <Tile selected>
                  <ClassIcon name={p.class||"thief"} size={64} />
                </Tile>
                <div>
                  <div style={{ fontWeight:800 }}>{p.class}</div>
                  <div>HP <b>{p.hp}</b> / {p.maxHp} &nbsp; Armor <b>{p.armor||0}</b> &nbsp;
                    <Pill color="#6d28d9">PSN {p.poison||0}</Pill> &nbsp;
                    <Pill color="#c2410c">BMB {p.bombs||0}</Pill>
                  </div>
                </div>
              </div>

              {/* Spells */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, marginTop:10 }}>
                {[...(p.t1||[]).map(n=>({tier:1,name:n})), ...(p.t2||[]).map(n=>({tier:2,name:n}))].map((s,i)=>(
                  <div key={i} style={{
                    background: s.tier===1 ? "#0f3c28" : "#0e3456",
                    border:"1px solid #223044", borderRadius:10, padding:8, display:"flex", gap:10, alignItems:"center"
                  }}>
                    <SpellIcon tier={s.tier} name={s.name} size={60} />
                    <div>
                      <div style={{ fontWeight:700 }}>{s.name}</div>
                      <div className="small" style={{ opacity:.8 }}>Tier {s.tier}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:8 }}>
                <button className="btn" onClick={()=> doRoll(idx)}>Roll</button>
              </div>
            </div>
          ))}
        </div>

        {/* Enemies */}
        <h3 style={{ margin:"16px 0 6px" }}>Enemies</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
          {enemies.map(renderEnemyCard)}
        </div>

        {/* Log */}
        <h3 style={{ margin:"16px 0 6px" }}>Log</h3>
        <div style={{ background:"#0e151f", border:"1px solid #1f2a3b", borderRadius:12, padding:10, minHeight:120 }}>
          <div style={{ display:"grid", gap:6 }}>
            {log.map((l,i)=><div key={i}>{l}</div>)}
          </div>
        </div>
      </div>

      {/* Roll preview modal (small) */}
      <RollModal open={rollVis} face={rollFace}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {rollFace?.kind === "class"   && <ClassIcon name={players[0]?.class||"thief"} size={56}/>}
          {rollFace?.kind === "upgrade" && <UpgradeIcon size={56} />}
          {rollFace?.kind === "spell"   && (
            <SpellIcon
              tier={ (()=> {
                const s = engine.getSpellAtSlot(players[0], rollFace.slot);
                return s?.tier || 1;
              })() }
              name={ (()=> {
                const s = engine.getSpellAtSlot(players[0], rollFace.slot);
                return s?.name || "blank";
              })() }
              size={56}
            />
          )}
          <div style={{ fontWeight:800 }}>
            {rollFace?.kind === "class" && "Class ability"}
            {rollFace?.kind === "upgrade" && "Upgrade"}
            {rollFace?.kind === "spell" && "Spell"}
          </div>
        </div>
      </RollModal>
    </div>
  );
}
