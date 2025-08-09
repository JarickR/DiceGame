import React from 'react'
export default function LevelChoiceModal({open, party, onChoose}){
  if(!open) return null
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Tier 1 Victory — Upgrade Choice</h2>
        <p className="muted small">Each player chooses one: <b>Level Up & Reset Spells</b> (+1 spells, +1 attacks) or <b>Keep Current Upgrades</b> (no reset).</p>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
          {party.map((p)=> (
            <div key={p.id} className="card">
              <div style={{fontWeight:700}}>{p.name}</div>
              <div className="small muted">Bonuses: +{p.bonusSpells||0} spells, +{p.bonusAttack||0} attack</div>
              <div className="bar" style={{marginTop:8}}>
                <button className="btn" onClick={()=>onChoose(p.id, 'level')}>Level Up & Reset</button>
                <button className="btn secondary" onClick={()=>onChoose(p.id, 'keep')}>Keep Upgrades</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
const overlayStyle = { position:'fixed', inset:0, backdropFilter:'blur(4px)', background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }
const modalStyle = { background:'#12151a', border:'1px solid #242a34', borderRadius:12, padding:16, width:900 }
