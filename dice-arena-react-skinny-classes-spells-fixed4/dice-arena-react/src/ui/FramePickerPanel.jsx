import React, { useState } from 'react'
import SpriteArt from '../SpriteArt.jsx'

function Row({tier, id, value, onChange, img, grid}){
  const v = value || id
  return (
    <div className="row" style={{gap:12, marginTop:8}}>
      <div style={{width:60}} className="small muted">Enemy {id}</div>
      <SpriteArt img={img} cols={grid.cols} rows={grid.rows} index={v} width={48} height={72} border={true} />
      <input type="number" min="1" value={v} onChange={e=>onChange(tier, id, parseInt(e.target.value||'1'))}
             style={{ width:72, background:'#0f141b', border:'1px solid #28384a', color:'#e7edf5', borderRadius:6, padding:'4px 6px' }}/>
      <div className="small muted">frame</div>
    </div>
  )
}

export default function FramePickerPanel({art, frames}){
  const [tab, setTab] = useState(1)
  const rows = Array.from({length:20}, (_,i)=>i+1)
  const barBtn = (n,label)=> (
    <button className={"btn " + (tab===n? '': 'secondary')} onClick={()=>setTab(n)}>{label}</button>
  )
  const sheet = tab===1? art.tier1Img : tab===2? art.tier2Img : art.bossImg
  const grid  = tab===1? art.tier1Grid: tab===2? art.tier2Grid: art.bossGrid
  const values = tab===1? frames.t1 : tab===2? frames.t2 : frames.boss

  return (
    <div className="card">
      <h2>Frame Picker</h2>
      <div className="small muted">Map each enemy ID to a specific frame on the sheet. Saved automatically.</div>
      <div className="bar" style={{marginTop:8}}>
        {barBtn(1,'Tier 1')}{barBtn(2,'Tier 2')}{barBtn(3,'Boss')}
        <button className="btn secondary" onClick={frames.reset}>Reset Mapping</button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8}}>
        {rows.map(id => (
          <Row key={id} tier={tab} id={id} value={values[id]} onChange={frames.setFrame} img={sheet} grid={grid} />
        ))}
      </div>
    </div>
  )
}
