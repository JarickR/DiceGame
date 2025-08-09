import React from 'react'

export default function ArtControls({art}){
  const iStyle = { width:64, background:'#0f141b', border:'1px solid #28384a', color:'#e7edf5', borderRadius:6, padding:'4px 6px' }
  const row = (label, grid, setGrid) => (
    <div className="row" style={{marginTop:8}}>
      <div style={{width:120}}><b>{label}</b></div>
      <div className="bar">
        <label className="small muted">Cols</label>
        <input type="number" min="1" max="20" value={grid.cols} onChange={e=>setGrid({...grid, cols:parseInt(e.target.value||'1')})} style={iStyle} />
        <label className="small muted">Rows</label>
        <input type="number" min="1" max="20" value={grid.rows} onChange={e=>setGrid({...grid, rows:parseInt(e.target.value||'1')})} style={iStyle} />
        <span className="pill">{grid.cols}×{grid.rows}</span>
      </div>
    </div>
  )
  return (
    <div className="card">
      <h2>Art & Layout</h2>
      <div className="small muted">Adjust sprite sheet slicing (columns × rows). Saved automatically to your browser.</div>
      {row('Tier 1', art.tier1Grid, art.setTier1Grid)}
      {row('Tier 2', art.tier2Grid, art.setTier2Grid)}
      {row('Boss', art.bossGrid, art.setBossGrid)}
      {row('Accessories', art.accGrid, art.setAccGrid)}
      <div className="bar" style={{marginTop:10}}>
        <button className="btn secondary" onClick={art.resetDefaults}>Reset Defaults</button>
      </div>
    </div>
  )
}
