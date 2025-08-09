import React from 'react'
import SpriteArt from '../SpriteArt.jsx'

export default function LootModal({open, accessory, onTake, onSkip, art, grid}){
  if(!open) return null
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Loot: Accessory (d20)</h2>
        <div style={{display:'flex', gap:16, alignItems:'center'}}>
          <SpriteArt img={art} cols={grid.cols} rows={grid.rows} index={accessory?.id||1} width={120} height={180}/>
          <div>
            <div style={{fontWeight:700, fontSize:18}}>{accessory?.id}. {accessory?.name}</div>
            <div style={{maxWidth:420, opacity:.85}}>{accessory?.text}</div>
          </div>
        </div>
        <div style={{marginTop:16, display:'flex', gap:8}}>
          <button className="btn" onClick={onTake}>Take</button>
          <button className="btn secondary" onClick={onSkip}>Skip</button>
        </div>
      </div>
    </div>
  )
}
const overlayStyle = { position:'fixed', inset:0, backdropFilter:'blur(4px)', background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }
const modalStyle = { background:'#12151a', border:'1px solid #242a34', borderRadius:12, padding:16, width:720 }
